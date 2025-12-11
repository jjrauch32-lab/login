/**
 * Tests for @actions/core version compatibility
 * Validates that the downgrade from 1.11.1 to 1.9.1 doesn't break functionality
 */

import * as path from 'path';
import * as fs from 'fs';

describe('Version Compatibility Tests', () => {
    describe('@actions/core version 1.9.1 specific features', () => {
        it('should have correct version installed', () => {
            const packageJson = JSON.parse(
                fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf-8')
            );
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        it('should have uuid as transitive dependency', () => {
            const packageLock = JSON.parse(
                fs.readFileSync(path.join(__dirname, '../../package-lock.json'), 'utf-8')
            );
            
            const coreDeps = packageLock.packages['node_modules/@actions/core']?.dependencies;
            expect(coreDeps).toBeDefined();
            expect(coreDeps['uuid']).toBeDefined();
        });

        it('should not have @actions/exec as direct dependency of @actions/core', () => {
            const packageLock = JSON.parse(
                fs.readFileSync(path.join(__dirname, '../../package-lock.json'), 'utf-8')
            );
            
            const coreDeps = packageLock.packages['node_modules/@actions/core']?.dependencies;
            // In version 1.11.1, @actions/exec was added as a dependency, but not in 1.9.1
            expect(coreDeps?.['@actions/exec']).toBeUndefined();
        });

        it('should have @actions/http-client as dependency', () => {
            const packageLock = JSON.parse(
                fs.readFileSync(path.join(__dirname, '../../package-lock.json'), 'utf-8')
            );
            
            const coreDeps = packageLock.packages['node_modules/@actions/core']?.dependencies;
            expect(coreDeps).toBeDefined();
            expect(coreDeps['@actions/http-client']).toMatch(/^\^2\./);
        });
    });

    describe('Compatibility with existing codebase', () => {
        it('should support OIDC authentication patterns', () => {
            // OIDC support was added before 1.9.1, should be available
            const core = require('@actions/core');
            expect(typeof core.getIDToken).toBe('function');
        });

        it('should support all logging levels', () => {
            const core = require('@actions/core');
            expect(typeof core.debug).toBe('function');
            expect(typeof core.info).toBe('function');
            expect(typeof core.warning).toBe('function');
            expect(typeof core.error).toBe('function');
        });

        it('should support secret masking', () => {
            const core = require('@actions/core');
            expect(typeof core.setSecret).toBe('function');
        });

        it('should support grouped output', () => {
            const core = require('@actions/core');
            expect(typeof core.group).toBe('function');
        });

        it('should support state management', () => {
            const core = require('@actions/core');
            expect(typeof core.saveState).toBe('function');
            expect(typeof core.getState).toBe('function');
        });
    });

    describe('Breaking changes validation', () => {
        it('should not have removed any APIs used in the codebase', () => {
            const core = require('@actions/core');
            
            // List of APIs that must be present
            const requiredAPIs = [
                'getInput',
                'getBooleanInput',
                'getMultilineInput',
                'setOutput',
                'setCommandEcho',
                'setFailed',
                'isDebug',
                'debug',
                'error',
                'warning',
                'info',
                'startGroup',
                'endGroup',
                'group',
                'saveState',
                'getState',
                'getIDToken',
                'setSecret',
                'exportVariable',
                'addPath'
            ];

            requiredAPIs.forEach(api => {
                expect(core[api]).toBeDefined();
                expect(typeof core[api]).toBe('function');
            });
        });

        it('should maintain input option interface', () => {
            const core = require('@actions/core');
            
            // Test that input options work as expected
            process.env['INPUT_TEST'] = '  value  ';
            
            const withTrim = core.getInput('test', { trimWhitespace: true });
            expect(withTrim).toBe('value');
            
            const withoutTrim = core.getInput('test', { trimWhitespace: false });
            expect(withoutTrim).toBe('  value  ');
        });

        it('should maintain annotation properties interface', () => {
            const core = require('@actions/core');
            
            // These should not throw
            expect(() => {
                core.warning('test warning', {
                    title: 'Test Title',
                    file: 'test.ts',
                    startLine: 1,
                    endLine: 1,
                    startColumn: 1,
                    endColumn: 10
                });
            }).not.toThrow();
        });
    });

    describe('Dependency resolution', () => {
        it('should have consistent dependency tree', () => {
            const packageLock = JSON.parse(
                fs.readFileSync(path.join(__dirname, '../../package-lock.json'), 'utf-8')
            );

            const mainCorePackage = packageLock.packages['node_modules/@actions/core'];
            expect(mainCorePackage).toBeDefined();
            expect(mainCorePackage.version).toBe('1.9.1');
            
            const uuidPackage = packageLock.packages['node_modules/@actions/core/node_modules/uuid'];
            if (uuidPackage) {
                expect(uuidPackage.version).toBe('8.3.2');
            }
        });



        it('should have all peer dependencies satisfied', () => {
            const packageLock = JSON.parse(
                fs.readFileSync(path.join(__dirname, '../../package-lock.json'), 'utf-8')
            );

            const corePackage = packageLock.packages['node_modules/@actions/core'];
            expect(corePackage).toBeDefined();
            
            // Verify dependencies are present in lock file
            if (corePackage.dependencies) {
                Object.keys(corePackage.dependencies).forEach(dep => {
                    const depPath = `node_modules/@actions/core/node_modules/${dep}`;
                    const altPath = `node_modules/${dep}`;
                    
                    // Dependency should exist in one of these locations
                    const exists = 
                        packageLock.packages[depPath] !== undefined ||
                        packageLock.packages[altPath] !== undefined;
                    
                    expect(exists).toBe(true);
                });
            }
        });
    });

    describe('Runtime behavior validation', () => {
        it('should load @actions/core without errors', () => {
            expect(() => {
                require('@actions/core');
            }).not.toThrow();
        });

        it('should have correct version at runtime', () => {
            const corePath = require.resolve('@actions/core/package.json');
            const corePackageJson = JSON.parse(fs.readFileSync(corePath, 'utf-8'));
            expect(corePackageJson.version).toBe('1.9.1');
        });

        it('should support chaining operations', () => {
            const core = require('@actions/core');
            
            expect(() => {
                process.env['INPUT_TEST-CHAIN'] = 'value';
                const input = core.getInput('test-chain');
                core.setSecret(input);
                core.info(`Processing: ${input}`);
                core.setOutput('result', input);
            }).not.toThrow();
        });
    });

    describe('Migration safety checks', () => {
        it('should not break existing test mocks', () => {
            // Validate that existing test patterns still work
            jest.mock('@actions/core');
            const core = require('@actions/core');
            
            core.getInput = jest.fn().mockReturnValue('mocked-value');
            expect(core.getInput('test')).toBe('mocked-value');
            
            jest.unmock('@actions/core');
        });

        it('should support stubbing in tests', () => {
            const core = require('@actions/core');
            
            const originalGetInput = core.getInput;
            core.getInput = jest.fn().mockReturnValue('stubbed');
            
            expect(core.getInput('test')).toBe('stubbed');
            
            // Restore
            core.getInput = originalGetInput;
        });
    });
});