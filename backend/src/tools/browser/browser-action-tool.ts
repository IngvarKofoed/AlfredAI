import { Tool, ToolInitializationContext } from '../tool';
import WebSocket from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { logger } from '../../utils/logger';
import { transformHtmlContent } from './html-transformer';
import { ProviderFactory } from '../../completion/provider-factory';
import { CompletionProvider } from '../../completion/completion-provider';
import { Message } from '../../types';

// WebSocket server instance
let wss: WebSocket.Server | null = null;
let connectedClients: Set<WebSocket> = new Set();

// Promise resolvers for waiting on WebSocket responses
let pendingResolvers: Map<string, { resolve: (value: any) => void; reject: (error: any) => void }> = new Map();

// Light provider for answering questions about webpage content
let lightProvider: CompletionProvider | null = null;

// Current webpage content storage
let currentWebpageContent: { url: string; content: string; timestamp: number } | null = null;

const validateBrowserActionParameters = (parameters: Record<string, any>): { isValid: boolean; error?: string } => {
    const action = parameters.action;
    
    if (!action) {
        return { 
            isValid: false, 
            error: 'Action parameter is required' 
        };
    }

    const validActions = ['launch', 'navigate', 'scroll_down', 'scroll_up', 'close', 'askQuestion'];
    if (!validActions.includes(action)) {
        return { 
            isValid: false, 
            error: `Invalid action: ${action}. Valid actions are: ${validActions.join(', ')}` 
        };
    }

    // Validate parameters based on action
    if (action === 'launch' || action === 'navigate') {
        if (!parameters.url) {
            return { 
                isValid: false, 
                error: `URL parameter is required for ${action} action` 
            };
        }
        
        // Basic URL validation
        try {
            new URL(parameters.url);
        } catch {
            return { 
                isValid: false, 
                error: 'Invalid URL format' 
            };
        }
    }

    if (action === 'askQuestion') {
        if (!parameters.question) {
            return { 
                isValid: false, 
                error: 'Question parameter is required for askQuestion action' 
            };
        }
        
        if (!currentWebpageContent) {
            return { 
                isValid: false, 
                error: 'No webpage content available. Please browse a webpage first using launch or navigate actions.' 
            };
        }
    }

    if (action === 'scroll_down' || action === 'scroll_up') {
        const pages = parameters.pages;
        if (pages !== undefined) {
            const pagesNum = parseInt(pages);
            if (isNaN(pagesNum) || pagesNum <= 0) {
                return { 
                    isValid: false, 
                    error: 'Pages parameter must be a positive number' 
                };
            }
        }
    }

    return { isValid: true };
};

// Helper function to wait for WebSocket response
const waitForWebSocketResponse = (messageId: string, timeout: number = 30000): Promise<any> => {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            pendingResolvers.delete(messageId);
            reject(new Error('WebSocket response timeout'));
        }, timeout);

        pendingResolvers.set(messageId, {
            resolve: (value) => {
                clearTimeout(timeoutId);
                pendingResolvers.delete(messageId);
                resolve(value);
            },
            reject: (error) => {
                clearTimeout(timeoutId);
                pendingResolvers.delete(messageId);
                reject(error);
            }
        });
    });
};

// Helper function to send message to all connected clients
const sendToClients = (message: any): void => {
    const messageStr = JSON.stringify(message);
    connectedClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
};

// Helper function to launch Chrome with extension
const launchBrowser = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            // Get the path to the chrome extension
            const extensionPath = path.resolve(process.cwd(), '../chrome-extension');
            
            // Chrome command with extension loading
            const chromeArgs = [
                // `--load-extension=${extensionPath}`,
                // '--new-window',
                // '--disable-web-security',
                // '--disable-features=VizDisplayCompositor',
                url
            ];

            // Determine Chrome executable path based on platform
            let chromeExecutable: string;
            if (process.platform === 'win32') {
                // Try common Chrome installation paths on Windows
                const possiblePaths = [
                    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
                ];
                
                // Use the first path that exists, or fallback to 'chrome' command
                chromeExecutable = possiblePaths.find(path => {
                    try {
                        fs.accessSync(path);
                        return true;
                    } catch {
                        return false;
                    }
                }) || 'chrome';
            } else if (process.platform === 'darwin') {
                chromeExecutable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
            } else {
                chromeExecutable = 'google-chrome';
            }

            const chromeProcess = spawn(chromeExecutable, chromeArgs, {
                detached: true,
                stdio: 'ignore'
            });

            chromeProcess.unref();
            
            // Give Chrome time to start and connect
            setTimeout(() => {
                resolve();
            }, 3000);

        } catch (error) {
            reject(new Error(`Failed to launch browser: ${error}`));
        }
    });
};

// Helper function to initialize light provider
const initializeLightProvider = (): void => {
    if (!lightProvider) {
        try {
            lightProvider = ProviderFactory.createLightProvider();
        } catch (error) {
            logger.warn(`Failed to initialize light provider: ${error}. askQuestion action will not work.`);
            return;
        }
    }
};

// Helper function to store webpage content in memory
const storeWebpageContent = (url: string, content: string): void => {
    currentWebpageContent = {
        url,
        content,
        timestamp: Date.now()
    };
    logger.debug(`Stored webpage content for ${url} in local variable`);
};

// Helper function to answer questions about webpage content
const answerQuestionAboutWebpage = async (question: string, content: string): Promise<string> => {
    if (!lightProvider) {
        return 'Error: Light provider not initialized. Please check the light model configuration environment variables.';
    }

    try {
        const systemPrompt = `You are an expert at analyzing webpage content and answering questions about it. 

Your task is to:
1. Read and understand the provided webpage content
2. Answer the user's question based on the content
3. Provide accurate, helpful, and concise answers
4. If the information is not available in the content, clearly state that
5. Cite specific parts of the content when relevant

Guidelines:
- Be direct and to the point
- Use information only from the provided content
- If the question cannot be answered from the content, say so clearly
- Provide page numbers, sections, or quotes when relevant
- Keep answers concise but comprehensive`;

        const conversation: Message[] = [
            {
                role: 'user',
                content: `Based on this webpage content, please answer the following question: ${question}\n\nWebpage content:\n${content}`
            }
        ];

        const answer = await lightProvider.generateText(systemPrompt, conversation, { logModelResponse: false, disableConversationHistory: true });
        return answer;
    } catch (error) {
        logger.error('Error answering question about webpage:', error);
        return `Error answering question: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
};

export const browserActionTool: Tool = {
    description: {
        name: 'browserAction',
        description: 'Request to interact with a chrome extension controlled browser. The browser runs in the user\'s context, so no login or credentials are needed for any websites. Use the navigate action to explore websites or follow any links provided by the website. Every action, except `close` and `askQuestion`, will store the webpage content in memory and return a short confirmation message. Use the askQuestion action to ask specific questions about the currently stored webpage content. Always end with a close action.',
        parameters: [
            {
                name: 'action',
                description: 'The action to perform. Available actions: launch (must be first), navigate, scroll_down, scroll_up, askQuestion, close (must be last)',
                usage: 'Action to perform (e.g., launch, navigate, scroll_down, scroll_up, askQuestion, close)',
                required: true,
            },
            {
                name: 'url',
                description: 'The URL to launch the browser at or navigate to. Required for launch and navigate actions. Ensure the URL is valid and includes the appropriate protocol.',
                usage: 'URL to launch the browser at or navigate to',
                required: false,
            },
            {
                name: 'question',
                description: 'The question to ask about the currently stored webpage content. Required for askQuestion action.',
                usage: 'Question about the webpage content',
                required: false,
            },
            {
                name: 'pages',
                description: 'The amount of pages to scroll down or up. Used with scroll_down and scroll_up actions.',
                usage: 'Amount of pages to scroll',
                required: false,
            },
        ],
        examples: [
            {
                description: 'Launch a browser at https://example.com',
                parameters: [
                    { name: 'action', value: 'launch' },
                    { name: 'url', value: 'https://example.com' },
                ],
            },
            {
                description: 'Navigate to https://example.com',
                parameters: [
                    { name: 'action', value: 'navigate' },
                    { name: 'url', value: 'https://example.com/subpage' },
                ],
            },
            {
                description: 'Ask a question about the current webpage content',
                parameters: [
                    { name: 'action', value: 'askQuestion' },
                    { name: 'question', value: 'What is the main topic of this page?' },
                ],
            },
            {
                description: 'Scroll down the page by 1 page',
                parameters: [
                    { name: 'action', value: 'scroll_down' },
                    { name: 'pages', value: '1' },
                ],
            },
            {
                description: 'Scroll up the page by 2 pages',
                parameters: [
                    { name: 'action', value: 'scroll_up' },
                    { name: 'pages', value: '2' },
                ],
            },
            {
                description: 'Close the browser',
                parameters: [
                    { name: 'action', value: 'close' },
                ],
            },
        ],
    },

    initialize: async (context: ToolInitializationContext) => {
        if (wss) {
            return;
        }

        // Initialize light provider for askQuestion functionality
        initializeLightProvider();

        try {
            const port = 3001;
            wss = new WebSocket.Server({ port });
            
            wss.on('connection', (ws: WebSocket) => {
                logger.info('Browser extension connected to WebSocket');
                connectedClients.add(ws);

                ws.on('message', (message: WebSocket.Data) => {
                    try {
                        const messageObj = JSON.parse(message.toString());

                        // Handle different message types
                        if (messageObj.type === 'pageHtml') {
                            // Resolve any pending promises waiting for HTML
                            const resolver = pendingResolvers.get('html_response');
                            if (resolver) {
                                resolver.resolve(messageObj.html);
                            } else {
                                // logger.error('No resolver found for html_response');
                            }
                        } else if (messageObj.type === 'actionComplete') {
                            // Resolve any pending promises waiting for action completion
                            const resolver = pendingResolvers.get(messageObj.actionId || 'action_complete');
                            if (resolver) {
                                resolver.resolve(messageObj);
                            } else {
                                logger.error('No resolver found for action_complete');
                            }
                        }
                    } catch (error) {
                        logger.error('Error parsing WebSocket message:', error);
                    }
                });

                ws.on('close', () => {
                    logger.info('Browser extension disconnected from WebSocket');
                    connectedClients.delete(ws);
                });

                ws.on('error', (error) => {
                    logger.error('WebSocket error:', error);
                    connectedClients.delete(ws);
                });
            });

            const actualPort = (wss.address() as any)?.port || port;
            logger.info(`WebSocket server started on port ${actualPort}`);
        } catch (error) {
            logger.error('Failed to start WebSocket server:', error);
            // Don't throw error in tests, just log it
            if (process.env.NODE_ENV !== 'test') {
                throw error;
            }
        }
    },

    execute: async (parameters: Record<string, any>) => {
        // Validate parameters
        const validation = validateBrowserActionParameters(parameters);
        if (!validation.isValid) {
            return { 
                success: false, 
                error: validation.error 
            };
        }

        const { action, url, pages, question } = parameters;
       
        try {
            if (action === 'launch') {
                // Register the resolver BEFORE launching the browser to avoid race condition
                const htmlResponsePromise = waitForWebSocketResponse('html_response', 10000);
                
                // Launch the browser by using a system command
                await launchBrowser(url);
                
                // Wait for a response from the connected web sockets
                try {
                    const htmlResponse = await htmlResponsePromise;
                    // Transform the HTML into structured content
                    const transformedContent = await transformHtmlContent(htmlResponse);
                    // Store the content in memory
                    storeWebpageContent(url, transformedContent);
                    return {
                        success: true,
                        result: `The page has been browsed. Use the tool browserAction with the action askQuestion to ask a specific question about it.`
                    };
                } catch (error) {
                    logger.error('Error fetching html response:', error);
                    return {
                        success: true,
                        result: `Browser launched at ${url}, but no HTML response received yet. Extension may still be connecting.`
                    };
                }
            }

            if (action === 'navigate') {
                if (connectedClients.size === 0) {
                    return {
                        success: false,
                        error: 'No browser extension connected. Please launch the browser first.'
                    };
                }

                const actionId = `navigate_${Date.now()}`;
                
                // Navigate to the URL by sending a message on the connected web sockets
                sendToClients({
                    type: 'navigate',
                    url: url,
                    actionId: actionId
                });

                // Wait for a response from the connected web sockets
                try {
                    await waitForWebSocketResponse(actionId, 10000);
                    const htmlResponse = await waitForWebSocketResponse('html_response', 10000);
                    // Transform the HTML into structured content
                    const transformedContent = await transformHtmlContent(htmlResponse);
                    // Store the content in memory
                    storeWebpageContent(url, transformedContent);
                    return {
                        success: true,
                        result: `The page has been browsed. Use the tool browserAction with the action askQuestion to ask a specific question about it.`
                    };
                } catch (error) {
                    logger.error('Error fetching html response:', error);
                    return {
                        success: true,
                        result: `Navigate command sent to ${url}, but no response received.`
                    };
                }
            }

            if (action === 'askQuestion') {
                if (!currentWebpageContent) {
                    return {
                        success: false,
                        error: 'No webpage content available. Please browse a webpage first using launch or navigate actions.'
                    };
                }

                const answer = await answerQuestionAboutWebpage(question, currentWebpageContent.content);

                return {
                    success: true,
                    result: answer
                };
            }

            if (action === 'scroll_down') {
                if (connectedClients.size === 0) {
                    return {
                        success: false,
                        error: 'No browser extension connected. Please launch the browser first.'
                    };
                }

                const scrollPages = pages ? parseInt(pages) : 1;
                const actionId = `scroll_down_${Date.now()}`;
                
                // Scroll down the page by sending a message on the connected web sockets
                sendToClients({
                    type: 'scroll',
                    direction: 'down',
                    pages: scrollPages,
                    actionId: actionId
                });

                // Wait for a response from the connected web sockets
                try {
                    await waitForWebSocketResponse(actionId, 5000);
                    const htmlResponse = await waitForWebSocketResponse('html_response', 5000);
                    // Transform the HTML into structured content
                    const transformedContent = await transformHtmlContent(htmlResponse);
                    // Store the content in memory
                    storeWebpageContent(currentWebpageContent!.url, transformedContent);
                    return {
                        success: true,
                        result: `The page has been browsed. Use the tool browserAction with the action askQuestion to ask a specific question about it.`
                    };
                } catch (error) {
                    logger.error('Error fetching html response:', error);
                    return {
                        success: true,
                        result: `Scroll down command sent, but no response received.`
                    };
                }
            }

            if (action === 'scroll_up') {
                if (connectedClients.size === 0) {
                    return {
                        success: false,
                        error: 'No browser extension connected. Please launch the browser first.'
                    };
                }

                const scrollPages = pages ? parseInt(pages) : 1;
                const actionId = `scroll_up_${Date.now()}`;
                
                // Scroll up the page by sending a message on the connected web sockets
                sendToClients({
                    type: 'scroll',
                    direction: 'up',
                    pages: scrollPages,
                    actionId: actionId
                });

                // Wait for a response from the connected web sockets
                try {
                    await waitForWebSocketResponse(actionId, 5000);
                    const htmlResponse = await waitForWebSocketResponse('html_response', 5000);
                    // Transform the HTML into structured content
                    const transformedContent = await transformHtmlContent(htmlResponse);
                    // Store the content in memory
                    storeWebpageContent(currentWebpageContent!.url, transformedContent);
                    return {
                        success: true,
                        result: `The page has been browsed. Use the tool browserAction with the action askQuestion to ask a specific question about it.`
                    };
                } catch (error) {
                    logger.error('Error fetching html response:', error);
                    return {
                        success: true,
                        result: `Scroll up command sent, but no response received.`
                    };
                }
            }

            if (action === 'close') {
                if (connectedClients.size === 0) {
                    return {
                        success: false,
                        error: 'No browser extension connected.'
                    };
                }

                const actionId = `close_${Date.now()}`;
                
                // Close the browser by sending a message on the connected web sockets
                sendToClients({
                    type: 'close',
                    actionId: actionId
                });

                // Clear current webpage content
                currentWebpageContent = null;

                // Wait for a response from the connected web sockets
                try {
                    await waitForWebSocketResponse(actionId, 3000);
                    return {
                        success: true,
                        result: 'Browser closed successfully.'
                    };
                } catch (error) {
                    return {
                        success: true,
                        result: 'Close command sent to browser.'
                    };
                }
            }

        } catch (error) {
            return {
                success: false,
                error: `Browser action failed: ${error}`
            };
        }

        return { 
            success: true, 
            result: '' 
        };
    },
};