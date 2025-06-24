import { GeminiCompletionProvider } from '../../completion/completion-providers/gemini-completion-provider';
import { Message } from '../../types';
import { logger } from '../../utils/logger';

/**
 * Transforms HTML content into structured, readable content with sections and links
 * using the Gemini completion provider
 */
export class HtmlTransformer {
  private geminiProvider: GeminiCompletionProvider;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is required for HTML transformation');
    }

    this.geminiProvider = new GeminiCompletionProvider(
      apiKey,
      'gemini-2.5-flash-lite-preview-06-17',
      1000000, // Higher token limit for HTML processing
      0.3   // Lower temperature for more consistent output
    );
  }

  /**
   * Transforms HTML content into structured content with sections and links
   * @param htmlResponse - The raw HTML content to transform
   * @returns Promise that resolves to structured content
   */
  async transformHtml(htmlResponse: string): Promise<string> {
    try {
      const systemPrompt = `You are an expert HTML content analyzer and transformer. Your task is to:

1. Extract the main content from HTML, removing navigation, ads, and other non-essential elements
2. Organize the content into clear sections with descriptive headings
3. Preserve all relevant links and their context, but without any duplicate links
4. Maintain the logical flow and structure of the original content
5. Format the output in a clean, readable markdown-style format

Guidelines:
- Focus on the primary content that users would want to read
- Create meaningful section headings based on the content structure
- Include all relevant links with descriptive text, but without any duplicate links
- Remove repetitive navigation elements, ads, and boilerplate content
- Preserve important formatting like lists, emphasis, and structure
- If the content is very long, provide a summary of key sections
- End with a comprehensive list of all relevant links found on the page

Output format:
- Use clear section headings (## Heading)
- Include relevant links inline with descriptive text
- End with a "## Relevant Links" section containing all links
- Keep the content concise but comprehensive`;

      const conversation: Message[] = [
        {
          role: 'user',
          content: `Please transform this HTML content into structured, readable content with sections and links:\n\n${htmlResponse}`
        }
      ];

      const transformedContent = await this.geminiProvider.generateText(systemPrompt, conversation, { logModelResponse: false });
      
      return transformedContent;

    } catch (error) {
      logger.error('Error transforming HTML content:', error);
      // Fallback: return a simplified version of the HTML
      return this.createFallbackContent(htmlResponse);
    }
  }

  /**
   * Creates a fallback content when Gemini transformation fails
   * @param htmlResponse - The raw HTML content
   * @returns Simplified content with basic structure
   */
  private createFallbackContent(htmlResponse: string): string {
    try {
      // Basic HTML cleaning without external dependencies
      let cleanedContent = htmlResponse
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Remove style tags
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')       // Remove navigation
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '') // Remove header
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '') // Remove footer
        .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')   // Remove aside
        .replace(/<[^>]+>/g, ' ')                          // Remove remaining HTML tags
        .replace(/\s+/g, ' ')                              // Normalize whitespace
        .trim();

      // Extract links
      const linkRegex = /href=["']([^"']+)["'][^>]*>([^<]+)</gi;
      const links: Array<{ url: string; text: string }> = [];
      let match;

      while ((match = linkRegex.exec(htmlResponse)) !== null) {
        const url = match[1];
        const text = match[2].trim();
        if (url && text && !url.startsWith('#') && !url.startsWith('javascript:')) {
          links.push({ url, text });
        }
      }

      let result = `## Page Content\n\n${cleanedContent.substring(0, 2000)}...\n\n`;
      
      result += `## Relevant Links\n\n`;
      if (links.length > 0) {
        links.forEach(link => {
          result += `- [${link.text}](${link.url})\n`;
        });
      } else {
        result += `No relevant links found on this page.\n`;
      }

      return result;

    } catch (error) {
      logger.error('Error creating fallback content:', error);
      return `## Page Content\n\nUnable to process HTML content. Raw HTML length: ${htmlResponse.length} characters.\n\n## Relevant Links\n\nNo links could be extracted.`;
    }
  }
}

/**
 * Global instance of the HTML transformer
 */
let htmlTransformerInstance: HtmlTransformer | null = null;

/**
 * Gets or creates the global HTML transformer instance
 * @returns HtmlTransformer instance
 */
export function getHtmlTransformer(): HtmlTransformer {
  if (!htmlTransformerInstance) {
    htmlTransformerInstance = new HtmlTransformer();
  }
  return htmlTransformerInstance;
}

/**
 * Convenience function to transform HTML content
 * @param htmlResponse - The raw HTML content to transform
 * @returns Promise that resolves to structured content
 */
export async function transformHtmlContent(htmlResponse: string): Promise<string> {
  const transformer = getHtmlTransformer();
  logger.debug('Transforming HTML content...');
  const transformedContent = await transformer.transformHtml(htmlResponse);
  logger.debug('HTML transformation completed successfully');
  return transformedContent;
} 