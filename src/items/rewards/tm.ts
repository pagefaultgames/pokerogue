import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { getTmNumber, tmPoolTiers } from "#balance/tm-pool-tiers";
import { allMoves } from "#data/data-lists";
import { LearnMoveType } from "#enums/learn-move-type";
import type { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { RewardId } from "#enums/reward-id";
import { RarityTier } from "#enums/reward-tier";
import type { PlayerPokemon } from "#field/pokemon";
import { PokemonReward, type PokemonRewardParams, RewardGenerator } from "#items/reward";
import { PartyUiHandler } from "#ui/party-ui-handler";
import i18next from "i18next";

export class TmReward extends PokemonReward {
  public moveId: MoveId;

  constructor(id: RewardId, moveId: MoveId) {
    super(id, "", `tm_${PokemonType[allMoves[moveId].type].toLowerCase()}`, (pokemon: PlayerPokemon) => {
      if (!pokemon.isTmCompatible(moveId, true)) {
        return PartyUiHandler.NoEffectMessage;
      }
      return null;
    });

    this.moveId = moveId;
  }

  /**
   * Return the deduplication match key for a TM.
   * @param moveId - The {@linkcode MoveId} taught by the TM
   */
  public static getVariantMatchKey(moveId: MoveId): string {
    return `tm:${moveId}`;
  }

  override get matchKey(): string {
    return TmReward.getVariantMatchKey(this.moveId);
  }

  get name(): string {
    return i18next.t("reward:tm.name", {
      moveId: getTmNumber(this.moveId),
      moveName: allMoves[this.moveId].name,
    });
  }

  get description(): string {
    return i18next.t(settings.display.enableMoveInfo ? "reward:tmWithInfo.description" : "reward:tm.description", {
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

export class TmRewardGenerator extends RewardGenerator<MoveId> {
  private readonly tier: RarityTier;
  constructor(tier: RarityTier) {
    super();
    this.tier = tier;
  }

  /** The {@linkcode RewardId} corresponding to this generator's tier. */
  private get rewardId(): RewardId {
    switch (this.tier) {
      case RarityTier.GREAT:
        return RewardId.TM_GREAT;
      case RarityTier.ULTRA:
        return RewardId.TM_ULTRA;
      default:
        return RewardId.TM_COMMON;
    }
  }

  override getAvailableItems(exclusions?: ReadonlySet<string>): MoveId[] {
    const party = globalScene.getPlayerParty();
    const partyMemberCompatibleTms = party.map(p => p.getCompatibleTms(true, true, true));
    return partyMemberCompatibleTms
      .flat()
      .filter(tm => tmPoolTiers[tm] === this.tier)
      .filter(tm => !allMoves[tm].isUnimplemented)
      .filter((tm, i, array) => array.indexOf(tm) === i)
      .filter(tm => !exclusions?.has(TmReward.getVariantMatchKey(tm)));
  }

  override generateReward(moveId: MoveId): TmReward {
    return new TmReward(this.rewardId, moveId);
  }
}
