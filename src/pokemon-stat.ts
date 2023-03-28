import { toPokemonUpperCase } from "./utils";

export enum Stat {
  HP = 0,
  ATK,
  DEF,
  SPATK,
  SPDEF,
  SPD
};

export function getStatName(stat: Stat) {
  let ret;
  switch (stat) {
    case Stat.HP:
      ret = 'Max. HP';
      break;
    case Stat.ATK:
      ret = 'Attack';
      break;
    case Stat.DEF:
      ret = 'Defense';
      break;
    case Stat.SPATK:
      ret = 'Sp. Atk';
      break;
    case Stat.SPDEF:
      ret = 'Sp. Def';
      break;
    case Stat.SPD:
      ret = 'Speed';
      break;
  }
  return toPokemonUpperCase(ret);
}