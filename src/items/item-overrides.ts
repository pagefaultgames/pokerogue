import { globalScene } from "#app/global-scene";
import Overrides from "#app/overrides";
import type { Pokemon } from "#field/pokemon";
import { assignItemsFromConfiguration } from "#items/held-item-pool";
import type { HeldItemConfiguration } from "#types/held-item-data-types";
import type { TrainerItemConfiguration } from "#types/trainer-item-data-types";

/**
 * Uses either `MODIFIER_OVERRIDE` in overrides.ts to set {@linkcode PersistentModifier}s for either:
 *  - The player
 *  - The enemy
 * @param isPlayer {@linkcode boolean} for whether the player (`true`) or enemy (`false`) is being overridden
 */
export function overrideTrainerItems(isPlayer = true): void {
  const trainerItemsOverride: TrainerItemConfiguration = isPlayer
    ? Overrides.STARTING_TRAINER_ITEMS_OVERRIDE
    : Overrides.ENEMY_TRAINER_ITEMS_OVERRIDE;
  if (!trainerItemsOverride || trainerItemsOverride.length === 0 || !globalScene) {
    return;
  }

  // If it's the opponent, clear all of their current modifiers to avoid stacking
  if (!isPlayer) {
    globalScene.clearEnemyItems();
  }

  globalScene.assignTrainerItemsFromConfiguration(trainerItemsOverride, isPlayer);
}

/**
 * Uses either `HELD_ITEMS_OVERRIDE` in overrides.ts to set {@linkcode PokemonHeldItemModifier}s for either:
 *  - The first member of the player's team when starting a new game
 *  - An enemy {@linkcode Pokemon} being spawned in
 * @param pokemon {@linkcode Pokemon} whose held items are being overridden
 * @param isPlayer {@linkcode boolean} for whether the {@linkcode pokemon} is the player's (`true`) or an enemy (`false`)
 */
export function overrideHeldItems(pokemon: Pokemon, isPlayer = true): void {
  const heldItemsOverride: HeldItemConfiguration = isPlayer
    ? Overrides.STARTING_HELD_ITEMS_OVERRIDE
    : Overrides.ENEMY_HELD_ITEMS_OVERRIDE;
  if (!heldItemsOverride || heldItemsOverride.length === 0 || !globalScene) {
    return;
  }

  if (!isPlayer) {
    pokemon.heldItemManager.clearItems();
  }

  assignItemsFromConfiguration(heldItemsOverride, pokemon);
}
