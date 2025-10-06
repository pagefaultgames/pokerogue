import { modifierTypes } from "#data/data-lists";
import { ModifierPoolType } from "#enums/modifier-pool-type";
import {
  dailyStarterModifierPool,
  enemyBuffModifierPool,
  modifierPool,
  trainerModifierPool,
  wildModifierPool,
} from "#modifiers/modifier-pools";
import type { ModifierType } from "#modifiers/modifier-type";
import type { ModifierPool, ModifierTypeFunc } from "#types/modifier-types";

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

// TODO: document this
export function getModifierType(modifierTypeFunc: ModifierTypeFunc): ModifierType {
  const modifierType = modifierTypeFunc();
  if (!modifierType.id) {
    modifierType.id = Object.keys(modifierTypes).find(k => modifierTypes[k] === modifierTypeFunc)!; // TODO: is this bang correct?
  }
  return modifierType;
}
