/** biome-ignore-start lint/correctness/noUnusedImports: tsdoc imports */
import type { NewArenaEvent } from "#events/battle-scene";

/** biome-ignore-end lint/correctness/noUnusedImports: tsdoc imports */

import { OVERRIDES_COLOR } from "#app/constants/colors";
import type { BattleStyle, RandomTrainerOverride } from "#app/overrides";
import Overrides from "#app/overrides";
import { AbilityId } from "#enums/ability-id";
import type { BattleType } from "#enums/battle-type";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import type { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Nature } from "#enums/nature";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import type { Unlockables } from "#enums/unlockables";
import { WeatherType } from "#enums/weather-type";
import type { ModifierOverride } from "#modifiers/modifier-type";
import type { Variant } from "#sprites/variant";
import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";
import { coerceArray, shiftCharCodes } from "#utils/common";
import chalk from "chalk";
import { vi } from "vitest";

/**
 * Helper to handle overrides in tests
 */
export class OverridesHelper extends GameManagerHelper {
  /**
   * If `true`, removes the starting items from enemies at the start of each test.
   * @defaultValue `true`
   */
  public removeEnemyStartingItems = true;
  /**
   * If `true`, sets the shiny overrides to disable shinies at the start of each test.
   * @defaultValue `true`
   */
  public disableShinies = true;
  /**
   * If `true`, will set the IV overrides for player and enemy pokemon to `31` at the start of each test.
   * @defaultValue `true`
   */
  public normalizeIVs = true;
  /**
   * If `true`, will set the Nature overrides for player and enemy pokemon to a neutral nature at the start of each test.
   * @defaultValue `true`
   */
  public normalizeNatures = true;

  /**
   * Override the starting biome
   * @warning Any event listeners that are attached to {@linkcode NewArenaEvent} may need to be handled down the line
   * @param biome - The biome to set
   */
  public startingBiome(biome: BiomeId): this {
    this.game.scene.newArena(biome);
    this.log(`Starting biome set to ${BiomeId[biome]} (=${biome})!`);
    return this;
  }

  /**
   * Override the starting wave index
   * @param wave - The wave to set. Classic: `1`-`200`
   * @returns `this`
   */
  public startingWave(wave: number): this {
    vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(wave);
    this.log(`Starting wave set to ${wave}!`);
    return this;
  }

  /**
   * Override the player pokemon's starting level
   * @param level - The level to set
   * @returns `this`
   */
  public startingLevel(level: SpeciesId | number): this {
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(level);
    this.log(`Player Pokemon starting level set to ${level}!`);
    return this;
  }

  /**
   * Override the XP Multiplier
   * @param value - The XP multiplier to set
   * @returns `this`
   */
  public xpMultiplier(value: number): this {
    vi.spyOn(Overrides, "XP_MULTIPLIER_OVERRIDE", "get").mockReturnValue(value);
    this.log(`XP Multiplier set to ${value}!`);
    return this;
  }

  /**
   * Override the wave level cap
   * @param cap - The level cap value to set; 0 uses normal level caps and negative values
   * disable it completely
   * @returns `this`
   */
  public levelCap(cap: number): this {
    vi.spyOn(Overrides, "LEVEL_CAP_OVERRIDE", "get").mockReturnValue(cap);
    let capStr: string;
    if (cap > 0) {
      capStr = `Level cap set to ${cap}!`;
    } else if (cap < 0) {
      capStr = "Level cap disabled!";
    } else {
      capStr = "Level cap reset to default value for wave.";
    }
    this.log(capStr);
    return this;
  }

  /**
   * Override the player pokemon's starting held items
   * @param items - The items to hold
   * @returns `this`
   */
  public startingHeldItems(items: ModifierOverride[]): this {
    vi.spyOn(Overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue(items);
    this.log("Player Pokemon starting held items set to:", items);
    return this;
  }

  /**
   * Override the player pokemon's {@linkcode SpeciesId | species}
   * @param species - The {@linkcode SpeciesId | species} to set
   * @returns `this`
   */
  public starterSpecies(species: SpeciesId | number): this {
    vi.spyOn(Overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(species);
    this.log(`Player Pokemon species set to ${SpeciesId[species]} (=${species})!`);
    return this;
  }

  /**
   * Override the player pokemon to be a random fusion
   * @returns `this`
   */
  public enableStarterFusion(): this {
    vi.spyOn(Overrides, "STARTER_FUSION_OVERRIDE", "get").mockReturnValue(true);
    this.log("Player Pokemon is a random fusion!");
    return this;
  }

  /**
   * Override the player pokemon's fusion species
   * @param species - The fusion species to set
   * @returns `this`
   */
  public starterFusionSpecies(species: SpeciesId | number): this {
    vi.spyOn(Overrides, "STARTER_FUSION_SPECIES_OVERRIDE", "get").mockReturnValue(species);
    this.log(`Player Pokemon fusion species set to ${SpeciesId[species]} (=${species})!`);
    return this;
  }

  /**
   * Override the player pokemon's forms
   * @param forms - The forms to set
   * @returns `this`
   */
  public starterForms(forms: Partial<Record<SpeciesId, number>>): this {
    vi.spyOn(Overrides, "STARTER_FORM_OVERRIDES", "get").mockReturnValue(forms);
    const formsStr = Object.entries(forms)
      .map(([speciesId, formIndex]) => `${SpeciesId[speciesId]}=${formIndex}`)
      .join(", ");
    this.log(`Player Pokemon form set to: ${formsStr}!`);
    return this;
  }

  /**
   * Override the player's starting modifiers
   * @param modifiers - The modifiers to set
   * @returns `this`
   */
  public startingModifier(modifiers: ModifierOverride[]): this {
    vi.spyOn(Overrides, "STARTING_MODIFIER_OVERRIDE", "get").mockReturnValue(modifiers);
    this.log(`Player starting modifiers set to: ${modifiers}`);
    return this;
  }

  /**
   * Override the player pokemon's {@linkcode AbilityId | ability}.
   * @param ability - The {@linkcode AbilityId | ability} to set
   * @returns `this`
   */
  public ability(ability: AbilityId): this {
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(ability);
    this.log(`Player Pokemon ability set to ${AbilityId[ability]} (=${ability})!`);
    return this;
  }

  /**
   * Override the player pokemon's **passive** {@linkcode AbilityId | ability}
   * @param passiveAbility - The **passive** {@linkcode AbilityId | ability} to set
   * @returns `this`
   */
  public passiveAbility(passiveAbility: AbilityId): this {
    vi.spyOn(Overrides, "PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(passiveAbility);
    this.log(`Player Pokemon PASSIVE ability set to ${AbilityId[passiveAbility]} (=${passiveAbility})!`);
    return this;
  }

  /**
   * Forces the status of the player pokemon **passive** {@linkcode AbilityId | ability}
   * @param hasPassiveAbility - Forces the passive to be active if `true`, inactive if `false`
   * @returns `this`
   */
  public hasPassiveAbility(hasPassiveAbility: boolean | null): this {
    vi.spyOn(Overrides, "HAS_PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(hasPassiveAbility);
    if (hasPassiveAbility === null) {
      this.log("Player Pokemon PASSIVE ability no longer force enabled or disabled!");
    } else {
      this.log(`Player Pokemon PASSIVE ability is force ${hasPassiveAbility ? "enabled" : "disabled"}!`);
    }
    return this;
  }
  /**
   * Override the player pokemon's {@linkcode MoveId | moves}set
   * @param moveset - The {@linkcode MoveId | moves}set to set
   * @returns `this`
   */
  public moveset(moveset: MoveId | MoveId[]): this {
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue(moveset);
    moveset = coerceArray(moveset);
    const movesetStr = moveset.map(moveId => MoveId[moveId]).join(", ");
    this.log(`Player Pokemon moveset set to ${movesetStr} (=[${moveset.join(", ")}])!`);
    return this;
  }

  /**
   * Override the player pokemon's initial {@linkcode StatusEffect | status-effect},
   * @param statusEffect - The {@linkcode StatusEffect | status-effect} to set
   * @returns `this`
   */
  public statusEffect(statusEffect: StatusEffect): this {
    vi.spyOn(Overrides, "STATUS_OVERRIDE", "get").mockReturnValue(statusEffect);
    this.log(`Player Pokemon status-effect set to ${StatusEffect[statusEffect]} (=${statusEffect})!`);
    return this;
  }

  /**
   * Overrides the IVs of the player pokemon
   * @param ivs - If set to a number, all IVs are set to the same value. Must be between `0` and `31`!
   *
   * If set to an array, that array is applied to the pokemon's IV field as-is.
   * All values must be between `0` and `31`, and the array must be of exactly length `6`!
   *
   * If set to `null`, the override is disabled.
   * @returns `this`
   */
  public playerIVs(ivs: number | number[] | null): this {
    this.normalizeIVs = false;
    vi.spyOn(Overrides, "IVS_OVERRIDE", "get").mockReturnValue(ivs);
    if (ivs === null) {
      this.log("Player IVs override disabled!");
    } else {
      this.log(`Player IVs set to ${ivs}!`);
    }
    return this;
  }

  /**
   * Overrides the nature of the player's pokemon
   * @param nature - The nature to set, or `null` to disable the override.
   * @returns `this`
   */
  public nature(nature: Nature | null): this {
    this.normalizeNatures = false;
    vi.spyOn(Overrides, "NATURE_OVERRIDE", "get").mockReturnValue(nature);
    if (nature === null) {
      this.log("Player Nature override disabled!");
    } else {
      this.log(`Player Nature set to ${Nature[nature]} (=${nature})!`);
    }
    return this;
  }

  /**
   * Overrides the IVs of the enemy pokemon
   * @param ivs - If set to a number, all IVs are set to the same value. Must be between `0` and `31`!
   *
   * If set to an array, that array is applied to the pokemon's IV field as-is.
   * All values must be between `0` and `31`, and the array must be of exactly length `6`!
   *
   * If set to `null`, the override is disabled.
   * @returns `this`
   */
  public enemyIVs(ivs: number | number[] | null): this {
    this.normalizeIVs = false;
    vi.spyOn(Overrides, "ENEMY_IVS_OVERRIDE", "get").mockReturnValue(ivs);
    if (ivs === null) {
      this.log("Enemy IVs override disabled!");
    } else {
      this.log(`Enemy IVs set to ${ivs}!`);
    }
    return this;
  }

  /**
   * Overrides the nature of the enemy's pokemon
   * @param nature - The nature to set, or `null` to disable the override.
   * @returns `this`
   */
  public enemyNature(nature: Nature | null): this {
    this.normalizeNatures = false;
    vi.spyOn(Overrides, "ENEMY_NATURE_OVERRIDE", "get").mockReturnValue(nature);
    if (nature === null) {
      this.log("Enemy Nature override disabled!");
    } else {
      this.log(`Enemy Nature set to ${Nature[nature]} (=${nature})!`);
    }
    return this;
  }

  /**
   * Override each wave to not have standard trainer battles
   * @returns `this`
   */
  public disableTrainerWaves(): this {
    vi.spyOn(Overrides, "DISABLE_STANDARD_TRAINERS_OVERRIDE", "get").mockReturnValue(true);
    this.log("Standard trainer waves are disabled!");
    return this;
  }

  /**
   * Override the trainer chosen when a random trainer is selected.
   *
   * Does not force the battle to be a trainer battle.
   * @see {@linkcode setBattleType}
   * @returns `this`
   */
  public randomTrainer(trainer: RandomTrainerOverride | null): this {
    vi.spyOn(Overrides, "RANDOM_TRAINER_OVERRIDE", "get").mockReturnValue(trainer);
    this.log("Partner battle is forced!");
    return this;
  }

  /**
   * Force random critical hit rolls to always or never suceed.
   * @param crits - `true` to guarantee crits on eligible moves, `false` to force rolls to fail, `null` to disable override
   * @remarks This does not bypass effects that guarantee or block critical hits; it merely mocks the chance-based rolls.
   * @returns `this`
   */
  public criticalHits(crits: boolean | null): this {
    vi.spyOn(Overrides, "CRITICAL_HIT_OVERRIDE", "get").mockReturnValue(crits);
    const freq = crits === true ? "always" : crits === false ? "never" : "randomly";
    this.log(`Critical hit rolls set to ${freq} succeed!`);
    return this;
  }

  /**
   * Override the {@linkcode WeatherType | weather type}
   * @param type - The {@linkcode WeatherType | weather type} to set
   * @returns `this`
   */
  public weather(type: WeatherType): this {
    vi.spyOn(Overrides, "WEATHER_OVERRIDE", "get").mockReturnValue(type);
    this.log(`Weather set to ${WeatherType[type]} (=${type})!`);
    return this;
  }

  /**
   * Override the seed
   * @param seed - The seed to set
   * @returns `this`
   */
  public seed(seed: string): this {
    // Shift the seed here with a negative wave number, to compensate for `resetSeed()` shifting the seed itself.
    this.game.scene.setSeed(shiftCharCodes(seed, (this.game.scene.currentBattle?.waveIndex ?? 0) * -1));
    this.game.scene.resetSeed();
    this.log(`Seed set to "${seed}"!`);
    return this;
  }

  /**
   * Override the battle style (e.g., single or double).
   * @see {@linkcode Overrides.BATTLE_STYLE_OVERRIDE}
   * @param battleStyle - The battle style to set
   * @returns `this`
   */
  public battleStyle(battleStyle: BattleStyle | null): this {
    vi.spyOn(Overrides, "BATTLE_STYLE_OVERRIDE", "get").mockReturnValue(battleStyle);
    this.log(battleStyle === null ? "Battle type override disabled!" : `Battle type set to ${battleStyle}!`);
    return this;
  }

  /**
   * Override the battle type (e.g., WILD, or Trainer) for non-scripted battles.
   * @see {@linkcode Overrides.BATTLE_TYPE_OVERRIDE}
   * @param battleType - The battle type to set
   * @returns `this`
   */
  public battleType(battleType: Exclude<BattleType, BattleType.CLEAR>): this {
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue(battleType);
    this.log(
      battleType === null
        ? "Battle type override disabled!"
        : `Battle type set to ${battleType[battleType]} (=${battleType})!`,
    );
    return this;
  }

  /**
   * Override the {@linkcode SpeciesId | species} of enemy pokemon
   * @param species - The {@linkcode SpeciesId | species} to set
   * @returns `this`
   */
  public enemySpecies(species: SpeciesId | number): this {
    vi.spyOn(Overrides, "ENEMY_SPECIES_OVERRIDE", "get").mockReturnValue(species);
    this.log(`Enemy Pokemon species set to ${SpeciesId[species]} (=${species})!`);
    return this;
  }

  /**
   * Override the enemy pokemon to be a random fusion
   * @returns `this`
   */
  public enableEnemyFusion(): this {
    vi.spyOn(Overrides, "ENEMY_FUSION_OVERRIDE", "get").mockReturnValue(true);
    this.log("Enemy Pokemon is a random fusion!");
    return this;
  }

  /**
   * Override the enemy pokemon fusion species
   * @param species - The fusion species to set
   * @returns `this`
   */
  public enemyFusionSpecies(species: SpeciesId | number): this {
    vi.spyOn(Overrides, "ENEMY_FUSION_SPECIES_OVERRIDE", "get").mockReturnValue(species);
    this.log(`Enemy Pokemon fusion species set to ${SpeciesId[species]} (=${species})!`);
    return this;
  }

  /**
   * Override the {@linkcode AbilityId | ability} of enemy pokemon
   * @param ability - The {@linkcode AbilityId | ability} to set
   * @returns `this`
   */
  public enemyAbility(ability: AbilityId): this {
    vi.spyOn(Overrides, "ENEMY_ABILITY_OVERRIDE", "get").mockReturnValue(ability);
    this.log(`Enemy Pokemon ability set to ${AbilityId[ability]} (=${ability})!`);
    return this;
  }

  /**
   * Override the **passive** {@linkcode AbilityId | ability} of enemy pokemon
   * @param passiveAbility - The **passive** {@linkcode AbilityId | ability} to set
   * @returns `this`
   */
  public enemyPassiveAbility(passiveAbility: AbilityId): this {
    vi.spyOn(Overrides, "ENEMY_PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(passiveAbility);
    this.log(`Enemy Pokemon PASSIVE ability set to ${AbilityId[passiveAbility]} (=${passiveAbility})!`);
    return this;
  }

  /**
   * Forces the status of the enemy pokemon **passive** {@linkcode AbilityId | ability}
   * @param hasPassiveAbility - Forces the passive to be active if `true`, inactive if `false`
   * @returns `this`
   */
  public enemyHasPassiveAbility(hasPassiveAbility: boolean | null): this {
    vi.spyOn(Overrides, "ENEMY_HAS_PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(hasPassiveAbility);
    if (hasPassiveAbility === null) {
      this.log("Enemy Pokemon PASSIVE ability no longer force enabled or disabled!");
    } else {
      this.log(`Enemy Pokemon PASSIVE ability is force ${hasPassiveAbility ? "enabled" : "disabled"}!`);
    }
    return this;
  }

  /**
   * Override the {@linkcode MoveId | move}set of enemy pokemon
   * @param moveset - The {@linkcode MoveId | move}set to set
   * @returns `this`
   */
  public enemyMoveset(moveset: MoveId | MoveId[]): this {
    vi.spyOn(Overrides, "ENEMY_MOVESET_OVERRIDE", "get").mockReturnValue(moveset);
    moveset = coerceArray(moveset);
    const movesetStr = moveset.map(moveId => MoveId[moveId]).join(", ");
    this.log(`Enemy Pokemon moveset set to ${movesetStr} (=[${moveset.join(", ")}])!`);
    return this;
  }

  /**
   * Override the level of enemy pokemon
   * @param level - The level to set
   * @returns `this`
   */
  public enemyLevel(level: number): this {
    vi.spyOn(Overrides, "ENEMY_LEVEL_OVERRIDE", "get").mockReturnValue(level);
    this.log(`Enemy Pokemon level set to ${level}!`);
    return this;
  }

  /**
   * Override the enemy pokemon's initial {@linkcode StatusEffect | status-effect}.
   * @param statusEffect - The {@linkcode StatusEffect | status-effect} to set
   * @returns `this`
   */
  public enemyStatusEffect(statusEffect: StatusEffect): this {
    vi.spyOn(Overrides, "ENEMY_STATUS_OVERRIDE", "get").mockReturnValue(statusEffect);
    this.log(`Enemy Pokemon status-effect set to ${StatusEffect[statusEffect]} (=${statusEffect})!`);
    return this;
  }

  /**
   * Override the enemy (pokemon) held items
   * @param items the items to hold
   * @returns `this`
   */
  public enemyHeldItems(items: ModifierOverride[]): this {
    vi.spyOn(Overrides, "ENEMY_HELD_ITEMS_OVERRIDE", "get").mockReturnValue(items);
    this.log("Enemy Pokemon held items set to:", items);
    return this;
  }

  /**
   * Gives the player access to an Unlockable.
   * @param unlockable - The Unlockable(s) to enable.
   * @returns `this`
   */
  public enableUnlockable(unlockable: Unlockables[]): this {
    vi.spyOn(Overrides, "ITEM_UNLOCK_OVERRIDE", "get").mockReturnValue(unlockable);
    this.log("Temporarily unlocked the following content: ", unlockable);
    return this;
  }

  /**
   * Override the items rolled at the end of a battle
   * @param items - The items to be rolled
   * @returns `this`
   */
  public itemRewards(items: ModifierOverride[]): this {
    vi.spyOn(Overrides, "ITEM_REWARD_OVERRIDE", "get").mockReturnValue(items);
    this.log("Item rewards set to:", items);
    return this;
  }

  /**
   * Override player shininess
   * @param shininess - `true` or `false` to force the player's pokemon to be shiny or not shiny,
   *   `null` to disable the override and re-enable RNG shinies.
   * @returns `this`
   */
  public shiny(shininess: boolean | null): this {
    vi.spyOn(Overrides, "SHINY_OVERRIDE", "get").mockReturnValue(shininess);
    if (shininess === null) {
      this.log("Disabled player Pokemon shiny override!");
    } else {
      this.log(`Set player Pokemon to be ${shininess ? "" : "not "}shiny!`);
    }
    return this;
  }

  /**
   * Override player shiny variant
   * @param variant - The player's shiny variant.
   * @returns `this`
   */
  public shinyVariant(variant: Variant): this {
    vi.spyOn(Overrides, "VARIANT_OVERRIDE", "get").mockReturnValue(variant);
    this.log(`Set player Pokemon's shiny variant to ${variant}!`);
    return this;
  }

  /**
   * Override enemy shininess
   * @param shininess - `true` or `false` to force the enemy's pokemon to be shiny or not shiny,
   *   `null` to disable the override and re-enable RNG shinies.
   * @param variant - (Optional) The enemy's shiny {@linkcode Variant}.
   */
  enemyShiny(shininess: boolean | null, variant?: Variant): this {
    vi.spyOn(Overrides, "ENEMY_SHINY_OVERRIDE", "get").mockReturnValue(shininess);
    if (shininess === null) {
      this.log("Disabled enemy Pokemon shiny override!");
    } else {
      this.log(`Set enemy Pokemon to be ${shininess ? "" : "not "}shiny!`);
    }

    if (variant !== undefined) {
      vi.spyOn(Overrides, "ENEMY_VARIANT_OVERRIDE", "get").mockReturnValue(variant);
      this.log(`Set enemy shiny variant to be ${variant}!`);
    }
    return this;
  }

  /**
   * Override the enemy Pokemon to have the given amount of health segments
   * @param healthSegments - The number of segments to give
   * - `0` (default): the health segments will be handled like in the game based on wave, level and species
   * - `1`: the Pokemon will not be a boss
   * - `2`+: the Pokemon will be a boss with the given number of health segments
   * @returns `this`
   */
  public enemyHealthSegments(healthSegments: number): this {
    vi.spyOn(Overrides, "ENEMY_HEALTH_SEGMENTS_OVERRIDE", "get").mockReturnValue(healthSegments);
    this.log("Enemy Pokemon health segments set to:", healthSegments);
    return this;
  }

  /**
   * Override statuses (Paralysis and Freeze) to always or never activate
   * @param activate - `true` to force activation, `false` to force no activation, `null` to disable the override
   * @returns `this`
   */
  public statusActivation(activate: boolean | null): this {
    vi.spyOn(Overrides, "STATUS_ACTIVATION_OVERRIDE", "get").mockReturnValue(activate);
    if (activate !== null) {
      this.log(`Paralysis and Freeze forced to ${activate ? "always" : "never"} activate!`);
    } else {
      this.log("Status activation override disabled!");
    }
    return this;
  }

  /**
   * Override confusion to always or never activate
   * @param activate - `true` to force activation, `false` to force no activation, `null` to disable the override
   * @returns `this`
   */
  public confusionActivation(activate: boolean | null): this {
    vi.spyOn(Overrides, "CONFUSION_ACTIVATION_OVERRIDE", "get").mockReturnValue(activate);
    if (activate !== null) {
      this.log(`Confusion forced to ${activate ? "always" : "never"} activate!`);
    } else {
      this.log("Confusion activation override disabled!");
    }
    return this;
  }

  /**
   * Override the encounter chance for a mystery encounter.
   * @param percentage - The encounter chance in %
   * @returns `this`
   */
  public mysteryEncounterChance(percentage: number): this {
    const maxRate: number = 256; // 100%
    const rate = maxRate * (percentage / 100);
    vi.spyOn(Overrides, "MYSTERY_ENCOUNTER_RATE_OVERRIDE", "get").mockReturnValue(rate);
    this.log(`Mystery encounter chance set to ${percentage}% (=${rate})!`);
    return this;
  }

  /**
   * Override the encounter chance for a mystery encounter.
   * @param tier - The {@linkcode MysteryEncounterTier} to encounter
   * @returns `this`
   */
  public mysteryEncounterTier(tier: MysteryEncounterTier): this {
    vi.spyOn(Overrides, "MYSTERY_ENCOUNTER_TIER_OVERRIDE", "get").mockReturnValue(tier);
    this.log(`Mystery encounter tier set to ${tier}!`);
    return this;
  }

  /**
   * Override the encounter that spawns for the scene
   * @param encounterType - The {@linkcode MysteryEncounterType} of the encounter
   * @returns `this`
   */
  public mysteryEncounter(encounterType: MysteryEncounterType): this {
    vi.spyOn(Overrides, "MYSTERY_ENCOUNTER_OVERRIDE", "get").mockReturnValue(encounterType);
    this.log(`Mystery encounter override set to ${encounterType}!`);
    return this;
  }

  private log(...params: any[]) {
    console.log(chalk.hex(OVERRIDES_COLOR)(...params));
  }
}
