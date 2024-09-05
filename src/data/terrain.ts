import Pokemon from "../field/pokemon";
import Move from "./move";
import { Type } from "./type";
import * as Utils from "../utils";
import { ChangeMovePriorityAbAttr, applyAbAttrs } from "./ability";
import { ProtectAttr } from "./move";
import { BattlerIndex } from "#app/battle.js";
import i18next from "i18next";

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
    if (this.turnsLeft) {
      return !!--this.turnsLeft;
    }

    return true;
  }

  getAttackTypeMultiplier(attackType: Type): number {
    switch (this.terrainType) {
    case TerrainType.ELECTRIC:
      if (attackType === Type.ELECTRIC) {
        return 1.3;
      }
      break;
    case TerrainType.GRASSY:
      if (attackType === Type.GRASS) {
        return 1.3;
      }
      break;
    case TerrainType.PSYCHIC:
      if (attackType === Type.PSYCHIC) {
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
        const priority = new Utils.IntegerHolder(move.priority);
        applyAbAttrs(ChangeMovePriorityAbAttr, user, null, false, move, priority);
        // Cancels move if the move has positive priority and targets a Pokemon grounded on the Psychic Terrain
        return priority.value > 0 && user.getOpponents().some(o => targets.includes(o.getBattlerIndex()) && o.isGrounded());
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
