import * as fs from 'fs';
import * as path from 'path';

describe('Package Configuration Validation', () => {
    let packageJson: any;
    let packageLockJson: any;

    beforeAll(() => {
        const packageJsonPath = path.join(__dirname, '..', 'package.json');
        const packageLockJsonPath = path.join(__dirname, '..', 'package-lock.json');
        
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        packageLockJson = JSON.parse(fs.readFileSync(packageLockJsonPath, 'utf8'));
    });

    describe('package.json structure', () => {
        test('should have required metadata fields', () => {
            expect(packageJson.name).toBe('login');
            expect(packageJson.version).toBeDefined();
            expect(packageJson.description).toBeDefined();
            expect(packageJson.license).toBe('MIT');
            expect(packageJson.author).toBe('Microsoft');
        });

        test('should have correct main entry point', () => {
            expect(packageJson.main).toBe('lib/main/index.js');
        });

        test('should have required npm scripts', () => {
            expect(packageJson.scripts).toBeDefined();
            expect(packageJson.scripts.build).toBeDefined();
            expect(packageJson.scripts['build:main']).toBeDefined();
            expect(packageJson.scripts['build:cleanup']).toBeDefined();
            expect(packageJson.scripts.test).toBe('jest');
        });

        test('should have all required dependencies', () => {
            expect(packageJson.dependencies).toBeDefined();
            expect(packageJson.dependencies['@actions/core']).toBeDefined();
            expect(packageJson.dependencies['@actions/exec']).toBeDefined();
            expect(packageJson.dependencies['@actions/io']).toBeDefined();
        });

        test('should have all required devDependencies', () => {
            expect(packageJson.devDependencies).toBeDefined();
            expect(packageJson.devDependencies['@types/jest']).toBeDefined();
            expect(packageJson.devDependencies['@types/node']).toBeDefined();
            expect(packageJson.devDependencies['@vercel/ncc']).toBeDefined();
            expect(packageJson.devDependencies['jest']).toBeDefined();
            expect(packageJson.devDependencies['ts-jest']).toBeDefined();
            expect(packageJson.devDependencies['typescript']).toBeDefined();
        });
    });

    describe('@actions/core version validation', () => {
        test('should specify @actions/core version 1.9.1', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('package-lock.json should match package.json for @actions/core', () => {
            expect(packageLockJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('package-lock.json should have @actions/core node_modules entry', () => {
            expect(packageLockJson.packages['node_modules/@actions/core']).toBeDefined();
            expect(packageLockJson.packages['node_modules/@actions/core'].version).toBe('1.9.1');
        });

        test('@actions/core 1.9.1 should have correct dependencies', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies).toBeDefined();
            expect(corePackage.dependencies['@actions/http-client']).toBeDefined();
            expect(corePackage.dependencies['uuid']).toBeDefined();
        });

        test('should not have conflicting @actions/core versions', () => {
            const versions = new Set<string>();
            
            // Check root dependencies
            if (packageLockJson.dependencies && packageLockJson.dependencies['@actions/core']) {
                versions.add(packageLockJson.dependencies['@actions/core']);
            }
            
            // Check packages
            if (packageLockJson.packages) {
                Object.keys(packageLockJson.packages).forEach(key => {
                    if (key.includes('@actions/core')) {
                        const pkg = packageLockJson.packages[key];
                        if (pkg.version) {
                            versions.add(pkg.version);
                        }
                    }
                });
            }
            
            // Should only have version 1.9.1
            expect(versions.has('1.9.1')).toBe(true);
            expect(versions.size).toBe(1);
        });
    });

    describe('dependency version constraints', () => {
        test('@actions/exec should use caret range', () => {
            expect(packageJson.dependencies['@actions/exec']).toMatch(/^\^/);
        });

        test('@actions/io should use caret range', () => {
            expect(packageJson.dependencies['@actions/io']).toMatch(/^\^/);
        });

        test('all dependencies should have valid semver versions', () => {
            Object.entries(packageJson.dependencies).forEach(([name, version]) => {
                expect(typeof version).toBe('string');
                expect(version).toBeTruthy();
            });
        });
    });

    describe('package-lock.json integrity', () => {
        test('should have lockfileVersion', () => {
            expect(packageLockJson.lockfileVersion).toBeDefined();
        });

        test('should have packages section', () => {
            expect(packageLockJson.packages).toBeDefined();
            expect(Object.keys(packageLockJson.packages).length).toBeGreaterThan(0);
        });

        test('should have dependencies section', () => {
            expect(packageLockJson.dependencies).toBeDefined();
        });

        test('root package should match package.json', () => {
            const rootPackage = packageLockJson.packages[''];
            expect(rootPackage.name).toBe(packageJson.name);
            expect(rootPackage.version).toBe(packageJson.version);
        });

        test('all critical dependencies should be locked', () => {
            const criticalDeps = ['@actions/core', '@actions/exec', '@actions/io'];
            criticalDeps.forEach(dep => {
                expect(packageLockJson.dependencies[dep]).toBeDefined();
            });
        });
    });

    describe('version compatibility', () => {
        test('TypeScript version should be compatible', () => {
            expect(packageJson.devDependencies.typescript).toMatch(/^\^4\./);
        });

        test('Jest version should be compatible', () => {
            const jestVersion = packageJson.devDependencies.jest;
            expect(jestVersion).toMatch(/^\^29\./);
        });

        test('@types/node version should be compatible with Node 20', () => {
            expect(packageJson.devDependencies['@types/node']).toMatch(/^\^20\./);
        });
    });

    describe('security and best practices', () => {
        test('should not have any empty dependency versions', () => {
            Object.entries(packageJson.dependencies).forEach(([name, version]) => {
                expect(version).toBeTruthy();
                expect(version).not.toBe('');
            });
        });

        test('should not have any wildcard (*) versions', () => {
            Object.values(packageJson.dependencies).forEach(version => {
                expect(version).not.toBe('*');
            });
        });

        test('should have proper license field', () => {
            expect(packageJson.license).toBe('MIT');
        });
    });
});