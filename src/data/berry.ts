import { PokemonHealPhase, StatChangePhase } from "../phases";
import { getPokemonMessage } from "../messages";
import Pokemon, { HitResult } from "../field/pokemon";
import { BattleStat } from "./battle-stat";
import { BattlerTagType } from "./enums/battler-tag-type";
import { getStatusEffectHealText } from "./status-effect";
import * as Utils from "../utils";
import { DoubleBerryEffectAbAttr, ReduceBerryUseThresholdAbAttr, applyAbAttrs } from "./ability";
import i18next from "../plugins/i18n";
import { BerryType } from "./enums/berry-type";

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
      if (pokemon.battleData) {
        pokemon.battleData.berriesEaten.push(berryType);
      }
      const hpHealed = new Utils.NumberHolder(Math.floor(pokemon.getMaxHp() / 4));
      applyAbAttrs(DoubleBerryEffectAbAttr, pokemon, null, hpHealed);
      pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.getBattlerIndex(),
        hpHealed.value, getPokemonMessage(pokemon, `'s ${getBerryName(berryType)}\nrestored its HP!`), true));
    };
  case BerryType.LUM:
    return (pokemon: Pokemon) => {
      if (pokemon.battleData) {
        pokemon.battleData.berriesEaten.push(berryType);
      }
      if (pokemon.status) {
        pokemon.scene.queueMessage(getPokemonMessage(pokemon, getStatusEffectHealText(pokemon.status.effect)));
      }
      pokemon.resetStatus(true, true);
      pokemon.updateInfo();
    };
  case BerryType.LIECHI:
  case BerryType.GANLON:
  case BerryType.PETAYA:
  case BerryType.APICOT:
  case BerryType.SALAC:
    return (pokemon: Pokemon) => {
      if (pokemon.battleData) {
        pokemon.battleData.berriesEaten.push(berryType);
      }
      const battleStat = (berryType - BerryType.LIECHI) as BattleStat;
      const statLevels = new Utils.NumberHolder(1);
      applyAbAttrs(DoubleBerryEffectAbAttr, pokemon, null, statLevels);
      pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ battleStat ], statLevels.value));
    };
  case BerryType.LANSAT:
    return (pokemon: Pokemon) => {
      if (pokemon.battleData) {
        pokemon.battleData.berriesEaten.push(berryType);
      }
      pokemon.addTag(BattlerTagType.CRIT_BOOST);
    };
  case BerryType.STARF:
    return (pokemon: Pokemon) => {
      if (pokemon.battleData) {
        pokemon.battleData.berriesEaten.push(berryType);
      }
      const statLevels = new Utils.NumberHolder(2);
      applyAbAttrs(DoubleBerryEffectAbAttr, pokemon, null, statLevels);
      pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ BattleStat.RAND ], statLevels.value));
    };
  case BerryType.LEPPA:
    return (pokemon: Pokemon) => {
      if (pokemon.battleData) {
        pokemon.battleData.berriesEaten.push(berryType);
      }
      const ppRestoreMove = pokemon.getMoveset().find(m => !m.getPpRatio()) ? pokemon.getMoveset().find(m => !m.getPpRatio()) : pokemon.getMoveset().find(m => m.getPpRatio() < 1);
      if (ppRestoreMove !== undefined) {
        ppRestoreMove.ppUsed = Math.max(ppRestoreMove.ppUsed - 10, 0);
        pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` restored PP to its move ${ppRestoreMove.getName()}\nusing its ${getBerryName(berryType)}!`));
      }
    };
  }
}
