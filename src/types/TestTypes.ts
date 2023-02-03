export type User = {
    name: string;
    age: number;
};

export interface Test {
    foo: string;
    url: URL;
    date: Date;
    regExp: RegExp;
    error: Error;
    openNewTab: (url: string) => void;
    users: User[];
    test: (User | undefined)[];
}
