import { PokemonHealPhase, StatChangePhase } from "../battle-phases";
import { getPokemonMessage } from "../messages";
import Pokemon, { HitResult } from "../pokemon";
import { getBattleStatName } from "./battle-stat";
import { BattleStat } from "./battle-stat";
import { BattlerTagType } from "./battler-tag";
import { getStatusEffectHealText } from "./status-effect";
import * as Utils from "../utils";

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
  STARF
}

export function getBerryName(berryType: BerryType) {
  return `${Utils.toReadableString(BerryType[berryType])} Berry`;
}

export function getBerryEffectDescription(berryType: BerryType) {
  switch (berryType) {
    case BerryType.SITRUS:
      return 'Restores 25% HP if HP is below 50%';
    case BerryType.LUM:
      return 'Cures any non-volatile status condition and confusion';
    case BerryType.ENIGMA:
      return 'Restores 25% HP if hit by a super effective move';
    case BerryType.LIECHI:
    case BerryType.GANLON:
    case BerryType.PETAYA:
    case BerryType.APICOT:
    case BerryType.SALAC:
      const stat = (berryType - BerryType.LIECHI) as BattleStat;
      return `Raises ${getBattleStatName(stat)} if HP is below 25%`;
    case BerryType.LANSAT:
      return 'Raises critical hit ratio if HP is below 25%';
    case BerryType.STARF:
      return 'Sharply raises a random stat if HP is below 25%';
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
        const battleStat = (berryType - BerryType.LIECHI) as BattleStat;
        return pokemon.getHpRatio() < 0.25 && pokemon.summonData.battleStats[battleStat] < 6;
      };
    case BerryType.LANSAT:
      return (pokemon: Pokemon) => pokemon.getHpRatio() < 0.25 && !pokemon.getTag(BattlerTagType.CRIT_BOOST);
    case BerryType.STARF:
      return (pokemon: Pokemon) => pokemon.getHpRatio() < 0.25;
  }
}

export type BerryEffectFunc = (pokemon: Pokemon) => void;

export function getBerryEffectFunc(berryType: BerryType): BerryEffectFunc {
  switch (berryType) {
    case BerryType.SITRUS:
     case BerryType.ENIGMA:
      return (pokemon: Pokemon) => {
        pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.getBattlerIndex(),
          Math.floor(pokemon.getMaxHp() / 4), getPokemonMessage(pokemon, `'s ${getBerryName(berryType)}\nrestored its HP!`), true));
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
        pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ battleStat ], 1));
      };
    case BerryType.LANSAT:
      return (pokemon: Pokemon) => {
        pokemon.addTag(BattlerTagType.CRIT_BOOST);
      };
    case BerryType.STARF:
      return (pokemon: Pokemon) => pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ BattleStat.RAND ], 2));
  }
}