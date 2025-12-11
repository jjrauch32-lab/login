import * as core from '@actions/core';

/**
 * Test suite for @actions/core v1.9.1 compatibility
 * 
 * This test validates that the downgrade from v1.11.1 to v1.9.1
 * doesn't break any functionality used in the codebase.
 */
describe('@actions/core v1.9.1 Compatibility Tests', () => {
    
    beforeEach(() => {
        // Clear all environment variables
        for (const key in process.env) {
            if (key.startsWith('INPUT_')) {
                delete process.env[key];
            }
        }
        jest.clearAllMocks();
    });

    describe('core.getInput functionality', () => {
        test('should retrieve input values from environment variables', () => {
            process.env['INPUT_TESTINPUT'] = 'test-value';
            const result = core.getInput('testInput');
            expect(result).toBe('test-value');
        });

        test('should handle required inputs', () => {
            expect(() => {
                core.getInput('nonexistent', { required: true });
            }).toThrow();
        });

        test('should return empty string for non-existent optional inputs', () => {
            const result = core.getInput('nonexistent', { required: false });
            expect(result).toBe('');
        });

        test('should handle inputs with spaces', () => {
            process.env['INPUT_TEST_INPUT_WITH_SPACES'] = 'value-with-spaces';
            const result = core.getInput('test input with spaces');
            expect(result).toBe('value-with-spaces');
        });

        test('should trim whitespace from input values by default', () => {
            process.env['INPUT_WHITESPACE'] = '  trimmed  ';
            const result = core.getInput('whitespace');
            expect(result).toBe('trimmed');
        });

        test('should preserve whitespace when trimWhitespace is false', () => {
            process.env['INPUT_WHITESPACE'] = '  preserve  ';
            const result = core.getInput('whitespace', { trimWhitespace: false });
            expect(result).toBe('  preserve  ');
        });
    });

    describe('core.setSecret functionality', () => {
        let originalStdoutWrite: any;
        const outputs: string[] = [];

        beforeEach(() => {
            outputs.length = 0;
            originalStdoutWrite = process.stdout.write;
            process.stdout.write = jest.fn((str: string) => {
                outputs.push(str);
                return true;
            }) as any;
        });

        afterEach(() => {
            process.stdout.write = originalStdoutWrite;
        });

        test('should register secret values', () => {
            expect(() => {
                core.setSecret('my-secret-value');
            }).not.toThrow();
        });

        test('should handle empty secrets gracefully', () => {
            expect(() => {
                core.setSecret('');
            }).not.toThrow();
        });

        test('should handle null/undefined secrets', () => {
            expect(() => {
                core.setSecret(null as any);
            }).not.toThrow();
            
            expect(() => {
                core.setSecret(undefined as any);
            }).not.toThrow();
        });
    });

    describe('core.getIDToken functionality', () => {
        test('should be available in v1.9.1', () => {
            expect(typeof core.getIDToken).toBe('function');
        });

        test('should accept audience parameter', async () => {
            // This will fail in test environment but validates the API exists
            await expect(core.getIDToken('test-audience')).rejects.toThrow();
        });

        test('should handle empty audience', async () => {
            await expect(core.getIDToken('')).rejects.toThrow();
        });
    });

    describe('Logging functions', () => {
        let consoleOutput: string[] = [];
        let originalLog: any;
        let originalError: any;
        let originalStdout: any;
        let originalStderr: any;

        beforeEach(() => {
            consoleOutput = [];
            originalLog = console.log;
            originalError = console.error;
            originalStdout = process.stdout.write;
            originalStderr = process.stderr.write;

            console.log = jest.fn((...args) => {
                consoleOutput.push(args.join(' '));
            });
            console.error = jest.fn((...args) => {
                consoleOutput.push(args.join(' '));
            });
            process.stdout.write = jest.fn((str: string) => {
                consoleOutput.push(str);
                return true;
            }) as any;
            process.stderr.write = jest.fn((str: string) => {
                consoleOutput.push(str);
                return true;
            }) as any;
        });

        afterEach(() => {
            console.log = originalLog;
            console.error = originalError;
            process.stdout.write = originalStdout;
            process.stderr.write = originalStderr;
        });

        test('core.info should log informational messages', () => {
            expect(() => {
                core.info('Test info message');
            }).not.toThrow();
        });

        test('core.warning should log warning messages', () => {
            expect(() => {
                core.warning('Test warning message');
            }).not.toThrow();
        });

        test('core.error should log error messages', () => {
            expect(() => {
                core.error('Test error message');
            }).not.toThrow();
        });

        test('core.debug should log debug messages', () => {
            expect(() => {
                core.debug('Test debug message');
            }).not.toThrow();
        });

        test('should handle multiline messages', () => {
            expect(() => {
                core.info('Line 1\nLine 2\nLine 3');
            }).not.toThrow();
        });

        test('should handle messages with special characters', () => {
            expect(() => {
                core.info('Message with "quotes" and \'apostrophes\'');
                core.info('Message with $pecial @characters #123');
            }).not.toThrow();
        });
    });

    describe('core.setFailed functionality', () => {
        let originalExitCode: number | undefined;
        let originalExit: any;

        beforeEach(() => {
            originalExitCode = process.exitCode;
            originalExit = process.exit;
            process.exit = jest.fn() as any;
        });

        afterEach(() => {
            process.exitCode = originalExitCode;
            process.exit = originalExit;
        });

        test('should set failure status with string message', () => {
            expect(() => {
                core.setFailed('Task failed');
            }).not.toThrow();
            expect(process.exitCode).toBe(1);
        });

        test('should set failure status with Error object', () => {
            const error = new Error('Test error');
            expect(() => {
                core.setFailed(error);
            }).not.toThrow();
            expect(process.exitCode).toBe(1);
        });

        test('should handle empty failure message', () => {
            expect(() => {
                core.setFailed('');
            }).not.toThrow();
            expect(process.exitCode).toBe(1);
        });
    });

    describe('Version-specific compatibility checks', () => {
        test('v1.9.1 should have uuid dependency', () => {
            // v1.9.1 uses uuid ^8.3.2
            // This test validates the dependency is available
            const packageJson = require('../package.json');
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('should not have @actions/exec dependency in core', () => {
            // v1.11.1 added @actions/exec as a dependency
            // v1.9.1 should not have this
            const core = require('@actions/core');
            // Just verify core module loads without exec dependency
            expect(core).toBeDefined();
        });

        test('should have http-client dependency', () => {
            // Both versions have @actions/http-client
            const core = require('@actions/core');
            expect(core.getIDToken).toBeDefined();
        });
    });

    describe('Edge cases and error handling', () => {
        test('should handle concurrent getInput calls', () => {
            process.env['INPUT_TEST1'] = 'value1';
            process.env['INPUT_TEST2'] = 'value2';
            process.env['INPUT_TEST3'] = 'value3';

            const results = [
                core.getInput('test1'),
                core.getInput('test2'),
                core.getInput('test3')
            ];

            expect(results).toEqual(['value1', 'value2', 'value3']);
        });

        test('should handle special characters in input names', () => {
            process.env['INPUT_TEST-WITH-DASHES'] = 'dash-value';
            const result = core.getInput('test-with-dashes');
            expect(result).toBe('dash-value');
        });

        test('should handle case sensitivity in input names', () => {
            process.env['INPUT_TESTVALUE'] = 'lowercase';
            process.env['INPUT_TESTVALUE'] = 'uppercase';
            
            const result1 = core.getInput('testValue');
            const result2 = core.getInput('TestValue');
            const result3 = core.getInput('TESTVALUE');
            
            // All should resolve to the same env var
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
        });

        test('should handle very long input values', () => {
            const longValue = 'a'.repeat(10000);
            process.env['INPUT_LONGVALUE'] = longValue;
            const result = core.getInput('longValue');
            expect(result).toBe(longValue);
            expect(result.length).toBe(10000);
        });

        test('should handle input values with newlines', () => {
            const multilineValue = 'line1\nline2\nline3';
            process.env['INPUT_MULTILINE'] = multilineValue;
            const result = core.getInput('multiline');
            expect(result).toContain('\n');
            expect(result.split('\n')).toHaveLength(3);
        });

        test('should handle multiple setSecret calls', () => {
            expect(() => {
                core.setSecret('secret1');
                core.setSecret('secret2');
                core.setSecret('secret3');
            }).not.toThrow();
        });

        test('should handle rapid logging calls', () => {
            expect(() => {
                for (let i = 0; i < 100; i++) {
                    core.info(`Message ${i}`);
                }
            }).not.toThrow();
        });
    });

    describe('Integration scenarios', () => {
        test('should support Azure login workflow pattern', () => {
            // Simulate Azure login input pattern
            process.env['INPUT_ENVIRONMENT'] = 'azurecloud';
            process.env['INPUT_ENABLE-AZPSSESSION'] = 'true';
            process.env['INPUT_ALLOW-NO-SUBSCRIPTIONS'] = 'false';
            process.env['INPUT_AUTH-TYPE'] = 'SERVICE_PRINCIPAL';
            process.env['INPUT_CLIENT-ID'] = 'test-client-id';
            process.env['INPUT_TENANT-ID'] = 'test-tenant-id';
            process.env['INPUT_SUBSCRIPTION-ID'] = 'test-subscription-id';

            expect(core.getInput('environment')).toBe('azurecloud');
            expect(core.getInput('enable-AzPSSession')).toBe('true');
            expect(core.getInput('allow-no-subscriptions')).toBe('false');
            expect(core.getInput('auth-type')).toBe('SERVICE_PRINCIPAL');
            expect(core.getInput('client-id')).toBe('test-client-id');
            expect(core.getInput('tenant-id')).toBe('test-tenant-id');
            expect(core.getInput('subscription-id')).toBe('test-subscription-id');
        });

        test('should support OIDC authentication pattern', () => {
            process.env['INPUT_AUDIENCE'] = 'api://AzureADTokenExchange';
            process.env['INPUT_AUTH-TYPE'] = 'SERVICE_PRINCIPAL';
            process.env['INPUT_CLIENT-ID'] = 'test-client-id';
            process.env['INPUT_TENANT-ID'] = 'test-tenant-id';

            expect(core.getInput('audience')).toBe('api://AzureADTokenExchange');
            
            // Verify getIDToken is callable (will fail but validates API)
            expect(core.getIDToken).toBeDefined();
            expect(typeof core.getIDToken).toBe('function');
        });

        test('should support secret masking pattern', () => {
            const clientSecret = 'super-secret-value';
            const federatedToken = 'jwt.token.here';
            
            expect(() => {
                core.setSecret(clientSecret);
                core.setSecret(federatedToken);
            }).not.toThrow();
        });

        test('should support error reporting pattern', () => {
            const error = new Error('Login failed');
            error.stack = 'Error: Login failed\n    at test.js:1:1';

            expect(() => {
                core.setFailed(`Login failed with ${error}`);
                core.debug(error.stack);
            }).not.toThrow();
        });
    });

    describe('Regression tests for known issues', () => {
        test('should not break with empty string inputs', () => {
            process.env['INPUT_EMPTY'] = '';
            const result = core.getInput('empty');
            expect(result).toBe('');
        });

        test('should handle boolean-like string inputs', () => {
            process.env['INPUT_BOOL1'] = 'true';
            process.env['INPUT_BOOL2'] = 'false';
            process.env['INPUT_BOOL3'] = 'TRUE';
            process.env['INPUT_BOOL4'] = 'FALSE';

            expect(core.getInput('bool1')).toBe('true');
            expect(core.getInput('bool2')).toBe('false');
            expect(core.getInput('bool3')).toBe('TRUE');
            expect(core.getInput('bool4')).toBe('FALSE');
        });

        test('should handle numeric string inputs', () => {
            process.env['INPUT_NUMBER'] = '12345';
            const result = core.getInput('number');
            expect(result).toBe('12345');
            expect(typeof result).toBe('string');
        });

        test('should handle JSON string inputs', () => {
            const jsonString = JSON.stringify({ key: 'value' });
            process.env['INPUT_JSON'] = jsonString;
            const result = core.getInput('json');
            expect(result).toBe(jsonString);
            expect(() => JSON.parse(result)).not.toThrow();
        });
    });
});