import { Arena } from "../field/arena";
import { Type } from "./type";
import * as Utils from "../utils";
import { MoveCategory, allMoves } from "./move";
import { getPokemonMessage } from "../messages";
import Pokemon, { HitResult, PokemonMove } from "../field/pokemon";
import { MoveEffectPhase, PokemonHealPhase, StatChangePhase} from "../phases";
import { StatusEffect } from "./status-effect";
import { BattlerIndex } from "../battle";
import { Moves } from "./enums/moves";
import { ArenaTagType } from "./enums/arena-tag-type";
import { BlockNonDirectDamageAbAttr, ProtectStatAbAttr, applyAbAttrs } from "./ability";
import { BattleStat } from "./battle-stat";

export enum ArenaTagSide {
  BOTH,
  PLAYER,
  ENEMY
}

export abstract class ArenaTag {
  public tagType: ArenaTagType;
  public turnCount: integer;
  public sourceMove: Moves;
  public sourceId: integer;
  public side: ArenaTagSide;

  constructor(tagType: ArenaTagType, turnCount: integer, sourceMove: Moves, sourceId?: integer, side: ArenaTagSide = ArenaTagSide.BOTH) {
    this.tagType = tagType;
    this.turnCount = turnCount;
    this.sourceMove = sourceMove;
    this.sourceId = sourceId;
    this.side = side;
  }

  apply(arena: Arena, args: any[]): boolean {
    return true;
  }

  onAdd(arena: Arena): void { }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage(`${this.getMoveName()}\'s effect wore off${this.side === ArenaTagSide.PLAYER ? '\non your side' : this.side === ArenaTagSide.ENEMY ? '\non the foe\'s side' : ''}.`);
  }

  onOverlap(arena: Arena): void { }

  lapse(arena: Arena): boolean {
    return this.turnCount < 1 || !!(--this.turnCount);
  }

  getMoveName(): string {
    return this.sourceMove
      ? allMoves[this.sourceMove].name
      : null;
  }
}

export class MistTag extends ArenaTag {
  constructor(turnCount: integer, sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.MIST, turnCount, Moves.MIST, sourceId, side);
  }

  onAdd(arena: Arena): void {
    super.onAdd(arena);

    const source = arena.scene.getPokemonById(this.sourceId);
    arena.scene.queueMessage(getPokemonMessage(source, `'s team became\nshrouded in mist!`));
  }

  apply(arena: Arena, args: any[]): boolean {
    (args[0] as Utils.BooleanHolder).value = true;

    arena.scene.queueMessage('The mist prevented\nthe lowering of stats!');
    
    return true;
  }
}

export class WeakenMoveScreenTag extends ArenaTag {
  constructor(tagType: ArenaTagType, turnCount: integer, sourceMove: Moves, sourceId: integer, side: ArenaTagSide) {
    super(tagType, turnCount, sourceMove, sourceId, side);
  }

  apply(arena: Arena, args: any[]): boolean {
    if ((args[1] as boolean)) {
      (args[2] as Utils.NumberHolder).value = 2732/4096;
    } else {
      (args[2] as Utils.NumberHolder).value = 0.5;
    }
    return true;
  }
}

class ReflectTag extends WeakenMoveScreenTag {
  constructor(turnCount: integer, sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.REFLECT, turnCount, Moves.REFLECT, sourceId, side);
  }

  apply(arena: Arena, args: any[]): boolean {
    if ((args[0] as MoveCategory) === MoveCategory.PHYSICAL) {
      if ((args[1] as boolean)) {
        (args[2] as Utils.NumberHolder).value = 2732/4096;
      } else {
        (args[2] as Utils.NumberHolder).value = 0.5;
      }
      return true;
    }
    return false;
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage(`Reflect reduced the damage of physical moves${this.side === ArenaTagSide.PLAYER ? '\non your side' : this.side === ArenaTagSide.ENEMY ? '\non the foe\'s side' : ''}.`);
  }
}

class LightScreenTag extends WeakenMoveScreenTag {
  constructor(turnCount: integer, sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.LIGHT_SCREEN, turnCount, Moves.LIGHT_SCREEN, sourceId, side);
  }

  apply(arena: Arena, args: any[]): boolean {
    if ((args[0] as MoveCategory) === MoveCategory.SPECIAL) {
      if ((args[1] as boolean)) {
        (args[2] as Utils.NumberHolder).value = 2732/4096;
      } else {
        (args[2] as Utils.NumberHolder).value = 0.5;
      }
      return true;
    }
    return false;
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage(`Light Screen reduced the damage of special moves${this.side === ArenaTagSide.PLAYER ? '\non your side' : this.side === ArenaTagSide.ENEMY ? '\non the foe\'s side' : ''}.`);
  }
}

class AuroraVeilTag extends WeakenMoveScreenTag {
  constructor(turnCount: integer, sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.AURORA_VEIL, turnCount, Moves.AURORA_VEIL, sourceId, side);
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage(`Aurora Veil reduced the damage of moves${this.side === ArenaTagSide.PLAYER ? '\non your side' : this.side === ArenaTagSide.ENEMY ? '\non the foe\'s side' : ''}.`);
  }
}

class WishTag extends ArenaTag {
  private battlerIndex: BattlerIndex;
  private triggerMessage: string;
  private healHp: number;

  constructor(turnCount: integer, sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.WISH, turnCount, Moves.WISH, sourceId, side);
  }

  onAdd(arena: Arena): void {
    const user = arena.scene.getPokemonById(this.sourceId);
    this.battlerIndex = user.getBattlerIndex();
    this.triggerMessage = getPokemonMessage(user, '\'s wish\ncame true!');
    this.healHp = Math.max(Math.floor(user.getMaxHp() / 2), 1);
  }
  
  onRemove(arena: Arena): void {
    const target = arena.scene.getField()[this.battlerIndex];
    if (target?.isActive(true)) {
      arena.scene.queueMessage(this.triggerMessage);
      arena.scene.unshiftPhase(new PokemonHealPhase(target.scene, target.getBattlerIndex(), this.healHp, null, true, false));
    }
  }
}

export class WeakenMoveTypeTag extends ArenaTag {
  private weakenedType: Type;

  constructor(tagType: ArenaTagType, turnCount: integer, type: Type, sourceMove: Moves, sourceId: integer) {
    super(tagType, turnCount, sourceMove, sourceId);

    this.weakenedType = type;
  }

  apply(arena: Arena, args: any[]): boolean {
    if ((args[0] as Type) === this.weakenedType) {
      (args[1] as Utils.NumberHolder).value *= 0.33;
      return true;
    }

    return false;
  }
}

class MudSportTag extends WeakenMoveTypeTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(ArenaTagType.MUD_SPORT, turnCount, Type.ELECTRIC, Moves.MUD_SPORT, sourceId);
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage('Electricity\'s power was weakened!');
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage('The effects of Mud Sport\nhave faded.');
  }
}

class WaterSportTag extends WeakenMoveTypeTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(ArenaTagType.WATER_SPORT, turnCount, Type.FIRE, Moves.WATER_SPORT, sourceId);
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage('Fire\'s power was weakened!');
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage('The effects of Water Sport\nhave faded.');
  }
}

export class ArenaTrapTag extends ArenaTag {
  public layers: integer;
  public maxLayers: integer;

  constructor(tagType: ArenaTagType, sourceMove: Moves, sourceId: integer, side: ArenaTagSide, maxLayers: integer) {
    super(tagType, 0, sourceMove, sourceId, side);

    this.layers = 1;
    this.maxLayers = maxLayers;
  }

  onOverlap(arena: Arena): void {
    if (this.layers < this.maxLayers) {
      this.layers++;

      this.onAdd(arena);
    }
  }

  apply(arena: Arena, args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    if (this.sourceId === pokemon.id || (this.side === ArenaTagSide.PLAYER) !== pokemon.isPlayer())
      return false;

    return this.activateTrap(pokemon);
  }

  activateTrap(pokemon: Pokemon): boolean {
    return false;
  }

  getMatchupScoreMultiplier(pokemon: Pokemon): number {
    return pokemon.isGrounded() ? 1 : Phaser.Math.Linear(0, 1 / Math.pow(2, this.layers), Math.min(pokemon.getHpRatio(), 0.5) * 2);
  }
}

class SpikesTag extends ArenaTrapTag {
  constructor(sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.SPIKES, Moves.SPIKES, sourceId, side, 3);
  }

  onAdd(arena: Arena): void {
    super.onAdd(arena);

    const source = arena.scene.getPokemonById(this.sourceId);
    arena.scene.queueMessage(`${this.getMoveName()} were scattered\nall around ${source.getOpponentDescriptor()}'s feet!`);
  }

  activateTrap(pokemon: Pokemon): boolean {
    if (pokemon.isGrounded()) {
      const cancelled = new Utils.BooleanHolder(false);
      applyAbAttrs(BlockNonDirectDamageAbAttr, pokemon, cancelled);

      if (!cancelled.value) {
        const damageHpRatio = 1 / (10 - 2 * this.layers);
        const damage = Math.ceil(pokemon.getMaxHp() * damageHpRatio);

        pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' is hurt\nby the spikes!'));
        pokemon.damageAndUpdate(damage, HitResult.OTHER);
        if (pokemon.turnData) pokemon.turnData.damageTaken += damage;
        return true;
      }
    }

    return false;
  }
}

class ToxicSpikesTag extends ArenaTrapTag {
  private neutralized: boolean;

  constructor(sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.TOXIC_SPIKES, Moves.TOXIC_SPIKES, sourceId, side, 2);
    this.neutralized = false;
  }

  onAdd(arena: Arena): void {
    super.onAdd(arena);
    
    const source = arena.scene.getPokemonById(this.sourceId);
    arena.scene.queueMessage(`${this.getMoveName()} were scattered\nall around ${source.getOpponentDescriptor()}'s feet!`);
  }

  onRemove(arena: Arena): void {
    if (!this.neutralized)
      super.onRemove(arena);
  }

  activateTrap(pokemon: Pokemon): boolean {
    if (pokemon.isGrounded()) {
      if (pokemon.isOfType(Type.POISON)) {
        this.neutralized = true;
        if (pokemon.scene.arena.removeTag(this.tagType)) {
          pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` absorbed the ${this.getMoveName()}!`));
          return true;
        }
      } else if (!pokemon.status) {
        const toxic = this.layers > 1;
        if (pokemon.trySetStatus(!toxic ? StatusEffect.POISON : StatusEffect.TOXIC, true, null, `the ${this.getMoveName()}`))
          return true;      
      }
    }

    return false;
  }

  getMatchupScoreMultiplier(pokemon: Pokemon): number {
    if (pokemon.isGrounded() || !pokemon.canSetStatus(StatusEffect.POISON, true))
      return 1;
    if (pokemon.isOfType(Type.POISON))
      return 1.25;
    return super.getMatchupScoreMultiplier(pokemon);
  }
}

class DelayedAttackTag extends ArenaTag {
  public targetIndex: BattlerIndex;

  constructor(tagType: ArenaTagType, sourceMove: Moves, sourceId: integer, targetIndex: BattlerIndex) {
    super(tagType, 3, sourceMove, sourceId);

    this.targetIndex = targetIndex;
  }

  lapse(arena: Arena): boolean {
    const ret = super.lapse(arena);

    if (!ret)
      arena.scene.unshiftPhase(new MoveEffectPhase(arena.scene, this.sourceId, [ this.targetIndex ], new PokemonMove(this.sourceMove, 0, 0, true)));

    return ret;
  }

  onRemove(arena: Arena): void { }
}

class StealthRockTag extends ArenaTrapTag {
  constructor(sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.STEALTH_ROCK, Moves.STEALTH_ROCK, sourceId, side, 1);
  }

  onAdd(arena: Arena): void {
    super.onAdd(arena);

    const source = arena.scene.getPokemonById(this.sourceId);
    arena.scene.queueMessage(`Pointed stones float in the air\naround ${source.getOpponentDescriptor()}!`);
  }

  getDamageHpRatio(pokemon: Pokemon): number {
    const effectiveness = pokemon.getAttackTypeEffectiveness(Type.ROCK);

    let damageHpRatio: number;

    switch (effectiveness) {
      case 0:
        damageHpRatio = 0;
        break;
      case 0.25:
        damageHpRatio = 0.03125;
        break;
      case 0.5:
        damageHpRatio = 0.0625;
        break;
      case 1:
        damageHpRatio = 0.125;
        break;
      case 2:
        damageHpRatio = 0.25;
        break;
      case 4:
        damageHpRatio = 0.5;
        break;
    }

    return damageHpRatio;
  }

  activateTrap(pokemon: Pokemon): boolean {
    const cancelled = new Utils.BooleanHolder(false);
    applyAbAttrs(BlockNonDirectDamageAbAttr,  pokemon, cancelled);

    if (cancelled.value)
      return false;
    
    const damageHpRatio = this.getDamageHpRatio(pokemon);

    if (damageHpRatio) {
      const damage = Math.ceil(pokemon.getMaxHp() * damageHpRatio);
      pokemon.scene.queueMessage(`Pointed stones dug into\n${pokemon.name}!`);
      pokemon.damageAndUpdate(damage, HitResult.OTHER);
      if (pokemon.turnData) pokemon.turnData.damageTaken += damage;
    }

    return false;
  }

  getMatchupScoreMultiplier(pokemon: Pokemon): number {
    const damageHpRatio = this.getDamageHpRatio(pokemon);
    return Phaser.Math.Linear(super.getMatchupScoreMultiplier(pokemon), 1, 1 - Math.pow(damageHpRatio, damageHpRatio));
  }
}

class StickyWebTag extends ArenaTrapTag {
  constructor(sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.STICKY_WEB, Moves.STICKY_WEB, sourceId, side, 1);
  }

  onAdd(arena: Arena): void {
    super.onAdd(arena);
    
    const source = arena.scene.getPokemonById(this.sourceId);
    arena.scene.queueMessage(`A ${this.getMoveName()} has been laid out on the ground around the opposing team!`);
  }

  activateTrap(pokemon: Pokemon): boolean {
    if (pokemon.isGrounded()) {
      const cancelled = new Utils.BooleanHolder(false);
      applyAbAttrs(ProtectStatAbAttr, pokemon, cancelled);
      if (!cancelled.value) {
        pokemon.scene.queueMessage(`The opposing ${pokemon.name} was caught in a sticky web!`);
        const statLevels = new Utils.NumberHolder(-1);
        pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), false, [BattleStat.SPD], statLevels.value));
      }
    }

    return false;
  }

}

export class TrickRoomTag extends ArenaTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(ArenaTagType.TRICK_ROOM, turnCount, Moves.TRICK_ROOM, sourceId);
  }

  apply(arena: Arena, args: any[]): boolean {
    const speedReversed = args[0] as Utils.BooleanHolder;
    speedReversed.value = !speedReversed.value;
    return true;
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage(getPokemonMessage(arena.scene.getPokemonById(this.sourceId), ' twisted\nthe dimensions!'));
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage('The twisted dimensions\nreturned to normal!');
  }
}

export class GravityTag extends ArenaTag {
  constructor(turnCount: integer) {
    super(ArenaTagType.GRAVITY, turnCount, Moves.GRAVITY);
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage('Gravity intensified!');
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage('Gravity returned to normal!');
  }
}

export function getArenaTag(tagType: ArenaTagType, turnCount: integer, sourceMove: Moves, sourceId: integer, targetIndex?: BattlerIndex, side: ArenaTagSide = ArenaTagSide.BOTH): ArenaTag {
  switch (tagType) {
    case ArenaTagType.MIST:
      return new MistTag(turnCount, sourceId, side);
    case ArenaTagType.MUD_SPORT:
      return new MudSportTag(turnCount, sourceId);
    case ArenaTagType.WATER_SPORT:
      return new WaterSportTag(turnCount, sourceId);
    case ArenaTagType.SPIKES:
      return new SpikesTag(sourceId, side);
    case ArenaTagType.TOXIC_SPIKES:
      return new ToxicSpikesTag(sourceId, side);
    case ArenaTagType.FUTURE_SIGHT:
    case ArenaTagType.DOOM_DESIRE:
      return new DelayedAttackTag(tagType, sourceMove, sourceId, targetIndex);
    case ArenaTagType.WISH:
      return new WishTag(turnCount, sourceId, side);
    case ArenaTagType.STEALTH_ROCK:
      return new StealthRockTag(sourceId, side);
    case ArenaTagType.STICKY_WEB:
      return new StickyWebTag(sourceId, side);
    case ArenaTagType.TRICK_ROOM:
      return new TrickRoomTag(turnCount, sourceId);
    case ArenaTagType.GRAVITY:
      return new GravityTag(turnCount);
    case ArenaTagType.REFLECT:
      return new ReflectTag(turnCount, sourceId, side);
    case ArenaTagType.LIGHT_SCREEN:
      return new LightScreenTag(turnCount, sourceId, side);
    case ArenaTagType.AURORA_VEIL:
      return new AuroraVeilTag(turnCount, sourceId, side);
  }
}
