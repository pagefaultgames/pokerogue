import { ChargeAnim, MoveChargeAnim, initMoveAnim, loadMoveAnimAssets } from "./battle-anims";
import { DamagePhase, MovePhase, ObtainStatusEffectPhase, PokemonHealPhase, StatChangePhase } from "../battle-phases";
import { BattleStat } from "./battle-stat";
import { BattlerTagType } from "./battler-tag";
import { getPokemonMessage } from "../messages";
import Pokemon, { AttackMoveResult, HitResult, MoveResult, PlayerPokemon, PokemonMove, TurnMove } from "../pokemon";
import { StatusEffect, getStatusEffectDescriptor } from "./status-effect";
import { Type } from "./type";
import * as Utils from "../utils";
import { WeatherType } from "./weather";
import { ArenaTagType, ArenaTrapTag } from "./arena-tag";
import { BlockRecoilDamageAttr, applyAbAttrs } from "./ability";
import { PokemonHeldItemModifier } from "../modifier/modifier";
import { BattlerIndex } from "../battle";
import { Stat } from "./pokemon-stat";

export enum MoveCategory {
  PHYSICAL,
  SPECIAL,
  STATUS
}

export enum MoveTarget {
  USER,
  OTHER,
  ALL_OTHERS,
  NEAR_OTHER,
  ALL_NEAR_OTHERS,
  NEAR_ENEMY,
  ALL_NEAR_ENEMIES,
  RANDOM_NEAR_ENEMY,
  ALL_ENEMIES,
  ATTACKER,
  NEAR_ALLY,
  ALLY,
  USER_OR_NEAR_ALLY,
  USER_AND_ALLIES,
  ALL,
  USER_SIDE,
  ENEMY_SIDE,
  BOTH_SIDES
}

export enum MoveFlags {
  MAKES_CONTACT = 1,
  IGNORE_PROTECT = 2,
  IGNORE_VIRTUAL = 4
}

type MoveCondition = (user: Pokemon, target: Pokemon, move: Move) => boolean;
type UserMoveCondition = (user: Pokemon, move: Move) => boolean;

export default class Move {
  public id: Moves;
  public name: string;
  public type: Type;
  public category: MoveCategory;
  public moveTarget: MoveTarget;
  public power: integer;
  public accuracy: integer;
  public pp: integer;
  public tm: integer;
  public effect: string;
  public chance: integer;
  public priority: integer;
  public generation: integer;
  public attrs: MoveAttr[];
  private conditions: MoveCondition[];
  private flags: integer;

  constructor(id: Moves, name: string, type: Type, category: MoveCategory, defaultMoveTarget: MoveTarget, power: integer, accuracy: integer, pp: integer, tm: integer, effect: string, chance: integer, priority: integer, generation: integer) {
    this.id = id;
    this.name = name.toUpperCase();
    this.type = type;
    this.category = category;
    this.moveTarget = defaultMoveTarget;
    this.power = power;
    this.accuracy = accuracy;
    this.pp = pp;
    this.tm = tm;
    this.effect = effect;
    this.chance = chance;
    this.priority = priority;
    this.generation = generation;

    this.attrs = [];
    this.conditions = [];

    this.flags = 0;
    if (defaultMoveTarget === MoveTarget.USER)
      this.setFlag(MoveFlags.IGNORE_PROTECT, true);
    if (category === MoveCategory.PHYSICAL)
      this.setFlag(MoveFlags.MAKES_CONTACT, true);
  }

  getAttrs(attrType: { new(...args: any[]): MoveAttr }): MoveAttr[] {
    return this.attrs.filter(a => a instanceof attrType);
  }

  attr<T extends new (...args: any[]) => MoveAttr>(AttrType: T, ...args: ConstructorParameters<T>): Move {
    const attr = new AttrType(...args);
    this.attrs.push(attr);
    const attrCondition = attr.getCondition();
    if (attrCondition)
      this.conditions.push(attrCondition);

    return this;
  }

  addAttr(attr: MoveAttr): Move {
    this.attrs.push(attr);
    const attrCondition = attr.getCondition();
    if (attrCondition)
      this.conditions.push(attrCondition);

    return this;
  }

  target(moveTarget: MoveTarget): Move {
    this.moveTarget = moveTarget;
    return this;
  }

  hasFlag(flag: MoveFlags): boolean {
    return !!(this.flags & flag);
  }

  condition(condition: MoveCondition): Move {
    this.conditions.push(condition);

    return this;
  }

  private setFlag(flag: MoveFlags, on: boolean): void {
    if (on)
      this.flags |= flag;
    else
      this.flags ^= flag;
  }

  makesContact(makesContact?: boolean): Move {
    this.setFlag(MoveFlags.MAKES_CONTACT, makesContact);
    return this;
  }

  ignoresProtect(ignoresProtect?: boolean): Move {
    this.setFlag(MoveFlags.IGNORE_PROTECT, ignoresProtect);
    return this;
  }

  ignoresVirtual(ignoresVirtual?: boolean): Move {
    this.setFlag(MoveFlags.IGNORE_VIRTUAL, ignoresVirtual);
    return this;
  }

  applyConditions(user: Pokemon, target: Pokemon, move: Move): boolean {
    for (let condition of this.conditions) {
      if (!condition(user, target, move))
        return false;
    }

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    let score = 0;

    for (let attr of this.attrs)
      score += attr.getUserBenefitScore(user, target, move);

    return score;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    let score = 0;

    for (let attr of this.attrs)
      score += attr.getTargetBenefitScore(user, target, move);

    return score;
  }
}

export class AttackMove extends Move {
  constructor(id: Moves, name: string, type: Type, category: MoveCategory, power: integer, accuracy: integer, pp: integer, tm: integer, effect: string, chance: integer, priority: integer, generation: integer) {
    super(id, name, type, category, MoveTarget.NEAR_OTHER, power, accuracy, pp, tm, effect, chance, priority, generation);
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    let ret = super.getTargetBenefitScore(user, target, move);

    let attackScore = 0;

    const effectiveness = target.getAttackMoveEffectiveness(this.type);
    attackScore = Math.pow(effectiveness - 1, 2) * effectiveness < 1 ? -2 : 2;
    if (attackScore) {
      if (this.category === MoveCategory.PHYSICAL) {
        if (user.getBattleStat(Stat.ATK) > user.getBattleStat(Stat.SPATK)) {
          const statRatio = user.getBattleStat(Stat.SPATK) / user.getBattleStat(Stat.ATK);
          if (statRatio <= 0.75)
            attackScore *= 2;
          else if (statRatio <= 0.875)
            attackScore *= 1.5;
        }
      } else {
        if (user.getBattleStat(Stat.SPATK) > user.getBattleStat(Stat.ATK)) {
          const statRatio = user.getBattleStat(Stat.ATK) / user.getBattleStat(Stat.SPATK);
          if (statRatio <= 0.75)
            attackScore *= 2;
          else if (statRatio <= 0.875)
            attackScore *= 1.5;
        }
      }

      const power = new Utils.NumberHolder(this.power);
      applyMoveAttrs(VariablePowerAttr, user, target, move, power);

      attackScore += Math.floor(power.value / 5);
    }

    ret -= attackScore;

    return ret;
  }
}

export class StatusMove extends Move {
  constructor(id: Moves, name: string, type: Type, accuracy: integer, pp: integer, tm: integer, effect: string, chance: integer, priority: integer, generation: integer) {
    super(id, name, type, MoveCategory.STATUS, MoveTarget.NEAR_OTHER, -1, accuracy, pp, tm, effect, chance, priority, generation);
  }
}

export class SelfStatusMove extends Move {
  constructor(id: Moves, name: string, type: Type, accuracy: integer, pp: integer, tm: integer, effect: string, chance: integer, priority: integer, generation: integer) {
    super(id, name, type, MoveCategory.STATUS, MoveTarget.USER, -1, accuracy, pp, tm, effect, chance, priority, generation);
  }
}

export enum Moves {
  NONE,
  POUND,
  KARATE_CHOP,
  DOUBLE_SLAP,
  COMET_PUNCH,
  MEGA_PUNCH,
  PAY_DAY,
  FIRE_PUNCH,
  ICE_PUNCH,
  THUNDER_PUNCH,
  SCRATCH,
  VISE_GRIP,
  GUILLOTINE,
  RAZOR_WIND,
  SWORDS_DANCE,
  CUT,
  GUST,
  WING_ATTACK,
  WHIRLWIND,
  FLY,
  BIND,
  SLAM,
  VINE_WHIP,
  STOMP,
  DOUBLE_KICK,
  MEGA_KICK,
  JUMP_KICK,
  ROLLING_KICK,
  SAND_ATTACK,
  HEADBUTT,
  HORN_ATTACK,
  FURY_ATTACK,
  HORN_DRILL,
  TACKLE,
  BODY_SLAM,
  WRAP,
  TAKE_DOWN,
  THRASH,
  DOUBLE_EDGE,
  TAIL_WHIP,
  POISON_STING,
  TWINEEDLE,
  PIN_MISSILE,
  LEER,
  BITE,
  GROWL,
  ROAR,
  SING,
  SUPERSONIC,
  SONIC_BOOM,
  DISABLE,
  ACID,
  EMBER,
  FLAMETHROWER,
  MIST,
  WATER_GUN,
  HYDRO_PUMP,
  SURF,
  ICE_BEAM,
  BLIZZARD,
  PSYBEAM,
  BUBBLE_BEAM,
  AURORA_BEAM,
  HYPER_BEAM,
  PECK,
  DRILL_PECK,
  SUBMISSION,
  LOW_KICK,
  COUNTER,
  SEISMIC_TOSS,
  STRENGTH,
  ABSORB,
  MEGA_DRAIN,
  LEECH_SEED,
  GROWTH,
  RAZOR_LEAF,
  SOLAR_BEAM,
  POISON_POWDER,
  STUN_SPORE,
  SLEEP_POWDER,
  PETAL_DANCE,
  STRING_SHOT,
  DRAGON_RAGE,
  FIRE_SPIN,
  THUNDER_SHOCK,
  THUNDERBOLT,
  THUNDER_WAVE,
  THUNDER,
  ROCK_THROW,
  EARTHQUAKE,
  FISSURE,
  DIG,
  TOXIC,
  CONFUSION,
  PSYCHIC,
  HYPNOSIS,
  MEDITATE,
  AGILITY,
  QUICK_ATTACK,
  RAGE,
  TELEPORT,
  NIGHT_SHADE,
  MIMIC,
  SCREECH,
  DOUBLE_TEAM,
  RECOVER,
  HARDEN,
  MINIMIZE,
  SMOKESCREEN,
  CONFUSE_RAY,
  WITHDRAW,
  DEFENSE_CURL,
  BARRIER,
  LIGHT_SCREEN,
  HAZE,
  REFLECT,
  FOCUS_ENERGY,
  BIDE,
  METRONOME,
  MIRROR_MOVE,
  SELF_DESTRUCT,
  EGG_BOMB,
  LICK,
  SMOG,
  SLUDGE,
  BONE_CLUB,
  FIRE_BLAST,
  WATERFALL,
  CLAMP,
  SWIFT,
  SKULL_BASH,
  SPIKE_CANNON,
  CONSTRICT,
  AMNESIA,
  KINESIS,
  SOFT_BOILED,
  HIGH_JUMP_KICK,
  GLARE,
  DREAM_EATER,
  POISON_GAS,
  BARRAGE,
  LEECH_LIFE,
  LOVELY_KISS,
  SKY_ATTACK,
  TRANSFORM,
  BUBBLE,
  DIZZY_PUNCH,
  SPORE,
  FLASH,
  PSYWAVE,
  SPLASH,
  ACID_ARMOR,
  CRABHAMMER,
  EXPLOSION,
  FURY_SWIPES,
  BONEMERANG,
  REST,
  ROCK_SLIDE,
  HYPER_FANG,
  SHARPEN,
  CONVERSION,
  TRI_ATTACK,
  SUPER_FANG,
  SLASH,
  SUBSTITUTE,
  STRUGGLE,
  SKETCH,
  TRIPLE_KICK,
  THIEF,
  SPIDER_WEB,
  MIND_READER,
  NIGHTMARE,
  FLAME_WHEEL,
  SNORE,
  CURSE,
  FLAIL,
  CONVERSION_2,
  AEROBLAST,
  COTTON_SPORE,
  REVERSAL,
  SPITE,
  POWDER_SNOW,
  PROTECT,
  MACH_PUNCH,
  SCARY_FACE,
  FEINT_ATTACK,
  SWEET_KISS,
  BELLY_DRUM,
  SLUDGE_BOMB,
  MUD_SLAP,
  OCTAZOOKA,
  SPIKES,
  ZAP_CANNON,
  FORESIGHT,
  DESTINY_BOND,
  PERISH_SONG,
  ICY_WIND,
  DETECT,
  BONE_RUSH,
  LOCK_ON,
  OUTRAGE,
  SANDSTORM,
  GIGA_DRAIN,
  ENDURE,
  CHARM,
  ROLLOUT,
  FALSE_SWIPE,
  SWAGGER,
  MILK_DRINK,
  SPARK,
  FURY_CUTTER,
  STEEL_WING,
  MEAN_LOOK,
  ATTRACT,
  SLEEP_TALK,
  HEAL_BELL,
  RETURN,
  PRESENT,
  FRUSTRATION,
  SAFEGUARD,
  PAIN_SPLIT,
  SACRED_FIRE,
  MAGNITUDE,
  DYNAMIC_PUNCH,
  MEGAHORN,
  DRAGON_BREATH,
  BATON_PASS,
  ENCORE,
  PURSUIT,
  RAPID_SPIN,
  SWEET_SCENT,
  IRON_TAIL,
  METAL_CLAW,
  VITAL_THROW,
  MORNING_SUN,
  SYNTHESIS,
  MOONLIGHT,
  HIDDEN_POWER,
  CROSS_CHOP,
  TWISTER,
  RAIN_DANCE,
  SUNNY_DAY,
  CRUNCH,
  MIRROR_COAT,
  PSYCH_UP,
  EXTREME_SPEED,
  ANCIENT_POWER,
  SHADOW_BALL,
  FUTURE_SIGHT,
  ROCK_SMASH,
  WHIRLPOOL,
  BEAT_UP,
  FAKE_OUT,
  UPROAR,
  STOCKPILE,
  SPIT_UP,
  SWALLOW,
  HEAT_WAVE,
  HAIL,
  TORMENT,
  FLATTER,
  WILL_O_WISP,
  MEMENTO,
  FACADE,
  FOCUS_PUNCH,
  SMELLING_SALTS,
  FOLLOW_ME,
  NATURE_POWER,
  CHARGE,
  TAUNT,
  HELPING_HAND,
  TRICK,
  ROLE_PLAY,
  WISH,
  ASSIST,
  INGRAIN,
  SUPERPOWER,
  MAGIC_COAT,
  RECYCLE,
  REVENGE,
  BRICK_BREAK,
  YAWN,
  KNOCK_OFF,
  ENDEAVOR,
  ERUPTION,
  SKILL_SWAP,
  IMPRISON,
  REFRESH,
  GRUDGE,
  SNATCH,
  SECRET_POWER,
  DIVE,
  ARM_THRUST,
  CAMOUFLAGE,
  TAIL_GLOW,
  LUSTER_PURGE,
  MIST_BALL,
  FEATHER_DANCE,
  TEETER_DANCE,
  BLAZE_KICK,
  MUD_SPORT,
  ICE_BALL,
  NEEDLE_ARM,
  SLACK_OFF,
  HYPER_VOICE,
  POISON_FANG,
  CRUSH_CLAW,
  BLAST_BURN,
  HYDRO_CANNON,
  METEOR_MASH,
  ASTONISH,
  WEATHER_BALL,
  AROMATHERAPY,
  FAKE_TEARS,
  AIR_CUTTER,
  OVERHEAT,
  ODOR_SLEUTH,
  ROCK_TOMB,
  SILVER_WIND,
  METAL_SOUND,
  GRASS_WHISTLE,
  TICKLE,
  COSMIC_POWER,
  WATER_SPOUT,
  SIGNAL_BEAM,
  SHADOW_PUNCH,
  EXTRASENSORY,
  SKY_UPPERCUT,
  SAND_TOMB,
  SHEER_COLD,
  MUDDY_WATER,
  BULLET_SEED,
  AERIAL_ACE,
  ICICLE_SPEAR,
  IRON_DEFENSE,
  BLOCK,
  HOWL,
  DRAGON_CLAW,
  FRENZY_PLANT,
  BULK_UP,
  BOUNCE,
  MUD_SHOT,
  POISON_TAIL,
  COVET,
  VOLT_TACKLE,
  MAGICAL_LEAF,
  WATER_SPORT,
  CALM_MIND,
  LEAF_BLADE,
  DRAGON_DANCE,
  ROCK_BLAST,
  SHOCK_WAVE,
  WATER_PULSE,
  DOOM_DESIRE,
  PSYCHO_BOOST,
  ROOST,
  GRAVITY,
  MIRACLE_EYE,
  WAKE_UP_SLAP,
  HAMMER_ARM,
  GYRO_BALL,
  HEALING_WISH,
  BRINE,
  NATURAL_GIFT,
  FEINT,
  PLUCK,
  TAILWIND,
  ACUPRESSURE,
  METAL_BURST,
  U_TURN,
  CLOSE_COMBAT,
  PAYBACK,
  ASSURANCE,
  EMBARGO,
  FLING,
  PSYCHO_SHIFT,
  TRUMP_CARD,
  HEAL_BLOCK,
  WRING_OUT,
  POWER_TRICK,
  GASTRO_ACID,
  LUCKY_CHANT,
  ME_FIRST,
  COPYCAT,
  POWER_SWAP,
  GUARD_SWAP,
  PUNISHMENT,
  LAST_RESORT,
  WORRY_SEED,
  SUCKER_PUNCH,
  TOXIC_SPIKES,
  HEART_SWAP,
  AQUA_RING,
  MAGNET_RISE,
  FLARE_BLITZ,
  FORCE_PALM,
  AURA_SPHERE,
  ROCK_POLISH,
  POISON_JAB,
  DARK_PULSE,
  NIGHT_SLASH,
  AQUA_TAIL,
  SEED_BOMB,
  AIR_SLASH,
  X_SCISSOR,
  BUG_BUZZ,
  DRAGON_PULSE,
  DRAGON_RUSH,
  POWER_GEM,
  DRAIN_PUNCH,
  VACUUM_WAVE,
  FOCUS_BLAST,
  ENERGY_BALL,
  BRAVE_BIRD,
  EARTH_POWER,
  SWITCHEROO,
  GIGA_IMPACT,
  NASTY_PLOT,
  BULLET_PUNCH,
  AVALANCHE,
  ICE_SHARD,
  SHADOW_CLAW,
  THUNDER_FANG,
  ICE_FANG,
  FIRE_FANG,
  SHADOW_SNEAK,
  MUD_BOMB,
  PSYCHO_CUT,
  ZEN_HEADBUTT,
  MIRROR_SHOT,
  FLASH_CANNON,
  ROCK_CLIMB,
  DEFOG,
  TRICK_ROOM,
  DRACO_METEOR,
  DISCHARGE,
  LAVA_PLUME,
  LEAF_STORM,
  POWER_WHIP,
  ROCK_WRECKER,
  CROSS_POISON,
  GUNK_SHOT,
  IRON_HEAD,
  MAGNET_BOMB,
  STONE_EDGE,
  CAPTIVATE,
  STEALTH_ROCK,
  GRASS_KNOT,
  CHATTER,
  JUDGMENT,
  BUG_BITE,
  CHARGE_BEAM,
  WOOD_HAMMER,
  AQUA_JET,
  ATTACK_ORDER,
  DEFEND_ORDER,
  HEAL_ORDER,
  HEAD_SMASH,
  DOUBLE_HIT,
  ROAR_OF_TIME,
  SPACIAL_REND,
  LUNAR_DANCE,
  CRUSH_GRIP,
  MAGMA_STORM,
  DARK_VOID,
  SEED_FLARE,
  OMINOUS_WIND,
  SHADOW_FORCE,
  HONE_CLAWS,
  WIDE_GUARD,
  GUARD_SPLIT,
  POWER_SPLIT,
  WONDER_ROOM,
  PSYSHOCK,
  VENOSHOCK,
  AUTOTOMIZE,
  RAGE_POWDER,
  TELEKINESIS,
  MAGIC_ROOM,
  SMACK_DOWN,
  STORM_THROW,
  FLAME_BURST,
  SLUDGE_WAVE,
  QUIVER_DANCE,
  HEAVY_SLAM,
  SYNCHRONOISE,
  ELECTRO_BALL,
  SOAK,
  FLAME_CHARGE,
  COIL,
  LOW_SWEEP,
  ACID_SPRAY,
  FOUL_PLAY,
  SIMPLE_BEAM,
  ENTRAINMENT,
  AFTER_YOU,
  ROUND,
  ECHOED_VOICE,
  CHIP_AWAY,
  CLEAR_SMOG,
  STORED_POWER,
  QUICK_GUARD,
  ALLY_SWITCH,
  SCALD,
  SHELL_SMASH,
  HEAL_PULSE,
  HEX,
  SKY_DROP,
  SHIFT_GEAR,
  CIRCLE_THROW,
  INCINERATE,
  QUASH,
  ACROBATICS,
  REFLECT_TYPE,
  RETALIATE,
  FINAL_GAMBIT,
  BESTOW,
  INFERNO,
  WATER_PLEDGE,
  FIRE_PLEDGE,
  GRASS_PLEDGE,
  VOLT_SWITCH,
  STRUGGLE_BUG,
  BULLDOZE,
  FROST_BREATH,
  DRAGON_TAIL,
  WORK_UP,
  ELECTROWEB,
  WILD_CHARGE,
  DRILL_RUN,
  DUAL_CHOP,
  HEART_STAMP,
  HORN_LEECH,
  SACRED_SWORD,
  RAZOR_SHELL,
  HEAT_CRASH,
  LEAF_TORNADO,
  STEAMROLLER,
  COTTON_GUARD,
  NIGHT_DAZE,
  PSYSTRIKE,
  TAIL_SLAP,
  HURRICANE,
  HEAD_CHARGE,
  GEAR_GRIND,
  SEARING_SHOT,
  TECHNO_BLAST,
  RELIC_SONG,
  SECRET_SWORD,
  GLACIATE,
  BOLT_STRIKE,
  BLUE_FLARE,
  FIERY_DANCE,
  FREEZE_SHOCK,
  ICE_BURN,
  SNARL,
  ICICLE_CRASH,
  V_CREATE,
  FUSION_FLARE,
  FUSION_BOLT,
  MOONBLAST,
  PHANTOM_FORCE,
  GEOMANCY,
  OBLIVION_WING,
  DYNAMAX_CANNON
}

export abstract class MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean | Promise<boolean> {
    return true;
  }

  getCondition(): MoveCondition {
    return null;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return 0;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return 0;
  }
}

export enum MoveEffectTrigger {
  PRE_APPLY,
  POST_APPLY,
  HIT
}

export class MoveEffectAttr extends MoveAttr {
  public selfTarget: boolean;
  public trigger: MoveEffectTrigger;

  constructor(selfTarget?: boolean, trigger?: MoveEffectTrigger) {
    super();

    this.selfTarget = !!selfTarget;
    this.trigger = trigger !== undefined ? trigger : MoveEffectTrigger.POST_APPLY;
  }

  canApply(user: Pokemon, target: Pokemon, move: Move, args: any[]) {
    return !!(this.selfTarget ? user.hp && !user.getTag(BattlerTagType.FRENZY) : target.hp)
      && (this.selfTarget || !target.getTag(BattlerTagType.PROTECTED) || move.hasFlag(MoveFlags.IGNORE_PROTECT));
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]) {
    return this.canApply(user, target, move, args);
  }
}

export class HighCritAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value++;

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return 3;
  }
}

export class CritOnlyAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.BooleanHolder).value = true;

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return 5;
  }
}

export class FixedDamageAttr extends MoveAttr {
  private damage: integer;

  constructor(damage: integer) {
    super();

    this.damage = damage;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = this.getDamage(user, target, move);

    return true;
  }

  getDamage(user: Pokemon, target: Pokemon, move: Move): integer {
    return this.damage;
  }
}

export class UserHpDamageAttr extends FixedDamageAttr {
  constructor() {
    super(0);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = user.hp;

    return true;
  }
}

export class TargetHalfHpDamageAttr extends FixedDamageAttr {
  constructor() {
    super(0);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = Math.floor(target.hp / 2);

    return true;
  }
}

type MoveFilter = (move: Move) => boolean;

export class CounterDamageAttr extends FixedDamageAttr {
  private moveFilter: MoveFilter;

  constructor(moveFilter: MoveFilter) {
    super(0);

    this.moveFilter = moveFilter;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const damage = user.turnData.attacksReceived.filter(ar => this.moveFilter(allMoves[ar.move])).reduce((total: integer, ar: AttackMoveResult) => total + ar.damage, 0);
    (args[0] as Utils.IntegerHolder).value = Math.max(damage * 2, 1);

    return true;
  }

  getCondition(): MoveCondition {
    return (user: Pokemon, target: Pokemon, move: Move) => !!user.turnData.attacksReceived.filter(ar => this.moveFilter(allMoves[ar.move])).length;
  }
}

export class LevelDamageAttr extends FixedDamageAttr {
  constructor() {
    super(0);
  }

  getDamage(user: Pokemon, target: Pokemon, move: Move): number {
    return user.level;
  }
}

export class RandomLevelDamageAttr extends FixedDamageAttr {
  constructor() {
    super(0);
  }

  getDamage(user: Pokemon, target: Pokemon, move: Move): number {
    return user.level * (Utils.randInt(100, 50) * 0.01);
  }
}

export class RecoilAttr extends MoveEffectAttr {
  private useHp: boolean;

  constructor(useHp?: boolean) {
    super(true);

    this.useHp = useHp;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const cancelled = new Utils.BooleanHolder(false);
    applyAbAttrs(BlockRecoilDamageAttr, user, cancelled);

    if (cancelled.value)
      return false;

    const recoilDamage = Math.max(Math.floor((!this.useHp ? user.turnData.damageDealt : user.getMaxHp()) / 4), 1);
    user.scene.unshiftPhase(new DamagePhase(user.scene, user.getBattlerIndex(), HitResult.OTHER));
    user.scene.queueMessage(getPokemonMessage(user, ' is hit\nwith recoil!'));
    user.damage(recoilDamage);

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return Math.floor((move.power / 5) / -4);
  }
}

export class SacrificialAttr extends MoveEffectAttr {
  constructor() {
    super(true, MoveEffectTrigger.PRE_APPLY);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    user.scene.unshiftPhase(new DamagePhase(user.scene, user.getBattlerIndex(), HitResult.OTHER));
    user.damage(user.getMaxHp());

    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return Math.ceil((1 - user.getHpRatio()) * 10) - 10;
  }
}

export enum MultiHitType {
  _2,
  _2_TO_5,
  _3_INCR
}

export class HealAttr extends MoveEffectAttr {
  private healRatio: number;
  private showAnim: boolean;

  constructor(healRatio?: number, showAnim?: boolean, selfTarget?: boolean) {
    super(selfTarget === undefined || selfTarget);

    this.healRatio = healRatio || 1;
    this.showAnim = !!showAnim;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    this.addHealPhase(this.selfTarget ? user : target, this.healRatio);
    return true;
  }

  addHealPhase(target: Pokemon, healRatio: number) {
    target.scene.unshiftPhase(new PokemonHealPhase(target.scene, target.getBattlerIndex(),
      Math.max(Math.floor(target.getMaxHp() * healRatio), 1), getPokemonMessage(target, ' regained\nhealth!'), true, !this.showAnim));
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return (1 - (this.selfTarget ? user : target).getHpRatio()) * 20;
  }
}

export class WeatherHealAttr extends HealAttr {
  constructor() {
    super(0.5);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    let healRatio = 0.5;
    if (!user.scene.arena.weather?.isEffectSuppressed(user.scene)) {
      const weatherType = user.scene.arena.weather?.weatherType || WeatherType.NONE;
      switch (weatherType) {
        case WeatherType.SUNNY:
        case WeatherType.HARSH_SUN:
          healRatio = 2 / 3;
          break;
        case WeatherType.RAIN:
        case WeatherType.SANDSTORM:
        case WeatherType.HAIL:
        case WeatherType.HEAVY_RAIN:
          healRatio = 0.25;
          break;
      }
    }
    this.addHealPhase(user, healRatio);
    return true;
  }
}

export class HitHealAttr extends MoveEffectAttr {
  private healRatio: number;

  constructor(healRatio?: number) {
    super(true, MoveEffectTrigger.HIT);

    this.healRatio = healRatio || 0.5;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    user.scene.unshiftPhase(new PokemonHealPhase(user.scene, user.getBattlerIndex(),
      Math.max(Math.floor(user.turnData.damageDealt * this.healRatio), 1), getPokemonMessage(target, ` had its\nenergy drained!`), false, true));
    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return Math.floor(Math.max((1 - user.getHpRatio()) - 0.33, 0) * ((move.power / 5) / 4));
  }
}

export class MultiHitAttr extends MoveAttr {
  private multiHitType: MultiHitType;

  constructor(multiHitType?: MultiHitType) {
    super();

    this.multiHitType = multiHitType !== undefined ? multiHitType : MultiHitType._2_TO_5;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    let hitTimes: integer;
    switch (this.multiHitType) {
      case MultiHitType._2_TO_5:
        const rand = Utils.randInt(16);
        if (rand >= 10)
          hitTimes = 2;
        else if (rand >= 4)
          hitTimes = 3;
        else if (rand >= 2)
          hitTimes = 4;
        else
          hitTimes = 5;
        break;
      case MultiHitType._2:
        hitTimes = 2;
        break;
      case MultiHitType._3_INCR:
        hitTimes = 3;
        // TODO: Add power increase for every hit
        break;
    }
    (args[0] as Utils.IntegerHolder).value = hitTimes;
    return true;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return 5;
  }
}

export class StatusEffectAttr extends MoveEffectAttr {
  public effect: StatusEffect;
  public cureTurn: integer;

  constructor(effect: StatusEffect, selfTarget?: boolean, cureTurn?: integer) {
    super(selfTarget, MoveEffectTrigger.HIT);

    this.effect = effect;
    this.cureTurn = cureTurn;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const statusCheck = move.chance < 0 || move.chance === 100 || Utils.randInt(100) < move.chance;
    if (statusCheck) {
      const pokemon = this.selfTarget ? user : target;
      if (!pokemon.status || (pokemon.status.effect === this.effect && move.chance < 0)) {
        user.scene.unshiftPhase(new ObtainStatusEffectPhase(user.scene, pokemon.getBattlerIndex(), this.effect, this.cureTurn));
        return true;
      }
    }
    return false;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    return !(this.selfTarget ? user : target).status ? Math.floor(move.chance * -0.1) : 0;
  }
}

export class StealHeldItemAttr extends MoveEffectAttr {
  constructor() {
    super(false, MoveEffectTrigger.HIT);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const heldItems = this.getTargetHeldItems(target);
    if (heldItems.length) {
      const stolenItem = heldItems[Utils.randInt(heldItems.length)];
      user.scene.tryTransferHeldItemModifier(stolenItem, user, false, false);
      // Assumes the transfer was successful
      user.scene.queueMessage(getPokemonMessage(user, ` stole\n${target.name}'s ${stolenItem.type.name}!`));
      return true;
    }

    return false;
  }

  getTargetHeldItems(target: Pokemon): PokemonHeldItemModifier[] {
    return target.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && (m as PokemonHeldItemModifier).pokemonId === target.id, target.isPlayer()) as PokemonHeldItemModifier[];
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    const heldItems = this.getTargetHeldItems(target);
    return heldItems.length ? 5 : 0;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): number {
    const heldItems = this.getTargetHeldItems(target);
    return heldItems.length ? -5 : 0;
  }
}

export class HealStatusEffectAttr extends MoveEffectAttr {
  private effects: StatusEffect[];

  constructor(selfTarget: boolean, ...effects: StatusEffect[]) {
    super(selfTarget);

    this.effects = effects;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const pokemon = this.selfTarget ? user : target;
    if (pokemon.status && this.effects.indexOf(pokemon.status.effect) > -1) {
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` was cured of its\n${getStatusEffectDescriptor(pokemon.status.effect)}!`));
      pokemon.resetStatus();
      pokemon.updateInfo();
      
      return true;
    }

    return false;
  }

  getUserBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return user.status ? 10 : 0;
  }
}

export class BypassSleepAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (user.status?.effect === StatusEffect.SLEEP) {
      user.addTag(BattlerTagType.BYPASS_SLEEP, 1, move.id, user.id);
      return true;
    }

    return false;
  }
}

export class WeatherChangeAttr extends MoveEffectAttr {
  private weatherType: WeatherType;
  
  constructor(weatherType: WeatherType) {
    super();

    this.weatherType = weatherType;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    return user.scene.arena.trySetWeather(this.weatherType, true);
  }

  getCondition(): MoveCondition {
    return (user: Pokemon, target: Pokemon, move: Move) => !user.scene.arena.weather || (user.scene.arena.weather.weatherType !== this.weatherType && !user.scene.arena.weather.isImmutable());
  }
}

export class ClearWeatherAttr extends MoveEffectAttr {
  private weatherType: WeatherType;
  
  constructor(weatherType: WeatherType) {
    super();

    this.weatherType = weatherType;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (user.scene.arena.weather?.weatherType === this.weatherType)
      return user.scene.arena.trySetWeather(WeatherType.NONE, true);

    return false;
  }
}

export class OneHitKOAttr extends MoveEffectAttr {
  constructor() {
    super(false, MoveEffectTrigger.HIT);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    target.damage(target.hp, true);
    user.scene.queueMessage('It\'s a one-hit KO!');
    return true;
  }
}

export class OverrideMoveEffectAttr extends MoveAttr { }

export class ChargeAttr extends OverrideMoveEffectAttr {
  public chargeAnim: ChargeAnim;
  private chargeText: string;
  private tagType: BattlerTagType;
  public chargeEffect: boolean;

  constructor(chargeAnim: ChargeAnim, chargeText: string, tagType?: BattlerTagType, chargeEffect?: boolean) {
    super();

    this.chargeAnim = chargeAnim;
    this.chargeText = chargeText;
    this.tagType = tagType;
    this.chargeEffect = !!chargeEffect;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      const lastMove = user.getLastXMoves() as TurnMove[];
      if (!lastMove.length || lastMove[0].move !== move.id || lastMove[0].result !== MoveResult.OTHER) {
        (args[0] as Utils.BooleanHolder).value = true;
        new MoveChargeAnim(this.chargeAnim, move.id, user).play(user.scene, () => {
          user.scene.queueMessage(getPokemonMessage(user, ` ${this.chargeText.replace('{TARGET}', target.name)}`));
          if (this.tagType)
            user.addTag(this.tagType, 1, move.id, user.id);
          if (this.chargeEffect)
            applyMoveAttrs(MoveEffectAttr, user, target, move);
          user.pushMoveHistory({ move: move.id, targets: [ target.getBattlerIndex() ], result: MoveResult.OTHER });
          user.getMoveQueue().push({ move: move.id, targets: [ target.getBattlerIndex() ], ignorePP: true });
          resolve(true);
        });
      } else
        resolve(false);
    });
  }
}

export class SolarBeamChargeAttr extends ChargeAttr {
  constructor() {
    super(ChargeAnim.SOLAR_BEAM_CHARGING, 'took\nin sunlight!');
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      const weatherType = user.scene.arena.weather?.weatherType;
      if (!user.scene.arena.weather?.isEffectSuppressed(user.scene) && (weatherType === WeatherType.SUNNY || weatherType === WeatherType.HARSH_SUN))
        resolve(false);
      else
        super.apply(user, target, move, args).then(result => resolve(result));
    });
  }
}

export class StatChangeAttr extends MoveEffectAttr {
  public stats: BattleStat[];
  public levels: integer;

  constructor(stats: BattleStat | BattleStat[], levels: integer, selfTarget?: boolean) {
    super(selfTarget, MoveEffectTrigger.HIT);
    this.stats = typeof(stats) === 'number'
      ? [ stats as BattleStat ]
      : stats as BattleStat[];
    this.levels = levels;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    if (move.chance < 0 || move.chance === 100 || Utils.randInt(100) < move.chance) {
      const levels = this.getLevels(user);
      user.scene.unshiftPhase(new StatChangePhase(user.scene, (this.selfTarget ? user : target).getBattlerIndex(), this.selfTarget, this.stats, levels));
      return true;
    }

    return false;
  }

  getLevels(_user: Pokemon): integer {
    return this.levels;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    // TODO: Add awareness of level limits
    const levels = this.getLevels(user);
    return (levels * 4) + (levels > 0 ? -2 : 2);
  }
}

export class GrowthStatChangeAttr extends StatChangeAttr {
  constructor() {
    super([ BattleStat.ATK, BattleStat.SPATK ], 1, true);
  }

  getLevels(user: Pokemon): number {
    if (!user.scene.arena.weather?.isEffectSuppressed(user.scene)) {
      const weatherType = user.scene.arena.weather?.weatherType;
      if (weatherType === WeatherType.SUNNY || weatherType === WeatherType.HARSH_SUN)
        return this.levels + 1;
    }
    return this.levels;
  }
}

export class VariablePowerAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    //const power = args[0] as Utils.NumberHolder;
    return false;
  }
}

export class MovePowerMultiplierAttr extends VariablePowerAttr {
  private powerMultiplierFunc: (user: Pokemon, target: Pokemon, move: Move) => number;

  constructor(powerMultiplier: (user: Pokemon, target: Pokemon, move: Move) => number) {
    super();

    this.powerMultiplierFunc = powerMultiplier;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;
    power.value *= this.powerMultiplierFunc(user, target, move);

    return true;
  }
}

export abstract class ConsecutiveUsePowerMultiplierAttr extends MovePowerMultiplierAttr {
  constructor(limit: integer, resetOnFail: boolean, resetOnLimit?: boolean, ...comboMoves: Moves[]) {
    super((user: Pokemon, target: Pokemon, move: Move): number => {
      const moveHistory = user.getMoveHistory().reverse().slice(0);

      let count = 0;
      let turnMove: TurnMove;

      while (((turnMove = moveHistory.shift())?.move === move.id || (comboMoves.length && comboMoves.indexOf(turnMove?.move) > -1)) && (!resetOnFail || turnMove.result === MoveResult.SUCCESS)) {
        if (count < (limit - 1))
          count++;
        else if (resetOnLimit)
          count = 0;
        else
          break;
      }

      return this.getMultiplier(count);
    });
  }

  abstract getMultiplier(count: integer): number;
}

export class ConsecutiveUseDoublePowerAttr extends ConsecutiveUsePowerMultiplierAttr {
  getMultiplier(count: number): number {
    return Math.pow(2, count);
  }
}

export class ConsecutiveUseMultiBasePowerAttr extends ConsecutiveUsePowerMultiplierAttr {
  getMultiplier(count: number): number {
    return (count + 1);
  }
}

export class WeightPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;

    const targetWeight = target.species.weight;
    const weightThresholds = [ 10, 25, 50, 100, 200 ];

    let w = 0;
    while (targetWeight >= weightThresholds[w]) {
      if (++w === weightThresholds.length)
        break;
    }

    power.value = (w + 1) * 20;

    return true;
  }
}

export class LowHpPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;
    const hpRatio = user.getHpRatio();

    switch (true) {
      case (hpRatio < 0.6875):
        power.value = 40;
        break;
      case (hpRatio < 0.3542):
        power.value = 80;
        break;
      case (hpRatio < 0.2083):
        power.value = 100;
        break;
      case (hpRatio < 0.1042):
        power.value = 150;
        break;
      case (hpRatio < 0.0417):
        power.value = 200;
        break;
      default:
        power.value = 20;
        break;
    }

    return true;
  }
}

export class HpPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.NumberHolder).value = Math.max(Math.floor(150 * user.getHpRatio()), 1);

    return true;
  }
}

export class OpponentHighHpPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    (args[0] as Utils.NumberHolder).value = Math.max(Math.floor(120 * target.getHpRatio()), 1);

    return true;
  }
}

export class TurnDamagedDoublePowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const power = args[0] as Utils.NumberHolder;
    if (target.turnData.damageDealt) { // Would need to be updated for doublebattles
      power.value *= 2;
      return true;
    }

    return false;
  }
}

export class SolarBeamPowerAttr extends VariablePowerAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!user.scene.arena.weather?.isEffectSuppressed(user.scene)) {
      const power = args[0] as Utils.NumberHolder;
      const weatherType = user.scene.arena.weather?.weatherType || WeatherType.NONE;
      switch (weatherType) {
        case WeatherType.RAIN:
        case WeatherType.SANDSTORM:
        case WeatherType.HAIL:
        case WeatherType.HEAVY_RAIN:
          power.value *= 0.5;
          return true;
      }
    }

    return false;
  }
}

export class VariableAccuracyAttr extends MoveAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    //const accuracy = args[0] as Utils.NumberHolder;
    return false;
  }
}

export class ThunderAccuracyAttr extends VariableAccuracyAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!user.scene.arena.weather?.isEffectSuppressed(user.scene)) {
      const accuracy = args[0] as Utils.NumberHolder;
      const weatherType = user.scene.arena.weather?.weatherType || WeatherType.NONE;
      switch (weatherType) {
        case WeatherType.SUNNY:
        case WeatherType.SANDSTORM:
        case WeatherType.HARSH_SUN:
          accuracy.value = 50;
          return true;
        case WeatherType.RAIN:
        case WeatherType.HEAVY_RAIN:
          accuracy.value = -1;
          return true;
      }
    }

    return false;
  }
}

export class BlizzardAccuracyAttr extends VariableAccuracyAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!user.scene.arena.weather?.isEffectSuppressed(user.scene)) {
      const accuracy = args[0] as Utils.NumberHolder;
      const weatherType = user.scene.arena.weather?.weatherType || WeatherType.NONE;
      if (weatherType === WeatherType.HAIL) {
        accuracy.value = -1;
        return true;
      }
    }

    return false;
  }
}

export class MissEffectAttr extends MoveAttr {
  private missEffectFunc: UserMoveCondition;

  constructor(missEffectFunc: UserMoveCondition) {
    super();

    this.missEffectFunc = missEffectFunc;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    this.missEffectFunc(user, move);
    return true;
  }
}

export class TypelessAttr extends MoveAttr { }

export class DisableMoveAttr extends MoveEffectAttr {
  constructor() {
    super(false);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const moveQueue = target.getLastXMoves();
    let turnMove: TurnMove;
    while (moveQueue.length) {
      turnMove = moveQueue.shift();
      if (turnMove.virtual)
        continue;
      
      const moveIndex = target.getMoveset().findIndex(m => m.moveId === turnMove.move);
      if (moveIndex === -1)
        return false;
      
      const disabledMove = target.getMoveset()[moveIndex];
      disabledMove.disableTurns = 4;

      user.scene.queueMessage(getPokemonMessage(target, `'s ${disabledMove.getName()}\nwas disabled!`));
      
      return true;
    }
    
    return false;
  }
  
  getCondition(): MoveCondition {
    return (user: Pokemon, target: Pokemon, move: Move) => {
      const moveQueue = target.getLastXMoves();
      let turnMove: TurnMove;
      while (moveQueue.length) {
        turnMove = moveQueue.shift();
        if (turnMove.virtual)
          continue;
        
        const move = target.getMoveset().find(m => m.moveId === turnMove.move);
        if (!move)
          continue;

        return !move.isDisabled();
      }
    };
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return -5;
  }
}

export class FrenzyAttr extends MoveEffectAttr {
  constructor() {
    super(true, MoveEffectTrigger.HIT);
  }

  canApply(user: Pokemon, target: Pokemon, move: Move, args: any[]) {
    return !(this.selfTarget ? user : target).isFainted();
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    if (!user.getMoveQueue().length) {
      if (!user.getTag(BattlerTagType.FRENZY)) {
        const turnCount = Utils.randInt(2) + 1;
        new Array(turnCount).fill(null).map(() => user.getMoveQueue().push({ move: move.id, targets: [ target.getBattlerIndex() ], ignorePP: true }));
        user.addTag(BattlerTagType.FRENZY, 1, move.id, user.id);
      } else {
        applyMoveAttrs(AddBattlerTagAttr, user, target, move, args);
        user.lapseTag(BattlerTagType.FRENZY);
      }
      return true;
    }

    return false;
  }
}

export const frenzyMissFunc: UserMoveCondition = (user: Pokemon, move: Move) => {
  while (user.getMoveQueue().length && user.getMoveQueue()[0].move === move.id)
    user.getMoveQueue().shift();
  user.lapseTag(BattlerTagType.FRENZY);

  return true;
};

export class AddBattlerTagAttr extends MoveEffectAttr {
  public tagType: BattlerTagType;
  public turnCount: integer;
  private failOnOverlap: boolean;

  constructor(tagType: BattlerTagType, selfTarget?: boolean, turnCount?: integer, failOnOverlap?: boolean) {
    super(selfTarget);

    this.tagType = tagType;
    this.turnCount = turnCount;
    this.failOnOverlap = !!failOnOverlap;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const chance = this.getTagChance(user, target, move);
    if (chance < 0 || chance === 100 || Utils.randInt(100) < chance) {
      (this.selfTarget ? user : target).addTag(this.tagType, this.turnCount, move.id, user.id);
      return true;
    }

    return false;
  }

  getTagChance(user: Pokemon, target: Pokemon, move: Move): integer {
    return move.chance;
  }

  getCondition(): MoveCondition {
    return this.failOnOverlap
      ? (user: Pokemon, target: Pokemon, move: Move) => !(this.selfTarget ? user : target).getTag(this.tagType)
      : null;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    switch (this.tagType) {
      case BattlerTagType.FLINCHED:
        return -5;
      case BattlerTagType.CONFUSED:
        return -5;
      case BattlerTagType.INFATUATED:
        return -5;
      case BattlerTagType.SEEDED:
        return -3;
      case BattlerTagType.NIGHTMARE:
        return -5;
      case BattlerTagType.FRENZY:
        return -2;
      case BattlerTagType.INGRAIN:
        return 3;
      case BattlerTagType.AQUA_RING:
        return 3;
      case BattlerTagType.DROWSY:
        return -5;
      case BattlerTagType.TRAPPED:
      case BattlerTagType.BIND:
      case BattlerTagType.WRAP:
      case BattlerTagType.FIRE_SPIN:
      case BattlerTagType.WHIRLPOOL:
      case BattlerTagType.CLAMP:
      case BattlerTagType.SAND_TOMB:
      case BattlerTagType.MAGMA_STORM:
        return -3;
      case BattlerTagType.PROTECTED:
        return 10;
      case BattlerTagType.FLYING:
        return 5;
      case BattlerTagType.CRIT_BOOST:
        return 5;
      case BattlerTagType.NO_CRIT:
        return -5;
      case BattlerTagType.IGNORE_ACCURACY:
        return 3;
    }
  }
}

export class LapseBattlerTagAttr extends MoveEffectAttr {
  public tagTypes: BattlerTagType[];

  constructor(tagTypes: BattlerTagType[], selfTarget?: boolean) {
    super(selfTarget);

    this.tagTypes = tagTypes;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    for (let tagType of this.tagTypes)
      (this.selfTarget ? user : target).lapseTag(tagType);
    
    return true;
  }
}

export class FlinchAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.FLINCHED, false);
  }
}

export class ConfuseAttr extends AddBattlerTagAttr {
  constructor(selfTarget?: boolean) {
    super(BattlerTagType.CONFUSED, selfTarget, Utils.randInt(4, 1));
  }
}

export class TrapAttr extends AddBattlerTagAttr {
  constructor(tagType: BattlerTagType) {
    super(tagType, false, Utils.randInt(2, 5));
  }
}

export class ProtectAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.PROTECTED, true);
  }

  getCondition(): MoveCondition {
    return ((user: Pokemon, target: Pokemon, move: Move): boolean => {
      let timesUsed = 0;
      const moveHistory = user.getLastXMoves(-1);
      let turnMove: TurnMove;
      while (moveHistory.length && (turnMove = moveHistory.shift()).move === move.id && turnMove.result === MoveResult.SUCCESS)
        timesUsed++;
      if (timesUsed)
        return !Utils.randInt(Math.pow(2, timesUsed));
      return true;
    });
  }
}

export class IgnoreAccuracyAttr extends AddBattlerTagAttr {
  constructor() {
    super(BattlerTagType.IGNORE_ACCURACY, true, 1);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    user.scene.queueMessage(getPokemonMessage(user, ` took aim\nat ${target.name}!`));

    return true;
  }
}

export class HitsTagAttr extends MoveAttr {
  public tagType: BattlerTagType;
  public doubleDamage: boolean;

  constructor(tagType: BattlerTagType, doubleDamage?: boolean) {
    super();

    this.tagType = tagType;
    this.doubleDamage = !!doubleDamage;
  }

  getTargetBenefitScore(user: Pokemon, target: Pokemon, move: Move): integer {
    return target.getTag(this.tagType) ? this.doubleDamage ? 10 : 5 : 0;
  }
}

export class AddArenaTagAttr extends MoveEffectAttr {
  public tagType: ArenaTagType;
  public turnCount: integer;

  constructor(tagType: ArenaTagType, turnCount?: integer) {
    super(true);

    this.tagType = tagType;
    this.turnCount = turnCount;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    if (move.chance < 0 || move.chance === 100 || Utils.randInt(100) < move.chance) {
      user.scene.arena.addTag(this.tagType, this.turnCount, move.id, user.id);
      return true;
    }

    return false;
  }
}

export class AddArenaTrapTagAttr extends AddArenaTagAttr {
  getCondition(): MoveCondition {
    return (user: Pokemon, target: Pokemon, move: Move) => {
      if (!user.scene.arena.getTag(this.tagType))
        return true;
      const tag = user.scene.arena.getTag(this.tagType) as ArenaTrapTag;
      return tag.layers < tag.maxLayers;
    };
  }
}

export class CopyTypeAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    user.summonData.types = target.getTypes();

    user.scene.queueMessage(getPokemonMessage(user, `'s type\nchanged to match ${target.name}'s!`));

    return true;
  }
}

export class CopyBiomeTypeAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const biomeType = user.scene.arena.getTypeForBiome();

    user.summonData.types = [ biomeType ];

    user.scene.queueMessage(getPokemonMessage(user, ` transformed\ninto the ${Type[biomeType].toUpperCase()} type!`));

    return true;
  }
}

export class RandomMovesetMoveAttr extends OverrideMoveEffectAttr {
  private enemyMoveset: boolean;

  constructor(enemyMoveset?: boolean) {
    super();

    this.enemyMoveset = enemyMoveset;
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const moveset = (!this.enemyMoveset ? user : target).getMoveset();
    const moves = moveset.filter(m => !m.getMove().hasFlag(MoveFlags.IGNORE_VIRTUAL));
    if (moves.length) {
      const move = moves[Utils.randInt(moves.length)];
      const moveIndex = moveset.findIndex(m => m.moveId === move.moveId);
      const moveTargets = getMoveTargets(user, move.moveId);
      if (!moveTargets.targets.length)
        return false;
      const targets = moveTargets.multiple || moveTargets.targets.length === 1
        ? moveTargets.targets
        : moveTargets.targets.indexOf(target.getBattlerIndex()) > -1
          ? [ target.getBattlerIndex() ]
          : [ moveTargets.targets[Utils.randInt(moveTargets.targets.length)] ];
      user.getMoveQueue().push({ move: move.moveId, targets: targets, ignorePP: this.enemyMoveset });
      user.scene.unshiftPhase(new MovePhase(user.scene, user, targets, moveset[moveIndex], true));
      return true;
    }

    return false;
  }
}

export class RandomMoveAttr extends OverrideMoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<boolean> {
    return new Promise(resolve => {
      const moveIds = Utils.getEnumValues(Moves).filter(m => !allMoves[m].hasFlag(MoveFlags.IGNORE_VIRTUAL));
      const moveId = moveIds[Utils.randInt(moveIds.length)];
      
      const moveTargets = getMoveTargets(user, moveId);
      if (!moveTargets.targets.length) {
        resolve(false);
        return;
      }
      const targets = moveTargets.multiple || moveTargets.targets.length === 1
        ? moveTargets.targets
        : moveTargets.targets.indexOf(target.getBattlerIndex()) > -1
          ? [ target.getBattlerIndex() ]
          : [ moveTargets.targets[Utils.randInt(moveTargets.targets.length)] ];
      user.getMoveQueue().push({ move: moveId, targets: targets, ignorePP: true });
      user.scene.unshiftPhase(new MovePhase(user.scene, user, targets, new PokemonMove(moveId, 0, 0, true), true));
      initMoveAnim(moveId).then(() => {
        loadMoveAnimAssets(user.scene, [ moveId ], true)
          .then(() => resolve(true));
      });
    });
  }
}

const targetMoveCopiableCondition = (user: Pokemon, target: Pokemon, move: Move) => {
  const targetMoves = target.getMoveHistory().filter(m => !m.virtual);
    if (!targetMoves.length)
      return false;

    const copiableMove = targetMoves[0];

    if (!copiableMove.move)
      return false;

    if (allMoves[copiableMove.move].getAttrs(ChargeAttr) && copiableMove.result === MoveResult.OTHER)
      return false;

    // TODO: Add last turn of Bide

    return true;
};

export class CopyMoveAttr extends OverrideMoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const targetMoves = target.getMoveHistory().filter(m => !m.virtual);
    if (!targetMoves.length)
      return false;

    const copiedMove = targetMoves[0];

    const moveTargets = getMoveTargets(user, copiedMove.move);
    if (!moveTargets.targets.length)
      return false;

    const targets = moveTargets.multiple || moveTargets.targets.length === 1
      ? moveTargets.targets
      : moveTargets.targets.indexOf(target.getBattlerIndex()) > -1
        ? [ target.getBattlerIndex() ]
        : [ moveTargets.targets[Utils.randInt(moveTargets.targets.length)] ];
    user.getMoveQueue().push({ move: copiedMove.move, targets: targets, ignorePP: true });

    user.scene.unshiftPhase(new MovePhase(user.scene, user as PlayerPokemon, targets, new PokemonMove(copiedMove.move, 0, 0, true), true));

    return true;
  }

  getCondition(): MoveCondition {
    return targetMoveCopiableCondition;
  }
}

export class MovesetCopyMoveAttr extends OverrideMoveEffectAttr {
  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    const targetMoves = target.getMoveHistory().filter(m => !m.virtual);
    if (!targetMoves.length)
      return false;

    const copiedMove = allMoves[targetMoves[0].move];

    const thisMoveIndex = user.getMoveset().findIndex(m => m.moveId === move.id);

    if (thisMoveIndex === -1)
      return false;

    user.summonData.moveset = user.getMoveset().slice(0);
    user.summonData.moveset[thisMoveIndex] = new PokemonMove(copiedMove.id, 0, 0);

    user.scene.queueMessage(getPokemonMessage(user, ` copied\n${copiedMove.name}!`));

    return true;
  }

  getCondition(): MoveCondition {
    return targetMoveCopiableCondition;
  }
}

export class SketchAttr extends MoveEffectAttr {
  constructor() {
    super(true);
  }

  apply(user: Pokemon, target: Pokemon, move: Move, args: any[]): boolean {
    if (!super.apply(user, target, move, args))
      return false;

    const targetMoves = target.getMoveHistory().filter(m => !m.virtual);
    if (!targetMoves.length)
      return false;

    const sketchedMove = allMoves[targetMoves[0].move];

    const sketchIndex = user.getMoveset().findIndex(m => m.moveId === move.id);

    if (sketchIndex === -1)
      return false;

    user.setMove(sketchIndex, sketchedMove.id);

    user.scene.queueMessage(getPokemonMessage(user, ` sketched\n${sketchedMove.name}!`));

    return true;
  }

  getCondition(): MoveCondition {
    return (user: Pokemon, target: Pokemon, move: Move) => {
      if (!targetMoveCopiableCondition(user, target, move))
        return false;
    
      const targetMoves = target.getMoveHistory().filter(m => !m.virtual);
        if (!targetMoves.length)
          return false;
    
        const sketchableMove = targetMoves[0];
    
        if (user.getMoveset().find(m => m.moveId === sketchableMove.move))
          return false;
    
        return true;
    };
  }
}

const failOnGravityCondition = (user: Pokemon, target: Pokemon, move: Move) => !user.scene.arena.getTag(ArenaTagType.GRAVITY);

export type MoveAttrFilter = (attr: MoveAttr) => boolean;

function applyMoveAttrsInternal(attrFilter: MoveAttrFilter, user: Pokemon, target: Pokemon, move: Move, args: any[]): Promise<void> {
  return new Promise(resolve => {
    const attrPromises: Promise<boolean>[] = [];
    const moveAttrs = move.attrs.filter(a => attrFilter(a));
    for (let attr of moveAttrs) {
      const result = attr.apply(user, target, move, args);
      if (result instanceof Promise<boolean>)
        attrPromises.push(result);
    }
    Promise.allSettled(attrPromises).then(() => resolve());
  });
}

export function applyMoveAttrs(attrType: { new(...args: any[]): MoveAttr }, user: Pokemon, target: Pokemon, move: Move, ...args: any[]): Promise<void> {
  return applyMoveAttrsInternal((attr: MoveAttr) => attr instanceof attrType, user, target, move, args);
}

export function applyFilteredMoveAttrs(attrFilter: MoveAttrFilter, user: Pokemon, target: Pokemon, move: Move, ...args: any[]): Promise<void> {
  return applyMoveAttrsInternal(attrFilter, user, target, move, args);
}

export type MoveTargetSet = {
  targets: BattlerIndex[];
  multiple: boolean;
}

export function getMoveTargets(user: Pokemon, move: Moves): MoveTargetSet {
  const moveTarget = move ? allMoves[move].moveTarget : move === undefined ? MoveTarget.NEAR_ENEMY : [];
  const opponents = user.getOpponents();
  
  let set: BattlerIndex[] = [];
  let multiple = false;

  switch (moveTarget) {
    case MoveTarget.USER:
      set = [ user.getBattlerIndex() ];
      break;
    case MoveTarget.NEAR_OTHER:
    case MoveTarget.OTHER:
    case MoveTarget.ALL_NEAR_OTHERS:
    case MoveTarget.ALL_OTHERS:
      set = (opponents.concat([ user.getAlly() ])).map(p => p?.getBattlerIndex());
      multiple = moveTarget === MoveTarget.ALL_NEAR_OTHERS || moveTarget === MoveTarget.ALL_OTHERS
      break;
    case MoveTarget.NEAR_ENEMY:
    case MoveTarget.ALL_NEAR_ENEMIES:
    case MoveTarget.ALL_ENEMIES:
    case MoveTarget.ENEMY_SIDE:
      set = opponents.map(p => p.getBattlerIndex());
      multiple = moveTarget !== MoveTarget.NEAR_ENEMY;
      break;
    case MoveTarget.RANDOM_NEAR_ENEMY:
      set = [ opponents[Utils.randInt(opponents.length)].getBattlerIndex() ];
      break;
    case MoveTarget.ATTACKER:
        set = user.turnData.attacksReceived.length
          ? [ user.scene.getPokemonById(user.turnData.attacksReceived[0].sourceId).getBattlerIndex() ]
          : [];
      break;
    case MoveTarget.NEAR_ALLY:
    case MoveTarget.ALLY:
      set = [ user.getAlly()?.getBattlerIndex() ];
      break;
    case MoveTarget.USER_OR_NEAR_ALLY:
    case MoveTarget.USER_AND_ALLIES:
    case MoveTarget.USER_SIDE:
      set = [ user, user.getAlly() ].map(p => p?.getBattlerIndex());
      multiple = moveTarget !== MoveTarget.USER_OR_NEAR_ALLY;
      break;
    case MoveTarget.ALL:
    case MoveTarget.BOTH_SIDES:
      set = [ user, user.getAlly() ].concat(user.getOpponents()).map(p => p?.getBattlerIndex());
      multiple = true;
      break;
  }

  return { targets: set.filter(t => t !== undefined), multiple };
}

export const allMoves: Move[] = [
  new StatusMove(Moves.NONE, "-", Type.NORMAL, MoveCategory.STATUS, -1, -1, "", -1, 0, 1),
];

export function initMoves() {
  allMoves.push(
    new AttackMove(Moves.POUND, "Pound", Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, -1, "", -1, 0, 1),
    new AttackMove(Moves.KARATE_CHOP, "Karate Chop", Type.FIGHTING, MoveCategory.PHYSICAL, 50, 100, 25, -1, "High critical hit ratio.", -1, 0, 1)
      .attr(HighCritAttr),
    new AttackMove(Moves.DOUBLE_SLAP, "Double Slap", Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 10, -1, "Hits 2-5 times in one turn.", -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(Moves.COMET_PUNCH, "Comet Punch", Type.NORMAL, MoveCategory.PHYSICAL, 18, 85, 15, -1, "Hits 2-5 times in one turn.", -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(Moves.MEGA_PUNCH, "Mega Punch", Type.NORMAL, MoveCategory.PHYSICAL, 80, 85, 20, -1, "", -1, 0, 1),
    new AttackMove(Moves.PAY_DAY, "Pay Day (N)", Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 20, -1, "Money is earned after the battle.", -1, 0, 1)
      .makesContact(false),
    new AttackMove(Moves.FIRE_PUNCH, "Fire Punch", Type.FIRE, MoveCategory.PHYSICAL, 75, 100, 15, 67, "May burn opponent.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.ICE_PUNCH, "Ice Punch", Type.ICE, MoveCategory.PHYSICAL, 75, 100, 15, 69, "May freeze opponent.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(Moves.THUNDER_PUNCH, "Thunder Punch", Type.ELECTRIC, MoveCategory.PHYSICAL, 75, 100, 15, 68, "May paralyze opponent.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.SCRATCH, "Scratch", Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, -1, "", -1, 0, 1),
    new AttackMove(Moves.VISE_GRIP, "Vise Grip", Type.NORMAL, MoveCategory.PHYSICAL, 55, 100, 30, -1, "", -1, 0, 1),
    new AttackMove(Moves.GUILLOTINE, "Guillotine", Type.NORMAL, MoveCategory.PHYSICAL, -1, 30, 5, -1, "One-Hit-KO, if it hits.", -1, 0, 1)
      .attr(OneHitKOAttr),
    new AttackMove(Moves.RAZOR_WIND, "Razor Wind", Type.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, -1, "Charges on first turn, attacks on second. High critical hit ratio.", -1, 0, 1)
      .attr(ChargeAttr, ChargeAnim.RAZOR_WIND_CHARGING, 'whipped\nup a whirlwind!')
      .attr(HighCritAttr)
      .ignoresVirtual()
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.SWORDS_DANCE, "Swords Dance", Type.NORMAL, -1, 20, 88, "Sharply raises user's Attack.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, 2, true),
    new AttackMove(Moves.CUT, "Cut", Type.NORMAL, MoveCategory.PHYSICAL, 50, 95, 30, -1, "", -1, 0, 1),
    new AttackMove(Moves.GUST, "Gust", Type.FLYING, MoveCategory.SPECIAL, 40, 100, 35, -1, "Hits Pokémon using FLY/BOUNCE/SKY DROP with double power.", -1, 0, 1)
      .attr(HitsTagAttr, BattlerTagType.FLYING, true)
      .target(MoveTarget.OTHER),
    new AttackMove(Moves.WING_ATTACK, "Wing Attack", Type.FLYING, MoveCategory.PHYSICAL, 60, 100, 35, -1, "", -1, 0, 1)
      .target(MoveTarget.OTHER),
    new StatusMove(Moves.WHIRLWIND, "Whirlwind (N)", Type.NORMAL, -1, 20, -1, "In battles, the opponent switches. In the wild, the Pokémon runs.", -1, -6, 1), // TODO
    new AttackMove(Moves.FLY, "Fly", Type.FLYING, MoveCategory.PHYSICAL, 90, 95, 15, 97, "Flies up on first turn, attacks on second turn.", -1, 0, 1)
      .attr(ChargeAttr, ChargeAnim.FLY_CHARGING, 'flew\nup high!', BattlerTagType.FLYING)
      .condition(failOnGravityCondition)
      .ignoresVirtual(),
    new AttackMove(Moves.BIND, "Bind", Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, -1, "Traps opponent, damaging them for 4-5 turns.", 100, 0, 1)
      .attr(TrapAttr, BattlerTagType.BIND),
    new AttackMove(Moves.SLAM, "Slam", Type.NORMAL, MoveCategory.PHYSICAL, 80, 75, 20, -1, "", -1, 0, 1),
    new AttackMove(Moves.VINE_WHIP, "Vine Whip", Type.GRASS, MoveCategory.PHYSICAL, 45, 100, 25, -1, "", -1, 0, 1),
    new AttackMove(Moves.STOMP, "Stomp", Type.NORMAL, MoveCategory.PHYSICAL, 65, 100, 20, -1, "May cause flinching.", 30, 0, 1)
      .attr(FlinchAttr),
    new AttackMove(Moves.DOUBLE_KICK, "Double Kick", Type.FIGHTING, MoveCategory.PHYSICAL, 30, 100, 30, -1, "Hits twice in one turn.", -1, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.MEGA_KICK, "Mega Kick", Type.NORMAL, MoveCategory.PHYSICAL, 120, 75, 5, -1, "", -1, 0, 1),
    new AttackMove(Moves.JUMP_KICK, "Jump Kick", Type.FIGHTING, MoveCategory.PHYSICAL, 100, 95, 10, -1, "If it misses, the user loses half their HP.", -1, 0, 1)
      .attr(MissEffectAttr, (user: Pokemon, move: Move) => { user.damage(Math.floor(user.getMaxHp() / 2)); return true; })
      .condition(failOnGravityCondition),
    new AttackMove(Moves.ROLLING_KICK, "Rolling Kick", Type.FIGHTING, MoveCategory.PHYSICAL, 60, 85, 15, -1, "May cause flinching.", 30, 0, 1)
      .attr(FlinchAttr),
    new StatusMove(Moves.SAND_ATTACK, "Sand Attack", Type.GROUND, 100, 15, -1, "Lowers opponent's Accuracy.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.HEADBUTT, "Headbutt", Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 15, -1, "May cause flinching.", 30, 0, 1)
      .attr(FlinchAttr),
    new AttackMove(Moves.HORN_ATTACK, "Horn Attack", Type.NORMAL, MoveCategory.PHYSICAL, 65, 100, 25, -1, "", -1, 0, 1),
    new AttackMove(Moves.FURY_ATTACK, "Fury Attack", Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, -1, "Hits 2-5 times in one turn.", -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(Moves.HORN_DRILL, "Horn Drill", Type.NORMAL, MoveCategory.PHYSICAL, -1, 30, 5, -1, "One-Hit-KO, if it hits.", -1, 0, 1)
      .attr(OneHitKOAttr),
    new AttackMove(Moves.TACKLE, "Tackle", Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 35, -1, "", -1, 0, 1),
    new AttackMove(Moves.BODY_SLAM, "Body Slam", Type.NORMAL, MoveCategory.PHYSICAL, 85, 100, 15, 66, "May paralyze opponent.", 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.WRAP, "Wrap", Type.NORMAL, MoveCategory.PHYSICAL, 15, 90, 20, -1, "Traps opponent, damaging them for 4-5 turns.", 100, 0, 1)
      .attr(TrapAttr, BattlerTagType.WRAP),
    new AttackMove(Moves.TAKE_DOWN, "Take Down", Type.NORMAL, MoveCategory.PHYSICAL, 90, 85, 20, 1, "User receives recoil damage.", -1, 0, 1)
      .attr(RecoilAttr),
    new AttackMove(Moves.THRASH, "Thrash", Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 10, -1, "User attacks for 2-3 turns but then becomes confused.", -1, 0, 1)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(ConfuseAttr, true) // TODO: Update to still confuse if last hit misses
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new AttackMove(Moves.DOUBLE_EDGE, "Double-Edge", Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 15, -1, "User receives recoil damage.", -1, 0, 1)
      .attr(RecoilAttr),
    new StatusMove(Moves.TAIL_WHIP, "Tail Whip", Type.NORMAL, 100, 30, -1, "Lowers opponent's Defense.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.POISON_STING, "Poison Sting", Type.POISON, MoveCategory.PHYSICAL, 15, 100, 35, -1, "May poison the opponent.", 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.TWINEEDLE, "Twineedle", Type.BUG, MoveCategory.PHYSICAL, 25, 100, 20, -1, "Hits twice in one turn. May poison opponent.", 20, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.PIN_MISSILE, "Pin Missile", Type.BUG, MoveCategory.PHYSICAL, 25, 95, 20, -1, "Hits 2-5 times in one turn.", -1, 1, 0)
      .attr(MultiHitAttr)
      .makesContact(false),
    new StatusMove(Moves.LEER, "Leer", Type.NORMAL, 100, 30, -1, "Lowers opponent's Defense.", 100, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BITE, "Bite", Type.DARK, MoveCategory.PHYSICAL, 60, 100, 25, -1, "May cause flinching.", 30, 0, 1)
      .attr(FlinchAttr),
    new StatusMove(Moves.GROWL, "Growl", Type.NORMAL, 100, 40, -1, "Lowers opponent's Attack.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.ROAR, "Roar (N)", Type.NORMAL, -1, 20, -1, "In battles, the opponent switches. In the wild, the Pokémon runs.", -1, -6, 1),
    new StatusMove(Moves.SING, "Sing", Type.NORMAL, 55, 15, -1, "Puts opponent to sleep.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP),
    new StatusMove(Moves.SUPERSONIC, "Supersonic", Type.NORMAL, 55, 20, -1, "Confuses opponent.", -1, 0, 1)
      .attr(ConfuseAttr),
    new AttackMove(Moves.SONIC_BOOM, "Sonic Boom", Type.NORMAL, MoveCategory.SPECIAL, -1, 90, 20, -1, "Always inflicts 20 HP.", -1, 0, 1)
      .attr(FixedDamageAttr, 20),
    new StatusMove(Moves.DISABLE, "Disable", Type.NORMAL, 100, 20, -1, "Opponent can't use its last attack for a few turns.", -1, 0, 1)
      .attr(DisableMoveAttr),
    new AttackMove(Moves.ACID, "Acid", Type.POISON, MoveCategory.SPECIAL, 40, 100, 30, -1, "May lower opponent's Special Defense.", 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.EMBER, "Ember", Type.FIRE, MoveCategory.SPECIAL, 40, 100, 25, -1, "May burn opponent.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.FLAMETHROWER, "Flamethrower", Type.FIRE, MoveCategory.SPECIAL, 90, 100, 15, 125, "May burn opponent.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new SelfStatusMove(Moves.MIST, "Mist (N)", Type.ICE, -1, 30, -1, "User's stats cannot be changed for a period of time.", -1, 0, 1)
      .target(MoveTarget.USER_SIDE),
    new AttackMove(Moves.WATER_GUN, "Water Gun", Type.WATER, MoveCategory.SPECIAL, 40, 100, 25, -1, "", -1, 0, 1),
    new AttackMove(Moves.HYDRO_PUMP, "Hydro Pump", Type.WATER, MoveCategory.SPECIAL, 110, 80, 5, 142, "", -1, 0, 1),
    new AttackMove(Moves.SURF, "Surf", Type.WATER, MoveCategory.SPECIAL, 90, 100, 15, 123, "Hits all adjacent Pokémon.", -1, 0, 1)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.ICE_BEAM, "Ice Beam", Type.ICE, MoveCategory.SPECIAL, 90, 100, 10, 135, "May freeze opponent.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.BLIZZARD, "Blizzard", Type.ICE, MoveCategory.SPECIAL, 110, 70, 5, 143, "May freeze opponent.", 10, 0, 1)
      .attr(BlizzardAccuracyAttr)
      .attr(StatusEffectAttr, StatusEffect.FREEZE) // TODO: 30% chance to hit protect/detect in hail
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.PSYBEAM, "Psybeam", Type.PSYCHIC, MoveCategory.SPECIAL, 65, 100, 20, 16, "May confuse opponent.", 10, 0, 1)
      .attr(ConfuseAttr),
    new AttackMove(Moves.BUBBLE_BEAM, "Bubble Beam", Type.WATER, MoveCategory.SPECIAL, 65, 100, 20, -1, "May lower opponent's Speed.", 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new AttackMove(Moves.AURORA_BEAM, "Aurora Beam", Type.ICE, MoveCategory.SPECIAL, 65, 100, 20, -1, "May lower opponent's Attack.", 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, -1),
    new AttackMove(Moves.HYPER_BEAM, "Hyper Beam", Type.NORMAL, MoveCategory.SPECIAL, 150, 90, 5, 163, "User must recharge next turn.", -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.RECHARGING, true),
    new AttackMove(Moves.PECK, "Peck", Type.FLYING, MoveCategory.PHYSICAL, 35, 100, 35, -1, "", -1, 0, 1)
      .target(MoveTarget.OTHER),
    new AttackMove(Moves.DRILL_PECK, "Drill Peck", Type.FLYING, MoveCategory.PHYSICAL, 80, 100, 20, -1, "", -1, 0, 1)
      .target(MoveTarget.OTHER),
    new AttackMove(Moves.SUBMISSION, "Submission", Type.FIGHTING, MoveCategory.PHYSICAL, 80, 80, 20, -1, "User receives recoil damage.", -1, 0, 1)
      .attr(RecoilAttr),
    new AttackMove(Moves.LOW_KICK, "Low Kick", Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, 12, "The heavier the opponent, the stronger the attack.", -1, 0, 1)
      .attr(WeightPowerAttr),
    new AttackMove(Moves.COUNTER, "Counter", Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, -1, "When hit by a Physical Attack, user strikes back with 2x power.", -1, -5, 1)
      .attr(CounterDamageAttr, (move: Move) => move.category === MoveCategory.PHYSICAL)
      .target(MoveTarget.ATTACKER),
    new AttackMove(Moves.SEISMIC_TOSS, "Seismic Toss", Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 20, -1, "Inflicts damage equal to user's level.", -1, 0, 1)
      .attr(LevelDamageAttr),
    new AttackMove(Moves.STRENGTH, "Strength", Type.NORMAL, MoveCategory.PHYSICAL, 80, 100, 15, -1, "", -1, 0, 1),
    new AttackMove(Moves.ABSORB, "Absorb", Type.GRASS, MoveCategory.SPECIAL, 20, 100, 25, -1, "User recovers half the HP inflicted on opponent.", -1, 0, 1)
      .attr(HitHealAttr),
    new AttackMove(Moves.MEGA_DRAIN, "Mega Drain", Type.GRASS, MoveCategory.SPECIAL, 40, 100, 15, -1, "User recovers half the HP inflicted on opponent.", -1, 0, 1)
      .attr(HitHealAttr),
    new StatusMove(Moves.LEECH_SEED, "Leech Seed", Type.GRASS, 90, 10, -1, "Drains HP from opponent each turn.", -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.SEEDED)
      .condition((user: Pokemon, target: Pokemon, move: Move) => !target.getTag(BattlerTagType.SEEDED) && !target.isOfType(Type.GRASS)),
    new SelfStatusMove(Moves.GROWTH, "Growth", Type.NORMAL, -1, 20, -1, "Raises user's Attack and Special Attack.", -1, 0, 1)
      .attr(GrowthStatChangeAttr),
    new AttackMove(Moves.RAZOR_LEAF, "Razor Leaf", Type.GRASS, MoveCategory.PHYSICAL, 55, 95, 25, -1, "High critical hit ratio.", -1, 0, 1)
      .attr(HighCritAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SOLAR_BEAM, "Solar Beam", Type.GRASS, MoveCategory.SPECIAL, 120, 100, 10, 168, "Charges on first turn, attacks on second.", -1, 0, 1)
      .attr(SolarBeamChargeAttr)
      .attr(SolarBeamPowerAttr)
      .ignoresVirtual(),
    new StatusMove(Moves.POISON_POWDER, "Poison Powder", Type.POISON, 75, 35, -1, "Poisons opponent.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new StatusMove(Moves.STUN_SPORE, "Stun Spore", Type.GRASS, 75, 30, -1, "Paralyzes opponent.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new StatusMove(Moves.SLEEP_POWDER, "Sleep Powder", Type.GRASS, 75, 15, -1, "Puts opponent to sleep.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP),
    new AttackMove(Moves.PETAL_DANCE, "Petal Dance", Type.GRASS, MoveCategory.SPECIAL, 120, 100, 10, -1, "User attacks for 2-3 turns but then becomes confused.", -1, 0, 1)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(ConfuseAttr, true) // TODO: Update to still confuse if last hit misses
      .makesContact()
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(Moves.STRING_SHOT, "String Shot", Type.BUG, 95, 40, -1, "Sharply lowers opponent's Speed.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, -2)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DRAGON_RAGE, "Dragon Rage", Type.DRAGON, MoveCategory.SPECIAL, -1, 100, 10, -1, "Always inflicts 40 HP.", -1, 0, 1)
      .attr(FixedDamageAttr, 40),
    new AttackMove(Moves.FIRE_SPIN, "Fire Spin", Type.FIRE, MoveCategory.SPECIAL, 35, 85, 15, 24, "Traps opponent, damaging them for 4-5 turns.", 100, 0, 1)
      .attr(TrapAttr, BattlerTagType.FIRE_SPIN),
    new AttackMove(Moves.THUNDER_SHOCK, "Thunder Shock", Type.ELECTRIC, MoveCategory.SPECIAL, 40, 100, 30, -1, "May paralyze opponent.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.THUNDERBOLT, "Thunderbolt", Type.ELECTRIC, MoveCategory.SPECIAL, 90, 100, 15, 126, "May paralyze opponent.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new StatusMove(Moves.THUNDER_WAVE, "Thunder Wave", Type.ELECTRIC, 90, 20, 82, "Paralyzes opponent.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(ThunderAccuracyAttr),
    new AttackMove(Moves.THUNDER, "Thunder", Type.ELECTRIC, MoveCategory.SPECIAL, 110, 70, 10, 166, "May paralyze opponent.", 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.ROCK_THROW, "Rock Throw", Type.ROCK, MoveCategory.PHYSICAL, 50, 90, 15, -1, "", -1, 0, 1)
      .makesContact(false),
    new AttackMove(Moves.EARTHQUAKE, "Earthquake", Type.GROUND, MoveCategory.PHYSICAL, 100, 100, 10, 149, "Power is doubled if opponent is underground from using DIG.", -1, 0, 1)
      .attr(HitsTagAttr, BattlerTagType.UNDERGROUND, true)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FISSURE, "Fissure", Type.GROUND, MoveCategory.PHYSICAL, -1, 30, 5, -1, "One-Hit-KO, if it hits.", -1, 0, 1)
      .attr(OneHitKOAttr)
      .makesContact(false),
    new AttackMove(Moves.DIG, "Dig", Type.GROUND, MoveCategory.PHYSICAL, 80, 100, 10, 55, "Digs underground on first turn, attacks on second. Can also escape from caves.", -1, 0, 1)
      .attr(ChargeAttr, ChargeAnim.DIG_CHARGING, 'dug a hole!', BattlerTagType.UNDERGROUND)
      .ignoresVirtual(),
    new StatusMove(Moves.TOXIC, "Toxic", Type.POISON, 90, 10, -1, "Badly poisons opponent.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.TOXIC),
    new AttackMove(Moves.CONFUSION, "Confusion", Type.PSYCHIC, MoveCategory.SPECIAL, 50, 100, 25, -1, "May confuse opponent.", 10, 0, 1)
      .attr(ConfuseAttr),
    new AttackMove(Moves.PSYCHIC, "Psychic", Type.PSYCHIC, MoveCategory.SPECIAL, 90, 100, 10, 120, "May lower opponent's Special Defense.", 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new StatusMove(Moves.HYPNOSIS, "Hypnosis", Type.PSYCHIC, 60, 20, -1, "Puts opponent to sleep.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP),
    new SelfStatusMove(Moves.MEDITATE, "Meditate", Type.PSYCHIC, -1, 40, -1, "Raises user's Attack.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true),
    new SelfStatusMove(Moves.AGILITY, "Agility", Type.PSYCHIC, -1, 30, 4, "Sharply raises user's Speed.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, 2, true),
    new AttackMove(Moves.QUICK_ATTACK, "Quick Attack", Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 30, -1, "User attacks first.", -1, 1, 1),
    new AttackMove(Moves.RAGE, "Rage (N)", Type.NORMAL, MoveCategory.PHYSICAL, 20, 100, 20, -1, "Raises user's Attack when hit.", -1, 0, 1), // TODO
    new SelfStatusMove(Moves.TELEPORT, "Teleport (N)", Type.PSYCHIC, -1, 20, -1, "Allows user to flee wild battles.", -1, 0, 1),
    new AttackMove(Moves.NIGHT_SHADE, "Night Shade", Type.GHOST, MoveCategory.SPECIAL, -1, 100, 15, 42, "Inflicts damage equal to user's level.", -1, 0, 1)
      .attr(LevelDamageAttr),
    new StatusMove(Moves.MIMIC, "Mimic", Type.NORMAL, -1, 10, -1, "Copies the opponent's last move.", -1, 0, 1)
      .attr(MovesetCopyMoveAttr)
      .ignoresVirtual(),
    new StatusMove(Moves.SCREECH, "Screech", Type.NORMAL, 85, 40, -1, "Sharply lowers opponent's Defense.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, -2),
    new SelfStatusMove(Moves.DOUBLE_TEAM, "Double Team", Type.NORMAL, -1, 15, -1, "Raises user's Evasiveness.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.EVA, 1, true),
    new SelfStatusMove(Moves.RECOVER, "Recover", Type.NORMAL, -1, 5, -1, "User recovers half its max HP.", -1, 0, 1)
      .attr(HealAttr, 0.5),
    new SelfStatusMove(Moves.HARDEN, "Harden", Type.NORMAL, -1, 30, -1, "Raises user's Defense.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new SelfStatusMove(Moves.MINIMIZE, "Minimize", Type.NORMAL, -1, 10, -1, "Sharply raises user's Evasiveness.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.EVA, 1, true),
    new StatusMove(Moves.SMOKESCREEN, "Smokescreen", Type.NORMAL, 100, 20, -1, "Lowers opponent's Accuracy.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new StatusMove(Moves.CONFUSE_RAY, "Confuse Ray", Type.GHOST, 100, 10, 17, "Confuses opponent.", -1, 0, 1)
      .attr(ConfuseAttr),
    new SelfStatusMove(Moves.WITHDRAW, "Withdraw", Type.WATER, -1, 40, -1, "Raises user's Defense.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new SelfStatusMove(Moves.DEFENSE_CURL, "Defense Curl", Type.NORMAL, -1, 40, -1, "Raises user's Defense.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new SelfStatusMove(Moves.BARRIER, "Barrier", Type.PSYCHIC, -1, 20, -1, "Sharply raises user's Defense.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true),
    new SelfStatusMove(Moves.LIGHT_SCREEN, "Light Screen (N)", Type.PSYCHIC, -1, 30, 75, "Halves damage from Special attacks for 5 turns.", -1, 0, 1)
      .target(MoveTarget.USER_SIDE),
    new SelfStatusMove(Moves.HAZE, "Haze (N)", Type.ICE, -1, 30, -1, "Resets all stat changes.", -1, 0, 1)
      .target(MoveTarget.BOTH_SIDES),
    new SelfStatusMove(Moves.REFLECT, "Reflect (N)", Type.PSYCHIC, -1, 20, 74, "Halves damage from Physical attacks for 5 turns.", -1, 0, 1)
      .target(MoveTarget.USER_SIDE),
    new SelfStatusMove(Moves.FOCUS_ENERGY, "Focus Energy", Type.NORMAL, -1, 30, -1, "Increases critical hit ratio.", -1, 0, 1)
      .attr(AddBattlerTagAttr, BattlerTagType.CRIT_BOOST, true, undefined, true),
    new AttackMove(Moves.BIDE, "Bide (N)", Type.NORMAL, MoveCategory.PHYSICAL, -1, -1, 10, -1, "User takes damage for two turns then strikes back double.", -1, 0, 1)
      .ignoresVirtual()
      .target(MoveTarget.ATTACKER),
    new SelfStatusMove(Moves.METRONOME, "Metronome", Type.NORMAL, -1, 10, 80, "User performs almost any move in the game at random.", -1, 0, 1)
      .attr(RandomMoveAttr)
      .ignoresVirtual(),
    new SelfStatusMove(Moves.MIRROR_MOVE, "Mirror Move", Type.FLYING, -1, 20, -1, "User performs the opponent's last move.", -1, 0, 1)
      .attr(CopyMoveAttr)
      .ignoresVirtual(),
    new AttackMove(Moves.SELF_DESTRUCT, "Self-Destruct", Type.NORMAL, MoveCategory.PHYSICAL, 200, 100, 5, -1, "User faints.", -1, 0, 1)
      .attr(SacrificialAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.EGG_BOMB, "Egg Bomb", Type.NORMAL, MoveCategory.PHYSICAL, 100, 75, 10, -1, "", -1, 0, 1)
      .makesContact(false),
    new AttackMove(Moves.LICK, "Lick", Type.GHOST, MoveCategory.PHYSICAL, 30, 100, 30, -1, "May paralyze opponent.", 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.SMOG, "Smog", Type.POISON, MoveCategory.SPECIAL, 30, 70, 20, -1, "May poison opponent.", 40, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.SLUDGE, "Sludge", Type.POISON, MoveCategory.SPECIAL, 65, 100, 20, -1, "May poison opponent.", 30, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.BONE_CLUB, "Bone Club", Type.GROUND, MoveCategory.PHYSICAL, 65, 85, 20, -1, "May cause flinching.", 10, 0, 1)
      .attr(FlinchAttr)
      .makesContact(false),
    new AttackMove(Moves.FIRE_BLAST, "Fire Blast", Type.FIRE, MoveCategory.SPECIAL, 110, 85, 5, 141, "May burn opponent.", 10, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.WATERFALL, "Waterfall", Type.WATER, MoveCategory.PHYSICAL, 80, 100, 15, 77, "May cause flinching.", 20, 0, 1)
      .attr(FlinchAttr),
    new AttackMove(Moves.CLAMP, "Clamp", Type.WATER, MoveCategory.PHYSICAL, 35, 85, 15, -1, "Traps opponent, damaging them for 4-5 turns.", 100, 0, 1)
      .attr(TrapAttr, BattlerTagType.CLAMP),
    new AttackMove(Moves.SWIFT, "Swift", Type.NORMAL, MoveCategory.SPECIAL, 60, -1, 20, 32, "Ignores Accuracy and Evasiveness.", -1, 0, 1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SKULL_BASH, "Skull Bash", Type.NORMAL, MoveCategory.PHYSICAL, 130, 100, 10, -1, "Raises Defense on first turn, attacks on second.", 100, 0, 1)
      .attr(ChargeAttr, ChargeAnim.SKULL_BASH_CHARGING, 'lowered\nits head!', null, true)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true)
      .ignoresVirtual(),
    new AttackMove(Moves.SPIKE_CANNON, "Spike Cannon", Type.NORMAL, MoveCategory.PHYSICAL, 20, 100, 15, -1, "Hits 2-5 times in one turn.", -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false),
    new AttackMove(Moves.CONSTRICT, "Constrict", Type.NORMAL, MoveCategory.PHYSICAL, 10, 100, 35, -1, "May lower opponent's Speed by one stage.", 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new SelfStatusMove(Moves.AMNESIA, "Amnesia", Type.PSYCHIC, -1, 20, 128, "Sharply raises user's Special Defense.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPDEF, 2, true),
    new StatusMove(Moves.KINESIS, "Kinesis", Type.PSYCHIC, 80, 15, -1, "Lowers opponent's Accuracy.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new SelfStatusMove(Moves.SOFT_BOILED, "Soft-Boiled", Type.NORMAL, -1, 5, -1, "User recovers half its max HP.", -1, 0, 1)
      .attr(HealAttr, 0.5),
    new AttackMove(Moves.HIGH_JUMP_KICK, "High Jump Kick", Type.FIGHTING, MoveCategory.PHYSICAL, 130, 90, 10, -1, "If it misses, the user loses half their HP.", -1, 0, 1)
      .attr(MissEffectAttr, (user: Pokemon, move: Move) => { user.damage(Math.floor(user.getMaxHp() / 2)); return true; })
      .condition(failOnGravityCondition),
    new StatusMove(Moves.GLARE, "Glare", Type.NORMAL, 100, 30, -1, "Paralyzes opponent.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.DREAM_EATER, "Dream Eater", Type.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 15, -1, "User recovers half the HP inflicted on a sleeping opponent.", -1, 0, 1)
      .attr(HitHealAttr)
      .condition((user: Pokemon, target: Pokemon, move: Move) => target.status?.effect === StatusEffect.SLEEP),
    new StatusMove(Moves.POISON_GAS, "Poison Gas", Type.POISON, 90, 40, -1, "Poisons opponent.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BARRAGE, "Barrage", Type.NORMAL, MoveCategory.PHYSICAL, 15, 85, 20, -1, "Hits 2-5 times in one turn.", -1, 0, 1)
      .attr(MultiHitAttr)
      .makesContact(false),
    new AttackMove(Moves.LEECH_LIFE, "Leech Life", Type.BUG, MoveCategory.PHYSICAL, 80, 100, 10, 95, "User recovers half the HP inflicted on opponent.", -1, 0, 1)
      .attr(HitHealAttr),
    new StatusMove(Moves.LOVELY_KISS, "Lovely Kiss", Type.NORMAL, 75, 10, -1, "Puts opponent to sleep.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP),
    new AttackMove(Moves.SKY_ATTACK, "Sky Attack", Type.FLYING, MoveCategory.PHYSICAL, 140, 90, 5, -1, "Charges on first turn, attacks on second. May cause flinching. High critical hit ratio.", 30, 0, 1)
      .attr(ChargeAttr, ChargeAnim.SKY_ATTACK_CHARGING, 'is glowing!')
      .attr(HighCritAttr)
      .attr(FlinchAttr)
      .makesContact(false)
      .ignoresVirtual()
      .target(MoveTarget.OTHER),
    new SelfStatusMove(Moves.TRANSFORM, "Transform (N)", Type.NORMAL, -1, 10, -1, "User takes on the form and attacks of the opponent.", -1, 0, 1),
    new AttackMove(Moves.BUBBLE, "Bubble", Type.WATER, MoveCategory.SPECIAL, 40, 100, 30, -1, "May lower opponent's Speed.", 10, 0, 1)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.DIZZY_PUNCH, "Dizzy Punch", Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 10, -1, "May confuse opponent.", 20, 0, 1)
      .attr(ConfuseAttr),
    new StatusMove(Moves.SPORE, "Spore", Type.GRASS, 100, 15, -1, "Puts opponent to sleep.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP),
    new StatusMove(Moves.FLASH, "Flash", Type.NORMAL, 100, 20, -1, "Lowers opponent's Accuracy.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.PSYWAVE, "Psywave", Type.PSYCHIC, MoveCategory.SPECIAL, -1, 100, 15, -1, "Inflicts damage 50-150% of user's level.", -1, 0, 1)
      .attr(RandomLevelDamageAttr),
    new SelfStatusMove(Moves.SPLASH, "Splash", Type.NORMAL, -1, 40, -1, "Doesn't do ANYTHING.", -1, 0, 1)
      .condition(failOnGravityCondition),
    new SelfStatusMove(Moves.ACID_ARMOR, "Acid Armor", Type.POISON, -1, 20, -1, "Sharply raises user's Defense.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true),
    new AttackMove(Moves.CRABHAMMER, "Crabhammer", Type.WATER, MoveCategory.PHYSICAL, 100, 90, 10, -1, "High critical hit ratio.", -1, 0, 1)
      .attr(HighCritAttr),
    new AttackMove(Moves.EXPLOSION, "Explosion", Type.NORMAL, MoveCategory.PHYSICAL, 250, 100, 5, -1, "User faints.", -1, 0, 1)
      .attr(SacrificialAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FURY_SWIPES, "Fury Swipes", Type.NORMAL, MoveCategory.PHYSICAL, 18, 80, 15, -1, "Hits 2-5 times in one turn.", -1, 0, 1)
      .attr(MultiHitAttr),
    new AttackMove(Moves.BONEMERANG, "Bonemerang", Type.GROUND, MoveCategory.PHYSICAL, 50, 90, 10, -1, "Hits twice in one turn.", -1, 0, 1)
      .attr(MultiHitAttr, MultiHitType._2)
      .makesContact(false),
    new SelfStatusMove(Moves.REST, "Rest", Type.PSYCHIC, -1, 5, 85, "User sleeps for 2 turns, but user is fully healed.", -1, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.SLEEP, true, 3)
      .attr(HealAttr, 1, true)
      .condition((user: Pokemon, target: Pokemon, move: Move) => user.status?.effect !== StatusEffect.SLEEP),
    new AttackMove(Moves.ROCK_SLIDE, "Rock Slide", Type.ROCK, MoveCategory.PHYSICAL, 75, 90, 10, 86, "May cause flinching.", 30, 0, 1)
      .attr(FlinchAttr)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.HYPER_FANG, "Hyper Fang", Type.NORMAL, MoveCategory.PHYSICAL, 80, 90, 15, -1, "May cause flinching.", 10, 0, 1)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.SHARPEN, "Sharpen", Type.NORMAL, -1, 30, -1, "Raises user's Attack.", -1, 0, 1)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true),
    new SelfStatusMove(Moves.CONVERSION, "Conversion (N)", Type.NORMAL, -1, 30, -1, "Changes user's type to that of its first move.", -1, 0, 1),
    new AttackMove(Moves.TRI_ATTACK, "Tri Attack", Type.NORMAL, MoveCategory.SPECIAL, 80, 100, 10, -1, "May paralyze, burn or freeze opponent.", 20, 0, 1)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .attr(StatusEffectAttr, StatusEffect.FREEZE), // TODO: Check if independent
    new AttackMove(Moves.SUPER_FANG, "Super Fang", Type.NORMAL, MoveCategory.PHYSICAL, -1, 90, 10, -1, "Always takes off half of the opponent's HP.", -1, 0, 1)
      .attr(TargetHalfHpDamageAttr),
    new AttackMove(Moves.SLASH, "Slash", Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, -1, "High critical hit ratio.", -1, 0, 1)
      .attr(HighCritAttr),
    new SelfStatusMove(Moves.SUBSTITUTE, "Substitute (N)", Type.NORMAL, -1, 10, 103, "Uses HP to creates a decoy that takes hits.", -1, 0, 1)
      .attr(RecoilAttr),
    new AttackMove(Moves.STRUGGLE, "Struggle", Type.NORMAL, MoveCategory.PHYSICAL, 50, -1, -1, -1, "Only usable when all PP are gone. Hurts the user.", -1, 0, 1)
      .attr(RecoilAttr, true)
      .attr(TypelessAttr)
      .ignoresVirtual()
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new SelfStatusMove(Moves.SKETCH, "Sketch", Type.NORMAL, -1, 1, -1, "Permanently copies the opponent's last move.", -1, 0, 2)
      .attr(SketchAttr)
      .ignoresVirtual(),
    new AttackMove(Moves.TRIPLE_KICK, "Triple Kick", Type.FIGHTING, MoveCategory.PHYSICAL, 10, 90, 10, -1, "Hits thrice in one turn at increasing power.", -1, 0, 2)
      .attr(MultiHitAttr, MultiHitType._3_INCR)
      .attr(MissEffectAttr, (user: Pokemon, move: Move) => {
        user.turnData.hitsLeft = 0;
        return true;
      }),
    new AttackMove(Moves.THIEF, "Thief", Type.DARK, MoveCategory.PHYSICAL, 60, 100, 25, 18, "Steals a held item from the opponent.", -1, 0, 2)
      .attr(StealHeldItemAttr),
    new StatusMove(Moves.SPIDER_WEB, "Spider Web", Type.BUG, -1, 10, -1, "Opponent cannot escape/switch.", -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, 1, true),
    new StatusMove(Moves.MIND_READER, "Mind Reader", Type.NORMAL, -1, 5, -1, "User's next attack is guaranteed to hit.", -1, 0, 2)
      .attr(IgnoreAccuracyAttr),
    new StatusMove(Moves.NIGHTMARE, "Nightmare", Type.GHOST, 100, 15, -1, "The sleeping opponent loses 25% of its max HP each turn.", -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.NIGHTMARE)
      .condition((user: Pokemon, target: Pokemon, move: Move) => target.status?.effect === StatusEffect.SLEEP),
    new AttackMove(Moves.FLAME_WHEEL, "Flame Wheel", Type.FIRE, MoveCategory.PHYSICAL, 60, 100, 25, -1, "May burn opponent.", 10, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.SNORE, "Snore", Type.NORMAL, MoveCategory.SPECIAL, 50, 100, 15, -1, "Can only be used if asleep. May cause flinching.", 30, 0, 2)
      .attr(BypassSleepAttr)
      .attr(FlinchAttr)
      .condition((user: Pokemon, target: Pokemon, move: Move) => user.status?.effect === StatusEffect.SLEEP),
    new StatusMove(Moves.CURSE, "Curse (N)", Type.GHOST, -1, 10, -1, "Ghosts lose 50% of max HP and curse the opponent; Non-Ghosts raise Attack, Defense and lower Speed.", -1, 0, 2)
      .target(MoveTarget.USER),
    new AttackMove(Moves.FLAIL, "Flail", Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 15, -1, "The lower the user's HP, the higher the power.", -1, 0, 2)
      .attr(LowHpPowerAttr),
    new SelfStatusMove(Moves.CONVERSION_2, "Conversion 2 (N)", Type.NORMAL, -1, 30, -1, "User changes type to become resistant to opponent's last move.", -1, 0, 2),
    new AttackMove(Moves.AEROBLAST, "Aeroblast", Type.FLYING, MoveCategory.SPECIAL, 100, 95, 5, -1, "High critical hit ratio.", -1, 0, 2)
      .attr(HighCritAttr)
      .target(MoveTarget.OTHER),
    new StatusMove(Moves.COTTON_SPORE, "Cotton Spore", Type.GRASS, 100, 40, -1, "Sharply lowers opponent's Speed.", -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, -2)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.REVERSAL, "Reversal", Type.FIGHTING, MoveCategory.PHYSICAL, -1, 100, 15, 134, "The lower the user's HP, the higher the power.", -1, 0, 2)
      .attr(LowHpPowerAttr),
    new StatusMove(Moves.SPITE, "Spite (N)", Type.GHOST, 100, 10, -1, "The opponent's last move loses 2-5 PP.", -1, 0, 2),
    new AttackMove(Moves.POWDER_SNOW, "Powder Snow", Type.ICE, MoveCategory.SPECIAL, 40, 100, 25, -1, "May freeze opponent.", 10, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.FREEZE)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.PROTECT, "Protect", Type.NORMAL, -1, 10, 7, "Protects the user, but may fail if used consecutively.", -1, 4, 2)
      .attr(ProtectAttr),
    new AttackMove(Moves.MACH_PUNCH, "Mach Punch", Type.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 30, -1, "User attacks first.", -1, 1, 2),
    new StatusMove(Moves.SCARY_FACE, "Scary Face", Type.NORMAL, 100, 10, 6, "Sharply lowers opponent's Speed.", -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, -2),
    new AttackMove(Moves.FEINT_ATTACK, "Feint Attack", Type.DARK, MoveCategory.PHYSICAL, 60, -1, 20, -1, "Ignores Accuracy and Evasiveness.", -1, 0, 2),
    new StatusMove(Moves.SWEET_KISS, "Sweet Kiss", Type.FAIRY, 75, 10, -1, "Confuses opponent.", -1, 0, 2)
      .attr(ConfuseAttr),
    new SelfStatusMove(Moves.BELLY_DRUM, "Belly Drum (N)", Type.NORMAL, -1, 10, -1, "User loses 50% of its max HP, but Attack raises to maximum.", -1, 0, 2),
    new AttackMove(Moves.SLUDGE_BOMB, "Sludge Bomb", Type.POISON, MoveCategory.SPECIAL, 90, 100, 10, 148, "May poison opponent.", 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.MUD_SLAP, "Mud-Slap", Type.GROUND, MoveCategory.SPECIAL, 20, 100, 10, 5, "Lowers opponent's Accuracy.", 100, 0, 2)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.OCTAZOOKA, "Octazooka", Type.WATER, MoveCategory.SPECIAL, 65, 85, 10, -1, "May lower opponent's Accuracy.", 50, 0, 2)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new StatusMove(Moves.SPIKES, "Spikes", Type.GROUND, -1, 20, 90, "Hurts opponents when they switch into battle.", -1, 0, 2)
      .attr(AddArenaTrapTagAttr, ArenaTagType.SPIKES)
      .target(MoveTarget.ENEMY_SIDE),
    new AttackMove(Moves.ZAP_CANNON, "Zap Cannon", Type.ELECTRIC, MoveCategory.SPECIAL, 120, 50, 5, -1, "Paralyzes opponent.", 100, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new StatusMove(Moves.FORESIGHT, "Foresight (N)", Type.NORMAL, -1, 40, -1, "Resets opponent's Evasiveness, and allows Normal- and Fighting-type attacks to hit Ghosts.", -1, 0, 2), // TODO
    new StatusMove(Moves.DESTINY_BOND, "Destiny Bond (N)", Type.GHOST, -1, 5, -1, "If the user faints, the opponent also faints.", -1, 0, 2)
      .ignoresProtect(),
    new StatusMove(Moves.PERISH_SONG, "Perish Song (N)", Type.NORMAL, -1, 5, -1, "Any Pokémon in play when this attack is used faints in 3 turns.", -1, 0, 2)
      .ignoresProtect()
      .target(MoveTarget.ALL),
    new AttackMove(Moves.ICY_WIND, "Icy Wind", Type.ICE, MoveCategory.SPECIAL, 55, 95, 15, 34, "Lowers opponent's Speed.", 100, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.DETECT, "Detect", Type.FIGHTING, -1, 5, -1, "Protects the user, but may fail if used consecutively.", -1, 4, 2)
      .attr(ProtectAttr),
    new AttackMove(Moves.BONE_RUSH, "Bone Rush", Type.GROUND, MoveCategory.PHYSICAL, 25, 90, 10, -1, "Hits 2-5 times in one turn.", -1, 0, 2)
      .attr(MultiHitAttr)
      .makesContact(false),
    new StatusMove(Moves.LOCK_ON, "Lock-On", Type.NORMAL, -1, 5, -1, "User's next attack is guaranteed to hit.", -1, 0, 2)
      .attr(IgnoreAccuracyAttr),
    new AttackMove(Moves.OUTRAGE, "Outrage", Type.DRAGON, MoveCategory.PHYSICAL, 120, 100, 10, 156, "User attacks for 2-3 turns but then becomes confused.", -1, 0, 2)
      .attr(FrenzyAttr)
      .attr(MissEffectAttr, frenzyMissFunc)
      .attr(ConfuseAttr, true) // TODO: Update to still confuse if last hit misses
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new StatusMove(Moves.SANDSTORM, "Sandstorm", Type.ROCK, -1, 10, 51, "Creates a sandstorm for 5 turns.", -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.SANDSTORM)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.GIGA_DRAIN, "Giga Drain", Type.GRASS, MoveCategory.SPECIAL, 75, 100, 10, 111, "User recovers half the HP inflicted on opponent.", -1, 4, 2)
      .attr(HitHealAttr),
    new SelfStatusMove(Moves.ENDURE, "Endure (N)", Type.NORMAL, -1, 10, 47, "Always left with at least 1 HP, but may fail if used consecutively.", -1, 0, 2),
    new StatusMove(Moves.CHARM, "Charm", Type.FAIRY, 100, 20, 2, "Sharply lowers opponent's Attack.", -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.ATK, -2),
    new AttackMove(Moves.ROLLOUT, "Rollout", Type.ROCK, MoveCategory.PHYSICAL, 30, 90, 20, -1, "Doubles in power each turn for 5 turns.", -1, 0, 2)
      .attr(ConsecutiveUseDoublePowerAttr, 5, true, true, Moves.DEFENSE_CURL),
    new AttackMove(Moves.FALSE_SWIPE, "False Swipe (N)", Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 40, 57, "Always leaves opponent with at least 1 HP.", -1, 0, 2),
    new StatusMove(Moves.SWAGGER, "Swagger", Type.NORMAL, 85, 15, -1, "Confuses opponent, but sharply raises its Attack.", -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.ATK, 2)
      .attr(ConfuseAttr),
    new SelfStatusMove(Moves.MILK_DRINK, "Milk Drink", Type.NORMAL, -1, 5, -1, "User recovers half its max HP.", -1, 0, 2)
      .attr(HealAttr, 0.5),
    new AttackMove(Moves.SPARK, "Spark", Type.ELECTRIC, MoveCategory.PHYSICAL, 65, 100, 20, -1, "May paralyze opponent.", 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.FURY_CUTTER, "Fury Cutter", Type.BUG, MoveCategory.PHYSICAL, 40, 95, 20, -1, "Power increases each turn.", -1, 0, 2)
      .attr(ConsecutiveUseDoublePowerAttr, 3, true),
    new AttackMove(Moves.STEEL_WING, "Steel Wing", Type.STEEL, MoveCategory.PHYSICAL, 70, 90, 25, -1, "May raise user's Defense.", 10, 0, 2)
      .attr(StatChangeAttr, BattleStat.DEF, 1, true),
    new StatusMove(Moves.MEAN_LOOK, "Mean Look", Type.NORMAL, -1, 5, -1, "Opponent cannot flee or switch.", -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, 1, true),
    new StatusMove(Moves.ATTRACT, "Attract", Type.NORMAL, 100, 15, -1, "If opponent is the opposite gender, it's less likely to attack.", -1, 0, 2)
      .attr(AddBattlerTagAttr, BattlerTagType.INFATUATED)
      .condition((user: Pokemon, target: Pokemon, move: Move) => user.isOppositeGender(target)),
    new SelfStatusMove(Moves.SLEEP_TALK, "Sleep Talk", Type.NORMAL, -1, 10, 70, "User performs one of its own moves while sleeping.", -1, 0, 2)
      .attr(BypassSleepAttr)
      .attr(RandomMovesetMoveAttr)
      .condition((user: Pokemon, target: Pokemon, move: Move) => user.status?.effect === StatusEffect.SLEEP),
    new SelfStatusMove(Moves.HEAL_BELL, "Heal Bell (N)", Type.NORMAL, -1, 5, -1, "Heals the user's party's status conditions.", -1, 0, 2)
      .target(MoveTarget.USER_AND_ALLIES),
    new AttackMove(Moves.RETURN, "Return (N)", Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 20, -1, "Power increases with higher Friendship.", -1, 0, 2),
    new AttackMove(Moves.PRESENT, "Present (N)", Type.NORMAL, MoveCategory.PHYSICAL, -1, 90, 15, -1, "Either deals damage or heals.", -1, 0, 2)
      .makesContact(false),
    new AttackMove(Moves.FRUSTRATION, "Frustration (N)", Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 20, -1, "Power decreases with higher Friendship.", -1, 0, 2),
    new SelfStatusMove(Moves.SAFEGUARD, "Safeguard (N)", Type.NORMAL, -1, 25, -1, "The user's party is protected from status conditions.", -1, 0, 2)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.PAIN_SPLIT, "Pain Split (N)", Type.NORMAL, -1, 20, -1, "The user's and opponent's HP becomes the average of both.", -1, 0, 2),
    new AttackMove(Moves.SACRED_FIRE, "Sacred Fire", Type.FIRE, MoveCategory.PHYSICAL, 100, 95, 5, -1, "May burn opponent.", 50, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .makesContact(false),
    new AttackMove(Moves.MAGNITUDE, "Magnitude (N)", Type.GROUND, MoveCategory.PHYSICAL, -1, 100, 30, -1, "Hits with random power.", -1, 0, 2)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.DYNAMIC_PUNCH, "Dynamic Punch", Type.FIGHTING, MoveCategory.PHYSICAL, 100, 50, 5, -1, "Confuses opponent.", 100, 0, 2)
      .attr(ConfuseAttr),
    new AttackMove(Moves.MEGAHORN, "Megahorn", Type.BUG, MoveCategory.PHYSICAL, 120, 85, 10, -1, "", -1, 0, 2),
    new AttackMove(Moves.DRAGON_BREATH, "Dragon Breath", Type.DRAGON, MoveCategory.SPECIAL, 60, 100, 20, -1, "May paralyze opponent.", 30, 0, 2)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new SelfStatusMove(Moves.BATON_PASS, "Baton Pass (N)", Type.NORMAL, -1, 40, 132, "User switches out and gives stat changes to the incoming Pokémon.", -1, 0, 2),
    new StatusMove(Moves.ENCORE, "Encore (N)", Type.NORMAL, 100, 5, 122, "Forces opponent to keep using its last move for 3 turns.", -1, 0, 2),
    new AttackMove(Moves.PURSUIT, "Pursuit (N)", Type.DARK, MoveCategory.PHYSICAL, 40, 100, 20, -1, "Double power if the opponent is switching out.", -1, 0, 2),
    new AttackMove(Moves.RAPID_SPIN, "Rapid Spin", Type.NORMAL, MoveCategory.PHYSICAL, 50, 100, 40, -1, "Raises user's Speed and removes entry hazards and trap move effects.", 100, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true)
      .attr(LapseBattlerTagAttr, [ BattlerTagType.BIND, BattlerTagType.WRAP, BattlerTagType.FIRE_SPIN, BattlerTagType.WHIRLPOOL, BattlerTagType.CLAMP, BattlerTagType.SAND_TOMB, BattlerTagType.MAGMA_STORM ], true),
    new StatusMove(Moves.SWEET_SCENT, "Sweet Scent", Type.NORMAL, 100, 20, -1, "Lowers opponent's Evasiveness.", -1, 0, 2)
      .attr(StatChangeAttr, BattleStat.EVA, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.IRON_TAIL, "Iron Tail", Type.STEEL, MoveCategory.PHYSICAL, 100, 75, 15, -1, "May lower opponent's Defense.", 30, 0, 2)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.METAL_CLAW, "Metal Claw", Type.STEEL, MoveCategory.PHYSICAL, 50, 95, 35, 31, "May raise user's Attack.", 10, 0, 2)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true),
    new AttackMove(Moves.VITAL_THROW, "Vital Throw", Type.FIGHTING, MoveCategory.PHYSICAL, 70, -1, 10, -1, "User attacks last, but ignores Accuracy and Evasiveness.", -1, -1, 2),
    new SelfStatusMove(Moves.MORNING_SUN, "Morning Sun", Type.NORMAL, -1, 5, -1, "User recovers HP. Amount varies with the weather.", -1, 0, 2)
      .attr(WeatherHealAttr),
    new SelfStatusMove(Moves.SYNTHESIS, "Synthesis", Type.GRASS, -1, 5, -1, "User recovers HP. Amount varies with the weather.", -1, 0, 2)
      .attr(WeatherHealAttr),
    new SelfStatusMove(Moves.MOONLIGHT, "Moonlight", Type.FAIRY, -1, 5, -1, "User recovers HP. Amount varies with the weather.", -1, 0, 2)
      .attr(WeatherHealAttr),
    new AttackMove(Moves.HIDDEN_POWER, "Hidden Power (N)", Type.NORMAL, MoveCategory.SPECIAL, 60, 100, 15, -1, "Type and power depends on user's IVs.", -1, 0, 2),
    new AttackMove(Moves.CROSS_CHOP, "Cross Chop", Type.FIGHTING, MoveCategory.PHYSICAL, 100, 80, 5, -1, "High critical hit ratio.", -1, 0, 2)
      .attr(HighCritAttr),
    new AttackMove(Moves.TWISTER, "Twister", Type.DRAGON, MoveCategory.SPECIAL, 40, 100, 20, -1, "May cause flinching. Hits Pokémon using FLY/BOUNCE with double power.", 20, 0, 2)
      .attr(HitsTagAttr, BattlerTagType.FLYING, true)
      .attr(FlinchAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES), // TODO
    new SelfStatusMove(Moves.RAIN_DANCE, "Rain Dance", Type.WATER, -1, 5, 50, "Makes it rain for 5 turns.", -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.RAIN)
      .target(MoveTarget.BOTH_SIDES),
    new SelfStatusMove(Moves.SUNNY_DAY, "Sunny Day", Type.FIRE, -1, 5, 49, "Makes it sunny for 5 turns.", -1, 0, 2)
      .attr(WeatherChangeAttr, WeatherType.SUNNY)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.CRUNCH, "Crunch", Type.DARK, MoveCategory.PHYSICAL, 80, 100, 15, 108, "May lower opponent's Defense.", 20, 0, 2)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.MIRROR_COAT, "Mirror Coat", Type.PSYCHIC, MoveCategory.SPECIAL, -1, 100, 20, -1, "When hit by a Special Attack, user strikes back with 2x power.", -1, -5, 2)
      .attr(CounterDamageAttr, (move: Move) => move.category === MoveCategory.SPECIAL)
      .target(MoveTarget.ATTACKER),
    new SelfStatusMove(Moves.PSYCH_UP, "Psych Up (N)", Type.NORMAL, -1, 10, -1, "Copies the opponent's stat changes.", -1, 0, 2),
    new AttackMove(Moves.EXTREME_SPEED, "Extreme Speed", Type.NORMAL, MoveCategory.PHYSICAL, 80, 100, 5, -1, "User attacks first.", -1, 2, 2),
    new AttackMove(Moves.ANCIENT_POWER, "Ancient Power", Type.ROCK, MoveCategory.SPECIAL, 60, 100, 5, -1, "May raise all user's stats at once.", 10, 0, 2)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true),
    new AttackMove(Moves.SHADOW_BALL, "Shadow Ball", Type.GHOST, MoveCategory.SPECIAL, 80, 100, 15, 114, "May lower opponent's Special Defense.", 20, 0, 2)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.FUTURE_SIGHT, "Future Sight (N)", Type.PSYCHIC, MoveCategory.SPECIAL, 120, 100, 10, -1, "Damage occurs 2 turns later.", -1, 0, 2),
    new AttackMove(Moves.ROCK_SMASH, "Rock Smash", Type.FIGHTING, MoveCategory.PHYSICAL, 40, 100, 15, -1, "May lower opponent's Defense.", 50, 0, 2)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.WHIRLPOOL, "Whirlpool", Type.WATER, MoveCategory.SPECIAL, 35, 85, 15, -1, "Traps opponent, damaging them for 4-5 turns.", 100, 0, 2)
      .attr(TrapAttr, BattlerTagType.WHIRLPOOL),
    new AttackMove(Moves.BEAT_UP, "Beat Up (N)", Type.DARK, MoveCategory.PHYSICAL, -1, 100, 10, -1, "Each Pokémon in user's party attacks.", -1, 0, 2)
      .makesContact(false),
    new AttackMove(Moves.FAKE_OUT, "Fake Out", Type.NORMAL, MoveCategory.PHYSICAL, 40, 100, 10, -1, "User attacks first, foe flinches. Only usable on first turn.", 100, 3, 3)
      .attr(FlinchAttr)
      .condition((user: Pokemon, target: Pokemon, move: Move) => !user.getMoveHistory().length),
    new AttackMove(Moves.UPROAR, "Uproar (N)", Type.NORMAL, MoveCategory.SPECIAL, 90, 100, 10, -1, "User attacks for 3 turns and prevents sleep.", -1, 0, 3)
      .ignoresVirtual()
      .target(MoveTarget.RANDOM_NEAR_ENEMY),
    new SelfStatusMove(Moves.STOCKPILE, "Stockpile (N)", Type.NORMAL, -1, 20, -1, "Stores energy for use with Spit Up and Swallow.", -1, 0, 3),
    new AttackMove(Moves.SPIT_UP, "Spit Up (N)", Type.NORMAL, MoveCategory.SPECIAL, -1, 100, 10, -1, "Power depends on how many times the user performed Stockpile.", -1, 0, 3),
    new SelfStatusMove(Moves.SWALLOW, "Swallow (N)", Type.NORMAL, -1, 10, -1, "The more times the user has performed Stockpile, the more HP is recovered.", -1, 0, 3),
    new AttackMove(Moves.HEAT_WAVE, "Heat Wave", Type.FIRE, MoveCategory.SPECIAL, 95, 90, 10, 118, "May burn opponent.", 10, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new SelfStatusMove(Moves.HAIL, "Hail", Type.ICE, -1, 10, -1, "Non-Ice types are damaged for 5 turns.", -1, 0, 3)
      .attr(WeatherChangeAttr, WeatherType.HAIL)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.TORMENT, "Torment (N)", Type.DARK, 100, 15, -1, "Opponent cannot use the same move in a row.", -1, 0, 3),
    new StatusMove(Moves.FLATTER, "Flatter", Type.DARK, 100, 15, -1, "Confuses opponent, but raises its Special Attack.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, 1)
      .attr(ConfuseAttr),
    new StatusMove(Moves.WILL_O_WISP, "Will-O-Wisp", Type.FIRE, 85, 15, 107, "Burns opponent.", -1, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new StatusMove(Moves.MEMENTO, "Memento", Type.DARK, 100, 10, -1, "User faints, sharply lowers opponent's Attack and Special Attack.", -1, 0, 3)
      .attr(SacrificialAttr)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], -2),
    new AttackMove(Moves.FACADE, "Facade", Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, 25, "Power doubles if user is burned, poisoned, or paralyzed.", -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user: Pokemon, target: Pokemon, move: Move) => user.status
        && (user.status.effect === StatusEffect.BURN || user.status.effect === StatusEffect.POISON || user.status.effect === StatusEffect.TOXIC || user.status.effect === StatusEffect.PARALYSIS) ? 2 : 1),
    new AttackMove(Moves.FOCUS_PUNCH, "Focus Punch (N)", Type.FIGHTING, MoveCategory.PHYSICAL, 150, 100, 20, -1, "If the user is hit before attacking, it flinches instead.", -1, -3, 3)
      .ignoresVirtual(),
    new AttackMove(Moves.SMELLING_SALTS, "Smelling Salts", Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 10, -1, "Power doubles if opponent is paralyzed, but cures it.", -1, 0, 3)
      .attr(MovePowerMultiplierAttr, (user: Pokemon, target: Pokemon, move: Move) => target.status?.effect === StatusEffect.PARALYSIS ? 2 : 1)
      .attr(HealStatusEffectAttr, false, StatusEffect.PARALYSIS),
    new SelfStatusMove(Moves.FOLLOW_ME, "Follow Me (N)", Type.NORMAL, -1, 20, -1, "In Double Battle, the user takes all the attacks.", -1, 3, 3),
    new SelfStatusMove(Moves.NATURE_POWER, "Nature Power (N)", Type.NORMAL, -1, 20, -1, "Uses a certain move based on the current terrain.", -1, 0, 3),
    new SelfStatusMove(Moves.CHARGE, "Charge (P)", Type.ELECTRIC, -1, 20, -1, "Raises user's Special Defense and next Electric move's power increases.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPDEF, 1, true), // TODO
    new StatusMove(Moves.TAUNT, "Taunt (N)", Type.DARK, 100, 20, 87, "Opponent can only use moves that attack.", -1, 0, 3),
    new SelfStatusMove(Moves.HELPING_HAND, "Helping Hand (N)", Type.NORMAL, -1, 20, 130, "In Double Battles, boosts the power of the partner's move.", -1, 5, 3)
      .target(MoveTarget.NEAR_ALLY), // TODO
    new StatusMove(Moves.TRICK, "Trick (N)", Type.PSYCHIC, 100, 10, 109, "Swaps held items with the opponent.", -1, 0, 3),
    new SelfStatusMove(Moves.ROLE_PLAY, "Role Play (N)", Type.PSYCHIC, -1, 10, -1, "User copies the opponent's Ability.", -1, 0, 3),
    new SelfStatusMove(Moves.WISH, "Wish (N)", Type.NORMAL, -1, 10, -1, "The user recovers HP in the following turn.", -1, 0, 3),
    new SelfStatusMove(Moves.ASSIST, "Assist", Type.NORMAL, -1, 20, -1, "User performs a move known by its allies at random.", -1, 0, 3)
      .attr(RandomMovesetMoveAttr, true)
      .ignoresVirtual(),
    new SelfStatusMove(Moves.INGRAIN, "Ingrain", Type.GRASS, -1, 20, -1, "User restores HP each turn. User cannot escape/switch.", -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.INGRAIN, true, undefined, true),
    new AttackMove(Moves.SUPERPOWER, "Superpower", Type.FIGHTING, MoveCategory.PHYSICAL, 120, 100, 5, -1, "Lowers user's Attack and Defense.", 100, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF ], -1, true),
    new SelfStatusMove(Moves.MAGIC_COAT, "Magic Coat (N)", Type.PSYCHIC, -1, 15, -1, "Reflects moves that cause status conditions back to the attacker.", -1, 4, 3),
    new SelfStatusMove(Moves.RECYCLE, "Recycle (N)", Type.NORMAL, -1, 10, -1, "User's used hold item is restored.", -1, 0, 3),
    new AttackMove(Moves.REVENGE, "Revenge (N)", Type.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, -1, "Power increases if user was hit first.", -1, -4, 3),
    new AttackMove(Moves.BRICK_BREAK, "Brick Break (N)", Type.FIGHTING, MoveCategory.PHYSICAL, 75, 100, 15, 58, "Breaks through Reflect and Light Screen barriers.", -1, 0, 3),
    new StatusMove(Moves.YAWN, "Yawn", Type.NORMAL, -1, 10, -1, "Puts opponent to sleep in the next turn.", -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.DROWSY, false, undefined, true)
      .condition((user: Pokemon, target: Pokemon, move: Move) => !target.status),
    new AttackMove(Moves.KNOCK_OFF, "Knock Off (N)", Type.DARK, MoveCategory.PHYSICAL, 65, 100, 20, -1, "Removes opponent's held item for the rest of the battle.", -1, 0, 3),
    new AttackMove(Moves.ENDEAVOR, "Endeavor (N)", Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 5, -1, "Reduces opponent's HP to same as user's.", -1, 0, 3),
    new AttackMove(Moves.ERUPTION, "Eruption", Type.FIRE, MoveCategory.SPECIAL, 150, 100, 5, -1, "Stronger when the user's HP is higher.", -1, 0, 3)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.SKILL_SWAP, "Skill Swap (N)", Type.PSYCHIC, -1, 10, 98, "The user swaps Abilities with the opponent.", -1, 0, 3),
    new StatusMove(Moves.IMPRISON, "Imprison (N)", Type.PSYCHIC, -1, 10, 92, "Opponent is unable to use moves that the user also knows.", -1, 0, 3)
      .target(MoveTarget.USER),
    new SelfStatusMove(Moves.REFRESH, "Refresh", Type.NORMAL, -1, 20, -1, "Cures paralysis, poison, and burns.", -1, 0, 3)
      .attr(HealStatusEffectAttr, true, StatusEffect.PARALYSIS, StatusEffect.POISON, StatusEffect.TOXIC, StatusEffect.BURN)
      .condition((user: Pokemon, target: Pokemon, move: Move) => user.status && (user.status.effect === StatusEffect.PARALYSIS || user.status.effect === StatusEffect.POISON || user.status.effect === StatusEffect.TOXIC || user.status.effect === StatusEffect.BURN)),
    new SelfStatusMove(Moves.GRUDGE, "Grudge (N)", Type.GHOST, -1, 5, -1, "If the users faints after using this move, the PP for the opponent's last move is depleted.", -1, 0, 3),
    new SelfStatusMove(Moves.SNATCH, "Snatch (N)", Type.DARK, -1, 10, -1, "Steals the effects of the opponent's next move.", -1, 4, 3),
    new AttackMove(Moves.SECRET_POWER, "Secret Power (N)", Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, -1, "Effects of the attack vary with the location.", 30, 0, 3)
      .makesContact(false),
    new AttackMove(Moves.DIVE, "Dive", Type.WATER, MoveCategory.PHYSICAL, 80, 100, 10, -1, "Dives underwater on first turn, attacks on second turn.", -1, 0, 3)
      .attr(ChargeAttr, ChargeAnim.DIVE_CHARGING, 'hid\nunderwater!')
      .ignoresVirtual(),
    new AttackMove(Moves.ARM_THRUST, "Arm Thrust", Type.FIGHTING, MoveCategory.PHYSICAL, 15, 100, 20, -1, "Hits 2-5 times in one turn.", -1, 0, 3)
      .attr(MultiHitAttr),
    new SelfStatusMove(Moves.CAMOUFLAGE, "Camouflage", Type.NORMAL, -1, 20, -1, "Changes user's type according to the location.", -1, 0, 3)
      .attr(CopyBiomeTypeAttr),
    new SelfStatusMove(Moves.TAIL_GLOW, "Tail Glow", Type.BUG, -1, 20, -1, "Drastically raises user's Special Attack.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, 3, true),
    new AttackMove(Moves.LUSTER_PURGE, "Luster Purge", Type.PSYCHIC, MoveCategory.SPECIAL, 70, 100, 5, -1, "May lower opponent's Special Defense.", 50, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.MIST_BALL, "Mist Ball", Type.PSYCHIC, MoveCategory.SPECIAL, 70, 100, 5, -1, "May lower opponent's Special Attack.", 50, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new StatusMove(Moves.FEATHER_DANCE, "Feather Dance", Type.FLYING, 100, 15, -1, "Sharply lowers opponent's Attack.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.ATK, -2),
    new StatusMove(Moves.TEETER_DANCE, "Teeter Dance", Type.NORMAL, 100, 20, -1, "Confuses all other nearby Pokémon.", -1, 0, 3)
      .attr(ConfuseAttr)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.BLAZE_KICK, "Blaze Kick", Type.FIRE, MoveCategory.PHYSICAL, 85, 90, 10, -1, "High critical hit ratio. May burn opponent.", 10, 0, 3)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new SelfStatusMove(Moves.MUD_SPORT, "Mud Sport", Type.GROUND, -1, 15, -1, "Weakens the power of Electric-type moves.", -1, 0, 3)
      .attr(AddArenaTagAttr, ArenaTagType.MUD_SPORT, 5)
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.ICE_BALL, "Ice Ball", Type.ICE, MoveCategory.PHYSICAL, 30, 90, 20, -1, "Doubles in power each turn for 5 turns.", -1, 0, 3)
      .attr(ConsecutiveUseDoublePowerAttr, 5, true, true, Moves.DEFENSE_CURL),
    new AttackMove(Moves.NEEDLE_ARM, "Needle Arm", Type.GRASS, MoveCategory.PHYSICAL, 60, 100, 15, -1, "May cause flinching.", 30, 0, 3)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.SLACK_OFF, "Slack Off", Type.NORMAL, -1, 5, -1, "User recovers half its max HP.", -1, 0, 3)
      .attr(HealAttr),
    new AttackMove(Moves.HYPER_VOICE, "Hyper Voice", Type.NORMAL, MoveCategory.SPECIAL, 90, 100, 10, 117, "", -1, 0, 3)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.POISON_FANG, "Poison Fang", Type.POISON, MoveCategory.PHYSICAL, 50, 100, 15, -1, "May badly poison opponent.", 50, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.TOXIC),
    new AttackMove(Moves.CRUSH_CLAW, "Crush Claw", Type.NORMAL, MoveCategory.PHYSICAL, 75, 95, 10, -1, "May lower opponent's Defense.", 50, 0, 3)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.BLAST_BURN, "Blast Burn", Type.FIRE, MoveCategory.SPECIAL, 150, 90, 5, 153, "User must recharge next turn.", -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.RECHARGING, true),
    new AttackMove(Moves.HYDRO_CANNON, "Hydro Cannon", Type.WATER, MoveCategory.SPECIAL, 150, 90, 5, 154, "User must recharge next turn.", -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.RECHARGING, true),
    new AttackMove(Moves.METEOR_MASH, "Meteor Mash", Type.STEEL, MoveCategory.PHYSICAL, 90, 90, 10, -1, "May raise user's Attack.", 20, 0, 3)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true),
    new AttackMove(Moves.ASTONISH, "Astonish", Type.GHOST, MoveCategory.PHYSICAL, 30, 100, 15, -1, "May cause flinching.", 30, 0, 3)
      .attr(FlinchAttr),
    new AttackMove(Moves.WEATHER_BALL, "Weather Ball (N)", Type.NORMAL, MoveCategory.SPECIAL, 50, 100, 10, -1, "Move's power and type changes with the weather.", -1, 0, 3),
    new SelfStatusMove(Moves.AROMATHERAPY, "Aromatherapy (N)", Type.GRASS, -1, 5, -1, "Cures all status problems in your party.", -1, 0, 3)
      .target(MoveTarget.USER_AND_ALLIES),
    new StatusMove(Moves.FAKE_TEARS, "Fake Tears", Type.DARK, 100, 20, 3, "Sharply lowers opponent's Special Defense.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPDEF, -2),
    new AttackMove(Moves.AIR_CUTTER, "Air Cutter", Type.FLYING, MoveCategory.SPECIAL, 60, 95, 25, 40, "High critical hit ratio.", -1, 0, 3)
      .attr(HighCritAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.OVERHEAT, "Overheat", Type.FIRE, MoveCategory.SPECIAL, 130, 90, 5, 157, "Sharply lowers user's Special Attack.", 100, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true),
    new StatusMove(Moves.ODOR_SLEUTH, "Odor Sleuth (N)", Type.NORMAL, -1, 40, -1, "Resets opponent's Evasiveness, and allows Normal- and Fighting-type attacks to hit Ghosts.", -1, 0, 3),
    new AttackMove(Moves.ROCK_TOMB, "Rock Tomb", Type.ROCK, MoveCategory.PHYSICAL, 60, 95, 15, 36, "Lowers opponent's Speed.", 100, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .makesContact(false),
    new AttackMove(Moves.SILVER_WIND, "Silver Wind", Type.BUG, MoveCategory.SPECIAL, 60, 100, 5, -1, "May raise all stats of user at once.", 10, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true),
    new StatusMove(Moves.METAL_SOUND, "Metal Sound", Type.STEEL, 85, 40, -1, "Sharply lowers opponent's Special Defense.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPDEF, -2),
    new StatusMove(Moves.GRASS_WHISTLE, "Grass Whistle", Type.GRASS, 55, 15, -1, "Puts opponent to sleep.", -1, 0, 3)
      .attr(StatusEffectAttr, StatusEffect.SLEEP),
    new StatusMove(Moves.TICKLE, "Tickle", Type.NORMAL, 100, 20, -1, "Lowers opponent's Attack and Defense.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.ATK, -1)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new SelfStatusMove(Moves.COSMIC_POWER, "Cosmic Power", Type.PSYCHIC, -1, 20, -1, "Raises user's Defense and Special Defense.", -1, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], 1, true),
    new AttackMove(Moves.WATER_SPOUT, "Water Spout", Type.WATER, MoveCategory.SPECIAL, 150, 100, 5, -1, "The higher the user's HP, the higher the damage caused.", -1, 0, 3)
      .attr(HpPowerAttr)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SIGNAL_BEAM, "Signal Beam", Type.BUG, MoveCategory.SPECIAL, 75, 100, 15, -1, "May confuse opponent.", 10, 0, 3)
      .attr(ConfuseAttr),
    new AttackMove(Moves.SHADOW_PUNCH, "Shadow Punch", Type.GHOST, MoveCategory.PHYSICAL, 60, -1, 20, -1, "Ignores Accuracy and Evasiveness.", -1, 0, 3),
    new AttackMove(Moves.EXTRASENSORY, "Extrasensory", Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 20, -1, "May cause flinching.", 10, 0, 3)
      .attr(FlinchAttr),
    new AttackMove(Moves.SKY_UPPERCUT, "Sky Uppercut", Type.FIGHTING, MoveCategory.PHYSICAL, 85, 90, 15, -1, "Hits the opponent, even during FLY.", -1, 0, 3)
      .attr(HitsTagAttr, BattlerTagType.FLYING),
    new AttackMove(Moves.SAND_TOMB, "Sand Tomb", Type.GROUND, MoveCategory.PHYSICAL, 35, 85, 15, -1, "Traps opponent, damaging them for 4-5 turns.", 100, 0, 3)
      .attr(TrapAttr, BattlerTagType.SAND_TOMB)
      .makesContact(false),
    new AttackMove(Moves.SHEER_COLD, "Sheer Cold", Type.ICE, MoveCategory.SPECIAL, -1, 30, 5, -1, "One-Hit-KO, if it hits.", -1, 0, 3)
      .attr(OneHitKOAttr),
    new AttackMove(Moves.MUDDY_WATER, "Muddy Water", Type.WATER, MoveCategory.SPECIAL, 90, 85, 10, -1, "May lower opponent's Accuracy.", 30, 0, 3)
      .attr(StatChangeAttr, BattleStat.ACC, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BULLET_SEED, "Bullet Seed", Type.GRASS, MoveCategory.PHYSICAL, 25, 100, 30, 56, "Hits 2-5 times in one turn.", -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false),
    new AttackMove(Moves.AERIAL_ACE, "Aerial Ace", Type.FLYING, MoveCategory.PHYSICAL, 60, -1, 20, 27, "Ignores Accuracy and Evasiveness.", -1, 0, 3)
      .target(MoveTarget.OTHER),
    new AttackMove(Moves.ICICLE_SPEAR, "Icicle Spear", Type.ICE, MoveCategory.PHYSICAL, 25, 100, 30, -1, "Hits 2-5 times in one turn.", -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false),
    new SelfStatusMove(Moves.IRON_DEFENSE, "Iron Defense", Type.STEEL, -1, 15, 104, "Sharply raises user's Defense.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.DEF, 2, true),
    new StatusMove(Moves.BLOCK, "Block", Type.NORMAL, -1, 5, -1, "Opponent cannot flee or switch.", -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.TRAPPED, false, 1, true),
    new SelfStatusMove(Moves.HOWL, "Howl", Type.NORMAL, -1, 40, -1, "Raises Attack of allies.", -1, 0, 3)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true)
      .target(MoveTarget.USER_AND_ALLIES), // TODO
    new AttackMove(Moves.DRAGON_CLAW, "Dragon Claw", Type.DRAGON, MoveCategory.PHYSICAL, 80, 100, 15, 78, "", -1, 0, 3),
    new AttackMove(Moves.FRENZY_PLANT, "Frenzy Plant", Type.GRASS, MoveCategory.SPECIAL, 150, 90, 5, 155, "User must recharge next turn.", -1, 0, 3)
      .attr(AddBattlerTagAttr, BattlerTagType.RECHARGING, true),
    new SelfStatusMove(Moves.BULK_UP, "Bulk Up", Type.FIGHTING, -1, 20, 64, "Raises user's Attack and Defense.", -1, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF ], 1, true),
    new AttackMove(Moves.BOUNCE, "Bounce", Type.FLYING, MoveCategory.PHYSICAL, 85, 85, 5, -1, "Springs up on first turn, attacks on second. May paralyze opponent.", 30, 0, 3)
      .attr(ChargeAttr, ChargeAnim.BOUNCE_CHARGING, 'sprang up!', BattlerTagType.FLYING)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .condition(failOnGravityCondition)
      .ignoresVirtual()
      .target(MoveTarget.OTHER),
    new AttackMove(Moves.MUD_SHOT, "Mud Shot", Type.GROUND, MoveCategory.SPECIAL, 55, 95, 15, 35, "Lowers opponent's Speed.", 100, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new AttackMove(Moves.POISON_TAIL, "Poison Tail", Type.POISON, MoveCategory.PHYSICAL, 50, 100, 25, 26, "High critical hit ratio. May poison opponent.", 10, 0, 3)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.COVET, "Covet (N)", Type.NORMAL, MoveCategory.PHYSICAL, 60, 100, 25, -1, "Opponent's item is stolen by the user.", -1, 0, 3),
    new AttackMove(Moves.VOLT_TACKLE, "Volt Tackle", Type.ELECTRIC, MoveCategory.PHYSICAL, 120, 100, 15, -1, "User receives recoil damage. May paralyze opponent.", 10, 0, 3)
      .attr(RecoilAttr)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.MAGICAL_LEAF, "Magical Leaf", Type.GRASS, MoveCategory.SPECIAL, 60, -1, 20, 33, "Ignores Accuracy and Evasiveness.", -1, 0, 3),
    new SelfStatusMove(Moves.WATER_SPORT, "Water Sport", Type.WATER, -1, 15, -1, "Weakens the power of Fire-type moves.", -1, 0, 3)
      .attr(AddArenaTagAttr, ArenaTagType.WATER_SPORT, 5)
      .target(MoveTarget.BOTH_SIDES),
    new SelfStatusMove(Moves.CALM_MIND, "Calm Mind", Type.PSYCHIC, -1, 20, 129, "Raises user's Special Attack and Special Defense.", -1, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.SPATK, BattleStat.SPDEF ], 1, true),
    new AttackMove(Moves.LEAF_BLADE, "Leaf Blade", Type.GRASS, MoveCategory.PHYSICAL, 90, 100, 15, -1, "High critical hit ratio.", -1, 0, 3)
      .attr(HighCritAttr),
    new SelfStatusMove(Moves.DRAGON_DANCE, "Dragon Dance", Type.DRAGON, -1, 20, 100, "Raises user's Attack and Speed.", -1, 0, 3)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPD ], 1, true),
    new AttackMove(Moves.ROCK_BLAST, "Rock Blast", Type.ROCK, MoveCategory.PHYSICAL, 25, 90, 10, 76, "Hits 2-5 times in one turn.", -1, 0, 3)
      .attr(MultiHitAttr)
      .makesContact(false),
    new AttackMove(Moves.SHOCK_WAVE, "Shock Wave", Type.ELECTRIC, MoveCategory.SPECIAL, 60, -1, 20, -1, "Ignores Accuracy and Evasiveness.", -1, 0, 3),
    new AttackMove(Moves.WATER_PULSE, "Water Pulse", Type.WATER, MoveCategory.SPECIAL, 60, 100, 20, 11, "May confuse opponent.", 20, 0, 3)
      .attr(ConfuseAttr)
      .target(MoveTarget.OTHER),
    new AttackMove(Moves.DOOM_DESIRE, "Doom Desire", Type.STEEL, MoveCategory.SPECIAL, 140, 100, 5, -1, "Damage occurs 2 turns later.", -1, 0, 3)
      .attr(ChargeAttr, ChargeAnim.DOOM_DESIRE_CHARGING, 'chose\nDOOM DESIRE as its destiny!'), // Fix this move to work properly
    new AttackMove(Moves.PSYCHO_BOOST, "Psycho Boost", Type.PSYCHIC, MoveCategory.SPECIAL, 140, 90, 5, -1, "Sharply lowers user's Special Attack.", 100, 0, 3)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true),
    new SelfStatusMove(Moves.ROOST, "Roost", Type.FLYING, -1, 5, -1, "User recovers half of its max HP and loses the FLYING type temporarily.", -1, 0, 4)
      .attr(HealAttr)
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_FLYING, true, 1),
    new SelfStatusMove(Moves.GRAVITY, "Gravity", Type.PSYCHIC, -1, 5, -1, "Prevents moves like FLY and BOUNCE and the Ability LEVITATE for 5 turns.", -1, 0, 4)
      .attr(AddArenaTagAttr, ArenaTagType.GRAVITY, 5)
      .target(MoveTarget.BOTH_SIDES),
    new StatusMove(Moves.MIRACLE_EYE, "Miracle Eye (N)", Type.PSYCHIC, -1, 40, -1, "Resets opponent's Evasiveness, removes DARK's PSYCHIC immunity.", -1, 0, 4),
    new AttackMove(Moves.WAKE_UP_SLAP, "Wake-Up Slap", Type.FIGHTING, MoveCategory.PHYSICAL, 70, 100, 10, -1, "Power doubles if opponent is asleep, but wakes it up.", -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user: Pokemon, target: Pokemon, move: Move) => target.status?.effect === StatusEffect.SLEEP ? 2 : 1)
      .attr(HealStatusEffectAttr, false, StatusEffect.SLEEP),
    new AttackMove(Moves.HAMMER_ARM, "Hammer Arm", Type.FIGHTING, MoveCategory.PHYSICAL, 100, 90, 10, -1, "Lowers user's Speed.", 100, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPD, -1, true),
    new AttackMove(Moves.GYRO_BALL, "Gyro Ball (N)", Type.STEEL, MoveCategory.PHYSICAL, -1, 100, 5, -1, "The slower the user, the stronger the attack.", -1, 0, 4),
    new SelfStatusMove(Moves.HEALING_WISH, "Healing Wish", Type.PSYCHIC, -1, 10, -1, "The user faints and the next Pokémon released is fully healed.", -1, 0, 4)
      .attr(SacrificialAttr), // TODO
    new AttackMove(Moves.BRINE, "Brine", Type.WATER, MoveCategory.SPECIAL, 65, 100, 10, -1, "Power doubles if opponent's HP is less than 50%.", -1, 0, 4)
      .attr(MovePowerMultiplierAttr, (user: Pokemon, target: Pokemon, move: Move) => target.getHpRatio() < 0.5 ? 2 : 1),
    new AttackMove(Moves.NATURAL_GIFT, "Natural Gift (N)", Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 15, -1, "Power and type depend on the user's held berry.", -1, 0, 4)
      .makesContact(false),
    new AttackMove(Moves.FEINT, "Feint", Type.NORMAL, MoveCategory.PHYSICAL, 30, 100, 10, -1, "Only hits if opponent uses PROTECT or DETECT in the same turn.", -1, 2, 4)
      .condition((user: Pokemon, target: Pokemon, move: Move) => !!target.getTag(BattlerTagType.PROTECTED))
      .makesContact(false)
      .ignoresProtect(),
    new AttackMove(Moves.PLUCK, "Pluck (N)", Type.FLYING, MoveCategory.PHYSICAL, 60, 100, 20, -1, "If the opponent is holding a berry, its effect is stolen by user.", -1, 0, 4)
      .target(MoveTarget.OTHER),
    new SelfStatusMove(Moves.TAILWIND, "Tailwind (N)", Type.FLYING, -1, 15, 113, "Doubles Speed for 4 turns.", -1, 0, 4)
      .target(MoveTarget.USER_SIDE),
    new SelfStatusMove(Moves.ACUPRESSURE, "Acupressure", Type.NORMAL, -1, 30, -1, "Sharply raises a random stat.", -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.RAND, 2, true)
      .target(MoveTarget.USER_OR_NEAR_ALLY),
    new AttackMove(Moves.METAL_BURST, "Metal Burst (N)", Type.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, -1, "Deals damage equal to 1.5x opponent's attack.", -1, 0, 4)
      .makesContact(false)
      .target(MoveTarget.ATTACKER),
    new AttackMove(Moves.U_TURN, "U-turn (N)", Type.BUG, MoveCategory.PHYSICAL, 70, 100, 20, 60, "User switches out immediately after attacking.", -1, 0, 4),
    new AttackMove(Moves.CLOSE_COMBAT, "Close Combat", Type.FIGHTING, MoveCategory.PHYSICAL, 120, 100, 5, 167, "Lowers user's Defense and Special Defense.", 100, 0, 4)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true),
    new AttackMove(Moves.PAYBACK, "Payback (N)", Type.DARK, MoveCategory.PHYSICAL, 50, 100, 10, -1, "Power doubles if the user was attacked first.", -1, 0, 4),
    new AttackMove(Moves.ASSURANCE, "Assurance (N)", Type.DARK, MoveCategory.PHYSICAL, 60, 100, 10, -1, "Power doubles if opponent already took damage in the same turn.", -1, 0, 4),
    new StatusMove(Moves.EMBARGO, "Embargo (N)", Type.DARK, 100, 15, -1, "Opponent cannot use items.", -1, 0, 4),
    new AttackMove(Moves.FLING, "Fling (N)", Type.DARK, MoveCategory.PHYSICAL, -1, 100, 10, 43, "Power depends on held item.", -1, 0, 4)
      .makesContact(false),
    new StatusMove(Moves.PSYCHO_SHIFT, "Psycho Shift (N)", Type.PSYCHIC, 100, 10, -1, "Transfers user's status condition to the opponent.", -1, 0, 4),
    new AttackMove(Moves.TRUMP_CARD, "Trump Card (N)", Type.NORMAL, MoveCategory.SPECIAL, -1, -1, 5, -1, "The lower the PP, the higher the power.", -1, 0, 4)
      .makesContact(),
    new StatusMove(Moves.HEAL_BLOCK, "Heal Block (N)", Type.PSYCHIC, 100, 15, -1, "Prevents the opponent from restoring HP for 5 turns.", -1, 0, 4)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.WRING_OUT, "Wring Out (N)", Type.NORMAL, MoveCategory.SPECIAL, -1, 100, 5, -1, "The higher the opponent's HP, the higher the damage.", -1, 0, 4)
      .makesContact(),
    new SelfStatusMove(Moves.POWER_TRICK, "Power Trick (N)", Type.PSYCHIC, -1, 10, -1, "User's own Attack and Defense switch.", -1, 0, 4),
    new StatusMove(Moves.GASTRO_ACID, "Gastro Acid (N)", Type.POISON, 100, 10, -1, "Cancels out the effect of the opponent's Ability.", -1, 0, 4),
    new StatusMove(Moves.LUCKY_CHANT, "Lucky Chant (N)", Type.NORMAL, -1, 30, -1, "Opponent cannot land critical hits for 5 turns.", -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.NO_CRIT, false, 5)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.ME_FIRST, "Me First (N)", Type.NORMAL, -1, 20, -1, "User copies the opponent's attack with 1.5× power.", -1, 0, 4)
      .ignoresVirtual()
      .target(MoveTarget.NEAR_ENEMY),
    new SelfStatusMove(Moves.COPYCAT, "Copycat", Type.NORMAL, -1, 20, -1, "Copies opponent's last move.", -1, 0, 4)
      .attr(CopyMoveAttr)
      .ignoresVirtual(),
    new StatusMove(Moves.POWER_SWAP, "Power Swap (N)", Type.PSYCHIC, -1, 10, -1, "User and opponent swap Attack and Special Attack.", -1, 0, 4),
    new StatusMove(Moves.GUARD_SWAP, "Guard Swap (N)", Type.PSYCHIC, -1, 10, -1, "User and opponent swap Defense and Special Defense.", -1, 0, 4),
    new AttackMove(Moves.PUNISHMENT, "Punishment (N)", Type.DARK, MoveCategory.PHYSICAL, -1, 100, 5, -1, "Power increases when opponent's stats have been raised.", -1, 0, 4),
    new AttackMove(Moves.LAST_RESORT, "Last Resort", Type.NORMAL, MoveCategory.PHYSICAL, 140, 100, 5, -1, "Can only be used after all other moves are used.", -1, 0, 4)
      .condition((user: Pokemon, target: Pokemon, move: Move) => !user.getMoveset().filter(m => m.moveId !== move.id && m.getPpRatio() > 0).length),
    new StatusMove(Moves.WORRY_SEED, "Worry Seed (N)", Type.GRASS, 100, 10, -1, "Changes the opponent's Ability to INSOMNIA.", -1, 0, 4),
    new AttackMove(Moves.SUCKER_PUNCH, "Sucker Punch (N)", Type.DARK, MoveCategory.PHYSICAL, 70, 100, 5, -1, "User attacks first, but only works if opponent is readying an attack.", -1, 0, 4),
    new StatusMove(Moves.TOXIC_SPIKES, "Toxic Spikes", Type.POISON, -1, 20, 91, "Poisons opponents when they switch into battle.", -1, 0, 4)
      .attr(AddArenaTrapTagAttr, ArenaTagType.TOXIC_SPIKES)
      .target(MoveTarget.ENEMY_SIDE),
    new StatusMove(Moves.HEART_SWAP, "Heart Swap (N)", Type.PSYCHIC, -1, 10, -1, "Stat changes are swapped with the opponent.", -1, 0, 4),
    new SelfStatusMove(Moves.AQUA_RING, "Aqua Ring", Type.WATER, -1, 20, -1, "Restores a little HP each turn.", -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.AQUA_RING, true, undefined, true),
    new SelfStatusMove(Moves.MAGNET_RISE, "Magnet Rise (N)", Type.ELECTRIC, -1, 10, -1, "User becomes immune to GROUND-type moves for 5 turns.", -1, 0, 4),
    new AttackMove(Moves.FLARE_BLITZ, "Flare Blitz", Type.FIRE, MoveCategory.PHYSICAL, 120, 100, 15, 165, "User receives recoil damage. May burn opponent.", 10, 0, 4)
      .attr(RecoilAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .condition(failOnGravityCondition),
    new AttackMove(Moves.FORCE_PALM, "Force Palm", Type.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, -1, "May paralyze opponent.", 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.AURA_SPHERE, "Aura Sphere", Type.FIGHTING, MoveCategory.SPECIAL, 80, -1, 20, 112, "Ignores Accuracy and Evasiveness.", -1, 0, 4)
      .target(MoveTarget.OTHER),
    new SelfStatusMove(Moves.ROCK_POLISH, "Rock Polish", Type.ROCK, -1, 20, -1, "Sharply raises user's Speed.", -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPD, 2, true),
    new AttackMove(Moves.POISON_JAB, "Poison Jab", Type.POISON, MoveCategory.PHYSICAL, 80, 100, 20, 83, "May poison the opponent.", 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.DARK_PULSE, "Dark Pulse", Type.DARK, MoveCategory.SPECIAL, 80, 100, 15, 94, "May cause flinching.", 20, 0, 4)
      .attr(FlinchAttr)
      .target(MoveTarget.OTHER),
    new AttackMove(Moves.NIGHT_SLASH, "Night Slash", Type.DARK, MoveCategory.PHYSICAL, 70, 100, 15, -1, "High critical hit ratio.", -1, 0, 4)
      .attr(HighCritAttr),
    new AttackMove(Moves.AQUA_TAIL, "Aqua Tail", Type.WATER, MoveCategory.PHYSICAL, 90, 90, 10, -1, "", -1, 0, 4),
    new AttackMove(Moves.SEED_BOMB, "Seed Bomb", Type.GRASS, MoveCategory.PHYSICAL, 80, 100, 15, 71, "", -1, 0, 4)
      .makesContact(false),
    new AttackMove(Moves.AIR_SLASH, "Air Slash", Type.FLYING, MoveCategory.SPECIAL, 75, 95, 15, 65, "May cause flinching.", 30, 0, 4)
      .attr(FlinchAttr)
      .target(MoveTarget.OTHER),
    new AttackMove(Moves.X_SCISSOR, "X-Scissor", Type.BUG, MoveCategory.PHYSICAL, 80, 100, 15, 105, "", -1, 0, 4),
    new AttackMove(Moves.BUG_BUZZ, "Bug Buzz", Type.BUG, MoveCategory.SPECIAL, 90, 100, 10, 162, "May lower opponent's Special Defense.", 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.DRAGON_PULSE, "Dragon Pulse", Type.DRAGON, MoveCategory.SPECIAL, 85, 100, 10, 115, "", -1, 0, 4)
      .target(MoveTarget.OTHER),
    new AttackMove(Moves.DRAGON_RUSH, "Dragon Rush", Type.DRAGON, MoveCategory.PHYSICAL, 100, 75, 10, -1, "May cause flinching.", 20, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(Moves.POWER_GEM, "Power Gem", Type.ROCK, MoveCategory.SPECIAL, 80, 100, 20, 101, "", -1, 0, 4),
    new AttackMove(Moves.DRAIN_PUNCH, "Drain Punch", Type.FIGHTING, MoveCategory.PHYSICAL, 75, 100, 10, 73, "User recovers half the HP inflicted on opponent.", -1, 0, 4)
      .attr(HitHealAttr),
    new AttackMove(Moves.VACUUM_WAVE, "Vacuum Wave", Type.FIGHTING, MoveCategory.SPECIAL, 40, 100, 30, -1, "User attacks first.", -1, 0, 4),
    new AttackMove(Moves.FOCUS_BLAST, "Focus Blast", Type.FIGHTING, MoveCategory.SPECIAL, 120, 70, 5, 158, "May lower opponent's Special Defense.", 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.ENERGY_BALL, "Energy Ball", Type.GRASS, MoveCategory.SPECIAL, 90, 100, 10, 119, "May lower opponent's Special Defense.", 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.BRAVE_BIRD, "Brave Bird", Type.FLYING, MoveCategory.PHYSICAL, 120, 100, 15, 164, "User receives recoil damage.", -1, 0, 4)
      .attr(RecoilAttr)
      .target(MoveTarget.OTHER),
    new AttackMove(Moves.EARTH_POWER, "Earth Power", Type.GROUND, MoveCategory.SPECIAL, 90, 100, 10, 133, "May lower opponent's Special Defense.", 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new StatusMove(Moves.SWITCHEROO, "Switcheroo (N)", Type.DARK, 100, 10, -1, "Swaps held items with the opponent.", -1, 0, 4),
    new AttackMove(Moves.GIGA_IMPACT, "Giga Impact", Type.NORMAL, MoveCategory.PHYSICAL, 150, 90, 5, 152, "User must recharge next turn.", -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.RECHARGING, true),
    new SelfStatusMove(Moves.NASTY_PLOT, "Nasty Plot", Type.DARK, -1, 20, 140, "Sharply raises user's Special Attack.", -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, 2, true),
    new AttackMove(Moves.BULLET_PUNCH, "Bullet Punch", Type.STEEL, MoveCategory.PHYSICAL, 40, 100, 30, -1, "User attacks first.", -1, 1, 4),
    new AttackMove(Moves.AVALANCHE, "Avalanche", Type.ICE, MoveCategory.PHYSICAL, 60, 100, 10, 46, "Power doubles if user took damage first.", -1, -4, 4)
      .attr(TurnDamagedDoublePowerAttr),
    new AttackMove(Moves.ICE_SHARD, "Ice Shard", Type.ICE, MoveCategory.PHYSICAL, 40, 100, 30, -1, "User attacks first.", -1, 1, 4)
      .makesContact(false),
    new AttackMove(Moves.SHADOW_CLAW, "Shadow Claw", Type.GHOST, MoveCategory.PHYSICAL, 70, 100, 15, 61, "High critical hit ratio.", -1, 0, 4)
      .attr(HighCritAttr),
    new AttackMove(Moves.THUNDER_FANG, "Thunder Fang", Type.ELECTRIC, MoveCategory.PHYSICAL, 65, 95, 15, 9, "May cause flinching and/or paralyze opponent.", 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.ICE_FANG, "Ice Fang", Type.ICE, MoveCategory.PHYSICAL, 65, 95, 15, 10, "May cause flinching and/or freeze opponent.", 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.FREEZE),
    new AttackMove(Moves.FIRE_FANG, "Fire Fang", Type.FIRE, MoveCategory.PHYSICAL, 65, 95, 15, 8, "May cause flinching and/or burn opponent.", 10, 0, 4)
      .attr(FlinchAttr)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.SHADOW_SNEAK, "Shadow Sneak", Type.GHOST, MoveCategory.PHYSICAL, 40, 100, 30, -1, "User attacks first.", -1, 1, 4),
    new AttackMove(Moves.MUD_BOMB, "Mud Bomb", Type.GROUND, MoveCategory.SPECIAL, 65, 85, 10, -1, "May lower opponent's Accuracy.", 30, 0, 4)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.PSYCHO_CUT, "Psycho Cut", Type.PSYCHIC, MoveCategory.PHYSICAL, 70, 100, 20, -1, "High critical hit ratio.", -1, 0, 4)
      .attr(HighCritAttr)
      .makesContact(false),
    new AttackMove(Moves.ZEN_HEADBUTT, "Zen Headbutt", Type.PSYCHIC, MoveCategory.PHYSICAL, 80, 90, 15, 59, "May cause flinching.", 20, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(Moves.MIRROR_SHOT, "Mirror Shot", Type.STEEL, MoveCategory.SPECIAL, 65, 85, 10, -1, "May lower opponent's Accuracy.", 30, 0, 4)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.FLASH_CANNON, "Flash Cannon", Type.STEEL, MoveCategory.SPECIAL, 80, 100, 10, 93, "May lower opponent's Special Defense.", 10, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.ROCK_CLIMB, "Rock Climb", Type.NORMAL, MoveCategory.PHYSICAL, 90, 85, 20, -1, "May confuse opponent.", 20, 0, 4)
      .attr(ConfuseAttr),
    new StatusMove(Moves.DEFOG, "Defog", Type.FLYING, -1, 15, -1, "Lowers opponent's Evasiveness and clears fog.", -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.EVA, -1)
      .attr(ClearWeatherAttr, WeatherType.FOG),
    new StatusMove(Moves.TRICK_ROOM, "Trick Room", Type.PSYCHIC, -1, 5, 161, "Slower Pokémon move first in the turn for 5 turns.", -1, 0, 4)
      .attr(AddArenaTagAttr, ArenaTagType.TRICK_ROOM, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.DRACO_METEOR, "Draco Meteor", Type.DRAGON, MoveCategory.SPECIAL, 130, 90, 5, 169, "Sharply lowers user's Special Attack.", 100, -7, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true),
    new AttackMove(Moves.DISCHARGE, "Discharge", Type.ELECTRIC, MoveCategory.SPECIAL, 80, 100, 15, -1, "May paralyze opponent.", 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.LAVA_PLUME, "Lava Plume", Type.FIRE, MoveCategory.SPECIAL, 80, 100, 15, -1, "May burn opponent.", 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.LEAF_STORM, "Leaf Storm", Type.GRASS, MoveCategory.SPECIAL, 130, 90, 5, 159, "Sharply lowers user's Special Attack.", 100, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, -2, true),
    new AttackMove(Moves.POWER_WHIP, "Power Whip", Type.GRASS, MoveCategory.PHYSICAL, 120, 85, 10, -1, "", -1, 0, 4),
    new AttackMove(Moves.ROCK_WRECKER, "Rock Wrecker", Type.ROCK, MoveCategory.PHYSICAL, 150, 90, 5, -1, "User must recharge next turn.", -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.RECHARGING, true)
      .makesContact(false),
    new AttackMove(Moves.CROSS_POISON, "Cross Poison", Type.POISON, MoveCategory.PHYSICAL, 70, 100, 20, -1, "High critical hit ratio. May poison opponent.", 10, 0, 4)
      .attr(HighCritAttr)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new AttackMove(Moves.GUNK_SHOT, "Gunk Shot", Type.POISON, MoveCategory.PHYSICAL, 120, 80, 5, 102, "May poison opponent.", 30, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.POISON)
      .makesContact(false),
    new AttackMove(Moves.IRON_HEAD, "Iron Head", Type.STEEL, MoveCategory.PHYSICAL, 80, 100, 15, 99, "May cause flinching.", 30, 0, 4)
      .attr(FlinchAttr),
    new AttackMove(Moves.MAGNET_BOMB, "Magnet Bomb", Type.STEEL, MoveCategory.PHYSICAL, 60, -1, 20, -1, "Ignores Accuracy and Evasiveness.", -1, 0, 4)
      .makesContact(false),
    new AttackMove(Moves.STONE_EDGE, "Stone Edge", Type.ROCK, MoveCategory.PHYSICAL, 100, 80, 5, 150, "High critical hit ratio.", -1, 0, 4)
      .attr(HighCritAttr)
      .makesContact(false),
    new StatusMove(Moves.CAPTIVATE, "Captivate", Type.NORMAL, 100, 20, -1, "Sharply lowers opponent's Special Attack if opposite gender.", -1, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, -2)
      .condition((user: Pokemon, target: Pokemon, move: Move) => target.isOppositeGender(user)),
    new StatusMove(Moves.STEALTH_ROCK, "Stealth Rock", Type.ROCK, -1, 20, 116, "Damages opponent switching into battle.", -1, 0, 4)
      .attr(AddArenaTrapTagAttr, ArenaTagType.STEALTH_ROCK)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.GRASS_KNOT, "Grass Knot", Type.GRASS, MoveCategory.SPECIAL, -1, 100, 20, 81, "The heavier the opponent, the stronger the attack.", -1, 0, 4)
      .attr(WeightPowerAttr)
      .makesContact(),
    new AttackMove(Moves.CHATTER, "Chatter", Type.FLYING, MoveCategory.SPECIAL, 65, 100, 20, -1, "Confuses opponent.", 100, 0, 4)
      .attr(ConfuseAttr)
      .target(MoveTarget.OTHER),
    new AttackMove(Moves.JUDGMENT, "Judgment (N)", Type.NORMAL, MoveCategory.SPECIAL, 100, 100, 10, -1, "Type depends on the Arceus Plate being held.", -1, 0, 4),
    new AttackMove(Moves.BUG_BITE, "Bug Bite (N)", Type.BUG, MoveCategory.PHYSICAL, 60, 100, 20, -1, "Receives the effect from the opponent's held berry.", -1, 0, 4),
    new AttackMove(Moves.CHARGE_BEAM, "Charge Beam", Type.ELECTRIC, MoveCategory.SPECIAL, 50, 90, 10, 23, "May raise user's Special Attack.", 70, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true),
    new AttackMove(Moves.WOOD_HAMMER, "Wood Hammer", Type.GRASS, MoveCategory.PHYSICAL, 120, 100, 15, -1, "User receives recoil damage.", -1, 0, 4)
      .attr(RecoilAttr),
    new AttackMove(Moves.AQUA_JET, "Aqua Jet", Type.WATER, MoveCategory.PHYSICAL, 40, 100, 20, -1, "User attacks first.", -1, 1, 4),
    new AttackMove(Moves.ATTACK_ORDER, "Attack Order", Type.BUG, MoveCategory.PHYSICAL, 90, 100, 15, -1, "High critical hit ratio.", -1, 0, 4)
      .attr(HighCritAttr)
      .makesContact(false),
    new SelfStatusMove(Moves.DEFEND_ORDER, "Defend Order", Type.BUG, -1, 10, -1, "Raises user's Defense and Special Defense.", -1, 0, 4)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], 1, true),
    new SelfStatusMove(Moves.HEAL_ORDER, "Heal Order", Type.BUG, -1, 10, -1, "User recovers half its max HP.", -1, 0, 4)
      .attr(HealAttr, 0.5),
    new AttackMove(Moves.HEAD_SMASH, "Head Smash", Type.ROCK, MoveCategory.PHYSICAL, 150, 80, 5, -1, "User receives recoil damage.", -1, 0, 4)
      .attr(RecoilAttr),
    new AttackMove(Moves.DOUBLE_HIT, "Double Hit", Type.NORMAL, MoveCategory.PHYSICAL, 35, 90, 10, -1, "Hits twice in one turn.", -1, 0, 4)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.ROAR_OF_TIME, "Roar of Time", Type.DRAGON, MoveCategory.SPECIAL, 150, 90, 5, -1, "User must recharge next turn.", -1, 0, 4)
      .attr(AddBattlerTagAttr, BattlerTagType.RECHARGING, true),
    new AttackMove(Moves.SPACIAL_REND, "Spacial Rend", Type.DRAGON, MoveCategory.SPECIAL, 100, 95, 5, -1, "High critical hit ratio.", -1, 0, 4)
      .attr(HighCritAttr),
    new SelfStatusMove(Moves.LUNAR_DANCE, "Lunar Dance (N)", Type.PSYCHIC, -1, 10, -1, "The user faints but the next Pokémon released is fully healed.", -1, 0, 4)
      .attr(SacrificialAttr), // TODO
    new AttackMove(Moves.CRUSH_GRIP, "Crush Grip", Type.NORMAL, MoveCategory.PHYSICAL, -1, 100, 5, -1, "More powerful when opponent has higher HP.", -1, 0, 4)
      .attr(OpponentHighHpPowerAttr),
    new AttackMove(Moves.MAGMA_STORM, "Magma Storm", Type.FIRE, MoveCategory.SPECIAL, 100, 75, 5, -1, "Traps opponent, damaging them for 4-5 turns.", 100, 0, 4)
      .attr(TrapAttr, BattlerTagType.MAGMA_STORM),
    new StatusMove(Moves.DARK_VOID, "Dark Void", Type.DARK, 50, 10, -1, "Puts all adjacent opponents to sleep.", -1, 0, 4)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SEED_FLARE, "Seed Flare", Type.GRASS, MoveCategory.SPECIAL, 120, 85, 5, -1, "May lower opponent's Special Defense.", 40, 0, 4)
      .attr(StatChangeAttr, BattleStat.SPDEF, -1),
    new AttackMove(Moves.OMINOUS_WIND, "Ominous Wind", Type.GHOST, MoveCategory.SPECIAL, 60, 100, 5, -1, "May raise all user's stats at once.", 10, 0, 4)
  .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true),
    new AttackMove(Moves.SHADOW_FORCE, "Shadow Force", Type.GHOST, MoveCategory.PHYSICAL, 120, 100, 5, -1, "Disappears on first turn, attacks on second. Can strike through PROTECT/DETECT.", -1, 0, 4)
      .attr(ChargeAttr, ChargeAnim.SHADOW_FORCE_CHARGING, 'vanished\ninstantly!', BattlerTagType.HIDDEN)
      .ignoresProtect()
      .ignoresVirtual(),
    new SelfStatusMove(Moves.HONE_CLAWS, "Hone Claws", Type.DARK, -1, 15, -1, "Raises user's Attack and Accuracy.", -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.ACC ], 1, true),
    new SelfStatusMove(Moves.WIDE_GUARD, "Wide Guard (N)", Type.ROCK, -1, 10, -1, "Protects the user's team from multi-target attacks.", -1, 3, 5)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.GUARD_SPLIT, "Guard Split (N)", Type.PSYCHIC, -1, 10, -1, "Averages Defense and Special Defense with the target.", -1, 0, 5),
    new StatusMove(Moves.POWER_SPLIT, "Power Split (N)", Type.PSYCHIC, -1, 10, -1, "Averages Attack and Special Attack with the target.", -1, 0, 5),
    new StatusMove(Moves.WONDER_ROOM, "Wonder Room (N)", Type.PSYCHIC, -1, 10, -1, "Swaps every Pokémon's Defense and Special Defense for 5 turns.", -1, -7, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.PSYSHOCK, "Psyshock (N)", Type.PSYCHIC, MoveCategory.SPECIAL, 80, 100, 10, 54, "Inflicts damage based on the target's Defense, not Special Defense.", -1, 0, 5),
    new AttackMove(Moves.VENOSHOCK, "Venoshock", Type.POISON, MoveCategory.SPECIAL, 65, 100, 10, 45, "Inflicts double damage if the target is poisoned.", -1, 0, 5)
      .attr(MovePowerMultiplierAttr, (user: Pokemon, target: Pokemon, move: Move) => target.status && (target.status.effect === StatusEffect.POISON || target.status.effect === StatusEffect.TOXIC) ? 2 : 1),
    new SelfStatusMove(Moves.AUTOTOMIZE, "Autotomize (P)", Type.STEEL, -1, 15, -1, "Reduces weight and sharply raises Speed.", -1, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, 2, true), // TODO
    new SelfStatusMove(Moves.RAGE_POWDER, "Rage Powder (N)", Type.BUG, -1, 20, -1, "Forces attacks to hit user, not team-mates.", -1, 3, 5),
    new StatusMove(Moves.TELEKINESIS, "Telekinesis (N)", Type.PSYCHIC, -1, 15, -1, "Ignores opponent's Evasiveness for three turns, add Ground immunity.", -1, 0, 5)
      .condition(failOnGravityCondition),
    new StatusMove(Moves.MAGIC_ROOM, "Magic Room (N)", Type.PSYCHIC, -1, 10, -1, "Suppresses the effects of held items for five turns.", -1, -7, 5)
      .ignoresProtect()
      .target(MoveTarget.BOTH_SIDES),
    new AttackMove(Moves.SMACK_DOWN, "Smack Down", Type.ROCK, MoveCategory.PHYSICAL, 50, 100, 15, -1, "Makes FLYING-type Pokémon vulnerable to Ground moves.", 100, 0, 5) // TODO, logic with fly
      .attr(AddBattlerTagAttr, BattlerTagType.IGNORE_FLYING, false, 5)
      .makesContact(false),
    new AttackMove(Moves.STORM_THROW, "Storm Throw", Type.FIGHTING, MoveCategory.PHYSICAL, 60, 100, 10, -1, "Always results in a critical hit.", 100, 0, 5)
      .attr(CritOnlyAttr),
    new AttackMove(Moves.FLAME_BURST, "Flame Burst", Type.FIRE, MoveCategory.SPECIAL, 70, 100, 15, -1, "May also injure nearby Pokémon.", -1, 0, 5), // TODO
    new AttackMove(Moves.SLUDGE_WAVE, "Sludge Wave", Type.POISON, MoveCategory.SPECIAL, 95, 100, 10, -1, "May poison opponent.", 10, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.POISON),
    new SelfStatusMove(Moves.QUIVER_DANCE, "Quiver Dance", Type.BUG, -1, 20, -1, "Raises user's Special Attack, Special Defense and Speed.", -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 1, true),
    new AttackMove(Moves.HEAVY_SLAM, "Heavy Slam (N)", Type.STEEL, MoveCategory.PHYSICAL, -1, 100, 10, 121, "The heavier the user, the stronger the attack.", -1, 0, 5),
    new AttackMove(Moves.SYNCHRONOISE, "Synchronoise (N)", Type.PSYCHIC, MoveCategory.SPECIAL, 120, 100, 10, -1, "Hits any Pokémon that shares a type with the user.", -1, 0, 5)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.ELECTRO_BALL, "Electro Ball (N)", Type.ELECTRIC, MoveCategory.SPECIAL, -1, 100, 10, 72, "The faster the user, the stronger the attack.", -1, 0, 5),
    new StatusMove(Moves.SOAK, "Soak (N)", Type.WATER, 100, 20, -1, "Changes the target's type to water.", -1, 0, 5),
    new AttackMove(Moves.FLAME_CHARGE, "Flame Charge", Type.FIRE, MoveCategory.PHYSICAL, 50, 100, 20, 38, "Raises user's Speed.", 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, 1, true),
    new SelfStatusMove(Moves.COIL, "Coil", Type.POISON, -1, 20, -1, "Raises user's Attack, Defense and Accuracy.", -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.DEF, BattleStat.ACC ], 1, true),
    new AttackMove(Moves.LOW_SWEEP, "Low Sweep", Type.FIGHTING, MoveCategory.PHYSICAL, 65, 100, 20, 39, "Lowers opponent's Speed.", 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, -1),
    new AttackMove(Moves.ACID_SPRAY, "Acid Spray", Type.POISON, MoveCategory.SPECIAL, 40, 100, 20, 13, "Sharply lowers opponent's Special Defense.", 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPDEF, -2),
    new AttackMove(Moves.FOUL_PLAY, "Foul Play (N)", Type.DARK, MoveCategory.PHYSICAL, 95, 100, 15, 62, "Uses the opponent's Attack stat.", -1, 0, 5),
    new StatusMove(Moves.SIMPLE_BEAM, "Simple Beam (N)", Type.NORMAL, 100, 15, -1, "Changes target's ability to Simple.", -1, 0, 5),
    new StatusMove(Moves.ENTRAINMENT, "Entrainment (N)", Type.NORMAL, 100, 15, -1, "Makes target's ability same as user's.", -1, 0, 5),
    new StatusMove(Moves.AFTER_YOU, "After You (N)", Type.NORMAL, -1, 15, -1, "Gives target priority in the next turn.", -1, 0, 5)
      .ignoresProtect(),
    new AttackMove(Moves.ROUND, "Round", Type.NORMAL, MoveCategory.SPECIAL, 60, 100, 15, -1, "Power increases if teammates use it in the same turn.", -1, 0, 5), // TODO
    new AttackMove(Moves.ECHOED_VOICE, "Echoed Voice", Type.NORMAL, MoveCategory.SPECIAL, 40, 100, 15, -1, "Power increases each turn.", -1, 0, 5)
      .attr(ConsecutiveUseMultiBasePowerAttr, 5, false),
    new AttackMove(Moves.CHIP_AWAY, "Chip Away (N)", Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 20, -1, "Ignores opponent's stat changes.", -1, 0, 5),
    new AttackMove(Moves.CLEAR_SMOG, "Clear Smog (N)", Type.POISON, MoveCategory.SPECIAL, 50, -1, 15, -1, "Removes all of the target's stat changes.", -1, 0, 5),
    new AttackMove(Moves.STORED_POWER, "Stored Power (N)", Type.PSYCHIC, MoveCategory.SPECIAL, 20, 100, 10, 41, "Power increases when user's stats have been raised.", -1, 0, 5),
    new SelfStatusMove(Moves.QUICK_GUARD, "Quick Guard (N)", Type.FIGHTING, -1, 15, -1, "Protects the user's team from high-priority moves.", -1, 3, 5)
      .target(MoveTarget.USER_SIDE),
    new StatusMove(Moves.ALLY_SWITCH, "Ally Switch (N)", Type.PSYCHIC, -1, 15, -1, "User switches with opposite teammate.", -1, 0, 5)
      .ignoresProtect()
      .target(MoveTarget.USER), // TODO
    new AttackMove(Moves.SCALD, "Scald", Type.WATER, MoveCategory.SPECIAL, 80, 100, 15, -1, "May burn opponent.", 30, 1, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new SelfStatusMove(Moves.SHELL_SMASH, "Shell Smash", Type.NORMAL, -1, 15, -1, "Sharply raises user's Attack, Special Attack and Speed but lowers Defense and Special Defense.", -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], 2, true)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF ], -1, true),
    new StatusMove(Moves.HEAL_PULSE, "Heal Pulse", Type.PSYCHIC, -1, 10, -1, "Restores half the target's max HP.", -1, 0, 5)
      .attr(HealAttr, 0.5, false, false)
      .target(MoveTarget.OTHER),
    new AttackMove(Moves.HEX, "Hex", Type.GHOST, MoveCategory.SPECIAL, 65, 100, 10, 29, "Inflicts more damage if the target has a status condition.", -1, 0, 5)
      .attr(MovePowerMultiplierAttr, (user: Pokemon, target: Pokemon, move: Move) => target.status ? 2 : 1),
    new AttackMove(Moves.SKY_DROP, "Sky Drop", Type.FLYING, MoveCategory.PHYSICAL, 60, 100, 10, -1, "Takes opponent into the air on first turn, drops them on second turn.", -1, 0, 5)
      .attr(ChargeAttr, ChargeAnim.SKY_DROP_CHARGING, 'took {TARGET}\ninto the sky!', BattlerTagType.FLYING) // TODO: Add 2nd turn message
      .condition(failOnGravityCondition)
      .ignoresVirtual(), 
    new SelfStatusMove(Moves.SHIFT_GEAR, "Shift Gear", Type.STEEL, -1, 10, -1, "Raises user's Attack and sharply raises Speed.", -1, 0, 5)
      .attr(StatChangeAttr, BattleStat.ATK, 1, true)
      .attr(StatChangeAttr, BattleStat.SPD, 2, true),
    new AttackMove(Moves.CIRCLE_THROW, "Circle Throw (N)", Type.FIGHTING, MoveCategory.PHYSICAL, 60, 90, 10, -1, "In battles, the opponent switches. In the wild, the Pokémon runs.", -1, -6, 5),
    new AttackMove(Moves.INCINERATE, "Incinerate (N)", Type.FIRE, MoveCategory.SPECIAL, 60, 100, 15, -1, "Destroys the target's held berry.", -1, 0, 5)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new StatusMove(Moves.QUASH, "Quash (N)", Type.DARK, 100, 15, -1, "Makes the target act last this turn.", -1, 0, 5),
    new AttackMove(Moves.ACROBATICS, "Acrobatics (N)", Type.FLYING, MoveCategory.PHYSICAL, 55, 100, 15, 14, "Stronger when the user does not have a held item.", -1, 0, 5)
      .target(MoveTarget.OTHER),
    new StatusMove(Moves.REFLECT_TYPE, "Reflect Type", Type.NORMAL, -1, 15, -1, "User becomes the target's type.", -1, 0, 5)
      .attr(CopyTypeAttr),
    new AttackMove(Moves.RETALIATE, "Retaliate (N)", Type.NORMAL, MoveCategory.PHYSICAL, 70, 100, 5, -1, "Inflicts double damage if a teammate fainted on the last turn.", -1, 0, 5),
    new AttackMove(Moves.FINAL_GAMBIT, "Final Gambit", Type.FIGHTING, MoveCategory.SPECIAL, -1, 100, 5, -1, "Inflicts damage equal to the user's remaining HP. User faints.", -1, 0, 5)
      .attr(UserHpDamageAttr)
      .attr(SacrificialAttr),
    new StatusMove(Moves.BESTOW, "Bestow (N)", Type.NORMAL, -1, 15, -1, "Gives the user's held item to the target.", -1, 0, 5)
      .ignoresProtect(),
    new AttackMove(Moves.INFERNO, "Inferno", Type.FIRE, MoveCategory.SPECIAL, 100, 50, 5, -1, "Burns opponent.", 100, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.WATER_PLEDGE, "Water Pledge (N)", Type.WATER, MoveCategory.SPECIAL, 80, 100, 10, 145, "Added effects appear if preceded by Fire Pledge or succeeded by Grass Pledge.", -1, 0, 5),
    new AttackMove(Moves.FIRE_PLEDGE, "Fire Pledge (N)", Type.FIRE, MoveCategory.SPECIAL, 80, 100, 10, 144, "Added effects appear if combined with Grass Pledge or Water Pledge.", -1, 0, 5),
    new AttackMove(Moves.GRASS_PLEDGE, "Grass Pledge (N)", Type.GRASS, MoveCategory.SPECIAL, 80, 100, 10, 146, "Added effects appear if preceded by Water Pledge or succeeded by Fire Pledge.", -1, 0, 5),
    new AttackMove(Moves.VOLT_SWITCH, "Volt Switch (N)", Type.ELECTRIC, MoveCategory.SPECIAL, 70, 100, 20, 48, "User must switch out after attacking.", -1, 0, 5),
    new AttackMove(Moves.STRUGGLE_BUG, "Struggle Bug", Type.BUG, MoveCategory.SPECIAL, 50, 100, 20, 15, "Lowers opponent's Special Attack.", 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPATK, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BULLDOZE, "Bulldoze", Type.GROUND, MoveCategory.PHYSICAL, 60, 100, 20, 28, "Lowers opponent's Speed.", 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .makesContact(false)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.FROST_BREATH, "Frost Breath", Type.ICE, MoveCategory.SPECIAL, 60, 90, 10, -1, "Always results in a critical hit.", 100, 0, 5)
      .attr(CritOnlyAttr),
    new AttackMove(Moves.DRAGON_TAIL, "Dragon Tail (N)", Type.DRAGON, MoveCategory.PHYSICAL, 60, 90, 10, 44, "In battles, the opponent switches. In the wild, the Pokémon runs.", -1, -6, 5),
    new SelfStatusMove(Moves.WORK_UP, "Work Up", Type.NORMAL, -1, 30, -1, "Raises user's Attack and Special Attack.", -1, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.ATK, BattleStat.SPATK ], 1, true),
    new AttackMove(Moves.ELECTROWEB, "Electroweb", Type.ELECTRIC, MoveCategory.SPECIAL, 55, 95, 15, -1, "Lowers opponent's Speed.", 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.WILD_CHARGE, "Wild Charge", Type.ELECTRIC, MoveCategory.PHYSICAL, 90, 100, 15, 147, "User receives recoil damage.", -1, 0, 5)
      .attr(RecoilAttr),
    new AttackMove(Moves.DRILL_RUN, "Drill Run", Type.GROUND, MoveCategory.PHYSICAL, 80, 95, 10, 106, "High critical hit ratio.", -1, 0, 5)
      .attr(HighCritAttr),
    new AttackMove(Moves.DUAL_CHOP, "Dual Chop", Type.DRAGON, MoveCategory.PHYSICAL, 40, 90, 15, -1, "Hits twice in one turn.", -1, 0, 5)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.HEART_STAMP, "Heart Stamp", Type.PSYCHIC, MoveCategory.PHYSICAL, 60, 100, 25, -1, "May cause flinching.", 30, 0, 5)
      .attr(FlinchAttr),
    new AttackMove(Moves.HORN_LEECH, "Horn Leech", Type.GRASS, MoveCategory.PHYSICAL, 75, 100, 10, -1, "User recovers half the HP inflicted on opponent.", -1, 0, 5)
      .attr(HitHealAttr),
    new AttackMove(Moves.SACRED_SWORD, "Sacred Sword (N)", Type.FIGHTING, MoveCategory.PHYSICAL, 90, 100, 15, -1, "Ignores opponent's stat changes.", -1, 0, 5),
    new AttackMove(Moves.RAZOR_SHELL, "Razor Shell", Type.WATER, MoveCategory.PHYSICAL, 75, 95, 10, -1, "May lower opponent's Defense.", 50, 0, 5)
      .attr(StatChangeAttr, BattleStat.DEF, -1),
    new AttackMove(Moves.HEAT_CRASH, "Heat Crash (N)", Type.FIRE, MoveCategory.PHYSICAL, -1, 100, 10, -1, "The heavier the user, the stronger the attack.", -1, 0, 5),
    new AttackMove(Moves.LEAF_TORNADO, "Leaf Tornado", Type.GRASS, MoveCategory.SPECIAL, 65, 90, 10, -1, "May lower opponent's Accuracy.", 50, 0, 5)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.STEAMROLLER, "Steamroller", Type.BUG, MoveCategory.PHYSICAL, 65, 100, 20, -1, "May cause flinching.", 30, 0, 5)
      .attr(FlinchAttr),
    new SelfStatusMove(Moves.COTTON_GUARD, "Cotton Guard", Type.GRASS, -1, 10, -1, "Drastically raises user's Defense.", -1, 0, 5)
      .attr(StatChangeAttr, BattleStat.DEF, 3, true),
    new AttackMove(Moves.NIGHT_DAZE, "Night Daze", Type.DARK, MoveCategory.SPECIAL, 85, 95, 10, -1, "May lower opponent's Accuracy.", 40, 0, 5)
      .attr(StatChangeAttr, BattleStat.ACC, -1),
    new AttackMove(Moves.PSYSTRIKE, "Psystrike (N)", Type.PSYCHIC, MoveCategory.SPECIAL, 100, 100, 10, -1, "Inflicts damage based on the target's Defense, not Special Defense.", -1, 0, 5),
    new AttackMove(Moves.TAIL_SLAP, "Tail Slap", Type.NORMAL, MoveCategory.PHYSICAL, 25, 85, 10, -1, "Hits 2-5 times in one turn.", -1, 0, 5)
      .attr(MultiHitAttr),
    new AttackMove(Moves.HURRICANE, "Hurricane", Type.FLYING, MoveCategory.SPECIAL, 110, 70, 10, 160, "May confuse opponent.", 30, 0, 5)
      .attr(ThunderAccuracyAttr)
      .attr(ConfuseAttr)
      .target(MoveTarget.OTHER),
    new AttackMove(Moves.HEAD_CHARGE, "Head Charge", Type.NORMAL, MoveCategory.PHYSICAL, 120, 100, 15, -1, "User receives recoil damage.", -1, 0, 5)
      .attr(RecoilAttr),
    new AttackMove(Moves.GEAR_GRIND, "Gear Grind", Type.STEEL, MoveCategory.PHYSICAL, 50, 85, 15, -1, "Hits twice in one turn.", -1, 0, 5)
      .attr(MultiHitAttr, MultiHitType._2),
    new AttackMove(Moves.SEARING_SHOT, "Searing Shot", Type.FIRE, MoveCategory.SPECIAL, 100, 100, 5, -1, "May burn opponent.", 30, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .target(MoveTarget.ALL_NEAR_OTHERS),
    new AttackMove(Moves.TECHNO_BLAST, "Techno Blast (N)", Type.NORMAL, MoveCategory.SPECIAL, 120, 100, 5, -1, "Type depends on the Drive being held.", -1, 0, 5),
    new AttackMove(Moves.RELIC_SONG, "Relic Song", Type.NORMAL, MoveCategory.SPECIAL, 75, 100, 10, -1, "May put the target to sleep.", 10, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.SLEEP)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.SECRET_SWORD, "Secret Sword (N)", Type.FIGHTING, MoveCategory.SPECIAL, 85, 100, 10, -1, "Inflicts damage based on the target's Defense, not Special Defense.", -1, 0, 5),
    new AttackMove(Moves.GLACIATE, "Glaciate", Type.ICE, MoveCategory.SPECIAL, 65, 95, 10, -1, "Lowers opponent's Speed.", 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPD, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.BOLT_STRIKE, "Bolt Strike", Type.ELECTRIC, MoveCategory.PHYSICAL, 130, 85, 5, -1, "May paralyze opponent.", 20, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS),
    new AttackMove(Moves.BLUE_FLARE, "Blue Flare", Type.FIRE, MoveCategory.SPECIAL, 130, 85, 5, -1, "May burn opponent.", 20, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.BURN),
    new AttackMove(Moves.FIERY_DANCE, "Fiery Dance", Type.FIRE, MoveCategory.SPECIAL, 80, 100, 10, -1, "May raise user's Special Attack.", 50, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPATK, 1, true),
    new AttackMove(Moves.FREEZE_SHOCK, "Freeze Shock", Type.ICE, MoveCategory.PHYSICAL, 140, 90, 5, -1, "Charges on first turn, attacks on second. May paralyze opponent.", 30, 0, 5)
      .attr(StatusEffectAttr, StatusEffect.PARALYSIS)
      .makesContact(false),
    new AttackMove(Moves.ICE_BURN, "Ice Burn", Type.ICE, MoveCategory.SPECIAL, 140, 90, 5, -1, "Charges on first turn, attacks on second. May burn opponent.", 30, 0, 5)
      .attr(ChargeAttr, ChargeAnim.ICE_BURN_CHARGING, 'became cloaked\nin freezing air!')
      .attr(StatusEffectAttr, StatusEffect.BURN)
      .ignoresVirtual(),
    new AttackMove(Moves.SNARL, "Snarl", Type.DARK, MoveCategory.SPECIAL, 55, 95, 15, 30, "Lowers opponent's Special Attack.", 100, 0, 5)
      .attr(StatChangeAttr, BattleStat.SPATK, -1)
      .target(MoveTarget.ALL_NEAR_ENEMIES),
    new AttackMove(Moves.ICICLE_CRASH, "Icicle Crash", Type.ICE, MoveCategory.PHYSICAL, 85, 90, 10, -1, "May cause flinching.", 30, 0, 5)
      .attr(FlinchAttr)
      .makesContact(false),
    new AttackMove(Moves.V_CREATE, "V-create", Type.FIRE, MoveCategory.PHYSICAL, 180, 95, 5, -1, "Lowers user's Defense, Special Defense and Speed.", 100, 0, 5)
      .attr(StatChangeAttr, [ BattleStat.DEF, BattleStat.SPDEF, BattleStat.SPD ], -1, true),
    new AttackMove(Moves.FUSION_FLARE, "Fusion Flare (N)", Type.FIRE, MoveCategory.SPECIAL, 100, 100, 5, -1, "Power increases if Fusion Bolt is used in the same turn.", -1, 0, 5),
    new AttackMove(Moves.FUSION_BOLT, "Fusion Bolt (N)", Type.ELECTRIC, MoveCategory.PHYSICAL, 100, 100, 5, -1, "Power increases if Fusion Flare is used in the same turn.", -1, 0, 5)
      .makesContact(false),
    new AttackMove(Moves.MOONBLAST, "Moonblast", Type.FAIRY, MoveCategory.SPECIAL, 95, 100, 15, -1, "May lower opponent's Special Attack.", 30, 0, 6)
      .attr(StatChangeAttr, BattleStat.SPATK, -1),
    new AttackMove(Moves.PHANTOM_FORCE, "Phantom Force", Type.GHOST, MoveCategory.PHYSICAL, 90, 100, 10, -1, "Disappears on first turn, attacks on second. Can strike through PROTECT/DETECT.", -1, 0, 6)
      .attr(ChargeAttr, ChargeAnim.PHANTOM_FORCE_CHARGING, 'vanished\ninstantly!', BattlerTagType.HIDDEN)
      .ignoresProtect()
      .ignoresVirtual(),
    new SelfStatusMove(Moves.GEOMANCY, "Geomancy", Type.FAIRY, -1, 10, -1, "Charges on the first turn, sharply raises user's Special Attack, Special Defense and Speed on the second.", -1, 0, 6)
      .attr(ChargeAttr, ChargeAnim.GEOMANCY_CHARGING, "is charging\nits power!")
      .attr(StatChangeAttr, [ BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD ], 2, true)
      .ignoresVirtual(),
    new AttackMove(Moves.OBLIVION_WING, "Oblivion Wing", Type.FLYING, MoveCategory.SPECIAL, 80, 100, 10, -1, "User recovers 3/4 the HP inflicted on the opponent.", -1, 0, 6)
      .attr(HitHealAttr, 0.75)
      .target(MoveTarget.OTHER),
    new AttackMove(Moves.DYNAMAX_CANNON, "Dynamax Cannon", Type.DRAGON, MoveCategory.SPECIAL, 100, 100, 5, -1, "Power is doubled if the target is over level 200.", -1, 0, 8)
      .attr(MovePowerMultiplierAttr, (user: Pokemon, target: Pokemon, move: Move) => target.level > 200 ? 2 : 1)
      .ignoresVirtual()
  );
}