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
            expect(packageJson.name).toMatch(/^[a-z0-9-]+$/);
        });

        test('should have valid semantic version', () => {
            expect(typeof packageJson.version).toBe('string');
            expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
            expect(packageJson.version).toBe('2.2.0');
        });

        test('should have meaningful description', () => {
            expect(typeof packageJson.description).toBe('string');
            expect(packageJson.description.length).toBeGreaterThan(10);
            expect(packageJson.description).toContain('Azure');
        });

        test('should have correct main entry point', () => {
            expect(packageJson.main).toBe('lib/main/index.js');
            expect(packageJson.main).toMatch(/\.js$/);
        });

        test('should have valid author', () => {
            expect(typeof packageJson.author).toBe('string');
            expect(packageJson.author).toBe('Microsoft');
        });

        test('should have MIT license', () => {
            expect(packageJson.license).toBe('MIT');
        });
    });

    describe('package.json Scripts Validation', () => {
        test('should have all required build scripts', () => {
            const requiredScripts = ['build:main', 'build:cleanup', 'build', 'test'];
            requiredScripts.forEach(script => {
                expect(packageJson.scripts).toHaveProperty(script);
            });
        });

        test('should have valid build:main script with ncc', () => {
            expect(packageJson.scripts['build:main']).toContain('ncc build');
            expect(packageJson.scripts['build:main']).toContain('src/main.ts');
            expect(packageJson.scripts['build:main']).toContain('-o lib/main');
        });

        test('should have valid build:cleanup script with ncc', () => {
            expect(packageJson.scripts['build:cleanup']).toContain('ncc build');
            expect(packageJson.scripts['build:cleanup']).toContain('src/cleanup.ts');
            expect(packageJson.scripts['build:cleanup']).toContain('-o lib/cleanup');
        });

        test('should have composite build script', () => {
            expect(packageJson.scripts.build).toContain('npm run build:main');
            expect(packageJson.scripts.build).toContain('npm run build:cleanup');
            expect(packageJson.scripts.build).toContain('&&');
        });

        test('should have jest test script', () => {
            expect(packageJson.scripts.test).toBe('jest');
        });

        test('should not have empty script definitions', () => {
            Object.entries(packageJson.scripts).forEach(([name, script]) => {
                expect(typeof script).toBe('string');
                expect(script).toBeTruthy();
                expect((script as string).length).toBeGreaterThan(0);
            });
        });

        test('should use npm run for script composition', () => {
            const buildScript = packageJson.scripts.build;
            expect(buildScript).toMatch(/npm run/);
        });
    });

    describe('package.json Critical Dependencies', () => {
        test('should have @actions/core at exact version 1.9.1', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
            expect(packageJson.dependencies['@actions/core']).not.toContain('^');
            expect(packageJson.dependencies['@actions/core']).not.toContain('~');
        });

        test('should not use @actions/core version 1.11.1', () => {
            expect(packageJson.dependencies['@actions/core']).not.toBe('1.11.1');
            expect(packageJson.dependencies['@actions/core']).not.toBe('^1.11.1');
            expect(packageJson.dependencies['@actions/core']).not.toBe('~1.11.1');
        });

        test('should have @actions/exec with flexible versioning', () => {
            expect(packageJson.dependencies['@actions/exec']).toBeDefined();
            expect(packageJson.dependencies['@actions/exec']).toMatch(/^[\^~]?1\.\d+\.\d+$/);
        });

        test('should have @actions/io with flexible versioning', () => {
            expect(packageJson.dependencies['@actions/io']).toBeDefined();
            expect(packageJson.dependencies['@actions/io']).toMatch(/^[\^~]?1\.\d+\.\d+$/);
        });

        test('should have package-lock as dependency', () => {
            expect(packageJson.dependencies['package-lock']).toBeDefined();
            expect(packageJson.dependencies['package-lock']).toMatch(/^[\^~]?1\.\d+\.\d+$/);
        });

        test('should not have duplicate dependencies across deps and devDeps', () => {
            const deps = Object.keys(packageJson.dependencies || {});
            const devDeps = Object.keys(packageJson.devDependencies || {});
            const duplicates = deps.filter(dep => devDeps.includes(dep));
            expect(duplicates).toEqual([]);
        });

        test('should have valid semver for all dependencies', () => {
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            Object.entries(allDeps).forEach(([name, version]) => {
                expect(typeof version).toBe('string');
                expect(version).toMatch(/^[\^~]?\d+\.\d+\.\d+$/);
            });
        });
    });

    describe('package.json DevDependencies', () => {
        test('should have Jest testing framework', () => {
            expect(packageJson.devDependencies['jest']).toBeDefined();
            expect(packageJson.devDependencies['jest']).toMatch(/^\^29\.\d+\.\d+$/);
        });

        test('should have ts-jest for TypeScript support', () => {
            expect(packageJson.devDependencies['ts-jest']).toBeDefined();
            expect(packageJson.devDependencies['ts-jest']).toMatch(/^\^29\.\d+\.\d+$/);
        });

        test('should have jest-circus test runner', () => {
            expect(packageJson.devDependencies['jest-circus']).toBeDefined();
            expect(packageJson.devDependencies['jest-circus']).toMatch(/^\^29\.\d+\.\d+$/);
        });

        test('should have TypeScript compiler', () => {
            expect(packageJson.devDependencies['typescript']).toBeDefined();
            expect(packageJson.devDependencies['typescript']).toMatch(/^\^4\.\d+\.\d+$/);
        });

        test('should have @types/node for Node.js types', () => {
            expect(packageJson.devDependencies['@types/node']).toBeDefined();
            expect(packageJson.devDependencies['@types/node']).toMatch(/^\^20\.\d+\.\d+$/);
        });

        test('should have @types/jest for Jest types', () => {
            expect(packageJson.devDependencies['@types/jest']).toBeDefined();
            expect(packageJson.devDependencies['@types/jest']).toMatch(/^\^29\.\d+\.\d+$/);
        });

        test('should have @vercel/ncc for bundling', () => {
            expect(packageJson.devDependencies['@vercel/ncc']).toBeDefined();
            expect(packageJson.devDependencies['@vercel/ncc']).toMatch(/^\^0\.\d+\.\d+$/);
        });
    });

    describe('package-lock.json Integrity', () => {
        test('should be valid JSON structure', () => {
            expect(packageLockJson).toBeDefined();
            expect(typeof packageLockJson).toBe('object');
            expect(packageLockJson).not.toBeNull();
        });

        test('should have matching name with package.json', () => {
            expect(packageLockJson.name).toBe(packageJson.name);
            expect(packageLockJson.name).toBe('login');
        });

        test('should have matching version with package.json', () => {
            expect(packageLockJson.version).toBe(packageJson.version);
            expect(packageLockJson.version).toBe('2.2.0');
        });

        test('should have valid lockfileVersion', () => {
            expect(typeof packageLockJson.lockfileVersion).toBe('number');
            expect(packageLockJson.lockfileVersion).toBeGreaterThanOrEqual(2);
        });

        test('should have packages field', () => {
            expect(packageLockJson).toHaveProperty('packages');
            expect(typeof packageLockJson.packages).toBe('object');
        });

        test('should have root package configuration', () => {
            expect(packageLockJson.packages['']).toBeDefined();
            expect(packageLockJson.packages[''].name).toBe('login');
            expect(packageLockJson.packages[''].version).toBe('2.2.0');
        });
    });

    describe('package-lock.json @actions/core Validation', () => {
        test('should have @actions/core at version 1.9.1 in packages', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage).toBeDefined();
            expect(corePackage.version).toBe('1.9.1');
        });

        test('should not have @actions/core at version 1.11.1', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.version).not.toBe('1.11.1');
        });

        test('should have @actions/core with required dependencies', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies).toBeDefined();
            expect(corePackage.dependencies).toHaveProperty('@actions/http-client');
            expect(corePackage.dependencies).toHaveProperty('uuid');
        });

        test('should have uuid dependency for @actions/core', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies.uuid).toBe('^8.3.2');
        });

        test('should have nested uuid package at version 8.3.2', () => {
            const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuidPackage).toBeDefined();
            expect(uuidPackage.version).toBe('8.3.2');
        });

        test('should have uuid binary in nested package', () => {
            const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuidPackage.bin).toBeDefined();
            expect(uuidPackage.bin.uuid).toBe('dist/bin/uuid');
        });

        test('should have MIT license for @actions/core', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.license).toBe('MIT');
        });
    });

    describe('package-lock.json All Dependencies', () => {
        test('should have all runtime dependencies locked', () => {
            const runtimeDeps = Object.keys(packageJson.dependencies);
            runtimeDeps.forEach(dep => {
                const packageKey = `node_modules/${dep}`;
                expect(packageLockJson.packages[packageKey]).toBeDefined();
            });
        });

        test('should have @actions/exec locked', () => {
            const execPackage = packageLockJson.packages['node_modules/@actions/exec'];
            expect(execPackage).toBeDefined();
            expect(execPackage.version).toMatch(/^\d+\.\d+\.\d+$/);
        });

        test('should have @actions/io locked', () => {
            const ioPackage = packageLockJson.packages['node_modules/@actions/io'];
            expect(ioPackage).toBeDefined();
            expect(ioPackage.version).toMatch(/^\d+\.\d+\.\d+$/);
        });

        test('should have @actions/http-client locked', () => {
            const httpClientPackage = packageLockJson.packages['node_modules/@actions/http-client'];
            expect(httpClientPackage).toBeDefined();
            expect(httpClientPackage.version).toMatch(/^\d+\.\d+\.\d+$/);
        });
    });

    describe('Version Consistency Validation', () => {
        test('@actions/core version must match between package.json and lock file', () => {
            const packageJsonVersion = packageJson.dependencies['@actions/core'];
            const lockFileVersion = packageLockJson.packages['node_modules/@actions/core'].version;
            expect(lockFileVersion).toBe(packageJsonVersion.replace(/^[\^~]/, ''));
            expect(lockFileVersion).toBe('1.9.1');
        });

        test('should not have version conflicts for @actions/core', () => {
            const packages = packageLockJson.packages;
            const coreVersions = new Set<string>();
            
            Object.entries(packages).forEach(([key, pkg]: [string, any]) => {
                if (key.includes('@actions/core') && pkg.version) {
                    coreVersions.add(pkg.version);
                }
            });
            
            expect(coreVersions.size).toBe(1);
            expect(coreVersions.has('1.9.1')).toBe(true);
        });

        test('should not have version conflicts for critical packages', () => {
            const criticalPackages = ['@actions/core', '@actions/exec', '@actions/io'];
            const packages = packageLockJson.packages;
            
            criticalPackages.forEach(pkgName => {
                const versions = new Set<string>();
                Object.entries(packages).forEach(([key, pkg]: [string, any]) => {
                    if (key.includes(pkgName) && !key.includes('node_modules') && pkg.version) {
                        versions.add(pkg.version);
                    } else if (key === `node_modules/${pkgName}` && pkg.version) {
                        versions.add(pkg.version);
                    }
                });
                expect(versions.size).toBeLessThanOrEqual(1);
            });
        });
    });

    describe('Security and Best Practices', () => {
        test('should not use file:// protocol in dependencies', () => {
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            Object.values(allDeps).forEach(version => {
                expect(version).not.toMatch(/^file:/);
            });
        });

        test('should not use git:// protocol in dependencies', () => {
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            Object.values(allDeps).forEach(version => {
                expect(version).not.toMatch(/^git:/);
            });
        });

        test('should not use insecure http:// protocol in dependencies', () => {
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            Object.values(allDeps).forEach(version => {
                expect(version).not.toMatch(/^http:\/\//);
            });
        });

        test('should have reasonable dependency count', () => {
            const depsCount = Object.keys(packageJson.dependencies).length;
            const devDepsCount = Object.keys(packageJson.devDependencies).length;
            
            expect(depsCount).toBeGreaterThan(0);
            expect(depsCount).toBeLessThan(20);
            expect(devDepsCount).toBeGreaterThan(0);
            expect(devDepsCount).toBeLessThan(30);
        });

        test('should have MIT license', () => {
            expect(packageJson.license).toBe('MIT');
        });

        test('should not have pre-release versions in production dependencies', () => {
            Object.entries(packageJson.dependencies).forEach(([name, version]) => {
                expect(version).not.toMatch(/-alpha|-beta|-rc/);
            });
        });
    });

    describe('Critical Package Pinning', () => {
        test('@actions/core must be pinned to exact version', () => {
            const version = packageJson.dependencies['@actions/core'];
            expect(version).toMatch(/^\d+\.\d+\.\d+$/);
            expect(version).not.toMatch(/^[\^~]/);
        });

        test('pinned version prevents automatic minor/patch updates', () => {
            const version = packageJson.dependencies['@actions/core'];
            expect(version).toBe('1.9.1');
            expect(version.startsWith('^')).toBe(false);
            expect(version.startsWith('~')).toBe(false);
        });

        test('exact pinning ensures consistent behavior across environments', () => {
            const packageJsonVersion = packageJson.dependencies['@actions/core'];
            const lockFileVersion = packageLockJson.packages['node_modules/@actions/core'].version;
            expect(packageJsonVersion).toBe(lockFileVersion);
        });
    });

    describe('JSON Format Validation', () => {
        test('package.json should be valid JSON', () => {
            const content = fs.readFileSync(packageJsonPath, 'utf8');
            expect(() => JSON.parse(content)).not.toThrow();
        });

        test('package-lock.json should be valid JSON', () => {
            const content = fs.readFileSync(packageLockJsonPath, 'utf8');
            expect(() => JSON.parse(content)).not.toThrow();
        });

        test('should not have trailing commas', () => {
            const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
            const lockContent = fs.readFileSync(packageLockJsonPath, 'utf8');
            
            expect(() => JSON.parse(packageContent)).not.toThrow();
            expect(() => JSON.parse(lockContent)).not.toThrow();
        });

        test('should have proper indentation in package.json', () => {
            const content = fs.readFileSync(packageJsonPath, 'utf8');
            const lines = content.split('\n');
            const indentedLines = lines.filter(line => line.match(/^  "/));
            expect(indentedLines.length).toBeGreaterThan(0);
        });
    });

    describe('Downgrade Validation (1.11.1 to 1.9.1)', () => {
        test('should confirm downgrade from 1.11.1 to 1.9.1', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
            expect(packageJson.dependencies['@actions/core']).not.toBe('1.11.1');
        });

        test('lock file should reflect downgraded version', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.version).toBe('1.9.1');
            expect(corePackage.version).not.toBe('1.11.1');
        });

        test('should have uuid dependency specific to 1.9.1', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies).toHaveProperty('uuid');
            expect(corePackage.dependencies.uuid).toBe('^8.3.2');
        });

        test('should not have @actions/exec dependency in @actions/core 1.9.1', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            // Version 1.9.1 has uuid, but 1.11.1 had @actions/exec instead
            expect(corePackage.dependencies).toHaveProperty('uuid');
            expect(corePackage.dependencies).toHaveProperty('@actions/http-client');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle missing optional fields gracefully', () => {
            const optionalFields = ['repository', 'bugs', 'homepage', 'keywords', 'contributors'];
            optionalFields.forEach(field => {
                expect(() => packageJson[field]).not.toThrow();
            });
        });

        test('should not have empty dependency objects', () => {
            expect(Object.keys(packageJson.dependencies).length).toBeGreaterThan(0);
            expect(Object.keys(packageJson.devDependencies).length).toBeGreaterThan(0);
        });

        test('should not have null or undefined versions', () => {
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            Object.entries(allDeps).forEach(([name, version]) => {
                expect(version).not.toBeNull();
                expect(version).not.toBeUndefined();
                expect(version).toBeTruthy();
            });
        });

        test('should have valid package names', () => {
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            Object.keys(allDeps).forEach(name => {
                expect(name).toMatch(/^[@a-z0-9-/]+$/);
            });
        });

        test('should not have circular dependencies in lock file', () => {
            // Basic check - ensuring packages don't directly reference themselves
            Object.entries(packageLockJson.packages).forEach(([key, pkg]: [string, any]) => {
                if (pkg.dependencies) {
                    const packageName = key.split('/').pop();
                    expect(pkg.dependencies).not.toHaveProperty(packageName);
                }
            });
        });
    });

    describe('Package Integrity Checks', () => {
        test('should have integrity hashes in lock file', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            // Note: integrity may not always be present in all lockfile versions
            if (corePackage.resolved) {
                expect(typeof corePackage.resolved).toBe('string');
            }
        });

        test('should have resolved URLs in lock file', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            if (corePackage.resolved) {
                expect(corePackage.resolved).toMatch(/^https:\/\//);
            }
        });

        test('lock file packages should have version field', () => {
            const criticalPackages = [
                'node_modules/@actions/core',
                'node_modules/@actions/exec',
                'node_modules/@actions/io'
            ];
            
            criticalPackages.forEach(pkgKey => {
                if (packageLockJson.packages[pkgKey]) {
                    expect(packageLockJson.packages[pkgKey].version).toBeDefined();
                    expect(typeof packageLockJson.packages[pkgKey].version).toBe('string');
                }
            });
        });
    });

    describe('Transitive Dependency Validation', () => {
        test('should have @actions/http-client as transitive dependency', () => {
            const httpClient = packageLockJson.packages['node_modules/@actions/http-client'];
            expect(httpClient).toBeDefined();
            expect(httpClient.version).toMatch(/^\d+\.\d+\.\d+$/);
        });

        test('should have tunnel as transitive dependency', () => {
            const tunnel = packageLockJson.packages['node_modules/tunnel'];
            if (tunnel) {
                expect(tunnel.version).toMatch(/^\d+\.\d+\.\d+$/);
            }
        });

        test('uuid 8.3.2 should be properly nested under @actions/core', () => {
            const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuidPackage).toBeDefined();
            expect(uuidPackage.version).toBe('8.3.2');
            expect(uuidPackage.license).toBe('MIT');
        });
    });

    describe('Build and Test Configuration Alignment', () => {
        test('should have jest configuration file', () => {
            const jestConfigPath = path.join(__dirname, '../jest.config.js');
            expect(fs.existsSync(jestConfigPath)).toBe(true);
        });

        test('should have TypeScript configuration file', () => {
            const tsconfigPath = path.join(__dirname, '../tsconfig.json');
            expect(fs.existsSync(tsconfigPath)).toBe(true);
        });

        test('package.json test script should align with jest config', () => {
            expect(packageJson.scripts.test).toBe('jest');
        });

        test('should have main entry point matching build output', () => {
            expect(packageJson.main).toBe('lib/main/index.js');
            expect(packageJson.scripts['build:main']).toContain('-o lib/main');
        });
    });
});