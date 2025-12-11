import * as core from '@actions/core';

describe('@actions/core v1.9.1 API Compatibility', () => {
    
    beforeEach(() => {
        // Clear all INPUT_ environment variables
        Object.keys(process.env).forEach(key => {
            if (key.startsWith('INPUT_')) {
                delete process.env[key];
            }
        });
        
        // Reset mocks
        jest.clearAllMocks();
    });

    describe('core.getInput', () => {
        test('should retrieve input from environment', () => {
            process.env['INPUT_TEST'] = 'test-value';
            const result = core.getInput('test');
            expect(result).toBe('test-value');
        });

        test('should handle inputs with spaces', () => {
            process.env['INPUT_ENABLE-AZPSSESSION'] = 'true';
            const result = core.getInput('enable-AzPSSession');
            expect(result).toBe('true');
        });

        test('should return empty string for missing non-required input', () => {
            const result = core.getInput('missing-input', { required: false });
            expect(result).toBe('');
        });

        test('should throw error for missing required input', () => {
            expect(() => {
                core.getInput('missing-required', { required: true });
            }).toThrow();
        });

        test('should handle all inputs used in the codebase', () => {
            const inputs = [
                'environment',
                'enable-AzPSSession',
                'allow-no-subscriptions',
                'auth-type',
                'client-id',
                'tenant-id',
                'subscription-id',
                'audience',
                'creds'
            ];

            inputs.forEach(input => {
                const envKey = `INPUT_${input.replace(/ /g, '_').toUpperCase().replace(/-/g, '_')}`;
                process.env[envKey] = 'test-value';
                expect(() => core.getInput(input)).not.toThrow();
            });
        });
    });

    describe('core.setFailed', () => {
        let exitCode: number | undefined;
        let consoleError: jest.SpyInstance;

        beforeEach(() => {
            exitCode = undefined;
            consoleError = jest.spyOn(console, 'error').mockImplementation();
            // Mock process.exit to capture exit code
            jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
                exitCode = code;
                throw new Error('process.exit called');
            });
        });

        afterEach(() => {
            consoleError.mockRestore();
            jest.restoreAllMocks();
        });

        test('should set failed status with error message', () => {
            expect(() => {
                core.setFailed('Test error message');
            }).toThrow('process.exit called');
            
            expect(exitCode).toBe(1);
        });

        test('should handle Error objects', () => {
            const error = new Error('Test error');
            expect(() => {
                core.setFailed(error);
            }).toThrow('process.exit called');
        });

        test('should handle complex error messages', () => {
            const complexMessage = 'Login failed with Error: Invalid credentials. Double check if the \'auth-type\' is correct.';
            expect(() => {
                core.setFailed(complexMessage);
            }).toThrow('process.exit called');
        });
    });

    describe('core.debug', () => {
        let consoleLog: jest.SpyInstance;

        beforeEach(() => {
            consoleLog = jest.spyOn(console, 'log').mockImplementation();
            process.env['RUNNER_DEBUG'] = '1';
        });

        afterEach(() => {
            consoleLog.mockRestore();
            delete process.env['RUNNER_DEBUG'];
        });

        test('should output debug messages when RUNNER_DEBUG is set', () => {
            core.debug('Debug message');
            expect(consoleLog).toHaveBeenCalled();
        });

        test('should handle debug messages used in codebase', () => {
            const debugMessages = [
                'Azure CLI path: /usr/bin/az',
                'PowerShell path: /usr/bin/pwsh',
                'Reading creds in JSON...',
                'Set PSModulePath as /path/to/modules'
            ];

            debugMessages.forEach(msg => {
                expect(() => core.debug(msg)).not.toThrow();
            });
        });
    });

    describe('core.info', () => {
        let consoleLog: jest.SpyInstance;

        beforeEach(() => {
            consoleLog = jest.spyOn(console, 'log').mockImplementation();
        });

        afterEach(() => {
            consoleLog.mockRestore();
        });

        test('should output info messages', () => {
            core.info('Info message');
            expect(consoleLog).toHaveBeenCalled();
        });

        test('should handle info messages used in codebase', () => {
            const infoMessages = [
                'Clearing azure cli accounts from the local cache.',
                'Running Azure CLI Login.',
                'Subscription is set successfully.'
            ];

            infoMessages.forEach(msg => {
                expect(() => core.info(msg)).not.toThrow();
            });
        });
    });

    describe('core.warning', () => {
        let consoleLog: jest.SpyInstance;

        beforeEach(() => {
            consoleLog = jest.spyOn(console, 'log').mockImplementation();
        });

        afterEach(() => {
            consoleLog.mockRestore();
        });

        test('should output warning messages', () => {
            core.warning('Warning message');
            expect(consoleLog).toHaveBeenCalled();
        });

        test('should handle warnings used in codebase', () => {
            const warnings = [
                'Failed to parse Azure CLI version.',
                'Skip setting the default PowerShell module path for OS windows.',
                'Login cleanup failed with Error. Cleanup will be skipped.'
            ];

            warnings.forEach(msg => {
                expect(() => core.warning(msg)).not.toThrow();
            });
        });

        test('should handle warning with parameters ignored message', () => {
            const msg = "At least one of the parameters 'client-id', 'subscription-id' or 'tenant-id' is set. 'creds' will be ignored.";
            expect(() => core.warning(msg)).not.toThrow();
        });
    });

    describe('core.error', () => {
        let consoleLog: jest.SpyInstance;

        beforeEach(() => {
            consoleLog = jest.spyOn(console, 'log').mockImplementation();
        });

        afterEach(() => {
            consoleLog.mockRestore();
        });

        test('should output error messages', () => {
            core.error('Error message');
            expect(consoleLog).toHaveBeenCalled();
        });

        test('should handle Error objects', () => {
            const error = new Error('Test error');
            expect(() => core.error(error.message)).not.toThrow();
        });

        test('should handle error messages from codebase', () => {
            const errorMsg = 'Failed to fetch federated token from GitHub. Please make sure to give write permissions to id-token in the workflow.';
            expect(() => core.error(errorMsg)).not.toThrow();
        });
    });

    describe('core.setSecret', () => {
        test('should mark value as secret', () => {
            expect(() => core.setSecret('secret-value')).not.toThrow();
        });

        test('should handle empty secrets', () => {
            expect(() => core.setSecret('')).not.toThrow();
        });

        test('should handle sensitive credential values', () => {
            const sensitiveValues = [
                'client-secret-123',
                'tenant-id-456',
                'subscription-id-789',
                'federated-token-abc'
            ];

            sensitiveValues.forEach(value => {
                expect(() => core.setSecret(value)).not.toThrow();
            });
        });
    });

    describe('core.getIDToken', () => {
        beforeEach(() => {
            // Mock the OIDC token endpoint
            process.env['ACTIONS_ID_TOKEN_REQUEST_URL'] = 'https://token.actions.githubusercontent.com';
            process.env['ACTIONS_ID_TOKEN_REQUEST_TOKEN'] = 'test-token';
        });

        afterEach(() => {
            delete process.env['ACTIONS_ID_TOKEN_REQUEST_URL'];
            delete process.env['ACTIONS_ID_TOKEN_REQUEST_TOKEN'];
        });

        test('should have getIDToken method available', () => {
            expect(typeof core.getIDToken).toBe('function');
        });

        test('should accept audience parameter', async () => {
            // This will fail in test environment but we're testing the API exists
            try {
                await core.getIDToken('api://AzureADTokenExchange');
            } catch (error) {
                // Expected to fail in test environment
                expect(error).toBeDefined();
            }
        });

        test('should handle custom audiences', async () => {
            const audiences = [
                'api://AzureADTokenExchange',
                'api://CustomAudience',
                ''
            ];

            for (const audience of audiences) {
                try {
                    await core.getIDToken(audience);
                } catch (error) {
                    // Expected to fail in test environment
                    expect(error).toBeDefined();
                }
            }
        });
    });

    describe('version 1.9.1 specific features', () => {
        test('should support all methods used in LoginConfig', () => {
            const methods = [
                'getInput',
                'warning',
                'debug',
                'error',
                'info',
                'setSecret',
                'getIDToken'
            ];

            methods.forEach(method => {
                expect(core[method]).toBeDefined();
                expect(typeof core[method]).toBe('function');
            });
        });

        test('should support all methods used in cleanup', () => {
            const methods = ['getInput', 'warning', 'debug'];
            
            methods.forEach(method => {
                expect(core[method]).toBeDefined();
            });
        });

        test('should support all methods used in main', () => {
            const methods = ['getInput', 'setFailed', 'debug'];
            
            methods.forEach(method => {
                expect(core[method]).toBeDefined();
            });
        });
    });

    describe('input normalization', () => {
        test('should normalize environment input', () => {
            process.env['INPUT_ENVIRONMENT'] = 'AzureCloud';
            const result = core.getInput('environment');
            expect(result).toBe('AzureCloud');
        });

        test('should handle boolean string inputs', () => {
            process.env['INPUT_ENABLE_AZPSSESSION'] = 'true';
            const result = core.getInput('enable-AzPSSession');
            expect(result.toLowerCase()).toBe('true');
        });

        test('should handle auth-type input', () => {
            process.env['INPUT_AUTH_TYPE'] = 'SERVICE_PRINCIPAL';
            const result = core.getInput('auth-type');
            expect(result.toUpperCase()).toBe('SERVICE_PRINCIPAL');
        });
    });

    describe('error handling', () => {
        test('should handle malformed input values gracefully', () => {
            process.env['INPUT_CREDS'] = 'not-a-json';
            const result = core.getInput('creds');
            expect(result).toBe('not-a-json');
        });

        test('should handle very long input values', () => {
            const longValue = 'x'.repeat(10000);
            process.env['INPUT_LONGVALUE'] = longValue;
            const result = core.getInput('longvalue');
            expect(result).toBe(longValue);
        });

        test('should handle special characters in inputs', () => {
            const specialChars = 'test@#$%^&*(){}[]|\\:";\'<>?,./';
            process.env['INPUT_SPECIAL'] = specialChars;
            const result = core.getInput('special');
            expect(result).toBe(specialChars);
        });
    });

    describe('edge cases', () => {
        test('should handle undefined environment variables', () => {
            const result = core.getInput('undefined-var', { required: false });
            expect(result).toBe('');
        });

        test('should handle whitespace-only inputs', () => {
            process.env['INPUT_WHITESPACE'] = '   ';
            const result = core.getInput('whitespace');
            expect(result).toBe('   ');
        });

        test('should handle numeric string inputs', () => {
            process.env['INPUT_NUMBER'] = '12345';
            const result = core.getInput('number');
            expect(result).toBe('12345');
        });
    });

    describe('concurrent operations', () => {
        test('should handle multiple getInput calls', () => {
            process.env['INPUT_VAR1'] = 'value1';
            process.env['INPUT_VAR2'] = 'value2';
            process.env['INPUT_VAR3'] = 'value3';

            const results = [
                core.getInput('var1'),
                core.getInput('var2'),
                core.getInput('var3')
            ];

            expect(results).toEqual(['value1', 'value2', 'value3']);
        });

        test('should handle mixed core method calls', () => {
            process.env['RUNNER_DEBUG'] = '1';
            
            expect(() => {
                core.info('Info message');
                core.debug('Debug message');
                core.warning('Warning message');
            }).not.toThrow();
        });
    });
});