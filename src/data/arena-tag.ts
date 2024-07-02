import { Arena } from "../field/arena";
import { Type } from "./type";
import * as Utils from "../utils";
import { MoveCategory, allMoves, MoveTarget } from "./move";
import { getPokemonMessage } from "../messages";
import Pokemon, { HitResult, PokemonMove } from "../field/pokemon";
import { MoveEffectPhase, PokemonHealPhase, ShowAbilityPhase, StatChangePhase } from "../phases";
import { StatusEffect } from "./status-effect";
import { BattlerIndex } from "../battle";
import { BlockNonDirectDamageAbAttr, ProtectStatAbAttr, applyAbAttrs } from "./ability";
import { BattleStat } from "./battle-stat";
import { CommonAnim, CommonBattleAnim } from "./battle-anims";
import i18next from "i18next";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";

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

  onAdd(arena: Arena, quiet: boolean = false): void { }

  onRemove(arena: Arena, quiet: boolean = false): void {
    if (!quiet) {
      arena.scene.queueMessage(`${this.getMoveName()}\'s effect wore off${this.side === ArenaTagSide.PLAYER ? "\non your side" : this.side === ArenaTagSide.ENEMY ? "\non the foe's side" : ""}.`);
    }
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

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Mist_(move) Mist}.
 * Prevents Pokémon on the opposing side from lowering the stats of the Pokémon in the Mist.
 */
export class MistTag extends ArenaTag {
  constructor(turnCount: integer, sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.MIST, turnCount, Moves.MIST, sourceId, side);
  }

  onAdd(arena: Arena, quiet: boolean = false): void {
    super.onAdd(arena);

    const source = arena.scene.getPokemonById(this.sourceId);
    if (!quiet) {
      arena.scene.queueMessage(getPokemonMessage(source, "'s team became\nshrouded in mist!"));
    }
  }

  apply(arena: Arena, args: any[]): boolean {
    (args[0] as Utils.BooleanHolder).value = true;

    arena.scene.queueMessage("The mist prevented\nthe lowering of stats!");

    return true;
  }
}

/**
 * Reduces the damage of specific move categories in the arena.
 * @extends ArenaTag
 */
export class WeakenMoveScreenTag extends ArenaTag {
  protected weakenedCategories: MoveCategory[];

  /**
   * Creates a new instance of the WeakenMoveScreenTag class.
   *
   * @param tagType - The type of the arena tag.
   * @param turnCount - The number of turns the tag is active.
   * @param sourceMove - The move that created the tag.
   * @param sourceId - The ID of the source of the tag.
   * @param side - The side (player or enemy) the tag affects.
   * @param weakenedCategories - The categories of moves that are weakened by this tag.
   */
  constructor(tagType: ArenaTagType, turnCount: integer, sourceMove: Moves, sourceId: integer, side: ArenaTagSide, weakenedCategories: MoveCategory[]) {
    super(tagType, turnCount, sourceMove, sourceId, side);

    this.weakenedCategories = weakenedCategories;
  }

  /**
   * Applies the weakening effect to the move.
   *
   * @param arena - The arena where the move is applied.
   * @param args - The arguments for the move application.
   * @param args[0] - The category of the move.
   * @param args[1] - A boolean indicating whether it is a double battle.
   * @param args[2] - An object of type `Utils.NumberHolder` that holds the damage multiplier
   *
   * @returns True if the move was weakened, otherwise false.
   */
  apply(arena: Arena, args: any[]): boolean {
    if (this.weakenedCategories.includes((args[0] as MoveCategory))) {
      (args[2] as Utils.NumberHolder).value = (args[1] as boolean) ? 2732/4096 : 0.5;
      return true;
    }
    return false;
  }
}

/**
 * Reduces the damage of physical moves.
 * Used by {@linkcode Moves.REFLECT}
 */
class ReflectTag extends WeakenMoveScreenTag {
  constructor(turnCount: integer, sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.REFLECT, turnCount, Moves.REFLECT, sourceId, side, [MoveCategory.PHYSICAL]);
  }

  onAdd(arena: Arena, quiet: boolean = false): void {
    if (!quiet) {
      arena.scene.queueMessage(`Reflect reduced the damage of physical moves${this.side === ArenaTagSide.PLAYER ? "\non your side" : this.side === ArenaTagSide.ENEMY ? "\non the foe's side" : ""}.`);
    }
  }
}

/**
 * Reduces the damage of special moves.
 * Used by {@linkcode Moves.LIGHT_SCREEN}
 */
class LightScreenTag extends WeakenMoveScreenTag {
  constructor(turnCount: integer, sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.LIGHT_SCREEN, turnCount, Moves.LIGHT_SCREEN, sourceId, side, [MoveCategory.SPECIAL]);
  }

  onAdd(arena: Arena, quiet: boolean = false): void {
    if (!quiet) {
      arena.scene.queueMessage(`Light Screen reduced the damage of special moves${this.side === ArenaTagSide.PLAYER ? "\non your side" : this.side === ArenaTagSide.ENEMY ? "\non the foe's side" : ""}.`);
    }
  }
}

/**
 * Reduces the damage of physical and special moves.
 * Used by {@linkcode Moves.AURORA_VEIL}
 */
class AuroraVeilTag extends WeakenMoveScreenTag {
  constructor(turnCount: integer, sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.AURORA_VEIL, turnCount, Moves.AURORA_VEIL, sourceId, side, [MoveCategory.SPECIAL, MoveCategory.PHYSICAL]);
  }

  onAdd(arena: Arena, quiet: boolean = false): void {
    if (!quiet) {
      arena.scene.queueMessage(`Aurora Veil reduced the damage of moves${this.side === ArenaTagSide.PLAYER ? "\non your side" : this.side === ArenaTagSide.ENEMY ? "\non the foe's side" : ""}.`);
    }
  }
}

type ProtectConditionFunc = (...args: any[]) => boolean;

/**
 * Abstract class to implement conditional team protection
 * applies protection based on the attributes of incoming moves
 * @param protectConditionFunc: The function determining if an incoming move is negated
 */
abstract class ConditionalProtectTag extends ArenaTag {
  protected protectConditionFunc: ProtectConditionFunc;

  constructor(tagType: ArenaTagType, sourceMove: Moves, sourceId: integer, side: ArenaTagSide, condition: ProtectConditionFunc) {
    super(tagType, 1, sourceMove, sourceId, side);

    this.protectConditionFunc = condition;
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage(`${super.getMoveName()} protected${this.side === ArenaTagSide.PLAYER ? " your" : this.side === ArenaTagSide.ENEMY ? " the\nopposing" : ""} team!`);
  }

  // Removes default message for effect removal
  onRemove(arena: Arena): void { }

  /**
   * apply(): Checks incoming moves against the condition function
   * and protects the target if conditions are met
   * @param arena The arena containing this tag
   * @param args[0] (Utils.BooleanHolder) Signals if the move is cancelled
   * @param args[1] (Pokemon) The intended target of the move
   * @param args[2...] (any[]) The parameters to the condition function
   * @returns
   */
  apply(arena: Arena, args: any[]): boolean {
    if ((args[0] as Utils.BooleanHolder).value) {
      return false;
    }

    const target = args[1] as Pokemon;
    if ((this.side === ArenaTagSide.PLAYER) === target.isPlayer()
         && this.protectConditionFunc(...args.slice(2))) {
      (args[0] as Utils.BooleanHolder).value = true;
      new CommonBattleAnim(CommonAnim.PROTECT, target).play(arena.scene);
      arena.scene.queueMessage(`${super.getMoveName()} protected ${getPokemonMessage(target, "!")}`);
      return true;
    }
    return false;
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Quick_Guard_(move) Quick Guard}
 * Condition: The incoming move has increased priority.
 */
class QuickGuardTag extends ConditionalProtectTag {
  constructor(sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.QUICK_GUARD, Moves.QUICK_GUARD, sourceId, side,
      (priority: integer) : boolean => {
        return priority > 0;
      }
    );
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Wide_Guard_(move) Wide Guard}
 * Condition: The incoming move can target multiple Pokemon. The move's source
 * can be an ally or enemy.
 */
class WideGuardTag extends ConditionalProtectTag {
  constructor(sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.WIDE_GUARD, Moves.WIDE_GUARD, sourceId, side,
      (moveTarget: MoveTarget) : boolean => {
        switch (moveTarget) {
        case MoveTarget.ALL_ENEMIES:
        case MoveTarget.ALL_NEAR_ENEMIES:
        case MoveTarget.ALL_OTHERS:
        case MoveTarget.ALL_NEAR_OTHERS:
          return true;
        }
        return false;
      }
    );
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Mat_Block_(move) Mat Block}
 * Condition: The incoming move is a Physical or Special attack move.
 */
class MatBlockTag extends ConditionalProtectTag {
  constructor(sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.MAT_BLOCK, Moves.MAT_BLOCK, sourceId, side,
      (moveCategory: MoveCategory) : boolean => {
        return moveCategory !== MoveCategory.STATUS;
      }
    );
  }

  onAdd(arena: Arena) {
    const source = arena.scene.getPokemonById(this.sourceId);
    arena.scene.queueMessage(getPokemonMessage(source, " intends to flip up a mat\nand block incoming attacks!"));
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Crafty_Shield_(move) Crafty Shield}
 * Condition: The incoming move is a Status move, is not a hazard, and does
 * not target all Pokemon or sides of the field.
*/
class CraftyShieldTag extends ConditionalProtectTag {
  constructor(sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.CRAFTY_SHIELD, Moves.CRAFTY_SHIELD, sourceId, side,
      (moveCategory: MoveCategory, moveTarget: MoveTarget) : boolean => {
        return moveCategory === MoveCategory.STATUS
          && moveTarget !== MoveTarget.ENEMY_SIDE
          && moveTarget !== MoveTarget.BOTH_SIDES
          && moveTarget !== MoveTarget.ALL;
      }
    );
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Wish_(move) Wish}.
 * Heals the Pokémon in the user's position the turn after Wish is used.
 */
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
    this.triggerMessage = getPokemonMessage(user, "'s wish\ncame true!");
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

/**
 * Abstract class to implement weakened moves of a specific type.
 */
export class WeakenMoveTypeTag extends ArenaTag {
  private weakenedType: Type;

  /**
   * Creates a new instance of the WeakenMoveTypeTag class.
   *
   * @param tagType - The type of the arena tag.
   * @param turnCount - The number of turns the tag is active.
   * @param type - The type being weakened from this tag.
   * @param sourceMove - The move that created the tag.
   * @param sourceId - The ID of the source of the tag.
   */
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

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Mud_Sport_(move) Mud Sport}.
 * Weakens Electric type moves for a set amount of turns, usually 5.
 */
class MudSportTag extends WeakenMoveTypeTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(ArenaTagType.MUD_SPORT, turnCount, Type.ELECTRIC, Moves.MUD_SPORT, sourceId);
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage("Electricity's power was weakened!");
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage("The effects of Mud Sport\nhave faded.");
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Water_Sport_(move) Water Sport}.
 * Weakens Fire type moves for a set amount of turns, usually 5.
 */
class WaterSportTag extends WeakenMoveTypeTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(ArenaTagType.WATER_SPORT, turnCount, Type.FIRE, Moves.WATER_SPORT, sourceId);
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage("Fire's power was weakened!");
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage("The effects of Water Sport\nhave faded.");
  }
}

/**
 * Abstract class to implement arena traps.
 */
export class ArenaTrapTag extends ArenaTag {
  public layers: integer;
  public maxLayers: integer;

  /**
   * Creates a new instance of the ArenaTrapTag class.
   *
   * @param tagType - The type of the arena tag.
   * @param sourceMove - The move that created the tag.
   * @param sourceId - The ID of the source of the tag.
   * @param side - The side (player or enemy) the tag affects.
   * @param maxLayers - The maximum amount of layers this tag can have.
   */
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
    if (this.sourceId === pokemon.id || (this.side === ArenaTagSide.PLAYER) !== pokemon.isPlayer()) {
      return false;
    }

    return this.activateTrap(pokemon);
  }

  activateTrap(pokemon: Pokemon): boolean {
    return false;
  }

  getMatchupScoreMultiplier(pokemon: Pokemon): number {
    return pokemon.isGrounded() ? 1 : Phaser.Math.Linear(0, 1 / Math.pow(2, this.layers), Math.min(pokemon.getHpRatio(), 0.5) * 2);
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Spikes_(move) Spikes}.
 * Applies up to 3 layers of Spikes, dealing 1/8th, 1/6th, or 1/4th of the the Pokémon's HP
 * in damage for 1, 2, or 3 layers of Spikes respectively if they are summoned into this trap.
 */
class SpikesTag extends ArenaTrapTag {
  constructor(sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.SPIKES, Moves.SPIKES, sourceId, side, 3);
  }

  onAdd(arena: Arena, quiet: boolean = false): void {
    super.onAdd(arena);

    const source = arena.scene.getPokemonById(this.sourceId);
    if (!quiet) {
      arena.scene.queueMessage(`${this.getMoveName()} were scattered\nall around ${source.getOpponentDescriptor()}'s feet!`);
    }
  }

  activateTrap(pokemon: Pokemon): boolean {
    if (pokemon.isGrounded()) {
      const cancelled = new Utils.BooleanHolder(false);
      applyAbAttrs(BlockNonDirectDamageAbAttr, pokemon, cancelled);

      if (!cancelled.value) {
        const damageHpRatio = 1 / (10 - 2 * this.layers);
        const damage = Math.ceil(pokemon.getMaxHp() * damageHpRatio);

        pokemon.scene.queueMessage(getPokemonMessage(pokemon, " is hurt\nby the spikes!"));
        pokemon.damageAndUpdate(damage, HitResult.OTHER);
        if (pokemon.turnData) {
          pokemon.turnData.damageTaken += damage;
        }
        return true;
      }
    }

    return false;
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Toxic_Spikes_(move) Toxic Spikes}.
 * Applies up to 2 layers of Toxic Spikes, poisoning or badly poisoning any Pokémon who is
 * summoned into this trap if 1 or 2 layers of Toxic Spikes respectively are up. Poison-type
 * Pokémon summoned into this trap remove it entirely.
 */
class ToxicSpikesTag extends ArenaTrapTag {
  private neutralized: boolean;

  constructor(sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.TOXIC_SPIKES, Moves.TOXIC_SPIKES, sourceId, side, 2);
    this.neutralized = false;
  }

  onAdd(arena: Arena, quiet: boolean = false): void {
    super.onAdd(arena);

    const source = arena.scene.getPokemonById(this.sourceId);
    if (!quiet) {
      arena.scene.queueMessage(`${this.getMoveName()} were scattered\nall around ${source.getOpponentDescriptor()}'s feet!`);
    }
  }

  onRemove(arena: Arena): void {
    if (!this.neutralized) {
      super.onRemove(arena);
    }
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
        if (pokemon.trySetStatus(!toxic ? StatusEffect.POISON : StatusEffect.TOXIC, true, null, 0, `the ${this.getMoveName()}`)) {
          return true;
        }
      }
    }

    return false;
  }

  getMatchupScoreMultiplier(pokemon: Pokemon): number {
    if (pokemon.isGrounded() || !pokemon.canSetStatus(StatusEffect.POISON, true)) {
      return 1;
    }
    if (pokemon.isOfType(Type.POISON)) {
      return 1.25;
    }
    return super.getMatchupScoreMultiplier(pokemon);
  }
}

/**
 * Arena Tag class for delayed attacks, such as {@linkcode Moves.FUTURE_SIGHT} or {@linkcode Moves.DOOM_DESIRE}.
 * Delays the attack's effect by a set amount of turns, usually 3 (including the turn the move is used),
 * and deals damage after the turn count is reached.
 */
class DelayedAttackTag extends ArenaTag {
  public targetIndex: BattlerIndex;

  constructor(tagType: ArenaTagType, sourceMove: Moves, sourceId: integer, targetIndex: BattlerIndex) {
    super(tagType, 3, sourceMove, sourceId);

    this.targetIndex = targetIndex;
  }

  lapse(arena: Arena): boolean {
    const ret = super.lapse(arena);

    if (!ret) {
      arena.scene.unshiftPhase(new MoveEffectPhase(arena.scene, this.sourceId, [ this.targetIndex ], new PokemonMove(this.sourceMove, 0, 0, true)));
    }

    return ret;
  }

  onRemove(arena: Arena): void { }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Stealth_Rock_(move) Stealth Rock}.
 * Applies up to 1 layer of Stealth Rocks, dealing percentage-based damage to any Pokémon
 * who is summoned into the trap, based on the Rock type's type effectiveness.
 */
class StealthRockTag extends ArenaTrapTag {
  constructor(sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.STEALTH_ROCK, Moves.STEALTH_ROCK, sourceId, side, 1);
  }

  onAdd(arena: Arena, quiet: boolean = false): void {
    super.onAdd(arena);

    const source = arena.scene.getPokemonById(this.sourceId);
    if (!quiet) {
      arena.scene.queueMessage(`Pointed stones float in the air\naround ${source.getOpponentDescriptor()}!`);
    }
  }

  getDamageHpRatio(pokemon: Pokemon): number {
    const effectiveness = pokemon.getAttackTypeEffectiveness(Type.ROCK, undefined, true);

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

    if (cancelled.value) {
      return false;
    }

    const damageHpRatio = this.getDamageHpRatio(pokemon);

    if (damageHpRatio) {
      const damage = Math.ceil(pokemon.getMaxHp() * damageHpRatio);
      pokemon.scene.queueMessage(`Pointed stones dug into\n${pokemon.name}!`);
      pokemon.damageAndUpdate(damage, HitResult.OTHER);
      if (pokemon.turnData) {
        pokemon.turnData.damageTaken += damage;
      }
    }

    return false;
  }

  getMatchupScoreMultiplier(pokemon: Pokemon): number {
    const damageHpRatio = this.getDamageHpRatio(pokemon);
    return Phaser.Math.Linear(super.getMatchupScoreMultiplier(pokemon), 1, 1 - Math.pow(damageHpRatio, damageHpRatio));
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Sticky_Web_(move) Sticky Web}.
 * Applies up to 1 layer of Sticky Web, which lowers the Speed by one stage
 * to any Pokémon who is summoned into this trap.
 */
class StickyWebTag extends ArenaTrapTag {
  constructor(sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.STICKY_WEB, Moves.STICKY_WEB, sourceId, side, 1);
  }

  onAdd(arena: Arena, quiet: boolean = false): void {
    super.onAdd(arena);

    // does not seem to be used anywhere
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const source = arena.scene.getPokemonById(this.sourceId);
    if (!quiet) {
      arena.scene.queueMessage(`A ${this.getMoveName()} has been laid out on the ground around the opposing team!`);
    }
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

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Trick_Room_(move) Trick Room}.
 * Reverses the Speed stats for all Pokémon on the field as long as this arena tag is up,
 * also reversing the turn order for all Pokémon on the field as well.
 */
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
    arena.scene.queueMessage(getPokemonMessage(arena.scene.getPokemonById(this.sourceId), " twisted\nthe dimensions!"));
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage("The twisted dimensions\nreturned to normal!");
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Gravity_(move) Gravity}.
 * Grounds all Pokémon on the field, including Flying-types and those with
 * {@linkcode Abilities.LEVITATE} for the duration of the arena tag, usually 5 turns.
 */
export class GravityTag extends ArenaTag {
  constructor(turnCount: integer) {
    super(ArenaTagType.GRAVITY, turnCount, Moves.GRAVITY);
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage("Gravity intensified!");
    arena.scene.getField(true).forEach((pokemon) => {
      if (pokemon !== null) {
        pokemon.removeTag(BattlerTagType.MAGNET_RISEN);
      }
    });
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage("Gravity returned to normal!");
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Tailwind_(move) Tailwind}.
 * Doubles the Speed of the Pokémon who created this arena tag, as well as all allied Pokémon.
 * Applies this arena tag for 4 turns (including the turn the move was used).
 */
class TailwindTag extends ArenaTag {
  constructor(turnCount: integer, sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.TAILWIND, turnCount, Moves.TAILWIND, sourceId, side);
  }

  onAdd(arena: Arena, quiet: boolean = false): void {
    if (!quiet) {
      arena.scene.queueMessage(`The Tailwind blew from behind${this.side === ArenaTagSide.PLAYER ? "\nyour" : this.side === ArenaTagSide.ENEMY ? "\nthe opposing" : ""} team!`);
    }

    const source = arena.scene.getPokemonById(this.sourceId);
    const party = source.isPlayer() ? source.scene.getPlayerField() : source.scene.getEnemyField();

    for (const pokemon of party) {
      // Apply the CHARGED tag to party members with the WIND_POWER ability
      if (pokemon.hasAbility(Abilities.WIND_POWER) && !pokemon.getTag(BattlerTagType.CHARGED)) {
        pokemon.addTag(BattlerTagType.CHARGED);
        pokemon.scene.queueMessage(i18next.t("abilityTriggers:windPowerCharged", { pokemonName: pokemon.name, moveName: this.getMoveName() }));
      }
      // Raise attack by one stage if party member has WIND_RIDER ability
      if (pokemon.hasAbility(Abilities.WIND_RIDER)) {
        pokemon.scene.unshiftPhase(new ShowAbilityPhase(pokemon.scene, pokemon.getBattlerIndex()));
        pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [BattleStat.ATK], 1, true));
      }
    }
  }

  onRemove(arena: Arena, quiet: boolean = false): void {
    if (!quiet) {
      arena.scene.queueMessage(`${this.side === ArenaTagSide.PLAYER ? "Your" : this.side === ArenaTagSide.ENEMY ? "The opposing" : ""} team's Tailwind petered out!`);
    }
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Happy_Hour_(move) Happy Hour}.
 * Doubles the prize money from trainers and money moves like {@linkcode Moves.PAY_DAY} and {@linkcode Moves.MAKE_IT_RAIN}.
 */
class HappyHourTag extends ArenaTag {
  constructor(turnCount: integer, sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.HAPPY_HOUR, turnCount, Moves.HAPPY_HOUR, sourceId, side);
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage("Everyone is caught up in the happy atmosphere!");
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage("The atmosphere returned to normal.");
  }
}

export function getArenaTag(tagType: ArenaTagType, turnCount: integer, sourceMove: Moves, sourceId: integer, targetIndex?: BattlerIndex, side: ArenaTagSide = ArenaTagSide.BOTH): ArenaTag {
  switch (tagType) {
  case ArenaTagType.MIST:
    return new MistTag(turnCount, sourceId, side);
  case ArenaTagType.QUICK_GUARD:
    return new QuickGuardTag(sourceId, side);
  case ArenaTagType.WIDE_GUARD:
    return new WideGuardTag(sourceId, side);
  case ArenaTagType.MAT_BLOCK:
    return new MatBlockTag(sourceId, side);
  case ArenaTagType.CRAFTY_SHIELD:
    return new CraftyShieldTag(sourceId, side);
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
  case ArenaTagType.TAILWIND:
    return new TailwindTag(turnCount, sourceId, side);
  case ArenaTagType.HAPPY_HOUR:
    return new HappyHourTag(turnCount, sourceId, side);
  }
}
