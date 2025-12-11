/**
 * Schema validation tests for package.json
 * Ensures package.json follows npm/Node.js best practices and conventions
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Package.json Schema Validation', () => {
    let packageJson: any;

    beforeAll(() => {
        const packagePath = path.join(__dirname, '../../package.json');
        const content = fs.readFileSync(packagePath, 'utf-8');
        packageJson = JSON.parse(content);
    });

    describe('Required fields', () => {
        it('should have name field', () => {
            expect(packageJson.name).toBeDefined();
            expect(typeof packageJson.name).toBe('string');
            expect(packageJson.name.length).toBeGreaterThan(0);
        });

        it('should have version field', () => {
            expect(packageJson.version).toBeDefined();
            expect(typeof packageJson.version).toBe('string');
            expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+/);
        });

        it('should have description field', () => {
            expect(packageJson.description).toBeDefined();
            expect(typeof packageJson.description).toBe('string');
        });

        it('should have license field', () => {
            expect(packageJson.license).toBeDefined();
            expect(typeof packageJson.license).toBe('string');
        });

        it('should have main entry point', () => {
            expect(packageJson.main).toBeDefined();
            expect(typeof packageJson.main).toBe('string');
            expect(packageJson.main).toMatch(/\.js$/);
        });
    });

    describe('Name validation', () => {
        it('should have lowercase name', () => {
            expect(packageJson.name).toBe(packageJson.name.toLowerCase());
        });

        it('should not have spaces in name', () => {
            expect(packageJson.name).not.toMatch(/\s/);
        });

        it('should not start with dot or underscore', () => {
            expect(packageJson.name).not.toMatch(/^[._]/);
        });

        it('should only contain URL-safe characters', () => {
            expect(packageJson.name).toMatch(/^[a-z0-9\-_]+$/);
        });
    });

    describe('Version validation', () => {
        it('should follow semantic versioning', () => {
            expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/);
        });

        it('should not have leading zeros in version numbers', () => {
            const parts = packageJson.version.split(/[.+\-]/)[0].split('.');
            parts.forEach((part: string) => {
                if (part.length > 1) {
                    expect(part).not.toMatch(/^0/);
                }
            });
        });
    });

    describe('Scripts validation', () => {
        it('should have scripts object', () => {
            expect(packageJson.scripts).toBeDefined();
            expect(typeof packageJson.scripts).toBe('object');
        });

        it('should have test script', () => {
            expect(packageJson.scripts.test).toBeDefined();
        });

        it('should have build script', () => {
            expect(packageJson.scripts.build).toBeDefined();
        });

        it('should have valid script commands', () => {
            Object.values(packageJson.scripts).forEach((script: any) => {
                expect(typeof script).toBe('string');
                expect(script.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Dependencies structure', () => {
        it('should have dependencies object', () => {
            expect(packageJson.dependencies).toBeDefined();
            expect(typeof packageJson.dependencies).toBe('object');
        });

        it('should have devDependencies object', () => {
            expect(packageJson.devDependencies).toBeDefined();
            expect(typeof packageJson.devDependencies).toBe('object');
        });

        it('should have valid dependency versions', () => {
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };

            Object.entries(allDeps).forEach(([name, version]: [string, any]) => {
                expect(typeof name).toBe('string');
                expect(typeof version).toBe('string');
                // Should be valid semver range or exact version
                expect(version).toMatch(/^[\^~]?\d+\.\d+\.\d+|^[a-z]+:|^[a-z0-9./-]+$/i);
            });
        });

        it('should not have empty dependency names', () => {
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };

            Object.keys(allDeps).forEach(name => {
                expect(name.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Metadata fields', () => {
        it('should have author field', () => {
            expect(packageJson.author).toBeDefined();
        });

        it('should have license field', () => {
            expect(packageJson.license).toBeDefined();
            expect(packageJson.license).toBe('MIT');
        });

        it('should not have private field or it should be false', () => {
            if (packageJson.private !== undefined) {
                expect(packageJson.private).toBe(false);
            }
        });
    });

    describe('Entry points validation', () => {
        it('should have main field pointing to valid path', () => {
            expect(packageJson.main).toBeDefined();
            expect(packageJson.main).toMatch(/^(lib|dist|build|src)\//);
        });

        it('should not have browser field conflicts', () => {
            if (packageJson.browser) {
                expect(packageJson.browser).not.toBe(packageJson.main);
            }
        });
    });

    describe('GitHub Actions specific fields', () => {
        it('should be a valid GitHub Action package', () => {
            // For GitHub Actions, check if action.yml exists (separate validation)
            const actionYmlPath = path.join(__dirname, '../../action.yml');
            expect(fs.existsSync(actionYmlPath)).toBe(true);
        });
    });

    describe('Security and quality checks', () => {
        it('should not have scripts in dependencies', () => {
            const hasScripts = Object.keys(packageJson.dependencies || {})
                .some(dep => dep.includes('script'));
            
            if (hasScripts) {
                // Only @actions/core scripts are acceptable
                const nonActionScripts = Object.keys(packageJson.dependencies)
                    .filter(dep => dep.includes('script') && !dep.startsWith('@actions/'));
                expect(nonActionScripts).toEqual([]);
            }
        });

        it('should not have pre/post install scripts', () => {
            expect(packageJson.scripts.preinstall).toBeUndefined();
            expect(packageJson.scripts.postinstall).toBeUndefined();
        });

        it('should not reference local file paths in dependencies', () => {
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };

            Object.values(allDeps).forEach((version: any) => {
                expect(version).not.toMatch(/^file:/);
                expect(version).not.toMatch(/^link:/);
            });
        });
    });

    describe('JSON formatting', () => {
        it('should be valid JSON', () => {
            const packagePath = path.join(__dirname, '../../package.json');
            const content = fs.readFileSync(packagePath, 'utf-8');
            
            expect(() => {
                JSON.parse(content);
            }).not.toThrow();
        });

        it('should be properly formatted', () => {
            const packagePath = path.join(__dirname, '../../package.json');
            const content = fs.readFileSync(packagePath, 'utf-8');
            const parsed = JSON.parse(content);
            const formatted = JSON.stringify(parsed, null, 2);
            
            // Content should be similar to formatted version (allowing for trailing newline)
            expect(content.trim()).toBe(formatted);
        });
    });

    describe('Consistency checks', () => {
        it('should have consistent package name across files', () => {
            const packageLockPath = path.join(__dirname, '../../package-lock.json');
            if (fs.existsSync(packageLockPath)) {
                const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf-8'));
                expect(packageLock.name).toBe(packageJson.name);
            }
        });

        it('should have consistent version across files', () => {
            const packageLockPath = path.join(__dirname, '../../package-lock.json');
            if (fs.existsSync(packageLockPath)) {
                const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf-8'));
                expect(packageLock.version).toBe(packageJson.version);
            }
        });

        it('should not have duplicate dependencies', () => {
            const deps = new Set(Object.keys(packageJson.dependencies || {}));
            const devDeps = new Set(Object.keys(packageJson.devDependencies || {}));
            
            const duplicates = [...deps].filter(d => devDeps.has(d));
            expect(duplicates).toEqual([]);
        });
    });

    describe('Best practices', () => {
        it('should have engines field for Node.js version', () => {
            // This is recommended but not required
            if (packageJson.engines) {
                expect(packageJson.engines.node).toBeDefined();
            }
        });

        it('should group related scripts together', () => {
            const scripts = Object.keys(packageJson.scripts);
            
            // Build scripts should be grouped
            const buildScripts = scripts.filter(s => s.startsWith('build'));
            if (buildScripts.length > 1) {
                expect(buildScripts).toContain('build');
            }
        });

        it('should use consistent semver ranges', () => {
            const devDeps = packageJson.devDependencies || {};
            const ranges = Object.values(devDeps)
                .map((v: any) => v.match(/^[\^~]/)?.[0])
                .filter(Boolean);
            
            if (ranges.length > 0) {
                const mostCommon = ranges.sort((a: any, b: any) =>
                    ranges.filter(r => r === a).length - ranges.filter(r => r === b).length
                ).pop();
                
                // Most dependencies should use the same range style
                const matchingCount = ranges.filter(r => r === mostCommon).length;
                expect(matchingCount / ranges.length).toBeGreaterThan(0.5);
            }
        });
    });
});