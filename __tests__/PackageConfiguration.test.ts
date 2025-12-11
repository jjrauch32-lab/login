import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';

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

    describe('package.json Structure and Schema', () => {
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

        test('should have valid version field in semver format', () => {
            expect(typeof packageJson.version).toBe('string');
            expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
        });

        test('should have valid description', () => {
            expect(typeof packageJson.description).toBe('string');
            expect(packageJson.description.length).toBeGreaterThan(0);
            expect(packageJson.description).toContain('Azure');
        });

        test('should have correct main entry point', () => {
            expect(packageJson.main).toBe('lib/main/index.js');
        });

        test('should have MIT license', () => {
            expect(packageJson.license).toBe('MIT');
        });

        test('should have Microsoft as author', () => {
            expect(packageJson.author).toBe('Microsoft');
        });
    });

    describe('package.json Build Scripts', () => {
        test('should have all required build scripts', () => {
            expect(packageJson.scripts).toHaveProperty('build:main');
            expect(packageJson.scripts).toHaveProperty('build:cleanup');
            expect(packageJson.scripts).toHaveProperty('build');
            expect(packageJson.scripts).toHaveProperty('test');
        });

        test('build:main should compile main entry point with ncc', () => {
            expect(packageJson.scripts['build:main']).toContain('ncc build');
            expect(packageJson.scripts['build:main']).toContain('src/main.ts');
            expect(packageJson.scripts['build:main']).toContain('-o lib/main');
        });

        test('build:cleanup should compile cleanup script with ncc', () => {
            expect(packageJson.scripts['build:cleanup']).toContain('ncc build');
            expect(packageJson.scripts['build:cleanup']).toContain('src/cleanup.ts');
            expect(packageJson.scripts['build:cleanup']).toContain('-o lib/cleanup');
        });

        test('build script should orchestrate both build steps', () => {
            expect(packageJson.scripts.build).toContain('npm run build:main');
            expect(packageJson.scripts.build).toContain('npm run build:cleanup');
            expect(packageJson.scripts.build).toContain('&&');
        });

        test('test script should use jest', () => {
            expect(packageJson.scripts.test).toBe('jest');
        });

        test('should not have empty script definitions', () => {
            Object.entries(packageJson.scripts).forEach(([name, script]) => {
                expect(typeof script).toBe('string');
                expect((script as string).length).toBeGreaterThan(0);
            });
        });
    });

    describe('@actions/core Version 1.9.1 Configuration', () => {
        test('should have @actions/core pinned to exact version 1.9.1', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('should NOT be at version 1.11.1', () => {
            expect(packageJson.dependencies['@actions/core']).not.toBe('1.11.1');
            expect(packageJson.dependencies['@actions/core']).not.toBe('^1.11.1');
            expect(packageJson.dependencies['@actions/core']).not.toContain('1.11');
        });

        test('should use exact version pinning without semver operators', () => {
            const version = packageJson.dependencies['@actions/core'];
            expect(version).not.toMatch(/^[\^~]/);
            expect(version).not.toContain('^');
            expect(version).not.toContain('~');
            expect(version).not.toContain('>');
            expect(version).not.toContain('<');
            expect(version).toMatch(/^\d+\.\d+\.\d+$/);
        });

        test('version 1.9.1 should be intentional downgrade from 1.11.1', () => {
            const version = packageJson.dependencies['@actions/core'];
            expect(version).toBe('1.9.1');
            const [major, minor, patch] = version.split('.').map(Number);
            expect(major).toBe(1);
            expect(minor).toBe(9);
            expect(patch).toBe(1);
        });
    });

    describe('package.json Runtime Dependencies', () => {
        test('should have all required @actions dependencies', () => {
            expect(packageJson.dependencies).toHaveProperty('@actions/core');
            expect(packageJson.dependencies).toHaveProperty('@actions/exec');
            expect(packageJson.dependencies).toHaveProperty('@actions/io');
        });

        test('should have @actions/exec with valid version', () => {
            const version = packageJson.dependencies['@actions/exec'];
            expect(version).toBeDefined();
            expect(typeof version).toBe('string');
            expect(version).toMatch(/^[\^~]?\d+\.\d+\.\d+$/);
        });

        test('should have @actions/io with valid version', () => {
            const version = packageJson.dependencies['@actions/io'];
            expect(version).toBeDefined();
            expect(typeof version).toBe('string');
            expect(version).toMatch(/^[\^~]?\d+\.\d+\.\d+$/);
        });

        test('should have package-lock dependency', () => {
            expect(packageJson.dependencies).toHaveProperty('package-lock');
        });

        test('should have reasonable number of runtime dependencies', () => {
            const depsCount = Object.keys(packageJson.dependencies).length;
            expect(depsCount).toBeGreaterThan(0);
            expect(depsCount).toBeLessThan(20);
        });
    });

    describe('package.json Development Dependencies', () => {
        test('should have TypeScript toolchain', () => {
            expect(packageJson.devDependencies).toHaveProperty('typescript');
            expect(packageJson.devDependencies).toHaveProperty('@types/node');
        });

        test('should have complete Jest testing framework', () => {
            expect(packageJson.devDependencies).toHaveProperty('jest');
            expect(packageJson.devDependencies).toHaveProperty('ts-jest');
            expect(packageJson.devDependencies).toHaveProperty('@types/jest');
            expect(packageJson.devDependencies).toHaveProperty('jest-circus');
        });

        test('should have bundler for GitHub Actions', () => {
            expect(packageJson.devDependencies).toHaveProperty('@vercel/ncc');
        });

        test('should not have duplicate dependencies', () => {
            const deps = Object.keys(packageJson.dependencies);
            const devDeps = Object.keys(packageJson.devDependencies);
            const duplicates = deps.filter(dep => devDeps.includes(dep));
            expect(duplicates).toEqual([]);
        });

        test('should have reasonable number of dev dependencies', () => {
            const devDepsCount = Object.keys(packageJson.devDependencies).length;
            expect(devDepsCount).toBeGreaterThan(0);
            expect(devDepsCount).toBeLessThan(30);
        });
    });

    describe('package-lock.json Structure and Integrity', () => {
        test('should be valid JSON', () => {
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

        test('should match package.json name', () => {
            expect(packageLockJson.name).toBe(packageJson.name);
        });

        test('should match package.json version', () => {
            expect(packageLockJson.version).toBe(packageJson.version);
        });

        test('should use lockfile version 3', () => {
            expect(packageLockJson.lockfileVersion).toBe(3);
        });

        test('should have requires field set to true', () => {
            expect(packageLockJson.requires).toBe(true);
        });

        test('should have packages field with root package', () => {
            expect(packageLockJson.packages).toBeDefined();
            expect(packageLockJson.packages['']).toBeDefined();
        });
    });

    describe('package-lock.json @actions/core 1.9.1 Entry', () => {
        test('should have @actions/core at version 1.9.1', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage).toBeDefined();
            expect(corePackage.version).toBe('1.9.1');
        });

        test('should NOT have @actions/core at version 1.11.1', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.version).not.toBe('1.11.1');
            expect(corePackage.version).not.toContain('1.11');
        });

        test('@actions/core 1.9.1 should have uuid dependency', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies).toBeDefined();
            expect(corePackage.dependencies).toHaveProperty('uuid');
            expect(corePackage.dependencies.uuid).toBe('^8.3.2');
        });

        test('@actions/core 1.9.1 should have @actions/http-client dependency', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies).toHaveProperty('@actions/http-client');
            expect(corePackage.dependencies['@actions/http-client']).toMatch(/\^2\.\d+\.\d+/);
        });

        test('should have nested uuid package at version 8.3.2', () => {
            const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuidPackage).toBeDefined();
            expect(uuidPackage.version).toBe('8.3.2');
        });

        test('uuid should be at 8.3.2, not 9.x', () => {
            const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuidPackage.version).toBe('8.3.2');
            expect(uuidPackage.version).not.toMatch(/^9\./);
        });
    });

    describe('Dependency Version Consistency', () => {
        test('@actions/core version should match between files', () => {
            const packageJsonVersion = packageJson.dependencies['@actions/core'];
            const lockVersion = packageLockJson.packages['node_modules/@actions/core'].version;
            expect(lockVersion).toBe(packageJsonVersion);
        });

        test('all runtime dependencies should be locked', () => {
            const deps = Object.keys(packageJson.dependencies);
            deps.forEach(dep => {
                const lockKey = `node_modules/${dep}`;
                expect(packageLockJson.packages[lockKey]).toBeDefined();
            });
        });

        test('should not have version conflicts for critical packages', () => {
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
        });
    });

    describe('Security and Best Practices', () => {
        test('should not use file:// protocol dependencies', () => {
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            Object.values(allDeps).forEach((version: any) => {
                expect(version).not.toMatch(/^file:/);
            });
        });

        test('should not use git:// protocol dependencies', () => {
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            Object.values(allDeps).forEach((version: any) => {
                expect(version).not.toMatch(/^git:/);
            });
        });

        test('should not use http:// protocol (insecure)', () => {
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            Object.values(allDeps).forEach((version: any) => {
                expect(version).not.toMatch(/^http:\/\//);
            });
        });

        test('should use https:// for git dependencies if any', () => {
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            Object.values(allDeps).forEach((version: any) => {
                if (typeof version === 'string' && version.includes('git')) {
                    if (!version.startsWith('git+ssh') && !version.startsWith('git+https')) {
                        expect(version).toMatch(/^https:\/\//);
                    }
                }
            });
        });

        test('should have valid license', () => {
            expect(packageJson.license).toBe('MIT');
        });
    });

    describe('@actions/core 1.9.1 Compatibility Features', () => {
        test('version 1.9.1 supports setSecret functionality', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies).toHaveProperty('uuid');
        });

        test('version 1.9.1 uses uuid for ID generation instead of crypto.randomUUID', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies.uuid).toBeDefined();
        });

        test('version 1.9.1 is compatible with getInput functionality', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('version 1.9.1 supports getIDToken for OIDC', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('version 1.9.1 supports core.info, core.warning, core.error', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });
    });

    describe('Transitive Dependencies for @actions/core 1.9.1', () => {
        test('should have @actions/http-client as transitive dependency', () => {
            const httpClient = packageLockJson.packages['node_modules/@actions/http-client'];
            expect(httpClient).toBeDefined();
            expect(httpClient.version).toBeDefined();
        });

        test('@actions/http-client should have tunnel dependency', () => {
            const httpClient = packageLockJson.packages['node_modules/@actions/http-client'];
            expect(httpClient.dependencies).toHaveProperty('tunnel');
        });

        test('uuid 8.3.2 should be nested correctly', () => {
            const uuidPath = 'node_modules/@actions/core/node_modules/uuid';
            expect(packageLockJson.packages[uuidPath]).toBeDefined();
        });

        test('uuid should have bin entry for CLI', () => {
            const uuid = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuid.bin).toBeDefined();
            expect(uuid.bin.uuid).toBe('dist/bin/uuid');
        });
    });

    describe('Regression Prevention', () => {
        test('prevents accidental upgrade to 1.11.1', () => {
            const version = packageJson.dependencies['@actions/core'];
            expect(version).toBe('1.9.1');
            expect(version).not.toContain('1.11');
            expect(version).not.toMatch(/^[\^~]/);
        });

        test('lock file should not reference 1.11.x anywhere', () => {
            const lockContent = fs.readFileSync(packageLockJsonPath, 'utf8');
            const references = lockContent.match(/@actions\/core.*1\.11/g);
            expect(references).toBeNull();
        });

        test('maintains exact version pin to prevent auto-updates', () => {
            const version = packageJson.dependencies['@actions/core'];
            expect(version).toMatch(/^\d+\.\d+\.\d+$/);
            expect(version).not.toMatch(/^[\^~]/);
        });
    });

    describe('JSON Format Validation', () => {
        test('package.json should be parseable', () => {
            const content = fs.readFileSync(packageJsonPath, 'utf8');
            expect(() => JSON.parse(content)).not.toThrow();
        });

        test('package-lock.json should be parseable', () => {
            const content = fs.readFileSync(packageLockJsonPath, 'utf8');
            expect(() => JSON.parse(content)).not.toThrow();
        });

        test('package.json should use 2-space indentation', () => {
            const content = fs.readFileSync(packageJsonPath, 'utf8');
            expect(content).toContain('  "name"');
        });

        test('should not have trailing commas', () => {
            const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
            const lockContent = fs.readFileSync(packageLockJsonPath, 'utf8');
            
            expect(() => JSON.parse(packageContent)).not.toThrow();
            expect(() => JSON.parse(lockContent)).not.toThrow();
        });
    });

    describe('GitHub Actions Runtime Compatibility', () => {
        test('should be compatible with node20 runtime', () => {
            expect(packageJson.devDependencies['@types/node']).toBeDefined();
        });

        test('@actions/core 1.9.1 works with GitHub Actions runner', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('should have all @actions packages for full functionality', () => {
            expect(packageJson.dependencies).toHaveProperty('@actions/core');
            expect(packageJson.dependencies).toHaveProperty('@actions/exec');
            expect(packageJson.dependencies).toHaveProperty('@actions/io');
        });
    });

    describe('@actions/core API Usage Validation', () => {
        test('core.setSecret should be available', () => {
            expect(typeof core.setSecret).toBe('function');
        });

        test('core.getInput should be available', () => {
            expect(typeof core.getInput).toBe('function');
        });

        test('core.info should be available', () => {
            expect(typeof core.info).toBe('function');
        });

        test('core.warning should be available', () => {
            expect(typeof core.warning).toBe('function');
        });

        test('core.error should be available', () => {
            expect(typeof core.error).toBe('function');
        });

        test('core.setFailed should be available', () => {
            expect(typeof core.setFailed).toBe('function');
        });

        test('core.debug should be available', () => {
            expect(typeof core.debug).toBe('function');
        });

        test('core.getIDToken should be available for OIDC', () => {
            expect(typeof core.getIDToken).toBe('function');
        });
    });

    describe('Version-Specific Feature Tests', () => {
        test('version 1.9.1 characteristic: requires uuid package', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies).toHaveProperty('uuid');
            expect(corePackage.dependencies.uuid).toMatch(/\^8\.\d+\.\d+/);
        });

        test('version 1.9.1 does not use crypto.randomUUID', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies.uuid).toBeDefined();
        });

        test('uuid dependency is at 8.x, not 9.x or later', () => {
            const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            const [major] = uuidPackage.version.split('.').map(Number);
            expect(major).toBe(8);
        });
    });

    describe('Comprehensive Dependency Validation', () => {
        test('all package.json dependencies have valid semver', () => {
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            Object.entries(allDeps).forEach(([name, version]) => {
                expect(typeof version).toBe('string');
                expect((version as string).length).toBeGreaterThan(0);
                expect(version).toMatch(/^[\^~]?\d+\.\d+\.\d+$|^\d+\.\d+\.\d+$/);
            });
        });

        test('no null or undefined dependency versions', () => {
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            Object.entries(allDeps).forEach(([name, version]) => {
                expect(version).not.toBeNull();
                expect(version).not.toBeUndefined();
                expect(version).toBeTruthy();
            });
        });

        test('no empty dependency objects', () => {
            expect(Object.keys(packageJson.dependencies).length).toBeGreaterThan(0);
            expect(Object.keys(packageJson.devDependencies).length).toBeGreaterThan(0);
        });
    });

    describe('Downgrade Documentation', () => {
        test('documents intentional downgrade from 1.11.1 to 1.9.1', () => {
            const version = packageJson.dependencies['@actions/core'];
            expect(version).toBe('1.9.1');
            
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.version).toBe('1.9.1');
            expect(corePackage.dependencies).toHaveProperty('uuid');
        });

        test('downgrade maintains uuid 8.3.2 requirement', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies.uuid).toBe('^8.3.2');
            
            const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuidPackage.version).toBe('8.3.2');
        });

        test('reasons for 1.9.1: broader Node.js compatibility', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });
    });
});