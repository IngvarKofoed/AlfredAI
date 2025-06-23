import path from 'path';
import os from 'os';

/**
 * Constructs an absolute path by combining a base path from environment variable
 * with zero or more subfolder arguments.
 * 
 * @param subfolders - Zero or more subfolder names to append to the base path
 * @returns Absolute path combining base path from environment and subfolders
 * @throws Error if the base path environment variable is not set
 */
export function getWorkingDirectory(...subfolders: string[]): string {
  // Get base path from environment variable, fallback to home directory, then current working directory
  const basePath = process.env.WORKING_DIRECTORY || os.homedir() || process.env.PWD || process.cwd();
  
  if (!basePath) {
    throw new Error('Unable to determine working directory: no environment variables set and home directory not accessible');
  }
  
  // If using home directory as fallback, create an ".alfred" subfolder
  const effectiveBasePath = (!process.env.WORKING_DIRECTORY && basePath === os.homedir()) 
    ? path.join(basePath, '.alfred')
    : basePath;
  
  // Combine base path with subfolders
  const fullPath = path.join(effectiveBasePath, ...subfolders);
  
  // Return absolute path
  return path.resolve(fullPath);
}
