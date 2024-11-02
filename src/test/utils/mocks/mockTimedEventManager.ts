import { TimedEventManager } from "#app/timed-event-manager";

/** Mock TimedEventManager so that ongoing events don't impact tests */
export class MockTimedEventManager extends TimedEventManager {
  override activeEvent() {
    return undefined;
  }
  override isEventActive(): boolean {
    return false;
  }
  override getFriendshipMultiplier(): number {
    return 1;
  }
  override getShinyMultiplier(): number {
    return 1;
  }
}
