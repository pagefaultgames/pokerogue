/**
 * Remove the first N entries from a tuple.
 * @typeParam T - The array type to remove elements from.
 * @typeParam N - The number of elements to remove.
 * @typeParam Count - The current count of removed elements, used for recursion.
 */
export type RemoveFirst<
  T extends readonly any[],
  N extends number,
  Count extends any[] = [],
> = Count["length"] extends N
  ? T
  : T extends readonly [any, ...infer Rest]
    ? RemoveFirst<Rest, N, [...Count, any]>
    : [];

/**
 * Remove the last N entries from a tuple.
 * @typeParam T - The array type to remove elements from.
 * @typeParam N - The number of elements to remove.
 * @typeParam Count - The current count of removed elements, used for recursion.
 */
export type RemoveLast<T extends readonly any[], N extends number, Count extends any[] = []> = Count["length"] extends N
  ? T
  : T extends readonly [...infer Rest, any]
    ? RemoveLast<Rest, N, [...Count, any]>
    : [];
