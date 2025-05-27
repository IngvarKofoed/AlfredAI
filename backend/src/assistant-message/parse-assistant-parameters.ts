import { ExtractedTagAndContent } from './parse-assistant-message';

/**
 * Parses parameter tags from the content of a single ExtractedTagAndContent object.
 * The content is expected to contain 0 or more <TAG></TAG> elements where TAG is the parameter name
 * and the content between the tags is the parameter value.
 * 
 * @param extractedData A single ExtractedTagAndContent object from parseAssistantMessage
 * @returns A Record<string, any> where keys are parameter names and values are parameter values
 * 
 * @example
 * Input: { tagName: "function_call", content: "<param1>value1</param1><param2>value2</param2>" }
 * Output: { param1: "value1", param2: "value2" }
 */
export function parseAssistantParameters(extractedData: ExtractedTagAndContent): Record<string, any> {
  const parameters: Record<string, any> = {};
  
  // Regex to match parameter tags: <paramName>value</paramName>
  // Group 1: parameter name, Group 2: parameter value
  const parameterRegex = /<([a-zA-Z0-9_.-]+)[^>]*>([\s\S]*?)<\/\1>/gs;
  
  let match;
  while ((match = parameterRegex.exec(extractedData.content)) !== null) {
    const paramName = match[1];
    const paramValue = match[2];
    
    if (paramName !== undefined && paramValue !== undefined) {
      // Try to parse the value as JSON if it looks like JSON, otherwise keep as string
      parameters[paramName] = tryParseValue(paramValue.trim());
    }
  }
  
  return parameters;
}

/**
 * Helper function to attempt parsing a string value as JSON.
 * If parsing fails, returns the original string value.
 * 
 * @param value The string value to attempt to parse
 * @returns The parsed value (if valid JSON) or the original string
 */
function tryParseValue(value: string): any {
  // If the value is empty, return it as is
  if (value === '') {
    return value;
  }
  
  // Try to parse as JSON for objects, arrays, booleans, numbers, etc.
  try {
    // Only attempt JSON parsing if the value looks like JSON
    if (
      (value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('[') && value.endsWith(']')) ||
      value === 'true' ||
      value === 'false' ||
      value === 'null' ||
      /^-?\d+(\.\d+)?$/.test(value)
    ) {
      return JSON.parse(value);
    }
  } catch {
    // If JSON parsing fails, fall through to return the original string
  }
  
  return value;
}
