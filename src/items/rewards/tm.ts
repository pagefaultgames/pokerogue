import { globalScene } from "#app/global-scene";
import { tmPoolTiers, tmSpecies } from "#balance/tms";
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
        if (
          pokemon.compatibleTms.indexOf(moveId) === -1 ||
          pokemon.getMoveset().filter(m => m.moveId === moveId).length
        ) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      "tm",
    );

    this.moveId = moveId;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.TmModifierType.name", {
      moveId: padInt(Object.keys(tmSpecies).indexOf(this.moveId.toString()) + 1, 3),
      moveName: allMoves[this.moveId].name,
    });
  }

  get description(): string {
    return i18next.t(
      globalScene.enableMoveInfo
        ? "modifierType:ModifierType.TmModifierTypeWithInfo.description"
        : "modifierType:ModifierType.TmModifierType.description",
      { moveName: allMoves[this.moveId].name },
    );
  }

  /**
   * Applies {@linkcode TmConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should learn the TM
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
    const partyMemberCompatibleTms = party.map(p => {
      const previousLevelMoves = p.getLearnableLevelMoves();
      return (p as PlayerPokemon).compatibleTms.filter(
        tm => !p.moveset.find(m => m.moveId === tm) && !previousLevelMoves.find(lm => lm === tm),
      );
    });
    const tierUniqueCompatibleTms = partyMemberCompatibleTms
      .flat()
      .filter(tm => tmPoolTiers[tm] === this.tier)
      .filter(tm => !allMoves[tm].name.endsWith(" (N)"))
      .filter((tm, i, array) => array.indexOf(tm) === i);
    if (!tierUniqueCompatibleTms.length) {
      return null;
    }

    const randTmIndex = randSeedItem(tierUniqueCompatibleTms);
    return new TmReward(randTmIndex);
  }
}
