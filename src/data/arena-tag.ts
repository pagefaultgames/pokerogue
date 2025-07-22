import { applyAbAttrs, applyOnGainAbAttrs, applyOnLoseAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { CommonBattleAnim } from "#data/battle-anims";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import type { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { HitResult } from "#enums/hit-result";
import { MoveCategory } from "#enums/MoveCategory";
import { MoveTarget } from "#enums/MoveTarget";
import { CommonAnim } from "#enums/move-anims-common";
import { MoveId } from "#enums/move-id";
import { MoveUseMode } from "#enums/move-use-mode";
import { PokemonType } from "#enums/pokemon-type";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import type { Arena } from "#field/arena";
import type { Pokemon } from "#field/pokemon";
import type {
  ArenaDelayedAttackTagType,
  ArenaScreenTagType,
  ArenaTagTypeData,
  ArenaTrapTagType,
  SerializableArenaTagType,
} from "#types/arena-tags";
import type { Mutable, NonFunctionProperties } from "#types/type-helpers";
import { BooleanHolder, isNullOrUndefined, NumberHolder, toDmgValue } from "#utils/common";
import i18next from "i18next";

/*
ArenaTags are are meant for effects that are tied to the arena (as opposed to a specific pokemon).
Examples include (but are not limited to)
- Cross-turn effects that persist even if the user/target switches out, such as Wish, Future Sight, and Happy Hour
- Effects that are applied to a specific side of the field, such as Crafty Shield, Reflect, and Spikes
- Field-Effects, like Gravity and Trick Room

Any arena tag that persists across turns *must* extend from `SerializableArenaTag` in the class definition signature.

Serializable ArenaTags have strict rules for their fields.
These rules ensure that only the data necessary to reconstruct the tag is serialized, and that the
session loader is able to deserialize saved tags correctly.

If the data is static (i.e. it is always the same for all instances of the class, such as the 
type that is weakened by Mud Sport/Water Sport), then it must not be defined as a field, and must
instead be defined as a getter.
A static property is also acceptable, though static properties are less ergonomic with inheritance.

If the data is mutable (i.e. it can change over the course of the tag's lifetime), then it *must*
be defined as a field, and it must be set in the `loadTag` method.
Such fields cannot be marked as `private/protected`, as if they were, typescript would omit them from
types that are based off of the class, namely, `ArenaTagTypeData`. It is preferrable to trade the
type-safety of private/protected fields for the type safety when deserializing arena tags from save data.

For data that is mutable only within a turn (e.g. SuppressAbilitiesTag's beingRemoved field),
where it does not make sense to be serialized, the field should use ES2020's private field syntax (a `#` prepended to the field name).
If the field should be accessible outside of the class, then a public getter should be used.
*/

/** Interface containing the serializable fields of ArenaTagData. */
interface BaseArenaTag {
  /**
   * The tag's remaining duration. Setting to any number `<=0` will make the tag's duration effectively infinite.
   */
  turnCount: number;
  /**
   * The {@linkcode MoveId} that created this tag, or `undefined` if not set by a move.
   */
  sourceMove?: MoveId;
  /**
   * The {@linkcode Pokemon.id | PID} of the {@linkcode Pokemon} having created the tag, or `undefined` if not set by a Pokemon.
   * @todo Implement handling for `ArenaTag`s created by non-pokemon sources (most tags will throw errors without a source)
   */
  // Note: Intentionally not using `?`, as the property should always exist, but just be undefined if not present.
  sourceId: number | undefined;
  /**
   * The {@linkcode ArenaTagSide | side of the field} that this arena tag affects.
   * @defaultValue `ArenaTagSide.BOTH`
   */
  side: ArenaTagSide;
}

/**
 * An {@linkcode ArenaTag} represents a semi-persistent effect affecting a given _side_ of the field.
 * Unlike {@linkcode BattlerTag}s (which are tied to individual {@linkcode Pokemon}), `ArenaTag`s function independently of
 * the Pokemon currently on-field, only cleared on arena reset or through their respective {@linkcode ArenaTag.lapse | lapse} methods.
 */
export abstract class ArenaTag implements BaseArenaTag {
  /** The type of the arena tag */
  public abstract readonly tagType: ArenaTagType;
  public turnCount: number;
  public sourceMove?: MoveId;
  public sourceId: number | undefined;
  public side: ArenaTagSide;

  constructor(turnCount: number, sourceMove?: MoveId, sourceId?: number, side: ArenaTagSide = ArenaTagSide.BOTH) {
    this.turnCount = turnCount;
    this.sourceMove = sourceMove;
    this.sourceId = sourceId;
    this.side = side;
  }

  apply(_arena: Arena, _simulated: boolean, ..._args: unknown[]): boolean {
    return true;
  }

  onAdd(_arena: Arena, _quiet = false): void {}

  onRemove(_arena: Arena, quiet = false): void {
    if (!quiet) {
      globalScene.phaseManager.queueMessage(
        i18next.t(
          `arenaTag:arenaOnRemove${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`,
          { moveName: this.getMoveName() },
        ),
      );
    }
  }

  onOverlap(_arena: Arena, _source: Pokemon | null): void {}

  /**
   * Trigger this {@linkcode ArenaTag}'s effect, reducing its duration as applicable.
   * Will ignore durations of all tags with durations `<=0`.
   * @param _arena - The {@linkcode Arena} at the moment the tag is being lapsed.
   * Unused by default but can be used by sub-classes.
   * @returns `true` if this tag should be kept; `false` if it should be removed.
   */
  lapse(_arena: Arena): boolean {
    // TODO: Rather than treating negative duration tags as being indefinite,
    // make all duration based classes inherit from their own sub-class
    return this.turnCount < 1 || --this.turnCount > 0;
  }

  getMoveName(): string | null {
    return this.sourceMove ? allMoves[this.sourceMove].name : null;
  }

  /**
   * When given a arena tag or json representing one, load the data for it.
   * This is meant to be inherited from by any arena tag with custom attributes
   * @param source - The {@linkcode BaseArenaTag} being loaded
   */
  loadTag(source: BaseArenaTag): void {
    this.turnCount = source.turnCount;
    this.sourceMove = source.sourceMove;
    this.sourceId = source.sourceId;
    this.side = source.side;
  }

  /**
   * Helper function that retrieves the source Pokemon
   * @returns - The source {@linkcode Pokemon} for this tag.
   * Returns `null` if `this.sourceId` is `undefined`
   */
  public getSourcePokemon(): Pokemon | null {
    return globalScene.getPokemonById(this.sourceId);
  }

  /**
   * Helper function that retrieves the Pokemon affected
   * @returns list of PlayerPokemon or EnemyPokemon on the field
   */
  public getAffectedPokemon(): Pokemon[] {
    switch (this.side) {
      case ArenaTagSide.PLAYER:
        return globalScene.getPlayerField() ?? [];
      case ArenaTagSide.ENEMY:
        return globalScene.getEnemyField() ?? [];
      case ArenaTagSide.BOTH:
      default:
        return globalScene.getField(true) ?? [];
    }
  }
}

/**
 * Abstract class for arena tags that can persist across turns.
 */
export abstract class SerializableArenaTag extends ArenaTag {
  abstract readonly tagType: SerializableArenaTagType;
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Mist_(move) Mist}.
 * Prevents Pokémon on the opposing side from lowering the stats of the Pokémon in the Mist.
 */
export class MistTag extends SerializableArenaTag {
  readonly tagType = ArenaTagType.MIST;
  constructor(turnCount: number, sourceId: number | undefined, side: ArenaTagSide) {
    super(turnCount, MoveId.MIST, sourceId, side);
  }

  onAdd(arena: Arena, quiet = false): void {
    super.onAdd(arena);

    // We assume `quiet=true` means "just add the bloody tag no questions asked"
    if (quiet) {
      return;
    }

    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for MistTag on add message; id: ${this.sourceId}`);
      return;
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("arenaTag:mistOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(source),
      }),
    );
  }

  /**
   * Cancels the lowering of stats
   * @param _arena the {@linkcode Arena} containing this effect
   * @param simulated `true` if the effect should be applied quietly
   * @param attacker the {@linkcode Pokemon} using a move into this effect.
   * @param cancelled a {@linkcode BooleanHolder} whose value is set to `true`
   * to flag the stat reduction as cancelled
   * @returns `true` if a stat reduction was cancelled; `false` otherwise
   */
  override apply(_arena: Arena, simulated: boolean, attacker: Pokemon, cancelled: BooleanHolder): boolean {
    // `StatStageChangePhase` currently doesn't have a reference to the source of stat drops,
    // so this code currently has no effect on gameplay.
    if (attacker) {
      const bypassed = new BooleanHolder(false);
      // TODO: Allow this to be simulated
      applyAbAttrs("InfiltratorAbAttr", { pokemon: attacker, simulated: false, bypassed });
      if (bypassed.value) {
        return false;
      }
    }

    cancelled.value = true;

    if (!simulated) {
      globalScene.phaseManager.queueMessage(i18next.t("arenaTag:mistApply"));
    }

    return true;
  }
}

/**
 * Reduces the damage of specific move categories in the arena.
 */
export abstract class WeakenMoveScreenTag extends SerializableArenaTag {
  public abstract readonly tagType: ArenaScreenTagType;
  // Getter to avoid unnecessary serialization and prevent modification
  protected abstract get weakenedCategories(): MoveCategory[];

  /**
   * Applies the weakening effect to the move.
   *
   * @param _arena the {@linkcode Arena} where the move is applied.
   * @param _simulated n/a
   * @param attacker the attacking {@linkcode Pokemon}
   * @param moveCategory the attacking move's {@linkcode MoveCategory}.
   * @param damageMultiplier A {@linkcode NumberHolder} containing the damage multiplier
   * @returns `true` if the attacking move was weakened; `false` otherwise.
   */
  override apply(
    _arena: Arena,
    _simulated: boolean,
    attacker: Pokemon,
    moveCategory: MoveCategory,
    damageMultiplier: NumberHolder,
  ): boolean {
    if (this.weakenedCategories.includes(moveCategory)) {
      const bypassed = new BooleanHolder(false);
      applyAbAttrs("InfiltratorAbAttr", { pokemon: attacker, bypassed });
      if (bypassed.value) {
        return false;
      }
      damageMultiplier.value = globalScene.currentBattle.double ? 2732 / 4096 : 0.5;
      return true;
    }
    return false;
  }
}

/**
 * Reduces the damage of physical moves.
 * Used by {@linkcode MoveId.REFLECT}
 */
class ReflectTag extends WeakenMoveScreenTag {
  public readonly tagType = ArenaTagType.REFLECT;
  protected get weakenedCategories(): [MoveCategory.PHYSICAL] {
    return [MoveCategory.PHYSICAL];
  }

  constructor(turnCount: number, sourceId: number | undefined, side: ArenaTagSide) {
    super(turnCount, MoveId.REFLECT, sourceId, side);
  }

  onAdd(_arena: Arena, quiet = false): void {
    if (!quiet) {
      globalScene.phaseManager.queueMessage(
        i18next.t(
          `arenaTag:reflectOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`,
        ),
      );
    }
  }
}

/**
 * Reduces the damage of special moves.
 * Used by {@linkcode MoveId.LIGHT_SCREEN}
 */
class LightScreenTag extends WeakenMoveScreenTag {
  public readonly tagType = ArenaTagType.LIGHT_SCREEN;
  protected get weakenedCategories(): [MoveCategory.SPECIAL] {
    return [MoveCategory.SPECIAL];
  }
  constructor(turnCount: number, sourceId: number | undefined, side: ArenaTagSide) {
    super(turnCount, MoveId.LIGHT_SCREEN, sourceId, side);
  }

  onAdd(_arena: Arena, quiet = false): void {
    if (!quiet) {
      globalScene.phaseManager.queueMessage(
        i18next.t(
          `arenaTag:lightScreenOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`,
        ),
      );
    }
  }
}

/**
 * Reduces the damage of physical and special moves.
 * Used by {@linkcode MoveId.AURORA_VEIL}
 */
class AuroraVeilTag extends WeakenMoveScreenTag {
  public readonly tagType = ArenaTagType.AURORA_VEIL;
  protected get weakenedCategories(): [MoveCategory.PHYSICAL, MoveCategory.SPECIAL] {
    return [MoveCategory.PHYSICAL, MoveCategory.SPECIAL];
  }

  constructor(turnCount: number, sourceId: number | undefined, side: ArenaTagSide) {
    super(turnCount, MoveId.AURORA_VEIL, sourceId, side);
  }

  onAdd(_arena: Arena, quiet = false): void {
    if (!quiet) {
      globalScene.phaseManager.queueMessage(
        i18next.t(
          `arenaTag:auroraVeilOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`,
        ),
      );
    }
  }
}

type ProtectConditionFunc = (arena: Arena, moveId: MoveId) => boolean;

/**
 * Class to implement conditional team protection
 * applies protection based on the attributes of incoming moves
 */
export abstract class ConditionalProtectTag extends ArenaTag {
  /** The condition function to determine which moves are negated */
  protected protectConditionFunc: ProtectConditionFunc;
  /**
   * Whether this protection effect should apply to _all_ moves, including ones that ignore other forms of protection.
   * @defaultValue `false`
   */
  protected ignoresBypass: boolean;

  constructor(
    sourceMove: MoveId,
    sourceId: number | undefined,
    side: ArenaTagSide,
    condition: ProtectConditionFunc,
    ignoresBypass = false,
  ) {
    super(1, sourceMove, sourceId, side);

    this.protectConditionFunc = condition;
    this.ignoresBypass = ignoresBypass;
  }

  onAdd(_arena: Arena): void {
    globalScene.phaseManager.queueMessage(
      i18next.t(
        `arenaTag:conditionalProtectOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`,
        { moveName: super.getMoveName() },
      ),
    );
  }

  // Removes default message for effect removal
  onRemove(_arena: Arena): void {}

  /**
   * Checks incoming moves against the condition function
   * and protects the target if conditions are met
   * @param arena the {@linkcode Arena} containing this tag
   * @param simulated `true` if the tag is applied quietly; `false` otherwise.
   * @param isProtected a {@linkcode BooleanHolder} used to flag if the move is protected against
   * @param _attacker the attacking {@linkcode Pokemon}
   * @param defender the defending {@linkcode Pokemon}
   * @param moveId the {@linkcode MoveId | identifier} for the move being used
   * @param ignoresProtectBypass a {@linkcode BooleanHolder} used to flag if a protection effect supercedes effects that ignore protection
   * @returns `true` if this tag protected against the attack; `false` otherwise
   */
  override apply(
    arena: Arena,
    simulated: boolean,
    isProtected: BooleanHolder,
    _attacker: Pokemon,
    defender: Pokemon,
    moveId: MoveId,
    ignoresProtectBypass: BooleanHolder,
  ): boolean {
    if ((this.side === ArenaTagSide.PLAYER) === defender.isPlayer() && this.protectConditionFunc(arena, moveId)) {
      if (!isProtected.value) {
        isProtected.value = true;
        if (!simulated) {
          new CommonBattleAnim(CommonAnim.PROTECT, defender).play();
          globalScene.phaseManager.queueMessage(
            i18next.t("arenaTag:conditionalProtectApply", {
              moveName: super.getMoveName(),
              pokemonNameWithAffix: getPokemonNameWithAffix(defender),
            }),
          );
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
 * @param _arena {@linkcode Arena} The arena containing the protection effect
 * @param moveId {@linkcode MoveId} The move to check against this condition
 * @returns `true` if the incoming move's priority is greater than 0.
 *   This includes moves with modified priorities from abilities (e.g. Prankster)
 */
const QuickGuardConditionFunc: ProtectConditionFunc = (_arena, moveId) => {
  const move = allMoves[moveId];
  const effectPhase = globalScene.phaseManager.getCurrentPhase();

  if (effectPhase?.is("MoveEffectPhase")) {
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
  public readonly tagType = ArenaTagType.QUICK_GUARD;
  constructor(sourceId: number | undefined, side: ArenaTagSide) {
    super(MoveId.QUICK_GUARD, sourceId, side, QuickGuardConditionFunc);
  }
}

/**
 * Condition function for {@link https://bulbapedia.bulbagarden.net/wiki/Wide_Guard_(move) Wide Guard's}
 * protection effect.
 * @param _arena {@linkcode Arena} The arena containing the protection effect
 * @param moveId {@linkcode MoveId} The move to check against this condition
 * @returns `true` if the incoming move is multi-targeted (even if it's only used against one Pokemon).
 */
const WideGuardConditionFunc: ProtectConditionFunc = (_arena, moveId): boolean => {
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
  public readonly tagType = ArenaTagType.WIDE_GUARD;
  constructor(sourceId: number | undefined, side: ArenaTagSide) {
    super(MoveId.WIDE_GUARD, sourceId, side, WideGuardConditionFunc);
  }
}

/**
 * Condition function for {@link https://bulbapedia.bulbagarden.net/wiki/Mat_Block_(move) Mat Block's}
 * protection effect.
 * @param _arena {@linkcode Arena} The arena containing the protection effect.
 * @param moveId {@linkcode MoveId} The move to check against this condition.
 * @returns `true` if the incoming move is not a Status move.
 */
const MatBlockConditionFunc: ProtectConditionFunc = (_arena, moveId): boolean => {
  const move = allMoves[moveId];
  return move.category !== MoveCategory.STATUS;
};

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Mat_Block_(move) Mat Block}
 * Condition: The incoming move is a Physical or Special attack move.
 */
class MatBlockTag extends ConditionalProtectTag {
  public readonly tagType = ArenaTagType.MAT_BLOCK;
  constructor(sourceId: number | undefined, side: ArenaTagSide) {
    super(MoveId.MAT_BLOCK, sourceId, side, MatBlockConditionFunc);
  }

  onAdd(_arena: Arena) {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for Mat Block message; id: ${this.sourceId}`);
      return;
    }

    super.onAdd(_arena);
    globalScene.phaseManager.queueMessage(
      i18next.t("arenaTag:matBlockOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(source),
      }),
    );
  }
}

/**
 * Condition function for {@link https://bulbapedia.bulbagarden.net/wiki/Crafty_Shield_(move) Crafty Shield's}
 * protection effect.
 * @param _arena {@linkcode Arena} The arena containing the protection effect
 * @param moveId {@linkcode MoveId} The move to check against this condition
 * @returns `true` if the incoming move is a Status move, is not a hazard, and does not target all
 * Pokemon or sides of the field.
 */
const CraftyShieldConditionFunc: ProtectConditionFunc = (_arena, moveId) => {
  const move = allMoves[moveId];
  return (
    move.category === MoveCategory.STATUS &&
    move.moveTarget !== MoveTarget.ENEMY_SIDE &&
    move.moveTarget !== MoveTarget.BOTH_SIDES &&
    move.moveTarget !== MoveTarget.ALL
  );
};

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Crafty_Shield_(move) Crafty Shield}
 * Condition: The incoming move is a Status move, is not a hazard, and does
 * not target all Pokemon or sides of the field.
 */
class CraftyShieldTag extends ConditionalProtectTag {
  public readonly tagType = ArenaTagType.CRAFTY_SHIELD;
  constructor(sourceId: number | undefined, side: ArenaTagSide) {
    super(MoveId.CRAFTY_SHIELD, sourceId, side, CraftyShieldConditionFunc, true);
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Lucky_Chant_(move) Lucky Chant}.
 * Prevents critical hits against the tag's side.
 */
export class NoCritTag extends SerializableArenaTag {
  public readonly tagType = ArenaTagType.NO_CRIT;

  /** Queues a message upon adding this effect to the field */
  onAdd(_arena: Arena): void {
    globalScene.phaseManager.queueMessage(
      i18next.t(`arenaTag:noCritOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : "Enemy"}`, {
        moveName: this.getMoveName(),
      }),
    );
  }

  /** Queues a message upon removing this effect from the field */
  onRemove(_arena: Arena): void {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for NoCritTag on remove message; id: ${this.sourceId}`);
      return;
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("arenaTag:noCritOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(source ?? undefined),
        moveName: this.getMoveName(),
      }),
    );
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Wish_(move) | Wish}.
 * Heals the Pokémon in the user's position the turn after Wish is used.
 */
class WishTag extends SerializableArenaTag {
  // The following fields are meant to be inwardly mutable, but outwardly immutable.
  readonly battlerIndex: BattlerIndex;
  readonly healHp: number;
  readonly sourceName: string;
  // End inwardly mutable fields

  public readonly tagType = ArenaTagType.WISH;

  constructor(turnCount: number, sourceId: number | undefined, side: ArenaTagSide) {
    super(turnCount, MoveId.WISH, sourceId, side);
  }

  onAdd(_arena: Arena): void {
    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for WishTag on add message; id: ${this.sourceId}`);
      return;
    }

    (this as Mutable<this>).sourceName = getPokemonNameWithAffix(source);
    (this as Mutable<this>).healHp = toDmgValue(source.getMaxHp() / 2);
    (this as Mutable<this>).battlerIndex = source.getBattlerIndex();
  }

  onRemove(_arena: Arena): void {
    const target = globalScene.getField()[this.battlerIndex];
    if (target?.isActive(true)) {
      globalScene.phaseManager.queueMessage(
        // TODO: Rename key as it triggers on activation
        i18next.t("arenaTag:wishTagOnAdd", {
          pokemonNameWithAffix: this.sourceName,
        }),
      );
      globalScene.phaseManager.unshiftNew("PokemonHealPhase", target.getBattlerIndex(), this.healHp, null, true, false);
    }
  }

  override loadTag(source: NonFunctionProperties<WishTag>): void {
    super.loadTag(source);
    (this as Mutable<this>).battlerIndex = source.battlerIndex;
    (this as Mutable<this>).healHp = source.healHp;
    (this as Mutable<this>).sourceName = source.sourceName;
  }
}

/**
 * Abstract class to implement weakened moves of a specific type.
 */
export abstract class WeakenMoveTypeTag extends SerializableArenaTag {
  abstract readonly tagType: ArenaTagType.MUD_SPORT | ArenaTagType.WATER_SPORT;
  abstract get weakenedType(): PokemonType;

  /**
   * Reduces an attack's power by 0.33x if it matches this tag's weakened type.
   * @param _arena n/a
   * @param _simulated n/a
   * @param type the attack's {@linkcode PokemonType}
   * @param power a {@linkcode NumberHolder} containing the attack's power
   * @returns `true` if the attack's power was reduced; `false` otherwise.
   */
  override apply(_arena: Arena, _simulated: boolean, type: PokemonType, power: NumberHolder): boolean {
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
  public readonly tagType = ArenaTagType.MUD_SPORT;
  override get weakenedType(): PokemonType.ELECTRIC {
    return PokemonType.ELECTRIC;
  }
  constructor(turnCount: number, sourceId?: number) {
    super(turnCount, MoveId.MUD_SPORT, sourceId);
  }

  onAdd(_arena: Arena): void {
    globalScene.phaseManager.queueMessage(i18next.t("arenaTag:mudSportOnAdd"));
  }

  onRemove(_arena: Arena): void {
    globalScene.phaseManager.queueMessage(i18next.t("arenaTag:mudSportOnRemove"));
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Water_Sport_(move) Water Sport}.
 * Weakens Fire type moves for a set amount of turns, usually 5.
 */
class WaterSportTag extends WeakenMoveTypeTag {
  public readonly tagType = ArenaTagType.WATER_SPORT;
  override get weakenedType(): PokemonType.FIRE {
    return PokemonType.FIRE;
  }
  constructor(turnCount: number, sourceId?: number) {
    super(turnCount, MoveId.WATER_SPORT, sourceId);
  }

  onAdd(_arena: Arena): void {
    globalScene.phaseManager.queueMessage(i18next.t("arenaTag:waterSportOnAdd"));
  }

  onRemove(_arena: Arena): void {
    globalScene.phaseManager.queueMessage(i18next.t("arenaTag:waterSportOnRemove"));
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Ion_Deluge_(move) | Ion Deluge}
 * and the secondary effect of {@link https://bulbapedia.bulbagarden.net/wiki/Plasma_Fists_(move) | Plasma Fists}.
 * Converts Normal-type moves to Electric type for the rest of the turn.
 */
export class IonDelugeTag extends ArenaTag {
  public readonly tagType = ArenaTagType.ION_DELUGE;
  constructor(sourceMove?: MoveId) {
    super(1, sourceMove);
  }

  /** Queues an on-add message */
  onAdd(_arena: Arena): void {
    globalScene.phaseManager.queueMessage(i18next.t("arenaTag:plasmaFistsOnAdd"));
  }

  onRemove(_arena: Arena): void {} // Removes default on-remove message

  /**
   * Converts Normal-type moves to Electric type
   * @param _arena n/a
   * @param _simulated n/a
   * @param moveType a {@linkcode NumberHolder} containing a move's {@linkcode PokemonType}
   * @returns `true` if the given move type changed; `false` otherwise.
   */
  override apply(_arena: Arena, _simulated: boolean, moveType: NumberHolder): boolean {
    if (moveType.value === PokemonType.NORMAL) {
      moveType.value = PokemonType.ELECTRIC;
      return true;
    }
    return false;
  }
}

/**
 * Abstract class to implement arena traps.
 */
export abstract class ArenaTrapTag extends SerializableArenaTag {
  abstract readonly tagType: ArenaTrapTagType;
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
  constructor(sourceMove: MoveId, sourceId: number | undefined, side: ArenaTagSide, maxLayers: number) {
    super(0, sourceMove, sourceId, side);

    this.layers = 1;
    this.maxLayers = maxLayers;
  }

  onOverlap(arena: Arena, _source: Pokemon | null): void {
    if (this.layers < this.maxLayers) {
      this.layers++;

      this.onAdd(arena);
    }
  }

  /**
   * Activates the hazard effect onto a Pokemon when it enters the field
   * @param _arena the {@linkcode Arena} containing this tag
   * @param simulated if `true`, only checks if the hazard would activate.
   * @param pokemon the {@linkcode Pokemon} triggering this hazard
   * @returns `true` if this hazard affects the given Pokemon; `false` otherwise.
   */
  override apply(_arena: Arena, simulated: boolean, pokemon: Pokemon): boolean {
    if ((this.side === ArenaTagSide.PLAYER) !== pokemon.isPlayer()) {
      return false;
    }

    return this.activateTrap(pokemon, simulated);
  }

  activateTrap(_pokemon: Pokemon, _simulated: boolean): boolean {
    return false;
  }

  getMatchupScoreMultiplier(pokemon: Pokemon): number {
    return pokemon.isGrounded()
      ? 1
      : Phaser.Math.Linear(0, 1 / Math.pow(2, this.layers), Math.min(pokemon.getHpRatio(), 0.5) * 2);
  }

  loadTag(source: NonFunctionProperties<ArenaTrapTag>): void {
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
  public readonly tagType = ArenaTagType.SPIKES;
  constructor(sourceId: number | undefined, side: ArenaTagSide) {
    super(MoveId.SPIKES, sourceId, side, 3);
  }

  onAdd(arena: Arena, quiet = false): void {
    super.onAdd(arena);

    // We assume `quiet=true` means "just add the bloody tag no questions asked"
    if (quiet) {
      return;
    }

    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for SpikesTag on add message; id: ${this.sourceId}`);
      return;
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("arenaTag:spikesOnAdd", {
        moveName: this.getMoveName(),
        opponentDesc: source.getOpponentDescriptor(),
      }),
    );
  }

  override activateTrap(pokemon: Pokemon, simulated: boolean): boolean {
    if (!pokemon.isGrounded()) {
      return false;
    }

    const cancelled = new BooleanHolder(false);
    applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon, cancelled });
    if (simulated || cancelled.value) {
      return !cancelled.value;
    }

    const damageHpRatio = 1 / (10 - 2 * this.layers);
    const damage = toDmgValue(pokemon.getMaxHp() * damageHpRatio);

    globalScene.phaseManager.queueMessage(
      i18next.t("arenaTag:spikesActivateTrap", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
    pokemon.damageAndUpdate(damage, { result: HitResult.INDIRECT });
    pokemon.turnData.damageTaken += damage;
    return true;
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Toxic_Spikes_(move) Toxic Spikes}.
 * Applies up to 2 layers of Toxic Spikes, poisoning or badly poisoning any Pokémon who is
 * summoned into this trap if 1 or 2 layers of Toxic Spikes respectively are up. Poison-type
 * Pokémon summoned into this trap remove it entirely.
 */
class ToxicSpikesTag extends ArenaTrapTag {
  #neutralized: boolean;
  public readonly tagType = ArenaTagType.TOXIC_SPIKES;

  constructor(sourceId: number | undefined, side: ArenaTagSide) {
    super(MoveId.TOXIC_SPIKES, sourceId, side, 2);
    this.#neutralized = false;
  }

  onAdd(arena: Arena, quiet = false): void {
    super.onAdd(arena);

    if (quiet) {
      // We assume `quiet=true` means "just add the bloody tag no questions asked"
      return;
    }

    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for ToxicSpikesTag on add message; id: ${this.sourceId}`);
      return;
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("arenaTag:toxicSpikesOnAdd", {
        moveName: this.getMoveName(),
        opponentDesc: source.getOpponentDescriptor(),
      }),
    );
  }

  onRemove(arena: Arena): void {
    if (!this.#neutralized) {
      super.onRemove(arena);
    }
  }

  override activateTrap(pokemon: Pokemon, simulated: boolean): boolean {
    if (pokemon.isGrounded()) {
      if (simulated) {
        return true;
      }
      if (pokemon.isOfType(PokemonType.POISON)) {
        this.#neutralized = true;
        if (globalScene.arena.removeTag(this.tagType)) {
          globalScene.phaseManager.queueMessage(
            i18next.t("arenaTag:toxicSpikesActivateTrapPoison", {
              pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
              moveName: this.getMoveName(),
            }),
          );
          return true;
        }
      } else if (!pokemon.status) {
        const toxic = this.layers > 1;
        if (
          pokemon.trySetStatus(!toxic ? StatusEffect.POISON : StatusEffect.TOXIC, true, null, 0, this.getMoveName())
        ) {
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
    if (pokemon.isOfType(PokemonType.POISON)) {
      return 1.25;
    }
    return super.getMatchupScoreMultiplier(pokemon);
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Stealth_Rock_(move) Stealth Rock}.
 * Applies up to 1 layer of Stealth Rocks, dealing percentage-based damage to any Pokémon
 * who is summoned into the trap, based on the Rock type's type effectiveness.
 */
class StealthRockTag extends ArenaTrapTag {
  public readonly tagType = ArenaTagType.STEALTH_ROCK;
  constructor(sourceId: number | undefined, side: ArenaTagSide) {
    super(MoveId.STEALTH_ROCK, sourceId, side, 1);
  }

  onAdd(arena: Arena, quiet = false): void {
    super.onAdd(arena);

    if (quiet) {
      return;
    }

    const source = this.getSourcePokemon();
    if (!quiet && source) {
      globalScene.phaseManager.queueMessage(
        i18next.t("arenaTag:stealthRockOnAdd", {
          opponentDesc: source.getOpponentDescriptor(),
        }),
      );
    }
  }

  getDamageHpRatio(pokemon: Pokemon): number {
    const effectiveness = pokemon.getAttackTypeEffectiveness(PokemonType.ROCK, undefined, true);

    let damageHpRatio = 0;

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
    applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon, cancelled });
    if (cancelled.value) {
      return false;
    }

    const damageHpRatio = this.getDamageHpRatio(pokemon);
    if (!damageHpRatio) {
      return false;
    }

    if (simulated) {
      return true;
    }

    const damage = toDmgValue(pokemon.getMaxHp() * damageHpRatio);
    globalScene.phaseManager.queueMessage(
      i18next.t("arenaTag:stealthRockActivateTrap", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
      }),
    );
    pokemon.damageAndUpdate(damage, { result: HitResult.INDIRECT });
    pokemon.turnData.damageTaken += damage;
    return true;
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
  public readonly tagType = ArenaTagType.STICKY_WEB;
  constructor(sourceId: number | undefined, side: ArenaTagSide) {
    super(MoveId.STICKY_WEB, sourceId, side, 1);
  }

  onAdd(arena: Arena, quiet = false): void {
    super.onAdd(arena);

    // We assume `quiet=true` means "just add the bloody tag no questions asked"
    if (quiet) {
      return;
    }

    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for SpikesTag on add message; id: ${this.sourceId}`);
      return;
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("arenaTag:stickyWebOnAdd", {
        moveName: this.getMoveName(),
        opponentDesc: source.getOpponentDescriptor(),
      }),
    );
  }

  override activateTrap(pokemon: Pokemon, simulated: boolean): boolean {
    if (pokemon.isGrounded()) {
      const cancelled = new BooleanHolder(false);
      applyAbAttrs("ProtectStatAbAttr", {
        pokemon,
        cancelled,
        stat: Stat.SPD,
        stages: -1,
      });

      if (simulated) {
        return !cancelled.value;
      }

      if (!cancelled.value) {
        globalScene.phaseManager.queueMessage(
          i18next.t("arenaTag:stickyWebActivateTrap", {
            pokemonName: pokemon.getNameToRender(),
          }),
        );
        const stages = new NumberHolder(-1);
        globalScene.phaseManager.unshiftNew(
          "StatStageChangePhase",
          pokemon.getBattlerIndex(),
          false,
          [Stat.SPD],
          stages.value,
          true,
          false,
          true,
          null,
          false,
          true,
        );
        return true;
      }
    }

    return false;
  }
}

/**
 * Arena Tag class for delayed attacks, such as {@linkcode MoveId.FUTURE_SIGHT} or {@linkcode MoveId.DOOM_DESIRE}.
 * Delays the attack's effect by a set amount of turns, usually 3 (including the turn the move is used),
 * and deals damage after the turn count is reached.
 */
export class DelayedAttackTag extends SerializableArenaTag {
  public targetIndex: BattlerIndex;
  public readonly tagType: ArenaDelayedAttackTagType;

  constructor(
    tagType: ArenaTagType.DOOM_DESIRE | ArenaTagType.FUTURE_SIGHT,
    sourceMove: MoveId | undefined,
    sourceId: number | undefined,
    targetIndex: BattlerIndex,
    side: ArenaTagSide = ArenaTagSide.BOTH,
  ) {
    super(3, sourceMove, sourceId, side);
    this.tagType = tagType;
    this.targetIndex = targetIndex;
    this.side = side;
  }

  lapse(arena: Arena): boolean {
    const ret = super.lapse(arena);

    if (!ret) {
      // TODO: This should not add to move history (for Spite)
      globalScene.phaseManager.unshiftNew(
        "MoveEffectPhase",
        this.sourceId!,
        [this.targetIndex],
        allMoves[this.sourceMove!],
        MoveUseMode.FOLLOW_UP,
      ); // TODO: are those bangs correct?
    }

    return ret;
  }

  onRemove(_arena: Arena): void {}
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Trick_Room_(move) Trick Room}.
 * Reverses the Speed stats for all Pokémon on the field as long as this arena tag is up,
 * also reversing the turn order for all Pokémon on the field as well.
 */
export class TrickRoomTag extends SerializableArenaTag {
  public readonly tagType = ArenaTagType.TRICK_ROOM;
  constructor(turnCount: number, sourceId?: number) {
    super(turnCount, MoveId.TRICK_ROOM, sourceId);
  }

  /**
   * Reverses Speed-based turn order for all Pokemon on the field
   * @param _arena n/a
   * @param _simulated n/a
   * @param speedReversed a {@linkcode BooleanHolder} used to flag if Speed-based
   * turn order should be reversed.
   * @returns `true` if turn order is successfully reversed; `false` otherwise
   */
  override apply(_arena: Arena, _simulated: boolean, speedReversed: BooleanHolder): boolean {
    speedReversed.value = !speedReversed.value;
    return true;
  }

  onAdd(_arena: Arena): void {
    super.onAdd(_arena);

    const source = this.getSourcePokemon();
    if (!source) {
      console.warn(`Failed to get source Pokemon for TrickRoomTag on add message; id: ${this.sourceId}`);
      return;
    }

    globalScene.phaseManager.queueMessage(
      i18next.t("arenaTag:trickRoomOnAdd", {
        moveName: this.getMoveName(),
      }),
    );
  }

  onRemove(_arena: Arena): void {
    globalScene.phaseManager.queueMessage(i18next.t("arenaTag:trickRoomOnRemove"));
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Gravity_(move) Gravity}.
 * Grounds all Pokémon on the field, including Flying-types and those with
 * {@linkcode AbilityId.LEVITATE} for the duration of the arena tag, usually 5 turns.
 */
export class GravityTag extends SerializableArenaTag {
  public readonly tagType = ArenaTagType.GRAVITY;
  constructor(turnCount: number, sourceId?: number) {
    super(turnCount, MoveId.GRAVITY, sourceId);
  }

  onAdd(_arena: Arena): void {
    globalScene.phaseManager.queueMessage(i18next.t("arenaTag:gravityOnAdd"));
    globalScene.getField(true).forEach(pokemon => {
      if (pokemon !== null) {
        pokemon.removeTag(BattlerTagType.FLOATING);
        pokemon.removeTag(BattlerTagType.TELEKINESIS);
        if (pokemon.getTag(BattlerTagType.FLYING)) {
          pokemon.addTag(BattlerTagType.INTERRUPTED);
        }
      }
    });
  }

  onRemove(_arena: Arena): void {
    globalScene.phaseManager.queueMessage(i18next.t("arenaTag:gravityOnRemove"));
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Tailwind_(move) Tailwind}.
 * Doubles the Speed of the Pokémon who created this arena tag, as well as all allied Pokémon.
 * Applies this arena tag for 4 turns (including the turn the move was used).
 */
class TailwindTag extends SerializableArenaTag {
  public readonly tagType = ArenaTagType.TAILWIND;
  constructor(turnCount: number, sourceId: number | undefined, side: ArenaTagSide) {
    super(turnCount, MoveId.TAILWIND, sourceId, side);
  }

  onAdd(_arena: Arena, quiet = false): void {
    const source = this.getSourcePokemon();
    if (!source) {
      return;
    }

    super.onAdd(_arena, quiet);

    if (!quiet) {
      globalScene.phaseManager.queueMessage(
        i18next.t(
          `arenaTag:tailwindOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`,
        ),
      );
    }

    const field = source.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField();

    for (const pokemon of field) {
      // Apply the CHARGED tag to party members with the WIND_POWER ability
      // TODO: This should not be handled here
      if (pokemon.hasAbility(AbilityId.WIND_POWER) && !pokemon.getTag(BattlerTagType.CHARGED)) {
        pokemon.addTag(BattlerTagType.CHARGED);
        globalScene.phaseManager.queueMessage(
          i18next.t("abilityTriggers:windPowerCharged", {
            pokemonName: getPokemonNameWithAffix(pokemon),
            moveName: this.getMoveName(),
          }),
        );
      }

      // Raise attack by one stage if party member has WIND_RIDER ability
      // TODO: Ability displays should be handled by the ability
      if (pokemon.hasAbility(AbilityId.WIND_RIDER)) {
        globalScene.phaseManager.queueAbilityDisplay(pokemon, false, true);
        globalScene.phaseManager.unshiftNew(
          "StatStageChangePhase",
          pokemon.getBattlerIndex(),
          true,
          [Stat.ATK],
          1,
          true,
        );
        globalScene.phaseManager.queueAbilityDisplay(pokemon, false, false);
      }
    }
  }

  onRemove(_arena: Arena, quiet = false): void {
    if (!quiet) {
      globalScene.phaseManager.queueMessage(
        i18next.t(
          `arenaTag:tailwindOnRemove${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`,
        ),
      );
    }
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Happy_Hour_(move) Happy Hour}.
 * Doubles the prize money from trainers and money moves like {@linkcode MoveId.PAY_DAY} and {@linkcode MoveId.MAKE_IT_RAIN}.
 */
class HappyHourTag extends SerializableArenaTag {
  public readonly tagType = ArenaTagType.HAPPY_HOUR;
  constructor(turnCount: number, sourceId: number | undefined, side: ArenaTagSide) {
    super(turnCount, MoveId.HAPPY_HOUR, sourceId, side);
  }

  onAdd(_arena: Arena): void {
    globalScene.phaseManager.queueMessage(i18next.t("arenaTag:happyHourOnAdd"));
  }

  onRemove(_arena: Arena): void {
    globalScene.phaseManager.queueMessage(i18next.t("arenaTag:happyHourOnRemove"));
  }
}

class SafeguardTag extends ArenaTag {
  public readonly tagType = ArenaTagType.SAFEGUARD;
  constructor(turnCount: number, sourceId: number | undefined, side: ArenaTagSide) {
    super(turnCount, MoveId.SAFEGUARD, sourceId, side);
  }

  onAdd(_arena: Arena): void {
    globalScene.phaseManager.queueMessage(
      i18next.t(
        `arenaTag:safeguardOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`,
      ),
    );
  }

  onRemove(_arena: Arena): void {
    globalScene.phaseManager.queueMessage(
      i18next.t(
        `arenaTag:safeguardOnRemove${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`,
      ),
    );
  }
}

class NoneTag extends ArenaTag {
  public readonly tagType = ArenaTagType.NONE;
  constructor() {
    super(0);
  }
}

/**
 * This arena tag facilitates the application of the move Imprison
 * Imprison remains in effect as long as the source Pokemon is active and present on the field.
 * Imprison will apply to any opposing Pokemon that switch onto the field as well.
 */
class ImprisonTag extends ArenaTrapTag {
  public readonly tagType = ArenaTagType.IMPRISON;
  constructor(sourceId: number | undefined, side: ArenaTagSide) {
    super(MoveId.IMPRISON, sourceId, side, 1);
  }

  /**
   * Apply the effects of Imprison to all opposing on-field Pokemon.
   */
  override onAdd() {
    const source = this.getSourcePokemon();
    if (!source) {
      return;
    }

    const party = this.getAffectedPokemon();
    party.forEach(p => {
      if (p.isAllowedInBattle()) {
        p.addTag(BattlerTagType.IMPRISON, 1, MoveId.IMPRISON, this.sourceId);
      }
    });

    globalScene.phaseManager.queueMessage(
      i18next.t("battlerTags:imprisonOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(source),
      }),
    );
  }

  /**
   * Checks if the source Pokemon is still active on the field
   * @param _arena
   * @returns `true` if the source of the tag is still active on the field | `false` if not
   */
  override lapse(): boolean {
    const source = this.getSourcePokemon();
    return !!source?.isActive(true);
  }

  /**
   * This applies the effects of Imprison to any opposing Pokemon that switch into the field while the source Pokemon is still active
   * @param {Pokemon} pokemon the Pokemon Imprison is applied to
   * @returns `true`
   */
  override activateTrap(pokemon: Pokemon): boolean {
    const source = this.getSourcePokemon();
    if (source?.isActive(true) && pokemon.isAllowedInBattle()) {
      pokemon.addTag(BattlerTagType.IMPRISON, 1, MoveId.IMPRISON, this.sourceId);
    }
    return true;
  }

  /**
   * When the arena tag is removed, it also attempts to remove any related Battler Tags if they haven't already been removed from the affected Pokemon
   * @param arena
   */
  override onRemove(): void {
    const party = this.getAffectedPokemon();
    party.forEach(p => {
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
class FireGrassPledgeTag extends SerializableArenaTag {
  public readonly tagType = ArenaTagType.FIRE_GRASS_PLEDGE;
  constructor(sourceId: number | undefined, side: ArenaTagSide) {
    super(4, MoveId.FIRE_PLEDGE, sourceId, side);
  }

  override onAdd(_arena: Arena): void {
    // "A sea of fire enveloped your/the opposing team!"
    globalScene.phaseManager.queueMessage(
      i18next.t(
        `arenaTag:fireGrassPledgeOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`,
      ),
    );
  }

  override lapse(arena: Arena): boolean {
    const field: Pokemon[] =
      this.side === ArenaTagSide.PLAYER ? globalScene.getPlayerField() : globalScene.getEnemyField();

    field
      .filter(pokemon => !pokemon.isOfType(PokemonType.FIRE) && !pokemon.switchOutStatus)
      .forEach(pokemon => {
        // "{pokemonNameWithAffix} was hurt by the sea of fire!"
        globalScene.phaseManager.queueMessage(
          i18next.t("arenaTag:fireGrassPledgeLapse", {
            pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          }),
        );
        // TODO: Replace this with a proper animation
        globalScene.phaseManager.unshiftNew(
          "CommonAnimPhase",
          pokemon.getBattlerIndex(),
          pokemon.getBattlerIndex(),
          CommonAnim.MAGMA_STORM,
        );
        pokemon.damageAndUpdate(toDmgValue(pokemon.getMaxHp() / 8), { result: HitResult.INDIRECT });
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
class WaterFirePledgeTag extends SerializableArenaTag {
  public readonly tagType = ArenaTagType.WATER_FIRE_PLEDGE;
  constructor(sourceId: number | undefined, side: ArenaTagSide) {
    super(4, MoveId.WATER_PLEDGE, sourceId, side);
  }

  override onAdd(_arena: Arena): void {
    // "A rainbow appeared in the sky on your/the opposing team's side!"
    globalScene.phaseManager.queueMessage(
      i18next.t(
        `arenaTag:waterFirePledgeOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`,
      ),
    );
  }

  /**
   * Doubles the chance for the given move's secondary effect(s) to trigger
   * @param _arena the {@linkcode Arena} containing this tag
   * @param _simulated n/a
   * @param moveChance a {@linkcode NumberHolder} containing
   * the move's current effect chance
   * @returns `true` if the move's effect chance was doubled (currently always `true`)
   */
  override apply(_arena: Arena, _simulated: boolean, moveChance: NumberHolder): boolean {
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
class GrassWaterPledgeTag extends SerializableArenaTag {
  public readonly tagType = ArenaTagType.GRASS_WATER_PLEDGE;
  constructor(sourceId: number | undefined, side: ArenaTagSide) {
    super(4, MoveId.GRASS_PLEDGE, sourceId, side);
  }

  override onAdd(_arena: Arena): void {
    // "A swamp enveloped your/the opposing team!"
    globalScene.phaseManager.queueMessage(
      i18next.t(
        `arenaTag:grassWaterPledgeOnAdd${this.side === ArenaTagSide.PLAYER ? "Player" : this.side === ArenaTagSide.ENEMY ? "Enemy" : ""}`,
      ),
    );
  }
}

/**
 * Arena Tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Fairy_Lock_(move) Fairy Lock}.
 * Fairy Lock prevents all Pokémon (except Ghost types) on the field from switching out or
 * fleeing during their next turn.
 * If a Pokémon that's on the field when Fairy Lock is used goes on to faint later in the same turn,
 * the Pokémon that replaces it will still be unable to switch out in the following turn.
 */
export class FairyLockTag extends SerializableArenaTag {
  public readonly tagType = ArenaTagType.FAIRY_LOCK;
  constructor(turnCount: number, sourceId?: number) {
    super(turnCount, MoveId.FAIRY_LOCK, sourceId);
  }

  onAdd(_arena: Arena): void {
    globalScene.phaseManager.queueMessage(i18next.t("arenaTag:fairyLockOnAdd"));
  }
}

/**
 * Arena tag class for {@link https://bulbapedia.bulbagarden.net/wiki/Neutralizing_Gas_(Ability) Neutralizing Gas}
 *
 * Keeps track of the number of pokemon on the field with Neutralizing Gas - If it drops to zero, the effect is ended and abilities are reactivated
 *
 * Additionally ends onLose abilities when it is activated
 * @sealed
 */
export class SuppressAbilitiesTag extends SerializableArenaTag {
  // Source count is allowed to be inwardly mutable, but outwardly immutable
  public readonly sourceCount: number;
  public readonly tagType = ArenaTagType.NEUTRALIZING_GAS;
  // Private field prevents field from appearing during serialization
  /** Whether the tag is in the process of being removed */
  #beingRemoved: boolean;
  /** Whether the tag is in the process of being removed */
  public get beingRemoved(): boolean {
    return this.#beingRemoved;
  }

  constructor(sourceId?: number) {
    super(0, undefined, sourceId);
    this.sourceCount = 1;
    this.#beingRemoved = false;
  }

  public override loadTag(source: NonFunctionProperties<SuppressAbilitiesTag>): void {
    super.loadTag(source);
    (this as Mutable<this>).sourceCount = source.sourceCount;
  }

  public override onAdd(_arena: Arena): void {
    const pokemon = this.getSourcePokemon();
    if (pokemon) {
      this.playActivationMessage(pokemon);

      for (const fieldPokemon of globalScene.getField(true)) {
        if (fieldPokemon && fieldPokemon.id !== pokemon.id) {
          // TODO: investigate whether we can just remove the foreach and call `applyAbAttrs` directly, providing
          // the appropriate attributes (preLEaveField and IllusionBreak)
          [true, false].forEach(passive => {
            applyOnLoseAbAttrs({ pokemon: fieldPokemon, passive });
          });
        }
      }
    }
  }

  public override onOverlap(_arena: Arena, source: Pokemon | null): void {
    (this as Mutable<this>).sourceCount++;
    this.playActivationMessage(source);
  }

  public onSourceLeave(arena: Arena): void {
    (this as Mutable<this>).sourceCount--;
    if (this.sourceCount <= 0) {
      arena.removeTag(ArenaTagType.NEUTRALIZING_GAS);
    } else if (this.sourceCount === 1) {
      // With 1 source left, that pokemon's other abilities should reactivate
      // This may be confusing for players but would be the most accurate gameplay-wise
      // Could have a custom message that plays when a specific pokemon's NG ends? This entire thing exists due to passives after all
      const setter = globalScene
        .getField()
        .filter(p => p?.hasAbilityWithAttr("PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr", false))[0];
      applyOnGainAbAttrs({
        pokemon: setter,
        passive: setter.getAbility().hasAttr("PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr"),
      });
    }
  }

  public override onRemove(_arena: Arena, quiet = false) {
    this.#beingRemoved = true;
    if (!quiet) {
      globalScene.phaseManager.queueMessage(i18next.t("arenaTag:neutralizingGasOnRemove"));
    }

    for (const pokemon of globalScene.getField(true)) {
      // There is only one pokemon with this attr on the field on removal, so its abilities are already active
      if (pokemon && !pokemon.hasAbilityWithAttr("PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr", false)) {
        [true, false].forEach(passive => {
          applyOnGainAbAttrs({ pokemon, passive });
        });
      }
    }
  }

  public shouldApplyToSelf(): boolean {
    return this.sourceCount > 1;
  }

  private playActivationMessage(pokemon: Pokemon | null) {
    if (pokemon) {
      globalScene.phaseManager.queueMessage(
        i18next.t("arenaTag:neutralizingGasOnAdd", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      );
    }
  }
}

// TODO: swap `sourceMove` and `sourceId` and make `sourceMove` an optional parameter
export function getArenaTag(
  tagType: ArenaTagType,
  turnCount: number,
  sourceMove: MoveId | undefined,
  sourceId: number | undefined,
  targetIndex?: BattlerIndex,
  side: ArenaTagSide = ArenaTagSide.BOTH,
): ArenaTag | null {
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
      return new NoCritTag(turnCount, sourceMove, sourceId, side);
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
      if (isNullOrUndefined(targetIndex)) {
        return null; // If missing target index, no tag is created
      }
      return new DelayedAttackTag(tagType, sourceMove, sourceId, targetIndex, side);
    case ArenaTagType.WISH:
      return new WishTag(turnCount, sourceId, side);
    case ArenaTagType.STEALTH_ROCK:
      return new StealthRockTag(sourceId, side);
    case ArenaTagType.STICKY_WEB:
      return new StickyWebTag(sourceId, side);
    case ArenaTagType.TRICK_ROOM:
      return new TrickRoomTag(turnCount, sourceId);
    case ArenaTagType.GRAVITY:
      return new GravityTag(turnCount, sourceId);
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
    case ArenaTagType.NEUTRALIZING_GAS:
      return new SuppressAbilitiesTag(sourceId);
    default:
      return null;
  }
}

/**
 * When given a battler tag or json representing one, creates an actual ArenaTag object with the same data.
 * @param source - An arena tag
 * @returns The valid arena tag
 */
export function loadArenaTag(source: (ArenaTag | ArenaTagTypeData) & { targetIndex?: BattlerIndex }): ArenaTag {
  const tag =
    getArenaTag(
      source.tagType,
      source.turnCount,
      source.sourceMove,
      source.sourceId,
      source.targetIndex,
      source.side,
    ) ?? new NoneTag();
  tag.loadTag(source);
  return tag;
}

export type ArenaTagTypeMap = {
  [ArenaTagType.MUD_SPORT]: MudSportTag;
  [ArenaTagType.WATER_SPORT]: WaterSportTag;
  [ArenaTagType.ION_DELUGE]: IonDelugeTag;
  [ArenaTagType.SPIKES]: SpikesTag;
  [ArenaTagType.MIST]: MistTag;
  [ArenaTagType.QUICK_GUARD]: QuickGuardTag;
  [ArenaTagType.WIDE_GUARD]: WideGuardTag;
  [ArenaTagType.MAT_BLOCK]: MatBlockTag;
  [ArenaTagType.CRAFTY_SHIELD]: CraftyShieldTag;
  [ArenaTagType.NO_CRIT]: NoCritTag;
  [ArenaTagType.TOXIC_SPIKES]: ToxicSpikesTag;
  [ArenaTagType.FUTURE_SIGHT]: DelayedAttackTag;
  [ArenaTagType.DOOM_DESIRE]: DelayedAttackTag;
  [ArenaTagType.WISH]: WishTag;
  [ArenaTagType.STEALTH_ROCK]: StealthRockTag;
  [ArenaTagType.STICKY_WEB]: StickyWebTag;
  [ArenaTagType.TRICK_ROOM]: TrickRoomTag;
  [ArenaTagType.GRAVITY]: GravityTag;
  [ArenaTagType.REFLECT]: ReflectTag;
  [ArenaTagType.LIGHT_SCREEN]: LightScreenTag;
  [ArenaTagType.AURORA_VEIL]: AuroraVeilTag;
  [ArenaTagType.TAILWIND]: TailwindTag;
  [ArenaTagType.HAPPY_HOUR]: HappyHourTag;
  [ArenaTagType.SAFEGUARD]: SafeguardTag;
  [ArenaTagType.IMPRISON]: ImprisonTag;
  [ArenaTagType.FIRE_GRASS_PLEDGE]: FireGrassPledgeTag;
  [ArenaTagType.WATER_FIRE_PLEDGE]: WaterFirePledgeTag;
  [ArenaTagType.GRASS_WATER_PLEDGE]: GrassWaterPledgeTag;
  [ArenaTagType.FAIRY_LOCK]: FairyLockTag;
  [ArenaTagType.NEUTRALIZING_GAS]: SuppressAbilitiesTag;
  [ArenaTagType.NONE]: NoneTag;
};
