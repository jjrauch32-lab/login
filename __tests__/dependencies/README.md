# Dependency Tests for @actions/core Version Downgrade

## Overview

This test suite validates the downgrade of `@actions/core` from version `1.11.1` to `1.9.1` in the Azure Login GitHub Action. The tests ensure backward compatibility, validate the dependency configuration, and verify that all features used in the codebase continue to work correctly with the older version.

## Test Files

### 1. `package-dependencies.test.ts` (252 lines, 30 tests)

Validates the structure and integrity of `package.json` and `package-lock.json`.

**Key Test Categories:**
- **package.json structure validation**: Ensures required metadata fields are present
- **@actions/core version validation**: Verifies version 1.9.1 is correctly specified
- **Critical dependency versions**: Checks all @actions/* packages are present
- **Development dependencies validation**: Validates Jest, TypeScript, and build tools
- **package-lock.json integrity**: Ensures lock file is consistent with package.json
- **Version compatibility checks**: Validates no conflicting peer dependencies
- **Dependency security and best practices**: Checks for wildcards, duplicates
- **Backward compatibility with @actions/core 1.9.1**: Validates dependency tree changes

### 2. `actions-core-integration.test.ts` (428 lines, 55 tests)

Integration tests that verify @actions/core v1.9.1 API compatibility.

**Key Test Categories:**
- **Core API availability**: Verifies all required functions are exported
- **getInput functionality**: Tests input retrieval, trimming, required inputs
- **setOutput functionality**: Tests output setting with various data types
- **Logging functions**: Tests debug, info, warning, error functions
- **setFailed functionality**: Tests failure status setting
- **Secret management**: Tests secret masking
- **Environment variable management**: Tests exportVariable
- **State management**: Tests saveState and getState
- **Group functionality**: Tests output grouping
- **OIDC token functionality**: Tests getIDToken for OIDC authentication
- **Version-specific features**: Tests APIs used in the login action
- **Edge cases and error handling**: Tests null values, long inputs, special chars
- **Performance**: Tests efficiency of repeated calls

### 3. `version-compatibility.test.ts` (241 lines, 20 tests)

Validates version-specific compatibility and migration safety.

**Key Test Categories:**
- **@actions/core version 1.9.1 specific features**: Validates version and dependencies
- **Compatibility with existing codebase**: Tests OIDC, logging, secrets, groups
- **Breaking changes validation**: Ensures no APIs were removed
- **Dependency resolution**: Validates consistent dependency tree
- **Runtime behavior validation**: Tests module loading and version
- **Migration safety checks**: Validates test mocking patterns still work

### 4. `package-schema.test.ts` (291 lines, ~30 tests)

Schema validation for package.json following npm/Node.js best practices.

**Key Test Categories:**
- **Required fields**: Validates name, version, description, license, main
- **Name validation**: Checks lowercase, no spaces, URL-safe characters
- **Version validation**: Validates semantic versioning format
- **Scripts validation**: Ensures test and build scripts exist
- **Dependencies structure**: Validates dependency objects
- **Metadata fields**: Checks author, license fields
- **Entry points validation**: Validates main field path
- **GitHub Actions specific fields**: Checks action.yml exists
- **Security and quality checks**: Validates no malicious scripts
- **JSON formatting**: Ensures proper formatting
- **Consistency checks**: Validates consistency across files
- **Best practices**: Checks engines field, script grouping

## Test Execution

Run all dependency tests:
```bash
npm test -- __tests__/dependencies/
```

Run specific test file:
```bash
npm test -- __tests__/dependencies/package-dependencies.test.ts
```

Run with coverage:
```bash
npm test -- __tests__/dependencies/ --coverage
```

## What These Tests Validate

### Version Downgrade Safety
- ✅ @actions/core v1.9.1 is correctly installed
- ✅ uuid v8.3.2 is available as a transitive dependency
- ✅ @actions/exec is NOT a direct dependency of @actions/core (changed in v1.11.1)
- ✅ @actions/http-client v2.x is present

### API Compatibility
- ✅ All APIs used in the codebase are available in v1.9.1
- ✅ OIDC authentication (getIDToken) works correctly
- ✅ Input/output handling functions work as expected
- ✅ Logging functions (debug, info, warning, error) function properly
- ✅ Secret masking works correctly
- ✅ State management functions work
- ✅ Output grouping functions work

### Configuration Integrity
- ✅ package.json has correct structure and metadata
- ✅ package-lock.json is consistent with package.json
- ✅ All dependencies have integrity hashes
- ✅ No conflicting dependency versions
- ✅ No duplicate dependencies
- ✅ Follows npm best practices

### Edge Cases & Error Handling
- ✅ Handles required inputs correctly
- ✅ Handles whitespace trimming options
- ✅ Handles empty/null values gracefully
- ✅ Handles very long input values
- ✅ Handles special characters in input names
- ✅ Handles multiline input values
- ✅ Handles errors in grouped functions
- ✅ Handles missing OIDC configuration

## Key Differences Between v1.11.1 and v1.9.1

### Dependencies Changed:
1. **v1.11.1** added `@actions/exec` as a direct dependency
   - **v1.9.1** does NOT have this dependency
   
2. **v1.9.1** includes `uuid` v8.3.2 as a dependency
   - Used for generating correlation IDs in OIDC flows

### API Compatibility:
- All APIs are compatible between versions
- No breaking changes for the Azure Login action use case
- OIDC support (getIDToken) is available in both versions

## Maintenance

When updating dependencies:
1. Update version numbers in tests if needed
2. Run full test suite to ensure compatibility
3. Check for new breaking changes in release notes
4. Update README if new tests are added

## Related Documentation

- [npm package.json documentation](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)
- [@actions/core changelog](https://github.com/actions/toolkit/blob/main/packages/core/RELEASES.md)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions documentation](https://docs.github.com/en/actions)