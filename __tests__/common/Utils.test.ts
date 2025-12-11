import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as crypto from 'crypto';
import { setUserAgent, cleanupAzCLIAccounts, cleanupAzPSAccounts } from '../../src/common/Utils';
import { AzPSConstants, AzPSUtils } from '../../src/PowerShell/AzPSUtils';

// Mock dependencies
jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('@actions/io');
jest.mock('../../src/PowerShell/AzPSUtils');

describe('Utils.ts - Common Utility Functions', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        jest.clearAllMocks();
        originalEnv = { ...process.env };
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    describe('setUserAgent', () => {
        beforeEach(() => {
            // Setup minimal required environment
            process.env.GITHUB_REPOSITORY = 'test-owner/test-repo';
            process.env.RUNNER_ENVIRONMENT = 'github-hosted';
            process.env.GITHUB_RUN_ID = '123456789';
        });

        test('should set AZURE_HTTP_USER_AGENT environment variable', () => {
            delete process.env.AZURE_HTTP_USER_AGENT;
            
            setUserAgent();
            
            expect(process.env.AZURE_HTTP_USER_AGENT).toBeDefined();
            expect(process.env.AZURE_HTTP_USER_AGENT).toContain('GITHUBACTIONS/AzureLogin@v2');
        });

        test('should set AZUREPS_HOST_ENVIRONMENT environment variable', () => {
            delete process.env.AZUREPS_HOST_ENVIRONMENT;
            
            setUserAgent();
            
            expect(process.env.AZUREPS_HOST_ENVIRONMENT).toBeDefined();
            expect(process.env.AZUREPS_HOST_ENVIRONMENT).toContain('GITHUBACTIONS/AzureLogin@v2');
        });

        test('should append to existing AZURE_HTTP_USER_AGENT if present', () => {
            process.env.AZURE_HTTP_USER_AGENT = 'ExistingAgent/1.0';
            
            setUserAgent();
            
            expect(process.env.AZURE_HTTP_USER_AGENT).toContain('ExistingAgent/1.0');
            expect(process.env.AZURE_HTTP_USER_AGENT).toContain('GITHUBACTIONS/AzureLogin@v2');
        });

        test('should append to existing AZUREPS_HOST_ENVIRONMENT if present', () => {
            process.env.AZUREPS_HOST_ENVIRONMENT = 'ExistingPSAgent/1.0';
            
            setUserAgent();
            
            expect(process.env.AZUREPS_HOST_ENVIRONMENT).toContain('ExistingPSAgent/1.0');
            expect(process.env.AZUREPS_HOST_ENVIRONMENT).toContain('GITHUBACTIONS/AzureLogin@v2');
        });

        test('should include hashed repository name in user agent', () => {
            process.env.GITHUB_REPOSITORY = 'myorg/myrepo';
            
            setUserAgent();
            
            // Hash should be consistent for same input
            const expectedHash = crypto.createHash('sha256').update('myorg/myrepo').digest('hex');
            expect(process.env.AZURE_HTTP_USER_AGENT).toContain(expectedHash);
        });

        test('should include runner environment in user agent', () => {
            process.env.RUNNER_ENVIRONMENT = 'self-hosted';
            
            setUserAgent();
            
            expect(process.env.AZURE_HTTP_USER_AGENT).toContain('self-hosted');
        });

        test('should include GitHub run ID in user agent', () => {
            process.env.GITHUB_RUN_ID = '987654321';
            
            setUserAgent();
            
            expect(process.env.AZURE_HTTP_USER_AGENT).toContain('987654321');
        });

        test('should handle missing GITHUB_REPOSITORY gracefully', () => {
            delete process.env.GITHUB_REPOSITORY;
            
            setUserAgent();
            
            // Should create hash of undefined
            expect(process.env.AZURE_HTTP_USER_AGENT).toBeDefined();
        });

        test('should handle missing RUNNER_ENVIRONMENT gracefully', () => {
            delete process.env.RUNNER_ENVIRONMENT;
            
            setUserAgent();
            
            expect(process.env.AZURE_HTTP_USER_AGENT).toContain('undefined');
        });

        test('should handle missing GITHUB_RUN_ID gracefully', () => {
            delete process.env.GITHUB_RUN_ID;
            
            setUserAgent();
            
            expect(process.env.AZURE_HTTP_USER_AGENT).toContain('undefined');
        });

        test('should use SHA256 for repository hashing', () => {
            process.env.GITHUB_REPOSITORY = 'test/repo';
            
            setUserAgent();
            
            const expectedHash = crypto.createHash('sha256').update('test/repo').digest('hex');
            expect(process.env.AZURE_HTTP_USER_AGENT).toContain(expectedHash);
            expect(process.env.AZUREPS_HOST_ENVIRONMENT).toContain(expectedHash);
        });

        test('should format user agent string correctly', () => {
            process.env.GITHUB_REPOSITORY = 'owner/repo';
            process.env.RUNNER_ENVIRONMENT = 'cloud';
            process.env.GITHUB_RUN_ID = '111';
            
            setUserAgent();
            
            const hash = crypto.createHash('sha256').update('owner/repo').digest('hex');
            const expectedPattern = `GITHUBACTIONS/AzureLogin@v2_${hash}_cloud_111`;
            
            expect(process.env.AZURE_HTTP_USER_AGENT).toContain(expectedPattern);
        });

        test('should be idempotent when called multiple times', () => {
            setUserAgent();
            const firstCall = process.env.AZURE_HTTP_USER_AGENT;
            
            setUserAgent();
            const secondCall = process.env.AZURE_HTTP_USER_AGENT;
            
            // Should append each time
            expect(secondCall).toContain(firstCall!);
        });
    });

    describe('cleanupAzCLIAccounts', () => {
        let mockWhich: jest.SpyInstance;
        let mockExec: jest.SpyInstance;
        let mockDebug: jest.SpyInstance;
        let mockInfo: jest.SpyInstance;

        beforeEach(() => {
            mockWhich = jest.spyOn(io, 'which');
            mockExec = jest.spyOn(exec, 'exec');
            mockDebug = jest.spyOn(core, 'debug');
            mockInfo = jest.spyOn(core, 'info');
            
            mockWhich.mockResolvedValue('/usr/bin/az');
            mockExec.mockResolvedValue(0);
        });

        test('should locate Azure CLI executable', async () => {
            await cleanupAzCLIAccounts();
            
            expect(mockWhich).toHaveBeenCalledWith('az', true);
        });

        test('should log Azure CLI path', async () => {
            mockWhich.mockResolvedValue('/custom/path/az');
            
            await cleanupAzCLIAccounts();
            
            expect(mockDebug).toHaveBeenCalledWith('Azure CLI path: /custom/path/az');
        });

        test('should log informational message about cleanup', async () => {
            await cleanupAzCLIAccounts();
            
            expect(mockInfo).toHaveBeenCalledWith('Clearing azure cli accounts from the local cache.');
        });

        test('should execute az account clear command', async () => {
            await cleanupAzCLIAccounts();
            
            expect(mockExec).toHaveBeenCalledWith('"/usr/bin/az"', ['account', 'clear']);
        });

        test('should quote az path to handle spaces', async () => {
            mockWhich.mockResolvedValue('/path with spaces/az');
            
            await cleanupAzCLIAccounts();
            
            expect(mockExec).toHaveBeenCalledWith('"/path with spaces/az"', ['account', 'clear']);
        });

        test('should throw error if az CLI not found', async () => {
            mockWhich.mockRejectedValue(new Error('az not found'));
            
            await expect(cleanupAzCLIAccounts()).rejects.toThrow('az not found');
        });

        test('should propagate exec errors', async () => {
            mockExec.mockRejectedValue(new Error('Exec failed'));
            
            await expect(cleanupAzCLIAccounts()).rejects.toThrow('Exec failed');
        });

        test('should handle Windows-style paths', async () => {
            mockWhich.mockResolvedValue('C:\\Program Files\\Azure CLI\\az.cmd');
            
            await cleanupAzCLIAccounts();
            
            expect(mockExec).toHaveBeenCalledWith('"C:\\Program Files\\Azure CLI\\az.cmd"', ['account', 'clear']);
        });

        test('should handle Unix-style paths', async () => {
            mockWhich.mockResolvedValue('/usr/local/bin/az');
            
            await cleanupAzCLIAccounts();
            
            expect(mockExec).toHaveBeenCalledWith('"/usr/local/bin/az"', ['account', 'clear']);
        });

        test('should use required flag for which to ensure az exists', async () => {
            await cleanupAzCLIAccounts();
            
            expect(mockWhich).toHaveBeenCalledWith('az', true);
        });
    });

    describe('cleanupAzPSAccounts', () => {
        let mockWhich: jest.SpyInstance;
        let mockExec: jest.SpyInstance;
        let mockDebug: jest.SpyInstance;
        let mockInfo: jest.SpyInstance;
        let mockSetPSModulePath: jest.SpyInstance;
        let mockImportLatestAzAccounts: jest.SpyInstance;

        beforeEach(() => {
            mockWhich = jest.spyOn(io, 'which');
            mockExec = jest.spyOn(exec, 'exec');
            mockDebug = jest.spyOn(core, 'debug');
            mockInfo = jest.spyOn(core, 'info');
            mockSetPSModulePath = jest.spyOn(AzPSUtils, 'setPSModulePathForGitHubRunner');
            mockImportLatestAzAccounts = jest.spyOn(AzPSUtils, 'importLatestAzAccounts');
            
            mockWhich.mockResolvedValue('/usr/bin/pwsh');
            mockExec.mockResolvedValue(0);
            mockSetPSModulePath.mockImplementation(() => {});
            mockImportLatestAzAccounts.mockResolvedValue();
        });

        test('should locate PowerShell executable', async () => {
            await cleanupAzPSAccounts();
            
            expect(mockWhich).toHaveBeenCalledWith(AzPSConstants.PowerShell_CmdName, true);
        });

        test('should log PowerShell path', async () => {
            mockWhich.mockResolvedValue('/custom/path/pwsh');
            
            await cleanupAzPSAccounts();
            
            expect(mockDebug).toHaveBeenCalledWith('PowerShell path: /custom/path/pwsh');
        });

        test('should set PS module path for GitHub runner', async () => {
            await cleanupAzPSAccounts();
            
            expect(mockSetPSModulePath).toHaveBeenCalledTimes(1);
        });

        test('should import latest Az.Accounts module', async () => {
            await cleanupAzPSAccounts();
            
            expect(mockImportLatestAzAccounts).toHaveBeenCalledTimes(1);
        });

        test('should log module import debug message', async () => {
            await cleanupAzPSAccounts();
            
            expect(mockDebug).toHaveBeenCalledWith('Importing Azure PowerShell module.');
        });

        test('should log informational message about cleanup', async () => {
            await cleanupAzPSAccounts();
            
            expect(mockInfo).toHaveBeenCalledWith('Clearing azure powershell accounts from the local cache.');
        });

        test('should execute Clear-AzContext for Process scope', async () => {
            await cleanupAzPSAccounts();
            
            expect(mockExec).toHaveBeenCalledWith(
                '"/usr/bin/pwsh"',
                ['-Command', 'Clear-AzContext', '-Scope', 'Process']
            );
        });

        test('should execute Clear-AzContext for CurrentUser scope with Force', async () => {
            await cleanupAzPSAccounts();
            
            expect(mockExec).toHaveBeenCalledWith(
                '"/usr/bin/pwsh"',
                ['-Command', 'Clear-AzContext', '-Scope', 'CurrentUser', '-Force', '-ErrorAction', 'SilentlyContinue']
            );
        });

        test('should execute cleanup in correct sequence', async () => {
            const executionOrder: string[] = [];
            
            mockSetPSModulePath.mockImplementation(() => executionOrder.push('setPSModulePath'));
            mockImportLatestAzAccounts.mockImplementation(async () => executionOrder.push('importAzAccounts'));
            mockExec.mockImplementation(async (cmd, args) => {
                if (args && args.includes('Process')) {
                    executionOrder.push('clearProcess');
                } else if (args && args.includes('CurrentUser')) {
                    executionOrder.push('clearCurrentUser');
                }
                return 0;
            });
            
            await cleanupAzPSAccounts();
            
            expect(executionOrder).toEqual([
                'setPSModulePath',
                'importAzAccounts',
                'clearProcess',
                'clearCurrentUser'
            ]);
        });

        test('should throw error if PowerShell not found', async () => {
            mockWhich.mockRejectedValue(new Error('pwsh not found'));
            
            await expect(cleanupAzPSAccounts()).rejects.toThrow('pwsh not found');
        });

        test('should propagate errors from module import', async () => {
            mockImportLatestAzAccounts.mockRejectedValue(new Error('Import failed'));
            
            await expect(cleanupAzPSAccounts()).rejects.toThrow('Import failed');
        });

        test('should propagate errors from Clear-AzContext commands', async () => {
            mockExec.mockRejectedValueOnce(new Error('Clear failed'));
            
            await expect(cleanupAzPSAccounts()).rejects.toThrow('Clear failed');
        });

        test('should handle Windows PowerShell paths', async () => {
            mockWhich.mockResolvedValue('C:\\Program Files\\PowerShell\\7\\pwsh.exe');
            
            await cleanupAzPSAccounts();
            
            expect(mockExec).toHaveBeenCalledWith(
                '"C:\\Program Files\\PowerShell\\7\\pwsh.exe"',
                expect.any(Array)
            );
        });

        test('should quote PowerShell path to handle spaces', async () => {
            mockWhich.mockResolvedValue('/path with spaces/pwsh');
            
            await cleanupAzPSAccounts();
            
            expect(mockExec).toHaveBeenCalledWith(
                '"/path with spaces/pwsh"',
                expect.any(Array)
            );
        });

        test('should use SilentlyContinue for CurrentUser scope to prevent errors', async () => {
            await cleanupAzPSAccounts();
            
            const currentUserCall = (mockExec as jest.Mock).mock.calls.find(
                call => call[1] && call[1].includes('CurrentUser')
            );
            
            expect(currentUserCall).toBeDefined();
            expect(currentUserCall![1]).toContain('-ErrorAction');
            expect(currentUserCall![1]).toContain('SilentlyContinue');
        });

        test('should use Force flag for CurrentUser scope', async () => {
            await cleanupAzPSAccounts();
            
            const currentUserCall = (mockExec as jest.Mock).mock.calls.find(
                call => call[1] && call[1].includes('CurrentUser')
            );
            
            expect(currentUserCall![1]).toContain('-Force');
        });
    });

    describe('Integration Tests', () => {
        test('setUserAgent should not interfere with cleanup functions', async () => {
            const mockWhich = jest.spyOn(io, 'which').mockResolvedValue('/usr/bin/az');
            const mockExec = jest.spyOn(exec, 'exec').mockResolvedValue(0);
            
            process.env.GITHUB_REPOSITORY = 'test/repo';
            process.env.RUNNER_ENVIRONMENT = 'test';
            process.env.GITHUB_RUN_ID = '123';
            
            setUserAgent();
            await cleanupAzCLIAccounts();
            
            expect(process.env.AZURE_HTTP_USER_AGENT).toBeDefined();
            expect(mockExec).toHaveBeenCalled();
        });

        test('multiple cleanup calls should work independently', async () => {
            const mockWhich = jest.spyOn(io, 'which').mockResolvedValue('/usr/bin/az');
            const mockExec = jest.spyOn(exec, 'exec').mockResolvedValue(0);
            
            await cleanupAzCLIAccounts();
            await cleanupAzCLIAccounts();
            
            expect(mockExec).toHaveBeenCalledTimes(2);
        });
    });
});