import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import type { SwitchEffectTransferModifier } from "#app/modifier/modifier";
import type { FieldBattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { SwitchType } from "#enums/switch-type";
import { TrainerSlot } from "#enums/trainer-slot";
import { UiMode } from "#enums/ui-mode";
import type { Pokemon } from "#field/pokemon";
import { PokemonPhase } from "#phases/pokemon-phase";
import type { RecallPhase } from "#phases/recall-phase";
import type { SummonPhase } from "#phases/summon-phase";
import { PartyOption, PartyUiMode } from "#ui/party-ui-handler";

/**
 * Phase to handle all logical elements of switching 2 Pokemon in battle.
 * @see {@linkcode SummonPhase} - Phase handling visual aspects of sending in Pokemon
 */
export class SwitchPhase extends PokemonPhase {
  public override readonly phaseName = "SwitchPhase";

  private switchType: SwitchType;
  private switchInIndex: number;

  /**
   * @param battlerIndex - The {@linkcode FieldBattlerIndex} of the Pokemon switching **out**
   * @param switchType - A {@linkcode SwitchType} dictating the type of switch behavior
   * to perform
   * @param switchInIndex - The party index of the Pokemon switching **in**, or `-1` to prompt a switch
   * from the Player party selector or enemy AI; default `-1`
   */
  constructor(battlerIndex: FieldBattlerIndex, switchType: SwitchType, switchInIndex = -1) {
    super(battlerIndex);

    this.switchType = switchType;
    this.switchInIndex = switchInIndex;
  }

  public override start(): void {
    if (this.switchInIndex !== -1) {
      this.updatePokemonData();
      this.end();
      return;
    }

    // If this is a faint-triggered switch, and the target Pokemon is somehow not fainted,
    // end this phase (and resummon the target Pokemon)
    // TODO: This is a bandaid fix that can be avoided if `TurnEndPhase` is responsible for scheduling faint switches
    if (this.switchType === SwitchType.FAINT_SWITCH && this.getPokemon().isAllowedInBattle()) {
      this.end();
      return;
    }

    if (this.player) {
      this.resolvePlayerSwitchInIndex();
    } else {
      this.resolveEnemySwitchInIndex();
    }
  }

  private resolvePlayerSwitchInIndex(): void {
    globalScene.ui.setMode(
      UiMode.PARTY,
      PartyUiMode.MODAL_SWITCH,
      this.fieldIndex,
      (cursor: number, option: PartyOption) => this.onPartyModeSelection(cursor, option),
    );
  }

  private async onPartyModeSelection(cursor: number, option: PartyOption): Promise<void> {
    this.switchInIndex = cursor;
    if (option === PartyOption.PASS_BATON) {
      this.switchType = SwitchType.BATON_PASS;
    }
    await globalScene.ui.setMode(UiMode.MESSAGE);
    this.updatePokemonData();
    this.end();
  }

  private resolveEnemySwitchInIndex(): void {
    const { trainer } = globalScene.currentBattle;
    if (!trainer) {
      throw new Error("SwitchPhase: Enemy Pokemon does not have a trainer!");
    }

    this.switchInIndex = trainer.getNextSummonIndex(
      this.fieldIndex ? TrainerSlot.TRAINER_PARTNER : TrainerSlot.TRAINER,
    );

    this.updatePokemonData();
    this.end();
  }

  /**
   * Updates *all* data that needs to be changed as a direct result of this
   * phase's switch action.
   *
   * Note that the affected Pokemon are visually off the field when this is
   * called. Any pre-switch effects that require the Pokemon to be visible
   * should be applied when or before the Pokemon is {@linkcode RecallPhase | recalled}.
   */
  private updatePokemonData(): void {
    const party = this.getAlliedParty();
    const activePokemon = this.getPokemon();
    const switchedInPokemon = party[this.switchInIndex];

    // Apply pre-switch effects from abilities (e.g. Regenerator)
    const params = { pokemon: activePokemon };
    applyAbAttrs("PreSwitchOutAbAttr", params);

    // Remove all tags applied to the active Pokemon's opponents by the active Pokemon
    // (e.g. "binding" effects from Bind, Fire Spin, etc.)
    activePokemon.getOpponents().forEach(opp => opp.removeTagsBySourceId(activePokemon.id));

    // If this switch is the result of a Baton (item/move), transfer all
    // relevant effects from the active Pokemon to the switched in Pokemon.
    // A similar effect occurs for the user's active Substitute and Shed Tail.
    if (this.switchType === SwitchType.BATON_PASS) {
      this.transferBatonPassableEffects(activePokemon, switchedInPokemon);
      activePokemon.resetSummonData();
    } else if (this.switchType === SwitchType.SHED_TAIL) {
      const subTag = activePokemon.getTag(BattlerTagType.SUBSTITUTE);
      if (subTag) {
        switchedInPokemon.summonData.tags.push(subTag);
      }
      activePokemon.resetSummonData();
    }

    // If a Substitute was transferred, update the switched in Pokemon's sprite
    // to a "behind Substitute" state
    const transferredSubTag = switchedInPokemon.getTag(BattlerTagType.SUBSTITUTE);
    if (transferredSubTag) {
      switchedInPokemon.x += switchedInPokemon.getSubstituteOffset()[0];
      switchedInPokemon.y += switchedInPokemon.getSubstituteOffset()[1];
      switchedInPokemon.setAlpha(0.5);
    }

    // Swap the party positions of the switching Pokemon
    party[this.switchInIndex] = activePokemon;
    party[this.fieldIndex] = switchedInPokemon;

    if (this.switchType !== SwitchType.INITIAL_SWITCH) {
      switchedInPokemon.turnData.switchedInThisTurn = true;
    }
  }

  /**
   * Transfers all effects that can be passed from the active Pokemon to the
   * Pokemon about to switch in via {@linkcode SwitchType.BATON_PASS | Baton or Baton Pass}
   * @param activePokemon - The {@linkcode Pokemon} switching out
   * @param switchedInPokemon - The {@linkcode Pokemon} switching in
   */
  private transferBatonPassableEffects(activePokemon: Pokemon, switchedInPokemon: Pokemon): void {
    this.getOpposingField().forEach((opposingPokemon: Pokemon) =>
      opposingPokemon.transferTagsBySourceId(activePokemon.id, switchedInPokemon.id),
    );

    // If the prior pokemon held a Baton and the current one doesn't, pass it along
    const switchedInPokemonHeldBaton = globalScene.findModifier(
      m => m.is("SwitchEffectTransferModifier") && m.pokemonId === switchedInPokemon.id,
    ) as SwitchEffectTransferModifier | undefined;
    const lastPokemonHeldBaton = globalScene.findModifier(
      m => m.is("SwitchEffectTransferModifier") && m.pokemonId === activePokemon.id,
    ) as SwitchEffectTransferModifier | undefined;

    if (lastPokemonHeldBaton && !switchedInPokemonHeldBaton) {
      globalScene.tryTransferHeldItemModifier(
        lastPokemonHeldBaton,
        switchedInPokemon,
        false,
        undefined,
        undefined,
        undefined,
        false,
      );
    }

    switchedInPokemon.transferSummon(activePokemon);
  }
}
