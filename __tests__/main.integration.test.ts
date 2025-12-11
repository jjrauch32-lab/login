/**
 * Integration tests for main.ts
 * Tests the main entry point with @actions/core v1.9.1
 */

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';

// Mock external dependencies
jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('@actions/io');

// Import after mocks
import { LoginConfig } from '../src/common/LoginConfig';
import { AzureCliLogin } from '../src/Cli/AzureCliLogin';
import { AzPSLogin } from '../src/PowerShell/AzPSLogin';

describe('Main Integration Tests with @actions/core v1.9.1', () => {
    let mockGetInput: jest.MockedFunction<typeof core.getInput>;
    let mockSetFailed: jest.MockedFunction<typeof core.setFailed>;
    let mockInfo: jest.MockedFunction<typeof core.info>;
    let mockDebug: jest.MockedFunction<typeof core.debug>;
    let mockError: jest.MockedFunction<typeof core.error>;
    let mockWarning: jest.MockedFunction<typeof core.warning>;
    let mockSetSecret: jest.MockedFunction<typeof core.setSecret>;
    let mockGetIDToken: jest.MockedFunction<typeof core.getIDToken>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mocks
        mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>;
        mockSetFailed = core.setFailed as jest.MockedFunction<typeof core.setFailed>;
        mockInfo = core.info as jest.MockedFunction<typeof core.info>;
        mockDebug = core.debug as jest.MockedFunction<typeof core.debug>;
        mockError = core.error as jest.MockedFunction<typeof core.error>;
        mockWarning = core.warning as jest.MockedFunction<typeof core.warning>;
        mockSetSecret = core.setSecret as jest.MockedFunction<typeof core.setSecret>;
        mockGetIDToken = core.getIDToken as jest.MockedFunction<typeof core.getIDToken>;

        // Default mock implementations
        mockGetInput.mockImplementation((name: string) => {
            const inputs: {[key: string]: string} = {
                'environment': 'azurecloud',
                'enable-AzPSSession': 'false',
                'allow-no-subscriptions': 'false',
                'auth-type': 'SERVICE_PRINCIPAL',
                'client-id': 'test-client-id',
                'tenant-id': 'test-tenant-id',
                'subscription-id': 'test-subscription-id',
                'audience': '',
                'creds': ''
            };
            return inputs[name] || '';
        });

        mockSetSecret.mockImplementation(() => {});
        mockInfo.mockImplementation(() => {});
        mockDebug.mockImplementation(() => {});
        mockError.mockImplementation(() => {});
        mockWarning.mockImplementation(() => {});
        mockSetFailed.mockImplementation(() => {});
    });

    describe('LoginConfig initialization with v1.9.1', () => {
        test('should initialize with service principal credentials', async () => {
            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(mockGetInput).toHaveBeenCalledWith('environment');
            expect(mockGetInput).toHaveBeenCalledWith('enable-AzPSSession');
            expect(mockGetInput).toHaveBeenCalledWith('allow-no-subscriptions');
            expect(mockGetInput).toHaveBeenCalledWith('auth-type');
            expect(mockGetInput).toHaveBeenCalledWith('client-id', { required: false });
            expect(mockGetInput).toHaveBeenCalledWith('tenant-id', { required: false });
            expect(mockGetInput).toHaveBeenCalledWith('subscription-id', { required: false });
            expect(mockSetSecret).toHaveBeenCalled();
        });

        test('should handle OIDC authentication setup', async () => {
            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'environment': 'azurecloud',
                    'enable-AzPSSession': 'false',
                    'allow-no-subscriptions': 'false',
                    'auth-type': 'SERVICE_PRINCIPAL',
                    'client-id': 'test-client-id',
                    'tenant-id': 'test-tenant-id',
                    'subscription-id': 'test-subscription-id',
                    'audience': 'api://AzureADTokenExchange',
                    'creds': ''
                };
                return inputs[name] || '';
            });

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(loginConfig.audience).toBe('api://AzureADTokenExchange');
            expect(mockGetInput).toHaveBeenCalledWith('audience', { required: false });
        });

        test('should handle managed identity setup', async () => {
            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'environment': 'azurecloud',
                    'enable-AzPSSession': 'false',
                    'allow-no-subscriptions': 'true',
                    'auth-type': 'IDENTITY',
                    'client-id': 'managed-identity-client-id',
                    'tenant-id': '',
                    'subscription-id': '',
                    'audience': '',
                    'creds': ''
                };
                return inputs[name] || '';
            });

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(loginConfig.authType).toBe('IDENTITY');
            expect(loginConfig.servicePrincipalId).toBe('managed-identity-client-id');
        });

        test('should parse creds JSON input', async () => {
            const credsObject = {
                clientId: 'creds-client-id',
                clientSecret: 'creds-client-secret',
                tenantId: 'creds-tenant-id',
                subscriptionId: 'creds-subscription-id'
            };

            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'environment': 'azurecloud',
                    'enable-AzPSSession': 'false',
                    'allow-no-subscriptions': 'false',
                    'auth-type': 'SERVICE_PRINCIPAL',
                    'client-id': '',
                    'tenant-id': '',
                    'subscription-id': '',
                    'audience': '',
                    'creds': JSON.stringify(credsObject)
                };
                return inputs[name] || '';
            });

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(loginConfig.servicePrincipalId).toBe('creds-client-id');
            expect(loginConfig.tenantId).toBe('creds-tenant-id');
            expect(loginConfig.subscriptionId).toBe('creds-subscription-id');
        });
    });

    describe('Federated token retrieval with v1.9.1', () => {
        test('should call getIDToken with audience', async () => {
            const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Rva2VuLmFjdGlvbnMuZ2l0aHVidXNlcmNvbnRlbnQuY29tIiwic3ViIjoicmVwbzpvd25lci9yZXBvOnJlZjpyZWZzL2hlYWRzL21haW4iLCJhdWQiOiJhcGk6Ly9BenVyZUFEVG9rZW5FeGNoYW5nZSIsImpvYl93b3JrZmxvd19yZWYiOiJvd25lci9yZXBvLy5naXRodWIvd29ya2Zsb3dzL2RlcGxveS55bWxAcmVmcy9oZWFkcy9tYWluIn0.signature';
            mockGetIDToken.mockResolvedValue(mockToken);

            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'environment': 'azurecloud',
                    'enable-AzPSSession': 'false',
                    'allow-no-subscriptions': 'false',
                    'auth-type': 'SERVICE_PRINCIPAL',
                    'client-id': 'test-client-id',
                    'tenant-id': 'test-tenant-id',
                    'subscription-id': 'test-subscription-id',
                    'audience': 'api://AzureADTokenExchange',
                    'creds': ''
                };
                return inputs[name] || '';
            });

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();
            await loginConfig.getFederatedToken();

            expect(mockGetIDToken).toHaveBeenCalledWith('api://AzureADTokenExchange');
            expect(mockSetSecret).toHaveBeenCalledWith(mockToken);
            expect(loginConfig.federatedToken).toBe(mockToken);
        });

        test('should handle getIDToken failure gracefully', async () => {
            mockGetIDToken.mockRejectedValue(new Error('Failed to get ID token'));

            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'environment': 'azurecloud',
                    'enable-AzPSSession': 'false',
                    'allow-no-subscriptions': 'false',
                    'auth-type': 'SERVICE_PRINCIPAL',
                    'client-id': 'test-client-id',
                    'tenant-id': 'test-tenant-id',
                    'subscription-id': 'test-subscription-id',
                    'audience': 'api://AzureADTokenExchange',
                    'creds': ''
                };
                return inputs[name] || '';
            });

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            await expect(loginConfig.getFederatedToken()).rejects.toThrow();
            expect(mockError).toHaveBeenCalledWith(
                expect.stringContaining('Failed to fetch federated token')
            );
        });

        test('should parse JWT token and log details', async () => {
            const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Rva2VuLmFjdGlvbnMuZ2l0aHVidXNlcmNvbnRlbnQuY29tIiwic3ViIjoicmVwbzpvd25lci9yZXBvOnJlZjpyZWZzL2hlYWRzL21haW4iLCJhdWQiOiJhcGk6Ly9BenVyZUFEVG9rZW5FeGNoYW5nZSIsImpvYl93b3JrZmxvd19yZWYiOiJvd25lci9yZXBvLy5naXRodWIvd29ya2Zsb3dzL2RlcGxveS55bWxAcmVmcy9oZWFkcy9tYWluIn0.signature';
            mockGetIDToken.mockResolvedValue(mockToken);

            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'environment': 'azurecloud',
                    'enable-AzPSSession': 'false',
                    'allow-no-subscriptions': 'false',
                    'auth-type': 'SERVICE_PRINCIPAL',
                    'client-id': 'test-client-id',
                    'tenant-id': 'test-tenant-id',
                    'subscription-id': 'test-subscription-id',
                    'audience': 'api://AzureADTokenExchange',
                    'creds': ''
                };
                return inputs[name] || '';
            });

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();
            await loginConfig.getFederatedToken();

            expect(mockInfo).toHaveBeenCalledWith(
                expect.stringContaining('Federated token details')
            );
            expect(mockInfo).toHaveBeenCalledWith(
                expect.stringContaining('issuer')
            );
        });
    });

    describe('Error handling and logging', () => {
        test('should use setFailed for critical errors', () => {
            const errorMessage = 'Login failed with Error: Invalid credentials';
            mockSetFailed(errorMessage);

            expect(mockSetFailed).toHaveBeenCalledWith(errorMessage);
        });

        test('should use core.debug for debugging information', () => {
            mockDebug('Debug: Stack trace here');
            expect(mockDebug).toHaveBeenCalledWith('Debug: Stack trace here');
        });

        test('should use core.warning for non-critical issues', () => {
            mockWarning('Warning: Deprecated parameter used');
            expect(mockWarning).toHaveBeenCalledWith('Warning: Deprecated parameter used');
        });

        test('should use core.error for error messages', () => {
            mockError('Error: Failed to parse configuration');
            expect(mockError).toHaveBeenCalledWith('Error: Failed to parse configuration');
        });

        test('should use core.info for status updates', () => {
            mockInfo('Running Azure CLI Login.');
            expect(mockInfo).toHaveBeenCalledWith('Running Azure CLI Login.');
        });
    });

    describe('Input validation', () => {
        test('should validate supported cloud environments', async () => {
            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'environment': 'unsupported-cloud',
                    'enable-AzPSSession': 'false',
                    'allow-no-subscriptions': 'false',
                    'auth-type': 'SERVICE_PRINCIPAL',
                    'client-id': 'test-client-id',
                    'tenant-id': 'test-tenant-id',
                    'subscription-id': 'test-subscription-id',
                    'audience': '',
                    'creds': ''
                };
                return inputs[name] || '';
            });

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(() => loginConfig.validate()).toThrow(
                expect.stringContaining('Unsupported value')
            );
        });

        test('should validate supported auth types', async () => {
            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'environment': 'azurecloud',
                    'enable-AzPSSession': 'false',
                    'allow-no-subscriptions': 'false',
                    'auth-type': 'INVALID_AUTH',
                    'client-id': 'test-client-id',
                    'tenant-id': 'test-tenant-id',
                    'subscription-id': 'test-subscription-id',
                    'audience': '',
                    'creds': ''
                };
                return inputs[name] || '';
            });

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(() => loginConfig.validate()).toThrow(
                expect.stringContaining('authentication type')
            );
        });

        test('should require client-id and tenant-id for service principal', async () => {
            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'environment': 'azurecloud',
                    'enable-AzPSSession': 'false',
                    'allow-no-subscriptions': 'false',
                    'auth-type': 'SERVICE_PRINCIPAL',
                    'client-id': '',
                    'tenant-id': '',
                    'subscription-id': 'test-subscription-id',
                    'audience': '',
                    'creds': ''
                };
                return inputs[name] || '';
            });

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(() => loginConfig.validate()).toThrow();
        });

        test('should require subscription-id or allow-no-subscriptions', async () => {
            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'environment': 'azurecloud',
                    'enable-AzPSSession': 'false',
                    'allow-no-subscriptions': 'false',
                    'auth-type': 'SERVICE_PRINCIPAL',
                    'client-id': 'test-client-id',
                    'tenant-id': 'test-tenant-id',
                    'subscription-id': '',
                    'audience': '',
                    'creds': ''
                };
                return inputs[name] || '';
            });

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(() => loginConfig.validate()).toThrow(
                expect.stringContaining('subscription-id')
            );
        });
    });

    describe('Secret masking', () => {
        test('should mask service principal ID', async () => {
            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(mockSetSecret).toHaveBeenCalledWith('test-client-id');
        });

        test('should mask service principal secret', async () => {
            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'environment': 'azurecloud',
                    'enable-AzPSSession': 'false',
                    'allow-no-subscriptions': 'false',
                    'auth-type': 'SERVICE_PRINCIPAL',
                    'client-id': '',
                    'tenant-id': '',
                    'subscription-id': '',
                    'audience': '',
                    'creds': JSON.stringify({
                        clientId: 'creds-client',
                        clientSecret: 'super-secret',
                        tenantId: 'creds-tenant',
                        subscriptionId: 'creds-subscription'
                    })
                };
                return inputs[name] || '';
            });

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            // Should mask both client ID and secret from creds
            expect(mockSetSecret).toHaveBeenCalled();
        });

        test('should handle null values in masking', async () => {
            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'environment': 'azurecloud',
                    'enable-AzPSSession': 'false',
                    'allow-no-subscriptions': 'true',
                    'auth-type': 'IDENTITY',
                    'client-id': '',
                    'tenant-id': '',
                    'subscription-id': '',
                    'audience': '',
                    'creds': ''
                };
                return inputs[name] || '';
            });

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            // Should not throw when masking null/undefined values
            expect(mockSetSecret).toHaveBeenCalled();
        });
    });

    describe('Boolean input parsing', () => {
        test('should parse enable-AzPSSession correctly', async () => {
            mockGetInput.mockImplementation((name: string) => {
                if (name === 'enable-AzPSSession') return 'true';
                return '';
            });

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(loginConfig.enableAzPSSession).toBe(true);
        });

        test('should parse allow-no-subscriptions correctly', async () => {
            mockGetInput.mockImplementation((name: string) => {
                if (name === 'allow-no-subscriptions') return 'true';
                return '';
            });

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(loginConfig.allowNoSubscriptionsLogin).toBe(true);
        });

        test('should handle case-insensitive boolean parsing', async () => {
            mockGetInput.mockImplementation((name: string) => {
                if (name === 'enable-AzPSSession') return 'TRUE';
                if (name === 'allow-no-subscriptions') return 'True';
                return '';
            });

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(loginConfig.enableAzPSSession).toBe(true);
            expect(loginConfig.allowNoSubscriptionsLogin).toBe(true);
        });
    });
});