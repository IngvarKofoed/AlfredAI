# HTML Transformation System

The HTML Transformation System automatically converts raw HTML content from web pages into structured, readable content with sections and links using Google's Gemini AI model.

## Overview

When the browser action tool receives HTML content from web pages, it now automatically transforms this content using the `HtmlTransformer` utility. This transformation:

1. **Extracts main content** from HTML, removing navigation, ads, and boilerplate
2. **Organizes content** into clear sections with descriptive headings
3. **Preserves relevant links** with their context
4. **Maintains logical flow** and structure of the original content
5. **Formats output** in clean, readable markdown-style format

## How It Works

### Automatic Integration

The HTML transformation is automatically applied in all browser actions:

- **Launch**: When launching a browser to a URL, the page content is transformed
- **Scroll Down**: After scrolling down, the new page content is transformed
- **Scroll Up**: After scrolling up, the new page content is transformed

### Transformation Process

1. **Gemini AI Processing**: Uses Google's Gemini 2.5 Flash model to intelligently analyze and restructure HTML
2. **Content Extraction**: Removes navigation, ads, and non-essential elements
3. **Section Organization**: Creates meaningful headings based on content structure
4. **Link Preservation**: Maintains all relevant links with descriptive text
5. **Fallback Handling**: If Gemini fails, provides basic HTML cleaning and link extraction

## Output Format

The transformed content follows this structure:

```markdown
## Main Content

[Extracted and organized content with sections]

## Relevant Links

- [Link Text](https://example.com)
- [Another Link](https://example2.com)
```

## Configuration

### Environment Variables

The HTML transformer requires the Google AI API key:

```bash
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

### Model Settings

The transformer uses these default settings:
- **Model**: `gemini-2.5-flash-preview-05-20`
- **Max Tokens**: 8192 (higher for HTML processing)
- **Temperature**: 0.3 (lower for consistent output)

## Usage Examples

### Browser Action Tool

The transformation is automatically applied when using browser actions:

```typescript
// Launch browser and get transformed content
const result = await browserActionTool.execute({
  action: 'launch',
  url: 'https://example.com'
});

// Result contains transformed, structured content instead of raw HTML
console.log(result.result);
```

### Direct Usage

You can also use the transformer directly:

```typescript
import { transformHtmlContent } from '../utils/html-transformer';

const rawHtml = '<html><body><h1>Title</h1><p>Content</p></body></html>';
const transformedContent = await transformHtmlContent(rawHtml);
```

## Error Handling

### Fallback Mechanism

If the Gemini API is unavailable or fails:

1. **Basic HTML Cleaning**: Removes script, style, navigation, and other non-content tags
2. **Link Extraction**: Extracts all relevant links using regex patterns
3. **Structured Output**: Provides a simplified but structured version of the content

### Error Recovery

The system gracefully handles:
- Missing API keys
- Network failures
- Invalid HTML content
- Large HTML documents
- Empty or malformed content

## Benefits

### For Users
- **Readable Content**: No more raw HTML in responses
- **Structured Information**: Clear sections and headings
- **Preserved Links**: All relevant links maintained with context
- **Consistent Format**: Uniform output across different websites

### For Developers
- **Automatic Processing**: No manual HTML parsing needed
- **Intelligent Extraction**: AI-powered content understanding
- **Robust Fallbacks**: Graceful degradation when AI is unavailable
- **Easy Integration**: Simple API with global singleton pattern

## Technical Details

### Architecture

```
Browser Action Tool
    ↓
HTML Response from WebSocket
    ↓
HtmlTransformer.transformHtml()
    ↓
GeminiCompletionProvider.generateText()
    ↓
Structured Content Output
```

### Performance Considerations

- **Caching**: Uses singleton pattern to reuse transformer instance
- **Token Limits**: Configured for large HTML documents (8192 tokens)
- **Timeout Handling**: Graceful fallback on API timeouts
- **Memory Management**: Efficient HTML cleaning without external dependencies

### Security

- **API Key Validation**: Requires valid Google AI API key
- **Content Sanitization**: Removes potentially harmful script tags
- **Link Filtering**: Filters out javascript: and anchor-only links
- **Error Isolation**: Failures don't crash the entire system

## Troubleshooting

### Common Issues

**"GOOGLE_AI_API_KEY environment variable is required"**
- Ensure the environment variable is set
- Check that the API key is valid and has sufficient credits

**"No relevant links found on this page"**
- The page may not contain external links
- Links may be filtered out (javascript:, anchors, etc.)
- This is normal behavior for some pages

**Fallback content appears instead of AI transformation**
- Check Gemini API status and credentials
- Review network connectivity
- Verify API key permissions

### Debugging

Enable debug logging to see transformation details:

```typescript
// The transformer logs debug information when successful
logger.debug('HTML transformation completed successfully');
```

## Future Enhancements

Potential improvements for the HTML transformation system:

1. **Content Summarization**: Add automatic content summarization for long pages
2. **Image Description**: Extract and describe images from pages
3. **Table Extraction**: Better handling of tabular data
4. **Multi-language Support**: Support for non-English content
5. **Custom Prompts**: Allow customization of transformation prompts
6. **Caching**: Cache transformed content for repeated requests 