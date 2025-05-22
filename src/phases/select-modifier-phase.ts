import { globalScene } from "#app/global-scene";
import type { ModifierTier } from "#app/modifier/modifier-tier";
import type { ModifierTypeOption, ModifierType } from "#app/modifier/modifier-type";
import {
  regenerateModifierPoolThresholds,
  getPlayerShopModifierTypeOptionsForWave,
  PokemonModifierType,
  FusePokemonModifierType,
  PokemonMoveModifierType,
  TmModifierType,
  RememberMoveModifierType,
  PokemonPpRestoreModifierType,
  PokemonPpUpModifierType,
  ModifierPoolType,
  getPlayerModifierTypeOptions,
} from "#app/modifier/modifier-type";
import type { Modifier } from "#app/modifier/modifier";
import {
  ExtraModifierModifier,
  HealShopCostModifier,
  PokemonHeldItemModifier,
  TempExtraModifierModifier,
} from "#app/modifier/modifier";
import type ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import { SHOP_OPTIONS_ROW_LIMIT } from "#app/ui/modifier-select-ui-handler";
import PartyUiHandler, { PartyUiMode, PartyOption } from "#app/ui/party-ui-handler";
import { UiMode } from "#enums/ui-mode";
import i18next from "i18next";
import { BattlePhase } from "./battle-phase";
import Overrides from "#app/overrides";
import type { CustomModifierSettings } from "#app/modifier/modifier-type";
import { isNullOrUndefined, NumberHolder } from "#app/utils/common";

export class SelectModifierPhase extends BattlePhase {
  private rerollCount: number;
  private modifierTiers?: ModifierTier[];
  private customModifierSettings?: CustomModifierSettings;
  private isCopy: boolean;

  private typeOptions: ModifierTypeOption[];

  constructor(
    rerollCount = 0,
    modifierTiers?: ModifierTier[],
    customModifierSettings?: CustomModifierSettings,
    isCopy = false,
  ) {
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
      globalScene.reroll = false;
    }

    const party = globalScene.getPlayerParty();
    if (!this.isCopy) {
      regenerateModifierPoolThresholds(party, this.getPoolType(), this.rerollCount);
    }
    const modifierCount = new NumberHolder(3);
    if (this.isPlayer()) {
      globalScene.applyModifiers(ExtraModifierModifier, true, modifierCount);
      globalScene.applyModifiers(TempExtraModifierModifier, true, modifierCount);
    }

    // If custom modifiers are specified, overrides default item count
    if (this.customModifierSettings) {
      const newItemCount =
        (this.customModifierSettings.guaranteedModifierTiers?.length || 0) +
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

    const modifierSelectCallback = (rowCursor: number, cursor: number) => {
      if (rowCursor < 0 || cursor < 0) {
        globalScene.ui.showText(i18next.t("battle:skipItemQuestion"), null, () => {
          globalScene.ui.setOverlayMode(
            UiMode.CONFIRM,
            () => {
              globalScene.ui.revertMode();
              globalScene.ui.setMode(UiMode.MESSAGE);
              super.end();
            },
            () =>
              globalScene.ui.setMode(
                UiMode.MODIFIER_SELECT,
                this.isPlayer(),
                this.typeOptions,
                modifierSelectCallback,
                this.getRerollCost(globalScene.lockModifierTiers),
              ),
          );
        });
        return false;
      }
      let modifierType: ModifierType;
      let cost: number;
      const rerollCost = this.getRerollCost(globalScene.lockModifierTiers);
      switch (rowCursor) {
        case 0:
          switch (cursor) {
            case 0:
              if (rerollCost < 0 || globalScene.money < rerollCost) {
                globalScene.ui.playError();
                return false;
              }
              globalScene.reroll = true;
              globalScene.unshiftPhase(
                new SelectModifierPhase(
                  this.rerollCount + 1,
                  this.typeOptions.map(o => o.type?.tier).filter(t => t !== undefined) as ModifierTier[],
                ),
              );
              globalScene.ui.clearText();
              globalScene.ui.setMode(UiMode.MESSAGE).then(() => super.end());
              if (!Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
                globalScene.money -= rerollCost;
                globalScene.updateMoneyText();
                globalScene.animateMoneyChanged(false);
              }
              globalScene.playSound("se/buy");
              break;
            case 1:
              globalScene.ui.setModeWithoutClear(
                UiMode.PARTY,
                PartyUiMode.MODIFIER_TRANSFER,
                -1,
                (fromSlotIndex: number, itemIndex: number, itemQuantity: number, toSlotIndex: number) => {
                  if (
                    toSlotIndex !== undefined &&
                    fromSlotIndex < 6 &&
                    toSlotIndex < 6 &&
                    fromSlotIndex !== toSlotIndex &&
                    itemIndex > -1
                  ) {
                    const itemModifiers = globalScene.findModifiers(
                      m =>
                        m instanceof PokemonHeldItemModifier &&
                        m.isTransferable &&
                        m.pokemonId === party[fromSlotIndex].id,
                    ) as PokemonHeldItemModifier[];
                    const itemModifier = itemModifiers[itemIndex];
                    globalScene.tryTransferHeldItemModifier(
                      itemModifier,
                      party[toSlotIndex],
                      true,
                      itemQuantity,
                      undefined,
                      undefined,
                      false,
                    );
                  } else {
                    globalScene.ui.setMode(
                      UiMode.MODIFIER_SELECT,
                      this.isPlayer(),
                      this.typeOptions,
                      modifierSelectCallback,
                      this.getRerollCost(globalScene.lockModifierTiers),
                    );
                  }
                },
                PartyUiHandler.FilterItemMaxStacks,
              );
              break;
            case 2:
              globalScene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.CHECK, -1, () => {
                globalScene.ui.setMode(
                  UiMode.MODIFIER_SELECT,
                  this.isPlayer(),
                  this.typeOptions,
                  modifierSelectCallback,
                  this.getRerollCost(globalScene.lockModifierTiers),
                );
              });
              break;
            case 3:
              if (rerollCost < 0) {
                // Reroll lock button is also disabled when reroll is disabled
                globalScene.ui.playError();
                return false;
              }
              globalScene.lockModifierTiers = !globalScene.lockModifierTiers;
              const uiHandler = globalScene.ui.getHandler() as ModifierSelectUiHandler;
              uiHandler.setRerollCost(this.getRerollCost(globalScene.lockModifierTiers));
              uiHandler.updateLockRaritiesText();
              uiHandler.updateRerollCostText();
              return false;
          }
          return true;
        case 1:
          if (this.typeOptions.length === 0) {
            globalScene.ui.clearText();
            globalScene.ui.setMode(UiMode.MESSAGE);
            super.end();
            return true;
          }
          if (this.typeOptions[cursor].type) {
            modifierType = this.typeOptions[cursor].type;
          }
          break;
        default:
          const shopOptions = getPlayerShopModifierTypeOptionsForWave(
            globalScene.currentBattle.waveIndex,
            globalScene.getWaveMoneyAmount(1),
          );
          const shopOption =
            shopOptions[
              rowCursor > 2 || shopOptions.length <= SHOP_OPTIONS_ROW_LIMIT ? cursor : cursor + SHOP_OPTIONS_ROW_LIMIT
            ];
          if (shopOption.type) {
            modifierType = shopOption.type;
          }
          // Apply Black Sludge to healing item cost
          const healingItemCost = new NumberHolder(shopOption.cost);
          globalScene.applyModifier(HealShopCostModifier, true, healingItemCost);
          cost = healingItemCost.value;
          break;
      }

      if (cost! && globalScene.money < cost && !Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
        // TODO: is the bang on cost correct?
        globalScene.ui.playError();
        return false;
      }

      const applyModifier = (modifier: Modifier, playSound = false) => {
        const result = globalScene.addModifier(modifier, false, playSound, undefined, undefined, cost);
        // Queue a copy of this phase when applying a TM or Memory Mushroom.
        // If the player selects either of these, then escapes out of consuming them,
        // they are returned to a shop in the same state.
        if (modifier.type instanceof RememberMoveModifierType || modifier.type instanceof TmModifierType) {
          globalScene.unshiftPhase(this.copy());
        }

        if (cost && !(modifier.type instanceof RememberMoveModifierType)) {
          if (result) {
            if (!Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
              globalScene.money -= cost;
              globalScene.updateMoneyText();
              globalScene.animateMoneyChanged(false);
            }
            globalScene.playSound("se/buy");
            (globalScene.ui.getHandler() as ModifierSelectUiHandler).updateCostText();
          } else {
            globalScene.ui.playError();
          }
        } else {
          globalScene.ui.clearText();
          globalScene.ui.setMode(UiMode.MESSAGE);
          super.end();
        }
      };

      if (modifierType! instanceof PokemonModifierType) {
        //TODO: is the bang correct?
        if (modifierType instanceof FusePokemonModifierType) {
          globalScene.ui.setModeWithoutClear(
            UiMode.PARTY,
            PartyUiMode.SPLICE,
            -1,
            (fromSlotIndex: number, spliceSlotIndex: number) => {
              if (
                spliceSlotIndex !== undefined &&
                fromSlotIndex < 6 &&
                spliceSlotIndex < 6 &&
                fromSlotIndex !== spliceSlotIndex
              ) {
                globalScene.ui.setMode(UiMode.MODIFIER_SELECT, this.isPlayer()).then(() => {
                  const modifier = modifierType.newModifier(party[fromSlotIndex], party[spliceSlotIndex])!; //TODO: is the bang correct?
                  applyModifier(modifier, true);
                });
              } else {
                globalScene.ui.setMode(
                  UiMode.MODIFIER_SELECT,
                  this.isPlayer(),
                  this.typeOptions,
                  modifierSelectCallback,
                  this.getRerollCost(globalScene.lockModifierTiers),
                );
              }
            },
            modifierType.selectFilter,
          );
        } else {
          const pokemonModifierType = modifierType as PokemonModifierType;
          const isMoveModifier = modifierType instanceof PokemonMoveModifierType;
          const isTmModifier = modifierType instanceof TmModifierType;
          const isRememberMoveModifier = modifierType instanceof RememberMoveModifierType;
          const isPpRestoreModifier =
            modifierType instanceof PokemonPpRestoreModifierType || modifierType instanceof PokemonPpUpModifierType;
          const partyUiMode = isMoveModifier
            ? PartyUiMode.MOVE_MODIFIER
            : isTmModifier
              ? PartyUiMode.TM_MODIFIER
              : isRememberMoveModifier
                ? PartyUiMode.REMEMBER_MOVE_MODIFIER
                : PartyUiMode.MODIFIER;
          const tmMoveId = isTmModifier ? (modifierType as TmModifierType).moveId : undefined;
          globalScene.ui.setModeWithoutClear(
            UiMode.PARTY,
            partyUiMode,
            -1,
            (slotIndex: number, option: PartyOption) => {
              if (slotIndex < 6) {
                globalScene.ui.setMode(UiMode.MODIFIER_SELECT, this.isPlayer()).then(() => {
                  const modifier = !isMoveModifier
                    ? !isRememberMoveModifier
                      ? modifierType.newModifier(party[slotIndex])
                      : modifierType.newModifier(party[slotIndex], option as number)
                    : modifierType.newModifier(party[slotIndex], option - PartyOption.MOVE_1);
                  applyModifier(modifier!, true); // TODO: is the bang correct?
                });
              } else {
                globalScene.ui.setMode(
                  UiMode.MODIFIER_SELECT,
                  this.isPlayer(),
                  this.typeOptions,
                  modifierSelectCallback,
                  this.getRerollCost(globalScene.lockModifierTiers),
                );
              }
            },
            pokemonModifierType.selectFilter,
            modifierType instanceof PokemonMoveModifierType
              ? (modifierType as PokemonMoveModifierType).moveSelectFilter
              : undefined,
            tmMoveId,
            isPpRestoreModifier,
          );
        }
      } else {
        applyModifier(modifierType!.newModifier()!); // TODO: is the bang correct?
      }

      return !cost!; // TODO: is the bang correct?
    };
    globalScene.ui.setMode(
      UiMode.MODIFIER_SELECT,
      this.isPlayer(),
      this.typeOptions,
      modifierSelectCallback,
      this.getRerollCost(globalScene.lockModifierTiers),
    );
  }

  updateSeed(): void {
    globalScene.resetSeed();
  }

  isPlayer(): boolean {
    return true;
  }

  getRerollCost(lockRarities: boolean): number {
    let baseValue = 0;
    if (Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
      return baseValue;
    }
    if (lockRarities) {
      const tierValues = [50, 125, 300, 750, 2000];
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

    const baseMultiplier = Math.min(
      Math.ceil(globalScene.currentBattle.waveIndex / 10) * baseValue * 2 ** this.rerollCount * multiplier,
      Number.MAX_SAFE_INTEGER,
    );

    // Apply Black Sludge to reroll cost
    const modifiedRerollCost = new NumberHolder(baseMultiplier);
    globalScene.applyModifier(HealShopCostModifier, true, modifiedRerollCost);
    return modifiedRerollCost.value;
  }

  getPoolType(): ModifierPoolType {
    return ModifierPoolType.PLAYER;
  }

  getModifierTypeOptions(modifierCount: number): ModifierTypeOption[] {
    return getPlayerModifierTypeOptions(
      modifierCount,
      globalScene.getPlayerParty(),
      globalScene.lockModifierTiers ? this.modifierTiers : undefined,
      this.customModifierSettings,
    );
  }

  copy(): SelectModifierPhase {
    return new SelectModifierPhase(
      this.rerollCount,
      this.modifierTiers,
      {
        guaranteedModifierTypeOptions: this.typeOptions,
        rerollMultiplier: this.customModifierSettings?.rerollMultiplier,
        allowLuckUpgrades: false,
      },
      true,
    );
  }

  addModifier(modifier: Modifier): boolean {
    return globalScene.addModifier(modifier, false, true);
  }
}
