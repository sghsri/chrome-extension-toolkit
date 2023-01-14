/* eslint-disable jsdoc/require-jsdoc */

type Primitive = string | number | boolean | null | undefined | void;

type PrimitiveKeys<T> = {
    [K in keyof T]: T[K] extends Function | symbol ? never : K;
}[keyof T];

export type JSON<T> = {
    [K in PrimitiveKeys<T>]: T[K] extends undefined & infer U
        ? undefined & JSON<U>
        : T[K] extends Primitive
        ? T[K]
        : T[K] extends Array<infer U>
        ? JSON<U>[]
        : T[K] extends object
        ? JSON<T[K]>
        : T[K];
};

export type Serializable<T> = T extends Primitive ? T : JSON<T>;

export function serialize<T>(value: T): Serializable<T> {
    return JSON.parse(JSON.stringify(value)) as Serializable<T>;
}
