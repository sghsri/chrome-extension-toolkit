type DataPropertyNames<T> = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [K in keyof T]: T[K] extends Function | symbol ? never : K;
}[keyof T];

// eslint-disable-next-line @typescript-eslint/ban-types
/**
 *
 */
export type Serialized<T> = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [P in DataPropertyNames<T>]: T[P] extends undefined
        ? undefined | T[P]
        : T[P] extends object
        ? Serializable<T[P]>
        : T[P];
};

// eslint-disable-next-line @typescript-eslint/ban-types
/**
 *
 */
export type Serializable<T> = T extends number[]
    ? number[]
    : T extends boolean[]
    ? boolean[]
    : T extends string[]
    ? string[]
    : T extends undefined[]
    ? undefined[]
    : T extends void[]
    ? void[]
    : T extends null[]
    ? null[]
    : T extends any[]
    ? Serialized<T[number]>[]
    : Serialized<T>;

/**
 *
 */
export type SerialWrapper<T> = T extends string
    ? string
    : T extends number
    ? number
    : T extends boolean
    ? boolean
    : T extends undefined
    ? undefined
    : T extends void
    ? void
    : T extends null
    ? null
    : Serializable<T>;

type MapToSerialWrapper<T> = { [K in keyof T]: SerialWrapper<T[K]> };
