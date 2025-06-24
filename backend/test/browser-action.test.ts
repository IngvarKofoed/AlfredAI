import { browserActionTool } from '../src/tools/browser/browser-action-tool';
import { ToolInitializationContext } from '../src/tools/tool';
import http from 'http';

describe('Browser Action Tool', () => {
    let mockContext: ToolInitializationContext;

    beforeEach(() => {
        // Create a mock HTTP server for testing
        const mockServer = http.createServer();
        mockContext = {
            httpServer: mockServer
        };
    });

    afterEach(() => {
        // Clean up any WebSocket connections
        jest.clearAllMocks();
    });

    describe('Parameter Validation', () => {
        test('should reject missing action parameter', async () => {
            const result = await browserActionTool.execute({});
            expect(result.success).toBe(false);
            expect(result.error).toBe('Action parameter is required');
        });

        test('should reject invalid action', async () => {
            const result = await browserActionTool.execute({ action: 'invalid_action' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid action: invalid_action');
        });

        test('should reject launch action without URL', async () => {
            const result = await browserActionTool.execute({ action: 'launch' });
            expect(result.success).toBe(false);
            expect(result.error).toBe('URL parameter is required for launch action');
        });

        test('should reject launch action with invalid URL', async () => {
            const result = await browserActionTool.execute({ 
                action: 'launch', 
                url: 'not-a-valid-url' 
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid URL format');
        });

        test('should accept valid launch parameters', async () => {
            // Note: This test will attempt to launch a browser, so we expect it to fail
            // in the test environment, but the parameter validation should pass
            const result = await browserActionTool.execute({ 
                action: 'launch', 
                url: 'https://example.com' 
            });
            // The validation should pass, but the actual browser launch may fail
            expect(result.success).toBe(true);
        });

        test('should reject invalid pages parameter for scroll actions', async () => {
            const result = await browserActionTool.execute({ 
                action: 'scroll_down', 
                pages: 'invalid' 
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('Pages parameter must be a positive number');
        });

        test('should reject negative pages parameter for scroll actions', async () => {
            const result = await browserActionTool.execute({ 
                action: 'scroll_down', 
                pages: '-1' 
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('Pages parameter must be a positive number');
        });

        test('should accept valid scroll parameters', async () => {
            const result = await browserActionTool.execute({ 
                action: 'scroll_down', 
                pages: '2' 
            });
            // Should fail because no browser is connected, but validation passes
            expect(result.success).toBe(false);
            expect(result.error).toBe('No browser extension connected. Please launch the browser first.');
        });

        test('should accept close action without additional parameters', async () => {
            const result = await browserActionTool.execute({ action: 'close' });
            // Should fail because no browser is connected, but validation passes
            expect(result.success).toBe(false);
            expect(result.error).toBe('No browser extension connected.');
        });
    });

    describe('Tool Description', () => {
        test('should have correct tool name', () => {
            expect(browserActionTool.description.name).toBe('browserAction');
        });

        test('should have required parameters defined', () => {
            const actionParam = browserActionTool.description.parameters.find(p => p.name === 'action');
            expect(actionParam).toBeDefined();
            expect(actionParam?.required).toBe(true);
        });

        test('should have optional parameters defined', () => {
            const urlParam = browserActionTool.description.parameters.find(p => p.name === 'url');
            const pagesParam = browserActionTool.description.parameters.find(p => p.name === 'pages');
            
            expect(urlParam).toBeDefined();
            expect(urlParam?.required).toBe(false);
            expect(pagesParam).toBeDefined();
            expect(pagesParam?.required).toBe(false);
        });

        test('should have examples for all actions', () => {
            const examples = browserActionTool.description.examples;
            expect(examples.length).toBeGreaterThan(0);
            
            const actionTypes = examples.map(ex => 
                ex.parameters.find(p => p.name === 'action')?.value
            );
            
            expect(actionTypes).toContain('launch');
            expect(actionTypes).toContain('scroll_down');
            expect(actionTypes).toContain('scroll_up');
            expect(actionTypes).toContain('close');
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', async () => {
            await expect(browserActionTool.initialize(mockContext)).resolves.not.toThrow();
        });
    });
}); 