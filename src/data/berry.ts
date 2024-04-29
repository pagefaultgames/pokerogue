import { PokemonHealPhase, StatChangePhase } from "../phases";
import { getPokemonMessage } from "../messages";
import Pokemon, { HitResult } from "../field/pokemon";
import { getBattleStatName } from "./battle-stat";
import { BattleStat } from "./battle-stat";
import { BattlerTagType } from "./enums/battler-tag-type";
import { getStatusEffectHealText } from "./status-effect";
import * as Utils from "../utils";
import { DoubleBerryEffectAbAttr, ReduceBerryUseThresholdAbAttr, applyAbAttrs } from "./ability";
import i18next from "i18next";

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
  return `${i18next.t(`berry:${BerryType[berryType]}.name`)}`;
}

export function getBerryEffectDescription(berryType: BerryType) {
  switch (berryType) {
    case BerryType.SITRUS:
      return i18next.t('berry:SITRUS.description');
    case BerryType.LUM:
      return i18next.t('berry:LUM.description');
    case BerryType.ENIGMA:
      return i18next.t('berry:ENIGMA.description');
    case BerryType.LIECHI:
    case BerryType.GANLON:
    case BerryType.PETAYA:
    case BerryType.APICOT:
    case BerryType.SALAC:
      const stat = (berryType - BerryType.LIECHI) as BattleStat;
      return i18next.t('modifier:berry', { stat: getBattleStatName(stat) });
    case BerryType.LANSAT:
      return i18next.t('berry:LANSAT.description');
    case BerryType.STARF:
      return i18next.t('berry:STARF.description');
    case BerryType.LEPPA:
      return i18next.t('berry:LEPPA.description');
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
        const hpHealed = new Utils.NumberHolder(Math.floor(pokemon.getMaxHp() / 4));
        applyAbAttrs(DoubleBerryEffectAbAttr, pokemon, null, hpHealed);
        pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.getBattlerIndex(),
          hpHealed.value, getPokemonMessage(pokemon, `'s ${getBerryName(berryType)}\nrestored its HP!`), true));
      };
    case BerryType.LUM:
      return (pokemon: Pokemon) => {
        if (pokemon.status) {
          pokemon.scene.queueMessage(getPokemonMessage(pokemon, getStatusEffectHealText(pokemon.status.effect)));
          pokemon.resetStatus();
          pokemon.updateInfo();
        } else if (pokemon.getTag(BattlerTagType.CONFUSED))
          pokemon.lapseTag(BattlerTagType.CONFUSED);
      };
    case BerryType.LIECHI:
    case BerryType.GANLON:
    case BerryType.PETAYA:
    case BerryType.APICOT:
    case BerryType.SALAC:
      return (pokemon: Pokemon) => {
        const battleStat = (berryType - BerryType.LIECHI) as BattleStat;
        const statLevels = new Utils.NumberHolder(1);
        applyAbAttrs(DoubleBerryEffectAbAttr, pokemon, null, statLevels);
        pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ battleStat ], statLevels.value));
      };
    case BerryType.LANSAT:
      return (pokemon: Pokemon) => {
        pokemon.addTag(BattlerTagType.CRIT_BOOST);
      };
    case BerryType.STARF:
      return (pokemon: Pokemon) => {
        const statLevels = new Utils.NumberHolder(2);
        applyAbAttrs(DoubleBerryEffectAbAttr, pokemon, null, statLevels);
        pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ BattleStat.RAND ], statLevels.value));
      };
    case BerryType.LEPPA:
      return (pokemon: Pokemon) => {
        const ppRestoreMove = pokemon.getMoveset().find(m => !m.getPpRatio());
        ppRestoreMove.ppUsed = Math.max(ppRestoreMove.ppUsed - 10, 0);
        pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` restored PP to its move ${ppRestoreMove.getName()}\nusing its ${getBerryName(berryType)}!`));
      };
  }
}