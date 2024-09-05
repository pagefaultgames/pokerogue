import { Arena } from "../field/arena";
import { Type } from "./type";
import * as Utils from "../utils";
import { MoveCategory, allMoves, MoveTarget, IncrementMovePriorityAttr, applyMoveAttrs } from "./move";
import { getPokemonNameWithAffix } from "../messages";
import Pokemon, { HitResult, PokemonMove } from "../field/pokemon";
import { StatusEffect } from "./status-effect";
import { BattlerIndex } from "../battle";
import { BlockNonDirectDamageAbAttr, ChangeMovePriorityAbAttr, ProtectStatAbAttr, applyAbAttrs } from "./ability";
import { Stat } from "#enums/stat";
import { CommonAnim, CommonBattleAnim } from "./battle-anims";
import i18next from "i18next";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { PokemonHealPhase } from "#app/phases/pokemon-heal-phase";
import { ShowAbilityPhase } from "#app/phases/show-ability-phase";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";

export enum ArenaTagSide {
  BOTH,
  PLAYER,
  ENEMY
}

export abstract class ArenaTag {
  public tagType: ArenaTagType;
  public turnCount: integer;
  public sourceMove?: Moves;
  public sourceId?: integer;
  public side: ArenaTagSide;


  constructor(tagType: ArenaTagType, turnCount: integer, sourceMove: Moves | undefined, sourceId?: integer, side: ArenaTagSide = ArenaTagSide.BOTH) {
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
      arena.scene.queueMessage(i18next.t(`arenaTag:arenaOnRemove${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`, { moveName: this.getMoveName() }));
    }
  }

  onOverlap(arena: Arena): void { }

  lapse(arena: Arena): boolean {
    return this.turnCount < 1 || !!(--this.turnCount);
  }

  getMoveName(): string | null {
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

    if (this.sourceId) {
      const source = arena.scene.getPokemonById(this.sourceId);

      if (!quiet && source) {
        arena.scene.queueMessage(i18next.t("arenaTag:mistOnAdd", { pokemonNameWithAffix: getPokemonNameWithAffix(source) }));
      } else if (!quiet) {
        console.warn("Failed to get source for MistTag onAdd");
      }
    }
  }

  apply(arena: Arena, args: any[]): boolean {
    (args[0] as Utils.BooleanHolder).value = true;

    arena.scene.queueMessage(i18next.t("arenaTag:mistApply"));

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
      arena.scene.queueMessage(i18next.t(`arenaTag:reflectOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`));
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
      arena.scene.queueMessage(i18next.t(`arenaTag:lightScreenOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`));
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
      arena.scene.queueMessage(i18next.t(`arenaTag:auroraVeilOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`));
    }
  }
}

type ProtectConditionFunc = (arena: Arena, moveId: Moves) => boolean;

/**
 * Class to implement conditional team protection
 * applies protection based on the attributes of incoming moves
 */
export class ConditionalProtectTag extends ArenaTag {
  /** The condition function to determine which moves are negated */
  protected protectConditionFunc: ProtectConditionFunc;
  /** Does this apply to all moves, including those that ignore other forms of protection? */
  protected ignoresBypass: boolean;

  constructor(tagType: ArenaTagType, sourceMove: Moves, sourceId: integer, side: ArenaTagSide, condition: ProtectConditionFunc, ignoresBypass: boolean = false) {
    super(tagType, 1, sourceMove, sourceId, side);

    this.protectConditionFunc = condition;
    this.ignoresBypass = ignoresBypass;
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage(i18next.t(`arenaTag:conditionalProtectOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`, { moveName: super.getMoveName() }));
  }

  // Removes default message for effect removal
  onRemove(arena: Arena): void { }

  /**
   * apply(): Checks incoming moves against the condition function
   * and protects the target if conditions are met
   * @param arena The arena containing this tag
   * @param args\[0\] (Utils.BooleanHolder) Signals if the move is cancelled
   * @param args\[1\] (Pokemon) The Pokemon using the move
   * @param args\[2\] (Pokemon) The intended target of the move
   * @param args\[3\] (Moves) The parameters to the condition function
   * @param args\[4\] (Utils.BooleanHolder) Signals if the applied protection supercedes protection-ignoring effects
   * @returns
   */
  apply(arena: Arena, args: any[]): boolean {
    const [ cancelled, user, target, moveId, ignoresBypass ] = args;

    if (cancelled instanceof Utils.BooleanHolder
        && user instanceof Pokemon
        && target instanceof Pokemon
        && typeof moveId === "number"
        && ignoresBypass instanceof Utils.BooleanHolder) {

      if ((this.side === ArenaTagSide.PLAYER) === target.isPlayer()
          && this.protectConditionFunc(arena, moveId)) {
        if (!cancelled.value) {
          cancelled.value = true;
          user.stopMultiHit(target);

          new CommonBattleAnim(CommonAnim.PROTECT, target).play(arena.scene);
          arena.scene.queueMessage(i18next.t("arenaTag:conditionalProtectApply", { moveName: super.getMoveName(), pokemonNameWithAffix: getPokemonNameWithAffix(target) }));
        }

        ignoresBypass.value = ignoresBypass.value || this.ignoresBypass;
        return true;
      }
    }
    return false;
  }
}

/**
 * Condition function for {@link https://bulbapedia.bulbagarden.net/wiki/Quick_Guard_(move) Quick Guard's}
 * protection effect.
 * @param arena {@linkcode Arena} The arena containing the protection effect
 * @param moveId {@linkcode Moves} The move to check against this condition
 * @returns `true` if the incoming move's priority is greater than 0. This includes
 * moves with modified priorities from abilities (e.g. Prankster)
 */
const QuickGuardConditionFunc: ProtectConditionFunc = (arena, moveId) => {
  const move = allMoves[moveId];
  const priority = new Utils.IntegerHolder(move.priority);
  const effectPhase = arena.scene.getCurrentPhase();

  if (effectPhase instanceof MoveEffectPhase) {
    const attacker = effectPhase.getUserPokemon()!;
    applyMoveAttrs(IncrementMovePriorityAttr, attacker, null, move, priority);
    applyAbAttrs(ChangeMovePriorityAbAttr, attacker, null, false, move, priority);
  }
  return priority.value > 0;
};

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Quick_Guard_(move) Quick Guard}
 * Condition: The incoming move has increased priority.
 */
class QuickGuardTag extends ConditionalProtectTag {
  constructor(sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.QUICK_GUARD, Moves.QUICK_GUARD, sourceId, side, QuickGuardConditionFunc);
  }
}

/**
 * Condition function for {@link https://bulbapedia.bulbagarden.net/wiki/Wide_Guard_(move) Wide Guard's}
 * protection effect.
 * @param arena {@linkcode Arena} The arena containing the protection effect
 * @param moveId {@linkcode Moves} The move to check against this condition
 * @returns `true` if the incoming move is multi-targeted (even if it's only used against one Pokemon).
 */
const WideGuardConditionFunc: ProtectConditionFunc = (arena, moveId) : boolean => {
  const move = allMoves[moveId];

  switch (move.moveTarget) {
  case MoveTarget.ALL_ENEMIES:
  case MoveTarget.ALL_NEAR_ENEMIES:
  case MoveTarget.ALL_OTHERS:
  case MoveTarget.ALL_NEAR_OTHERS:
    return true;
  }
  return false;
};

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Wide_Guard_(move) Wide Guard}
 * Condition: The incoming move can target multiple Pokemon. The move's source
 * can be an ally or enemy.
 */
class WideGuardTag extends ConditionalProtectTag {
  constructor(sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.WIDE_GUARD, Moves.WIDE_GUARD, sourceId, side, WideGuardConditionFunc);
  }
}

/**
 * Condition function for {@link https://bulbapedia.bulbagarden.net/wiki/Mat_Block_(move) Mat Block's}
 * protection effect.
 * @param arena {@linkcode Arena} The arena containing the protection effect.
 * @param moveId {@linkcode Moves} The move to check against this condition.
 * @returns `true` if the incoming move is not a Status move.
 */
const MatBlockConditionFunc: ProtectConditionFunc = (arena, moveId) : boolean => {
  const move = allMoves[moveId];
  return move.category !== MoveCategory.STATUS;
};

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Mat_Block_(move) Mat Block}
 * Condition: The incoming move is a Physical or Special attack move.
 */
class MatBlockTag extends ConditionalProtectTag {
  constructor(sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.MAT_BLOCK, Moves.MAT_BLOCK, sourceId, side, MatBlockConditionFunc);
  }

  onAdd(arena: Arena) {
    if (this.sourceId) {
      const source = arena.scene.getPokemonById(this.sourceId);
      if (source) {
        arena.scene.queueMessage(i18next.t("arenaTag:matBlockOnAdd", { pokemonNameWithAffix: getPokemonNameWithAffix(source) }));
      } else {
        console.warn("Failed to get source for MatBlockTag onAdd");
      }
    }
  }
}

/**
 * Condition function for {@link https://bulbapedia.bulbagarden.net/wiki/Crafty_Shield_(move) Crafty Shield's}
 * protection effect.
 * @param arena {@linkcode Arena} The arena containing the protection effect
 * @param moveId {@linkcode Moves} The move to check against this condition
 * @returns `true` if the incoming move is a Status move, is not a hazard, and does not target all
 * Pokemon or sides of the field.
 */
const CraftyShieldConditionFunc: ProtectConditionFunc = (arena, moveId) => {
  const move = allMoves[moveId];
  return move.category === MoveCategory.STATUS
    && move.moveTarget !== MoveTarget.ENEMY_SIDE
    && move.moveTarget !== MoveTarget.BOTH_SIDES
    && move.moveTarget !== MoveTarget.ALL;
};

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Crafty_Shield_(move) Crafty Shield}
 * Condition: The incoming move is a Status move, is not a hazard, and does
 * not target all Pokemon or sides of the field.
*/
class CraftyShieldTag extends ConditionalProtectTag {
  constructor(sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.CRAFTY_SHIELD, Moves.CRAFTY_SHIELD, sourceId, side, CraftyShieldConditionFunc, true);
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Lucky_Chant_(move) Lucky Chant}.
 * Prevents critical hits against the tag's side.
 */
export class NoCritTag extends ArenaTag {
  /**
   * Constructor method for the NoCritTag class
   * @param turnCount `integer` the number of turns this effect lasts
   * @param sourceMove {@linkcode Moves} the move that created this effect
   * @param sourceId `integer` the ID of the {@linkcode Pokemon} that created this effect
   * @param side {@linkcode ArenaTagSide} the side to which this effect belongs
   */
  constructor(turnCount: integer, sourceMove: Moves, sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.NO_CRIT, turnCount, sourceMove, sourceId, side);
  }

  /** Queues a message upon adding this effect to the field */
  onAdd(arena: Arena): void {
    arena.scene.queueMessage(i18next.t(`arenaTag:noCritOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : "Enemy"}`, {
      moveName: this.getMoveName()
    }));
  }

  /** Queues a message upon removing this effect from the field */
  onRemove(arena: Arena): void {
    const source = arena.scene.getPokemonById(this.sourceId!); // TODO: is this bang correct?
    arena.scene.queueMessage(i18next.t("arenaTag:noCritOnRemove", {
      pokemonNameWithAffix: getPokemonNameWithAffix(source ?? undefined),
      moveName: this.getMoveName()
    }));
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
    if (this.sourceId) {
      const user = arena.scene.getPokemonById(this.sourceId);
      if (user) {
        this.battlerIndex = user.getBattlerIndex();
        this.triggerMessage = i18next.t("arenaTag:wishTagOnAdd", { pokemonNameWithAffix: getPokemonNameWithAffix(user) });
        this.healHp = Utils.toDmgValue(user.getMaxHp() / 2);
      } else {
        console.warn("Failed to get source for WishTag onAdd");
      }
    }
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
    arena.scene.queueMessage(i18next.t("arenaTag:mudSportOnAdd"));
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage(i18next.t("arenaTag:mudSportOnRemove"));
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
    arena.scene.queueMessage(i18next.t("arenaTag:waterSportOnAdd"));
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage(i18next.t("arenaTag:waterSportOnRemove"));
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

    const source = this.sourceId ? arena.scene.getPokemonById(this.sourceId) : null;
    if (!quiet && source) {
      arena.scene.queueMessage(i18next.t("arenaTag:spikesOnAdd", { moveName: this.getMoveName(), opponentDesc: source.getOpponentDescriptor() }));
    }
  }

  activateTrap(pokemon: Pokemon): boolean {
    if (pokemon.isGrounded()) {
      const cancelled = new Utils.BooleanHolder(false);
      applyAbAttrs(BlockNonDirectDamageAbAttr, pokemon, cancelled);

      if (!cancelled.value) {
        const damageHpRatio = 1 / (10 - 2 * this.layers);
        const damage = Utils.toDmgValue(pokemon.getMaxHp() * damageHpRatio);

        pokemon.scene.queueMessage(i18next.t("arenaTag:spikesActivateTrap", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }));
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

    const source = this.sourceId ? arena.scene.getPokemonById(this.sourceId) : null;
    if (!quiet && source) {
      arena.scene.queueMessage(i18next.t("arenaTag:toxicSpikesOnAdd", { moveName: this.getMoveName(), opponentDesc: source.getOpponentDescriptor() }));
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
          pokemon.scene.queueMessage(i18next.t("arenaTag:toxicSpikesActivateTrapPoison", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), moveName: this.getMoveName() }));
          return true;
        }
      } else if (!pokemon.status) {
        const toxic = this.layers > 1;
        if (pokemon.trySetStatus(!toxic ? StatusEffect.POISON : StatusEffect.TOXIC, true, null, 0, this.getMoveName())) {
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

  constructor(tagType: ArenaTagType, sourceMove: Moves | undefined, sourceId: integer, targetIndex: BattlerIndex) {
    super(tagType, 3, sourceMove, sourceId);

    this.targetIndex = targetIndex;
  }

  lapse(arena: Arena): boolean {
    const ret = super.lapse(arena);

    if (!ret) {
      arena.scene.unshiftPhase(new MoveEffectPhase(arena.scene, this.sourceId!, [ this.targetIndex ], new PokemonMove(this.sourceMove!, 0, 0, true))); // TODO: are those bangs correct?
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

    const source = this.sourceId ? arena.scene.getPokemonById(this.sourceId) : null;
    if (!quiet && source) {
      arena.scene.queueMessage(i18next.t("arenaTag:stealthRockOnAdd", { opponentDesc: source.getOpponentDescriptor() }));
    }
  }

  getDamageHpRatio(pokemon: Pokemon): number {
    const effectiveness = pokemon.getAttackTypeEffectiveness(Type.ROCK, undefined, true);

    let damageHpRatio: number = 0;

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
      const damage = Utils.toDmgValue(pokemon.getMaxHp() * damageHpRatio);
      pokemon.scene.queueMessage(i18next.t("arenaTag:stealthRockActivateTrap", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }));
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
    const source = this.sourceId ? arena.scene.getPokemonById(this.sourceId) : null;
    if (!quiet && source) {
      arena.scene.queueMessage(i18next.t("arenaTag:stickyWebOnAdd", { moveName: this.getMoveName(), opponentDesc: source.getOpponentDescriptor() }));
    }
  }

  activateTrap(pokemon: Pokemon): boolean {
    if (pokemon.isGrounded()) {
      const cancelled = new Utils.BooleanHolder(false);
      applyAbAttrs(ProtectStatAbAttr, pokemon, cancelled);
      if (!cancelled.value) {
        pokemon.scene.queueMessage(i18next.t("arenaTag:stickyWebActivateTrap", { pokemonName: pokemon.getNameToRender() }));
        const stages = new Utils.NumberHolder(-1);
        pokemon.scene.unshiftPhase(new StatStageChangePhase(pokemon.scene, pokemon.getBattlerIndex(), false, [ Stat.SPD ], stages.value));
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
    const source = this.sourceId ? arena.scene.getPokemonById(this.sourceId) : null;
    if (source) {
      arena.scene.queueMessage(i18next.t("arenaTag:trickRoomOnAdd", { pokemonNameWithAffix: getPokemonNameWithAffix(source) }));
    }
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage(i18next.t("arenaTag:trickRoomOnRemove"));
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
    arena.scene.queueMessage(i18next.t("arenaTag:gravityOnAdd"));
    arena.scene.getField(true).forEach((pokemon) => {
      if (pokemon !== null) {
        pokemon.removeTag(BattlerTagType.MAGNET_RISEN);
      }
    });
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage(i18next.t("arenaTag:gravityOnRemove"));
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
      arena.scene.queueMessage(i18next.t(`arenaTag:tailwindOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`));
    }

    const source = arena.scene.getPokemonById(this.sourceId!); //TODO: this bang is questionable!
    const party = (source?.isPlayer() ? source.scene.getPlayerField() : source?.scene.getEnemyField()) ?? [];

    for (const pokemon of party) {
      // Apply the CHARGED tag to party members with the WIND_POWER ability
      if (pokemon.hasAbility(Abilities.WIND_POWER) && !pokemon.getTag(BattlerTagType.CHARGED)) {
        pokemon.addTag(BattlerTagType.CHARGED);
        pokemon.scene.queueMessage(i18next.t("abilityTriggers:windPowerCharged", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: this.getMoveName() }));
      }
      // Raise attack by one stage if party member has WIND_RIDER ability
      if (pokemon.hasAbility(Abilities.WIND_RIDER)) {
        pokemon.scene.unshiftPhase(new ShowAbilityPhase(pokemon.scene, pokemon.getBattlerIndex()));
        pokemon.scene.unshiftPhase(new StatStageChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [ Stat.ATK ], 1, true));
      }
    }
  }

  onRemove(arena: Arena, quiet: boolean = false): void {
    if (!quiet) {
      arena.scene.queueMessage(i18next.t(`arenaTag:tailwindOnRemove${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`));
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
    arena.scene.queueMessage(i18next.t("arenaTag:happyHourOnAdd"));
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage(i18next.t("arenaTag:happyHourOnRemove"));
  }
}

class SafeguardTag extends ArenaTag {
  constructor(turnCount: integer, sourceId: integer, side: ArenaTagSide) {
    super(ArenaTagType.SAFEGUARD, turnCount, Moves.SAFEGUARD, sourceId, side);
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage(i18next.t(`arenaTag:safeguardOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`));
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage(i18next.t(`arenaTag:safeguardOnRemove${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`));
  }
}


export function getArenaTag(tagType: ArenaTagType, turnCount: integer, sourceMove: Moves | undefined, sourceId: integer, targetIndex?: BattlerIndex, side: ArenaTagSide = ArenaTagSide.BOTH): ArenaTag | null {
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
  case ArenaTagType.NO_CRIT:
    return new NoCritTag(turnCount, sourceMove!, sourceId, side); // TODO: is this bang correct?
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
    return new DelayedAttackTag(tagType, sourceMove, sourceId, targetIndex!); // TODO:questionable bang
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
  case ArenaTagType.SAFEGUARD:
    return new SafeguardTag(turnCount, sourceId, side);
  default:
    return null;
  }
}
