import type Pokemon from "../field/pokemon";
import type Move from "./moves/move";
import { PokemonType } from "#enums/pokemon-type";
import { ProtectAttr } from "./moves/move";
import type { BattlerIndex } from "#app/battle";
import i18next from "i18next";

export enum TerrainType {
  NONE,
  MISTY,
  ELECTRIC,
  GRASSY,
  PSYCHIC,
}

export class Terrain {
  public terrainType: TerrainType;
  public turnsLeft: number;

  constructor(terrainType: TerrainType, turnsLeft?: number) {
    this.terrainType = terrainType;
    this.turnsLeft = turnsLeft || 0;
  }

  lapse(): boolean {
    if (this.turnsLeft) {
      return !!--this.turnsLeft;
    }

    return true;
  }

  getAttackTypeMultiplier(attackType: PokemonType): number {
    switch (this.terrainType) {
      case TerrainType.ELECTRIC:
        if (attackType === PokemonType.ELECTRIC) {
          return 1.3;
        }
        break;
      case TerrainType.GRASSY:
        if (attackType === PokemonType.GRASS) {
          return 1.3;
        }
        break;
      case TerrainType.PSYCHIC:
        if (attackType === PokemonType.PSYCHIC) {
          return 1.3;
        }
        break;
    }

    return 1;
  }

  isMoveTerrainCancelled(user: Pokemon, targets: BattlerIndex[], move: Move): boolean {
    switch (this.terrainType) {
      case TerrainType.PSYCHIC:
        if (!move.hasAttr(ProtectAttr)) {
          // Cancels move if the move has positive priority and targets a Pokemon grounded on the Psychic Terrain
          return (
            move.getPriority(user) > 0 &&
            user.getOpponents(true).some(o => targets.includes(o.getBattlerIndex()) && o.isGrounded())
          );
        }
    }

    return false;
  }
}

export function getTerrainName(terrainType: TerrainType): string {
  switch (terrainType) {
    case TerrainType.MISTY:
      return i18next.t("terrain:misty");
    case TerrainType.ELECTRIC:
      return i18next.t("terrain:electric");
    case TerrainType.GRASSY:
      return i18next.t("terrain:grassy");
    case TerrainType.PSYCHIC:
      return i18next.t("terrain:psychic");
  }

  return "";
}

export function getTerrainColor(terrainType: TerrainType): [number, number, number] {
  switch (terrainType) {
    case TerrainType.MISTY:
      return [232, 136, 200];
    case TerrainType.ELECTRIC:
      return [248, 248, 120];
    case TerrainType.GRASSY:
      return [120, 200, 80];
    case TerrainType.PSYCHIC:
      return [160, 64, 160];
  }

  return [0, 0, 0];
}
