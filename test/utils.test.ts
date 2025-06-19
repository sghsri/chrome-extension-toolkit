import { Console } from 'src/utils/Console';
import { capitalize } from 'src/utils/string';
import { chrome } from 'jest-chrome';
import TestData from 'test/TestData';

describe('Utils Module', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        chrome.runtime.getManifest.mockReturnValue(TestData.manifest);
        // @ts-ignore
        chrome.runtime.id = TestData.extensionId;
    });

    describe('Console', () => {
        let originalConsole: typeof console;

        beforeEach(() => {
            originalConsole = global.console;
            global.console = {
                ...console,
                log: jest.fn(),
                error: jest.fn(),
                warn: jest.fn()
            };
        });

        afterEach(() => {
            global.console = originalConsole;
        });

        it('should log messages with styled output', () => {
            Console.log('Test message');
            
            expect(console.log).toHaveBeenCalled();
            const logCall = (console.log as jest.Mock).mock.calls[0];
            expect(logCall[0]).toContain('Test message');
            expect(logCall[1]).toContain('background: #2196F3');
        });

        it('should log success messages with styled output', () => {
            Console.success('Success message');
            
            expect(console.log).toHaveBeenCalled();
            const logCall = (console.log as jest.Mock).mock.calls[0];
            expect(logCall[0]).toContain('Success message');
            expect(logCall[1]).toContain('background: #4CAF50');
        });

        it('should log error messages with styled output', () => {
            const testError = new Error('Test error');
            Console.error('Error occurred', testError);
            
            expect(console.error).toHaveBeenCalled();
            const errorCall = (console.error as jest.Mock).mock.calls[0];
            expect(errorCall[0]).toContain('Error occurred');
            expect(errorCall[1]).toContain('background: #F44336');
        });

        it('should log warning messages with styled output', () => {
            Console.warn('Warning message');
            
            expect(console.warn).toHaveBeenCalled();
            const warnCall = (console.warn as jest.Mock).mock.calls[0];
            expect(warnCall[0]).toContain('Warning message');
            expect(warnCall[1]).toContain('background: #FFC107');
        });

        it('should handle multiple arguments', () => {
            const obj = { key: 'value' };
            Console.log('Message with object', obj, 123);
            
            expect(console.log).toHaveBeenCalled();
            const logCall = (console.log as jest.Mock).mock.calls[0];
            expect(logCall.length).toBeGreaterThan(2);
            expect(logCall[2]).toBe(obj);
            expect(logCall[3]).toBe(123);
        });

        it('should handle null and undefined values', () => {
            Console.log('Null value:', null);
            Console.log('Undefined value:', undefined);
            
            expect(console.log).toHaveBeenCalledTimes(2);
        });

        it('should handle complex objects', () => {
            const complexObj = {
                nested: {
                    array: [1, 2, 3],
                    string: 'test'
                },
                fn: () => 'function'
            };
            
            Console.log('Complex object:', complexObj);
            
            expect(console.log).toHaveBeenCalled();
        });
    });

    describe('String Utils', () => {
        describe('capitalize', () => {
            it('should capitalize first letter of a word', () => {
                expect(capitalize('hello')).toBe('Hello');
            });

            it('should capitalize first letter and keep rest unchanged', () => {
                expect(capitalize('hELLO')).toBe('HELLO');
            });

            it('should handle single character strings', () => {
                expect(capitalize('h')).toBe('H');
            });

            it('should handle empty strings', () => {
                expect(capitalize('')).toBe('');
            });

            it('should handle strings with spaces', () => {
                expect(capitalize('hello world')).toBe('Hello world');
            });

            it('should handle strings starting with numbers', () => {
                expect(capitalize('123abc')).toBe('123abc');
            });

            it('should handle strings starting with special characters', () => {
                expect(capitalize('!hello')).toBe('!hello');
            });

            it('should handle already capitalized strings', () => {
                expect(capitalize('Hello')).toBe('Hello');
            });

            it('should handle strings with mixed case', () => {
                expect(capitalize('hELLo WoRLD')).toBe('HELLo WoRLD');
            });

            it('should handle Unicode characters', () => {
                expect(capitalize('école')).toBe('École');
            });
        });
    });
});