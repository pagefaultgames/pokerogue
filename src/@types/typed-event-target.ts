/**
 * Interface restricting the events emitted by an {@linkcode EventTarget} to a certain kind of {@linkcode Event},
 * discriminated by their `type` properties.
 * @typeParam K - A union of string literal types representing the allowed event names; only required
 * to allow `R` to hold a subset of `string` keys and avoid index signature errors
 * @typeParam R - An object type matching event names in `K` to their corresponding `Event` subclasses.
 */
// @ts-expect-error: We are overridding the types of `EventTarget` to restrict the types of events passable to its methods
// and ensure proper `this` callback scoping.
// This breaks `strictFunctionTypes`' contravariance checks, but is required to get strict type safety without runtime code.
export interface TypedEventTarget<K extends string, R extends Record<K, Event> = never> extends EventTarget {
  addEventListener<EvtType extends K, T extends this>(
    type: EvtType,
    // ensure `this` resolves to a subclass if one extends from this interface
    callback: (this: T, evt: R[EvtType]) => void,
    options?: AddEventListenerOptions | boolean,
  ): void;
  dispatchEvent(event: R[K]): boolean;
  removeEventListener<EvtType extends K, T extends this>(
    type: EvtType,
    callback: (this: T, evt: R[EvtType]) => void,
    options?: AddEventListenerOptions | boolean,
  ): void;
}
