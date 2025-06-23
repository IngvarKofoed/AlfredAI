import { HtmlTransformer, transformHtmlContent } from '../../../src/tools/browser/html-transformer';

// Mock the GeminiCompletionProvider
jest.mock('../../../src/completion/completion-providers/gemini-completion-provider', () => {
  return {
    GeminiCompletionProvider: jest.fn().mockImplementation(() => ({
      generateText: jest.fn().mockResolvedValue('## Main Content\n\nThis is transformed content.\n\n## Relevant Links\n\n- [Example Link](https://example.com)')
    }))
  };
});

// Mock environment variables
const originalEnv = process.env;

describe('HtmlTransformer', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.GOOGLE_AI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should create instance with valid API key', () => {
      expect(() => new HtmlTransformer()).not.toThrow();
    });

    it('should throw error when API key is missing', () => {
      delete process.env.GOOGLE_AI_API_KEY;
      expect(() => new HtmlTransformer()).toThrow('GOOGLE_AI_API_KEY environment variable is required');
    });
  });

  describe('transformHtml', () => {
    let transformer: HtmlTransformer;

    beforeEach(() => {
      transformer = new HtmlTransformer();
    });

    it('should transform HTML content successfully', async () => {
      const htmlInput = '<html><body><h1>Test Page</h1><p>Content here</p><a href="https://example.com">Link</a></body></html>';
      const result = await transformer.transformHtml(htmlInput);
      
      expect(result).toContain('## Main Content');
      expect(result).toContain('## Relevant Links');
      expect(result).toContain('transformed content');
    });

    it('should handle empty HTML gracefully', async () => {
      const result = await transformer.transformHtml('');
      expect(result).toContain('## Main Content');
    });

    it('should handle very large HTML content', async () => {
      const largeHtml = '<html><body>' + '<p>Content</p>'.repeat(1000) + '</body></html>';
      const result = await transformer.transformHtml(largeHtml);
      expect(result).toContain('## Main Content');
    });
  });

  describe('fallback content creation', () => {
    let transformer: HtmlTransformer;

    beforeEach(() => {
      transformer = new HtmlTransformer();
      // Mock the generateText method to throw an error to trigger fallback
      (transformer as any).geminiProvider.generateText = jest.fn().mockRejectedValue(new Error('API Error'));
    });

    it('should create fallback content when Gemini fails', async () => {
      const htmlInput = '<html><body><h1>Test</h1><p>Content</p><a href="https://example.com">Link</a></body></html>';
      const result = await transformer.transformHtml(htmlInput);
      
      expect(result).toContain('## Page Content');
      expect(result).toContain('## Relevant Links');
      expect(result).toContain('https://example.com');
    });

    it('should handle HTML with no links in fallback', async () => {
      const htmlInput = '<html><body><h1>Test</h1><p>Content without links</p></body></html>';
      const result = await transformer.transformHtml(htmlInput);
      
      expect(result).toContain('## Page Content');
      expect(result).toContain('## Relevant Links');
    });

    it('should filter out javascript and anchor links in fallback', async () => {
      const htmlInput = `
        <html><body>
          <a href="https://example.com">Good Link</a>
          <a href="javascript:void(0)">JS Link</a>
          <a href="#section">Anchor Link</a>
        </body></html>
      `;
      const result = await transformer.transformHtml(htmlInput);
      
      expect(result).toContain('https://example.com');
      expect(result).not.toContain('javascript:void(0)');
      expect(result).not.toContain('#section');
    });
  });
});

describe('transformHtmlContent', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.GOOGLE_AI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should transform HTML using convenience function', async () => {
    const htmlInput = '<html><body><h1>Test</h1></body></html>';
    const result = await transformHtmlContent(htmlInput);
    
    expect(result).toContain('## Main Content');
    expect(result).toContain('## Relevant Links');
  });

  it('should reuse the same transformer instance', async () => {
    const htmlInput = '<html><body><h1>Test</h1></body></html>';
    
    // Call twice to ensure singleton pattern works
    const result1 = await transformHtmlContent(htmlInput);
    const result2 = await transformHtmlContent(htmlInput);
    
    expect(result1).toBe(result2);
  });
}); 