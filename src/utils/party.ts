import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { RarityTier } from "#enums/reward-tier";
import type { Pokemon } from "#field/pokemon";
import { getRarityTierTextTint } from "#ui/text";
import { NumberHolder, randSeedInt } from "./common";

/**
 * Calculates the team's luck value.
 * @param party The player's party.
 * @returns A number between 0 and 14 based on the party's total luck value, or a random number between 0 and 14 if the player is in Daily Run mode.
 */
export function getPartyLuckValue(party: Pokemon[]): number {
  if (globalScene.gameMode.isDaily) {
    const DailyLuck = new NumberHolder(0);
    globalScene.executeWithSeedOffset(
      () => {
        DailyLuck.value = randSeedInt(15); // Random number between 0 and 14
      },
      0,
      globalScene.seed,
    );
    return DailyLuck.value;
  }
  const eventSpecies = timedEventManager.getEventLuckBoostedSpecies();
  const luck = Phaser.Math.Clamp(
    party
      .map(p => (p.isAllowedInBattle() ? p.getLuck() + (eventSpecies.includes(p.species.speciesId) ? 1 : 0) : 0))
      .reduce((total: number, value: number) => (total += value), 0),
    0,
    14,
  );
  return Math.min(timedEventManager.getEventLuckBoost() + (luck ?? 0), 14);
}

export function getLuckString(luckValue: number): string {
  return ["D", "C", "C+", "B-", "B", "B+", "A-", "A", "A+", "A++", "S", "S+", "SS", "SS+", "SSS"][luckValue];
}

export function getLuckTextTint(luckValue: number): number {
  let rarityTier: RarityTier;
  if (luckValue > 11) {
    rarityTier = RarityTier.LUXURY;
  } else if (luckValue > 9) {
    rarityTier = RarityTier.MASTER;
  } else if (luckValue > 5) {
    rarityTier = RarityTier.ROGUE;
  } else if (luckValue > 2) {
    rarityTier = RarityTier.ULTRA;
  } else if (luckValue) {
    rarityTier = RarityTier.GREAT;
  } else {
    rarityTier = RarityTier.COMMON;
  }
  return getRarityTierTextTint(rarityTier);
}
