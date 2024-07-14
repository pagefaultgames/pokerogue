import BattleScene from "#app/battle-scene.js";
import { PlayerPokemon } from "#app/field/pokemon.js";
import { CheckSwitchPhase, PostSummonPhase, SwitchPhase } from "#app/phases.js";

/**
 * Handles the check switch phase in a battle scene.
 *
 * This function searches for the active battle scene and processes the current phase.
 * If the current phase is a CheckSwitchPhase, it iterates through the player's Pokemon,
 * potentially initiating switches based on the provided boolean flag.
 *
 * @param game - The Phaser game instance.
 * @param shouldSwitch - A boolean flag indicating whether Pokemon should be switched.
 * @throws Will throw an error if scene or phase operations fail.
 */
export function handleCheckSwitch(
  game: Phaser.Game,
  shouldSwitch: boolean
): void {
  const scenes = game.scene.getScenes(true);

  for (const scene of scenes) {
    if (scene.scene.key === "battle") {
      const battleScene = scene as BattleScene;
      const currentPhase = battleScene.getCurrentPhase();

      if (currentPhase instanceof CheckSwitchPhase) {
        const playerField = battleScene.getPlayerField();

        for (let i = 0; i < playerField.length; i++) {
          const pokemon = playerField[i] as PlayerPokemon;
          const fieldIndex = pokemon.getFieldIndex();

          if (shouldSwitch) {
            console.log(`Attempting to switch Pokemon at field index: ${fieldIndex}`);

            battleScene.tryRemovePhase(p => p instanceof PostSummonPhase && p.fieldIndex === fieldIndex);
            battleScene.unshiftPhase(new SwitchPhase(battleScene, fieldIndex, false, true));

            console.log("Removed PostSummonPhase and added SwitchPhase.");
          } else {
            console.log("False selected, switching to CommandPhase");
          }
        }

        currentPhase.end();
        return;
      }
    }
  }

  setTimeout(() => handleCheckSwitch(game, shouldSwitch), 500);
}
