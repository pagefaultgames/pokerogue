import { globalScene } from "#app/global-scene";
import { isBeta, isDev } from "#constants/app-constants";
import { Gender } from "#data/gender";
import type { PokemonSpecies } from "#data/pokemon-species";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { Nature } from "#enums/nature";
import { SpeciesId } from "#enums/species-id";
import type { CustomDailyRunConfig, DailySeedBoss, DailySeedStarter, SerializedDailyRunConfig } from "#types/daily-run";
import type { Starter, StarterMoveset } from "#types/save-data";
import { isBetween } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import { getPokemonSpecies, getPokemonSpeciesForm } from "#utils/pokemon-utils";
import Ajv from "ajv";
import customDailyRunSchema from "./schema.json";

// TODO: move to a common utils file if or when needed elsewhere
const ajv = new Ajv({
  allErrors: true,
});

/**
 * The validator for the {@linkcode CustomDailyRunConfig}.
 */
const validate = ajv.compile(customDailyRunSchema);

/**
 * If this is Daily Mode and the seed can be parsed into json it is a Daily Event Seed.
 * @returns `true` if it is a Daily Event Seed.
 */
// todo: should there be a flag set on load to avoid revalidating the seed every time?
export function isDailyEventSeed(): boolean {
  return globalScene.gameMode.isDaily && globalScene.gameMode.dailyConfig != null;
}

/**
 * Attempt to parse the seed as a custom daily run seed.
 * @param seed - The seed string or {@linkcode CustomDailyRunConfig} to parse
 * @returns The parsed {@linkcode CustomDailyRunConfig}, or `undefined` if it can't be parsed into json or is invalid.
 */
export function parseDailySeed(seed: string): CustomDailyRunConfig | undefined {
  try {
    const config = JSON.parse(seed) as CustomDailyRunConfig;

    if (!validate(config)) {
      if (isBeta || isDev) {
        console.warn("Invalid custom daily run config:", validate.errors);
      }
      return;
    }

    if (isDev) {
      console.log("Using a custom config for the daily run:", config);
    }
    return config;
  } catch {
    return;
  }
}

/**
 * Serialize the daily run config for saving.
 * @returns The {@linkcode SerializedDailyRunConfig}, or `undefined` if it is not a daily event seed.
 */
export function getSerializedDailyRunConfig(): SerializedDailyRunConfig | undefined {
  if (!isDailyEventSeed() || globalScene.gameMode.dailyConfig == null) {
    return;
  }

  const { seed, boss, luck, forcedWaves } = globalScene.gameMode.dailyConfig;
  return {
    seed,
    boss,
    luck,
    forcedWaves,
  } satisfies SerializedDailyRunConfig;
}

export function isDailyFinalBoss() {
  return globalScene.gameMode.isDaily && globalScene.gameMode.isWaveFinal(globalScene.currentBattle.waveIndex);
}

/**
 * Validate the {@linkcode DailySeedStarter | starter config} for a custom daily run starter.
 * @param config - The {@linkcode DailySeedStarter | starter config} to validate
 * @returns The validated starter config with all invalid properties removed.
 * Returns `null` if a required property is found to be invalid.
 */
export function validateDailyStarterConfig(config: DailySeedStarter): DailySeedStarter | null {
  if (!config.speciesId || !getEnumValues(SpeciesId).includes(config.speciesId)) {
    console.warn("Invalid species ID used for custom daily run seed starter:", config.speciesId);
    return null;
  }

  if (config.formIndex != null) {
    const speciesForm = getPokemonSpeciesForm(config.speciesId, config.formIndex);
    config.formIndex = speciesForm.formIndex;
  }

  if (config.variant != null && !isBetween(config.variant, 0, 2)) {
    console.warn("Invalid variant used for custom daily run seed starter:", config.variant);
    config.variant = undefined;
  }

  // Fall back to default variant if none exists
  const starterSpecies = getPokemonSpecies(config.speciesId);
  if (config.variant != null && !starterSpecies.hasVariants()) {
    console.warn("Variant for custom daily run seed starter does not exist, using base variant...", config.variant);
    config.variant = 0;
  }

  if (config.nature != null && !getEnumValues(Nature).includes(config.nature)) {
    console.warn("Invalid nature used for custom daily run seed starter:", config.nature);
    config.nature = undefined;
  }

  if (config.abilityIndex != null && !isBetween(config.abilityIndex, 0, 2)) {
    console.warn("Invalid ability index used for custom daily run seed starter:", config.abilityIndex);
    config.abilityIndex = undefined;
  }

  return config;
}

/**
 * Validate the {@linkcode DailySeedBoss | boss config} for a custom daily boss.
 * @param config - The {@linkcode DailySeedBoss | boss config} to validate.
 * @returns The validated boss config with all invalid properties removed.
 * Returns `null` if a required property is found to be invalid.
 */
export function validateDailyBossConfig(config: DailySeedBoss): DailySeedBoss | null {
  if (!config.speciesId || !getEnumValues(SpeciesId).includes(config.speciesId)) {
    console.warn("Invalid species ID used for custom daily run seed boss:", config.speciesId);
    return null;
  }

  if (config.formIndex != null) {
    const speciesForm = getPokemonSpeciesForm(config.speciesId, config.formIndex);
    config.formIndex = speciesForm.formIndex;
  }

  if (config.variant != null && !isBetween(config.variant, 0, 2)) {
    console.warn("Invalid variant used for custom daily run seed boss:", config.variant);
    config.variant = undefined;
  }

  // Fall back to default variant if none exists
  const starterSpecies = getPokemonSpecies(config.speciesId);
  if (config.variant != null && !starterSpecies.hasVariants()) {
    console.warn("Variant for custom daily run seed boss does not exist, using base variant...", config.variant);
    config.variant = 0;
  }

  if (config.nature != null && !getEnumValues(Nature).includes(config.nature)) {
    console.warn("Invalid nature used for custom daily run seed boss:", config.nature);
    config.nature = undefined;
  }

  if (config.moveset != null) {
    const validMoveIds = getEnumValues(MoveId);
    config.moveset = config.moveset.filter(moveId => {
      if (!validMoveIds.includes(moveId)) {
        console.warn("Invalid move ID used for custom daily run boss:", moveId);
        return false;
      }
      return true;
    }) as StarterMoveset;
  }

  const abilityIds = getEnumValues(AbilityId);
  if (config.ability != null && !abilityIds.includes(config.ability)) {
    console.warn("Invalid ability used for custom daily run seed boss:", config.ability);
    config.ability = undefined;
  }

  if (config.passive != null && !abilityIds.includes(config.passive)) {
    console.warn("Invalid passive used for custom daily run seed boss:", config.passive);
    config.passive = undefined;
  }

  return config;
}

/**
 * Creates a {@linkcode Starter}.
 * @param species - The species of the starter.
 * @param config - The {@linkcode DailySeedStarter | custom config} for the starter.
 */
export function getDailyRunStarter(species: PokemonSpecies, config?: DailySeedStarter): Starter {
  const startingLevel = globalScene.gameMode.getStartingLevel();

  const isShiny = config?.variant != null;
  const pokemon = globalScene.addPlayerPokemon(
    species,
    startingLevel,
    config?.abilityIndex,
    config?.formIndex,
    undefined,
    isShiny,
    config?.variant,
    undefined,
    config?.nature,
  );

  const starter: Starter = {
    speciesId: species.speciesId,
    shiny: pokemon.shiny,
    variant: pokemon.variant,
    formIndex: pokemon.formIndex,
    ivs: pokemon.ivs,
    abilityIndex: pokemon.abilityIndex,
    passive: false,
    nature: pokemon.getNature(),
    pokerus: pokemon.pokerus,
    female: pokemon.gender === Gender.FEMALE,
  };
  pokemon.destroy();
  return starter;
}
