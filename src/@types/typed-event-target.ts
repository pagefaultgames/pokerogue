/**
 * Interface restricting the events emitted by an {@linkcode EventTarget} to a certain kind of {@linkcode Event},
 * discriminated by their `type` properties.
 * @typeParam K - A union of string literal types representing the allowed event names.
 * @typeParam R - An object type matching event names in `K` to their corresponding `Event` subclasses.
 */
// TODO: Should we rework this to use `CustomEvent`s instead of separate subclasses?
// @ts-expect-error: We are overridding these types in a way TS doesn't enjoy
// (like forbidding `null` from being passed as a listener).
export interface TypedEventTarget<K extends string, R extends EventMap<K>> extends EventTarget {
  addEventListener<const T extends this, EvtType extends K>(
    type: EvtType,
    callback: (this: T, evt: R[EvtType]) => void,
    options?: AddEventListenerOptions | boolean,
  ): void;
  dispatchEvent(event: Event): boolean;
  removeEventListener<const T extends this, EvtType extends K>(
    type: EvtType,
    callback: (this: T, evt: R[EvtType]) => void,
    options?: AddEventListenerOptions | boolean,
  ): void;
}

type EventMap<KeyType extends string> = {
  [k in KeyType]: Event & { type: k };
};
