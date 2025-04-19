import type { AbAttr } from "#app/data/abilities/ab-attrs/ab-attr";
import type Move from "#app/data/moves/move";
import type Pokemon from "#app/field/pokemon";
import type { BattleStat } from "#enums/stat";

export type AbAttrApplyFunc<TAttr extends AbAttr> = (attr: TAttr, passive: boolean) => void;
export type AbAttrSuccessFunc<TAttr extends AbAttr> = (attr: TAttr, passive: boolean) => boolean;
export type AbAttrCondition = (pokemon: Pokemon) => boolean;
export type PokemonAttackCondition = (user: Pokemon | null, target: Pokemon | null, move: Move) => boolean;
export type PokemonDefendCondition = (target: Pokemon, user: Pokemon, move: Move) => boolean;
export type PokemonStatStageChangeCondition = (target: Pokemon, statsChanged: BattleStat[], stages: number) => boolean;
