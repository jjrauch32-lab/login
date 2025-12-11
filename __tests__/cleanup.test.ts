import * as core from '@actions/core';
import * as Utils from '../src/common/Utils';

// Mock dependencies
jest.mock('@actions/core');
jest.mock('../src/common/Utils');

describe('cleanup.ts - Azure Login Cleanup', () => {
    let mockSetUserAgent: jest.SpyInstance;
    let mockCleanupAzCLIAccounts: jest.SpyInstance;
    let mockCleanupAzPSAccounts: jest.SpyInstance;
    let mockGetInput: jest.SpyInstance;
    let mockWarning: jest.SpyInstance;
    let mockDebug: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        
        // Setup core mocks
        mockGetInput = jest.spyOn(core, 'getInput');
        mockWarning = jest.spyOn(core, 'warning');
        mockDebug = jest.spyOn(core, 'debug');
        
        // Setup Utils mocks
        mockSetUserAgent = jest.spyOn(Utils, 'setUserAgent');
        mockCleanupAzCLIAccounts = jest.spyOn(Utils, 'cleanupAzCLIAccounts');
        mockCleanupAzPSAccounts = jest.spyOn(Utils, 'cleanupAzPSAccounts');
        
        // Default behavior
        mockSetUserAgent.mockImplementation(() => {});
        mockCleanupAzCLIAccounts.mockResolvedValue(undefined);
        mockCleanupAzPSAccounts.mockResolvedValue(undefined);
        mockGetInput.mockReturnValue('false');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Happy Path - Successful Cleanup', () => {
        test('should successfully cleanup CLI accounts only when PowerShell disabled', async () => {
            mockGetInput.mockReturnValue('false');
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockSetUserAgent).toHaveBeenCalledTimes(1);
            expect(mockCleanupAzCLIAccounts).toHaveBeenCalledTimes(1);
            expect(mockCleanupAzPSAccounts).not.toHaveBeenCalled();
            expect(mockWarning).not.toHaveBeenCalled();
        });

        test('should cleanup both CLI and PowerShell accounts when enabled', async () => {
            mockGetInput.mockImplementation((name) => {
                if (name === 'enable-AzPSSession') return 'true';
                return 'false';
            });
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockSetUserAgent).toHaveBeenCalledTimes(1);
            expect(mockCleanupAzCLIAccounts).toHaveBeenCalledTimes(1);
            expect(mockCleanupAzPSAccounts).toHaveBeenCalledTimes(1);
            expect(mockWarning).not.toHaveBeenCalled();
        });

        test('should call setUserAgent before any cleanup operations', async () => {
            const callOrder: string[] = [];
            
            mockSetUserAgent.mockImplementation(() => callOrder.push('setUserAgent'));
            mockCleanupAzCLIAccounts.mockImplementation(async () => callOrder.push('cleanupCLI'));
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(callOrder[0]).toBe('setUserAgent');
            expect(callOrder[1]).toBe('cleanupCLI');
        });

        test('should always cleanup CLI accounts regardless of PowerShell setting', async () => {
            mockGetInput.mockReturnValue('false');
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockCleanupAzCLIAccounts).toHaveBeenCalled();
        });
    });

    describe('PowerShell Session Handling', () => {
        test('should cleanup PowerShell when enable-AzPSSession is "true"', async () => {
            mockGetInput.mockReturnValue('true');
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockCleanupAzPSAccounts).toHaveBeenCalledTimes(1);
        });

        test('should cleanup PowerShell when enable-AzPSSession is "TRUE" (case insensitive)', async () => {
            mockGetInput.mockReturnValue('TRUE');
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockCleanupAzPSAccounts).toHaveBeenCalledTimes(1);
        });

        test('should not cleanup PowerShell when enable-AzPSSession is "false"', async () => {
            mockGetInput.mockReturnValue('false');
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockCleanupAzPSAccounts).not.toHaveBeenCalled();
        });

        test('should not cleanup PowerShell when enable-AzPSSession is empty string', async () => {
            mockGetInput.mockReturnValue('');
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockCleanupAzPSAccounts).not.toHaveBeenCalled();
        });

        test('should not cleanup PowerShell when enable-AzPSSession is any other value', async () => {
            mockGetInput.mockReturnValue('yes');
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockCleanupAzPSAccounts).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('should catch and warn on setUserAgent error', async () => {
            const testError = new Error('User agent setup failed');
            mockSetUserAgent.mockImplementation(() => { throw testError; });
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('Login cleanup failed'));
            expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('User agent setup failed'));
            expect(mockDebug).toHaveBeenCalled();
        });

        test('should catch and warn on CLI cleanup error', async () => {
            const testError = new Error('CLI cleanup failed');
            mockCleanupAzCLIAccounts.mockRejectedValue(testError);
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('CLI cleanup failed'));
            expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('Cleanup will be skipped'));
        });

        test('should catch and warn on PowerShell cleanup error', async () => {
            mockGetInput.mockReturnValue('true');
            const testError = new Error('PowerShell cleanup failed');
            mockCleanupAzPSAccounts.mockRejectedValue(testError);
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('PowerShell cleanup failed'));
        });

        test('should include error stack in debug output', async () => {
            const testError = new Error('Cleanup error with stack');
            testError.stack = 'Error: Cleanup error\n  at cleanup function';
            mockCleanupAzCLIAccounts.mockRejectedValue(testError);
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockDebug).toHaveBeenCalledWith(expect.stringContaining('at cleanup function'));
        });

        test('should handle error without stack property', async () => {
            const errorWithoutStack = new Error('No stack error');
            delete errorWithoutStack.stack;
            mockCleanupAzCLIAccounts.mockRejectedValue(errorWithoutStack);
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockWarning).toHaveBeenCalled();
            expect(mockDebug).toHaveBeenCalled();
        });

        test('should handle null error gracefully', async () => {
            mockCleanupAzCLIAccounts.mockRejectedValue(null);
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockWarning).toHaveBeenCalled();
        });

        test('should handle string error instead of Error object', async () => {
            mockCleanupAzCLIAccounts.mockRejectedValue('String error message');
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('String error message'));
        });

        test('should continue cleanup despite getInput error', async () => {
            mockGetInput.mockImplementation(() => { throw new Error('getInput failed'); });
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockWarning).toHaveBeenCalled();
        });
    });

    describe('Cleanup Sequence', () => {
        test('should execute cleanup in correct order: setUserAgent -> CLI -> PS', async () => {
            mockGetInput.mockReturnValue('true');
            const callSequence: string[] = [];
            
            mockSetUserAgent.mockImplementation(() => callSequence.push('setUserAgent'));
            mockCleanupAzCLIAccounts.mockImplementation(async () => callSequence.push('cleanupCLI'));
            mockCleanupAzPSAccounts.mockImplementation(async () => callSequence.push('cleanupPS'));
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(callSequence).toEqual(['setUserAgent', 'cleanupCLI', 'cleanupPS']);
        });

        test('should not attempt PS cleanup if CLI cleanup fails', async () => {
            mockGetInput.mockReturnValue('true');
            mockCleanupAzCLIAccounts.mockRejectedValue(new Error('CLI failed'));
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockCleanupAzCLIAccounts).toHaveBeenCalled();
            expect(mockCleanupAzPSAccounts).not.toHaveBeenCalled();
            expect(mockWarning).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        test('should handle multiple concurrent cleanup calls', async () => {
            const cleanupPromises = [
                import('../src/cleanup'),
                import('../src/cleanup'),
                import('../src/cleanup')
            ];
            
            await Promise.all(cleanupPromises);
            await new Promise(resolve => setImmediate(resolve));
            
            // Each import creates new execution
            expect(mockCleanupAzCLIAccounts).toHaveBeenCalled();
        });

        test('should handle whitespace in enable-AzPSSession input', async () => {
            mockGetInput.mockReturnValue('  true  ');
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            // Should not match because of whitespace (no trim in actual code)
            expect(mockCleanupAzPSAccounts).not.toHaveBeenCalled();
        });

        test('should handle mixed case in enable-AzPSSession beyond just true', async () => {
            mockGetInput.mockReturnValue('TrUe');
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockCleanupAzPSAccounts).toHaveBeenCalled();
        });

        test('should handle undefined return from getInput', async () => {
            mockGetInput.mockReturnValue(undefined as any);
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            // Should handle gracefully - toLowerCase() on undefined will error
            expect(mockWarning).toHaveBeenCalled();
        });
    });

    describe('Warning Messages', () => {
        test('should include descriptive message about cleanup skip', async () => {
            mockCleanupAzCLIAccounts.mockRejectedValue(new Error('Test error'));
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('Cleanup will be skipped'));
        });

        test('should include original error message in warning', async () => {
            const specificError = new Error('Specific cleanup failure reason');
            mockCleanupAzCLIAccounts.mockRejectedValue(specificError);
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('Specific cleanup failure reason'));
        });
    });

    describe('Integration with core.getInput', () => {
        test('should call getInput with correct parameter name', async () => {
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockGetInput).toHaveBeenCalledWith('enable-AzPSSession');
        });

        test('should handle getInput being called multiple times', async () => {
            mockGetInput.mockReturnValue('true');
            
            await import('../src/cleanup');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockGetInput).toHaveBeenCalledTimes(1);
        });
    });
});