import { CommandPhase, SelectModifierPhase } from "../phases";
import BattleScene from "../battle-scene";
import { PlayerPokemon, PokemonMove } from "../field/pokemon";
import { addTextObject, TextStyle } from "./text";
import { Command } from "./command-ui-handler";
import MessageUiHandler from "./message-ui-handler";
import { Mode } from "./ui";
import * as Utils from "../utils";
import { PokemonFormChangeItemModifier, PokemonHeldItemModifier, SwitchEffectTransferModifier } from "../modifier/modifier";
import { allMoves } from "../data/move";
import { getGenderColor, getGenderSymbol } from "../data/gender";
import { StatusEffect } from "../data/status-effect";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "./pokemon-icon-anim-handler";
import { pokemonEvolutions } from "../data/pokemon-evolutions";
import { addWindow } from "./ui-theme";
import { SpeciesFormChangeItemTrigger } from "../data/pokemon-forms";
import { getVariantTint } from "#app/data/variant";
import {Button} from "#enums/buttons";
import { applyChallenges, ChallengeType } from "#app/data/challenge.js";
import MoveInfoOverlay from "./move-info-overlay";
import i18next from "i18next";
import { Moves } from "#enums/moves";

const defaultMessage = "Choose a Pokémon.";

export enum PartyUiMode {
  SWITCH,
  FAINT_SWITCH,
  POST_BATTLE_SWITCH,
  REVIVAL_BLESSING,
  MODIFIER,
  MOVE_MODIFIER,
  TM_MODIFIER,
  REMEMBER_MOVE_MODIFIER,
  MODIFIER_TRANSFER,
  SPLICE,
  RELEASE,
  CHECK
}

export enum PartyOption {
  CANCEL = -1,
  SEND_OUT,
  PASS_BATON,
  REVIVE,
  APPLY,
  TEACH,
  TRANSFER,
  SUMMARY,
  UNPAUSE_EVOLUTION,
  SPLICE,
  UNSPLICE,
  RELEASE,
  SCROLL_UP = 1000,
  SCROLL_DOWN = 1001,
  FORM_CHANGE_ITEM = 2000,
  MOVE_1 = 3000,
  MOVE_2,
  MOVE_3,
  MOVE_4,
  ALL = 4000
}

export type PartySelectCallback = (cursor: integer, option: PartyOption) => void;
export type PartyModifierTransferSelectCallback = (fromCursor: integer, index: integer, itemQuantity?: integer, toCursor?: integer) => void;
export type PartyModifierSpliceSelectCallback = (fromCursor: integer, toCursor?: integer) => void;
export type PokemonSelectFilter = (pokemon: PlayerPokemon) => string;
export type PokemonModifierTransferSelectFilter = (pokemon: PlayerPokemon, modifier: PokemonHeldItemModifier) => string;
export type PokemonMoveSelectFilter = (pokemonMove: PokemonMove) => string;

export default class PartyUiHandler extends MessageUiHandler {
  private partyUiMode: PartyUiMode;
  private fieldIndex: integer;

  private partyBg: Phaser.GameObjects.Image;
  private partyContainer: Phaser.GameObjects.Container;
  private partySlotsContainer: Phaser.GameObjects.Container;
  private partySlots: PartySlot[];
  private partyCancelButton: PartyCancelButton;
  private partyMessageBox: Phaser.GameObjects.NineSlice;
  private moveInfoOverlay: MoveInfoOverlay;

  private optionsMode: boolean;
  private optionsScroll: boolean;
  private optionsCursor: integer = 0;
  private optionsScrollCursor: integer = 0;
  private optionsScrollTotal: integer = 0;
  private optionsContainer: Phaser.GameObjects.Container;
  private optionsBg: Phaser.GameObjects.NineSlice;
  private optionsCursorObj: Phaser.GameObjects.Image;
  private options: integer[];

  private transferMode: boolean;
  private transferOptionCursor: integer;
  private transferCursor: integer;
  /** Current quantity selection for every item held by the pokemon selected for the transfer */
  private transferQuantities: integer[];
  /** Stack size of every item that the selected pokemon is holding */
  private transferQuantitiesMax: integer[];
  /** Whether to transfer all items */
  private transferAll: boolean;

  private lastCursor: integer = 0;
  private selectCallback: PartySelectCallback | PartyModifierTransferSelectCallback;
  private selectFilter: PokemonSelectFilter | PokemonModifierTransferSelectFilter;
  private moveSelectFilter: PokemonMoveSelectFilter;
  private tmMoveId: Moves;
  private showMovePp: boolean;

  private iconAnimHandler: PokemonIconAnimHandler;

  private static FilterAll = (_pokemon: PlayerPokemon) => null;

  public static FilterNonFainted = (pokemon: PlayerPokemon) => {
    if (pokemon.isFainted()) {
      return `${pokemon.name} has no energy\nleft to battle!`;
    }
    return null;
  };

  public static FilterFainted = (pokemon: PlayerPokemon) => {
    if (!pokemon.isFainted()) {
      return `${pokemon.name} still has energy\nto battle!`;
    }
    return null;
  };

  /**
   * For consistency reasons, this looks like the above filters. However this is used only internally and is always enforced for switching.
   * @param pokemon The pokemon to check.
   * @returns
   */
  private FilterChallengeLegal = (pokemon: PlayerPokemon) => {
    const challengeAllowed = new Utils.BooleanHolder(true);
    applyChallenges(this.scene.gameMode, ChallengeType.POKEMON_IN_BATTLE, pokemon, challengeAllowed);
    if (!challengeAllowed.value) {
      return `${pokemon.name} can't be used in\nthis challenge!`;
    }
    return null;
  };

  private static FilterAllMoves = (_pokemonMove: PokemonMove) => null;

  public static FilterItemMaxStacks = (pokemon: PlayerPokemon, modifier: PokemonHeldItemModifier) => {
    const matchingModifier = pokemon.scene.findModifier(m => m instanceof PokemonHeldItemModifier && m.pokemonId === pokemon.id && m.matchType(modifier)) as PokemonHeldItemModifier;
    if (matchingModifier && matchingModifier.stackCount === matchingModifier.getMaxStackCount(pokemon.scene)) {
      return `${pokemon.name} has too many\nof this item!`;
    }
    return null;
  };

  public static NoEffectMessage = "It won't have any effect.";

  private localizedOptions = [PartyOption.SEND_OUT, PartyOption.SUMMARY, PartyOption.CANCEL, PartyOption.APPLY, PartyOption.RELEASE, PartyOption.TEACH];

  constructor(scene: BattleScene) {
    super(scene, Mode.PARTY);
  }

  setup() {
    const ui = this.getUi();

    const partyContainer = this.scene.add.container(0, 0);
    partyContainer.setVisible(false);
    ui.add(partyContainer);

    this.partyContainer = partyContainer;

    this.partyBg = this.scene.add.image(0, 0, "party_bg");
    partyContainer.add(this.partyBg);

    this.partyBg.setOrigin(0, 1);

    const partySlotsContainer = this.scene.add.container(0, 0);
    partyContainer.add(partySlotsContainer);

    this.partySlotsContainer = partySlotsContainer;

    const partyMessageBoxContainer = this.scene.add.container(0, -32);
    partyContainer.add(partyMessageBoxContainer);

    const partyMessageBox = addWindow(this.scene, 1, 31, 262, 30);
    partyMessageBox.setOrigin(0, 1);
    partyMessageBoxContainer.add(partyMessageBox);

    this.partyMessageBox = partyMessageBox;

    const partyMessageText = addTextObject(this.scene, 8, 10, defaultMessage, TextStyle.WINDOW, { maxLines: 2 });

    partyMessageText.setOrigin(0, 0);
    partyMessageBoxContainer.add(partyMessageText);

    this.message = partyMessageText;

    const partyCancelButton = new PartyCancelButton(this.scene, 291, -16);
    partyContainer.add(partyCancelButton);

    this.partyCancelButton = partyCancelButton;

    this.optionsContainer = this.scene.add.container((this.scene.game.canvas.width / 6) - 1, -1);
    partyContainer.add(this.optionsContainer);

    this.iconAnimHandler = new PokemonIconAnimHandler();
    this.iconAnimHandler.setup(this.scene);

    // prepare move overlay. in case it appears to be too big, set the overlayScale to .5
    const overlayScale = 1;
    this.moveInfoOverlay = new MoveInfoOverlay(this.scene, {
      scale: overlayScale,
      top: true,
      x: 1,
      y: -MoveInfoOverlay.getHeight(overlayScale) - 1, //this.scene.game.canvas.height / 6 - MoveInfoOverlay.getHeight(overlayScale) - 29,
      width: this.scene.game.canvas.width / 12 - 30,
    });
    ui.add(this.moveInfoOverlay);

    this.options = [];

    this.partySlots = [];
  }

  show(args: any[]): boolean {
    if (!args.length || this.active) {
      return false;
    }

    super.show(args);

    // reset the infoOverlay
    this.moveInfoOverlay.clear();

    this.partyUiMode = args[0] as PartyUiMode;

    this.fieldIndex = args.length > 1 ? args[1] as integer : -1;

    this.selectCallback = args.length > 2 && args[2] instanceof Function ? args[2] : undefined;
    this.selectFilter = args.length > 3 && args[3] instanceof Function
      ? args[3] as PokemonSelectFilter
      : PartyUiHandler.FilterAll;
    this.moveSelectFilter = args.length > 4 && args[4] instanceof Function
      ? args[4] as PokemonMoveSelectFilter
      : PartyUiHandler.FilterAllMoves;
    this.tmMoveId = args.length > 5 && args[5] ? args[5] : Moves.NONE;
    this.showMovePp = args.length > 6 && args[6];

    this.partyContainer.setVisible(true);
    this.partyBg.setTexture(`party_bg${this.scene.currentBattle.double ? "_double" : ""}`);
    this.populatePartySlots();
    this.setCursor(this.cursor < 6 ? this.cursor : 0);

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    if (this.pendingPrompt) {
      return false;
    }

    if (this.awaitingActionInput) {
      if ((button === Button.ACTION || button === Button.CANCEL) && this.onActionInput) {
        ui.playSelect();
        const originalOnActionInput = this.onActionInput;
        this.onActionInput = null;
        originalOnActionInput();
        this.awaitingActionInput = false;
        return true;
      }
      return false;
    }

    let success = false;

    if (this.optionsMode) {
      const option = this.options[this.optionsCursor];
      if (button === Button.ACTION) {
        const pokemon = this.scene.getParty()[this.cursor];
        if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER && !this.transferMode && option !== PartyOption.CANCEL) {
          this.startTransfer();
          this.clearOptions();
          ui.playSelect();
          return true;
        } else if (this.partyUiMode === PartyUiMode.REMEMBER_MOVE_MODIFIER && option !== PartyOption.CANCEL) {
          // clear overlay on cancel
          this.moveInfoOverlay.clear();
          const filterResult = (this.selectFilter as PokemonSelectFilter)(pokemon);
          if (filterResult === null) {
            this.selectCallback(this.cursor, option);
            this.clearOptions();
          } else {
            this.clearOptions();
            this.showText(filterResult as string, null, () => this.showText(null, 0), null, true);
          }
          ui.playSelect();
          return true;
        } else if ((option !== PartyOption.SUMMARY && option !== PartyOption.UNPAUSE_EVOLUTION && option !== PartyOption.UNSPLICE && option !== PartyOption.RELEASE && option !== PartyOption.CANCEL)
          || (option === PartyOption.RELEASE && this.partyUiMode === PartyUiMode.RELEASE)) {
          let filterResult: string;
          const getTransferrableItemsFromPokemon = (pokemon: PlayerPokemon) =>
            this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier && (m as PokemonHeldItemModifier).getTransferrable(true) && (m as PokemonHeldItemModifier).pokemonId === pokemon.id) as PokemonHeldItemModifier[];
          if (option !== PartyOption.TRANSFER && option !== PartyOption.SPLICE) {
            filterResult = (this.selectFilter as PokemonSelectFilter)(pokemon);
            if (filterResult === null && (option === PartyOption.SEND_OUT || option === PartyOption.PASS_BATON)) {
              filterResult = this.FilterChallengeLegal(pokemon);
            }
            if (filterResult === null && this.partyUiMode === PartyUiMode.MOVE_MODIFIER) {
              filterResult = this.moveSelectFilter(pokemon.moveset[this.optionsCursor]);
            }
          } else {
            filterResult = (this.selectFilter as PokemonModifierTransferSelectFilter)(pokemon, getTransferrableItemsFromPokemon(this.scene.getParty()[this.transferCursor])[this.transferOptionCursor]);
          }
          if (filterResult === null) {
            if (this.partyUiMode !== PartyUiMode.SPLICE) {
              this.clearOptions();
            }
            if (this.selectCallback && this.partyUiMode !== PartyUiMode.CHECK) {
              if (option === PartyOption.TRANSFER) {
                if (this.transferCursor !== this.cursor) {
                  if (this.transferAll) {
                    getTransferrableItemsFromPokemon(this.scene.getParty()[this.transferCursor]).forEach((_, i) => (this.selectCallback as PartyModifierTransferSelectCallback)(this.transferCursor, i, this.transferQuantitiesMax[i], this.cursor));
                  } else {
                    (this.selectCallback as PartyModifierTransferSelectCallback)(this.transferCursor, this.transferOptionCursor, this.transferQuantities[this.transferOptionCursor], this.cursor);
                  }
                }
                this.clearTransfer();
              } else if (this.partyUiMode === PartyUiMode.SPLICE) {
                if (option === PartyOption.SPLICE) {
                  (this.selectCallback as PartyModifierSpliceSelectCallback)(this.transferCursor, this.cursor);
                  this.clearTransfer();
                } else {
                  this.startTransfer();
                }
                this.clearOptions();
              } else if (option === PartyOption.RELEASE) {
                this.doRelease(this.cursor);
              } else {
                const selectCallback = this.selectCallback;
                this.selectCallback = null;
                selectCallback(this.cursor, option);
              }
            } else {
              if (option >= PartyOption.FORM_CHANGE_ITEM && this.scene.getCurrentPhase() instanceof SelectModifierPhase) {
                if (this.partyUiMode === PartyUiMode.CHECK) {
                  let formChangeItemModifiers = this.scene.findModifiers(m => m instanceof PokemonFormChangeItemModifier && m.pokemonId === pokemon.id) as PokemonFormChangeItemModifier[];
                  if (formChangeItemModifiers.find(m => m.active)) {
                    formChangeItemModifiers = formChangeItemModifiers.filter(m => m.active);
                  }
                  const modifier = formChangeItemModifiers[option - PartyOption.FORM_CHANGE_ITEM];
                  modifier.active = !modifier.active;
                  this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeItemTrigger, false, true);
                }
              } else if (this.cursor) {
                (this.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.POKEMON, this.cursor, option === PartyOption.PASS_BATON);
              }
            }
            if (this.partyUiMode !== PartyUiMode.MODIFIER && this.partyUiMode !== PartyUiMode.TM_MODIFIER && this.partyUiMode !== PartyUiMode.MOVE_MODIFIER) {
              ui.playSelect();
            }
            return true;
          } else {
            this.clearOptions();
            this.showText(filterResult as string, null, () => this.showText(null, 0), null, true);
          }
        } else if (option === PartyOption.SUMMARY) {
          ui.playSelect();
          ui.setModeWithoutClear(Mode.SUMMARY, pokemon).then(() =>  this.clearOptions());
          return true;
        } else if (option === PartyOption.UNPAUSE_EVOLUTION) {
          this.clearOptions();
          ui.playSelect();
          pokemon.pauseEvolutions = false;
          this.showText(`Evolutions have been unpaused for ${pokemon.name}.`, null, () => this.showText(null, 0), null, true);
        } else if (option === PartyOption.UNSPLICE) {
          this.clearOptions();
          ui.playSelect();
          this.showText(`Do you really want to unsplice ${pokemon.fusionSpecies.name}\nfrom ${pokemon.name}? ${pokemon.fusionSpecies.name} will be lost.`, null, () => {
            ui.setModeWithoutClear(Mode.CONFIRM, () => {
              const fusionName = pokemon.name;
              pokemon.unfuse().then(() => {
                this.clearPartySlots();
                this.populatePartySlots();
                ui.setMode(Mode.PARTY);
                this.showText(`${fusionName} was reverted to ${pokemon.name}.`, null, () => {
                  ui.setMode(Mode.PARTY);
                  this.showText(null, 0);
                }, null, true);
              });
            }, () => {
              ui.setMode(Mode.PARTY);
              this.showText(null, 0);
            });
          });
        } else if (option === PartyOption.RELEASE) {
          this.clearOptions();
          ui.playSelect();
          if (this.cursor >= this.scene.currentBattle.getBattlerCount() || !pokemon.isAllowedInBattle()) {
            this.showText(`Do you really want to release ${pokemon.name}?`, null, () => {
              ui.setModeWithoutClear(Mode.CONFIRM, () => {
                ui.setMode(Mode.PARTY);
                this.doRelease(this.cursor);
              }, () => {
                ui.setMode(Mode.PARTY);
                this.showText(null, 0);
              });
            });
          } else {
            this.showText("You can't release a Pokémon that's in battle!", null, () => this.showText(null, 0), null, true);
          }
          return true;
        } else if (option === PartyOption.CANCEL) {
          return this.processInput(Button.CANCEL);
        }
      } else if (button === Button.CANCEL) {
        this.clearOptions();
        ui.playSelect();
        return true;
      } else {
        switch (button) {
        case Button.LEFT:
          /** Decrease quantity for the current item and update UI */
          if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER) {
            this.transferQuantities[option] = this.transferQuantities[option] === 1 ? this.transferQuantitiesMax[option] : this.transferQuantities[option] - 1;
            this.updateOptions();
            success = this.setCursor(this.optionsCursor); /** Place again the cursor at the same position. Necessary, otherwise the cursor disappears */
          }
          break;
        case Button.RIGHT:
          /** Increase quantity for the current item and update UI */
          if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER) {
            this.transferQuantities[option] = this.transferQuantities[option] === this.transferQuantitiesMax[option] ? 1 : this.transferQuantities[option] + 1;
            this.updateOptions();
            success = this.setCursor(this.optionsCursor); /** Place again the cursor at the same position. Necessary, otherwise the cursor disappears */
          }
          break;
        case Button.UP:
          /** If currently selecting items to transfer, reset quantity selection */
          if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER) {
            if (option !== PartyOption.ALL) {
              this.transferQuantities[option] = this.transferQuantitiesMax[option];
            }
            this.updateOptions();
          }
          success = this.setCursor(this.optionsCursor ? this.optionsCursor - 1 : this.options.length - 1); /** Move cursor */
          break;
        case Button.DOWN:
          /** If currently selecting items to transfer, reset quantity selection */
          if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER) {
            if (option !== PartyOption.ALL) {
              this.transferQuantities[option] = this.transferQuantitiesMax[option];
            }
            this.updateOptions();
          }
          success = this.setCursor(this.optionsCursor < this.options.length - 1 ? this.optionsCursor + 1 : 0); /** Move cursor */
          break;
        }

        // show move description
        if (this.partyUiMode === PartyUiMode.REMEMBER_MOVE_MODIFIER) {
          const option = this.options[this.optionsCursor];
          const pokemon = this.scene.getParty()[this.cursor];
          const move = allMoves[pokemon.getLearnableLevelMoves()[option]];
          if (move) {
            this.moveInfoOverlay.show(move);
          } else {
            // or hide the overlay, in case it's the cancel button
            this.moveInfoOverlay.clear();
          }
        }
      }
    } else {
      if (button === Button.ACTION) {
        if (this.cursor < 6) {
          if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER && !this.transferMode) {
            /** Initialize item quantities for the selected Pokemon */
            const itemModifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
              && (m as PokemonHeldItemModifier).getTransferrable(true) && (m as PokemonHeldItemModifier).pokemonId === this.scene.getParty()[this.cursor].id) as PokemonHeldItemModifier[];
            this.transferQuantities = itemModifiers.map(item => item.getStackCount());
            this.transferQuantitiesMax = itemModifiers.map(item => item.getStackCount());
          }
          this.showOptions();
          ui.playSelect();
        } else if (this.partyUiMode === PartyUiMode.FAINT_SWITCH || this.partyUiMode === PartyUiMode.REVIVAL_BLESSING) {
          ui.playError();
        } else {
          return this.processInput(Button.CANCEL);
        }
        return true;
      } else if (button === Button.CANCEL) {
        if ((this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER || this.partyUiMode === PartyUiMode.SPLICE) && this.transferMode) {
          this.clearTransfer();
          ui.playSelect();
        } else if (this.partyUiMode !== PartyUiMode.FAINT_SWITCH && this.partyUiMode !== PartyUiMode.REVIVAL_BLESSING) {
          if (this.selectCallback) {
            const selectCallback = this.selectCallback;
            this.selectCallback = null;
            selectCallback(6, PartyOption.CANCEL);
            ui.playSelect();
          } else {
            ui.setMode(Mode.COMMAND, this.fieldIndex);
            ui.playSelect();
          }
        }

        return true;
      }

      const slotCount = this.partySlots.length;
      const battlerCount = this.scene.currentBattle.getBattlerCount();

      switch (button) {
      case Button.UP:
        success = this.setCursor(this.cursor ? this.cursor < 6 ? this.cursor - 1 : slotCount - 1 : 6);
        break;
      case Button.DOWN:
        success = this.setCursor(this.cursor < 6 ? this.cursor < slotCount - 1 ? this.cursor + 1 : 6 : 0);
        break;
      case Button.LEFT:
        if (this.cursor >= battlerCount && this.cursor <= 6) {
          success = this.setCursor(0);
        }
        break;
      case Button.RIGHT:
        if (slotCount === battlerCount) {
          success = this.setCursor(6);
          break;
        } else if (battlerCount >= 2 && slotCount > battlerCount && this.getCursor() === 0 && this.lastCursor === 1) {
          success = this.setCursor(2);
          break;
        } else if (slotCount > battlerCount && this.cursor < battlerCount) {
          success = this.setCursor(this.lastCursor < 6 ? this.lastCursor ||  battlerCount : battlerCount);
          break;
        }
      }
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  populatePartySlots() {
    const party = this.scene.getParty();

    if (this.cursor < 6 && this.cursor >= party.length) {
      this.cursor = party.length - 1;
    } else if (this.cursor === 6) {
      this.partyCancelButton.select();
    }

    for (const p in party) {
      const slotIndex = parseInt(p);
      const partySlot = new PartySlot(this.scene, slotIndex, party[p], this.iconAnimHandler, this.partyUiMode, this.tmMoveId);
      this.scene.add.existing(partySlot);
      this.partySlotsContainer.add(partySlot);
      this.partySlots.push(partySlot);
      if (this.cursor === slotIndex) {
        partySlot.select();
      }
    }
  }

  setCursor(cursor: integer): boolean {
    let changed: boolean;

    if (this.optionsMode) {
      changed = this.optionsCursor !== cursor;
      let isScroll = false;
      if (changed && this.optionsScroll) {
        if (Math.abs(cursor - this.optionsCursor) === this.options.length - 1) {
          this.optionsScrollCursor = cursor ? this.optionsScrollTotal - 8 : 0;
          this.updateOptions();
        } else {
          const isDown = cursor &&  cursor > this.optionsCursor;
          if (isDown) {
            if (this.options[cursor] === PartyOption.SCROLL_DOWN) {
              isScroll = true;
              this.optionsScrollCursor++;
            }
          } else {
            if (!cursor && this.optionsScrollCursor) {
              isScroll = true;
              this.optionsScrollCursor--;
            }
          }
          if (isScroll && this.optionsScrollCursor === 1) {
            this.optionsScrollCursor += isDown ? 1 : -1;
          }
        }
      }
      if (isScroll) {
        this.updateOptions();
      } else {
        this.optionsCursor = cursor;
      }
      if (!this.optionsCursorObj) {
        this.optionsCursorObj = this.scene.add.image(0, 0, "cursor");
        this.optionsCursorObj.setOrigin(0, 0);
        this.optionsContainer.add(this.optionsCursorObj);
      }
      this.optionsCursorObj.setPosition(8 - this.optionsBg.displayWidth, -19 - (16 * ((this.options.length - 1) - this.optionsCursor)));
    } else {
      changed = this.cursor !== cursor;
      if (changed) {
        this.lastCursor = this.cursor;
        this.cursor = cursor;
        if (this.lastCursor < 6) {
          this.partySlots[this.lastCursor].deselect();
        } else if (this.lastCursor === 6) {
          this.partyCancelButton.deselect();
        }
        if (cursor < 6) {
          this.partySlots[cursor].select();
        } else if (cursor === 6) {
          this.partyCancelButton.select();
        }
      }
    }

    return changed;
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    if (text === null) {
      text = defaultMessage;
    }

    if (text?.indexOf("\n") === -1) {
      this.partyMessageBox.setSize(262, 30);
      this.message.setY(10);
    } else {
      this.partyMessageBox.setSize(262, 42);
      this.message.setY(-5);
    }

    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  showOptions() {
    if (this.cursor === 6) {
      return;
    }

    this.optionsMode = true;

    let optionsMessage = "Do what with this Pokémon?";

    switch (this.partyUiMode) {
    case PartyUiMode.MOVE_MODIFIER:
      optionsMessage = "Select a move.";
      break;
    case PartyUiMode.MODIFIER_TRANSFER:
      if (!this.transferMode) {
        optionsMessage = "Select a held item to transfer.\nUse < and > to change the quantity.";
      }
      break;
    case PartyUiMode.SPLICE:
      if (!this.transferMode) {
        optionsMessage = "Select another Pokémon to splice.";
      }
      break;
    }

    this.showText(optionsMessage, 0);

    this.updateOptions();

    /** When an item is being selected for transfer, the message box is taller as the message occupies two lines */
    if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER) {
      this.partyMessageBox.setSize(262 - Math.max(this.optionsBg.displayWidth - 56, 0), 42);
    } else {
      this.partyMessageBox.setSize(262 - Math.max(this.optionsBg.displayWidth - 56, 0), 30);
    }

    this.setCursor(0);
  }

  updateOptions(): void {
    const pokemon = this.scene.getParty()[this.cursor];

    const learnableLevelMoves = this.partyUiMode === PartyUiMode.REMEMBER_MOVE_MODIFIER
      ? pokemon.getLearnableLevelMoves()
      : null;

    if (this.partyUiMode === PartyUiMode.REMEMBER_MOVE_MODIFIER && learnableLevelMoves?.length) {
      // show the move overlay with info for the first move
      this.moveInfoOverlay.show(allMoves[learnableLevelMoves[0]]);
    }

    const itemModifiers = this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER
      ? this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
        && (m as PokemonHeldItemModifier).getTransferrable(true) && (m as PokemonHeldItemModifier).pokemonId === pokemon.id) as PokemonHeldItemModifier[]
      : null;

    if (this.options.length) {
      this.options.splice(0, this.options.length);
      this.optionsContainer.removeAll(true);
      this.eraseOptionsCursor();
    }

    let formChangeItemModifiers: PokemonFormChangeItemModifier[];

    if (this.partyUiMode !== PartyUiMode.MOVE_MODIFIER && this.partyUiMode !== PartyUiMode.REMEMBER_MOVE_MODIFIER && (this.transferMode || this.partyUiMode !== PartyUiMode.MODIFIER_TRANSFER)) {
      switch (this.partyUiMode) {
      case PartyUiMode.SWITCH:
      case PartyUiMode.FAINT_SWITCH:
      case PartyUiMode.POST_BATTLE_SWITCH:
        if (this.cursor >= this.scene.currentBattle.getBattlerCount()) {
          this.options.push(PartyOption.SEND_OUT);
          if (this.partyUiMode !== PartyUiMode.FAINT_SWITCH
                && this.scene.findModifier(m => m instanceof SwitchEffectTransferModifier
                  && (m as SwitchEffectTransferModifier).pokemonId === this.scene.getPlayerField()[this.fieldIndex].id)) {
            this.options.push(PartyOption.PASS_BATON);
          }
        }
        break;
      case PartyUiMode.REVIVAL_BLESSING:
        this.options.push(PartyOption.REVIVE);
        break;
      case PartyUiMode.MODIFIER:
        this.options.push(PartyOption.APPLY);
        break;
      case PartyUiMode.TM_MODIFIER:
        this.options.push(PartyOption.TEACH);
        break;
      case PartyUiMode.MODIFIER_TRANSFER:
        this.options.push(PartyOption.TRANSFER);
        break;
      case PartyUiMode.SPLICE:
        if (this.transferMode) {
          if (this.cursor !== this.transferCursor) {
            this.options.push(PartyOption.SPLICE);
          }
        } else {
          this.options.push(PartyOption.APPLY);
        }
        break;
      case PartyUiMode.RELEASE:
        this.options.push(PartyOption.RELEASE);
        break;
      case PartyUiMode.CHECK:
        if (this.scene.getCurrentPhase() instanceof SelectModifierPhase) {
          formChangeItemModifiers = this.scene.findModifiers(m => m instanceof PokemonFormChangeItemModifier && m.pokemonId === pokemon.id) as PokemonFormChangeItemModifier[];
          if (formChangeItemModifiers.find(m => m.active)) {
            formChangeItemModifiers = formChangeItemModifiers.filter(m => m.active);
          }
          for (let i = 0; i < formChangeItemModifiers.length; i++) {
            this.options.push(PartyOption.FORM_CHANGE_ITEM + i);
          }
        }
        break;
      }

      this.options.push(PartyOption.SUMMARY);

      if (pokemon.pauseEvolutions && pokemonEvolutions.hasOwnProperty(pokemon.species.speciesId)) {
        this.options.push(PartyOption.UNPAUSE_EVOLUTION);
      }

      if (this.partyUiMode === PartyUiMode.SWITCH) {
        if (pokemon.isFusion()) {
          this.options.push(PartyOption.UNSPLICE);
        }
        this.options.push(PartyOption.RELEASE);
      } else if (this.partyUiMode === PartyUiMode.SPLICE && pokemon.isFusion()) {
        this.options.push(PartyOption.UNSPLICE);
      }
    } else if (this.partyUiMode === PartyUiMode.MOVE_MODIFIER) {
      for (let m = 0; m < pokemon.moveset.length; m++) {
        this.options.push(PartyOption.MOVE_1 + m);
      }
    } else if (this.partyUiMode === PartyUiMode.REMEMBER_MOVE_MODIFIER) {
      const learnableMoves = pokemon.getLearnableLevelMoves();
      for (let m = 0; m < learnableMoves.length; m++) {
        this.options.push(m);
      }
    } else {
      for (let im = 0; im < itemModifiers.length; im++) {
        this.options.push(im);
      }
      if (itemModifiers.length > 1) {
        this.options.push(PartyOption.ALL);
      }
    }

    this.optionsScrollTotal = this.options.length;
    let optionStartIndex = this.optionsScrollCursor;
    let optionEndIndex = Math.min(this.optionsScrollTotal, optionStartIndex + (!optionStartIndex || this.optionsScrollCursor + 8 >= this.optionsScrollTotal ? 8 : 7));

    this.optionsScroll = this.optionsScrollTotal > 9;

    if (this.optionsScroll) {
      this.options.splice(optionEndIndex, this.optionsScrollTotal);
      this.options.splice(0, optionStartIndex);
      if (optionStartIndex) {
        this.options.unshift(PartyOption.SCROLL_UP);
      }
      if (optionEndIndex < this.optionsScrollTotal) {
        this.options.push(PartyOption.SCROLL_DOWN);
      }
    }

    this.options.push(PartyOption.CANCEL);

    this.optionsBg = addWindow(this.scene, 0, 0, 0, 16 * this.options.length + 13);
    this.optionsBg.setOrigin(1, 1);

    this.optionsContainer.add(this.optionsBg);

    optionStartIndex = 0;
    optionEndIndex = this.options.length;

    let widestOptionWidth = 0;
    const optionTexts: Phaser.GameObjects.Text[] = [];

    for (let o = optionStartIndex; o < optionEndIndex; o++) {
      const option = this.options[this.options.length - (o + 1)];
      let altText = false;
      let optionName: string;
      if (option === PartyOption.SCROLL_UP) {
        optionName = "↑";
      } else if (option === PartyOption.SCROLL_DOWN) {
        optionName = "↓";
      } else if ((this.partyUiMode !== PartyUiMode.REMEMBER_MOVE_MODIFIER && (this.partyUiMode !== PartyUiMode.MODIFIER_TRANSFER || this.transferMode)) || option === PartyOption.CANCEL) {
        switch (option) {
        case PartyOption.MOVE_1:
        case PartyOption.MOVE_2:
        case PartyOption.MOVE_3:
        case PartyOption.MOVE_4:
          const move = pokemon.moveset[option - PartyOption.MOVE_1];
          if (this.showMovePp) {
            const maxPP = move.getMovePp();
            const currPP = maxPP - move.ppUsed;
            optionName = `${move.getName()} ${currPP}/${maxPP}`;
          } else {
            optionName = move.getName();
          }
          break;
        default:
          if (formChangeItemModifiers && option >= PartyOption.FORM_CHANGE_ITEM) {
            const modifier = formChangeItemModifiers[option - PartyOption.FORM_CHANGE_ITEM];
            optionName = `${modifier.active ? "Deactivate" : "Activate"} ${modifier.type.name}`;
          } else {
            if (this.localizedOptions.includes(option)) {
              optionName = i18next.t(`partyUiHandler:${PartyOption[option]}`);
            } else {
              optionName = Utils.toReadableString(PartyOption[option]);
            }
          }
          break;
        }
      } else if (this.partyUiMode === PartyUiMode.REMEMBER_MOVE_MODIFIER) {
        const move = learnableLevelMoves[option];
        optionName = allMoves[move].name;
        altText = !pokemon.getSpeciesForm().getLevelMoves().find(plm => plm[1] === move);
      } else {
        if (option === PartyOption.ALL) {
          optionName = i18next.t("partyUiHandler:ALL");
        } else {
          const itemModifier = itemModifiers[option];
          optionName = itemModifier.type.name;
          /** For every item that has stack bigger than 1, display the current quantity selection */
          if (this.transferQuantitiesMax[option] > 1) {
            optionName += ` (${this.transferQuantities[option]})`;
          }
        }
      }

      const yCoord = -6 - 16 * o;
      const optionText = addTextObject(this.scene, 0, yCoord - 16, optionName, TextStyle.WINDOW);
      if (altText) {
        optionText.setColor("#40c8f8");
        optionText.setShadowColor("#006090");
      }
      optionText.setOrigin(0, 0);

      optionTexts.push(optionText);

      widestOptionWidth = Math.max(optionText.displayWidth, widestOptionWidth);

      this.optionsContainer.add(optionText);
    }

    this.optionsBg.width = Math.max(widestOptionWidth + 24, 94);
    for (const optionText of optionTexts) {
      optionText.x = 15 - this.optionsBg.width;
    }
  }

  startTransfer(): void {
    this.transferMode = true;
    this.transferCursor = this.cursor;
    this.transferOptionCursor = this.getOptionsCursorWithScroll();
    this.transferAll = this.options[this.optionsCursor] === PartyOption.ALL;

    this.partySlots[this.transferCursor].setTransfer(true);
  }

  clearTransfer(): void {
    this.transferMode = false;
    this.transferAll = false;
    this.partySlots[this.transferCursor].setTransfer(false);
  }

  doRelease(slotIndex: integer): void {
    this.showText(this.getReleaseMessage(this.scene.getParty()[slotIndex].name), null, () => {
      this.clearPartySlots();
      this.scene.removePartyMemberModifiers(slotIndex);
      const releasedPokemon = this.scene.getParty().splice(slotIndex, 1)[0];
      releasedPokemon.destroy();
      this.populatePartySlots();
      if (this.cursor >= this.scene.getParty().length) {
        this.setCursor(this.cursor - 1);
      }
      if (this.partyUiMode === PartyUiMode.RELEASE) {
        const selectCallback = this.selectCallback;
        this.selectCallback = null;
        selectCallback(this.cursor, PartyOption.RELEASE);
      }
      this.showText(null, 0);
    }, null, true);
  }

  getReleaseMessage(pokemonName: string): string {
    const rand = Utils.randInt(128);
    if (rand < 20) {
      return `Goodbye, ${pokemonName}!`;
    } else if (rand < 40) {
      return `Byebye, ${pokemonName}!`;
    } else if (rand < 60) {
      return `Farewell, ${pokemonName}!`;
    } else if (rand < 80) {
      return `So long, ${pokemonName}!`;
    } else if (rand < 100) {
      return `This is where we part, ${pokemonName}!`;
    } else if (rand < 108) {
      return `I'll miss you, ${pokemonName}!`;
    } else if (rand < 116) {
      return `I'll never forget you, ${pokemonName}!`;
    } else if (rand < 124) {
      return `Until we meet again, ${pokemonName}!`;
    } else if (rand < 127) {
      return `Sayonara, ${pokemonName}!`;
    } else {
      return `Smell ya later, ${pokemonName}!`;
    }
  }

  getOptionsCursorWithScroll(): integer {
    return this.optionsCursor + this.optionsScrollCursor + (this.options && this.options[0] === PartyOption.SCROLL_UP ? -1 : 0);
  }

  clearOptions() {
    // hide the overlay
    this.moveInfoOverlay.clear();
    this.optionsMode = false;
    this.optionsScroll = false;
    this.optionsScrollCursor = 0;
    this.optionsScrollTotal = 0;
    this.options.splice(0, this.options.length);
    this.optionsContainer.removeAll(true);
    this.eraseOptionsCursor();

    this.partyMessageBox.setSize(262, 30);
    this.showText(null, 0);
  }

  eraseOptionsCursor() {
    if (this.optionsCursorObj) {
      this.optionsCursorObj.destroy();
    }
    this.optionsCursorObj = null;
  }

  clear() {
    super.clear();
    // hide the overlay
    this.moveInfoOverlay.clear();
    this.partyContainer.setVisible(false);
    this.clearPartySlots();
  }

  clearPartySlots() {
    this.partySlots.splice(0, this.partySlots.length);
    this.partySlotsContainer.removeAll(true);
  }
}

class PartySlot extends Phaser.GameObjects.Container {
  private selected: boolean;
  private transfer: boolean;
  private slotIndex: integer;
  private pokemon: PlayerPokemon;

  private slotBg: Phaser.GameObjects.Image;
  private slotPb: Phaser.GameObjects.Sprite;

  private pokemonIcon: Phaser.GameObjects.Container;
  private iconAnimHandler: PokemonIconAnimHandler;

  constructor(scene: BattleScene, slotIndex: integer, pokemon: PlayerPokemon, iconAnimHandler: PokemonIconAnimHandler, partyUiMode: PartyUiMode, tmMoveId: Moves) {
    super(scene, slotIndex >= scene.currentBattle.getBattlerCount() ? 230.5 : 64,
      slotIndex >= scene.currentBattle.getBattlerCount() ? -184 + (scene.currentBattle.double ? -40 : 0)
      + (28 + (scene.currentBattle.double ? 8 : 0)) * slotIndex : -124 + (scene.currentBattle.double ? -8 : 0) + slotIndex * 64);

    this.slotIndex = slotIndex;
    this.pokemon = pokemon;
    this.iconAnimHandler = iconAnimHandler;

    this.setup(partyUiMode, tmMoveId);
  }

  setup(partyUiMode: PartyUiMode, tmMoveId: Moves) {
    const battlerCount = (this.scene as BattleScene).currentBattle.getBattlerCount();

    const slotKey = `party_slot${this.slotIndex >= battlerCount ? "" : "_main"}`;

    const slotBg = this.scene.add.sprite(0, 0, slotKey, `${slotKey}${this.pokemon.hp ? "" : "_fnt"}`);
    this.slotBg = slotBg;

    this.add(slotBg);

    const slotPb = this.scene.add.sprite(this.slotIndex >= battlerCount ? -85.5 : -51, this.slotIndex >= battlerCount ? 0 : -20.5, "party_pb");
    this.slotPb = slotPb;

    this.add(slotPb);

    this.pokemonIcon = (this.scene as BattleScene).addPokemonIcon(this.pokemon, slotPb.x, slotPb.y, 0.5, 0.5, true);

    this.add(this.pokemonIcon);

    this.iconAnimHandler.addOrUpdate(this.pokemonIcon, PokemonIconAnimMode.PASSIVE);

    const slotInfoContainer = this.scene.add.container(0, 0);
    this.add(slotInfoContainer);

    let displayName = this.pokemon.name;
    let nameTextWidth: number;

    const nameSizeTest = addTextObject(this.scene, 0, 0, displayName, TextStyle.PARTY);
    nameTextWidth = nameSizeTest.displayWidth;

    while (nameTextWidth > (this.slotIndex >= battlerCount ? 52 : (76 - (this.pokemon.fusionSpecies ? 8 : 0)))) {
      displayName = `${displayName.slice(0, displayName.endsWith(".") ? -2 : -1).trimEnd()}.`;
      nameSizeTest.setText(displayName);
      nameTextWidth = nameSizeTest.displayWidth;
    }

    nameSizeTest.destroy();

    const slotName = addTextObject(this.scene, 0, 0, displayName, TextStyle.PARTY);
    slotName.setPositionRelative(slotBg, this.slotIndex >= battlerCount ? 21 : 24, this.slotIndex >= battlerCount ? 2 : 10);
    slotName.setOrigin(0, 0);

    const slotLevelLabel = this.scene.add.image(0, 0, "party_slot_overlay_lv");
    slotLevelLabel.setPositionRelative(slotName, 8, 12);
    slotLevelLabel.setOrigin(0, 0);

    const slotLevelText = addTextObject(this.scene, 0, 0, this.pokemon.level.toString(), this.pokemon.level < (this.scene as BattleScene).getMaxExpLevel() ? TextStyle.PARTY : TextStyle.PARTY_RED);
    slotLevelText.setPositionRelative(slotLevelLabel, 9, 0);
    slotLevelText.setOrigin(0, 0.25);

    slotInfoContainer.add([ slotName, slotLevelLabel, slotLevelText ]);

    const genderSymbol = getGenderSymbol(this.pokemon.getGender(true));

    if (genderSymbol) {
      const slotGenderText = addTextObject(this.scene, 0, 0, genderSymbol, TextStyle.PARTY);
      slotGenderText.setColor(getGenderColor(this.pokemon.getGender(true)));
      slotGenderText.setShadowColor(getGenderColor(this.pokemon.getGender(true), true));
      if (this.slotIndex >= battlerCount) {
        slotGenderText.setPositionRelative(slotLevelLabel, 36, 0);
      } else {
        slotGenderText.setPositionRelative(slotName, 76, 3);
      }
      slotGenderText.setOrigin(0, 0.25);

      slotInfoContainer.add(slotGenderText);
    }

    if (this.pokemon.fusionSpecies) {
      const splicedIcon = this.scene.add.image(0, 0, "icon_spliced");
      splicedIcon.setScale(0.5);
      splicedIcon.setOrigin(0, 0);
      if (this.slotIndex >= battlerCount) {
        splicedIcon.setPositionRelative(slotLevelLabel, 36 - (genderSymbol ? 8 : 0), 0.5);
      } else {
        splicedIcon.setPositionRelative(slotName, 76 - (genderSymbol ? 8 : 0), 3.5);
      }

      slotInfoContainer.add(splicedIcon);
    }

    if (this.pokemon.status) {
      const statusIndicator = this.scene.add.sprite(0, 0, "statuses");
      statusIndicator.setFrame(StatusEffect[this.pokemon.status?.effect].toLowerCase());
      statusIndicator.setOrigin(0, 0);
      statusIndicator.setPositionRelative(slotLevelLabel, this.slotIndex >= battlerCount ? 43 : 55, 0);

      slotInfoContainer.add(statusIndicator);
    }

    if (this.pokemon.isShiny()) {
      const doubleShiny = this.pokemon.isFusion() && this.pokemon.shiny && this.pokemon.fusionShiny;

      const shinyStar = this.scene.add.image(0, 0, `shiny_star_small${doubleShiny ? "_1" : ""}`);
      shinyStar.setOrigin(0, 0);
      shinyStar.setPositionRelative(slotName, -9, 3);
      shinyStar.setTint(getVariantTint(!doubleShiny ? this.pokemon.getVariant() : this.pokemon.variant));

      slotInfoContainer.add(shinyStar);

      if (doubleShiny) {
        const fusionShinyStar = this.scene.add.image(0, 0, "shiny_star_small_2");
        fusionShinyStar.setOrigin(0, 0);
        fusionShinyStar.setPosition(shinyStar.x, shinyStar.y);
        fusionShinyStar.setTint(getVariantTint(this.pokemon.fusionVariant));

        slotInfoContainer.add(fusionShinyStar);
      }
    }

    if (partyUiMode !== PartyUiMode.TM_MODIFIER) {
      const slotHpBar = this.scene.add.image(0, 0, "party_slot_hp_bar");
      slotHpBar.setPositionRelative(slotBg, this.slotIndex >= battlerCount ? 72 : 8, this.slotIndex >= battlerCount ? 6 : 31);
      slotHpBar.setOrigin(0, 0);

      const hpRatio = this.pokemon.getHpRatio();

      const slotHpOverlay = this.scene.add.sprite(0, 0, "party_slot_hp_overlay", hpRatio > 0.5 ? "high" : hpRatio > 0.25 ? "medium" : "low");
      slotHpOverlay.setPositionRelative(slotHpBar, 16, 2);
      slotHpOverlay.setOrigin(0, 0);
      slotHpOverlay.setScale(hpRatio, 1);

      const slotHpText = addTextObject(this.scene, 0, 0, `${this.pokemon.hp}/${this.pokemon.getMaxHp()}`, TextStyle.PARTY);
      slotHpText.setPositionRelative(slotHpBar, slotHpBar.width - 3, slotHpBar.height - 2);
      slotHpText.setOrigin(1, 0);

      slotInfoContainer.add([ slotHpBar, slotHpOverlay, slotHpText ]);
    } else {
      let slotTmText: string;
      switch (true) {
      case (this.pokemon.compatibleTms.indexOf(tmMoveId) === -1):
        slotTmText = "Not Able";
        break;
      case (this.pokemon.getMoveset().filter(m => m?.moveId === tmMoveId).length > 0):
        slotTmText = "Learned";
        break;
      default:
        slotTmText = "Able";
        break;
      }

      const slotTmLabel = addTextObject(this.scene, 0, 0, slotTmText, TextStyle.MESSAGE);
      slotTmLabel.setPositionRelative(slotBg, this.slotIndex >= battlerCount ? 94 : 32, this.slotIndex >= battlerCount ? 16 : 46);
      slotTmLabel.setOrigin(0, 1);

      slotInfoContainer.add(slotTmLabel);
    }
  }

  select(): void {
    if (this.selected) {
      return;
    }

    this.selected = true;
    this.iconAnimHandler.addOrUpdate(this.pokemonIcon, PokemonIconAnimMode.ACTIVE);

    this.updateSlotTexture();
    this.slotPb.setFrame("party_pb_sel");
  }

  deselect(): void {
    if (!this.selected) {
      return;
    }

    this.selected = false;
    this.iconAnimHandler.addOrUpdate(this.pokemonIcon, PokemonIconAnimMode.PASSIVE);

    this.updateSlotTexture();
    this.slotPb.setFrame("party_pb");
  }

  setTransfer(transfer: boolean): void {
    if (this.transfer === transfer) {
      return;
    }

    this.transfer = transfer;
    this.updateSlotTexture();
  }

  private updateSlotTexture(): void {
    const battlerCount = (this.scene as BattleScene).currentBattle.getBattlerCount();
    this.slotBg.setTexture(`party_slot${this.slotIndex >= battlerCount ? "" : "_main"}`,
      `party_slot${this.slotIndex >= battlerCount ? "" : "_main"}${this.transfer ? "_swap" : this.pokemon.hp ? "" : "_fnt"}${this.selected ? "_sel" : ""}`);
  }
}

class PartyCancelButton extends Phaser.GameObjects.Container {
  private selected: boolean;

  private partyCancelBg: Phaser.GameObjects.Sprite;
  private partyCancelPb: Phaser.GameObjects.Sprite;

  constructor(scene: BattleScene, x: number, y: number) {
    super(scene, x, y);

    this.setup();
  }

  setup() {
    const partyCancelBg = this.scene.add.sprite(0, 0, "party_cancel");
    this.add(partyCancelBg);

    this.partyCancelBg = partyCancelBg;

    const partyCancelPb = this.scene.add.sprite(-17, 0, "party_pb");
    this.add(partyCancelPb);

    this.partyCancelPb = partyCancelPb;

    const partyCancelText = addTextObject(this.scene, -7, -6, "Cancel", TextStyle.PARTY);
    this.add(partyCancelText);
  }

  select() {
    if (this.selected) {
      return;
    }

    this.selected = true;

    this.partyCancelBg.setFrame("party_cancel_sel");
    this.partyCancelPb.setFrame("party_pb_sel");
  }

  deselect() {
    if (!this.selected) {
      return;
    }

    this.selected = false;

    this.partyCancelBg.setFrame("party_cancel");
    this.partyCancelPb.setFrame("party_pb");
  }
}
