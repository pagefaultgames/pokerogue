import { globalScene } from "#app/global-scene";
import { activeOverrides } from "#app/overrides";
import type { Pokemon } from "#field/pokemon";
import { assignItemsFromConfiguration } from "#items/held-item-pool";
import type { HeldItemConfiguration } from "#types/held-item-data-types";
import type { TrainerItemConfiguration } from "#types/trainer-item-data-types";

/**
 * Overrides the trainer items for either the player or the enemy
 * if the appropriate {@linkcode activeOverrides | override} is enabled.
 * @param isPlayer - (Default `true`) Whether the player or enemy is being overridden
 */
export function overrideTrainerItems(isPlayer = true): void {
  const trainerItemsOverride: TrainerItemConfiguration = isPlayer
    ? activeOverrides.STARTING_TRAINER_ITEMS_OVERRIDE
    : activeOverrides.ENEMY_TRAINER_ITEMS_OVERRIDE;
  if (!trainerItemsOverride || trainerItemsOverride.length === 0 || !globalScene) {
    return;
  }

  if (!isPlayer) {
    globalScene.clearEnemyItems();
  }

  globalScene.assignTrainerItemsFromConfiguration(trainerItemsOverride, isPlayer);
}

/**
 * Overrides the held items for a Pokemon if the appropriate {@linkcode activeOverrides | override} is enabled.
 * @param pokemon - The {@linkcode Pokemon} whose held items are being overridden
 * @param isPlayer - (Default `true`) Whether the pokemon belongs to the player or an enemy
 */
export function overrideHeldItems(pokemon: Pokemon, isPlayer = true): void {
  const heldItemsOverride: HeldItemConfiguration = isPlayer
    ? activeOverrides.STARTING_HELD_ITEMS_OVERRIDE
    : activeOverrides.ENEMY_HELD_ITEMS_OVERRIDE;
  if (!heldItemsOverride || heldItemsOverride.length === 0 || !globalScene) {
    return;
  }

  if (!isPlayer) {
    pokemon.heldItemManager.clearItems();
  }

  assignItemsFromConfiguration(heldItemsOverride, pokemon);
}
