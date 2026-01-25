/**
 * Contains various move-related banlists and related constants.
 *
 * @remarks
 * Note that PokéRogue intentionally diverges from the mainline games in these lists, as follows:
 * - Most signature moves can be called by move-calling moves like Metronome.
 * - Sketch can Sketch everything except itself and Struggle
 * @module
 */

import type { HealBlockTag } from "#data/battler-tags";
import { MoveId } from "#enums/move-id";

/**
 * Array containing all move-calling moves, used for DRY when writing move banlists.
 */
const moveCallingMoves = [
  MoveId.ASSIST,
  MoveId.COPYCAT,
  MoveId.ME_FIRST,
  MoveId.METRONOME,
  MoveId.MIRROR_MOVE,
  MoveId.NATURE_POWER,
  MoveId.SLEEP_TALK,
  MoveId.SNATCH,
] as const;

/** Set of moves that cannot be called by {@linkcode MoveId.METRONOME | Metronome}. */
export const invalidMetronomeMoves: ReadonlySet<MoveId> = new Set([
  ...moveCallingMoves,
  MoveId.AFTER_YOU,
  MoveId.BANEFUL_BUNKER,
  MoveId.BEAK_BLAST,
  MoveId.BELCH,
  MoveId.BESTOW,
  MoveId.COMEUPPANCE,
  MoveId.COUNTER,
  MoveId.CRAFTY_SHIELD,
  MoveId.DESTINY_BOND,
  MoveId.DETECT,
  MoveId.ENDURE,
  MoveId.FEINT,
  MoveId.FOCUS_PUNCH,
  MoveId.FOLLOW_ME,
  MoveId.HELPING_HAND,
  MoveId.INSTRUCT,
  MoveId.KINGS_SHIELD,
  MoveId.MAT_BLOCK,
  MoveId.MIMIC,
  MoveId.MIRROR_COAT,
  MoveId.OBSTRUCT,
  MoveId.PROTECT,
  MoveId.QUASH,
  MoveId.QUICK_GUARD,
  MoveId.RAGE_POWDER,
  MoveId.REVIVAL_BLESSING,
  MoveId.SHELL_TRAP,
  MoveId.SILK_TRAP,
  MoveId.SKETCH,
  MoveId.SNORE,
  MoveId.SPIKY_SHIELD,
  MoveId.SPOTLIGHT,
  MoveId.STRUGGLE,
  MoveId.TRANSFORM,
  MoveId.WIDE_GUARD,
]);

/** Set of moves that cannot be called by {@linkcode MoveId.ASSIST | Assist} */
// TODO: Decide on whether to remove event exclusives like Hold Hands/Celebrate
export const invalidAssistMoves: ReadonlySet<MoveId> = new Set([
  ...moveCallingMoves,
  MoveId.BANEFUL_BUNKER,
  MoveId.BEAK_BLAST,
  MoveId.BELCH,
  MoveId.BESTOW,
  MoveId.BOUNCE,
  MoveId.CELEBRATE,
  MoveId.CHATTER,
  // NB: Comeuppance is allowed due to Metal Burst being legal from gens 4-6
  MoveId.CIRCLE_THROW,
  MoveId.COUNTER,
  MoveId.DESTINY_BOND,
  MoveId.DETECT,
  MoveId.DIG,
  MoveId.DIVE,
  MoveId.DRAGON_TAIL,
  MoveId.ENDURE,
  MoveId.FEINT,
  MoveId.FLY,
  MoveId.FOCUS_PUNCH,
  MoveId.FOLLOW_ME,
  MoveId.HELPING_HAND,
  MoveId.HOLD_HANDS,
  MoveId.KINGS_SHIELD,
  MoveId.MAT_BLOCK,
  MoveId.MIMIC,
  MoveId.MIRROR_COAT,
  MoveId.PHANTOM_FORCE,
  MoveId.PROTECT,
  MoveId.RAGE_POWDER,
  MoveId.ROAR,
  MoveId.SHADOW_FORCE,
  MoveId.SHELL_TRAP,
  MoveId.SKETCH,
  MoveId.SKY_DROP,
  MoveId.SPIKY_SHIELD,
  MoveId.SPOTLIGHT,
  MoveId.STRUGGLE,
  MoveId.SWITCHEROO,
  MoveId.TRANSFORM,
  MoveId.TRICK,
  MoveId.WHIRLWIND,
]);

/** Set of moves that cannot be called by {@linkcode MoveId.SLEEP_TALK Sleep Talk} */
export const invalidSleepTalkMoves: ReadonlySet<MoveId> = new Set([
  ...moveCallingMoves,
  MoveId.BELCH,
  MoveId.BEAK_BLAST,
  MoveId.BIDE,
  MoveId.BOUNCE,
  MoveId.DIG,
  MoveId.DIVE,
  MoveId.FREEZE_SHOCK,
  MoveId.FLY,
  MoveId.FOCUS_PUNCH,
  MoveId.GEOMANCY,
  MoveId.ICE_BURN,
  MoveId.MIMIC,
  MoveId.PHANTOM_FORCE,
  MoveId.RAZOR_WIND,
  MoveId.SHADOW_FORCE,
  MoveId.SHELL_TRAP,
  MoveId.SKETCH,
  MoveId.SKULL_BASH,
  MoveId.SKY_ATTACK,
  MoveId.SKY_DROP,
  MoveId.SOLAR_BLADE,
  MoveId.SOLAR_BEAM,
  MoveId.STRUGGLE,
  MoveId.UPROAR,
]);

/** Set of moves that cannot be copied by {@linkcode MoveId.COPYCAT Copycat} */
export const invalidCopycatMoves: ReadonlySet<MoveId> = new Set([
  ...moveCallingMoves,
  MoveId.BANEFUL_BUNKER,
  MoveId.BEAK_BLAST,
  MoveId.BESTOW,
  MoveId.CELEBRATE,
  MoveId.CHATTER,
  MoveId.CIRCLE_THROW,
  MoveId.COUNTER,
  MoveId.DESTINY_BOND,
  MoveId.DETECT,
  MoveId.DRAGON_TAIL,
  MoveId.ENDURE,
  MoveId.FEINT,
  MoveId.FOCUS_PUNCH,
  MoveId.FOLLOW_ME,
  MoveId.HELPING_HAND,
  MoveId.HOLD_HANDS,
  MoveId.KINGS_SHIELD,
  MoveId.MAT_BLOCK,
  MoveId.MIMIC,
  MoveId.MIRROR_COAT,
  MoveId.PROTECT,
  MoveId.RAGE_POWDER,
  MoveId.ROAR,
  MoveId.SHELL_TRAP,
  MoveId.SKETCH,
  MoveId.SPIKY_SHIELD,
  MoveId.SPOTLIGHT,
  MoveId.STRUGGLE,
  MoveId.SWITCHEROO,
  MoveId.TRANSFORM,
  MoveId.TRICK,
  MoveId.WHIRLWIND,
]);

/** Set of all moves that cannot be called by {@linkcode MoveId.MIRROR_MOVE | Mirror Move}. */
export const invalidMirrorMoveMoves: ReadonlySet<MoveId> = new Set([
  ...moveCallingMoves,
  MoveId.ACUPRESSURE,
  MoveId.AFTER_YOU,
  MoveId.AROMATIC_MIST,
  MoveId.BEAK_BLAST,
  MoveId.BELCH,
  MoveId.CHILLY_RECEPTION,
  MoveId.COACHING,
  MoveId.CONVERSION_2,
  MoveId.COUNTER,
  MoveId.CRAFTY_SHIELD,
  MoveId.CURSE,
  MoveId.DECORATE,
  MoveId.DOODLE,
  MoveId.DOOM_DESIRE,
  MoveId.DRAGON_CHEER,
  MoveId.ELECTRIC_TERRAIN,
  MoveId.FINAL_GAMBIT,
  MoveId.FLORAL_HEALING,
  MoveId.FLOWER_SHIELD,
  MoveId.FOCUS_PUNCH,
  MoveId.FUTURE_SIGHT,
  MoveId.GEAR_UP,
  // TODO: Verify these
  MoveId.GRASSY_TERRAIN,
  MoveId.GRAVITY,
  MoveId.GUARD_SPLIT,
  MoveId.HAIL,
  MoveId.HAZE,
  MoveId.HEAL_PULSE,
  MoveId.HELPING_HAND,
  MoveId.HOLD_HANDS,
  MoveId.INSTRUCT,
  MoveId.ION_DELUGE,
  MoveId.MAGNETIC_FLUX,
  MoveId.MAT_BLOCK,
  MoveId.MIMIC,
  MoveId.MIRROR_COAT,
  MoveId.MIST,
  MoveId.MISTY_TERRAIN,
  MoveId.MUD_SPORT,
  MoveId.PERISH_SONG,
  MoveId.POWER_SPLIT,
  MoveId.PSYCH_UP,
  MoveId.PSYCHIC_TERRAIN,
  MoveId.PURIFY,
  MoveId.QUICK_GUARD,
  MoveId.RAIN_DANCE,
  MoveId.REFLECT_TYPE,
  MoveId.ROLE_PLAY,
  MoveId.ROTOTILLER,
  MoveId.SANDSTORM,
  MoveId.SHELL_TRAP,
  MoveId.SKETCH,
  MoveId.SNOWSCAPE,
  MoveId.SPIT_UP,
  MoveId.SPOTLIGHT,
  MoveId.STRUGGLE,
  MoveId.SUNNY_DAY,
  MoveId.TEATIME,
  MoveId.TRANSFORM,
  MoveId.WATER_SPORT,
  MoveId.WIDE_GUARD,
]);

/**
 *  Set of moves that can never have their type overridden by an ability like Pixilate or Normalize
 *
 * Excludes tera blast and tera starstorm, as these are only conditionally forbidden
 */
export const noAbilityTypeOverrideMoves: ReadonlySet<MoveId> = new Set([
  MoveId.WEATHER_BALL,
  MoveId.JUDGMENT,
  MoveId.REVELATION_DANCE,
  MoveId.MULTI_ATTACK,
  MoveId.TERRAIN_PULSE,
  MoveId.NATURAL_GIFT,
  MoveId.TECHNO_BLAST,
  MoveId.HIDDEN_POWER,
]);

/** Set of all moves that cannot be learned by {@linkcode MoveId.SKETCH | Sketch}. */
export const invalidSketchMoves: ReadonlySet<MoveId> = new Set([
  MoveId.NONE, // TODO: Remove from banlist and do explicit check
  MoveId.STRUGGLE,
  MoveId.SKETCH,
]);

/**
 * Set of all Moves rendered unusable by {@linkcode HealBlockTag | Heal Block}.
 *
 * Pollen Puff is not included as that is only forbidden if used _against_ a Pokemon with Heal Block applied.
 */
export const healBlockedMoves: ReadonlySet<MoveId> = new Set([
  MoveId.ABSORB,
  MoveId.MEGA_DRAIN,
  MoveId.RECOVER,
  MoveId.SOFT_BOILED,
  MoveId.DREAM_EATER,
  MoveId.LEECH_LIFE,
  MoveId.REST,
  MoveId.GIGA_DRAIN,
  MoveId.MILK_DRINK,
  MoveId.MORNING_SUN,
  MoveId.SYNTHESIS,
  MoveId.MOONLIGHT,
  MoveId.SWALLOW,
  MoveId.WISH,
  MoveId.SLACK_OFF,
  MoveId.ROOST,
  MoveId.HEALING_WISH,
  MoveId.DRAIN_PUNCH,
  MoveId.HEAL_ORDER,
  MoveId.LUNAR_DANCE,
  MoveId.HEAL_PULSE,
  MoveId.HORN_LEECH,
  MoveId.PARABOLIC_CHARGE,
  MoveId.DRAINING_KISS,
  MoveId.OBLIVION_WING,
  MoveId.SHORE_UP,
  MoveId.FLORAL_HEALING,
  MoveId.STRENGTH_SAP,
  MoveId.PURIFY,
  MoveId.BOUNCY_BUBBLE,
  MoveId.LIFE_DEW,
  MoveId.JUNGLE_HEALING,
  MoveId.LUNAR_BLESSING,
  MoveId.REVIVAL_BLESSING,
  MoveId.BITTER_BLADE,
  MoveId.MATCHA_GOTCHA,
]);

/** Set of all moves that cannot be locked into by {@linkcode MoveId.ENCORE | Encore}. */
// TODO: Check in Pokemon Champions to see if Dynamax Cannon is still blacklisted
export const invalidEncoreMoves: ReadonlySet<MoveId> = new Set([
  ...moveCallingMoves,
  MoveId.TRANSFORM,
  MoveId.MIMIC,
  MoveId.SKETCH,
  MoveId.STRUGGLE,
  MoveId.ENCORE,
  MoveId.DYNAMAX_CANNON,
  // NB: Add Max/G-Max/Z-Move blockage if or when they are implemented
]);

/** Set of all moves that cannot be repeated by {@linkcode MoveId.INSTRUCT}. */
export const invalidInstructMoves: ReadonlySet<MoveId> = new Set([
  // Locking/Continually Executed moves
  MoveId.OUTRAGE,
  MoveId.RAGING_FURY,
  MoveId.ROLLOUT,
  MoveId.PETAL_DANCE,
  MoveId.THRASH,
  MoveId.ICE_BALL,
  MoveId.UPROAR,
  // Multi-turn Moves
  MoveId.BIDE,
  MoveId.SHELL_TRAP,
  MoveId.BEAK_BLAST,
  MoveId.FOCUS_PUNCH,
  // "First Turn Only" moves
  MoveId.FAKE_OUT,
  MoveId.FIRST_IMPRESSION,
  MoveId.MAT_BLOCK,
  // Moves with a recharge turn
  MoveId.HYPER_BEAM,
  MoveId.ETERNABEAM,
  MoveId.FRENZY_PLANT,
  MoveId.BLAST_BURN,
  MoveId.HYDRO_CANNON,
  MoveId.GIGA_IMPACT,
  MoveId.PRISMATIC_LASER,
  MoveId.ROAR_OF_TIME,
  MoveId.ROCK_WRECKER,
  MoveId.METEOR_ASSAULT,
  // Charging & 2-turn moves
  MoveId.DIG,
  MoveId.FLY,
  MoveId.BOUNCE,
  MoveId.SHADOW_FORCE,
  MoveId.PHANTOM_FORCE,
  MoveId.DIVE,
  MoveId.ELECTRO_SHOT,
  MoveId.ICE_BURN,
  MoveId.GEOMANCY,
  MoveId.FREEZE_SHOCK,
  MoveId.SKY_DROP,
  MoveId.SKY_ATTACK,
  MoveId.SKULL_BASH,
  MoveId.SOLAR_BEAM,
  MoveId.SOLAR_BLADE,
  MoveId.METEOR_BEAM,
  // Copying/Move-Calling moves + Instruct
  ...moveCallingMoves,
  MoveId.INSTRUCT,
  // Misc moves
  MoveId.SKETCH,
  MoveId.TRANSFORM,
  MoveId.MIMIC,
  MoveId.STRUGGLE,
  // NB: Add Max/G-Max/Z-Move blockage if or when they are implemented
]);
