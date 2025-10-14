import { DelayedAttackTag, type PositionalTag, WishTag } from "#data/positional-tags/positional-tag";
import { PositionalTagType } from "#enums/positional-tag-type";
import type { Constructor } from "#types/common";
import type { ObjectValues } from "#types/type-helpers";

/**
 * Load the attributes of a {@linkcode PositionalTag}.
 * @param data - An object containing the {@linkcode PositionalTagType} to create,
 * as well as the arguments needed to instantize the given tag
 * @returns The newly created tag.
 * @remarks
 * This function does not perform any checking if the added tag is valid.
 */
export function loadPositionalTag<T extends PositionalTagType>(data: serializedPosTagMap[T]): posTagInstanceMap[T];
/**
 * Load the attributes of a {@linkcode PositionalTag}.
 * @param tag - The {@linkcode SerializedPositionalTag} to instantiate
 * @returns The newly created tag.
 * @remarks
 * This function does not perform any checking if the added tag is valid.
 */
export function loadPositionalTag(tag: SerializedPositionalTag): PositionalTag;
export function loadPositionalTag({ tagType, ...rest }: SerializedPositionalTag): PositionalTag {
  const tagClass = posTagConstructorMap[tagType];
  // @ts-expect-error - tagType always corresponds to the proper constructor for `rest`
  return new tagClass(rest);
}

/** Const object mapping tag types to their constructors. */
const posTagConstructorMap = Object.freeze({
  [PositionalTagType.DELAYED_ATTACK]: DelayedAttackTag,
  [PositionalTagType.WISH]: WishTag,
}) satisfies {
  // NB: This `satisfies` block ensures that all tag types have corresponding entries in the map.
  [k in PositionalTagType]: Constructor<PositionalTag & { readonly tagType: k }>;
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
 * Type mapping all positional tag types to their constructors' parameters, alongside the `tagType` selector. \
 * Equivalent to their serialized representations.
 * @interface
 */
export type serializedPosTagMap = {
  [k in PositionalTagType]: posTagParamMap[k] & Pick<posTagInstanceMap[k], "tagType">;
};

/** Union type containing all serialized {@linkcode PositionalTag}s. */
export type SerializedPositionalTag = ObjectValues<serializedPosTagMap>;
