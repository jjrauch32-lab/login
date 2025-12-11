# Package Dependencies Test Suite

## Overview

This test suite (`PackageDependencies.test.ts`) provides comprehensive validation for the package dependency changes made in this branch, specifically the downgrade of `@actions/core` from version `1.11.1` to `1.9.1`.

## Test Coverage

### 1. Package.json Structure Validation (3 tests)
- Validates required metadata fields (name, version, description, license, author)
- Ensures required build and test scripts are present
- Verifies main entry point is correctly defined

### 2. Critical Dependencies Validation (4 tests)
- Confirms `@actions/core` is at exact version `1.9.1`
- Validates presence of `@actions/exec` dependency
- Validates presence of `@actions/io` dependency
- Ensures all required GitHub Actions dependencies are present

### 3. Development Dependencies Validation (3 tests)
- Verifies Jest testing framework and related packages
- Checks TypeScript tooling dependencies
- Validates build tools (ncc) are present

### 4. Package-lock.json Consistency (6 tests)
- Ensures package-lock matches package.json metadata
- Validates lockfile version 3 format
- Confirms `@actions/core` is at exact version `1.9.1` in lock file
- Verifies version 1.9.1 has correct dependencies (`@actions/http-client` and `uuid`)
- Confirms `uuid` version `8.3.2` is present as nested dependency
- Validates that version 1.9.1 does NOT have `@actions/exec` as dependency (distinguishing it from 1.11.1)

### 5. Dependency Consistency Tests (2 tests)
- Verifies all production dependencies are in package-lock
- Verifies all dev dependencies are in package-lock

### 6. Version Constraint Validation (3 tests)
- Confirms exact version (no caret) for `@actions/core`
- Validates caret versioning for other `@actions` packages
- Ensures compatible version ranges across related packages

### 7. Security and Integrity Checks (2 tests)
- Validates MIT license in package-lock
- Ensures no known vulnerable dependency patterns

### 8. @actions/core API Compatibility Tests (8 tests)
Tests availability of all core API methods used in the codebase:
- `getInput`
- `setFailed`
- `debug`
- `info`
- `warning`
- `error`
- `setSecret`
- `getIDToken`

### 9. Core API Method Signatures and Behavior (8 tests)
- Tests `getInput` with string parameter and options
- Validates `setSecret` accepts string parameter
- Tests logging methods (`debug`, `info`, `warning`, `error`)
- Validates `setFailed` accepts both string and Error object

### 10. Critical Functionality for Azure Login (4 tests)
- Tests secret masking functionality
- Validates input retrieval with required flag
- Tests handling of empty/missing inputs
- Verifies input name transformation (kebab-case to UPPERCASE_SNAKE_CASE)

### 11. OIDC Token Functionality (2 tests)
- Confirms `getIDToken` method is available
- Validates method signature accepts optional audience parameter

### 12. Version-Specific Feature Tests (8 tests)
Tests features available in `@actions/core` version 1.9.1:
- Summary functionality
- OIDC token methods
- `exportVariable`
- `setOutput`
- `addPath`
- `group` and `endGroup`
- `saveState` and `getState`

### 13. Backward Compatibility Tests (1 test)
- Validates all methods used in the codebase are available in version 1.9.1

### 14. Integration with Codebase Patterns (8 tests)
Tests real usage patterns from the codebase:
- LoginConfig input retrieval patterns
- Optional input handling
- Secret masking patterns
- Error handling with `setFailed`
- Debug logging with stack traces
- Info/warning/error logging patterns

## Why These Tests Matter

### Dependency Downgrade Validation
The downgrade from `@actions/core` 1.11.1 to 1.9.1 changes the dependency tree:
- **1.11.1**: Dependencies include `@actions/exec` and `@actions/http-client`
- **1.9.1**: Dependencies include `uuid` and `@actions/http-client` (no `@actions/exec`)

These tests ensure:
1. The correct version is installed
2. All API methods used in the codebase remain available
3. The dependency tree is correct for version 1.9.1
4. No breaking changes affect the Azure Login functionality

### API Compatibility Assurance
The codebase uses these critical `@actions/core` methods:
- `getInput` (9 uses) - for retrieving action inputs
- `info` (10 uses) - for logging information
- `debug` (11 uses) - for debug logging
- `warning` (6 uses) - for non-critical warnings
- `error` (3 uses) - for error logging
- `setSecret` (1 use) - for masking sensitive values
- `getIDToken` (1 use) - for OIDC authentication
- `setFailed` (1 use) - for marking action as failed

All these methods are tested to ensure they work correctly with version 1.9.1.

### Real-World Usage Validation
The integration tests verify actual usage patterns from the codebase, ensuring:
- Input transformation works correctly (e.g., `enable-AzPSSession` → `INPUT_ENABLE_AZPSSESSION`)
- Optional inputs are handled properly
- Secrets are masked correctly
- Error handling patterns work as expected

## Running the Tests

```bash
npm test
```

Or run just this test suite:

```bash
npm test -- PackageDependencies.test.ts
```

## Test Statistics

- **Total test suites**: 14
- **Total tests**: 68
- **Coverage areas**: Package structure, dependencies, API compatibility, integration patterns
- **Lines of code**: ~450

## Related Files

- `package.json` - Production dependencies and metadata
- `package-lock.json` - Locked dependency tree
- `src/common/LoginConfig.ts` - Primary user of `@actions/core.getInput`
- `src/main.ts` - Uses `@actions/core.setFailed` and `@actions/core.debug`
- `src/cleanup.ts` - Uses `@actions/core` for cleanup operations
- All source files in `src/` - Various uses of logging methods

## Maintenance Notes

When updating `@actions/core` in the future:
1. Update the version number test expectations
2. Verify the dependency tree structure in package-lock tests
3. Ensure all API methods used in the codebase are still available
4. Check for any deprecated methods or new recommended patterns
5. Update integration tests if usage patterns change