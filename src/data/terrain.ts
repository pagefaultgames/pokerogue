import { getPokemonNameWithAffix } from "#app/messages";
import type { BattlerIndex } from "#enums/battler-index";
import { PokemonType } from "#enums/pokemon-type";
import type { Pokemon } from "#field/pokemon";
import type { Move } from "#moves/move";
import { isFieldTargeted, isSpreadMove } from "#moves/move-utils";
import i18next from "i18next";

export enum TerrainType {
  NONE,
  MISTY,
  ELECTRIC,
  GRASSY,
  PSYCHIC,
}

export interface SerializedTerrain {
  terrainType: TerrainType;
  turnsLeft: number;
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
        // Cf https://bulbapedia.bulbagarden.net/wiki/Psychic_Terrain_(move)#Generation_VII
        // Psychic terrain will only cancel a move if it:
        return (
          // ... is neither spread nor field-targeted,
          !isFieldTargeted(move)
          && !isSpreadMove(move) // .. has positive final priority,
          && move.getPriority(user) > 0 // ...and is targeting at least 1 grounded opponent
          && user.getOpponents(true).some(o => targets.includes(o.getBattlerIndex()) && o.isGrounded())
        );
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

/**
 * Return the message associated with a terrain effect starting.
 * @param terrainType - The {@linkcode TerrainType} starting.
 * @returns A string containing the appropriate terrain start text.
 */
export function getTerrainStartMessage(terrainType: TerrainType): string {
  switch (terrainType) {
    case TerrainType.MISTY:
      return i18next.t("terrain:mistyStartMessage");
    case TerrainType.ELECTRIC:
      return i18next.t("terrain:electricStartMessage");
    case TerrainType.GRASSY:
      return i18next.t("terrain:grassyStartMessage");
    case TerrainType.PSYCHIC:
      return i18next.t("terrain:psychicStartMessage");
    case TerrainType.NONE:
    default:
      terrainType satisfies TerrainType.NONE;
      console.warn(`${terrainType} unexpectedly provided as terrain type to getTerrainStartMessage!`);
      return "";
  }
}

/**
 * Return the message associated with a terrain effect ceasing to exist.
 * @param terrainType - The {@linkcode TerrainType} being cleared.
 * @returns A string containing the appropriate terrain clear text.
 */
export function getTerrainClearMessage(terrainType: TerrainType): string {
  switch (terrainType) {
    case TerrainType.MISTY:
      return i18next.t("terrain:mistyClearMessage");
    case TerrainType.ELECTRIC:
      return i18next.t("terrain:electricClearMessage");
    case TerrainType.GRASSY:
      return i18next.t("terrain:grassyClearMessage");
    case TerrainType.PSYCHIC:
      return i18next.t("terrain:psychicClearMessage");
    case TerrainType.NONE:
    default:
      terrainType satisfies TerrainType.NONE;
      console.warn(`${terrainType} unexpectedly provided as terrain type to getTerrainClearMessage!`);
      return "";
  }
}

/**
 * Return the message associated with a terrain-induced move/effect blockage.
 * @param pokemon - The {@linkcode Pokemon} being protected.
 * @param terrainType - The {@linkcode TerrainType} in question
 * @returns A string containing the appropriate terrain block text.
 */
export function getTerrainBlockMessage(pokemon: Pokemon, terrainType: TerrainType): string {
  switch (terrainType) {
    case TerrainType.MISTY:
      return i18next.t("terrain:mistyBlockMessage", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      });
    case TerrainType.ELECTRIC:
    case TerrainType.GRASSY:
    case TerrainType.PSYCHIC:
      return i18next.t("terrain:defaultBlockMessage", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        terrainName: getTerrainName(terrainType),
      });
    case TerrainType.NONE:
    default:
      terrainType satisfies TerrainType.NONE;
      console.warn(`${terrainType} unexpectedly provided as terrain type to getTerrainBlockMessage!`);
      return "";
  }
}
