import { LoginConfig } from '../src/common/LoginConfig';
import * as core from '@actions/core';

describe('Dependency Integration Tests - @actions/core 1.9.1', () => {
    
    function setEnv(name: string, value: string) {
        process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase().replace(/-/g, '_')}`] = value;
    }

    function cleanEnv() {
        for (const envKey in process.env) {
            if (envKey.startsWith('INPUT_')) {
                delete process.env[envKey];
            }
        }
    }

    beforeEach(() => {
        cleanEnv();
        jest.clearAllMocks();
    });

    describe('LoginConfig integration with @actions/core', () => {
        test('should successfully initialize with all inputs from core.getInput', async () => {
            setEnv('environment', 'azurecloud');
            setEnv('enable-AzPSSession', 'true');
            setEnv('allow-no-subscriptions', 'false');
            setEnv('auth-type', 'SERVICE_PRINCIPAL');
            setEnv('client-id', 'test-client-id');
            setEnv('tenant-id', 'test-tenant-id');
            setEnv('subscription-id', 'test-subscription-id');

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(loginConfig.environment).toBe('azurecloud');
            expect(loginConfig.enableAzPSSession).toBe(true);
            expect(loginConfig.allowNoSubscriptionsLogin).toBe(false);
            expect(loginConfig.authType).toBe('SERVICE_PRINCIPAL');
            expect(loginConfig.servicePrincipalId).toBe('test-client-id');
            expect(loginConfig.tenantId).toBe('test-tenant-id');
            expect(loginConfig.subscriptionId).toBe('test-subscription-id');
        });

        test('should handle creds input with core.getInput', async () => {
            const creds = {
                clientId: 'test-client',
                clientSecret: 'test-secret',
                tenantId: 'test-tenant',
                subscriptionId: 'test-subscription'
            };

            setEnv('environment', 'azurecloud');
            setEnv('enable-AzPSSession', 'false');
            setEnv('allow-no-subscriptions', 'false');
            setEnv('auth-type', 'SERVICE_PRINCIPAL');
            setEnv('creds', JSON.stringify(creds));

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(loginConfig.servicePrincipalId).toBe('test-client');
            expect(loginConfig.servicePrincipalSecret).toBe('test-secret');
            expect(loginConfig.tenantId).toBe('test-tenant');
            expect(loginConfig.subscriptionId).toBe('test-subscription');
        });

        test('should call core.warning when client-id overrides creds', async () => {
            const warningSpy = jest.spyOn(core, 'warning');
            
            const creds = {
                clientId: 'creds-client',
                clientSecret: 'test-secret',
                tenantId: 'test-tenant',
                subscriptionId: 'test-subscription'
            };

            setEnv('environment', 'azurecloud');
            setEnv('enable-AzPSSession', 'false');
            setEnv('allow-no-subscriptions', 'false');
            setEnv('auth-type', 'SERVICE_PRINCIPAL');
            setEnv('client-id', 'override-client');
            setEnv('creds', JSON.stringify(creds));

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(warningSpy).toHaveBeenCalledWith(
                expect.stringContaining("'creds' will be ignored")
            );
        });

        test('should call core.setSecret for sensitive values', async () => {
            const setSecretSpy = jest.spyOn(core, 'setSecret');
            
            const creds = {
                clientId: 'test-client',
                clientSecret: 'sensitive-secret',
                tenantId: 'test-tenant',
                subscriptionId: 'test-subscription'
            };

            setEnv('environment', 'azurecloud');
            setEnv('enable-AzPSSession', 'false');
            setEnv('allow-no-subscriptions', 'false');
            setEnv('auth-type', 'SERVICE_PRINCIPAL');
            setEnv('creds', JSON.stringify(creds));

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(setSecretSpy).toHaveBeenCalledWith('test-client');
            expect(setSecretSpy).toHaveBeenCalledWith('sensitive-secret');
            expect(setSecretSpy).toHaveBeenCalledWith('test-tenant');
            expect(setSecretSpy).toHaveBeenCalledWith('test-subscription');
        });

        test('should handle missing required creds with proper error', async () => {
            const creds = {
                clientId: 'test-client',
                // missing clientSecret
                tenantId: 'test-tenant',
                subscriptionId: 'test-subscription'
            };

            setEnv('environment', 'azurecloud');
            setEnv('enable-AzPSSession', 'false');
            setEnv('allow-no-subscriptions', 'false');
            setEnv('auth-type', 'SERVICE_PRINCIPAL');
            setEnv('creds', JSON.stringify(creds));

            const loginConfig = new LoginConfig();
            
            await expect(loginConfig.initialize()).rejects.toThrow(
                expect.objectContaining({
                    message: expect.stringContaining("Not all parameters are provided in 'creds'")
                })
            );
        });

        test('should use core.debug for logging', async () => {
            const debugSpy = jest.spyOn(core, 'debug');
            
            const creds = {
                clientId: 'test-client',
                clientSecret: 'test-secret',
                tenantId: 'test-tenant',
                subscriptionId: 'test-subscription'
            };

            setEnv('environment', 'azurecloud');
            setEnv('enable-AzPSSession', 'false');
            setEnv('allow-no-subscriptions', 'false');
            setEnv('auth-type', 'SERVICE_PRINCIPAL');
            setEnv('creds', JSON.stringify(creds));

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(debugSpy).toHaveBeenCalledWith('Reading creds in JSON...');
        });
    });

    describe('Input handling with core.getInput', () => {
        test('should handle all environment names', async () => {
            const environments = [
                'azurecloud',
                'azurestack',
                'azureusgovernment',
                'azurechinacloud',
                'azuregermancloud'
            ];

            for (const env of environments) {
                cleanEnv();
                setEnv('environment', env);
                setEnv('enable-AzPSSession', 'false');
                setEnv('allow-no-subscriptions', 'true');
                setEnv('auth-type', 'IDENTITY');

                const loginConfig = new LoginConfig();
                await loginConfig.initialize();
                expect(loginConfig.environment).toBe(env);
            }
        });

        test('should handle boolean inputs correctly', async () => {
            const booleanTests = [
                { input: 'true', expected: true },
                { input: 'True', expected: true },
                { input: 'TRUE', expected: true },
                { input: 'false', expected: false },
                { input: 'False', expected: false },
                { input: 'FALSE', expected: false }
            ];

            for (const test of booleanTests) {
                cleanEnv();
                setEnv('environment', 'azurecloud');
                setEnv('enable-AzPSSession', test.input);
                setEnv('allow-no-subscriptions', 'false');
                setEnv('auth-type', 'IDENTITY');

                const loginConfig = new LoginConfig();
                await loginConfig.initialize();
                expect(loginConfig.enableAzPSSession).toBe(test.expected);
            }
        });

        test('should handle auth-type variations', async () => {
            const authTypes = [
                { input: 'SERVICE_PRINCIPAL', expected: 'SERVICE_PRINCIPAL' },
                { input: 'service_principal', expected: 'SERVICE_PRINCIPAL' },
                { input: 'IDENTITY', expected: 'IDENTITY' },
                { input: 'identity', expected: 'IDENTITY' }
            ];

            for (const test of authTypes) {
                cleanEnv();
                setEnv('environment', 'azurecloud');
                setEnv('enable-AzPSSession', 'false');
                setEnv('allow-no-subscriptions', 'true');
                setEnv('auth-type', test.input);

                const loginConfig = new LoginConfig();
                await loginConfig.initialize();
                expect(loginConfig.authType).toBe(test.expected);
            }
        });
    });

    describe('Error handling with core methods', () => {
        test('should call core.error for OIDC token failures', async () => {
            const errorSpy = jest.spyOn(core, 'error');
            
            // Mock getIDToken to throw
            jest.spyOn(core, 'getIDToken').mockRejectedValue(new Error('Token fetch failed'));

            setEnv('environment', 'azurecloud');
            setEnv('enable-AzPSSession', 'false');
            setEnv('allow-no-subscriptions', 'false');
            setEnv('auth-type', 'SERVICE_PRINCIPAL');
            setEnv('client-id', 'test-client');
            setEnv('tenant-id', 'test-tenant');
            setEnv('subscription-id', 'test-subscription');
            setEnv('audience', 'api://AzureADTokenExchange');

            const loginConfig = new LoginConfig();
            
            try {
                await loginConfig.initialize();
            } catch (error) {
                // Expected to fail
            }

            expect(errorSpy).toHaveBeenCalled();
        });

        test('should handle invalid JSON in creds gracefully', async () => {
            setEnv('environment', 'azurecloud');
            setEnv('enable-AzPSSession', 'false');
            setEnv('allow-no-subscriptions', 'false');
            setEnv('auth-type', 'SERVICE_PRINCIPAL');
            setEnv('creds', 'invalid-json{]');

            const loginConfig = new LoginConfig();
            
            await expect(loginConfig.initialize()).rejects.toThrow();
        });
    });

    describe('Audience parameter with getIDToken', () => {
        test('should use custom audience when provided', async () => {
            const getIDTokenSpy = jest.spyOn(core, 'getIDToken').mockResolvedValue('mock-token');

            setEnv('environment', 'azurecloud');
            setEnv('enable-AzPSSession', 'false');
            setEnv('allow-no-subscriptions', 'false');
            setEnv('auth-type', 'SERVICE_PRINCIPAL');
            setEnv('client-id', 'test-client');
            setEnv('tenant-id', 'test-tenant');
            setEnv('subscription-id', 'test-subscription');
            setEnv('audience', 'custom-audience');

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(getIDTokenSpy).toHaveBeenCalledWith('custom-audience');
        });

        test('should use default audience when not provided', async () => {
            const getIDTokenSpy = jest.spyOn(core, 'getIDToken').mockResolvedValue('mock-token');

            setEnv('environment', 'azurecloud');
            setEnv('enable-AzPSSession', 'false');
            setEnv('allow-no-subscriptions', 'false');
            setEnv('auth-type', 'SERVICE_PRINCIPAL');
            setEnv('client-id', 'test-client');
            setEnv('tenant-id', 'test-tenant');
            setEnv('subscription-id', 'test-subscription');

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            // Default audience should be used
            expect(loginConfig.audience).toBe('');
        });
    });

    describe('Performance with @actions/core 1.9.1', () => {
        test('should handle rapid successive getInput calls', () => {
            for (let i = 0; i < 1000; i++) {
                setEnv(`test${i}`, `value${i}`);
            }

            const start = Date.now();
            for (let i = 0; i < 1000; i++) {
                core.getInput(`test${i}`, { required: false });
            }
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(1000); // Should complete in < 1 second
        });

        test('should handle large input values efficiently', () => {
            const largeValue = 'x'.repeat(100000);
            setEnv('large-input', largeValue);

            const start = Date.now();
            const result = core.getInput('large-input');
            const duration = Date.now() - start;

            expect(result).toBe(largeValue);
            expect(duration).toBeLessThan(100); // Should be fast
        });
    });

    describe('Backwards compatibility', () => {
        test('should maintain compatibility with existing test patterns', async () => {
            // Pattern from existing tests
            setEnv('environment', 'azurecloud');
            setEnv('enable-AzPSSession', 'true');
            setEnv('allow-no-subscriptions', 'false');
            setEnv('auth-type', 'SERVICE_PRINCIPAL');
            
            const creds = {
                clientId: 'client-id',
                clientSecret: 'client-secret',
                tenantId: 'tenant-id',
                subscriptionId: 'subscription-id'
            };
            setEnv('creds', JSON.stringify(creds));

            const loginConfig = new LoginConfig();
            await loginConfig.initialize();

            expect(loginConfig.servicePrincipalId).toBe('client-id');
            expect(loginConfig.servicePrincipalSecret).toBe('client-secret');
        });
    });
});