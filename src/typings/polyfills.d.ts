/*
Provides typings for polyfills implemented in src/polyfills.ts
*/

// #region: Promise.withResolvers
// Copied from https://github.com/microsoft/TypeScript/blob/65cb4bd2d52cd882f2c3a503681479eb2ed291ca/src/lib/es2024.promise.d.ts
interface PromiseWithResolvers<T> {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
}

interface PromiseConstructor {
    /**
     * Creates a new Promise and returns it in an object, along with its resolve and reject functions.
     * @returns An object with the properties `promise`, `resolve`, and `reject`.
     *
     * ```ts
     * const { promise, resolve, reject } = Promise.withResolvers<T>();
     * ```
     */
    withResolvers<T>(): PromiseWithResolvers<T>;
}
// #endregion Promise.withResolvers