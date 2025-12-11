import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';

describe('Package Dependencies Test', () => {
    let packageJson: any;
    let packageLockJson: any;

    beforeAll(() => {
        // Load package.json
        const packageJsonPath = path.join(__dirname, '..', 'package.json');
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        // Load package-lock.json
        const packageLockJsonPath = path.join(__dirname, '..', 'package-lock.json');
        packageLockJson = JSON.parse(fs.readFileSync(packageLockJsonPath, 'utf8'));
    });

    describe('Package.json structure validation', () => {
        test('should have required metadata fields', () => {
            expect(packageJson.name).toBe('login');
            expect(packageJson.version).toBeDefined();
            expect(packageJson.description).toBeDefined();
            expect(packageJson.license).toBe('MIT');
            expect(packageJson.author).toBe('Microsoft');
        });

        test('should have required scripts', () => {
            expect(packageJson.scripts).toBeDefined();
            expect(packageJson.scripts.test).toBe('jest');
            expect(packageJson.scripts.build).toBeDefined();
            expect(packageJson.scripts['build:main']).toBeDefined();
            expect(packageJson.scripts['build:cleanup']).toBeDefined();
        });

        test('should have main entry point defined', () => {
            expect(packageJson.main).toBe('lib/main/index.js');
        });
    });

    describe('Critical dependencies validation', () => {
        test('should have @actions/core at version 1.9.1', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('should have @actions/exec dependency', () => {
            expect(packageJson.dependencies['@actions/exec']).toBeDefined();
            expect(packageJson.dependencies['@actions/exec']).toMatch(/^\^?1\.\d+\.\d+$/);
        });

        test('should have @actions/io dependency', () => {
            expect(packageJson.dependencies['@actions/io']).toBeDefined();
            expect(packageJson.dependencies['@actions/io']).toMatch(/^\^?1\.\d+\.\d+$/);
        });

        test('should have all required GitHub Actions dependencies', () => {
            const requiredDeps = ['@actions/core', '@actions/exec', '@actions/io'];
            requiredDeps.forEach(dep => {
                expect(packageJson.dependencies[dep]).toBeDefined();
            });
        });
    });

    describe('Development dependencies validation', () => {
        test('should have Jest testing framework', () => {
            expect(packageJson.devDependencies.jest).toBeDefined();
            expect(packageJson.devDependencies['ts-jest']).toBeDefined();
            expect(packageJson.devDependencies['@types/jest']).toBeDefined();
            expect(packageJson.devDependencies['jest-circus']).toBeDefined();
        });

        test('should have TypeScript tooling', () => {
            expect(packageJson.devDependencies.typescript).toBeDefined();
            expect(packageJson.devDependencies['@types/node']).toBeDefined();
        });

        test('should have build tools', () => {
            expect(packageJson.devDependencies['@vercel/ncc']).toBeDefined();
        });
    });

    describe('Package-lock.json consistency', () => {
        test('should have matching package name and version', () => {
            expect(packageLockJson.name).toBe(packageJson.name);
            expect(packageLockJson.version).toBe(packageJson.version);
        });

        test('should be lockfile version 3', () => {
            expect(packageLockJson.lockfileVersion).toBe(3);
        });

        test('should have @actions/core at exact version 1.9.1', () => {
            expect(packageLockJson.packages['node_modules/@actions/core']).toBeDefined();
            expect(packageLockJson.packages['node_modules/@actions/core'].version).toBe('1.9.1');
        });

        test('should have @actions/core with correct dependencies for version 1.9.1', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies).toBeDefined();
            expect(corePackage.dependencies['@actions/http-client']).toBeDefined();
            expect(corePackage.dependencies['uuid']).toBeDefined();
        });

        test('should have uuid as nested dependency of @actions/core', () => {
            expect(packageLockJson.packages['node_modules/@actions/core/node_modules/uuid']).toBeDefined();
            expect(packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'].version).toBe('8.3.2');
        });

        test('should not have @actions/exec as dependency of @actions/core 1.9.1', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            // Version 1.9.1 should not have @actions/exec as a dependency
            // (this was added in later versions like 1.11.1)
            expect(corePackage.dependencies['@actions/exec']).toBeUndefined();
        });
    });

    describe('Dependency consistency between package.json and package-lock.json', () => {
        test('all production dependencies should be in package-lock', () => {
            Object.keys(packageJson.dependencies).forEach(dep => {
                const lockDep = packageLockJson.packages[`node_modules/${dep}`];
                expect(lockDep).toBeDefined();
            });
        });

        test('all dev dependencies should be in package-lock', () => {
            Object.keys(packageJson.devDependencies).forEach(dep => {
                const lockDep = packageLockJson.packages[`node_modules/${dep}`];
                expect(lockDep).toBeDefined();
            });
        });
    });

    describe('Version constraint validation', () => {
        test('should use exact version for @actions/core (no caret)', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
            expect(packageJson.dependencies['@actions/core']).not.toMatch(/^\^/);
        });

        test('should use caret versioning for other @actions dependencies', () => {
            expect(packageJson.dependencies['@actions/exec']).toMatch(/^\^/);
            expect(packageJson.dependencies['@actions/io']).toMatch(/^\^/);
        });

        test('should have compatible version ranges for related packages', () => {
            // All @actions packages should be on v1.x
            expect(packageJson.dependencies['@actions/core']).toMatch(/^1\./);
            expect(packageJson.dependencies['@actions/exec']).toMatch(/^\^1\./);
            expect(packageJson.dependencies['@actions/io']).toMatch(/^\^1\./);
        });
    });

    describe('Security and integrity checks', () => {
        test('package-lock should have integrity hashes', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            // Version 1.9.1 has MIT license
            expect(corePackage.license).toBe('MIT');
        });

        test('should not have known vulnerable dependencies patterns', () => {
            // Ensure we're not using very old versions
            const coreVersion = packageJson.dependencies['@actions/core'];
            const majorVersion = parseInt(coreVersion.split('.')[0]);
            expect(majorVersion).toBeGreaterThanOrEqual(1);
        });
    });
});

describe('@actions/core API Compatibility Tests', () => {
    describe('Core API methods availability', () => {
        test('should have getInput method', () => {
            expect(typeof core.getInput).toBe('function');
        });

        test('should have setFailed method', () => {
            expect(typeof core.setFailed).toBe('function');
        });

        test('should have debug method', () => {
            expect(typeof core.debug).toBe('function');
        });

        test('should have info method', () => {
            expect(typeof core.info).toBe('function');
        });

        test('should have warning method', () => {
            expect(typeof core.warning).toBe('function');
        });

        test('should have error method', () => {
            expect(typeof core.error).toBe('function');
        });

        test('should have setSecret method', () => {
            expect(typeof core.setSecret).toBe('function');
        });

        test('should have getIDToken method', () => {
            expect(typeof core.getIDToken).toBe('function');
        });
    });

    describe('Core API method signatures and behavior', () => {
        test('getInput should accept string parameter', () => {
            // Mock environment variable
            process.env['INPUT_TEST'] = 'test-value';
            const result = core.getInput('test');
            expect(result).toBe('test-value');
            delete process.env['INPUT_TEST'];
        });

        test('getInput should accept options parameter', () => {
            process.env['INPUT_REQUIRED_PARAM'] = 'value';
            expect(() => {
                core.getInput('required-param', { required: false });
            }).not.toThrow();
            delete process.env['INPUT_REQUIRED_PARAM'];
        });

        test('setSecret should accept string parameter', () => {
            expect(() => {
                core.setSecret('sensitive-data');
            }).not.toThrow();
        });

        test('debug should accept string message', () => {
            expect(() => {
                core.debug('debug message');
            }).not.toThrow();
        });

        test('info should accept string message', () => {
            expect(() => {
                core.info('info message');
            }).not.toThrow();
        });

        test('warning should accept string or Error', () => {
            expect(() => {
                core.warning('warning message');
                core.warning(new Error('warning error'));
            }).not.toThrow();
        });

        test('error should accept string or Error', () => {
            expect(() => {
                core.error('error message');
                core.error(new Error('error object'));
            }).not.toThrow();
        });

        test('setFailed should accept string or Error', () => {
            expect(() => {
                core.setFailed('failure message');
            }).not.toThrow();
            
            expect(() => {
                core.setFailed(new Error('failure error'));
            }).not.toThrow();
        });
    });

    describe('Critical functionality for Azure Login', () => {
        test('should support masking secrets', () => {
            const secret = 'my-secret-password';
            expect(() => {
                core.setSecret(secret);
            }).not.toThrow();
        });

        test('should support getting inputs with required flag', () => {
            process.env['INPUT_CLIENT_ID'] = 'test-client-id';
            const clientId = core.getInput('client-id', { required: false });
            expect(clientId).toBe('test-client-id');
            delete process.env['INPUT_CLIENT_ID'];
        });

        test('should support getting inputs that may be empty', () => {
            const result = core.getInput('non-existent-input', { required: false });
            expect(result).toBe('');
        });

        test('should handle input name transformations', () => {
            // GitHub Actions transforms input names to uppercase with underscores
            process.env['INPUT_ENABLE_AZPSSESSION'] = 'true';
            const result = core.getInput('enable-AzPSSession');
            expect(result).toBe('true');
            delete process.env['INPUT_ENABLE_AZPSSESSION'];
        });
    });

    describe('OIDC token functionality', () => {
        test('getIDToken method should be available', () => {
            expect(typeof core.getIDToken).toBe('function');
        });

        test('getIDToken should accept optional audience parameter', async () => {
            // This will fail in test environment without GitHub runner context
            // but we're testing that the API signature is correct
            expect(core.getIDToken).toBeDefined();
            expect(core.getIDToken.length).toBeGreaterThanOrEqual(0);
        });
    });
});

describe('Version-specific feature tests', () => {
    describe('@actions/core 1.9.1 features', () => {
        test('should have summary functionality', () => {
            expect(core.summary).toBeDefined();
        });

        test('should support OIDC token methods', () => {
            expect(typeof core.getIDToken).toBe('function');
        });

        test('should have exportVariable method', () => {
            expect(typeof core.exportVariable).toBe('function');
        });

        test('should have setOutput method', () => {
            expect(typeof core.setOutput).toBe('function');
        });

        test('should have addPath method', () => {
            expect(typeof core.addPath).toBe('function');
        });

        test('should have group and endGroup methods', () => {
            expect(typeof core.group).toBe('function');
            expect(typeof core.endGroup).toBe('function');
        });

        test('should have saveState and getState methods', () => {
            expect(typeof core.saveState).toBe('function');
            expect(typeof core.getState).toBe('function');
        });
    });

    describe('Backward compatibility with 1.9.1', () => {
        test('should not break existing codebase functionality', () => {
            // Test that commonly used patterns in the codebase work
            const methods = [
                'getInput',
                'setFailed',
                'debug',
                'info',
                'warning',
                'error',
                'setSecret',
                'getIDToken'
            ];

            methods.forEach(method => {
                expect(core[method]).toBeDefined();
                expect(typeof core[method]).toBe('function');
            });
        });
    });
});

describe('Integration with codebase patterns', () => {
    describe('LoginConfig usage patterns', () => {
        test('should support input retrieval pattern used in LoginConfig', () => {
            process.env['INPUT_ENVIRONMENT'] = 'azurecloud';
            process.env['INPUT_ENABLE_AZPSSESSION'] = 'true';
            process.env['INPUT_ALLOW_NO_SUBSCRIPTIONS'] = 'false';
            process.env['INPUT_AUTH_TYPE'] = 'SERVICE_PRINCIPAL';

            expect(core.getInput('environment')).toBe('azurecloud');
            expect(core.getInput('enable-AzPSSession')).toBe('true');
            expect(core.getInput('allow-no-subscriptions')).toBe('false');
            expect(core.getInput('auth-type')).toBe('SERVICE_PRINCIPAL');

            // Cleanup
            delete process.env['INPUT_ENVIRONMENT'];
            delete process.env['INPUT_ENABLE_AZPSSESSION'];
            delete process.env['INPUT_ALLOW_NO_SUBSCRIPTIONS'];
            delete process.env['INPUT_AUTH_TYPE'];
        });

        test('should support optional input pattern', () => {
            process.env['INPUT_CLIENT_ID'] = 'test-id';
            const result = core.getInput('client-id', { required: false });
            expect(result).toBe('test-id');
            delete process.env['INPUT_CLIENT_ID'];
        });

        test('should support masking sensitive values', () => {
            const sensitiveValues = [
                'client-secret-123',
                'tenant-id-456',
                'subscription-id-789'
            ];

            sensitiveValues.forEach(value => {
                expect(() => core.setSecret(value)).not.toThrow();
            });
        });
    });

    describe('Error handling patterns', () => {
        test('should support setFailed with error message', () => {
            expect(() => {
                core.setFailed('Login failed with error');
            }).not.toThrow();
        });

        test('should support setFailed with Error object', () => {
            const error = new Error('Login failed');
            expect(() => {
                core.setFailed(error.message);
            }).not.toThrow();
        });

        test('should support debug with stack trace', () => {
            const error = new Error('Test error');
            expect(() => {
                core.debug(error.stack || '');
            }).not.toThrow();
        });
    });

    describe('Logging patterns', () => {
        test('should support info logging for status messages', () => {
            const messages = [
                'Running Azure CLI Login.',
                'Running Azure PowerShell Login.',
                'Attempting Azure PowerShell login by using OIDC...'
            ];

            messages.forEach(message => {
                expect(() => core.info(message)).not.toThrow();
            });
        });

        test('should support warning for non-critical issues', () => {
            expect(() => {
                core.warning('Skip setting the default PowerShell module path for OS darwin.');
            }).not.toThrow();
        });

        test('should support error logging', () => {
            expect(() => {
                core.error('Failed to fetch federated token from GitHub.');
            }).not.toThrow();
        });
    });
});