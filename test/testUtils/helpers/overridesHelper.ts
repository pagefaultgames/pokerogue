import type { Variant } from "#app/sprites/variant";
import { Weather } from "#app/data/weather";
import { Abilities } from "#app/enums/abilities";
import type { ModifierOverride } from "#app/modifier/modifier-type";
import type { BattleStyle } from "#app/overrides";
import Overrides, { defaultOverrides } from "#app/overrides";
import type { Unlockables } from "#app/system/unlockables";
import { Biome } from "#enums/biome";
import { Moves } from "#enums/moves";
import type { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import type { WeatherType } from "#enums/weather-type";
import { expect, vi } from "vitest";
import { GameManagerHelper } from "./gameManagerHelper";
import { shiftCharCodes } from "#app/utils/common";
import type { RandomTrainerOverride } from "#app/overrides";
import type { BattleType } from "#enums/battle-type";

/**
 * Helper to handle overrides in tests
 */
export class OverridesHelper extends GameManagerHelper {
  /** If `true`, removes the starting items from enemies at the start of each test; default `true` */
  public removeEnemyStartingItems = true;
  /** If `true`, sets the shiny overrides to disable shinies at the start of each test; default `true` */
  public disableShinies = true;

  /**
   * Override the starting biome
   * @warning Any event listeners that are attached to [NewArenaEvent](events\battle-scene.ts) may need to be handled down the line
   * @param biome - The biome to set
   */
  public startingBiome(biome: Biome): this {
    this.game.scene.newArena(biome);
    this.log(`Starting biome set to ${Biome[biome]} (=${biome})!`);
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
   * @param level - The level to set; set to `0` or lower to disable override
   * @returns `this`
   */
  public startingLevel(level: number): this {
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(level);
    if (level > 0) {
      this.log(`Player Pokemon starting level set to ${level}!`);
    } else {
      this.log("Player Pokemon starting level set to default for game mode!");
    }
    return this;
  }

  /**
   * Override the XP Multiplier used during experience gain calculations.
   * @param multi - The XP multiplier to set; set to any negative number to disable XP gain
   * or `null` to disable override.
   * @returns `this`
   */
  public xpMultiplier(multi: number | null): this {
    vi.spyOn(Overrides, "XP_MULTIPLIER_OVERRIDE", "get").mockReturnValue(multi);
    const multiStr = !multi
      ? "XP multiplier reset to default value!"
      : multi > 0
        ? `XP multiplier set to ${multi?.toPrecision(5)}!`
        : "XP gain disabled!";

    this.log(multiStr);
    return this;
  }

  /**
   * Override the wave level cap used during experience gain calculations.
   * @param cap - The level cap value to set. Set to any negative number to disable level caps entirely,
   * or `0` to disable the override.
   * @returns `this`
   */
  public levelCap(cap: number): this {
    vi.spyOn(Overrides, "LEVEL_CAP_OVERRIDE", "get").mockReturnValue(cap);
    const capStr = !cap
      ? "Level cap reset to default value for wave!"
      : cap > 0
        ? `Level cap set to ${cap}!`
        : "Level cap disabled!";

    this.log(capStr);
    return this;
  }

  /**
   * Override the player pokemon's starting held items.
   * @param modifiers - Array of {@linkcode ModifierOverride | modifiers} to set
   * @remarks Use {@linkcode startingModifier} for non-held item modifiers
   * @returns `this`
   */
  public startingHeldItems(items: ModifierOverride[]): this {
    vi.spyOn(Overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue(items);
    this.log(`Player Pokemon starting held items set to: ${items}`);
    return this;
  }

  /**
   * Override the player pokemon's {@linkcode Species | species}.
   * @param species - The {@linkcode Species | species} to set
   * @returns `this`
   */
  public starterSpecies(species: Species | null): this {
    vi.spyOn(Overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(species);
    if (species) {
      this.log(`Player Pokemon species set to ${Species[species]} (=${species})!`);
    } else {
      this.log("Player Pokemon species reset to default value!");
    }
    return this;
  }

  /**
   * Override the player pokemon to be (or not be) a random fusion.
   * @param enabled - `true` to enable fusion, `false` to disable; default `true`
   * @returns `this`
   */
  public enableStarterFusion(enabled = true): this {
    vi.spyOn(Overrides, "STARTER_FUSION_OVERRIDE", "get").mockReturnValue(enabled);
    if (enabled) {
      this.log("Player Pokemon is a random fusion!");
    } else {
      this.log("Player Pokemon is no longer a random fusion!");
    }

    return this;
  }

  /**
   * Override the player pokemon's fusion species for starter fusion.
   * @param species - The {@linkcode Species | species} to fuse with, or `null` to disable and use random fusion
   * @returns `this`
   */
  public starterFusionSpecies(species: Species | null): this {
    vi.spyOn(Overrides, "STARTER_FUSION_SPECIES_OVERRIDE", "get").mockReturnValue(species);
    if (species) {
      this.log(`Player Pokemon fusion species set to ${Species[species]} (=${species})!`);
    } else {
      this.log("Player Pokemon fusion species reset to random species!");
    }
    return this;
  }

  /**
   * Override the player pokemon's starting forms
   * @param forms - The forms to set
   * @returns `this`
   */
  public starterForms(forms: Partial<Record<Species, number>>): this {
    vi.spyOn(Overrides, "STARTER_FORM_OVERRIDES", "get").mockReturnValue(forms);
    const formsStr = Object.entries(forms)
      .map(([speciesId, formIndex]) => `${Species[speciesId]}=${formIndex}`)
      .join(", ");
    this.log(`Player Pokemon form set to ${formsStr}!`);
    return this;
  }

  /**
   * Override the player's starting modifiers.
   * @param modifiers - Array of {@linkcode ModifierOverride | modifiers} to set
   * @remarks Use {@linkcode startingHeldItems} for held item modifiers.
   * @see {@linkcode startingHeldItems}
   * @returns `this`
   */
  public startingModifier(modifiers: ModifierOverride[]): this {
    vi.spyOn(Overrides, "STARTING_MODIFIER_OVERRIDE", "get").mockReturnValue(modifiers);
    this.log(`Player starting modifiers set to ${modifiers}`);
    return this;
  }

  /**
   * Override the player pokemon's {@linkcode Abilities | ability}.
   * @param ability - The {@linkcode Abilities | ability} to set, or `Abilities.NONE` to disable override
   * @returns `this`
   */
  public ability(ability: Abilities): this {
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(ability);
    if (ability) {
      this.log(`Player Pokemon ability set to ${Abilities[ability]} (=${ability})!`);
    } else {
      this.log("Player Pokemon ability reset to default value for species!");
    }
    return this;
  }

  /**
   * Override the player pokemon's **passive** {@linkcode Abilities | ability}
   * @param passiveAbility - The **passive** {@linkcode Abilities | ability} to set, or `Abilities.NONE` to disable override
   * @returns `this`
   */
  public passiveAbility(passiveAbility: Abilities): this {
    vi.spyOn(Overrides, "PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(passiveAbility);
    if (passiveAbility) {
      this.log(`Player Pokemon PASSIVE ability set to ${Abilities[passiveAbility]} (=${passiveAbility})!`);
    } else {
      this.log("Player Pokemon PASSIVE ability reset to default value for species!");
    }
    return this;
  }

  /**
   * Forces the status of the player pokemon **passive** {@linkcode Abilities | ability}
   * @param hasPassiveAbility - Forces passive to be active if `true` or inactive if `false`;
   * set to `null` to disable
   * @returns `this`
   */
  public hasPassiveAbility(hasPassiveAbility: boolean | null): this {
    vi.spyOn(Overrides, "HAS_PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(hasPassiveAbility);
    if (hasPassiveAbility === null) {
      this.log("Player Pokemon PASSIVE ability no longer forcibly enabled or disabled!");
    } else {
      this.log(`Player Pokemon PASSIVE ability forcibly ${hasPassiveAbility ? "enabled" : "disabled"}!`);
    }
    return this;
  }
  /**
   * Override the player pokemon's {@linkcode Moves | moveset}.
   * @param moveset - The {@linkcode Moves | moveset} to set.
   * @warning This also overrides PP count and other values.
   * @see {@linkcode changeMoveset} in `moveHelper.ts` for a more manual override
   * @returns `this`
   */
  public moveset(moveset: Moves | Moves[]): this {
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue(moveset);
    if (!Array.isArray(moveset)) {
      moveset = [moveset];
    }
    const movesetStr = moveset.map(moveId => Moves[moveId]).join(", ");
    this.log(`Player Pokemon moveset set to ${movesetStr} (=[${moveset.join(", ")}])!`);
    return this;
  }

  /**
   * Override the player pokemon's {@linkcode StatusEffect | non-volatile status condition}.
   * @param statusEffect - The {@linkcode StatusEffect | status effect} to set
   * @returns `this`
   */
  public statusEffect(statusEffect: StatusEffect): this {
    vi.spyOn(Overrides, "STATUS_OVERRIDE", "get").mockReturnValue(statusEffect);
    this.log(`Player Pokemon status-effect set to ${StatusEffect[statusEffect]} (=${statusEffect})!`);
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
   * Override each wave to not have critical hits
   * @returns `this`
   */
  public disableCrits(): this {
    vi.spyOn(Overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
    this.log("Critical hits are disabled!");
    return this;
  }

  /**
   * Override the {@linkcode WeatherType | weather type}
   * @param type - The {@linkcode WeatherType | weather type} to set
   * @returns `this`
   */
  public weather(type: WeatherType): this {
    vi.spyOn(Overrides, "WEATHER_OVERRIDE", "get").mockReturnValue(type);
    this.log(`Weather set to ${Weather[type]} (=${type})!`);
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
   * Override the {@linkcode Species | species} of enemy pokemon.
   * @param species - The {@linkcode Species | species} to set, or `null` to disable override
   * @returns `this`
   */
  public enemySpecies(species: Species | null): this {
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(species);
    if (species) {
      this.log(`Enemy Pokemon species set to ${Species[species]} (=${species})!`);
    } else {
      this.log("Enemy Pokemon species reset to default!");
    }
    return this;
  }

  /**
   * Override the enemy pokemon to be a random fusion
   * @returns `this`
   */
  public enableEnemyFusion(): this {
    vi.spyOn(Overrides, "OPP_FUSION_OVERRIDE", "get").mockReturnValue(true);
    this.log("Enemy Pokemon is a random fusion!");
    return this;
  }

  /**
   * Override the enemy pokemon fusion species
   * @param species - The fusion species to set
   * @returns `this`
   */
  public enemyFusionSpecies(species: Species | number): this {
    vi.spyOn(Overrides, "OPP_FUSION_SPECIES_OVERRIDE", "get").mockReturnValue(species);
    this.log(`Enemy Pokemon fusion species set to ${Species[species]} (=${species})!`);
    return this;
  }

  /**
   * Override the {@linkcode Abilities | ability} of enemy pokemon
   * @param ability - The {@linkcode Abilities | ability} to set
   * @returns `this`
   */
  public enemyAbility(ability: Abilities): this {
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(ability);
    this.log(`Enemy Pokemon ability set to ${Abilities[ability]} (=${ability})!`);
    return this;
  }

  /**
   * Override the **passive** {@linkcode Abilities | ability} of enemy pokemon
   * @param passiveAbility - The **passive** {@linkcode Abilities | ability} to set
   * @returns `this`
   */
  public enemyPassiveAbility(passiveAbility: Abilities): this {
    vi.spyOn(Overrides, "OPP_PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(passiveAbility);
    this.log(`Enemy Pokemon PASSIVE ability set to ${Abilities[passiveAbility]} (=${passiveAbility})!`);
    return this;
  }

  /**
   * Forces the status of the enemy pokemon **passive** {@linkcode Abilities | ability}
   * @param hasPassiveAbility - Forces the passive to be active if `true`, inactive if `false`
   * @returns `this`
   */
  public enemyHasPassiveAbility(hasPassiveAbility: boolean | null): this {
    vi.spyOn(Overrides, "OPP_HAS_PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(hasPassiveAbility);
    if (hasPassiveAbility === null) {
      this.log("Enemy Pokemon PASSIVE ability no longer force enabled or disabled!");
    } else {
      this.log(`Enemy Pokemon PASSIVE ability is force ${hasPassiveAbility ? "enabled" : "disabled"}!`);
    }
    return this;
  }

  /**
   * Override the {@linkcode Moves | move}set of enemy pokemon
   * @param moveset - The {@linkcode Moves | move}set to set
   * @returns `this`
   */
  public enemyMoveset(moveset: Moves | Moves[]): this {
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(moveset);
    if (!Array.isArray(moveset)) {
      moveset = [moveset];
    }
    const movesetStr = moveset.map(moveId => Moves[moveId]).join(", ");
    this.log(`Enemy Pokemon moveset set to ${movesetStr} (=[${moveset.join(", ")}])!`);
    return this;
  }

  /**
   * Override the level of enemy pokemon
   * @param level - The level to set
   * @returns `this`
   */
  public enemyLevel(level: number): this {
    vi.spyOn(Overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(level);
    this.log(`Enemy Pokemon level set to ${level}!`);
    return this;
  }

  /**
   * Override the enemy {@linkcode StatusEffect | status-effect} for enemy pokemon
   * @param statusEffect - The {@linkcode StatusEffect | status-effect} to set
   * @returns
   */
  public enemyStatusEffect(statusEffect: StatusEffect): this {
    vi.spyOn(Overrides, "OPP_STATUS_OVERRIDE", "get").mockReturnValue(statusEffect);
    this.log(`Enemy Pokemon status-effect set to ${StatusEffect[statusEffect]} (=${statusEffect})!`);
    return this;
  }

  /**
   * Override the enemy (pokemon) held items
   * @param items the items to hold
   * @returns `this`
   */
  public enemyHeldItems(items: ModifierOverride[]): this {
    vi.spyOn(Overrides, "OPP_HELD_ITEMS_OVERRIDE", "get").mockReturnValue(items);
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
    vi.spyOn(Overrides, "OPP_SHINY_OVERRIDE", "get").mockReturnValue(shininess);
    if (shininess === null) {
      this.log("Disabled enemy Pokemon shiny override!");
    } else {
      this.log(`Set enemy Pokemon to be ${shininess ? "" : "not "}shiny!`);
    }

    if (variant !== undefined) {
      vi.spyOn(Overrides, "OPP_VARIANT_OVERRIDE", "get").mockReturnValue(variant);
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
    vi.spyOn(Overrides, "OPP_HEALTH_SEGMENTS_OVERRIDE", "get").mockReturnValue(healthSegments);
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
    console.log("Overrides:", ...params);
  }

  public sanitizeOverrides(): void {
    for (const key of Object.keys(defaultOverrides)) {
      if (Overrides[key] !== defaultOverrides[key]) {
        vi.spyOn(Overrides, key as any, "get").mockReturnValue(defaultOverrides[key]);
      }
    }
    expect(Overrides).toEqual(defaultOverrides);
    this.log("Sanitizing all overrides!");
  }
}
