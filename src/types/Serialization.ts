type DataPropertyNames<T> = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [K in keyof T]: T[K] extends Function | symbol ? never : K;
}[keyof T];

// a string union type of all keys that do not have optional values in T
type RequiredPropertyNames<T> = {
    [K in keyof T]-?: {} extends { [P in K]: T[K] } ? never : K;
}[keyof T];

// a string union type of all keys that have optional values in T
type OptionalPropertyNames<T> = {
    [K in keyof T]-?: {} extends { [P in K]: T[K] } ? K : never;
}[keyof T];

/**
 *
 */
export type Serialized<T> = {
    [P in DataPropertyNames<T> & RequiredPropertyNames<T>]: T[P] extends object ? JSON<T[P]> : T[P];
} & {
    [P in OptionalPropertyNames<T>]?: T[P] extends object | undefined ? JSON<T[P]> : T[P];
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
export type JSON<T> = T extends string
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

export function serialize<T>(value: T): JSON<T> {
    return JSON.parse(JSON.stringify(value)) as JSON<T>;
}

// THIS IS FOR TESTING THE TYPING

// type Test2 = {
//     test: string;
//     openNewTab: (url: string) => void;
//     url?: URL;
// };

// type Test1 = {
//     openNewTab: (url: string) => void;
//     count: number;
//     url: URL;
//     urls?: URL[];
//     foo: Test2;
//     bar?: Test2;
// };

// let y: Test1['openNewTab'] extends object | undefined ? true : false;

// let x: Serialized<Test1>;
// //  ^?

// x = {
//     urls: [],
//     foo: {
//         test: 'test',
//     },
// };
