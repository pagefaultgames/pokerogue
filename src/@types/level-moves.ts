import type { PokemonSpeciesForm } from "#data/pokemon-species";
import type { LearnableMoveSource } from "#enums/learnable-move-source";
import type { MoveId } from "#enums/move-id";

export type LevelMoves = [level: number, move: MoveId][];
export type LevelMovesWithSource = [level: number, move: MoveId, source: LearnableMoveSource][];

export interface LevelMoveContext {
  level: number;
  startingLevel: number;
  pokemonSpeciesForm: PokemonSpeciesForm;
  pokemonFormIndex: number;
  fusionSpeciesForm?: PokemonSpeciesForm | undefined;
  fusionFormIndex?: number | undefined;
}
