import { OVERRIDES_COLOR } from "#app/constants/colors";
import { TerrainType } from "#app/data/terrain";
import type { BattleStyle, RandomTrainerOverride } from "#app/overrides";
import Overrides from "#app/overrides";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import type { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Nature } from "#enums/nature";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { TrainerType } from "#enums/trainer-type";
import { TrainerVariant } from "#enums/trainer-variant";
import type { Unlockables } from "#enums/unlockables";
import { WeatherType } from "#enums/weather-type";
import type { NewArenaEvent } from "#events/battle-scene";
import type { ModifierOverride } from "#modifiers/modifier-type";
import type { Variant } from "#sprites/variant";
import type { ClassicModeHelper } from "#test/test-utils/helpers/classic-mode-helper";
import type { FieldHelper } from "#test/test-utils/helpers/field-helper";
import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";
import type { MoveHelper } from "#test/test-utils/helpers/move-helper";
import { getEnumStr, stringifyEnumArray } from "#test/test-utils/string-utils";
import { coerceArray } from "#utils/array";
import { shiftCharCodes } from "#utils/common";
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
   * Override the starting biome.
   *
   * ⚠️ Any event listeners that are attached to {@linkcode NewArenaEvent} may need to be handled down the line
   * @param biome - The biome to set
   * @returns `this`
   */
  public startingBiome(biome: BiomeId): this {
    this.game.scene.newArena(biome);
    this.log(`Starting biome set to ${BiomeId[biome]} (=${biome})!`);
    return this;
  }

  /**
   * Override the starting wave index.
   * @param wave - The wave to set, or `null` to disable the override
   * @returns `this`
   */
  public startingWave(wave: number | null): this {
    if (wave != null && wave <= 0) {
      throw new Error("Attempted to set invalid wave index: " + wave.toString());
    }
    vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(wave);
    this.log(`Starting wave set to ${wave}!`);
    return this;
  }

  /**
   * Override the starting level of newly generated player Pokemon.
   * @param level - The starting level to set
   * @returns `this`
   */
  public startingLevel(level: number): this {
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
   * Override the wave level cap.
   * @param cap - The level cap value to set, or a negative number to disable level caps altogether.
   * `0` disables the override.
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
   * Override the initial species used when creating new starter Pokemon.
   * @param species - The {@linkcode SpeciesId} to set, or `null` to disable the override
   * @returns `this`
   * @deprecated
   * This override is deprecated and heavily discouraged in automated test files;
   * a similar effect can be used by passing an array of `SpeciesId`s to
   * {@linkcode ClassicModeHelper.startBattle | startBattle}
   */
  public starterSpecies(species: SpeciesId | null): this {
    vi.spyOn(Overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(species);
    if (species === null) {
      this.log("Player Pokemon starter species override disabled!");
    } else {
      this.log(`Player Pokemon species set to ${getEnumStr(SpeciesId, species)}!`);
    }
    return this;
  }

  /**
   * Override whether starter Pokemon will be fused with random Pokemon.
   * @returns `this`
   */
  public enableStarterFusion(): this {
    vi.spyOn(Overrides, "STARTER_FUSION_OVERRIDE", "get").mockReturnValue(true);
    this.log("Player Pokemon is a random fusion!");
    return this;
  }

  /**
   * Override the initial fusion species used when generating new starter Pokemon in Spliced Endless-like modes.
   * @param species - The fusion {@linkcode SpeciesId} to set, or `null` to disable the override
   * @returns `this`
   * @remarks
   * Does nothing if {@linkcode Overrides.STARTER_FUSION_OVERRIDE} is not enabled
   * @see {@linkcode enableStarterFusions}
   */
  // TODO: Should we just bundle these 2 together?
  public starterFusionSpecies(species: SpeciesId | null): this {
    vi.spyOn(Overrides, "STARTER_FUSION_SPECIES_OVERRIDE", "get").mockReturnValue(species);
    if (species === null) {
      this.log("Player Pokemon starter fusion species override disabled!");
    } else {
      this.log(`Player Pokemon starter fusion species set to ${getEnumStr(SpeciesId, species)}!`);
    }
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
   * Override the ability of all player Pokemon.
   * @param ability - The {@linkcode AbilityId} to set
   * @returns `this`
   */
  public ability(ability: AbilityId): this {
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(ability);
    if (ability === AbilityId.NONE) {
      this.log("Player Pokemon ability override disabled!");
    } else {
      this.log(`Player Pokemon ability set to ${getEnumStr(AbilityId, ability)}!`);
    }
    return this;
  }

  /**
   * Override the **passive** ability of all player Pokemon.
   * @param passive - The **passive** {@linkcode AbilityId} to set, or `AbilityId.NONE` to disable
   * @returns `this`
   * @remarks
   * Setting a custom passive ability will force said passive to always be enabled,
   * even if not unlocked.
   */
  // TODO: Review uses and make sure callers aren't mistakedly passing `AbilityId.NONE`
  public passiveAbility(passive: AbilityId): this {
    vi.spyOn(Overrides, "PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(passive);
    if (passive === AbilityId.NONE) {
      this.log("Player Pokemon passive ability override disabled!");
    } else {
      this.log(`Player Pokemon passive ability set to ${getEnumStr(AbilityId, passive)}!`);
    }
    return this;
  }

  /**
   * Override the enabled status of the passive {@linkcode AbilityId | abilities} of all player Pokemon.
   * @param hasPassive - Whether passives should be enabled/disabled, or `null` to disable the override
   * @returns `this`
   * @deprecated
   * This override should not be used - setting a custom passive ability via {@linkcode passiveAbility}
   * will forcibly enable passives without relying on individual species having specific passives.
   * If a granular per-Pokemon override is required, consider using {@linkcode FieldHelper.mockAbility}
   */
  public hasPassiveAbility(hasPassive: boolean | null): this {
    vi.spyOn(Overrides, "HAS_PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(hasPassive);
    if (hasPassive === null) {
      this.log("Player Pokemon passive ability override disabled!");
    } else {
      this.log(`Player Pokemon passive ability forcibly ${hasPassive ? "enabled" : "disabled"}!`);
    }
    return this;
  }

  /**
   * Override the movesets of all player Pokemon.
   * @param moveset - One or more {@linkcode MoveId}s to set
   * @returns `this`
   * @deprecated
   * While kept for legacy reasons, new tests should prefer using
   * {@linkcode MoveHelper.use} in nearly all cases.
   */
  public moveset(moveset: MoveId | MoveId[]): this {
    moveset = coerceArray(moveset);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue(moveset);
    this.log(`Player Pokemon moveset set to ${stringifyEnumArray(MoveId, moveset)}!`);
    return this;
  }

  /**
   * Override the initial status condition of all player Pokemon.
   * @param effect - The {@linkcode StatusEffect} to set
   * @returns `this`
   * @remarks
   * If this is set to `StatusEffect.SLEEP`, the duration will be set to a guaranteed 4 turns.
   */
  public statusEffect(effect: StatusEffect): this {
    vi.spyOn(Overrides, "STATUS_OVERRIDE", "get").mockReturnValue(effect);
    if (effect === StatusEffect.NONE) {
      this.log("Player Pokemon status effect override disabled!");
    } else {
      this.log(`Player Pokemon initial status effect set to ${getEnumStr(StatusEffect, effect)}!`);
    }
    return this;
  }

  /**
   * Override the initial IVs of all player Pokemon.
   * @param ivs - The IVs to set, either as a single number or a 6-length array.
   * If set to `null`, the override is disabled.
   * @returns `this`
   * @remarks
   * This will disable player/enemy IV normalization when called.
   */
  public playerIVs(ivs: (typeof Overrides)["IVS_OVERRIDE"]): this {
    this.normalizeIVs = false;
    vi.spyOn(Overrides, "IVS_OVERRIDE", "get").mockReturnValue(ivs);
    if (ivs === null) {
      this.log("Player Pokemon IVs override disabled!");
    } else {
      this.log(`Player Pokemon IVs set to ${ivs}!`);
    }
    return this;
  }

  /**
   * Override the initial nature of all player Pokemon.
   * @param nature - The {@linkcode Nature} to set, or `null` to disable the override.
   * @returns `this`
   */
  public nature(nature: Nature | null): this {
    this.normalizeNatures = false;
    vi.spyOn(Overrides, "NATURE_OVERRIDE", "get").mockReturnValue(nature);
    if (nature === null) {
      this.log("Player Pokemon Nature override disabled!");
    } else {
      this.log(`Player Pokemon Natures set to ${getEnumStr(Nature, nature)}!`);
    }
    return this;
  }

  /**
   * Override the initial IVs of all enemy Pokemon.
   * @param ivs - The IVs to set, either as a single number or a 6-length array.
   * If set to `null`, the override is disabled.
   * @returns `this`
   * @remarks
   * This will disable player/enemy IV normalization when called.
   */
  public enemyIVs(ivs: (typeof Overrides)["IVS_OVERRIDE"]): this {
    this.normalizeIVs = false;
    vi.spyOn(Overrides, "ENEMY_IVS_OVERRIDE", "get").mockReturnValue(ivs);
    if (ivs === null) {
      this.log("Enemy Pokemon IVs override disabled!");
    } else {
      this.log(`Enemy Pokemon IVs set to ${ivs}!`);
    }
    return this;
  }

  /**
   * Override the initial nature of all enemy Pokemon.
   * @param nature - The {@linkcode Nature} to set, or `null` to disable the override.
   * @returns `this`
   */
  public enemyNature(nature: Nature | null): this {
    this.normalizeNatures = false;
    vi.spyOn(Overrides, "ENEMY_NATURE_OVERRIDE", "get").mockReturnValue(nature);
    if (nature === null) {
      this.log("Enemy Nature override disabled!");
    } else {
      this.log(`Enemy Nature set to ${getEnumStr(Nature, nature)}!`);
    }
    return this;
  }

  /**
   * Override waves to not have standard trainer battles
   * @returns `this`
   * @deprecated
   * Use {@linkcode battleType} instead
   */
  public disableTrainerWaves(): this {
    vi.spyOn(Overrides, "DISABLE_STANDARD_TRAINERS_OVERRIDE", "get").mockReturnValue(true);
    this.log("Standard trainer waves are disabled!");
    return this;
  }

  /**
   * Override the trainer type & variant when a random trainer is generated.
   * @param trainer - An {@linkcode RandomTrainerOverride | object} dictating the type & variant of trainer to spawn,
   * or `null` to disable the override
   * @returns `this`
   * @remarks
   * Does **not** force the wave to be a trainer battle.
   */
  public randomTrainer(trainer: RandomTrainerOverride | null): this {
    vi.spyOn(Overrides, "RANDOM_TRAINER_OVERRIDE", "get").mockReturnValue(trainer);
    if (trainer === null) {
      this.log("Random trainer override disabled!");
    } else {
      this.log(
        `Random trainer set to a ${trainer.trainerVariant ? `${getEnumStr(TrainerVariant, trainer.trainerVariant)} ` : ""}${getEnumStr(TrainerType, trainer.trainerType)}${trainer.trainerVariant === TrainerVariant.DOUBLE ? " battle" : ""}!`,
      );
    }
    return this;
  }

  /**
   * Override random critical hit rolls to always or never suceed.
   * @param alwaysCrit - `true` to guarantee crits on eligible moves, `false` to force rolls to fail, `null` to disable override
   * @remarks
   * This does not change any effects that guarantee or block critical hits;
   * it merely intercepts any chance-based rolls _not already at 100%_. \
   * For instance, a Pokemon at +3 crit stages will still critically hit with the override set to `false`,
   * whereas one at +2 crit stages (a 50% chance) will not.
   * @returns `this`
   */
  public criticalHits(alwaysCrit: boolean | null): this {
    vi.spyOn(Overrides, "CRITICAL_HIT_OVERRIDE", "get").mockReturnValue(alwaysCrit);
    const freq = alwaysCrit === true ? "always" : alwaysCrit === false ? "never" : "randomly";
    this.log(`Critical hit rolls set to ${freq} succeed!`);
    return this;
  }

  /**
   * Override the arena's current weather.
   * @param type - The {@linkcode WeatherType} to set
   * @returns `this`
   * @remarks
   * Oddly enough, this override is perpetually applied and will supercede any and all attempts
   * to change/remove weather.
   * This behavior is dubious in quality and should hopefully be made sane.
   */
  public weather(type: WeatherType): this {
    vi.spyOn(Overrides, "WEATHER_OVERRIDE", "get").mockReturnValue(type);
    this.log(`Weather set to ${getEnumStr(WeatherType, type)}!`);
    return this;
  }

  /**
   * Override the starting {@linkcode TerrainType} that will be set on entering a new biome.
   * @param terrainType - The {@linkcode TerrainType} to set.
   * @returns `this`
   * @remarks
   * The newly added terrain will be refreshed upon reaching
   * a new biome, and will last until removed or replaced by another effect.
   */
  public startingTerrain(terrainType: TerrainType): this {
    vi.spyOn(Overrides, "STARTING_TERRAIN_OVERRIDE", "get").mockReturnValue(terrainType);
    this.log(`Starting terrain for next biome set to ${getEnumStr(TerrainType, terrainType)}!`);
    return this;
  }

  /**
   * Override the seed
   * @param seed - The seed to set
   * @returns `this`
   */
  // TODO: Document this and our other RNG functions - this is really scuffed
  public seed(seed: string): this {
    // Shift the seed here with a negative wave number, to compensate for `resetSeed()` shifting the seed itself.
    this.game.scene.setSeed(shiftCharCodes(seed, (this.game.scene.currentBattle?.waveIndex ?? 0) * -1));
    this.game.scene.resetSeed();
    this.log(`Seed set to "${seed}"!`);
    return this;
  }

  /**
   * Override the battle style (e.g., single or double).
   * @param battleStyle - The {@linkcode BattleStyle} to set, or `null` to disable the override
   * @returns `this`
   */
  public battleStyle(battleStyle: BattleStyle | null): this {
    vi.spyOn(Overrides, "BATTLE_STYLE_OVERRIDE", "get").mockReturnValue(battleStyle);
    this.log(battleStyle === null ? "Battle type override disabled!" : `Battle type set to ${battleStyle}!`);
    return this;
  }

  /**
   * Override the battle type for non-scripted battles.
   * @param battleType - The {@linkcode BattleType} to set
   * @returns `this`
   * @remarks
   * Typically used to either guarantee or forbid trainer battles.
   */
  public battleType(battleType: Exclude<BattleType, BattleType.CLEAR>): this {
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue(battleType);
    this.log(
      battleType === null
        ? "Battle type override disabled!"
        : `Battle type set to ${getEnumStr(BattleType, battleType)}!`,
    );
    return this;
  }

  /**
   * Override the initial species used when creating new enemy Pokemon.
   * @param species - The {@linkcode SpeciesId} to set, or `null` to disable the override
   * @returns `this`
   */
  public enemySpecies(species: SpeciesId | null): this {
    vi.spyOn(Overrides, "ENEMY_SPECIES_OVERRIDE", "get").mockReturnValue(species);
    if (species === null) {
      this.log("Enemy Pokemon starter species override disabled!");
    } else {
      this.log(`Enemy Pokemon species set to ${getEnumStr(SpeciesId, species)}!`);
    }

    return this;
  }

  /**
   * Override whether enemy Pokemon will be fused with random Pokemon.
   * @returns `this`
   */
  public enableEnemyFusion(): this {
    vi.spyOn(Overrides, "ENEMY_FUSION_OVERRIDE", "get").mockReturnValue(true);
    this.log("Enemy Pokemon is a random fusion!");
    return this;
  }

  /**
   * Override the initial fusion species used when generating new enemy Pokemon in Spliced Endless-like modes.
   * @param species - The fusion {@linkcode SpeciesId} to set, or `null` to disable the override
   * @returns `this`
   * @remarks
   * Does nothing if {@linkcode Overrides.ENEMY_FUSION_OVERRIDE} is not enabled
   * {@see {@linkcode enableEnemyFusion}}
   */
  // TODO: Should we just bundle these 2 together?
  public enemyFusionSpecies(species: SpeciesId | null): this {
    vi.spyOn(Overrides, "ENEMY_FUSION_SPECIES_OVERRIDE", "get").mockReturnValue(species);
    if (species === null) {
      this.log("Enemy Pokemon fusion species override disabled!");
    } else {
      this.log(`Enemy Pokemon fusion species set to ${getEnumStr(SpeciesId, species)}!`);
    }
    return this;
  }

  /**
   * Override the ability of all enemy Pokemon.
   * @param ability - The {@linkcode AbilityId} to set
   * @returns `this`
   */
  public enemyAbility(ability: AbilityId): this {
    vi.spyOn(Overrides, "ENEMY_ABILITY_OVERRIDE", "get").mockReturnValue(ability);
    if (ability === AbilityId.NONE) {
      this.log("Enemy Pokemon ability override disabled!");
    } else {
      this.log(`Enemy Pokemon ability set to ${getEnumStr(AbilityId, ability)}!`);
    }
    return this;
  }

  /**
   * Override the **passive** ability of all enemy Pokemon.
   * @param passive - The **passive** {@linkcode AbilityId} to set, or `AbilityId.NONE` to disable
   * @returns `this`
   * @remarks
   * Setting a custom passive ability will force said passive to always be enabled,
   * even if not unlocked.
   */
  // TODO: Review uses and make sure callers aren't mistakedly passing `AbilityId.NONE`
  public enemyPassiveAbility(passive: AbilityId): this {
    vi.spyOn(Overrides, "ENEMY_PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(passive);
    if (passive === AbilityId.NONE) {
      this.log("Enemy Pokemon passive ability override disabled!");
    } else {
      this.log(`Enemy Pokemon passive ability set to ${getEnumStr(AbilityId, passive)}!`);
    }
    return this;
  }

  /**
   * Override the enabled status of the passive {@linkcode AbilityId | abilities} of all enemy Pokemon.
   * @param hasPassive - Whether passives should be enabled/disabled, or `null` to disable the override
   * @returns `this`
   * @deprecated
   * This override should not be used - setting a custom passive ability via {@linkcode passiveAbility}
   * will forcibly enable passives without relying on individual species having specific passives.
   * If a granular per-Pokemon override is required, consider using {@linkcode FieldHelper.mockAbility}
   */
  public enemyHasPassiveAbility(hasPassive: boolean | null): this {
    vi.spyOn(Overrides, "ENEMY_HAS_PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(hasPassive);
    if (hasPassive === null) {
      this.log("Enemy Pokemon passive ability override disabled!");
    } else {
      this.log(`Enemy Pokemon passive ability forcibly ${hasPassive ? "enabled" : "disabled"}!`);
    }
    return this;
  }

  /**
   * Override the movesets of all enemy Pokemon.
   * @param moveset - One or more {@linkcode MoveId}s to set
   * @returns `this`
   * @remarks
   * New tests should prefer using {@linkcode MoveHelper.forceEnemyMove}
   * in most cases, though a global override can still be convenient to
   * "disable" enemies globally.
   */
  // TODO: Make the default value for the override actually sensible and forbid 1-length arrays
  public enemyMoveset(moveset: MoveId | MoveId[]): this {
    vi.spyOn(Overrides, "ENEMY_MOVESET_OVERRIDE", "get").mockReturnValue(moveset);
    moveset = coerceArray(moveset);
    this.log(`Enemy Pokemon moveset set to ${stringifyEnumArray(MoveId, moveset)}!`);
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
   * Override the initial status condition of all enemy Pokemon.
   * @param effect - The {@linkcode StatusEffect} to set
   * @returns `this`
   * @remarks
   * If this is set to `StatusEffect.SLEEP`, the duration will be set to a guaranteed 4 turns.
   */
  public enemyStatusEffect(effect: StatusEffect): this {
    vi.spyOn(Overrides, "ENEMY_STATUS_OVERRIDE", "get").mockReturnValue(effect);
    if (effect === StatusEffect.NONE) {
      this.log("Enemy Pokemon status effect override disabled!");
    } else {
      this.log(`Enemy Pokemon initial status effect set to ${getEnumStr(StatusEffect, effect)}!`);
    }
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
   * Override player Pokemon to either always or never be Shiny.
   * @param shininess - Whether to forcibly enable (`true`) or disable (`false`) Shininess,
   * or `null` to disable the override altogether
   * @returns `this`
   */
  public shiny(shininess: false | null): this;
  /**
   * Override player Pokemon to either always or never be Shiny.
   * @param shininess - Whether to forcibly enable (`true`) or disable (`false`) Shininess,
   * or `null` to disable the override altogether
   * @param variant - If provided, will force newly generated Shinies to have the specified {@linkcode Variant}.
   * @returns `this`
   */
  public shiny(shininess: true, variant?: Variant): this;
  public shiny(shininess: boolean | null, variant?: Variant): this {
    vi.spyOn(Overrides, "SHINY_OVERRIDE", "get").mockReturnValue(shininess);
    if (shininess === null) {
      this.log("Player Pokemon shininess override disabled!");
    } else {
      this.log(`Player Pokemon set to ${shininess ? "always" : "never"} be shiny!`);
    }

    if (variant != null) {
      vi.spyOn(Overrides, "VARIANT_OVERRIDE", "get").mockReturnValue(variant);
      this.log(`Player Pokemon shiny variant set to ${variant}!`);
    }

    return this;
  }

  /**
   * Override enemy Pokemon to either always or never be Shiny.
   * @param shininess - Whether to forcibly enable (`true`) or disable (`false`) Shininess,
   * or `null` to disable the override altogether
   * @returns `this`
   */
  public enemyShiny(shininess: false | null): this;
  /**
   * Override enemy Pokemon to either always or never be Shiny.
   * @param shininess - Whether to forcibly enable (`true`) or disable (`false`) Shininess,
   * or `null` to disable the override altogether
   * @param variant - If provided, will force newly generated Shinies to have the specified {@linkcode Variant}.
   * @returns `this`
   */
  public enemyShiny(shininess: true, variant?: Variant): this;
  public enemyShiny(shininess: boolean | null, variant?: Variant): this {
    vi.spyOn(Overrides, "ENEMY_SHINY_OVERRIDE", "get").mockReturnValue(shininess);
    if (shininess === null) {
      this.log("Enemy Pokemon shininess override disabled!");
    } else {
      this.log(`Enemy Pokemon set to ${shininess ? "always" : "never"} be shiny!`);
    }

    if (variant != null) {
      vi.spyOn(Overrides, "ENEMY_VARIANT_OVERRIDE", "get").mockReturnValue(variant);
      this.log(`Enemy Pokemon shiny variant set to ${variant}!`);
    }

    return this;
  }

  /**
   * Override enemy Pokemon to have the given amount of boss health segments.
   * @param healthSegments - The number of segments to give, as follows:
   * - `0`: Boss segments will be computed normally based on wave and enemy level
   * - `1`: The Pokemon will not be a boss
   * - `2`+: The Pokemon will be a boss with the given number of health segments
   * @returns `this`
   */
  public enemyHealthSegments(healthSegments: number): this {
    vi.spyOn(Overrides, "ENEMY_HEALTH_SEGMENTS_OVERRIDE", "get").mockReturnValue(healthSegments);
    this.log(`Enemy Pokemon health segment count set to ${healthSegments}!`);
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
    const maxRate = 256; // 100%
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

  /**
   * Log a message to the console with coloration.
   * @param params - The parameters to log
   */
  private log(...params: any[]): void {
    console.log(chalk.hex(OVERRIDES_COLOR)(...params));
  }
}
