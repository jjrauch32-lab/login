# Quick Start: Testing Guide

## 🚀 Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
# Core compatibility tests
npm test core-compatibility.test.ts

# Integration tests
npm test main.integration.test.ts

# Cleanup tests
npm test cleanup.test.ts

# Utility tests
npm test Utils.test.ts

# Dependency tests
npm test ActionsCoreDependency.test.ts

# Scenario tests
npm test scenarios.integration.test.ts
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Run Single Test
```bash
npm test -- -t "should retrieve input values from environment variables"
```

## 📊 Test Files Overview

| File | Lines | Tests | Purpose |
|------|-------|-------|---------|
| `core-compatibility.test.ts` | 404 | ~75 | Core API validation |
| `main.integration.test.ts` | 472 | ~65 | Integration tests |
| `cleanup.test.ts` | 135 | ~20 | Cleanup workflows |
| `Utils.test.ts` | 280 | ~45 | Utility functions |
| `ActionsCoreDependency.test.ts` | 379 | ~50 | Version validation |
| `scenarios.integration.test.ts` | 375 | ~45 | Real-world scenarios |

**Total: 2,045 lines | ~300 tests**

## ✅ What's Tested

- ✅ All @actions/core v1.9.1 APIs
- ✅ OIDC authentication (getIDToken)
- ✅ Service Principal authentication
- ✅ Managed Identity (system & user-assigned)
- ✅ Input handling and validation
- ✅ Secret masking
- ✅ Error handling and recovery
- ✅ Cleanup workflows
- ✅ Cross-platform compatibility
- ✅ Edge cases and boundary conditions

## 📖 Documentation

- **[TEST_COVERAGE_SUMMARY.md](TEST_COVERAGE_SUMMARY.md)** - Detailed coverage report
- **[__tests__/README.md](__tests__/README.md)** - Complete test documentation
- **[TESTING_VALIDATION.txt](TESTING_VALIDATION.txt)** - Validation checklist

## 🔍 Common Commands

```bash
# Run tests in verbose mode
npm test -- --verbose

# Run tests with specific timeout
npm test -- --testTimeout=10000

# Run tests matching pattern
npm test -- --testNamePattern="OIDC"

# Update snapshots (if any)
npm test -- -u

# Run tests in watch mode
npm test -- --watch
```

## 🐛 Debugging

If tests fail:

1. Check error message carefully
2. Review relevant test file
3. Verify environment variables are set correctly
4. Check mocks are configured properly
5. Review documentation for test patterns

## ⚡ Performance

Expected test execution time:
- All tests: ~10-20 seconds
- Single suite: ~2-5 seconds
- Single test: <1 second

## 🎯 Focus Areas

The test suite specifically validates:
1. **API Compatibility** - v1.9.1 has all required methods
2. **OIDC Support** - getIDToken works correctly
3. **No Regressions** - All existing functionality intact
4. **Edge Cases** - Handles unexpected inputs gracefully
5. **Error Scenarios** - Proper error handling and recovery

## 🚦 CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before releases

All tests must pass before merging.

## 📝 Notes

- Tests use Jest with TypeScript
- Mocks are used for external dependencies
- Environment variables simulate GitHub Actions inputs
- All tests are isolated and independent

---
*For detailed information, see TEST_COVERAGE_SUMMARY.md*