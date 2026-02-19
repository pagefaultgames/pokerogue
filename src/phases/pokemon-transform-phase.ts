import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import type { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { BATTLE_STATS, EFFECTIVE_STATS } from "#enums/stat";
import { MovesetChangedEvent } from "#events/battle-scene";
import { PokemonMove } from "#moves/pokemon-move";
import { PokemonPhase } from "#phases/pokemon-phase";
import i18next from "i18next";

/**
 * Transforms a Pokemon into another Pokemon on the field.
 * Used for Transform (move) and Imposter (ability)
 */
export class PokemonTransformPhase extends PokemonPhase {
  public readonly phaseName = "PokemonTransformPhase";
  protected targetIndex: BattlerIndex;
  private playSound: boolean;

  constructor(userIndex: BattlerIndex, targetIndex: BattlerIndex, playSound = false) {
    super(userIndex);

    this.targetIndex = targetIndex;
    this.playSound = playSound;
  }

  public override start(): void {
    const user = this.getPokemon();
    const target = globalScene.getField()[this.targetIndex];

    if (!target) {
      this.end();
      return;
    }

    user.summonData.speciesForm = target.getSpeciesForm();
    user.summonData.ability = target.getAbility().id;
    user.summonData.gender = target.getGender();

    // Power Trick's effect is removed after using Transform
    user.removeTag(BattlerTagType.POWER_TRICK);

    // Copy all stats (except HP)
    for (const s of EFFECTIVE_STATS) {
      user.setStat(s, target.getStat(s, false), false);
    }

    // Copy all stat stages
    for (const s of BATTLE_STATS) {
      user.setStatStage(s, target.getStatStage(s));
    }

    user.summonData.moveset = target.getMoveset().map(oldMove => {
      if (oldMove) {
        // If PP value is less than 5, do nothing. If greater, we need to reduce the value to 5.
        const newMove = new PokemonMove(oldMove.moveId, 0, 0, Math.min(oldMove.getMove().pp, 5));
        this.emitMovesetChange(oldMove, newMove);
        return newMove;
      }
      console.warn(`Transform: somehow iterating over a ${oldMove} value when copying moveset!`);
      return new PokemonMove(MoveId.NONE);
    });

    // TODO: This should fallback to the target's original typing if none are left (from Burn Up, etc.)
    user.summonData.types = target.getTypes();

    const promises = [user.updateInfo()];

    if (this.playSound) {
      globalScene.playSound("battle_anims/PRSFX- Transform");
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("abilityTriggers:postSummonTransform", {
        pokemonNameWithAffix: getPokemonNameWithAffix(user),
        targetName: target.name,
      }),
    );

    promises.push(
      user.loadAssets(false).then(() => {
        user.playAnim();
        user.updateInfo();
        // If the new ability activates immediately, it needs to happen after all the transform animations
        user.setTempAbility(target.getAbility());
      }),
    );

    Promise.allSettled(promises).then(() => this.end());
  }

  /**
   * Emit an event upon transforming and changing movesets.
   * @param origMove - The target's original {@linkcode PokemonMove} from the target's moveset
   * @param copiedMove - The new {@linkcode PokemonMove} being added to the user's moveset
   */
  private emitMovesetChange(origMove: PokemonMove, copiedMove: PokemonMove): void {
    const user = this.getPokemon();
    const target = globalScene.getField()[this.targetIndex];

    globalScene.eventTarget.dispatchEvent(new MovesetChangedEvent(user.id, copiedMove));
    // If a player pokemon transforms into an enemy, permanently reveal all moves in their moveset.
    // TODO: This can be extended to the enemy AI once a record of "seen moves" is added
    if (user.isPlayer() && target.isEnemy()) {
      globalScene.eventTarget.dispatchEvent(new MovesetChangedEvent(target.id, origMove));
    }
  }
}
