import { MAX_PER_TYPE_POKEBALLS } from "#app/data/pokeball";
import type Pokemon from "#app/field/pokemon";
import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { getModifierTierTextTint } from "#app/ui/text";
import { NumberHolder, randSeedInt } from "#app/utils/common";
import type { PokeballType } from "#enums/pokeball";
import { ModifierTier } from "./modifier-tier";

/**
 * Used to check if the player has max of a given ball type in Classic
 * @param ballType The {@linkcode PokeballType} being checked
 * @returns boolean: true if the player has the maximum of a given ball type
 */
export function hasMaximumBalls(ballType: PokeballType): boolean {
  return globalScene.gameMode.isClassic && globalScene.pokeballCounts[ballType] >= MAX_PER_TYPE_POKEBALLS;
}

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
  let modifierTier: ModifierTier;
  if (luckValue > 11) {
    modifierTier = ModifierTier.LUXURY;
  } else if (luckValue > 9) {
    modifierTier = ModifierTier.MASTER;
  } else if (luckValue > 5) {
    modifierTier = ModifierTier.ROGUE;
  } else if (luckValue > 2) {
    modifierTier = ModifierTier.ULTRA;
  } else if (luckValue) {
    modifierTier = ModifierTier.GREAT;
  } else {
    modifierTier = ModifierTier.COMMON;
  }
  return getModifierTierTextTint(modifierTier);
}
