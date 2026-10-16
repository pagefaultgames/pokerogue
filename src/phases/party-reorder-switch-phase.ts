import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { getPokeballTintColor } from "#data/pokeball";
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
 * Reordering is only necessary when the arena state carries over into the next battle
 * (i.e. a wild battle in the same biome). If that is not the case, all Pokémon on the field
 * are recalled, and the phase ends.
 */
export class PartyReorderSwitchPhase extends BattlePhase {
  public readonly phaseName = "PartyReorderSwitchPhase";
  /** Whether every Pokémon on the field should be recalled, rather than reordered */
  private readonly recallAll: boolean;

  /**
   * @param recallAll - Whether every Pokémon on the field should be recalled, rather than reordered.
   * Should be `true` whenever the arena state is reset for the new battle (trainer battles,
   * Mystery Encounters, new biomes, etc.)
   */
  constructor(recallAll: boolean) {
    super();
    this.recallAll = recallAll;
  }

  public override async start(): Promise<void> {
    super.start();

    const party = globalScene.getPlayerParty();
    const isDouble = globalScene.currentBattle.double;
    // Only fill the second slot if there is a second Pokémon able to battle; otherwise,
    // SummonPhase would fail to find a replacement for it and trigger a game over
    const availableCount = globalScene.getPokemonAllowedInBattle().length;
    const desiredField = party.slice(0, isDouble && availableCount > 1 ? 2 : 1);

    if (desiredField.length === 0) {
      this.end();
      return;
    }

    // No Pokemon on the field; EncounterPhase will queue the initial SummonPhase(s).
    if (!party.some(pokemon => pokemon.isOnField())) {
      this.end();
      return;
    }

    if (this.recallAll) {
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
