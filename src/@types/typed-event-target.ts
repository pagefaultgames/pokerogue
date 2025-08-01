/**
 * Interface restricting the events emitted by an {@linkcode EventTarget} to a certain kind of {@linkcode Event}.
 * @typeParam T - The type to restrict the interface's access; must extend from {@linkcode Event}
 */
export interface TypedEventTarget<T extends Event = never> extends EventTarget {
  dispatchEvent(event: T): boolean;
  addEventListener(
    event: T["type"],
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void;
  removeEventListener(
    type: T["type"],
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void;
}
