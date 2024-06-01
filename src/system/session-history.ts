import { GameModes } from "../game-mode";
import PersistentModifierData from "./modifier-data";
import PokemonData from "./pokemon-data";

export enum SessionHistoryResult {
  ACTIVE,
  WIN,
  LOSS
}

export interface SessionHistory {
  seed: string;
  playTime: integer;
  result: SessionHistoryResult,
  gameMode: GameModes;
  party: PokemonData[];
  modifiers: PersistentModifierData[];
  money: integer;
  waveIndex: integer;
  gameVersion: string;
  timestamp: integer;
}
