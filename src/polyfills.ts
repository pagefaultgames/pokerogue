/*
Manual rolling or other polyfills desired by the project.

IMPORTANT: When adding / removing polyfills, ensure that typescript becomes
aware of their existence, either by creating `src/typings/polyfills.d.ts`
and defining them there, or or by adding the appropriate field polyfill to the
`lib` property in `tsconfig.json`.
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

import "core-js/stable/set";
import "core-js/stable/iterator";
import "core-js/stable/map/group-by";
import "core-js/stable/object/group-by";
