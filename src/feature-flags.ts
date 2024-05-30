export enum FeatureFlag {
  PRESTIGE_MODE
}

export const FEATURE_FLAGS: Record<FeatureFlag, boolean> = {
  [FeatureFlag.PRESTIGE_MODE]: true
};
