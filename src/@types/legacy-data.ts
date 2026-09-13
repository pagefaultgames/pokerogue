import type { SessionSaveData } from "#types/save-data";

export interface LegacyModifierData {
  player: boolean;
  typeId: string;
  typePregenArgs: any[];
  args: any[];
  stackCount: number;
  className: string;
}

export type LegacySessionSaveData = SessionSaveData & {
  modifiers: LegacyModifierData[];
  enemyModifiers: LegacyModifierData[];
};
