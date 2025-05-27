export interface AssistantCompletion {
    result: string;
    command?: string; // Optional command
}

/**
 * Parses the content of an <attempt_completion> tag.
 * It expects the content to be the final result, potentially wrapped in <result> tags,
 * and may optionally include a <command> tag.
 * 
 * @param completionContent The string content from within the <attempt_completion> tag.
 * @returns An AssistantCompletion object with the extracted result and optional command.
 */
export function parseAssistantCompletion(completionContent: string): AssistantCompletion {
    let result = completionContent.trim();
    let command: string | undefined = undefined;

    // Regex to find <command>...</command> and capture its content
    const commandRegex = /<command>([\s\S]*?)<\/command>/s;
    const commandMatch = completionContent.match(commandRegex);

    if (commandMatch && commandMatch[1]) {
        command = commandMatch[1].trim();
        // Remove the command part from the result string to avoid it being duplicated
        result = result.replace(commandRegex, '').trim();
    }

    // Check for <result> tags and trim them if present
    const resultTagStart = '<result>';
    const resultTagEnd = '</result>';

    if (result.startsWith(resultTagStart) && result.endsWith(resultTagEnd)) {
        result = result.substring(resultTagStart.length, result.length - resultTagEnd.length).trim();
    }
    
    // If after removing command and result tags, the string is empty, but command was found,
    // it implies the main content was the command itself. This part needs careful handling
    // depending on expected structures. For now, if result is empty and command exists,
    // we might need to re-evaluate or rely on a convention that <result> is mandatory if non-command text exists.

    // If the result (after stripping command) is empty, but the original content wasn't just the command tag,
    // it implies the result was meant to be empty or was malformed.
    // If `result` is empty and `command` is present, and the original `completionContent` only contained the command, 
    // then `result` should be empty.
    // If `result` is empty, and `command` is not present, then `result` is empty.

    return { result, command };
}
