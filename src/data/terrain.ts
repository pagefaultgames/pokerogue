import { getPokemonNameWithAffix } from "#app/messages";
import { CommonAnim } from "#enums/move-anims-common";
import type { Pokemon } from "#field/pokemon";
import type { RGBArray } from "#types/sprite-types";
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
  public readonly terrainType: TerrainType;
  public turnsLeft: number;
  public readonly maxDuration: number;

  constructor(terrainType: TerrainType, turnsLeft = 0, maxDuration: number = turnsLeft) {
    this.terrainType = terrainType;
    this.turnsLeft = turnsLeft;
    this.maxDuration = maxDuration;
  }

  /**
   * Tick down this terrain's duration.
   * @returns Whether the current terrain should remain active (`turnsLeft > 0`)
   */
  public lapse(): boolean {
    // TODO: Add separate flag for infinite duration terrains
    if (this.turnsLeft) {
      return !!--this.turnsLeft;
    }

    return true;
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
    case TerrainType.NONE:
      return "";
  }
}

export function getTerrainColor(terrainType: TerrainType): RGBArray {
  switch (terrainType) {
    case TerrainType.MISTY:
      return [232, 136, 200];
    case TerrainType.ELECTRIC:
      return [248, 248, 120];
    case TerrainType.GRASSY:
      return [120, 200, 80];
    case TerrainType.PSYCHIC:
      return [160, 64, 160];
    case TerrainType.NONE:
      return [0, 0, 0];
  }
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
      return "";
  }
}

/**
 * Gets the animation associated with the given terrain type
 * @param terrainType - The {@linkcode TerrainType} to get the animiation for
 * @returns The {@linkcode CommonAnim} for the given terrain
 */
export function getTerrainAnim(terrainType: TerrainType): CommonAnim {
  return (CommonAnim.MISTY_TERRAIN + (terrainType - 1)) as CommonAnim;
}
