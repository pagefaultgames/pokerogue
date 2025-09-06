import type { Ability } from "#abilities/ability";
import type { PokemonSpecies } from "#data/pokemon-species";
import type { HeldItemId } from "#enums/held-item-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { HeldItemBase } from "#items/held-item";
import type { TrainerItem } from "#items/trainer-item";
import type { Move } from "#moves/move";

export const allAbilities: Ability[] = [];
export const allMoves: Move[] = [];
export const allSpecies: PokemonSpecies[] = [];

//@ts-expect-error
export const allHeldItems: Record<HeldItemId, HeldItemBase> = {};
//@ts-expect-error
export const allTrainerItems: Record<TrainerItemId, TrainerItem> = {};
