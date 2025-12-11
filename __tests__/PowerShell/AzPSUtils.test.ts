import * as core from '@actions/core';
import * as os from 'os';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import { AzPSConstants, AzPSUtils } from '../../src/PowerShell/AzPSUtils';
import AzPSScriptBuilder from '../../src/PowerShell/AzPSScriptBuilder';

// Mock dependencies
jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('@actions/io');
jest.mock('../../src/PowerShell/AzPSScriptBuilder');

describe('AzPSUtils.ts - PowerShell Utility Functions', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let mockExec: jest.SpyInstance;
    let mockWhich: jest.SpyInstance;
    let mockWarning: jest.SpyInstance;
    let mockDebug: jest.SpyInstance;
    let mockError: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        originalEnv = { ...process.env };
        
        mockExec = jest.spyOn(exec, 'exec');
        mockWhich = jest.spyOn(io, 'which');
        mockWarning = jest.spyOn(core, 'warning');
        mockDebug = jest.spyOn(core, 'debug');
        mockError = jest.spyOn(core, 'error');
        
        mockWhich.mockResolvedValue('/usr/bin/pwsh');
        mockExec.mockResolvedValue(0);
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    describe('AzPSConstants', () => {
        test('should have correct default paths for Linux', () => {
            expect(AzPSConstants.DEFAULT_AZ_PATH_ON_LINUX).toBe('/usr/share');
        });

        test('should have correct default paths for Windows', () => {
            expect(AzPSConstants.DEFAULT_AZ_PATH_ON_WINDOWS).toBe('C:\\Modules');
        });

        test('should define Az.Accounts constant', () => {
            expect(AzPSConstants.AzAccounts).toBe('Az.Accounts');
        });

        test('should define PowerShell command name', () => {
            expect(AzPSConstants.PowerShell_CmdName).toBe('pwsh');
        });
    });

    describe('setPSModulePathForGitHubRunner', () => {
        test('should set PSModulePath for Linux runner', () => {
            process.env.RUNNER_OS = 'Linux';
            delete process.env.PSModulePath;
            
            AzPSUtils.setPSModulePathForGitHubRunner();
            
            expect(process.env.PSModulePath).toContain(AzPSConstants.DEFAULT_AZ_PATH_ON_LINUX);
        });

        test('should set PSModulePath for Windows runner', () => {
            process.env.RUNNER_OS = 'Windows';
            delete process.env.PSModulePath;
            
            AzPSUtils.setPSModulePathForGitHubRunner();
            
            expect(process.env.PSModulePath).toContain(AzPSConstants.DEFAULT_AZ_PATH_ON_WINDOWS);
        });

        test('should set PSModulePath for Windows_NT OS type', () => {
            delete process.env.RUNNER_OS;
            jest.spyOn(os, 'type').mockReturnValue('Windows_NT');
            delete process.env.PSModulePath;
            
            AzPSUtils.setPSModulePathForGitHubRunner();
            
            expect(process.env.PSModulePath).toContain(AzPSConstants.DEFAULT_AZ_PATH_ON_WINDOWS);
        });

        test('should skip setting path for macOS with warning', () => {
            process.env.RUNNER_OS = 'macOS';
            const originalPath = process.env.PSModulePath;
            
            AzPSUtils.setPSModulePathForGitHubRunner();
            
            expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('Skip setting the default PowerShell module path for OS macos'));
            expect(process.env.PSModulePath).toBe(originalPath);
        });

        test('should skip setting path for Darwin OS type with warning', () => {
            delete process.env.RUNNER_OS;
            jest.spyOn(os, 'type').mockReturnValue('Darwin');
            
            AzPSUtils.setPSModulePathForGitHubRunner();
            
            expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('Skip setting the default PowerShell module path for OS darwin'));
        });

        test('should skip setting path for unknown OS with warning', () => {
            process.env.RUNNER_OS = 'UnknownOS';
            
            AzPSUtils.setPSModulePathForGitHubRunner();
            
            expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('Skip setting the default PowerShell module path for unknown OS unknownos'));
        });

        test('should append to existing PSModulePath on Linux', () => {
            process.env.RUNNER_OS = 'Linux';
            process.env.PSModulePath = '/existing/path';
            
            AzPSUtils.setPSModulePathForGitHubRunner();
            
            expect(process.env.PSModulePath).toContain('/existing/path');
            expect(process.env.PSModulePath).toContain(AzPSConstants.DEFAULT_AZ_PATH_ON_LINUX);
        });

        test('should append to existing PSModulePath on Windows', () => {
            process.env.RUNNER_OS = 'Windows';
            process.env.PSModulePath = 'C:\\Existing\\Path';
            
            AzPSUtils.setPSModulePathForGitHubRunner();
            
            expect(process.env.PSModulePath).toContain('C:\\Existing\\Path');
            expect(process.env.PSModulePath).toContain(AzPSConstants.DEFAULT_AZ_PATH_ON_WINDOWS);
        });

        test('should prepend path to PSModulePath (not append)', () => {
            process.env.RUNNER_OS = 'Linux';
            process.env.PSModulePath = '/existing/path';
            
            AzPSUtils.setPSModulePathForGitHubRunner();
            
            expect(process.env.PSModulePath).toMatch(/^\/usr\/share/);
        });

        test('should use correct path delimiter', () => {
            process.env.RUNNER_OS = 'Linux';
            process.env.PSModulePath = '/existing/path';
            
            AzPSUtils.setPSModulePathForGitHubRunner();
            
            // Should use system path delimiter
            expect(process.env.PSModulePath).toContain(':');
        });

        test('should log debug message with new PSModulePath', () => {
            process.env.RUNNER_OS = 'Linux';
            
            AzPSUtils.setPSModulePathForGitHubRunner();
            
            expect(mockDebug).toHaveBeenCalledWith(expect.stringContaining('Set PSModulePath as'));
        });

        test('should handle case-insensitive OS comparison', () => {
            process.env.RUNNER_OS = 'LINUX';
            
            AzPSUtils.setPSModulePathForGitHubRunner();
            
            expect(process.env.PSModulePath).toContain(AzPSConstants.DEFAULT_AZ_PATH_ON_LINUX);
        });

        test('should handle mixed case Windows', () => {
            process.env.RUNNER_OS = 'WiNdOwS';
            
            AzPSUtils.setPSModulePathForGitHubRunner();
            
            expect(process.env.PSModulePath).toContain(AzPSConstants.DEFAULT_AZ_PATH_ON_WINDOWS);
        });
    });

    describe('importLatestAzAccounts', () => {
        let mockGetImportLatestModuleScript: jest.SpyInstance;

        beforeEach(() => {
            mockGetImportLatestModuleScript = jest.spyOn(AzPSScriptBuilder, 'getImportLatestModuleScript');
            mockGetImportLatestModuleScript.mockReturnValue('Import-Module Az.Accounts');
            
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from(JSON.stringify({
                        Success: true,
                        Result: '/path/to/Az.Accounts/Az.Accounts.psd1'
                    })));
                }
                return 0;
            });
        });

        test('should call getImportLatestModuleScript with Az.Accounts', async () => {
            await AzPSUtils.importLatestAzAccounts();
            
            expect(mockGetImportLatestModuleScript).toHaveBeenCalledWith(AzPSConstants.AzAccounts);
        });

        test('should execute import script via runPSScript', async () => {
            await AzPSUtils.importLatestAzAccounts();
            
            expect(mockExec).toHaveBeenCalled();
        });

        test('should log import script in debug', async () => {
            await AzPSUtils.importLatestAzAccounts();
            
            expect(mockDebug).toHaveBeenCalledWith(expect.stringContaining('The script to import the latest Az.Accounts'));
        });

        test('should log imported Az.Accounts path in debug', async () => {
            await AzPSUtils.importLatestAzAccounts();
            
            expect(mockDebug).toHaveBeenCalledWith(expect.stringContaining('The latest Az.Accounts used: /path/to/Az.Accounts/Az.Accounts.psd1'));
        });

        test('should return module path', async () => {
            const result = await AzPSUtils.importLatestAzAccounts();
            
            expect(result).toBe('/path/to/Az.Accounts/Az.Accounts.psd1');
        });

        test('should throw error if import fails', async () => {
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from(JSON.stringify({
                        Success: false,
                        Error: 'Module not found'
                    })));
                }
                return 0;
            });
            
            await expect(AzPSUtils.importLatestAzAccounts()).rejects.toThrow('Module not found');
        });
    });

    describe('runPSScript', () => {
        test('should locate PowerShell executable', async () => {
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from(JSON.stringify({ Success: true, Result: 'test' })));
                }
                return 0;
            });
            
            await AzPSUtils.runPSScript('Write-Output "test"');
            
            expect(mockWhich).toHaveBeenCalledWith(AzPSConstants.PowerShell_CmdName, true);
        });

        test('should execute PowerShell script with correct arguments', async () => {
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from(JSON.stringify({ Success: true, Result: 'test' })));
                }
                return 0;
            });
            
            const testScript = 'Write-Output "Hello"';
            await AzPSUtils.runPSScript(testScript);
            
            expect(mockExec).toHaveBeenCalledWith(
                '"/usr/bin/pwsh"',
                ['-Command', testScript],
                expect.any(Object)
            );
        });

        test('should capture stdout output', async () => {
            const testOutput = { Success: true, Result: 'Test Result' };
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from(JSON.stringify(testOutput)));
                }
                return 0;
            });
            
            const result = await AzPSUtils.runPSScript('Test-Script');
            
            expect(result).toBe('Test Result');
        });

        test('should capture and log stderr output', async () => {
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stderr) {
                    options.listeners.stderr(Buffer.from('Error message'));
                }
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from(JSON.stringify({ Success: false, Error: 'Failed' })));
                }
                return 0;
            });
            
            await expect(AzPSUtils.runPSScript('Test-Script')).rejects.toThrow();
            expect(mockError).toHaveBeenCalledWith('Error message');
        });

        test('should throw error if stderr has content', async () => {
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stderr) {
                    options.listeners.stderr(Buffer.from('Error occurred'));
                }
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from(JSON.stringify({ Success: true, Result: 'test' })));
                }
                return 0;
            });
            
            await expect(AzPSUtils.runPSScript('Test-Script')).rejects.toThrow('Azure PowerShell login failed with errors.');
        });

        test('should ignore empty stderr output', async () => {
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stderr) {
                    options.listeners.stderr(Buffer.from(''));
                }
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from(JSON.stringify({ Success: true, Result: 'test' })));
                }
                return 0;
            });
            
            await expect(AzPSUtils.runPSScript('Test-Script')).resolves.toBe('test');
        });

        test('should ignore whitespace-only stderr output', async () => {
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stderr) {
                    options.listeners.stderr(Buffer.from('   \n  '));
                }
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from(JSON.stringify({ Success: true, Result: 'test' })));
                }
                return 0;
            });
            
            await expect(AzPSUtils.runPSScript('Test-Script')).resolves.toBe('test');
        });

        test('should parse JSON output correctly', async () => {
            const testResult = { Success: true, Result: 'Complex\nMultiline\nResult' };
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from(JSON.stringify(testResult)));
                }
                return 0;
            });
            
            const result = await AzPSUtils.runPSScript('Test-Script');
            
            expect(result).toBe('Complex\nMultiline\nResult');
        });

        test('should throw error if Success is false', async () => {
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from(JSON.stringify({
                        Success: false,
                        Error: 'PowerShell execution failed'
                    })));
                }
                return 0;
            });
            
            await expect(AzPSUtils.runPSScript('Test-Script')).rejects.toThrow('Azure PowerShell login failed with error: PowerShell execution failed');
        });

        test('should handle malformed JSON output', async () => {
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from('Not valid JSON'));
                }
                return 0;
            });
            
            await expect(AzPSUtils.runPSScript('Test-Script')).rejects.toThrow();
        });

        test('should trim output before parsing', async () => {
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from('\n  {"Success":true,"Result":"test"}  \n'));
                }
                return 0;
            });
            
            const result = await AzPSUtils.runPSScript('Test-Script');
            
            expect(result).toBe('test');
        });

        test('should concatenate multiple stdout chunks', async () => {
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from('{"Success":'));
                    options.listeners.stdout(Buffer.from('true,'));
                    options.listeners.stdout(Buffer.from('"Result":"test"}'));
                }
                return 0;
            });
            
            const result = await AzPSUtils.runPSScript('Test-Script');
            
            expect(result).toBe('test');
        });

        test('should handle PowerShell not found error', async () => {
            mockWhich.mockRejectedValue(new Error('pwsh not found'));
            
            await expect(AzPSUtils.runPSScript('Test-Script')).rejects.toThrow('pwsh not found');
        });

        test('should use silent execution mode', async () => {
            mockExec.mockImplementation(async (cmd, args, options) => {
                expect(options?.silent).toBe(true);
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from(JSON.stringify({ Success: true, Result: 'test' })));
                }
                return 0;
            });
            
            await AzPSUtils.runPSScript('Test-Script');
        });

        test('should quote PowerShell path with spaces', async () => {
            mockWhich.mockResolvedValue('/path with spaces/pwsh');
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from(JSON.stringify({ Success: true, Result: 'test' })));
                }
                return 0;
            });
            
            await AzPSUtils.runPSScript('Test-Script');
            
            expect(mockExec).toHaveBeenCalledWith('"/path with spaces/pwsh"', expect.any(Array), expect.any(Object));
        });

        test('should log result object to console', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from(JSON.stringify({ Success: true, Result: 'test' })));
                }
                return 0;
            });
            
            await AzPSUtils.runPSScript('Test-Script');
            
            expect(consoleSpy).toHaveBeenCalledWith({ Success: true, Result: 'test' });
            
            consoleSpy.mockRestore();
        });
    });

    describe('Edge Cases and Integration', () => {
        test('should handle rapid successive calls to setPSModulePathForGitHubRunner', () => {
            process.env.RUNNER_OS = 'Linux';
            
            AzPSUtils.setPSModulePathForGitHubRunner();
            AzPSUtils.setPSModulePathForGitHubRunner();
            AzPSUtils.setPSModulePathForGitHubRunner();
            
            // Path should be added multiple times
            const pathParts = process.env.PSModulePath?.split(':') || [];
            const linuxPaths = pathParts.filter(p => p === AzPSConstants.DEFAULT_AZ_PATH_ON_LINUX);
            expect(linuxPaths.length).toBeGreaterThan(1);
        });

        test('should handle undefined RUNNER_OS and os.type()', () => {
            delete process.env.RUNNER_OS;
            jest.spyOn(os, 'type').mockReturnValue('' as any);
            
            AzPSUtils.setPSModulePathForGitHubRunner();
            
            expect(mockWarning).toHaveBeenCalled();
        });

        test('should successfully chain importLatestAzAccounts and runPSScript', async () => {
            jest.spyOn(AzPSScriptBuilder, 'getImportLatestModuleScript').mockReturnValue('Import-Module');
            
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stdout) {
                    options.listeners.stdout(Buffer.from(JSON.stringify({
                        Success: true,
                        Result: '/module/path'
                    })));
                }
                return 0;
            });
            
            const path = await AzPSUtils.importLatestAzAccounts();
            expect(path).toBe('/module/path');
            
            const result = await AzPSUtils.runPSScript('Test-Command');
            expect(result).toBe('/module/path');
        });
    });
});