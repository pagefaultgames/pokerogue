export const VolumeSetting = Object.freeze({
  MAIN: 0,
  BGM: 1,
  FIELD: 2,
  SE: 3,
  UI: 4,
});

export type VolumeSetting = (typeof VolumeSetting)[keyof typeof VolumeSetting];
