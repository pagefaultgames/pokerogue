import BattleScene from "#app/battle-scene.js";
import { Abilities } from "#app/enums/abilities.js";
import Pokemon from "#app/field/pokemon.js";
import { BattlePhase } from "./battle-phase";
import { ShowAbilityPhase } from "./show-ability-phase";

/**
 * Cures the party of all non-volatile status conditions, shows a message
 * @param {BattleScene} scene The current scene
 * @param {Pokemon} user The user of the move that cures the party
 * @param {string} message The message that should be displayed
 * @param {Abilities} abilityCondition Pokemon with this ability will not be affected ie. Soundproof
 */
export class PartyStatusCurePhase extends BattlePhase {
  private user: Pokemon;
  private message: string;
  private abilityCondition: Abilities;

  constructor(scene: BattleScene, user: Pokemon, message: string, abilityCondition: Abilities) {
    super(scene);

    this.user = user;
    this.message = message;
    this.abilityCondition = abilityCondition;
  }

  start() {
    super.start();
    for (const pokemon of this.scene.getParty()) {
      if (!pokemon.isOnField() || pokemon === this.user) {
        pokemon.resetStatus(false);
        pokemon.updateInfo(true);
      } else {
        if (!pokemon.hasAbility(this.abilityCondition)) {
          pokemon.resetStatus();
          pokemon.updateInfo(true);
        } else {
          // Manually show ability bar, since we're not hooked into the targeting system
          pokemon.scene.unshiftPhase(new ShowAbilityPhase(pokemon.scene, pokemon.id, pokemon.getPassiveAbility()?.id === this.abilityCondition));
        }
      }
    }
    if (this.message) {
      this.scene.queueMessage(this.message);
    }
    this.end();
  }
}
