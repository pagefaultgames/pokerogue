import { GameModes } from "../game-mode";
import PokemonData from "./pokemon-data";
import PersistentModifierData from "./modifier-data";

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
