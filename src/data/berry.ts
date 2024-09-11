import { getPokemonNameWithAffix } from "../messages";
import Pokemon, { HitResult } from "../field/pokemon";
import { getStatusEffectHealText } from "./status-effect";
import * as Utils from "../utils";
import { DoubleBerryEffectAbAttr, ReduceBerryUseThresholdAbAttr, applyAbAttrs } from "./ability";
import i18next from "i18next";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { Stat, type BattleStat } from "#app/enums/stat";
import { PokemonHealPhase } from "#app/phases/pokemon-heal-phase";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";

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
      // Offset BerryType such that LIECHI -> Stat.ATK = 1, GANLON -> Stat.DEF = 2, so on and so forth
      const stat: BattleStat = berryType - BerryType.ENIGMA;
      applyAbAttrs(ReduceBerryUseThresholdAbAttr, pokemon, null, false, threshold);
      return pokemon.getHpRatio() < threshold.value && pokemon.getStatStage(stat) < 6;
    };
  case BerryType.LANSAT:
    return (pokemon: Pokemon) => {
      const threshold = new Utils.NumberHolder(0.25);
      applyAbAttrs(ReduceBerryUseThresholdAbAttr, pokemon, null, false, threshold);
      return pokemon.getHpRatio() < 0.25 && !pokemon.getTag(BattlerTagType.CRIT_BOOST);
    };
  case BerryType.STARF:
    return (pokemon: Pokemon) => {
      const threshold = new Utils.NumberHolder(0.25);
      applyAbAttrs(ReduceBerryUseThresholdAbAttr, pokemon, null, false, threshold);
      return pokemon.getHpRatio() < 0.25;
    };
  case BerryType.LEPPA:
    return (pokemon: Pokemon) => {
      const threshold = new Utils.NumberHolder(0.25);
      applyAbAttrs(ReduceBerryUseThresholdAbAttr, pokemon, null, false, threshold);
      return !!pokemon.getMoveset().find(m => !m?.getPpRatio());
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
      const hpHealed = new Utils.NumberHolder(Utils.toDmgValue(pokemon.getMaxHp() / 4));
      applyAbAttrs(DoubleBerryEffectAbAttr, pokemon, null, false, hpHealed);
      pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.getBattlerIndex(),
        hpHealed.value, i18next.t("battle:hpHealBerry", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), berryName: getBerryName(berryType) }), true));
    };
  case BerryType.LUM:
    return (pokemon: Pokemon) => {
      if (pokemon.battleData) {
        pokemon.battleData.berriesEaten.push(berryType);
      }
      if (pokemon.status) {
        pokemon.scene.queueMessage(getStatusEffectHealText(pokemon.status.effect, getPokemonNameWithAffix(pokemon)));
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
      // Offset BerryType such that LIECHI -> Stat.ATK = 1, GANLON -> Stat.DEF = 2, so on and so forth
      const stat: BattleStat = berryType - BerryType.ENIGMA;
      const statStages = new Utils.NumberHolder(1);
      applyAbAttrs(DoubleBerryEffectAbAttr, pokemon, null, false, statStages);
      pokemon.scene.unshiftPhase(new StatStageChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ stat ], statStages.value));
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
      const randStat = Utils.randSeedInt(Stat.SPD, Stat.ATK);
      const stages = new Utils.NumberHolder(2);
      applyAbAttrs(DoubleBerryEffectAbAttr, pokemon, null, false, stages);
      pokemon.scene.unshiftPhase(new StatStageChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ randStat ], stages.value));
    };
  case BerryType.LEPPA:
    return (pokemon: Pokemon) => {
      if (pokemon.battleData) {
        pokemon.battleData.berriesEaten.push(berryType);
      }
      const ppRestoreMove = pokemon.getMoveset().find(m => !m?.getPpRatio()) ? pokemon.getMoveset().find(m => !m?.getPpRatio()) : pokemon.getMoveset().find(m => m!.getPpRatio() < 1); // TODO: is this bang correct?
      if (ppRestoreMove !== undefined) {
        ppRestoreMove!.ppUsed = Math.max(ppRestoreMove!.ppUsed - 10, 0);
        pokemon.scene.queueMessage(i18next.t("battle:ppHealBerry", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), moveName: ppRestoreMove!.getName(), berryName: getBerryName(berryType) }));
      }
    };
  }
}
