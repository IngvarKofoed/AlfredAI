import 'dotenv/config';
import { ClaudeCompletionProvider } from './completion/completion-providers/claude-completion-provider';
import { ButlerTask } from './tasks/butlerTask';
import { getAllTools } from './tools';
import { createToolPrompt } from './prompts/create-tools-prompt';
import readline from 'readline';
import { Client } from './client/client';
import { FollowupQuestion } from './assistant-message/parse-assistant-followup-question';

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

function print(header: string, text: string) {
  const totalWidth = 50;
  const headerPadding = totalWidth - header.length - 5; // 5 for "--- " and " "
  const headerLine = `--- ${header} ${'-'.repeat(Math.max(0, headerPadding))}`;
  
  console.log();
  console.log(headerLine.substring(0, totalWidth));
  console.log(text);
  console.log('-'.repeat(totalWidth));
  console.log();
}

async function main() {

  const tools = getAllTools();
  // const toolPrompt = createToolPrompt(tools);
  // console.log('Tool Prompt:');
  // console.log(toolPrompt);
  // console.log('--------------------------------');

  const completionProvider = new ClaudeCompletionProvider(process.env.ANTHROPIC_API_KEY as string);

  const client = new Client(completionProvider, tools);
  client.on('thinking', (text: string) => {
    print('THINKING', text);
  });
  client.on('questionFromAssistant', (questions: FollowupQuestion) => {
    const formattedQuestion = `${questions.question}\n\nOptions:\n${questions.options.map((option, index) => `${index + 1}. ${option}`).join('\n')}`;
    print('QUESTION FROM ASSISTANT', formattedQuestion);
  });

  while (true) {
    const question = await askQuestion(':> ');
    client.messageFromUser(question);

    await new Promise<void>((resolve) => {
      client.once('answerFromAssistant', (answer: string) => {
        print('ANSWER FROM ASSISTANT', answer);
        resolve();
      });
    });
  }
}

main().catch(console.error);

