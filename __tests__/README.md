# Azure Login Action Test Suite

This directory contains comprehensive unit and integration tests for the Azure Login GitHub Action, with special focus on validating the `@actions/core` dependency downgrade from v1.11.1 to v1.9.1.

## Test Structure

### Core Compatibility Tests
**File:** `core-compatibility.test.ts`

Tests the core functionality of `@actions/core` v1.9.1 to ensure all APIs used by the action work correctly.

**Key Areas:**
- Input retrieval (`getInput`)
- Secret masking (`setSecret`)
- OIDC token retrieval (`getIDToken`)
- Logging functions (`info`, `warning`, `error`, `debug`)
- Failure handling (`setFailed`)
- Edge cases and error scenarios

### Main Integration Tests
**File:** `main.integration.test.ts`

Integration tests for the main entry point and LoginConfig class.

**Key Areas:**
- LoginConfig initialization
- Service Principal authentication
- OIDC/federated authentication
- Managed Identity (system and user-assigned)
- Credentials parsing from JSON
- Input validation
- Secret masking workflows

### Cleanup Tests
**File:** `cleanup.test.ts`

Tests for the cleanup functionality that runs post-action.

**Key Areas:**
- Cleanup workflow execution
- Error handling (non-failing)
- Input processing
- Azure PowerShell session cleanup

### Utility Tests
**File:** `Utils.test.ts`

Tests for common utility functions.

**Key Areas:**
- User agent configuration
- Azure CLI account cleanup
- Azure PowerShell account cleanup
- Path handling across platforms
- Error propagation

### Dependency Version Tests
**File:** `ActionsCoreDependency.test.ts`

Tests specific to the @actions/core version downgrade.

**Key Areas:**
- Package version validation
- Dependency tree verification
- API compatibility checks
- Performance characteristics
- Known differences between v1.9.1 and v1.11.1

### Scenario Integration Tests
**File:** `scenarios.integration.test.ts`

Real-world scenario-based integration tests.

**Key Areas:**
- Complete authentication flows
- Multi-cloud environments
- Error recovery scenarios
- Concurrent operations
- Edge case configurations

## Existing Tests

### LoginConfig Tests
**File:** `LoginConfig.test.ts`

Tests for the LoginConfig class covering various credential configurations.

### PowerShell Tests
**Directory:** `PowerShell/`

- `AzPSLogin.test.ts` - Azure PowerShell login functionality
- `AzPSScriptBuilder.test.ts` - PowerShell script generation

### Package Dependencies Tests
**File:** `PackageDependencies.test.ts`

Comprehensive validation of package.json and package-lock.json structure and dependencies.

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npm test core-compatibility.test.ts
npm test main.integration.test.ts
npm test cleanup.test.ts
npm test Utils.test.ts
npm test ActionsCoreDependency.test.ts
npm test scenarios.integration.test.ts
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

## Test Configuration

Tests use Jest with TypeScript support configured in `jest.config.js`:
- Test environment: Node.js
- Test runner: jest-circus
- TypeScript transpiler: ts-jest
- Test file pattern: `**/*.test.ts`

## Test Patterns

### Mocking
Tests mock external dependencies like `@actions/core`, `@actions/exec`, and `@actions/io` to isolate functionality.

```typescript
jest.mock('@actions/core');
const mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>;
```

### Environment Variables
Tests manipulate environment variables for input simulation:

```typescript
process.env['INPUT_CLIENT_ID'] = 'test-value';
const result = core.getInput('client-id');
```

### Cleanup
Tests include proper cleanup in `afterEach` or `beforeEach` hooks:

```typescript
afterEach(() => {
    Object.keys(process.env)
        .filter(key => key.startsWith('INPUT_'))
        .forEach(key => delete process.env[key]);
});
```

## Coverage Goals

The test suite aims for:
- ✅ 100% coverage of @actions/core API usage
- ✅ 100% coverage of authentication flows
- ✅ 100% coverage of error handling paths
- ✅ Comprehensive edge case testing
- ✅ Real-world scenario validation

## Contributing

When adding new tests:
1. Follow existing patterns and naming conventions
2. Add proper JSDoc comments
3. Group related tests using `describe` blocks
4. Use descriptive test names that explain what is being tested
5. Include both happy path and error scenarios
6. Clean up test state in hooks
7. Mock external dependencies appropriately

## Debugging Tests

### Run a single test
```bash
npm test -- -t "test name"
```

### Run tests in a describe block
```bash
npm test -- -t "describe block name"
```

### Increase test timeout
```javascript
jest.setTimeout(10000); // 10 seconds
```

### Enable verbose output
```bash
npm test -- --verbose
```

## CI/CD Integration

Tests run automatically in the CI/CD pipeline:
- On pull requests
- On commits to main branch
- Before releases

All tests must pass before code can be merged.

## Related Documentation

- [TEST_COVERAGE_SUMMARY.md](../TEST_COVERAGE_SUMMARY.md) - Detailed coverage summary
- [jest.config.js](../jest.config.js) - Jest configuration
- [package.json](../package.json) - Test scripts and dependencies

## Questions or Issues?

If you encounter test failures or have questions about the test suite, please:
1. Check the test output for specific error messages
2. Review this README and related documentation
3. Check existing issues in the repository
4. Create a new issue with test failure details

---
*Last Updated: 2024-12-11*