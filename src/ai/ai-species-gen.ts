import { globalScene } from "#app/global-scene";
import type { SpeciesFormEvolution } from "#balance/pokemon-evolutions";
import { pokemonEvolutions, pokemonPrevolutions } from "#balance/pokemon-evolutions";
import type { PokemonSpecies } from "#data/pokemon-species";
import { EvoLevelThresholdKind } from "#enums/evo-level-threshold-kind";
import { PartyMemberStrength } from "#enums/party-member-strength";
import type { SpeciesId } from "#enums/species-id";
import { randSeedInt, randSeedItem } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";

/**
 * Controls the maximum level difference that a Pokémon spawned with
 * {@linkcode EvoLevelThresholdKind.NORMAL} is allowd to remain unevolved.
 */
const NORMAL_TRAINER_LEVEL_DIFF_PERCENT = 0.1;
/**
 * Controls the maximum level difference that a Pokémon spawned with
 * {@linkcode EvoLevelThresholdKind.WILD} is allowd to remain unevolved.
 */
const WILD_LEVEL_DIFF_PERCENT = 0.2;
/**
 * Controls the maximum level difference that a Pokémon spawned with
 * {@linkcode EvoLevelThresholdKind.} is allowd to remain unevolved.
 */
const STRONG_LEVEL_DIFF_PERCENT = 0;

/**
 * Get the evolution threshold for the given evolution, or `0` for ineligible
 * @param ev - The evolution to consider
 * @param level - The level of the Pokémon
 * @param evolutionPool - The pool of evolutions to add to
 * @returns The level threshold required for the evolution, or `0` if not eligible
 */
function calcEvoChance(ev: SpeciesFormEvolution, level: number, encounterKind: EvoLevelThresholdKind): number {
  /** The level requirement based on the trainer type */
  const levelThreshold = Math.max(ev.level, ev.evoLevelThreshold?.[encounterKind] ?? 0);
  // Disallow evolution if the level is below its required threshold.
  if (level < ev.level || level < levelThreshold) {
    return 0;
  }
  return levelThreshold;
}

/**
 * If the Pokémon is below the required level threshold for its species, return the
 * first pre-evolution that meets the level requirement.
 * @param species - The species to consider
 * @param level - The level the Pokémon will be
 * @param encounterKind - The kind of evolution threshold to use
 * @returns The speciesId of the forced prevolution, or `null` if none is required.
 *
 * @remarks
 * Forced prevolutions do *not* apply the randomness factor. That is, if the
 * Pokémon evolves multiple times and its level is currently near (but above)
 * the level requirement for its stage 2, it will always return the stage 2
 * evolution. For example, if the provided species is Venusaur, but the spawn
 * level is level 17 (bulbasaur evolves at 16), then it will *always* return
 * Ivysaur with *no* chance for Bulbasaur.
 *
 * @privateRemarks
 * The above limitation can be overcome, though requires more complex logic.
 *
 */
function getRequiredPrevo(
  species: PokemonSpecies,
  level: number,
  encounterKind: EvoLevelThresholdKind,
): SpeciesId | null {
  // Get the prevolution levels for this species.
  const prevolutionLevels = species.getPrevolutionLevels(true);

  // Return the base species if it's below the prevolution level threshold
  // Go in reverse order to go from earlier in evolution line to later
  // NOTE: This will *not* apply the randomness factor.
  for (let pl = prevolutionLevels.length - 1; pl >= 0; pl--) {
    const [prevoSpecies, levelReq, evoThreshold] = prevolutionLevels[pl];
    const threshold = evoThreshold?.[encounterKind] ?? levelReq;
    const req = levelReq === 1 ? threshold : Math.min(levelReq, threshold);
    if (level < req) {
      return prevoSpecies;
    }
  }

  return null;
}

/**
 * Determine the species of an enemy Pokémon, based on various factors.
 *
 * @param species - The species to consider
 * @param level - The level the Pokémon will be
 * @param allowEvolving - Whether to allow evolution; default `false`
 * @param forTrainer - Whether the Pokémon is for a trainer; default `false`
 * @param strength - The strength of the party member; default {@linkcode PartyMemberStrength.WEAKER | Weaker}
 * @param encounterKind - The kind of evolution threshold to use; default {@linkcode EvoLevelThresholdKind.NORMAL | Normal} for trainers, {@linkcode EvoLevelThresholdKind.WILD | Wild} otherwise
 * @param tryForcePrevo - Whether to skip checking for prevolutions. Should only be `false` when invoked recursively; default `true`
 *
 * @remarks
 * Passing a species with split evolutions will randomly choose one of its
 * evolutions based on its level. Passing an evolved species _may_ allow a
 * pre-evolution to be chosen, based on its level, though if the pre-evolution
 * has split evolutions, it will always choose from the species line that has
 * the passed species
 *
 * @see {@link calcEvoChance}
 */
export function determineEnemySpecies(
  species: PokemonSpecies,
  level: number,
  allowEvolving = false,
  forTrainer = false,
  strength: PartyMemberStrength = PartyMemberStrength.WEAKER,
  encounterKind: EvoLevelThresholdKind = forTrainer ? EvoLevelThresholdKind.NORMAL : EvoLevelThresholdKind.WILD,
  tryForcePrevo = true,
): SpeciesId {
  const requiredPrevo =
    tryForcePrevo
    && pokemonPrevolutions.hasOwnProperty(species.speciesId)
    && getRequiredPrevo(species, level, encounterKind);
  if (requiredPrevo) {
    return requiredPrevo;
  }
  const evolutions = pokemonEvolutions[species.speciesId] ?? [];
  if (
    // If evolutions shouldn't happen, add more cases here :)
    !allowEvolving
    || evolutions.length <= 0
    || (globalScene.currentBattle?.waveIndex === 20
      && globalScene.gameMode.isClassic
      && globalScene.currentBattle.trainer)
  ) {
    return species.speciesId;
  }

  const evoPool: [number, SpeciesId][] = [];

  for (const e of evolutions) {
    const threshold = calcEvoChance(e, level, encounterKind);
    if (threshold > 0) {
      evoPool.push([threshold, e.speciesId]);
    }
  }
  if (evoPool.length === 0) {
    return species.speciesId;
  }
  const [choice, evoSpecies] = randSeedItem(evoPool);
  // Add a linearly scaling random factor to the level requirement
  // The higher the level, the more likely it is to evolve.
  // If the mon is N levels above the requirement, it has a (N - Multiplier*Requirement) / (Multiplier * Requirement) chance to evolve.
  // As an example, if the pokemon evolves at level 50, and the mon is currently level 54, and the multiplier is 0.2,
  // Then it is guaranteed to evolve by level 60, and has a 10% chance to be evolved
  let multiplier = 1;
  switch (encounterKind) {
    case EvoLevelThresholdKind.STRONG:
      multiplier = STRONG_LEVEL_DIFF_PERCENT;
      break;
    case EvoLevelThresholdKind.NORMAL:
      multiplier = NORMAL_TRAINER_LEVEL_DIFF_PERCENT;
      break;
    case EvoLevelThresholdKind.WILD:
      multiplier = WILD_LEVEL_DIFF_PERCENT;
      break;
  }

  const randomLevel = randSeedInt(choice, Math.round(choice * multiplier));
  if (randomLevel <= level) {
    return determineEnemySpecies(
      getPokemonSpecies(evoSpecies),
      level,
      true,
      forTrainer,
      strength,
      encounterKind,
      false,
    );
  }
  return species.speciesId;
}
