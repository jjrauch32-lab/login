# Dependency Version Change Tests

## Overview
These test files validate the downgrade of `@actions/core` from version `1.11.1` to `1.9.1` in the Azure Login GitHub Action.

## Test Files Created

### 1. package-validation.test.ts (67 tests)
Validates the integrity and correctness of package.json and package-lock.json files:

- **Package.json structure**: Verifies required metadata, scripts, dependencies, and devDependencies
- **@actions/core version validation**: Ensures version 1.9.1 is correctly specified in both files
- **Dependency version constraints**: Validates semver constraints for all dependencies
- **Package-lock.json integrity**: Verifies lock file structure, version consistency, and dependency tree
- **Version compatibility**: Checks compatibility of TypeScript, Jest, and Node.js types
- **Security and best practices**: Validates no empty versions, wildcards, or security issues

**Key validations:**
- Confirms `@actions/core` is pinned to exactly `1.9.1`
- No conflicting versions in the dependency tree
- Proper dependencies for version 1.9.1 (uuid, @actions/http-client)
- Lock file matches package.json

### 2. actions-core-compatibility.test.ts (38 tests)
Comprehensive API compatibility tests for @actions/core v1.9.1:

- **core.getInput**: Tests all input retrieval scenarios used in the codebase
- **core.setFailed**: Validates error handling and exit codes
- **core.debug**: Tests debug logging functionality
- **core.info**: Validates info message output
- **core.warning**: Tests warning message handling
- **core.error**: Validates error message output
- **core.setSecret**: Tests secret masking functionality
- **core.getIDToken**: Validates OIDC token retrieval (critical for v1.9.1+)

**Key validations:**
- All methods used in LoginConfig, main.ts, and cleanup.ts are present
- Input normalization works correctly (hyphens, underscores, case sensitivity)
- Error handling for malformed inputs
- Edge cases (empty values, long values, special characters)
- Concurrent operations support

### 3. dependency-integration.test.ts (16 tests)
Integration tests ensuring @actions/core v1.9.1 works correctly with the actual codebase:

- **LoginConfig integration**: Tests initialization with core.getInput
- **Input handling**: Validates all environment names, boolean inputs, auth-type variations
- **Error handling**: Tests core.error, core.warning, core.debug integration
- **OIDC functionality**: Validates core.getIDToken with custom audiences
- **Performance**: Tests rapid successive calls and large input handling
- **Backwards compatibility**: Ensures existing test patterns still work

**Key validations:**
- All inputs from core.getInput work correctly
- core.warning called when creds are overridden
- core.setSecret called for sensitive values
- core.debug used for logging
- Proper error handling for OIDC token failures
- Performance remains acceptable (< 1s for 1000 calls)

## Why These Tests Are Important

### Version 1.9.1 vs 1.11.1 Differences
The downgrade from `1.11.1` to `1.9.1` is significant because:

1. **API Stability**: Version 1.9.1 is a stable release that has been tested extensively
2. **OIDC Support**: Version 1.9.1 includes `getIDToken()` which is critical for OIDC authentication (added in v1.6.0)
3. **Dependency Changes**: Version 1.9.1 uses different dependency versions (uuid@8.3.2 vs potential newer versions)

### Critical Features Tested
- **getIDToken**: Essential for OIDC-based authentication (the recommended auth method)
- **setSecret**: Critical for security - ensures credentials are masked in logs
- **Input handling**: All GitHub Actions inputs are retrieved via core.getInput
- **Error handling**: Proper error messages and exit codes

## Running These Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- package-validation.test.ts
npm test -- actions-core-compatibility.test.ts
npm test -- dependency-integration.test.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Test Coverage Breakdown

- **Total new tests**: 121 tests across 3 files
- **Coverage areas**:
  - Package configuration validation: 67 tests
  - @actions/core API compatibility: 38 tests  
  - Integration with codebase: 16 tests

## Verification Checklist

✅ Package.json specifies @actions/core 1.9.1
✅ Package-lock.json locks to 1.9.1 consistently
✅ All core methods used in codebase are available in 1.9.1
✅ getIDToken works for OIDC authentication
✅ setSecret properly masks sensitive data
✅ Input handling works for all parameter types
✅ Error handling maintains compatibility
✅ Performance is acceptable
✅ No breaking changes in downgrade

## Continuous Integration

These tests should be run on every pull request to ensure:
1. Dependencies remain locked to correct versions
2. No accidental upgrades or downgrades
3. API compatibility is maintained
4. Integration with the codebase continues to work

## Maintenance

When updating @actions/core in the future:
1. Review the CHANGELOG for breaking changes
2. Update these tests if new features are used
3. Verify all existing functionality still works
4. Check for deprecated methods
5. Test OIDC authentication thoroughly

## References

- [@actions/core changelog](https://github.com/actions/toolkit/blob/main/packages/core/CHANGELOG.md)
- [GitHub Actions Toolkit](https://github.com/actions/toolkit)
- [OIDC Authentication Guide](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)