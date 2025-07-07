import { ProviderFactory } from '../../completion/provider-factory';
import { LinkElementData } from './collect-link-elements';


export async function filterLinkElements(links: LinkElementData[]): Promise<LinkElementData[]> {
    const lightProvider = ProviderFactory.createLightProvider();
    const systemPrompt = `You are assisting an AI agent by identifying the most important and relevant links on a webpage.

You are given a list of anchor (\`<a>\`) elements extracted from the page, each with properties like \`text\`, \`url\`, and optional metadata like \`title\`, \`aria-label\`.

Your job is to return a filtered list of the top 5–15 links that are likely to be:
- Important for understanding or interacting with the page
- Navigation targets that a human might choose (e.g. "Sign up", "Contact", "Product Details")
- Links pointing to other pages or sections that continue the user journey

Exclude:
- Social media icons (e.g. "Facebook", "LinkedIn")
- Legal footers (e.g. "Terms of Service", "Cookie Policy")
- Navigation menus that are repeated on every page
- Empty or duplicate links
- Ads or tracking-related links

If links are ambiguous or generic (e.g. "Click here", "More"), keep them **only if** their context suggests they lead to meaningful content.

Return the output as a list of JSON objects, like this:

[
  {
    "text": "Create an account",
    "href": "/signup"
  },
  {
    "text": "Product features",
    "href": "/features"
  }
]

If helpful, you may use titles, aria-labels, or section context to resolve ambiguity.

Only include links that would actually be useful to a user or an agent navigating this page for a purpose.
`;

    const userPrompt = `Here are the links that were found on the webpage: ${links.map(link => `- ${link.text}: ${link.url}`).join('\n')}`;

    const filteredLinks = await lightProvider.generateText(systemPrompt, [{ role: 'user', content: userPrompt }]);

    return JSON.parse(filteredLinks);
}