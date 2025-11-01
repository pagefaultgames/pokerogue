import { DelayedAttackTag, type PositionalTag, WishTag } from "#data/positional-tags/positional-tag";
import { PositionalTagType } from "#enums/positional-tag-type";
import type { Constructor } from "#types/common";
import type { ObjectValues } from "#types/type-helpers";

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
}: toSerializedPosTag<T>): posTagInstanceMap[T];
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
}: toSerializedPosTag<T>): posTagInstanceMap[T] {
  // Note: We need 2 type assertions here:
  // 1 because TS doesn't narrow the type of TagClass correctly based on `T`.
  // It converts it into `new (DelayedAttackTag | WishTag) => DelayedAttackTag & WishTag`
  const tagClass = posTagConstructorMap[tagType] as new (args: posTagParamMap[T]) => posTagInstanceMap[T];
  // 2 because TS doesn't narrow the type of `rest` correctly
  // (from `Omit<serializedPosTagParamMap[T], "tagType"> into `posTagParamMap[T]`)
  return new tagClass(rest as unknown as posTagParamMap[T]);
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
type posTagMap = typeof posTagConstructorMap;

/** Type mapping all positional tag types to their instances. */
type posTagInstanceMap = {
  [k in PositionalTagType]: InstanceType<posTagMap[k]>;
};

/** Type mapping all positional tag types to their constructors' parameters. */
type posTagParamMap = {
  [k in PositionalTagType]: ConstructorParameters<posTagMap[k]>[0];
};

/**
 * Generic type to convert a {@linkcode PositionalTagType} into the serialized representation of its corresponding class instance.
 *
 * Used in place of a mapped type to work around Typescript deficiencies in function type signatures.
 */
export type toSerializedPosTag<T extends PositionalTagType> = posTagParamMap[T] & { readonly tagType: T };

/**
 * Type mapping all positional tag types to their constructors' parameters, alongside the `tagType` selector.
 * Equivalent to their serialized representations.
 */
type serializedPosTagMap = {
  [k in PositionalTagType]: toSerializedPosTag<k>;
};

/** Union type containing all serialized {@linkcode PositionalTag}s. */
export type SerializedPositionalTag = ObjectValues<serializedPosTagMap>;
