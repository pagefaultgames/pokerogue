import { DelayedAttackTag, type PositionalTag, WishTag } from "#data/positional-tags/positional-tag";
import { PositionalTagType } from "#enums/positional-tag-type";
import type { EnumValues } from "#types/enum-types";
import type { Constructor } from "#utils/common";

/**
 * Add a new {@linkcode PositionalTag} to the arena.
 * @param tagType - The {@linkcode PositionalTagType} to create
 * @param args - The arguments needed to instantize the given tag
 * @remarks
 * This function does not perform any checking if the added tag is valid.
 */
export function loadPositionalTag<T extends PositionalTagType>({
  tagType,
  ...args
}: serializedPosTagParamMap[T]): posTagInstanceMap[T];
/**
 * Add a new {@linkcode PositionalTag} to the arena.
 * @param tag - The {@linkcode SerializedPositionalTag} to instantiate
 * @remarks
 * This function does not perform any checking if the added tag is valid.
 */
export function loadPositionalTag(tag: SerializedPositionalTag): PositionalTag;
export function loadPositionalTag<T extends PositionalTagType>({
  tagType,
  ...rest
}: serializedPosTagParamMap[T]): posTagInstanceMap[T] {
  // Note: We need 2 type assertions here:
  // 1 because TS doesn't narrow the type of TagClass correctly based on `T`.
  // It converts it into `new (DelayedAttackTag | WishTag) => DelayedAttackTag & WishTag`
  const tagClass = posTagConstructorMap[tagType] as new (args: posTagParamMap[T]) => posTagInstanceMap[T];
  // 2 because TS doesn't narrow `Omit<{tagType: T} & posTagParamMap[T], "tagType"> into `posTagParamMap[T]`
  return new tagClass(rest as unknown as posTagParamMap[T]);
}

/** Const object mapping tag types to their constructors. */
const posTagConstructorMap = Object.freeze({
  [PositionalTagType.DELAYED_ATTACK]: DelayedAttackTag,
  [PositionalTagType.WISH]: WishTag,
}) satisfies {
  [k in PositionalTagType]: Constructor<PositionalTag & { tagType: k }>;
};

/** Type mapping tag types to their constructors. */
type posTagMap = typeof posTagConstructorMap;

/** Type mapping all positional tag types to their instances. */
type posTagInstanceMap = {
  [k in PositionalTagType]: InstanceType<posTagMap[k]>;
};

/** Type mapping all positional tag types to their constructors' parameters. */
type posTagParamMap = {
  [k in PositionalTagType]: ConstructorParameters<posTagMap[k]>[0];
};

/** Type mapping all positional tag types to their constructors' parameters, alongside the `tagType` selector. */
type serializedPosTagParamMap = {
  [k in PositionalTagType]: posTagParamMap[k] & { tagType: k };
};

/** Union type containing all serialized {@linkcode PositionalTag}s. */
export type SerializedPositionalTag = EnumValues<serializedPosTagParamMap>;
