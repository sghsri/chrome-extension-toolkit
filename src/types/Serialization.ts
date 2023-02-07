/* eslint-disable jsdoc/require-jsdoc */

/**
 * A type that represents a primitive value. Each of these is a valid JSON value and can be serialized.
 */
export type Primitive = string | number | boolean | null | undefined | void;

/**
 * A type that represents the keys of an object that are primitive values.
 */
type PrimitiveKeys<T> = {
    [K in keyof T]: T[K] extends Function | symbol ? never : K;
}[keyof T];

/**
 * This type represents the serialized version of a value.
 *
 * Because of the nature of the chrome.runtime.sendMessage and chrome.storage APIs,
 * all the values that go through them will be serialized and deserialized, thus losing any function or symbol properties.
 *
 * @example Serialized<{
 * openNewTab: (url: string) => void,
 * count: number,
 * url: URL,
 * }> = { count: number, url: JSON<URL> }
 * @example
 */
export type Serialized<T> = {
    [K in PrimitiveKeys<T>]: T[K] extends undefined & infer U
        ? undefined & Serialized<U>
        : T[K] extends Primitive
        ? T[K]
        : T[K] extends Array<infer U>
        ? Serialized<U>[]
        : T[K] extends object
        ? T[K] extends Date
            ? string
            : T[K] extends RegExp | Error
            ? {}
            : Serialized<T[K]>
        : T[K];
};

/**
 * A type that represents a value that can be serialized, but doesn't have to be if its a primitive value.
 * @example JSON<string> = string
 * @example JSON<{ foo: string }> = { foo: string }
 */
export type JSON<T> = T extends Primitive ? T : T extends Date ? string : T extends RegExp | Error ? {} : Serialized<T>;

export function serialize<T>(value: T): JSON<T> {
    return JSON.parse(JSON.stringify(value)) as JSON<T>;
}
