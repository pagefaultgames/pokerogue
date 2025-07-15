/*
Manual rolling of polyfills desired by the project.

IMPORTANT: When adding / removing polyfills, make sure to edit `src/typings/polyfills.d.ts`
accordingly, so that the TypeScript compiler is aware of the polyfills.
*/

if (typeof Promise.withResolvers === "undefined") {
  Promise.withResolvers = <T>() => {
    // Bangs are OK here; they are guaranteed to be defined when the promise is invoked.
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
