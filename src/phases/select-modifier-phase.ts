import BattleScene from "#app/battle-scene.js";
import { ModifierTier } from "#app/modifier/modifier-tier.js";
import { regenerateModifierPoolThresholds, ModifierTypeOption, ModifierType, getPlayerShopModifierTypeOptionsForWave, PokemonModifierType, FusePokemonModifierType, PokemonMoveModifierType, TmModifierType, RememberMoveModifierType, PokemonPpRestoreModifierType, PokemonPpUpModifierType, ModifierPoolType, getPlayerModifierTypeOptions } from "#app/modifier/modifier-type.js";
import { ExtraModifierModifier, Modifier, PokemonHeldItemModifier } from "#app/modifier/modifier.js";
import ModifierSelectUiHandler, { SHOP_OPTIONS_ROW_LIMIT } from "#app/ui/modifier-select-ui-handler.js";
import PartyUiHandler, { PartyUiMode, PartyOption } from "#app/ui/party-ui-handler.js";
import { Mode } from "#app/ui/ui.js";
import i18next from "i18next";
import * as Utils from "#app/utils.js";
import { BattlePhase } from "./battle-phase";
import Overrides from "#app/overrides";

export class SelectModifierPhase extends BattlePhase {
  private rerollCount: integer;
  private modifierTiers: ModifierTier[];

  constructor(scene: BattleScene, rerollCount: integer = 0, modifierTiers?: ModifierTier[]) {
    super(scene);

    this.rerollCount = rerollCount;
    this.modifierTiers = modifierTiers!; // TODO: is this bang correct?
  }

  start() {
    super.start();

    if (!this.rerollCount) {
      this.updateSeed();
    } else {
      this.scene.reroll = false;
    }

    const party = this.scene.getParty();
    regenerateModifierPoolThresholds(party, this.getPoolType(), this.rerollCount);
    const modifierCount = new Utils.IntegerHolder(3);
    if (this.isPlayer()) {
      this.scene.applyModifiers(ExtraModifierModifier, true, modifierCount);
    }
    const typeOptions: ModifierTypeOption[] = this.getModifierTypeOptions(modifierCount.value);

    const modifierSelectCallback = (rowCursor: integer, cursor: integer) => {
      if (rowCursor < 0 || cursor < 0) {
        this.scene.ui.showText(i18next.t("battle:skipItemQuestion"), null, () => {
          this.scene.ui.setOverlayMode(Mode.CONFIRM, () => {
            this.scene.ui.revertMode();
            this.scene.ui.setMode(Mode.MESSAGE);
            super.end();
          }, () => this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers)));
        });
        return false;
      }
      let modifierType: ModifierType;
      let cost: integer;
      switch (rowCursor) {
      case 0:
        switch (cursor) {
        case 0:
          const rerollCost = this.getRerollCost(typeOptions, this.scene.lockModifierTiers);
          if (this.scene.money < rerollCost) {
            this.scene.ui.playError();
            return false;
          } else {
            this.scene.reroll = true;
            this.scene.unshiftPhase(new SelectModifierPhase(this.scene, this.rerollCount + 1, typeOptions.map(o => o.type?.tier).filter(t => t !== undefined) as ModifierTier[]));
            this.scene.ui.clearText();
            this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
            if (!Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
              this.scene.money -= rerollCost;
              this.scene.updateMoneyText();
              this.scene.animateMoneyChanged(false);
            }
            this.scene.playSound("se/buy");
          }
          break;
        case 1:
          this.scene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.MODIFIER_TRANSFER, -1, (fromSlotIndex: integer, itemIndex: integer, itemQuantity: integer, toSlotIndex: integer) => {
            if (toSlotIndex !== undefined && fromSlotIndex < 6 && toSlotIndex < 6 && fromSlotIndex !== toSlotIndex && itemIndex > -1) {
              const itemModifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
                      && m.isTransferrable && m.pokemonId === party[fromSlotIndex].id) as PokemonHeldItemModifier[];
              const itemModifier = itemModifiers[itemIndex];
              this.scene.tryTransferHeldItemModifier(itemModifier, party[toSlotIndex], true, itemQuantity);
            } else {
              this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
            }
          }, PartyUiHandler.FilterItemMaxStacks);
          break;
        case 2:
          this.scene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.CHECK, -1, () => {
            this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
          });
          break;
        case 3:
          this.scene.lockModifierTiers = !this.scene.lockModifierTiers;
          const uiHandler = this.scene.ui.getHandler() as ModifierSelectUiHandler;
          uiHandler.setRerollCost(this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
          uiHandler.updateLockRaritiesText();
          uiHandler.updateRerollCostText();
          return false;
        }
        return true;
      case 1:
        if (typeOptions[cursor].type) {
          modifierType = typeOptions[cursor].type;
        }
        break;
      default:
        const shopOptions = getPlayerShopModifierTypeOptionsForWave(this.scene.currentBattle.waveIndex, this.scene.getWaveMoneyAmount(1));
        const shopOption = shopOptions[rowCursor > 2 || shopOptions.length <= SHOP_OPTIONS_ROW_LIMIT ? cursor : cursor + SHOP_OPTIONS_ROW_LIMIT];
        if (shopOption.type) {
          modifierType = shopOption.type;
        }
        cost = shopOption.cost;
        break;
      }

      if (cost! && (this.scene.money < cost) && !Overrides.WAIVE_ROLL_FEE_OVERRIDE) { // TODO: is the bang on cost correct?
        this.scene.ui.playError();
        return false;
      }

      const applyModifier = (modifier: Modifier, playSound: boolean = false) => {
        const result = this.scene.addModifier(modifier, false, playSound);
        if (cost) {
          result.then(success => {
            if (success) {
              if (!Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
                this.scene.money -= cost;
                this.scene.updateMoneyText();
                this.scene.animateMoneyChanged(false);
              }
              this.scene.playSound("se/buy");
              (this.scene.ui.getHandler() as ModifierSelectUiHandler).updateCostText();
            } else {
              this.scene.ui.playError();
            }
          });
        } else {
          const doEnd = () => {
            this.scene.ui.clearText();
            this.scene.ui.setMode(Mode.MESSAGE);
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
          this.scene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.SPLICE, -1, (fromSlotIndex: integer, spliceSlotIndex: integer) => {
            if (spliceSlotIndex !== undefined && fromSlotIndex < 6 && spliceSlotIndex < 6 && fromSlotIndex !== spliceSlotIndex) {
              this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer()).then(() => {
                const modifier = modifierType.newModifier(party[fromSlotIndex], party[spliceSlotIndex])!; //TODO: is the bang correct?
                applyModifier(modifier, true);
              });
            } else {
              this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
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
          this.scene.ui.setModeWithoutClear(Mode.PARTY, partyUiMode, -1, (slotIndex: integer, option: PartyOption) => {
            if (slotIndex < 6) {
              this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer()).then(() => {
                const modifier = !isMoveModifier
                  ? !isRememberMoveModifier
                    ? modifierType.newModifier(party[slotIndex])
                    : modifierType.newModifier(party[slotIndex], option as integer)
                  : modifierType.newModifier(party[slotIndex], option - PartyOption.MOVE_1);
                applyModifier(modifier!, true); // TODO: is the bang correct?
              });
            } else {
              this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
            }
          }, pokemonModifierType.selectFilter, modifierType instanceof PokemonMoveModifierType ? (modifierType as PokemonMoveModifierType).moveSelectFilter : undefined, tmMoveId, isPpRestoreModifier);
        }
      } else {
        applyModifier(modifierType!.newModifier()!); // TODO: is the bang correct?
      }

      return !cost!;// TODO: is the bang correct?
    };
    this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
  }

  updateSeed(): void {
    this.scene.resetSeed();
  }

  isPlayer(): boolean {
    return true;
  }

  getRerollCost(typeOptions: ModifierTypeOption[], lockRarities: boolean): number {
    let baseValue = 0;
    if (Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
      return baseValue;
    } else if (lockRarities) {
      const tierValues = [50, 125, 300, 750, 2000];
      for (const opt of typeOptions) {
        baseValue += tierValues[opt.type.tier ?? 0];
      }
    } else {
      baseValue = 250;
    }
    return Math.min(Math.ceil(this.scene.currentBattle.waveIndex / 10) * baseValue * Math.pow(2, this.rerollCount), Number.MAX_SAFE_INTEGER);
  }

  getPoolType(): ModifierPoolType {
    return ModifierPoolType.PLAYER;
  }

  getModifierTypeOptions(modifierCount: integer): ModifierTypeOption[] {
    return getPlayerModifierTypeOptions(modifierCount, this.scene.getParty(), this.scene.lockModifierTiers ? this.modifierTiers : undefined);
  }

  addModifier(modifier: Modifier): Promise<boolean> {
    return this.scene.addModifier(modifier, false, true);
  }
}
