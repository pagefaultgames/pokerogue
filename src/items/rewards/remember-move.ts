import { globalScene } from "#app/global-scene";
import { LearnMoveType } from "#enums/learn-move-type";
import { PartyUiMode } from "#enums/party-ui-mode";
import { RewardId } from "#enums/reward-id";
import { UiMode } from "#enums/ui-mode";
import type { PlayerPokemon } from "#field/pokemon";
import { type PokemonMoveRecallRewardParams, PokemonReward } from "#items/reward";
import type { BattlePhase } from "#phases/battle-phase";
import type { SelectRewardPhase } from "#phases/select-reward-phase";
import { type PartyOption, PartyUiHandler } from "#ui/party-ui-handler";

export class RememberMoveReward extends PokemonReward {
  constructor(localeKey: string, iconImage: string, group?: string) {
    super(
      RewardId.MEMORY_MUSHROOM,
      localeKey,
      iconImage,
      (pokemon: PlayerPokemon) => {
        if (pokemon.getLearnableLevelMoves().length === 0) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      group,
    );
  }

  /**
   * Applies {@linkcode RememberMoveConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should remember the move
   * @returns always `true`
   */
  apply({ pokemon, moveIndex, postApply }: PokemonMoveRecallRewardParams): boolean {
    globalScene.phaseManager.unshiftNew(
      "LearnMovePhase",
      globalScene.getPlayerParty().indexOf(pokemon as PlayerPokemon),
      pokemon.getLearnableLevelMoves()[moveIndex][1],
      LearnMoveType.MEMORY,
      postApply,
    );

    return true;
  }

  openParty(postApply: () => void, onCancel: () => void, callingPhase: BattlePhase): void {
    globalScene.ui.setModeWithoutClear(
      UiMode.PARTY,
      PartyUiMode.REMEMBER_MOVE_REWARD,
      -1,
      (slotIndex: number, option: PartyOption) => {
        if (slotIndex < 6) {
          // TODO: improve this check here
          const params: PokemonMoveRecallRewardParams = {
            pokemon: globalScene.getPlayerParty()[slotIndex],
            moveIndex: option,
            postApply,
          };
          console.log("About to apply...");
          this.apply(params);
          console.log("Applied...");
          globalScene.ui.setMode(UiMode.REWARD_SELECT, true).then(() => {
            globalScene.phaseManager.unshiftPhase((callingPhase as SelectRewardPhase).copy());
            callingPhase.end();
          });
        } else {
          onCancel();
        }
      },
      this.selectFilter,
    );
  }
}
