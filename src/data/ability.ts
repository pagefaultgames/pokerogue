import Pokemon, { PokemonMove } from "../pokemon";
import { Type } from "./type";
import * as Utils from "../utils";
import { BattleStat } from "./battle-stat";
import { StatChangePhase } from "../battle-phases";

export class Ability {
  public id: Abilities;
  public name: string;
  public description: string;
  public generation: integer;
  public attrs: AbilityAttr[];

  constructor(id: Abilities, name: string, description: string, generation: integer) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.generation = generation;
    this.attrs = [];
  }

  getAttrs(attrType: { new(...args: any[]): AbilityAttr }): AbilityAttr[] {
    return this.attrs.filter(a => a instanceof attrType);
  }

  attr<T extends new (...args: any[]) => AbilityAttr>(AttrType: T, ...args: ConstructorParameters<T>): Ability {
    const attr = new AttrType(...args);
    this.attrs.push(attr);

    return this;
  }
}

export abstract class AbilityAttr { }

export class PreDefendAbilityAttr extends AbilityAttr {
  applyPreDefend(pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    return false;
  }
}

export class TypeImmunityAttr extends PreDefendAbilityAttr {
  private immuneType: Type;

  constructor(immuneType: Type) {
    super();

    this.immuneType = immuneType;
  }

  applyPreDefend(pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (move.getMove().type === this.immuneType) {
      (args[0] as Utils.NumberHolder).value = 0;
      return true;
    }

    return false;
  }
}

class TypeImmunityStatChangeAttr extends TypeImmunityAttr {
  private stat: BattleStat;
  private levels: integer;

  constructor(immuneType: Type, stat: BattleStat, levels: integer) {
    super(immuneType);

    this.stat = stat;
    this.levels = levels;
  }

  applyPreDefend(pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    const ret = super.applyPreDefend(pokemon, attacker, move, cancelled, args);

    if (ret) {
      cancelled.value = true;
      pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.isPlayer(), true, [ this.stat ], this.levels));
    }
    
    return ret;
  }
}

export class PreStatChangeAbilityAttr extends AbilityAttr {
  applyPreStatChange(pokemon: Pokemon, stat: BattleStat, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    return false;
  }
}

export class ProtectStatAttr extends PreStatChangeAbilityAttr {
  private protectedStats: BattleStat[];

  constructor(...stats: BattleStat[]) {
    super();

    this.protectedStats = stats;
  }

  applyPreStatChange(pokemon: Pokemon, stat: BattleStat, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (!this.protectedStats.length || this.protectedStats.indexOf(stat) > -1) {
      cancelled.value = true;
      return true;
    }
    
    return false;
  }
}

export function applyPreDefendAbilityAttrs(attrType: { new(...args: any[]): PreDefendAbilityAttr },
  pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, ...args: any[]): void {
  const ability = pokemon.getAbility();
  const attrs = ability.getAttrs(attrType) as PreDefendAbilityAttr[];
  for (let attr of attrs) {
    if (attr.applyPreDefend(pokemon, attacker, move, cancelled, args))
      console.log('Applied', ability.name, attr);
  }
}

export function applyPreStatChangeAbilityAttrs(attrType: { new(...args: any[]): PreStatChangeAbilityAttr },
  pokemon: Pokemon, stat: BattleStat, cancelled: Utils.BooleanHolder, ...args: any[]) {
    const ability = pokemon.getAbility();
    const attrs = ability.getAttrs(attrType) as PreStatChangeAbilityAttr[];
    for (let attr of attrs) {
      if (attr.applyPreStatChange(pokemon, stat, cancelled, args))
        console.log('Applied', ability.name, attr);
    }
}

export enum Abilities {
  NONE,
  AIR_LOCK = 1,
  ARENA_TRAP,
  BATTLE_ARMOR,
  BLAZE,
  CHLOROPHYLL,
  CLEAR_BODY,
  CLOUD_NINE,
  COLOR_CHANGE,
  COMPOUND_EYES,
  CUTE_CHARM,
  DAMP,
  DRIZZLE,
  DROUGHT,
  EARLY_BIRD,
  EFFECT_SPORE,
  FLAME_BODY,
  FLASH_FIRE,
  FORECAST,
  GUTS,
  HUGE_POWER,
  HUSTLE,
  HYPER_CUTTER,
  ILLUMINATE,
  IMMUNITY,
  INNER_FOCUS,
  INSOMNIA,
  INTIMIDATE,
  KEEN_EYE,
  LEVITATE,
  LIGHTNING_ROD,
  LIMBER,
  LIQUID_OOZE,
  MAGMA_ARMOR,
  MAGNET_PULL,
  MARVEL_SCALE,
  MINUS,
  NATURAL_CURE,
  OBLIVIOUS,
  OVERGROW,
  OWN_TEMPO,
  PICKUP,
  PLUS,
  POISON_POINT,
  PRESSURE,
  PURE_POWER,
  RAIN_DISH,
  ROCK_HEAD,
  ROUGH_SKIN,
  RUN_AWAY,
  SAND_STREAM,
  SAND_VEIL,
  SERENE_GRACE,
  SHADOW_TAG,
  SHED_SKIN,
  SHELL_ARMOR,
  SHIELD_DUST,
  SOUNDPROOF,
  SPEED_BOOST,
  STATIC,
  STENCH,
  STICKY_HOLD,
  STURDY,
  SUCTION_CUPS,
  SWARM,
  SWIFT_SWIM,
  SYNCHRONIZE,
  THICK_FAT,
  TORRENT,
  TRACE,
  TRUANT,
  VITAL_SPIRIT,
  VOLT_ABSORB,
  WATER_ABSORB,
  WATER_VEIL,
  WHITE_SMOKE,
  WONDER_GUARD,
  ADAPTABILITY,
  AFTERMATH,
  ANGER_POINT,
  ANTICIPATION,
  BAD_DREAMS,
  DOWNLOAD,
  DRY_SKIN,
  FILTER,
  FLOWER_GIFT,
  FOREWARN,
  FRISK,
  GLUTTONY,
  HEATPROOF,
  HONEY_GATHER,
  HYDRATION,
  ICE_BODY,
  IRON_FIST,
  KLUTZ,
  LEAF_GUARD,
  MAGIC_GUARD,
  MOLD_BREAKER,
  MOTOR_DRIVE,
  MULTITYPE,
  NO_GUARD,
  NORMALIZE,
  POISON_HEAL,
  QUICK_FEET,
  RECKLESS,
  RIVALRY,
  SCRAPPY,
  SIMPLE,
  SKILL_LINK,
  SLOW_START,
  SNIPER,
  SNOW_CLOAK,
  SNOW_WARNING,
  SOLAR_POWER,
  SOLID_ROCK,
  STALL,
  STEADFAST,
  STORM_DRAIN,
  SUPER_LUCK,
  TANGLED_FEET,
  TECHNICIAN,
  TINTED_LENS,
  UNAWARE,
  UNBURDEN,
  ANALYTIC,
  BIG_PECKS,
  CONTRARY,
  CURSED_BODY,
  DEFEATIST,
  DEFIANT,
  FLARE_BOOST,
  FRIEND_GUARD,
  HARVEST,
  HEALER,
  HEAVY_METAL,
  ILLUSION,
  IMPOSTER,
  INFILTRATOR,
  IRON_BARBS,
  JUSTIFIED,
  LIGHT_METAL,
  MAGIC_BOUNCE,
  MOODY,
  MOXIE,
  MULTISCALE,
  MUMMY,
  OVERCOAT,
  PICKPOCKET,
  POISON_TOUCH,
  PRANKSTER,
  RATTLED,
  REGENERATOR,
  SAND_FORCE,
  SAND_RUSH,
  SAP_SIPPER,
  SHEER_FORCE,
  TELEPATHY,
  TERAVOLT,
  TOXIC_BOOST,
  TURBOBLAZE,
  UNNERVE,
  VICTORY_STAR,
  WEAK_ARMOR,
  WONDER_SKIN,
  ZEN_MODE,
  COMPETITIVE,
  DARK_AURA,
  FAIRY_AURA,
  PROTEAN,
  SLUSH_RUSH,
  NEUTRALIZING_GAS
}

export const abilities = [
  new Ability(Abilities.NONE, "- (N)", "", 3),
  new Ability(Abilities.AIR_LOCK, "Air Lock (N)", "Eliminates the effects of weather.", 3),
  new Ability(Abilities.ARENA_TRAP, "Arena Trap (N)", "Prevents the foe from fleeing.", 3),
  new Ability(Abilities.BATTLE_ARMOR, "Battle Armor (N)", "The POKéMON is protected against critical hits.", 3),
  new Ability(Abilities.BLAZE, "Blaze (N)", "Powers up FIRE-type moves in a pinch.", 3),
  new Ability(Abilities.CHLOROPHYLL, "Chlorophyll (N)", "Boosts the POKéMON's SPEED in sunshine.", 3),
  new Ability(Abilities.CLEAR_BODY, "Clear Body", "Prevents other POKéMON from lowering its stats.", 3)
    .attr(ProtectStatAttr),
  new Ability(Abilities.CLOUD_NINE, "Cloud Nine (N)", "Eliminates the effects of weather.", 3),
  new Ability(Abilities.COLOR_CHANGE, "Color Change (N)", "Changes the POKéMON's type to the foe's move.", 3),
  new Ability(Abilities.COMPOUND_EYES, "Compound Eyes (N)", "The POKéMON's accuracy is boosted.", 3),
  new Ability(Abilities.CUTE_CHARM, "Cute Charm (N)", "Contact with the POKéMON may cause infatuation.", 3),
  new Ability(Abilities.DAMP, "Damp (N)", "Prevents the use of self-destructing moves.", 3),
  new Ability(Abilities.DRIZZLE, "Drizzle (N)", "The POKéMON makes it rain when it enters a battle.", 3),
  new Ability(Abilities.DROUGHT, "Drought (N)", "Turns the sunlight harsh when the POKéMON enters a battle.", 3),
  new Ability(Abilities.EARLY_BIRD, "Early Bird (N)", "The POKéMON awakens quickly from sleep.", 3),
  new Ability(Abilities.EFFECT_SPORE, "Effect Spore (N)", "Contact may poison or cause paralysis or sleep.", 3),
  new Ability(Abilities.FLAME_BODY, "Flame Body (N)", "Contact with the POKéMON may burn the attacker.", 3),
  new Ability(Abilities.FLASH_FIRE, "Flash Fire (N)", "It powers up FIRE-type moves if it's hit by one.", 3),
  new Ability(Abilities.FORECAST, "Forecast (N)", "Castform transforms with the weather.", 3),
  new Ability(Abilities.GUTS, "Guts (N)", "Boosts ATTACK if there is a status problem.", 3),
  new Ability(Abilities.HUGE_POWER, "Huge Power (N)", "Raises the POKéMON's ATTACK stat.", 3),
  new Ability(Abilities.HUSTLE, "Hustle (N)", "Boosts the ATTACK stat, but lowers accuracy.", 3),
  new Ability(Abilities.HYPER_CUTTER, "Hyper Cutter", "Prevents other POKéMON from lowering ATTACK stat.", 3)
    .attr(ProtectStatAttr, BattleStat.ATK),
  new Ability(Abilities.ILLUMINATE, "Illuminate (N)", "Raises the likelihood of meeting wild POKéMON.", 3),
  new Ability(Abilities.IMMUNITY, "Immunity (N)", "Prevents the POKéMON from getting poisoned.", 3),
  new Ability(Abilities.INNER_FOCUS, "Inner Focus (N)", "The POKéMON is protected from flinching.", 3),
  new Ability(Abilities.INSOMNIA, "Insomnia (N)", "Prevents the POKéMON from falling asleep.", 3),
  new Ability(Abilities.INTIMIDATE, "Intimidate (N)", "Lowers the foe's ATTACK stat.", 3),
  new Ability(Abilities.KEEN_EYE, "Keen Eye", "Prevents other POKéMON from lowering accuracy.", 3)
    .attr(ProtectStatAttr, BattleStat.ACC),
  new Ability(Abilities.LEVITATE, "Levitate", "Gives immunity to GROUND-type moves.", 3)
    .attr(TypeImmunityAttr, Type.FLYING),
  new Ability(Abilities.LIGHTNING_ROD, "Lightning Rod", "Draws in all ELECTRIC-type moves to up SP. ATK.", 3)
    .attr(TypeImmunityStatChangeAttr, Type.ELECTRIC, BattleStat.SPATK, 1),
  new Ability(Abilities.LIMBER, "Limber (N)", "The POKéMON is protected from paralysis.", 3),
  new Ability(Abilities.LIQUID_OOZE, "Liquid Ooze (N)", "Damages attackers using any draining move.", 3),
  new Ability(Abilities.MAGMA_ARMOR, "Magma Armor (N)", "Prevents the POKéMON from becoming frozen.", 3),
  new Ability(Abilities.MAGNET_PULL, "Magnet Pull (N)", "Prevents STEEL-type POKéMON from escaping.", 3),
  new Ability(Abilities.MARVEL_SCALE, "Marvel Scale (N)", "Ups DEFENSE if there is a status problem.", 3),
  new Ability(Abilities.MINUS, "Minus (N)", "Ups SP. ATK if another POKéMON has PLUS or MINUS.", 3),
  new Ability(Abilities.NATURAL_CURE, "Natural Cure (N)", "All status problems heal when it switches out.", 3),
  new Ability(Abilities.OBLIVIOUS, "Oblivious (N)", "Prevents it from becoming infatuated.", 3),
  new Ability(Abilities.OVERGROW, "Overgrow (N)", "Powers up GRASS-type moves in a pinch.", 3),
  new Ability(Abilities.OWN_TEMPO, "Own Tempo (N)", "Prevents the POKéMON from becoming confused.", 3),
  new Ability(Abilities.PICKUP, "Pickup (N)", "The POKéMON may pick up items.", 3),
  new Ability(Abilities.PLUS, "Plus (N)", "Ups SP. ATK if another POKéMON has PLUS or MINUS.", 3),
  new Ability(Abilities.POISON_POINT, "Poison Point (N)", "Contact with the POKéMON may poison the attacker.", 3),
  new Ability(Abilities.PRESSURE, "Pressure (N)", "The POKéMON raises the foe's PP usage.", 3),
  new Ability(Abilities.PURE_POWER, "Pure Power (N)", "Raises the POKéMON's ATTACK stat.", 3),
  new Ability(Abilities.RAIN_DISH, "Rain Dish (N)", "The POKéMON gradually regains HP in rain.", 3),
  new Ability(Abilities.ROCK_HEAD, "Rock Head (N)", "Protects the POKéMON from recoil damage.", 3),
  new Ability(Abilities.ROUGH_SKIN, "Rough Skin (N)", "Inflicts damage to the attacker on contact.", 3),
  new Ability(Abilities.RUN_AWAY, "Run Away (N)", "Enables a sure getaway from wild POKéMON.", 3),
  new Ability(Abilities.SAND_STREAM, "Sand Stream (N)", "The POKéMON summons a sandstorm in battle.", 3),
  new Ability(Abilities.SAND_VEIL, "Sand Veil (N)", "Boosts the POKéMON's evasion in a sandstorm.", 3),
  new Ability(Abilities.SERENE_GRACE, "Serene Grace (N)", "Boosts the likelihood of added effects appearing.", 3),
  new Ability(Abilities.SHADOW_TAG, "Shadow Tag (N)", "Prevents the foe from escaping.", 3),
  new Ability(Abilities.SHED_SKIN, "Shed Skin (N)", "The POKéMON may heal its own status problems.", 3),
  new Ability(Abilities.SHELL_ARMOR, "Shell Armor (N)", "The POKéMON is protected against critical hits.", 3),
  new Ability(Abilities.SHIELD_DUST, "Shield Dust (N)", "Blocks the added effects of attacks taken.", 3),
  new Ability(Abilities.SOUNDPROOF, "Soundproof (N)", "Gives immunity to sound-based moves.", 3),
  new Ability(Abilities.SPEED_BOOST, "Speed Boost (N)", "Its SPEED stat is gradually boosted.", 3),
  new Ability(Abilities.STATIC, "Static (N)", "Contact with the POKéMON may cause paralysis.", 3),
  new Ability(Abilities.STENCH, "Stench (N)", "The stench may cause the target to flinch.", 3),
  new Ability(Abilities.STICKY_HOLD, "Sticky Hold (N)", "Protects the POKéMON from item theft.", 3),
  new Ability(Abilities.STURDY, "Sturdy (N)", "It cannot be knocked out with one hit.", 3),
  new Ability(Abilities.SUCTION_CUPS, "Suction Cups (N)", "Negates all moves that force switching out.", 3),
  new Ability(Abilities.SWARM, "Swarm (N)", "Powers up BUG-type moves in a pinch.", 3),
  new Ability(Abilities.SWIFT_SWIM, "Swift Swim (N)", "Boosts the POKéMON's SPEED in rain.", 3),
  new Ability(Abilities.SYNCHRONIZE, "Synchronize (N)", "Passes a burn, poison, or paralysis to the foe.", 3),
  new Ability(Abilities.THICK_FAT, "Thick Fat (N)", "Ups resistance to Fire- and ICE-type moves.", 3),
  new Ability(Abilities.TORRENT, "Torrent (N)", "Powers up WATER-type moves in a pinch.", 3),
  new Ability(Abilities.TRACE, "Trace (N)", "The POKéMON copies a foe's Ability.", 3),
  new Ability(Abilities.TRUANT, "Truant (N)", "POKéMON can't attack on consecutive turns.", 3),
  new Ability(Abilities.VITAL_SPIRIT, "Vital Spirit (N)", "Prevents the POKéMON from falling asleep.", 3),
  new Ability(Abilities.VOLT_ABSORB, "Volt Absorb (N)", "Restores HP if hit by an ELECTRIC-type move.", 3),
  new Ability(Abilities.WATER_ABSORB, "Water Absorb (N)", "Restores HP if hit by a WATER-type move.", 3),
  new Ability(Abilities.WATER_VEIL, "Water Veil (N)", "Prevents the POKéMON from getting a burn.", 3),
  new Ability(Abilities.WHITE_SMOKE, "White Smoke", "Prevents other POKéMON from lowering its stats.", 3)
    .attr(ProtectStatAttr),
  new Ability(Abilities.WONDER_GUARD, "Wonder Guard (N)", "Only supereffective moves will hit.", 3),
  new Ability(Abilities.ADAPTABILITY, "Adaptability (N)", "Powers up moves of the same type.", 4),
  new Ability(Abilities.AFTERMATH, "Aftermath (N)", "Damages the attacker landing the finishing hit.", 4),
  new Ability(Abilities.ANGER_POINT, "Anger Point (N)", "Maxes ATTACK after taking a critical hit.", 4),
  new Ability(Abilities.ANTICIPATION, "Anticipation (N)", "Senses a foe's dangerous moves.", 4),
  new Ability(Abilities.BAD_DREAMS, "Bad Dreams (N)", "Reduces a sleeping foe's HP.", 4),
  new Ability(Abilities.DOWNLOAD, "Download (N)", "Adjusts power according to a foe's defenses.", 4),
  new Ability(Abilities.DRY_SKIN, "Dry Skin (N)", "Reduces HP if it is hot. Water restores HP.", 4),
  new Ability(Abilities.FILTER, "Filter (N)", "Reduces damage from super-effective attacks.", 4),
  new Ability(Abilities.FLOWER_GIFT, "Flower Gift (N)", "Powers up party POKéMON when it is sunny.", 4),
  new Ability(Abilities.FOREWARN, "Forewarn (N)", "Determines what moves a foe has.", 4),
  new Ability(Abilities.FRISK, "Frisk (N)", "The POKéMON can check a foe's held item.", 4),
  new Ability(Abilities.GLUTTONY, "Gluttony (N)", "Encourages the early use of a held Berry.", 4),
  new Ability(Abilities.HEATPROOF, "Heatproof (N)", "Weakens the power of FIRE-type moves.", 4),
  new Ability(Abilities.HONEY_GATHER, "Honey Gather (N)", "The POKéMON may gather Honey from somewhere.", 4),
  new Ability(Abilities.HYDRATION, "Hydration (N)", "Heals status problems if it is raining.", 4),
  new Ability(Abilities.ICE_BODY, "Ice Body (N)", "The POKéMON gradually regains HP in a hailstorm.", 4),
  new Ability(Abilities.IRON_FIST, "Iron Fist (N)", "Boosts the power of punching moves.", 4),
  new Ability(Abilities.KLUTZ, "Klutz (N)", "The POKéMON can't use any held items.", 4),
  new Ability(Abilities.LEAF_GUARD, "Leaf Guard (N)", "Prevents problems with status in sunny weather.", 4),
  new Ability(Abilities.MAGIC_GUARD, "Magic Guard (N)", "Protects the POKéMON from indirect damage.", 4),
  new Ability(Abilities.MOLD_BREAKER, "Mold Breaker (N)", "Moves can be used regardless of Abilities.", 4),
  new Ability(Abilities.MOTOR_DRIVE, "Motor Drive (N)", "Raises SPEED if hit by an ELECTRIC-type move.", 4),
  new Ability(Abilities.MULTITYPE, "Multitype (N)", "Changes type to match the held Plate.", 4),
  new Ability(Abilities.NO_GUARD, "No Guard (N)", "Ensures attacks by or against the POKéMON land.", 4),
  new Ability(Abilities.NORMALIZE, "Normalize (N)", "All the POKéMON's moves become the NORMAL type.", 4),
  new Ability(Abilities.POISON_HEAL, "Poison Heal (N)", "Restores HP if the POKéMON is poisoned.", 4),
  new Ability(Abilities.QUICK_FEET, "Quick Feet (N)", "Boosts SPEED if there is a status problem.", 4),
  new Ability(Abilities.RECKLESS, "Reckless (N)", "Powers up moves that have recoil damage.", 4),
  new Ability(Abilities.RIVALRY, "Rivalry (N)", "Deals more damage to a POKéMON of same gender.", 4),
  new Ability(Abilities.SCRAPPY, "Scrappy (N)", "Enables moves to hit GHOST-type POKéMON.", 4),
  new Ability(Abilities.SIMPLE, "Simple (N)", "Doubles all stat changes.", 4),
  new Ability(Abilities.SKILL_LINK, "Skill Link (N)", "Increases the frequency of multi-strike moves.", 4),
  new Ability(Abilities.SLOW_START, "Slow Start (N)", "Temporarily halves ATTACK and SPEED.", 4),
  new Ability(Abilities.SNIPER, "Sniper (N)", "Powers up moves if they become critical hits.", 4),
  new Ability(Abilities.SNOW_CLOAK, "Snow Cloak (N)", "Raises evasion in a hailstorm.", 4),
  new Ability(Abilities.SNOW_WARNING, "Snow Warning (N)", "The POKéMON summons a hailstorm in battle.", 4),
  new Ability(Abilities.SOLAR_POWER, "Solar Power (N)", "In sunshine, SP. ATK is boosted but HP decreases.", 4),
  new Ability(Abilities.SOLID_ROCK, "Solid Rock (N)", "Reduces damage from super-effective attacks.", 4),
  new Ability(Abilities.STALL, "Stall (N)", "The POKéMON moves after all other POKéMON do.", 4),
  new Ability(Abilities.STEADFAST, "Steadfast (N)", "Raises SPEED each time the POKéMON flinches.", 4),
  new Ability(Abilities.STORM_DRAIN, "Storm Drain", "Draws in all WATER-type moves to up SP. ATK.", 4)
    .attr(TypeImmunityStatChangeAttr, Type.WATER, BattleStat.SPATK, 1),
  new Ability(Abilities.SUPER_LUCK, "Super Luck (N)", "Heightens the critical-hit ratios of moves.", 4),
  new Ability(Abilities.TANGLED_FEET, "Tangled Feet (N)", "Raises evasion if the POKéMON is confused.", 4),
  new Ability(Abilities.TECHNICIAN, "Technician (N)", "Powers up the POKéMON's weaker moves.", 4),
  new Ability(Abilities.TINTED_LENS, "Tinted Lens (N)", "Powers up “not very effective” moves.", 4),
  new Ability(Abilities.UNAWARE, "Unaware (N)", "Ignores any stat changes in the POKéMON.", 4),
  new Ability(Abilities.UNBURDEN, "Unburden (N)", "Raises SPEED if a held item is used.", 4),
  new Ability(Abilities.ANALYTIC, "Analytic (N)", "Boosts move power when the POKéMON moves last.", 5),
  new Ability(Abilities.BIG_PECKS, "Big Pecks", "Protects the POKéMON from DEFENSE-lowering attacks.", 5)
    .attr(ProtectStatAttr, BattleStat.DEF),
  new Ability(Abilities.CONTRARY, "Contrary (N)", "Makes stat changes have an opposite effect.", 5),
  new Ability(Abilities.CURSED_BODY, "Cursed Body (N)", "May disable a move used on the POKéMON.", 5),
  new Ability(Abilities.DEFEATIST, "Defeatist (N)", "Lowers stats when HP drops below half.", 5),
  new Ability(Abilities.DEFIANT, "Defiant (N)", "Sharply raises ATTACK when the POKéMON's stats are lowered.", 5),
  new Ability(Abilities.FLARE_BOOST, "Flare Boost (N)", "Powers up special attacks when burned.", 5),
  new Ability(Abilities.FRIEND_GUARD, "Friend Guard (N)", "Reduces damage done to allies.", 5),
  new Ability(Abilities.HARVEST, "Harvest (N)", "May create another Berry after one is used.", 5),
  new Ability(Abilities.HEALER, "Healer (N)", "May heal an ally's status conditions.", 5),
  new Ability(Abilities.HEAVY_METAL, "Heavy Metal (N)", "Doubles the POKéMON's weight.", 5),
  new Ability(Abilities.ILLUSION, "Illusion (N)", "Enters battle disguised as the last POKéMON in the party.", 5),
  new Ability(Abilities.IMPOSTER, "Imposter (N)", "It transforms itself into the POKéMON it is facing.", 5),
  new Ability(Abilities.INFILTRATOR, "Infiltrator (N)", "Passes through the foe's barrier and strikes.", 5),
  new Ability(Abilities.IRON_BARBS, "Iron Barbs (N)", "Inflicts damage to the POKéMON on contact.", 5),
  new Ability(Abilities.JUSTIFIED, "Justified (N)", "Raises ATTACK when hit by a DARK-type move.", 5),
  new Ability(Abilities.LIGHT_METAL, "Light Metal (N)", "Halves the POKéMON's weight.", 5),
  new Ability(Abilities.MAGIC_BOUNCE, "Magic Bounce (N)", "Reflects status- changing moves.", 5),
  new Ability(Abilities.MOODY, "Moody (N)", "Raises one stat and lowers another.", 5),
  new Ability(Abilities.MOXIE, "Moxie (N)", "Boosts ATTACK after knocking out any POKéMON.", 5),
  new Ability(Abilities.MULTISCALE, "Multiscale (N)", "Reduces damage when HP is full.", 5),
  new Ability(Abilities.MUMMY, "Mummy (N)", "Contact with this POKéMON spreads this Ability.", 5),
  new Ability(Abilities.OVERCOAT, "Overcoat (N)", "Protects the POKéMON from weather damage.", 5),
  new Ability(Abilities.PICKPOCKET, "Pickpocket (N)", "Steals an item when hit by another POKéMON.", 5),
  new Ability(Abilities.POISON_TOUCH, "Poison Touch (N)", "May poison targets when a POKéMON makes contact.", 5),
  new Ability(Abilities.PRANKSTER, "Prankster (N)", "Gives priority to a status move.", 5),
  new Ability(Abilities.RATTLED, "Rattled (N)", "BUG, GHOST or DARK type moves scare it and boost its SPEED.", 5),
  new Ability(Abilities.REGENERATOR, "Regenerator (N)", "Restores a little HP when withdrawn from battle.", 5),
  new Ability(Abilities.SAND_FORCE, "Sand Force (N)", "Boosts certain moves' power in a sandstorm.", 5),
  new Ability(Abilities.SAND_RUSH, "Sand Rush (N)", "Boosts the POKéMON's SPEED in a sandstorm.", 5),
  new Ability(Abilities.SAP_SIPPER, "Sap Sipper (N)", "Boosts ATTACK when hit by a GRASS-type move.", 5),
  new Ability(Abilities.SHEER_FORCE, "Sheer Force (N)", "Removes added effects to increase move damage.", 5),
  new Ability(Abilities.TELEPATHY, "Telepathy (N)", "Anticipates an ally's ATTACK and dodges it.", 5),
  new Ability(Abilities.TERAVOLT, "Teravolt (N)", "Moves can be used regardless of Abilities.", 5),
  new Ability(Abilities.TOXIC_BOOST, "Toxic Boost (N)", "Powers up physical attacks when poisoned.", 5),
  new Ability(Abilities.TURBOBLAZE, "Turboblaze (N)", "Moves can be used regardless of Abilities.", 5),
  new Ability(Abilities.UNNERVE, "Unnerve (N)", "Makes the foe nervous and unable to eat Berries.", 5),
  new Ability(Abilities.VICTORY_STAR, "Victory Star (N)", "Boosts the accuracy of its allies and itself.", 5),
  new Ability(Abilities.WEAK_ARMOR, "Weak Armor (N)", "Physical attacks lower DEFENSE and raise SPEED.", 5),
  new Ability(Abilities.WONDER_SKIN, "Wonder Skin (N)", "Makes status-changing moves more likely to miss.", 5),
  new Ability(Abilities.ZEN_MODE, "Zen Mode (N)", "Changes form when HP drops below half.", 5),
  new Ability(Abilities.COMPETITIVE, "Competitive (N)", "Sharply raises SP. ATK when the POKéMON's stats are lowered.", 6),
  new Ability(Abilities.DARK_AURA, "Dark Aura (N)", "Raises power of DARK type moves for all POKéMON in battle.", 6),
  new Ability(Abilities.FAIRY_AURA, "Fairy Aura (N)", "Raises power of FAIRY type moves for all POKéMON in battle.", 6),
  new Ability(Abilities.PROTEAN, "Protean (N)", "Changes the POKéMON's type to its last used move.", 6),
  new Ability(Abilities.SLUSH_RUSH, "Slush Rush (N)", "Boosts the POKéMON's SPEED stat in a hailstorm.", 7),
  new Ability(Abilities.NEUTRALIZING_GAS, "Neutralizing Gas (N)", "Neutralizes abilities of all POKéMON in battle.", 8)
];