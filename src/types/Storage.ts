import { JSON } from './Serialization';

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
          [K in keyof T as SET<K>]: (value: T[K] | JSON<T[K]>) => Promise<void>;
      } & {
          [K in keyof T as GET<K>]: () => Promise<JSON<T[K]>>;
      }
    : never;


