import * as core from '@actions/core';
import * as Utils from '../src/common/Utils';
import { AzPSLogin } from '../src/PowerShell/AzPSLogin';
import { LoginConfig } from '../src/common/LoginConfig';
import { AzureCliLogin } from '../src/Cli/AzureCliLogin';

// Mock all dependencies
jest.mock('@actions/core');
jest.mock('../src/common/Utils');
jest.mock('../src/PowerShell/AzPSLogin');
jest.mock('../src/common/LoginConfig');
jest.mock('../src/Cli/AzureCliLogin');

describe('main.ts - Azure Login Entry Point', () => {
    let mockSetUserAgent: jest.SpyInstance;
    let mockCleanupAzCLIAccounts: jest.SpyInstance;
    let mockCleanupAzPSAccounts: jest.SpyInstance;
    let mockGetInput: jest.SpyInstance;
    let mockSetFailed: jest.SpyInstance;
    let mockDebug: jest.SpyInstance;
    let mockLoginConfigInitialize: jest.SpyInstance;
    let mockLoginConfigValidate: jest.SpyInstance;
    let mockCliLogin: jest.SpyInstance;
    let mockPSLogin: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        
        // Setup core mocks
        mockGetInput = jest.spyOn(core, 'getInput');
        mockSetFailed = jest.spyOn(core, 'setFailed');
        mockDebug = jest.spyOn(core, 'debug');
        
        // Setup Utils mocks
        mockSetUserAgent = jest.spyOn(Utils, 'setUserAgent');
        mockCleanupAzCLIAccounts = jest.spyOn(Utils, 'cleanupAzCLIAccounts');
        mockCleanupAzPSAccounts = jest.spyOn(Utils, 'cleanupAzPSAccounts');
        
        // Setup LoginConfig mocks
        mockLoginConfigInitialize = jest.fn().mockResolvedValue(undefined);
        mockLoginConfigValidate = jest.fn().mockReturnValue(undefined);
        (LoginConfig as jest.MockedClass<typeof LoginConfig>).mockImplementation(() => ({
            initialize: mockLoginConfigInitialize,
            validate: mockLoginConfigValidate,
            enableAzPSSession: false,
        } as any));
        
        // Setup AzureCliLogin mock
        mockCliLogin = jest.fn().mockResolvedValue(undefined);
        (AzureCliLogin as jest.MockedClass<typeof AzureCliLogin>).mockImplementation(() => ({
            login: mockCliLogin,
        } as any));
        
        // Setup AzPSLogin mock
        mockPSLogin = jest.fn().mockResolvedValue(undefined);
        (AzPSLogin as jest.MockedClass<typeof AzPSLogin>).mockImplementation(() => ({
            login: mockPSLogin,
        } as any));
        
        // Default behavior
        mockSetUserAgent.mockImplementation(() => {});
        mockCleanupAzCLIAccounts.mockResolvedValue(undefined);
        mockCleanupAzPSAccounts.mockResolvedValue(undefined);
        mockGetInput.mockReturnValue('false');
        
        delete process.env.AZURE_LOGIN_PRE_CLEANUP;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Happy Path - Successful Login', () => {
        test('should successfully login with CLI only (no PowerShell)', async () => {
            mockGetInput.mockReturnValue('false');
            
            // Import and execute main
            await import('../src/main');
            
            // Allow async operations to complete
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockSetUserAgent).toHaveBeenCalledTimes(1);
            expect(mockLoginConfigInitialize).toHaveBeenCalledTimes(1);
            expect(mockLoginConfigValidate).toHaveBeenCalledTimes(1);
            expect(mockCliLogin).toHaveBeenCalledTimes(1);
            expect(mockPSLogin).not.toHaveBeenCalled();
            expect(mockSetFailed).not.toHaveBeenCalled();
        });

        test('should successfully login with both CLI and PowerShell when enabled', async () => {
            mockGetInput.mockReturnValue('false');
            
            (LoginConfig as jest.MockedClass<typeof LoginConfig>).mockImplementation(() => ({
                initialize: mockLoginConfigInitialize,
                validate: mockLoginConfigValidate,
                enableAzPSSession: true,
            } as any));
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockSetUserAgent).toHaveBeenCalledTimes(1);
            expect(mockCliLogin).toHaveBeenCalledTimes(1);
            expect(mockPSLogin).toHaveBeenCalledTimes(1);
            expect(mockSetFailed).not.toHaveBeenCalled();
        });

        test('should call setUserAgent as first operation', async () => {
            const callOrder: string[] = [];
            
            mockSetUserAgent.mockImplementation(() => callOrder.push('setUserAgent'));
            mockLoginConfigInitialize.mockImplementation(async () => callOrder.push('initialize'));
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(callOrder[0]).toBe('setUserAgent');
            expect(callOrder[1]).toBe('initialize');
        });
    });

    describe('Pre-Cleanup Functionality', () => {
        test('should perform pre-cleanup when AZURE_LOGIN_PRE_CLEANUP is true', async () => {
            process.env.AZURE_LOGIN_PRE_CLEANUP = 'true';
            mockGetInput.mockReturnValue('false');
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockCleanupAzCLIAccounts).toHaveBeenCalledTimes(1);
            expect(mockCleanupAzPSAccounts).not.toHaveBeenCalled();
        });

        test('should perform both CLI and PS pre-cleanup when both enabled', async () => {
            process.env.AZURE_LOGIN_PRE_CLEANUP = 'true';
            mockGetInput.mockImplementation((name) => {
                if (name === 'enable-AzPSSession') return 'true';
                return 'false';
            });
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockCleanupAzCLIAccounts).toHaveBeenCalledTimes(1);
            expect(mockCleanupAzPSAccounts).toHaveBeenCalledTimes(1);
        });

        test('should not perform pre-cleanup when AZURE_LOGIN_PRE_CLEANUP is false', async () => {
            process.env.AZURE_LOGIN_PRE_CLEANUP = 'false';
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockCleanupAzCLIAccounts).not.toHaveBeenCalled();
            expect(mockCleanupAzPSAccounts).not.toHaveBeenCalled();
        });

        test('should not perform pre-cleanup when AZURE_LOGIN_PRE_CLEANUP is undefined', async () => {
            delete process.env.AZURE_LOGIN_PRE_CLEANUP;
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockCleanupAzCLIAccounts).not.toHaveBeenCalled();
            expect(mockCleanupAzPSAccounts).not.toHaveBeenCalled();
        });

        test('should handle case-sensitive comparison for pre-cleanup flag', async () => {
            process.env.AZURE_LOGIN_PRE_CLEANUP = 'TRUE';
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            // Should not cleanup because comparison is case-sensitive ('true' !== 'TRUE')
            expect(mockCleanupAzCLIAccounts).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('should catch and report error from setUserAgent', async () => {
            const testError = new Error('User agent setup failed');
            mockSetUserAgent.mockImplementation(() => { throw testError; });
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining('Login failed with'));
            expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining('User agent setup failed'));
        });

        test('should catch and report error from LoginConfig.initialize', async () => {
            const testError = new Error('Initialization failed');
            mockLoginConfigInitialize.mockRejectedValue(testError);
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining('Initialization failed'));
            expect(mockDebug).toHaveBeenCalled();
        });

        test('should catch and report error from LoginConfig.validate', async () => {
            const testError = new Error('Validation failed: invalid tenant');
            mockLoginConfigValidate.mockImplementation(() => { throw testError; });
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining('Validation failed'));
        });

        test('should catch and report error from CLI login', async () => {
            const testError = new Error('CLI login failed');
            mockCliLogin.mockRejectedValue(testError);
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining('CLI login failed'));
            expect(mockPSLogin).not.toHaveBeenCalled();
        });

        test('should catch and report error from PowerShell login', async () => {
            const testError = new Error('PowerShell login failed');
            mockPSLogin.mockRejectedValue(testError);
            
            (LoginConfig as jest.MockedClass<typeof LoginConfig>).mockImplementation(() => ({
                initialize: mockLoginConfigInitialize,
                validate: mockLoginConfigValidate,
                enableAzPSSession: true,
            } as any));
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining('PowerShell login failed'));
        });

        test('should include helpful message in error output', async () => {
            const testError = new Error('Test error');
            mockCliLogin.mockRejectedValue(testError);
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining("Double check if the 'auth-type' is correct"));
            expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining('https://github.com/Azure/login#readme'));
        });

        test('should call debug with error stack trace', async () => {
            const testError = new Error('Test error with stack');
            testError.stack = 'Error: Test error\n  at someFunction';
            mockCliLogin.mockRejectedValue(testError);
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockDebug).toHaveBeenCalledWith(expect.stringContaining('at someFunction'));
        });

        test('should handle error during pre-cleanup gracefully', async () => {
            process.env.AZURE_LOGIN_PRE_CLEANUP = 'true';
            const testError = new Error('Cleanup failed');
            mockCleanupAzCLIAccounts.mockRejectedValue(testError);
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining('Cleanup failed'));
        });
    });

    describe('Login Flow Sequence', () => {
        test('should follow correct sequence: setUserAgent -> initialize -> validate -> CLI login', async () => {
            const callSequence: string[] = [];
            
            mockSetUserAgent.mockImplementation(() => callSequence.push('setUserAgent'));
            mockLoginConfigInitialize.mockImplementation(async () => callSequence.push('initialize'));
            mockLoginConfigValidate.mockImplementation(() => callSequence.push('validate'));
            mockCliLogin.mockImplementation(async () => callSequence.push('cliLogin'));
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(callSequence).toEqual(['setUserAgent', 'initialize', 'validate', 'cliLogin']);
        });

        test('should add PS login to sequence when enabled', async () => {
            const callSequence: string[] = [];
            
            mockSetUserAgent.mockImplementation(() => callSequence.push('setUserAgent'));
            mockLoginConfigInitialize.mockImplementation(async () => callSequence.push('initialize'));
            mockLoginConfigValidate.mockImplementation(() => callSequence.push('validate'));
            mockCliLogin.mockImplementation(async () => callSequence.push('cliLogin'));
            mockPSLogin.mockImplementation(async () => callSequence.push('psLogin'));
            
            (LoginConfig as jest.MockedClass<typeof LoginConfig>).mockImplementation(() => ({
                initialize: mockLoginConfigInitialize,
                validate: mockLoginConfigValidate,
                enableAzPSSession: true,
            } as any));
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(callSequence).toEqual(['setUserAgent', 'initialize', 'validate', 'cliLogin', 'psLogin']);
        });

        test('should not call PS login if CLI login fails', async () => {
            mockCliLogin.mockRejectedValue(new Error('CLI failed'));
            
            (LoginConfig as jest.MockedClass<typeof LoginConfig>).mockImplementation(() => ({
                initialize: mockLoginConfigInitialize,
                validate: mockLoginConfigValidate,
                enableAzPSSession: true,
            } as any));
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockCliLogin).toHaveBeenCalled();
            expect(mockPSLogin).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty error message', async () => {
            const testError: any = {};
            mockCliLogin.mockRejectedValue(testError);
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockSetFailed).toHaveBeenCalled();
        });

        test('should handle null error', async () => {
            mockCliLogin.mockRejectedValue(null);
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockSetFailed).toHaveBeenCalled();
        });

        test('should handle string error instead of Error object', async () => {
            mockCliLogin.mockRejectedValue('String error message');
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining('String error message'));
        });

        test('should handle error without stack property', async () => {
            const errorWithoutStack = new Error('No stack error');
            delete errorWithoutStack.stack;
            mockCliLogin.mockRejectedValue(errorWithoutStack);
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            expect(mockSetFailed).toHaveBeenCalled();
            expect(mockDebug).toHaveBeenCalled();
        });
    });

    describe('Configuration Variations', () => {
        test('should handle enable-AzPSSession with different case variations', async () => {
            mockGetInput.mockImplementation((name) => {
                if (name === 'enable-AzPSSession') return 'TRUE';
                return 'false';
            });
            
            process.env.AZURE_LOGIN_PRE_CLEANUP = 'true';
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            // Should call PS cleanup because toLowerCase() is used
            expect(mockCleanupAzPSAccounts).toHaveBeenCalled();
        });

        test('should handle enable-AzPSSession with whitespace', async () => {
            mockGetInput.mockImplementation((name) => {
                if (name === 'enable-AzPSSession') return ' true ';
                return 'false';
            });
            
            process.env.AZURE_LOGIN_PRE_CLEANUP = 'true';
            
            await import('../src/main');
            await new Promise(resolve => setImmediate(resolve));
            
            // Should not call because of whitespace (unless trimmed)
            expect(mockCleanupAzPSAccounts).not.toHaveBeenCalled();
        });
    });
});