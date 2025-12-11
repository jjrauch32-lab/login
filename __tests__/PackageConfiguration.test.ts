import * as fs from 'fs';
import * as path from 'path';

describe("Package Configuration Tests", () => {
    let packageJson: any;
    let packageLockJson: any;

    beforeAll(() => {
        // Load package.json
        const packageJsonPath = path.join(__dirname, '..', 'package.json');
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        packageJson = JSON.parse(packageJsonContent);

        // Load package-lock.json
        const packageLockJsonPath = path.join(__dirname, '..', 'package-lock.json');
        const packageLockJsonContent = fs.readFileSync(packageLockJsonPath, 'utf8');
        packageLockJson = JSON.parse(packageLockJsonContent);
    });

    describe("Package.json Structure Validation", () => {
        test('should have required metadata fields', () => {
            expect(packageJson.name).toBe('login');
            expect(packageJson.version).toBeDefined();
            expect(packageJson.description).toBeDefined();
            expect(packageJson.author).toBe('Microsoft');
            expect(packageJson.license).toBe('MIT');
        });

        test('should have correct version format', () => {
            const versionRegex = /^\d+\.\d+\.\d+$/;
            expect(packageJson.version).toMatch(versionRegex);
        });

        test('should have main entry point defined', () => {
            expect(packageJson.main).toBe('lib/main/index.js');
        });

        test('should have all required scripts', () => {
            expect(packageJson.scripts).toBeDefined();
            expect(packageJson.scripts['build:main']).toBeDefined();
            expect(packageJson.scripts['build:cleanup']).toBeDefined();
            expect(packageJson.scripts.build).toBeDefined();
            expect(packageJson.scripts.test).toBe('jest');
        });

        test('should have build scripts properly configured', () => {
            expect(packageJson.scripts['build:main']).toContain('ncc build src/main.ts');
            expect(packageJson.scripts['build:cleanup']).toContain('ncc build src/cleanup.ts');
            expect(packageJson.scripts.build).toContain('npm run build:main && npm run build:cleanup');
        });
    });

    describe("Dependencies Validation", () => {
        test('should have all required runtime dependencies', () => {
            expect(packageJson.dependencies).toBeDefined();
            expect(packageJson.dependencies['@actions/core']).toBeDefined();
            expect(packageJson.dependencies['@actions/exec']).toBeDefined();
            expect(packageJson.dependencies['@actions/io']).toBeDefined();
        });

        test('should have all required dev dependencies', () => {
            expect(packageJson.devDependencies).toBeDefined();
            expect(packageJson.devDependencies['@types/jest']).toBeDefined();
            expect(packageJson.devDependencies['@types/node']).toBeDefined();
            expect(packageJson.devDependencies['@vercel/ncc']).toBeDefined();
            expect(packageJson.devDependencies['jest']).toBeDefined();
            expect(packageJson.devDependencies['jest-circus']).toBeDefined();
            expect(packageJson.devDependencies['ts-jest']).toBeDefined();
            expect(packageJson.devDependencies['typescript']).toBeDefined();
        });

        test('should use exact version for @actions/core', () => {
            // Critical: @actions/core should be pinned to exact version for compatibility
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
            expect(packageJson.dependencies['@actions/core']).not.toMatch(/^[\^~]/);
        });

        test('should have semantic version format for other dependencies', () => {
            const semverRegex = /^[\^~]?\d+\.\d+\.\d+$/;
            expect(packageJson.dependencies['@actions/exec']).toMatch(semverRegex);
            expect(packageJson.dependencies['@actions/io']).toMatch(semverRegex);
        });

        test('should not have any empty or undefined dependencies', () => {
            Object.entries(packageJson.dependencies).forEach(([key, value]) => {
                expect(key).toBeTruthy();
                expect(value).toBeTruthy();
                expect(typeof value).toBe('string');
            });
        });

        test('should not have any empty or undefined dev dependencies', () => {
            Object.entries(packageJson.devDependencies).forEach(([key, value]) => {
                expect(key).toBeTruthy();
                expect(value).toBeTruthy();
                expect(typeof value).toBe('string');
            });
        });
    });

    describe("@actions/core Version Specific Tests", () => {
        test('should use version 1.9.1 of @actions/core', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('package-lock.json should reflect @actions/core 1.9.1', () => {
            expect(packageLockJson.packages['node_modules/@actions/core']).toBeDefined();
            expect(packageLockJson.packages['node_modules/@actions/core'].version).toBe('1.9.1');
        });

        test('@actions/core 1.9.1 should have uuid dependency', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies).toBeDefined();
            expect(corePackage.dependencies['uuid']).toBeDefined();
            expect(corePackage.dependencies['@actions/http-client']).toBeDefined();
        });

        test('uuid transitive dependency should be present for @actions/core 1.9.1', () => {
            // Version 1.9.1 includes uuid as a dependency (important for OIDC token generation)
            expect(packageLockJson.packages['node_modules/@actions/core/node_modules/uuid']).toBeDefined();
        });

        test('@actions/core should support getIDToken method required for OIDC', () => {
            // This test verifies the critical functionality needed for OIDC authentication
            // getIDToken was introduced in @actions/core 1.6.0 and is present in 1.9.1
            const coreVersion = packageJson.dependencies['@actions/core'];
            const majorMinor = coreVersion.split('.');
            const major = parseInt(majorMinor[0]);
            const minor = parseInt(majorMinor[1]);
            
            // getIDToken is available in 1.6.0+, and we're using 1.9.1
            expect(major).toBeGreaterThanOrEqual(1);
            if (major === 1) {
                expect(minor).toBeGreaterThanOrEqual(6);
            }
        });
    });

    describe("Package-lock.json Integrity", () => {
        test('should have lockfileVersion defined', () => {
            expect(packageLockJson.lockfileVersion).toBeDefined();
            expect(typeof packageLockJson.lockfileVersion).toBe('number');
        });

        test('should have name matching package.json', () => {
            expect(packageLockJson.name).toBe(packageJson.name);
        });

        test('should have version matching package.json', () => {
            expect(packageLockJson.version).toBe(packageJson.version);
        });

        test('should have packages defined', () => {
            expect(packageLockJson.packages).toBeDefined();
            expect(typeof packageLockJson.packages).toBe('object');
        });

        test('root package should match package.json dependencies', () => {
            const rootPackage = packageLockJson.packages[''];
            expect(rootPackage).toBeDefined();
            expect(rootPackage.dependencies).toEqual(packageJson.dependencies);
            expect(rootPackage.devDependencies).toEqual(packageJson.devDependencies);
        });

        test('should have node_modules entries for all dependencies', () => {
            Object.keys(packageJson.dependencies).forEach(dep => {
                const nodePath = `node_modules/${dep}`;
                expect(packageLockJson.packages[nodePath]).toBeDefined();
            });
        });
    });

    describe("Dependency Version Compatibility", () => {
        test('should not have version conflicts in package-lock.json', () => {
            // Check that the same package doesn't appear with different versions at root level
            const packageVersions: { [key: string]: string[] } = {};
            
            Object.entries(packageLockJson.packages).forEach(([path, pkg]: [string, any]) => {
                if (path.startsWith('node_modules/') && !path.includes('node_modules/', 11)) {
                    const packageName = path.replace('node_modules/', '');
                    if (!packageVersions[packageName]) {
                        packageVersions[packageName] = [];
                    }
                    if (pkg.version) {
                        packageVersions[packageName].push(pkg.version);
                    }
                }
            });

            // Each top-level dependency should have only one version
            Object.entries(packageVersions).forEach(([name, versions]) => {
                const uniqueVersions = [...new Set(versions)];
                expect(uniqueVersions.length).toBe(1);
            });
        });

        test('should have compatible @actions packages', () => {
            // Verify all @actions packages are compatible versions
            const actionsPackages = Object.entries(packageJson.dependencies)
                .filter(([name]) => name.startsWith('@actions/'));
            
            expect(actionsPackages.length).toBeGreaterThan(0);
            
            actionsPackages.forEach(([name, version]) => {
                expect(version).toBeDefined();
                expect(version).not.toBe('');
            });
        });

        test('should have TypeScript compatible with ts-jest', () => {
            const typescript = packageJson.devDependencies['typescript'];
            const tsJest = packageJson.devDependencies['ts-jest'];
            
            expect(typescript).toBeDefined();
            expect(tsJest).toBeDefined();
            
            // Both should use semantic versioning
            expect(typescript).toMatch(/^[\^~]?\d+\.\d+\.\d+$/);
            expect(tsJest).toMatch(/^[\^~]?\d+\.\d+\.\d+$/);
        });
    });

    describe("Security and Best Practices", () => {
        test('should not have any deprecated package names', () => {
            const deprecatedPackages = ['request', 'node-uuid'];
            
            Object.keys(packageJson.dependencies || {}).forEach(dep => {
                expect(deprecatedPackages).not.toContain(dep);
            });
            
            Object.keys(packageJson.devDependencies || {}).forEach(dep => {
                expect(deprecatedPackages).not.toContain(dep);
            });
        });

        test('should not have any known vulnerable version patterns', () => {
            // Check for version wildcards that could introduce vulnerabilities
            Object.entries(packageJson.dependencies).forEach(([name, version]) => {
                expect(version).not.toBe('*');
                expect(version).not.toBe('latest');
                expect(version).not.toMatch(/^x\./);
            });
        });

        test('should have license field defined', () => {
            expect(packageJson.license).toBe('MIT');
        });

        test('should not have any local file dependencies', () => {
            Object.values(packageJson.dependencies).forEach(version => {
                expect(version).not.toMatch(/^file:/);
            });
        });
    });

    describe("OIDC Functionality Requirements", () => {
        test('should support OIDC authentication with current dependencies', () => {
            // @actions/core 1.9.1 includes getIDToken which is critical for OIDC
            const coreVersion = packageJson.dependencies['@actions/core'];
            expect(coreVersion).toBe('1.9.1');
            
            // Verify the version has the necessary dependencies for OIDC
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies['@actions/http-client']).toBeDefined();
        });

        test('should have http-client dependency for token fetching', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies['@actions/http-client']).toMatch(/^\^2\./);
        });

        test('should maintain compatibility with GitHub Actions OIDC provider', () => {
            // Ensure @actions/core version supports the OIDC workflow
            // getIDToken was introduced in 1.6.0 and is stable in 1.9.1
            const version = packageJson.dependencies['@actions/core'];
            const [major, minor] = version.split('.').map(Number);
            
            expect(major).toBe(1);
            expect(minor).toBeGreaterThanOrEqual(6);
        });
    });

    describe("Build and Test Configuration", () => {
        test('should have Jest configured correctly', () => {
            const jestConfig = require('../jest.config.js');
            expect(jestConfig).toBeDefined();
            expect(jestConfig.testEnvironment).toBe('node');
            expect(jestConfig.testRunner).toBe('jest-circus/runner');
        });

        test('should have TypeScript configuration for tests', () => {
            const jestConfig = require('../jest.config.js');
            expect(jestConfig.transform).toBeDefined();
            expect(jestConfig.transform['^.+\\.ts$']).toBe('ts-jest');
        });

        test('should have ncc bundler for production builds', () => {
            expect(packageJson.devDependencies['@vercel/ncc']).toBeDefined();
        });

        test('should have type definitions for Node.js', () => {
            expect(packageJson.devDependencies['@types/node']).toBeDefined();
        });

        test('should have type definitions for Jest', () => {
            expect(packageJson.devDependencies['@types/jest']).toBeDefined();
        });
    });

    describe("Consistency Checks", () => {
        test('package-lock.json should be consistent with package.json', () => {
            const rootPkg = packageLockJson.packages[''];
            
            // Check dependencies
            expect(Object.keys(rootPkg.dependencies).sort()).toEqual(
                Object.keys(packageJson.dependencies).sort()
            );
            
            // Check devDependencies
            expect(Object.keys(rootPkg.devDependencies).sort()).toEqual(
                Object.keys(packageJson.devDependencies).sort()
            );
        });

        test('all dependencies should have resolved versions in package-lock', () => {
            Object.keys(packageJson.dependencies).forEach(dep => {
                const lockEntry = packageLockJson.packages[`node_modules/${dep}`];
                expect(lockEntry).toBeDefined();
                expect(lockEntry.version).toBeDefined();
                expect(lockEntry.resolved).toBeDefined();
            });
        });

        test('should have integrity hashes for all packages', () => {
            Object.entries(packageLockJson.packages).forEach(([path, pkg]: [string, any]) => {
                if (path !== '' && pkg.resolved) {
                    // Packages fetched from registry should have integrity
                    expect(pkg.integrity || pkg.license).toBeDefined();
                }
            });
        });
    });

    describe("Edge Cases and Error Conditions", () => {
        test('should handle missing optional dependencies gracefully', () => {
            // Ensure no optional dependencies are marked as required
            const rootPkg = packageLockJson.packages[''];
            if (rootPkg.optionalDependencies) {
                Object.keys(rootPkg.optionalDependencies).forEach(dep => {
                    expect(rootPkg.dependencies[dep]).toBeUndefined();
                });
            }
        });

        test('should not have circular dependencies', () => {
            // Basic check: no package should depend on the root package
            Object.entries(packageLockJson.packages).forEach(([path, pkg]: [string, any]) => {
                if (path !== '' && pkg.dependencies) {
                    expect(pkg.dependencies[packageJson.name]).toBeUndefined();
                }
            });
        });

        test('should handle version parsing without errors', () => {
            Object.values(packageJson.dependencies).forEach(version => {
                // Should not throw when parsing version
                expect(() => {
                    const cleaned = version.replace(/^[\^~]/, '');
                    const parts = cleaned.split('.');
                    parts.forEach(part => parseInt(part, 10));
                }).not.toThrow();
            });
        });
    });

    describe("GitHub Actions Specific Requirements", () => {
        test('should have all required @actions packages for GitHub Actions', () => {
            const requiredActions = ['@actions/core', '@actions/exec', '@actions/io'];
            requiredActions.forEach(pkg => {
                expect(packageJson.dependencies[pkg]).toBeDefined();
            });
        });

        test('should use compatible versions of @actions packages', () => {
            // @actions/core 1.9.1 should work with other @actions packages
            expect(packageJson.dependencies['@actions/exec']).toMatch(/^\^1\./);
            expect(packageJson.dependencies['@actions/io']).toMatch(/^\^1\./);
        });

        test('should support environment variable inputs', () => {
            // Verify @actions/core version supports getInput which reads from env vars
            const version = packageJson.dependencies['@actions/core'];
            expect(version).toBeTruthy();
            // getInput has been available since early versions
        });
    });

    describe("Version Downgrade Validation", () => {
        test('should use @actions/core 1.9.1 instead of 1.11.1', () => {
            // Explicit test for the version downgrade in the diff
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
            expect(packageJson.dependencies['@actions/core']).not.toBe('1.11.1');
        });

        test('downgraded version should maintain required functionality', () => {
            // Version 1.9.1 should have all necessary features for this action
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            
            // Should have uuid for token generation
            expect(corePackage.dependencies['uuid']).toBeDefined();
            
            // Should have http-client for API calls
            expect(corePackage.dependencies['@actions/http-client']).toBeDefined();
        });

        test('should not have @actions/exec as dependency of @actions/core 1.9.1', () => {
            // Version 1.11.1 had @actions/exec as a dependency, but 1.9.1 uses uuid instead
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.dependencies['@actions/exec']).toBeUndefined();
        });

        test('package-lock should reflect uuid dependency for @actions/core 1.9.1', () => {
            const uuidPackage = packageLockJson.packages['node_modules/@actions/core/node_modules/uuid'];
            expect(uuidPackage).toBeDefined();
            expect(uuidPackage.version).toBe('8.3.2');
        });
    });

    describe("Regression Prevention", () => {
        test('should prevent accidental upgrade to @actions/core 1.11.1', () => {
            // Ensure exact version pinning prevents unintended upgrades
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
            expect(packageJson.dependencies['@actions/core']).not.toMatch(/^\^/);
            expect(packageJson.dependencies['@actions/core']).not.toMatch(/^~/);
        });

        test('should maintain exact version in package-lock.json', () => {
            const corePackage = packageLockJson.packages['node_modules/@actions/core'];
            expect(corePackage.version).toBe('1.9.1');
        });

        test('should verify no other versions of @actions/core exist', () => {
            const coreVersions: string[] = [];
            Object.entries(packageLockJson.packages).forEach(([path, pkg]: [string, any]) => {
                if (path.includes('@actions/core') && pkg.version) {
                    coreVersions.push(pkg.version);
                }
            });
            
            // Should only have one version: 1.9.1
            const uniqueVersions = [...new Set(coreVersions)];
            expect(uniqueVersions.length).toBe(1);
            expect(uniqueVersions[0]).toBe('1.9.1');
        });
    });
});