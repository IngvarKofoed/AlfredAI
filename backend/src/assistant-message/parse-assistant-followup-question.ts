import { FollowupQuestion } from '../types';

/**
 * Parses the content of an <ask_followup_question> tag.
 * It expects the content to contain a <question> tag and a <follow_up> tag
 * with multiple <suggest> tags inside.
 * 
 * @param questionContent The string content from within the <ask_followup_question> tag.
 * @returns A FollowupQuestion object with the extracted question and options.
 */
export function parseAssistantFollowupQuestion(questionContent: string): FollowupQuestion {
    let question = '';
    const options: string[] = [];

    // Extract the question
    const questionRegex = /<question>([\s\S]*?)<\/question>/s;
    const questionMatch = questionContent.match(questionRegex);
    
    if (questionMatch && questionMatch[1]) {
        question = questionMatch[1].trim();
    }

    // Extract the follow_up section
    const followUpRegex = /<follow_up>([\s\S]*?)<\/follow_up>/s;
    const followUpMatch = questionContent.match(followUpRegex);
    
    if (followUpMatch && followUpMatch[1]) {
        const followUpContent = followUpMatch[1];
        
        // Extract all suggest tags
        const suggestRegex = /<suggest>([\s\S]*?)<\/suggest>/gs;
        let suggestMatch;
        
        while ((suggestMatch = suggestRegex.exec(followUpContent)) !== null) {
            if (suggestMatch[1]) {
                const trimmedOption = suggestMatch[1].trim();
                if (trimmedOption) {
                    options.push(trimmedOption);
                }
            }
        }
    }

    return { question, options };
} 