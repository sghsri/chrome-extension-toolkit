import crypto from 'crypto-browserify';

const ENCRYPTION_KEY = process.env.EXTENSION_STORAGE_ENCRYPTION_KEY;

export const MISSING_KEY_ERROR_MESSAGE =
    'You must set the EXTENSION_STORAGE_ENCRYPTION_KEY environment variable to use encrypted storage.';

/**
 * This function encrypts a value using AES-128-CTR.
 * @param value the value to encrypt
 * @returns the encrypted string representation of the value
 */
export function encrypt(value: any): string {
    if (!ENCRYPTION_KEY) {
        throw new Error(MISSING_KEY_ERROR_MESSAGE);
    }

    if (!value) return value;
    const serializedText = JSON.stringify(value);
    const iv = Buffer.alloc(16);
    const cipher = crypto.createCipheriv('aes-128-ctr', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(serializedText);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
}

/**
 * A function which decrypts a value encrypted with AES-128-CTR.
 * @param value the value to decrypt
 * @returns the decrypted value or the original value if it was not encrypted
 */
export function decrypt(value: any): any {
    if (!ENCRYPTION_KEY) {
        throw new Error(MISSING_KEY_ERROR_MESSAGE);
    }
    if (!isEncryptedString(value)) return value;

    try {
        const iv = Buffer.alloc(16);
        const encryptedText = Buffer.from(value, 'hex');
        const decipher = crypto.createDecipheriv('aes-128-ctr', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return JSON.parse(decrypted.toString());
    } catch (err) {
        return value;
    }
}

function isEncryptedString(value: any): value is string {
    if (!value) return false;
    if (!(typeof value === 'string' || value instanceof String)) return false;

    const HEX_REGEX = /^[0-9A-Fa-f]+$/g;
    if (!HEX_REGEX.test(value as string)) return false;
    return true;
}
