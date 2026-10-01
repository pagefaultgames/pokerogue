import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { getStatusEffectHealText } from "#data/status-effect";
import { BattlerTagType } from "#enums/battler-tag-type";
import { type BerryItemId, HeldItemId, HeldItemNames } from "#enums/held-item-id";
import { HitResult } from "#enums/hit-result";
import { type BattleStat, Stat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import { randSeedInt, toDmgValue } from "#utils/common";
import { ValueHolder } from "#utils/value-holder";
import i18next from "i18next";

export function getBerryKey(berryType: BerryItemId): string {
  return HeldItemNames[berryType].replace("_BERRY", "").toLowerCase();
}

export function getBerryName(berryType: BerryItemId): string {
  return i18next.t(`item:${getBerryKey(berryType)}.name`);
}

export function getBerryEffectDescription(berryType: BerryItemId): string {
  return i18next.t(`item:${getBerryKey(berryType)}.description`);
}

export type BerryPredicate = (pokemon: Pokemon) => boolean;

export function getBerryPredicate(berryType: BerryItemId): BerryPredicate {
  switch (berryType) {
    case HeldItemId.SITRUS_BERRY:
      return (pokemon: Pokemon) => pokemon.getHpRatio() < 0.5;
    case HeldItemId.LUM_BERRY:
      return (pokemon: Pokemon) => !!pokemon.status || !!pokemon.getTag(BattlerTagType.CONFUSED);
    case HeldItemId.ENIGMA_BERRY:
      return (pokemon: Pokemon) =>
        pokemon.turnData.attacksReceived.some(
          a => a.result === HitResult.SUPER_EFFECTIVE || a.result === HitResult.EXTREMELY_EFFECTIVE,
        );
    case HeldItemId.LIECHI_BERRY:
    case HeldItemId.GANLON_BERRY:
    case HeldItemId.PETAYA_BERRY:
    case HeldItemId.APICOT_BERRY:
    case HeldItemId.SALAC_BERRY:
      return (pokemon: Pokemon) => {
        const hpRatioReq = new ValueHolder(0.25);
        // Offset HeldItemId such that LIECHI -> Stat.ATK = 1, GANLON -> Stat.DEF = 2, so on and so forth
        const stat: BattleStat = berryType - HeldItemId.ENIGMA_BERRY;
        applyAbAttrs("ReduceBerryUseThresholdAbAttr", { pokemon, hpRatioReq });
        return pokemon.getHpRatio() < hpRatioReq.value && pokemon.getStatStage(stat) < 6;
      };
    case HeldItemId.LANSAT_BERRY:
      return (pokemon: Pokemon) => {
        const hpRatioReq = new ValueHolder(0.25);
        applyAbAttrs("ReduceBerryUseThresholdAbAttr", { pokemon, hpRatioReq });
        return pokemon.getHpRatio() < 0.25 && !pokemon.getTag(BattlerTagType.CRIT_BOOST);
      };
    case HeldItemId.STARF_BERRY:
      return (pokemon: Pokemon) => {
        const hpRatioReq = new ValueHolder(0.25);
        applyAbAttrs("ReduceBerryUseThresholdAbAttr", { pokemon, hpRatioReq });
        return pokemon.getHpRatio() < 0.25;
      };
    case HeldItemId.LEPPA_BERRY:
      return (pokemon: Pokemon) => {
        const hpRatioReq = new ValueHolder(0.25);
        applyAbAttrs("ReduceBerryUseThresholdAbAttr", { pokemon, hpRatioReq });
        return !!pokemon.getMoveset().find(m => !m.getPpRatio());
      };
  }
}

export type BerryEffectFunc = (consumer: Pokemon) => void;

export function getBerryEffectFunc(berryType: BerryItemId, berryPhase = false): BerryEffectFunc {
  return (consumer: Pokemon) => {
    // Apply an effect pertaining to what berry we're using
    switch (berryType) {
      case HeldItemId.SITRUS_BERRY:
      case HeldItemId.ENIGMA_BERRY:
        {
          const hpHealed = new ValueHolder(toDmgValue(consumer.getMaxHp() / 4));
          applyAbAttrs("DoubleBerryEffectAbAttr", { pokemon: consumer, effectValue: hpHealed });
          globalScene.phaseManager.unshiftNew("PokemonHealPhase", consumer.getBattlerIndex(), hpHealed.value, {
            message: i18next.t("battle:hpHealBerry", {
              pokemonNameWithAffix: getPokemonNameWithAffix(consumer),
              berryName: getBerryName(berryType),
            }),
          });
        }
        break;
      case HeldItemId.LUM_BERRY:
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
      case HeldItemId.LIECHI_BERRY:
      case HeldItemId.GANLON_BERRY:
      case HeldItemId.PETAYA_BERRY:
      case HeldItemId.APICOT_BERRY:
      case HeldItemId.SALAC_BERRY:
        {
          // Offset HeldItemId such that LIECHI --> Stat.ATK = 1, GANLON --> Stat.DEF = 2, etc etc.
          const stat: BattleStat = berryType - HeldItemId.ENIGMA_BERRY;
          const statStages = new ValueHolder(1);
          applyAbAttrs("DoubleBerryEffectAbAttr", { pokemon: consumer, effectValue: statStages });
          if (berryPhase) {
            const queuedChange = consumer.queuedBerryStatChanges.find(c => c.stat === stat);
            if (queuedChange == null) {
              consumer.queuedBerryStatChanges.push({ stat, stages: statStages.value });
            } else {
              queuedChange.stages += statStages.value;
            }
          } else {
            globalScene.phaseManager.unshiftNew("StatStageChangePhase", {
              battlerIndex: consumer.getBattlerIndex(),
              changes: [{ stat, stages: statStages.value }],
              sourcePokemon: consumer,
            });
          }
        }
        break;

      case HeldItemId.LANSAT_BERRY:
        {
          consumer.addTag(BattlerTagType.CRIT_BOOST);
        }
        break;

      case HeldItemId.STARF_BERRY:
        {
          const randStat = randSeedInt(Stat.SPD, Stat.ATK);
          const stages = new ValueHolder(2);
          applyAbAttrs("DoubleBerryEffectAbAttr", { pokemon: consumer, effectValue: stages });
          if (berryPhase) {
            const queuedChange = consumer.queuedBerryStatChanges.find(c => c.stat === randStat);
            if (queuedChange == null) {
              consumer.queuedBerryStatChanges.push({ stat: randStat, stages: stages.value });
            } else {
              queuedChange.stages += stages.value;
            }
          } else {
            globalScene.phaseManager.unshiftNew("StatStageChangePhase", {
              battlerIndex: consumer.getBattlerIndex(),
              changes: [{ stat: randStat, stages: stages.value }],
              sourcePokemon: consumer,
            });
          }
        }
        break;

      case HeldItemId.LEPPA_BERRY:
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
        console.error("Incorrect HeldItemId %d passed to GetBerryEffectFunc", berryType);
    }
  };
}
