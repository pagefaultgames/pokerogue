export type * from "#app/data/abilities/ability";
import type { AbAttrMap } from "./ability-types";


export type AbAttrParamMap = {
    [K in keyof AbAttrMap]: Parameters<AbAttrMap[K]["apply"]>[0];
}