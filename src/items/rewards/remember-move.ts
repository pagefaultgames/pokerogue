import { globalScene } from "#app/global-scene";
import { LearnMoveType } from "#enums/learn-move-type";
import { RewardId } from "#enums/reward-id";
import type { PlayerPokemon } from "#field/pokemon";
import { type PokemonMoveRecallRewardParams, PokemonReward } from "#items/reward";
import { PartyUiHandler } from "#ui/party-ui-handler";

export class RememberMoveReward extends PokemonReward {
  constructor(localeKey: string, iconImage: string, group?: string) {
    super(
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
    this.id = RewardId.MEMORY_MUSHROOM;
  }

  /**
   * Applies {@linkcode RememberMoveConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should remember the move
   * @returns always `true`
   */
  apply({ pokemon, moveIndex, cost }: PokemonMoveRecallRewardParams): boolean {
    globalScene.phaseManager.unshiftNew(
      "LearnMovePhase",
      globalScene.getPlayerParty().indexOf(pokemon as PlayerPokemon),
      pokemon.getLearnableLevelMoves()[moveIndex],
      LearnMoveType.MEMORY,
      cost,
    );

    return true;
  }
}
