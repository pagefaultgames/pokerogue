import { PokemonHealPhase, StatChangePhase } from "../phases";
import { getPokemonMessage } from "../messages";
import Pokemon, { HitResult } from "../field/pokemon";
import { getBattleStatName } from "./battle-stat";
import { BattleStat } from "./battle-stat";
import { BattlerTagType } from "./enums/battler-tag-type";
import { getStatusEffectHealText } from "./status-effect";
import * as Utils from "../utils";
import { DoubleBerryEffectAbAttr, ReduceBerryUseThresholdAbAttr, applyAbAttrs } from "./ability";
import i18next from '../plugins/i18n';
export enum BerryType {
  SITRUS,
  LUM,
  ENIGMA,
  LIECHI,
  GANLON,
  PETAYA,
  APICOT,
  SALAC,
  LANSAT,
  STARF,
  LEPPA
}

export function getBerryName(berryType: BerryType) {
  return `${Utils.toReadableString(BerryType[berryType])} `+i18next.t('berry:Berry');
}

export function getBerryEffectDescription(berryType: BerryType) {
  switch (berryType) {
    case BerryType.SITRUS:
      return i18next.t('berry:Restores_25%_HP_if_HP_is_below_50%');
    case BerryType.LUM:
      return i18next.t('berry:Cures_any_non-volatile_status_condition_and_confusion');
    case BerryType.ENIGMA:
      return i18next.t('berry:Restores_25%_HP_if_hit_by_a_super_effective_move');
    case BerryType.LIECHI:
    case BerryType.GANLON:
    case BerryType.PETAYA:
    case BerryType.APICOT:
    case BerryType.SALAC:
      const stat = (berryType - BerryType.LIECHI) as BattleStat;
      return `${i18next.t('berry:Raises')} ${getBattleStatName(stat)} `+i18next.t('berry:if_HP_is_below_25%');
    case BerryType.LANSAT:
      return +i18next.t('berry:Raises_critical_hit_ratio_if_HP_is_below_25%');
    case BerryType.STARF:
      return +i18next.t('berry:Sharply_raises_a_random_stat_if_HP_is_below_25%');
    case BerryType.LEPPA:
      return +i18next.t('berry:Restores_10_PP_to_a_move_if_its_PP_reaches_0');
  }
}

export type BerryPredicate = (pokemon: Pokemon) => boolean;

export function getBerryPredicate(berryType: BerryType): BerryPredicate {
  switch (berryType) {
    case BerryType.SITRUS:
      return (pokemon: Pokemon) => pokemon.getHpRatio() < 0.5;
    case BerryType.LUM:
      return (pokemon: Pokemon) => !!pokemon.status || !!pokemon.getTag(BattlerTagType.CONFUSED);
    case BerryType.ENIGMA:
      return (pokemon: Pokemon) => !!pokemon.turnData.attacksReceived.filter(a => a.result === HitResult.SUPER_EFFECTIVE).length;
    case BerryType.LIECHI:
    case BerryType.GANLON:
    case BerryType.PETAYA:
    case BerryType.APICOT:
     case BerryType.SALAC:
      return (pokemon: Pokemon) => {
        const threshold = new Utils.NumberHolder(0.25);
        const battleStat = (berryType - BerryType.LIECHI) as BattleStat;
        applyAbAttrs(ReduceBerryUseThresholdAbAttr, pokemon, null, threshold);
        return pokemon.getHpRatio() < threshold.value && pokemon.summonData.battleStats[battleStat] < 6;
      };
    case BerryType.LANSAT:
      return (pokemon: Pokemon) => {
        const threshold = new Utils.NumberHolder(0.25);
        applyAbAttrs(ReduceBerryUseThresholdAbAttr, pokemon, null, threshold);
        return pokemon.getHpRatio() < 0.25 && !pokemon.getTag(BattlerTagType.CRIT_BOOST);
      };
    case BerryType.STARF:
      return (pokemon: Pokemon) => {
        const threshold = new Utils.NumberHolder(0.25);
        applyAbAttrs(ReduceBerryUseThresholdAbAttr, pokemon, null, threshold);
        return pokemon.getHpRatio() < 0.25;
      };
    case BerryType.LEPPA:
      return (pokemon: Pokemon) => {
        const threshold = new Utils.NumberHolder(0.25);
        applyAbAttrs(ReduceBerryUseThresholdAbAttr, pokemon, null, threshold);
        return !!pokemon.getMoveset().find(m => !m.getPpRatio());
      };
  }
}

export type BerryEffectFunc = (pokemon: Pokemon) => void;

export function getBerryEffectFunc(berryType: BerryType): BerryEffectFunc {
  switch (berryType) {
    case BerryType.SITRUS:
    case BerryType.ENIGMA:
      return (pokemon: Pokemon) => {
        if (pokemon.battleData)
          pokemon.battleData.berriesEaten.push(berryType);
        const hpHealed = new Utils.NumberHolder(Math.floor(pokemon.getMaxHp() / 4));
        applyAbAttrs(DoubleBerryEffectAbAttr, pokemon, null, hpHealed);
        pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.getBattlerIndex(),
          hpHealed.value, getPokemonMessage(pokemon, `'s ${getBerryName(berryType)}\n`+i18next.t('berry:restored_its_HP')), true));
      };
    case BerryType.LUM:
      return (pokemon: Pokemon) => {
        if (pokemon.battleData)
          pokemon.battleData.berriesEaten.push(berryType);
        if (pokemon.status) {
          pokemon.scene.queueMessage(getPokemonMessage(pokemon, getStatusEffectHealText(pokemon.status.effect)));
          pokemon.resetStatus();
          pokemon.updateInfo();
        } 
        if (pokemon.getTag(BattlerTagType.CONFUSED))
          pokemon.lapseTag(BattlerTagType.CONFUSED);
      };
    case BerryType.LIECHI:
    case BerryType.GANLON:
    case BerryType.PETAYA:
    case BerryType.APICOT:
    case BerryType.SALAC:
      return (pokemon: Pokemon) => {
        if (pokemon.battleData)
          pokemon.battleData.berriesEaten.push(berryType);
        const battleStat = (berryType - BerryType.LIECHI) as BattleStat;
        const statLevels = new Utils.NumberHolder(1);
        applyAbAttrs(DoubleBerryEffectAbAttr, pokemon, null, statLevels);
        pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ battleStat ], statLevels.value));
      };
    case BerryType.LANSAT:
      return (pokemon: Pokemon) => {
        if (pokemon.battleData)
          pokemon.battleData.berriesEaten.push(berryType);
        pokemon.addTag(BattlerTagType.CRIT_BOOST);
      };
    case BerryType.STARF:
      return (pokemon: Pokemon) => {
        if (pokemon.battleData)
          pokemon.battleData.berriesEaten.push(berryType);
        const statLevels = new Utils.NumberHolder(2);
        applyAbAttrs(DoubleBerryEffectAbAttr, pokemon, null, statLevels);
        pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ BattleStat.RAND ], statLevels.value));
      };
    case BerryType.LEPPA:
      return (pokemon: Pokemon) => {
        if (pokemon.battleData)
          pokemon.battleData.berriesEaten.push(berryType);
        const ppRestoreMove = pokemon.getMoveset().find(m => !m.getPpRatio());
        ppRestoreMove.ppUsed = Math.max(ppRestoreMove.ppUsed - 10, 0);
        pokemon.scene.queueMessage(getPokemonMessage(pokemon, `${i18next.t('berry:restored_PP_to_its_move')} ${ppRestoreMove.getName()}\n${i18next.t('berry:using_its')} ${getBerryName(berryType)}!`));
      };
  }
}