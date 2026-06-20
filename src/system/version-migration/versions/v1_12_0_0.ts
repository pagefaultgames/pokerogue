import type { SessionSaveData } from "#types/save-data";
import type { SessionSaveMigrator } from "#types/save-migrators";

const migrateRageFistHitCount: SessionSaveMigrator = {
  version: "1.12.0.0",
  migrate: (data: SessionSaveData): void => {
    for (const p of data.party.concat(data.enemyParty)) {
      p.summonData.hitCount = p.battleData.hitCount;
    }
  },
};

export const sessionMigrators: readonly SessionSaveMigrator[] = [migrateRageFistHitCount] as const;
