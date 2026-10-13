import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { getPokeballTintColor } from "#data/pokeball";
import { BattleType } from "#enums/battle-type";
import { FieldPosition } from "#enums/field-position";
import type { Pokemon } from "#field/pokemon";
import { BattlePhase } from "#phases/battle-phase";
import { playTween } from "#utils/anim-utils";
import i18next from "i18next";

const REPOSITION_SLIDE_DURATION = 500;

/**
 * If the player reorders Pokémon in the party during the reward select phase,
 * the Pokémon on the field will not correspond to the first one or two Pokémon
 * in the party. This phase recalls and sends out Pokémon, or moves them in a
 * different position on the field, to account for the new order.
 *
 * Reordering is only necessary when the next battle is a wild battle in the same biome.
 * If that is not the case, all Pokémon on the field are recalled, and the phase ends.
 */
export class PartyReorderSwitchPhase extends BattlePhase {
  public readonly phaseName = "PartyReorderSwitchPhase";

  public override async start(): Promise<void> {
    super.start();

    const party = globalScene.getPlayerParty();
    const isDouble = globalScene.currentBattle.double;
    const desiredField = party.slice(0, isDouble ? 2 : 1);

    if (desiredField.length === 0) {
      this.end();
      return;
    }

    // No Pokemon on the field; EncounterPhase will queue the initial SummonPhase(s).
    if (!party.some(pokemon => pokemon.isOnField())) {
      this.end();
      return;
    }

    if (globalScene.currentBattle.battleType !== BattleType.WILD || this.hasBiomeChanged()) {
      const displacedPokemon = party.filter(pokemon => pokemon.isOnField());
      await this.recallPokemon(displacedPokemon);
      this.end();
      return;
    }

    const leavingPokemon = party.filter(pokemon => pokemon.isOnField() && !desiredField.includes(pokemon));

    if (leavingPokemon.length > 0) {
      await this.recallPokemon(leavingPokemon);
    }

    await this.repositionStayingPokemon(desiredField, isDouble);

    desiredField.forEach((pokemon, index) => {
      if (!pokemon.isOnField()) {
        globalScene.phaseManager.unshiftNew("SummonPhase", index);
      }
    });

    this.end();
  }

  /**
   * Utility function to check whether the biome has changed with the current wave.
   */
  // TODO: It should not be necessary to have this function here. There is already globalScene.isNewBiome(),
  // but it returns `true` if the _next_ wave will be in a new biome.
  private hasBiomeChanged(): boolean {
    const isEndlessOrDaily = globalScene.gameMode.hasShortBiomes || globalScene.gameMode.isDaily;
    const isEndlessSixthWave = globalScene.gameMode.hasShortBiomes && globalScene.currentBattle.waveIndex % 10 === 6;
    const isWaveIndexMultipleOfFifty = globalScene.currentBattle.waveIndex % 50 === 0;
    return isEndlessSixthWave || (isEndlessOrDaily && isWaveIndexMultipleOfFifty);
  }

  /**
   * Slide every lead that is already on the field but in the wrong slot over to
   * its target field position.
   * @param desiredField - The pokemon that should be on the field, ordered by slot
   * @param isDouble - Whether the current battle is a double battle
   * @returns The slide tween promises that were started
   */
  private async repositionStayingPokemon(desiredField: Pokemon[], isDouble: boolean): Promise<void> {
    const availablePartyMembers = globalScene.getPlayerParty().filter(pokemon => pokemon.isAllowedInBattle()).length;
    const slides: Promise<void>[] = [];

    desiredField.forEach((pokemon, index) => {
      if (!pokemon.isOnField()) {
        return;
      }

      let targetPosition: FieldPosition = FieldPosition.CENTER;
      if (isDouble && availablePartyMembers > 1) {
        targetPosition = index === 1 ? FieldPosition.RIGHT : FieldPosition.LEFT;
      }

      if (pokemon.fieldPosition !== targetPosition) {
        slides.push(pokemon.setFieldPosition(targetPosition, REPOSITION_SLIDE_DURATION));
        // Ensure that the Pokémon on the right is displayed on top
        if (targetPosition === FieldPosition.RIGHT) {
          globalScene.field.bringToTop(pokemon);
        }
      }
    });

    if (slides.length > 0) {
      await Promise.all(slides);
    }
  }

  /**
   * Play the "come back" recall animation for the given pokemon,
   * removing them from the field once the animation completes.
   * @param leavingPokemon - The pokemon to recall
   */
  private async recallPokemon(leavingPokemon: Pokemon[]): Promise<void> {
    for (const pokemon of leavingPokemon) {
      globalScene.ui.showText(i18next.t("battle:playerComeBack", { pokemonName: getPokemonNameWithAffix(pokemon) }));
      audioManager.playSound("se/pb_rel");

      pokemon.hideInfo();
      pokemon.tint(getPokeballTintColor(pokemon.getPokeball(true)), 1, 250, "Sine.easeIn");

      await playTween({ targets: pokemon, duration: 250, ease: "Sine.easeIn", scale: 0.1 });
      pokemon.leaveField(true, false);
      // TODO: replace with generic wait utility function
      await new Promise<void>(resolve => globalScene.time.delayedCall(750, () => resolve()));
    }
  }
}
