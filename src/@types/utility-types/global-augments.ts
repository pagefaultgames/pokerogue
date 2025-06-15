export {};

declare global {
  // Array global augments to allow semi-easy working with tuples...???
  interface Array<T> {
    map<U>(callbackfn: (value: T, index: number, array: this) => U, thisArg?: any): { [K in keyof this]: U };
    slice(start: 0): { [K in keyof this]: T };
  }
}
