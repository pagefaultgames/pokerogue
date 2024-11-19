import { Arena } from "#app/field/arena";
import BattleScene from "#app/battle-scene";
import { Type } from "#enums/type";
import { BooleanHolder, NumberHolder, toDmgValue } from "#app/utils";
import { MoveCategory, allMoves, MoveTarget } from "#app/data/move";
import { getPokemonNameWithAffix } from "#app/messages";
import Pokemon, { HitResult, PokemonMove } from "#app/field/pokemon";
import { StatusEffect } from "#enums/status-effect";
import { BattlerIndex } from "#app/battle";
import { BlockNonDirectDamageAbAttr, InfiltratorAbAttr, ProtectStatAbAttr, applyAbAttrs } from "#app/data/ability";
import { Stat } from "#enums/stat";
import { CommonAnim, CommonBattleAnim } from "#app/data/battle-anims";
import i18next from "i18next";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { PokemonHealPhase } from "#app/phases/pokemon-heal-phase";
import { ShowAbilityPhase } from "#app/phases/show-ability-phase";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import { CommonAnimPhase } from "#app/phases/common-anim-phase";

export enum ArenaTagSide {
  BOTH,
  PLAYER,
  ENEMY
}

export abstract class ArenaTag {
  constructor(
    public tagType: ArenaTagType,
    public turnCount: number,
    public sourceMove?: Moves,
    public sourceId?: number,
    public side: ArenaTagSide = ArenaTagSide.BOTH
  ) {}

  apply(arena: Arena, simulated: boolean, ...args: unknown[]): boolean {
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

  /**
   * When given a arena tag or json representing one, load the data for it.
   * This is meant to be inherited from by any arena tag with custom attributes
   * @param {ArenaTag | any} source An arena tag
   */
  loadTag(source : ArenaTag | any) : void {
    this.turnCount = source.turnCount;
    this.sourceMove = source.sourceMove;
    this.sourceId = source.sourceId;
    this.side = source.side;
  }

  /**
   * Helper function that retrieves the source Pokemon
   * @param scene medium to retrieve the source Pokemon
   * @returns The source {@linkcode Pokemon} or `null` if none is found
   */
  public getSourcePokemon(scene: BattleScene): Pokemon | null {
    return this.sourceId ? scene.getPokemonById(this.sourceId) : null;
  }

  /**
   * Helper function that retrieves the Pokemon affected
   * @param scene - medium to retrieve the involved Pokemon
   * @returns list of PlayerPokemon or EnemyPokemon on the field
   */
  public getAffectedPokemon(scene: BattleScene): Pokemon[] {
    switch (this.side) {
      case ArenaTagSide.PLAYER:
        return scene.getPlayerField() ?? [];
      case ArenaTagSide.ENEMY:
        return scene.getEnemyField() ?? [];
      case ArenaTagSide.BOTH:
      default:
        return scene.getField(true) ?? [];
    }
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Mist_(move) Mist}.
 * Prevents Pokémon on the opposing side from lowering the stats of the Pokémon in the Mist.
 */
export class MistTag extends ArenaTag {
  constructor(turnCount: number, sourceId: number, side: ArenaTagSide) {
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

  /**
   * Cancels the lowering of stats
   * @param arena the {@linkcode Arena} containing this effect
   * @param simulated `true` if the effect should be applied quietly
   * @param attacker the {@linkcode Pokemon} using a move into this effect.
   * @param cancelled a {@linkcode BooleanHolder} whose value is set to `true`
   * to flag the stat reduction as cancelled
   * @returns `true` if a stat reduction was cancelled; `false` otherwise
   */
  override apply(arena: Arena, simulated: boolean, attacker: Pokemon, cancelled: BooleanHolder): boolean {
    // `StatStageChangePhase` currently doesn't have a reference to the source of stat drops,
    // so this code currently has no effect on gameplay.
    if (attacker) {
      const bypassed = new BooleanHolder(false);
      // TODO: Allow this to be simulated
      applyAbAttrs(InfiltratorAbAttr, attacker, null, false, bypassed);
      if (bypassed.value) {
        return false;
      }
    }

    cancelled.value = true;

    if (!simulated) {
      arena.scene.queueMessage(i18next.t("arenaTag:mistApply"));
    }

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
  constructor(tagType: ArenaTagType, turnCount: number, sourceMove: Moves, sourceId: number, side: ArenaTagSide, weakenedCategories: MoveCategory[]) {
    super(tagType, turnCount, sourceMove, sourceId, side);

    this.weakenedCategories = weakenedCategories;
  }

  /**
   * Applies the weakening effect to the move.
   *
   * @param arena the {@linkcode Arena} where the move is applied.
   * @param simulated n/a
   * @param attacker the attacking {@linkcode Pokemon}
   * @param moveCategory the attacking move's {@linkcode MoveCategory}.
   * @param damageMultiplier A {@linkcode NumberHolder} containing the damage multiplier
   * @returns `true` if the attacking move was weakened; `false` otherwise.
   */
  override apply(arena: Arena, simulated: boolean, attacker: Pokemon, moveCategory: MoveCategory, damageMultiplier: NumberHolder): boolean {
    if (this.weakenedCategories.includes(moveCategory)) {
      const bypassed = new BooleanHolder(false);
      applyAbAttrs(InfiltratorAbAttr, attacker, null, false, bypassed);
      if (bypassed.value) {
        return false;
      }
      damageMultiplier.value = arena.scene.currentBattle.double ? 2732 / 4096 : 0.5;
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
  constructor(turnCount: number, sourceId: number, side: ArenaTagSide) {
    super(ArenaTagType.REFLECT, turnCount, Moves.REFLECT, sourceId, side, [ MoveCategory.PHYSICAL ]);
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
  constructor(turnCount: number, sourceId: number, side: ArenaTagSide) {
    super(ArenaTagType.LIGHT_SCREEN, turnCount, Moves.LIGHT_SCREEN, sourceId, side, [ MoveCategory.SPECIAL ]);
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
  constructor(turnCount: number, sourceId: number, side: ArenaTagSide) {
    super(ArenaTagType.AURORA_VEIL, turnCount, Moves.AURORA_VEIL, sourceId, side, [ MoveCategory.SPECIAL, MoveCategory.PHYSICAL ]);
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

  constructor(tagType: ArenaTagType, sourceMove: Moves, sourceId: number, side: ArenaTagSide, condition: ProtectConditionFunc, ignoresBypass: boolean = false) {
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
   * Checks incoming moves against the condition function
   * and protects the target if conditions are met
   * @param arena the {@linkcode Arena} containing this tag
   * @param simulated `true` if the tag is applied quietly; `false` otherwise.
   * @param isProtected a {@linkcode BooleanHolder} used to flag if the move is protected against
   * @param attacker the attacking {@linkcode Pokemon}
   * @param defender the defending {@linkcode Pokemon}
   * @param moveId the {@linkcode Moves | identifier} for the move being used
   * @param ignoresProtectBypass a {@linkcode BooleanHolder} used to flag if a protection effect supercedes effects that ignore protection
   * @returns `true` if this tag protected against the attack; `false` otherwise
   */
  override apply(arena: Arena, simulated: boolean, isProtected: BooleanHolder, attacker: Pokemon, defender: Pokemon,
    moveId: Moves, ignoresProtectBypass: BooleanHolder): boolean {

    if ((this.side === ArenaTagSide.PLAYER) === defender.isPlayer()
        && this.protectConditionFunc(arena, moveId)) {
      if (!isProtected.value) {
        isProtected.value = true;
        if (!simulated) {
          attacker.stopMultiHit(defender);

          new CommonBattleAnim(CommonAnim.PROTECT, defender).play(arena.scene);
          arena.scene.queueMessage(i18next.t("arenaTag:conditionalProtectApply", { moveName: super.getMoveName(), pokemonNameWithAffix: getPokemonNameWithAffix(defender) }));
        }
      }

      ignoresProtectBypass.value = ignoresProtectBypass.value || this.ignoresBypass;
      return true;
    }
    return false;
  }
}

/**
 * Condition function for {@link https://bulbapedia.bulbagarden.net/wiki/Quick_Guard_(move) Quick Guard's}
 * protection effect.
 * @param arena {@linkcode Arena} The arena containing the protection effect
 * @param moveId {@linkcode Moves} The move to check against this condition
 * @returns `true` if the incoming move's priority is greater than 0.
 *   This includes moves with modified priorities from abilities (e.g. Prankster)
 */
const QuickGuardConditionFunc: ProtectConditionFunc = (arena, moveId) => {
  const move = allMoves[moveId];
  const effectPhase = arena.scene.getCurrentPhase();

  if (effectPhase instanceof MoveEffectPhase) {
    const attacker = effectPhase.getUserPokemon();
    if (attacker) {
      return move.getPriority(attacker) > 0;
    }
  }
  return move.priority > 0;
};

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Quick_Guard_(move) Quick Guard}
 * Condition: The incoming move has increased priority.
 */
class QuickGuardTag extends ConditionalProtectTag {
  constructor(sourceId: number, side: ArenaTagSide) {
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
  constructor(sourceId: number, side: ArenaTagSide) {
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
  constructor(sourceId: number, side: ArenaTagSide) {
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
  constructor(sourceId: number, side: ArenaTagSide) {
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
   * @param turnCount `number` the number of turns this effect lasts
   * @param sourceMove {@linkcode Moves} the move that created this effect
   * @param sourceId `number` the ID of the {@linkcode Pokemon} that created this effect
   * @param side {@linkcode ArenaTagSide} the side to which this effect belongs
   */
  constructor(turnCount: number, sourceMove: Moves, sourceId: number, side: ArenaTagSide) {
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

  constructor(turnCount: number, sourceId: number, side: ArenaTagSide) {
    super(ArenaTagType.WISH, turnCount, Moves.WISH, sourceId, side);
  }

  onAdd(arena: Arena): void {
    if (this.sourceId) {
      const user = arena.scene.getPokemonById(this.sourceId);
      if (user) {
        this.battlerIndex = user.getBattlerIndex();
        this.triggerMessage = i18next.t("arenaTag:wishTagOnAdd", { pokemonNameWithAffix: getPokemonNameWithAffix(user) });
        this.healHp = toDmgValue(user.getMaxHp() / 2);
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
  constructor(tagType: ArenaTagType, turnCount: number, type: Type, sourceMove: Moves, sourceId: number) {
    super(tagType, turnCount, sourceMove, sourceId);

    this.weakenedType = type;
  }

  /**
   * Reduces an attack's power by 0.33x if it matches this tag's weakened type.
   * @param arena n/a
   * @param simulated n/a
   * @param type the attack's {@linkcode Type}
   * @param power a {@linkcode NumberHolder} containing the attack's power
   * @returns `true` if the attack's power was reduced; `false` otherwise.
   */
  override apply(arena: Arena, simulated: boolean, type: Type, power: NumberHolder): boolean {
    if (type === this.weakenedType) {
      power.value *= 0.33;
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
  constructor(turnCount: number, sourceId: number) {
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
  constructor(turnCount: number, sourceId: number) {
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
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Ion_Deluge_(move) | Ion Deluge}
 * and the secondary effect of {@link https://bulbapedia.bulbagarden.net/wiki/Plasma_Fists_(move) | Plasma Fists}.
 * Converts Normal-type moves to Electric type for the rest of the turn.
 */
export class IonDelugeTag extends ArenaTag {
  constructor(sourceMove?: Moves) {
    super(ArenaTagType.ION_DELUGE, 1, sourceMove);
  }

  /** Queues an on-add message */
  onAdd(arena: Arena): void {
    arena.scene.queueMessage(i18next.t("arenaTag:plasmaFistsOnAdd"));
  }

  onRemove(arena: Arena): void { } // Removes default on-remove message

  /**
   * Converts Normal-type moves to Electric type
   * @param arena n/a
   * @param simulated n/a
   * @param moveType a {@linkcode NumberHolder} containing a move's {@linkcode Type}
   * @returns `true` if the given move type changed; `false` otherwise.
   */
  override apply(arena: Arena, simulated: boolean, moveType: NumberHolder): boolean {
    if (moveType.value === Type.NORMAL) {
      moveType.value = Type.ELECTRIC;
      return true;
    }
    return false;
  }
}

/**
 * Abstract class to implement arena traps.
 */
export class ArenaTrapTag extends ArenaTag {
  public layers: number;
  public maxLayers: number;

  /**
   * Creates a new instance of the ArenaTrapTag class.
   *
   * @param tagType - The type of the arena tag.
   * @param sourceMove - The move that created the tag.
   * @param sourceId - The ID of the source of the tag.
   * @param side - The side (player or enemy) the tag affects.
   * @param maxLayers - The maximum amount of layers this tag can have.
   */
  constructor(tagType: ArenaTagType, sourceMove: Moves, sourceId: number, side: ArenaTagSide, maxLayers: number) {
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

  /**
   * Activates the hazard effect onto a Pokemon when it enters the field
   * @param arena the {@linkcode Arena} containing this tag
   * @param simulated if `true`, only checks if the hazard would activate.
   * @param pokemon the {@linkcode Pokemon} triggering this hazard
   * @returns `true` if this hazard affects the given Pokemon; `false` otherwise.
   */
  override apply(arena: Arena, simulated: boolean, pokemon: Pokemon): boolean {
    if ((this.side === ArenaTagSide.PLAYER) !== pokemon.isPlayer()) {
      return false;
    }

    return this.activateTrap(pokemon, simulated);
  }

  activateTrap(pokemon: Pokemon, simulated: boolean): boolean {
    return false;
  }

  getMatchupScoreMultiplier(pokemon: Pokemon): number {
    return pokemon.isGrounded() ? 1 : Phaser.Math.Linear(0, 1 / Math.pow(2, this.layers), Math.min(pokemon.getHpRatio(), 0.5) * 2);
  }

  loadTag(source: any): void {
    super.loadTag(source);
    this.layers = source.layers;
    this.maxLayers = source.maxLayers;
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Spikes_(move) Spikes}.
 * Applies up to 3 layers of Spikes, dealing 1/8th, 1/6th, or 1/4th of the the Pokémon's HP
 * in damage for 1, 2, or 3 layers of Spikes respectively if they are summoned into this trap.
 */
class SpikesTag extends ArenaTrapTag {
  constructor(sourceId: number, side: ArenaTagSide) {
    super(ArenaTagType.SPIKES, Moves.SPIKES, sourceId, side, 3);
  }

  onAdd(arena: Arena, quiet: boolean = false): void {
    super.onAdd(arena);

    const source = this.sourceId ? arena.scene.getPokemonById(this.sourceId) : null;
    if (!quiet && source) {
      arena.scene.queueMessage(i18next.t("arenaTag:spikesOnAdd", { moveName: this.getMoveName(), opponentDesc: source.getOpponentDescriptor() }));
    }
  }

  override activateTrap(pokemon: Pokemon, simulated: boolean): boolean {
    if (pokemon.isGrounded()) {
      const cancelled = new BooleanHolder(false);
      applyAbAttrs(BlockNonDirectDamageAbAttr, pokemon, cancelled);

      if (simulated) {
        return !cancelled.value;
      }

      if (!cancelled.value) {
        const damageHpRatio = 1 / (10 - 2 * this.layers);
        const damage = toDmgValue(pokemon.getMaxHp() * damageHpRatio);

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

  constructor(sourceId: number, side: ArenaTagSide) {
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

  override activateTrap(pokemon: Pokemon, simulated: boolean): boolean {
    if (pokemon.isGrounded()) {
      if (simulated) {
        return true;
      }
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
export class DelayedAttackTag extends ArenaTag {
  public targetIndex: BattlerIndex;

  constructor(tagType: ArenaTagType, sourceMove: Moves | undefined, sourceId: number, targetIndex: BattlerIndex, side: ArenaTagSide = ArenaTagSide.BOTH) {
    super(tagType, 3, sourceMove, sourceId, side);

    this.targetIndex = targetIndex;
    this.side = side;
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
  constructor(sourceId: number, side: ArenaTagSide) {
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

  override activateTrap(pokemon: Pokemon, simulated: boolean): boolean {
    const cancelled = new BooleanHolder(false);
    applyAbAttrs(BlockNonDirectDamageAbAttr,  pokemon, cancelled);

    if (cancelled.value) {
      return false;
    }

    const damageHpRatio = this.getDamageHpRatio(pokemon);

    if (damageHpRatio) {
      if (simulated) {
        return true;
      }
      const damage = toDmgValue(pokemon.getMaxHp() * damageHpRatio);
      pokemon.scene.queueMessage(i18next.t("arenaTag:stealthRockActivateTrap", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }));
      pokemon.damageAndUpdate(damage, HitResult.OTHER);
      if (pokemon.turnData) {
        pokemon.turnData.damageTaken += damage;
      }
      return true;
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
  constructor(sourceId: number, side: ArenaTagSide) {
    super(ArenaTagType.STICKY_WEB, Moves.STICKY_WEB, sourceId, side, 1);
  }

  onAdd(arena: Arena, quiet: boolean = false): void {
    super.onAdd(arena);
    const source = this.sourceId ? arena.scene.getPokemonById(this.sourceId) : null;
    if (!quiet && source) {
      arena.scene.queueMessage(i18next.t("arenaTag:stickyWebOnAdd", { moveName: this.getMoveName(), opponentDesc: source.getOpponentDescriptor() }));
    }
  }

  override activateTrap(pokemon: Pokemon, simulated: boolean): boolean {
    if (pokemon.isGrounded()) {
      const cancelled = new BooleanHolder(false);
      applyAbAttrs(ProtectStatAbAttr, pokemon, cancelled);

      if (simulated) {
        return !cancelled.value;
      }

      if (!cancelled.value) {
        pokemon.scene.queueMessage(i18next.t("arenaTag:stickyWebActivateTrap", { pokemonName: pokemon.getNameToRender() }));
        const stages = new NumberHolder(-1);
        pokemon.scene.unshiftPhase(new StatStageChangePhase(pokemon.scene, pokemon.getBattlerIndex(), false, [ Stat.SPD ], stages.value));
        return true;
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
  constructor(turnCount: number, sourceId: number) {
    super(ArenaTagType.TRICK_ROOM, turnCount, Moves.TRICK_ROOM, sourceId);
  }

  /**
   * Reverses Speed-based turn order for all Pokemon on the field
   * @param arena n/a
   * @param simulated n/a
   * @param speedReversed a {@linkcode BooleanHolder} used to flag if Speed-based
   * turn order should be reversed.
   * @returns `true` if turn order is successfully reversed; `false` otherwise
   */
  override apply(arena: Arena, simulated: boolean, speedReversed: BooleanHolder): boolean {
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
  constructor(turnCount: number) {
    super(ArenaTagType.GRAVITY, turnCount, Moves.GRAVITY);
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage(i18next.t("arenaTag:gravityOnAdd"));
    arena.scene.getField(true).forEach((pokemon) => {
      if (pokemon !== null) {
        pokemon.removeTag(BattlerTagType.FLOATING);
        pokemon.removeTag(BattlerTagType.TELEKINESIS);
        if (pokemon.getTag(BattlerTagType.FLYING)) {
          pokemon.addTag(BattlerTagType.INTERRUPTED);
        }
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
  constructor(turnCount: number, sourceId: number, side: ArenaTagSide) {
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
  constructor(turnCount: number, sourceId: number, side: ArenaTagSide) {
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
  constructor(turnCount: number, sourceId: number, side: ArenaTagSide) {
    super(ArenaTagType.SAFEGUARD, turnCount, Moves.SAFEGUARD, sourceId, side);
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage(i18next.t(`arenaTag:safeguardOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`));
  }

  onRemove(arena: Arena): void {
    arena.scene.queueMessage(i18next.t(`arenaTag:safeguardOnRemove${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`));
  }
}

class NoneTag extends ArenaTag {
  constructor() {
    super(ArenaTagType.NONE, 0);
  }
}
/**
 * This arena tag facilitates the application of the move Imprison
 * Imprison remains in effect as long as the source Pokemon is active and present on the field.
 * Imprison will apply to any opposing Pokemon that switch onto the field as well.
 */
class ImprisonTag extends ArenaTrapTag {
  constructor(sourceId: number, side: ArenaTagSide) {
    super(ArenaTagType.IMPRISON, Moves.IMPRISON, sourceId, side, 1);
  }

  /**
   * This function applies the effects of Imprison to the opposing Pokemon already present on the field.
   * @param arena
   */
  override onAdd({ scene }: Arena) {
    const source = this.getSourcePokemon(scene);
    if (source) {
      const party = this.getAffectedPokemon(scene);
      party?.forEach((p: Pokemon ) => {
        if (p.isAllowedInBattle()) {
          p.addTag(BattlerTagType.IMPRISON, 1, Moves.IMPRISON, this.sourceId);
        }
      });
      scene.queueMessage(i18next.t("battlerTags:imprisonOnAdd", { pokemonNameWithAffix: getPokemonNameWithAffix(source) }));
    }
  }

  /**
   * Checks if the source Pokemon is still active on the field
   * @param _arena
   * @returns `true` if the source of the tag is still active on the field | `false` if not
   */
  override lapse({ scene }: Arena): boolean {
    const source = this.getSourcePokemon(scene);
    return source ? source.isActive(true) : false;
  }

  /**
   * This applies the effects of Imprison to any opposing Pokemon that switch into the field while the source Pokemon is still active
   * @param {Pokemon} pokemon the Pokemon Imprison is applied to
   * @returns `true`
   */
  override activateTrap(pokemon: Pokemon): boolean {
    const source = this.getSourcePokemon(pokemon.scene);
    if (source && source.isActive(true) && pokemon.isAllowedInBattle()) {
      pokemon.addTag(BattlerTagType.IMPRISON, 1, Moves.IMPRISON, this.sourceId);
    }
    return true;
  }

  /**
   * When the arena tag is removed, it also attempts to remove any related Battler Tags if they haven't already been removed from the affected Pokemon
   * @param arena
   */
  override onRemove({ scene }: Arena): void {
    const party = this.getAffectedPokemon(scene);
    party?.forEach((p: Pokemon) => {
      p.removeTag(BattlerTagType.IMPRISON);
    });
  }
}

/**
 * Arena Tag implementing the "sea of fire" effect from the combination
 * of {@link https://bulbapedia.bulbagarden.net/wiki/Fire_Pledge_(move) | Fire Pledge}
 * and {@link https://bulbapedia.bulbagarden.net/wiki/Grass_Pledge_(move) | Grass Pledge}.
 * Damages all non-Fire-type Pokemon on the given side of the field at the end
 * of each turn for 4 turns.
 */
class FireGrassPledgeTag extends ArenaTag {
  constructor(sourceId: number, side: ArenaTagSide) {
    super(ArenaTagType.FIRE_GRASS_PLEDGE, 4, Moves.FIRE_PLEDGE, sourceId, side);
  }

  override onAdd(arena: Arena): void {
    // "A sea of fire enveloped your/the opposing team!"
    arena.scene.queueMessage(i18next.t(`arenaTag:fireGrassPledgeOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`));
  }

  override lapse(arena: Arena): boolean {
    const field: Pokemon[] = (this.side === ArenaTagSide.PLAYER)
      ? arena.scene.getPlayerField()
      : arena.scene.getEnemyField();

    field.filter(pokemon => !pokemon.isOfType(Type.FIRE)).forEach(pokemon => {
      // "{pokemonNameWithAffix} was hurt by the sea of fire!"
      pokemon.scene.queueMessage(i18next.t("arenaTag:fireGrassPledgeLapse", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }));
      // TODO: Replace this with a proper animation
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.getBattlerIndex(), pokemon.getBattlerIndex(), CommonAnim.MAGMA_STORM));
      pokemon.damageAndUpdate(toDmgValue(pokemon.getMaxHp() / 8));
    });

    return super.lapse(arena);
  }
}

/**
 * Arena Tag implementing the "rainbow" effect from the combination
 * of {@link https://bulbapedia.bulbagarden.net/wiki/Water_Pledge_(move) | Water Pledge}
 * and {@link https://bulbapedia.bulbagarden.net/wiki/Fire_Pledge_(move) | Fire Pledge}.
 * Doubles the secondary effect chance of moves from Pokemon on the
 * given side of the field for 4 turns.
 */
class WaterFirePledgeTag extends ArenaTag {
  constructor(sourceId: number, side: ArenaTagSide) {
    super(ArenaTagType.WATER_FIRE_PLEDGE, 4, Moves.WATER_PLEDGE, sourceId, side);
  }

  override onAdd(arena: Arena): void {
    // "A rainbow appeared in the sky on your/the opposing team's side!"
    arena.scene.queueMessage(i18next.t(`arenaTag:waterFirePledgeOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`));
  }

  /**
   * Doubles the chance for the given move's secondary effect(s) to trigger
   * @param arena the {@linkcode Arena} containing this tag
   * @param simulated n/a
   * @param moveChance a {@linkcode NumberHolder} containing
   * the move's current effect chance
   * @returns `true` if the move's effect chance was doubled (currently always `true`)
   */
  override apply(arena: Arena, simulated: boolean, moveChance: NumberHolder): boolean {
    moveChance.value *= 2;
    return true;
  }
}

/**
 * Arena Tag implementing the "swamp" effect from the combination
 * of {@link https://bulbapedia.bulbagarden.net/wiki/Grass_Pledge_(move) | Grass Pledge}
 * and {@link https://bulbapedia.bulbagarden.net/wiki/Water_Pledge_(move) | Water Pledge}.
 * Quarters the Speed of Pokemon on the given side of the field for 4 turns.
 */
class GrassWaterPledgeTag extends ArenaTag {
  constructor(sourceId: number, side: ArenaTagSide) {
    super(ArenaTagType.GRASS_WATER_PLEDGE, 4, Moves.GRASS_PLEDGE, sourceId, side);
  }

  override onAdd(arena: Arena): void {
    // "A swamp enveloped your/the opposing team!"
    arena.scene.queueMessage(i18next.t(`arenaTag:grassWaterPledgeOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`));
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Fairy_Lock_(move) Fairy Lock}.
 * Fairy Lock prevents all Pokémon (except Ghost types) on the field from switching out or
 * fleeing during their next turn.
 * If a Pokémon that's on the field when Fairy Lock is used goes on to faint later in the same turn,
 * the Pokémon that replaces it will still be unable to switch out in the following turn.
 */
export class FairyLockTag extends ArenaTag {
  constructor(turnCount: number, sourceId: number) {
    super(ArenaTagType.FAIRY_LOCK, turnCount, Moves.FAIRY_LOCK, sourceId);
  }

  onAdd(arena: Arena): void {
    arena.scene.queueMessage(i18next.t("arenaTag:fairyLockOnAdd"));
  }

}

// TODO: swap `sourceMove` and `sourceId` and make `sourceMove` an optional parameter
export function getArenaTag(tagType: ArenaTagType, turnCount: number, sourceMove: Moves | undefined, sourceId: number, targetIndex?: BattlerIndex, side: ArenaTagSide = ArenaTagSide.BOTH): ArenaTag | null {
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
    case ArenaTagType.ION_DELUGE:
      return new IonDelugeTag(sourceMove);
    case ArenaTagType.SPIKES:
      return new SpikesTag(sourceId, side);
    case ArenaTagType.TOXIC_SPIKES:
      return new ToxicSpikesTag(sourceId, side);
    case ArenaTagType.FUTURE_SIGHT:
    case ArenaTagType.DOOM_DESIRE:
      return new DelayedAttackTag(tagType, sourceMove, sourceId, targetIndex!, side); // TODO:questionable bang
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
    case ArenaTagType.IMPRISON:
      return new ImprisonTag(sourceId, side);
    case ArenaTagType.FIRE_GRASS_PLEDGE:
      return new FireGrassPledgeTag(sourceId, side);
    case ArenaTagType.WATER_FIRE_PLEDGE:
      return new WaterFirePledgeTag(sourceId, side);
    case ArenaTagType.GRASS_WATER_PLEDGE:
      return new GrassWaterPledgeTag(sourceId, side);
    case ArenaTagType.FAIRY_LOCK:
      return new FairyLockTag(turnCount, sourceId);
    default:
      return null;
  }
}

/**
 * When given a battler tag or json representing one, creates an actual ArenaTag object with the same data.
 * @param {ArenaTag | any} source An arena tag
 * @return {ArenaTag} The valid arena tag
 */
export function loadArenaTag(source: ArenaTag | any): ArenaTag {
  const tag = getArenaTag(source.tagType, source.turnCount, source.sourceMove, source.sourceId, source.targetIndex, source.side)
      ?? new NoneTag();
  tag.loadTag(source);
  return tag;
}

