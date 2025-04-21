import { getPokemonNameWithAffix } from "../messages";
import type Pokemon from "../field/pokemon";
import { HitResult } from "../field/pokemon";
import { getStatusEffectHealText } from "./status-effect";
import { NumberHolder, toDmgValue, randSeedInt } from "#app/utils/common";
import {
  DoubleBerryEffectAbAttr,
  PostItemLostAbAttr,
  ReduceBerryUseThresholdAbAttr,
  applyAbAttrs,
  applyPostItemLostAbAttrs,
} from "./abilities/ability";
import i18next from "i18next";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { Stat, type BattleStat } from "#app/enums/stat";
import { PokemonHealPhase } from "#app/phases/pokemon-heal-phase";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import { globalScene } from "#app/global-scene";

export function getBerryName(berryType: BerryType): string {
  return i18next.t(`berry:${BerryType[berryType]}.name`);
}

export function getBerryEffectDescription(berryType: BerryType): string {
  return i18next.t(`berry:${BerryType[berryType]}.effect`);
}

export type BerryPredicate = (pokemon: Pokemon) => boolean;

export function getBerryPredicate(berryType: BerryType): BerryPredicate {
  switch (berryType) {
    case BerryType.SITRUS:
      return (pokemon: Pokemon) => pokemon.getHpRatio() < 0.5;
    case BerryType.LUM:
      return (pokemon: Pokemon) => !!pokemon.status || !!pokemon.getTag(BattlerTagType.CONFUSED);
    case BerryType.ENIGMA:
      return (pokemon: Pokemon) =>
        !!pokemon.turnData.attacksReceived.filter(a => a.result === HitResult.SUPER_EFFECTIVE).length;
    case BerryType.LIECHI:
    case BerryType.GANLON:
    case BerryType.PETAYA:
    case BerryType.APICOT:
    case BerryType.SALAC:
      return (pokemon: Pokemon) => {
        const threshold = new NumberHolder(0.25);
        // Offset BerryType such that LIECHI -> Stat.ATK = 1, GANLON -> Stat.DEF = 2, so on and so forth
        const stat: BattleStat = berryType - BerryType.ENIGMA;
        applyAbAttrs(ReduceBerryUseThresholdAbAttr, pokemon, null, false, threshold);
        return pokemon.getHpRatio() < threshold.value && pokemon.getStatStage(stat) < 6;
      };
    case BerryType.LANSAT:
      return (pokemon: Pokemon) => {
        const threshold = new NumberHolder(0.25);
        applyAbAttrs(ReduceBerryUseThresholdAbAttr, pokemon, null, false, threshold);
        return pokemon.getHpRatio() < 0.25 && !pokemon.getTag(BattlerTagType.CRIT_BOOST);
      };
    case BerryType.STARF:
      return (pokemon: Pokemon) => {
        const threshold = new NumberHolder(0.25);
        applyAbAttrs(ReduceBerryUseThresholdAbAttr, pokemon, null, false, threshold);
        return pokemon.getHpRatio() < 0.25;
      };
    case BerryType.LEPPA:
      return (pokemon: Pokemon) => {
        const threshold = new NumberHolder(0.25);
        applyAbAttrs(ReduceBerryUseThresholdAbAttr, pokemon, null, false, threshold);
        return !!pokemon.getMoveset().find(m => !m.getPpRatio());
      };
  }
}

export type BerryEffectFunc = (pokemon: Pokemon, berryOwner?: Pokemon) => void;

export function getBerryEffectFunc(berryType: BerryType): BerryEffectFunc {
  switch (berryType) {
    case BerryType.SITRUS:
    case BerryType.ENIGMA:
      return (pokemon: Pokemon, berryOwner?: Pokemon) => {
        if (pokemon.battleData) {
          pokemon.battleData.berriesEaten.push(berryType);
        }
        const hpHealed = new NumberHolder(toDmgValue(pokemon.getMaxHp() / 4));
        applyAbAttrs(DoubleBerryEffectAbAttr, pokemon, null, false, hpHealed);
        globalScene.unshiftPhase(
          new PokemonHealPhase(
            pokemon.getBattlerIndex(),
            hpHealed.value,
            i18next.t("battle:hpHealBerry", {
              pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
              berryName: getBerryName(berryType),
            }),
            true,
          ),
        );
        applyPostItemLostAbAttrs(PostItemLostAbAttr, berryOwner ?? pokemon, false);
      };
    case BerryType.LUM:
      return (pokemon: Pokemon, berryOwner?: Pokemon) => {
        if (pokemon.battleData) {
          pokemon.battleData.berriesEaten.push(berryType);
        }
        if (pokemon.status) {
          globalScene.queueMessage(getStatusEffectHealText(pokemon.status.effect, getPokemonNameWithAffix(pokemon)));
        }
        pokemon.resetStatus(true, true);
        pokemon.updateInfo();
        applyPostItemLostAbAttrs(PostItemLostAbAttr, berryOwner ?? pokemon, false);
      };
    case BerryType.LIECHI:
    case BerryType.GANLON:
    case BerryType.PETAYA:
    case BerryType.APICOT:
    case BerryType.SALAC:
      return (pokemon: Pokemon, berryOwner?: Pokemon) => {
        if (pokemon.battleData) {
          pokemon.battleData.berriesEaten.push(berryType);
        }
        // Offset BerryType such that LIECHI -> Stat.ATK = 1, GANLON -> Stat.DEF = 2, so on and so forth
        const stat: BattleStat = berryType - BerryType.ENIGMA;
        const statStages = new NumberHolder(1);
        applyAbAttrs(DoubleBerryEffectAbAttr, pokemon, null, false, statStages);
        globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), true, [stat], statStages.value));
        applyPostItemLostAbAttrs(PostItemLostAbAttr, berryOwner ?? pokemon, false);
      };
    case BerryType.LANSAT:
      return (pokemon: Pokemon, berryOwner?: Pokemon) => {
        if (pokemon.battleData) {
          pokemon.battleData.berriesEaten.push(berryType);
        }
        pokemon.addTag(BattlerTagType.CRIT_BOOST);
        applyPostItemLostAbAttrs(PostItemLostAbAttr, berryOwner ?? pokemon, false);
      };
    case BerryType.STARF:
      return (pokemon: Pokemon, berryOwner?: Pokemon) => {
        if (pokemon.battleData) {
          pokemon.battleData.berriesEaten.push(berryType);
        }
        const randStat = randSeedInt(Stat.SPD, Stat.ATK);
        const stages = new NumberHolder(2);
        applyAbAttrs(DoubleBerryEffectAbAttr, pokemon, null, false, stages);
        globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), true, [randStat], stages.value));
        applyPostItemLostAbAttrs(PostItemLostAbAttr, berryOwner ?? pokemon, false);
      };
    case BerryType.LEPPA:
      return (pokemon: Pokemon, berryOwner?: Pokemon) => {
        if (pokemon.battleData) {
          pokemon.battleData.berriesEaten.push(berryType);
        }
        const ppRestoreMove = pokemon.getMoveset().find(m => !m.getPpRatio())
          ? pokemon.getMoveset().find(m => !m.getPpRatio())
          : pokemon.getMoveset().find(m => m.getPpRatio() < 1);
        if (ppRestoreMove !== undefined) {
          ppRestoreMove!.ppUsed = Math.max(ppRestoreMove!.ppUsed - 10, 0);
          globalScene.queueMessage(
            i18next.t("battle:ppHealBerry", {
              pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
              moveName: ppRestoreMove!.getName(),
              berryName: getBerryName(berryType),
            }),
          );
          applyPostItemLostAbAttrs(PostItemLostAbAttr, berryOwner ?? pokemon, false);
        }
      };
  }
}
