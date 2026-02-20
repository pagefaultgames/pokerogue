// TODO: T defaulting to `any` is type unsafe; this should realistically default to `never`
export type ConditionFn<T = any> = (args: T) => boolean;

export type { Constructor } from "type-fest";

// biome-ignore lint/style/useNamingConvention: this is a pseudo-primitive type
export type nil = null | undefined;
