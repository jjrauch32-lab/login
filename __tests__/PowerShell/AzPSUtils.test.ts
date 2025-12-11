import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import { AzPSConstants, AzPSUtils } from '../../src/PowerShell/AzPSUtils';
import AzPSScriptBuilder from '../../src/PowerShell/AzPSScriptBuilder';

jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('@actions/io');
jest.mock('os');
jest.mock('../../src/PowerShell/AzPSScriptBuilder');

describe('AzPSUtils', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        jest.clearAllMocks();
        originalEnv = { ...process.env };
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('AzPSConstants', () => {
        test('should have correct default path for Linux', () => {
            expect(AzPSConstants.DEFAULT_AZ_PATH_ON_LINUX).toBe('/usr/share');
        });

        test('should have correct PowerShell command name', () => {
            expect(AzPSConstants.PowerShell_CmdName).toBe('pwsh');
        });
    });

    describe('setPSModulePathForGitHubRunner()', () => {
        test('should set PSModulePath for Linux runner', () => {
            process.env.RUNNER_OS = 'Linux';
            process.env.PSModulePath = '/existing/path';

            AzPSUtils.setPSModulePathForGitHubRunner();

            expect(process.env.PSModulePath).toContain(AzPSConstants.DEFAULT_AZ_PATH_ON_LINUX);
        });
    });

    describe('runPSScript()', () => {
        beforeEach(() => {
            (io.which as jest.Mock).mockResolvedValue('/usr/bin/pwsh');
        });

        test('should execute PowerShell script successfully', async () => {
            const mockOutput = JSON.stringify({ Success: true, Result: 'test-result' });
            (exec.exec as jest.Mock).mockImplementation((cmd, args, options) => {
                if (options && options.listeners && options.listeners.stdout) {
                    options.listeners.stdout(Buffer.from(mockOutput));
                }
                return Promise.resolve(0);
            });

            const result = await AzPSUtils.runPSScript('test-script');

            expect(result).toBe('test-result');
        });
    });
});