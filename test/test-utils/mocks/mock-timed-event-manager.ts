import { TimedEventManager } from "#app/timed-event-manager";
import { CLASSIC_CANDY_FRIENDSHIP_MULTIPLIER } from "#balance/starters";

/** Mock TimedEventManager so that ongoing events don't impact tests */
export class MockTimedEventManager extends TimedEventManager {
  // biome-ignore lint/nursery/noUselessUndefined: Changes return type to void instead of undefined
  override activeEvent(): undefined {
    return;
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
