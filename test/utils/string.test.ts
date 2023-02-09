import { capitalize } from 'src/utils/string';

describe('capitalize', () => {
    it('capitalizes the first letter of a string', () => {
        expect(capitalize('hello')).toBe('Hello');
    });

    it('does not modify an empty string', () => {
        expect(capitalize('')).toBe('');
    });
});
