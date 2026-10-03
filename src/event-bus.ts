import type { AnyEvent, EventCallbackFn } from "#types/event-bus-types";
import Phaser from "phaser";

/**
 * Extension of {@linkcode Phaser.Events.EventEmitter} with custom event names
 */
class EventBus extends Phaser.Events.EventEmitter {
  override on<D = any, C = any>(event: AnyEvent, fn: EventCallbackFn<D>, context?: C): this {
    return super.on(event, fn, context);
  }

  override once<D = any, C = any>(event: AnyEvent, fn: EventCallbackFn<D>, context?: C): this {
    return super.once(event, fn, context);
  }

  override off<D = any, C = any>(event: AnyEvent, fn?: EventCallbackFn<D>, context?: C, once?: boolean): this {
    return super.off(event, fn, context, once);
  }

  override emit(event: AnyEvent, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  override removeAllListeners(event?: AnyEvent): this {
    return super.removeAllListeners(event);
  }

  override addListener<D = any, C = any>(event: AnyEvent, fn: EventCallbackFn<D>, context?: C): this {
    return super.addListener(event, fn, context);
  }

  override removeListener<D = any, C = any>(
    event: AnyEvent,
    fn?: EventCallbackFn<D>,
    context?: C,
    once?: boolean,
  ): this {
    return super.removeListener(event, fn, context, once);
  }
}

/** Global event bus */
export const eventBus = new EventBus();
