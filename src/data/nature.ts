import { Stat, getStatName } from "./pokemon-stat";
import * as Utils from "../utils";
import { TextStyle, getBBCodeFrag } from "../ui/text";

export enum Nature {
  HARDY,
  LONELY,
  BRAVE,
  ADAMANT,
  NAUGHTY,
  BOLD,
  DOCILE,
  RELAXED,
  IMPISH,
  LAX,
  TIMID,
  HASTY,
  SERIOUS,
  JOLLY,
  NAIVE,
  MODEST,
  MILD,
  QUIET,
  BASHFUL,
  RASH,
  CALM,
  GENTLE,
  SASSY,
  CAREFUL,
  QUIRKY
}

export function getNatureName(nature: Nature, includeStatEffects: boolean = false, forStarterSelect: boolean = false): string {
  let ret = Utils.toReadableString(Nature[nature]);
  if (includeStatEffects) {
    const stats = Utils.getEnumValues(Stat).slice(1);
    let increasedStat: Stat = null;
    let decreasedStat: Stat = null;
    for (let stat of stats) {
      const multiplier = getNatureStatMultiplier(nature, stat);
      if (multiplier > 1)
        increasedStat = stat;
      else
        decreasedStat = stat;
    }
    const textStyle = forStarterSelect ? TextStyle.SUMMARY : TextStyle.WINDOW;
    if (increasedStat && decreasedStat)
      ret = `${getBBCodeFrag(`${ret}${!forStarterSelect ? '\n' : ' '}(`, textStyle)}${getBBCodeFrag(`+${getStatName(increasedStat, true)}`, TextStyle.SUMMARY_BLUE)}${getBBCodeFrag('/', textStyle)}${getBBCodeFrag(`-${getStatName(decreasedStat, true)}`, TextStyle.SUMMARY_PINK)}${getBBCodeFrag(')', textStyle)}`;
    else
      ret = getBBCodeFrag(`${ret}${!forStarterSelect ? '\n' : ' '}(-)`, textStyle);
  }
  return ret;
}

export function getNatureStatMultiplier(nature: Nature, stat: Stat): number {
  switch (stat) {
    case Stat.ATK:
      switch (nature) {
        case Nature.LONELY:
        case Nature.BRAVE:
        case Nature.ADAMANT:
        case Nature.NAUGHTY:
          return 1.1;
        case Nature.BOLD:
        case Nature.TIMID:
        case Nature.MODEST:
        case Nature.CALM:
          return 0.9;
      }
      break;
    case Stat.DEF:
      switch (nature) {
        case Nature.BOLD:
        case Nature.RELAXED:
        case Nature.IMPISH:
        case Nature.LAX:
          return 1.1;
        case Nature.LONELY:
        case Nature.HASTY:
        case Nature.MILD:
        case Nature.GENTLE:
          return 0.9;
      }
      break;
    case Stat.SPATK:
      switch (nature) {
        case Nature.MODEST:
        case Nature.MILD:
        case Nature.QUIET:
        case Nature.RASH:
          return 1.1;
        case Nature.ADAMANT:
        case Nature.IMPISH:
        case Nature.JOLLY:
        case Nature.CAREFUL:
          return 0.9;
      }
      break;
    case Stat.SPDEF:
      switch (nature) {
        case Nature.CALM:
        case Nature.GENTLE:
        case Nature.SASSY:
        case Nature.CAREFUL:
          return 1.1;
        case Nature.NAUGHTY:
        case Nature.LAX:
        case Nature.NAIVE:
        case Nature.RASH:
          return 0.9;
      }
      break;
    case Stat.SPD:
      switch (nature) {
        case Nature.TIMID:
        case Nature.HASTY:
        case Nature.JOLLY:
        case Nature.NAIVE:
          return 1.1;
        case Nature.BRAVE:
        case Nature.RELAXED:
        case Nature.QUIET:
        case Nature.SASSY:
          return 0.9;
      }
      break;
  }

  return 1;
}