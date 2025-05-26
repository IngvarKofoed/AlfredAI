import { parseAssistantMessage, ExtractedTagAndContent } from '../../src/assistant-message/parse-assistant-message';

describe('parseAssistantMessage', () => {
  // Test case 1: Valid XML-like tags
  it('should correctly extract tag name and content for a single valid tag', () => {
    const message = '<tool_code>console.log("hello");</tool_code>';
    const expected: ExtractedTagAndContent[] = [{ tagName: 'tool_code', content: 'console.log("hello");' }];
    expect(parseAssistantMessage(message)).toEqual(expected);
  });

  it('should correctly extract tag name and content for multiple valid tags', () => {
    const message = 'Some text <tag1>content1</tag1> more text <tag2>content2</tag2> end.';
    const expected: ExtractedTagAndContent[] = [
      { tagName: 'tag1', content: 'content1' },
      { tagName: 'tag2', content: 'content2' },
    ];
    expect(parseAssistantMessage(message)).toEqual(expected);
  });

  it('should handle tags with attributes', () => {
    const message = '<tool attr="value">content with attributes</tool>';
    const expected: ExtractedTagAndContent[] = [{ tagName: 'tool', content: 'content with attributes' }];
    expect(parseAssistantMessage(message)).toEqual(expected);
  });

  it('should handle tags with hyphens and dots in tag names', () => {
    const message = '<my-tag.name>content</my-tag.name>';
    const expected: ExtractedTagAndContent[] = [{ tagName: 'my-tag.name', content: 'content' }];
    expect(parseAssistantMessage(message)).toEqual(expected);
  });

  // Test case 2: Malformed tags
  it('should return an empty array for unmatched opening tags', () => {
    const message = '<tool_code>content</tool_code_mismatched';
    expect(parseAssistantMessage(message)).toEqual([]);
  });

  it('should return an empty array for unmatched closing tags', () => {
    const message = 'tool_code>content</tool_code>';
    expect(parseAssistantMessage(message)).toEqual([]);
  });

  it('should return an empty array for incomplete tags', () => {
    const message = '<tool_code content</tool_code>';
    expect(parseAssistantMessage(message)).toEqual([]);
  });

  it('should return an empty array for tags with missing closing slash', () => {
    const message = '<tool_code>content<tool_code>';
    expect(parseAssistantMessage(message)).toEqual([]);
  });

  // Test case 3: Nested tags (limitation noted)
  it('should not extract content from truly nested tags due to regex limitation', () => {
    // The current regex /<([a-zA-Z0-9_.-]+)[^>]*>([\s\S]*?)<\/\1>/gs; is not designed for full XML parsing
    // and will not correctly handle deeply nested structures. It will match the first closing tag it finds.
    const message = '<outer><inner>nested content</inner></outer>';
    const expected: ExtractedTagAndContent[] = [{ tagName: 'outer', content: '<inner>nested content</inner>' }];
    expect(parseAssistantMessage(message)).toEqual(expected);
  });

  it('should correctly extract content if nested tags are self-contained within the content of an outer tag', () => {
    const message = '<outer_tag>This is <inner_tag>inner content</inner_tag> of outer tag.</outer_tag>';
    const expected: ExtractedTagAndContent[] = [
      { tagName: 'outer_tag', content: 'This is <inner_tag>inner content</inner_tag> of outer tag.' },
    ];
    expect(parseAssistantMessage(message)).toEqual(expected);
  });

  // Test case 4: Strings without any tags
  it('should return an empty array for a string with no tags', () => {
    const message = 'This is a plain string without any XML-like tags.';
    expect(parseAssistantMessage(message)).toEqual([]);
  });

  it('should return an empty array for an empty string', () => {
    const message = '';
    expect(parseAssistantMessage(message)).toEqual([]);
  });

  it('should return an empty array for a string with only partial tag-like characters', () => {
    const message = 'This < is a partial tag > example.';
    expect(parseAssistantMessage(message)).toEqual([]);
  });

  // Additional scenarios
  it('should handle content with special characters', () => {
    const message = '<data>Content with < > " \' / special chars!</data>';
    const expected: ExtractedTagAndContent[] = [{ tagName: 'data', content: 'Content with < > " \' / special chars!' }];
    expect(parseAssistantMessage(message)).toEqual(expected);
  });

  it('should handle content with newlines and tabs', () => {
    const message = '<multiline>\n  Line 1\n  Line 2\n</multiline>';
    const expected: ExtractedTagAndContent[] = [{ tagName: 'multiline', content: '\n  Line 1\n  Line 2\n' }];
    expect(parseAssistantMessage(message)).toEqual(expected);
  });

  it('should handle tags immediately following each other', () => {
    const message = '<tagA>contentA</tagA><tagB>contentB</tagB>';
    const expected: ExtractedTagAndContent[] = [
      { tagName: 'tagA', content: 'contentA' },
      { tagName: 'tagB', content: 'contentB' },
    ];
    expect(parseAssistantMessage(message)).toEqual(expected);
  });

  it('should handle tags with leading/trailing whitespace around content', () => {
    const message = '<tag>   content   </tag>';
    const expected: ExtractedTagAndContent[] = [{ tagName: 'tag', content: '   content   ' }];
    expect(parseAssistantMessage(message)).toEqual(expected);
  });
});