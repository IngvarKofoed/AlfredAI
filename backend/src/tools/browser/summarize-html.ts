import { ProviderFactory } from '../../completion';

export async function summarizeHtml(content: string): Promise<string> {
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
- Keep the content concise but comprehensive`;

      const userPrompt = `Please transform this webpage content into structured, readable content with sections:\n\n${content}`;

      const lightProvider = ProviderFactory.createLightProvider();

      const transformedContent = await lightProvider.generateText(systemPrompt, [{ role: 'user', content: userPrompt }]);
      
      return transformedContent;
}