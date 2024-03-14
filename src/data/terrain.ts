import { Type } from "./type";

export enum TerrainType {
  NONE,
  MISTY,
  ELECTRIC,
  GRASSY,
  PSYCHIC
}

export class Terrain {
  public terrainType: TerrainType;
  public turnsLeft: integer;

  constructor(terrainType: TerrainType, turnsLeft?: integer) {
    this.terrainType = terrainType;
    this.turnsLeft = turnsLeft || 0;
  }

  lapse(): boolean {
    if (this.turnsLeft)
      return !!--this.turnsLeft;

    return true;
  }

  getAttackTypeMultiplier(attackType: Type): number {
    switch (this.terrainType) {
      case TerrainType.ELECTRIC:
        if (attackType === Type.ELECTRIC)
          return 1.3;
        break;
      case TerrainType.GRASSY:
        if (attackType === Type.GRASS)
          return 1.3;
        break;
      case TerrainType.PSYCHIC:
        if (attackType === Type.PSYCHIC)
          return 1.3;
        break;
    }

    return 1;
  }
}

export function getTerrainColor(terrainType: TerrainType): [ integer, integer, integer ] {
  switch (terrainType) {
    case TerrainType.MISTY:
      return [ 232, 136, 200 ];
    case TerrainType.ELECTRIC:
      return [ 248, 248, 120 ];
    case TerrainType.GRASSY:
      return [ 120, 200, 80 ];
    case TerrainType.PSYCHIC:
      return [ 160, 64, 160 ];
  }

  return [ 0, 0, 0 ];
}