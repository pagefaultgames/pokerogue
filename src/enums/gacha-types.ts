export const GachaType = {
    MOVE: 0,
    LEGENDARY: 1,
    SHINY: 2
} as const;
Object.freeze(GachaType);

export type GachaType = typeof GachaType[keyof typeof GachaType];
