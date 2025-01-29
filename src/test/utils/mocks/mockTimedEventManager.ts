import { CLASSIC_CANDY_FRIENDSHIP_MULTIPLIER } from "#app/data/balance/starters";
import { TimedEventManager } from "#app/timed-event-manager";

/** Mock TimedEventManager so that ongoing events don't impact tests */
export class MockTimedEventManager extends TimedEventManager {
  override activeEvent() {
    return undefined;
  }
  override isEventActive(): boolean {
    return false;
  }
  override getClassicFriendshipMultiplier(): number {
    return CLASSIC_CANDY_FRIENDSHIP_MULTIPLIER;
  }
  override getShinyMultiplier(): number {
    return 1;
  }
}
