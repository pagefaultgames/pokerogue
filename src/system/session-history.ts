import type { GameModes } from "../game-mode";
import type PokemonData from "./pokemon-data";
import type PersistentModifierData from "./modifier-data";

export enum SessionHistoryResult {
  ACTIVE,
  WIN,
  LOSS,
}

export interface SessionHistory {
  seed: string;
  playTime: number;
  result: SessionHistoryResult;
  gameMode: GameModes;
  party: PokemonData[];
  modifiers: PersistentModifierData[];
  money: number;
  waveIndex: number;
  gameVersion: string;
  timestamp: number;
}
