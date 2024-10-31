import { gScene } from "#app/battle-scene";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { regenerateModifierPoolThresholds, ModifierTypeOption, ModifierType, getPlayerShopModifierTypeOptionsForWave, PokemonModifierType, FusePokemonModifierType, PokemonMoveModifierType, TmModifierType, RememberMoveModifierType, PokemonPpRestoreModifierType, PokemonPpUpModifierType, ModifierPoolType, getPlayerModifierTypeOptions } from "#app/modifier/modifier-type";
import { ExtraModifierModifier, HealShopCostModifier, Modifier, PokemonHeldItemModifier, TempExtraModifierModifier } from "#app/modifier/modifier";
import ModifierSelectUiHandler, { SHOP_OPTIONS_ROW_LIMIT } from "#app/ui/modifier-select-ui-handler";
import PartyUiHandler, { PartyUiMode, PartyOption } from "#app/ui/party-ui-handler";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import * as Utils from "#app/utils";
import { BattlePhase } from "./battle-phase";
import Overrides from "#app/overrides";
import { CustomModifierSettings } from "#app/modifier/modifier-type";
import { isNullOrUndefined, NumberHolder } from "#app/utils";

export class SelectModifierPhase extends BattlePhase {
  private rerollCount: integer;
  private modifierTiers?: ModifierTier[];
  private customModifierSettings?: CustomModifierSettings;
  private isCopy: boolean;

  private typeOptions: ModifierTypeOption[];

  constructor(rerollCount: integer = 0, modifierTiers?: ModifierTier[], customModifierSettings?: CustomModifierSettings, isCopy: boolean = false) {
    super();

    this.rerollCount = rerollCount;
    this.modifierTiers = modifierTiers;
    this.customModifierSettings = customModifierSettings;
    this.isCopy = isCopy;
  }

  start() {
    super.start();

    if (!this.rerollCount && !this.isCopy) {
      this.updateSeed();
    } else if (this.rerollCount) {
      gScene.reroll = false;
    }

    const party = gScene.getParty();
    if (!this.isCopy) {
      regenerateModifierPoolThresholds(party, this.getPoolType(), this.rerollCount);
    }
    const modifierCount = new Utils.IntegerHolder(3);
    if (this.isPlayer()) {
      gScene.applyModifiers(ExtraModifierModifier, true, modifierCount);
      gScene.applyModifiers(TempExtraModifierModifier, true, modifierCount);
    }

    // If custom modifiers are specified, overrides default item count
    if (!!this.customModifierSettings) {
      const newItemCount = (this.customModifierSettings.guaranteedModifierTiers?.length || 0) +
        (this.customModifierSettings.guaranteedModifierTypeOptions?.length || 0) +
        (this.customModifierSettings.guaranteedModifierTypeFuncs?.length || 0);
      if (this.customModifierSettings.fillRemaining) {
        const originalCount = modifierCount.value;
        modifierCount.value = originalCount > newItemCount ? originalCount : newItemCount;
      } else {
        modifierCount.value = newItemCount;
      }
    }

    this.typeOptions = this.getModifierTypeOptions(modifierCount.value);

    const modifierSelectCallback = (rowCursor: integer, cursor: integer) => {
      if (rowCursor < 0 || cursor < 0) {
        gScene.ui.showText(i18next.t("battle:skipItemQuestion"), null, () => {
          gScene.ui.setOverlayMode(Mode.CONFIRM, () => {
            gScene.ui.revertMode();
            gScene.ui.setMode(Mode.MESSAGE);
            super.end();
          }, () => gScene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), this.typeOptions, modifierSelectCallback, this.getRerollCost(gScene.lockModifierTiers)));
        });
        return false;
      }
      let modifierType: ModifierType;
      let cost: integer;
      const rerollCost = this.getRerollCost(gScene.lockModifierTiers);
      switch (rowCursor) {
        case 0:
          switch (cursor) {
            case 0:
              if (rerollCost < 0 || gScene.money < rerollCost) {
                gScene.ui.playError();
                return false;
              } else {
                gScene.reroll = true;
                gScene.unshiftPhase(new SelectModifierPhase(this.rerollCount + 1, this.typeOptions.map(o => o.type?.tier).filter(t => t !== undefined) as ModifierTier[]));
                gScene.ui.clearText();
                gScene.ui.setMode(Mode.MESSAGE).then(() => super.end());
                if (!Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
                  gScene.money -= rerollCost;
                  gScene.updateMoneyText();
                  gScene.animateMoneyChanged(false);
                }
                gScene.playSound("se/buy");
              }
              break;
            case 1:
              gScene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.MODIFIER_TRANSFER, -1, (fromSlotIndex: integer, itemIndex: integer, itemQuantity: integer, toSlotIndex: integer) => {
                if (toSlotIndex !== undefined && fromSlotIndex < 6 && toSlotIndex < 6 && fromSlotIndex !== toSlotIndex && itemIndex > -1) {
                  const itemModifiers = gScene.findModifiers(m => m instanceof PokemonHeldItemModifier
                      && m.isTransferable && m.pokemonId === party[fromSlotIndex].id) as PokemonHeldItemModifier[];
                  const itemModifier = itemModifiers[itemIndex];
                  gScene.tryTransferHeldItemModifier(itemModifier, party[toSlotIndex], true, itemQuantity);
                } else {
                  gScene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), this.typeOptions, modifierSelectCallback, this.getRerollCost(gScene.lockModifierTiers));
                }
              }, PartyUiHandler.FilterItemMaxStacks);
              break;
            case 2:
              gScene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.CHECK, -1, () => {
                gScene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), this.typeOptions, modifierSelectCallback, this.getRerollCost(gScene.lockModifierTiers));
              });
              break;
            case 3:
              if (rerollCost < 0) {
                // Reroll lock button is also disabled when reroll is disabled
                gScene.ui.playError();
                return false;
              }
              gScene.lockModifierTiers = !gScene.lockModifierTiers;
              const uiHandler = gScene.ui.getHandler() as ModifierSelectUiHandler;
              uiHandler.setRerollCost(this.getRerollCost(gScene.lockModifierTiers));
              uiHandler.updateLockRaritiesText();
              uiHandler.updateRerollCostText();
              return false;
          }
          return true;
        case 1:
          if (this.typeOptions.length === 0) {
            gScene.ui.clearText();
            gScene.ui.setMode(Mode.MESSAGE);
            super.end();
            return true;
          }
          if (this.typeOptions[cursor].type) {
            modifierType = this.typeOptions[cursor].type;
          }
          break;
        default:
          const shopOptions = getPlayerShopModifierTypeOptionsForWave(gScene.currentBattle.waveIndex, gScene.getWaveMoneyAmount(1));
          const shopOption = shopOptions[rowCursor > 2 || shopOptions.length <= SHOP_OPTIONS_ROW_LIMIT ? cursor : cursor + SHOP_OPTIONS_ROW_LIMIT];
          if (shopOption.type) {
            modifierType = shopOption.type;
          }
          // Apply Black Sludge to healing item cost
          const healingItemCost = new NumberHolder(shopOption.cost);
          gScene.applyModifier(HealShopCostModifier, true, healingItemCost);
          cost = healingItemCost.value;
          break;
      }

      if (cost! && (gScene.money < cost) && !Overrides.WAIVE_ROLL_FEE_OVERRIDE) { // TODO: is the bang on cost correct?
        gScene.ui.playError();
        return false;
      }

      const applyModifier = (modifier: Modifier, playSound: boolean = false) => {
        const result = gScene.addModifier(modifier, false, playSound, undefined, undefined, cost);
        // Queue a copy of this phase when applying a TM or Memory Mushroom.
        // If the player selects either of these, then escapes out of consuming them,
        // they are returned to a shop in the same state.
        if (modifier.type instanceof RememberMoveModifierType ||
            modifier.type instanceof TmModifierType) {
          gScene.unshiftPhase(this.copy());
        }

        if (cost && !(modifier.type instanceof RememberMoveModifierType)) {
          result.then(success => {
            if (success) {
              if (!Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
                gScene.money -= cost;
                gScene.updateMoneyText();
                gScene.animateMoneyChanged(false);
              }
              gScene.playSound("se/buy");
              (gScene.ui.getHandler() as ModifierSelectUiHandler).updateCostText();
            } else {
              gScene.ui.playError();
            }
          });
        } else {
          const doEnd = () => {
            gScene.ui.clearText();
            gScene.ui.setMode(Mode.MESSAGE);
            super.end();
          };
          if (result instanceof Promise) {
            result.then(() => doEnd());
          } else {
            doEnd();
          }
        }
      };

      if (modifierType! instanceof PokemonModifierType) { //TODO: is the bang correct?
        if (modifierType instanceof FusePokemonModifierType) {
          gScene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.SPLICE, -1, (fromSlotIndex: integer, spliceSlotIndex: integer) => {
            if (spliceSlotIndex !== undefined && fromSlotIndex < 6 && spliceSlotIndex < 6 && fromSlotIndex !== spliceSlotIndex) {
              gScene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer()).then(() => {
                const modifier = modifierType.newModifier(party[fromSlotIndex], party[spliceSlotIndex])!; //TODO: is the bang correct?
                applyModifier(modifier, true);
              });
            } else {
              gScene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), this.typeOptions, modifierSelectCallback, this.getRerollCost(gScene.lockModifierTiers));
            }
          }, modifierType.selectFilter);
        } else {
          const pokemonModifierType = modifierType as PokemonModifierType;
          const isMoveModifier = modifierType instanceof PokemonMoveModifierType;
          const isTmModifier = modifierType instanceof TmModifierType;
          const isRememberMoveModifier = modifierType instanceof RememberMoveModifierType;
          const isPpRestoreModifier = (modifierType instanceof PokemonPpRestoreModifierType || modifierType instanceof PokemonPpUpModifierType);
          const partyUiMode = isMoveModifier ? PartyUiMode.MOVE_MODIFIER
            : isTmModifier ? PartyUiMode.TM_MODIFIER
              : isRememberMoveModifier ? PartyUiMode.REMEMBER_MOVE_MODIFIER
                : PartyUiMode.MODIFIER;
          const tmMoveId = isTmModifier
            ? (modifierType as TmModifierType).moveId
            : undefined;
          gScene.ui.setModeWithoutClear(Mode.PARTY, partyUiMode, -1, (slotIndex: integer, option: PartyOption) => {
            if (slotIndex < 6) {
              gScene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer()).then(() => {
                const modifier = !isMoveModifier
                  ? !isRememberMoveModifier
                    ? modifierType.newModifier(party[slotIndex])
                    : modifierType.newModifier(party[slotIndex], option as integer)
                  : modifierType.newModifier(party[slotIndex], option - PartyOption.MOVE_1);
                applyModifier(modifier!, true); // TODO: is the bang correct?
              });
            } else {
              gScene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), this.typeOptions, modifierSelectCallback, this.getRerollCost(gScene.lockModifierTiers));
            }
          }, pokemonModifierType.selectFilter, modifierType instanceof PokemonMoveModifierType ? (modifierType as PokemonMoveModifierType).moveSelectFilter : undefined, tmMoveId, isPpRestoreModifier);
        }
      } else {
        applyModifier(modifierType!.newModifier()!); // TODO: is the bang correct?
      }

      return !cost!;// TODO: is the bang correct?
    };
    gScene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), this.typeOptions, modifierSelectCallback, this.getRerollCost(gScene.lockModifierTiers));
  }

  updateSeed(): void {
    gScene.resetSeed();
  }

  isPlayer(): boolean {
    return true;
  }

  getRerollCost(lockRarities: boolean): number {
    let baseValue = 0;
    if (Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
      return baseValue;
    } else if (lockRarities) {
      const tierValues = [ 50, 125, 300, 750, 2000 ];
      for (const opt of this.typeOptions) {
        baseValue += tierValues[opt.type.tier ?? 0];
      }
    } else {
      baseValue = 250;
    }

    let multiplier = 1;
    if (!isNullOrUndefined(this.customModifierSettings?.rerollMultiplier)) {
      if (this.customModifierSettings.rerollMultiplier < 0) {
        // Completely overrides reroll cost to -1 and early exits
        return -1;
      }

      // Otherwise, continue with custom multiplier
      multiplier = this.customModifierSettings.rerollMultiplier;
    }

    const baseMultiplier = Math.min(Math.ceil(gScene.currentBattle.waveIndex / 10) * baseValue * (2 ** this.rerollCount) * multiplier, Number.MAX_SAFE_INTEGER);

    // Apply Black Sludge to reroll cost
    const modifiedRerollCost = new NumberHolder(baseMultiplier);
    gScene.applyModifier(HealShopCostModifier, true, modifiedRerollCost);
    return modifiedRerollCost.value;
  }

  getPoolType(): ModifierPoolType {
    return ModifierPoolType.PLAYER;
  }

  getModifierTypeOptions(modifierCount: integer): ModifierTypeOption[] {
    return getPlayerModifierTypeOptions(modifierCount, gScene.getParty(), gScene.lockModifierTiers ? this.modifierTiers : undefined, this.customModifierSettings);
  }

  copy(): SelectModifierPhase {
    return new SelectModifierPhase(
      this.rerollCount,
      this.modifierTiers,
      { guaranteedModifierTypeOptions: this.typeOptions, rerollMultiplier: this.customModifierSettings?.rerollMultiplier, allowLuckUpgrades: false },
      true
    );
  }

  addModifier(modifier: Modifier): Promise<boolean> {
    return gScene.addModifier(modifier, false, true);
  }
}
