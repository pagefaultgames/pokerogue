// TODO: Consider removing `revive` from the signature of PokemonHealPhase in the wake of this
// (was only used for revives)

import { globalScene } from "#app/global-scene";
import { BattlerTagType } from "#enums/battler-tag-type";
import { RewardId } from "#enums/reward-id";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import { PokemonReward, type PokemonRewardParams, Reward } from "#items/reward";
import { PartyUiHandler, type PokemonSelectFilter } from "#ui/party-ui-handler";
import { NumberHolder, toDmgValue } from "#utils/common";
import i18next from "i18next";

/**
 * Helper function to instantly restore a Pokemon's hp.
 * @param pokemon - The {@linkcode Pokemon} being healed
 * @param percentToRestore - The percentage of the Pokemon's {@linkcode Stat.HP | maximum HP} to heal
 * @param pointsToRestore - A minimum amount of HP points to restore; default `0`
 * @param healStatus - Whether to also heal status ailments; default `false`
 * @param fainted - Whether to allow reviving fainted Pokemon; default `false`.
 * If `true`, will also disable the effect of {@linkcode TrainerItemEffect.HEALING_BOOSTER | Healing Charms}.
 * @returns Whether the healing succeeded
 */
function restorePokemonHp(
  pokemon: Pokemon,
  percentToRestore: number,
  {
    pointsToRestore = 0,
    healStatus = false,
    fainted = false,
  }: {
    pointsToRestore?: number;
    healStatus?: boolean;
    fainted?: boolean;
  } = {},
): boolean {
  if (pokemon.isFainted() !== fainted) {
    return false;
  }
  if (fainted || healStatus) {
    pokemon.resetStatus(true, true, false, false);
  }
  // Apply HealingCharm
  const hpRestoreMultiplier = new NumberHolder(1);
  if (!fainted) {
    this.applyPlayerItems(TrainerItemEffect.HEALING_BOOSTER, { numberHolder: hpRestoreMultiplier });
  }
  const restorePoints = toDmgValue(pointsToRestore * hpRestoreMultiplier.value);
  const restorePercent = toDmgValue((percentToRestore / 100) * hpRestoreMultiplier.value * pokemon.getMaxHp());
  pokemon.heal(Math.max(restorePercent, restorePoints));
  return true;
}

export class PokemonHpRestoreReward extends PokemonReward {
  protected restorePoints: number;
  protected restorePercent: number;
  protected healStatus: boolean;

  constructor(
    localeKey: string,
    iconImage: string,
    id: RewardId,
    restorePoints: number,
    restorePercent: number,
    healStatus = false,
    selectFilter?: PokemonSelectFilter,
    group?: string,
  ) {
    super(
      localeKey,
      iconImage,
      selectFilter
        || ((pokemon: PlayerPokemon) => {
          if (
            !pokemon.hp
            || (pokemon.isFullHp()
              && (!this.healStatus || (!pokemon.status && !pokemon.getTag(BattlerTagType.CONFUSED))))
          ) {
            return PartyUiHandler.NoEffectMessage;
          }
          return null;
        }),
      group || "potion",
    );

    this.restorePoints = restorePoints;
    this.restorePercent = restorePercent;
    this.healStatus = healStatus;
    this.id = id;
  }

  get description(): string {
    return this.restorePoints
      ? i18next.t("modifierType:ModifierType.PokemonHpRestoreModifierType.description", {
          restorePoints: this.restorePoints,
          restorePercent: this.restorePercent,
        })
      : this.healStatus
        ? i18next.t("modifierType:ModifierType.PokemonHpRestoreModifierType.extra.fullyWithStatus")
        : i18next.t("modifierType:ModifierType.PokemonHpRestoreModifierType.extra.fully");
  }

  apply({ pokemon }: PokemonRewardParams): boolean {
    return restorePokemonHp(pokemon, this.restorePercent, {
      pointsToRestore: this.restorePoints,
      healStatus: this.healStatus,
    });
  }
}

export class PokemonReviveReward extends PokemonHpRestoreReward {
  constructor(localeKey: string, iconImage: string, id: RewardId, restorePercent: number) {
    super(
      localeKey,
      iconImage,
      id,
      0,
      restorePercent,
      false,
      (pokemon: PlayerPokemon) => {
        if (!pokemon.isFainted()) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      "revive",
    );

    this.selectFilter = (pokemon: PlayerPokemon) => {
      if (pokemon.hp) {
        return PartyUiHandler.NoEffectMessage;
      }
      return null;
    };
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.PokemonReviveModifierType.description", {
      restorePercent: this.restorePercent,
    });
  }

  apply({ pokemon }: PokemonRewardParams): boolean {
    return restorePokemonHp(pokemon, this.restorePercent, { fainted: true });
  }
}

export class AllPokemonFullReviveReward extends Reward {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, "modifierType:ModifierType.AllPokemonFullReviveModifierType");
    this.id = RewardId.SACRED_ASH;
  }

  apply(): boolean {
    for (const pokemon of globalScene.getPlayerParty()) {
      restorePokemonHp(pokemon, 100, { fainted: true });
    }

    return true;
  }
}
