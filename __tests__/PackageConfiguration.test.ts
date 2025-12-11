import * as fs from 'fs';
import * as path from 'path';

describe('Package Configuration Validation', () => {
    let packageJson: any;
    let packageLockJson: any;
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageLockJsonPath = path.join(__dirname, '../package-lock.json');

    beforeAll(() => {
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        packageJson = JSON.parse(packageJsonContent);
        const packageLockJsonContent = fs.readFileSync(packageLockJsonPath, 'utf8');
        packageLockJson = JSON.parse(packageLockJsonContent);
    });

    describe('package.json Schema Validation', () => {
        test('should have required top-level fields', () => {
            expect(packageJson).toHaveProperty('name');
            expect(packageJson).toHaveProperty('version');
            expect(packageJson).toHaveProperty('description');
            expect(packageJson).toHaveProperty('main');
            expect(packageJson).toHaveProperty('scripts');
            expect(packageJson).toHaveProperty('author');
            expect(packageJson).toHaveProperty('license');
        });

        test('should have valid name field', () => {
            expect(typeof packageJson.name).toBe('string');
            expect(packageJson.name).toBe('login');
            expect(packageJson.name.length).toBeGreaterThan(0);
        });

        test('should have valid version field', () => {
            expect(typeof packageJson.version).toBe('string');
            expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
        });

        test('should have valid description field', () => {
            expect(typeof packageJson.description).toBe('string');
            expect(packageJson.description.length).toBeGreaterThan(0);
        });

        test('should have valid main entry point', () => {
            expect(typeof packageJson.main).toBe('string');
            expect(packageJson.main).toBe('lib/main/index.js');
        });

        test('should have valid author field', () => {
            expect(typeof packageJson.author).toBe('string');
            expect(packageJson.author).toBe('Microsoft');
        });

        test('should have valid license field', () => {
            expect(typeof packageJson.license).toBe('string');
            expect(packageJson.license).toBe('MIT');
        });
    });

    describe('package.json Scripts Validation', () => {
        test('should have required build scripts', () => {
            expect(packageJson.scripts).toHaveProperty('build:main');
            expect(packageJson.scripts).toHaveProperty('build:cleanup');
            expect(packageJson.scripts).toHaveProperty('build');
            expect(packageJson.scripts).toHaveProperty('test');
        });

        test('should have valid build:main script', () => {
            expect(packageJson.scripts['build:main']).toContain('ncc build');
            expect(packageJson.scripts['build:main']).toContain('src/main.ts');
            expect(packageJson.scripts['build:main']).toContain('-o lib/main');
        });

        test('should have valid build:cleanup script', () => {
            expect(packageJson.scripts['build:cleanup']).toContain('ncc build');
            expect(packageJson.scripts['build:cleanup']).toContain('src/cleanup.ts');
            expect(packageJson.scripts['build:cleanup']).toContain('-o lib/cleanup');
        });

        test('should have valid build script that runs both build steps', () => {
            expect(packageJson.scripts.build).toContain('npm run build:main');
            expect(packageJson.scripts.build).toContain('npm run build:cleanup');
        });

        test('should have valid test script', () => {
            expect(packageJson.scripts.test).toBe('jest');
        });

        test('should not have any empty script definitions', () => {
            Object.values(packageJson.scripts).forEach((script: any) => {
                expect(typeof script).toBe('string');
                expect(script.length).toBeGreaterThan(0);
            });
        });
    });

    describe('package.json Dependencies Validation', () => {
        test('should have dependencies object', () => {
            expect(packageJson).toHaveProperty('dependencies');
            expect(typeof packageJson.dependencies).toBe('object');
        });

        test('should have devDependencies object', () => {
            expect(packageJson).toHaveProperty('devDependencies');
            expect(typeof packageJson.devDependencies).toBe('object');
        });

        test('should have required runtime dependencies', () => {
            expect(packageJson.dependencies).toHaveProperty('@actions/core');
            expect(packageJson.dependencies).toHaveProperty('@actions/exec');
            expect(packageJson.dependencies).toHaveProperty('@actions/io');
        });

        test('should have @actions/core at exact version 1.9.1', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('should have @actions/exec dependency', () => {
            expect(packageJson.dependencies['@actions/exec']).toBeDefined();
            expect(typeof packageJson.dependencies['@actions/exec']).toBe('string');
        });

        test('should have @actions/io dependency', () => {
            expect(packageJson.dependencies['@actions/io']).toBeDefined();
            expect(typeof packageJson.dependencies['@actions/io']).toBe('string');
        });

        test('should have required dev dependencies for testing', () => {
            expect(packageJson.devDependencies).toHaveProperty('jest');
            expect(packageJson.devDependencies).toHaveProperty('ts-jest');
            expect(packageJson.devDependencies).toHaveProperty('@types/jest');
        });

        test('should have required dev dependencies for TypeScript', () => {
            expect(packageJson.devDependencies).toHaveProperty('typescript');
            expect(packageJson.devDependencies).toHaveProperty('@types/node');
        });

        test('should have required dev dependencies for building', () => {
            expect(packageJson.devDependencies).toHaveProperty('@vercel/ncc');
        });

        test('should not have duplicate dependencies', () => {
            const deps = Object.keys(packageJson.dependencies || {});
            const devDeps = Object.keys(packageJson.devDependencies || {});
            const duplicates = deps.filter(dep => devDeps.includes(dep));
            expect(duplicates).toEqual([]);
        });

        test('should have valid semver version strings', () => {
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };
            
            Object.entries(allDeps).forEach(([name, version]: [string, any]) => {
                expect(typeof version).toBe('string');
                expect(version.length).toBeGreaterThan(0);
                expect(version).toMatch(/^[\^~]?\d+\.\d+\.\d+$|^\d+\.\d+\.\d+$/);
            });
        });
    });

    describe('package-lock.json Schema Validation', () => {
        test('should exist and be valid JSON', () => {
            expect(packageLockJson).toBeDefined();
            expect(typeof packageLockJson).toBe('object');
        });

        test('should have required top-level fields', () => {
            expect(packageLockJson).toHaveProperty('name');
            expect(packageLockJson).toHaveProperty('version');
            expect(packageLockJson).toHaveProperty('lockfileVersion');
        });

        test('should have matching name with package.json', () => {
            expect(packageLockJson.name).toBe(packageJson.name);
        });

        test('should have matching version with package.json', () => {
            expect(packageLockJson.version).toBe(packageJson.version);
        });

        test('should have valid lockfileVersion', () => {
            expect(typeof packageLockJson.lockfileVersion).toBe('number');
            expect(packageLockJson.lockfileVersion).toBeGreaterThanOrEqual(1);
        });

        test('should have packages or dependencies field', () => {
            const hasPackages = packageLockJson.hasOwnProperty('packages');
            const hasDependencies = packageLockJson.hasOwnProperty('dependencies');
            expect(hasPackages || hasDependencies).toBeTruthy();
        });
    });

    describe('package-lock.json Dependency Integrity', () => {
        test('should have @actions/core at version 1.9.1', () => {
            if (packageLockJson.packages) {
                const corePackage = packageLockJson.packages['node_modules/@actions/core'];
                expect(corePackage).toBeDefined();
                expect(corePackage.version).toBe('1.9.1');
            }
        });

        test('should have @actions/core with required dependencies', () => {
            if (packageLockJson.packages) {
                const corePackage = packageLockJson.packages['node_modules/@actions/core'];
                expect(corePackage).toBeDefined();
                expect(corePackage.dependencies).toBeDefined();
                expect(corePackage.dependencies).toHaveProperty('@actions/http-client');
                expect(corePackage.dependencies).toHaveProperty('uuid');
            }
        });

        test('should have uuid as a dependency of @actions/core', () => {
            if (packageLockJson.packages) {
                const corePackage = packageLockJson.packages['node_modules/@actions/core'];
                expect(corePackage.dependencies.uuid).toBe('^8.3.2');
            }
        });

        test('should have nested uuid package under @actions/core', () => {
            if (packageLockJson.packages) {
                const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
                expect(uuidPackage).toBeDefined();
                expect(uuidPackage.version).toBe('8.3.2');
            }
        });

        test('should have all runtime dependencies from package.json in lock file', () => {
            const deps = Object.keys(packageJson.dependencies);
            
            if (packageLockJson.packages) {
                deps.forEach(dep => {
                    const packageKey = `node_modules/${dep}`;
                    expect(packageLockJson.packages[packageKey]).toBeDefined();
                });
            }
        });

        test('should have valid version for @actions/exec', () => {
            if (packageLockJson.packages) {
                const execPackage = packageLockJson.packages['node_modules/@actions/exec'];
                expect(execPackage).toBeDefined();
                expect(execPackage.version).toBeDefined();
                expect(execPackage.version).toMatch(/^\d+\.\d+\.\d+$/);
            }
        });

        test('should have valid version for @actions/io', () => {
            if (packageLockJson.packages) {
                const ioPackage = packageLockJson.packages['node_modules/@actions/io'];
                expect(ioPackage).toBeDefined();
                expect(ioPackage.version).toBeDefined();
                expect(ioPackage.version).toMatch(/^\d+\.\d+\.\d+$/);
            }
        });
    });

    describe('Dependency Version Consistency', () => {
        test('@actions/core version should match between package.json and package-lock.json', () => {
            const packageJsonVersion = packageJson.dependencies['@actions/core'];
            
            if (packageLockJson.packages) {
                const lockVersion = packageLockJson.packages['node_modules/@actions/core'].version;
                const cleanPackageVersion = packageJsonVersion.replace(/^[\^~]/, '');
                expect(lockVersion).toBe(cleanPackageVersion);
            }
        });

        test('should not have version conflicts in critical dependencies', () => {
            if (packageLockJson.packages) {
                const versionMap = new Map<string, Set<string>>();
                
                Object.entries(packageLockJson.packages).forEach(([key, pkg]: [string, any]) => {
                    if (key.startsWith('node_modules/')) {
                        const packageName = key.replace(/^node_modules\//, '').split('/node_modules/')[0];
                        if (!versionMap.has(packageName)) {
                            versionMap.set(packageName, new Set());
                        }
                        if (pkg.version) {
                            versionMap.get(packageName)!.add(pkg.version);
                        }
                    }
                });

                const criticalPackages = ['@actions/core', '@actions/exec', '@actions/io'];
                const conflicts: string[] = [];
                
                criticalPackages.forEach(pkgName => {
                    const versions = versionMap.get(pkgName);
                    if (versions && versions.size > 1) {
                        conflicts.push(`${pkgName}: ${Array.from(versions).join(', ')}`);
                    }
                });
                
                expect(conflicts).toEqual([]);
            }
        });
    });

    describe('Security and Best Practices', () => {
        test('should not have any file:// protocol dependencies', () => {
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };
            
            Object.values(allDeps).forEach((version: any) => {
                expect(version).not.toMatch(/^file:/);
            });
        });

        test('should not have any git:// protocol dependencies', () => {
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };
            
            Object.values(allDeps).forEach((version: any) => {
                expect(version).not.toMatch(/^git:/);
            });
        });

        test('should not have any http:// protocol dependencies', () => {
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };
            
            Object.values(allDeps).forEach((version: any) => {
                expect(version).not.toMatch(/^http:\/\//);
            });
        });

        test('should have license field defined', () => {
            expect(packageJson.license).toBeDefined();
            expect(packageJson.license).toBe('MIT');
        });

        test('should have a reasonable number of dependencies', () => {
            const depsCount = Object.keys(packageJson.dependencies).length;
            const devDepsCount = Object.keys(packageJson.devDependencies).length;
            
            expect(depsCount).toBeGreaterThan(0);
            expect(depsCount).toBeLessThan(50);
            expect(devDepsCount).toBeGreaterThan(0);
            expect(devDepsCount).toBeLessThan(50);
        });
    });

    describe('Critical Dependency Pinning', () => {
        test('@actions/core should be pinned to exact version', () => {
            const version = packageJson.dependencies['@actions/core'];
            expect(version).not.toMatch(/^[\^~]/);
            expect(version).toBe('1.9.1');
        });

        test('pinned version should prevent automatic updates', () => {
            const version = packageJson.dependencies['@actions/core'];
            expect(version).toMatch(/^\d+\.\d+\.\d+$/);
        });
    });

    describe('Package Structure Validation', () => {
        test('package.json should be properly formatted', () => {
            const content = fs.readFileSync(packageJsonPath, 'utf8');
            expect(() => JSON.parse(content)).not.toThrow();
        });

        test('package-lock.json should be properly formatted', () => {
            const content = fs.readFileSync(packageLockJsonPath, 'utf8');
            expect(() => JSON.parse(content)).not.toThrow();
        });

        test('should not have trailing commas in JSON', () => {
            const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
            const lockContent = fs.readFileSync(packageLockJsonPath, 'utf8');
            
            expect(() => JSON.parse(packageContent)).not.toThrow();
            expect(() => JSON.parse(lockContent)).not.toThrow();
        });
    });

    describe('@actions/core Version Specific Tests', () => {
        test('should use version 1.9.1 specifically (not 1.11.1)', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
            expect(packageJson.dependencies['@actions/core']).not.toBe('1.11.1');
            expect(packageJson.dependencies['@actions/core']).not.toBe('^1.11.1');
        });

        test('lock file should reflect @actions/core 1.9.1', () => {
            if (packageLockJson.packages) {
                const corePackage = packageLockJson.packages['node_modules/@actions/core'];
                expect(corePackage.version).toBe('1.9.1');
                expect(corePackage.version).not.toBe('1.11.1');
            }
        });

        test('@actions/core 1.9.1 should have uuid dependency', () => {
            if (packageLockJson.packages) {
                const corePackage = packageLockJson.packages['node_modules/@actions/core'];
                expect(corePackage.dependencies).toHaveProperty('uuid');
            }
        });

        test('uuid should be version 8.3.2 for @actions/core 1.9.1', () => {
            if (packageLockJson.packages) {
                const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
                expect(uuidPackage).toBeDefined();
                expect(uuidPackage.version).toBe('8.3.2');
            }
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle missing optional fields gracefully', () => {
            const optionalFields = ['repository', 'bugs', 'homepage', 'keywords'];
            
            optionalFields.forEach(field => {
                expect(() => packageJson[field]).not.toThrow();
            });
        });

        test('should have no empty dependency objects', () => {
            if (packageJson.dependencies) {
                expect(Object.keys(packageJson.dependencies).length).toBeGreaterThan(0);
            }
            if (packageJson.devDependencies) {
                expect(Object.keys(packageJson.devDependencies).length).toBeGreaterThan(0);
            }
        });

        test('should not have null or undefined dependency versions', () => {
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };
            
            Object.entries(allDeps).forEach(([name, version]) => {
                expect(version).not.toBeNull();
                expect(version).not.toBeUndefined();
                expect(version).toBeTruthy();
            });
        });
    });
});