/**
 * Interface restricting the events emitted by an {@linkcode EventTarget} to a certain kind of {@linkcode Event}.
 * @typeParam T - An object type matching events to their event types
 */
// TODO: Should we rework this to use `CustomEvent`s instead of separate subclasses?
// @ts-expect-error: We are overridding these types in a way TS doesn't enjoy
export interface TypedEventTarget<R extends EventMap<string>> extends EventTarget {
  addEventListener<EvtType extends keyof R>(
    type: EvtType,
    callback: (evt: R[EvtType]) => void,
    options?: AddEventListenerOptions | boolean,
  ): void;
  dispatchEvent(event: Event): boolean;
  removeEventListener<EvtType extends keyof R>(
    type: EvtType,
    callback: (evt: R[EvtType]) => void,
    options?: AddEventListenerOptions | boolean,
  ): void;
}

type EventMap<KeyType extends string> = {
  [k in KeyType]: Event & { type: k };
};
