import Pokemon, { HitResult, PokemonMove } from "../field/pokemon";
import { Type } from "./type";
import * as Utils from "../utils";
import { BattleStat, getBattleStatName } from "./battle-stat";
import { PokemonHealPhase, ShowAbilityPhase, StatChangePhase } from "../phases";
import { getPokemonMessage } from "../messages";
import { Weather, WeatherType } from "./weather";
import { BattlerTag } from "./battler-tags";
import { BattlerTagType } from "./enums/battler-tag-type";
import { StatusEffect, getStatusEffectDescriptor, getStatusEffectHealText } from "./status-effect";
import { Gender } from "./gender";
import Move, { AttackMove, MoveCategory, MoveFlags, MoveTarget, RecoilAttr, StatusMoveTypeImmunityAttr, FlinchAttr, OneHitKOAttr, HitHealAttr, StrengthSapHealAttr, allMoves } from "./move";
import { ArenaTagSide, ArenaTrapTag } from "./arena-tag";
import { ArenaTagType } from "./enums/arena-tag-type";
import { Stat } from "./pokemon-stat";
import { PokemonHeldItemModifier } from "../modifier/modifier";
import { Moves } from "./enums/moves";
import { TerrainType } from "./terrain";
import { SpeciesFormChangeManualTrigger } from "./pokemon-forms";
import { Abilities } from "./enums/abilities";
import i18next, { Localizable } from "#app/plugins/i18n.js";
import { Command } from "../ui/command-ui-handler";

export class Ability implements Localizable {
  public id: Abilities;

  private nameAppend: string;
  public name: string;
  public description: string;
  public generation: integer;
  public isBypassFaint: boolean;
  public isIgnorable: boolean;
  public attrs: AbAttr[];
  public conditions: AbAttrCondition[];

  constructor(id: Abilities, generation: integer) {
    this.id = id;

    this.nameAppend = '';
    this.generation = generation;
    this.attrs = [];
    this.conditions = [];

    this.localize();
  }

  localize(): void {
    const i18nKey = Abilities[this.id].split('_').filter(f => f).map((f, i) => i ? `${f[0]}${f.slice(1).toLowerCase()}` : f.toLowerCase()).join('') as string;

    this.name = this.id ? `${i18next.t(`ability:${i18nKey}.name`) as string}${this.nameAppend}` : '';
    this.description = this.id ? i18next.t(`ability:${i18nKey}.description`) as string : '';
  }

  getAttrs(attrType: { new(...args: any[]): AbAttr }): AbAttr[] {
    return this.attrs.filter(a => a instanceof attrType);
  }

  attr<T extends new (...args: any[]) => AbAttr>(AttrType: T, ...args: ConstructorParameters<T>): Ability {
    const attr = new AttrType(...args);
    this.attrs.push(attr);

    return this;
  }

  conditionalAttr<T extends new (...args: any[]) => AbAttr>(condition: AbAttrCondition, AttrType: T, ...args: ConstructorParameters<T>): Ability {
    const attr = new AttrType(...args);
    attr.addCondition(condition);
    this.attrs.push(attr);
    
    return this;
  }
  
  hasAttr(attrType: { new(...args: any[]): AbAttr }): boolean {
    return !!this.getAttrs(attrType).length;
  }

  bypassFaint(): Ability {
    this.isBypassFaint = true;
    return this;
  }

  ignorable(): Ability {
    this.isIgnorable = true;
    return this;
  }

  condition(condition: AbAttrCondition): Ability {
    this.conditions.push(condition);

    return this;
  }

  partial(): this {
    this.nameAppend += ' (P)';
    return this;
  }

  unimplemented(): this {
    this.nameAppend += ' (N)';
    return this;
  }
}

type AbAttrApplyFunc<TAttr extends AbAttr> = (attr: TAttr, passive: boolean) => boolean | Promise<boolean>;
type AbAttrCondition = (pokemon: Pokemon) => boolean;

type PokemonAttackCondition = (user: Pokemon, target: Pokemon, move: Move) => boolean;
type PokemonDefendCondition = (target: Pokemon, user: Pokemon, move: Move) => boolean;
type PokemonStatChangeCondition = (target: Pokemon, statsChanged: BattleStat[], levels: integer) => boolean;

export abstract class AbAttr {
  public showAbility: boolean;
  private extraCondition: AbAttrCondition;

  constructor(showAbility: boolean = true) {
    this.showAbility = showAbility;
  }
  
  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean | Promise<boolean> {
    return false;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return null;
  }

  getCondition(): AbAttrCondition {
    return this.extraCondition || null;
  }

  addCondition(condition: AbAttrCondition): AbAttr {
    this.extraCondition = condition;
    return this;
  }
}

export class BlockRecoilDamageAttr extends AbAttr {
  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    cancelled.value = true;

    return true;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]) {
    return getPokemonMessage(pokemon, `'s ${abilityName}\nprotected it from recoil!`);
  }
}

export class DoubleBattleChanceAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    const doubleChance = (args[0] as Utils.IntegerHolder);
    doubleChance.value = Math.max(doubleChance.value / 2, 1);
    return true;
  }
}

export class PostBattleInitAbAttr extends AbAttr {
  applyPostBattleInit(pokemon: Pokemon, passive: boolean, args: any[]): boolean | Promise<boolean> {
    return false;
  }
}

export class PostBattleInitFormChangeAbAttr extends PostBattleInitAbAttr {
  private formFunc: (p: Pokemon) => integer;

  constructor(formFunc: ((p: Pokemon) => integer)) {
    super(true);

    this.formFunc = formFunc;
  }

  applyPostBattleInit(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    const formIndex = this.formFunc(pokemon);
    if (formIndex !== pokemon.formIndex)
      return pokemon.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeManualTrigger, false);

    return false;
  }
}

export class PostBattleInitStatChangeAbAttr extends PostBattleInitAbAttr {
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

  applyPostBattleInit(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
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

type PreDefendAbAttrCondition = (pokemon: Pokemon, attacker: Pokemon, move: PokemonMove) => boolean;

export class PreDefendAbAttr extends AbAttr {
  applyPreDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean | Promise<boolean> {
    return false;
  }
}

export class PreDefendFormChangeAbAttr extends PreDefendAbAttr {
  private formFunc: (p: Pokemon) => integer;

  constructor(formFunc: ((p: Pokemon) => integer)) {
    super(true);

    this.formFunc = formFunc;
  }

  applyPreDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    const formIndex = this.formFunc(pokemon);
    if (formIndex !== pokemon.formIndex) {
      pokemon.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeManualTrigger, false);
      return true;
    }

    return false;
  }
}
export class PreDefendFullHpEndureAbAttr extends PreDefendAbAttr {
  applyPreDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (pokemon.getHpRatio() < 1 || (args[0] as Utils.NumberHolder).value < pokemon.hp)
      return false;

    return pokemon.addTag(BattlerTagType.STURDY, 1);
  }
}

export class BlockItemTheftAbAttr extends AbAttr {
  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    cancelled.value = true;
    
    return true;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]) {
    return getPokemonMessage(pokemon, `'s ${abilityName}\nprevents item theft!`);
  }
}

export class StabBoostAbAttr extends AbAttr {
  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if ((args[0] as Utils.NumberHolder).value > 1) {
      (args[0] as Utils.NumberHolder).value += 0.5;
      return true;
    }
    
    return false;
  }
}

export class ReceivedMoveDamageMultiplierAbAttr extends PreDefendAbAttr {
  protected condition: PokemonDefendCondition;
  private powerMultiplier: number;

  constructor(condition: PokemonDefendCondition, powerMultiplier: number) {
    super();

    this.condition = condition;
    this.powerMultiplier = powerMultiplier;
  }

  applyPreDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (this.condition(pokemon, attacker, move.getMove())) {
      (args[0] as Utils.NumberHolder).value *= this.powerMultiplier;
      return true;
    }

    return false;
  }
}

export class ReceivedTypeDamageMultiplierAbAttr extends ReceivedMoveDamageMultiplierAbAttr {
  constructor(moveType: Type, powerMultiplier: number) {
    super((user, target, move) => move.type === moveType, powerMultiplier);
  }
}

export class PreDefendMovePowerToOneAbAttr extends ReceivedMoveDamageMultiplierAbAttr {
  constructor(condition: PokemonDefendCondition) {
    super(condition, 1);
  }

  applyPreDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (this.condition(pokemon, attacker, move.getMove())) {
      (args[0] as Utils.NumberHolder).value = 1;
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

  applyPreDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if ((move.getMove() instanceof AttackMove || move.getMove().getAttrs(StatusMoveTypeImmunityAttr).find(attr => (attr as StatusMoveTypeImmunityAttr).immuneType === this.immuneType)) && move.getMove().type === this.immuneType) {
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

  applyPreDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    const ret = super.applyPreDefend(pokemon, passive, attacker, move, cancelled, args);

    if (ret) {
      if (pokemon.getHpRatio() < 1) {
        const simulated = args.length > 1 && args[1];
        if (!simulated) {
          const abilityName = (!passive ? pokemon.getAbility() : pokemon.getPassiveAbility()).name;
          pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.getBattlerIndex(),
            Math.max(Math.floor(pokemon.getMaxHp() / 4), 1), getPokemonMessage(pokemon, `'s ${abilityName}\nrestored its HP a little!`), true));
        }
      }
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

  applyPreDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    const ret = super.applyPreDefend(pokemon, passive, attacker, move, cancelled, args);

    if (ret) {
      cancelled.value = true;
      const simulated = args.length > 1 && args[1];
      if (!simulated)
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

  applyPreDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    const ret = super.applyPreDefend(pokemon, passive, attacker, move, cancelled, args);

    if (ret) {
      cancelled.value = true;
      const simulated = args.length > 1 && args[1];
      if (!simulated)
        pokemon.addTag(this.tagType, this.turnCount, undefined, pokemon.id);
    }
    
    return ret;
  }
}

export class NonSuperEffectiveImmunityAbAttr extends TypeImmunityAbAttr {
  constructor(condition?: AbAttrCondition) {
    super(null, condition);
  }

  applyPreDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (move.getMove() instanceof AttackMove && pokemon.getAttackTypeEffectiveness(move.getMove().type) < 2) {
      cancelled.value = true;
      (args[0] as Utils.NumberHolder).value = 0;
      return true;
    }

    return false;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return getPokemonMessage(pokemon, ` avoided damage\nwith ${abilityName}!`);
  }
}

export class PostDefendAbAttr extends AbAttr {
  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean | Promise<boolean> {
    return false;
  }
}

export class PostDefendDisguiseAbAttr extends PostDefendAbAttr {

  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (pokemon.formIndex == 0 && pokemon.battleData.hitCount != 0 && (move.getMove().category == MoveCategory.SPECIAL || move.getMove().category == MoveCategory.PHYSICAL)) {
      
      const recoilDamage = Math.ceil((pokemon.getMaxHp() / 8) - attacker.turnData.damageDealt);
      if (!recoilDamage)
        return false;
      pokemon.damageAndUpdate(recoilDamage, HitResult.OTHER);
      pokemon.turnData.damageTaken += recoilDamage;
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, '\'s disguise was busted!'));
      return true;
    }

    return false;
  }
}

export class PostDefendFormChangeAbAttr extends PostDefendAbAttr {
  private formFunc: (p: Pokemon) => integer;

  constructor(formFunc: ((p: Pokemon) => integer)) {
    super(true);

    this.formFunc = formFunc;
  }

  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    const formIndex = this.formFunc(pokemon);
    if (formIndex !== pokemon.formIndex) {
      pokemon.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeManualTrigger, false);
      return true;
    }

    return false;
  }
}

export class FieldPriorityMoveImmunityAbAttr extends PreDefendAbAttr {
  applyPreDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
      const attackPriority = new Utils.IntegerHolder(move.getMove().priority);
      applyAbAttrs(IncrementMovePriorityAbAttr, attacker, null, move.getMove(), attackPriority);
  
      if(attackPriority.value > 0 && !move.getMove().isMultiTarget()) {
        cancelled.value = true;
        return true;
      }
    
    return false;
  }
}

export class PostStatChangeAbAttr extends AbAttr {
  applyPostStatChange(pokemon: Pokemon, statsChanged: BattleStat[], levelChanged: integer, selfTarget: boolean, args: any[]): boolean | Promise<boolean> {
    return false;
  }
}

export class MoveImmunityAbAttr extends PreDefendAbAttr {
  private immuneCondition: PreDefendAbAttrCondition;

  constructor(immuneCondition: PreDefendAbAttrCondition) {
    super(true);

    this.immuneCondition = immuneCondition;
  }

  applyPreDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (this.immuneCondition(pokemon, attacker, move)) {
      cancelled.value = true;
      return true;
    }

    return false;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return `It doesn\'t affect ${pokemon.name}!`;
  }
}

export class MoveImmunityStatChangeAbAttr extends MoveImmunityAbAttr {
  private stat: BattleStat;
  private levels: integer;

  constructor(immuneCondition: PreDefendAbAttrCondition, stat: BattleStat, levels: integer) {
    super(immuneCondition);
    this.stat = stat;
    this.levels = levels;
  }

  applyPreDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    const ret = super.applyPreDefend(pokemon, passive, attacker, move, cancelled, args)
    if (ret) {
      pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ this.stat ], this.levels));
    }

    return ret;
  }
}

export class ReverseDrainAbAttr extends PostDefendAbAttr {
  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (!!move.getMove().getAttrs(HitHealAttr).length || !!move.getMove().getAttrs(StrengthSapHealAttr).length ) {
      pokemon.scene.queueMessage(getPokemonMessage(attacker, ` sucked up the liquid ooze!`));
      return true;
    }
    return false;
  }
}

export class PostDefendStatChangeAbAttr extends PostDefendAbAttr {
  private condition: PokemonDefendCondition;
  private stat: BattleStat;
  private levels: integer;
  private selfTarget: boolean;

  constructor(condition: PokemonDefendCondition, stat: BattleStat, levels: integer, selfTarget: boolean = true) {
    super(true);

    this.condition = condition;
    this.stat = stat;
    this.levels = levels;
    this.selfTarget = selfTarget;
  }

  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (this.condition(pokemon, attacker, move.getMove())) {
      pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, (this.selfTarget ? pokemon : attacker).getBattlerIndex(), true, [ this.stat ], this.levels));
      return true;
    }

    return false;
  }
}

export class PostDefendApplyArenaTrapTagAbAttr extends PostDefendAbAttr {
  private condition: PokemonDefendCondition;
  private tagType: ArenaTagType;

  constructor(condition: PokemonDefendCondition, tagType: ArenaTagType) {
    super(true);

    this.condition = condition;
    this.tagType = tagType;
  }

  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (this.condition(pokemon, attacker, move.getMove())) {
      const tag = pokemon.scene.arena.getTag(this.tagType) as ArenaTrapTag;
      if (!pokemon.scene.arena.getTag(this.tagType) || tag.layers < tag.maxLayers) {
        pokemon.scene.arena.addTag(this.tagType, 0, undefined, pokemon.id, pokemon.isPlayer() ? ArenaTagSide.ENEMY : ArenaTagSide.PLAYER);
        return true;
      }
    }
    return false;
  }
}

export class PostDefendApplyBattlerTagAbAttr extends PostDefendAbAttr {
  private condition: PokemonDefendCondition;
  private tagType: BattlerTagType;
  constructor(condition: PokemonDefendCondition, tagType: BattlerTagType) {
    super(true);

    this.condition = condition;
    this.tagType = tagType;
  }

  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (this.condition(pokemon, attacker, move.getMove())) {
      pokemon.addTag(this.tagType, undefined, undefined, pokemon.id);
      return true;
    }
    return false;
  }
}

export class PostDefendTypeChangeAbAttr extends PostDefendAbAttr {
  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (hitResult < HitResult.NO_EFFECT) {
      const type = move.getMove().type;
      const pokemonTypes = pokemon.getTypes(true);
      if (pokemonTypes.length !== 1 || pokemonTypes[0] !== type) {
        pokemon.summonData.types = [ type ];
        return true;
      }
    }

    return false;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return getPokemonMessage(pokemon, `'s ${abilityName}\nmade it the ${Utils.toReadableString(Type[pokemon.getTypes(true)[0]])} type!`);
  }
}

export class PostDefendTerrainChangeAbAttr extends PostDefendAbAttr {
  private terrainType: TerrainType;

  constructor(terrainType: TerrainType) {
    super();

    this.terrainType = terrainType;
  }

  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (hitResult < HitResult.NO_EFFECT)
      return pokemon.scene.arena.trySetTerrain(this.terrainType, true);

    return false;
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

  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (move.getMove().checkFlag(MoveFlags.MAKES_CONTACT, attacker, pokemon) && !attacker.status && (this.chance === -1 || pokemon.randSeedInt(100) < this.chance)) {
      const effect = this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randSeedInt(this.effects.length)];
      return attacker.trySetStatus(effect, true);
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

  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (move.getMove().checkFlag(MoveFlags.MAKES_CONTACT, attacker, pokemon) && pokemon.randSeedInt(100) < this.chance)
      return attacker.addTag(this.tagType, this.turnCount, move.moveId, attacker.id);

    return false;
  }
}

export class PostDefendCritStatChangeAbAttr extends PostDefendAbAttr {
  private stat: BattleStat;
  private levels: integer;

  constructor(stat: BattleStat, levels: integer) {
    super();

    this.stat = stat;
    this.levels = levels;
  }

  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ this.stat ], this.levels));
    
    return true;
  }

  getCondition(): AbAttrCondition {
    return (pokemon: Pokemon) => pokemon.turnData.attacksReceived.length && pokemon.turnData.attacksReceived[pokemon.turnData.attacksReceived.length - 1].critical;
  }
}

export class PostDefendContactDamageAbAttr extends PostDefendAbAttr {
  private damageRatio: integer;

  constructor(damageRatio: integer) {
    super();

    this.damageRatio = damageRatio;
  }
  
  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (move.getMove().checkFlag(MoveFlags.MAKES_CONTACT, attacker, pokemon)) {
      attacker.damageAndUpdate(Math.ceil(attacker.getMaxHp() * (1 / this.damageRatio)), HitResult.OTHER);
      attacker.turnData.damageTaken += Math.ceil(attacker.getMaxHp() * (1 / this.damageRatio));
      return true;
    }
    
    return false;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return getPokemonMessage(pokemon, `'s ${abilityName}\nhurt its attacker!`);
  }
}

export class PostDefendWeatherChangeAbAttr extends PostDefendAbAttr {
  private weatherType: WeatherType;

  constructor(weatherType: WeatherType) {
    super();

    this.weatherType = weatherType;
  }

  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (!pokemon.scene.arena.weather?.isImmutable())
      return pokemon.scene.arena.trySetWeather(this.weatherType, true);

    return false;
  }
}

export class PostDefendAbilitySwapAbAttr extends PostDefendAbAttr {
  constructor() {
    super();
  }
  
  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (move.getMove().checkFlag(MoveFlags.MAKES_CONTACT, attacker, pokemon) && !attacker.getAbility().hasAttr(UnswappableAbilityAbAttr)) {
      const tempAbilityId = attacker.getAbility().id;
      attacker.summonData.ability = pokemon.getAbility().id;
      pokemon.summonData.ability = tempAbilityId;
      return true;
    }
    
    return false;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return getPokemonMessage(pokemon, ` swapped\nabilities with its target!`);
  }
}

export class PostDefendAbilityGiveAbAttr extends PostDefendAbAttr {
  constructor() {
    super();
  }
  
  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (move.getMove().checkFlag(MoveFlags.MAKES_CONTACT, attacker, pokemon) && !attacker.getAbility().hasAttr(UnsuppressableAbilityAbAttr) && !attacker.getAbility().hasAttr(PostDefendAbilityGiveAbAttr)) {
      attacker.summonData.ability = pokemon.getAbility().id;

      return true;
    }
    
    return false;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return getPokemonMessage(pokemon, ` gave its target\n${abilityName}!`);
  }
}

export class PostStatChangeStatChangeAbAttr extends PostStatChangeAbAttr {
  private condition: PokemonStatChangeCondition;
  private statsToChange: BattleStat[];
  private levels: integer;

  constructor(condition: PokemonStatChangeCondition, statsToChange: BattleStat[], levels: integer) {
    super(true);

    this.condition = condition;
    this.statsToChange = statsToChange;
    this.levels = levels;
  }

  applyPostStatChange(pokemon: Pokemon, statsChanged: BattleStat[], levelsChanged: integer, selfTarget: boolean, args: any[]): boolean {
    if (this.condition(pokemon, statsChanged, levelsChanged) && !selfTarget) {
      pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, (pokemon).getBattlerIndex(), true, this.statsToChange, this.levels));
      return true;
    }

    return false;
  }
}

export class PreAttackAbAttr extends AbAttr {
  applyPreAttack(pokemon: Pokemon, passive: boolean, defender: Pokemon, move: PokemonMove, args: any[]): boolean | Promise<boolean> {
    return false;
  }
}

export class VariableMovePowerAbAttr extends PreAttackAbAttr {
  applyPreAttack(pokemon: Pokemon, passive: boolean, defender: Pokemon, move: PokemonMove, args: any[]): boolean {
    //const power = args[0] as Utils.NumberHolder;
    return false;
  }
}

export class VariableMoveTypeAbAttr extends AbAttr {
  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    //const power = args[0] as Utils.IntegerHolder;
    return false; 
  }
}

export class MoveTypeChangePowerMultiplierAbAttr extends VariableMoveTypeAbAttr {
  private matchType: Type;
  private newType: Type;
  private powerMultiplier: number;

  constructor(matchType: Type, newType: Type, powerMultiplier: number){
    super(true);
    this.matchType = matchType;
    this.newType = newType;
    this.powerMultiplier = powerMultiplier;
  }

  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    const type = (args[0] as Utils.IntegerHolder);
    if (type.value == this.matchType) {
      type.value = this.newType;
      (args[1] as Utils.NumberHolder).value *= this.powerMultiplier;
      return true;
    }
    
    return false;
  }
}

export class FieldPreventExplosiveMovesAbAttr extends AbAttr {
  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean | Promise<boolean> {
    cancelled.value = true;
    return true;
  }
}

export class MoveTypeChangeAttr extends PreAttackAbAttr {
  private newType: Type;
  private powerMultiplier: number;
  private condition: PokemonAttackCondition;

  constructor(newType: Type, powerMultiplier: number, condition: PokemonAttackCondition){
    super(true);
    this.newType = newType;
    this.powerMultiplier = powerMultiplier;
    this.condition = condition;
  }

  applyPreAttack(pokemon: Pokemon, passive: boolean, defender: Pokemon, move: PokemonMove, args: any[]): boolean {
    if (this.condition(pokemon, defender, move.getMove())) {
      const type = (args[0] as Utils.IntegerHolder);
      type.value = this.newType;
      (args[1] as Utils.NumberHolder).value *= this.powerMultiplier;
      return true;
    }

    return false;
  }
}

export class MovePowerBoostAbAttr extends VariableMovePowerAbAttr {
  private condition: PokemonAttackCondition;
  private powerMultiplier: number;

  constructor(condition: PokemonAttackCondition, powerMultiplier: number) {
    super(true);
    this.condition = condition;
    this.powerMultiplier = powerMultiplier;
  }

  applyPreAttack(pokemon: Pokemon, passive: boolean, defender: Pokemon, move: PokemonMove, args: any[]): boolean {
    if (this.condition(pokemon, defender, move.getMove())) {
      (args[0] as Utils.NumberHolder).value *= this.powerMultiplier;

      return true;
    }

    return false;
  }
}

export class MoveTypePowerBoostAbAttr extends MovePowerBoostAbAttr {
  constructor(boostedType: Type, powerMultiplier?: number) {
    super((pokemon, defender, move) => move.type === boostedType, powerMultiplier || 1.5);
  }
}

export class LowHpMoveTypePowerBoostAbAttr extends MoveTypePowerBoostAbAttr {
  constructor(boostedType: Type) {
    super(boostedType);
  }

  getCondition(): AbAttrCondition {
    return (pokemon) => pokemon.getHpRatio() <= 0.33;
  }
}

export class FieldVariableMovePowerAbAttr extends AbAttr {
  applyPreAttack(pokemon: Pokemon, passive: boolean, defender: Pokemon, move: PokemonMove, args: any[]): boolean {
    //const power = args[0] as Utils.NumberHolder;
    return false; 
  }
}

export class FieldMovePowerBoostAbAttr extends FieldVariableMovePowerAbAttr {
  private condition: PokemonAttackCondition;
  private powerMultiplier: number;

  constructor(condition: PokemonAttackCondition, powerMultiplier: number) {
    super(false);
    this.condition = condition;
    this.powerMultiplier = powerMultiplier;
  }

  applyPreAttack(pokemon: Pokemon, passive: boolean, defender: Pokemon, move: PokemonMove, args: any[]): boolean {
    if (this.condition(pokemon, defender, move.getMove())) {
      (args[0] as Utils.NumberHolder).value *= this.powerMultiplier;

      return true;
    }

    return false;
  }
}

export class FieldMoveTypePowerBoostAbAttr extends FieldMovePowerBoostAbAttr {
  constructor(boostedType: Type, powerMultiplier?: number) {
    super((pokemon, defender, move) => move.type === boostedType, powerMultiplier || 1.5);
  }
}

export class BattleStatMultiplierAbAttr extends AbAttr {
  private battleStat: BattleStat;
  private multiplier: number;

  constructor(battleStat: BattleStat, multiplier: number) {
    super(false);

    this.battleStat = battleStat;
    this.multiplier = multiplier;
  }

  applyBattleStat(pokemon: Pokemon, passive: boolean, battleStat: BattleStat, statValue: Utils.NumberHolder, args: any[]): boolean | Promise<boolean> {
    if (battleStat === this.battleStat) {
      statValue.value *= this.multiplier;
      return true;
    }

    return false;
  }
}

export class PostAttackAbAttr extends AbAttr {
  applyPostAttack(pokemon: Pokemon, passive: boolean, defender: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean | Promise<boolean> {
    return false;
  }
}

export class PostAttackStealHeldItemAbAttr extends PostAttackAbAttr {
  private condition: PokemonAttackCondition;

  constructor(condition?: PokemonAttackCondition) {
    super();

    this.condition = condition;
  }

  applyPostAttack(pokemon: Pokemon, passive: boolean, defender: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (hitResult < HitResult.NO_EFFECT && (!this.condition || this.condition(pokemon, defender, move.getMove()))) {
        const heldItems = this.getTargetHeldItems(defender).filter(i => i.getTransferrable(false));
        if (heldItems.length) {
          const stolenItem = heldItems[pokemon.randSeedInt(heldItems.length)];
          pokemon.scene.tryTransferHeldItemModifier(stolenItem, pokemon, false, false).then(success => {
            if (success)
              pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` stole\n${defender.name}'s ${stolenItem.type.name}!`));
            resolve(success);
          });
          return;
        }
      }
      resolve(false);
    });
  }

  getTargetHeldItems(target: Pokemon): PokemonHeldItemModifier[] {
    return target.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && (m as PokemonHeldItemModifier).pokemonId === target.id, target.isPlayer()) as PokemonHeldItemModifier[];
  }
}

export class PostAttackApplyStatusEffectAbAttr extends PostAttackAbAttr {
  private contactRequired: boolean;
  private chance: integer;
  private effects: StatusEffect[];

  constructor(contactRequired: boolean, chance: integer, ...effects: StatusEffect[]) {
    super();

    this.contactRequired = contactRequired;
    this.chance = chance;
    this.effects = effects;
  }

  applyPostAttack(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (pokemon != attacker && (!this.contactRequired || move.getMove().checkFlag(MoveFlags.MAKES_CONTACT, attacker, pokemon)) && pokemon.randSeedInt(100) < this.chance && !pokemon.status) {
      const effect = this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randSeedInt(this.effects.length)];
      return attacker.trySetStatus(effect, true);
    }

    return false;
  }
}

export class PostAttackContactApplyStatusEffectAbAttr extends PostAttackApplyStatusEffectAbAttr {
  constructor(chance: integer, ...effects: StatusEffect[]) {
    super(true, chance, ...effects);
  }
}

export class PostAttackApplyBattlerTagAbAttr extends PostAttackAbAttr {
  private contactRequired: boolean;
  private chance: (user: Pokemon, target: Pokemon, move: PokemonMove) => integer;
  private effects: BattlerTagType[];

  
  constructor(contactRequired: boolean, chance: (user: Pokemon, target: Pokemon, move: PokemonMove) =>  integer, ...effects: BattlerTagType[]) {
    super();

    this.contactRequired = contactRequired;
    this.chance = chance;
    this.effects = effects;
  }

  applyPostAttack(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (pokemon != attacker && (!this.contactRequired || move.getMove().checkFlag(MoveFlags.MAKES_CONTACT, attacker, pokemon)) && pokemon.randSeedInt(100) < this.chance(attacker, pokemon, move) && !pokemon.status) {
      const effect = this.effects.length === 1 ? this.effects[0] : this.effects[pokemon.randSeedInt(this.effects.length)];


      return attacker.addTag(effect);
    }

    return false;
  }
}

export class PostDefendStealHeldItemAbAttr extends PostDefendAbAttr {
  private condition: PokemonDefendCondition;

  constructor(condition?: PokemonDefendCondition) {
    super();

    this.condition = condition;
  }

  applyPostDefend(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (hitResult < HitResult.NO_EFFECT && (!this.condition || this.condition(pokemon, attacker, move.getMove()))) {
        const heldItems = this.getTargetHeldItems(attacker).filter(i => i.getTransferrable(false));
        if (heldItems.length) {
          const stolenItem = heldItems[pokemon.randSeedInt(heldItems.length)];
          pokemon.scene.tryTransferHeldItemModifier(stolenItem, pokemon, false, false).then(success => {
            if (success)
              pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` stole\n${attacker.name}'s ${stolenItem.type.name}!`));
            resolve(success);
          });
          return;
        }
      }
      resolve(false);
    });
  }

  getTargetHeldItems(target: Pokemon): PokemonHeldItemModifier[] {
    return target.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && (m as PokemonHeldItemModifier).pokemonId === target.id, target.isPlayer()) as PokemonHeldItemModifier[];
  }
}

export class PostVictoryAbAttr extends AbAttr {
  applyPostVictory(pokemon: Pokemon, passive: boolean, args: any[]): boolean | Promise<boolean> {
    return false;
  }
}

class PostVictoryStatChangeAbAttr extends PostVictoryAbAttr {
  private stat: BattleStat | ((p: Pokemon) => BattleStat);
  private levels: integer;

  constructor(stat: BattleStat | ((p: Pokemon) => BattleStat), levels: integer) {
    super();

    this.stat = stat;
    this.levels = levels;
  }

  applyPostVictory(pokemon: Pokemon, passive: boolean, args: any[]): boolean | Promise<boolean> {
    const stat = typeof this.stat === 'function'
      ? this.stat(pokemon)
      : this.stat;
    pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ stat ], this.levels));
    
    return true;
  }
}

export class PostVictoryFormChangeAbAttr extends PostVictoryAbAttr {
  private formFunc: (p: Pokemon) => integer;

  constructor(formFunc: ((p: Pokemon) => integer)) {
    super(true);

    this.formFunc = formFunc;
  }

  applyPostVictory(pokemon: Pokemon, passive: boolean, args: any[]): boolean | Promise<boolean> {
    const formIndex = this.formFunc(pokemon);
    if (formIndex !== pokemon.formIndex) {
      pokemon.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeManualTrigger, false);
      return true;
    }

    return false;
  }
}

export class PostKnockOutAbAttr extends AbAttr {
  applyPostKnockOut(pokemon: Pokemon, passive: boolean, knockedOut: Pokemon, args: any[]): boolean | Promise<boolean> {
    return false;
  }
}

export class PostKnockOutStatChangeAbAttr extends PostKnockOutAbAttr {
  private stat: BattleStat | ((p: Pokemon) => BattleStat);
  private levels: integer;

  constructor(stat: BattleStat | ((p: Pokemon) => BattleStat), levels: integer) {
    super();

    this.stat = stat;
    this.levels = levels;
  }

  applyPostKnockOut(pokemon: Pokemon, passive: boolean, knockedOut: Pokemon, args: any[]): boolean | Promise<boolean> {
    const stat = typeof this.stat === 'function'
      ? this.stat(pokemon)
      : this.stat;
    pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ stat ], this.levels));
    
    return true;
  }
}

export class CopyFaintedAllyAbilityAbAttr extends PostKnockOutAbAttr {
  constructor() {
    super();
  }

  applyPostKnockOut(pokemon: Pokemon, passive: boolean, knockedOut: Pokemon, args: any[]): boolean | Promise<boolean> {
    if (pokemon.isPlayer() === knockedOut.isPlayer() && !knockedOut.getAbility().hasAttr(UncopiableAbilityAbAttr)) {
      pokemon.summonData.ability = knockedOut.getAbility().id;
      pokemon.scene.queueMessage(getPokemonMessage(knockedOut, `'s ${allAbilities[knockedOut.getAbility().id].name} was taken over!`));
      return true;
    }
    
    return false;
  }
}

export class IgnoreOpponentStatChangesAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]) {
    (args[0] as Utils.IntegerHolder).value = 0;

    return true;
  }
}

export class PostSummonAbAttr extends AbAttr {
  applyPostSummon(pokemon: Pokemon, passive: boolean, args: any[]): boolean | Promise<boolean> {
    return false;
  }
}

export class PostSummonMessageAbAttr extends PostSummonAbAttr {
  private messageFunc: (pokemon: Pokemon) => string;

  constructor(messageFunc: (pokemon: Pokemon) => string) {
    super(true);

    this.messageFunc = messageFunc;
  }

  applyPostSummon(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    pokemon.scene.queueMessage(this.messageFunc(pokemon));

    return true;
  }
}

export class PostSummonAddBattlerTagAbAttr extends PostSummonAbAttr {
  private tagType: BattlerTagType;
  private turnCount: integer;

  constructor(tagType: BattlerTagType, turnCount: integer, showAbility?: boolean) {
    super(showAbility);

    this.tagType = tagType;
    this.turnCount = turnCount;
  }

  applyPostSummon(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
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

  applyPostSummon(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
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

export class PostSummonAllyHealAbAttr extends PostSummonAbAttr {
  private healRatio: number;
  private showAnim: boolean;

  constructor(healRatio: number, showAnim: boolean = false) {
    super();

    this.healRatio = healRatio || 4;
    this.showAnim = showAnim;
  }

  applyPostSummon(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    const target = pokemon.getAlly();
    if (target?.isActive(true)) {
      target.scene.unshiftPhase(new PokemonHealPhase(target.scene, target.getBattlerIndex(),
        Math.max(Math.floor(pokemon.getMaxHp() / this.healRatio), 1), getPokemonMessage(target, ` drank down all the\nmatcha that ${pokemon.name} made!`), true, !this.showAnim));
      return true;
    }
    
    return false;
  }
}

export class DownloadAbAttr extends PostSummonAbAttr {
  private enemyDef: integer;
  private enemySpDef: integer;
  private stats: BattleStat[];

  applyPostSummon(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    this.enemyDef = 0;
    this.enemySpDef = 0;
	
    for (let opponent of pokemon.getOpponents()) {
      this.enemyDef += opponent.stats[BattleStat.DEF];
      this.enemySpDef += opponent.stats[BattleStat.SPDEF];
    }
	
    if (this.enemyDef < this.enemySpDef)
      this.stats = [BattleStat.ATK];
    else
      this.stats = [BattleStat.SPATK];

    if (this.enemyDef > 0 && this.enemySpDef > 0) { // only activate if there's actually an enemy to download from
      pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), false, this.stats, 1));
      return true;
    }
	
    return false;
  }
}

export class PostSummonWeatherChangeAbAttr extends PostSummonAbAttr {
  private weatherType: WeatherType;

  constructor(weatherType: WeatherType) {
    super();

    this.weatherType = weatherType;
  }

  applyPostSummon(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    if (!pokemon.scene.arena.weather?.isImmutable())
      return pokemon.scene.arena.trySetWeather(this.weatherType, true);

    return false;
  }
}

export class PostSummonTerrainChangeAbAttr extends PostSummonAbAttr {
  private terrainType: TerrainType;

  constructor(terrainType: TerrainType) {
    super();

    this.terrainType = terrainType;
  }

  applyPostSummon(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    return pokemon.scene.arena.trySetTerrain(this.terrainType, true);
  }
}

export class PostSummonFormChangeAbAttr extends PostSummonAbAttr {
  private formFunc: (p: Pokemon) => integer;

  constructor(formFunc: ((p: Pokemon) => integer)) {
    super(true);

    this.formFunc = formFunc;
  }

  applyPostSummon(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    const formIndex = this.formFunc(pokemon);
    if (formIndex !== pokemon.formIndex)
      return pokemon.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeManualTrigger, false);

    return false;
  }
}

export class TraceAbAttr extends PostSummonAbAttr {
  applyPostSummon(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    const targets = pokemon.getOpponents();
    if (!targets.length)
      return false;
    let target: Pokemon;
    if (targets.length > 1)
      pokemon.scene.executeWithSeedOffset(() => target = Utils.randSeedItem(targets), pokemon.scene.currentBattle.waveIndex);
    else
      target = targets[0];

    // Wonder Guard is normally uncopiable so has the attribute, but trace specifically can copy it
    if (target.getAbility().hasAttr(UncopiableAbilityAbAttr) && target.getAbility().id !== Abilities.WONDER_GUARD)
      return false;

    pokemon.summonData.ability = target.getAbility().id;

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` traced ${target.name}'s\n${allAbilities[target.getAbility().id].name}!`));

    return true;
  }
}

export class PostSummonTransformAbAttr extends PostSummonAbAttr {
  constructor() {
    super(true);
  }

  applyPostSummon(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    const targets = pokemon.getOpponents();
    let target: Pokemon;
    if (targets.length > 1)
      pokemon.scene.executeWithSeedOffset(() => target = Utils.randSeedItem(targets), pokemon.scene.currentBattle.waveIndex);
    else
      target = targets[0];

    pokemon.summonData.speciesForm = target.getSpeciesForm();
    pokemon.summonData.fusionSpeciesForm = target.getFusionSpeciesForm();
    pokemon.summonData.ability = target.getAbility().id;
    pokemon.summonData.gender = target.getGender();
    pokemon.summonData.fusionGender = target.getFusionGender();
    pokemon.summonData.stats = [ pokemon.stats[Stat.HP] ].concat(target.stats.slice(1));
    pokemon.summonData.battleStats = target.summonData.battleStats.slice(0);
    pokemon.summonData.moveset = target.getMoveset().map(m => new PokemonMove(m.moveId, m.ppUsed, m.ppUp));
    pokemon.summonData.types = target.getTypes();
    
    pokemon.scene.playSound('PRSFX- Transform');

    pokemon.loadAssets(false).then(() => pokemon.playAnim());

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` transformed\ninto ${target.name}!`));

    return true;
  }
}

export class PreSwitchOutAbAttr extends AbAttr {
  constructor() {
    super(true);
  }

  applyPreSwitchOut(pokemon: Pokemon, passive: boolean, args: any[]): boolean | Promise<boolean> {
    return false;
  }
}

export class PreSwitchOutResetStatusAbAttr extends PreSwitchOutAbAttr {
  applyPreSwitchOut(pokemon: Pokemon, passive: boolean, args: any[]): boolean | Promise<boolean> {
    if (pokemon.status) {
      pokemon.resetStatus();
      pokemon.updateInfo();
      return true;
    }

    return false;
  }
}

export class PreSwitchOutHealAbAttr extends PreSwitchOutAbAttr {
  applyPreSwitchOut(pokemon: Pokemon, passive: boolean, args: any[]): boolean | Promise<boolean> {
    if (pokemon.getHpRatio() < 1 ) {
      const healAmount = Math.floor(pokemon.getMaxHp() * 0.33);
      pokemon.heal(healAmount);
      pokemon.updateInfo();
      return true;
    }

    return false;
  }
}

export class PreStatChangeAbAttr extends AbAttr {
  applyPreStatChange(pokemon: Pokemon, passive: boolean, stat: BattleStat, cancelled: Utils.BooleanHolder, args: any[]): boolean | Promise<boolean> {
    return false;
  }
}

export class ProtectStatAbAttr extends PreStatChangeAbAttr {
  private protectedStat: BattleStat;

  constructor(protectedStat?: BattleStat) {
    super();

    this.protectedStat = protectedStat;
  }

  applyPreStatChange(pokemon: Pokemon, passive: boolean, stat: BattleStat, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (this.protectedStat === undefined || stat === this.protectedStat) {
      cancelled.value = true;
      return true;
    }
    
    return false;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return getPokemonMessage(pokemon, `'s ${abilityName}\nprevents lowering its ${this.protectedStat !== undefined ? getBattleStatName(this.protectedStat) : 'stats'}!`);
  }
}

export class PreSetStatusAbAttr extends AbAttr {
  applyPreSetStatus(pokemon: Pokemon, passive: boolean, effect: StatusEffect, cancelled: Utils.BooleanHolder, args: any[]): boolean | Promise<boolean> {
    return false;
  }
}

export class StatusEffectImmunityAbAttr extends PreSetStatusAbAttr {
  private immuneEffects: StatusEffect[];

  constructor(...immuneEffects: StatusEffect[]) {
    super();

    this.immuneEffects = immuneEffects;
  }

  applyPreSetStatus(pokemon: Pokemon, passive: boolean, effect: StatusEffect, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (!this.immuneEffects.length || this.immuneEffects.indexOf(effect) > -1) {
      cancelled.value = true;
      return true;
    }

    return false;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return getPokemonMessage(pokemon, `'s ${abilityName}\nprevents ${this.immuneEffects.length ? getStatusEffectDescriptor(args[0] as StatusEffect) : 'status problems'}!`);
  }
}

export class PreApplyBattlerTagAbAttr extends AbAttr {
  applyPreApplyBattlerTag(pokemon: Pokemon, passive: boolean, tag: BattlerTag, cancelled: Utils.BooleanHolder, args: any[]): boolean | Promise<boolean> {
    return false;
  }
}

export class BattlerTagImmunityAbAttr extends PreApplyBattlerTagAbAttr {
  private immuneTagType: BattlerTagType;

  constructor(immuneTagType: BattlerTagType) {
    super();

    this.immuneTagType = immuneTagType;
  }

  applyPreApplyBattlerTag(pokemon: Pokemon, passive: boolean, tag: BattlerTag, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (tag.tagType === this.immuneTagType) {
      cancelled.value = true;
      return true;
    }

    return false;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return getPokemonMessage(pokemon, `'s ${abilityName}\nprevents ${(args[0] as BattlerTag).getDescriptor()}!`);
  }
}

export class BlockCritAbAttr extends AbAttr {
  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    (args[0] as Utils.BooleanHolder).value = true;
    return true;
  }
}

export class BonusCritAbAttr extends AbAttr {
  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    (args[0] as Utils.BooleanHolder).value = true;
    return true;
  }
}

export class BlockNonDirectDamageAbAttr extends AbAttr {
  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    cancelled.value = true;
    return true;
  }
}

export class BlockOneHitKOAbAttr extends AbAttr {
  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    cancelled.value = true;
    return true;
  }
}

export class IncrementMovePriorityAbAttr extends AbAttr {
  private moveIncrementFunc: (pokemon: Pokemon, move: Move) => boolean;
  private increaseAmount: integer;

  constructor(moveIncrementFunc: (pokemon: Pokemon, move: Move) => boolean, increaseAmount = 1) {
    super(true);

    this.moveIncrementFunc = moveIncrementFunc;
    this.increaseAmount = increaseAmount;
  }

  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (!this.moveIncrementFunc(pokemon, args[0] as Move))
      return false;
      
    (args[1] as Utils.IntegerHolder).value += this.increaseAmount;
    return true;
  }
}

export class IgnoreContactAbAttr extends AbAttr { }

export class PreWeatherEffectAbAttr extends AbAttr {
  applyPreWeatherEffect(pokemon: Pokemon, passive: boolean, weather: Weather, cancelled: Utils.BooleanHolder, args: any[]): boolean | Promise<boolean> {
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

  applyPreWeatherEffect(pokemon: Pokemon, passive: boolean, weather: Weather, cancelled: Utils.BooleanHolder, args: any[]): boolean {
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

  applyPreWeatherEffect(pokemon: Pokemon, passive: boolean, weather: Weather, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (this.affectsImmutable || weather.isImmutable()) {
      cancelled.value = true;
      return true;
    }

    return false;
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

function getAnticipationCondition(): AbAttrCondition {
  return (pokemon: Pokemon) => {
    for (let opponent of pokemon.getOpponents()) {
        for (let move of opponent.moveset) {
          // move is super effective
          if (move.getMove() instanceof AttackMove && pokemon.getAttackTypeEffectiveness(move.getMove().type) >= 2) {
            return true;
          }
          // move is a OHKO
          if (move.getMove().findAttr(attr => attr instanceof OneHitKOAttr)) {
            return true;
          }
          // edge case for hidden power, type is computed
          if (move.getMove().id === Moves.HIDDEN_POWER) {
            const iv_val = Math.floor(((opponent.ivs[Stat.HP] & 1)
              +(opponent.ivs[Stat.ATK] & 1) * 2
              +(opponent.ivs[Stat.DEF] & 1) * 4
              +(opponent.ivs[Stat.SPD] & 1) * 8
              +(opponent.ivs[Stat.SPATK] & 1) * 16
              +(opponent.ivs[Stat.SPDEF] & 1) * 32) * 15/63);
            
            const type = [
              Type.FIGHTING, Type.FLYING, Type.POISON, Type.GROUND,
              Type.ROCK, Type.BUG, Type.GHOST, Type.STEEL,
              Type.FIRE, Type.WATER, Type.GRASS, Type.ELECTRIC,
              Type.PSYCHIC, Type.ICE, Type.DRAGON, Type.DARK][iv_val];

            if (pokemon.getAttackTypeEffectiveness(type) >= 2) {
              return true;
            }
          }
        }
    }
    return false;
  };
}

export class PostWeatherChangeAbAttr extends AbAttr {
  applyPostWeatherChange(pokemon: Pokemon, passive: boolean, weather: WeatherType, args: any[]): boolean {
    return false;
  }
}

export class PostWeatherChangeAddBattlerTagAttr extends PostWeatherChangeAbAttr {
  private tagType: BattlerTagType;
  private turnCount: integer;
  private weatherTypes: WeatherType[];

  constructor(tagType: BattlerTagType, turnCount: integer, ...weatherTypes: WeatherType[]) {
    super();

    this.tagType = tagType;
    this.turnCount = turnCount;
    this.weatherTypes = weatherTypes;
  }

  applyPostWeatherChange(pokemon: Pokemon, passive: boolean, weather: WeatherType, args: any[]): boolean {
    console.log(this.weatherTypes.find(w => weather === w), WeatherType[weather]);
    if (!this.weatherTypes.find(w => weather === w))
      return false;

    return pokemon.addTag(this.tagType, this.turnCount);
  }
}

export class PostWeatherLapseAbAttr extends AbAttr {
  protected weatherTypes: WeatherType[];

  constructor(...weatherTypes: WeatherType[]) {
    super();

    this.weatherTypes = weatherTypes;
  }

  applyPostWeatherLapse(pokemon: Pokemon, passive: boolean, weather: Weather, args: any[]): boolean | Promise<boolean> {
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

  applyPostWeatherLapse(pokemon: Pokemon, passive: boolean, weather: Weather, args: any[]): boolean {
    if (pokemon.getHpRatio() < 1) {
      const scene = pokemon.scene;
      const abilityName = (!passive ? pokemon.getAbility() : pokemon.getPassiveAbility()).name;
      scene.unshiftPhase(new PokemonHealPhase(scene, pokemon.getBattlerIndex(),
        Math.max(Math.floor(pokemon.getMaxHp() / (16 / this.healFactor)), 1), getPokemonMessage(pokemon, `'s ${abilityName}\nrestored its HP a little!`), true));
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

  applyPostWeatherLapse(pokemon: Pokemon, passive: boolean, weather: Weather, args: any[]): boolean {
    if (pokemon.getHpRatio() < 1) {
      const scene = pokemon.scene;
      const abilityName = (!passive ? pokemon.getAbility() : pokemon.getPassiveAbility()).name;
      scene.queueMessage(getPokemonMessage(pokemon, ` is hurt\nby its ${abilityName}!`));
      pokemon.damageAndUpdate(Math.ceil(pokemon.getMaxHp() / (16 / this.damageFactor)), HitResult.OTHER);
      return true;
    }

    return false;
  }
}

export class PostTerrainChangeAbAttr extends AbAttr {
  applyPostTerrainChange(pokemon: Pokemon, passive: boolean, terrain: TerrainType, args: any[]): boolean {
    return false;
  }
}

export class PostTerrainChangeAddBattlerTagAttr extends PostTerrainChangeAbAttr {
  private tagType: BattlerTagType;
  private turnCount: integer;
  private terrainTypes: TerrainType[];

  constructor(tagType: BattlerTagType, turnCount: integer, ...terrainTypes: TerrainType[]) {
    super();

    this.tagType = tagType;
    this.turnCount = turnCount;
    this.terrainTypes = terrainTypes;
  }

  applyPostTerrainChange(pokemon: Pokemon, passive: boolean, terrain: TerrainType, args: any[]): boolean {
    if (!this.terrainTypes.find(t => t === terrain))
      return false;

    return pokemon.addTag(this.tagType, this.turnCount);
  }
}

function getTerrainCondition(...terrainTypes: TerrainType[]): AbAttrCondition {
  return (pokemon: Pokemon) => {
    const terrainType = pokemon.scene.arena.terrain?.terrainType;
    return terrainType && terrainTypes.indexOf(terrainType) > -1;
  };
}

export class PostTurnAbAttr extends AbAttr {
  applyPostTurn(pokemon: Pokemon, passive: boolean, args: any[]): boolean | Promise<boolean> {
    return false;
  }
}

export class PostTurnResetStatusAbAttr extends PostTurnAbAttr {
  applyPostTurn(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    if (pokemon.status) {
	
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, getStatusEffectHealText(pokemon.status?.effect)));
      pokemon.resetStatus();
      pokemon.updateInfo();
      return true;
    }
	
    return false;
  }
}

export class MoodyAbAttr extends PostTurnAbAttr {
  constructor() {
    super(true);
  }

  applyPostTurn(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    // TODO: Edge case of not choosing to buff or debuff a stat that's already maxed
    let selectableStats = [BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD];
    let increaseStat = selectableStats[Utils.randInt(selectableStats.length)];
    selectableStats = selectableStats.filter(s => s !== increaseStat);
    let decreaseStat = selectableStats[Utils.randInt(selectableStats.length)];
    pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [increaseStat], 2));
    pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [decreaseStat], -1));
    return true;
  }
}

export class PostTurnStatChangeAbAttr extends PostTurnAbAttr {
  private stats: BattleStat[];
  private levels: integer;

  constructor(stats: BattleStat | BattleStat[], levels: integer) {
    super(true);

    this.stats = Array.isArray(stats)
      ? stats
      : [ stats ];
    this.levels = levels;
  }

  applyPostTurn(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, this.stats, this.levels));
    return true;
  }
}

export class PostTurnHealAbAttr extends PostTurnAbAttr {
  applyPostTurn(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    if (pokemon.getHpRatio() < 1) {
      const scene = pokemon.scene;
      const abilityName = (!passive ? pokemon.getAbility() : pokemon.getPassiveAbility()).name;
      scene.unshiftPhase(new PokemonHealPhase(scene, pokemon.getBattlerIndex(),
        Math.max(Math.floor(pokemon.getMaxHp() / 16), 1), getPokemonMessage(pokemon, `'s ${abilityName}\nrestored its HP a little!`), true));
      return true;
    }

    return false;
  }
}

export class PostTurnFormChangeAbAttr extends PostTurnAbAttr {
  private formFunc: (p: Pokemon) => integer;

  constructor(formFunc: ((p: Pokemon) => integer)) {
    super(true);

    this.formFunc = formFunc;
  }

  applyPostTurn(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    const formIndex = this.formFunc(pokemon);
    if (formIndex !== pokemon.formIndex) {
      pokemon.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeManualTrigger, false);
      return true;
    }

    return false;
  }
}

export class PostBiomeChangeAbAttr extends AbAttr { }

export class PostBiomeChangeWeatherChangeAbAttr extends PostBiomeChangeAbAttr {
  private weatherType: WeatherType;

  constructor(weatherType: WeatherType) {
    super();

    this.weatherType = weatherType;
  }

  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (!pokemon.scene.arena.weather?.isImmutable())
      return pokemon.scene.arena.trySetWeather(this.weatherType, true);

    return false;
  }
}

export class PostBiomeChangeTerrainChangeAbAttr extends PostBiomeChangeAbAttr {
  private terrainType: TerrainType;

  constructor(terrainType: TerrainType) {
    super();

    this.terrainType = terrainType;
  }

  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    return pokemon.scene.arena.trySetTerrain(this.terrainType, true);
  }
}

export class StatChangeMultiplierAbAttr extends AbAttr {
  private multiplier: integer;

  constructor(multiplier: integer) {
    super(true);

    this.multiplier = multiplier;
  }

  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value *= this.multiplier;

    return true;
  }
}

export class BypassBurnDamageReductionAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    cancelled.value = true;

    return true;
  }
}

export class DoubleBerryEffectAbAttr extends AbAttr {
  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    (args[0] as Utils.NumberHolder).value *= 2;

    return true;
  }
}

export class PreventBerryUseAbAttr extends AbAttr {
  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    cancelled.value = true;

    return true;
  }
}

export class RunSuccessAbAttr extends AbAttr {
  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = 256;

    return true;
  }
}

export class CheckTrappedAbAttr extends AbAttr {
  constructor() {
    super(false);
  }
  
  applyCheckTrapped(pokemon: Pokemon, passive: boolean, trapped: Utils.BooleanHolder, args: any[]): boolean | Promise<boolean> {
    return false;
  }
}

export class ArenaTrapAbAttr extends CheckTrappedAbAttr {
  applyCheckTrapped(pokemon: Pokemon, passive: boolean, trapped: Utils.BooleanHolder, args: any[]): boolean {
    trapped.value = true;
    return true;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return getPokemonMessage(pokemon, `\'s ${abilityName}\nprevents switching!`);
  }
}

export class MaxMultiHitAbAttr extends AbAttr {
  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = 0;

    return true;
  }
}

export class PostBattleAbAttr extends AbAttr {
  constructor() {
    super(true);
  }

  applyPostBattle(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    return false;
  }
}

export class PostBattleLootAbAttr extends PostBattleAbAttr {
  applyPostBattle(pokemon: Pokemon, passive: boolean, args: any[]): boolean {
    const postBattleLoot = pokemon.scene.currentBattle.postBattleLoot;
    if (postBattleLoot.length) {
      const randItem = Utils.randSeedItem(postBattleLoot);
      if (pokemon.scene.tryTransferHeldItemModifier(randItem, pokemon, false, true, true)) {
        postBattleLoot.splice(postBattleLoot.indexOf(randItem), 1);
        pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` picked up\n${randItem.type.name}!`));
        return true;
      }
    }

    return false;
  }
}

export class PostFaintAbAttr extends AbAttr {
  applyPostFaint(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    return false;
  }
}

export class PostFaintContactDamageAbAttr extends PostFaintAbAttr {
  private damageRatio: integer;
  
  constructor(damageRatio: integer) {
    super();

    this.damageRatio = damageRatio;
  }

  applyPostFaint(pokemon: Pokemon, passive: boolean, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, args: any[]): boolean {
    if (move.getMove().checkFlag(MoveFlags.MAKES_CONTACT, attacker, pokemon)) {
      const cancelled = new Utils.BooleanHolder(false);
      pokemon.scene.getField(true).map(p=>applyAbAttrs(FieldPreventExplosiveMovesAbAttr, p, cancelled))
      if (cancelled) {
        return false;
      }
      attacker.damageAndUpdate(Math.ceil(attacker.getMaxHp() * (1 / this.damageRatio)), HitResult.OTHER);
      attacker.turnData.damageTaken += Math.ceil(attacker.getMaxHp() * (1 / this.damageRatio));
      return true;
    }

    return false;
  }

  getTriggerMessage(pokemon: Pokemon, abilityName: string, ...args: any[]): string {
    return getPokemonMessage(pokemon, `'s ${abilityName} hurt\nits attacker!`);
  }
}

export class RedirectMoveAbAttr extends AbAttr {
  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (this.canRedirect(args[0] as Moves)) {
      const target = args[1] as Utils.IntegerHolder;
      const newTarget = pokemon.getBattlerIndex();
      if (target.value !== newTarget) {
        target.value = newTarget;
        return true;
      }
    }

    return false;
  }
  
  canRedirect(moveId: Moves): boolean {
    const move = allMoves[moveId];
    return !![ MoveTarget.NEAR_OTHER, MoveTarget.OTHER ].find(t => move.moveTarget === t);
  }
}

export class RedirectTypeMoveAbAttr extends RedirectMoveAbAttr {
  public type: Type;

  constructor(type: Type) {
    super();
    this.type = type;
  }

  canRedirect(moveId: Moves): boolean {
    return super.canRedirect(moveId) && allMoves[moveId].type === this.type;
  }
}

export class ReduceStatusEffectDurationAbAttr extends AbAttr {
  private statusEffect: StatusEffect;

  constructor(statusEffect: StatusEffect) {
    super(true);

    this.statusEffect = statusEffect;
  }

  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (args[0] === this.statusEffect) {
      (args[1] as Utils.IntegerHolder).value = Math.floor((args[1] as Utils.IntegerHolder).value / 2);
      return true;
    }

    return false;
  }
}

export class FlinchEffectAbAttr extends AbAttr {
  constructor() {
    super(true);
  }
}

export class FlinchStatChangeAbAttr extends FlinchEffectAbAttr {
  private stats: BattleStat[];
  private levels: integer;

  constructor(stats: BattleStat | BattleStat[], levels: integer) {
    super();

    this.stats = Array.isArray(stats)
      ? stats
      : [ stats ];
    this.levels = levels;
  }

  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, this.stats, this.levels));
    return true;
  }
}

export class IncreasePpAbAttr extends AbAttr { }

export class ReduceBerryUseThresholdAbAttr extends AbAttr {
  constructor() {
    super();
  }

  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    const hpRatio = pokemon.getHpRatio();

    if (args[0].value < hpRatio) {
      args[0].value *= 2;
      return args[0].value >= hpRatio;
    }

    return false;
  }
}

export class WeightMultiplierAbAttr extends AbAttr {
  private multiplier: integer;

  constructor(multiplier: integer) {
    super();

    this.multiplier = multiplier;
  }

  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    (args[0] as Utils.NumberHolder).value *= this.multiplier;

    return true;
  }
}

export class SyncEncounterNatureAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    (args[0] as Pokemon).setNature(pokemon.getNature());

    return true;
  }
}

export class MoveAbilityBypassAbAttr extends AbAttr {
  private moveIgnoreFunc: (pokemon: Pokemon, move: Move) => boolean;

  constructor(moveIgnoreFunc?: (pokemon: Pokemon, move: Move) => boolean) {
    super(false);

    this.moveIgnoreFunc = moveIgnoreFunc || ((pokemon, move) => true);
  }

  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    if (this.moveIgnoreFunc(pokemon, (args[0] as Move))) {
      cancelled.value = true;
      return true;
    }
    return false;
  }
}

export class SuppressFieldAbilitiesAbAttr extends AbAttr {
  constructor() {
    super(false);
  }

  apply(pokemon: Pokemon, passive: boolean, cancelled: Utils.BooleanHolder, args: any[]): boolean {
    const ability = (args[0] as Ability);
    if (!ability.hasAttr(UnsuppressableAbilityAbAttr) && !ability.hasAttr(SuppressFieldAbilitiesAbAttr)) {
      cancelled.value = true;
      return true;
    }
    return false;
  }
}


export class AlwaysHitAbAttr extends AbAttr { }

export class UncopiableAbilityAbAttr extends AbAttr {
  constructor() {
    super(false);
  }
}

export class UnsuppressableAbilityAbAttr extends AbAttr {
  constructor() {
    super(false);
  }
}

export class UnswappableAbilityAbAttr extends AbAttr {
  constructor() {
    super(false);
  }
}

export class NoTransformAbilityAbAttr extends AbAttr {
  constructor() {
    super(false);
  }
}

export class NoFusionAbilityAbAttr extends AbAttr {
  constructor() {
    super(false);
  }
}

function applyAbAttrsInternal<TAttr extends AbAttr>(attrType: { new(...args: any[]): TAttr },
  pokemon: Pokemon, applyFunc: AbAttrApplyFunc<TAttr>, args: any[], isAsync: boolean = false, showAbilityInstant: boolean = false, quiet: boolean = false, passive: boolean = false): Promise<void> {
  return new Promise(resolve => {
    if (!pokemon.canApplyAbility(passive)) {
      if (!passive)
        return applyAbAttrsInternal(attrType, pokemon, applyFunc, args, isAsync, showAbilityInstant, quiet, true).then(() => resolve());
      else
        return resolve();
    }

    const ability = (!passive ? pokemon.getAbility() : pokemon.getPassiveAbility());
    const attrs = ability.getAttrs(attrType) as TAttr[];

    const clearSpliceQueueAndResolve = () => {
      pokemon.scene.clearPhaseQueueSplice();
      if (!passive)
        return applyAbAttrsInternal(attrType, pokemon, applyFunc, args, isAsync, showAbilityInstant, quiet, true).then(() => resolve());
      else
        return resolve();
    };
    const applyNextAbAttr = () => {
      if (attrs.length)
        applyAbAttr(attrs.shift());
      else
        clearSpliceQueueAndResolve();
    };
    const applyAbAttr = (attr: TAttr) => {
      if (!canApplyAttr(pokemon, attr))
        return applyNextAbAttr();
      pokemon.scene.setPhaseQueueSplice();
      const onApplySuccess = () => {
        if (attr.showAbility && !quiet) {
          if (showAbilityInstant)
            pokemon.scene.abilityBar.showAbility(pokemon, passive);
          else
            queueShowAbility(pokemon, passive);
        }
        if (!quiet) {
          const message = attr.getTriggerMessage(pokemon, (!passive ? pokemon.getAbility() : pokemon.getPassiveAbility()).name, args);
          if (message) {
            if (isAsync)
              pokemon.scene.ui.showText(message, null, () => pokemon.scene.ui.showText(null, 0), null, true);
            else
              pokemon.scene.queueMessage(message);
          }
        }
      };
      const result = applyFunc(attr, passive);
      if (result instanceof Promise) {
        result.then(success => {
          if (success)
            onApplySuccess();
          applyNextAbAttr();
        });
      } else {
        if (result)
          onApplySuccess();
        applyNextAbAttr();
      }
    };
    applyNextAbAttr();
  });
}

export function applyAbAttrs(attrType: { new(...args: any[]): AbAttr }, pokemon: Pokemon, cancelled: Utils.BooleanHolder, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<AbAttr>(attrType, pokemon, (attr, passive) => attr.apply(pokemon, passive, cancelled, args), args);
}

export function applyPostBattleInitAbAttrs(attrType: { new(...args: any[]): PostBattleInitAbAttr },
  pokemon: Pokemon, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PostBattleInitAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPostBattleInit(pokemon, passive, args), args);
}

export function applyPreDefendAbAttrs(attrType: { new(...args: any[]): PreDefendAbAttr },
  pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, cancelled: Utils.BooleanHolder, ...args: any[]): Promise<void> {
  const simulated = args.length > 1 && args[1];
  return applyAbAttrsInternal<PreDefendAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPreDefend(pokemon, passive, attacker, move, cancelled, args), args, false, false, simulated);
}

export function applyPostDefendAbAttrs(attrType: { new(...args: any[]): PostDefendAbAttr },
  pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PostDefendAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPostDefend(pokemon, passive, attacker, move, hitResult, args), args);
}

export function applyBattleStatMultiplierAbAttrs(attrType: { new(...args: any[]): BattleStatMultiplierAbAttr },
  pokemon: Pokemon, battleStat: BattleStat, statValue: Utils.NumberHolder, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<BattleStatMultiplierAbAttr>(attrType, pokemon, (attr, passive) => attr.applyBattleStat(pokemon, passive, battleStat, statValue, args), args);
}

export function applyPreAttackAbAttrs(attrType: { new(...args: any[]): PreAttackAbAttr },
  pokemon: Pokemon, defender: Pokemon, move: PokemonMove, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PreAttackAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPreAttack(pokemon, passive, defender, move, args), args);
}

export function applyPostAttackAbAttrs(attrType: { new(...args: any[]): PostAttackAbAttr },
  pokemon: Pokemon, defender: Pokemon, move: PokemonMove, hitResult: HitResult, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PostAttackAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPostAttack(pokemon, passive, defender, move, hitResult, args), args);
}

export function applyPostKnockOutAbAttrs(attrType: { new(...args: any[]): PostKnockOutAbAttr },
  pokemon: Pokemon, knockedOut: Pokemon, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PostKnockOutAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPostKnockOut(pokemon, passive, knockedOut, args), args);
} 

export function applyPostVictoryAbAttrs(attrType: { new(...args: any[]): PostVictoryAbAttr },
  pokemon: Pokemon, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PostVictoryAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPostVictory(pokemon, passive, args), args);
}

export function applyPostSummonAbAttrs(attrType: { new(...args: any[]): PostSummonAbAttr },
  pokemon: Pokemon, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PostSummonAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPostSummon(pokemon, passive, args), args);
}

export function applyPreSwitchOutAbAttrs(attrType: { new(...args: any[]): PreSwitchOutAbAttr },
  pokemon: Pokemon, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PreSwitchOutAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPreSwitchOut(pokemon, passive, args), args, false, true);
}

export function applyPreStatChangeAbAttrs(attrType: { new(...args: any[]): PreStatChangeAbAttr },
  pokemon: Pokemon, stat: BattleStat, cancelled: Utils.BooleanHolder, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PreStatChangeAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPreStatChange(pokemon, passive, stat, cancelled, args), args);
}

export function applyPostStatChangeAbAttrs(attrType: { new(...args: any[]): PostStatChangeAbAttr },
  pokemon: Pokemon, stats: BattleStat[], levels: integer, selfTarget: boolean, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PostStatChangeAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPostStatChange(pokemon, stats, levels, selfTarget, args), args);
}

export function applyPreSetStatusAbAttrs(attrType: { new(...args: any[]): PreSetStatusAbAttr },
  pokemon: Pokemon, effect: StatusEffect, cancelled: Utils.BooleanHolder, ...args: any[]): Promise<void> {
  const simulated = args.length > 1 && args[1];
  return applyAbAttrsInternal<PreSetStatusAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPreSetStatus(pokemon, passive, effect, cancelled, args), args, false, false, !simulated);
}

export function applyPreApplyBattlerTagAbAttrs(attrType: { new(...args: any[]): PreApplyBattlerTagAbAttr },
  pokemon: Pokemon, tag: BattlerTag, cancelled: Utils.BooleanHolder, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PreApplyBattlerTagAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPreApplyBattlerTag(pokemon, passive, tag, cancelled, args), args);
}

export function applyPreWeatherEffectAbAttrs(attrType: { new(...args: any[]): PreWeatherEffectAbAttr },
  pokemon: Pokemon, weather: Weather, cancelled: Utils.BooleanHolder, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PreWeatherDamageAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPreWeatherEffect(pokemon, passive, weather, cancelled, args), args, false, true);
}

export function applyPostTurnAbAttrs(attrType: { new(...args: any[]): PostTurnAbAttr },
  pokemon: Pokemon, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PostTurnAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPostTurn(pokemon, passive, args), args);
}

export function applyPostWeatherChangeAbAttrs(attrType: { new(...args: any[]): PostWeatherChangeAbAttr },
  pokemon: Pokemon, weather: WeatherType, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PostWeatherChangeAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPostWeatherChange(pokemon, passive, weather, args), args);
}

export function applyPostWeatherLapseAbAttrs(attrType: { new(...args: any[]): PostWeatherLapseAbAttr },
  pokemon: Pokemon, weather: Weather, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PostWeatherLapseAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPostWeatherLapse(pokemon, passive, weather, args), args);
}

export function applyPostTerrainChangeAbAttrs(attrType: { new(...args: any[]): PostTerrainChangeAbAttr },
  pokemon: Pokemon, terrain: TerrainType, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PostTerrainChangeAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPostTerrainChange(pokemon, passive, terrain, args), args);
}

export function applyCheckTrappedAbAttrs(attrType: { new(...args: any[]): CheckTrappedAbAttr },
  pokemon: Pokemon, trapped: Utils.BooleanHolder, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<CheckTrappedAbAttr>(attrType, pokemon, (attr, passive) => attr.applyCheckTrapped(pokemon, passive, trapped, args), args, true);
}

export function applyPostBattleAbAttrs(attrType: { new(...args: any[]): PostBattleAbAttr },
  pokemon: Pokemon, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PostBattleAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPostBattle(pokemon, passive, args), args);
}

export function applyPostFaintAbAttrs(attrType: { new(...args: any[]): PostFaintAbAttr },
  pokemon: Pokemon, attacker: Pokemon, move: PokemonMove, hitResult: HitResult, ...args: any[]): Promise<void> {
  return applyAbAttrsInternal<PostFaintAbAttr>(attrType, pokemon, (attr, passive) => attr.applyPostFaint(pokemon, passive, attacker, move, hitResult, args), args);
}

function canApplyAttr(pokemon: Pokemon, attr: AbAttr): boolean {
  const condition = attr.getCondition();
  return !condition || condition(pokemon);
}

function queueShowAbility(pokemon: Pokemon, passive: boolean): void {
  pokemon.scene.unshiftPhase(new ShowAbilityPhase(pokemon.scene, pokemon.id, passive));
  pokemon.scene.clearPhaseQueueSplice();
}

export const allAbilities = [ new Ability(Abilities.NONE, 3) ];

export function initAbilities() {
  allAbilities.push(
    new Ability(Abilities.STENCH, 3)
      .attr(PostAttackApplyBattlerTagAbAttr, false, (user, target, move) => !move.getMove().findAttr(attr => attr instanceof FlinchAttr) ? 10 : 0, BattlerTagType.FLINCHED),
    new Ability(Abilities.DRIZZLE, 3)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.RAIN)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.RAIN),
    new Ability(Abilities.SPEED_BOOST, 3)
      .attr(PostTurnStatChangeAbAttr, BattleStat.SPD, 1),
    new Ability(Abilities.BATTLE_ARMOR, 3)
      .attr(BlockCritAbAttr)
      .ignorable(),
    new Ability(Abilities.STURDY, 3)    
      .attr(PreDefendFullHpEndureAbAttr)
      .attr(BlockOneHitKOAbAttr)
      .ignorable(),
    new Ability(Abilities.DAMP, 3)
      .attr(FieldPreventExplosiveMovesAbAttr)
      .ignorable(),
    new Ability(Abilities.LIMBER, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.PARALYSIS)
      .ignorable(),
    new Ability(Abilities.SAND_VEIL, 3)
      .attr(BattleStatMultiplierAbAttr, BattleStat.EVA, 1.2)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM))
      .ignorable(),
    new Ability(Abilities.STATIC, 3)
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.PARALYSIS),
    new Ability(Abilities.VOLT_ABSORB, 3)
      .attr(TypeImmunityHealAbAttr, Type.ELECTRIC)
      .ignorable(),
    new Ability(Abilities.WATER_ABSORB, 3)
      .attr(TypeImmunityHealAbAttr, Type.WATER)
      .ignorable(),
    new Ability(Abilities.OBLIVIOUS, 3)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.INFATUATED)
      .ignorable(),
    new Ability(Abilities.CLOUD_NINE, 3)
      .attr(SuppressWeatherEffectAbAttr, true),
    new Ability(Abilities.COMPOUND_EYES, 3)
      .attr(BattleStatMultiplierAbAttr, BattleStat.ACC, 1.3),
    new Ability(Abilities.INSOMNIA, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .ignorable(),
    new Ability(Abilities.COLOR_CHANGE, 3)
      .attr(PostDefendTypeChangeAbAttr),
    new Ability(Abilities.IMMUNITY, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .ignorable(),
    new Ability(Abilities.FLASH_FIRE, 3)
      .attr(TypeImmunityAddBattlerTagAbAttr, Type.FIRE, BattlerTagType.FIRE_BOOST, 1, (pokemon: Pokemon) => !pokemon.status || pokemon.status.effect !== StatusEffect.FREEZE)
      .ignorable(),
    new Ability(Abilities.SHIELD_DUST, 3)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.OWN_TEMPO, 3)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.CONFUSED)
      .ignorable(),
    new Ability(Abilities.SUCTION_CUPS, 3)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.INTIMIDATE, 3)
      .attr(PostSummonStatChangeAbAttr, BattleStat.ATK, -1),
    new Ability(Abilities.SHADOW_TAG, 3)
      .attr(ArenaTrapAbAttr),
    new Ability(Abilities.ROUGH_SKIN, 3)
      .attr(PostDefendContactDamageAbAttr, 8)
      .bypassFaint(),
    new Ability(Abilities.WONDER_GUARD, 3)
      .attr(NonSuperEffectiveImmunityAbAttr)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .ignorable(),
    new Ability(Abilities.LEVITATE, 3)
      .attr(TypeImmunityAbAttr, Type.GROUND, (pokemon: Pokemon) => !pokemon.getTag(BattlerTagType.IGNORE_FLYING) && !pokemon.scene.arena.getTag(ArenaTagType.GRAVITY) && !pokemon.getTag(BattlerTagType.GROUNDED))
      .ignorable(),
    new Ability(Abilities.EFFECT_SPORE, 3)
      .attr(PostDefendContactApplyStatusEffectAbAttr, 10, StatusEffect.POISON, StatusEffect.PARALYSIS, StatusEffect.SLEEP),
    new Ability(Abilities.SYNCHRONIZE, 3)
      .attr(SyncEncounterNatureAbAttr)
      .unimplemented(),
    new Ability(Abilities.CLEAR_BODY, 3)
      .attr(ProtectStatAbAttr)
      .ignorable(),
    new Ability(Abilities.NATURAL_CURE, 3)
      .attr(PreSwitchOutResetStatusAbAttr),
    new Ability(Abilities.LIGHTNING_ROD, 3)
      .attr(RedirectTypeMoveAbAttr, Type.ELECTRIC)
      .attr(TypeImmunityStatChangeAbAttr, Type.ELECTRIC, BattleStat.SPATK, 1)
      .ignorable(),
    new Ability(Abilities.SERENE_GRACE, 3)
      .unimplemented(),
    new Ability(Abilities.SWIFT_SWIM, 3)
      .attr(BattleStatMultiplierAbAttr, BattleStat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.RAIN, WeatherType.HEAVY_RAIN)),
    new Ability(Abilities.CHLOROPHYLL, 3)
      .attr(BattleStatMultiplierAbAttr, BattleStat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN)),
    new Ability(Abilities.ILLUMINATE, 3)
      .attr(ProtectStatAbAttr, BattleStat.ACC)
      .attr(DoubleBattleChanceAbAttr)
      .ignorable(),
    new Ability(Abilities.TRACE, 3)
      .attr(TraceAbAttr)
      .attr(UncopiableAbilityAbAttr),
    new Ability(Abilities.HUGE_POWER, 3)
      .attr(BattleStatMultiplierAbAttr, BattleStat.ATK, 2),
    new Ability(Abilities.POISON_POINT, 3)
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.POISON),
    new Ability(Abilities.INNER_FOCUS, 3)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.FLINCHED)
      .ignorable(),
    new Ability(Abilities.MAGMA_ARMOR, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.FREEZE)
      .ignorable(),
    new Ability(Abilities.WATER_VEIL, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.BURN)
      .ignorable(),
    new Ability(Abilities.MAGNET_PULL, 3)
      /*.attr(ArenaTrapAbAttr)
      .condition((pokemon: Pokemon) => pokemon.getOpponent()?.isOfType(Type.STEEL))*/
      .unimplemented(),
    new Ability(Abilities.SOUNDPROOF, 3)
      .attr(MoveImmunityAbAttr, (pokemon, attacker, move) => pokemon !== attacker && move.getMove().hasFlag(MoveFlags.SOUND_BASED))
      .ignorable(),
    new Ability(Abilities.RAIN_DISH, 3)
      .attr(PostWeatherLapseHealAbAttr, 1, WeatherType.RAIN, WeatherType.HEAVY_RAIN),
    new Ability(Abilities.SAND_STREAM, 3)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SANDSTORM)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SANDSTORM),
    new Ability(Abilities.PRESSURE, 3)
      .attr(IncreasePpAbAttr)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => getPokemonMessage(pokemon, ' is exerting its Pressure!')),
    new Ability(Abilities.THICK_FAT, 3)
      .attr(ReceivedTypeDamageMultiplierAbAttr, Type.FIRE, 0.5)
      .attr(ReceivedTypeDamageMultiplierAbAttr, Type.ICE, 0.5)
      .ignorable(),
    new Ability(Abilities.EARLY_BIRD, 3)
      .attr(ReduceStatusEffectDurationAbAttr, StatusEffect.SLEEP),
    new Ability(Abilities.FLAME_BODY, 3)
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.BURN),
    new Ability(Abilities.RUN_AWAY, 3)
      .attr(RunSuccessAbAttr),
    new Ability(Abilities.KEEN_EYE, 3)
      .attr(ProtectStatAbAttr, BattleStat.ACC)
      .ignorable(),
    new Ability(Abilities.HYPER_CUTTER, 3)
      .attr(ProtectStatAbAttr, BattleStat.ATK)
      .ignorable(),
    new Ability(Abilities.PICKUP, 3)
      .attr(PostBattleLootAbAttr),
    new Ability(Abilities.TRUANT, 3)
      .attr(PostSummonAddBattlerTagAbAttr, BattlerTagType.TRUANT, 1, false),
    new Ability(Abilities.HUSTLE, 3)
      .attr(BattleStatMultiplierAbAttr, BattleStat.ATK, 1.5)
      .attr(BattleStatMultiplierAbAttr, BattleStat.ACC, 0.8),
    new Ability(Abilities.CUTE_CHARM, 3)
      .attr(PostDefendContactApplyTagChanceAbAttr, 30, BattlerTagType.INFATUATED),
    new Ability(Abilities.PLUS, 3)
      .unimplemented(),
    new Ability(Abilities.MINUS, 3)
      .unimplemented(),
    new Ability(Abilities.FORECAST, 3)
      .attr(UncopiableAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .unimplemented(),
    new Ability(Abilities.STICKY_HOLD, 3)
      .attr(BlockItemTheftAbAttr)
      .bypassFaint()
      .ignorable(),
    new Ability(Abilities.SHED_SKIN, 3)
      .conditionalAttr(pokemon => !Utils.randSeedInt(3), PostTurnResetStatusAbAttr),
    new Ability(Abilities.GUTS, 3)
      .attr(BypassBurnDamageReductionAbAttr)
      .conditionalAttr(pokemon => !!pokemon.status, BattleStatMultiplierAbAttr, BattleStat.ATK, 1.5),
    new Ability(Abilities.MARVEL_SCALE, 3)
      .conditionalAttr(pokemon => !!pokemon.status, BattleStatMultiplierAbAttr, BattleStat.DEF, 1.5)
      .ignorable(),
    new Ability(Abilities.LIQUID_OOZE, 3)
      .attr(ReverseDrainAbAttr),
    new Ability(Abilities.OVERGROW, 3)
      .attr(LowHpMoveTypePowerBoostAbAttr, Type.GRASS),
    new Ability(Abilities.BLAZE, 3)
      .attr(LowHpMoveTypePowerBoostAbAttr, Type.FIRE),
    new Ability(Abilities.TORRENT, 3)
      .attr(LowHpMoveTypePowerBoostAbAttr, Type.WATER),
    new Ability(Abilities.SWARM, 3)
      .attr(LowHpMoveTypePowerBoostAbAttr, Type.BUG),
    new Ability(Abilities.ROCK_HEAD, 3)
      .attr(BlockRecoilDamageAttr),
    new Ability(Abilities.DROUGHT, 3)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SUNNY)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SUNNY),
    new Ability(Abilities.ARENA_TRAP, 3)
      .attr(ArenaTrapAbAttr)
      .attr(DoubleBattleChanceAbAttr),
    new Ability(Abilities.VITAL_SPIRIT, 3)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .ignorable(),
    new Ability(Abilities.WHITE_SMOKE, 3)
      .attr(ProtectStatAbAttr)
      .ignorable(),
    new Ability(Abilities.PURE_POWER, 3)
      .attr(BattleStatMultiplierAbAttr, BattleStat.ATK, 2),
    new Ability(Abilities.SHELL_ARMOR, 3)
      .attr(BlockCritAbAttr)
      .ignorable(),
    new Ability(Abilities.AIR_LOCK, 3)
      .attr(SuppressWeatherEffectAbAttr, true),
    new Ability(Abilities.TANGLED_FEET, 4)
      .conditionalAttr(pokemon => !!pokemon.getTag(BattlerTagType.CONFUSED), BattleStatMultiplierAbAttr, BattleStat.EVA, 2)
      .ignorable(),
    new Ability(Abilities.MOTOR_DRIVE, 4)
      .attr(TypeImmunityStatChangeAbAttr, Type.ELECTRIC, BattleStat.SPD, 1)
      .ignorable(),
    new Ability(Abilities.RIVALRY, 4)
      .attr(MovePowerBoostAbAttr, (user, target, move) => user.gender !== Gender.GENDERLESS && target.gender !== Gender.GENDERLESS && user.gender === target.gender, 1.25)
      .attr(MovePowerBoostAbAttr, (user, target, move) => user.gender !== Gender.GENDERLESS && target.gender !== Gender.GENDERLESS && user.gender !== target.gender, 0.75),
    new Ability(Abilities.STEADFAST, 4)
      .attr(FlinchStatChangeAbAttr, BattleStat.SPD, 1),
    new Ability(Abilities.SNOW_CLOAK, 4)
      .attr(BattleStatMultiplierAbAttr, BattleStat.EVA, 1.2)
      .attr(BlockWeatherDamageAttr, WeatherType.HAIL)
      .condition(getWeatherCondition(WeatherType.HAIL, WeatherType.SNOW))
      .ignorable(),
    new Ability(Abilities.GLUTTONY, 4)
      .attr(ReduceBerryUseThresholdAbAttr),
    new Ability(Abilities.ANGER_POINT, 4)
      .attr(PostDefendCritStatChangeAbAttr, BattleStat.ATK, 6),
    new Ability(Abilities.UNBURDEN, 4)
      .unimplemented(),
    new Ability(Abilities.HEATPROOF, 4)
      .attr(ReceivedTypeDamageMultiplierAbAttr, Type.FIRE, 0.5)
      .ignorable(),
    new Ability(Abilities.SIMPLE, 4)
      .attr(StatChangeMultiplierAbAttr, 2)
      .ignorable(),
    new Ability(Abilities.DRY_SKIN, 4)
      .attr(PostWeatherLapseDamageAbAttr, 2, WeatherType.SUNNY, WeatherType.HARSH_SUN)
      .attr(PostWeatherLapseHealAbAttr, 2, WeatherType.RAIN, WeatherType.HEAVY_RAIN)
      .attr(ReceivedTypeDamageMultiplierAbAttr, Type.FIRE, 1.25)
      .attr(TypeImmunityHealAbAttr, Type.WATER)
      .ignorable(),
    new Ability(Abilities.DOWNLOAD, 4)
      .attr(DownloadAbAttr),
    new Ability(Abilities.IRON_FIST, 4)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.hasFlag(MoveFlags.PUNCHING_MOVE), 1.2),
    new Ability(Abilities.POISON_HEAL, 4)
      .unimplemented(),
    new Ability(Abilities.ADAPTABILITY, 4)
      .attr(StabBoostAbAttr),
    new Ability(Abilities.SKILL_LINK, 4)
      .attr(MaxMultiHitAbAttr),
    new Ability(Abilities.HYDRATION, 4)
      .attr(PostTurnResetStatusAbAttr)
      .condition(getWeatherCondition(WeatherType.RAIN, WeatherType.HEAVY_RAIN)),
    new Ability(Abilities.SOLAR_POWER, 4)
      .attr(PostWeatherLapseDamageAbAttr, 2, WeatherType.SUNNY, WeatherType.HARSH_SUN)
      .attr(BattleStatMultiplierAbAttr, BattleStat.SPATK, 1.5)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN)),
    new Ability(Abilities.QUICK_FEET, 4)
      .conditionalAttr(pokemon => pokemon.status ? pokemon.status.effect === StatusEffect.PARALYSIS : false, BattleStatMultiplierAbAttr, BattleStat.SPD, 2)
      .conditionalAttr(pokemon => !!pokemon.status, BattleStatMultiplierAbAttr, BattleStat.SPD, 1.5),
    new Ability(Abilities.NORMALIZE, 4)
      .attr(MoveTypeChangeAttr, Type.NORMAL, 1.2, (user, target, move) => move.id !== Moves.HIDDEN_POWER && move.id !== Moves.WEATHER_BALL && 
            move.id !== Moves.NATURAL_GIFT && move.id !== Moves.JUDGMENT && move.id !== Moves.TECHNO_BLAST),
    new Ability(Abilities.SNIPER, 4)
      .unimplemented(),
    new Ability(Abilities.MAGIC_GUARD, 4)
      .attr(BlockNonDirectDamageAbAttr),
    new Ability(Abilities.NO_GUARD, 4)
      .attr(AlwaysHitAbAttr)
      .attr(DoubleBattleChanceAbAttr),
    new Ability(Abilities.STALL, 4)
      .unimplemented(),
    new Ability(Abilities.TECHNICIAN, 4)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.power <= 60, 1.5),
    new Ability(Abilities.LEAF_GUARD, 4)
      .attr(StatusEffectImmunityAbAttr)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN))
      .ignorable(),
    new Ability(Abilities.KLUTZ, 4)
      .unimplemented(),
    new Ability(Abilities.MOLD_BREAKER, 4)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => getPokemonMessage(pokemon, ' breaks the mold!'))
      .attr(MoveAbilityBypassAbAttr),
    new Ability(Abilities.SUPER_LUCK, 4)
      .attr(BonusCritAbAttr)
      .partial(),
    new Ability(Abilities.AFTERMATH, 4)
      .attr(PostFaintContactDamageAbAttr,4)
      .bypassFaint(),
    new Ability(Abilities.ANTICIPATION, 4)
      .conditionalAttr(getAnticipationCondition(), PostSummonMessageAbAttr, (pokemon: Pokemon) => getPokemonMessage(pokemon, ' shuddered!')),
    new Ability(Abilities.FOREWARN, 4)
      .unimplemented(),
    new Ability(Abilities.UNAWARE, 4)
      .attr(IgnoreOpponentStatChangesAbAttr)
      .ignorable(),
    new Ability(Abilities.TINTED_LENS, 4)
      .attr(MovePowerBoostAbAttr, (user, target, move) => target.getAttackTypeEffectiveness(move.type) <= 0.5, 2),
    new Ability(Abilities.FILTER, 4)
      .attr(ReceivedMoveDamageMultiplierAbAttr,(target, user, move) => target.getAttackTypeEffectiveness(move.type) >= 2, 0.75)
      .ignorable(),
    new Ability(Abilities.SLOW_START, 4)
      .attr(PostSummonAddBattlerTagAbAttr, BattlerTagType.SLOW_START, 5),
    new Ability(Abilities.SCRAPPY, 4)
      .unimplemented(),
    new Ability(Abilities.STORM_DRAIN, 4)
      .attr(RedirectTypeMoveAbAttr, Type.WATER)
      .attr(TypeImmunityStatChangeAbAttr, Type.WATER, BattleStat.SPATK, 1)
      .ignorable(),
    new Ability(Abilities.ICE_BODY, 4)
      .attr(BlockWeatherDamageAttr, WeatherType.HAIL)
      .attr(PostWeatherLapseHealAbAttr, 1, WeatherType.HAIL, WeatherType.SNOW),
    new Ability(Abilities.SOLID_ROCK, 4)
      .attr(ReceivedMoveDamageMultiplierAbAttr,(target, user, move) => target.getAttackTypeEffectiveness(move.type) >= 2, 0.75)
      .ignorable(),
    new Ability(Abilities.SNOW_WARNING, 4)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SNOW)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SNOW),
    new Ability(Abilities.HONEY_GATHER, 4)
      .unimplemented(),
    new Ability(Abilities.FRISK, 4)
      .unimplemented(),
    new Ability(Abilities.RECKLESS, 4)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.getAttrs(RecoilAttr).length && move.id !== Moves.STRUGGLE, 1.2),
    new Ability(Abilities.MULTITYPE, 4)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(UnsuppressableAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .unimplemented(),
    new Ability(Abilities.FLOWER_GIFT, 4)
      .conditionalAttr(getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN), BattleStatMultiplierAbAttr, BattleStat.ATK, 1.5)
      .conditionalAttr(getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN), BattleStatMultiplierAbAttr, BattleStat.SPDEF, 1.5)
      .attr(UncopiableAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .ignorable()
      .partial(),
    new Ability(Abilities.BAD_DREAMS, 4)
      .unimplemented(),
    new Ability(Abilities.PICKPOCKET, 5)
      .attr(PostDefendStealHeldItemAbAttr, (target, user, move) => move.hasFlag(MoveFlags.MAKES_CONTACT)),
    new Ability(Abilities.SHEER_FORCE, 5)
      .unimplemented(),
    new Ability(Abilities.CONTRARY, 5)
      .attr(StatChangeMultiplierAbAttr, -1)
      .ignorable(),
    new Ability(Abilities.UNNERVE, 5)
      .attr(PreventBerryUseAbAttr),
    new Ability(Abilities.DEFIANT, 5)
      .attr(PostStatChangeStatChangeAbAttr, (target, statsChanged, levels) => levels < 0, [BattleStat.ATK], 2),
    new Ability(Abilities.DEFEATIST, 5)
      .attr(BattleStatMultiplierAbAttr, BattleStat.ATK, 0.5)
      .attr(BattleStatMultiplierAbAttr, BattleStat.SPATK, 0.5)
      .condition((pokemon) => pokemon.getHpRatio() <= 0.5),
    new Ability(Abilities.CURSED_BODY, 5)
      .unimplemented(),
    new Ability(Abilities.HEALER, 5)
      .unimplemented(),
    new Ability(Abilities.FRIEND_GUARD, 5)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.WEAK_ARMOR, 5)
      .attr(PostDefendStatChangeAbAttr, (target, user, move) => move.category === MoveCategory.PHYSICAL, BattleStat.DEF, -1)
      .attr(PostDefendStatChangeAbAttr, (target, user, move) => move.category === MoveCategory.PHYSICAL, BattleStat.SPD, 2),
    new Ability(Abilities.HEAVY_METAL, 5)
      .attr(WeightMultiplierAbAttr, 2)
      .ignorable(),
    new Ability(Abilities.LIGHT_METAL, 5)
      .attr(WeightMultiplierAbAttr, 0.5)
      .ignorable(),
    new Ability(Abilities.MULTISCALE, 5)
      .attr(ReceivedMoveDamageMultiplierAbAttr,(target, user, move) => target.getHpRatio() === 1, 0.5)
      .ignorable(),
    new Ability(Abilities.TOXIC_BOOST, 5)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.category === MoveCategory.PHYSICAL && (user.status?.effect === StatusEffect.POISON || user.status?.effect === StatusEffect.TOXIC), 1.5),
    new Ability(Abilities.FLARE_BOOST, 5)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.category === MoveCategory.SPECIAL && user.status?.effect === StatusEffect.BURN, 1.5),
    new Ability(Abilities.HARVEST, 5)
      .unimplemented(),
    new Ability(Abilities.TELEPATHY, 5)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.MOODY, 5)
      .attr(MoodyAbAttr),
    new Ability(Abilities.OVERCOAT, 5)
      .attr(BlockWeatherDamageAttr)
      .attr(MoveImmunityAbAttr, (pokemon, attacker, move) => pokemon !== attacker && move.getMove().hasFlag(MoveFlags.POWDER_MOVE))
      .ignorable(),
    new Ability(Abilities.POISON_TOUCH, 5)
      .attr(PostAttackContactApplyStatusEffectAbAttr, 30, StatusEffect.POISON),
    new Ability(Abilities.REGENERATOR, 5)
    .attr(PreSwitchOutHealAbAttr),
    new Ability(Abilities.BIG_PECKS, 5)
      .attr(ProtectStatAbAttr, BattleStat.DEF)
      .ignorable(),
    new Ability(Abilities.SAND_RUSH, 5)
      .attr(BattleStatMultiplierAbAttr, BattleStat.SPD, 2)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM)),
    new Ability(Abilities.WONDER_SKIN, 5)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.ANALYTIC, 5)
      .attr(MovePowerBoostAbAttr, (user, target, move) => !!target.getLastXMoves(1).find(m => m.turn === target.scene.currentBattle.turn) || user.scene.currentBattle.turnCommands[target.getBattlerIndex()].command !== Command.FIGHT, 1.3),
    new Ability(Abilities.ILLUSION, 5)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .unimplemented(),
    new Ability(Abilities.IMPOSTER, 5)
      .attr(PostSummonTransformAbAttr)
      .attr(UncopiableAbilityAbAttr),
    new Ability(Abilities.INFILTRATOR, 5)
      .unimplemented(),
    new Ability(Abilities.MUMMY, 5)
      .attr(PostDefendAbilityGiveAbAttr)
      .bypassFaint(),
    new Ability(Abilities.MOXIE, 5)
      .attr(PostVictoryStatChangeAbAttr, BattleStat.ATK, 1),
    new Ability(Abilities.JUSTIFIED, 5)
      .attr(PostDefendStatChangeAbAttr, (target, user, move) => move.type === Type.DARK && move.category !== MoveCategory.STATUS, BattleStat.ATK, 1),
    new Ability(Abilities.RATTLED, 5)
      .attr(PostDefendStatChangeAbAttr, (target, user, move) => move.category !== MoveCategory.STATUS && (move.type === Type.DARK || move.type === Type.BUG ||
        move.type === Type.GHOST), BattleStat.SPD, 1)
      .partial(),
    new Ability(Abilities.MAGIC_BOUNCE, 5)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.SAP_SIPPER, 5)
      .attr(TypeImmunityStatChangeAbAttr, Type.GRASS, BattleStat.ATK, 1)
      .ignorable(),
    new Ability(Abilities.PRANKSTER, 5)
      .attr(IncrementMovePriorityAbAttr, (pokemon, move: Move) => move.category === MoveCategory.STATUS),
    new Ability(Abilities.SAND_FORCE, 5)
      .attr(MoveTypePowerBoostAbAttr, Type.ROCK, 1.3)
      .attr(MoveTypePowerBoostAbAttr, Type.GROUND, 1.3)
      .attr(MoveTypePowerBoostAbAttr, Type.STEEL, 1.3)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM)),
    new Ability(Abilities.IRON_BARBS, 5)
      .attr(PostDefendContactDamageAbAttr, 8)
      .bypassFaint(),
    new Ability(Abilities.ZEN_MODE, 5)
      .attr(PostBattleInitFormChangeAbAttr, p => p.getHpRatio() <= 0.5 ? 1 : 0)
      .attr(PostSummonFormChangeAbAttr, p => p.getHpRatio() <= 0.5 ? 1 : 0)
      .attr(PostTurnFormChangeAbAttr, p => p.getHpRatio() <= 0.5 ? 1 : 0)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(UnsuppressableAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr),
    new Ability(Abilities.VICTORY_STAR, 5)
      .attr(BattleStatMultiplierAbAttr, BattleStat.ACC, 1.1)
      .partial(),
    new Ability(Abilities.TURBOBLAZE, 5)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => getPokemonMessage(pokemon, ' is radiating a blazing aura!'))
      .attr(MoveAbilityBypassAbAttr),
    new Ability(Abilities.TERAVOLT, 5)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => getPokemonMessage(pokemon, ' is radiating a bursting aura!'))
      .attr(MoveAbilityBypassAbAttr),
    new Ability(Abilities.AROMA_VEIL, 6)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.FLOWER_VEIL, 6)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.CHEEK_POUCH, 6)
      .unimplemented(),
    new Ability(Abilities.PROTEAN, 6)
      .unimplemented(),
    new Ability(Abilities.FUR_COAT, 6)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => move.category === MoveCategory.PHYSICAL, 0.5)
      .ignorable(),
    new Ability(Abilities.MAGICIAN, 6)
      .attr(PostAttackStealHeldItemAbAttr),
    new Ability(Abilities.BULLETPROOF, 6)
      .attr(MoveImmunityAbAttr, (pokemon, attacker, move) => pokemon !== attacker && move.getMove().hasFlag(MoveFlags.BALLBOMB_MOVE))
      .ignorable(),
    new Ability(Abilities.COMPETITIVE, 6)
      .attr(PostStatChangeStatChangeAbAttr, (target, statsChanged, levels) => levels < 0, [BattleStat.SPATK], 2),
    new Ability(Abilities.STRONG_JAW, 6)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.hasFlag(MoveFlags.BITING_MOVE), 1.5),
    new Ability(Abilities.REFRIGERATE, 6)
      .attr(MoveTypeChangePowerMultiplierAbAttr, Type.NORMAL, Type.ICE, 1.2),
    new Ability(Abilities.SWEET_VEIL, 6)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .ignorable()
      .partial(),
    new Ability(Abilities.STANCE_CHANGE, 6)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(UnsuppressableAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr),
    new Ability(Abilities.GALE_WINGS, 6)
      .attr(IncrementMovePriorityAbAttr, (pokemon, move) => pokemon.getHpRatio() === 1 && move.type === Type.FLYING),
    new Ability(Abilities.MEGA_LAUNCHER, 6)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.hasFlag(MoveFlags.PULSE_MOVE), 1.5),
    new Ability(Abilities.GRASS_PELT, 6)
      .conditionalAttr(getTerrainCondition(TerrainType.GRASSY), BattleStatMultiplierAbAttr, BattleStat.DEF, 1.5)
      .ignorable(),
    new Ability(Abilities.SYMBIOSIS, 6)
      .unimplemented(),
    new Ability(Abilities.TOUGH_CLAWS, 6)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.hasFlag(MoveFlags.MAKES_CONTACT), 1.3),
    new Ability(Abilities.PIXILATE, 6)
      .attr(MoveTypeChangePowerMultiplierAbAttr, Type.NORMAL, Type.FAIRY, 1.2),
    new Ability(Abilities.GOOEY, 6)
      .attr(PostDefendStatChangeAbAttr, (target, user, move) => move.hasFlag(MoveFlags.MAKES_CONTACT), BattleStat.SPD, -1, false),
    new Ability(Abilities.AERILATE, 6)
      .attr(MoveTypeChangePowerMultiplierAbAttr, Type.NORMAL, Type.FLYING, 1.2),
    new Ability(Abilities.PARENTAL_BOND, 6)
      .unimplemented(),
    new Ability(Abilities.DARK_AURA, 6)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => getPokemonMessage(pokemon, ' is radiating a Dark Aura!'))
      .attr(FieldMoveTypePowerBoostAbAttr, Type.DARK, 4 / 3),
    new Ability(Abilities.FAIRY_AURA, 6)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) => getPokemonMessage(pokemon, ' is radiating a Fairy Aura!'))
      .attr(FieldMoveTypePowerBoostAbAttr, Type.FAIRY, 4 / 3),
    new Ability(Abilities.AURA_BREAK, 6)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.PRIMORDIAL_SEA, 6)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.HEAVY_RAIN)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.HEAVY_RAIN),
    new Ability(Abilities.DESOLATE_LAND, 6)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.HARSH_SUN)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.HARSH_SUN),
    new Ability(Abilities.DELTA_STREAM, 6)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.STRONG_WINDS)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.STRONG_WINDS),
    new Ability(Abilities.STAMINA, 7)
      .attr(PostDefendStatChangeAbAttr, (target, user, move) => move.category !== MoveCategory.STATUS, BattleStat.DEF, 1),
    new Ability(Abilities.WIMP_OUT, 7)
      .unimplemented(),
    new Ability(Abilities.EMERGENCY_EXIT, 7)
      .unimplemented(),
    new Ability(Abilities.WATER_COMPACTION, 7)
      .attr(PostDefendStatChangeAbAttr, (target, user, move) => move.type === Type.WATER, BattleStat.DEF, 2),
    new Ability(Abilities.MERCILESS, 7)
      .unimplemented(),
    new Ability(Abilities.SHIELDS_DOWN, 7)
      .attr(PostBattleInitFormChangeAbAttr, p => p.formIndex % 7 + (p.getHpRatio() <= 0.5 ? 7 : 0))
      .attr(PostSummonFormChangeAbAttr, p => p.formIndex % 7 + (p.getHpRatio() <= 0.5 ? 7 : 0))
      .attr(PostTurnFormChangeAbAttr, p => p.formIndex % 7 + (p.getHpRatio() <= 0.5 ? 7 : 0))
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(UnsuppressableAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .partial(),
    new Ability(Abilities.STAKEOUT, 7)
      .attr(MovePowerBoostAbAttr, (user, target, move) => user.scene.currentBattle.turnCommands[target.getBattlerIndex()].command === Command.POKEMON, 2),
    new Ability(Abilities.WATER_BUBBLE, 7)
      .attr(ReceivedTypeDamageMultiplierAbAttr, Type.FIRE, 0.5)
      .attr(MoveTypePowerBoostAbAttr, Type.WATER, 1)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.BURN)
      .ignorable(),
    new Ability(Abilities.STEELWORKER, 7)
      .attr(MoveTypePowerBoostAbAttr, Type.STEEL),
    new Ability(Abilities.BERSERK, 7)
      .unimplemented(),
    new Ability(Abilities.SLUSH_RUSH, 7)
      .attr(BattleStatMultiplierAbAttr, BattleStat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.HAIL, WeatherType.SNOW)),
    new Ability(Abilities.LONG_REACH, 7)
      .attr(IgnoreContactAbAttr),
    new Ability(Abilities.LIQUID_VOICE, 7)
      .attr(MoveTypeChangeAttr, Type.WATER, 1, (user, target, move) => move.hasFlag(MoveFlags.SOUND_BASED)),
    new Ability(Abilities.TRIAGE, 7)
      .attr(IncrementMovePriorityAbAttr, (pokemon, move) => move.hasFlag(MoveFlags.TRIAGE_MOVE), 3),
    new Ability(Abilities.GALVANIZE, 7)
      .attr(MoveTypeChangePowerMultiplierAbAttr, Type.NORMAL, Type.ELECTRIC, 1.2),
    new Ability(Abilities.SURGE_SURFER, 7)
      .conditionalAttr(getTerrainCondition(TerrainType.ELECTRIC), BattleStatMultiplierAbAttr, BattleStat.SPD, 2),
    new Ability(Abilities.SCHOOLING, 7)
      .attr(PostBattleInitFormChangeAbAttr, p => p.level < 20 || p.getHpRatio() <= 0.25 ? 0 : 1)
      .attr(PostSummonFormChangeAbAttr, p => p.level < 20 || p.getHpRatio() <= 0.25 ? 0 : 1)
      .attr(PostTurnFormChangeAbAttr, p => p.level < 20 || p.getHpRatio() <= 0.25 ? 0 : 1)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(UnsuppressableAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr),
    new Ability(Abilities.DISGUISE, 7)
      .attr(PreDefendMovePowerToOneAbAttr, (target, user, move) => target.formIndex == 0 && target.getAttackTypeEffectiveness(move.type) > 0)
      .attr(PostSummonFormChangeAbAttr, p => p.battleData.hitCount === 0 ? 0 : 1)
      .attr(PostBattleInitFormChangeAbAttr, p => p.battleData.hitCount === 0 ? 0 : 1)
      .attr(PostDefendFormChangeAbAttr, p => p.battleData.hitCount === 0 ? 0 : 1)
      .attr(PreDefendFormChangeAbAttr, p => p.battleData.hitCount === 0 ? 0 : 1)
      .attr(PostDefendDisguiseAbAttr)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(UnsuppressableAbilityAbAttr)
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .ignorable()
      .partial(),
    new Ability(Abilities.BATTLE_BOND, 7)
      .attr(PostVictoryFormChangeAbAttr, p => p.getFormKey() ? 2 : 1)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(UnsuppressableAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .partial(),
    new Ability(Abilities.POWER_CONSTRUCT, 7) // TODO: 10% Power Construct Zygarde isn't accounted for yet. If changed, update Zygarde's getSpeciesFormIndex entry accordingly
      .attr(PostBattleInitFormChangeAbAttr, p => p.getHpRatio() <= 0.5 ? 4 : 2)
      .attr(PostSummonFormChangeAbAttr, p => p.getHpRatio() <= 0.5 ? 4 : 2)
      .attr(PostTurnFormChangeAbAttr, p => p.getHpRatio() <= 0.5 ? 4 : 2)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(UnsuppressableAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .partial(),
    new Ability(Abilities.CORROSION, 7)
      .unimplemented(),
    new Ability(Abilities.COMATOSE, 7)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(UnsuppressableAbilityAbAttr)
      .unimplemented(),
    new Ability(Abilities.QUEENLY_MAJESTY, 7)
      .attr(FieldPriorityMoveImmunityAbAttr)
      .ignorable(),
    new Ability(Abilities.INNARDS_OUT, 7)
      .unimplemented(),
    new Ability(Abilities.DANCER, 7)
      .unimplemented(),
    new Ability(Abilities.BATTERY, 7)
      .unimplemented(),
    new Ability(Abilities.FLUFFY, 7)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => move.hasFlag(MoveFlags.MAKES_CONTACT), 0.5)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => move.type === Type.FIRE, 2)
      .ignorable(),
    new Ability(Abilities.DAZZLING, 7)
      .attr(FieldPriorityMoveImmunityAbAttr)
      .ignorable(),
    new Ability(Abilities.SOUL_HEART, 7)
      .attr(PostKnockOutStatChangeAbAttr, BattleStat.SPATK, 1),
    new Ability(Abilities.TANGLING_HAIR, 7)
      .attr(PostDefendStatChangeAbAttr, (target, user, move) => move.hasFlag(MoveFlags.MAKES_CONTACT), BattleStat.SPD, -1, false),
    new Ability(Abilities.RECEIVER, 7)
      .attr(CopyFaintedAllyAbilityAbAttr)
      .attr(UncopiableAbilityAbAttr),
    new Ability(Abilities.POWER_OF_ALCHEMY, 7)
      .attr(CopyFaintedAllyAbilityAbAttr)
      .attr(UncopiableAbilityAbAttr),
    new Ability(Abilities.BEAST_BOOST, 7)
      .attr(PostVictoryStatChangeAbAttr, p => {
        const battleStats = Utils.getEnumValues(BattleStat).slice(0, -3).map(s => s as BattleStat);
        let highestBattleStat = 0;
        let highestBattleStatIndex = 0;
        battleStats.map((bs: BattleStat, i: integer) => {
          const stat = p.getStat(bs + 1);
          if (stat > highestBattleStat) {
            highestBattleStatIndex = i;
            highestBattleStat = stat;
          }
        });
        return highestBattleStatIndex;
      }, 1),
    new Ability(Abilities.RKS_SYSTEM, 7)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(UnsuppressableAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .unimplemented(),
    new Ability(Abilities.ELECTRIC_SURGE, 7)
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.ELECTRIC)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.ELECTRIC),
    new Ability(Abilities.PSYCHIC_SURGE, 7)
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.PSYCHIC)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.PSYCHIC),
    new Ability(Abilities.MISTY_SURGE, 7)
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.MISTY)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.MISTY),
    new Ability(Abilities.GRASSY_SURGE, 7)
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.GRASSY)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.GRASSY),
    new Ability(Abilities.FULL_METAL_BODY, 7)
      .attr(ProtectStatAbAttr),
    new Ability(Abilities.SHADOW_SHIELD, 7)
      .attr(ReceivedMoveDamageMultiplierAbAttr,(target, user, move) => target.getHpRatio() === 1, 0.5),
    new Ability(Abilities.PRISM_ARMOR, 7)
      .attr(ReceivedMoveDamageMultiplierAbAttr,(target, user, move) => target.getAttackTypeEffectiveness(move.type) >= 2, 0.75),
    new Ability(Abilities.NEUROFORCE, 7)
      .attr(MovePowerBoostAbAttr, (user, target, move) => target.getAttackTypeEffectiveness(move.type) >= 2, 1.25),
    new Ability(Abilities.INTREPID_SWORD, 8)
      .attr(PostSummonStatChangeAbAttr, BattleStat.ATK, 1, true),
    new Ability(Abilities.DAUNTLESS_SHIELD, 8)
      .attr(PostSummonStatChangeAbAttr, BattleStat.DEF, 1, true),
    new Ability(Abilities.LIBERO, 8)
      .unimplemented(),
    new Ability(Abilities.BALL_FETCH, 8)
      .unimplemented(),
    new Ability(Abilities.COTTON_DOWN, 8)
      .unimplemented(),
    new Ability(Abilities.PROPELLER_TAIL, 8)
      .unimplemented(),
    new Ability(Abilities.MIRROR_ARMOR, 8)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.GULP_MISSILE, 8)
      .attr(UnsuppressableAbilityAbAttr)
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .unimplemented(),
    new Ability(Abilities.STALWART, 8)
      .unimplemented(),
    new Ability(Abilities.STEAM_ENGINE, 8)
      .attr(PostDefendStatChangeAbAttr, (target, user, move) => (move.type === Type.FIRE || move.type === Type.WATER) && move.category !== MoveCategory.STATUS, BattleStat.SPD, 6),
    new Ability(Abilities.PUNK_ROCK, 8)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.hasFlag(MoveFlags.SOUND_BASED), 1.3)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => move.hasFlag(MoveFlags.SOUND_BASED), 0.5)
      .ignorable(),
    new Ability(Abilities.SAND_SPIT, 8)
      .attr(PostDefendWeatherChangeAbAttr, WeatherType.SANDSTORM),
    new Ability(Abilities.ICE_SCALES, 8)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, user, move) => move.category === MoveCategory.SPECIAL, 0.5)
      .ignorable(),
    new Ability(Abilities.RIPEN, 8)
      .attr(DoubleBerryEffectAbAttr),
    new Ability(Abilities.ICE_FACE, 8)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(UnsuppressableAbilityAbAttr)
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.POWER_SPOT, 8)
      .unimplemented(),
    new Ability(Abilities.MIMICRY, 8)
      .unimplemented(),
    new Ability(Abilities.SCREEN_CLEANER, 8)
      .unimplemented(),
    new Ability(Abilities.STEELY_SPIRIT, 8)
      .unimplemented(),
    new Ability(Abilities.PERISH_BODY, 8)
      .unimplemented(),
    new Ability(Abilities.WANDERING_SPIRIT, 8)
      .attr(PostDefendAbilitySwapAbAttr)
      .bypassFaint()
      .partial(),
    new Ability(Abilities.GORILLA_TACTICS, 8)
      .unimplemented(),
    new Ability(Abilities.NEUTRALIZING_GAS, 8)
      .attr(SuppressFieldAbilitiesAbAttr)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(NoTransformAbilityAbAttr)
      .partial(),
    new Ability(Abilities.PASTEL_VEIL, 8)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .ignorable(),
    new Ability(Abilities.HUNGER_SWITCH, 8)
      .attr(PostTurnFormChangeAbAttr, p => p.getFormKey ? 0 : 1)
      .attr(PostTurnFormChangeAbAttr, p => p.getFormKey ? 1 : 0)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr),
    new Ability(Abilities.QUICK_DRAW, 8)
      .unimplemented(),
    new Ability(Abilities.UNSEEN_FIST, 8)
      .unimplemented(),
    new Ability(Abilities.CURIOUS_MEDICINE, 8)
      .unimplemented(),
    new Ability(Abilities.TRANSISTOR, 8)
      .attr(MoveTypePowerBoostAbAttr, Type.ELECTRIC),
    new Ability(Abilities.DRAGONS_MAW, 8)
      .attr(MoveTypePowerBoostAbAttr, Type.DRAGON),
    new Ability(Abilities.CHILLING_NEIGH, 8)
      .attr(PostVictoryStatChangeAbAttr, BattleStat.ATK, 1),
    new Ability(Abilities.GRIM_NEIGH, 8)
      .attr(PostVictoryStatChangeAbAttr, BattleStat.SPATK, 1),
    new Ability(Abilities.AS_ONE_GLASTRIER, 8)
      .attr(PreventBerryUseAbAttr)
      .attr(PostVictoryStatChangeAbAttr, BattleStat.ATK, 1)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(UnsuppressableAbilityAbAttr),
    new Ability(Abilities.AS_ONE_SPECTRIER, 8)
      .attr(PreventBerryUseAbAttr)
      .attr(PostVictoryStatChangeAbAttr, BattleStat.SPATK, 1)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(UnsuppressableAbilityAbAttr),
    new Ability(Abilities.LINGERING_AROMA, 9)
      .attr(PostDefendAbilityGiveAbAttr)
      .bypassFaint(),
    new Ability(Abilities.SEED_SOWER, 9)
      .attr(PostDefendTerrainChangeAbAttr, TerrainType.GRASSY),
    new Ability(Abilities.THERMAL_EXCHANGE, 9)
      .attr(PostDefendStatChangeAbAttr, (target, user, move) => move.type === Type.FIRE && move.category !== MoveCategory.STATUS, BattleStat.ATK, 1)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.BURN)
      .ignorable(),
    new Ability(Abilities.ANGER_SHELL, 9)
      .unimplemented(),
    new Ability(Abilities.PURIFYING_SALT, 9)
      .attr(StatusEffectImmunityAbAttr)
      .attr(ReceivedTypeDamageMultiplierAbAttr, Type.GHOST, 0.5)
      .ignorable(),
    new Ability(Abilities.WELL_BAKED_BODY, 9)
      .attr(TypeImmunityStatChangeAbAttr, Type.FIRE, BattleStat.DEF, 2)
      .ignorable(),
    new Ability(Abilities.WIND_RIDER, 9)
      .attr(MoveImmunityStatChangeAbAttr, (pokemon, attacker, move) => pokemon !== attacker && move.getMove().hasFlag(MoveFlags.WIND_MOVE), BattleStat.ATK, 1)
      .ignorable()
      .partial(),
    new Ability(Abilities.GUARD_DOG, 9)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.ROCKY_PAYLOAD, 9)
      .attr(MoveTypePowerBoostAbAttr, Type.ROCK),
    new Ability(Abilities.WIND_POWER, 9)
      .attr(PostDefendApplyBattlerTagAbAttr, (target, user, move) => move.hasFlag(MoveFlags.WIND_MOVE), BattlerTagType.CHARGED)
      .partial(),
    new Ability(Abilities.ZERO_TO_HERO, 9)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(UnsuppressableAbilityAbAttr)
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .unimplemented(),
    new Ability(Abilities.COMMANDER, 9)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .unimplemented(),
    new Ability(Abilities.ELECTROMORPHOSIS, 9)
      .attr(PostDefendApplyBattlerTagAbAttr, (target, user, move) => move.category !== MoveCategory.STATUS, BattlerTagType.CHARGED),
    new Ability(Abilities.PROTOSYNTHESIS, 9)
      .conditionalAttr(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN), PostSummonAddBattlerTagAbAttr, BattlerTagType.PROTOSYNTHESIS, 0, true)
      .attr(PostWeatherChangeAddBattlerTagAttr, BattlerTagType.PROTOSYNTHESIS, 0, WeatherType.SUNNY, WeatherType.HARSH_SUN)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(NoTransformAbilityAbAttr),
    new Ability(Abilities.QUARK_DRIVE, 9)
      .conditionalAttr(getTerrainCondition(TerrainType.ELECTRIC), PostSummonAddBattlerTagAbAttr, BattlerTagType.QUARK_DRIVE, 0, true)
      .attr(PostTerrainChangeAddBattlerTagAttr, BattlerTagType.QUARK_DRIVE, 0, TerrainType.ELECTRIC)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(NoTransformAbilityAbAttr),
    new Ability(Abilities.GOOD_AS_GOLD, 9)
      .attr(MoveImmunityAbAttr, (pokemon, attacker, move) => pokemon !== attacker && move.getMove().category === MoveCategory.STATUS)
      .ignorable()
      .partial(),
    new Ability(Abilities.VESSEL_OF_RUIN, 9)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.SWORD_OF_RUIN, 9)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.TABLETS_OF_RUIN, 9)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.BEADS_OF_RUIN, 9)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.ORICHALCUM_PULSE, 9)
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SUNNY)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SUNNY)
      .conditionalAttr(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN), BattleStatMultiplierAbAttr, BattleStat.ATK, 4 / 3),
    new Ability(Abilities.HADRON_ENGINE, 9)
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.ELECTRIC)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.ELECTRIC)
      .conditionalAttr(getTerrainCondition(TerrainType.ELECTRIC), BattleStatMultiplierAbAttr, BattleStat.SPATK, 4 / 3),
    new Ability(Abilities.OPPORTUNIST, 9)
      .unimplemented(),
    new Ability(Abilities.CUD_CHEW, 9)
      .unimplemented(),
    new Ability(Abilities.SHARPNESS, 9)
      .attr(MovePowerBoostAbAttr, (user, target, move) => move.hasFlag(MoveFlags.SLICING_MOVE), 1.5),
    new Ability(Abilities.SUPREME_OVERLORD, 9)
      .unimplemented(),
    new Ability(Abilities.COSTAR, 9)
      .unimplemented(),
    new Ability(Abilities.TOXIC_DEBRIS, 9)
      .attr(PostDefendApplyArenaTrapTagAbAttr, (target, user, move) => move.category === MoveCategory.PHYSICAL, ArenaTagType.TOXIC_SPIKES)
      .bypassFaint(),
    new Ability(Abilities.ARMOR_TAIL, 9)
      .attr(FieldPriorityMoveImmunityAbAttr)  
      .ignorable(),
    new Ability(Abilities.EARTH_EATER, 9)
      .attr(TypeImmunityHealAbAttr, Type.GROUND)
      .ignorable(),
    new Ability(Abilities.MYCELIUM_MIGHT, 9)
      .attr(MoveAbilityBypassAbAttr, (pokemon, move: Move) => move.category === MoveCategory.STATUS)
      .partial(),
    new Ability(Abilities.MINDS_EYE, 9)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.SUPERSWEET_SYRUP, 9)
      .unimplemented(),
    new Ability(Abilities.HOSPITALITY, 9)
      .attr(PostSummonAllyHealAbAttr, 4, true),
    new Ability(Abilities.TOXIC_CHAIN, 9)
      .attr(PostAttackApplyStatusEffectAbAttr, false, 30, StatusEffect.TOXIC),
    new Ability(Abilities.EMBODY_ASPECT_TEAL, 9)
      .attr(PostBattleInitStatChangeAbAttr, BattleStat.SPD, 1, true)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(NoTransformAbilityAbAttr),
    new Ability(Abilities.EMBODY_ASPECT_WELLSPRING, 9)
      .attr(PostBattleInitStatChangeAbAttr, BattleStat.SPDEF, 1, true)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(NoTransformAbilityAbAttr),
    new Ability(Abilities.EMBODY_ASPECT_HEARTHFLAME, 9)
      .attr(PostBattleInitStatChangeAbAttr, BattleStat.ATK, 1, true)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(NoTransformAbilityAbAttr),
    new Ability(Abilities.EMBODY_ASPECT_CORNERSTONE, 9)
      .attr(PostBattleInitStatChangeAbAttr, BattleStat.DEF, 1, true)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(NoTransformAbilityAbAttr),
    new Ability(Abilities.TERA_SHIFT, 9)
      .attr(PostSummonFormChangeAbAttr, p => p.getFormKey() ? 0 : 1)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .attr(UnsuppressableAbilityAbAttr)
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr),
    new Ability(Abilities.TERA_SHELL, 9)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .ignorable()
      .unimplemented(),
    new Ability(Abilities.TERAFORM_ZERO, 9)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .unimplemented(),
    new Ability(Abilities.POISON_PUPPETEER, 9)
      .attr(UncopiableAbilityAbAttr)
      .attr(UnswappableAbilityAbAttr)
      .unimplemented(),
  );
}
