import { stripHtml } from '../../../src/tools/browser/strip-html';

describe('stripHtml', () => {
  it('should remove script and style elements', () => {
    const html = `
      <html>
        <body>
          <h1>Main Content</h1>
          <script>console.log('test');</script>
          <style>.test { color: red; }</style>
          <p>Important text here</p>
        </body>
      </html>
    `;
    
    const result = stripHtml(html);
    
    expect(result).toContain('Main Content');
    expect(result).toContain('Important text here');
    expect(result).not.toContain('console.log');
    expect(result).not.toContain('color: red');
  });

  it('should remove navigation and structural elements', () => {
    const html = `
      <html>
        <body>
          <nav>Navigation menu</nav>
          <header>Header content</header>
          <main>
            <h1>Main Content</h1>
            <p>Important text here</p>
          </main>
          <aside>Sidebar content</aside>
          <footer>Footer content</footer>
        </body>
      </html>
    `;
    
    const result = stripHtml(html);
    
    expect(result).toContain('Main Content');
    expect(result).toContain('Important text here');
    expect(result).not.toContain('Navigation menu');
    expect(result).not.toContain('Header content');
    expect(result).not.toContain('Sidebar content');
    expect(result).not.toContain('Footer content');
  });

  it('should remove form elements', () => {
    const html = `
      <html>
        <body>
          <h1>Main Content</h1>
          <form>
            <input type="text" placeholder="Search">
            <button>Submit</button>
            <select><option>Option 1</option></select>
            <textarea>Comments</textarea>
          </form>
          <p>Important text here</p>
        </body>
      </html>
    `;
    
    const result = stripHtml(html);
    
    expect(result).toContain('Main Content');
    expect(result).toContain('Important text here');
    expect(result).not.toContain('Search');
    expect(result).not.toContain('Submit');
    expect(result).not.toContain('Option 1');
    expect(result).not.toContain('Comments');
  });

  it('should remove ad-related elements', () => {
    const html = `
      <html>
        <body>
          <h1>Main Content</h1>
          <div class="advertisement">Ad content</div>
          <div class="banner">Banner content</div>
          <div class="popup">Popup content</div>
          <div id="ad-container">Ad container</div>
          <p>Important text here</p>
        </body>
      </html>
    `;
    
    const result = stripHtml(html);
    
    expect(result).toContain('Main Content');
    expect(result).toContain('Important text here');
    expect(result).not.toContain('Ad content');
    expect(result).not.toContain('Banner content');
    expect(result).not.toContain('Popup content');
    expect(result).not.toContain('Ad container');
  });

  it('should clean up whitespace', () => {
    const html = `
      <html>
        <body>
          <h1>Main Content</h1>
          
          
          <p>Important text here</p>
          
          <p>More text</p>
        </body>
      </html>
    `;
    
    const result = stripHtml(html);
    
    // Should not have excessive whitespace
    expect(result).not.toMatch(/\n\s*\n/);
    expect(result).not.toMatch(/\s{2,}/);
    expect(result).toContain('Main Content');
    expect(result).toContain('Important text here');
    expect(result).toContain('More text');
  });

  it('should limit content length', () => {
    // Create a very long HTML document
    const longContent = 'Long content '.repeat(1000);
    const html = `
      <html>
        <body>
          <h1>Main Content</h1>
          <p>${longContent}</p>
        </body>
      </html>
    `;
    
    const result = stripHtml(html);
    
    expect(result.length).toBeLessThanOrEqual(10003); // 10000 + '...'
    expect(result).toContain('Main Content');
    expect(result).toContain('...');
  });

  it('should preserve essential text content', () => {
    const html = `
      <html>
        <body>
          <h1>Article Title</h1>
          <h2>Section Heading</h2>
          <p>This is the main content of the article. It contains important information that should be preserved.</p>
          <ul>
            <li>First bullet point</li>
            <li>Second bullet point</li>
          </ul>
          <blockquote>Important quote here</blockquote>
          <p>More content with <strong>bold text</strong> and <em>italic text</em>.</p>
        </body>
      </html>
    `;
    
    const result = stripHtml(html);
    
    expect(result).toContain('Article Title');
    expect(result).toContain('Section Heading');
    expect(result).toContain('This is the main content of the article');
    expect(result).toContain('First bullet point');
    expect(result).toContain('Second bullet point');
    expect(result).toContain('Important quote here');
    expect(result).toContain('More content with bold text and italic text');
  });

  it('should handle empty HTML', () => {
    const result = stripHtml('');
    expect(result).toBe('');
  });

  it('should handle HTML with only structural elements', () => {
    const html = `
      <html>
        <body>
          <nav>Navigation</nav>
          <header>Header</header>
          <footer>Footer</footer>
        </body>
      </html>
    `;
    
    const result = stripHtml(html);
    
    expect(result).toBe('');
  });

  it('should handle malformed HTML gracefully', () => {
    const malformedHtml = '<html><body><h1>Title<p>Content</p></body>';
    const result = stripHtml(malformedHtml);
    
    expect(result).toContain('Title');
    expect(result).toContain('Content');
  });
}); 