import { globalScene } from "#app/global-scene";
import { POKERUS_STARTER_COUNT, speciesStarterCosts } from "#balance/starters";
import { allSpecies } from "#data/data-lists";
import type { PokemonSpecies, PokemonSpeciesForm } from "#data/pokemon-species";
import type { SpeciesId } from "#enums/species-id";
import { randSeedItem } from "./common";

/**
 * Gets the {@linkcode PokemonSpecies} object associated with the {@linkcode SpeciesId} enum given
 * @param species - The {@linkcode SpeciesId} to fetch.
 * If an array of `SpeciesId`s is passed (such as for named trainer spawn pools),
 * one will be selected at random.
 * @returns The associated {@linkcode PokemonSpecies} object
 */
export function getPokemonSpecies(species: SpeciesId | SpeciesId[]): PokemonSpecies {
  if (Array.isArray(species)) {
    // TODO: this RNG roll should not be handled by this function
    species = species[Math.floor(Math.random() * species.length)];
  }
  if (species >= 2000) {
    return allSpecies.find(s => s.speciesId === species)!; // TODO: is this bang correct?
  }
  return allSpecies[species - 1];
}

/**
 * Method to get the daily list of starters with Pokerus.
 * @returns A list of starters with Pokerus
 */
export function getPokerusStarters(): PokemonSpecies[] {
  const pokerusStarters: PokemonSpecies[] = [];
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  globalScene.executeWithSeedOffset(
    () => {
      while (pokerusStarters.length < POKERUS_STARTER_COUNT) {
        const randomSpeciesId = Number.parseInt(randSeedItem(Object.keys(speciesStarterCosts)), 10);
        const species = getPokemonSpecies(randomSpeciesId);
        if (!pokerusStarters.includes(species)) {
          pokerusStarters.push(species);
        }
      }
    },
    0,
    date.getTime().toString(),
  );
  return pokerusStarters;
}

export function getFusedSpeciesName(speciesAName: string, speciesBName: string): string {
  const fragAPattern = /([a-z]{2}.*?[aeiou(?:y$)\-']+)(.*?)$/i;
  const fragBPattern = /([a-z]{2}.*?[aeiou(?:y$)\-'])(.*?)$/i;

  const [speciesAPrefixMatch, speciesBPrefixMatch] = [speciesAName, speciesBName].map(n => /^(?:[^ ]+) /.exec(n));
  const [speciesAPrefix, speciesBPrefix] = [speciesAPrefixMatch, speciesBPrefixMatch].map(m => (m ? m[0] : ""));

  if (speciesAPrefix) {
    speciesAName = speciesAName.slice(speciesAPrefix.length);
  }
  if (speciesBPrefix) {
    speciesBName = speciesBName.slice(speciesBPrefix.length);
  }

  const [speciesASuffixMatch, speciesBSuffixMatch] = [speciesAName, speciesBName].map(n => / (?:[^ ]+)$/.exec(n));
  const [speciesASuffix, speciesBSuffix] = [speciesASuffixMatch, speciesBSuffixMatch].map(m => (m ? m[0] : ""));

  if (speciesASuffix) {
    speciesAName = speciesAName.slice(0, -speciesASuffix.length);
  }
  if (speciesBSuffix) {
    speciesBName = speciesBName.slice(0, -speciesBSuffix.length);
  }

  const splitNameA = speciesAName.split(/ /g);
  const splitNameB = speciesBName.split(/ /g);

  const fragAMatch = fragAPattern.exec(speciesAName);
  const fragBMatch = fragBPattern.exec(speciesBName);

  let fragA: string;
  let fragB: string;

  fragA = splitNameA.length === 1 ? (fragAMatch ? fragAMatch[1] : speciesAName) : splitNameA.at(-1)!;

  if (splitNameB.length === 1) {
    if (fragBMatch) {
      const lastCharA = fragA.slice(fragA.length - 1);
      const prevCharB = fragBMatch[1].slice(fragBMatch.length - 1);
      fragB = (/[-']/.test(prevCharB) ? prevCharB : "") + fragBMatch[2] || prevCharB;
      if (lastCharA === fragB[0]) {
        if (/[aiu]/.test(lastCharA)) {
          fragB = fragB.slice(1);
        } else {
          const newCharMatch = new RegExp(`[^${lastCharA}]`).exec(fragB);
          if (newCharMatch?.index !== undefined && newCharMatch.index > 0) {
            fragB = fragB.slice(newCharMatch.index);
          }
        }
      }
    } else {
      fragB = speciesBName;
    }
  } else {
    fragB = splitNameB.at(-1)!;
  }

  if (splitNameA.length > 1) {
    fragA = `${splitNameA.slice(0, splitNameA.length - 1).join(" ")} ${fragA}`;
  }

  fragB = `${fragB.slice(0, 1).toLowerCase()}${fragB.slice(1)}`;

  return `${speciesAPrefix || speciesBPrefix}${fragA}${fragB}${speciesBSuffix || speciesASuffix}`;
}

export function getPokemonSpeciesForm(species: SpeciesId, formIndex: number): PokemonSpeciesForm {
  const retSpecies: PokemonSpecies =
    species >= 2000
      ? allSpecies.find(s => s.speciesId === species)! // TODO: is the bang correct?
      : allSpecies[species - 1];
  if (formIndex < retSpecies.forms?.length) {
    return retSpecies.forms[formIndex];
  }
  return retSpecies;
}
