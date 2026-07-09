import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import type { SwitchEffectTransferModifier } from "#app/modifier/modifier";
import type { FieldBattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { PartyUiMode } from "#enums/party-ui-mode";
import { SwitchType } from "#enums/switch-type";
import { TrainerSlot } from "#enums/trainer-slot";
import { UiMode } from "#enums/ui-mode";
import type { Pokemon } from "#field/pokemon";
import { PokemonPhase } from "#phases/pokemon-phase";
import type { PostSummonPhase } from "#phases/post-summon-phase";
import type { RecallPhase } from "#phases/recall-phase";
import type { SummonPhase, SummonPhaseOptions } from "#phases/summon-phase";
import { PartyOption } from "#ui/party-ui-handler";

/**
 * Phase to handle all logical elements of switching 2 Pokemon in battle.
 * @see {@linkcode SummonPhase} - Phase handling visual aspects of sending in a Pokemon
 */
export class SwitchPhase extends PokemonPhase {
  public override readonly phaseName = "SwitchPhase";

  private switchType: SwitchType;
  private switchInIndex: number;
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: Biome cannot detect this being used in destructuring
  private readonly summonPhaseOptions?: SummonPhaseOptions | undefined;

  /**
   * @param battlerIndex - The {@linkcode FieldBattlerIndex} of the Pokemon switching **out**
   * @param switchType - A {@linkcode SwitchType} dictating the type of switch behavior
   * to perform
   * @param switchInIndex - The party index of the Pokemon switching **in**, or `-1` to prompt a switch
   * from the Player party selector or enemy AI; default `-1`
   * @param summonPhaseOptions - If provided, will be used as parameters to queue a {@linkcode SummonPhase} and {@linkcode PostSummonPhase} immediately after this phase ends.
   * Used exclusively for faint switches to send in the party member chosen by this Phase,
   * as well as mid-battle switches (to ensure relevant phases remain grouped alongside this Phase).
   */
  // TODO: Stop using the `summonPhaseOptions` parameter for faint switches in favor of queueing relevant switches at turn end
  // (alongside the relevant selection code)
  constructor(
    battlerIndex: FieldBattlerIndex,
    switchType: SwitchType,
    switchInIndex = -1,
    summonPhaseOptions?: Omit<SummonPhaseOptions, "switchType">,
  ) {
    super(battlerIndex);

    this.switchType = switchType;
    this.switchInIndex = switchInIndex;
    this.summonPhaseOptions = summonPhaseOptions;
  }

  public override start(): void {
    super.start();

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

    // Decrement the switched-in Pokemon's turn counts so it's considered to have just entered
    // for the purposes of Fake Out and similar effects
    if (this.switchType !== SwitchType.INITIAL_SWITCH) {
      switchedInPokemon.turnData.switchedInThisTurn = true;
      switchedInPokemon.tempSummonData.turnCount--;
      switchedInPokemon.tempSummonData.waveTurnCount--;
    }
  
    // If this switch is the result of a Baton (item/move), transfer all
    // relevant effects from the active Pokemon to the switched in Pokemon.
    // A similar effect occurs for the user's active Substitute and Shed Tail.
    if (this.switchType === SwitchType.BATON_PASS) {
      this.transferBatonPassableEffects(activePokemon, switchedInPokemon);
    } else if (this.switchType === SwitchType.SHED_TAIL) {
      const subTag = activePokemon.getTag(BattlerTagType.SUBSTITUTE);
      if (subTag) {
        switchedInPokemon.summonData.tags.push(subTag);
      }
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
  }

  /**
   * Transfers all effects that can be passed from the active Pokemon to the
   * Pokemon about to switch in via {@linkcode SwitchType.BATON_PASS | Baton or Baton Pass}
   * @param activePokemon - The {@linkcode Pokemon} switching out
   * @param switchedInPokemon - The {@linkcode Pokemon} switching in
   */
  private transferBatonPassableEffects(activePokemon: Pokemon, switchedInPokemon: Pokemon): void {
    this.getOpposingField().forEach((opposingPokemon: Pokemon) => {
      opposingPokemon.transferTagsBySourceId(activePokemon.id, switchedInPokemon.id);
    });

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

  public override end(): void {
    const { battlerIndex, switchType, summonPhaseOptions } = this;
    if (summonPhaseOptions != null) {
      globalScene.phaseManager.unshiftNew("SummonPhase", battlerIndex, {
        switchType,
        ...summonPhaseOptions,
      });
      globalScene.phaseManager.unshiftNew("PostSummonPhase", battlerIndex);
    }
    super.end();
  }
}
