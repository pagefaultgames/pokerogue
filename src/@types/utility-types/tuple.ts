/** Extract the elements of a tuple type, excluding the first element. */
export type Tail<T extends any[]> = Required<T> extends [any, ...infer Head] ? Head : never;

/** Extract the elements of a tuple type, excluding the last element. */
export type Head<T extends [...any]> = Required<T> extends [...infer Head, any] ? Head : never;
