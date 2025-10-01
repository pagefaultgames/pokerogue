import { globalScene } from "#app/global-scene";
import type { PokemonSpecies } from "#data/pokemon-species";
import { getTypeDamageMultiplier } from "#data/type";
import { AbilityId } from "#enums/ability-id";
import { ChallengeType } from "#enums/challenge-type";
import type { PartyMemberStrength } from "#enums/party-member-strength";
import { MAX_POKEMON_TYPE, PokemonType } from "#enums/pokemon-type";
import type { SpeciesId } from "#enums/species-id";
import { TrainerSlot } from "#enums/trainer-slot";
import type { EnemyPokemon } from "#field/pokemon";
import { RIVAL_6_POOL, type RivalPoolConfig } from "#trainers/rival-party-config";
import type { Mutable } from "#types/type-helpers";
import { applyChallenges } from "#utils/challenge-utils";
import { NumberHolder, randSeedItem } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import { getPokemonSpecies } from "#utils/pokemon-utils";

/** The maximum number of shared weaknesses to tolerate when balancing weakness */
const MAX_SHARED_WEAKNESSES = 2;
const MAX_SHARED_TYPES = 1;

/** Record of the chosen indices in the rival species pool, for type balancing based on the final fight */
const CHOSEN_RIVAL_ROLLS: (undefined | [number] | [number, number])[] = new Array(6);

/**
 * Return the species from the rival species pool based on a previously chosen roll
 * @param param0 - The chosen rolls for the rival species pool
 * @param pool - The rival species pool for the slot
 * @returns - A `SpeciesId` if found, or `undefined` if no species exists at the chosen roll
 */
function rivalRollToSpecies(
  [roll1, roll2]: [number] | [number, number],
  pool: readonly (SpeciesId | readonly SpeciesId[])[],
): SpeciesId | undefined {
  // Drop readonly because typescript does not preserve it with its `isArray` signature
  const pull1 = pool[roll1] as Mutable<(typeof pool)[number]>;
  if (!Array.isArray(pull1)) {
    return pull1;
  }
  if (roll2 == null) {
    return;
  }

  return pull1[roll2];
}

/**
 * Calculates the types that the given species is weak to
 *
 * @remarks
 * - Considers Levitate as a guaranteed ability if the species has it as all 3 possible abilities.
 * - Accounts for type effectiveness challenges via {@linkcode applyChallenges}
 *
 * @privateRemarks
 * Despite potentially being a useful utility method, this is intentionally *not*
 * exported because it uses logic specific to this file, such as excluding the second type for Tera starters
 *
 * @param species - The species to calculate weaknesses for
 * @param exclude2ndType - (default `false`) Whether to exclude the second type when calculating weaknesses
 *  Intended to be used for starters since they will terastallize to their primary type.
 * @returns The set of types that the species is weak to
 */
function getWeakTypes(species: PokemonSpecies, exclude2ndType = false): Set<PokemonType> {
  const weaknesses = new Set<PokemonType>();
  const alwaysHasLevitate =
    species.ability1 === AbilityId.LEVITATE
    && (species.ability2 == null || species.ability2 !== AbilityId.LEVITATE)
    && (species.abilityHidden == null || species.abilityHidden !== AbilityId.LEVITATE);
  for (const ty of getEnumValues(PokemonType)) {
    if (
      ty === PokemonType.UNKNOWN
      || ty === PokemonType.STELLAR
      || ty > MAX_POKEMON_TYPE
      || (ty === PokemonType.GROUND && alwaysHasLevitate)
    ) {
      continue;
    }
    const multiplier = new NumberHolder(getTypeDamageMultiplier(ty, species.type1));
    applyChallenges(ChallengeType.TYPE_EFFECTIVENESS, multiplier);

    if (multiplier.value >= 2 && !exclude2ndType) {
      const type2 = species.type2;
      if (type2 != null) {
        const multiplier2 = new NumberHolder(getTypeDamageMultiplier(ty, type2));
        applyChallenges(ChallengeType.TYPE_EFFECTIVENESS, multiplier2);
        multiplier.value *= multiplier2.value;
      }
    }
    if (multiplier.value >= 2) {
      weaknesses.add(ty);
    }
  }

  return weaknesses;
}

/**
 * Calculate the existing types and weaknesses in the party up to the target slot
 * @param targetSlot - The slot we are calculating up to (exclusive)
 * @param config - The current rival pool configuration
 * @param referenceConfig - (default {@linkcode RIVAL_6_POOL}); The reference rival pool configuration to use for type considerations
 * @param pokemonTypes - A set that will hold the types present in the party
 * @param pokemonWeaknesses - A map that will hold the weaknesses present in the party, and their counts
 * @param balanceWeaknesses - (default `false`) Whether include weakness balancing
 */

function calcPartyTypings(
  targetSlot: number,
  pokemonTypes: Map<PokemonType, number>,
  pokemonWeaknesses: Map<PokemonType, number>,
  balanceTypes = false,
  balanceWeaknesses = false,
  referenceConfig: RivalPoolConfig = RIVAL_6_POOL,
): void {
  if (!balanceTypes && !balanceWeaknesses) {
    return;
  }
  for (let i = 0; i < targetSlot; i++) {
    const chosenRoll = CHOSEN_RIVAL_ROLLS[i];
    const refConfig = referenceConfig[i];
    // In case pokemon are somehow generating out of order, break early
    if (chosenRoll == null || refConfig == null) {
      break;
    }

    // Get the species from the roll
    const refSpecies = rivalRollToSpecies(chosenRoll, refConfig.pool);
    if (refSpecies == null) {
      continue;
    }
    const refPokeSpecies = getPokemonSpecies(refSpecies);
    const type1 = refPokeSpecies.type1;
    const type2 = refPokeSpecies.type2;
    if (balanceTypes) {
      pokemonTypes.set(type1, (pokemonTypes.get(type1) ?? 0) + 1);
      if (type2 != null) {
        pokemonTypes.set(type2, (pokemonTypes.get(type2) ?? 0) + 1);
      }
    }
    if (balanceWeaknesses) {
      for (const weakType of getWeakTypes(refPokeSpecies)) {
        pokemonWeaknesses.set(weakType, (pokemonWeaknesses.get(weakType) ?? 0) + 1);
      }
    }
  }
}

/**
 * Determine if the species can be added to the party without violating type or weakness constraints
 * @param species - The species to check
 * @param existingTypes - The existing types in the party
 * @param existingWeaknesses - The existing weaknesses in the party
 * @param balanceTypes - Whether to include type balancing
 * @param balanceWeaknesses - (default `false`) Whether to include weakness balancing
 * @returns Whether the species meets the constraints
 */
function checkTypingConstraints(
  species: SpeciesId,
  existingTypes: ReadonlyMap<PokemonType, number>,
  existingWeaknesses: ReadonlyMap<PokemonType, number>,
  balanceTypes = false,
  balanceWeaknesses = false,
): boolean {
  if (!balanceTypes && !balanceWeaknesses) {
    return true;
  }
  const { type1, type2 } = getPokemonSpecies(species);

  if (
    balanceTypes
    && ((existingTypes.get(type1) ?? 0) >= MAX_SHARED_TYPES
      || (type2 != null && (existingTypes.get(type2) ?? 0) >= MAX_SHARED_TYPES))
  ) {
    return false;
  }

  if (balanceWeaknesses) {
    const weaknesses = getWeakTypes(getPokemonSpecies(species));
    for (const weakType of weaknesses) {
      if ((existingWeaknesses.get(weakType) ?? 0) >= MAX_SHARED_WEAKNESSES) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Convert a species pool to a list of choices after filtering by type and weakness constraints
 * @param pool - The pool to convert to choices
 * @param existingTypes - The existing types in the party
 * @param existingWeaknesses - The existing weaknesses in the party
 * @param balanceTypes - (default `false`) Whether to include type balancing
 * @param balanceWeaknesses - (default `false`) Whether to include weakness balancing
 * @returns A list of choices, where each choice is either a single index or a tuple of indices for sub-pools
 */
function convertPoolToChoices(
  pool: any,
  existingTypes: ReadonlyMap<PokemonType, number>,
  existingWeaknesses: ReadonlyMap<PokemonType, number>,
  balanceTypes = false,
  balanceWeaknesses = false,
): (number | [number, number])[] {
  const choices: (number | [number, number])[] = [];

  if (balanceTypes || balanceWeaknesses) {
    for (const [i, entry] of pool.entries()) {
      // Determine if there is a type overlap
      if (
        typeof entry === "number"
        && checkTypingConstraints(entry, existingTypes, existingWeaknesses, balanceTypes, balanceWeaknesses)
      ) {
        choices.push(i);
      } else if (typeof entry !== "number") {
        for (const [j, subEntry] of entry.entries()) {
          if (checkTypingConstraints(subEntry, existingTypes, existingWeaknesses, balanceTypes, balanceWeaknesses)) {
            choices.push([i, j]);
          }
        }
      }
    }
  }

  if (choices.length === 0) {
    for (const [i, entry] of pool.entries()) {
      if (typeof entry === "number") {
        choices.push(i);
      } else {
        for (const j of entry.keys()) {
          choices.push([i, j]);
        }
      }
    }
  }

  return choices;
}

/**
 * Randomly selects one of the `Species` from `speciesPool`, determines its evolution, level, and strength.
 * Then adds Pokemon to globalScene.
 * @param config - The configuration for the rival pool fight
 * @param slot - The slot being generated for (0-5)
 * @param referenceConfig - (default {@linkcode RIVAL_6_POOL}); The final rival pool configuration to use if `config` is `RIVAL_POOL_CONFIG.FINAL`
 *
 * @throws
 * If no configuration is found for the specified slot.
 */
export function getRandomRivalPartyMemberFunc(
  config: RivalPoolConfig,
  slot: number,
  referenceConfig: RivalPoolConfig = RIVAL_6_POOL,
): (level: number, strength: PartyMemberStrength) => EnemyPokemon {
  // Protect against out of range slots.
  // Only care about this in dev to be caught during development; it will be excluded in production builds.
  if (import.meta.env.DEV && slot > config.length) {
    throw new Error(`Slot ${slot} is out of range for the provided config of length ${config.length}`);
  }
  return (level: number, _strength: PartyMemberStrength) => {
    // Protect against accidental out of bounds accesses

    // Get the configuration for the specified slot
    const { pool, postProcess, balanceTypes, balanceWeaknesses } = config[slot];

    const existingTypes = new Map<PokemonType, number>();
    const existingWeaknesses = new Map<PokemonType, number>();

    if (slot === 0) {
      // Clear out the rolls from previous rival generations
      CHOSEN_RIVAL_ROLLS.fill(undefined);
    } else if (balanceTypes || balanceWeaknesses) {
      calcPartyTypings(slot, existingTypes, existingWeaknesses, balanceTypes, balanceWeaknesses, referenceConfig);
    }

    // Filter the pool to its choices, or map it

    let species: SpeciesId | SpeciesId[];

    // When converting poool to choices, base off of the reference config
    // to use for type balancing, as we only narrow based on what the slot
    // will be in its final stage
    const choices = convertPoolToChoices(
      referenceConfig[slot].pool,
      existingTypes,
      existingWeaknesses,
      balanceTypes,
      balanceWeaknesses,
    );

    const choice = randSeedItem(choices);
    if (typeof choice === "number") {
      species = pool[choice] as SpeciesId;
      CHOSEN_RIVAL_ROLLS[slot] = [choice];
    } else {
      species = (pool[choice[0]] as SpeciesId[])[choice[1]];
      CHOSEN_RIVAL_ROLLS[slot] = choice;
    }

    return globalScene.addEnemyPokemon(
      // bang is safe here, species is guaranteed to be defined because of the above check
      getPokemonSpecies(species),
      level,
      TrainerSlot.TRAINER,
      undefined,
      false,
      undefined,
      postProcess,
    );
  };
}
