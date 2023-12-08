import Pokemon, { HitResult, PokemonMove } from "../pokemon";
import { Type } from "./type";
import * as Utils from "../utils";
import { BattleStat, getBattleStatName } from "./battle-stat";
import { DamagePhase, ObtainStatusEffectPhase, PokemonHealPhase, ShowAbilityPhase, StatChangePhase } from "../battle-phases";
import { getPokemonMessage } from "../messages";
import { Weather, WeatherType } from "./weather";
import { BattlerTag, BattlerTagType } from "./battler-tag";
import { StatusEffect, getStatusEffectDescriptor } from "./status-effect";
import { MoveFlags, Moves, RecoilAttr } from "./move";
import { ArenaTagType } from "./arena-tag";
import { Stat } from "./pokemon-stat";

export class Ability {
  public id: Abilities;
  public name: string;
  public description: string;
  public generation: integer;
  public attrs: AbAttr[];
  public conditions: AbAttrCondition[];

  constructor(id: Abilities, name: string, description: string, generation: integer) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.generation = generation;
    this.attrs = [];
    this.conditions = [];
  }

  getAttrs(attrType: { new(...args: any[]): AbAttr }): AbAttr[] {
    return this.attrs.filter(a => a instanceof attrType);
  }

  attr<T extends new (...args: any[]) => AbAttr>(AttrType: T, ...args: ConstructorParameters<T>): Ability {
    const attr = new AttrType(...args);
    this.attrs.push(attr);

    return this;
  }

  hasAttr(attrType: { new(...args: any[]): AbAttr }): boolean {
    return !!this.getAttrs(attrType).length;
  }

  condition(condition: AbAttrCondition): Ability {
    this.conditions.push(condition);

    return this;
  }
}

type AbAttrCondition = (pokemon: Pokemon) => boolean;

export abstract class AbAttr {
  public showAbility: boolean;

  constructor(showAbility?: boolean) {
    this.showAbility = showAbility === undefined || showAbility;
  }
  
  apply(pokemon: Pokemon, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    return false;
  }

  getTriggerMessage(pokemon: Pokemon, ...args: any[]): string {
    return null;
  }

  getCondition(): AbAttrCondition {
    return null;
  }
}

export class BlockRecoilDamageAttr extends AbAttr {
  apply(pokemon: Pokemon, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    cancelled.value = true;

    return true;
  }

  getTriggerMessage(pokemon: Pokemon, ...args: any[]) {
    return getPokemonMessage(pokemon, `'s ${pokemon.getAbility().name}\nprotected it from recoil!`);
  }
}

export class DoubleBattleChanceAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  apply(pokemon: Pokemon, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    const doubleChance = (args[0] as Utils.IntegerHolder);
    doubleChance.value = Math.max(doubleChance.value / 2, 1);
    return true;
  }
}

export class PreDefendAbAttr extends AbAttr {
  applyPreDefend(pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    return false;
  }
}

export class BlockItemTheftAbAttr extends AbAttr {
  apply(pokemon: Pokemon, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    cancelled.value = true;
    
    return true;
  }

  getTriggerMessage(pokemon: Pokemon, ...args: any[]) {
    return getPokemonMessage(pokemon, `'s ${pokemon.getAbility().name}\nprevents item theft!`);
  }
}

export class StabBoostAbAttr extends AbAttr {
  apply(pokemon: Pokemon, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if ((args[0] as Utils.NumberHolder).value > 1)
      (args[0] as Utils.NumberHolder).value += 0.5;
    
    return true;
  }
}

export class ReceivedTypeDamageMultiplierAbAttr extends PreDefendAbAttr {
  private moveType: Type;
  private powerMultiplier: number;

  constructor(moveType: Type, powerMultiplier: number) {
    super();

    this.moveType = moveType;
    this.powerMultiplier = powerMultiplier;
  }

  applyPreDefend(pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (move.getMove().type === this.moveType) {
      (args[0] as Utils.NumberHolder).value *= this.powerMultiplier;
      return true;
    }

    return false;
  }
}

export class TypeImmunityAbAttr extends PreDefendAbAttr {
  private immuneType: Type;
  private condition: AbAttrCondition;

  constructor(immuneType: Type, condition?: AbAttrCondition) {
    super();

    this.immuneType = immuneType;
    this.condition = condition;
  }

  applyPreDefend(pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (move.getMove().type === this.immuneType) {
      (args[0] as Utils.NumberHolder).value = 0;
      return true;
    }

    return false;
  }

  getCondition(): AbAttrCondition {
    return this.condition;
  }
}

export class TypeImmunityHealAbAttr extends TypeImmunityAbAttr {
  constructor(immuneType: Type) {
    super(immuneType);
  }

  applyPreDefend(pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    const ret = super.applyPreDefend(pokemon, attacker, move, cancelled, args);

    if (ret) {
      if (pokemon.getHpRatio() < 1)
        pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.getBattlerIndex(),
          Math.max(Math.floor(pokemon.getMaxHp() / 4), 1), getPokemonMessage(pokemon, `'s ${pokemon.getAbility().name}\nrestored its HP a little!`), true));
      return true;
    }
    
    return false;
  }
}

class TypeImmunityStatChangeAbAttr extends TypeImmunityAbAttr {
  private stat: BattleStat;
  private levels: integer;

  constructor(immuneType: Type, stat: BattleStat, levels: integer, condition?: AbAttrCondition) {
    super(immuneType, condition);

    this.stat = stat;
    this.levels = levels;
  }

  applyPreDefend(pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    const ret = super.applyPreDefend(pokemon, attacker, move, cancelled, args);

    if (ret) {
      cancelled.value = true;
      pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ this.stat ], this.levels));
    }
    
    return ret;
  }
}

class TypeImmunityAddBattlerTagAbAttr extends TypeImmunityAbAttr {
  private tagType: BattlerTagType;
  private turnCount: integer;

  constructor(immuneType: Type, tagType: BattlerTagType, turnCount: integer, condition?: AbAttrCondition) {
    super(immuneType, condition);

    this.tagType = tagType;
    this.turnCount = turnCount;
  }

  applyPreDefend(pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    const ret = super.applyPreDefend(pokemon, attacker, move, cancelled, args);

    if (ret) {
      cancelled.value = true;
      pokemon.addTag(this.tagType, this.turnCount, undefined, pokemon.id);
    }
    
    return ret;
  }
}

export class NonSuperEffectiveImmunityAbAttr extends TypeImmunityAbAttr {
  constructor(condition?: AbAttrCondition) {
    super(null, condition);
  }

  applyPreDefend(pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (pokemon.getAttackMoveEffectiveness(move.getMove().type) < 2) {
      cancelled.value = true;
      (args[0] as Utils.NumberHolder).value = 0;
      return true;
    }

    return false;
  }

  getTriggerMessage(pokemon: Pokemon, ...args: any[]): string {
    return getPokemonMessage(pokemon, ` avoided damage\nwith ${pokemon.getAbility().name}!`);
  }
}

export class PostDefendAbAttr extends AbAttr {
  applyPostDefend(pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    return false;
  }
}

export class PostDefendTypeChangeAbAttr extends PostDefendAbAttr {
  applyPostDefend(pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (hitResult < HitResult.NO_EFFECT) {
      const type = move.getMove().type;
      const pokemonTypes = pokemon.getTypes();
      if (pokemonTypes.length !== 1 || pokemonTypes[0] !== type) {
        pokemon.summonData.types = [ type ];
        return true;
      }
    }

    return false;
  }

  getTriggerMessage(pokemon: Pokemon, ...args: any[]): string {
    return getPokemonMessage(pokemon, `'s ${pokemon.getAbility().name}\nmade it the ${Utils.toReadableString(Type[pokemon.getTypes()[0]])} type!`);
  }
}

export class PostDefendContactApplyStatusEffectAbAttr extends PostDefendAbAttr {
  private chance: integer;
  private effects: StatusEffect[];

  constructor(chance: integer, ...effects: StatusEffect[]) {
    super();

    this.chance = chance;
    this.effects = effects;
  }

  applyPostDefend(pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (move.getMove().hasFlag(MoveFlags.MAKES_CONTACT) && Utils.randInt(100) < this.chance && !pokemon.status) {
      const effect = this.effects.length === 1 ? this.effects[0] : this.effects[Utils.randInt(this.effects.length)];
      pokemon.scene.unshiftPhase(new ObtainStatusEffectPhase(pokemon.scene, attacker.getBattlerIndex(), effect));
    }

    return false;
  }
}

export class PostDefendContactApplyTagChanceAbAttr extends PostDefendAbAttr {
  private chance: integer;
  private tagType: BattlerTagType;
  private turnCount: integer;

  constructor(chance: integer, tagType: BattlerTagType, turnCount?: integer) {
    super();

    this.tagType = tagType;
    this.chance = chance;
    this.turnCount = turnCount;
  }

  applyPostDefend(pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (move.getMove().hasFlag(MoveFlags.MAKES_CONTACT) && Utils.randInt(100) < this.chance)
      return attacker.addTag(this.tagType, this.turnCount, move.moveId, pokemon.id);

    return false;
  }
}

export class PostDefendCritStatChangeAbAttr extends PostDefendAbAttr {
  private stat: BattleStat;
  private levels: integer;

  constructor(stat: BattleStat, levels: integer) {
    super(true);

    this.stat = stat;
    this.levels = levels;
  }

  applyPostDefend(pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ this.stat ], this.levels));
    
    return true;
  }

  getCondition(): AbAttrCondition {
    return (pokemon: Pokemon) => pokemon.turnData.attacksReceived.length && pokemon.turnData.attacksReceived[pokemon.turnData.attacksReceived.length - 1].critical;
  }
}

export class PreAttackAbAttr extends AbAttr {
  applyPreAttack(pokemon: Pokemon, defender: Pokemon, move: PokemonMove, args: any[]): boolean {
    return false;
  }
}

export class VariableMovePowerAbAttr extends PreAttackAbAttr {
  applyPreAttack(pokemon: Pokemon, defender: Pokemon, move: PokemonMove, args: any[]): boolean {
    //const power = args[0] as Utils.NumberHolder;
    return false; 
  }
}

export class LowHpMoveTypePowerBoostAbAttr extends VariableMovePowerAbAttr {
  private boostedType: Type;

  constructor(boostedType: Type) {
    super();

    this.boostedType = boostedType;
  }

  applyPreAttack(pokemon: Pokemon, defender: Pokemon, move: PokemonMove, args: any[]): boolean {
    if (move.getMove().type === this.boostedType) {
      (args[0] as Utils.NumberHolder).value *= 1.5;

      return true;
    }

    return false;
  }

  getCondition(): AbAttrCondition {
    return (pokemon) => pokemon.getHpRatio() <= 0.33;
  }
}

export class RecoilMovePowerBoostAbAttr extends VariableMovePowerAbAttr {
  applyPreAttack(pokemon: Pokemon, defender: Pokemon, move: PokemonMove, args: any[]): boolean {
    if (move.getMove().getAttrs(RecoilAttr).length && move.moveId !== Moves.STRUGGLE) {
      (args[0] as Utils.NumberHolder).value *= 1.2;

      return true;
    }

    return false;
  }
}

export class BattleStatMultiplierAbAttr extends AbAttr {
  private battleStat: BattleStat;
  private multiplier: number;

  constructor(battleStat: BattleStat, multiplier: number) {
    super();

    this.battleStat = battleStat;
    this.multiplier = multiplier;
  }

  applyBattleStat(pokemon: Pokemon, battleStat: BattleStat, statValue: Utils.NumberHolder, args: any[]) {
    if (battleStat === this.battleStat) {
      statValue.value *= this.multiplier;
      return true;
    }

    return false;
  }
}

export class IgnoreOpponentStatChangesAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  apply(pokemon: Pokemon, cancelled: Utils.BooleanHolder, args: any[]) {
    (args[0] as Utils.IntegerHolder).value = 0;

    return true;
  }
}

export class PostSummonAbAttr extends AbAttr {
  applyPostSummon(pokemon: Pokemon, args: any[]) {
    return false;
  }
}

export class PostSummonMessageAbAttr extends PostSummonAbAttr {
  private messageFunc: (pokemon: Pokemon) => string;

  constructor(messageFunc: (pokemon: Pokemon) => string) {
    super(true);

    this.messageFunc = messageFunc;
  }

  applyPostSummon(pokemon: Pokemon, args: any[]): boolean {
    pokemon.scene.queueMessage(this.messageFunc(pokemon));

    return true;
  }
}

export class PostSummonAddBattlerTagAbAttr extends PostSummonAbAttr {
  private tagType: BattlerTagType;
  private turnCount: integer;

  constructor(tagType: BattlerTagType, turnCount: integer) {
    super(false);

    this.tagType = tagType;
    this.turnCount = turnCount;
  }

  applyPostSummon(pokemon: Pokemon, args: any[]): boolean {
    return pokemon.addTag(this.tagType, this.turnCount);
  }
}

export class PostSummonStatChangeAbAttr extends PostSummonAbAttr {
  private stats: BattleStat[];
  private levels: integer;
  private selfTarget: boolean;

  constructor(stats: BattleStat | BattleStat[], levels: integer, selfTarget?: boolean) {
    super();

    this.stats = typeof(stats) === 'number'
      ? [ stats as BattleStat ]
      : stats as BattleStat[];
    this.levels = levels;
    this.selfTarget = !!selfTarget;
  }

  applyPostSummon(pokemon: Pokemon, args: any[]): boolean {
    const statChangePhases: StatChangePhase[] = [];

    if (this.selfTarget)
      statChangePhases.push(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, this.stats, this.levels));
    else {
      for (let opponent of pokemon.getOpponents())
        statChangePhases.push(new StatChangePhase(pokemon.scene, opponent.getBattlerIndex(), false, this.stats, this.levels));
    }

    for (let statChangePhase of statChangePhases) {
      if (!this.selfTarget && !statChangePhase.getPokemon().summonData)
        pokemon.scene.pushPhase(statChangePhase); // TODO: This causes the ability bar to be shown at the wrong time
      else
        pokemon.scene.unshiftPhase(statChangePhase);
    }
   
    return true;
  }
}

export class PostSummonWeatherChangeAbAttr extends PostSummonAbAttr {
  private weatherType: WeatherType;

  constructor(weatherType: WeatherType) {
    super();

    this.weatherType = weatherType;
  }

  applyPostSummon(pokemon: Pokemon, args: any[]): boolean {
    if (!pokemon.scene.arena.weather?.isImmutable())
      return pokemon.scene.arena.trySetWeather(this.weatherType, false);

    return false;
  }
}

export class PostSummonTransformAbAttr extends PostSummonAbAttr {
  constructor() {
    super(true);
  }

  applyPostSummon(pokemon: Pokemon, args: any[]): boolean {
    const targets = pokemon.getOpponents();
    let target: Pokemon;
    if (targets.length > 1)
      pokemon.scene.executeWithSeedOffset(() => target = Phaser.Math.RND.pick(targets), pokemon.scene.currentBattle.waveIndex);
    else
      target = targets[0];

    pokemon.summonData.speciesForm = target.getSpeciesForm();
    pokemon.summonData.fusionSpeciesForm = target.getFusionSpeciesForm();
    pokemon.summonData.gender = target.getGender();
    pokemon.summonData.fusionGender = target.getFusionGender();
    pokemon.summonData.stats = [ pokemon.stats[Stat.HP] ].concat(target.stats.slice(1));
    pokemon.summonData.battleStats = target.summonData.battleStats.slice(0);
    pokemon.summonData.moveset = target.getMoveset().map(m => new PokemonMove(m.moveId, m.ppUsed, m.ppUp));
    pokemon.summonData.types = target.getTypes();
    
    pokemon.scene.playSound('PRSFX- Transform');

    pokemon.loadAssets().then(() => pokemon.playAnim());

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` transformed\ninto ${target.name}!`));

    return true;
  }
}

export class PreStatChangeAbAttr extends AbAttr {
  applyPreStatChange(pokemon: Pokemon, stat: BattleStat, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    return false;
  }
}

export class ProtectStatAbAttr extends PreStatChangeAbAttr {
  private protectedStat: BattleStat;

  constructor(protectedStat?: BattleStat) {
    super();

    this.protectedStat = protectedStat;
  }

  applyPreStatChange(pokemon: Pokemon, stat: BattleStat, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (this.protectedStat === undefined || stat === this.protectedStat) {
      cancelled.value = true;
      return true;
    }
    
    return false;
  }

  getTriggerMessage(pokemon: Pokemon, ...args: any[]): string {
    return getPokemonMessage(pokemon, `'s ${pokemon.getAbility().name}\nprevents lowering its ${this.protectedStat !== undefined ? getBattleStatName(this.protectedStat) : 'stats'}!`);
  }
}

export class PreSetStatusAbAttr extends AbAttr {
  applyPreSetStatus(pokemon: Pokemon, effect: StatusEffect, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    return false;
  }
}

export class StatusEffectImmunityAbAttr extends PreSetStatusAbAttr {
  private immuneEffects: StatusEffect[];

  constructor(...immuneEffects: StatusEffect[]) {
    super();

    this.immuneEffects = immuneEffects;
  }

  applyPreSetStatus(pokemon: Pokemon, effect: StatusEffect, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (!this.immuneEffects.length || this.immuneEffects.indexOf(effect) > -1) {
      cancelled.value = true;
      return true;
    }

    return false;
  }

  getTriggerMessage(pokemon: Pokemon, ...args: any[]): string {
    return getPokemonMessage(pokemon, `'s ${pokemon.getAbility().name}\nprevents ${this.immuneEffects.length ? getStatusEffectDescriptor(args[0] as StatusEffect) : 'status problems'}!`);
  }
}

export class PreApplyBattlerTagAbAttr extends AbAttr {
  applyPreApplyBattlerTag(pokemon: Pokemon, tag: BattlerTag, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    return false;
  }
}

export class BattlerTagImmunityAbAttr extends PreApplyBattlerTagAbAttr {
  private immuneTagType: BattlerTagType;

  constructor(immuneTagType: BattlerTagType) {
    super();

    this.immuneTagType = immuneTagType;
  }

  applyPreApplyBattlerTag(pokemon: Pokemon, tag: BattlerTag, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (tag.tagType === this.immuneTagType) {
      cancelled.value = true;
      return true;
    }

    return false;
  }

  getTriggerMessage(pokemon: Pokemon, ...args: any[]): string {
    return getPokemonMessage(pokemon, `'s ${pokemon.getAbility().name}\nprevents ${(args[0] as BattlerTag).getDescriptor()}!`);
  }
}

export class BlockCritAbAttr extends AbAttr { }

export class PreWeatherEffectAbAttr extends AbAttr {
  applyPreWeatherEffect(pokemon: Pokemon, weather: Weather, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    return false;
  }
}

export class PreWeatherDamageAbAttr extends PreWeatherEffectAbAttr { }

export class BlockWeatherDamageAttr extends PreWeatherDamageAbAttr {
  private weatherTypes: WeatherType[];

  constructor(...weatherTypes: WeatherType[]) {
    super();

    this.weatherTypes = weatherTypes;
  }

  applyPreWeatherEffect(pokemon: Pokemon, weather: Weather, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (!this.weatherTypes.length || this.weatherTypes.indexOf(weather?.weatherType) > -1)
      cancelled.value = true;

    return true;
  }
}

export class SuppressWeatherEffectAbAttr extends PreWeatherEffectAbAttr {
  public affectsImmutable: boolean;

  constructor(affectsImmutable?: boolean) {
    super();

    this.affectsImmutable = affectsImmutable;
  }

  applyPreWeatherEffect(pokemon: Pokemon, weather: Weather, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (this.affectsImmutable || weather.isImmutable()) {
      cancelled.value = true;
      return true;
    }

    return false;
  }
}

export class PostTurnAbAttr extends AbAttr {
  applyPostTurn(pokemon: Pokemon, args: any[]) {
    return false;
  }
}

export class PostTurnSpeedBoostAbAttr extends PostTurnAbAttr {
  applyPostTurn(pokemon: Pokemon, args: any[]): boolean {
    pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ BattleStat.SPD ], 1));
    return true;
  }
}

function getWeatherCondition(...weatherTypes: WeatherType[]): AbAttrCondition {
  return (pokemon: Pokemon) => {
    if (pokemon.scene.arena.weather?.isEffectSuppressed(pokemon.scene))
      return false;
    const weatherType = pokemon.scene.arena.weather?.weatherType;
    return weatherType && weatherTypes.indexOf(weatherType) > -1;
  };
}

export class PostTurnHealAbAttr extends PostTurnAbAttr {
  applyPostTurn(pokemon: Pokemon, args: any[]): boolean {
    if (pokemon.getHpRatio() < 1) {
      const scene = pokemon.scene;
      scene.unshiftPhase(new PokemonHealPhase(scene, pokemon.getBattlerIndex(),
        Math.max(Math.floor(pokemon.getMaxHp() / 16), 1), getPokemonMessage(pokemon, `'s ${pokemon.getAbility().name}\nrestored its HP a little!`), true));
      return true;
    }

    return false;
  }
}

export class PostWeatherLapseAbAttr extends AbAttr {
  protected weatherTypes: WeatherType[];

  constructor(...weatherTypes: WeatherType[]) {
    super();

    this.weatherTypes = weatherTypes;
  }

  applyPostWeatherLapse(pokemon: Pokemon, weather: Weather, args: any[]): boolean {
    return false;
  }

  getCondition(): AbAttrCondition {
    return getWeatherCondition(...this.weatherTypes);
  }
}

export class PostWeatherLapseHealAbAttr extends PostWeatherLapseAbAttr {
  private healFactor: integer;

  constructor(healFactor: integer, ...weatherTypes: WeatherType[]) {
    super(...weatherTypes);
    
    this.healFactor = healFactor;
  }

  applyPostWeatherLapse(pokemon: Pokemon, weather: Weather, args: any[]): boolean {
    if (pokemon.getHpRatio() < 1) {
      const scene = pokemon.scene;
      scene.unshiftPhase(new PokemonHealPhase(scene, pokemon.getBattlerIndex(),
        Math.max(Math.floor(pokemon.getMaxHp() / (16 / this.healFactor)), 1), getPokemonMessage(pokemon, `'s ${pokemon.getAbility().name}\nrestored its HP a little!`), true));
      return true;
    }

    return false;
  }
}

export class PostWeatherLapseDamageAbAttr extends PostWeatherLapseAbAttr {
  private damageFactor: integer;

  constructor(damageFactor: integer, ...weatherTypes: WeatherType[]) {
    super(...weatherTypes);
    
    this.damageFactor = damageFactor;
  }

  applyPostWeatherLapse(pokemon: Pokemon, weather: Weather, args: any[]): boolean {
    if (pokemon.getHpRatio() < 1) {
      const scene = pokemon.scene;
      scene.queueMessage(getPokemonMessage(pokemon, ` is hurt\nby its ${pokemon.getAbility()}!`));
      scene.unshiftPhase(new DamagePhase(pokemon.scene, pokemon.getBattlerIndex(), HitResult.OTHER));
      pokemon.damage(Math.ceil(pokemon.getMaxHp() / (16 / this.damageFactor)));
      return true;
    }

    return false;
  }
}

export class StatChangeMultiplierAbAttr extends AbAttr {
  private multiplier: integer;

  constructor(multiplier: integer) {
    super(true);

    this.multiplier = multiplier;
  }

  apply(pokemon: Pokemon, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value *= this.multiplier;

    return true;
  }
}

export class CheckTrappedAbAttr extends AbAttr {
  applyCheckTrapped(pokemon: Pokemon, trapped: Utils.BooleanHolder, args: any[]): boolean {
    return false;
  }
}

export class ArenaTrapAbAttr extends CheckTrappedAbAttr {
  applyCheckTrapped(pokemon: Pokemon, trapped: Utils.BooleanHolder, args: any[]): boolean {
    trapped.value = true;
    return true;
  }

  getTriggerMessage(pokemon: Pokemon, ...args: any[]): string {
    return getPokemonMessage(pokemon, `\'s ${pokemon.getAbility().name}\nprevents switching!`);
  }
}

export function applyAbAttrs(attrType: { new(...args: any[]): AbAttr }, pokemon: Pokemon, cancelled: Utils.BooleanHolder, ...args: any[]): void {
  if (!pokemon.canApplyAbility())
    return;

  const ability = pokemon.getAbility();
  const attrs = ability.getAttrs(attrType) as AbAttr[];
  for (let attr of attrs) {
    if (!canApplyAttr(pokemon, attr))
      continue;
    pokemon.scene.setPhaseQueueSplice();
    if (attr.apply(pokemon, cancelled, args)) {
      if (attr.showAbility)
        queueShowAbility(pokemon);
      const message = attr.getTriggerMessage(pokemon);
      if (message)
        pokemon.scene.queueMessage(message);
    }
  }

  pokemon.scene.clearPhaseQueueSplice();
}

export function applyPreDefendAbAttrs(attrType: { new(...args: any[]): PreDefendAbAttr },
  pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, ...args: any[]): void {
  if (!pokemon.canApplyAbility())
    return;

  const ability = pokemon.getAbility();
  const attrs = ability.getAttrs(attrType) as PreDefendAbAttr[];
  for (let attr of attrs) {
    if (!canApplyAttr(pokemon, attr))
      continue;
    pokemon.scene.setPhaseQueueSplice();
    if (attr.applyPreDefend(pokemon, attacker, move, cancelled, args)) {
      if (attr.showAbility)
        queueShowAbility(pokemon);
      const message = attr.getTriggerMessage(pokemon, attacker, move);
      if (message)
        pokemon.scene.queueMessage(message);
    }
  }

  pokemon.scene.clearPhaseQueueSplice();
}

export function applyPostDefendAbAttrs(attrType: { new(...args: any[]): PostDefendAbAttr },
  pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, ...args: any[]): void {
  if (!pokemon.canApplyAbility())
    return;

  const ability = pokemon.getAbility();
  const attrs = ability.getAttrs(attrType) as PostDefendAbAttr[];
  for (let attr of attrs) {
    if (!canApplyAttr(pokemon, attr))
      continue;
    pokemon.scene.setPhaseQueueSplice();
    if (attr.applyPostDefend(pokemon, attacker, move, hitResult, args)) {
      if (attr.showAbility)
        queueShowAbility(pokemon);
      const message = attr.getTriggerMessage(pokemon, attacker, move);
      if (message)
        pokemon.scene.queueMessage(message);
    }
  }

  pokemon.scene.clearPhaseQueueSplice();
}

export function applyBattleStatMultiplierAbAttrs(attrType: { new(...args: any[]): BattleStatMultiplierAbAttr },
  pokemon: Pokemon, battleStat: BattleStat, statValue: Utils.NumberHolder, ...args: any[]) {
  if (!pokemon.canApplyAbility())
    return;

  const ability = pokemon.getAbility();
  const attrs = ability.getAttrs(attrType) as BattleStatMultiplierAbAttr[];
  for (let attr of attrs) {
    if (!canApplyAttr(pokemon, attr))
      continue;
    pokemon.scene.setPhaseQueueSplice();
    if (attr.applyBattleStat(pokemon, battleStat, statValue, args)) {
      const message = attr.getTriggerMessage(pokemon);
      if (message) {
        if (attr.showAbility)
          queueShowAbility(pokemon);
        pokemon.scene.queueMessage(message);
      }
    }
  }

  pokemon.scene.clearPhaseQueueSplice();
}

export function applyPreAttackAbAttrs(attrType: { new(...args: any[]): PreAttackAbAttr },
  pokemon: Pokemon, defender: Pokemon, move: PokemonMove, ...args: any[]): void {
  if (!pokemon.canApplyAbility())
    return;

  const ability = pokemon.getAbility();
  const attrs = ability.getAttrs(attrType) as PreAttackAbAttr[];
  for (let attr of attrs) {
    if (!canApplyAttr(pokemon, attr))
      continue;
    pokemon.scene.setPhaseQueueSplice();
    if (attr.applyPreAttack(pokemon, defender, move, args)) {
      if (attr.showAbility)
        queueShowAbility(pokemon);
      const message = attr.getTriggerMessage(pokemon, defender, move);
      if (message)
        pokemon.scene.queueMessage(message);
    }
  }

  pokemon.scene.clearPhaseQueueSplice();
}

export function applyPostSummonAbAttrs(attrType: { new(...args: any[]): PostSummonAbAttr },
  pokemon: Pokemon, ...args: any[]): void {
  if (!pokemon.canApplyAbility())
    return;

  const ability = pokemon.getAbility();
  const attrs = ability.getAttrs(attrType) as PostSummonAbAttr[];
  for (let attr of attrs) {
    if (!canApplyAttr(pokemon, attr))
      continue;
    pokemon.scene.setPhaseQueueSplice();
    if (attr.applyPostSummon(pokemon, args)) {
      if (attr.showAbility)
        queueShowAbility(pokemon);
      const message = attr.getTriggerMessage(pokemon);
      if (message)
        pokemon.scene.queueMessage(message);
    }
  }

  pokemon.scene.clearPhaseQueueSplice();
}

export function applyPreStatChangeAbAttrs(attrType: { new(...args: any[]): PreStatChangeAbAttr },
  pokemon: Pokemon, stat: BattleStat, cancelled: Utils.BooleanHolder, ...args: any[]): void {
  if (!pokemon.canApplyAbility())
    return;

  const ability = pokemon.getAbility();
  const attrs = ability.getAttrs(attrType) as PreStatChangeAbAttr[];
  for (let attr of attrs) {
    if (!canApplyAttr(pokemon, attr))
      continue;
    pokemon.scene.setPhaseQueueSplice();
    if (attr.applyPreStatChange(pokemon, stat, cancelled, args)) {
      if (attr.showAbility)
        queueShowAbility(pokemon);
      const message = attr.getTriggerMessage(pokemon, stat);
      if (message)
        pokemon.scene.queueMessage(message);
    }
  }

  pokemon.scene.clearPhaseQueueSplice();
}

export function applyPreSetStatusAbAttrs(attrType: { new(...args: any[]): PreSetStatusAbAttr },
  pokemon: Pokemon, effect: StatusEffect, cancelled: Utils.BooleanHolder, ...args: any[]): void {
  if (!pokemon.canApplyAbility())
    return;

  const ability = pokemon.getAbility();
  const attrs = ability.getAttrs(attrType) as PreSetStatusAbAttr[];
  for (let attr of attrs) {
    if (!canApplyAttr(pokemon, attr))
      continue;
    pokemon.scene.setPhaseQueueSplice();
    if (attr.applyPreSetStatus(pokemon, effect, cancelled, args)) {
      if (attr.showAbility)
        queueShowAbility(pokemon);
      const message = attr.getTriggerMessage(pokemon, effect);
      if (message)
        pokemon.scene.queueMessage(message);
    }
  }

  pokemon.scene.clearPhaseQueueSplice();
}

export function applyPreApplyBattlerTagAbAttrs(attrType: { new(...args: any[]): PreApplyBattlerTagAbAttr },
  pokemon: Pokemon, tag: BattlerTag, cancelled: Utils.BooleanHolder, ...args: any[]): void {
  if (!pokemon.canApplyAbility())
    return;

  const ability = pokemon.getAbility();
  const attrs = ability.getAttrs(attrType) as PreApplyBattlerTagAbAttr[];
  for (let attr of attrs) {
    if (!canApplyAttr(pokemon, attr))
      continue;
    pokemon.scene.setPhaseQueueSplice();
    if (attr.applyPreApplyBattlerTag(pokemon, tag, cancelled, args)) {
      if (attr.showAbility)
        queueShowAbility(pokemon);
      const message = attr.getTriggerMessage(pokemon, tag);
      if (message)
        pokemon.scene.queueMessage(message);
    }
  }

  pokemon.scene.clearPhaseQueueSplice();
}

export function applyPreWeatherEffectAbAttrs(attrType: { new(...args: any[]): PreWeatherEffectAbAttr },
  pokemon: Pokemon, weather: Weather, cancelled: Utils.BooleanHolder, ...args: any[]): void {
  if (!pokemon.canApplyAbility())
    return;

  const ability = pokemon.getAbility();
  const attrs = ability.getAttrs(attrType) as PreWeatherEffectAbAttr[];
  for (let attr of attrs) {
    if (!canApplyAttr(pokemon, attr))
      continue;
    pokemon.scene.setPhaseQueueSplice();
    if (attr.applyPreWeatherEffect(pokemon, weather, cancelled, args)) {
      pokemon.scene.abilityBar.showAbility(pokemon);
      const message = attr.getTriggerMessage(pokemon, weather);
      if (message)
        pokemon.scene.queueMessage(message);
    }
  }

  pokemon.scene.clearPhaseQueueSplice();
}

export function applyPostTurnAbAttrs(attrType: { new(...args: any[]): PostTurnAbAttr },
  pokemon: Pokemon, ...args: any[]): void {
  if (!pokemon.canApplyAbility())
    return;

  const ability = pokemon.getAbility();

  const attrs = ability.getAttrs(attrType) as PostTurnAbAttr[];
  for (let attr of attrs) {
    if (!canApplyAttr(pokemon, attr))
      continue;
    pokemon.scene.setPhaseQueueSplice();
    if (attr.applyPostTurn(pokemon, args)) {
      if (attr.showAbility)
        queueShowAbility(pokemon);
      const message = attr.getTriggerMessage(pokemon);
      if (message)
        pokemon.scene.queueMessage(message);
    }
  }

  pokemon.scene.clearPhaseQueueSplice();
}

export function applyPostWeatherLapseAbAttrs(attrType: { new(...args: any[]): PostWeatherLapseAbAttr },
  pokemon: Pokemon, weather: Weather, ...args: any[]): void {
  if (!pokemon.canApplyAbility())
    return;

  if (weather.isEffectSuppressed(pokemon.scene))
    return;

  const ability = pokemon.getAbility();

  const attrs = ability.getAttrs(attrType) as PostWeatherLapseAbAttr[];
  for (let attr of attrs) {
    if (!canApplyAttr(pokemon, attr))
      continue;
    pokemon.scene.setPhaseQueueSplice();
    if (attr.applyPostWeatherLapse(pokemon, weather, args)) {
      if (attr.showAbility)
        queueShowAbility(pokemon);
      const message = attr.getTriggerMessage(pokemon, weather);
      if (message)
        pokemon.scene.queueMessage(message);
    }
  }

  pokemon.scene.clearPhaseQueueSplice();
}

export function applyCheckTrappedAbAttrs(attrType: { new(...args: any[]): CheckTrappedAbAttr },
  pokemon: Pokemon, trapped: Utils.BooleanHolder, ...args: any[]): void {
  if (!pokemon.canApplyAbility())
    return;

  const ability = pokemon.getAbility();
  const attrs = ability.getAttrs(attrType) as CheckTrappedAbAttr[];
  for (let attr of attrs) {
    if (!canApplyAttr(pokemon, attr))
      continue;
    pokemon.scene.setPhaseQueueSplice();
    if (attr.applyCheckTrapped(pokemon, trapped, args)) {
      // Don't show ability bar because this call is asynchronous
      const message = attr.getTriggerMessage(pokemon);
      if (message)
        pokemon.scene.ui.showText(message, null, () => pokemon.scene.ui.showText(null, 0), null, true);
    }
  }

  pokemon.scene.clearPhaseQueueSplice();
}

function canApplyAttr(pokemon: Pokemon, attr: AbAttr): boolean {
  const condition = attr.getCondition();
  return !condition || condition(pokemon);
}

function queueShowAbility(pokemon: Pokemon): void {
  pokemon.scene.unshiftPhase(new ShowAbilityPhase(pokemon.scene, pokemon.getBattlerIndex()));
  pokemon.scene.clearPhaseQueueSplice();
}

export enum Abilities {
  NONE,
  STENCH,
  DRIZZLE,
  SPEED_BOOST,
  BATTLE_ARMOR,
  STURDY,
  DAMP,
  LIMBER,
  SAND_VEIL,
  STATIC,
  VOLT_ABSORB,
  WATER_ABSORB,
  OBLIVIOUS,
  CLOUD_NINE,
  COMPOUND_EYES,
  INSOMNIA,
  COLOR_CHANGE,
  IMMUNITY,
  FLASH_FIRE,
  SHIELD_DUST,
  OWN_TEMPO,
  SUCTION_CUPS,
  INTIMIDATE,
  SHADOW_TAG,
  ROUGH_SKIN,
  WONDER_GUARD,
  LEVITATE,
  EFFECT_SPORE,
  SYNCHRONIZE,
  CLEAR_BODY,
  NATURAL_CURE,
  LIGHTNING_ROD,
  SERENE_GRACE,
  SWIFT_SWIM,
  CHLOROPHYLL,
  ILLUMINATE,
  TRACE,
  HUGE_POWER,
  POISON_POINT,
  INNER_FOCUS,
  MAGMA_ARMOR,
  WATER_VEIL,
  MAGNET_PULL,
  SOUNDPROOF,
  RAIN_DISH,
  SAND_STREAM,
  PRESSURE,
  THICK_FAT,
  EARLY_BIRD,
  FLAME_BODY,
  RUN_AWAY,
  KEEN_EYE,
  HYPER_CUTTER,
  PICKUP,
  TRUANT,
  HUSTLE,
  CUTE_CHARM,
  PLUS,
  MINUS,
  FORECAST,
  STICKY_HOLD,
  SHED_SKIN,
  GUTS,
  MARVEL_SCALE,
  LIQUID_OOZE,
  OVERGROW,
  BLAZE,
  TORRENT,
  SWARM,
  ROCK_HEAD,
  DROUGHT,
  ARENA_TRAP,
  VITAL_SPIRIT,
  WHITE_SMOKE,
  PURE_POWER,
  SHELL_ARMOR,
  AIR_LOCK,
  TANGLED_FEET,
  MOTOR_DRIVE,
  RIVALRY,
  STEADFAST,
  SNOW_CLOAK,
  GLUTTONY,
  ANGER_POINT,
  UNBURDEN,
  HEATPROOF,
  SIMPLE,
  DRY_SKIN,
  DOWNLOAD,
  IRON_FIST,
  POISON_HEAL,
  ADAPTABILITY,
  SKILL_LINK,
  HYDRATION,
  SOLAR_POWER,
  QUICK_FEET,
  NORMALIZE,
  SNIPER,
  MAGIC_GUARD,
  NO_GUARD,
  STALL,
  TECHNICIAN,
  LEAF_GUARD,
  KLUTZ,
  MOLD_BREAKER,
  SUPER_LUCK,
  AFTERMATH,
  ANTICIPATION,
  FOREWARN,
  UNAWARE,
  TINTED_LENS,
  FILTER,
  SLOW_START,
  SCRAPPY,
  STORM_DRAIN,
  ICE_BODY,
  SOLID_ROCK,
  SNOW_WARNING,
  HONEY_GATHER,
  FRISK,
  RECKLESS,
  MULTITYPE,
  FLOWER_GIFT,
  BAD_DREAMS,
  PICKPOCKET,
  SHEER_FORCE,
  CONTRARY,
  UNNERVE,
  DEFIANT,
  DEFEATIST,
  CURSED_BODY,
  HEALER,
  FRIEND_GUARD,
  WEAK_ARMOR,
  HEAVY_METAL,
  LIGHT_METAL,
  MULTISCALE,
  TOXIC_BOOST,
  FLARE_BOOST,
  HARVEST,
  TELEPATHY,
  MOODY,
  OVERCOAT,
  POISON_TOUCH,
  REGENERATOR,
  BIG_PECKS,
  SAND_RUSH,
  WONDER_SKIN,
  ANALYTIC,
  ILLUSION,
  IMPOSTER,
  INFILTRATOR,
  MUMMY,
  MOXIE,
  JUSTIFIED,
  RATTLED,
  MAGIC_BOUNCE,
  SAP_SIPPER,
  PRANKSTER,
  SAND_FORCE,
  IRON_BARBS,
  ZEN_MODE,
  VICTORY_STAR,
  TURBOBLAZE,
  TERAVOLT,
  AROMA_VEIL,
  FLOWER_VEIL,
  CHEEK_POUCH,
  PROTEAN,
  FUR_COAT,
  MAGICIAN,
  BULLETPROOF,
  COMPETITIVE,
  STRONG_JAW,
  REFRIGERATE,
  SWEET_VEIL,
  STANCE_CHANGE,
  GALE_WINGS,
  MEGA_LAUNCHER,
  GRASS_PELT,
  SYMBIOSIS,
  TOUGH_CLAWS,
  PIXILATE,
  GOOEY,
  AERILATE,
  PARENTAL_BOND,
  DARK_AURA,
  FAIRY_AURA,
  AURA_BREAK,
  PRIMORDIAL_SEA,
  DESOLATE_LAND,
  DELTA_STREAM,
  STAMINA,
  WIMP_OUT,
  EMERGENCY_EXIT,
  WATER_COMPACTION,
  MERCILESS,
  SHIELDS_DOWN,
  STAKEOUT,
  WATER_BUBBLE,
  STEELWORKER,
  BERSERK,
  SLUSH_RUSH,
  LONG_REACH,
  LIQUID_VOICE,
  TRIAGE,
  GALVANIZE,
  SURGE_SURFER,
  SCHOOLING,
  DISGUISE,
  BATTLE_BOND,
  POWER_CONSTRUCT,
  CORROSION,
  COMATOSE,
  QUEENLY_MAJESTY,
  INNARDS_OUT,
  DANCER,
  BATTERY,
  FLUFFY,
  DAZZLING,
  SOUL_HEART,
  TANGLING_HAIR,
  RECEIVER,
  POWER_OF_ALCHEMY,
  BEAST_BOOST,
  RKS_SYSTEM,
  ELECTRIC_SURGE,
  PSYCHIC_SURGE,
  MISTY_SURGE,
  GRASSY_SURGE,
  FULL_METAL_BODY,
  SHADOW_SHIELD,
  PRISM_ARMOR,
  NEUROFORCE,
  INTREPID_SWORD,
  DAUNTLESS_SHIELD,
  LIBERO,
  BALL_FETCH,
  COTTON_DOWN,
  PROPELLER_TAIL,
  MIRROR_ARMOR,
  GULP_MISSILE,
  STALWART,
  STEAM_ENGINE,
  PUNK_ROCK,
  SAND_SPIT,
  ICE_SCALES,
  RIPEN,
  ICE_FACE,
  POWER_SPOT,
  MIMICRY,
  SCREEN_CLEANER,
  STEELY_SPIRIT,
  PERISH_BODY,
  WANDERING_SPIRIT,
  GORILLA_TACTICS,
  NEUTRALIZING_GAS,
  PASTEL_VEIL,
  HUNGER_SWITCH,
  QUICK_DRAW,
  UNSEEN_FIST,
  CURIOUS_MEDICINE,
  TRANSISTOR,
  DRAGONS_MAW,
  CHILLING_NEIGH,
  GRIM_NEIGH,
  AS_ONE_GLASTRIER,
  AS_ONE_SPECTRIER,
  LINGERING_AROMA,
  SEED_SOWER,
  THERMAL_EXCHANGE,
  ANGER_SHELL,
  PURIFYING_SALT,
  WELL_BAKED_BODY,
  WIND_RIDER,
  GUARD_DOG,
  ROCKY_PAYLOAD,
  WIND_POWER,
  ZERO_TO_HERO,
  COMMANDER,
  ELECTROMORPHOSIS,
  PROTOSYNTHESIS,
  QUARK_DRIVE,
  GOOD_AS_GOLD,
  VESSEL_OF_RUIN,
  SWORD_OF_RUIN,
  TABLETS_OF_RUIN,
  BEADS_OF_RUIN,
  ORICHALCUM_PULSE,
  HADRON_ENGINE,
  OPPORTUNIST,
  CUD_CHEW,
  SHARPNESS,
  SUPREME_OVERLORD,
  COSTAR,
  TOXIC_DEBRIS,
  ARMOR_TAIL,
  EARTH_EATER,
  MYCELIUM_MIGHT,
  MINDS_EYE,
  SUPERSWEET_SYRUP,
  HOSPITALITY,
  TOXIC_CHAIN,
  EMBODY_ASPECT,
  MOUNTAINEER,
  WAVE_RIDER,
  SKATER,
  THRUST,
  PERCEPTION,
  PARRY,
  INSTINCT,
  DODGE,
  JAGGED_EDGE,
  FROSTBITE,
  TENACITY,
  PRIDE,
  DEEP_SLEEP,
  POWER_NAP,
  SPIRIT,
  WARM_BLANKET,
  GULP,
  HERBIVORE,
  SANDPIT,
  HOT_BLOODED,
  MEDIC,
  LIFE_FORCE,
  LUNCHBOX,
  NURSE,
  MELEE,
  SPONGE,
  BODYGUARD,
  HERO,
  LAST_BASTION,
  STEALTH,
  VANGUARD,
  NOMAD,
  SEQUENCE,
  GRASS_CLOAK,
  CELEBRATE,
  LULLABY,
  CALMING,
  DAZE,
  FRIGHTEN,
  INTERFERENCE,
  MOOD_MAKER,
  CONFIDENCE,
  FORTUNE,
  BONANZA,
  EXPLODE,
  OMNIPOTENT,
  SHARE,
  BLACK_HOLE,
  SHADOW_DASH,
  SPRINT,
  DISGUST,
  HIGH_RISE,
  CLIMBER,
  FLAME_BOOST,
  AQUA_BOOST,
  RUN_UP,
  CONQUEROR,
  SHACKLE,
  DECOY,
  SHIELD
};

export const allAbilities = [ new Ability(Abilities.NONE, "-", "", 3) ];

export function initAbilities() {
  allAbilities.push(
    new Ability(Abilities.STENCH, "Stench (N)", "By releasing stench when attacking, this Pokémon\nmay cause the target to flinch.", 3),
    new Ability(Abilities.DRIZZLE, "Drizzle", "The Pokémon makes it rain when it enters a battle.", 3)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.RAIN),
    new Ability(Abilities.SPEED_BOOST, "Speed Boost", "Its Speed stat is boosted every turn.", 3)
      .attr(PostTurnSpeedBoostAbAttr),
    new Ability(Abilities.BATTLE_ARMOR, "Battle Armor", "Hard armor protects the Pokémon from critical hits.", 3)
      .attr(BlockCritAbAttr),
    new Ability(Abilities.STURDY, "Sturdy (N)", "It cannot be knocked out with one hit. One-hit KO\nmoves cannot knock it out, either.", 3),
    new Ability(Abilities.DAMP, "Damp (N)", "Prevents the use of explosive moves, such as\nSelf-Destruct, by dampening its surroundings.", 3),
    new Ability(Abilities.LIMBER, "Limber", "Its limber body protects the Pokémon from paralysis.", 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.PARALYSIS),
    new Ability(Abilities.SAND_VEIL, "Sand Veil", "Boosts the Pokémon's evasiveness in a sandstorm.", 3)
      .attr(BattleStatMultiplierAbAttr, BattleStat.EVA, 1.2)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM)),
    new Ability(Abilities.STATIC, "Static", "The Pokémon is charged with static electricity, so\ncontact with it may cause paralysis.", 3)
      .attr(PostDefendContactApplyStatusEffectAbAttr, StatusEffect.PARALYSIS),
    new Ability(Abilities.VOLT_ABSORB, "Volt Absorb", "Restores HP if hit by an Electric-type move instead\nof taking damage.", 3)
      .attr(TypeImmunityHealAbAttr, Type.ELECTRIC),
    new Ability(Abilities.WATER_ABSORB, "Water Absorb", "Restores HP if hit by a Water-type move instead of\ntaking damage.", 3)
      .attr(TypeImmunityHealAbAttr, Type.WATER),
    new Ability(Abilities.OBLIVIOUS, "Oblivious", "The Pokémon is oblivious, and that keeps it from\nbeing infatuated or falling for taunts.", 3)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.INFATUATED),
    new Ability(Abilities.CLOUD_NINE, "Cloud Nine", "Eliminates the effects of weather.", 3)
      .attr(SuppressWeatherEffectAbAttr),
    new Ability(Abilities.COMPOUND_EYES, "Compound Eyes", "The Pokémon's compound eyes boost its accuracy.", 3)
      .attr(BattleStatMultiplierAbAttr, BattleStat.ACC, 1.3),
    new Ability(Abilities.INSOMNIA, "Insomnia", "The Pokémon is suffering from insomnia and cannot\nfall asleep.", 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY),
    new Ability(Abilities.COLOR_CHANGE, "Color Change", "The Pokémon's type becomes the type of the move\nused on it.", 3)
      .attr(PostDefendTypeChangeAbAttr),
    new Ability(Abilities.IMMUNITY, "Immunity", "The immune system of the Pokémon prevents it from\ngetting poisoned.", 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.POISON),
    new Ability(Abilities.FLASH_FIRE, "Flash Fire", "Powers up the Pokémon's Fire-type moves if it's hit\nby one.", 3)
      .attr(TypeImmunityAddBattlerTagAbAttr, Type.FIRE, BattlerTagType.FIRE_BOOST, 1, (pokemon: Pokemon) => !pokemon.status || pokemon.status.effect !== StatusEffect.FREEZE),
    new Ability(Abilities.SHIELD_DUST, "Shield Dust (N)", "This Pokémon's dust blocks the additional effects of\nattacks taken.", 3),
    new Ability(Abilities.OWN_TEMPO, "Own Tempo", "This Pokémon has its own tempo, and that prevents\nit from becoming confused.", 3)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.CONFUSED),
    new Ability(Abilities.SUCTION_CUPS, "Suction Cups (N)", "This Pokémon uses suction cups to stay in one spot\nto negate all moves and items that force\nswitching out.", 3),
    new Ability(Abilities.INTIMIDATE, "Intimidate", "The Pokémon intimidates opposing Pokémon upon\nentering battle, lowering their Attack stat.", 3)
      .attr(PostSummonStatChangeAbAttr, BattleStat.ATK, -1),
    new Ability(Abilities.SHADOW_TAG, "Shadow Tag", "This Pokémon steps on the opposing Pokémon's\nshadow to prevent it from escaping.", 3)
      .attr(ArenaTrapAbAttr),
    new Ability(Abilities.ROUGH_SKIN, "Rough Skin (N)", "This Pokémon inflicts damage with its rough skin\nto the attacker on contact.", 3),
    new Ability(Abilities.WONDER_GUARD, "Wonder Guard", "Its mysterious power only lets supereffective moves\nhit the Pokémon.", 3)
      .attr(NonSuperEffectiveImmunityAbAttr),
    new Ability(Abilities.LEVITATE, "Levitate", "By floating in the air, the Pokémon receives full\nimmunity to all Ground-type moves.", 3)
      .attr(TypeImmunityAbAttr, Type.GROUND, (pokemon: Pokemon) => !pokemon.getTag(BattlerTagType.IGNORE_FLYING) && !pokemon.scene.arena.getTag(ArenaTagType.GRAVITY)),
    new Ability(Abilities.EFFECT_SPORE, "Effect Spore", "Contact with the Pokémon may inflict poison, sleep,\nor paralysis on its attacker.", 3)
      .attr(PostDefendContactApplyStatusEffectAbAttr, 10, StatusEffect.POISON, StatusEffect.PARALYSIS, StatusEffect.SLEEP),
    new Ability(Abilities.SYNCHRONIZE, "Synchronize (N)", "The attacker will receive the same status condition if\nit inflicts a burn, poison, or paralysis to the Pokémon.", 3),
    new Ability(Abilities.CLEAR_BODY, "Clear Body", "Prevents other Pokémon's moves or Abilities from\nlowering the Pokémon's stats.", 3)
      .attr(ProtectStatAbAttr),
    new Ability(Abilities.NATURAL_CURE, "Natural Cure (N)", "All status conditions heal when the Pokémon\nswitches out.", 3),
    new Ability(Abilities.LIGHTNING_ROD, "Lightning Rod", "The Pokémon draws in all Electric-type moves.\nInstead of being hit by Electric-type moves,\nit boosts its Sp. Atk.", 3)
      .attr(TypeImmunityStatChangeAbAttr, Type.ELECTRIC, BattleStat.SPATK, 1),
    new Ability(Abilities.SERENE_GRACE, "Serene Grace (N)", "Boosts the likelihood of additional effects occurring\nwhen attacking.", 3),
    new Ability(Abilities.SWIFT_SWIM, "Swift Swim", "Boosts the Pokémon's Speed stat in rain.", 3)
      .attr(BattleStatMultiplierAbAttr, BattleStat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.RAIN, WeatherType.HEAVY_RAIN)),
    new Ability(Abilities.CHLOROPHYLL, "Chlorophyll", "Boosts the Pokémon's Speed stat in harsh sunlight.", 3)
      .attr(BattleStatMultiplierAbAttr, BattleStat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN)),
    new Ability(Abilities.ILLUMINATE, "Illuminate", "Raises the likelihood of meeting wild Pokémon by\nilluminating the surroundings.", 3)
      .attr(DoubleBattleChanceAbAttr),
    new Ability(Abilities.TRACE, "Trace (N)", "When it enters a battle, the Pokémon copies an\nopposing Pokémon's Ability.", 3),
    new Ability(Abilities.HUGE_POWER, "Huge Power", "Doubles the Pokémon's Attack stat.", 3)
      .attr(PostSummonStatChangeAbAttr, BattleStat.ATK, 2, true),
    new Ability(Abilities.POISON_POINT, "Poison Point", "Contact with the Pokémon may poison the attacker.", 3)
      .attr(PostDefendContactApplyStatusEffectAbAttr, StatusEffect.POISON),
    new Ability(Abilities.INNER_FOCUS, "Inner Focus", "The Pokémon's intensely focused, and that protects\nthe Pokémon from flinching.", 3)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.FLINCHED),
    new Ability(Abilities.MAGMA_ARMOR, "Magma Armor", "The Pokémon is covered with hot magma, which\nprevents the Pokémon from becoming frozen.", 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.FREEZE),
    new Ability(Abilities.WATER_VEIL, "Water Veil", "The Pokémon is covered with a water veil, which\nprevents the Pokémon from getting a burn.", 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.BURN),
    new Ability(Abilities.MAGNET_PULL, "Magnet Pull", "Prevents Steel-type Pokémon from escaping using\nits magnetic force.", 3)
      /*.attr(ArenaTrapAbAttr)
      .condition((pokemon: Pokemon) => pokemon.getOpponent()?.isOfType(Type.STEEL))*/,
    new Ability(Abilities.SOUNDPROOF, "Soundproof (N)", "Soundproofing gives the Pokémon full\nimmunity to all sound-based moves.", 3),
    new Ability(Abilities.RAIN_DISH, "Rain Dish", "The Pokémon gradually regains HP in rain.", 3)
      .attr(PostWeatherLapseHealAbAttr, 1, WeatherType.RAIN, WeatherType.HEAVY_RAIN),
    new Ability(Abilities.SAND_STREAM, "Sand Stream", "The Pokémon summons a sandstorm when it enters\na battle.", 3)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SANDSTORM),
    new Ability(Abilities.PRESSURE, "Pressure", "By putting pressure on the opposing Pokémon, it\nraises their PP usage.", 3)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => getPokemonMessage(pokemon, 'is\nexerting its Pressure!')),
    new Ability(Abilities.THICK_FAT, "Thick Fat", "The Pokémon is protected by a layer of thick fat,\nwhich halves the damage taken from Fire- and\nIce-type moves.", 3)
      .attr(ReceivedTypeDamageMultiplierAbAttr, Type.FIRE, 0.5)
      .attr(ReceivedTypeDamageMultiplierAbAttr, Type.ICE, 0.5),
    new Ability(Abilities.EARLY_BIRD, "Early Bird (N)", "The Pokémon awakens from sleep twice as fast\nas other Pokémon.", 3),
    new Ability(Abilities.FLAME_BODY, "Flame Body", "Contact with the Pokémon may burn the attacker.", 3)
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.BURN),
    new Ability(Abilities.RUN_AWAY, "Run Away (N)", "Enables a sure getaway from wild Pokémon.", 3),
    new Ability(Abilities.KEEN_EYE, "Keen Eye", "Keen eyes prevent other Pokémon from lowering this\nPokémon's accuracy.", 3)
      .attr(ProtectStatAbAttr, BattleStat.ACC),
    new Ability(Abilities.HYPER_CUTTER, "Hyper Cutter", "The Pokémon's proud of its powerful pincers. They\nprevent other Pokémon from lowering its Attack stat.", 3)
      .attr(ProtectStatAbAttr, BattleStat.ATK),
    new Ability(Abilities.PICKUP, "Pickup (N)", "The Pokémon may pick up the item an opposing\nPokémon used during a battle. It may pick up items\noutside of battle, too.", 3),
    new Ability(Abilities.TRUANT, "Truant", "The Pokémon can't use a move if it had used a move\non the previous turn.", 3)
      .attr(PostSummonAddBattlerTagAbAttr, BattlerTagType.TRUANT, 1),
    new Ability(Abilities.HUSTLE, "Hustle", "Boosts the Attack stat, but lowers accuracy.", 3)
      .attr(BattleStatMultiplierAbAttr, BattleStat.ATK, 1.5)
      .attr(BattleStatMultiplierAbAttr, BattleStat.ACC, 0.8),
    new Ability(Abilities.CUTE_CHARM, "Cute Charm", "Contact with the Pokémon may cause infatuation.", 3)
      .attr(PostDefendContactApplyTagChanceAbAttr, 30, BattlerTagType.INFATUATED),
    new Ability(Abilities.PLUS, "Plus (N)", "Boosts the Sp. Atk stat of the Pokémon if an ally\nwith the Plus or Minus Ability is also in battle.", 3),
    new Ability(Abilities.MINUS, "Minus (N)", "Boosts the Sp. Atk stat of the Pokémon if an ally\nwith the Plus or Minus Ability is also in battle.", 3),
    new Ability(Abilities.FORECAST, "Forecast (N)", "The Pokémon transforms with the weather to change\nits type to Water, Fire, or Ice.", 3),
    new Ability(Abilities.STICKY_HOLD, "Sticky Hold", "Items held by the Pokémon are stuck fast and\ncannot be removed by other Pokémon.", 3)
      .attr(BlockItemTheftAbAttr),
    new Ability(Abilities.SHED_SKIN, "Shed Skin (N)", "The Pokémon may heal its own status conditions\nby shedding its skin.", 3),
    new Ability(Abilities.GUTS, "Guts (N)", "It's so gutsy that having a status condition boosts\nthe Pokémon's Attack stat.", 3),
    new Ability(Abilities.MARVEL_SCALE, "Marvel Scale (N)", "The Pokémon's marvelous scales boost the Defense\nstat if it has a status condition.", 3),
    new Ability(Abilities.LIQUID_OOZE, "Liquid Ooze (N)", "The oozed liquid has a strong stench, which damages\nattackers using any draining move.", 3),
    new Ability(Abilities.OVERGROW, "Overgrow", "Powers up Grass-type moves when the Pokémon's\nHP is low.", 3)
      .attr(LowHpMoveTypePowerBoostAbAttr, Type.GRASS),
    new Ability(Abilities.BLAZE, "Blaze", "Powers up Fire-type moves when the Pokémon's HP\nis low.", 3)
      .attr(LowHpMoveTypePowerBoostAbAttr, Type.FIRE),
    new Ability(Abilities.TORRENT, "Torrent", "Powers up Water-type moves when the Pokémon's\nHP is low.", 3)
      .attr(LowHpMoveTypePowerBoostAbAttr, Type.WATER),
    new Ability(Abilities.SWARM, "Swarm", "Powers up Bug-type moves when the Pokémon's HP\nis low.", 3)
      .attr(LowHpMoveTypePowerBoostAbAttr, Type.BUG),
    new Ability(Abilities.ROCK_HEAD, "Rock Head", "Protects the Pokémon from recoil damage.", 3)
      .attr(BlockRecoilDamageAttr),
    new Ability(Abilities.DROUGHT, "Drought", "Turns the sunlight harsh when the Pokémon enters\na battle.", 3)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SUNNY),
    new Ability(Abilities.ARENA_TRAP, "Arena Trap", "Prevents opposing Pokémon from fleeing.", 3)
      .attr(ArenaTrapAbAttr),
    new Ability(Abilities.VITAL_SPIRIT, "Vital Spirit", "The Pokémon is full of vitality, and that prevents\nit from falling asleep.", 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY),
    new Ability(Abilities.WHITE_SMOKE, "White Smoke", "The Pokémon is protected by its white smoke, which\nprevents other Pokémon from lowering its stats.", 3)
      .attr(ProtectStatAbAttr),
    new Ability(Abilities.PURE_POWER, "Pure Power", "Using its pure power, the Pokémon doubles its\nAttack stat.", 3)
      .attr(PostSummonStatChangeAbAttr, BattleStat.ATK, 2, true),
    new Ability(Abilities.SHELL_ARMOR, "Shell Armor", "A hard shell protects the Pokémon from critical hits.", 3)
      .attr(BlockCritAbAttr),
    new Ability(Abilities.AIR_LOCK, "Air Lock", "Eliminates the effects of weather.", 3)
      .attr(SuppressWeatherEffectAbAttr, true),
    new Ability(Abilities.TANGLED_FEET, "Tangled Feet (N)", "Raises evasiveness if the Pokémon is confused.", 4),
    new Ability(Abilities.MOTOR_DRIVE, "Motor Drive", "Boosts its Speed stat if hit by an Electric-type move\ninstead of taking damage.", 4)
      .attr(TypeImmunityStatChangeAbAttr, Type.ELECTRIC, BattleStat.SPD, 1),
    new Ability(Abilities.RIVALRY, "Rivalry (N)", "Becomes competitive and deals more damage to\nPokémon of the same gender, but deals less to\nPokémon of the opposite gender.", 4),
    new Ability(Abilities.STEADFAST, "Steadfast (N)", "The Pokémon's determination boosts the Speed\nstat each time the Pokémon flinches.", 4),
    new Ability(Abilities.SNOW_CLOAK, "Snow Cloak", "Boosts evasiveness in a hailstorm.", 4)
      .attr(BattleStatMultiplierAbAttr, BattleStat.EVA, 1.2)
      .attr(BlockWeatherDamageAttr, WeatherType.HAIL),
    new Ability(Abilities.GLUTTONY, "Gluttony (N)", "Makes the Pokémon eat a held Berry when its HP\ndrops to half or less, which is sooner than usual.", 4),
    new Ability(Abilities.ANGER_POINT, "Anger Point", "The Pokémon is angered when it takes a critical hit,\nand that maxes its Attack stat.", 4)
      .attr(PostDefendCritStatChangeAbAttr, BattleStat.ATK, 6),
    new Ability(Abilities.UNBURDEN, "Unburden (N)", "Boosts the Speed stat if the Pokémon's held item is\nused or lost.", 4),
    new Ability(Abilities.HEATPROOF, "Heatproof", "The heatproof body of the Pokémon halves the\ndamage from Fire-type moves that hit it.", 4)
      .attr(ReceivedTypeDamageMultiplierAbAttr, Type.FIRE, 0.5),
    new Ability(Abilities.SIMPLE, "Simple", "The stat changes the Pokémon receives are doubled.", 4)
      .attr(StatChangeMultiplierAbAttr, 2),
    new Ability(Abilities.DRY_SKIN, "Dry Skin", "Restores HP in rain or when hit by Water-type\nmoves. Reduces HP in harsh sunlight, and increases\nthe damage received from Fire-type moves.", 4)
      .attr(PostWeatherLapseDamageAbAttr, 2, WeatherType.SUNNY, WeatherType.HARSH_SUN)
      .attr(PostWeatherLapseHealAbAttr, 2, WeatherType.RAIN, WeatherType.HEAVY_RAIN)
      .attr(ReceivedTypeDamageMultiplierAbAttr, Type.FIRE, 1.25)
      .attr(TypeImmunityHealAbAttr, Type.WATER),
    new Ability(Abilities.DOWNLOAD, "Download (N)", "Compares an opposing Pokémon's Defense and\nSp. Def stats before raising its own Attack or\nSp. Atk stat—whichever will be more effective.", 4),
    new Ability(Abilities.IRON_FIST, "Iron Fist (N)", "Powers up punching moves.", 4),
    new Ability(Abilities.POISON_HEAL, "Poison Heal (N)", "Restores HP if the Pokémon is poisoned instead of\nlosing HP.", 4),
    new Ability(Abilities.ADAPTABILITY, "Adaptability", "Powers up moves of the same type as the Pokémon.", 4)
      .attr(StabBoostAbAttr),
    new Ability(Abilities.SKILL_LINK, "Skill Link (N)", "Maximizes the number of times multistrike\nmoves hit.", 4),
    new Ability(Abilities.HYDRATION, "Hydration (N)", "Heals status conditions if it's raining.", 4),
    new Ability(Abilities.SOLAR_POWER, "Solar Power", "Boosts the Sp. Atk stat in harsh sunlight, but HP\ndecreases every turn.", 4)
      .attr(PostWeatherLapseDamageAbAttr, 2, WeatherType.SUNNY, WeatherType.HARSH_SUN)
      .attr(BattleStatMultiplierAbAttr, BattleStat.SPATK, 1.5)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN)),
    new Ability(Abilities.QUICK_FEET, "Quick Feet (N)", "Boosts the Speed stat if the Pokémon has a\nstatus condition.", 4),
    new Ability(Abilities.NORMALIZE, "Normalize (N)", "All the Pokémon's moves become Normal type.\nThe power of those moves is boosted a little.", 4),
    new Ability(Abilities.SNIPER, "Sniper (N)", "Powers up moves if they become critical hits\nwhen attacking.", 4),
    new Ability(Abilities.MAGIC_GUARD, "Magic Guard (N)", "The Pokémon only takes damage from attacks.", 4),
    new Ability(Abilities.NO_GUARD, "No Guard (N)", "The Pokémon employs no-guard tactics to ensure\nincoming and outgoing attacks always land.", 4),
    new Ability(Abilities.STALL, "Stall (N)", "The Pokémon moves after all other Pokémon do.", 4),
    new Ability(Abilities.TECHNICIAN, "Technician (N)", "Powers up the Pokémon's weaker moves.", 4),
    new Ability(Abilities.LEAF_GUARD, "Leaf Guard", "Prevents status conditions in harsh sunlight.", 4)
      .attr(StatusEffectImmunityAbAttr)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN)),
    new Ability(Abilities.KLUTZ, "Klutz (N)", "The Pokémon can't use any held items.", 4),
    new Ability(Abilities.MOLD_BREAKER, "Mold Breaker (N)", "Moves can be used on the target regardless of\nits Abilities.", 4),
    new Ability(Abilities.SUPER_LUCK, "Super Luck (N)", "The Pokémon is so lucky that the critical-hit ratios\nof its moves are boosted.", 4),
    new Ability(Abilities.AFTERMATH, "Aftermath (N)", "Damages the attacker if it contacts the Pokémon\nwith a finishing hit.", 4),
    new Ability(Abilities.ANTICIPATION, "Anticipation (N)", "The Pokémon can sense an opposing Pokémon's\ndangerous moves.", 4),
    new Ability(Abilities.FOREWARN, "Forewarn (N)", "When it enters a battle, the Pokémon can tell one of\nthe moves an opposing Pokémon has.", 4),
    new Ability(Abilities.UNAWARE, "Unaware", "When attacking, the Pokémon ignores the target\nPokémon's stat changes.", 4)
      .attr(IgnoreOpponentStatChangesAbAttr),
    new Ability(Abilities.TINTED_LENS, "Tinted Lens (N)", "The Pokémon can use \"not very effective\" moves\nto deal regular damage.", 4),
    new Ability(Abilities.FILTER, "Filter (N)", "Reduces the power of supereffective attacks taken.", 4),
    new Ability(Abilities.SLOW_START, "Slow Start (N)", "For five turns, the Pokémon's Attack and Speed\nstats are halved.", 4),
    new Ability(Abilities.SCRAPPY, "Scrappy (N)", "The Pokémon can hit Ghost-type Pokémon with\nNormal- and Fighting-type moves.", 4),
    new Ability(Abilities.STORM_DRAIN, "Storm Drain", "Draws in all Water-type moves. Instead of being hit\nby Water-type moves, it boosts its Sp. Atk.", 4)
      .attr(TypeImmunityStatChangeAbAttr, Type.WATER, BattleStat.SPATK, 1),
    new Ability(Abilities.ICE_BODY, "Ice Body", "The Pokémon gradually regains HP in a hailstorm.", 4)
      .attr(PostWeatherLapseHealAbAttr, 1, WeatherType.HAIL),
    new Ability(Abilities.SOLID_ROCK, "Solid Rock (N)", "Reduces the power of supereffective attacks taken.", 4),
    new Ability(Abilities.SNOW_WARNING, "Snow Warning", "The Pokémon summons a hailstorm when it enters\na battle.", 4)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.HAIL),
    new Ability(Abilities.HONEY_GATHER, "Honey Gather (N)", "The Pokémon may gather Honey after a battle.", 4),
    new Ability(Abilities.FRISK, "Frisk (N)", "When it enters a battle, the Pokémon can check an\nopposing Pokémon's held item.", 4),
    new Ability(Abilities.RECKLESS, "Reckless", "Powers up moves that have recoil damage.", 4)
      .attr(RecoilMovePowerBoostAbAttr),
    new Ability(Abilities.MULTITYPE, "Multitype (N)", "Changes the Pokémon's type to match the Plate or\nZ-Crystal it holds.", 4),
    new Ability(Abilities.FLOWER_GIFT, "Flower Gift (N)", "Boosts the Attack and Sp. Def stats of itself\nand allies in harsh sunlight.", 4),
    new Ability(Abilities.BAD_DREAMS, "Bad Dreams (N)", "Reduces the HP of sleeping opposing Pokémon.", 4),
    new Ability(Abilities.PICKPOCKET, "Pickpocket (N)", "Steals an item from an attacker that made\ndirect contact.", 5),
    new Ability(Abilities.SHEER_FORCE, "Sheer Force (N)", "Removes additional effects to increase the power\nof moves when attacking.", 5),
    new Ability(Abilities.CONTRARY, "Contrary", "Makes stat changes have an opposite effect.", 5)
      .attr(StatChangeMultiplierAbAttr, -1),
    new Ability(Abilities.UNNERVE, "Unnerve (N)", "Unnerves opposing Pokémon and makes them unable\nto eat Berries.", 5),
    new Ability(Abilities.DEFIANT, "Defiant (N)", "Boosts the Pokémon's Attack stat sharply when its\nstats are lowered.", 5),
    new Ability(Abilities.DEFEATIST, "Defeatist (N)", "Halves the Pokémon's Attack and Sp. Atk stats\nwhen its HP becomes half or less.", 5),
    new Ability(Abilities.CURSED_BODY, "Cursed Body (N)", "May disable a move used on the Pokémon.", 5),
    new Ability(Abilities.HEALER, "Healer (N)", "Sometimes heals an ally's status condition.", 5),
    new Ability(Abilities.FRIEND_GUARD, "Friend Guard (N)", "Reduces damage done to allies.", 5),
    new Ability(Abilities.WEAK_ARMOR, "Weak Armor (N)", "Physical attacks to the Pokémon lower its Defense\nstat but sharply raise its Speed stat.", 5),
    new Ability(Abilities.HEAVY_METAL, "Heavy Metal (N)", "Doubles the Pokémon's weight.", 5),
    new Ability(Abilities.LIGHT_METAL, "Light Metal (N)", "Halves the Pokémon's weight.", 5),
    new Ability(Abilities.MULTISCALE, "Multiscale (N)", "Reduces the amount of damage the Pokémon takes\nwhile its HP is full.", 5),
    new Ability(Abilities.TOXIC_BOOST, "Toxic Boost (N)", "Powers up physical attacks when the Pokémon\nis poisoned.", 5),
    new Ability(Abilities.FLARE_BOOST, "Flare Boost (N)", "Powers up special attacks when the Pokémon\nis burned.", 5),
    new Ability(Abilities.HARVEST, "Harvest (N)", "May create another Berry after one is used.", 5),
    new Ability(Abilities.TELEPATHY, "Telepathy (N)", "Anticipates an ally's attack and dodges it.", 5),
    new Ability(Abilities.MOODY, "Moody (N)", "Raises one stat sharply and lowers another\nevery turn.", 5),
    new Ability(Abilities.OVERCOAT, "Overcoat", "Protects the Pokémon from things like sand, hail,\nand powder.", 5)
      .attr(BlockWeatherDamageAttr),
    new Ability(Abilities.POISON_TOUCH, "Poison Touch", "May poison a target when the Pokémon\nmakes contact.", 5)
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.POISON),
    new Ability(Abilities.REGENERATOR, "Regenerator (N)", "Restores a little HP when withdrawn from battle.", 5),
    new Ability(Abilities.BIG_PECKS, "Big Pecks", "Protects the Pokémon from\nDefense-lowering effects.", 5)
      .attr(ProtectStatAbAttr, BattleStat.DEF),
    new Ability(Abilities.SAND_RUSH, "Sand Rush", "Boosts the Pokémon's Speed stat in a sandstorm.", 5)
      .attr(BattleStatMultiplierAbAttr, BattleStat.SPD, 2)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM)),
    new Ability(Abilities.WONDER_SKIN, "Wonder Skin (N)", "Makes status moves more likely to miss.", 5),
    new Ability(Abilities.ANALYTIC, "Analytic (N)", "Boosts move power when the Pokémon moves last.", 5),
    new Ability(Abilities.ILLUSION, "Illusion (N)", "Comes out disguised as the Pokémon in the party's\nlast spot.", 5),
    new Ability(Abilities.IMPOSTER, "Imposter", "The Pokémon transforms itself into the Pokémon\nit's facing.", 5)
      .attr(PostSummonTransformAbAttr),
    new Ability(Abilities.INFILTRATOR, "Infiltrator (N)", "Passes through the opposing Pokémon's barrier,\nsubstitute, and the like and strikes.", 5),
    new Ability(Abilities.MUMMY, "Mummy (N)", "Contact with the Pokémon changes the attacker's\nAbility to Mummy.", 5),
    new Ability(Abilities.MOXIE, "Moxie (N)", "The Pokémon shows moxie, and that boosts the\nAttack stat after knocking out any Pokémon.", 5),
    new Ability(Abilities.JUSTIFIED, "Justified (N)", "Being hit by a Dark-type move boosts the Attack\nstat of the Pokémon, for justice.", 5),
    new Ability(Abilities.RATTLED, "Rattled (N)", "Dark-, Ghost-, and Bug-type moves scare the\nPokémon and boost its Speed stat.", 5),
    new Ability(Abilities.MAGIC_BOUNCE, "Magic Bounce (N)", "Reflects status moves instead of getting hit\nby them.", 5),
    new Ability(Abilities.SAP_SIPPER, "Sap Sipper", "Boosts the Attack stat if hit by a Grass-type move\ninstead of taking damage.", 5)
      .attr(TypeImmunityStatChangeAbAttr, Type.GRASS, BattleStat.ATK, 1),
    new Ability(Abilities.PRANKSTER, "Prankster (N)", "Gives priority to a status move.", 5),
    new Ability(Abilities.SAND_FORCE, "Sand Force (N)", "Boosts the power of Rock-, Ground-, and Steel-type\nmoves in a sandstorm.", 5),
    new Ability(Abilities.IRON_BARBS, "Iron Barbs (N)", "Inflicts damage on the attacker upon contact with\niron barbs.", 5),
    new Ability(Abilities.ZEN_MODE, "Zen Mode (N)", "Changes the Pokémon's shape when HP is half\nor less.", 5),
    new Ability(Abilities.VICTORY_STAR, "Victory Star (N)", "Boosts the accuracy of its allies and itself.", 5),
    new Ability(Abilities.TURBOBLAZE, "Turboblaze (N)", "Moves can be used on the target regardless of\nits Abilities.", 5),
    new Ability(Abilities.TERAVOLT, "Teravolt (N)", "Moves can be used on the target regardless of\nits Abilities.", 5),
    new Ability(Abilities.AROMA_VEIL, "Aroma Veil (N)", "Protects itself and its allies from attacks that limit\ntheir move choices.", 6),
    new Ability(Abilities.FLOWER_VEIL, "Flower Veil (N)", "Ally Grass-type Pokémon are protected from\nstatus conditions and the lowering of their stats.", 6),
    new Ability(Abilities.CHEEK_POUCH, "Cheek Pouch (N)", "Restores HP as well when the Pokémon eats a Berry.", 6),
    new Ability(Abilities.PROTEAN, "Protean (N)", "Changes the Pokémon's type to the type of the\nmove it's about to use.", 6),
    new Ability(Abilities.FUR_COAT, "Fur Coat (N)", "Halves the damage from physical moves.", 6),
    new Ability(Abilities.MAGICIAN, "Magician (N)", "The Pokémon steals the held item of a Pokémon it\nhits with a move.", 6),
    new Ability(Abilities.BULLETPROOF, "Bulletproof (N)", "Protects the Pokémon from some ball and\nbomb moves.", 6),
    new Ability(Abilities.COMPETITIVE, "Competitive (N)", "Boosts the Sp. Atk stat sharply when a stat\nis lowered.", 6),
    new Ability(Abilities.STRONG_JAW, "Strong Jaw (N)", "The Pokémon's strong jaw boosts the power of its\nbiting moves.", 6),
    new Ability(Abilities.REFRIGERATE, "Refrigerate (N)", "Normal-type moves become Ice-type moves.\nThe power of those moves is boosted a little.", 6),
    new Ability(Abilities.SWEET_VEIL, "Sweet Veil (N)", "Prevents itself and ally Pokémon from falling asleep.", 6),
    new Ability(Abilities.STANCE_CHANGE, "Stance Change (N)", "The Pokémon changes its form to Blade Forme when\nit uses an attack move and changes to Shield Forme\nwhen it uses King's Shield.", 6),
    new Ability(Abilities.GALE_WINGS, "Gale Wings (N)", "Gives priority to Flying-type moves when\nthe Pokémon's HP is full.", 6),
    new Ability(Abilities.MEGA_LAUNCHER, "Mega Launcher (N)", "Powers up aura and pulse moves.", 6),
    new Ability(Abilities.GRASS_PELT, "Grass Pelt (N)", "Boosts the Pokémon's Defense stat on\nGrassy Terrain.", 6),
    new Ability(Abilities.SYMBIOSIS, "Symbiosis (N)", "The Pokémon passes its item to an ally that has\nused up an item.", 6),
    new Ability(Abilities.TOUGH_CLAWS, "Tough Claws (N)", "Powers up moves that make direct contact.", 6),
    new Ability(Abilities.PIXILATE, "Pixilate (N)", "Normal-type moves become Fairy-type moves.\nThe power of those moves is boosted a little.", 6),
    new Ability(Abilities.GOOEY, "Gooey (N)", "Contact with the Pokémon lowers the attacker's\nSpeed stat.", 6),
    new Ability(Abilities.AERILATE, "Aerilate (N)", "Normal-type moves become Flying-type moves.\nThe power of those moves is boosted a little.", 6),
    new Ability(Abilities.PARENTAL_BOND, "Parental Bond (N)", "Parent and child each attacks.", 6),
    new Ability(Abilities.DARK_AURA, "Dark Aura (N)", "Powers up each Pokémon's Dark-type moves.", 6),
    new Ability(Abilities.FAIRY_AURA, "Fairy Aura (N)", "Powers up each Pokémon's Fairy-type moves.", 6),
    new Ability(Abilities.AURA_BREAK, "Aura Break (N)", "The effects of \"Aura\" Abilities are reversed\nto lower the power of affected moves.", 6),
    new Ability(Abilities.PRIMORDIAL_SEA, "Primordial Sea", "The Pokémon changes the weather to nullify\nFire-type attacks.", 6)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.HEAVY_RAIN),
    new Ability(Abilities.DESOLATE_LAND, "Desolate Land", "The Pokémon changes the weather to nullify\nWater-type attacks.", 6)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.HARSH_SUN),
    new Ability(Abilities.DELTA_STREAM, "Delta Stream", "The Pokémon changes the weather to eliminate all\nof the Flying type's weaknesses.", 6)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.STRONG_WINDS),
    new Ability(Abilities.STAMINA, "Stamina (N)", "Boosts the Defense stat when hit by an attack.", 7),
    new Ability(Abilities.WIMP_OUT, "Wimp Out (N)", "The Pokémon cowardly switches out when its HP\nbecomes half or less.", 7),
    new Ability(Abilities.EMERGENCY_EXIT, "Emergency Exit (N)", "The Pokémon, sensing danger, switches out when its\nHP becomes half or less.", 7),
    new Ability(Abilities.WATER_COMPACTION, "Water Compaction (N)", "Boosts the Pokémon's Defense stat sharply when hit\nby a Water-type move.", 7),
    new Ability(Abilities.MERCILESS, "Merciless (N)", "The Pokémon's attacks become critical hits if the\ntarget is poisoned.", 7),
    new Ability(Abilities.SHIELDS_DOWN, "Shields Down (N)", "When its HP becomes half or less, the Pokémon's\nshell breaks and it becomes aggressive.", 7),
    new Ability(Abilities.STAKEOUT, "Stakeout (N)", "Doubles the damage dealt to the target's\nreplacement if the target switches out.", 7),
    new Ability(Abilities.WATER_BUBBLE, "Water Bubble (N)", "Lowers the power of Fire-type moves done to the\nPokémon and prevents the Pokémon from getting\na burn.", 7),
    new Ability(Abilities.STEELWORKER, "Steelworker (N)", "Powers up Steel-type moves.", 7),
    new Ability(Abilities.BERSERK, "Berserk (N)", "Boosts the Pokémon's Sp. Atk stat when it takes\na hit that causes its HP to become half or less.", 7),
    new Ability(Abilities.SLUSH_RUSH, "Slush Rush (N)", "Boosts the Pokémon's Speed stat in a hailstorm.", 7)
      .attr(BattleStatMultiplierAbAttr, BattleStat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.HAIL)),
    new Ability(Abilities.LONG_REACH, "Long Reach (N)", "The Pokémon uses its moves without making contact\nwith the target.", 7),
    new Ability(Abilities.LIQUID_VOICE, "Liquid Voice (N)", "All sound-based moves become Water-type moves.", 7),
    new Ability(Abilities.TRIAGE, "Triage (N)", "Gives priority to a healing move.", 7),
    new Ability(Abilities.GALVANIZE, "Galvanize (N)", "Normal-type moves become Electric-type moves.\nThe power of those moves is boosted a little.", 7),
    new Ability(Abilities.SURGE_SURFER, "Surge Surfer (N)", "Doubles the Pokémon's Speed stat on\nElectric Terrain.", 7),
    new Ability(Abilities.SCHOOLING, "Schooling (N)", "When it has a lot of HP, the Pokémon forms a\npowerful school. It stops schooling when its HP\nis low.", 7),
    new Ability(Abilities.DISGUISE, "Disguise (N)", "Once per battle, the shroud that covers the\nPokémon can protect it from an attack.", 7),
    new Ability(Abilities.BATTLE_BOND, "Battle Bond (N)", "Defeating an opposing Pokémon strengthens the\nPokémon's bond with its Trainer, and it becomes\nAsh-Greninja. Water Shuriken gets more powerful.", 7),
    new Ability(Abilities.POWER_CONSTRUCT, "Power Construct (N)", "Other Cells gather to aid when its HP becomes\nhalf or less. Then the Pokémon changes\nits form to Complete Forme.", 7),
    new Ability(Abilities.CORROSION, "Corrosion (N)", "The Pokémon can poison the target even if it's\na Steel or Poison type.", 7),
    new Ability(Abilities.COMATOSE, "Comatose (N)", "It's always drowsing and will never wake up.\nIt can attack without waking up.", 7),
    new Ability(Abilities.QUEENLY_MAJESTY, "Queenly Majesty (N)", "Its majesty pressures the opposing Pokémon,\nmaking it unable to attack using priority moves.", 7),
    new Ability(Abilities.INNARDS_OUT, "Innards Out (N)", "Damages the attacker landing the finishing hit\nby the amount equal to its last HP.", 7),
    new Ability(Abilities.DANCER, "Dancer (N)", "When another Pokémon uses a dance move,\nit can use a dance move following it regardless\nof its Speed.", 7),
    new Ability(Abilities.BATTERY, "Battery (N)", "Powers up ally Pokémon's special moves.", 7),
    new Ability(Abilities.FLUFFY, "Fluffy (N)", "Halves the damage taken from moves that make\ndirect contact, but doubles that of Fire-type moves.", 7),
    new Ability(Abilities.DAZZLING, "Dazzling (N)", "Surprises the opposing Pokémon, making it unable\nto attack using priority moves.", 7),
    new Ability(Abilities.SOUL_HEART, "Soul-Heart (N)", "Boosts its Sp. Atk stat every time a Pokémon faints.", 7),
    new Ability(Abilities.TANGLING_HAIR, "Tangling Hair (N)", "Contact with the Pokémon lowers the attacker's\nSpeed stat.", 7),
    new Ability(Abilities.RECEIVER, "Receiver (N)", "The Pokémon copies the Ability of a defeated ally.", 7),
    new Ability(Abilities.POWER_OF_ALCHEMY, "Power of Alchemy (N)", "The Pokémon copies the Ability of a defeated ally.", 7),
    new Ability(Abilities.BEAST_BOOST, "Beast Boost (N)", "The Pokémon boosts its most proficient stat each\ntime it knocks out a Pokémon.", 7),
    new Ability(Abilities.RKS_SYSTEM, "RKS System (N)", "Changes the Pokémon's type to match the\nmemory disc it holds.", 7),
    new Ability(Abilities.ELECTRIC_SURGE, "Electric Surge (N)", "Turns the ground into Electric Terrain when the\nPokémon enters a battle.", 7),
    new Ability(Abilities.PSYCHIC_SURGE, "Psychic Surge (N)", "Turns the ground into Psychic Terrain when\nthe Pokémon enters a battle.", 7),
    new Ability(Abilities.MISTY_SURGE, "Misty Surge (N)", "Turns the ground into Misty Terrain when\nthe Pokémon enters a battle.", 7),
    new Ability(Abilities.GRASSY_SURGE, "Grassy Surge (N)", "Turns the ground into Grassy Terrain when\nthe Pokémon enters a battle.", 7),
    new Ability(Abilities.FULL_METAL_BODY, "Full Metal Body (N)", "Prevents other Pokémon's moves or Abilities from\nlowering the Pokémon's stats.", 7),
    new Ability(Abilities.SHADOW_SHIELD, "Shadow Shield (N)", "Reduces the amount of damage the Pokémon takes\nwhile its HP is full.", 7),
    new Ability(Abilities.PRISM_ARMOR, "Prism Armor (N)", "Reduces the power of supereffective attacks taken.", 7),
    new Ability(Abilities.NEUROFORCE, "Neuroforce (N)", "Powers up moves that are super effective.", 7),
    new Ability(Abilities.INTREPID_SWORD, "Intrepid Sword (N)", "Boosts the Pokémon's Attack stat when the Pokémon\nenters a battle.", 8),
    new Ability(Abilities.DAUNTLESS_SHIELD, "Dauntless Shield (N)", "Boosts the Pokémon's Defense stat when the Pokémon\nenters a battle.", 8),
    new Ability(Abilities.LIBERO, "Libero (N)", "Changes the Pokémon's type to the type of the\nmove it's about to use.", 8),
    new Ability(Abilities.BALL_FETCH, "Ball Fetch (N)", "If the Pokémon is not holding an item, it will fetch\nthe Poké Ball from the first failed throw\nof the battle.", 8),
    new Ability(Abilities.COTTON_DOWN, "Cotton Down (N)", "When the Pokémon is hit by an attack, it scatters\ncotton fluff around and lowers the Speed stat of\nall Pokémon except itself.", 8),
    new Ability(Abilities.PROPELLER_TAIL, "Propeller Tail (N)", "Ignores the effects of opposing Pokémon's Abilities and\nmoves that draw in moves.", 8),
    new Ability(Abilities.MIRROR_ARMOR, "Mirror Armor (N)", "Bounces back only the stat-lowering effects that\nthe Pokémon receives.", 8),
    new Ability(Abilities.GULP_MISSILE, "Gulp Missile (N)", "When the Pokémon uses Surf or Dive, it will come back\nwith prey. When it takes damage, it will spit out the prey\nto attack.", 8),
    new Ability(Abilities.STALWART, "Stalwart (N)", "Ignores the effects of opposing Pokémon's Abilities and\nmoves that draw in moves.", 8),
    new Ability(Abilities.STEAM_ENGINE, "Steam Engine (N)", "Boosts the Pokémon's Speed stat drastically if hit by a\nFire- or Water-type move.", 8),
    new Ability(Abilities.PUNK_ROCK, "Punk Rock (N)", "Boosts the power of sound-based moves.\nThe Pokémon also takes half the damage from\nthese kinds of moves.", 8),
    new Ability(Abilities.SAND_SPIT, "Sand Spit (N)", "The Pokémon creates a sandstorm when it's hit by\nan attack.", 8),
    new Ability(Abilities.ICE_SCALES, "Ice Scales (N)", "The Pokémon is protected by ice scales, which halve\nthe damage taken from special moves.", 8),
    new Ability(Abilities.RIPEN, "Ripen (N)", "Ripens Berries and doubles their effect.", 8),
    new Ability(Abilities.ICE_FACE, "Ice Face (N)", "The Pokémon's ice head can take a physical attack as\na substitute, but the attack also changes the Pokémon's\nappearance. The ice will be restored when it hails.", 8),
    new Ability(Abilities.POWER_SPOT, "Power Spot (N)", "Just being next to the Pokémon powers up moves.", 8),
    new Ability(Abilities.MIMICRY, "Mimicry (N)", "Changes the Pokémon's type depending on the terrain.", 8),
    new Ability(Abilities.SCREEN_CLEANER, "Screen Cleaner (N)", "When the Pokémon enters a battle, the effects of\nLight Screen, Reflect, and Aurora Veil are nullified for\nboth opposing and ally Pokémon.", 8),
    new Ability(Abilities.STEELY_SPIRIT, "Steely Spirit (N)", "Powers up ally Pokémon's Steel-type moves.", 8),
    new Ability(Abilities.PERISH_BODY, "Perish Body (N)", "When hit by a move that makes direct contact,\nthe Pokémon and the attacker will faint after three turns\nunless they switch out of battle.", 8),
    new Ability(Abilities.WANDERING_SPIRIT, "Wandering Spirit (N)", "The Pokémon exchanges Abilities with a Pokémon\nthat hits it with a move that makes direct contact.", 8),
    new Ability(Abilities.GORILLA_TACTICS, "Gorilla Tactics (N)", "Boosts the Pokémon's Attack stat but only allows\nthe use of the first selected move.", 8),
    new Ability(Abilities.NEUTRALIZING_GAS, "Neutralizing Gas (N)", "If the Pokémon with Neutralizing Gas is in the battle,\nthe effects of all Pokémon's Abilities will be nullified\nor will not be triggered.", 8),
    new Ability(Abilities.PASTEL_VEIL, "Pastel Veil (N)", "Protects the Pokémon and its ally Pokémon from\nbeing poisoned.", 8),
    new Ability(Abilities.HUNGER_SWITCH, "Hunger Switch (N)", "The Pokémon changes its form, alternating between\nits Full Belly Mode and Hangry Mode after the end of\neach turn.", 8),
    new Ability(Abilities.QUICK_DRAW, "Quick Draw (N)", "Enables the Pokémon to move first occasionally.", 8),
    new Ability(Abilities.UNSEEN_FIST, "Unseen Fist (N)", "If the Pokémon uses moves that make direct contact,\nit can attack the target even if the target protects itself.", 8),
    new Ability(Abilities.CURIOUS_MEDICINE, "Curious Medicine (N)", "When the Pokémon enters a battle, it scatters medicine\nfrom its shell, which removes all stat changes\nfrom allies.", 8),
    new Ability(Abilities.TRANSISTOR, "Transistor (N)", "Powers up Electric-type moves.", 8),
    new Ability(Abilities.DRAGONS_MAW, "Dragon's Maw (N)", "Powers up Dragon-type moves.", 8),
    new Ability(Abilities.CHILLING_NEIGH, "Chilling Neigh (N)", "When the Pokémon knocks out a target, it utters a\nchilling neigh, which boosts its Attack stat.", 8),
    new Ability(Abilities.GRIM_NEIGH, "Grim Neigh (N)", "When the Pokémon knocks out a target, it utters a\nterrifying neigh, which boosts its Sp. Atk stat.", 8),
    new Ability(Abilities.AS_ONE_GLASTRIER, "As One (N)", "This Ability combines the effects of both Calyrex's\nUnnerve Ability and Glastrier's Chilling Neigh Ability.", 8),
    new Ability(Abilities.AS_ONE_SPECTRIER, "As One (N)", "This Ability combines the effects of both Calyrex's\nUnnerve Ability and Spectrier's Grim Neigh Ability.", 8),
    new Ability(Abilities.LINGERING_AROMA, "Lingering Aroma (N)", "", 9),
    new Ability(Abilities.SEED_SOWER, "Seed Sower (N)", "", 9),
    new Ability(Abilities.THERMAL_EXCHANGE, "Thermal Exchange (N)", "", 9),
    new Ability(Abilities.ANGER_SHELL, "Anger Shell (N)", "", 9),
    new Ability(Abilities.PURIFYING_SALT, "Purifying Salt (N)", "", 9),
    new Ability(Abilities.WELL_BAKED_BODY, "Well-Baked Body (N)", "", 9),
    new Ability(Abilities.WIND_RIDER, "Wind Rider (N)", "", 9),
    new Ability(Abilities.GUARD_DOG, "Guard Dog (N)", "", 9),
    new Ability(Abilities.ROCKY_PAYLOAD, "Rocky Payload (N)", "", 9),
    new Ability(Abilities.WIND_POWER, "Wind Power (N)", "", 9),
    new Ability(Abilities.ZERO_TO_HERO, "Zero to Hero (N)", "", 9),
    new Ability(Abilities.COMMANDER, "Commander (N)", "", 9),
    new Ability(Abilities.ELECTROMORPHOSIS, "Electromorphosis (N)", "", 9),
    new Ability(Abilities.PROTOSYNTHESIS, "Protosynthesis (N)", "", 9),
    new Ability(Abilities.QUARK_DRIVE, "Quark Drive (N)", "", 9),
    new Ability(Abilities.GOOD_AS_GOLD, "Good as Gold (N)", "", 9),
    new Ability(Abilities.VESSEL_OF_RUIN, "Vessel of Ruin (N)", "", 9),
    new Ability(Abilities.SWORD_OF_RUIN, "Sword of Ruin (N)", "", 9),
    new Ability(Abilities.TABLETS_OF_RUIN, "Tablets of Ruin (N)", "", 9),
    new Ability(Abilities.BEADS_OF_RUIN, "Beads of Ruin (N)", "", 9),
    new Ability(Abilities.ORICHALCUM_PULSE, "Orichalcum Pulse (N)", "", 9),
    new Ability(Abilities.HADRON_ENGINE, "Hadron Engine (N)", "", 9),
    new Ability(Abilities.OPPORTUNIST, "Opportunist (N)", "", 9),
    new Ability(Abilities.CUD_CHEW, "Cud Chew (N)", "", 9),
    new Ability(Abilities.SHARPNESS, "Sharpness (N)", "", 9),
    new Ability(Abilities.SUPREME_OVERLORD, "Supreme Overlord (N)", "", 9),
    new Ability(Abilities.COSTAR, "Costar (N)", "", 9),
    new Ability(Abilities.TOXIC_DEBRIS, "Toxic Debris (N)", "", 9),
    new Ability(Abilities.ARMOR_TAIL, "Armor Tail (N)", "", 9),
    new Ability(Abilities.EARTH_EATER, "Earth Eater (N)", "", 9),
    new Ability(Abilities.MYCELIUM_MIGHT, "Mycelium Might (N)", "", 9),
    new Ability(Abilities.MINDS_EYE, "Mind's Eye (N)", "", 9),
    new Ability(Abilities.SUPERSWEET_SYRUP, "Supersweet Syrup (N)", "", 9),
    new Ability(Abilities.HOSPITALITY, "Hospitality (N)", "", 9),
    new Ability(Abilities.TOXIC_CHAIN, "Toxic Chain (N)", "", 9),
    new Ability(Abilities.EMBODY_ASPECT, "Embody Aspect (N)", "", 9),
    new Ability(Abilities.MOUNTAINEER, "Mountaineer (N)", "", 5),
    new Ability(Abilities.WAVE_RIDER, "Wave Rider (N)", "", 5),
    new Ability(Abilities.SKATER, "Skater (N)", "", 5),
    new Ability(Abilities.THRUST, "Thrust (N)", "", 5),
    new Ability(Abilities.PERCEPTION, "Perception (N)", "", 5),
    new Ability(Abilities.PARRY, "Parry (N)", "", 5),
    new Ability(Abilities.INSTINCT, "Instinct (N)", "", 5),
    new Ability(Abilities.DODGE, "Dodge (N)", "", 5),
    new Ability(Abilities.JAGGED_EDGE, "Jagged Edge (N)", "", 5),
    new Ability(Abilities.FROSTBITE, "Frostbite (N)", "", 5),
    new Ability(Abilities.TENACITY, "Tenacity (N)", "", 5),
    new Ability(Abilities.PRIDE, "Pride (N)", "", 5),
    new Ability(Abilities.DEEP_SLEEP, "Deep Sleep (N)", "", 5),
    new Ability(Abilities.POWER_NAP, "Power Nap (N)", "", 5),
    new Ability(Abilities.SPIRIT, "Spirit (N)", "", 5),
    new Ability(Abilities.WARM_BLANKET, "Warm Blanket (N)", "", 5),
    new Ability(Abilities.GULP, "Gulp (N)", "", 5),
    new Ability(Abilities.HERBIVORE, "Herbivore (N)", "", 5),
    new Ability(Abilities.SANDPIT, "Sandpit (N)", "", 5),
    new Ability(Abilities.HOT_BLOODED, "Hot Blooded (N)", "", 5),
    new Ability(Abilities.MEDIC, "Medic (N)", "", 5),
    new Ability(Abilities.LIFE_FORCE, "Life Force (N)", "", 5),
    new Ability(Abilities.LUNCHBOX, "Lunchbox (N)", "", 5),
    new Ability(Abilities.NURSE, "Nurse (N)", "", 5),
    new Ability(Abilities.MELEE, "Melee (N)", "", 5),
    new Ability(Abilities.SPONGE, "Sponge (N)", "", 5),
    new Ability(Abilities.BODYGUARD, "Bodyguard (N)", "", 5),
    new Ability(Abilities.HERO, "Hero (N)", "", 5),
    new Ability(Abilities.LAST_BASTION, "Last Bastion (N)", "", 5),
    new Ability(Abilities.STEALTH, "Stealth (N)", "", 5),
    new Ability(Abilities.VANGUARD, "Vanguard (N)", "", 5),
    new Ability(Abilities.NOMAD, "Nomad (N)", "", 5),
    new Ability(Abilities.SEQUENCE, "Sequence (N)", "", 5),
    new Ability(Abilities.GRASS_CLOAK, "Grass Cloak (N)", "", 5),
    new Ability(Abilities.CELEBRATE, "Celebrate (N)", "", 5),
    new Ability(Abilities.LULLABY, "Lullaby (N)", "", 5),
    new Ability(Abilities.CALMING, "Calming (N)", "", 5),
    new Ability(Abilities.DAZE, "Daze (N)", "", 5),
    new Ability(Abilities.FRIGHTEN, "Frighten (N)", "", 5),
    new Ability(Abilities.INTERFERENCE, "Interference (N)", "", 5),
    new Ability(Abilities.MOOD_MAKER, "Mood Maker (N)", "", 5),
    new Ability(Abilities.CONFIDENCE, "Confidence (N)", "", 5),
    new Ability(Abilities.FORTUNE, "Fortune (N)", "", 5),
    new Ability(Abilities.BONANZA, "Bonanza (N)", "", 5),
    new Ability(Abilities.EXPLODE, "Explode (N)", "", 5),
    new Ability(Abilities.OMNIPOTENT, "Omnipotent (N)", "", 5),
    new Ability(Abilities.SHARE, "Share (N)", "", 5),
    new Ability(Abilities.BLACK_HOLE, "Black Hole (N)", "", 5),
    new Ability(Abilities.SHADOW_DASH, "Shadow Dash (N)", "", 5),
    new Ability(Abilities.SPRINT, "Sprint (N)", "", 5),
    new Ability(Abilities.DISGUST, "Disgust (N)", "", 5),
    new Ability(Abilities.HIGH_RISE, "High-rise (N)", "", 5),
    new Ability(Abilities.CLIMBER, "Climber (N)", "", 5),
    new Ability(Abilities.FLAME_BOOST, "Flame Boost (N)", "", 5),
    new Ability(Abilities.AQUA_BOOST, "Aqua Boost (N)", "", 5),
    new Ability(Abilities.RUN_UP, "Run Up (N)", "", 5),
    new Ability(Abilities.CONQUEROR, "Conqueror (N)", "", 5),
    new Ability(Abilities.SHACKLE, "Shackle (N)", "", 5),
    new Ability(Abilities.DECOY, "Decoy (N)", "", 5),
    new Ability(Abilities.SHIELD, "Shield (N)", "", 5)
  );
}