import { Arena } from "../arena";
import { Type } from "./type";
import * as Utils from "../utils";

export enum ArenaTagType {
  NONE,
  MUD_SPORT,
  WATER_SPORT
}

export class ArenaTag {
  public tagType: ArenaTagType;
  public turnCount: integer;

  constructor(tagType: ArenaTagType, turnCount: integer) {
    this.tagType = tagType;
    this.turnCount = turnCount;
  }

  apply(args: any[]): boolean { 
    return true;
  }

  onAdd(arena: Arena): void { }

  onRemove(arena: Arena): void { }

  onOverlap(arena: Arena): void { }

  lapse(arena: Arena): boolean {
    return --this.turnCount > 0;
  }
}

export class WeakenTypeTag extends ArenaTag {
  private weakenedType: Type;

  constructor(tagType: ArenaTagType, turnCount: integer, type: Type) {
    super(tagType, turnCount);

    this.weakenedType = type;
  }

  apply(args: any[]): boolean {
    if ((args[0] as Type) === this.weakenedType) {
      (args[1] as Utils.NumberHolder).value *= 0.33;
      return true;
    }

    return false;
  }
}

class MudSportTag extends WeakenTypeTag {
  constructor(turnCount: integer) {
    super(ArenaTagType.MUD_SPORT, turnCount, Type.ELECTRIC);
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage('Electricity\'s power was weakened!');
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage('MUD SPORT\'s effect wore off.');
  }
}

class WaterSportTag extends WeakenTypeTag {
  constructor(turnCount: integer) {
    super(ArenaTagType.WATER_SPORT, turnCount, Type.FIRE);
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage('Fire\'s power was weakened!');
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage('WATER SPORT\'s effect wore off.');
  }
}

export function getArenaTag(tagType: ArenaTagType, turnCount: integer): ArenaTag {
  switch (tagType) {
    case ArenaTagType.MUD_SPORT:
      return new MudSportTag(turnCount);
    case ArenaTagType.WATER_SPORT:
      return new WaterSportTag(turnCount);
  }
}