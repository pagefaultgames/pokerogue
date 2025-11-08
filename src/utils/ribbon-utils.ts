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

    for (const form of checkingSpecies.forms) {
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
      return "classic";
    case RibbonData.NUZLOCKE:
      return "nuzlocke";
    case RibbonData.FRIENDSHIP:
      return "friendship";
    case RibbonData.FLIP_STATS:
      return "flipStats";
    case RibbonData.INVERSE:
      return "inverse";
    case RibbonData.FRESH_START:
      return "freshStart";
    case RibbonData.HARDCORE:
      return "hardcore";
    case RibbonData.LIMITED_CATCH:
      return "limitedCatch";
    case RibbonData.NO_HEAL:
      return "noHeal";
    case RibbonData.NO_SHOP:
      return "noShop";
    case RibbonData.NO_SUPPORT:
      return "noSupport";
    case RibbonData.MONO_NORMAL:
      return "monoNormal";
    case RibbonData.MONO_FIGHTING:
      return "monoFighting";
    case RibbonData.MONO_FLYING:
      return "monoFlying";
    case RibbonData.MONO_POISON:
      return "monoPoison";
    case RibbonData.MONO_GROUND:
      return "monoGround";
    case RibbonData.MONO_ROCK:
      return "monoRock";
    case RibbonData.MONO_BUG:
      return "monoBug";
    case RibbonData.MONO_GHOST:
      return "monoGhost";
    case RibbonData.MONO_STEEL:
      return "monoSteel";
    case RibbonData.MONO_FIRE:
      return "monoFire";
    case RibbonData.MONO_WATER:
      return "monoWater";
    case RibbonData.MONO_GRASS:
      return "monoGrass";
    case RibbonData.MONO_ELECTRIC:
      return "monoElectric";
    case RibbonData.MONO_PSYCHIC:
      return "monoPsychic";
    case RibbonData.MONO_ICE:
      return "monoIce";
    case RibbonData.MONO_DRAGON:
      return "monoDragon";
    case RibbonData.MONO_DARK:
      return "monoDark";
    case RibbonData.MONO_FAIRY:
      return "monoFairy";
    case RibbonData.MONO_GEN_1:
      return "monoGen1";
    case RibbonData.MONO_GEN_2:
      return "monoGen2";
    case RibbonData.MONO_GEN_3:
      return "monoGen3";
    case RibbonData.MONO_GEN_4:
      return "monoGen4";
    case RibbonData.MONO_GEN_5:
      return "monoGen5";
    case RibbonData.MONO_GEN_6:
      return "monoGen6";
    case RibbonData.MONO_GEN_7:
      return "monoGen7";
    case RibbonData.MONO_GEN_8:
      return "monoGen8";
    case RibbonData.MONO_GEN_9:
      return "monoGen9";
    default:
      return "";
  }
}

/**
 * This list is used to determined the display order of ribbons in the Pokédex.
 */
export const orderedRibbons: RibbonFlag[] = [
  RibbonData.CLASSIC,
  RibbonData.FRIENDSHIP,
  RibbonData.FRESH_START,
  RibbonData.HARDCORE,
  RibbonData.LIMITED_CATCH,
  RibbonData.NUZLOCKE,
  RibbonData.NO_HEAL,
  RibbonData.NO_SHOP,
  RibbonData.NO_SUPPORT,
  RibbonData.MONO_GEN_1,
  RibbonData.MONO_GEN_2,
  RibbonData.MONO_GEN_3,
  RibbonData.MONO_GEN_4,
  RibbonData.MONO_GEN_5,
  RibbonData.MONO_GEN_6,
  RibbonData.MONO_GEN_7,
  RibbonData.MONO_GEN_8,
  RibbonData.MONO_GEN_9,
  RibbonData.MONO_NORMAL,
  RibbonData.MONO_FIGHTING,
  RibbonData.MONO_FLYING,
  RibbonData.MONO_POISON,
  RibbonData.MONO_GROUND,
  RibbonData.MONO_ROCK,
  RibbonData.MONO_BUG,
  RibbonData.MONO_GHOST,
  RibbonData.MONO_STEEL,
  RibbonData.MONO_FIRE,
  RibbonData.MONO_WATER,
  RibbonData.MONO_GRASS,
  RibbonData.MONO_ELECTRIC,
  RibbonData.MONO_PSYCHIC,
  RibbonData.MONO_ICE,
  RibbonData.MONO_DRAGON,
  RibbonData.MONO_DARK,
  RibbonData.MONO_FAIRY,
  RibbonData.INVERSE,
  RibbonData.FLIP_STATS,
];
