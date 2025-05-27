import type { PlayerPokemon, PokemonMove } from "#app/field/pokemon";
import type Pokemon from "#app/field/pokemon";
import { MoveResult } from "#app/field/pokemon";
import { addBBCodeTextObject, addTextObject, getTextColor, TextStyle } from "#app/ui/text";
import { Command } from "#app/ui/command-ui-handler";
import MessageUiHandler from "#app/ui/message-ui-handler";
import { UiMode } from "#enums/ui-mode";
import { BooleanHolder, toReadableString, randInt, getLocalizedSpriteKey } from "#app/utils/common";
import {
  PokemonFormChangeItemModifier,
  PokemonHeldItemModifier,
  SwitchEffectTransferModifier,
} from "#app/modifier/modifier";
import { ForceSwitchOutAttr } from "#app/data/moves/move";
import { allMoves } from "#app/data/data-lists";
import { Gender, getGenderColor, getGenderSymbol } from "#app/data/gender";
import { StatusEffect } from "#enums/status-effect";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "#app/ui/pokemon-icon-anim-handler";
import { pokemonEvolutions } from "#app/data/balance/pokemon-evolutions";
import { addWindow } from "#app/ui/ui-theme";
import { SpeciesFormChangeItemTrigger, FormChangeItem } from "#app/data/pokemon-forms";
import { getVariantTint } from "#app/sprites/variant";
import { Button } from "#enums/buttons";
import { applyChallenges, ChallengeType } from "#app/data/challenge";
import MoveInfoOverlay from "#app/ui/move-info-overlay";
import i18next from "i18next";
import type BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { getPokemonNameWithAffix } from "#app/messages";
import type { CommandPhase } from "#app/phases/command-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { globalScene } from "#app/global-scene";

const defaultMessage = i18next.t("partyUiHandler:choosePokemon");

/**
 * Indicates the reason why the party UI is being opened.
 */
export enum PartyUiMode {
  /**
   * Indicates that the party UI is open because of a user-opted switch.  This
   * type of switch can be cancelled.
   */
  SWITCH,
  /**
   * Indicates that the party UI is open because of a faint or other forced
   * switch (eg, move effect). This type of switch cannot be cancelled.
   */
  FAINT_SWITCH,
  /**
   * Indicates that the party UI is open because of a start-of-encounter optional
   * switch. This type of switch can be cancelled.
   */
  // TODO: Rename to PRE_BATTLE_SWITCH
  POST_BATTLE_SWITCH,
  /**
   * Indicates that the party UI is open because of the move Revival Blessing.
   * This selection cannot be cancelled.
   */
  REVIVAL_BLESSING,
  /**
   * Indicates that the party UI is open to select a mon to apply a modifier to.
   * This type of selection can be cancelled.
   */
  MODIFIER,
  /**
   * Indicates that the party UI is open to select a mon to apply a move
   * modifier to (such as an Ether or PP Up).  This type of selection can be cancelled.
   */
  MOVE_MODIFIER,
  /**
   * Indicates that the party UI is open to select a mon to teach a TM.  This
   * type of selection can be cancelled.
   */
  TM_MODIFIER,
  /**
   * Indicates that the party UI is open to select a mon to remember a move.
   * This type of selection can be cancelled.
   */
  REMEMBER_MOVE_MODIFIER,
  /**
   * Indicates that the party UI is open to transfer items between mons.  This
   * type of selection can be cancelled.
   */
  MODIFIER_TRANSFER,
  /**
   * Indicates that the party UI is open because of a DNA Splicer.  This
   * type of selection can be cancelled.
   */
  SPLICE,
  /**
   * Indicates that the party UI is open to release a party member.  This
   * type of selection can be cancelled.
   */
  RELEASE,
  /**
   * Indicates that the party UI is open to check the team.  This
   * type of selection can be cancelled.
   */
  CHECK,
  /**
   * Indicates that the party UI is open to select a party member for an arbitrary effect.
   * This is generally used in for Mystery Encounter or special effects that require the player to select a Pokemon
   */
  SELECT,
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
  POKEDEX,
  UNPAUSE_EVOLUTION,
  SPLICE,
  UNSPLICE,
  RELEASE,
  RENAME,
  SELECT,
  SCROLL_UP = 1000,
  SCROLL_DOWN = 1001,
  FORM_CHANGE_ITEM = 2000,
  MOVE_1 = 3000,
  MOVE_2,
  MOVE_3,
  MOVE_4,
  ALL = 4000,
}

export type PartySelectCallback = (cursor: number, option: PartyOption) => void;
export type PartyModifierTransferSelectCallback = (
  fromCursor: number,
  index: number,
  itemQuantity?: number,
  toCursor?: number,
) => void;
export type PartyModifierSpliceSelectCallback = (fromCursor: number, toCursor?: number) => void;
export type PokemonSelectFilter = (pokemon: PlayerPokemon) => string | null;
export type PokemonModifierTransferSelectFilter = (
  pokemon: PlayerPokemon,
  modifier: PokemonHeldItemModifier,
) => string | null;
export type PokemonMoveSelectFilter = (pokemonMove: PokemonMove) => string | null;

export default class PartyUiHandler extends MessageUiHandler {
  private partyUiMode: PartyUiMode;
  private fieldIndex: number;

  private partyBg: Phaser.GameObjects.Image;
  private partyContainer: Phaser.GameObjects.Container;
  private partySlotsContainer: Phaser.GameObjects.Container;
  private partySlots: PartySlot[];
  private partyCancelButton: PartyCancelButton;
  private partyMessageBox: Phaser.GameObjects.NineSlice;
  private moveInfoOverlay: MoveInfoOverlay;

  private optionsMode: boolean;
  private optionsScroll: boolean;
  private optionsCursor = 0;
  private optionsScrollCursor = 0;
  private optionsScrollTotal = 0;
  /** This is only public for test/ui/transfer-item.test.ts */
  public optionsContainer: Phaser.GameObjects.Container;
  private optionsBg: Phaser.GameObjects.NineSlice;
  private optionsCursorObj: Phaser.GameObjects.Image | null;
  private options: number[];

  private transferMode: boolean;
  private transferOptionCursor: number;
  private transferCursor: number;
  /** Current quantity selection for every item held by the pokemon selected for the transfer */
  private transferQuantities: number[];
  /** Stack size of every item that the selected pokemon is holding */
  private transferQuantitiesMax: number[];
  /** Whether to transfer all items */
  private transferAll: boolean;

  private lastCursor = 0;
  private selectCallback: PartySelectCallback | PartyModifierTransferSelectCallback | null;
  private selectFilter: PokemonSelectFilter | PokemonModifierTransferSelectFilter;
  private moveSelectFilter: PokemonMoveSelectFilter;
  private tmMoveId: Moves;
  private showMovePp: boolean;

  private iconAnimHandler: PokemonIconAnimHandler;

  private blockInput: boolean;

  private static FilterAll = (_pokemon: PlayerPokemon) => null;

  public static FilterNonFainted = (pokemon: PlayerPokemon) => {
    if (pokemon.isFainted()) {
      return i18next.t("partyUiHandler:noEnergy", { pokemonName: getPokemonNameWithAffix(pokemon, false) });
    }
    return null;
  };

  public static FilterFainted = (pokemon: PlayerPokemon) => {
    if (!pokemon.isFainted()) {
      return i18next.t("partyUiHandler:hasEnergy", { pokemonName: getPokemonNameWithAffix(pokemon, false) });
    }
    return null;
  };

  /**
   * For consistency reasons, this looks like the above filters. However this is used only internally and is always enforced for switching.
   * @param pokemon The pokemon to check.
   * @returns
   */
  private FilterChallengeLegal = (pokemon: PlayerPokemon) => {
    const challengeAllowed = new BooleanHolder(true);
    applyChallenges(ChallengeType.POKEMON_IN_BATTLE, pokemon, challengeAllowed);
    if (!challengeAllowed.value) {
      return i18next.t("partyUiHandler:cantBeUsed", { pokemonName: getPokemonNameWithAffix(pokemon, false) });
    }
    return null;
  };

  private static FilterAllMoves = (_pokemonMove: PokemonMove) => null;

  public static FilterItemMaxStacks = (pokemon: PlayerPokemon, modifier: PokemonHeldItemModifier) => {
    const matchingModifier = globalScene.findModifier(
      m => m instanceof PokemonHeldItemModifier && m.pokemonId === pokemon.id && m.matchType(modifier),
    ) as PokemonHeldItemModifier;
    if (matchingModifier && matchingModifier.stackCount === matchingModifier.getMaxStackCount()) {
      return i18next.t("partyUiHandler:tooManyItems", { pokemonName: getPokemonNameWithAffix(pokemon, false) });
    }
    return null;
  };

  public static NoEffectMessage = i18next.t("partyUiHandler:anyEffect");

  private localizedOptions = [
    PartyOption.SEND_OUT,
    PartyOption.SUMMARY,
    PartyOption.POKEDEX,
    PartyOption.CANCEL,
    PartyOption.APPLY,
    PartyOption.RELEASE,
    PartyOption.TEACH,
    PartyOption.SPLICE,
    PartyOption.UNSPLICE,
    PartyOption.REVIVE,
    PartyOption.TRANSFER,
    PartyOption.UNPAUSE_EVOLUTION,
    PartyOption.PASS_BATON,
    PartyOption.RENAME,
    PartyOption.SELECT,
  ];

  constructor() {
    super(UiMode.PARTY);
  }

  setup() {
    const ui = this.getUi();

    const partyContainer = globalScene.add.container(0, 0);
    partyContainer.setName("party");
    partyContainer.setVisible(false);
    ui.add(partyContainer);

    this.partyContainer = partyContainer;

    this.partyBg = globalScene.add.image(0, 0, "party_bg");
    this.partyBg.setName("img-party-bg");
    partyContainer.add(this.partyBg);

    this.partyBg.setOrigin(0, 1);

    const partySlotsContainer = globalScene.add.container(0, 0);
    partySlotsContainer.setName("party-slots");
    partyContainer.add(partySlotsContainer);

    this.partySlotsContainer = partySlotsContainer;

    const partyMessageBoxContainer = globalScene.add.container(0, -32);
    partyMessageBoxContainer.setName("party-msg-box");
    partyContainer.add(partyMessageBoxContainer);

    const partyMessageBox = addWindow(1, 31, 262, 30);
    partyMessageBox.setName("window-party-msg-box");
    partyMessageBox.setOrigin(0, 1);
    partyMessageBoxContainer.add(partyMessageBox);

    this.partyMessageBox = partyMessageBox;

    const partyMessageText = addTextObject(10, 8, defaultMessage, TextStyle.WINDOW, { maxLines: 2 });
    partyMessageText.setName("text-party-msg");

    partyMessageText.setOrigin(0, 0);
    partyMessageBoxContainer.add(partyMessageText);

    this.message = partyMessageText;

    const partyCancelButton = new PartyCancelButton(291, -16);
    partyContainer.add(partyCancelButton);

    this.partyCancelButton = partyCancelButton;

    this.optionsContainer = globalScene.add.container(globalScene.game.canvas.width / 6 - 1, -1);
    partyContainer.add(this.optionsContainer);

    this.iconAnimHandler = new PokemonIconAnimHandler();
    this.iconAnimHandler.setup();

    // prepare move overlay. in case it appears to be too big, set the overlayScale to .5
    const overlayScale = 1;
    this.moveInfoOverlay = new MoveInfoOverlay({
      scale: overlayScale,
      top: true,
      x: 1,
      y: -MoveInfoOverlay.getHeight(overlayScale) - 1,
      width: globalScene.game.canvas.width / 12 - 30,
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

    this.fieldIndex = args.length > 1 ? (args[1] as number) : -1;

    this.selectCallback = args.length > 2 && args[2] instanceof Function ? args[2] : undefined;
    this.selectFilter =
      args.length > 3 && args[3] instanceof Function ? (args[3] as PokemonSelectFilter) : PartyUiHandler.FilterAll;
    this.moveSelectFilter =
      args.length > 4 && args[4] instanceof Function
        ? (args[4] as PokemonMoveSelectFilter)
        : PartyUiHandler.FilterAllMoves;
    this.tmMoveId = args.length > 5 && args[5] ? args[5] : Moves.NONE;
    this.showMovePp = args.length > 6 && args[6];

    this.partyContainer.setVisible(true);
    this.partyBg.setTexture(`party_bg${globalScene.currentBattle.double ? "_double" : ""}`);
    this.populatePartySlots();
    this.setCursor(0);

    return true;
  }

  private processSummaryOption(pokemon: Pokemon): boolean {
    const ui = this.getUi();
    ui.playSelect();
    ui.setModeWithoutClear(UiMode.SUMMARY, pokemon).then(() => this.clearOptions());
    return true;
  }

  private processPokedexOption(pokemon: Pokemon): boolean {
    const ui = this.getUi();
    ui.playSelect();
    const attributes = {
      shiny: pokemon.shiny,
      variant: pokemon.variant,
      form: pokemon.formIndex,
      female: pokemon.gender === Gender.FEMALE,
    };
    ui.setOverlayMode(UiMode.POKEDEX_PAGE, pokemon.species, attributes).then(() => this.clearOptions());
    return true;
  }

  private processUnpauseEvolutionOption(pokemon: Pokemon): boolean {
    const ui = this.getUi();
    this.clearOptions();
    ui.playSelect();
    pokemon.pauseEvolutions = !pokemon.pauseEvolutions;
    this.showText(
      i18next.t(pokemon.pauseEvolutions ? "partyUiHandler:pausedEvolutions" : "partyUiHandler:unpausedEvolutions", {
        pokemonName: getPokemonNameWithAffix(pokemon, false),
      }),
      undefined,
      () => this.showText("", 0),
      null,
      true,
    );
    return true;
  }

  private processUnspliceOption(pokemon: PlayerPokemon): boolean {
    const ui = this.getUi();
    this.clearOptions();
    ui.playSelect();
    this.showText(
      i18next.t("partyUiHandler:unspliceConfirmation", {
        fusionName: pokemon.fusionSpecies?.name,
        pokemonName: pokemon.getName(),
      }),
      null,
      () => {
        ui.setModeWithoutClear(
          UiMode.CONFIRM,
          () => {
            const fusionName = pokemon.getName();
            pokemon.unfuse().then(() => {
              this.clearPartySlots();
              this.populatePartySlots();
              ui.setMode(UiMode.PARTY);
              this.showText(
                i18next.t("partyUiHandler:wasReverted", {
                  fusionName: fusionName,
                  pokemonName: pokemon.getName(false),
                }),
                undefined,
                () => {
                  ui.setMode(UiMode.PARTY);
                  this.showText("", 0);
                },
                null,
                true,
              );
            });
          },
          () => {
            ui.setMode(UiMode.PARTY);
            this.showText("", 0);
          },
        );
      },
    );
    return true;
  }

  private processReleaseOption(pokemon: Pokemon): boolean {
    const ui = this.getUi();
    this.clearOptions();
    ui.playSelect();
    // In release mode, we do not ask for confirmation when clicking release.
    if (this.partyUiMode === PartyUiMode.RELEASE) {
      this.doRelease(this.cursor);
      return true;
    }
    if (this.cursor >= globalScene.currentBattle.getBattlerCount() || !pokemon.isAllowedInBattle()) {
      this.blockInput = true;
      this.showText(
        i18next.t("partyUiHandler:releaseConfirmation", {
          pokemonName: getPokemonNameWithAffix(pokemon, false),
        }),
        null,
        () => {
          this.blockInput = false;
          ui.setModeWithoutClear(
            UiMode.CONFIRM,
            () => {
              ui.setMode(UiMode.PARTY);
              this.doRelease(this.cursor);
            },
            () => {
              ui.setMode(UiMode.PARTY);
              this.showText("", 0);
            },
          );
        },
      );
    } else {
      this.showText(i18next.t("partyUiHandler:releaseInBattle"), null, () => this.showText("", 0), null, true);
    }
    return true;
  }

  private processRenameOption(pokemon: Pokemon): boolean {
    const ui = this.getUi();
    this.clearOptions();
    ui.playSelect();
    ui.setModeWithoutClear(
      UiMode.RENAME_POKEMON,
      {
        buttonActions: [
          (nickname: string) => {
            ui.playSelect();
            pokemon.nickname = nickname;
            pokemon.updateInfo();
            this.clearPartySlots();
            this.populatePartySlots();
            ui.setMode(UiMode.PARTY);
          },
          () => {
            ui.setMode(UiMode.PARTY);
          },
        ],
      },
      pokemon,
    );
    return true;
  }

  // TODO: Does this need to check that selectCallback exists?
  private processTransferOption(): boolean {
    const ui = this.getUi();
    if (this.transferCursor !== this.cursor) {
      if (this.transferAll) {
        this.getTransferrableItemsFromPokemon(globalScene.getPlayerParty()[this.transferCursor]).forEach(
          (_, i, array) => {
            const invertedIndex = array.length - 1 - i;
            (this.selectCallback as PartyModifierTransferSelectCallback)(
              this.transferCursor,
              invertedIndex,
              this.transferQuantitiesMax[invertedIndex],
              this.cursor,
            );
          },
        );
      } else {
        (this.selectCallback as PartyModifierTransferSelectCallback)(
          this.transferCursor,
          this.transferOptionCursor,
          this.transferQuantities[this.transferOptionCursor],
          this.cursor,
        );
      }
    }
    this.clearTransfer();
    this.clearOptions();
    ui.playSelect();
    return true;
  }

  // TODO: This will be largely changed with the modifier rework
  private processModifierTransferModeInput(pokemon: PlayerPokemon) {
    const ui = this.getUi();
    const option = this.options[this.optionsCursor];

    if (option === PartyOption.TRANSFER) {
      return this.processTransferOption();
    }

    // TODO: Revise this condition
    if (!this.transferMode) {
      this.startTransfer();

      let ableToTransferText: string;
      for (let p = 0; p < globalScene.getPlayerParty().length; p++) {
        // this for look goes through each of the party pokemon
        const newPokemon = globalScene.getPlayerParty()[p];
        // this next bit checks to see if the the selected item from the original transfer pokemon exists on the new pokemon `p`
        // this returns `undefined` if the new pokemon doesn't have the item at all, otherwise it returns the `pokemonHeldItemModifier` for that item
        const matchingModifier = globalScene.findModifier(
          m =>
            m instanceof PokemonHeldItemModifier &&
            m.pokemonId === newPokemon.id &&
            m.matchType(this.getTransferrableItemsFromPokemon(pokemon)[this.transferOptionCursor]),
        ) as PokemonHeldItemModifier;
        const partySlot = this.partySlots.filter(m => m.getPokemon() === newPokemon)[0]; // this gets pokemon [p] for us
        if (p !== this.transferCursor) {
          // this skips adding the able/not able labels on the pokemon doing the transfer
          if (matchingModifier) {
            // if matchingModifier exists then the item exists on the new pokemon
            if (matchingModifier.getMaxStackCount() === matchingModifier.stackCount) {
              // checks to see if the stack of items is at max stack; if so, set the description label to "Not able"
              ableToTransferText = i18next.t("partyUiHandler:notAble");
            } else {
              // if the pokemon isn't at max stack, make the label "Able"
              ableToTransferText = i18next.t("partyUiHandler:able");
            }
          } else {
            // if matchingModifier doesn't exist, that means the pokemon doesn't have any of the item, and we need to show "Able"
            ableToTransferText = i18next.t("partyUiHandler:able");
          }
        } else {
          // this else relates to the transfer pokemon. We set the text to be blank so there's no "Able"/"Not able" text
          ableToTransferText = "";
        }
        partySlot.slotHpBar.setVisible(false);
        partySlot.slotHpOverlay.setVisible(false);
        partySlot.slotHpText.setVisible(false);
        partySlot.slotDescriptionLabel.setText(ableToTransferText);
        partySlot.slotDescriptionLabel.setVisible(true);
      }
      this.clearOptions();
      ui.playSelect();
      return true;
    }
    return false;
  }

  // TODO: Might need to check here for when this.transferMode is active.
  private processModifierTransferModeLeftRightInput(button: Button) {
    let success = false;
    const option = this.options[this.optionsCursor];
    if (button === Button.LEFT) {
      /** Decrease quantity for the current item and update UI */
      if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER) {
        this.transferQuantities[option] =
          this.transferQuantities[option] === 1
            ? this.transferQuantitiesMax[option]
            : this.transferQuantities[option] - 1;
        this.updateOptions();
        success = this.setCursor(
          this.optionsCursor,
        ); /** Place again the cursor at the same position. Necessary, otherwise the cursor disappears */
      }
    }

    if (button === Button.RIGHT) {
      /** Increase quantity for the current item and update UI */
      if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER) {
        this.transferQuantities[option] =
          this.transferQuantities[option] === this.transferQuantitiesMax[option]
            ? 1
            : this.transferQuantities[option] + 1;
        this.updateOptions();
        success = this.setCursor(
          this.optionsCursor,
        ); /** Place again the cursor at the same position. Necessary, otherwise the cursor disappears */
      }
    }
    return success;
  }

  // TODO: Might need to check here for when this.transferMode is active.
  private processModifierTransferModeUpDownInput(button: Button.UP | Button.DOWN) {
    let success = false;
    const option = this.options[this.optionsCursor];

    if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER) {
      if (option !== PartyOption.ALL) {
        this.transferQuantities[option] = this.transferQuantitiesMax[option];
      }
      this.updateOptions();
    }
    success = this.moveOptionCursor(button);

    return success;
  }

  private moveOptionCursor(button: Button.UP | Button.DOWN): boolean {
    if (button === Button.UP) {
      return this.setCursor(this.optionsCursor ? this.optionsCursor - 1 : this.options.length - 1);
    }
    return this.setCursor(this.optionsCursor < this.options.length - 1 ? this.optionsCursor + 1 : 0);
  }

  private processRememberMoveModeInput(pokemon: PlayerPokemon) {
    const ui = this.getUi();
    const option = this.options[this.optionsCursor];

    // clear overlay on cancel
    this.moveInfoOverlay.clear();
    const filterResult = (this.selectFilter as PokemonSelectFilter)(pokemon);
    if (filterResult === null) {
      this.selectCallback?.(this.cursor, option);
      this.clearOptions();
    } else {
      this.clearOptions();
      this.showText(filterResult as string, undefined, () => this.showText("", 0), undefined, true);
    }
    ui.playSelect();
    return true;
  }

  private processRememberMoveModeUpDownInput(button: Button.UP | Button.DOWN) {
    let success = false;

    success = this.moveOptionCursor(button);

    // show move description
    const option = this.options[this.optionsCursor];
    const pokemon = globalScene.getPlayerParty()[this.cursor];
    const move = allMoves[pokemon.getLearnableLevelMoves()[option]];
    if (move) {
      this.moveInfoOverlay.show(move);
    } else {
      // or hide the overlay, in case it's the cancel button
      this.moveInfoOverlay.clear();
    }

    return success;
  }

  private getTransferrableItemsFromPokemon(pokemon: PlayerPokemon) {
    return globalScene.findModifiers(
      m => m instanceof PokemonHeldItemModifier && m.isTransferable && m.pokemonId === pokemon.id,
    ) as PokemonHeldItemModifier[];
  }

  private getFilterResult(option: number, pokemon: PlayerPokemon): string | null {
    let filterResult: string | null;
    if (option !== PartyOption.TRANSFER && option !== PartyOption.SPLICE) {
      filterResult = (this.selectFilter as PokemonSelectFilter)(pokemon);
      if (filterResult === null && (option === PartyOption.SEND_OUT || option === PartyOption.PASS_BATON)) {
        filterResult = this.FilterChallengeLegal(pokemon);
      }
      if (filterResult === null && this.partyUiMode === PartyUiMode.MOVE_MODIFIER) {
        filterResult = this.moveSelectFilter(pokemon.moveset[this.optionsCursor]);
      }
    } else {
      filterResult = (this.selectFilter as PokemonModifierTransferSelectFilter)(
        pokemon,
        this.getTransferrableItemsFromPokemon(globalScene.getPlayerParty()[this.transferCursor])[
          this.transferOptionCursor
        ],
      );
    }
    return filterResult;
  }

  private processActionButtonForOptions(option: PartyOption) {
    const ui = this.getUi();
    if (option === PartyOption.CANCEL) {
      return this.processOptionMenuInput(Button.CANCEL);
    }

    // If the input has been already processed we are done, otherwise move on until the correct option is found
    const pokemon = globalScene.getPlayerParty()[this.cursor];

    // TODO: Careful about using success for the return values here. Find a better way
    // PartyOption.ALL, and options specific to the mode (held items)
    if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER) {
      return this.processModifierTransferModeInput(pokemon);
    }

    // options specific to the mode (moves)
    if (this.partyUiMode === PartyUiMode.REMEMBER_MOVE_MODIFIER) {
      return this.processRememberMoveModeInput(pokemon);
    }

    // These are the options that do not involve a callback
    if (option === PartyOption.SUMMARY) {
      return this.processSummaryOption(pokemon);
    }
    if (option === PartyOption.POKEDEX) {
      return this.processPokedexOption(pokemon);
    }
    if (option === PartyOption.UNPAUSE_EVOLUTION) {
      return this.processUnpauseEvolutionOption(pokemon);
    }
    if (option === PartyOption.UNSPLICE) {
      return this.processUnspliceOption(pokemon);
    }
    if (option === PartyOption.RENAME) {
      return this.processRenameOption(pokemon);
    }
    // This is only relevant for PartyUiMode.CHECK
    // TODO: This risks hitting the other options (.MOVE_i and ALL) so does it? Do we need an extra check?
    if (
      option >= PartyOption.FORM_CHANGE_ITEM &&
      globalScene.getCurrentPhase() instanceof SelectModifierPhase &&
      this.partyUiMode === PartyUiMode.CHECK
    ) {
      const formChangeItemModifiers = this.getFormChangeItemsModifiers(pokemon);
      const modifier = formChangeItemModifiers[option - PartyOption.FORM_CHANGE_ITEM];
      modifier.active = !modifier.active;
      globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeItemTrigger, false, true);
    }

    // If the pokemon is filtered out for this option, we cannot continue
    const filterResult = this.getFilterResult(option, pokemon);
    if (filterResult) {
      this.clearOptions();
      this.showText(filterResult as string, undefined, () => this.showText("", 0), undefined, true);
      return true;
    }

    // For what modes is a selectCallback needed?
    // PartyUiMode.SELECT (SELECT)
    // PartyUiMode.RELEASE (RELEASE)
    // PartyUiMode.FAINT_SWITCH (SEND_OUT or PASS_BATON (?))
    // PartyUiMode.REVIVAL_BLESSING (REVIVE)
    // PartyUiMode.MODIFIER_TRANSFER (held items, and ALL)
    // PartyUiMode.CHECK --- no specific option, only relevant on cancel?
    // PartyUiMode.SPLICE (SPLICE)
    // PartyUiMode.MOVE_MODIFIER (MOVE_1, MOVE_2, MOVE_3, MOVE_4)
    // PartyUiMode.TM_MODIFIER (TEACH)
    // PartyUiMode.REMEMBER_MOVE_MODIFIER (no specific option, callback is invoked when selecting a move)
    // PartyUiMode.MODIFIER (APPLY option)
    // PartyUiMode.POST_BATTLE_SWITCH (SEND_OUT)

    // These are the options that need a callback
    if (option === PartyOption.RELEASE) {
      return this.processReleaseOption(pokemon);
    }

    if (this.partyUiMode === PartyUiMode.SPLICE) {
      if (option === PartyOption.SPLICE) {
        (this.selectCallback as PartyModifierSpliceSelectCallback)(this.transferCursor, this.cursor);
        this.clearTransfer();
      } else if (option === PartyOption.APPLY) {
        this.startTransfer();
      }
      this.clearOptions();
      ui.playSelect();
      return true;
    }

    // This is used when switching out using the Pokemon command (possibly holding a Baton held item). In this case there is no callback.
    if (
      (option === PartyOption.PASS_BATON || option === PartyOption.SEND_OUT) &&
      this.partyUiMode === PartyUiMode.SWITCH
    ) {
      this.clearOptions();
      (globalScene.getCurrentPhase() as CommandPhase).handleCommand(
        Command.POKEMON,
        this.cursor,
        option === PartyOption.PASS_BATON,
      );
    }

    if (
      [
        PartyOption.SEND_OUT, // When sending out at the start of battle, or due to an effect
        PartyOption.PASS_BATON, // When passing the baton due to the Baton Pass move
        PartyOption.REVIVE,
        PartyOption.APPLY,
        PartyOption.TEACH,
        PartyOption.MOVE_1,
        PartyOption.MOVE_2,
        PartyOption.MOVE_3,
        PartyOption.MOVE_4,
        PartyOption.SELECT,
      ].includes(option) &&
      this.selectCallback
    ) {
      this.clearOptions();
      const selectCallback = this.selectCallback;
      this.selectCallback = null;
      selectCallback(this.cursor, option);
      return true;
    }

    return false;
  }

  private processOptionMenuInput(button: Button) {
    const ui = this.getUi();
    const option = this.options[this.optionsCursor];

    // Button.CANCEL has no special behavior for any option
    if (button === Button.CANCEL) {
      this.clearOptions();
      ui.playSelect();
      return true;
    }

    if (button === Button.ACTION) {
      return this.processActionButtonForOptions(option);
    }

    if (button === Button.UP || button === Button.DOWN) {
      if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER) {
        return this.processModifierTransferModeUpDownInput(button);
      }

      if (this.partyUiMode === PartyUiMode.REMEMBER_MOVE_MODIFIER) {
        return this.processRememberMoveModeUpDownInput(button);
      }

      return this.moveOptionCursor(button);
    }

    if (button === Button.LEFT || button === Button.RIGHT) {
      if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER) {
        return this.processModifierTransferModeLeftRightInput(button);
      }
    }

    return false;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    if (this.pendingPrompt || this.blockInput) {
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

    if (this.optionsMode) {
      let success = false;
      success = this.processOptionMenuInput(button);
      if (success) {
        ui.playSelect();
      }
      return success;
    }

    if (button === Button.ACTION) {
      return this.processPartyActionInput();
    }

    if (button === Button.CANCEL) {
      return this.processPartyCancelInput();
    }

    if (button === Button.UP || button === Button.DOWN || button === Button.RIGHT || button === Button.LEFT) {
      return this.processPartyDirectionalInput(button);
    }

    return false;
  }

  private allowCancel(): boolean {
    return !(this.partyUiMode === PartyUiMode.FAINT_SWITCH || this.partyUiMode === PartyUiMode.REVIVAL_BLESSING);
  }

  private processPartyActionInput(): boolean {
    const ui = this.getUi();
    if (this.cursor < 6) {
      if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER && !this.transferMode) {
        /** Initialize item quantities for the selected Pokemon */
        const itemModifiers = globalScene.findModifiers(
          m =>
            m instanceof PokemonHeldItemModifier &&
            m.isTransferable &&
            m.pokemonId === globalScene.getPlayerParty()[this.cursor].id,
        ) as PokemonHeldItemModifier[];
        this.transferQuantities = itemModifiers.map(item => item.getStackCount());
        this.transferQuantitiesMax = itemModifiers.map(item => item.getStackCount());
      }
      this.showOptions();
      ui.playSelect();
    }
    // Pressing return button
    if (this.cursor === 6) {
      if (!this.allowCancel()) {
        ui.playError();
      } else {
        return this.processInput(Button.CANCEL);
      }
    }
    return true;
  }

  private processPartyCancelInput(): boolean {
    const ui = this.getUi();
    if (
      (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER || this.partyUiMode === PartyUiMode.SPLICE) &&
      this.transferMode
    ) {
      this.clearTransfer();
      ui.playSelect();
    } else if (this.allowCancel()) {
      if (this.selectCallback) {
        const selectCallback = this.selectCallback;
        this.selectCallback = null;
        selectCallback(6, PartyOption.CANCEL);
        ui.playSelect();
      } else {
        ui.setMode(UiMode.COMMAND, this.fieldIndex);
        ui.playSelect();
      }
    }
    return true;
  }

  private processPartyDirectionalInput(button: Button.UP | Button.DOWN | Button.LEFT | Button.RIGHT): boolean {
    const ui = this.getUi();
    const slotCount = this.partySlots.length;
    const battlerCount = globalScene.currentBattle.getBattlerCount();

    let success = false;
    switch (button) {
      case Button.UP:
        success = this.setCursor(this.cursor ? (this.cursor < 6 ? this.cursor - 1 : slotCount - 1) : 6);
        break;
      case Button.DOWN:
        success = this.setCursor(this.cursor < 6 ? (this.cursor < slotCount - 1 ? this.cursor + 1 : 6) : 0);
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
        }
        if (battlerCount >= 2 && slotCount > battlerCount && this.getCursor() === 0 && this.lastCursor === 1) {
          success = this.setCursor(2);
          break;
        }
        if (slotCount > battlerCount && this.cursor < battlerCount) {
          success = this.setCursor(this.lastCursor < 6 ? this.lastCursor || battlerCount : battlerCount);
          break;
        }
    }

    if (success) {
      ui.playSelect();
    }
    return success;
  }

  populatePartySlots() {
    const party = globalScene.getPlayerParty();

    if (this.cursor < 6 && this.cursor >= party.length) {
      this.cursor = party.length - 1;
    } else if (this.cursor === 6) {
      this.partyCancelButton.select();
    }
    if (this.lastCursor < 6 && this.lastCursor >= party.length) {
      this.lastCursor = party.length - 1;
    }

    for (const p in party) {
      const slotIndex = Number.parseInt(p);
      const partySlot = new PartySlot(slotIndex, party[p], this.iconAnimHandler, this.partyUiMode, this.tmMoveId);
      globalScene.add.existing(partySlot);
      this.partySlotsContainer.add(partySlot);
      this.partySlots.push(partySlot);
      if (this.cursor === slotIndex) {
        partySlot.select();
      }
    }
  }

  setCursor(cursor: number): boolean {
    if (this.optionsMode) {
      return this.setOptionsCursor(cursor);
    }
    const changed = this.cursor !== cursor;
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
    return changed;
  }

  private setOptionsCursor(cursor: number): boolean {
    const changed = this.optionsCursor !== cursor;
    let isScroll = false;
    if (changed && this.optionsScroll) {
      if (Math.abs(cursor - this.optionsCursor) === this.options.length - 1) {
        this.optionsScrollCursor = cursor ? this.optionsScrollTotal - 8 : 0;
        this.updateOptions();
      } else {
        const isDown = cursor && cursor > this.optionsCursor;
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
      this.optionsCursorObj = globalScene.add.image(0, 0, "cursor");
      this.optionsCursorObj.setOrigin(0, 0);
      this.optionsContainer.add(this.optionsCursorObj);
    }
    this.optionsCursorObj.setPosition(
      8 - this.optionsBg.displayWidth,
      -19 - 16 * (this.options.length - 1 - this.optionsCursor),
    );

    return changed;
  }

  showText(
    text: string,
    delay?: number | null,
    callback?: Function | null,
    callbackDelay?: number | null,
    prompt?: boolean | null,
    promptDelay?: number | null,
  ) {
    if (text.length === 0) {
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

    let optionsMessage = i18next.t("partyUiHandler:doWhatWithThisPokemon");

    switch (this.partyUiMode) {
      case PartyUiMode.MOVE_MODIFIER:
        optionsMessage = i18next.t("partyUiHandler:selectAMove");
        break;
      case PartyUiMode.MODIFIER_TRANSFER:
        if (!this.transferMode) {
          optionsMessage = i18next.t("partyUiHandler:changeQuantity");
        }
        break;
      case PartyUiMode.SPLICE:
        if (!this.transferMode) {
          optionsMessage = i18next.t("partyUiHandler:selectAnotherPokemonToSplice");
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

  private allowBatonModifierSwitch(): boolean {
    return !!(
      this.partyUiMode !== PartyUiMode.FAINT_SWITCH &&
      globalScene.findModifier(
        m =>
          m instanceof SwitchEffectTransferModifier &&
          m.pokemonId === globalScene.getPlayerField()[this.fieldIndex].id,
      )
    );
  }

  // TODO: add FORCED_SWITCH (and perhaps also BATON_PASS_SWITCH) to the modes
  private isBatonPassMove(): boolean {
    const moveHistory = globalScene.getPlayerField()[this.fieldIndex].getMoveHistory();
    return !!(
      this.partyUiMode === PartyUiMode.FAINT_SWITCH &&
      moveHistory.length &&
      allMoves[moveHistory[moveHistory.length - 1].move].getAttrs(ForceSwitchOutAttr)[0]?.isBatonPass() &&
      moveHistory[moveHistory.length - 1].result === MoveResult.SUCCESS
    );
  }

  private getItemModifiers(pokemon: Pokemon): PokemonHeldItemModifier[] {
    return (
      (globalScene.findModifiers(
        m => m instanceof PokemonHeldItemModifier && m.isTransferable && m.pokemonId === pokemon.id,
      ) as PokemonHeldItemModifier[]) ?? []
    );
  }

  private updateOptionsWithRememberMoveModifierMode(pokemon): void {
    const learnableMoves = pokemon.getLearnableLevelMoves();
    for (let m = 0; m < learnableMoves.length; m++) {
      this.options.push(m);
    }
    if (learnableMoves?.length) {
      // show the move overlay with info for the first move
      this.moveInfoOverlay.show(allMoves[learnableMoves[0]]);
    }
  }

  private updateOptionsWithMoveModifierMode(pokemon): void {
    // MOVE_1, MOVE_2, MOVE_3, MOVE_4
    for (let m = 0; m < pokemon.moveset.length; m++) {
      this.options.push(PartyOption.MOVE_1 + m);
    }
  }

  private updateOptionsWithModifierTransferMode(pokemon): void {
    const itemModifiers = this.getItemModifiers(pokemon);
    for (let im = 0; im < itemModifiers.length; im++) {
      this.options.push(im);
    }
    if (itemModifiers.length > 1) {
      this.options.push(PartyOption.ALL);
    }
  }

  private addCommonOptions(pokemon): void {
    this.options.push(PartyOption.SUMMARY);
    this.options.push(PartyOption.POKEDEX);
    this.options.push(PartyOption.RENAME);

    if (
      pokemonEvolutions.hasOwnProperty(pokemon.species.speciesId) ||
      (pokemon.isFusion() && pokemon.fusionSpecies && pokemonEvolutions.hasOwnProperty(pokemon.fusionSpecies.speciesId))
    ) {
      this.options.push(PartyOption.UNPAUSE_EVOLUTION);
    }
  }

  private addCancelAndScrollOptions(): void {
    this.optionsScrollTotal = this.options.length;
    const optionStartIndex = this.optionsScrollCursor;
    const optionEndIndex = Math.min(
      this.optionsScrollTotal,
      optionStartIndex + (!optionStartIndex || this.optionsScrollCursor + 8 >= this.optionsScrollTotal ? 8 : 7),
    );

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
  }

  updateOptions(): void {
    const pokemon = globalScene.getPlayerParty()[this.cursor];

    if (this.options.length) {
      this.options.splice(0, this.options.length);
      this.optionsContainer.removeAll(true);
      this.eraseOptionsCursor();
    }

    switch (this.partyUiMode) {
      case PartyUiMode.MOVE_MODIFIER:
        this.updateOptionsWithMoveModifierMode(pokemon);
        break;
      case PartyUiMode.REMEMBER_MOVE_MODIFIER:
        this.updateOptionsWithRememberMoveModifierMode(pokemon);
        break;
      case PartyUiMode.MODIFIER_TRANSFER:
        if (!this.transferMode) {
          this.updateOptionsWithModifierTransferMode(pokemon);
        } else {
          this.options.push(PartyOption.TRANSFER);
          this.addCommonOptions(pokemon);
        }
        break;
      // TODO: This still needs to be broken up.
      // It could use a rework differentiating different kind of switches
      // to treat baton passing separately from switching on faint.
      case PartyUiMode.SWITCH:
      case PartyUiMode.FAINT_SWITCH:
      case PartyUiMode.POST_BATTLE_SWITCH:
        if (this.cursor >= globalScene.currentBattle.getBattlerCount()) {
          const allowBatonModifierSwitch = this.allowBatonModifierSwitch();
          const isBatonPassMove = this.isBatonPassMove();

          // isBatonPassMove and allowBatonModifierSwitch shouldn't ever be true
          // at the same time, because they both explicitly check for a mutually
          // exclusive partyUiMode. But better safe than sorry.
          this.options.push(
            isBatonPassMove && !allowBatonModifierSwitch ? PartyOption.PASS_BATON : PartyOption.SEND_OUT,
          );
          if (allowBatonModifierSwitch && !isBatonPassMove) {
            // the BATON modifier gives an extra switch option for
            // pokemon-command switches, allowing buffs to be optionally passed
            this.options.push(PartyOption.PASS_BATON);
          }
        }
        this.addCommonOptions(pokemon);
        if (this.partyUiMode === PartyUiMode.SWITCH) {
          if (pokemon.isFusion()) {
            this.options.push(PartyOption.UNSPLICE);
          }
          this.options.push(PartyOption.RELEASE);
        }
        break;
      case PartyUiMode.REVIVAL_BLESSING:
        this.options.push(PartyOption.REVIVE);
        this.addCommonOptions(pokemon);
        break;
      case PartyUiMode.MODIFIER:
        this.options.push(PartyOption.APPLY);
        this.addCommonOptions(pokemon);
        break;
      case PartyUiMode.TM_MODIFIER:
        this.options.push(PartyOption.TEACH);
        this.addCommonOptions(pokemon);
        break;
      case PartyUiMode.SPLICE:
        if (this.transferMode) {
          if (this.cursor !== this.transferCursor) {
            this.options.push(PartyOption.SPLICE);
          }
        } else {
          this.options.push(PartyOption.APPLY);
        }
        this.addCommonOptions(pokemon);
        if (pokemon.isFusion()) {
          this.options.push(PartyOption.UNSPLICE);
        }
        break;
      case PartyUiMode.RELEASE:
        this.options.push(PartyOption.RELEASE);
        this.addCommonOptions(pokemon);
        break;
      case PartyUiMode.CHECK:
        if (globalScene.getCurrentPhase() instanceof SelectModifierPhase) {
          const formChangeItemModifiers = this.getFormChangeItemsModifiers(pokemon);
          for (let i = 0; i < formChangeItemModifiers.length; i++) {
            this.options.push(PartyOption.FORM_CHANGE_ITEM + i);
          }
        }
        this.addCommonOptions(pokemon);
        break;
      case PartyUiMode.SELECT:
        this.options.push(PartyOption.SELECT);
        this.addCommonOptions(pokemon);
        break;
    }

    // Generic, these are applied to all Modes
    this.addCancelAndScrollOptions();

    this.updateOptionsWindow();
  }

  private updateOptionsWindow(): void {
    const pokemon = globalScene.getPlayerParty()[this.cursor];

    this.optionsBg = addWindow(0, 0, 0, 16 * this.options.length + 13);
    this.optionsBg.setOrigin(1, 1);

    this.optionsContainer.add(this.optionsBg);

    const optionStartIndex = 0;
    const optionEndIndex = this.options.length;

    let widestOptionWidth = 0;
    const optionTexts: BBCodeText[] = [];

    for (let o = optionStartIndex; o < optionEndIndex; o++) {
      const option = this.options[this.options.length - (o + 1)];
      let altText = false;
      let optionName: string;
      if (option === PartyOption.SCROLL_UP) {
        optionName = "↑";
      } else if (option === PartyOption.SCROLL_DOWN) {
        optionName = "↓";
      } else if (
        (this.partyUiMode !== PartyUiMode.REMEMBER_MOVE_MODIFIER &&
          (this.partyUiMode !== PartyUiMode.MODIFIER_TRANSFER || this.transferMode)) ||
        option === PartyOption.CANCEL
      ) {
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
            const formChangeItemModifiers = this.getFormChangeItemsModifiers(pokemon);
            if (formChangeItemModifiers && option >= PartyOption.FORM_CHANGE_ITEM) {
              const modifier = formChangeItemModifiers[option - PartyOption.FORM_CHANGE_ITEM];
              optionName = `${modifier.active ? i18next.t("partyUiHandler:DEACTIVATE") : i18next.t("partyUiHandler:ACTIVATE")} ${modifier.type.name}`;
            } else if (option === PartyOption.UNPAUSE_EVOLUTION) {
              optionName = `${pokemon.pauseEvolutions ? i18next.t("partyUiHandler:UNPAUSE_EVOLUTION") : i18next.t("partyUiHandler:PAUSE_EVOLUTION")}`;
            } else {
              if (this.localizedOptions.includes(option)) {
                optionName = i18next.t(`partyUiHandler:${PartyOption[option]}`);
              } else {
                optionName = toReadableString(PartyOption[option]);
              }
            }
            break;
        }
      } else if (this.partyUiMode === PartyUiMode.REMEMBER_MOVE_MODIFIER) {
        const learnableLevelMoves = pokemon.getLearnableLevelMoves();
        const move = learnableLevelMoves[option];
        optionName = allMoves[move].name;
        altText = !pokemon
          .getSpeciesForm()
          .getLevelMoves()
          .find(plm => plm[1] === move);
      } else if (option === PartyOption.ALL) {
        optionName = i18next.t("partyUiHandler:ALL");
      } else {
        const itemModifiers = this.getItemModifiers(pokemon);
        const itemModifier = itemModifiers[option];
        optionName = itemModifier.type.name;
      }

      const yCoord = -6 - 16 * o;
      const optionText = addBBCodeTextObject(0, yCoord - 16, optionName, TextStyle.WINDOW, { maxLines: 1 });
      if (altText) {
        optionText.setColor("#40c8f8");
        optionText.setShadowColor("#006090");
      }
      optionText.setOrigin(0, 0);

      /** For every item that has stack bigger than 1, display the current quantity selection */
      const itemModifiers = this.getItemModifiers(pokemon);
      const itemModifier = itemModifiers[option];
      if (
        this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER &&
        this.transferQuantitiesMax[option] > 1 &&
        !this.transferMode &&
        itemModifier !== undefined &&
        itemModifier.type.name === optionName
      ) {
        let amountText = ` (${this.transferQuantities[option]})`;

        /** If the amount held is the maximum, display the count in red */
        if (this.transferQuantitiesMax[option] === itemModifier.getMaxHeldItemCount(undefined)) {
          amountText = `[color=${getTextColor(TextStyle.SUMMARY_RED)}]${amountText}[/color]`;
        }

        optionText.setText(optionName + amountText);
      }

      optionText.setText(`[shadow]${optionText.text}[/shadow]`);

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
    for (let i = 0; i < this.partySlots.length; i++) {
      this.partySlots[i].slotDescriptionLabel.setVisible(false);
      this.partySlots[i].slotHpBar.setVisible(true);
      this.partySlots[i].slotHpOverlay.setVisible(true);
      this.partySlots[i].slotHpText.setVisible(true);
    }
  }

  doRelease(slotIndex: number): void {
    this.showText(
      this.getReleaseMessage(getPokemonNameWithAffix(globalScene.getPlayerParty()[slotIndex], false)),
      null,
      () => {
        this.clearPartySlots();
        globalScene.removePartyMemberModifiers(slotIndex);
        const releasedPokemon = globalScene.getPlayerParty().splice(slotIndex, 1)[0];
        releasedPokemon.destroy();
        this.populatePartySlots();
        if (this.cursor >= globalScene.getPlayerParty().length) {
          this.setCursor(this.cursor - 1);
        }
        if (this.partyUiMode === PartyUiMode.RELEASE) {
          const selectCallback = this.selectCallback;
          this.selectCallback = null;
          selectCallback?.(this.cursor, PartyOption.RELEASE);
        }
        this.showText("", 0);
      },
      null,
      true,
    );
  }

  getReleaseMessage(pokemonName: string): string {
    const rand = randInt(128);
    if (rand < 20) {
      return i18next.t("partyUiHandler:goodbye", { pokemonName: pokemonName });
    }
    if (rand < 40) {
      return i18next.t("partyUiHandler:byebye", { pokemonName: pokemonName });
    }
    if (rand < 60) {
      return i18next.t("partyUiHandler:farewell", { pokemonName: pokemonName });
    }
    if (rand < 80) {
      return i18next.t("partyUiHandler:soLong", { pokemonName: pokemonName });
    }
    if (rand < 100) {
      return i18next.t("partyUiHandler:thisIsWhereWePart", {
        pokemonName: pokemonName,
      });
    }
    if (rand < 108) {
      return i18next.t("partyUiHandler:illMissYou", {
        pokemonName: pokemonName,
      });
    }
    if (rand < 116) {
      return i18next.t("partyUiHandler:illNeverForgetYou", {
        pokemonName: pokemonName,
      });
    }
    if (rand < 124) {
      return i18next.t("partyUiHandler:untilWeMeetAgain", {
        pokemonName: pokemonName,
      });
    }
    if (rand < 127) {
      return i18next.t("partyUiHandler:sayonara", { pokemonName: pokemonName });
    }
    return i18next.t("partyUiHandler:smellYaLater", {
      pokemonName: pokemonName,
    });
  }

  getFormChangeItemsModifiers(pokemon: Pokemon) {
    let formChangeItemModifiers = globalScene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier && m.pokemonId === pokemon.id,
    ) as PokemonFormChangeItemModifier[];
    const ultraNecrozmaModifiers = formChangeItemModifiers.filter(
      m => m.active && m.formChangeItem === FormChangeItem.ULTRANECROZIUM_Z,
    );
    if (ultraNecrozmaModifiers.length > 0) {
      // ULTRANECROZIUM_Z is active and deactivating it should be the only option
      return ultraNecrozmaModifiers;
    }
    if (formChangeItemModifiers.find(m => m.active)) {
      // a form is currently active. the user has to disable the form or activate ULTRANECROZIUM_Z
      formChangeItemModifiers = formChangeItemModifiers.filter(
        m => m.active || m.formChangeItem === FormChangeItem.ULTRANECROZIUM_Z,
      );
    } else if (pokemon.species.speciesId === Species.NECROZMA) {
      // no form is currently active. the user has to activate some form, except ULTRANECROZIUM_Z
      formChangeItemModifiers = formChangeItemModifiers.filter(
        m => m.formChangeItem !== FormChangeItem.ULTRANECROZIUM_Z,
      );
    }
    return formChangeItemModifiers;
  }

  getOptionsCursorWithScroll(): number {
    return (
      this.optionsCursor +
      this.optionsScrollCursor +
      (this.options && this.options[0] === PartyOption.SCROLL_UP ? -1 : 0)
    );
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
    this.showText("", 0);
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
  private slotIndex: number;
  private pokemon: PlayerPokemon;

  private slotBg: Phaser.GameObjects.Image;
  private slotPb: Phaser.GameObjects.Sprite;
  public slotName: Phaser.GameObjects.Text;
  public slotHpBar: Phaser.GameObjects.Image;
  public slotHpOverlay: Phaser.GameObjects.Sprite;
  public slotHpText: Phaser.GameObjects.Text;
  public slotDescriptionLabel: Phaser.GameObjects.Text; // this is used to show text instead of the HP bar i.e. for showing "Able"/"Not Able" for TMs when you try to learn them

  private pokemonIcon: Phaser.GameObjects.Container;
  private iconAnimHandler: PokemonIconAnimHandler;

  constructor(
    slotIndex: number,
    pokemon: PlayerPokemon,
    iconAnimHandler: PokemonIconAnimHandler,
    partyUiMode: PartyUiMode,
    tmMoveId: Moves,
  ) {
    super(
      globalScene,
      slotIndex >= globalScene.currentBattle.getBattlerCount() ? 230.5 : 64,
      slotIndex >= globalScene.currentBattle.getBattlerCount()
        ? -184 +
            (globalScene.currentBattle.double ? -40 : 0) +
            (28 + (globalScene.currentBattle.double ? 8 : 0)) * slotIndex
        : -124 + (globalScene.currentBattle.double ? -8 : 0) + slotIndex * 64,
    );

    this.slotIndex = slotIndex;
    this.pokemon = pokemon;
    this.iconAnimHandler = iconAnimHandler;

    this.setup(partyUiMode, tmMoveId);
  }

  getPokemon(): PlayerPokemon {
    return this.pokemon;
  }

  setup(partyUiMode: PartyUiMode, tmMoveId: Moves) {
    const currentLanguage = i18next.resolvedLanguage ?? "en";
    const offsetJa = currentLanguage === "ja";

    const battlerCount = globalScene.currentBattle.getBattlerCount();

    const slotKey = `party_slot${this.slotIndex >= battlerCount ? "" : "_main"}`;

    const slotBg = globalScene.add.sprite(0, 0, slotKey, `${slotKey}${this.pokemon.hp ? "" : "_fnt"}`);
    this.slotBg = slotBg;

    this.add(slotBg);

    const slotPb = globalScene.add.sprite(
      this.slotIndex >= battlerCount ? -85.5 : -51,
      this.slotIndex >= battlerCount ? 0 : -20.5,
      "party_pb",
    );
    this.slotPb = slotPb;

    this.add(slotPb);

    this.pokemonIcon = globalScene.addPokemonIcon(this.pokemon, slotPb.x, slotPb.y, 0.5, 0.5, true);

    this.add(this.pokemonIcon);

    this.iconAnimHandler.addOrUpdate(this.pokemonIcon, PokemonIconAnimMode.PASSIVE);

    const slotInfoContainer = globalScene.add.container(0, 0);
    this.add(slotInfoContainer);

    let displayName = this.pokemon.getNameToRender(false);
    let nameTextWidth: number;

    const nameSizeTest = addTextObject(0, 0, displayName, TextStyle.PARTY);
    nameTextWidth = nameSizeTest.displayWidth;

    while (nameTextWidth > (this.slotIndex >= battlerCount ? 52 : 76 - (this.pokemon.fusionSpecies ? 8 : 0))) {
      displayName = `${displayName.slice(0, displayName.endsWith(".") ? -2 : -1).trimEnd()}.`;
      nameSizeTest.setText(displayName);
      nameTextWidth = nameSizeTest.displayWidth;
    }

    nameSizeTest.destroy();

    this.slotName = addTextObject(0, 0, displayName, TextStyle.PARTY);
    this.slotName.setPositionRelative(
      slotBg,
      this.slotIndex >= battlerCount ? 21 : 24,
      (this.slotIndex >= battlerCount ? 2 : 10) + (offsetJa ? 2 : 0),
    );
    this.slotName.setOrigin(0, 0);

    const slotLevelLabel = globalScene.add.image(0, 0, "party_slot_overlay_lv");
    slotLevelLabel.setPositionRelative(
      slotBg,
      (this.slotIndex >= battlerCount ? 21 : 24) + 8,
      (this.slotIndex >= battlerCount ? 2 : 10) + 12,
    );
    slotLevelLabel.setOrigin(0, 0);

    const slotLevelText = addTextObject(
      0,
      0,
      this.pokemon.level.toString(),
      this.pokemon.level < globalScene.getMaxExpLevel() ? TextStyle.PARTY : TextStyle.PARTY_RED,
    );
    slotLevelText.setPositionRelative(slotLevelLabel, 9, offsetJa ? 1.5 : 0);
    slotLevelText.setOrigin(0, 0.25);

    slotInfoContainer.add([this.slotName, slotLevelLabel, slotLevelText]);

    const genderSymbol = getGenderSymbol(this.pokemon.getGender(true));

    if (genderSymbol) {
      const slotGenderText = addTextObject(0, 0, genderSymbol, TextStyle.PARTY);
      slotGenderText.setColor(getGenderColor(this.pokemon.getGender(true)));
      slotGenderText.setShadowColor(getGenderColor(this.pokemon.getGender(true), true));
      if (this.slotIndex >= battlerCount) {
        slotGenderText.setPositionRelative(slotLevelLabel, 36, 0);
      } else {
        slotGenderText.setPositionRelative(this.slotName, 76 - (this.pokemon.fusionSpecies ? 8 : 0), 3);
      }
      slotGenderText.setOrigin(0, 0.25);

      slotInfoContainer.add(slotGenderText);
    }

    if (this.pokemon.fusionSpecies) {
      const splicedIcon = globalScene.add.image(0, 0, "icon_spliced");
      splicedIcon.setScale(0.5);
      splicedIcon.setOrigin(0, 0);
      if (this.slotIndex >= battlerCount) {
        splicedIcon.setPositionRelative(slotLevelLabel, 36 + (genderSymbol ? 8 : 0), 0.5);
      } else {
        splicedIcon.setPositionRelative(this.slotName, 76, 3.5);
      }

      slotInfoContainer.add(splicedIcon);
    }

    if (this.pokemon.status) {
      const statusIndicator = globalScene.add.sprite(0, 0, getLocalizedSpriteKey("statuses"));
      statusIndicator.setFrame(StatusEffect[this.pokemon.status?.effect].toLowerCase());
      statusIndicator.setOrigin(0, 0);
      statusIndicator.setPositionRelative(slotLevelLabel, this.slotIndex >= battlerCount ? 43 : 55, 0);

      slotInfoContainer.add(statusIndicator);
    }

    if (this.pokemon.isShiny()) {
      const doubleShiny = this.pokemon.isDoubleShiny(false);

      const shinyStar = globalScene.add.image(0, 0, `shiny_star_small${doubleShiny ? "_1" : ""}`);
      shinyStar.setOrigin(0, 0);
      shinyStar.setPositionRelative(this.slotName, -9, 3);
      shinyStar.setTint(getVariantTint(this.pokemon.getBaseVariant(doubleShiny)));

      slotInfoContainer.add(shinyStar);

      if (doubleShiny) {
        const fusionShinyStar = globalScene.add.image(0, 0, "shiny_star_small_2");
        fusionShinyStar.setOrigin(0, 0);
        fusionShinyStar.setPosition(shinyStar.x, shinyStar.y);
        fusionShinyStar.setTint(
          getVariantTint(this.pokemon.summonData.illusion?.basePokemon.fusionVariant ?? this.pokemon.fusionVariant),
        );

        slotInfoContainer.add(fusionShinyStar);
      }
    }

    this.slotHpBar = globalScene.add.image(0, 0, "party_slot_hp_bar");
    this.slotHpBar.setPositionRelative(
      slotBg,
      this.slotIndex >= battlerCount ? 72 : 8,
      this.slotIndex >= battlerCount ? 6 : 31,
    );
    this.slotHpBar.setOrigin(0, 0);
    this.slotHpBar.setVisible(false);

    const hpRatio = this.pokemon.getHpRatio();

    this.slotHpOverlay = globalScene.add.sprite(
      0,
      0,
      "party_slot_hp_overlay",
      hpRatio > 0.5 ? "high" : hpRatio > 0.25 ? "medium" : "low",
    );
    this.slotHpOverlay.setPositionRelative(this.slotHpBar, 16, 2);
    this.slotHpOverlay.setOrigin(0, 0);
    this.slotHpOverlay.setScale(hpRatio, 1);
    this.slotHpOverlay.setVisible(false);

    this.slotHpText = addTextObject(0, 0, `${this.pokemon.hp}/${this.pokemon.getMaxHp()}`, TextStyle.PARTY);
    this.slotHpText.setPositionRelative(
      this.slotHpBar,
      this.slotHpBar.width - 3,
      this.slotHpBar.height - 2 + (offsetJa ? 2 : 0),
    );
    this.slotHpText.setOrigin(1, 0);
    this.slotHpText.setVisible(false);

    this.slotDescriptionLabel = addTextObject(0, 0, "", TextStyle.MESSAGE);
    this.slotDescriptionLabel.setPositionRelative(
      slotBg,
      this.slotIndex >= battlerCount ? 94 : 32,
      this.slotIndex >= battlerCount ? 16 : 46,
    );
    this.slotDescriptionLabel.setOrigin(0, 1);
    this.slotDescriptionLabel.setVisible(false);

    slotInfoContainer.add([this.slotHpBar, this.slotHpOverlay, this.slotHpText, this.slotDescriptionLabel]);

    if (partyUiMode !== PartyUiMode.TM_MODIFIER) {
      this.slotDescriptionLabel.setVisible(false);
      this.slotHpBar.setVisible(true);
      this.slotHpOverlay.setVisible(true);
      this.slotHpText.setVisible(true);
    } else {
      this.slotHpBar.setVisible(false);
      this.slotHpOverlay.setVisible(false);
      this.slotHpText.setVisible(false);
      let slotTmText: string;

      if (this.pokemon.getMoveset().filter(m => m.moveId === tmMoveId).length > 0) {
        slotTmText = i18next.t("partyUiHandler:learned");
      } else if (this.pokemon.compatibleTms.indexOf(tmMoveId) === -1) {
        slotTmText = i18next.t("partyUiHandler:notAble");
      } else {
        slotTmText = i18next.t("partyUiHandler:able");
      }

      this.slotDescriptionLabel.setText(slotTmText);
      this.slotDescriptionLabel.setVisible(true);
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
    const battlerCount = globalScene.currentBattle.getBattlerCount();
    this.slotBg.setTexture(
      `party_slot${this.slotIndex >= battlerCount ? "" : "_main"}`,
      `party_slot${this.slotIndex >= battlerCount ? "" : "_main"}${this.transfer ? "_swap" : this.pokemon.hp ? "" : "_fnt"}${this.selected ? "_sel" : ""}`,
    );
  }
}

class PartyCancelButton extends Phaser.GameObjects.Container {
  private selected: boolean;

  private partyCancelBg: Phaser.GameObjects.Sprite;
  private partyCancelPb: Phaser.GameObjects.Sprite;

  constructor(x: number, y: number) {
    super(globalScene, x, y);

    this.setup();
  }

  setup() {
    const partyCancelBg = globalScene.add.sprite(0, 0, "party_cancel");
    this.add(partyCancelBg);

    this.partyCancelBg = partyCancelBg;

    const partyCancelPb = globalScene.add.sprite(-17, 0, "party_pb");
    this.add(partyCancelPb);

    this.partyCancelPb = partyCancelPb;

    const partyCancelText = addTextObject(-8, -7, i18next.t("partyUiHandler:cancel"), TextStyle.PARTY);
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
