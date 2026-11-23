import { globalScene } from "#app/global-scene";
import { LearnMoveType } from "#enums/learn-move-type";
import { RewardId } from "#enums/reward-id";
import type { PlayerPokemon } from "#field/pokemon";
import { type PokemonMoveRecallRewardParams, PokemonReward } from "#items/reward";
import { PartyUiHandler } from "#ui/party-ui-handler";

export class RememberMoveReward extends PokemonReward {
  constructor(localeKey: string, iconImage: string) {
    super(RewardId.MEMORY_MUSHROOM, { localeKey, iconName: iconImage });
  }

  protected override getIneligibilityMessage(pokemon: PlayerPokemon): string | null {
    return pokemon.getLearnableLevelMoves().length === 0 ? PartyUiHandler.NoEffectMessage : null;
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
      pokemon.getLearnableLevelMoves()[moveIndex][1],
      LearnMoveType.MEMORY,
      cost,
    );

    return true;
  }
}
