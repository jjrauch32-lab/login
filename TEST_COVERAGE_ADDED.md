# Comprehensive Unit Test Coverage Added

## Summary
This update adds comprehensive unit test coverage for all previously untested source files in the Azure Login action repository, following the deletion of package configuration tests that were specific to the `package.json` downgrade changes.

## Test Files Created

### 1. `__tests__/main.test.ts` (NEW)
**Source File:** `src/main.ts`
**Test Count:** 50+ test cases across 8 describe blocks

**Coverage Areas:**
- Happy path login flows (CLI only, CLI + PowerShell)
- Pre-cleanup functionality with various configurations
- Error handling for all components (setUserAgent, LoginConfig, CLI, PowerShell)
- Login flow sequencing and orchestration
- Edge cases (null errors, string errors, missing properties)
- Configuration variations and input validation

**Key Testing Strategies:**
- Mocking all dependencies (@actions/core, Utils, LoginConfig, AzureCliLogin, AzPSLogin)
- Testing execution order and call sequences
- Comprehensive error propagation and handling
- Environment variable handling (AZURE_LOGIN_PRE_CLEANUP)
- Case-sensitive and case-insensitive comparisons

### 2. `__tests__/cleanup.test.ts` (NEW)
**Source File:** `src/cleanup.ts`
**Test Count:** 35+ test cases across 8 describe blocks

**Coverage Areas:**
- Successful cleanup scenarios (CLI only, CLI + PowerShell)
- PowerShell session handling with various input formats
- Error handling with graceful degradation
- Cleanup sequencing
- Edge cases (concurrent calls, whitespace, undefined inputs)
- Warning message formatting

**Key Testing Strategies:**
- Testing non-failing behavior (warnings instead of errors)
- Case-insensitive input handling
- Stack trace preservation in debug output
- Integration with core.getInput
- Multiple execution scenarios

### 3. `__tests__/common/Utils.test.ts` (NEW)
**Source File:** `src/common/Utils.ts`
**Test Count:** 60+ test cases across 3 main describe blocks

**Coverage Areas:**

#### setUserAgent Function:
- User agent string formatting for Azure HTTP and PowerShell
- SHA256 repository hashing
- Environment variable handling (GITHUB_REPOSITORY, RUNNER_ENVIRONMENT, GITHUB_RUN_ID)
- Appending to existing user agents
- Missing environment variable handling
- Idempotency testing

#### cleanupAzCLIAccounts Function:
- Azure CLI executable location
- Command execution with proper quoting
- Path handling (Windows/Unix, with spaces)
- Error propagation
- Logging (info and debug messages)

#### cleanupAzPSAccounts Function:
- PowerShell executable location
- PS module path configuration
- Az.Accounts module import
- Clear-AzContext execution for Process and CurrentUser scopes
- Execution sequencing
- Error handling and propagation

### 4. `__tests__/Cli/AzureCliLogin.test.ts` (NEW)
**Source File:** `src/Cli/AzureCliLogin.ts`
**Test Count:** 80+ test cases across 9 describe blocks

**Coverage Areas:**

#### Constructor and Initialization:
- Login config assignment
- Default exec options setup

#### Main Login Flow:
- Azure CLI version detection and parsing
- Cloud environment configuration
- Service principal authentication (secret and OIDC)
- Managed identity authentication (system-assigned and user-assigned)
- Subscription setting

#### Azure CLI Version Handling:
- Version-specific behavior (CLI < 2.69 vs >= 2.69)
- --username vs --client-id for managed identities
- Version parsing failures

#### Azure Stack Support:
- Environment registration and unregistration
- Endpoint URL processing (trailing slash removal)
- KeyVault and Storage suffix derivation
- Profile version configuration
- Error handling during registration

#### Error Handling:
- stderr listener for error capture
- WARNING vs ERROR differentiation
- ERROR prefix stripping
- Empty and whitespace-only stderr

#### Edge Cases:
- Special characters in passwords
- Long tenant IDs
- Missing az binary
- Exec failures
- Multiple URL slashes

### 5. `__tests__/PowerShell/AzPSUtils.test.ts` (NEW)
**Source File:** `src/PowerShell/AzPSUtils.ts`
**Test Count:** 70+ test cases across 4 describe blocks

**Coverage Areas:**

#### AzPSConstants:
- Constant value validation
- Default paths for Linux and Windows

#### setPSModulePathForGitHubRunner:
- OS detection (Linux, Windows, Windows_NT, macOS, Darwin)
- PSModulePath configuration
- Path prepending (not appending)
- Case-insensitive OS comparison
- Warning messages for unsupported OS
- Debug logging

#### importLatestAzAccounts:
- Script generation via AzPSScriptBuilder
- Module path logging
- Success and failure scenarios
- Return value validation

#### runPSScript:
- PowerShell executable location
- Script execution with proper arguments
- stdout/stderr capture
- JSON parsing (including trimming and multi-chunk concatenation)
- Success/failure differentiation
- Error handling (stderr content, malformed JSON, missing pwsh)
- Silent execution mode
- Path quoting for spaces
- Console logging of results

## Testing Framework and Patterns

### Framework
- **Jest** v29.3.1 with jest-circus runner
- **TypeScript** support via ts-jest
- Pattern: `**/*.test.ts`

### Mocking Strategy
- Comprehensive mocking of @actions/core, @actions/exec, @actions/io
- Module-level mocking for cross-module dependencies
- SpyOn for individual function mocking
- Mock implementations for complex async flows

### Testing Patterns Used
1. **Arrange-Act-Assert (AAA)** pattern
2. **Given-When-Then** for behavior scenarios
3. **Happy path + Edge cases + Error conditions** trinity
4. **beforeEach/afterEach** for test isolation
5. **Mock restoration** to prevent test pollution

### Coverage Highlights
- **Pure Functions**: Extensive testing of setUserAgent, path manipulation
- **Async Operations**: Promise-based flows with proper await handling
- **Error Propagation**: Testing error bubbling through call stacks
- **Environment Variables**: Comprehensive environment manipulation testing
- **External Commands**: Mocked exec calls with listener verification
- **Logging**: Verification of debug, info, warning, and error messages
- **Sequencing**: Call order validation using execution tracking

## Test Quality Features

### Descriptive Naming
- Tests use clear, action-oriented names
- Consistent "should" prefix for expectations
- Context provided in describe blocks

### Edge Case Coverage
- Null and undefined handling
- Empty strings and whitespace
- Case sensitivity
- Special characters
- Very long inputs
- Concurrent operations
- Missing dependencies

### Error Scenarios
- Missing executables (az, pwsh)
- Failed command execution
- Malformed outputs
- Network-like failures
- Partial failures

### Integration Aspects
- Cross-function call validation
- State management between operations
- Environment variable side effects
- Mock reset between tests

## Running the Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- main.test.ts

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run tests for specific pattern
npm test -- Cli/
```

## Benefits

1. **Regression Prevention**: Catches breaking changes early
2. **Documentation**: Tests serve as executable documentation
3. **Refactoring Confidence**: Safe code improvements
4. **Bug Prevention**: Edge cases caught before production
5. **CI/CD Integration**: Automated validation in pipelines
6. **Code Quality**: Enforces good practices through testability

## Coverage Statistics

- **Total New Test Files**: 5
- **Total New Test Cases**: 290+
- **Source Files Now Covered**: 100% of untested files
- **Testing Patterns**: AAA, Given-When-Then, Happy/Edge/Error trinity

## Alignment with Existing Tests

These new tests follow the same patterns established in existing tests:
- Similar mocking approaches (matches `LoginConfig.test.ts` pattern)
- Consistent describe/test structure
- Same assertion style and expectations
- Compatible with existing Jest configuration
- Uses same testing utilities (@actions mocks)

## Future Enhancements

Potential additions for even more comprehensive coverage:
- Integration tests with actual Azure CLI/PowerShell (in isolated environment)
- Performance benchmarks for critical paths
- Mutation testing to verify test effectiveness
- Visual regression tests for any UI components
- Contract tests for external API interactions