import { AzureCliLogin } from '../../src/Cli/AzureCliLogin';
import { LoginConfig } from '../../src/common/LoginConfig';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';

jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('@actions/io');

describe('AzureCliLogin', () => {
    let mockLoginConfig: LoginConfig;
    let azureCliLogin: AzureCliLogin;

    beforeEach(() => {
        jest.clearAllMocks();
        mockLoginConfig = new LoginConfig();
        mockLoginConfig.environment = 'azurecloud';
        mockLoginConfig.servicePrincipalId = 'test-sp-id';
        mockLoginConfig.servicePrincipalSecret = 'test-sp-secret';
        mockLoginConfig.tenantId = 'test-tenant-id';
        mockLoginConfig.subscriptionId = 'test-subscription-id';
        mockLoginConfig.authType = LoginConfig.AUTH_TYPE_SERVICE_PRINCIPAL;
        mockLoginConfig.allowNoSubscriptionsLogin = false;

        (io.which as jest.Mock).mockResolvedValue('/usr/bin/az');
        azureCliLogin = new AzureCliLogin(mockLoginConfig);
    });

    describe('Constructor', () => {
        test('should create AzureCliLogin instance with loginConfig', () => {
            expect(azureCliLogin.loginConfig).toBe(mockLoginConfig);
            expect(azureCliLogin.loginOptions).toBeDefined();
        });
    });

    describe('login()', () => {
        test('should successfully login with service principal', async () => {
            const versionOutput = JSON.stringify({ "azure-cli": "2.45.0" });
            (exec.exec as jest.Mock)
                .mockImplementationOnce((cmd, args, options) => {
                    if (args[0] === 'version') {
                        options.listeners.stdout(Buffer.from(versionOutput));
                    }
                    return Promise.resolve(0);
                })
                .mockResolvedValue(0);

            await azureCliLogin.login();

            expect(core.info).toHaveBeenCalledWith('Running Azure CLI Login.');
            expect(io.which).toHaveBeenCalledWith('az', true);
        });
    });

    describe('registerAzurestackEnvIfNecessary()', () => {
        test('should return early if environment is not azurestack', async () => {
            mockLoginConfig.environment = 'azurecloud';
            azureCliLogin = new AzureCliLogin(mockLoginConfig);

            await azureCliLogin.registerAzurestackEnvIfNecessary();

            expect(exec.exec).not.toHaveBeenCalled();
        });

        test('should throw error if azurestack lacks resourceManagerEndpointUrl', async () => {
            mockLoginConfig.environment = 'azurestack';
            mockLoginConfig.resourceManagerEndpointUrl = '';
            azureCliLogin = new AzureCliLogin(mockLoginConfig);
            azureCliLogin.azPath = '/usr/bin/az';

            await expect(azureCliLogin.registerAzurestackEnvIfNecessary())
                .rejects
                .toThrow('resourceManagerEndpointUrl is a required parameter');
        });
    });
});