import { ProviderFactory } from '../../completion/provider-factory';
import { CompletionProvider } from '../../completion/completion-provider';
import { Message } from '../../types';
import { logger } from '../../utils/logger';

/**
 * Transforms HTML content into structured, readable content with sections and links
 * using a light completion provider
 */
export class HtmlTransformer {
  private lightProvider: CompletionProvider;

  constructor() {
    try {
      this.lightProvider = ProviderFactory.createLightProvider();
    } catch (error) {
      throw new Error('Light provider is required for HTML transformation: ' + error);
    }
  }

  /**
   * Pre-processes HTML to extract essential content before AI processing
   * @param htmlResponse - The raw HTML content
   * @returns Extracted content with links
   */
  private preprocessHtml(htmlResponse: string): { content: string; links: Array<{ url: string; text: string }> } {
    try {
      // Remove script and style tags first
      let cleanedHtml = htmlResponse
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

      // Extract links before removing other tags
      const linkRegex = /href=["']([^"']+)["'][^>]*>([^<]+)</gi;
      const links: Array<{ url: string; text: string }> = [];
      const linkSet = new Set<string>(); // To avoid duplicates
      let match;

      while ((match = linkRegex.exec(htmlResponse)) !== null) {
        const url = match[1];
        const text = match[2].trim();
        if (url && text && !url.startsWith('#') && !url.startsWith('javascript:') && !linkSet.has(url)) {
          links.push({ url, text });
          linkSet.add(url);
        }
      }

      // Remove navigation, header, footer, aside elements
      cleanedHtml = cleanedHtml
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
        .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '') // Remove forms
        .replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '') // Remove buttons
        .replace(/<input[^>]*>/gi, '') // Remove input elements
        .replace(/<select[^>]*>[\s\S]*?<\/select>/gi, '') // Remove select elements
        .replace(/<textarea[^>]*>[\s\S]*?<\/textarea>/gi, ''); // Remove textareas

      // Extract text content from remaining HTML
      let content = cleanedHtml
        .replace(/<[^>]+>/g, ' ') // Remove remaining HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Limit content length to reasonable size for AI processing
      const maxContentLength = 50000; // 50KB should be sufficient for most pages
      if (content.length > maxContentLength) {
        content = content.substring(0, maxContentLength) + '...';
        logger.debug(`Content truncated from ${content.length + 1000} to ${maxContentLength} characters`);
      }

      return { content, links };
    } catch (error) {
      logger.error('Error preprocessing HTML:', error);
      return { content: 'Unable to extract content from HTML', links: [] };
    }
  }

  /**
   * Transforms HTML content into structured content with sections and links
   * @param htmlResponse - The raw HTML content to transform
   * @returns Promise that resolves to structured content
   */
  async transformHtml(htmlResponse: string): Promise<string> {
    const startTime = Date.now();
    try {
      // Pre-process HTML to extract essential content
      const preprocessStart = Date.now();
      const { content, links } = this.preprocessHtml(htmlResponse);
      const preprocessEnd = Date.now();
      
      logger.debug(`Pre-processed HTML: ${content.length} characters (from ${htmlResponse.length}), ${links.length} links extracted in ${preprocessEnd - preprocessStart}ms`);

      const systemPrompt = `You are an expert content analyzer and transformer. Your task is to:

1. Analyze the provided webpage content and organize it into clear sections
2. Create meaningful section headings based on the content structure
3. Preserve the logical flow and structure of the original content
4. Format the output in a clean, readable markdown-style format

Guidelines:
- Focus on the primary content that users would want to read
- Create meaningful section headings based on the content structure
- Maintain the logical flow and structure of the original content
- Preserve important formatting like lists, emphasis, and structure
- If the content is very long, provide a summary of key sections
- Keep the content concise but comprehensive

Output format:
- Use clear section headings (## Heading)
- Organize content logically
- End with a "## Relevant Links" section containing all provided links
- Keep the content concise but comprehensive`;

      const conversation: Message[] = [
        {
          role: 'user',
          content: `Please transform this webpage content into structured, readable content with sections:\n\n${content}\n\nRelevant links:\n${links.map(link => `- ${link.text}: ${link.url}`).join('\n')}`
        }
      ];

      const aiStart = Date.now();
      const transformedContent = await this.lightProvider.generateText(systemPrompt, conversation);
      const aiEnd = Date.now();
      
      const totalTime = Date.now() - startTime;
      logger.debug(`HTML transformation completed: preprocessing ${preprocessEnd - preprocessStart}ms, AI processing ${aiEnd - aiStart}ms, total ${totalTime}ms`);
      
      return transformedContent;

    } catch (error) {
      logger.error('Error transforming HTML content:', error);
      // Fallback: return a simplified version of the HTML
      return this.createFallbackContent(htmlResponse);
    }
  }

  /**
   * Creates a fallback content when transformation fails
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
  const start = Date.now();
  logger.debug(`Starting HTML transformation for ${htmlResponse.length} characters...`);
  const transformedContent = await transformer.transformHtml(htmlResponse);
  const end = Date.now();
  logger.debug(`HTML transformation completed in ${end - start}ms (${(htmlResponse.length / 1024).toFixed(1)}KB → ${transformedContent.length} characters)`);
  return transformedContent;
} 