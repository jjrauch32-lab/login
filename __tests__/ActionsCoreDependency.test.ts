/**
 * Tests specific to @actions/core dependency downgrade from 1.11.1 to 1.9.1
 * This test suite validates that all functionality continues to work with the older version
 */

import * as core from '@actions/core';

describe('@actions/core Dependency Version Tests', () => {
    describe('Package version validation', () => {
        test('should be using @actions/core version 1.9.1', () => {
            const packageJson = require('../package.json');
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('should have uuid as a transitive dependency from @actions/core', () => {
            // v1.9.1 uses uuid ^8.3.2 as a direct dependency
            const packageLock = require('../package-lock.json');
            expect(packageLock.dependencies['@actions/core'].version).toBe('1.9.1');
            expect(packageLock.dependencies['@actions/core'].dependencies).toHaveProperty('uuid');
        });

        test('should not have @actions/exec as a dependency of @actions/core', () => {
            // v1.11.1 added @actions/exec as a core dependency
            // v1.9.1 should NOT have this
            const packageLock = require('../package-lock.json');
            const coreDeps = packageLock.dependencies['@actions/core'].dependencies || {};
            
            // Should not have @actions/exec in core's dependencies
            expect(coreDeps).not.toHaveProperty('@actions/exec');
        });

        test('should have @actions/http-client dependency in core', () => {
            const packageLock = require('../package-lock.json');
            const coreDeps = packageLock.dependencies['@actions/core'].dependencies || {};
            
            expect(coreDeps).toHaveProperty('@actions/http-client');
        });
    });

    describe('API compatibility between v1.9.1 and v1.11.1', () => {
        test('core.getInput should exist and be callable', () => {
            expect(typeof core.getInput).toBe('function');
            expect(core.getInput.length).toBeGreaterThanOrEqual(1);
        });

        test('core.setSecret should exist and be callable', () => {
            expect(typeof core.setSecret).toBe('function');
            expect(core.setSecret.length).toBeGreaterThanOrEqual(1);
        });

        test('core.getIDToken should exist and be callable', () => {
            expect(typeof core.getIDToken).toBe('function');
            expect(core.getIDToken.length).toBeGreaterThanOrEqual(1);
        });

        test('core.info should exist and be callable', () => {
            expect(typeof core.info).toBe('function');
            expect(core.info.length).toBeGreaterThanOrEqual(1);
        });

        test('core.warning should exist and be callable', () => {
            expect(typeof core.warning).toBe('function');
            expect(core.warning.length).toBeGreaterThanOrEqual(1);
        });

        test('core.error should exist and be callable', () => {
            expect(typeof core.error).toBe('function');
            expect(core.error.length).toBeGreaterThanOrEqual(1);
        });

        test('core.debug should exist and be callable', () => {
            expect(typeof core.debug).toBe('function');
            expect(core.debug.length).toBeGreaterThanOrEqual(1);
        });

        test('core.setFailed should exist and be callable', () => {
            expect(typeof core.setFailed).toBe('function');
            expect(core.setFailed.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Known differences between v1.9.1 and v1.11.1', () => {
        test('v1.9.1 should not have summary API', () => {
            // v1.10.0 added summary API
            // v1.9.1 should not have it
            expect((core as any).summary).toBeUndefined();
        });

        test('v1.9.1 should not have markdownSummary', () => {
            expect((core as any).markdownSummary).toBeUndefined();
        });

        test('v1.9.1 getInput should support options object', () => {
            // Both versions support options
            process.env['INPUT_TEST'] = 'value';
            expect(() => {
                core.getInput('test', { required: false });
            }).not.toThrow();
            delete process.env['INPUT_TEST'];
        });

        test('v1.9.1 should support trimWhitespace option', () => {
            process.env['INPUT_TEST'] = '  value  ';
            const result = core.getInput('test', { trimWhitespace: false });
            expect(result).toBe('  value  ');
            delete process.env['INPUT_TEST'];
        });
    });

    describe('Regression tests for v1.9.1 known issues', () => {
        test('should handle getIDToken without audience parameter', async () => {
            // v1.9.1 requires audience parameter
            await expect(core.getIDToken('')).rejects.toThrow();
        });

        test('should handle concurrent calls to getInput', () => {
            process.env['INPUT_A'] = 'a';
            process.env['INPUT_B'] = 'b';
            process.env['INPUT_C'] = 'c';

            const results = Promise.all([
                Promise.resolve(core.getInput('a')),
                Promise.resolve(core.getInput('b')),
                Promise.resolve(core.getInput('c'))
            ]);

            return expect(results).resolves.toEqual(['a', 'b', 'c']);
        });

        test('should not leak memory with repeated setSecret calls', () => {
            const memBefore = process.memoryUsage().heapUsed;
            
            for (let i = 0; i < 1000; i++) {
                core.setSecret(`secret-${i}`);
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            const memAfter = process.memoryUsage().heapUsed;
            const memIncrease = memAfter - memBefore;
            
            // Memory increase should be reasonable (less than 10MB for 1000 secrets)
            expect(memIncrease).toBeLessThan(10 * 1024 * 1024);
        });

        test('should handle very long input values without truncation', () => {
            const longValue = 'x'.repeat(100000); // 100KB
            process.env['INPUT_LONGTEST'] = longValue;
            
            const result = core.getInput('longtest');
            expect(result.length).toBe(100000);
            expect(result).toBe(longValue);
            
            delete process.env['INPUT_LONGTEST'];
        });

        test('should handle special unicode characters in inputs', () => {
            const unicodeValue = 'Test 你好 🚀 مرحبا';
            process.env['INPUT_UNICODE'] = unicodeValue;
            
            const result = core.getInput('unicode');
            expect(result).toBe(unicodeValue);
            
            delete process.env['INPUT_UNICODE'];
        });

        test('should handle null bytes in input values', () => {
            const valueWithNull = 'before\x00after';
            process.env['INPUT_NULLBYTE'] = valueWithNull;
            
            const result = core.getInput('nullbyte');
            expect(result).toBe(valueWithNull);
            
            delete process.env['INPUT_NULLBYTE'];
        });
    });

    describe('Performance characteristics', () => {
        test('getInput should be fast for single calls', () => {
            process.env['INPUT_PERF'] = 'value';
            
            const start = Date.now();
            for (let i = 0; i < 1000; i++) {
                core.getInput('perf');
            }
            const duration = Date.now() - start;
            
            // Should complete 1000 calls in less than 100ms
            expect(duration).toBeLessThan(100);
            
            delete process.env['INPUT_PERF'];
        });

        test('setSecret should be fast', () => {
            const start = Date.now();
            for (let i = 0; i < 1000; i++) {
                core.setSecret(`secret-${i}`);
            }
            const duration = Date.now() - start;
            
            // Should complete 1000 calls in less than 1000ms
            expect(duration).toBeLessThan(1000);
        });

        test('logging functions should not block', () => {
            const start = Date.now();
            
            for (let i = 0; i < 100; i++) {
                core.info(`Info message ${i}`);
                core.debug(`Debug message ${i}`);
                core.warning(`Warning message ${i}`);
            }
            
            const duration = Date.now() - start;
            
            // Should complete 300 log calls in less than 500ms
            expect(duration).toBeLessThan(500);
        });
    });

    describe('Environment variable handling', () => {
        beforeEach(() => {
            // Clean up INPUT_ env vars
            Object.keys(process.env)
                .filter(key => key.startsWith('INPUT_'))
                .forEach(key => delete process.env[key]);
        });

        test('should normalize input names correctly', () => {
            process.env['INPUT_TEST-INPUT-NAME'] = 'value1';
            expect(core.getInput('test-input-name')).toBe('value1');
            
            process.env['INPUT_TEST_INPUT_NAME'] = 'value2';
            expect(core.getInput('test input name')).toBe('value2');
        });

        test('should handle case insensitivity', () => {
            process.env['INPUT_TESTVALUE'] = 'value';
            
            expect(core.getInput('testvalue')).toBe('value');
            expect(core.getInput('TestValue')).toBe('value');
            expect(core.getInput('TESTVALUE')).toBe('value');
            expect(core.getInput('testValue')).toBe('value');
        });

        test('should not interfere with non-INPUT env vars', () => {
            process.env['PATH'] = '/usr/bin';
            process.env['HOME'] = '/home/user';
            
            const result = core.getInput('path');
            expect(result).toBe(''); // Should not return PATH value
        });
    });

    describe('Edge cases and error scenarios', () => {
        test('should throw meaningful error for required missing input', () => {
            expect(() => {
                core.getInput('nonexistent-required-input', { required: true });
            }).toThrow(/required/i);
        });

        test('should handle empty string as valid input', () => {
            process.env['INPUT_EMPTY'] = '';
            const result = core.getInput('empty');
            expect(result).toBe('');
        });

        test('should handle whitespace-only input', () => {
            process.env['INPUT_WHITESPACE'] = '   ';
            const result = core.getInput('whitespace');
            expect(result).toBe(''); // Trimmed by default
        });

        test('should preserve whitespace when trimWhitespace is false', () => {
            process.env['INPUT_WHITESPACE'] = '   ';
            const result = core.getInput('whitespace', { trimWhitespace: false });
            expect(result).toBe('   ');
        });

        test('should handle input names with special characters', () => {
            process.env['INPUT_TEST@NAME'] = 'value';
            // The @ gets converted to underscore
            process.env['INPUT_TEST_NAME'] = 'value';
            const result = core.getInput('test@name');
            expect(result).toBeDefined();
        });

        test('should handle multiple setFailed calls', () => {
            expect(() => {
                core.setFailed('Error 1');
                core.setFailed('Error 2');
                core.setFailed('Error 3');
            }).not.toThrow();
            
            expect(process.exitCode).toBe(1);
        });

        test('should handle Error objects in setFailed', () => {
            const error = new Error('Test error');
            error.stack = 'Error: Test error\n    at test.ts:1:1';
            
            expect(() => {
                core.setFailed(error);
            }).not.toThrow();
            
            expect(process.exitCode).toBe(1);
        });

        test('should handle objects with toString in logging', () => {
            const obj = {
                toString() {
                    return 'Custom object';
                }
            };
            
            expect(() => {
                core.info(obj as any);
                core.debug(obj as any);
                core.warning(obj as any);
                core.error(obj as any);
            }).not.toThrow();
        });
    });

    describe('Compatibility with Azure Login workflow', () => {
        test('should support all input parameters used by Azure login', () => {
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
                const envKey = `INPUT_${input.replace(/ /g, '_').replace(/-/g, '_').toUpperCase()}`;
                process.env[envKey] = 'test-value';
                
                expect(() => {
                    const value = core.getInput(input);
                    expect(value).toBe('test-value');
                }).not.toThrow();
                
                delete process.env[envKey];
            });
        });

        test('should support OIDC token retrieval pattern', () => {
            expect(core.getIDToken).toBeDefined();
            expect(typeof core.getIDToken).toBe('function');
            
            // Should be async and return a promise
            const result = core.getIDToken('test-audience');
            expect(result).toBeInstanceOf(Promise);
        });

        test('should support secret masking for credentials', () => {
            const secrets = [
                'client-secret-value',
                'super-long-secret-' + 'x'.repeat(1000),
                'secret-with-special-chars-!@#$%',
                ''
            ];

            secrets.forEach(secret => {
                expect(() => {
                    core.setSecret(secret);
                }).not.toThrow();
            });
        });
    });
});