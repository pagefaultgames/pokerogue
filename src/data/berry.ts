import { MessagePhase, PokemonHealPhase } from "../battle-phases";
import { getPokemonMessage } from "../messages";
import Pokemon from "../pokemon";
import { BattleTagType } from "./battle-tag";
import { getStatusEffectHealText } from "./status-effect";

export enum BerryType {
  SITRUS,
  LUM
}

export function getBerryName(berryType: BerryType) {
  switch (berryType) {
    case BerryType.SITRUS:
      return 'SITRUS BERRY';
    case BerryType.LUM:
      return 'LUM BERRY';
  }
}

export function getBerryEffectDescription(berryType: BerryType) {
  switch (berryType) {
    case BerryType.SITRUS:
      return 'Restores 25% HP if HP is below 50%';
    case BerryType.LUM:
      return 'Cures any non-volatile status condition and confusion';
  }
}

export type BerryPredicate = (pokemon: Pokemon) => boolean;

export function getBerryPredicate(berryType: BerryType): BerryPredicate {
  switch (berryType) {
    case BerryType.SITRUS:
      return (pokemon: Pokemon) => pokemon.getHpRatio() < 0.5;
    case BerryType.LUM:
      return (pokemon: Pokemon) => !!pokemon.status || !!pokemon.getTag(BattleTagType.CONFUSED);
  }
}

export type BerryEffectFunc = (pokemon: Pokemon) => void;

export function getBerryEffectFunc(berryType: BerryType): BerryEffectFunc {
  switch (berryType) {
    case BerryType.SITRUS:
      return (pokemon: Pokemon) => {
        pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.isPlayer(), Math.floor(pokemon.getMaxHp() / 4), getPokemonMessage(pokemon, `'s ${getBerryName(berryType)}\nrestored its HP!`), true));
      };
    case BerryType.LUM:
      return (pokemon: Pokemon) => {
        if (pokemon.status) {
          pokemon.scene.unshiftPhase(new MessagePhase(pokemon.scene,
            getPokemonMessage(pokemon, getStatusEffectHealText(pokemon.status.effect))));
          pokemon.resetStatus();
          pokemon.updateInfo();
        } else if (pokemon.getTag(BattleTagType.CONFUSED))
          pokemon.lapseTag(BattleTagType.CONFUSED);
      };
  }
}