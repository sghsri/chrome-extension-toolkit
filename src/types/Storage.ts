import { JSON } from './Serialization';

/** A utility type that forces you to declare all the values specified in the type interface for a module. When we move to Typescript 4.9 we can remove this! and rearchitect */
export type Defaults<T> = {
    [P in keyof Required<T>]: Pick<T, P> extends Required<Pick<T, P>> ? T[P] : T[P] | undefined;
};

/**
 * A wrapper type that allows you to create a getter key
 */
export type GET<T extends string> = `get${Capitalize<T>}`;
/**
 * A wrapper type that allows you to create a setter key
 */
export type SET<T extends string> = `set${Capitalize<T>}`;

/**
 *  A utility type that allows you to create a store that has getters and setters for each key in the type interface.
 */
export type DataAccessors<T> = keyof T extends string
    ? {
          [K in keyof T as SET<K>]: (value: JSON<T[K]>) => Promise<void>;
      } & {
          [K in keyof T as GET<K>]: () => Promise<JSON<T[K]>>;
      }
    : never;

/**
 * Represents a change in data within the store.
 */
export type DataChange<T> = {
    /**
     * The old value of the data. This will be undefined if the data was just initialized.
     */
    oldValue?: JSON<T>;
    /**
     * The new value of the data.
     */
    newValue: JSON<T>;
};

/**
 * A function that is called when the data in the store changes.
 */
export type OnChangedFunction<T> = (changes: DataChange<T>) => void;
