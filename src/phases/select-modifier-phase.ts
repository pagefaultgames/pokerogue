import BattleScene from "#app/battle-scene";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { regenerateModifierPoolThresholds, ModifierTypeOption, ModifierType, getPlayerShopModifierTypeOptionsForWave, PokemonModifierType, FusePokemonModifierType, PokemonMoveModifierType, TmModifierType, RememberMoveModifierType, PokemonPpRestoreModifierType, PokemonPpUpModifierType, ModifierPoolType, getPlayerModifierTypeOptions, getPartyLuckValue, getLuckString, setEvioliteOverride, calculateItemConditions } from "#app/modifier/modifier-type";
import { ExtraModifierModifier, Modifier, PokemonHeldItemModifier } from "#app/modifier/modifier";
import ModifierSelectUiHandler, { SHOP_OPTIONS_ROW_LIMIT } from "#app/ui/modifier-select-ui-handler";
import PartyUiHandler, { PartyUiMode, PartyOption } from "#app/ui/party-ui-handler";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import * as Utils from "#app/utils";
import { BattlePhase } from "./battle-phase";
import Overrides from "#app/overrides";
import * as LoggerTools from "../logger";

export class SelectModifierPhase extends BattlePhase {
  private rerollCount: integer;
  private modifierTiers: ModifierTier[] = [];
  private modifierPredictions: ModifierTypeOption[][] = []
  private predictionCost: integer = 0;
  private costTiers: integer[] = [];

  constructor(scene: BattleScene, rerollCount: integer = 0, modifierTiers?: ModifierTier[], predictionCost?: integer, modifierPredictions?: ModifierTypeOption[][]) {
    super(scene);

    this.rerollCount = rerollCount;
    this.modifierTiers = modifierTiers!; // TODO: is this bang correct?
    this.modifierPredictions = []
    if (modifierPredictions != undefined) {
      this.modifierPredictions = modifierPredictions;
    }
    this.predictionCost = 0
    this.costTiers = []
  }

  generateSelection(rerollOverride: integer, modifierOverride?: integer, eviolite?: boolean) {
    //const STATE = Phaser.Math.RND.state() // Store RNG state
    //console.log("====================")
    //console.log("  Reroll Prediction: " + rerollOverride)
    const party = this.scene.getParty();
    if (eviolite) {
      setEvioliteOverride("on")
    } else {
      setEvioliteOverride("off")
    }
    regenerateModifierPoolThresholds(party, this.getPoolType(), rerollOverride);
    const modifierCount = new Utils.IntegerHolder(3);
    if (this.isPlayer()) {
      this.scene.applyModifiers(ExtraModifierModifier, true, modifierCount);
    }
    if (modifierOverride) {
      //modifierCount.value = modifierOverride
    }
    const typeOptions: ModifierTypeOption[] = this.getModifierTypeOptions(modifierCount.value, true, true);
    setEvioliteOverride("")
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
    if (eviolite) {
      this.modifierPredictions[rerollOverride].forEach((m, i) => {
        if (m.type.name != typeOptions[i].type.name) {
          m.eviolite = typeOptions[i].type
        }
      })
    } else {
      this.modifierPredictions[rerollOverride] = typeOptions
    }
    this.costTiers.push(this.predictionCost)
    this.predictionCost += this.getRerollCost(typeOptions, false, rerollOverride)
    //Phaser.Math.RND.state(STATE) // Restore RNG state like nothing happened
  }

  start() {
    super.start();

    if (!this.rerollCount) {
      this.updateSeed();
      console.log(calculateItemConditions(this.scene.getParty(), false, true))
      console.log("\n\nPerforming reroll prediction (Eviolite OFF)\n\n\n")
      this.predictionCost = 0
      this.costTiers = []
      for (var idx = 0; idx < 10 && this.predictionCost < this.scene.money; idx++) {
        this.generateSelection(idx, undefined, false)
      }
      this.updateSeed();
      console.log("\n\nPerforming reroll prediction (Eviolite ON)\n\n\n")
      this.predictionCost = 0
      this.costTiers = []
      for (var idx = 0; idx < 10 && this.predictionCost < this.scene.money; idx++) {
        this.generateSelection(idx, undefined, true)
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
      switch (rowCursor) {
      case 0:
        switch (cursor) {
          case 0:
            const rerollCost1 = this.getRerollCost(typeOptions, this.scene.lockModifierTiers);
            if (this.scene.money < rerollCost1) {
              this.scene.ui.playError();
              return false;
            } else {
              this.scene.reroll = true;
              LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, "Reroll" + (this.scene.lockModifierTiers ? " (Locked)" : ""))
              this.scene.unshiftPhase(new SelectModifierPhase(this.scene, this.rerollCount + 1, typeOptions.map(o => o.type?.tier).filter(t => t !== undefined) as ModifierTier[], this.predictionCost, this.modifierPredictions));
              this.scene.ui.clearText();
              this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
              if (!Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
                this.scene.money -= rerollCost1;
                this.scene.updateMoneyText();
                this.scene.animateMoneyChanged(false);
                this.scene.playSound("se/buy");
              }
            }
            break;
          case 0.1:
            const rerollCost2 = this.getRerollCost(this.modifierPredictions[this.rerollCount], false);
            if (this.scene.money < rerollCost2) {
              this.scene.ui.playError();
              return false;
            } else {
              this.scene.reroll = true;
              LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, "+1 Reroll")
              this.scene.unshiftPhase(new SelectModifierPhase(this.scene, this.rerollCount + 1, typeOptions.map(o => o.type!.tier), this.predictionCost, this.modifierPredictions));
              this.scene.ui.clearText();
              this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
              if (!Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
                this.scene.money -= rerollCost2;
                this.scene.updateMoneyText();
                this.scene.animateMoneyChanged(false);
                this.scene.playSound("se/buy");
              }
            }
            break;
          case 0.2:
            const rerollCost3 = this.getRerollCost(this.modifierPredictions[this.rerollCount + 1], false);
            {
              this.scene.reroll = true;
              LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, "-1 Reroll")
              this.scene.unshiftPhase(new SelectModifierPhase(this.scene, this.rerollCount - 1, typeOptions.map(o => o.type!.tier), this.predictionCost, this.modifierPredictions));
              this.scene.ui.clearText();
              this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
              if (!Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
                this.scene.money -= rerollCost3;
                this.scene.updateMoneyText();
                this.scene.animateMoneyChanged(false);
                this.scene.playSound("se/buy");
              }
            }
            break;
        case 1:
          this.scene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.MODIFIER_TRANSFER, -1, (fromSlotIndex: integer, itemIndex: integer, itemQuantity: integer, toSlotIndex: integer, isAll: boolean, isFirst: boolean) => {
            if (toSlotIndex !== undefined && fromSlotIndex < 6 && toSlotIndex < 6 && fromSlotIndex !== toSlotIndex && itemIndex > -1) {
              const itemModifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
                    && m.isTransferrable && m.pokemonId === party[fromSlotIndex].id) as PokemonHeldItemModifier[];
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
    return Math.min(Math.ceil(this.scene.currentBattle.waveIndex / 10) * baseValue * Math.pow(2, (rerollOverride != undefined ? rerollOverride : this.rerollCount)), Number.MAX_SAFE_INTEGER);
  }

  getPoolType(): ModifierPoolType {
    return ModifierPoolType.PLAYER;
  }

  getModifierTypeOptions(modifierCount: integer, shutUpBro?: boolean, calcAllLuck?: boolean, advanced?: boolean): ModifierTypeOption[] {
    return getPlayerModifierTypeOptions(modifierCount, this.scene.getParty(), this.scene.lockModifierTiers ? this.modifierTiers : undefined, this.scene, shutUpBro, calcAllLuck, advanced);
  }

  addModifier(modifier: Modifier): Promise<boolean> {
    return this.scene.addModifier(modifier, false, true);
  }
}
