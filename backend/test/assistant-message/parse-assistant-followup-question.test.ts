import { parseAssistantFollowupQuestion, FollowupQuestion } from '../../src/assistant-message/parse-assistant-followup-question';

describe('parseAssistantFollowupQuestion', () => {
  it('should parse a complete followup question with multiple options', () => {
    const content = `
<question>What is the path to the frontend-config.json file?</question>
<follow_up>
<suggest>./src/frontend-config.json</suggest>
<suggest>./config/frontend-config.json</suggest>
<suggest>./frontend-config.json</suggest>
</follow_up>
    `.trim();

    const expected: FollowupQuestion = {
      question: 'What is the path to the frontend-config.json file?',
      options: [
        './src/frontend-config.json',
        './config/frontend-config.json',
        './frontend-config.json'
      ]
    };

    expect(parseAssistantFollowupQuestion(content)).toEqual(expected);
  });

  it('should parse a followup question with single option', () => {
    const content = `
<question>Do you want to continue?</question>
<follow_up>
<suggest>Yes, continue with the current approach</suggest>
</follow_up>
    `.trim();

    const expected: FollowupQuestion = {
      question: 'Do you want to continue?',
      options: ['Yes, continue with the current approach']
    };

    expect(parseAssistantFollowupQuestion(content)).toEqual(expected);
  });

  it('should handle content with extra whitespace', () => {
    const content = `
<question>   What framework should we use?   </question>
<follow_up>
<suggest>   React with TypeScript   </suggest>
<suggest>   Vue.js with TypeScript   </suggest>
</follow_up>
    `.trim();

    const expected: FollowupQuestion = {
      question: 'What framework should we use?',
      options: [
        'React with TypeScript',
        'Vue.js with TypeScript'
      ]
    };

    expect(parseAssistantFollowupQuestion(content)).toEqual(expected);
  });

  it('should handle multiline content in question and options', () => {
    const content = `
<question>Which approach would you prefer for handling
the database connection?</question>
<follow_up>
<suggest>Use a connection pool with
automatic retry logic</suggest>
<suggest>Use a simple connection
with manual error handling</suggest>
</follow_up>
    `.trim();

    const expected: FollowupQuestion = {
      question: 'Which approach would you prefer for handling\nthe database connection?',
      options: [
        'Use a connection pool with\nautomatic retry logic',
        'Use a simple connection\nwith manual error handling'
      ]
    };

    expect(parseAssistantFollowupQuestion(content)).toEqual(expected);
  });

  it('should return empty question and options when tags are missing', () => {
    const content = 'This is just plain text without any XML tags';

    const expected: FollowupQuestion = {
      question: '',
      options: []
    };

    expect(parseAssistantFollowupQuestion(content)).toEqual(expected);
  });

  it('should handle missing question tag', () => {
    const content = `
<follow_up>
<suggest>Option 1</suggest>
<suggest>Option 2</suggest>
</follow_up>
    `.trim();

    const expected: FollowupQuestion = {
      question: '',
      options: ['Option 1', 'Option 2']
    };

    expect(parseAssistantFollowupQuestion(content)).toEqual(expected);
  });

  it('should handle missing follow_up tag', () => {
    const content = `
<question>What is your preference?</question>
    `.trim();

    const expected: FollowupQuestion = {
      question: 'What is your preference?',
      options: []
    };

    expect(parseAssistantFollowupQuestion(content)).toEqual(expected);
  });

  it('should handle empty suggest tags', () => {
    const content = `
<question>Choose an option:</question>
<follow_up>
<suggest></suggest>
<suggest>Valid option</suggest>
<suggest>   </suggest>
</follow_up>
    `.trim();

    const expected: FollowupQuestion = {
      question: 'Choose an option:',
      options: ['Valid option']
    };

    expect(parseAssistantFollowupQuestion(content)).toEqual(expected);
  });

  it('should handle special characters in content', () => {
    const content = `
<question>What's the file path with "quotes" & special chars?</question>
<follow_up>
<suggest>./path/with spaces & symbols.json</suggest>
<suggest>./path/with-"quotes"-and-'apostrophes'.json</suggest>
</follow_up>
    `.trim();

    const expected: FollowupQuestion = {
      question: 'What\'s the file path with "quotes" & special chars?',
      options: [
        './path/with spaces & symbols.json',
        './path/with-"quotes"-and-\'apostrophes\'.json'
      ]
    };

    expect(parseAssistantFollowupQuestion(content)).toEqual(expected);
  });
}); 