type DataPropertyNames<T> = {
    [K in keyof T]: T[K] extends Function | symbol ? never : K;
}[keyof T];

export type Serialized<T> = {
    [P in DataPropertyNames<T>]: T[P] extends undefined
        ? undefined | T[P]
        : T[P] extends object
        ? Serializable<T[P]>
        : T[P];
};

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
