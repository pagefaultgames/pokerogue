import { Abilities } from "#enums/abilities";
import { Biome } from "#enums/biome";
import { EggTier } from "#enums/egg-type";
import { Moves } from "#enums/moves";
import { PokeballType } from "#enums/pokeball";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import { TimeOfDay } from "#enums/time-of-day";
import { VariantTier } from "#enums/variant-tiers";
import { WeatherType } from "#enums/weather-type";
import { type PokeballCounts } from "./battle-scene";
import { Gender } from "./data/gender";
import { allSpecies } from "./data/pokemon-species"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Variant } from "./data/variant";
import { type ModifierOverride, type ModifierTypeKeys } from "./modifier/modifier-type";

const overrides = {} satisfies Partial<InstanceType<typeof DefaultOverrides>>;

class DefaultOverrides {
  // -----------------
  // OVERALL OVERRIDES
  // -----------------
  /** a specific seed (default: a random string of 24 characters) */
  readonly SEED_OVERRIDE: string = "";
  readonly WEATHER_OVERRIDE: WeatherType = WeatherType.NONE;
  readonly BATTLE_TYPE_OVERRIDE: "double" | "single" | null = "double";
  readonly STARTING_WAVE_OVERRIDE: integer = 6;
  readonly STARTING_BIOME_OVERRIDE: Biome = Biome.TOWN;
  readonly ARENA_TINT_OVERRIDE: TimeOfDay = null;
  readonly XP_MULTIPLIER_OVERRIDE: number = null;
  readonly STARTING_MONEY_OVERRIDE: integer = 0;
  readonly FREE_CANDY_UPGRADE_OVERRIDE: boolean = false;
  readonly POKEBALL_OVERRIDE: { active: boolean; pokeballs: PokeballCounts } = {
    active: false,
    pokeballs: {
      [PokeballType.POKEBALL]: 5,
      [PokeballType.GREAT_BALL]: 0,
      [PokeballType.ULTRA_BALL]: 0,
      [PokeballType.ROGUE_BALL]: 0,
      [PokeballType.MASTER_BALL]: 0,
    },
  };

  // ----------------
  // PLAYER OVERRIDES
  // ----------------
  readonly STARTER_FORM_OVERRIDES: Partial<Record<Species, number>> = {};

  /** default 5 or 20 for Daily */
  readonly STARTING_LEVEL_OVERRIDE: integer = 0;
  readonly STARTER_SPECIES_OVERRIDE: Species | integer = 0;
  readonly ABILITY_OVERRIDE: Abilities = Abilities.NONE;
  readonly PASSIVE_ABILITY_OVERRIDE: Abilities = Abilities.NONE;
  readonly STATUS_OVERRIDE: StatusEffect = StatusEffect.NONE;
  readonly GENDER_OVERRIDE: Gender = null;
  readonly MOVESET_OVERRIDE: Array<Moves> = [Moves.SHADOW_SNEAK, Moves.SHADOW_BALL, Moves.AGILITY, Moves.TOXIC];
  readonly SHINY_OVERRIDE: boolean = false;
  readonly VARIANT_OVERRIDE: Variant = 0;

  // --------------------------
  // OPPONENT / ENEMY OVERRIDES
  // --------------------------
  readonly OPP_SPECIES_OVERRIDE: Species | integer = Species.SHEDINJA;
  readonly OPP_LEVEL_OVERRIDE: number = 0;
  readonly OPP_ABILITY_OVERRIDE: Abilities = Abilities.NONE;
  readonly OPP_PASSIVE_ABILITY_OVERRIDE: Abilities = Abilities.PRANKSTER;
  readonly OPP_STATUS_OVERRIDE: StatusEffect = StatusEffect.NONE;
  readonly OPP_GENDER_OVERRIDE: Gender = null;
  readonly OPP_MOVESET_OVERRIDE: Array<Moves> = [Moves.DESTINY_BOND, Moves.DESTINY_BOND, Moves.DESTINY_BOND, Moves.DESTINY_BOND];
  readonly OPP_SHINY_OVERRIDE: boolean = false;
  readonly OPP_VARIANT_OVERRIDE: Variant = 0;
  readonly OPP_IVS_OVERRIDE: integer | integer[] = [];

  // -------------
  // EGG OVERRIDES
  // -------------
  readonly EGG_IMMEDIATE_HATCH_OVERRIDE: boolean = false;
  readonly EGG_TIER_OVERRIDE: EggTier = null;
  readonly EGG_SHINY_OVERRIDE: boolean = false;
  readonly EGG_VARIANT_OVERRIDE: VariantTier = null;
  readonly EGG_FREE_GACHA_PULLS_OVERRIDE: boolean = false;
  readonly EGG_GACHA_PULL_COUNT_OVERRIDE: number = 0;

  // -------------------------
  // MODIFIER / ITEM OVERRIDES
  // -------------------------
  readonly STARTING_MODIFIER_OVERRIDE: Array<ModifierOverride> = [];
  readonly OPP_MODIFIER_OVERRIDE: Array<ModifierOverride> = [];

  readonly STARTING_HELD_ITEMS_OVERRIDE: Array<ModifierOverride> = [{name:"WIDE_LENS", count: 3}];
  readonly OPP_HELD_ITEMS_OVERRIDE: Array<ModifierOverride> = [{name:"WIDE_LENS", count: 3}];
  readonly NEVER_CRIT_OVERRIDE: boolean = false;

  readonly ITEM_REWARD_OVERRIDE: Array<ModifierTypeKeys> = [];
}

export const defaultOverrides = new DefaultOverrides();

export default {
  ...defaultOverrides,
  ...overrides
} satisfies InstanceType<typeof DefaultOverrides>;
