// biome-ignore-start lint/correctness/noUnusedImports: Used in a TSDoc comment
import type { AbilityBattlerTag, BattlerTagTypeMap, SerializableBattlerTag, TypeBoostTag } from "#data/battler-tags";
import type { AbilityId } from "#enums/ability-id";
// biome-ignore-end lint/correctness/noUnusedImports: end
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
export type ProtectionBattlerTagType = BattlerTagType.PROTECTED | BattlerTagType.SPIKY_SHIELD | DamageProtectedTagType;
/**
 * Subset of {@linkcode BattlerTagType}s related to protection effects that block damage but not status moves.
 */
export type DamageProtectedTagType = ContactSetStatusProtectedTagType | ContactStatStageChangeProtectedTagType;

/**
 * Subset of {@linkcode BattlerTagType}s related to protection effects that set a status effect on the attacker.
 */
export type ContactSetStatusProtectedTagType = BattlerTagType.BANEFUL_BUNKER | BattlerTagType.BURNING_BULWARK;

/**
 * Subset of {@linkcode BattlerTagType}s related to protection effects that change stat stages of the attacker.
 */
export type ContactStatStageChangeProtectedTagType =
  | BattlerTagType.KINGS_SHIELD
  | BattlerTagType.SILK_TRAP
  | BattlerTagType.OBSTRUCT;

/** Subset of {@linkcode BattlerTagType}s that provide the Endure effect */
export type EndureTagType = BattlerTagType.ENDURE_TOKEN | BattlerTagType.ENDURING;

/**
 * Subset of {@linkcode BattlerTagType}s that are related to semi-invulnerable states.
 */
export type SemiInvulnerableTagType =
  | BattlerTagType.FLYING
  | BattlerTagType.UNDERGROUND
  | BattlerTagType.UNDERWATER
  | BattlerTagType.HIDDEN;

/**
 * Subset of {@linkcode BattlerTagType}s corresponding to {@linkcode AbilityBattlerTag}s
 *
 * @remarks
 * ⚠️ {@linkcode AbilityId.FLASH_FIRE | Flash Fire}'s {@linkcode BattlerTagType.FIRE_BOOST} is not included as it
 * subclasses {@linkcode TypeBoostTag} and not `AbilityBattlerTag`.
 */
export type AbilityBattlerTagType =
  | BattlerTagType.PROTOSYNTHESIS
  | BattlerTagType.QUARK_DRIVE
  | BattlerTagType.UNBURDEN
  | BattlerTagType.SLOW_START
  | BattlerTagType.TRUANT;

/**
 * Subset of {@linkcode BattlerTagType}s related to abilities that boost the highest stat.
 */
export type HighestStatBoostTagType =
  | BattlerTagType.QUARK_DRIVE // formatting
  | BattlerTagType.PROTOSYNTHESIS;
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
