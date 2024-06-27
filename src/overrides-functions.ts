import * as Overrides from "./overrides";
import { Moves } from "./data/enums/moves";
import { ModifierTier } from "./modifier/modifier-tier";
import { ModifierType, ModifierTypeOption, TmModifierType, ModifierTypeGenerator, modifierTypes } from "./modifier/modifier-type";

/**
 * File containing the functions to apply the values from overrides.ts.
 */
/**
 * Applies the Reward override amount if it is set. Used when getting the number of rewards to get for the post battle item screen.
 * @param currentAmount The unoverridden reward amount.
 * @returns The overridden reward amount, or currentAmount if REWARD_AMOUNT_OVERRIDE is 0.
 */
export function tryOverridePostBattleRewardAmount(currentAmount:integer): integer {
    if (Overrides.REWARD_AMOUNT_OVERRIDE) {
      currentAmount = Overrides.REWARD_AMOUNT_OVERRIDE;
    }
  
    return currentAmount;
  }
  
  /**
     * Applies the reward options overrides to the selected rewards, if there have been any set.
     * @param options The current options list.
     * @returns The options list with any options that have been overridden.
     */
  export function tryOverridePostBattleRewardOptions(options: ModifierTypeOption[]): ModifierTypeOption[] {
    if (Overrides.REWARD_OVERRIDES) {
      for (let i = 0; i < Overrides.REWARD_OVERRIDES.length && i < options.length; i++) {
        const name = Overrides.REWARD_OVERRIDES[i].name;
        let overriddenModifier: ModifierType = null;
        // Special case for TMs since the other method will not work for TMs, particularly if we want it to have a specific move.
        if (name.startsWith("TM")) {
          if (Overrides.REWARD_OVERRIDES[i].type) {
            overriddenModifier = new TmModifierType(Overrides.REWARD_OVERRIDES[i].type as Moves);
          }
        } else {
          const modif: ModifierType = modifierTypes[name]();
          if (modif instanceof ModifierTypeGenerator) {
            overriddenModifier = modif.generateType(null, [Overrides.REWARD_OVERRIDES[i].type]).withIdFromFunc(modifierTypes[name]);
          } else {
            overriddenModifier = modif.withIdFromFunc(modifierTypes[name]);
          }
        }
  
        if (overriddenModifier) {
          // A tier must be specified otherwise the pokeball will just show an open great ball.
          // Since this is an override for testing purposes, just use common.
          overriddenModifier.setTier(ModifierTier.COMMON);
          options[i] = new ModifierTypeOption(overriddenModifier, 0);
        }
      }
    }
  
    return options;
  }