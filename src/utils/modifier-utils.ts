import { modifierTypes } from "#data/data-lists";
import { ModifierPoolType } from "#enums/modifier-pool-type";
import { modifierPool } from "#modifiers/modifier-pools";
import type { Reward } from "#modifiers/modifier-type";
import type { ModifierPool, RewardFunc } from "#types/modifier-types";

export function getModifierPoolForType(poolType: ModifierPoolType): ModifierPool {
  switch (poolType) {
    case ModifierPoolType.PLAYER:
      return modifierPool;
  }
}

// TODO: document this
export function getReward(modifierTypeFunc: RewardFunc): Reward {
  const modifierType = modifierTypeFunc();
  if (!modifierType.id) {
    modifierType.id = Object.keys(modifierTypes).find(k => modifierTypes[k] === modifierTypeFunc)!; // TODO: is this bang correct?
  }
  return modifierType;
}
