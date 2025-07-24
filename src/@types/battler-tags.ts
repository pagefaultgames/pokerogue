import type { BattlerTagTypeMap, SerializableBattlerTag } from "#data/battler-tags";
import type { BattlerTagType } from "#enums/battler-tag-type";

/**
 * Subset of {@linkcode BattlerTagType}s that restrict the use of moves.
 */
export type MoveRestrictionBattlerTagType =
  | BattlerTagType.THROAT_CHOPPED
  | BattlerTagType.TORMENT
  | BattlerTagType.TAUNT
  | BattlerTagType.IMPRISON
  | BattlerTagType.HEAL_BLOCK
  | BattlerTagType.ENCORE
  | BattlerTagType.DISABLED
  | BattlerTagType.GORILLA_TACTICS;

/**
 * Subset of {@linkcode BattlerTagType}s that block damage from moves.
 */
export type FormBlockDamageBattlerTagType = BattlerTagType.ICE_FACE | BattlerTagType.DISGUISE;

/**
 * Subset of {@linkcode BattlerTagType}s that are related to trapping effects.
 */
export type TrappingBattlerTagType =
  | BattlerTagType.BIND
  | BattlerTagType.WRAP
  | BattlerTagType.FIRE_SPIN
  | BattlerTagType.WHIRLPOOL
  | BattlerTagType.CLAMP
  | BattlerTagType.SAND_TOMB
  | BattlerTagType.MAGMA_STORM
  | BattlerTagType.SNAP_TRAP
  | BattlerTagType.THUNDER_CAGE
  | BattlerTagType.INFESTATION
  | BattlerTagType.INGRAIN
  | BattlerTagType.OCTOLOCK
  | BattlerTagType.NO_RETREAT;

/**
 * Subset of {@linkcode BattlerTagType}s that are related to protection effects.
 */
export type ProtectedBattlerTagType = BattlerTagType.PROTECTED;

/**
 * Subset of {@linkcode BattlerTagType}s that are related to protection effects.
 */
export type DamageProtectedBattlerTagType =
  | BattlerTagType.PROTECTED
  | BattlerTagType.SPIKY_SHIELD
  | BattlerTagType.KINGS_SHIELD
  | BattlerTagType.OBSTRUCT
  | BattlerTagType.SILK_TRAP
  | BattlerTagType.BANEFUL_BUNKER
  | BattlerTagType.BURNING_BULWARK;

/**
 * Subset of {@linkcode BattlerTagType}s that are related to semi-invulnerable states.
 */
export type SemiInvulnerableBattlerTagType =
  | BattlerTagType.FLYING
  | BattlerTagType.UNDERGROUND
  | BattlerTagType.UNDERWATER
  | BattlerTagType.HIDDEN;

/**
 * Subset of {@linkcode BattlerTagType}s that are able to persist between turns and should therefore be serialized
 */
export type SerializableBattlerTagType = keyof {
  [K in keyof BattlerTagTypeMap as BattlerTagTypeMap[K] extends SerializableBattlerTag
    ? K
    : never]: BattlerTagTypeMap[K];
};

/**
 * Subset of {@linkcode BattlerTagType}s that are not able to persist across waves and should therefore not be serialized
 */
export type NonSerializableBattlerTagType = Exclude<BattlerTagType, SerializableBattlerTagType>;

/**
 * Dummy, typescript-only declaration to ensure that
 * {@linkcode BattlerTagTypeMap} has an entry for all `BattlerTagType`s.
 *
 * If a battler tag is missing from the map, Typescript will throw an error on this statement.
 *
 * ⚠️ Does not actually exist at runtime, so it must not be used!
 */
declare const EnsureAllBattlerTagTypesAreMapped: BattlerTagTypeMap[BattlerTagType] & never;
