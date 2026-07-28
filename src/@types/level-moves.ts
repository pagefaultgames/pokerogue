import type { LearnableMoveSource } from "#enums/learnable-move-source";
import type { MoveId } from "#enums/move-id";

export type LevelMoves = [level: number, move: MoveId][];
export type LevelMovesWithSource = [level: number, move: MoveId, source: LearnableMoveSource][];
