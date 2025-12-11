import * as core from '@actions/core';
import { cleanupAzCLIAccounts, cleanupAzPSAccounts, setUserAgent } from '../src/common/Utils';
import { AzPSLogin } from '../src/PowerShell/AzPSLogin';
import { LoginConfig } from '../src/common/LoginConfig';
import { AzureCliLogin } from '../src/Cli/AzureCliLogin';

jest.mock('@actions/core');
jest.mock('../src/common/Utils');
jest.mock('../src/PowerShell/AzPSLogin');
jest.mock('../src/common/LoginConfig');
jest.mock('../src/Cli/AzureCliLogin');

describe('Entry Points', () => {
    let mockLoginConfig: any;
    let mockAzureCliLogin: any;
    let mockAzPSLogin: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockLoginConfig = {
            initialize: jest.fn().mockResolvedValue(undefined),
            validate: jest.fn().mockReturnValue(undefined),
            enableAzPSSession: false
        };

        mockAzureCliLogin = {
            login: jest.fn().mockResolvedValue(undefined)
        };

        mockAzPSLogin = {
            login: jest.fn().mockResolvedValue(undefined)
        };

        (LoginConfig as jest.Mock).mockImplementation(() => mockLoginConfig);
        (AzureCliLogin as jest.Mock).mockImplementation(() => mockAzureCliLogin);
        (AzPSLogin as jest.Mock).mockImplementation(() => mockAzPSLogin);
        (core.getInput as jest.Mock).mockReturnValue('false');
        (setUserAgent as jest.Mock).mockReturnValue(undefined);
        (cleanupAzCLIAccounts as jest.Mock).mockResolvedValue(undefined);
        (cleanupAzPSAccounts as jest.Mock).mockResolvedValue(undefined);
    });

    describe('main.ts flow', () => {
        test('should execute login workflow successfully', async () => {
            await setUserAgent();
            const loginConfig = new LoginConfig();
            await loginConfig.initialize();
            await loginConfig.validate();
            const cliLogin = new AzureCliLogin(loginConfig);
            await cliLogin.login();

            expect(setUserAgent).toHaveBeenCalled();
            expect(mockLoginConfig.initialize).toHaveBeenCalled();
            expect(mockLoginConfig.validate).toHaveBeenCalled();
            expect(mockAzureCliLogin.login).toHaveBeenCalled();
        });

        test('should login to PowerShell when enableAzPSSession is true', async () => {
            mockLoginConfig.enableAzPSSession = true;

            await setUserAgent();
            const loginConfig = new LoginConfig();
            await loginConfig.initialize();
            const cliLogin = new AzureCliLogin(loginConfig);
            await cliLogin.login();

            if (loginConfig.enableAzPSSession) {
                const psLogin = new AzPSLogin(loginConfig);
                await psLogin.login();
            }

            expect(mockAzPSLogin.login).toHaveBeenCalled();
        });
    });

    describe('cleanup.ts flow', () => {
        test('should execute cleanup workflow successfully', async () => {
            await setUserAgent();
            await cleanupAzCLIAccounts();

            expect(setUserAgent).toHaveBeenCalled();
            expect(cleanupAzCLIAccounts).toHaveBeenCalled();
        });
    });
});