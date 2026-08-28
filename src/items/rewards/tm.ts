import { globalScene } from "#app/global-scene";
import { tmPoolTiers } from "#balance/tm-pool-tiers";
import { allMoves } from "#data/data-lists";
import { LearnMoveType } from "#enums/learn-move-type";
import type { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import type { RarityTier } from "#enums/reward-tier";
import type { PlayerPokemon } from "#field/pokemon";
import { PokemonReward, type PokemonRewardParams, RewardGenerator } from "#items/reward";
import { PartyUiHandler } from "#ui/party-ui-handler";
import { padInt, randSeedItem } from "#utils/common";
import i18next from "i18next";

export class TmReward extends PokemonReward {
  public moveId: MoveId;

  constructor(moveId: MoveId) {
    super(
      "",
      `tm_${PokemonType[allMoves[moveId].type].toLowerCase()}`,
      (pokemon: PlayerPokemon) => {
        if (!pokemon.isTmCompatible(moveId, true)) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      "tm",
    );

    this.moveId = moveId;
  }

  get name(): string {
    return i18next.t("reward:tm.name", {
      moveId: padInt(Object.keys(tmPoolTiers).indexOf(this.moveId.toString()) + 1, 3),
      moveName: allMoves[this.moveId].name,
    });
  }

  get description(): string {
    return i18next.t(globalScene.enableMoveInfo ? "reward:tmWithInfo.description" : "reward:tm.description", {
      moveName: allMoves[this.moveId].name,
    });
  }

  /**
   * Apply this reward, queueing a `LearnMovePhase` for the target.
   * @param pokemon - The {@linkcode PlayerPokemon} that should learn the TM
   * @returns always `true`
   */
  apply({ pokemon }: PokemonRewardParams): boolean {
    globalScene.phaseManager.unshiftNew(
      "LearnMovePhase",
      globalScene.getPlayerParty().indexOf(pokemon),
      this.moveId,
      LearnMoveType.TM,
    );

    return true;
  }
}

export class TmRewardGenerator extends RewardGenerator {
  private tier: RarityTier;
  constructor(tier: RarityTier) {
    super();
    this.tier = tier;
  }

  override generateReward(pregenArgs?: MoveId) {
    if (pregenArgs !== undefined) {
      return new TmReward(pregenArgs);
    }

    const party = globalScene.getPlayerParty();
    const partyMemberCompatibleTms = party.map(p => p.getCompatibleTms(true, true));
    const tierUniqueCompatibleTms = partyMemberCompatibleTms
      .flat()
      .filter(tm => tmPoolTiers[tm] === this.tier)
      .filter(tm => !allMoves[tm].name.endsWith(" (N)"))
      .filter((tm, i, array) => array.indexOf(tm) === i);
    if (tierUniqueCompatibleTms.length === 0) {
      return null;
    }

    const randTmIndex = randSeedItem(tierUniqueCompatibleTms);
    return new TmReward(randTmIndex);
  }
}
