import { globalScene } from "#app/global-scene";
import { BattlerIndex } from "#enums/battler-index";
import { FieldPosition } from "#enums/field-position";
import { SwitchType } from "#enums/switch-type";
import { UiMode } from "#enums/ui-mode";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import { BattlePhase } from "#phases/battle-phase";
import type { FaintPhase } from "#phases/faint-phase";
import type { TurnEndPhase } from "#phases/turn-end-phase";
import { PartyUiHandler, PartyUiMode } from "#ui/party-ui-handler";
import { toDmgValue } from "#utils/common";
import i18next from "i18next";

/**
 * Sets the Party UI and handles the effect of Revival Blessing
 * when used by one of the player's Pokemon.
 */
export class RevivalBlessingPhase extends BattlePhase {
  public override readonly phaseName = "RevivalBlessingPhase";

  protected readonly user: PlayerPokemon;

  constructor(user: PlayerPokemon) {
    super();

    this.user = user;
  }

  public override start(): void {
    globalScene.ui.setMode(
      UiMode.PARTY,
      PartyUiMode.REVIVAL_BLESSING,
      this.user.getFieldIndex(),
      (slotIndex: number) => this.revivePokemonAtSlotIndex(slotIndex),
      PartyUiHandler.FilterFainted,
    );
  }

  /**
   * Revives the {@linkcode Pokemon} at the given index in the Player's party.
   * @param slotIndex - The party slot index of the Pokemon to revive
   */
  private async revivePokemonAtSlotIndex(slotIndex: number): Promise<void> {
    const { currentBattle, phaseManager, ui } = globalScene;
    const pokemon = globalScene.getPlayerParty()[slotIndex];
    if (pokemon == null || !pokemon.isFainted()) {
      this.end();
      return;
    }

    pokemon.resetTurnData();
    pokemon.resetStatus();
    pokemon.heal(toDmgValue(0.5 * pokemon.getMaxHp()));

    phaseManager.unshiftNew(
      "MessagePhase",
      i18next.t("moveTriggers:revivalBlessing", { pokemonName: pokemon.name }),
      0,
      true,
    );

    if (currentBattle.double) {
      const ally = this.user.getAlly();
      if (pokemon === ally) {
        this.clearFaintSwitchPhase(pokemon);
        phaseManager.unshiftNew("SummonPhase", pokemon.getBattlerIndex(), { playTrainerAnim: false });
      } else if (ally?.isFainted()) {
        this.clearFaintSwitchPhase(pokemon);
        phaseManager.unshiftNew("SwitchPhase", ally.getBattlerIndex(), SwitchType.SWITCH, slotIndex);
      }
    }

    await ui.setMode(UiMode.MESSAGE);
    await this.user.setFieldPosition(this.getUserFinalFieldPosition(), 500);
    this.end();
  }

  /**
   * Clears the {@linkcode SwitchPhase} for the given fainted Pokemon
   * from the phase queue.
   * @param pokemon - The fainted {@linkcode Pokemon}
   * @todo This is only required because {@linkcode FaintPhase} pushes `SwitchPhases`
   * to fill vacant field slots even though a subsequent Revival Blessing
   * can fill said field slots before the end of the turn. The pushed `SwitchPhases`
   * should be scheduled in {@linkcode TurnEndPhase} instead to make this method obsolete.
   */
  private clearFaintSwitchPhase(pokemon: Pokemon): void {
    globalScene.phaseManager.tryRemovePhase("SwitchPhase", phase => phase.getPokemon() === pokemon);
  }

  /**
   * @returns The final {@linkcode FieldPosition} the user should move to
   * when this use of Revival Blessing resolves.
   */
  private getUserFinalFieldPosition(): FieldPosition {
    if (!globalScene.currentBattle.double) {
      return FieldPosition.CENTER;
    }

    return this.user.getBattlerIndex() === BattlerIndex.PLAYER ? FieldPosition.LEFT : FieldPosition.RIGHT;
  }
}
