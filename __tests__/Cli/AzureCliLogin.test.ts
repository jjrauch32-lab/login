import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import { AzureCliLogin } from '../../src/Cli/AzureCliLogin';
import { LoginConfig } from '../../src/common/LoginConfig';

// Mock dependencies
jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('@actions/io');

describe('AzureCliLogin.ts - Azure CLI Login Functionality', () => {
    let mockExec: jest.SpyInstance;
    let mockWhich: jest.SpyInstance;
    let mockInfo: jest.SpyInstance;
    let mockDebug: jest.SpyInstance;
    let mockError: jest.SpyInstance;
    let mockWarning: jest.SpyInstance;
    let loginConfig: LoginConfig;
    let azureCliLogin: AzureCliLogin;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockExec = jest.spyOn(exec, 'exec');
        mockWhich = jest.spyOn(io, 'which');
        mockInfo = jest.spyOn(core, 'info');
        mockDebug = jest.spyOn(core, 'debug');
        mockError = jest.spyOn(core, 'error');
        mockWarning = jest.spyOn(core, 'warning');
        
        // Default mock implementations
        mockWhich.mockResolvedValue('/usr/bin/az');
        mockExec.mockResolvedValue(0);
        
        // Create basic login config
        loginConfig = new LoginConfig();
        loginConfig.environment = 'azurecloud';
        loginConfig.authType = LoginConfig.AUTH_TYPE_SERVICE_PRINCIPAL;
        loginConfig.servicePrincipalId = 'test-client-id';
        loginConfig.servicePrincipalSecret = 'test-secret';
        loginConfig.tenantId = 'test-tenant-id';
        loginConfig.subscriptionId = 'test-subscription-id';
        loginConfig.allowNoSubscriptionsLogin = false;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Constructor', () => {
        test('should initialize with login config', () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            expect(azureCliLogin.loginConfig).toBe(loginConfig);
            expect(azureCliLogin.loginOptions).toBeDefined();
        });

        test('should set up default exec options', () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            expect(azureCliLogin.loginOptions.silent).toBe(true);
            expect(azureCliLogin.loginOptions.listeners).toBeDefined();
        });
    });

    describe('login() - Main Entry Point', () => {
        test('should successfully login with service principal and secret', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            // Mock version output
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (args && args[0] === 'version') {
                    options?.listeners?.stdout?.(Buffer.from('{"azure-cli": "2.50.0"}'));
                }
                return 0;
            });
            
            await azureCliLogin.login();
            
            expect(mockInfo).toHaveBeenCalledWith('Running Azure CLI Login.');
            expect(mockWhich).toHaveBeenCalledWith('az', true);
            expect(mockExec).toHaveBeenCalled();
        });

        test('should locate Azure CLI binary', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            mockWhich.mockResolvedValue('/custom/path/az');
            
            await azureCliLogin.login();
            
            expect(azureCliLogin.azPath).toBe('/custom/path/az');
            expect(mockDebug).toHaveBeenCalledWith('Azure CLI path: /custom/path/az');
        });

        test('should retrieve and parse Azure CLI version', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (args && args[0] === 'version') {
                    options?.listeners?.stdout?.(Buffer.from('{"azure-cli": "2.45.0"}'));
                }
                return 0;
            });
            
            await azureCliLogin.login();
            
            expect(azureCliLogin.azVersion).toBe('2.45.0');
        });

        test('should handle version parsing failure gracefully', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (args && args[0] === 'version') {
                    options?.listeners?.stdout?.(Buffer.from('invalid json'));
                }
                return 0;
            });
            
            await azureCliLogin.login();
            
            expect(mockWarning).toHaveBeenCalledWith('Failed to parse Azure CLI version.');
        });

        test('should set cloud to specified environment', async () => {
            loginConfig.environment = 'azureusgovernment';
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await azureCliLogin.login();
            
            expect(mockExec).toHaveBeenCalledWith(
                expect.any(String),
                ['cloud', 'set', '-n', 'azureusgovernment'],
                expect.any(Object)
            );
            expect(mockInfo).toHaveBeenCalledWith('Done setting cloud: "azureusgovernment"');
        });
    });

    describe('Service Principal Authentication', () => {
        test('should login with service principal secret', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await azureCliLogin.login();
            
            expect(mockExec).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([
                    'login',
                    '--service-principal',
                    '--username', 'test-client-id',
                    '--tenant', 'test-tenant-id',
                    expect.stringContaining('--password=')
                ]),
                expect.any(Object)
            );
        });

        test('should login with OIDC when no secret provided', async () => {
            loginConfig.servicePrincipalSecret = null;
            loginConfig.getFederatedToken = jest.fn().mockResolvedValue(undefined);
            loginConfig.federatedToken = 'test-federated-token';
            
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await azureCliLogin.login();
            
            expect(loginConfig.getFederatedToken).toHaveBeenCalled();
            expect(mockExec).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([
                    'login',
                    '--service-principal',
                    '--username', 'test-client-id',
                    '--tenant', 'test-tenant-id',
                    '--federated-token', 'test-federated-token'
                ]),
                expect.any(Object)
            );
        });

        test('should show OIDC info message when using secret', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await azureCliLogin.login();
            
            expect(mockInfo).toHaveBeenCalledWith(expect.stringContaining('OIDC login mechanism'));
        });

        test('should set subscription after successful login', async () => {
            loginConfig.subscriptionId = 'my-subscription-id';
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await azureCliLogin.login();
            
            expect(mockExec).toHaveBeenCalledWith(
                expect.any(String),
                ['account', 'set', '--subscription', 'my-subscription-id'],
                expect.any(Object)
            );
            expect(mockInfo).toHaveBeenCalledWith('Subscription is set successfully.');
        });

        test('should skip subscription setting when no subscription ID', async () => {
            loginConfig.subscriptionId = '';
            loginConfig.allowNoSubscriptionsLogin = true;
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await azureCliLogin.login();
            
            const setSubscriptionCall = (mockExec as jest.Mock).mock.calls.find(
                call => call[1] && call[1][0] === 'account' && call[1][1] === 'set'
            );
            
            expect(setSubscriptionCall).toBeUndefined();
        });

        test('should add allow-no-subscriptions flag when enabled', async () => {
            loginConfig.allowNoSubscriptionsLogin = true;
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await azureCliLogin.login();
            
            expect(mockExec).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining(['--allow-no-subscriptions']),
                expect.any(Object)
            );
        });
    });

    describe('Managed Identity Authentication', () => {
        beforeEach(() => {
            loginConfig.authType = LoginConfig.AUTH_TYPE_IDENTITY;
            loginConfig.servicePrincipalSecret = null;
        });

        test('should login with system-assigned managed identity', async () => {
            loginConfig.servicePrincipalId = '';
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (args && args[0] === 'version') {
                    options?.listeners?.stdout?.(Buffer.from('{"azure-cli": "2.50.0"}'));
                }
                return 0;
            });
            
            await azureCliLogin.login();
            
            expect(mockExec).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining(['login', '--identity']),
                expect.any(Object)
            );
            expect(mockInfo).toHaveBeenCalledWith(expect.stringContaining('system-assigned managed identity'));
        });

        test('should login with user-assigned managed identity using --username for CLI < 2.69', async () => {
            loginConfig.servicePrincipalId = 'user-assigned-id';
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (args && args[0] === 'version') {
                    options?.listeners?.stdout?.(Buffer.from('{"azure-cli": "2.50.0"}'));
                }
                return 0;
            });
            
            await azureCliLogin.login();
            
            expect(mockExec).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining(['--username', 'user-assigned-id']),
                expect.any(Object)
            );
        });

        test('should login with user-assigned managed identity using --client-id for CLI >= 2.69', async () => {
            loginConfig.servicePrincipalId = 'user-assigned-id';
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (args && args[0] === 'version') {
                    options?.listeners?.stdout?.(Buffer.from('{"azure-cli": "2.69.0"}'));
                }
                return 0;
            });
            
            await azureCliLogin.login();
            
            expect(mockExec).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining(['--client-id', 'user-assigned-id']),
                expect.any(Object)
            );
        });

        test('should handle version parsing failure and default to --username', async () => {
            loginConfig.servicePrincipalId = 'user-assigned-id';
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (args && args[0] === 'version') {
                    options?.listeners?.stdout?.(Buffer.from('invalid'));
                }
                return 0;
            });
            
            await azureCliLogin.login();
            
            expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('Assuming the version is less than 2.69.0'));
            expect(mockExec).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining(['--username', 'user-assigned-id']),
                expect.any(Object)
            );
        });
    });

    describe('Azure Stack Environment', () => {
        beforeEach(() => {
            loginConfig.environment = 'azurestack';
            loginConfig.resourceManagerEndpointUrl = 'https://management.local.azurestack.external/';
        });

        test('should register Azure Stack environment', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await azureCliLogin.login();
            
            expect(mockExec).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining(['cloud', 'register', '-n', 'azurestack']),
                expect.any(Object)
            );
        });

        test('should unregister existing Azure Stack environment first', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await azureCliLogin.login();
            
            expect(mockExec).toHaveBeenCalledWith(
                expect.any(String),
                ['cloud', 'unregister', '-n', 'azurestack'],
                expect.any(Object)
            );
        });

        test('should throw error if resourceManagerEndpointUrl is missing', async () => {
            loginConfig.resourceManagerEndpointUrl = '';
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await expect(azureCliLogin.login()).rejects.toThrow(
                'resourceManagerEndpointUrl is a required parameter when environment is defined'
            );
        });

        test('should derive keyvault suffix from endpoint URL', async () => {
            loginConfig.resourceManagerEndpointUrl = 'https://management.region.domain.com/';
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await azureCliLogin.login();
            
            const registerCall = (mockExec as jest.Mock).mock.calls.find(
                call => call[1] && call[1].includes('register')
            );
            
            expect(registerCall).toBeDefined();
            expect(registerCall![1]).toContain('--suffix-keyvault-dns');
            expect(registerCall![1]).toContain('.vault.region.domain.com');
        });

        test('should derive storage suffix from endpoint URL', async () => {
            loginConfig.resourceManagerEndpointUrl = 'https://management.region.domain.com/';
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await azureCliLogin.login();
            
            const registerCall = (mockExec as jest.Mock).mock.calls.find(
                call => call[1] && call[1].includes('register')
            );
            
            expect(registerCall![1]).toContain('--suffix-storage-endpoint');
            expect(registerCall![1]).toContain('region.domain.com');
        });

        test('should remove trailing slash from endpoint URL', async () => {
            loginConfig.resourceManagerEndpointUrl = 'https://management.local.azurestack.external/';
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await azureCliLogin.login();
            
            const registerCall = (mockExec as jest.Mock).mock.calls.find(
                call => call[1] && call[1].includes('register')
            );
            
            expect(registerCall![1]).toContain('https://management.local.azurestack.external');
        });

        test('should use correct profile version for Azure Stack', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await azureCliLogin.login();
            
            const registerCall = (mockExec as jest.Mock).mock.calls.find(
                call => call[1] && call[1].includes('register')
            );
            
            expect(registerCall![1]).toContain('--profile');
            expect(registerCall![1]).toContain('2019-03-01-hybrid');
        });

        test('should handle registration errors gracefully', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            mockExec.mockImplementation(async (cmd, args) => {
                if (args && args.includes('register')) {
                    throw new Error('Registration failed');
                }
                return 0;
            });
            
            await expect(azureCliLogin.login()).rejects.toThrow('Registration failed');
            expect(mockError).toHaveBeenCalledWith(expect.stringContaining('Error while trying to register cloud'));
        });

        test('should ignore unregister errors', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            mockExec.mockImplementation(async (cmd, args) => {
                if (args && args.includes('unregister')) {
                    throw new Error('Cloud not registered');
                }
                if (args && args[0] === 'version') {
                    return 0;
                }
                return 0;
            });
            
            await azureCliLogin.login();
            
            expect(mockInfo).toHaveBeenCalledWith(expect.stringContaining('Ignore cloud not registered error'));
        });
    });

    describe('Error Handling in Listeners', () => {
        test('should capture and log stderr errors', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stderr) {
                    options.listeners.stderr(Buffer.from('ERROR: Something went wrong'));
                }
                return 0;
            });
            
            await azureCliLogin.login();
            
            expect(mockError).toHaveBeenCalledWith('Something went wrong');
        });

        test('should not log warnings as errors', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stderr) {
                    options.listeners.stderr(Buffer.from('WARNING: This is a warning'));
                }
                return 0;
            });
            
            await azureCliLogin.login();
            
            expect(mockError).not.toHaveBeenCalledWith(expect.stringContaining('WARNING'));
        });

        test('should strip ERROR prefix from error messages', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stderr) {
                    options.listeners.stderr(Buffer.from('ERROR: Duplicate error text'));
                }
                return 0;
            });
            
            await azureCliLogin.login();
            
            expect(mockError).toHaveBeenCalledWith('Duplicate error text');
        });

        test('should handle empty stderr output', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stderr) {
                    options.listeners.stderr(Buffer.from(''));
                }
                return 0;
            });
            
            await azureCliLogin.login();
            
            expect(mockError).not.toHaveBeenCalled();
        });

        test('should handle whitespace-only stderr output', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            mockExec.mockImplementation(async (cmd, args, options) => {
                if (options?.listeners?.stderr) {
                    options.listeners.stderr(Buffer.from('   \n  '));
                }
                return 0;
            });
            
            await azureCliLogin.login();
            
            expect(mockError).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        test('should handle special characters in passwords', async () => {
            loginConfig.servicePrincipalSecret = "p@ssw0rd!#$%^&*()";
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await azureCliLogin.login();
            
            expect(mockExec).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining([expect.stringContaining('--password=p@ssw0rd!#$%^&*()')]),
                expect.any(Object)
            );
        });

        test('should handle very long tenant IDs', async () => {
            loginConfig.tenantId = 'a'.repeat(100);
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await azureCliLogin.login();
            
            expect(mockExec).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining(['--tenant', 'a'.repeat(100)]),
                expect.any(Object)
            );
        });

        test('should handle URL with multiple slashes', async () => {
            loginConfig.environment = 'azurestack';
            loginConfig.resourceManagerEndpointUrl = 'https://management.local.com///';
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await azureCliLogin.login();
            
            // Should handle gracefully
            expect(mockExec).toHaveBeenCalled();
        });

        test('should handle missing az binary gracefully', async () => {
            mockWhich.mockRejectedValue(new Error('az not found in PATH'));
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await expect(azureCliLogin.login()).rejects.toThrow('az not found in PATH');
        });

        test('should handle exec failures during login', async () => {
            mockExec.mockRejectedValue(new Error('Login command failed'));
            azureCliLogin = new AzureCliLogin(loginConfig);
            
            await expect(azureCliLogin.login()).rejects.toThrow('Login command failed');
        });
    });

    describe('executeAzCliCommand', () => {
        test('should execute command with correct path and args', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            azureCliLogin.azPath = '/test/az';
            
            await azureCliLogin.executeAzCliCommand(['test', 'command'], false);
            
            expect(mockExec).toHaveBeenCalledWith('"/test/az"', ['test', 'command'], expect.any(Object));
        });

        test('should respect silent flag', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            azureCliLogin.azPath = '/test/az';
            
            await azureCliLogin.executeAzCliCommand(['test'], true);
            
            expect(mockExec).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Array),
                expect.objectContaining({ silent: true })
            );
        });

        test('should merge custom exec options', async () => {
            azureCliLogin = new AzureCliLogin(loginConfig);
            azureCliLogin.azPath = '/test/az';
            
            const customOptions = { cwd: '/custom/dir' };
            await azureCliLogin.executeAzCliCommand(['test'], false, customOptions);
            
            expect(mockExec).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Array),
                expect.objectContaining({ silent: false, cwd: '/custom/dir' })
            );
        });
    });
});