import { DelayedAttackTag, type PositionalTag, WishTag } from "#data/positional-tags/positional-tag";
import { PositionalTagType } from "#enums/positional-tag-type";
import type { Constructor } from "#types/common";
import type { ObjectValues } from "#types/type-helpers";
import type { Jsonify } from "type-fest";

/**
 * Load the attributes of a {@linkcode PositionalTag}.
 * @param tagType - The {@linkcode PositionalTagType} to create
 * @param args - The arguments needed to instantize the given tag
 * @returns The newly created tag.
 * @remarks
 * This function does not perform any checking if the added tag is valid.
 */
export function loadPositionalTag<T extends PositionalTagType>({
  tagType,
  ...args
}: ToSerializedPosTag<T>): PosTagInstanceMap[T];
/**
 * Load the attributes of a {@linkcode PositionalTag}.
 * @param tag - The {@linkcode SerializedPositionalTag} to instantiate
 * @returns The newly created tag.
 * @remarks
 * This function does not perform any checking if the added tag is valid.
 */
export function loadPositionalTag(tag: SerializedPositionalTag): PositionalTag;
export function loadPositionalTag<T extends PositionalTagType>({
  tagType,
  ...rest
}: ToSerializedPosTag<T>): PosTagInstanceMap[T] {
  // Note: We need 2 type assertions here; their rationales are explained below.
  // Upvote https://github.com/microsoft/TypeScript/issues/55257 for a proposal that would fix these issues.

  // 1. TypeScript has no way to know that the type of `tagClass` is linked to the choice of `T`,
  // thus converting it to an unresolvable intersection of all constructors (which is actively unusable).
  const tagClass = posTagConstructorMap[tagType] as unknown as Constructor<PosTagInstanceMap[T], [PosTagParamMap[T]]>;
  // 2. TS (in a similar light) cannot infer that the rest parameter's type is linked to `T`,
  // (from `Omit<serializedPosTagParamMap[T], "tagType"> into `posTagParamMap[T]`)
  return new tagClass(rest as unknown as PosTagParamMap[T]);
}

/** Const object mapping tag types to their constructors. */
const posTagConstructorMap = Object.freeze({
  [PositionalTagType.DELAYED_ATTACK]: DelayedAttackTag,
  [PositionalTagType.WISH]: WishTag,
}) satisfies {
  // NB: This `satisfies` block ensures that all tag types have corresponding entries in the map.
  [k in PositionalTagType]: Constructor<PositionalTag & { tagType: k }>;
};

/** Type mapping positional tag types to their constructors. */
type PosTagMap = typeof posTagConstructorMap;

/** Type mapping all positional tag types to their instances. */
type PosTagInstanceMap = {
  [k in PositionalTagType]: InstanceType<PosTagMap[k]>;
};

/** Type mapping all positional tag types to their constructors' parameters. */
type PosTagParamMap = {
  [k in PositionalTagType]: ConstructorParameters<PosTagMap[k]>[0];
};

/**
 * Generic type to convert a {@linkcode PositionalTagType} into the serialized representation of its corresponding class instance.
 *
 * Used in place of a mapped type to work around TypeScript deficiencies in function type signatures
 * (since an index signature would not be properly inferrable from `T`).
 */
export type ToSerializedPosTag<T extends PositionalTagType> = PosTagParamMap[T] & { readonly tagType: T };

/**
 * Type mapping all positional tag types to their constructors' parameters, alongside the `tagType` selector.
 * Equivalent to their serialized representations.
 */
type SerializedPosTagMap = {
  [k in PositionalTagType]: ToSerializedPosTag<k>;
};

/** Union type containing all serialized {@linkcode PositionalTag}s. */
export type SerializedPositionalTag = ObjectValues<SerializedPosTagMap>;

/**
 * Dummy, TypeScript-only constant to ensure that all positional tag types have their corresponding parameter types correctly mapped to their serialized forms.
 *
 * If a PositionalTag fails to meet this requirement, TypeScript will throw an error on this statement.
 *
 * ⚠️ Does not actually exist at runtime, so it must not be used!
 * @internal
 */
declare const EnsureAllPositionalTagsTurnIntoTheirArgumentsWhenSerialized: {
  [k in PositionalTagType as Jsonify<PosTagInstanceMap[k]> extends Omit<SerializedPosTagMap[k], "tagType">
    ? k
    : never]: never;
}[PositionalTagType];
