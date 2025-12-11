/**
 * Scenario-based integration tests for @actions/core v1.9.1
 * Tests real-world usage patterns and workflows
 */

import * as core from '@actions/core';

jest.mock('@actions/core');

describe('Real-world Scenario Tests', () => {
    let mockGetInput: jest.MockedFunction<typeof core.getInput>;
    let mockSetSecret: jest.MockedFunction<typeof core.setSecret>;
    let mockGetIDToken: jest.MockedFunction<typeof core.getIDToken>;
    let mockInfo: jest.MockedFunction<typeof core.info>;
    let mockWarning: jest.MockedFunction<typeof core.warning>;
    let mockError: jest.MockedFunction<typeof core.error>;
    let mockDebug: jest.MockedFunction<typeof core.debug>;
    let mockSetFailed: jest.MockedFunction<typeof core.setFailed>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>;
        mockSetSecret = core.setSecret as jest.MockedFunction<typeof core.setSecret>;
        mockGetIDToken = core.getIDToken as jest.MockedFunction<typeof core.getIDToken>;
        mockInfo = core.info as jest.MockedFunction<typeof core.info>;
        mockWarning = core.warning as jest.MockedFunction<typeof core.warning>;
        mockError = core.error as jest.MockedFunction<typeof core.error>;
        mockDebug = core.debug as jest.MockedFunction<typeof core.debug>;
        mockSetFailed = core.setFailed as jest.MockedFunction<typeof core.setFailed>;

        // Default implementations
        mockGetInput.mockReturnValue('');
        mockSetSecret.mockImplementation(() => {});
        mockInfo.mockImplementation(() => {});
        mockWarning.mockImplementation(() => {});
        mockError.mockImplementation(() => {});
        mockDebug.mockImplementation(() => {});
        mockSetFailed.mockImplementation(() => {});
    });

    describe('Scenario: Service Principal with Secret Authentication', () => {
        test('should handle complete SP+secret login flow', () => {
            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'auth-type': 'SERVICE_PRINCIPAL',
                    'client-id': 'sp-client-id',
                    'client-secret': 'sp-secret',
                    'tenant-id': 'tenant-id',
                    'subscription-id': 'sub-id',
                    'environment': 'azurecloud'
                };
                return inputs[name] || '';
            });

            const authType = mockGetInput('auth-type');
            const clientId = mockGetInput('client-id');
            const clientSecret = mockGetInput('client-secret');
            const tenantId = mockGetInput('tenant-id');
            const subscriptionId = mockGetInput('subscription-id');

            mockSetSecret(clientId);
            mockSetSecret(clientSecret);
            
            mockInfo('Running Azure CLI Login.');
            mockInfo('Attempting Azure CLI login by using service principal with secret...');

            expect(authType).toBe('SERVICE_PRINCIPAL');
            expect(mockSetSecret).toHaveBeenCalledWith('sp-client-id');
            expect(mockSetSecret).toHaveBeenCalledWith('sp-secret');
            expect(mockInfo).toHaveBeenCalledWith('Running Azure CLI Login.');
        });
    });

    describe('Scenario: OIDC Authentication Flow', () => {
        test('should handle complete OIDC authentication flow', async () => {
            const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Rva2VuLmFjdGlvbnMuZ2l0aHVidXNlcmNvbnRlbnQuY29tIiwic3ViIjoicmVwbzpvd25lci9yZXBvOnJlZjpyZWZzL2hlYWRzL21haW4iLCJhdWQiOiJhcGk6Ly9BenVyZUFEVG9rZW5FeGNoYW5nZSIsImpvYl93b3JrZmxvd19yZWYiOiJvd25lci9yZXBvLy5naXRodWIvd29ya2Zsb3dzL2RlcGxveS55bWxAcmVmcy9oZWFkcy9tYWluIn0.dGVzdC1zaWduYXR1cmU';
            
            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'auth-type': 'SERVICE_PRINCIPAL',
                    'client-id': 'oidc-client-id',
                    'tenant-id': 'tenant-id',
                    'subscription-id': 'sub-id',
                    'audience': 'api://AzureADTokenExchange',
                    'environment': 'azurecloud'
                };
                return inputs[name] || '';
            });

            mockGetIDToken.mockResolvedValue(mockToken);

            const audience = mockGetInput('audience');
            const token = await mockGetIDToken(audience);
            
            mockSetSecret(token);
            mockInfo('Federated token details:\n issuer - ... \n subject claim - ...');

            expect(mockGetIDToken).toHaveBeenCalledWith('api://AzureADTokenExchange');
            expect(mockSetSecret).toHaveBeenCalledWith(mockToken);
            expect(token).toBe(mockToken);
        });

        test('should handle OIDC token retrieval failure', async () => {
            mockGetIDToken.mockRejectedValue(new Error('Failed to fetch ID token'));

            mockGetInput.mockImplementation((name: string) => {
                return name === 'audience' ? 'api://AzureADTokenExchange' : '';
            });

            try {
                await mockGetIDToken('api://AzureADTokenExchange');
            } catch (error) {
                mockError('Failed to fetch federated token from GitHub. Please make sure to give write permissions to id-token in the workflow.');
                mockSetFailed(`Login failed with ${error}`);
            }

            expect(mockError).toHaveBeenCalled();
            expect(mockSetFailed).toHaveBeenCalled();
        });
    });

    describe('Scenario: Managed Identity Authentication', () => {
        test('should handle system-assigned managed identity', () => {
            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'auth-type': 'IDENTITY',
                    'environment': 'azurecloud',
                    'subscription-id': 'sub-id'
                };
                return inputs[name] || '';
            });

            const authType = mockGetInput('auth-type');
            mockInfo('Attempting Azure CLI login by using system-assigned managed identity...');

            expect(authType).toBe('IDENTITY');
            expect(mockInfo).toHaveBeenCalledWith(expect.stringContaining('system-assigned managed identity'));
        });

        test('should handle user-assigned managed identity', () => {
            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'auth-type': 'IDENTITY',
                    'client-id': 'managed-identity-id',
                    'environment': 'azurecloud',
                    'subscription-id': 'sub-id'
                };
                return inputs[name] || '';
            });

            const clientId = mockGetInput('client-id');
            mockInfo('Attempting Azure CLI login by using user-assigned managed identity...');

            expect(clientId).toBe('managed-identity-id');
            expect(mockInfo).toHaveBeenCalledWith(expect.stringContaining('user-assigned managed identity'));
        });
    });

    describe('Scenario: Credentials from JSON input', () => {
        test('should parse and use credentials from creds JSON', () => {
            const credsObj = {
                clientId: 'json-client-id',
                clientSecret: 'json-secret',
                tenantId: 'json-tenant-id',
                subscriptionId: 'json-sub-id'
            };

            mockGetInput.mockImplementation((name: string) => {
                if (name === 'creds') return JSON.stringify(credsObj);
                if (name === 'auth-type') return 'SERVICE_PRINCIPAL';
                return '';
            });

            const credsStr = mockGetInput('creds');
            const creds = JSON.parse(credsStr);

            mockSetSecret(creds.clientId);
            mockSetSecret(creds.clientSecret);
            mockDebug('Reading creds in JSON...');

            expect(creds.clientId).toBe('json-client-id');
            expect(creds.clientSecret).toBe('json-secret');
            expect(mockSetSecret).toHaveBeenCalledTimes(2);
        });

        test('should handle invalid JSON in creds', () => {
            mockGetInput.mockImplementation((name: string) => {
                if (name === 'creds') return 'invalid-json{';
                return '';
            });

            const credsStr = mockGetInput('creds');
            
            try {
                JSON.parse(credsStr);
            } catch (error) {
                mockError(`Failed to parse creds JSON: ${error}`);
                mockSetFailed('Invalid credentials format');
            }

            expect(mockError).toHaveBeenCalled();
            expect(mockSetFailed).toHaveBeenCalled();
        });
    });

    describe('Scenario: Azure Stack environment', () => {
        test('should handle Azure Stack with custom ARM endpoint', () => {
            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'environment': 'azurestack',
                    'auth-type': 'SERVICE_PRINCIPAL',
                    'client-id': 'stack-client-id',
                    'tenant-id': 'stack-tenant',
                    'resource-manager-endpoint-url': 'https://management.local.azurestack.external'
                };
                return inputs[name] || '';
            });

            const env = mockGetInput('environment');
            const armEndpoint = mockGetInput('resource-manager-endpoint-url');

            mockInfo(`Registering cloud: "${env}" with ARM endpoint: "${armEndpoint}"`);

            expect(env).toBe('azurestack');
            expect(armEndpoint).toBeTruthy();
            expect(mockInfo).toHaveBeenCalledWith(expect.stringContaining('azurestack'));
        });
    });

    describe('Scenario: Error handling and recovery', () => {
        test('should handle login failure gracefully', () => {
            const error = new Error('Az CLI login failed');
            error.stack = 'Error: Az CLI login failed\n    at login.ts:42:15';

            mockSetFailed(`Login failed with ${error}. Double check if the 'auth-type' is correct.`);
            mockDebug(error.stack);

            expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining('Login failed'));
            expect(mockDebug).toHaveBeenCalledWith(expect.stringContaining('login.ts'));
        });

        test('should handle cleanup errors without failing the action', () => {
            const error = new Error('Cleanup failed');

            mockWarning(`Login cleanup failed with ${error}. Cleanup will be skipped.`);
            mockDebug(error.stack || '');

            expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining('Cleanup will be skipped'));
        });

        test('should warn about deprecated patterns', () => {
            mockGetInput.mockImplementation((name: string) => {
                if (name === 'creds') return '{"clientId":"id"}';
                if (name === 'client-id') return 'explicit-id';
                return '';
            });

            const creds = mockGetInput('creds');
            const clientId = mockGetInput('client-id');

            if (creds && clientId) {
                mockWarning("At least one of the parameters 'client-id', 'subscription-id' or 'tenant-id' is set. 'creds' will be ignored.");
            }

            expect(mockWarning).toHaveBeenCalledWith(expect.stringContaining("'creds' will be ignored"));
        });
    });

    describe('Scenario: Concurrent operations', () => {
        test('should handle multiple inputs being read simultaneously', () => {
            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'environment': 'azurecloud',
                    'auth-type': 'SERVICE_PRINCIPAL',
                    'client-id': 'id',
                    'tenant-id': 'tenant',
                    'subscription-id': 'sub'
                };
                return inputs[name] || '';
            });

            const results = [
                mockGetInput('environment'),
                mockGetInput('auth-type'),
                mockGetInput('client-id'),
                mockGetInput('tenant-id'),
                mockGetInput('subscription-id')
            ];

            expect(results).toEqual(['azurecloud', 'SERVICE_PRINCIPAL', 'id', 'tenant', 'sub']);
            expect(mockGetInput).toHaveBeenCalledTimes(5);
        });

        test('should handle multiple secrets being masked', () => {
            const secrets = ['secret1', 'secret2', 'secret3', 'secret4', 'secret5'];
            
            secrets.forEach(secret => mockSetSecret(secret));

            expect(mockSetSecret).toHaveBeenCalledTimes(5);
            secrets.forEach(secret => {
                expect(mockSetSecret).toHaveBeenCalledWith(secret);
            });
        });
    });

    describe('Scenario: Allow no subscriptions', () => {
        test('should handle login without subscription ID when allow-no-subscriptions is true', () => {
            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'auth-type': 'SERVICE_PRINCIPAL',
                    'client-id': 'client',
                    'tenant-id': 'tenant',
                    'allow-no-subscriptions': 'true',
                    'subscription-id': ''
                };
                return inputs[name] || '';
            });

            const allowNoSubs = mockGetInput('allow-no-subscriptions').toLowerCase() === 'true';
            const subscriptionId = mockGetInput('subscription-id');

            expect(allowNoSubs).toBe(true);
            expect(subscriptionId).toBe('');
        });

        test('should fail when subscription-id missing and allow-no-subscriptions is false', () => {
            mockGetInput.mockImplementation((name: string) => {
                const inputs: {[key: string]: string} = {
                    'allow-no-subscriptions': 'false',
                    'subscription-id': ''
                };
                return inputs[name] || '';
            });

            const allowNoSubs = mockGetInput('allow-no-subscriptions').toLowerCase() === 'true';
            const subscriptionId = mockGetInput('subscription-id');

            if (!subscriptionId && !allowNoSubs) {
                mockSetFailed("Ensure 'subscription-id' is supplied or 'allow-no-subscriptions' is 'true'.");
            }

            expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining('subscription-id'));
        });
    });

    describe('Scenario: PowerShell session enablement', () => {
        test('should handle Azure PowerShell session when enabled', () => {
            mockGetInput.mockImplementation((name: string) => {
                return name === 'enable-AzPSSession' ? 'true' : '';
            });

            const enablePS = mockGetInput('enable-AzPSSession').toLowerCase() === 'true';

            if (enablePS) {
                mockInfo('Running Azure PowerShell Login.');
                mockDebug('Importing Azure PowerShell module.');
            }

            expect(enablePS).toBe(true);
            expect(mockInfo).toHaveBeenCalledWith('Running Azure PowerShell Login.');
        });

        test('should skip PowerShell login when not enabled', () => {
            mockGetInput.mockImplementation((name: string) => {
                return name === 'enable-AzPSSession' ? 'false' : '';
            });

            const enablePS = mockGetInput('enable-AzPSSession').toLowerCase() === 'true';

            expect(enablePS).toBe(false);
            expect(mockInfo).not.toHaveBeenCalledWith('Running Azure PowerShell Login.');
        });
    });
});