import { Console } from 'src/utils/Console';

describe('Console', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    describe('log', () => {
        it('should log with blue background and white text', () => {
            Console.log('Test message', 'additional', 'args');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                '%c Test message ',
                'background: #2196F3; color: #fff',
                'additional',
                'args'
            );
        });

        it('should handle single argument', () => {
            Console.log('Single message');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                '%c Single message ',
                'background: #2196F3; color: #fff'
            );
        });
    });

    describe('success', () => {
        it('should log with green background and white text', () => {
            Console.success('Success message', 'data');

            expect(consoleLogSpy).toHaveBeenCalledWith(
                '%c Success message ',
                'background: #4CAF50; color: #fff',
                'data'
            );
        });
    });

    describe('error', () => {
        it('should log error with red background and white text', () => {
            Console.error('Error message', 'error details');

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '%c Error message ',
                'background: #F44336; color: #fff',
                'error details'
            );
        });
    });

    describe('warn', () => {
        it('should log warning with yellow background and white text', () => {
            Console.warn('Warning message', 'warning details');

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '%c Warning message ',
                'background: #FFC107; color: #fff',
                'warning details'
            );
        });
    });

    it('should handle empty arguments', () => {
        Console.log();
        Console.success();
        Console.error();
        Console.warn();

        expect(consoleLogSpy).toHaveBeenCalledTimes(2); // log and success
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle object arguments', () => {
        const testObj = { key: 'value', number: 123 };
        
        Console.log('Object test', testObj);

        expect(consoleLogSpy).toHaveBeenCalledWith(
            '%c Object test ',
            'background: #2196F3; color: #fff',
            testObj
        );
    });
});