export enum Stat {
  HP = 0,
  ATK,
  DEF,
  SPATK,
  SPDEF,
  SPD
};

export function getStatName(stat: Stat, shorten: boolean = false) {
  let ret: string;
  switch (stat) {
    case Stat.HP:
      ret = !shorten ? 'Max. HP' : 'MaxHP';
      break;
    case Stat.ATK:
      ret = !shorten ? 'Attack' : 'Atk';
      break;
    case Stat.DEF:
      ret = !shorten ? 'Defense' : 'Def';
      break;
    case Stat.SPATK:
      ret = !shorten ? 'Sp. Atk' : 'SpAtk';
      break;
    case Stat.SPDEF:
      ret = !shorten ? 'Sp. Def' : 'SpDef';
      break;
    case Stat.SPD:
      ret = !shorten ? 'Speed' : 'Spd';
      break;
  }
  return ret;
}