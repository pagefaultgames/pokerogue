import BattleScene from "#app/battle-scene";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { regenerateModifierPoolThresholds, ModifierTypeOption, ModifierType, getPlayerShopModifierTypeOptionsForWave, PokemonModifierType, FusePokemonModifierType, PokemonMoveModifierType, TmModifierType, RememberMoveModifierType, PokemonPpRestoreModifierType, PokemonPpUpModifierType, ModifierPoolType, getPlayerModifierTypeOptions, getPartyLuckValue, getLuckString } from "#app/modifier/modifier-type";
import { ExtraModifierModifier, HealShopCostModifier, Modifier, PokemonHeldItemModifier } from "#app/modifier/modifier";
import ModifierSelectUiHandler, { SHOP_OPTIONS_ROW_LIMIT } from "#app/ui/modifier-select-ui-handler";
import PartyUiHandler, { PartyUiMode, PartyOption } from "#app/ui/party-ui-handler";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import * as Utils from "#app/utils";
import { BattlePhase } from "./battle-phase";
import Overrides from "#app/overrides";
import * as LoggerTools from "../logger";
import { CustomModifierSettings } from "#app/modifier/modifier-type";
import { isNullOrUndefined, NumberHolder } from "#app/utils";

export class SelectModifierPhase extends BattlePhase {
  private rerollCount: integer;
  private modifierTiers?: ModifierTier[];
  private customModifierSettings?: CustomModifierSettings;
  private modifierPredictions: ModifierTypeOption[][] = [];
  private predictionCost: integer = 0;
  private costTiers: integer[] = [];

  constructor(scene: BattleScene, rerollCount: integer = 0, modifierTiers?: ModifierTier[], customModifierSettings?: CustomModifierSettings) {
    super(scene);

    this.rerollCount = rerollCount;
    this.modifierTiers = modifierTiers;
    this.customModifierSettings = customModifierSettings;
    this.modifierPredictions = []
    if (modifierPredictions != undefined) {
      this.modifierPredictions = modifierPredictions;
    }
    this.predictionCost = 0
    this.costTiers = []
  }

  generateSelection(rerollOverride: integer, modifierOverride?: integer) {
    //const STATE = Phaser.Math.RND.state() // Store RNG state
    //console.log("====================")
    //console.log("  Reroll Prediction: " + rerollOverride)
    const party = this.scene.getParty();
    regenerateModifierPoolThresholds(party, this.getPoolType(), rerollOverride);
    const modifierCount = new Utils.IntegerHolder(3);
    if (this.isPlayer()) {
      this.scene.applyModifiers(ExtraModifierModifier, true, modifierCount);
    }
    if (modifierOverride) {
      //modifierCount.value = modifierOverride
    }
    const typeOptions: ModifierTypeOption[] = this.getModifierTypeOptions(modifierCount.value);
    typeOptions.forEach((option, idx) => {
      option.netprice = this.predictionCost
      if (option.type.name == "Nugget") {
        option.netprice -= this.scene.getWaveMoneyAmount(1)
      }
      if (option.type.name == "Big Nugget") {
        option.netprice -= this.scene.getWaveMoneyAmount(2.5)
      }
      if (option.type.name == "Relic Gold") {
        option.netprice -= this.scene.getWaveMoneyAmount(10)
      }
      //console.log(option.type.name)
    })
    //console.log("====================")
    this.modifierPredictions[rerollOverride] = typeOptions
    this.costTiers.push(this.predictionCost)
    this.predictionCost += this.getRerollCost(typeOptions, false, rerollOverride)
    //Phaser.Math.RND.state(STATE) // Restore RNG state like nothing happened
  }

  start() {
    super.start();

    if (!this.rerollCount) {
      this.updateSeed();
      console.log("\n\nReroll Prediction\n\n\n")
      this.predictionCost = 0
      this.costTiers = []
      for (var idx = 0; idx < 10 && this.predictionCost < this.scene.money; idx++) {
        this.generateSelection(idx, undefined)
      }
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

    const typeOptions: ModifierTypeOption[] = this.getModifierTypeOptions(modifierCount.value);

    const modifierSelectCallback = (rowCursor: integer, cursor: integer) => {
      if (rowCursor < 0 || cursor < 0) {
        this.scene.ui.showText(i18next.t("battle:skipItemQuestion"), null, () => {
          this.scene.ui.setOverlayMode(Mode.CONFIRM, () => {
            LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, "Skip taking items")
            this.scene.ui.revertMode();
            this.scene.ui.setMode(Mode.MESSAGE);
            super.end();
          }, () => this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers), this.modifierPredictions));
        });
        return false;
      }
      let modifierType: ModifierType;
      let cost: integer;
      const rerollCost = this.getRerollCost(typeOptions, this.scene.lockModifierTiers);
      switch (rowCursor) {
      case 0:
        switch (cursor) {
        case 0:
          if (rerollCost < 0 || this.scene.money < rerollCost) {
            this.scene.ui.playError();
            return false;
          } else {
            this.scene.reroll = true;
            LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, "Reroll" + (this.scene.lockModifierTiers ? " (Lock Capsule)" : ""));
            this.scene.unshiftPhase(new SelectModifierPhase(this.scene, this.rerollCount + 1, typeOptions.map(o => o.type?.tier).filter(t => t !== undefined) as ModifierTier[]));
            this.scene.ui.clearText();
            this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
            if (!Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
              this.scene.money -= rerollCost;
              this.scene.updateMoneyText();
              this.scene.animateMoneyChanged(false);
            }
            break;
          }
        case 1:
          this.scene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.MODIFIER_TRANSFER, -1, (fromSlotIndex: integer, itemIndex: integer, itemQuantity: integer, toSlotIndex: integer, isAll: boolean, isFirst: boolean) => {
            if (toSlotIndex !== undefined && fromSlotIndex < 6 && toSlotIndex < 6 && fromSlotIndex !== toSlotIndex && itemIndex > -1) {
              const itemModifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
                      && m.isTransferable && m.pokemonId === party[fromSlotIndex].id) as PokemonHeldItemModifier[];
              const itemModifier = itemModifiers[itemIndex];
              if (isAll) {
                if (isFirst)
                  LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, `Transfer ALL | ${LoggerTools.playerPokeName(this.scene, fromSlotIndex)} → ${LoggerTools.playerPokeName(this.scene, toSlotIndex)}`)
              } else {
                LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, `Transfer ${itemModifier.type.name + (itemQuantity == itemModifier.getStackCount() ? "" : " x" + itemQuantity)} | ${LoggerTools.playerPokeName(this.scene, fromSlotIndex)} → ${LoggerTools.playerPokeName(this.scene, toSlotIndex)}`)
              }
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
          if (rerollCost < 0) {
            // Reroll lock button is also disabled when reroll is disabled
            this.scene.ui.playError();
            return false;
          }
          this.scene.lockModifierTiers = !this.scene.lockModifierTiers;
          const uiHandler = this.scene.ui.getHandler() as ModifierSelectUiHandler;
          uiHandler.setRerollCost(this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
          uiHandler.updateLockRaritiesText();
          uiHandler.updateRerollCostText();
          return false;
        }
        return true;
      case 1:
        if (typeOptions.length === 0) {
          this.scene.ui.clearText();
          this.scene.ui.setMode(Mode.MESSAGE);
          super.end();
          return true;
        }
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
        // Apply Black Sludge to healing item cost
        const healingItemCost = new NumberHolder(shopOption.cost);
        this.scene.applyModifier(HealShopCostModifier, true, healingItemCost);
        cost = healingItemCost.value;
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
              LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, modifierType.name + " → " + this.scene.getParty()[fromSlotIndex].name + " + " + this.scene.getParty()[spliceSlotIndex].name)
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
                if (isPpRestoreModifier) {
                  LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, modifierType.name + " → " + this.scene.getParty()[slotIndex].name + " → " + this.scene.getParty()[slotIndex].moveset[option - PartyOption.MOVE_1]!.getName())
                } else if (isRememberMoveModifier) {
                  LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, modifierType.name + " → " + this.scene.getParty()[slotIndex].name)
                } else if (isTmModifier) {
                  LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, modifierType.name + " → " + this.scene.getParty()[slotIndex].name)
                } else {
                  LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, modifierType.name + " → " + this.scene.getParty()[slotIndex].name)
                }
                applyModifier(modifier!, true); // TODO: is the bang correct?
              });
            } else {
              this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
            }
          }, pokemonModifierType.selectFilter, modifierType instanceof PokemonMoveModifierType ? (modifierType as PokemonMoveModifierType).moveSelectFilter : undefined, tmMoveId, isPpRestoreModifier);
        }
      } else {
        LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, modifierType!.name)
        applyModifier(modifierType!.newModifier()!); // TODO: is the bang correct?
      }

      return !cost!;// TODO: is the bang correct?
    };
    if (this.rerollCount == 0) {
      if (true) {
        this.modifierPredictions.forEach((mp, r) => {
          // costTiers
          console.log("Rerolls: " + r + (this.costTiers[r] != 0 ? " - ₽" + this.costTiers[r] : ""))
          mp.forEach((m, i) => {
            console.log("  " + m.type!.name + (m.netprice != this.costTiers[r] ? " - ₽" + m.netprice : "") + " (" + (m.retriesList.length) + " tr" + (m.retriesList.length == 1 ? "y" : "ies") + ")")
            if (m.eviolite) {
              console.log("    With Eviolite unlocked: " + m.eviolite.name)
            }
            if (m.alternates) {
              //console.log(m.alternates)
              let showedLuckFlag = false
              for (var j = 0, currentTier = m.type!.tier; j < m.alternates.length; j++) {
                if (m.alternates[j] > currentTier) {
                  currentTier = m.alternates[j]
                  if (m.advancedAlternates) {
                    if (!showedLuckFlag) {
                      showedLuckFlag = true
                      console.log("    Your luck: " + getPartyLuckValue(party) + " (" + getLuckString(getPartyLuckValue(party)) + ")")
                    }
                    console.log("    At " + j + " luck (" + getLuckString(j) + "): " + m.advancedAlternates[j])
                  } else {
                    if (!showedLuckFlag) {
                      showedLuckFlag = true
                      console.log("    Your luck: " + getPartyLuckValue(party) + " (" + getLuckString(getPartyLuckValue(party)) + ")")
                    }
                    console.log("    At " + j + " luck (" + getLuckString(j) + "): " + LoggerTools.tierNames[currentTier] + "-tier item")// (failed to generate item)
                  }
                }
              }
            } else {
              //console.log("    No alt-luck data")
            }
          })
        })
      } else {
        let modifierList: string[] = []
        this.modifierPredictions.forEach((mp, r) => {
          //console.log("Rerolls: " + r)
          mp.forEach((m, i) => {
            modifierList.push(m.type!.name + (r > 0 ? " (x" + r + ")" : ""))
            //console.log("  " + m.type!.name)
            if (m.eviolite) {
              modifierList.push(m.type!.name + (r > 0 ? " (x" + r + " with eviolite unlocked)" : " (With eviolite unlocked)"))
              //console.log("    With Eviolite unlocked: " + m.eviolite.name)
            }
            if (m.alternates) {
              //console.log(m.alternates)
              let showedLuckFlag = false
              for (var j = 0, currentTier = m.type!.tier; j < m.alternates.length; j++) {
                if (m.alternates[j] > currentTier) {
                  currentTier = m.alternates[j]
                  if (m.advancedAlternates) {
                    if (!showedLuckFlag) {
                      showedLuckFlag = true
                      console.log("    Your luck: " + getPartyLuckValue(party) + " (" + getLuckString(getPartyLuckValue(party)) + ")")
                    }
                    console.log("    At " + j + " luck (" + getLuckString(j) + "): " + m.advancedAlternates[j])
                  } else {
                    if (!showedLuckFlag) {
                      showedLuckFlag = true
                      console.log("    Your luck: " + getPartyLuckValue(party) + " (" + getLuckString(getPartyLuckValue(party)) + ")")
                    }
                    console.log("    At " + j + " luck (" + getLuckString(j) + "): " + LoggerTools.tierNames[currentTier] + "-tier item (failed to generate item)")
                  }
                }
              }
            } else {
              //console.log("    No alt-luck data")
            }
          })
        })
        modifierList.sort()
        modifierList.forEach(v => {
          console.log(v)
        })
      }
    }
    this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
  }

  updateSeed(): void {
    this.scene.resetSeed();
  }

  isPlayer(): boolean {
    return true;
  }

  getRerollCost(typeOptions: ModifierTypeOption[], lockRarities: boolean, rerollOverride?: integer): integer {
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

    let multiplier = 1;
    if (!isNullOrUndefined(this.customModifierSettings?.rerollMultiplier)) {
      if (this.customModifierSettings.rerollMultiplier < 0) {
        // Completely overrides reroll cost to -1 and early exits
        return -1;
      }

      // Otherwise, continue with custom multiplier
      multiplier = this.customModifierSettings.rerollMultiplier;
    }
    return Math.min(Math.ceil(this.scene.currentBattle.waveIndex / 10) * baseValue * Math.pow(2, (rerollOverride != undefined ? rerollOverride : this.rerollCount)) * multiplier, Number.MAX_SAFE_INTEGER);
  }

  getPoolType(): ModifierPoolType {
    return ModifierPoolType.PLAYER;
  }

  getModifierTypeOptions(modifierCount: integer): ModifierTypeOption[] {
    return getPlayerModifierTypeOptions(modifierCount, this.scene.getParty(), this.scene.lockModifierTiers ? this.modifierTiers : undefined, this.customModifierSettings);
  }

  addModifier(modifier: Modifier): Promise<boolean> {
    return this.scene.addModifier(modifier, false, true);
  }
}
