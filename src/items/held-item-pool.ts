/*
import type { PlayerPokemon } from "#app/field/pokemon";
import { randSeedInt } from "#app/utils/common";
import { HeldItemCategoryId, HeldItemId, isCategoryId } from "#enums/held-item-id";
import { RewardTier } from "#enums/reward-tier";

interface HeldItemPoolEntry {
  weight: number;
  item: HeldItemId | HeldItemCategoryId;
}

export type HeldItemPool = {
  [key in RewardTier]?: HeldItemPoolEntry[];
};

const dailyStarterHeldItemPool: HeldItemPool = {
  [RewardTier.COMMON]: [
    { item: HeldItemCategoryId.BASE_STAT_BOOST, weight: 1 },
    { item: HeldItemCategoryId.BERRY, weight: 3 },
  ],
  [RewardTier.GREAT]: [{ item: HeldItemCategoryId.TYPE_ATTACK_BOOSTER, weight: 5 }],
  [RewardTier.ULTRA]: [
    { item: HeldItemId.REVIVER_SEED, weight: 4 },
    { item: HeldItemId.SOOTHE_BELL, weight: 1 },
    { item: HeldItemId.SOUL_DEW, weight: 1 },
    { item: HeldItemId.GOLDEN_PUNCH, weight: 1 },
  ],
  [RewardTier.ROGUE]: [
    { item: HeldItemId.GRIP_CLAW, weight: 5 },
    { item: HeldItemId.BATON, weight: 2 },
    { item: HeldItemId.FOCUS_BAND, weight: 5 },
    { item: HeldItemId.QUICK_CLAW, weight: 3 },
    { item: HeldItemId.KINGS_ROCK, weight: 3 },
  ],
  [RewardTier.MASTER]: [
    { item: HeldItemId.LEFTOVERS, weight: 1 },
    { item: HeldItemId.SHELL_BELL, weight: 1 },
  ],
};

export function getDailyRunStarterHeldItems(party: PlayerPokemon[]): PokemonHeldItemModifier[] {
  const ret: HeldItemId[] = [];
  for (const p of party) {
    for (let m = 0; m < 3; m++) {
      const tierValue = randSeedInt(64);

      let tier: RewardTier;
      if (tierValue > 25) {
        tier = RewardTier.COMMON;
      } else if (tierValue > 12) {
        tier = RewardTier.GREAT;
      } else if (tierValue > 4) {
        tier = RewardTier.ULTRA;
      } else if (tierValue) {
        tier = RewardTier.ROGUE;
      } else {
        tier = RewardTier.MASTER;
      }

      const item = getNewHeldItemFromPool(party, dailyStarterHeldItemPool, tier);
      ret.push(item);
    }
  }

  return ret;
}

function getNewModifierTypeOption(
  party: Pokemon[],
  poolType: ModifierPoolType,
  baseTier?: ModifierTier,
  upgradeCount?: number,
  retryCount = 0,
  allowLuckUpgrades = true,
): ModifierTypeOption | null {
  const player = !poolType;
  const pool = getModifierPoolForType(poolType);
  const thresholds = getPoolThresholds(poolType);

  const tier = determineTier(party, player, baseTier, upgradeCount, retryCount, allowLuckUpgrades);

  const tierThresholds = Object.keys(thresholds[tier]);
  const totalWeight = Number.parseInt(tierThresholds[tierThresholds.length - 1]);
  const value = randSeedInt(totalWeight);
  let index: number | undefined;
  for (const t of tierThresholds) {
    const threshold = Number.parseInt(t);
    if (value < threshold) {
      index = thresholds[tier][threshold];
      break;
    }
  }

  if (index === undefined) {
    return null;
  }

  if (player) {
    console.log(index, ignoredPoolIndexes[tier].filter(i => i <= index).length, ignoredPoolIndexes[tier]);
  }

  const item = pool[tier][index].item;
  if (isCategoryId(item)) {
    return getNewHeldItemCategoryOption(item);
  }
  return item;

  //  console.log(modifierType, !player ? "(enemy)" : "");
}
*/
