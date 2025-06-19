/**
 * Capitalizes the first letter of a string
 * @param str the string to capitalize
 * @returns the capitalized string
 */
export function capitalize(str: string): string {
    if (!str || str.length === 0) {
        return '';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}