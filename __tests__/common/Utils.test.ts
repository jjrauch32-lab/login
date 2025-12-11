import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import { setUserAgent, cleanupAzCLIAccounts, cleanupAzPSAccounts } from '../../src/common/Utils';
import { AzPSUtils } from '../../src/PowerShell/AzPSUtils';

jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('@actions/io');
jest.mock('../../src/PowerShell/AzPSUtils');

describe('Utils', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        jest.clearAllMocks();
        originalEnv = { ...process.env };
        process.env = {
            ...originalEnv,
            GITHUB_REPOSITORY: 'test-org/test-repo',
            RUNNER_ENVIRONMENT: 'github-hosted',
            GITHUB_RUN_ID: '12345'
        };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('setUserAgent()', () => {
        test('should set AZURE_HTTP_USER_AGENT with repository hash', () => {
            setUserAgent();

            expect(process.env.AZURE_HTTP_USER_AGENT).toBeDefined();
            expect(process.env.AZURE_HTTP_USER_AGENT).toContain('GITHUBACTIONS/AzureLogin@v2');
        });

        test('should create consistent hash for same repository', () => {
            setUserAgent();
            const firstAgent = process.env.AZURE_HTTP_USER_AGENT;

            process.env.AZURE_HTTP_USER_AGENT = '';
            setUserAgent();
            const secondAgent = process.env.AZURE_HTTP_USER_AGENT;

            expect(firstAgent).toBe(secondAgent);
        });
    });

    describe('cleanupAzCLIAccounts()', () => {
        beforeEach(() => {
            (io.which as jest.Mock).mockResolvedValue('/usr/bin/az');
            (exec.exec as jest.Mock).mockResolvedValue(0);
        });

        test('should execute az account clear command', async () => {
            await cleanupAzCLIAccounts();

            expect(exec.exec).toHaveBeenCalledWith(
                '"/usr/bin/az"',
                ['account', 'clear']
            );
        });

        test('should handle az CLI not found error', async () => {
            (io.which as jest.Mock).mockRejectedValue(new Error('az not found'));

            await expect(cleanupAzCLIAccounts()).rejects.toThrow('az not found');
        });
    });

    describe('cleanupAzPSAccounts()', () => {
        beforeEach(() => {
            (io.which as jest.Mock).mockResolvedValue('/usr/bin/pwsh');
            (exec.exec as jest.Mock).mockResolvedValue(0);
            (AzPSUtils.setPSModulePathForGitHubRunner as jest.Mock).mockReturnValue(undefined);
            (AzPSUtils.importLatestAzAccounts as jest.Mock).mockResolvedValue(undefined);
        });

        test('should execute Clear-AzContext for Process scope', async () => {
            await cleanupAzPSAccounts();

            expect(exec.exec).toHaveBeenCalledWith(
                '"/usr/bin/pwsh"',
                ['-Command', 'Clear-AzContext', '-Scope', 'Process']
            );
        });
    });
});