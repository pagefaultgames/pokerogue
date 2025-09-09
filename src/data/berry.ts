import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { getStatusEffectHealText } from "#data/status-effect";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { HitResult } from "#enums/hit-result";
import { type BattleStat, Stat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import { NumberHolder, randSeedInt, toDmgValue } from "#utils/common";
import i18next from "i18next";

export function getBerryName(berryType: BerryType): string {
  return i18next.t(`berry:${BerryType[berryType].toLowerCase()}.name`);
}

export function getBerryEffectDescription(berryType: BerryType): string {
  return i18next.t(`berry:${BerryType[berryType].toLowerCase()}.effect`);
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
        pokemon.turnData.attacksReceived.filter(a => a.result === HitResult.SUPER_EFFECTIVE).length > 0;
    case BerryType.LIECHI:
    case BerryType.GANLON:
    case BerryType.PETAYA:
    case BerryType.APICOT:
    case BerryType.SALAC:
      return (pokemon: Pokemon) => {
        const hpRatioReq = new NumberHolder(0.25);
        // Offset BerryType such that LIECHI -> Stat.ATK = 1, GANLON -> Stat.DEF = 2, so on and so forth
        const stat: BattleStat = berryType - BerryType.ENIGMA;
        applyAbAttrs("ReduceBerryUseThresholdAbAttr", { pokemon, hpRatioReq });
        return pokemon.getHpRatio() < hpRatioReq.value && pokemon.getStatStage(stat) < 6;
      };
    case BerryType.LANSAT:
      return (pokemon: Pokemon) => {
        const hpRatioReq = new NumberHolder(0.25);
        applyAbAttrs("ReduceBerryUseThresholdAbAttr", { pokemon, hpRatioReq });
        return pokemon.getHpRatio() < 0.25 && !pokemon.getTag(BattlerTagType.CRIT_BOOST);
      };
    case BerryType.STARF:
      return (pokemon: Pokemon) => {
        const hpRatioReq = new NumberHolder(0.25);
        applyAbAttrs("ReduceBerryUseThresholdAbAttr", { pokemon, hpRatioReq });
        return pokemon.getHpRatio() < 0.25;
      };
    case BerryType.LEPPA:
      return (pokemon: Pokemon) => {
        const hpRatioReq = new NumberHolder(0.25);
        applyAbAttrs("ReduceBerryUseThresholdAbAttr", { pokemon, hpRatioReq });
        return !!pokemon.getMoveset().find(m => !m.getPpRatio());
      };
  }
}

export type BerryEffectFunc = (consumer: Pokemon) => void;

export function getBerryEffectFunc(berryType: BerryType): BerryEffectFunc {
  return (consumer: Pokemon) => {
    // Apply an effect pertaining to what berry we're using
    switch (berryType) {
      case BerryType.SITRUS:
      case BerryType.ENIGMA:
        {
          const hpHealed = new NumberHolder(toDmgValue(consumer.getMaxHp() / 4));
          applyAbAttrs("DoubleBerryEffectAbAttr", { pokemon: consumer, effectValue: hpHealed });
          globalScene.phaseManager.unshiftNew(
            "PokemonHealPhase",
            consumer.getBattlerIndex(),
            hpHealed.value,
            i18next.t("battle:hpHealBerry", {
              pokemonNameWithAffix: getPokemonNameWithAffix(consumer),
              berryName: getBerryName(berryType),
            }),
            true,
          );
        }
        break;
      case BerryType.LUM:
        {
          if (consumer.status) {
            globalScene.phaseManager.queueMessage(
              getStatusEffectHealText(consumer.status.effect, getPokemonNameWithAffix(consumer)),
            );
          }
          consumer.resetStatus(true, true);
          consumer.updateInfo();
        }
        break;
      case BerryType.LIECHI:
      case BerryType.GANLON:
      case BerryType.PETAYA:
      case BerryType.APICOT:
      case BerryType.SALAC:
        {
          // Offset BerryType such that LIECHI --> Stat.ATK = 1, GANLON --> Stat.DEF = 2, etc etc.
          const stat: BattleStat = berryType - BerryType.ENIGMA;
          const statStages = new NumberHolder(1);
          applyAbAttrs("DoubleBerryEffectAbAttr", { pokemon: consumer, effectValue: statStages });
          globalScene.phaseManager.unshiftNew(
            "StatStageChangePhase",
            consumer.getBattlerIndex(),
            true,
            [stat],
            statStages.value,
          );
        }
        break;

      case BerryType.LANSAT:
        {
          consumer.addTag(BattlerTagType.CRIT_BOOST);
        }
        break;

      case BerryType.STARF:
        {
          const randStat = randSeedInt(Stat.SPD, Stat.ATK);
          const stages = new NumberHolder(2);
          applyAbAttrs("DoubleBerryEffectAbAttr", { pokemon: consumer, effectValue: stages });
          globalScene.phaseManager.unshiftNew(
            "StatStageChangePhase",
            consumer.getBattlerIndex(),
            true,
            [randStat],
            stages.value,
          );
        }
        break;

      case BerryType.LEPPA:
        {
          // Pick the first move completely out of PP, or else the first one that has any PP missing
          const ppRestoreMove =
            consumer.getMoveset().find(m => m.ppUsed === m.getMovePp())
            ?? consumer.getMoveset().find(m => m.ppUsed < m.getMovePp());
          if (ppRestoreMove) {
            ppRestoreMove.ppUsed = Math.max(ppRestoreMove.ppUsed - 10, 0);
            globalScene.phaseManager.queueMessage(
              i18next.t("battle:ppHealBerry", {
                pokemonNameWithAffix: getPokemonNameWithAffix(consumer),
                moveName: ppRestoreMove.getName(),
                berryName: getBerryName(berryType),
              }),
            );
          }
        }
        break;
      default:
        console.error("Incorrect BerryType %d passed to GetBerryEffectFunc", berryType);
    }
  };
}
