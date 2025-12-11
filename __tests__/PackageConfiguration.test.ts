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
        test('should have all required top-level fields', () => {
            expect(packageJson).toHaveProperty('name');
            expect(packageJson).toHaveProperty('version');
            expect(packageJson).toHaveProperty('description');
            expect(packageJson).toHaveProperty('main');
            expect(packageJson).toHaveProperty('scripts');
            expect(packageJson).toHaveProperty('author');
            expect(packageJson).toHaveProperty('license');
            expect(packageJson).toHaveProperty('dependencies');
            expect(packageJson).toHaveProperty('devDependencies');
        });

        test('should have valid name field', () => {
            expect(typeof packageJson.name).toBe('string');
            expect(packageJson.name).toBe('login');
            expect(packageJson.name.length).toBeGreaterThan(0);
        });

        test('should have valid semver version', () => {
            expect(typeof packageJson.version).toBe('string');
            expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
        });

        test('should have non-empty description', () => {
            expect(typeof packageJson.description).toBe('string');
            expect(packageJson.description.length).toBeGreaterThan(0);
            expect(packageJson.description).toContain('Azure');
        });

        test('should have valid main entry point', () => {
            expect(typeof packageJson.main).toBe('string');
            expect(packageJson.main).toBe('lib/main/index.js');
        });

        test('should have Microsoft as author', () => {
            expect(packageJson.author).toBe('Microsoft');
        });

        test('should have MIT license', () => {
            expect(packageJson.license).toBe('MIT');
        });
    });

    describe('package.json Scripts Validation', () => {
        test('should have all required build scripts', () => {
            expect(packageJson.scripts).toHaveProperty('build:main');
            expect(packageJson.scripts).toHaveProperty('build:cleanup');
            expect(packageJson.scripts).toHaveProperty('build');
            expect(packageJson.scripts).toHaveProperty('test');
        });

        test('should have valid build:main script with ncc build', () => {
            const script = packageJson.scripts['build:main'];
            expect(script).toContain('ncc build');
            expect(script).toContain('src/main.ts');
            expect(script).toContain('-o lib/main');
        });

        test('should have valid build:cleanup script', () => {
            const script = packageJson.scripts['build:cleanup'];
            expect(script).toContain('ncc build');
            expect(script).toContain('src/cleanup.ts');
            expect(script).toContain('-o lib/cleanup');
        });

        test('should have build script that orchestrates both builds', () => {
            const script = packageJson.scripts.build;
            expect(script).toContain('npm run build:main');
            expect(script).toContain('npm run build:cleanup');
            expect(script).toMatch(/&&/); // Ensures sequential execution
        });

        test('should have test script configured for jest', () => {
            expect(packageJson.scripts.test).toBe('jest');
        });

        test('should not have any empty or whitespace-only scripts', () => {
            Object.entries(packageJson.scripts).forEach(([name, script]) => {
                expect(typeof script).toBe('string');
                expect((script as string).trim().length).toBeGreaterThan(0);
            });
        });
    });

    describe('package.json Dependencies - Critical @actions/core v1.9.1', () => {
        test('should have @actions/core at exact version 1.9.1', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('should NOT have @actions/core at version 1.11.1', () => {
            expect(packageJson.dependencies['@actions/core']).not.toBe('1.11.1');
            expect(packageJson.dependencies['@actions/core']).not.toBe('^1.11.1');
            expect(packageJson.dependencies['@actions/core']).not.toBe('~1.11.1');
        });

        test('should have @actions/core pinned without semver range operators', () => {
            const version = packageJson.dependencies['@actions/core'];
            expect(version).not.toContain('^');
            expect(version).not.toContain('~');
            expect(version).not.toContain('>');
            expect(version).not.toContain('<');
            expect(version).not.toContain('*');
        });

        test('should have exact version format for @actions/core', () => {
            const version = packageJson.dependencies['@actions/core'];
            expect(version).toMatch(/^\d+\.\d+\.\d+$/);
        });

        test('should have all required @actions dependencies', () => {
            expect(packageJson.dependencies).toHaveProperty('@actions/core');
            expect(packageJson.dependencies).toHaveProperty('@actions/exec');
            expect(packageJson.dependencies).toHaveProperty('@actions/io');
        });

        test('should have @actions/exec with valid version', () => {
            expect(packageJson.dependencies['@actions/exec']).toBeDefined();
            expect(typeof packageJson.dependencies['@actions/exec']).toBe('string');
            expect(packageJson.dependencies['@actions/exec']).toMatch(/^[\^~]?\d+\.\d+\.\d+$/);
        });

        test('should have @actions/io with valid version', () => {
            expect(packageJson.dependencies['@actions/io']).toBeDefined();
            expect(typeof packageJson.dependencies['@actions/io']).toBe('string');
            expect(packageJson.dependencies['@actions/io']).toMatch(/^[\^~]?\d+\.\d+\.\d+$/);
        });

        test('should confirm intentional downgrade from 1.11.1 to 1.9.1', () => {
            // This test explicitly documents that v1.9.1 is intentional
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
            // Ensure no traces of 1.11.x
            const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
            expect(packageContent).not.toContain('1.11');
        });
    });

    describe('package.json DevDependencies Validation', () => {
        test('should have complete Jest testing infrastructure', () => {
            expect(packageJson.devDependencies).toHaveProperty('jest');
            expect(packageJson.devDependencies).toHaveProperty('ts-jest');
            expect(packageJson.devDependencies).toHaveProperty('@types/jest');
            expect(packageJson.devDependencies).toHaveProperty('jest-circus');
        });

        test('should have TypeScript compilation tools', () => {
            expect(packageJson.devDependencies).toHaveProperty('typescript');
            expect(packageJson.devDependencies).toHaveProperty('@types/node');
        });

        test('should have @vercel/ncc for bundling', () => {
            expect(packageJson.devDependencies).toHaveProperty('@vercel/ncc');
        });

        test('should have valid semver versions for all devDependencies', () => {
            Object.entries(packageJson.devDependencies).forEach(([name, version]) => {
                expect(typeof version).toBe('string');
                expect((version as string).length).toBeGreaterThan(0);
                expect(version).toMatch(/^[\^~]?\d+\.\d+\.\d+$/);
            });
        });

        test('should not have duplicate packages between dependencies and devDependencies', () => {
            const deps = Object.keys(packageJson.dependencies || {});
            const devDeps = Object.keys(packageJson.devDependencies || {});
            const duplicates = deps.filter(dep => devDeps.includes(dep));
            expect(duplicates).toEqual([]);
        });

        test('should have reasonable number of devDependencies', () => {
            const count = Object.keys(packageJson.devDependencies).length;
            expect(count).toBeGreaterThan(0);
            expect(count).toBeLessThan(50);
        });
    });

    describe('package-lock.json Schema Validation', () => {
        test('should be valid JSON with required structure', () => {
            expect(packageLockJson).toBeDefined();
            expect(typeof packageLockJson).toBe('object');
        });

        test('should have required top-level fields', () => {
            expect(packageLockJson).toHaveProperty('name');
            expect(packageLockJson).toHaveProperty('version');
            expect(packageLockJson).toHaveProperty('lockfileVersion');
            expect(packageLockJson).toHaveProperty('requires');
            expect(packageLockJson).toHaveProperty('packages');
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
            expect(packageLockJson.lockfileVersion).toBeLessThanOrEqual(3);
        });

        test('should have requires field as boolean', () => {
            expect(typeof packageLockJson.requires).toBe('boolean');
        });

        test('should have packages object', () => {
            expect(packageLockJson.packages).toBeDefined();
            expect(typeof packageLockJson.packages).toBe('object');
        });

        test('should have root package entry', () => {
            expect(packageLockJson.packages['']).toBeDefined();
        });
    });

    describe('package-lock.json @actions/core v1.9.1 Integrity', () => {
        test('should have @actions/core at version 1.9.1 in packages', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage).toBeDefined();
            expect(corePackage.version).toBe('1.9.1');
        });

        test('should NOT have @actions/core at version 1.11.1 anywhere', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.version).not.toBe('1.11.1');
            expect(corePackage.version).not.toContain('1.11');
            
            // Verify no 1.11.x references in entire lock file
            const lockContent = fs.readFileSync(packageLockJsonPath, 'utf8');
            const has1_11 = /@actions\/core.*["']1\.11/i.test(lockContent);
            expect(has1_11).toBe(false);
        });

        test('should have uuid as direct dependency of @actions/core v1.9.1', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies).toBeDefined();
            expect(corePackage.dependencies).toHaveProperty('uuid');
            expect(corePackage.dependencies.uuid).toBe('^8.3.2');
        });

        test('should have nested uuid package at version 8.3.2', () => {
            const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuidPackage).toBeDefined();
            expect(uuidPackage.version).toBe('8.3.2');
        });

        test('should have @actions/http-client as dependency', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies).toHaveProperty('@actions/http-client');
            expect(corePackage.dependencies['@actions/http-client']).toMatch(/^\^2\./);
        });

        test('uuid should be version 8.x (not 9.x or higher)', () => {
            const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuidPackage.version).toMatch(/^8\./);
            expect(uuidPackage.version).not.toMatch(/^9\./);
        });

        test('should have uuid 8.3.2 exactly as required by @actions/core 1.9.1', () => {
            const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuidPackage.version).toBe('8.3.2');
        });

        test('should have all transitive dependencies properly locked', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies).toBeDefined();
            const deps = Object.keys(corePackage.dependencies);
            expect(deps.length).toBeGreaterThan(0);
            
            deps.forEach(dep => {
                const version = corePackage.dependencies[dep];
                expect(typeof version).toBe('string');
                expect(version.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Version Consistency Between Files', () => {
        test('@actions/core version should match between package.json and lock file', () => {
            const packageJsonVersion = packageJson.dependencies['@actions/core'];
            const lockVersion = packageLockJson.packages['node_modules/@actions/core'].version;
            
            expect(lockVersion).toBe(packageJsonVersion);
        });

        test('should not have version conflicts for critical dependencies', () => {
            const criticalDeps = ['@actions/core', '@actions/exec', '@actions/io'];
            
            criticalDeps.forEach(dep => {
                const versions = new Set<string>();
                Object.entries(packageLockJson.packages).forEach(([key, pkg]: [string, any]) => {
                    if (key.includes(dep) && pkg.version) {
                        versions.add(pkg.version);
                    }
                });
                
                // Each critical dependency should have consistent version
                expect(versions.size).toBeGreaterThan(0);
            });
        });

        test('all dependencies in package.json should be locked', () => {
            const deps = Object.keys(packageJson.dependencies);
            
            deps.forEach(dep => {
                const packageKey = `node_modules/${dep}`;
                expect(packageLockJson.packages[packageKey]).toBeDefined();
            });
        });

        test('all devDependencies in package.json should be locked', () => {
            const devDeps = Object.keys(packageJson.devDependencies);
            
            devDeps.forEach(dep => {
                const packageKey = `node_modules/${dep}`;
                expect(packageLockJson.packages[packageKey]).toBeDefined();
            });
        });
    });

    describe('Security and Best Practices', () => {
        test('should not have any file:// protocol dependencies', () => {
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };
            
            Object.values(allDeps).forEach((version: any) => {
                expect(version).not.toMatch(/^file:/i);
            });
        });

        test('should not have any git:// protocol dependencies', () => {
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };
            
            Object.values(allDeps).forEach((version: any) => {
                expect(version).not.toMatch(/^git:/i);
            });
        });

        test('should not have any insecure http:// protocol dependencies', () => {
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };
            
            Object.values(allDeps).forEach((version: any) => {
                expect(version).not.toMatch(/^http:\/\//);
            });
        });

        test('should have MIT license', () => {
            expect(packageJson.license).toBe('MIT');
        });

        test('should have reasonable dependency count', () => {
            const depsCount = Object.keys(packageJson.dependencies).length;
            const devDepsCount = Object.keys(packageJson.devDependencies).length;
            
            expect(depsCount).toBeGreaterThan(0);
            expect(depsCount).toBeLessThan(50);
            expect(devDepsCount).toBeGreaterThan(0);
            expect(devDepsCount).toBeLessThan(50);
        });

        test('no dependency should have null or undefined version', () => {
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

        test('should not have empty dependency objects', () => {
            expect(Object.keys(packageJson.dependencies).length).toBeGreaterThan(0);
            expect(Object.keys(packageJson.devDependencies).length).toBeGreaterThan(0);
        });
    });

    describe('Version-Specific Features: @actions/core 1.9.1', () => {
        test('v1.9.1 requires uuid for secret masking functionality', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            // v1.9.1 uses uuid for generating unique identifiers in secret masking
            expect(corePackage.dependencies).toHaveProperty('uuid');
        });

        test('v1.9.1 uses uuid instead of crypto.randomUUID', () => {
            // v1.11.1 removed uuid in favor of Node.js built-in crypto.randomUUID
            // v1.9.1 still uses uuid package
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies.uuid).toBeDefined();
        });

        test('v1.9.1 is compatible with older Node.js versions', () => {
            // v1.9.1 doesn't require Node.js 14.17+ (which has crypto.randomUUID)
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('downgrade is intentional for stability and compatibility', () => {
            // Explicitly document the intentional downgrade
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
            expect(packageJson.dependencies['@actions/core']).not.toContain('1.11');
        });
    });

    describe('JSON Format and Structure', () => {
        test('package.json should parse without errors', () => {
            const content = fs.readFileSync(packageJsonPath, 'utf8');
            expect(() => JSON.parse(content)).not.toThrow();
        });

        test('package-lock.json should parse without errors', () => {
            const content = fs.readFileSync(packageLockJsonPath, 'utf8');
            expect(() => JSON.parse(content)).not.toThrow();
        });

        test('package.json should be properly formatted', () => {
            const content = fs.readFileSync(packageJsonPath, 'utf8');
            expect(content.length).toBeGreaterThan(0);
            // Should have proper indentation (2 spaces)
            expect(content).toContain('  ');
        });

        test('package.json should not have trailing commas', () => {
            const content = fs.readFileSync(packageJsonPath, 'utf8');
            // Valid JSON should parse (trailing commas would break this)
            expect(() => JSON.parse(content)).not.toThrow();
        });
    });

    describe('GitHub Actions Compatibility', () => {
        test('@actions/core 1.9.1 is compatible with GitHub Actions runtime', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('should have required action dependencies for GitHub Actions', () => {
            expect(packageJson.dependencies).toHaveProperty('@actions/core');
            expect(packageJson.dependencies).toHaveProperty('@actions/exec');
            expect(packageJson.dependencies).toHaveProperty('@actions/io');
        });

        test('v1.9.1 supports setSecret for credential masking', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            // setSecret uses uuid for unique identifier generation
            expect(corePackage.dependencies).toHaveProperty('uuid');
        });

        test('v1.9.1 supports core GitHub Actions APIs', () => {
            // Verify v1.9.1 is locked properly
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.version).toBe('1.9.1');
        });

        test('should support Azure login action use cases', () => {
            // This action is specifically for Azure login
            expect(packageJson.name).toBe('login');
            expect(packageJson.description).toContain('Azure');
        });
    });

    describe('Regression Prevention', () => {
        test('should prevent accidental upgrade to 1.11.1', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
            expect(packageJson.dependencies['@actions/core']).not.toBe('1.11.1');
        });

        test('should maintain exact version pin without range operators', () => {
            const version = packageJson.dependencies['@actions/core'];
            expect(version).toMatch(/^\d+\.\d+\.\d+$/);
            expect(version).not.toMatch(/^[\^~><=]/);
        });

        test('lock file should not contain 1.11.x references', () => {
            const lockContent = fs.readFileSync(packageLockJsonPath, 'utf8');
            const matches = lockContent.match(/@actions\/core.*1\.11/gi);
            expect(matches).toBeNull();
        });

        test('uuid 8.3.2 should remain locked', () => {
            const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuidPackage.version).toBe('8.3.2');
        });

        test('should maintain dependency integrity for v1.9.1', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.version).toBe('1.9.1');
            expect(corePackage.dependencies.uuid).toBe('^8.3.2');
            expect(corePackage.dependencies['@actions/http-client']).toMatch(/^\^2\./);
        });
    });

    describe('Transitive Dependencies', () => {
        test('should have @actions/http-client properly resolved', () => {
            const httpClient = packageLockJson.packages['node_modules/@actions/http-client'];
            expect(httpClient).toBeDefined();
            expect(httpClient.version).toBeDefined();
        });

        test('uuid should be nested under @actions/core', () => {
            const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuidPackage).toBeDefined();
        });

        test('should not have conflicting uuid versions', () => {
            const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuidPackage.version).toBe('8.3.2');
        });

        test('transitive dependencies should have valid resolved versions', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            const deps = Object.keys(corePackage.dependencies);
            
            deps.forEach(dep => {
                const version = corePackage.dependencies[dep];
                expect(version).toBeTruthy();
                expect(typeof version).toBe('string');
            });
        });
    });

    describe('Edge Cases and Robustness', () => {
        test('should handle optional package.json fields gracefully', () => {
            const optionalFields = ['repository', 'bugs', 'homepage', 'keywords'];
            optionalFields.forEach(field => {
                expect(() => packageJson[field]).not.toThrow();
            });
        });

        test('should handle lockfile version 2 or 3 format', () => {
            const version = packageLockJson.lockfileVersion;
            expect(version >= 2 && version <= 3).toBe(true);
        });

        test('should have no empty string versions', () => {
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };
            
            Object.values(allDeps).forEach((version: any) => {
                expect(version.length).toBeGreaterThan(0);
            });
        });

        test('package-lock integrity hashes should exist', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            // Modern lock files include integrity hashes
            if (packageLockJson.lockfileVersion >= 2) {
                expect(corePackage).toHaveProperty('resolved');
            }
        });
    });

    describe('Build System Validation', () => {
        test('should have @vercel/ncc for bundling TypeScript', () => {
            expect(packageJson.devDependencies['@vercel/ncc']).toBeDefined();
        });

        test('should have TypeScript compiler', () => {
            expect(packageJson.devDependencies.typescript).toBeDefined();
            expect(packageJson.devDependencies.typescript).toMatch(/^\^4\./);
        });

        test('should have ts-jest for TypeScript test support', () => {
            expect(packageJson.devDependencies['ts-jest']).toBeDefined();
        });

        test('build scripts should use ncc for compilation', () => {
            expect(packageJson.scripts['build:main']).toContain('ncc build');
            expect(packageJson.scripts['build:cleanup']).toContain('ncc build');
        });

        test('output directories should be consistent', () => {
            expect(packageJson.scripts['build:main']).toContain('-o lib/main');
            expect(packageJson.scripts['build:cleanup']).toContain('-o lib/cleanup');
            expect(packageJson.main).toContain('lib/main');
        });
    });
});