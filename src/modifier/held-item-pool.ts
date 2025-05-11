/**
import { PlayerPokemon } from "#app/field/pokemon";
import { randSeedInt } from "#app/utils/common";
import { HeldItemCategories, HeldItems } from "./held-items";
import { ModifierTier } from "./modifier-tier";

interface HeldItemPool {
  [tier: string]: [HeldItems | HeldItemCategories, number][];
}

const dailyStarterHeldItemPool: HeldItemPool = {
    [ModifierTier.COMMON]: [
        [HeldItemCategories.BASE_STAT_BOOSTER, 1],
        [HeldItemCategories.BERRY, 3],
    ],
    [ModifierTier.GREAT]: [
        [HeldItemCategories.ATTACK_TYPE_BOOSTER, 5],
    ],
    [ModifierTier.ULTRA]: [
        [HeldItems.REVIVER_SEED, 4],
        [HeldItems.SOOTHE_BELL, 1],
        [HeldItems.SOUL_DEW, 1],
        [HeldItems.GOLDEN_PUNCH, 1],
    ],
    [ModifierTier.ROGUE]: [
        [HeldItems.GRIP_CLAW, 5],
        [HeldItems.BATON, 2],
        [HeldItems.FOCUS_BAND, 5],
        [HeldItems.QUICK_CLAW, 3],
        [HeldItems.KINGS_ROCK, 3],
    ],
    [ModifierTier.MASTER]: [
        [HeldItems.LEFTOVERS, 1],
        [HeldItems.SHELL_BELL, 1],
    ],
};




export function getDailyRunStarterModifiers(party: PlayerPokemon[]): HeldItems[] {
  const ret: HeldItems[] = [];
  for (const p of party) {
    for (let m = 0; m < 3; m++) {
      const tierValue = randSeedInt(64);

      let tier: ModifierTier;
      if (tierValue > 25) {
        tier = ModifierTier.COMMON;
      } else if (tierValue > 12) {
        tier = ModifierTier.GREAT;
      } else if (tierValue > 4) {
        tier = ModifierTier.ULTRA;
      } else if (tierValue) {
        tier = ModifierTier.ROGUE;
      } else {
        tier = ModifierTier.MASTER;
      }

      const modifier = getNewModifierTypeOption(party, ModifierPoolType.DAILY_STARTER, tier)?.type?.newModifier(
        p,
      );
      ret.push(modifier);
    }
  }

  return ret;
}
*/
