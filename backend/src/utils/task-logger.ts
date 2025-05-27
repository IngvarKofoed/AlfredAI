import * as fs from 'fs/promises';
import * as path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'logs');

interface LogEntryData {
  source: string;
  type: string;
  data: any;
}

interface LogEntry extends LogEntryData {
  timestamp: string;
}

/**
 * Ensures that the logs directory exists.
 */
async function ensureLogsDirExists(): Promise<void> {
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create logs directory:', error);
    // Depending on desired behavior, we might want to throw this error
    // or handle it more gracefully if logging is not critical.
    throw new Error(`Failed to create logs directory at ${LOGS_DIR}`);
  }
}

/**
 * Logs a task event to a JSON file specific to the task ID.
 * Each log file contains an array of log entries.
 *
 * @param taskId The unique identifier for the task.
 * @param eventData The data for the log entry.
 */
export async function logTaskEvent(taskId: string, eventData: LogEntryData): Promise<void> {
  if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
    console.error('Invalid taskId provided for logging:', taskId);
    // Optionally throw an error or return early
    return;
  }

  await ensureLogsDirExists();

  const logFilePath = path.join(LOGS_DIR, `task_${taskId}.json`);
  const newLogEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    ...eventData,
  };

  try {
    let logs: LogEntry[] = [];
    try {
      const fileContent = await fs.readFile(logFilePath, 'utf-8');
      if (fileContent.trim() !== '') {
        logs = JSON.parse(fileContent);
        if (!Array.isArray(logs)) {
          console.warn(`Log file ${logFilePath} was not an array. Re-initializing.`);
          logs = [];
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') { // ENOENT means file doesn't exist, which is fine
        console.error(`Error reading log file ${logFilePath}:`, error);
        // Decide if we should proceed with an empty log array or re-throw
      }
      // If file doesn't exist or is unparsable, start with an empty array
      logs = [];
    }

    logs.push(newLogEntry);

    await fs.writeFile(logFilePath, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Failed to write to log file ${logFilePath}:`, error);
    // Depending on desired behavior, we might want to throw this error.
  }
}

// Example Usage (can be commented out or removed in production)
async function exampleUsage(): Promise<void> {
  console.log('Running logger example...');
  const exampleTaskId = 'testTask123';

  await logTaskEvent(exampleTaskId, {
    source: 'USER',
    type: 'MESSAGE',
    data: { text: 'Hello, assistant!' },
  });

  await logTaskEvent(exampleTaskId, {
    source: 'ASSISTANT',
    type: 'ACTION',
    data: { tool_name: 'read_file', parameters: { path: './example.txt' } },
  });

  await logTaskEvent('anotherTask456', {
    source: 'SYSTEM_EVENT',
    type: 'INFO',
    data: { message: 'System started.' },
  });

  console.log(`Example logs should be in ${LOGS_DIR}/task_${exampleTaskId}.json and task_anotherTask456.json`);

  // Example of invalid task ID
  await logTaskEvent('', { source: 'SYSTEM_EVENT', type: 'ERROR', data: { message: 'This should not log.' } });
  await logTaskEvent('  ', { source: 'SYSTEM_EVENT', type: 'ERROR', data: { message: 'This should also not log.' } });


  // Test case for existing non-array file
  const problematicTaskId = "problematicTask";
  const problematicLogFilePath = path.join(LOGS_DIR, `task_${problematicTaskId}.json`);
  try {
    await ensureLogsDirExists(); // Ensure dir exists before writing a bad file
    await fs.writeFile(problematicLogFilePath, JSON.stringify({ "not": "an array" }), 'utf-8');
    console.log(`Created problematic file: ${problematicLogFilePath}`);
    await logTaskEvent(problematicTaskId, {
        source: "TEST",
        type: "RECOVERY_ATTEMPT",
        data: { message: "Attempting to log to a non-array file." }
    });
    const content = await fs.readFile(problematicLogFilePath, 'utf-8');
    console.log(`Content of ${problematicLogFilePath} after attempt:`, content);
  } catch(e) {
    console.error("Error in problematic task test:", e)
  }


}

// To run the example:
// 1. Make sure you have ts-node installed (npm install -g ts-node)
// 2. Execute this file directly: ts-node backend/src/utils/logger.ts
// exampleUsage().catch(console.error); // Uncomment to run example when file is executed directly