import { Tool, ToolInitializationContext } from '../tool';
import WebSocket from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { logger } from '../../utils/logger';
import { transformHtmlContent } from './html-transformer';

// WebSocket server instance
let wss: WebSocket.Server | null = null;
let connectedClients: Set<WebSocket> = new Set();

// Promise resolvers for waiting on WebSocket responses
let pendingResolvers: Map<string, { resolve: (value: any) => void; reject: (error: any) => void }> = new Map();

const validateBrowserActionParameters = (parameters: Record<string, any>): { isValid: boolean; error?: string } => {
    const action = parameters.action;
    
    if (!action) {
        return { 
            isValid: false, 
            error: 'Action parameter is required' 
        };
    }

    const validActions = ['launch', 'navigate', 'scroll_down', 'scroll_up', 'close'];
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

export const browserActionTool: Tool = {
    description: {
        name: 'browserAction',
        description: 'Request to interact with a chrome extension controlled browser. The browser runs in the user\'s context, so no login or credentials are needed for any websites. Use the navigate action to explore websites or follow any links provided by the website. Every action, except `close`, will be responded to with the html of the browser\'s current state. You may only perform one browser action per message, and wait for the user\'s response including a html to determine the next action. Always a series of actions with an close action.',
        parameters: [
            {
                name: 'action',
                description: 'The action to perform. Available actions: launch (must be first), navigate, scroll_down, scroll_up, close (must be last)',
                usage: 'Action to perform (e.g., launch, navigate, scroll_down, scroll_up, close)',
                required: true,
            },
            {
                name: 'url',
                description: 'The URL to launch the browser at or navigate to. Required for launch and navigate actions. Ensure the URL is valid and includes the appropriate protocol.',
                usage: 'URL to launch the browser at or navigate to',
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

        try {
            const port = 3001;
            wss = new WebSocket.Server({ port });
            
            wss.on('connection', (ws: WebSocket) => {
                logger.info('Browser extension connected to WebSocket');
                connectedClients.add(ws);

                ws.on('message', (message: WebSocket.Data) => {
                    try {
                        const messageObj = JSON.parse(message.toString());
                        logger.debug(`Received message from browser: ${messageObj.type}`);

                        // Handle different message types
                        if (messageObj.type === 'pageHtml') {
                            // Resolve any pending promises waiting for HTML
                            const resolver = pendingResolvers.get('html_response');
                            if (resolver) {
                                resolver.resolve(messageObj.html);
                            } else {
                                logger.error('No resolver found for html_response');
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

        const { action, url, pages } = parameters;
       
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
                    return {
                        success: true,
                        result: transformedContent
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
                    return {
                        success: true,
                        result: `Navigated to ${url}. Current page content:\n\n${transformedContent}`
                    };
                } catch (error) {
                    logger.error('Error fetching html response:', error);
                    return {
                        success: true,
                        result: `Navigate command sent to ${url}, but no response received.`
                    };
                }
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
                    return {
                        success: true,
                        result: `Scrolled down ${scrollPages} page(s). Current page content:\n\n${transformedContent}`
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
                    return {
                        success: true,
                        result: `Scrolled up ${scrollPages} page(s). Current page content:\n\n${transformedContent}`
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