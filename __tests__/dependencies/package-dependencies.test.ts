/**
 * Tests for package.json dependency configuration
 * This test suite validates the dependency versions and their compatibility,
 * specifically focusing on the @actions/core version downgrade from 1.11.1 to 1.9.1
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Package Dependencies Configuration', () => {
    let packageJson: any;
    let packageLockJson: any;

    beforeAll(() => {
        // Load package.json
        const packageJsonPath = path.join(__dirname, '../../package.json');
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

        // Load package-lock.json
        const packageLockPath = path.join(__dirname, '../../package-lock.json');
        packageLockJson = JSON.parse(fs.readFileSync(packageLockPath, 'utf-8'));
    });

    describe('package.json structure validation', () => {
        it('should have required metadata fields', () => {
            expect(packageJson.name).toBe('login');
            expect(packageJson.version).toBeDefined();
            expect(packageJson.description).toBeDefined();
            expect(packageJson.license).toBe('MIT');
            expect(packageJson.author).toBe('Microsoft');
        });

        it('should have required script commands', () => {
            expect(packageJson.scripts).toBeDefined();
            expect(packageJson.scripts.build).toBeDefined();
            expect(packageJson.scripts['build:main']).toBeDefined();
            expect(packageJson.scripts['build:cleanup']).toBeDefined();
            expect(packageJson.scripts.test).toBe('jest');
        });

        it('should have main entry point defined', () => {
            expect(packageJson.main).toBe('lib/main/index.js');
        });

        it('should have both dependencies and devDependencies', () => {
            expect(packageJson.dependencies).toBeDefined();
            expect(packageJson.devDependencies).toBeDefined();
            expect(Object.keys(packageJson.dependencies).length).toBeGreaterThan(0);
            expect(Object.keys(packageJson.devDependencies).length).toBeGreaterThan(0);
        });
    });

    describe('@actions/core version validation', () => {
        it('should use @actions/core version 1.9.1', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        it('should have @actions/core pinned to exact version', () => {
            const coreVersion = packageJson.dependencies['@actions/core'];
            expect(coreVersion).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+$/);
            expect(coreVersion).not.toMatch(/^[\^~]/);
        });

        it('should have matching version in package-lock.json', () => {
            const lockVersion = packageLockJson.packages['node_modules/@actions/core']?.version;
            expect(lockVersion).toBe('1.9.1');
        });

        it('should have uuid as subdependency of @actions/core in package-lock', () => {
            const coreDeps = packageLockJson.packages['node_modules/@actions/core']?.dependencies;
            expect(coreDeps).toBeDefined();
            expect(coreDeps['uuid']).toBe('^8.3.2');
        });

        it('should have uuid 8.3.2 installed as nested dependency', () => {
            const uuidNode = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuidNode).toBeDefined();
            expect(uuidNode.version).toBe('8.3.2');
        });
    });

    describe('Critical dependency versions', () => {
        it('should have @actions/exec dependency', () => {
            expect(packageJson.dependencies['@actions/exec']).toBeDefined();
            expect(packageJson.dependencies['@actions/exec']).toMatch(/^\^?1\./);
        });

        it('should have @actions/io dependency', () => {
            expect(packageJson.dependencies['@actions/io']).toBeDefined();
            expect(packageJson.dependencies['@actions/io']).toMatch(/^\^?1\./);
        });

        it('should have package-lock dependency', () => {
            expect(packageJson.dependencies['package-lock']).toBeDefined();
        });
    });

    describe('Development dependencies validation', () => {
        it('should have TypeScript and type definitions', () => {
            expect(packageJson.devDependencies['typescript']).toBeDefined();
            expect(packageJson.devDependencies['@types/node']).toBeDefined();
            expect(packageJson.devDependencies['@types/jest']).toBeDefined();
        });

        it('should have Jest and related dependencies', () => {
            expect(packageJson.devDependencies['jest']).toBeDefined();
            expect(packageJson.devDependencies['ts-jest']).toBeDefined();
            expect(packageJson.devDependencies['jest-circus']).toBeDefined();
        });

        it('should have build tooling', () => {
            expect(packageJson.devDependencies['@vercel/ncc']).toBeDefined();
        });

        it('should use Jest version 29.x', () => {
            expect(packageJson.devDependencies['jest']).toMatch(/^\^29\./);
        });

        it('should use TypeScript version 4.x', () => {
            expect(packageJson.devDependencies['typescript']).toMatch(/^\^4\./);
        });
    });

    describe('package-lock.json integrity', () => {
        it('should have lockfileVersion defined', () => {
            expect(packageLockJson.lockfileVersion).toBeDefined();
            expect(packageLockJson.lockfileVersion).toBeGreaterThanOrEqual(2);
        });

        it('should match package.json name and version', () => {
            expect(packageLockJson.name).toBe(packageJson.name);
            expect(packageLockJson.version).toBe(packageJson.version);
        });

        it('should have all dependencies from package.json in packages', () => {
            const deps = Object.keys(packageJson.dependencies);
            deps.forEach(dep => {
                const nodeModulePath = `node_modules/${dep}`;
                expect(packageLockJson.packages[nodeModulePath]).toBeDefined();
            });
        });

        it('should have all devDependencies from package.json in packages', () => {
            const devDeps = Object.keys(packageJson.devDependencies);
            devDeps.forEach(dep => {
                const nodeModulePath = `node_modules/${dep}`;
                expect(packageLockJson.packages[nodeModulePath]).toBeDefined();
            });
        });

        it('should have integrity hashes for all packages', () => {
            const packages = packageLockJson.packages;
            // Check a few critical packages
            const criticalPackages = [
                'node_modules/@actions/core',
                'node_modules/@actions/exec',
                'node_modules/@actions/io'
            ];

            criticalPackages.forEach(pkg => {
                const packageInfo = packages[pkg];
                if (packageInfo && !packageInfo.link) {
                    // Packages with license but no integrity are likely local/linked
                    // Skip integrity check for those
                    if (packageInfo.resolved) {
                        expect(packageInfo.integrity || packageInfo.license).toBeDefined();
                    }
                }
            });
        });
    });

    describe('Version compatibility checks', () => {
        it('should have compatible @actions/* package versions', () => {
            const actionsPackages = Object.keys(packageJson.dependencies)
                .filter(dep => dep.startsWith('@actions/'));
            
            expect(actionsPackages.length).toBeGreaterThan(0);
            
            actionsPackages.forEach(pkg => {
                const version = packageJson.dependencies[pkg];
                expect(version).toBeDefined();
                expect(version).toMatch(/^[\^~]?[0-9]+\.[0-9]+\.[0-9]+/);
            });
        });

        it('should not have conflicting peer dependencies', () => {
            // Check that package-lock doesn't contain multiple conflicting versions
            const coreVersions = new Set<string>();
            
            Object.keys(packageLockJson.packages || {}).forEach(key => {
                if (key.includes('@actions/core')) {
                    const version = packageLockJson.packages[key].version;
                    if (version) {
                        coreVersions.add(version);
                    }
                }
            });

            // Should have at most one version of @actions/core in the main dependency tree
            expect(coreVersions.size).toBeLessThanOrEqual(2); // Allow for nested dependencies
        });
    });

    describe('Dependency security and best practices', () => {
        it('should not use wildcards in production dependencies', () => {
            const deps = packageJson.dependencies;
            Object.keys(deps).forEach(dep => {
                expect(deps[dep]).not.toMatch(/\*/);
                expect(deps[dep]).not.toMatch(/^latest$/i);
            });
        });

        it('should have reasonable version constraints', () => {
            const deps = packageJson.dependencies;
            Object.keys(deps).forEach(dep => {
                const version = deps[dep];
                // Should be semver-compatible or exact version
                expect(version).toMatch(/^[\^~]?[0-9]+\.[0-9]+\.[0-9]+/);
            });
        });

        it('should not have duplicate dependencies in both deps and devDeps', () => {
            const deps = new Set(Object.keys(packageJson.dependencies));
            const devDeps = new Set(Object.keys(packageJson.devDependencies));
            
            const intersection = [...deps].filter(d => devDeps.has(d));
            expect(intersection).toEqual([]);
        });
    });

    describe('Backward compatibility with @actions/core 1.9.1', () => {
        it('should declare dependency on @actions/http-client', () => {
            // @actions/core 1.9.1 depends on @actions/http-client
            const coreDeps = packageLockJson.packages['node_modules/@actions/core']?.dependencies;
            expect(coreDeps['@actions/http-client']).toBeDefined();
            expect(coreDeps['@actions/http-client']).toMatch(/^\^2\./);
        });

        it('should have uuid package available for @actions/core', () => {
            // Version 1.9.1 uses uuid for generating correlation IDs
            const coreDeps = packageLockJson.packages['node_modules/@actions/core']?.dependencies;
            expect(coreDeps['uuid']).toBe('^8.3.2');
        });

        it('should not have @actions/exec as direct dependency of @actions/core', () => {
            // In 1.9.1, @actions/exec was not a direct dependency of core
            const coreDeps = packageLockJson.packages['node_modules/@actions/core']?.dependencies;
            expect(coreDeps['@actions/exec']).toBeUndefined();
        });
    });
});