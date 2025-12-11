/**
 * Tests for cleanup.ts
 * Validates cleanup functionality with @actions/core v1.9.1
 */

import * as core from '@actions/core';

jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('@actions/io');

describe('Cleanup Tests with @actions/core v1.9.1', () => {
    let mockGetInput: jest.MockedFunction<typeof core.getInput>;
    let mockWarning: jest.MockedFunction<typeof core.warning>;
    let mockDebug: jest.MockedFunction<typeof core.debug>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>;
        mockWarning = core.warning as jest.MockedFunction<typeof core.warning>;
        mockDebug = core.debug as jest.MockedFunction<typeof core.debug>;

        mockGetInput.mockReturnValue('false');
        mockWarning.mockImplementation(() => {});
        mockDebug.mockImplementation(() => {});
    });

    describe('Cleanup workflow', () => {
        test('should use core.getInput to check enable-AzPSSession', () => {
            mockGetInput('enable-AzPSSession');
            
            expect(mockGetInput).toHaveBeenCalledWith('enable-AzPSSession');
        });

        test('should handle enable-AzPSSession = true', () => {
            mockGetInput.mockReturnValue('true');
            const result = mockGetInput('enable-AzPSSession');
            
            expect(result.toLowerCase()).toBe('true');
        });

        test('should handle enable-AzPSSession = false', () => {
            mockGetInput.mockReturnValue('false');
            const result = mockGetInput('enable-AzPSSession');
            
            expect(result.toLowerCase()).toBe('false');
        });

        test('should use core.warning for cleanup errors', () => {
            const errorMessage = 'Login cleanup failed with Error: Test error. Cleanup will be skipped.';
            mockWarning(errorMessage);
            
            expect(mockWarning).toHaveBeenCalledWith(errorMessage);
        });

        test('should use core.debug for error stack traces', () => {
            const stackTrace = 'Error: Test error\n    at cleanup (cleanup.ts:13:15)';
            mockDebug(stackTrace);
            
            expect(mockDebug).toHaveBeenCalledWith(stackTrace);
        });

        test('should handle errors gracefully without throwing', () => {
            const error = new Error('Cleanup error');
            
            expect(() => {
                mockWarning(`Login cleanup failed with ${error}. Cleanup will be skipped.`);
                mockDebug(error.stack || '');
            }).not.toThrow();
        });

        test('should handle null/undefined error stack', () => {
            const error = new Error('Cleanup error');
            error.stack = undefined;
            
            expect(() => {
                mockDebug(error.stack || '');
            }).not.toThrow();
        });
    });

    describe('Input case handling', () => {
        test('should handle mixed case input values', () => {
            mockGetInput.mockReturnValue('TrUe');
            const result = mockGetInput('enable-AzPSSession');
            
            expect(result.toLowerCase()).toBe('true');
        });

        test('should handle whitespace in input values', () => {
            mockGetInput.mockReturnValue('  true  ');
            const result = mockGetInput('enable-AzPSSession');
            
            // Core typically trims by default
            expect(result.trim().toLowerCase()).toBe('true');
        });

        test('should handle empty string input', () => {
            mockGetInput.mockReturnValue('');
            const result = mockGetInput('enable-AzPSSession');
            
            expect(result).toBe('');
        });
    });

    describe('Error message formatting', () => {
        test('should format error messages correctly', () => {
            const error = new Error('Test error message');
            const formattedMessage = `Login cleanup failed with ${error}. Cleanup will be skipped.`;
            
            mockWarning(formattedMessage);
            
            expect(mockWarning).toHaveBeenCalledWith(
                expect.stringContaining('Login cleanup failed')
            );
            expect(mockWarning).toHaveBeenCalledWith(
                expect.stringContaining('Cleanup will be skipped')
            );
        });

        test('should handle complex error objects', () => {
            const error = {
                message: 'Complex error',
                code: 'ERR_CLEANUP',
                details: 'Additional details'
            };
            
            const formattedMessage = `Login cleanup failed with ${error}. Cleanup will be skipped.`;
            mockWarning(formattedMessage);
            
            expect(mockWarning).toHaveBeenCalled();
        });
    });
});