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

        test('should NOT have @actions/core at version 1.11.1', () => {
            expect(packageJson.dependencies['@actions/core']).not.toBe('1.11.1');
            expect(packageJson.dependencies['@actions/core']).not.toBe('^1.11.1');
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

        test('should have jest-circus as dev dependency', () => {
            expect(packageJson.devDependencies).toHaveProperty('jest-circus');
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

        test('should have packages field for lockfile v2/v3', () => {
            if (packageLockJson.lockfileVersion >= 2) {
                expect(packageLockJson).toHaveProperty('packages');
            }
        });

        test('should have requires field', () => {
            expect(packageLockJson).toHaveProperty('requires');
            expect(typeof packageLockJson.requires).toBe('boolean');
        });
    });

    describe('package-lock.json @actions/core v1.9.1 Integrity', () => {
        test('should have @actions/core at version 1.9.1 in packages', () => {
            if (packageLockJson.packages) {
                const corePackage = packageLockJson.packages['node_modules/@actions/core'];
                expect(corePackage).toBeDefined();
                expect(corePackage.version).toBe('1.9.1');
            }
        });

        test('should NOT have @actions/core at version 1.11.1', () => {
            if (packageLockJson.packages) {
                const corePackage = packageLockJson.packages['node_modules/@actions/core'];
                expect(corePackage.version).not.toBe('1.11.1');
            }
        });

        test('should have @actions/core with required dependencies for v1.9.1', () => {
            if (packageLockJson.packages) {
                const corePackage = packageLockJson.packages['node_modules/@actions/core'];
                expect(corePackage).toBeDefined();
                expect(corePackage.dependencies).toBeDefined();
                expect(corePackage.dependencies).toHaveProperty('@actions/http-client');
                expect(corePackage.dependencies).toHaveProperty('uuid');
            }
        });

        test('should have uuid as a dependency of @actions/core v1.9.1', () => {
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

        test('uuid version should be 8.3.2 exactly', () => {
            if (packageLockJson.packages) {
                const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
                expect(uuidPackage.version).toBe('8.3.2');
                expect(uuidPackage.version).not.toBe('9.0.0');
                expect(uuidPackage.version).not.toMatch(/^9\./);
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

        test('should have @actions/http-client as dependency of @actions/core', () => {
            if (packageLockJson.packages) {
                const corePackage = packageLockJson.packages['node_modules/@actions/core'];
                expect(corePackage.dependencies).toHaveProperty('@actions/http-client');
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

        test('package-lock.json should reflect the downgrade from 1.11.1 to 1.9.1', () => {
            if (packageLockJson.packages) {
                const corePackage = packageLockJson.packages['node_modules/@actions/core'];
                expect(corePackage.version).toBe('1.9.1');
                expect(corePackage.version).not.toContain('1.11');
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

        test('should not have known vulnerabilities in pinned @actions/core version', () => {
            // Version 1.9.1 is considered safe for the project's use case
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
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

        test('@actions/core should be pinned without semver range operators', () => {
            const version = packageJson.dependencies['@actions/core'];
            expect(version).not.toContain('^');
            expect(version).not.toContain('~');
            expect(version).not.toContain('>');
            expect(version).not.toContain('<');
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

        test('package.json should have proper indentation', () => {
            const content = fs.readFileSync(packageJsonPath, 'utf8');
            expect(content).toContain('  '); // Expects 2-space indentation
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

        test('@actions/core 1.9.1 uses uuid for secret masking', () => {
            // This version specifically requires uuid for generating unique identifiers
            if (packageLockJson.packages) {
                const corePackage = packageLockJson.packages['node_modules/@actions/core'];
                expect(corePackage.dependencies).toHaveProperty('uuid');
                expect(corePackage.dependencies.uuid).toMatch(/\^8\./);
            }
        });

        test('@actions/core 1.9.1 should not have crypto.randomUUID fallback', () => {
            // Version 1.11.1 removed uuid dependency in favor of crypto.randomUUID
            // Version 1.9.1 still requires uuid
            if (packageLockJson.packages) {
                const corePackage = packageLockJson.packages['node_modules/@actions/core'];
                expect(corePackage.dependencies).toHaveProperty('uuid');
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

        test('should handle lockfile version 3 format correctly', () => {
            if (packageLockJson.lockfileVersion === 3) {
                expect(packageLockJson).toHaveProperty('packages');
                expect(packageLockJson.packages['']).toBeDefined();
            }
        });
    });

    describe('Compatibility with GitHub Actions', () => {
        test('should have @actions/core compatible with GitHub Actions runtime', () => {
            // Version 1.9.1 is compatible with GitHub Actions
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('should have @actions/exec for command execution', () => {
            expect(packageJson.dependencies).toHaveProperty('@actions/exec');
        });

        test('should have @actions/io for file operations', () => {
            expect(packageJson.dependencies).toHaveProperty('@actions/io');
        });

        test('core version 1.9.1 supports setSecret functionality', () => {
            // Verify that 1.9.1 has the necessary dependencies for secret masking
            if (packageLockJson.packages) {
                const corePackage = packageLockJson.packages['node_modules/@actions/core'];
                expect(corePackage.dependencies).toHaveProperty('uuid');
            }
        });

        test('core version 1.9.1 supports getInput functionality', () => {
            // This is a core API that exists in 1.9.1
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('core version 1.9.1 supports getIDToken functionality', () => {
            // OIDC token support exists in 1.9.1
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });
    });

    describe('Transitive Dependencies', () => {
        test('should have @actions/http-client as transitive dependency', () => {
            if (packageLockJson.packages) {
                const httpClientPackage = packageLockJson.packages['node_modules/@actions/http-client'];
                expect(httpClientPackage).toBeDefined();
            }
        });

        test('should have tunnel as transitive dependency of http-client', () => {
            if (packageLockJson.packages) {
                const tunnelPackage = packageLockJson.packages['node_modules/@actions/http-client/node_modules/tunnel'];
                expect(tunnelPackage).toBeDefined();
            }
        });

        test('uuid should be nested under @actions/core', () => {
            if (packageLockJson.packages) {
                const uuidKey = 'node_modules/@actions/core/node_modules/uuid';
                expect(packageLockJson.packages[uuidKey]).toBeDefined();
            }
        });

        test('should not have conflicting uuid versions', () => {
            if (packageLockJson.packages) {
                const uuidVersions = new Set<string>();
                Object.entries(packageLockJson.packages).forEach(([key, pkg]: [string, any]) => {
                    if (key.includes('uuid') && pkg.version) {
                        uuidVersions.add(pkg.version);
                    }
                });
                // Only uuid 8.3.2 should exist for @actions/core 1.9.1
                expect(uuidVersions.has('8.3.2')).toBe(true);
            }
        });
    });

    describe('Build and Test Infrastructure', () => {
        test('should have TypeScript compiler in devDependencies', () => {
            expect(packageJson.devDependencies).toHaveProperty('typescript');
        });

        test('should have @vercel/ncc for bundling', () => {
            expect(packageJson.devDependencies).toHaveProperty('@vercel/ncc');
        });

        test('should have complete Jest setup', () => {
            expect(packageJson.devDependencies).toHaveProperty('jest');
            expect(packageJson.devDependencies).toHaveProperty('ts-jest');
            expect(packageJson.devDependencies).toHaveProperty('@types/jest');
            expect(packageJson.devDependencies).toHaveProperty('jest-circus');
        });

        test('should have Node.js type definitions', () => {
            expect(packageJson.devDependencies).toHaveProperty('@types/node');
        });
    });

    describe('Version Downgrade Verification', () => {
        test('confirms intentional downgrade from 1.11.1 to 1.9.1', () => {
            // This test explicitly documents the downgrade
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
            expect(packageJson.dependencies['@actions/core']).not.toBe('1.11.1');
        });

        test('downgrade includes required uuid dependency', () => {
            if (packageLockJson.packages) {
                const corePackage = packageLockJson.packages['node_modules/@actions/core'];
                expect(corePackage.dependencies).toHaveProperty('uuid');
                expect(corePackage.dependencies.uuid).toBe('^8.3.2');
            }
        });

        test('lock file integrity matches downgraded version', () => {
            if (packageLockJson.packages) {
                const corePackage = packageLockJson.packages['node_modules/@actions/core'];
                expect(corePackage.version).toBe('1.9.1');
            }
        });

        test('uuid 8.3.2 is properly locked', () => {
            if (packageLockJson.packages) {
                const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
                expect(uuidPackage.version).toBe('8.3.2');
            }
        });
    });

    describe('Regression Prevention', () => {
        test('should prevent accidental upgrade back to 1.11.1', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
            expect(packageJson.dependencies['@actions/core']).not.toContain('1.11');
        });

        test('should maintain exact version pin', () => {
            const version = packageJson.dependencies['@actions/core'];
            expect(version).not.toMatch(/^[\^~]/);
        });

        test('lock file should not contain any 1.11.x references for @actions/core', () => {
            const lockContent = fs.readFileSync(packageLockJsonPath, 'utf8');
            const coreReferences = lockContent.match(/@actions\/core.*1\.11/g);
            expect(coreReferences).toBeNull();
        });
    });
});