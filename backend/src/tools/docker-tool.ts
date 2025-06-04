import { Tool, ToolResult } from './tool';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export const dockerTool: Tool = {
    description: {
        name: 'docker',
        description: 'Manage Docker containers and images to run or host applications. This tool can create containers, run web services, build images, and manage the Docker environment. Use this when you need to host a local website, run an application in an isolated environment, or work with containerized services.',
        parameters: [
            {
                name: 'action',
                description: 'The Docker action to perform',
                usage: 'run | build | stop | ps | logs | pull | exec | create-dockerfile | remove | images | network',
                required: true
            },
            {
                name: 'image',
                description: 'Docker image name (required for run, pull actions)',
                usage: 'nginx:latest, node:18, python:3.11, etc.',
                required: false
            },
            {
                name: 'containerName',
                description: 'Name for the container (optional but recommended)',
                usage: 'my-web-server, dev-app, etc.',
                required: false
            },
            {
                name: 'ports',
                description: 'Port mapping in HOST:CONTAINER format (e.g., "8080:80")',
                usage: '8080:80, 3000:3000, 5432:5432',
                required: false
            },
            {
                name: 'volumes',
                description: 'Volume mapping in HOST:CONTAINER format (e.g., "/local/path:/container/path")',
                usage: '/Users/user/app:/app, ./data:/data',
                required: false
            },
            {
                name: 'environment',
                description: 'Environment variables as comma-separated KEY=VALUE pairs',
                usage: 'NODE_ENV=development,API_KEY=secret',
                required: false
            },
            {
                name: 'dockerfilePath',
                description: 'Path to Dockerfile or directory containing Dockerfile',
                usage: './Dockerfile, /path/to/project',
                required: false
            },
            {
                name: 'tag',
                description: 'Tag for built image',
                usage: 'my-app:latest, web-server:v1.0',
                required: false
            },
            {
                name: 'command',
                description: 'Command to run in container (overrides default)',
                usage: '/bin/bash, npm start, python app.py',
                required: false
            },
            {
                name: 'workdir',
                description: 'Working directory inside container',
                usage: '/app, /usr/src/app',
                required: false
            },
            {
                name: 'detached',
                description: 'Run container in detached mode (background)',
                usage: 'true, false',
                required: false
            }
        ],
        examples: [
            {
                description: 'Run nginx web server on port 8080',
                parameters: [
                    { name: 'action', value: 'run' },
                    { name: 'image', value: 'nginx:latest' },
                    { name: 'containerName', value: 'my-web-server' },
                    { name: 'ports', value: '8080:80' },
                    { name: 'detached', value: 'true' }
                ]
            },
            {
                description: 'Run Node.js development server with volume mounting',
                parameters: [
                    { name: 'action', value: 'run' },
                    { name: 'image', value: 'node:18' },
                    { name: 'containerName', value: 'node-dev' },
                    { name: 'ports', value: '3000:3000' },
                    { name: 'volumes', value: './:/app' },
                    { name: 'workdir', value: '/app' },
                    { name: 'command', value: 'npm run dev' },
                    { name: 'detached', value: 'true' }
                ]
            },
            {
                description: 'Create a simple Dockerfile for a Node.js app',
                parameters: [
                    { name: 'action', value: 'create-dockerfile' },
                    { name: 'image', value: 'node:18' },
                    { name: 'workdir', value: '/app' },
                    { name: 'dockerfilePath', value: './Dockerfile' }
                ]
            },
            {
                description: 'Build Docker image from Dockerfile',
                parameters: [
                    { name: 'action', value: 'build' },
                    { name: 'dockerfilePath', value: '.' },
                    { name: 'tag', value: 'my-app:latest' }
                ]
            },
            {
                description: 'List running containers',
                parameters: [
                    { name: 'action', value: 'ps' }
                ]
            },
            {
                description: 'Stop a container',
                parameters: [
                    { name: 'action', value: 'stop' },
                    { name: 'containerName', value: 'my-web-server' }
                ]
            },
            {
                description: 'View container logs',
                parameters: [
                    { name: 'action', value: 'logs' },
                    { name: 'containerName', value: 'my-web-server' }
                ]
            }
        ]
    },

    execute: async (parameters: Record<string, any>): Promise<ToolResult> => {
        try {
            const action = parameters.action;
            
            if (!action) {
                return {
                    success: false,
                    error: 'Action parameter is required'
                };
            }

            // Check if Docker is available
            try {
                await execAsync('docker --version');
            } catch (error) {
                return {
                    success: false,
                    error: 'Docker is not installed or not available in PATH. Please install Docker Desktop or Docker Engine first.'
                };
            }

            logger.info(`Executing Docker action: ${action}`);

            let command = '';
            let result = '';

            switch (action.toLowerCase()) {
                case 'run':
                    command = await buildRunCommand(parameters);
                    break;
                    
                case 'build':
                    command = await buildBuildCommand(parameters);
                    break;
                    
                case 'stop':
                    const containerName = parameters.containerName;
                    if (!containerName) {
                        return { success: false, error: 'containerName is required for stop action' };
                    }
                    command = `docker stop ${containerName}`;
                    break;
                    
                case 'ps':
                    command = 'docker ps -a --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}"';
                    break;
                    
                case 'logs':
                    const logContainer = parameters.containerName;
                    if (!logContainer) {
                        return { success: false, error: 'containerName is required for logs action' };
                    }
                    command = `docker logs ${logContainer} --tail 50`;
                    break;
                    
                case 'pull':
                    const pullImage = parameters.image;
                    if (!pullImage) {
                        return { success: false, error: 'image is required for pull action' };
                    }
                    command = `docker pull ${pullImage}`;
                    break;
                    
                case 'exec':
                    const execContainer = parameters.containerName;
                    const execCommand = parameters.command || '/bin/bash';
                    if (!execContainer) {
                        return { success: false, error: 'containerName is required for exec action' };
                    }
                    command = `docker exec -it ${execContainer} ${execCommand}`;
                    break;
                    
                case 'remove':
                    const removeContainer = parameters.containerName;
                    if (!removeContainer) {
                        return { success: false, error: 'containerName is required for remove action' };
                    }
                    command = `docker rm -f ${removeContainer}`;
                    break;
                    
                case 'images':
                    command = 'docker images --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}\\t{{.CreatedAt}}"';
                    break;
                    
                case 'network':
                    command = 'docker network ls';
                    break;
                    
                case 'create-dockerfile':
                    return await createDockerfile(parameters);
                    
                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}. Supported actions: run, build, stop, ps, logs, pull, exec, remove, images, network, create-dockerfile`
                    };
            }

            if (command) {
                logger.info(`Executing Docker command: ${command}`);
                
                const options = {
                    timeout: 120000, // 2 minute timeout for Docker operations
                    maxBuffer: 2 * 1024 * 1024, // 2MB buffer
                };

                try {
                    const { stdout, stderr } = await execAsync(command, options);
                    
                    result = '';
                    if (stdout) {
                        result += stdout;
                    }
                    if (stderr) {
                        result += (result ? '\n' : '') + `STDERR: ${stderr}`;
                    }
                    
                    logger.info(`Docker command executed successfully`);
                    
                    return {
                        success: true,
                        result: result || 'Command executed successfully'
                    };
                    
                } catch (error: any) {
                    logger.error(`Docker command failed: ${error.message}`);
                    
                    let errorMessage = 'Docker command failed';
                    if (error.code) {
                        errorMessage += ` (exit code: ${error.code})`;
                    }
                    if (error.stdout) {
                        errorMessage += `\nSTDOUT: ${error.stdout}`;
                    }
                    if (error.stderr) {
                        errorMessage += `\nSTDERR: ${error.stderr}`;
                    }
                    
                    return {
                        success: false,
                        error: errorMessage
                    };
                }
            }

            return {
                success: false,
                error: 'No command was generated'
            };

        } catch (error: any) {
            logger.error(`Error in Docker tool: ${error.message}`);
            return {
                success: false,
                error: `Docker tool error: ${error.message}`
            };
        }
    }
};

async function buildRunCommand(parameters: Record<string, any>): Promise<string> {
    const image = parameters.image;
    if (!image) {
        throw new Error('image is required for run action');
    }
    
    let command = 'docker run';
    
    // Add detached flag if specified
    if (parameters.detached === 'true' || parameters.detached === true) {
        command += ' -d';
    }
    
    // Add interactive terminal if not detached
    if (parameters.detached !== 'true' && parameters.detached !== true) {
        command += ' -it';
    }
    
    // Add container name
    if (parameters.containerName) {
        command += ` --name ${parameters.containerName}`;
    }
    
    // Add port mapping
    if (parameters.ports) {
        const ports = parameters.ports.split(',').map((p: string) => p.trim());
        for (const port of ports) {
            command += ` -p ${port}`;
        }
    }
    
    // Add volume mapping
    if (parameters.volumes) {
        const volumes = parameters.volumes.split(',').map((v: string) => v.trim());
        for (const volume of volumes) {
            command += ` -v ${volume}`;
        }
    }
    
    // Add environment variables
    if (parameters.environment) {
        const envVars = parameters.environment.split(',').map((e: string) => e.trim());
        for (const env of envVars) {
            command += ` -e ${env}`;
        }
    }
    
    // Add working directory
    if (parameters.workdir) {
        command += ` -w ${parameters.workdir}`;
    }
    
    // Add the image
    command += ` ${image}`;
    
    // Add command if specified
    if (parameters.command) {
        command += ` ${parameters.command}`;
    }
    
    return command;
}

async function buildBuildCommand(parameters: Record<string, any>): Promise<string> {
    const dockerfilePath = parameters.dockerfilePath || '.';
    let command = `docker build`;
    
    if (parameters.tag) {
        command += ` -t ${parameters.tag}`;
    }
    
    command += ` ${dockerfilePath}`;
    
    return command;
}

async function createDockerfile(parameters: Record<string, any>): Promise<ToolResult> {
    try {
        const dockerfilePath = parameters.dockerfilePath || './Dockerfile';
        const baseImage = parameters.image || 'node:18';
        const workdir = parameters.workdir || '/app';
        
        let dockerfileContent = `# Generated Dockerfile\n`;
        dockerfileContent += `FROM ${baseImage}\n\n`;
        dockerfileContent += `# Set working directory\n`;
        dockerfileContent += `WORKDIR ${workdir}\n\n`;
        
        // Add common patterns based on base image
        if (baseImage.includes('node')) {
            dockerfileContent += `# Copy package files\n`;
            dockerfileContent += `COPY package*.json ./\n\n`;
            dockerfileContent += `# Install dependencies\n`;
            dockerfileContent += `RUN npm install\n\n`;
            dockerfileContent += `# Copy application code\n`;
            dockerfileContent += `COPY . .\n\n`;
            dockerfileContent += `# Expose port\n`;
            dockerfileContent += `EXPOSE 3000\n\n`;
            dockerfileContent += `# Start application\n`;
            dockerfileContent += `CMD ["npm", "start"]\n`;
        } else if (baseImage.includes('python')) {
            dockerfileContent += `# Copy requirements\n`;
            dockerfileContent += `COPY requirements.txt ./\n\n`;
            dockerfileContent += `# Install dependencies\n`;
            dockerfileContent += `RUN pip install -r requirements.txt\n\n`;
            dockerfileContent += `# Copy application code\n`;
            dockerfileContent += `COPY . .\n\n`;
            dockerfileContent += `# Expose port\n`;
            dockerfileContent += `EXPOSE 8000\n\n`;
            dockerfileContent += `# Start application\n`;
            dockerfileContent += `CMD ["python", "app.py"]\n`;
        } else if (baseImage.includes('nginx')) {
            dockerfileContent += `# Copy static files\n`;
            dockerfileContent += `COPY ./public /usr/share/nginx/html\n\n`;
            dockerfileContent += `# Expose port\n`;
            dockerfileContent += `EXPOSE 80\n\n`;
            dockerfileContent += `# Start nginx\n`;
            dockerfileContent += `CMD ["nginx", "-g", "daemon off;"]\n`;
        } else {
            dockerfileContent += `# Copy application code\n`;
            dockerfileContent += `COPY . .\n\n`;
            dockerfileContent += `# Add your commands here\n`;
            dockerfileContent += `# RUN <your-build-commands>\n\n`;
            dockerfileContent += `# Expose port (adjust as needed)\n`;
            dockerfileContent += `# EXPOSE 8080\n\n`;
            dockerfileContent += `# Start command (adjust as needed)\n`;
            dockerfileContent += `# CMD ["your-start-command"]\n`;
        }
        
        // Write the Dockerfile
        await fs.writeFile(dockerfilePath, dockerfileContent, 'utf8');
        
        return {
            success: true,
            result: `Dockerfile created at ${dockerfilePath}\n\nContent:\n${dockerfileContent}`
        };
        
    } catch (error: any) {
        return {
            success: false,
            error: `Failed to create Dockerfile: ${error.message}`
        };
    }
}