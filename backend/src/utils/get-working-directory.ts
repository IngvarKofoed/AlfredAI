import path from 'path';

/**
 * Constructs an absolute path by combining a base path from environment variable
 * with zero or more subfolder arguments.
 * 
 * @param subfolders - Zero or more subfolder names to append to the base path
 * @returns Absolute path combining base path from environment and subfolders
 * @throws Error if the base path environment variable is not set
 */
export function getWorkingDirectory(...subfolders: string[]): string {
  // Get base path from environment variable (you can change this to your preferred env var)
  const basePath = process.env.WORKING_DIRECTORY || process.env.PWD || process.cwd();
  
  if (!basePath) {
    throw new Error('Working directory not found: no WORKING_DIRECTORY environment variable set and unable to determine current directory');
  }
  
  // Combine base path with subfolders
  const fullPath = path.join(basePath, ...subfolders);
  
  // Return absolute path
  return path.resolve(fullPath);
}
