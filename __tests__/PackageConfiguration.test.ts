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

        test('should have valid version field following semver', () => {
            expect(typeof packageJson.version).toBe('string');
            expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
        });

        test('should have valid main entry point', () => {
            expect(typeof packageJson.main).toBe('string');
            expect(packageJson.main).toBe('lib/main/index.js');
        });
    });

    describe('package.json Dependencies Validation', () => {
        test('should have @actions/core at exact version 1.9.1', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
        });

        test('should NOT have @actions/core at version 1.11.1', () => {
            expect(packageJson.dependencies['@actions/core']).not.toBe('1.11.1');
            expect(packageJson.dependencies['@actions/core']).not.toBe('^1.11.1');
        });

        test('should have required runtime dependencies', () => {
            expect(packageJson.dependencies).toHaveProperty('@actions/core');
            expect(packageJson.dependencies).toHaveProperty('@actions/exec');
            expect(packageJson.dependencies).toHaveProperty('@actions/io');
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
    });

    describe('Critical Dependency Pinning', () => {
        test('@actions/core should be pinned to exact version', () => {
            const version = packageJson.dependencies['@actions/core'];
            expect(version).not.toMatch(/^[\^~]/);
            expect(version).toBe('1.9.1');
        });
    });

    describe('Regression Prevention', () => {
        test('should prevent accidental upgrade back to 1.11.1', () => {
            expect(packageJson.dependencies['@actions/core']).toBe('1.9.1');
            expect(packageJson.dependencies['@actions/core']).not.toContain('1.11');
        });

        test('lock file should not contain any 1.11.x references for @actions/core', () => {
            const lockContent = fs.readFileSync(packageLockJsonPath, 'utf8');
            const coreReferences = lockContent.match(/@actions\/core.*1\.11/g);
            expect(coreReferences).toBeNull();
        });
    });
});