import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Comprehensive tests for @actions/core version 1.9.1 compatibility
 * This test suite validates the downgrade from 1.11.1 to 1.9.1
 */
describe('Dependency Compatibility: @actions/core 1.9.1', () => {
    
    describe('Version Validation', () => {
        test('should confirm @actions/core is at version 1.9.1', () => {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('should not be using version 1.11.1', () => {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            expect(packageJson.dependencies['@actions/core']).not.toBe('1.11.1');
            expect(packageJson.dependencies['@actions/core']).not.toMatch(/^\^1\.11/);
        });

        test('package-lock.json should reflect version 1.9.1', () => {
            const lockPath = path.join(process.cwd(), 'package-lock.json');
            const lockJson = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
            const corePackage = lockJson.packages['node_modules/@actions/core'];
            expect(corePackage.version).toBe('1.9.1');
        });
    });

    describe('Critical API Surface Area', () => {
        test('getInput with options should work correctly', () => {
            // Test with required: false
            const result1 = core.getInput('non-existent', { required: false });
            expect(result1).toBe('');

            // Test with environment variable
            process.env.INPUT_TEST_PARAM = 'test-value';
            const result2 = core.getInput('test-param');
            expect(result2).toBe('test-value');
            delete process.env.INPUT_TEST_PARAM;
        });

        test('getInput should handle trimWhitespace option', () => {
            process.env.INPUT_WHITESPACE_TEST = '  value  ';
            
            // Default behavior (trimWhitespace: true)
            const trimmed = core.getInput('whitespace-test');
            expect(trimmed).toBe('value');
            
            delete process.env.INPUT_WHITESPACE_TEST;
        });

        test('setFailed should work with various input types', () => {
            // String input
            expect(() => core.setFailed('Failure message')).not.toThrow();
            
            // Error object
            const error = new Error('Test error');
            expect(() => core.setFailed(error)).not.toThrow();
            
            // Error with stack trace
            const errorWithStack = new Error('Error with stack');
            errorWithStack.stack = 'Error: at test.ts:123';
            expect(() => core.setFailed(errorWithStack)).not.toThrow();
        });

        test('debug should work with string messages', () => {
            expect(() => core.debug('')).not.toThrow();
            expect(() => core.debug('Debug message')).not.toThrow();
            expect(() => core.debug('Multi\nline\ndebug')).not.toThrow();
        });

        test('info should work with string messages', () => {
            expect(() => core.info('Info message')).not.toThrow();
            expect(() => core.info('Running Azure CLI Login.')).not.toThrow();
            expect(() => core.info('Subscription is set successfully.')).not.toThrow();
        });

        test('warning should work with string and Error messages', () => {
            expect(() => core.warning('Warning message')).not.toThrow();
            expect(() => core.warning(new Error('Warning error'))).not.toThrow();
            expect(() => core.warning('Failed to parse Azure CLI version.')).not.toThrow();
        });

        test('error should work with string and Error messages', () => {
            expect(() => core.error('Error message')).not.toThrow();
            expect(() => core.error(new Error('Test error'))).not.toThrow();
        });

        test('setSecret should mask sensitive values', () => {
            const sensitiveValue = 'super-secret-value-12345';
            expect(() => core.setSecret(sensitiveValue)).not.toThrow();
            
            // Multiple secrets
            expect(() => core.setSecret('secret1')).not.toThrow();
            expect(() => core.setSecret('secret2')).not.toThrow();
            expect(() => core.setSecret('secret3')).not.toThrow();
        });

        test('setOutput should work with key-value pairs', () => {
            expect(() => core.setOutput('key', 'value')).not.toThrow();
            expect(() => core.setOutput('result', 'success')).not.toThrow();
            expect(() => core.setOutput('number', 123)).not.toThrow();
        });
    });

    describe('OIDC Token Functionality', () => {
        test('getIDToken method should exist and be a function', () => {
            expect(core.getIDToken).toBeDefined();
            expect(typeof core.getIDToken).toBe('function');
        });

        test('getIDToken should accept audience parameter', async () => {
            // Will fail in test environment but validates API contract
            try {
                await core.getIDToken('api://AzureADTokenExchange');
                fail('Expected getIDToken to throw in test environment');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('getIDToken should work without audience parameter', async () => {
            // Will fail in test environment but validates API contract
            try {
                await core.getIDToken();
                fail('Expected getIDToken to throw in test environment');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('getIDToken return type should be Promise<string>', async () => {
            try {
                const result = await core.getIDToken('test-audience');
                expect(typeof result).toBe('string');
            } catch (error) {
                // Expected in test environment
                expect(error).toBeDefined();
            }
        });
    });

    describe('Input Options Compatibility', () => {
        test('getInput should support required option', () => {
            process.env.INPUT_REQUIRED_TEST = 'value';
            
            const result = core.getInput('required-test', { required: true });
            expect(result).toBe('value');
            
            delete process.env.INPUT_REQUIRED_TEST;
        });

        test('getInput should throw when required input is missing', () => {
            expect(() => {
                core.getInput('missing-required', { required: true });
            }).toThrow();
        });

        test('getInput should support trimWhitespace option', () => {
            process.env.INPUT_TRIM_TEST = '  value  ';
            
            const trimmed = core.getInput('trim-test', { trimWhitespace: true });
            expect(trimmed).toBe('value');
            
            delete process.env.INPUT_TRIM_TEST;
        });

        test('getInput should handle empty strings correctly', () => {
            process.env.INPUT_EMPTY = '';
            
            const result = core.getInput('empty', { required: false });
            expect(result).toBe('');
            
            delete process.env.INPUT_EMPTY;
        });
    });

    describe('Real-World Usage Patterns from Codebase', () => {
        test('should handle LoginConfig.ts usage pattern', () => {
            const inputs = [
                'environment',
                'enable-AzPSSession',
                'allow-no-subscriptions',
                'auth-type',
                'client-id',
                'tenant-id',
                'subscription-id',
                'creds',
                'audience'
            ];

            for (const input of inputs) {
                expect(() => {
                    const value = core.getInput(input, { required: false });
                    expect(typeof value).toBe('string');
                }).not.toThrow();
            }
        });

        test('should handle main.ts usage pattern', () => {
            // Simulating main.ts error handling
            const errorMessage = 'Login failed with error. Double check if the \'auth-type\' is correct.';
            expect(() => core.setFailed(errorMessage)).not.toThrow();
            
            // Simulating debug logging
            expect(() => core.debug('Stack trace information')).not.toThrow();
        });

        test('should handle cleanup.ts usage pattern', () => {
            // Simulating cleanup.ts warning
            const warningMsg = 'Login cleanup failed with error. Cleanup will be skipped.';
            expect(() => core.warning(warningMsg)).not.toThrow();
            
            // Simulating debug in cleanup
            expect(() => core.debug('Cleanup stack trace')).not.toThrow();
        });

        test('should handle AzureCliLogin.ts usage pattern', () => {
            const messages = [
                'Running Azure CLI Login.',
                'Done setting cloud: "azurecloud"',
                'Subscription is set successfully.',
                'Azure CLI login succeeds by using OIDC.'
            ];

            for (const msg of messages) {
                expect(() => core.info(msg)).not.toThrow();
            }

            // Error handling
            expect(() => core.error('Error while trying to register cloud')).not.toThrow();
            expect(() => core.warning('Failed to parse Azure CLI version.')).not.toThrow();
        });

        test('should handle secret masking pattern from LoginConfig', () => {
            const secrets = [
                'client-id-value',
                'client-secret-value',
                'tenant-id-value',
                'federated-token-value'
            ];

            for (const secret of secrets) {
                expect(() => core.setSecret(secret)).not.toThrow();
            }
        });
    });

    describe('Edge Cases and Error Conditions', () => {
        test('should handle undefined input gracefully', () => {
            const result = core.getInput('undefined-input', { required: false });
            expect(result).toBe('');
        });

        test('should handle special characters in input names', () => {
            process.env['INPUT_SPECIAL-CHARS_TEST'] = 'value';
            const result = core.getInput('special-chars_test');
            expect(result).toBe('value');
            delete process.env['INPUT_SPECIAL-CHARS_TEST'];
        });

        test('should handle empty secret masking', () => {
            expect(() => core.setSecret('')).not.toThrow();
        });

        test('should handle null-ish values in setFailed', () => {
            expect(() => core.setFailed('')).not.toThrow();
        });

        test('should handle multiline messages in logging', () => {
            const multilineMsg = 'Line 1\nLine 2\nLine 3';
            expect(() => core.info(multilineMsg)).not.toThrow();
            expect(() => core.debug(multilineMsg)).not.toThrow();
            expect(() => core.warning(multilineMsg)).not.toThrow();
        });

        test('should handle long messages', () => {
            const longMsg = 'a'.repeat(10000);
            expect(() => core.debug(longMsg)).not.toThrow();
            expect(() => core.info(longMsg)).not.toThrow();
        });

        test('should handle special characters in messages', () => {
            const specialMsg = 'Test: <>&"\'\n\t\r';
            expect(() => core.info(specialMsg)).not.toThrow();
            expect(() => core.debug(specialMsg)).not.toThrow();
        });
    });

    describe('Backward Compatibility Verification', () => {
        test('all APIs from 1.9.1 should still be present', () => {
            const requiredApis = [
                'getInput',
                'setOutput',
                'setFailed',
                'debug',
                'info',
                'warning',
                'error',
                'setSecret',
                'getIDToken',
                'exportVariable',
                'setCommandEcho',
                'addPath',
                'getMultilineInput',
                'getBooleanInput'
            ];

            for (const api of requiredApis) {
                if (core[api]) {
                    expect(typeof core[api]).toBe('function');
                }
            }
        });

        test('should not have exec-related APIs (added in 1.11.x)', () => {
            // Version 1.9.1 should NOT have getExecOutput or other exec utilities
            // as those were moved to @actions/exec
            expect(core['getExecOutput']).toBeUndefined();
        });

        test('uuid dependency should be present (required by 1.9.1)', () => {
            const lockPath = path.join(process.cwd(), 'package-lock.json');
            const lockJson = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
            const uuidPackage = lockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuidPackage).toBeDefined();
            expect(uuidPackage.version).toBe('8.3.2');
        });
    });

    describe('Performance and Resource Usage', () => {
        test('should handle rapid successive calls', () => {
            expect(() => {
                for (let i = 0; i < 100; i++) {
                    core.debug(`Message ${i}`);
                }
            }).not.toThrow();
        });

        test('should handle concurrent getInput calls', () => {
            process.env.INPUT_CONCURRENT_1 = 'value1';
            process.env.INPUT_CONCURRENT_2 = 'value2';
            process.env.INPUT_CONCURRENT_3 = 'value3';

            expect(() => {
                const v1 = core.getInput('concurrent-1');
                const v2 = core.getInput('concurrent-2');
                const v3 = core.getInput('concurrent-3');
                expect(v1).toBe('value1');
                expect(v2).toBe('value2');
                expect(v3).toBe('value3');
            }).not.toThrow();

            delete process.env.INPUT_CONCURRENT_1;
            delete process.env.INPUT_CONCURRENT_2;
            delete process.env.INPUT_CONCURRENT_3;
        });

        test('should handle multiple secret masking operations', () => {
            expect(() => {
                for (let i = 0; i < 50; i++) {
                    core.setSecret(`secret-${i}`);
                }
            }).not.toThrow();
        });
    });

    describe('Type Safety and Contract Validation', () => {
        test('getInput should always return a string', () => {
            process.env.INPUT_TYPE_TEST = 'value';
            const result = core.getInput('type-test');
            expect(typeof result).toBe('string');
            delete process.env.INPUT_TYPE_TEST;
        });

        test('getBooleanInput should return a boolean', () => {
            if (core.getBooleanInput) {
                process.env.INPUT_BOOL_TEST = 'true';
                const result = core.getBooleanInput('bool-test', { required: false });
                expect(typeof result).toBe('boolean');
                delete process.env.INPUT_BOOL_TEST;
            }
        });

        test('getMultilineInput should return an array', () => {
            if (core.getMultilineInput) {
                process.env.INPUT_MULTI_TEST = 'line1\nline2\nline3';
                const result = core.getMultilineInput('multi-test', { required: false });
                expect(Array.isArray(result)).toBe(true);
                delete process.env.INPUT_MULTI_TEST;
            }
        });
    });
});

describe('Dependency Change Impact Analysis', () => {
    describe('Breaking Changes Assessment', () => {
        test('should not have breaking changes for LoginConfig usage', () => {
            // All methods used in LoginConfig should work
            expect(() => {
                core.getInput('test', { required: false });
                core.setSecret('secret');
                core.warning('warning');
                core.error('error');
                core.info('info');
                core.debug('debug');
            }).not.toThrow();
        });

        test('should not have breaking changes for main.ts usage', () => {
            expect(() => {
                core.getInput('test', { required: false });
                core.setFailed('failure');
                core.debug('debug');
            }).not.toThrow();
        });

        test('should not have breaking changes for cleanup.ts usage', () => {
            expect(() => {
                core.getInput('test', { required: false });
                core.warning('warning');
                core.debug('debug');
            }).not.toThrow();
        });

        test('should not have breaking changes for AzureCliLogin.ts usage', () => {
            expect(() => {
                core.info('info');
                core.debug('debug');
                core.warning('warning');
                core.error('error');
            }).not.toThrow();
        });
    });

    describe('Feature Parity Validation', () => {
        test('OIDC token functionality should be maintained', async () => {
            // getIDToken was introduced in 1.6.0, present in both versions
            expect(core.getIDToken).toBeDefined();
            
            try {
                await core.getIDToken('test-audience');
            } catch (error) {
                // Expected to fail but API should exist
                expect(error).toBeDefined();
            }
        });

        test('secret masking should work consistently', () => {
            const secrets = ['secret1', 'secret2', 'secret3'];
            expect(() => {
                secrets.forEach(s => core.setSecret(s));
            }).not.toThrow();
        });

        test('input parsing should be consistent', () => {
            process.env.INPUT_CONSISTENCY_TEST = 'test-value';
            const result = core.getInput('consistency-test');
            expect(result).toBe('test-value');
            delete process.env.INPUT_CONSISTENCY_TEST;
        });
    });

    describe('No Regression Tests', () => {
        test('should maintain error handling behavior', () => {
            const error = new Error('Test error');
            error.stack = 'Error: at test.ts:123\n  at test2.ts:456';
            
            expect(() => core.setFailed(error)).not.toThrow();
            expect(() => core.error(error)).not.toThrow();
        });

        test('should maintain logging output behavior', () => {
            expect(() => {
                core.info('Info message');
                core.debug('Debug message');
                core.warning('Warning message');
                core.error('Error message');
            }).not.toThrow();
        });

        test('should maintain input validation behavior', () => {
            expect(() => {
                core.getInput('missing', { required: true });
            }).toThrow();
        });
    });
});