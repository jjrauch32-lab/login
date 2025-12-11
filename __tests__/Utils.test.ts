/**
 * Tests for common/Utils.ts
 * Validates utility functions with @actions/core v1.9.1
 */

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';

jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('@actions/io');

// Import after mocks
import { setUserAgent, cleanupAzCLIAccounts, cleanupAzPSAccounts } from '../src/common/Utils';

describe('Utils Tests with @actions/core v1.9.1', () => {
    let mockDebug: jest.MockedFunction<typeof core.debug>;
    let mockInfo: jest.MockedFunction<typeof core.info>;
    let mockExec: jest.MockedFunction<typeof exec.exec>;
    let mockWhich: jest.MockedFunction<typeof io.which>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockDebug = core.debug as jest.MockedFunction<typeof core.debug>;
        mockInfo = core.info as jest.MockedFunction<typeof core.info>;
        mockExec = exec.exec as jest.MockedFunction<typeof exec.exec>;
        mockWhich = io.which as jest.MockedFunction<typeof io.which>;

        mockDebug.mockImplementation(() => {});
        mockInfo.mockImplementation(() => {});
        mockExec.mockResolvedValue(0);
        mockWhich.mockResolvedValue('/usr/bin/mock');

        // Setup environment variables
        process.env.GITHUB_REPOSITORY = 'owner/repo';
        process.env.RUNNER_ENVIRONMENT = 'github-hosted';
        process.env.GITHUB_RUN_ID = '123456';
    });

    afterEach(() => {
        delete process.env.GITHUB_REPOSITORY;
        delete process.env.RUNNER_ENVIRONMENT;
        delete process.env.GITHUB_RUN_ID;
        delete process.env.AZURE_HTTP_USER_AGENT;
        delete process.env.AZUREPS_HOST_ENVIRONMENT;
    });

    describe('setUserAgent', () => {
        test('should set AZURE_HTTP_USER_AGENT environment variable', () => {
            setUserAgent();
            
            expect(process.env.AZURE_HTTP_USER_AGENT).toBeDefined();
            expect(process.env.AZURE_HTTP_USER_AGENT).toContain('GITHUBACTIONS/AzureLogin@v2');
        });

        test('should set AZUREPS_HOST_ENVIRONMENT environment variable', () => {
            setUserAgent();
            
            expect(process.env.AZUREPS_HOST_ENVIRONMENT).toBeDefined();
            expect(process.env.AZUREPS_HOST_ENVIRONMENT).toContain('GITHUBACTIONS/AzureLogin@v2');
        });

        test('should include repository hash in user agent', () => {
            setUserAgent();
            
            expect(process.env.AZURE_HTTP_USER_AGENT).toMatch(/[a-f0-9]{64}/);
        });

        test('should include runner environment in user agent', () => {
            setUserAgent();
            
            expect(process.env.AZURE_HTTP_USER_AGENT).toContain('github-hosted');
        });

        test('should include run ID in user agent', () => {
            setUserAgent();
            
            expect(process.env.AZURE_HTTP_USER_AGENT).toContain('123456');
        });

        test('should append to existing user agent', () => {
            process.env.AZURE_HTTP_USER_AGENT = 'ExistingAgent/1.0';
            setUserAgent();
            
            expect(process.env.AZURE_HTTP_USER_AGENT).toContain('ExistingAgent/1.0');
            expect(process.env.AZURE_HTTP_USER_AGENT).toContain('GITHUBACTIONS/AzureLogin@v2');
        });

        test('should append to existing PS host environment', () => {
            process.env.AZUREPS_HOST_ENVIRONMENT = 'ExistingEnv/1.0';
            setUserAgent();
            
            expect(process.env.AZUREPS_HOST_ENVIRONMENT).toContain('ExistingEnv/1.0');
            expect(process.env.AZUREPS_HOST_ENVIRONMENT).toContain('GITHUBACTIONS/AzureLogin@v2');
        });

        test('should handle missing environment variables', () => {
            delete process.env.GITHUB_REPOSITORY;
            delete process.env.RUNNER_ENVIRONMENT;
            delete process.env.GITHUB_RUN_ID;
            
            expect(() => setUserAgent()).not.toThrow();
        });

        test('should create consistent hash for same repository', () => {
            setUserAgent();
            const firstUserAgent = process.env.AZURE_HTTP_USER_AGENT;
            
            delete process.env.AZURE_HTTP_USER_AGENT;
            setUserAgent();
            const secondUserAgent = process.env.AZURE_HTTP_USER_AGENT;
            
            expect(firstUserAgent).toBe(secondUserAgent);
        });
    });

    describe('cleanupAzCLIAccounts', () => {
        test('should use io.which to find az CLI', async () => {
            await cleanupAzCLIAccounts();
            
            expect(mockWhich).toHaveBeenCalledWith('az', true);
        });

        test('should use core.debug to log az path', async () => {
            mockWhich.mockResolvedValue('/usr/bin/az');
            await cleanupAzCLIAccounts();
            
            expect(mockDebug).toHaveBeenCalledWith('Azure CLI path: /usr/bin/az');
        });

        test('should use core.info to log cleanup action', async () => {
            await cleanupAzCLIAccounts();
            
            expect(mockInfo).toHaveBeenCalledWith('Clearing azure cli accounts from the local cache.');
        });

        test('should execute az account clear', async () => {
            mockWhich.mockResolvedValue('/usr/bin/az');
            await cleanupAzCLIAccounts();
            
            expect(mockExec).toHaveBeenCalledWith('"/usr/bin/az"', ['account', 'clear']);
        });

        test('should handle Windows path with spaces', async () => {
            mockWhich.mockResolvedValue('C:\\Program Files\\az.cmd');
            await cleanupAzCLIAccounts();
            
            expect(mockExec).toHaveBeenCalledWith('"C:\\Program Files\\az.cmd"', ['account', 'clear']);
        });

        test('should throw if az CLI not found', async () => {
            mockWhich.mockRejectedValue(new Error('az not found'));
            
            await expect(cleanupAzCLIAccounts()).rejects.toThrow();
        });

        test('should propagate exec errors', async () => {
            mockExec.mockRejectedValue(new Error('Exec failed'));
            
            await expect(cleanupAzCLIAccounts()).rejects.toThrow('Exec failed');
        });
    });

    describe('cleanupAzPSAccounts', () => {
        test('should use io.which to find PowerShell', async () => {
            await cleanupAzPSAccounts();
            
            expect(mockWhich).toHaveBeenCalledWith('pwsh', true);
        });

        test('should use core.debug to log PowerShell path', async () => {
            mockWhich.mockResolvedValue('/usr/bin/pwsh');
            await cleanupAzPSAccounts();
            
            expect(mockDebug).toHaveBeenCalledWith('PowerShell path: /usr/bin/pwsh');
        });

        test('should use core.debug to log import action', async () => {
            await cleanupAzPSAccounts();
            
            expect(mockDebug).toHaveBeenCalledWith('Importing Azure PowerShell module.');
        });

        test('should use core.info to log cleanup action', async () => {
            await cleanupAzPSAccounts();
            
            expect(mockInfo).toHaveBeenCalledWith('Clearing azure powershell accounts from the local cache.');
        });

        test('should execute Clear-AzContext for Process scope', async () => {
            mockWhich.mockResolvedValue('/usr/bin/pwsh');
            await cleanupAzPSAccounts();
            
            expect(mockExec).toHaveBeenCalledWith(
                '"/usr/bin/pwsh"',
                ['-Command', 'Clear-AzContext', '-Scope', 'Process']
            );
        });

        test('should execute Clear-AzContext for CurrentUser scope', async () => {
            mockWhich.mockResolvedValue('/usr/bin/pwsh');
            await cleanupAzPSAccounts();
            
            expect(mockExec).toHaveBeenCalledWith(
                '"/usr/bin/pwsh"',
                ['-Command', 'Clear-AzContext', '-Scope', 'CurrentUser', '-Force', '-ErrorAction', 'SilentlyContinue']
            );
        });

        test('should handle Windows PowerShell path', async () => {
            mockWhich.mockResolvedValue('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\pwsh.exe');
            await cleanupAzPSAccounts();
            
            expect(mockExec).toHaveBeenCalledWith(
                '"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\pwsh.exe"',
                expect.any(Array)
            );
        });

        test('should throw if PowerShell not found', async () => {
            mockWhich.mockRejectedValue(new Error('pwsh not found'));
            
            await expect(cleanupAzPSAccounts()).rejects.toThrow();
        });
    });

    describe('Error handling', () => {
        test('should use core.debug for all debug messages', async () => {
            await cleanupAzCLIAccounts();
            
            expect(mockDebug).toHaveBeenCalled();
        });

        test('should use core.info for all informational messages', async () => {
            await cleanupAzCLIAccounts();
            
            expect(mockInfo).toHaveBeenCalled();
        });

        test('should not swallow errors from io.which', async () => {
            const error = new Error('Command not found');
            mockWhich.mockRejectedValue(error);
            
            await expect(cleanupAzCLIAccounts()).rejects.toThrow(error);
        });

        test('should not swallow errors from exec.exec', async () => {
            const error = new Error('Execution failed');
            mockExec.mockRejectedValue(error);
            
            await expect(cleanupAzCLIAccounts()).rejects.toThrow(error);
        });
    });

    describe('Path handling edge cases', () => {
        test('should handle paths with special characters', async () => {
            mockWhich.mockResolvedValue('/usr/local/bin/az-cli@2.0');
            await cleanupAzCLIAccounts();
            
            expect(mockExec).toHaveBeenCalledWith('"/usr/local/bin/az-cli@2.0"', ['account', 'clear']);
        });

        test('should handle UNC paths on Windows', async () => {
            mockWhich.mockResolvedValue('\\\\server\\share\\az.cmd');
            await cleanupAzCLIAccounts();
            
            expect(mockExec).toHaveBeenCalledWith('"\\\\server\\share\\az.cmd"', ['account', 'clear']);
        });

        test('should handle paths with quotes', async () => {
            mockWhich.mockResolvedValue('/usr/bin/"special dir"/az');
            await cleanupAzCLIAccounts();
            
            // Path should be wrapped in quotes
            expect(mockExec).toHaveBeenCalled();
        });
    });
});