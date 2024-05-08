import { GameModes } from "../game-mode";
import PersistentModifierData from "./modifier-data";
import PokemonData from "./pokemon-data";

export enum SessionHistoryResult {
  ACTIVE = 0,
  WIN = 1,
  LOSS = 2,
}

export interface SessionHistory {
  seed: string;
  playTime: integer;
  result: SessionHistoryResult;
  gameMode: GameModes;
  party: PokemonData[];
  modifiers: PersistentModifierData[];
  money: integer;
  waveIndex: integer;
  gameVersion: string;
  timestamp: integer;
}
