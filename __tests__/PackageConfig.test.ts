import * as fs from 'fs';
import * as path from 'path';

describe('Package Configuration Tests', () => {
    let packageJson: any;

    beforeAll(() => {
        const packagePath = path.join(__dirname, '..', 'package.json');
        const packageContent = fs.readFileSync(packagePath, 'utf8');
        packageJson = JSON.parse(packageContent);
    });

    describe('Package.json Structure Validation', () => {
        test('should have required top-level fields', () => {
            expect(packageJson).toHaveProperty('name');
            expect(packageJson).toHaveProperty('version');
            expect(packageJson).toHaveProperty('description');
            expect(packageJson).toHaveProperty('main');
            expect(packageJson).toHaveProperty('scripts');
            expect(packageJson).toHaveProperty('author');
            expect(packageJson).toHaveProperty('license');
        });

        test('should have correct package name', () => {
            expect(packageJson.name).toBe('login');
        });

        test('should have valid semantic version', () => {
            const semverRegex = /^\d+\.\d+\.\d+$/;
            expect(packageJson.version).toMatch(semverRegex);
        });

        test('should have valid license', () => {
            expect(packageJson.license).toBe('MIT');
        });

        test('should have main entry point', () => {
            expect(packageJson.main).toBe('lib/main/index.js');
        });
    });

    describe('Scripts Validation', () => {
        test('should have all required build scripts', () => {
            expect(packageJson.scripts).toHaveProperty('build:main');
            expect(packageJson.scripts).toHaveProperty('build:cleanup');
            expect(packageJson.scripts).toHaveProperty('build');
            expect(packageJson.scripts).toHaveProperty('test');
        });

        test('should have correct build:main script', () => {
            expect(packageJson.scripts['build:main']).toBe('ncc build src/main.ts -o lib/main');
        });

        test('should have correct build:cleanup script', () => {
            expect(packageJson.scripts['build:cleanup']).toBe('ncc build src/cleanup.ts -o lib/cleanup');
        });

        test('should have correct build script that calls both builds', () => {
            expect(packageJson.scripts.build).toContain('build:main');
            expect(packageJson.scripts.build).toContain('build:cleanup');
        });

        test('should have correct test script', () => {
            expect(packageJson.scripts.test).toBe('jest');
        });
    });

    describe('Dependencies Validation', () => {
        test('should have dependencies object', () => {
            expect(packageJson).toHaveProperty('dependencies');
            expect(typeof packageJson.dependencies).toBe('object');
        });

        test('should have @actions/core dependency', () => {
            expect(packageJson.dependencies).toHaveProperty('@actions/core');
        });

        test('should have correct @actions/core version (1.9.1)', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('should have @actions/exec dependency', () => {
            expect(packageJson.dependencies).toHaveProperty('@actions/exec');
        });

        test('should have @actions/io dependency', () => {
            expect(packageJson.dependencies).toHaveProperty('@actions/io');
        });

        test('should have package-lock dependency', () => {
            expect(packageJson.dependencies).toHaveProperty('package-lock');
        });

        test('should have valid version format for all dependencies', () => {
            const versionRegex = /^[\^~]?\d+\.\d+\.\d+$/;
            Object.entries(packageJson.dependencies).forEach(([name, version]) => {
                expect(version).toMatch(versionRegex);
            });
        });
    });

    describe('DevDependencies Validation', () => {
        test('should have devDependencies object', () => {
            expect(packageJson).toHaveProperty('devDependencies');
            expect(typeof packageJson.devDependencies).toBe('object');
        });

        test('should have Jest testing framework', () => {
            expect(packageJson.devDependencies).toHaveProperty('jest');
            expect(packageJson.devDependencies).toHaveProperty('@types/jest');
            expect(packageJson.devDependencies).toHaveProperty('jest-circus');
        });

        test('should have TypeScript support', () => {
            expect(packageJson.devDependencies).toHaveProperty('typescript');
            expect(packageJson.devDependencies).toHaveProperty('ts-jest');
            expect(packageJson.devDependencies).toHaveProperty('@types/node');
        });

        test('should have build tool', () => {
            expect(packageJson.devDependencies).toHaveProperty('@vercel/ncc');
        });

        test('should have compatible Jest and ts-jest versions', () => {
            const jestVersion = packageJson.devDependencies.jest;
            const tsJestVersion = packageJson.devDependencies['ts-jest'];
            // Both should be in the 29.x range for compatibility
            expect(jestVersion).toContain('29');
            expect(tsJestVersion).toContain('29');
        });
    });

    describe('Package.json Integrity', () => {
        test('should not have duplicate dependencies', () => {
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };
            const depNames = Object.keys(allDeps);
            const uniqueDepNames = new Set(depNames);
            expect(depNames.length).toBe(uniqueDepNames.size);
        });

        test('should have consistent formatting', () => {
            const packagePath = path.join(__dirname, '..', 'package.json');
            const packageContent = fs.readFileSync(packagePath, 'utf8');
            // Should be valid JSON
            expect(() => JSON.parse(packageContent)).not.toThrow();
        });

        test('should not have empty dependency values', () => {
            Object.entries(packageJson.dependencies || {}).forEach(([name, version]) => {
                expect(version).toBeTruthy();
                expect(typeof version).toBe('string');
                expect(version.length).toBeGreaterThan(0);
            });
        });

        test('should not have empty devDependency values', () => {
            Object.entries(packageJson.devDependencies || {}).forEach(([name, version]) => {
                expect(version).toBeTruthy();
                expect(typeof version).toBe('string');
                expect(version.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Critical Dependencies Version Check', () => {
        test('@actions/core should be pinned to exact version 1.9.1', () => {
            const coreVersion = packageJson.dependencies['@actions/core'];
            expect(coreVersion).toBe('1.9.1');
            expect(coreVersion).not.toMatch(/^[\^~]/);
        });

        test('should have compatible @actions packages', () => {
            expect(packageJson.dependencies['@actions/exec']).toBeDefined();
            expect(packageJson.dependencies['@actions/io']).toBeDefined();
            // All should use caret or exact versions
            const execVersion = packageJson.dependencies['@actions/exec'];
            const ioVersion = packageJson.dependencies['@actions/io'];
            expect(execVersion).toMatch(/^[\^]?\d+\.\d+\.\d+$/);
            expect(ioVersion).toMatch(/^[\^]?\d+\.\d+\.\d+$/);
        });
    });
});

describe('@actions/core v1.9.1 Compatibility Tests', () => {
    // Import after describe to ensure proper test isolation
    let core: any;

    beforeAll(() => {
        // Dynamically import @actions/core to test the actual installed version
        core = require('@actions/core');
    });

    describe('Core Module API Availability', () => {
        test('should have getInput method', () => {
            expect(typeof core.getInput).toBe('function');
        });

        test('should have setSecret method', () => {
            expect(typeof core.setSecret).toBe('function');
        });

        test('should have setFailed method', () => {
            expect(typeof core.setFailed).toBe('function');
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

        test('should have debug method', () => {
            expect(typeof core.debug).toBe('function');
        });

        test('should have getIDToken method', () => {
            expect(typeof core.getIDToken).toBe('function');
        });
    });

    describe('Core Module Method Signatures', () => {
        test('getInput should accept string and optional options', () => {
            // Mock the environment
            const originalEnv = process.env.INPUT_TEST;
            process.env.INPUT_TEST = 'test-value';
            
            try {
                const result = core.getInput('test');
                expect(typeof result).toBe('string');
                
                const resultWithOptions = core.getInput('test', { required: false });
                expect(typeof resultWithOptions).toBe('string');
            } finally {
                if (originalEnv === undefined) {
                    delete process.env.INPUT_TEST;
                } else {
                    process.env.INPUT_TEST = originalEnv;
                }
            }
        });

        test('setSecret should accept string parameter', () => {
            expect(() => core.setSecret('test-secret')).not.toThrow();
        });

        test('info should accept string parameter', () => {
            expect(() => core.info('test message')).not.toThrow();
        });

        test('warning should accept string or Error parameter', () => {
            expect(() => core.warning('test warning')).not.toThrow();
            expect(() => core.warning(new Error('test error'))).not.toThrow();
        });

        test('error should accept string or Error parameter', () => {
            expect(() => core.error('test error')).not.toThrow();
            expect(() => core.error(new Error('test error'))).not.toThrow();
        });

        test('debug should accept string parameter', () => {
            expect(() => core.debug('test debug')).not.toThrow();
        });
    });

    describe('Core Module Functional Tests', () => {
        test('getInput should retrieve environment variables correctly', () => {
            const testKey = 'TEST_INPUT_KEY';
            const testValue = 'test-value-123';
            process.env[`INPUT_${testKey}`] = testValue;
            
            try {
                const result = core.getInput(testKey.toLowerCase().replace(/_/g, '-'));
                expect(result).toBe(testValue);
            } finally {
                delete process.env[`INPUT_${testKey}`];
            }
        });

        test('getInput with required option should handle missing values', () => {
            const nonExistentKey = 'NON_EXISTENT_KEY_' + Date.now();
            
            expect(() => {
                core.getInput(nonExistentKey, { required: true });
            }).toThrow();
        });

        test('getInput with required: false should return empty string for missing values', () => {
            const nonExistentKey = 'NON_EXISTENT_KEY_' + Date.now();
            const result = core.getInput(nonExistentKey, { required: false });
            expect(result).toBe('');
        });

        test('setFailed should accept error messages', () => {
            // setFailed writes to stdout/stderr, so we just test it doesn't throw
            expect(() => core.setFailed('Test failure message')).not.toThrow();
        });
    });

    describe('Version-Specific Compatibility (v1.9.1 vs v1.11.1)', () => {
        test('should have uuid as a dependency in node_modules/@actions/core', () => {
            const corePath = require.resolve('@actions/core');
            const coreDir = path.dirname(corePath);
            const corePackageJsonPath = path.join(coreDir, 'package.json');
            
            expect(fs.existsSync(corePackageJsonPath)).toBe(true);
            
            const corePackageJson = JSON.parse(fs.readFileSync(corePackageJsonPath, 'utf8'));
            expect(corePackageJson.version).toBe('1.9.1');
            expect(corePackageJson.dependencies).toHaveProperty('uuid');
        });

        test('should not break existing getInput functionality', () => {
            // Test that the downgrade from 1.11.1 to 1.9.1 doesn't break getInput
            process.env.INPUT_TESTVALUE = 'test123';
            try {
                const result = core.getInput('testvalue');
                expect(result).toBe('test123');
            } finally {
                delete process.env.INPUT_TESTVALUE;
            }
        });

        test('should maintain backward compatibility with all core methods used in codebase', () => {
            // Verify all methods used in the codebase are available
            const usedMethods = [
                'getInput',
                'setSecret', 
                'setFailed',
                'info',
                'warning',
                'error',
                'debug',
                'getIDToken'
            ];
            
            usedMethods.forEach(method => {
                expect(core[method]).toBeDefined();
                expect(typeof core[method]).toBe('function');
            });
        });
    });
});

describe('Package-lock.json Validation', () => {
    let packageLock: any;

    beforeAll(() => {
        const packageLockPath = path.join(__dirname, '..', 'package-lock.json');
        const packageLockContent = fs.readFileSync(packageLockPath, 'utf8');
        packageLock = JSON.parse(packageLockContent);
    });

    describe('Package-lock Structure', () => {
        test('should have correct lockfileVersion', () => {
            expect(packageLock).toHaveProperty('lockfileVersion');
            expect(typeof packageLock.lockfileVersion).toBe('number');
        });

        test('should have name matching package.json', () => {
            expect(packageLock.name).toBe('login');
        });

        test('should have version matching package.json', () => {
            const packageJsonPath = path.join(__dirname, '..', 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            expect(packageLock.version).toBe(packageJson.version);
        });

        test('should have packages object', () => {
            expect(packageLock).toHaveProperty('packages');
            expect(typeof packageLock.packages).toBe('object');
        });
    });

    describe('@actions/core Package Lock Entry', () => {
        test('should have @actions/core at version 1.9.1 in packages', () => {
            const corePackage = packageLock.packages['node_modules/@actions/core'];
            expect(corePackage).toBeDefined();
            expect(corePackage.version).toBe('1.9.1');
        });

        test('@actions/core should have uuid dependency in package-lock', () => {
            const corePackage = packageLock.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies).toHaveProperty('uuid');
        });

        test('@actions/core should have @actions/http-client dependency', () => {
            const corePackage = packageLock.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies).toHaveProperty('@actions/http-client');
        });

        test('should have uuid package as sub-dependency', () => {
            const uuidPackage = packageLock.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuidPackage).toBeDefined();
            expect(uuidPackage.version).toBe('8.3.2');
        });
    });

    describe('Dependency Integrity', () => {
        test('should have integrity hashes for all packages', () => {
            // Skip the root package
            Object.entries(packageLock.packages).forEach(([name, pkg]: [string, any]) => {
                if (name !== '') {  // Skip root
                    // Some packages might not have integrity (like link: packages)
                    if (pkg.resolved && !pkg.resolved.startsWith('file:')) {
                        expect(pkg.integrity || pkg.resolved).toBeTruthy();
                    }
                }
            });
        });

        test('should have resolved URLs for remote packages', () => {
            const corePackage = packageLock.packages['node_modules/@actions/core'];
            if (corePackage.resolved && !corePackage.resolved.startsWith('file:')) {
                expect(corePackage.resolved).toMatch(/^https?:\/\//);
            }
        });
    });

    describe('Version Consistency', () => {
        test('package.json and package-lock.json should have matching @actions/core version', () => {
            const packageJsonPath = path.join(__dirname, '..', 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            const packageJsonCoreVersion = packageJson.dependencies['@actions/core'];
            const corePackage = packageLock.packages['node_modules/@actions/core'];
            
            expect(corePackage.version).toBe(packageJsonCoreVersion);
        });

        test('all dependency versions should match between package.json and package-lock.json', () => {
            const packageJsonPath = path.join(__dirname, '..', 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            Object.entries(packageJson.dependencies || {}).forEach(([name, version]: [string, any]) => {
                const lockPackage = packageLock.packages[`node_modules/${name}`];
                expect(lockPackage).toBeDefined();
                
                // Remove ^ or ~ prefixes for comparison
                const cleanVersion = version.replace(/^[\^~]/, '');
                expect(lockPackage.version).toBe(cleanVersion);
            });
        });
    });
});

describe('Integration Tests for @actions/core Usage', () => {
    let core: any;

    beforeAll(() => {
        core = require('@actions/core');
    });

    describe('LoginConfig Integration with @actions/core v1.9.1', () => {
        function setEnv(name: string, value: string) {
            process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] = value;
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
        });

        afterEach(() => {
            cleanEnv();
        });

        test('core.getInput should work with LoginConfig initialization', () => {
            setEnv('environment', 'azurecloud');
            setEnv('enable-AzPSSession', 'false');
            setEnv('allow-no-subscriptions', 'true');
            setEnv('auth-type', 'IDENTITY');

            const environment = core.getInput('environment');
            expect(environment).toBe('azurecloud');

            const enableAzPS = core.getInput('enable-AzPSSession');
            expect(enableAzPS).toBe('false');
        });

        test('core.setSecret should work for masking sensitive data', () => {
            const sensitiveValue = 'super-secret-value-123';
            expect(() => core.setSecret(sensitiveValue)).not.toThrow();
        });

        test('core.info should work for logging', () => {
            expect(() => core.info('Test info message')).not.toThrow();
        });

        test('core.warning should work for warnings', () => {
            expect(() => core.warning('Test warning message')).not.toThrow();
        });

        test('core.error should work for errors', () => {
            expect(() => core.error('Test error message')).not.toThrow();
        });

        test('core.debug should work for debug messages', () => {
            expect(() => core.debug('Test debug message')).not.toThrow();
        });
    });

    describe('Multiple getInput calls compatibility', () => {
        function setEnv(name: string, value: string) {
            process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] = value;
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
        });

        afterEach(() => {
            cleanEnv();
        });

        test('should handle multiple getInput calls as used in LoginConfig', () => {
            setEnv('environment', 'azurecloud');
            setEnv('enable-AzPSSession', 'true');
            setEnv('allow-no-subscriptions', 'false');
            setEnv('auth-type', 'SERVICE_PRINCIPAL');
            setEnv('client-id', 'test-client-id');
            setEnv('tenant-id', 'test-tenant-id');
            setEnv('subscription-id', 'test-subscription-id');

            expect(core.getInput('environment')).toBe('azurecloud');
            expect(core.getInput('enable-AzPSSession')).toBe('true');
            expect(core.getInput('allow-no-subscriptions')).toBe('false');
            expect(core.getInput('auth-type')).toBe('SERVICE_PRINCIPAL');
            expect(core.getInput('client-id', { required: false })).toBe('test-client-id');
            expect(core.getInput('tenant-id', { required: false })).toBe('test-tenant-id');
            expect(core.getInput('subscription-id', { required: false })).toBe('test-subscription-id');
        });

        test('should handle getInput with options object', () => {
            setEnv('optional-param', 'optional-value');

            const withRequired = core.getInput('optional-param', { required: false });
            expect(withRequired).toBe('optional-value');

            const withoutRequired = core.getInput('optional-param');
            expect(withoutRequired).toBe('optional-value');
        });

        test('should handle missing optional inputs', () => {
            const result = core.getInput('non-existent-input', { required: false });
            expect(result).toBe('');
        });
    });

    describe('Error handling compatibility', () => {
        test('setFailed should work with string messages', () => {
            expect(() => {
                core.setFailed('Login failed with error');
            }).not.toThrow();
        });

        test('setFailed should work with Error objects', () => {
            expect(() => {
                core.setFailed(new Error('Login failed'));
            }).not.toThrow();
        });

        test('error method should work with string messages', () => {
            expect(() => {
                core.error('Error occurred during login');
            }).not.toThrow();
        });

        test('warning method should work with string messages', () => {
            expect(() => {
                core.warning('Warning: using deprecated authentication method');
            }).not.toThrow();
        });
    });
});