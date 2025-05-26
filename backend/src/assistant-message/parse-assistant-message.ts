export interface ExtractedTagAndContent {
  tagName: string;
  content: string;
}

/**
 * Parses a string for XML-like tag pairs and extracts the tag name and the content between them.
 * For example, for "<tag>content</tag>", it returns { tagName: "tag", content: "content" }.
 * If multiple such tag pairs exist, it returns an array of these objects.
 * This function identifies an opening tag, its content, and a matching closing tag.
 *
 * @param message The string message to parse.
 *   Example: "Some text <example_tag>This is content</example_tag> and more <another attr='val'>Data here</another>"
 * @returns An array of ExtractedTagAndContent objects.
 *   For the example above, it would return:
 *   [ { tagName: "example_tag", content: "This is content" }, { tagName: "another", content: "Data here" } ]
 *   Returns an empty array if no matching tag pairs are found.
 */
export function parseAssistantMessage(message: string): ExtractedTagAndContent[] {
  const results: ExtractedTagAndContent[] = [];
  // Regex to capture:
  // 1. Tag name (e.g., "example_tag") - Group 1 ([a-zA-Z0-9_.-]+)
  // 2. Attributes and other characters within the opening tag - [^>]*
  // 3. Content between the tags (e.g., "This is content") - Group 2 ([\s\S]*?)
  // It ensures the opening and closing tags match using a backreference (\1) to Group 1.
  const regex = /<([a-zA-Z0-9_.-]+)[^>]*>([\s\S]*?)<\/\1>/gs;

  let match;
  while ((match = regex.exec(message)) !== null) {
    const tagName = match[1];
    const content = match[2];

    if (tagName !== undefined && content !== undefined) {
      results.push({ tagName, content });
    }
  }

  return results;
}
