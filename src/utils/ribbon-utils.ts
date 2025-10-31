import { pokemonEvolutions } from "#balance/pokemon-evolutions";
import type { PokemonSpecies } from "#data/pokemon-species";
import { PokemonType } from "#enums/pokemon-type";
import { RibbonData, type RibbonFlag } from "#system/ribbons/ribbon-data";
import { getPokemonSpecies } from "./pokemon-utils";

export function getRibbonForType(type: PokemonType): RibbonFlag {
  // Valid types: 0–17, excluding UNKNOWN (-1) and STELLAR (19)
  if (type < PokemonType.NORMAL || type > PokemonType.FAIRY) {
    return 0n;
  }
  return (1n << BigInt(type)) as RibbonFlag;
}

export function getRibbonForGeneration(gen: number): RibbonFlag {
  // Valid generations: 1–9
  if (gen < 1 || gen > 9) {
    return 0n;
  }
  return (1n << BigInt(17 + gen)) as RibbonFlag;
}

export function extractRibbons(data: bigint): RibbonFlag[] {
  const ribbons: RibbonFlag[] = [];
  let bit = 1n;

  while (bit <= data) {
    if ((data & bit) !== 0n) {
      ribbons.push(bit as RibbonFlag);
    }
    bit <<= 1n; // move to the next bit
  }

  return ribbons;
}

export function getAvailableRibbons(species: PokemonSpecies): RibbonFlag[] {
  const ribbons: RibbonFlag[] = [
    RibbonData.CLASSIC,
    RibbonData.NUZLOCKE,
    RibbonData.FRIENDSHIP,
    RibbonData.FLIP_STATS,
    RibbonData.INVERSE,
    RibbonData.FRESH_START,
    RibbonData.HARDCORE,
    RibbonData.LIMITED_CATCH,
    RibbonData.NO_HEAL,
    RibbonData.NO_SHOP,
    RibbonData.NO_SUPPORT,
  ];

  let data = 0n;

  const speciesToCheck = [species.speciesId];
  while (speciesToCheck.length > 0) {
    const checking = speciesToCheck.pop();
    if (checking == null) {
      continue;
    }
    const checkingSpecies = getPokemonSpecies(checking);

    data |= getRibbonForGeneration(checkingSpecies.generation);
    data |= getRibbonForType(checkingSpecies.type1);
    if (checkingSpecies.type2 != null) {
      data |= getRibbonForType(checkingSpecies.type2);
    }

    for (const form of species.forms) {
      data |= getRibbonForType(form.type1);
      if (form.type2 != null) {
        data |= getRibbonForType(form.type2);
      }
    }

    if (checking && pokemonEvolutions.hasOwnProperty(checking)) {
      pokemonEvolutions[checking].forEach(e => {
        speciesToCheck.push(e.speciesId);
      });
    }
  }

  const extraRibbons = extractRibbons(data);

  return ribbons.concat(extraRibbons);
}

/**
 * Get the locale key for the given ribbon flag
 * @param flag - The ribbon flag to get the key for
 */
export function getRibbonKey(flag: RibbonFlag): string {
  switch (flag) {
    case RibbonData.CLASSIC:
      return "CLASSIC";
    case RibbonData.NUZLOCKE:
      return "NUZLOCKE";
    case RibbonData.FRIENDSHIP:
      return "FRIENDSHIP";
    case RibbonData.FLIP_STATS:
      return "FLIP_STATS";
    case RibbonData.INVERSE:
      return "INVERSE";
    case RibbonData.FRESH_START:
      return "FRESH_START";
    case RibbonData.HARDCORE:
      return "HARDCORE";
    case RibbonData.LIMITED_CATCH:
      return "LIMITED_CATCH";
    case RibbonData.NO_HEAL:
      return "NO_HEAL";
    case RibbonData.NO_SHOP:
      return "NO_SHOP";
    case RibbonData.NO_SUPPORT:
      return "NO_SUPPORT";
    default:
      return "";
  }
}
