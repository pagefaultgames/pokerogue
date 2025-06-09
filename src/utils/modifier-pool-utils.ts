import { ModifierPoolType } from "#enums/modifier-pool-type";
import {
  dailyStarterModifierPool,
  enemyBuffModifierPool,
  modifierPool,
  trainerModifierPool,
  wildModifierPool,
} from "#app/modifier/modifier-pools";
import type { ModifierPool } from "#app/@types/modifier-types";

export function getModifierPoolForType(poolType: ModifierPoolType): ModifierPool {
  switch (poolType) {
    case ModifierPoolType.PLAYER:
      return modifierPool;
    case ModifierPoolType.WILD:
      return wildModifierPool;
    case ModifierPoolType.TRAINER:
      return trainerModifierPool;
    case ModifierPoolType.ENEMY_BUFF:
      return enemyBuffModifierPool;
    case ModifierPoolType.DAILY_STARTER:
      return dailyStarterModifierPool;
  }
}
