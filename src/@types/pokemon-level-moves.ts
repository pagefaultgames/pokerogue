/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MoveId } from "#enums/move-id";

export type LevelMoves = [number, MoveId][];

export interface PokemonSpeciesLevelMoves {
  [key: number]: LevelMoves;
}
interface PokemonFormLevelMoves {
  [key: number]: LevelMoves;
}
export interface PokemonSpeciesFormLevelMoves {
  [key: number]: PokemonFormLevelMoves;
}
