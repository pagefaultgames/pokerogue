import { MAX_TERAS_PER_ARENA } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { POKERUS_STARTER_COUNT, speciesStarterCosts } from "#balance/starters";
import { allSpecies } from "#data/data-lists";
import type { PokemonSpecies, PokemonSpeciesForm } from "#data/pokemon-species";
import { BattlerIndex } from "#enums/battler-index";
import { SpeciesId } from "#enums/species-id";
import type { EnemyPokemon, PlayerPokemon, Pokemon } from "#field/pokemon";
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
    // the `!` is safe, `allSpecies` is static and contains all `SpeciesId`s
    return allSpecies.find(s => s.speciesId === species)!;
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

/**
 * Return whether two battler indices are considered allies.
 * To instead check with {@linkcode Pokemon} objects, use {@linkcode Pokemon.isOpponent}.
 * @param a - First battler index
 * @param b - Second battler index
 * @returns Whether the two battler indices are allies. Always `false` if either index is `ATTACKER`.
 */
export function areAllies(a: BattlerIndex, b: BattlerIndex): boolean {
  if (a === BattlerIndex.ATTACKER || b === BattlerIndex.ATTACKER) {
    return false;
  }
  return (
    (a === BattlerIndex.PLAYER || a === BattlerIndex.PLAYER_2)
    === (b === BattlerIndex.PLAYER || b === BattlerIndex.PLAYER_2)
  );
}

/**
 * Determine whether an enemy Pokémon will Terastallize the user
 *
 * Does not check if the Pokémon is allowed to Terastallize (e.g., if it's a mega)
 * @param pokemon - The Pokémon to check
 * @returns Whether the Pokémon will Terastallize
 *
 * @remarks
 * Should really only be called with an enemy Pokémon, but will technically work with any Pokémon.
 *
 * @privateRemarks
 * Assumes that Pokémon without a trainer will never tera, so this must be changed if
 * a wild Pokémon is allowed to tera, e.g. for a Mystery Encounter.
 */
export function willTerastallize(pokemon: Pokemon): boolean {
  // cast is safe, as if it is just a Pokémon, initialTeamIndex will be undefined triggering the null check
  const initialTeamIndex = (pokemon as EnemyPokemon).initialTeamIndex;
  return (
    initialTeamIndex != null
    && pokemon.hasTrainer()
    && (globalScene.currentBattle?.trainer?.config.trainerAI.instantTeras.includes(initialTeamIndex) ?? false)
  );
}

/**
 * Determine whether the Pokémon's species is tera capable, and that the player has acquired the tera orb.
 * @param pokemon - The Pokémon to check
 * @returns Whether
 */
export function canSpeciesTera(pokemon: Pokemon): boolean {
  const hasTeraMod = globalScene.findModifier(modifier => modifier.is("TerastallizeAccessModifier")) != null;
  const isBlockedForm = pokemon.isMega() || pokemon.isMax() || pokemon.hasSpecies(SpeciesId.NECROZMA, "ultra");
  return hasTeraMod && !isBlockedForm;
}

/**
 * Same as {@linkcode canSpeciesTera}, but also checks that the player has not already used their tera in the arena.
 *
 * @remarks
 * ⚠️ This does not account for tera commands that may be pending, so this should not be used during command selection!
 * @param pokemon - The Pokémon to check
 * @returns Whether the Pokémon can Terastallize
 */
export function canTerastallize(pokemon: PlayerPokemon): boolean {
  const hasAvailableTeras = globalScene.arena.playerTerasUsed < MAX_TERAS_PER_ARENA;
  return hasAvailableTeras && canSpeciesTera(pokemon);
}
