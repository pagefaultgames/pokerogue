import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { getPokeballTintColor } from "#data/pokeball";
import { BattleType } from "#enums/battle-type";
import { FieldPosition } from "#enums/field-position";
import type { Pokemon } from "#field/pokemon";
import { BattlePhase } from "#phases/battle-phase";
import i18next from "i18next";

const REPOSITION_SLIDE_DURATION = 500;

export class PartyReorderSwitchPhase extends BattlePhase {
  public readonly phaseName = "PartyReorderSwitchPhase";
  private readonly partyIndex: number;

  constructor(partyIndex: number) {
    super();

    this.partyIndex = partyIndex;
  }

  start(): void {
    super.start();

    const party = globalScene.getPlayerParty();
    const isDouble = globalScene.currentBattle.double;
    // The pokemon that should occupy the field, ordered by their target field slot.
    const desiredField = party.slice(0, isDouble ? 2 : 1);

    if (desiredField.length === 0) {
      this.end();
      return;
    }

    if (globalScene.currentBattle.battleType !== BattleType.WILD) {
      const desiredPokemon = desiredField[this.partyIndex];
      const displacedPokemon = party.find(pokemon => pokemon.isOnField() && pokemon.id !== desiredPokemon?.id);
      if (!desiredPokemon || !displacedPokemon) {
        this.end();
        return;
      }
      this.recallPokemon([displacedPokemon], () => this.end());
      return;
    }

    const leavingPokemon = party.filter(pokemon => pokemon.isOnField() && !desiredField.includes(pokemon));

    const enteringIndexes = desiredField.reduce<number[]>((acc, pokemon, index) => {
      if (!pokemon.isOnField()) {
        acc.push(index);
      }
      return acc;
    }, []);

    const slides = this.repositionStayingPokemon(desiredField, isDouble);

    const summonEntering = () => {
      for (const index of enteringIndexes) {
        globalScene.phaseManager.unshiftNew("SummonPhase", index);
      }
    };

    if (leavingPokemon.length > 0) {
      this.recallPokemon(leavingPokemon, () => {
        summonEntering();
        this.end();
      });
      return;
    }

    if (slides.length > 0) {
      Promise.all(slides).then(() => {
        summonEntering();
        this.end();
      });
      return;
    }

    summonEntering();
    this.end();
  }

  /**
   * Slide every lead that is already on the field but in the wrong slot over to
   * its target field position.
   * @param desiredField - The pokemon that should be on the field, ordered by slot
   * @param isDouble - Whether the current battle is a double battle
   * @returns The slide tween promises that were started
   */
  private repositionStayingPokemon(desiredField: Pokemon[], isDouble: boolean): Promise<void>[] {
    const availablePartyMembers = globalScene.getPlayerParty().filter(pokemon => pokemon.isAllowedInBattle()).length;
    const slides: Promise<void>[] = [];

    desiredField.forEach((pokemon, index) => {
      if (!pokemon.isOnField()) {
        return;
      }

      const targetPosition =
        index === 1
          ? FieldPosition.RIGHT
          : !isDouble || availablePartyMembers === 1
            ? FieldPosition.CENTER
            : FieldPosition.LEFT;

      if (pokemon.fieldPosition !== targetPosition) {
        slides.push(pokemon.setFieldPosition(targetPosition, REPOSITION_SLIDE_DURATION));
      }
    });

    return slides;
  }

  /**
   * Play the "come back" recall animation for the given pokemon, removing them
   * from the field once the animation completes.
   * @param leavingPokemon - The pokemon to recall
   * @param onComplete - Callback invoked once every recall animation has finished
   */
  private recallPokemon(leavingPokemon: Pokemon[], onComplete: () => void): void {
    globalScene.ui.showText(
      i18next.t("battle:playerComeBack", {
        pokemonName: getPokemonNameWithAffix(leavingPokemon[0]),
      }),
    );
    audioManager.playSound("se/pb_rel");

    let remaining = leavingPokemon.length;
    for (const pokemon of leavingPokemon) {
      pokemon.hideInfo();
      pokemon.tint(getPokeballTintColor(pokemon.getPokeball(true)), 1, 250, "Sine.easeIn");
      globalScene.tweens.add({
        targets: pokemon,
        duration: 250,
        ease: "Sine.easeIn",
        scale: 0.5,
        onComplete: () => {
          pokemon.leaveField(true, false);
          if (--remaining === 0) {
            onComplete();
          }
        },
      });
    }
  }
}
