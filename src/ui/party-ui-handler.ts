import { CommandPhase } from "../battle-phases";
import BattleScene, { Button } from "../battle-scene";
import { PlayerPokemon, PokemonMove } from "../pokemon";
import { addTextObject, TextStyle } from "./text";
import { Command } from "./command-ui-handler";
import MessageUiHandler from "./message-ui-handler";
import { Mode } from "./ui";
import * as Utils from "../utils";
import { PokemonHeldItemModifier, SwitchEffectTransferModifier } from "../modifier/modifier";

const defaultMessage = 'Choose a Pokémon.';

export enum PartyUiMode {
  SWITCH,
  FAINT_SWITCH,
  POST_BATTLE_SWITCH,
  MODIFIER,
  MOVE_MODIFIER,
  MODIFIER_TRANSFER,
  RELEASE
}

export enum PartyOption {
  CANCEL = -1,
  SEND_OUT,
  PASS_BATON,
  APPLY,
  TRANSFER,
  SUMMARY,
  RELEASE,
  MOVE_1,
  MOVE_2,
  MOVE_3,
  MOVE_4
}

export type PartySelectCallback = (cursor: integer, option: PartyOption) => void;
export type PartyModifierTransferSelectCallback = (fromCursor: integer, index: integer, toCursor?: integer) => void;
export type PokemonSelectFilter = (pokemon: PlayerPokemon) => string;
export type PokemonModifierTransferSelectFilter = (pokemon: PlayerPokemon, modifier: PokemonHeldItemModifier) => string;
export type PokemonMoveSelectFilter = (pokemonMove: PokemonMove) => string;

export default class PartyUiHandler extends MessageUiHandler {
  private partyUiMode: PartyUiMode;

  private partyContainer: Phaser.GameObjects.Container;
  private partySlotsContainer: Phaser.GameObjects.Container;
  private partySlots: PartySlot[];
  private partyCancelButton: PartyCancelButton;
  private partyMessageBox: Phaser.GameObjects.Image;

  private optionsMode: boolean;
  private optionsCursor: integer;
  private optionsContainer: Phaser.GameObjects.Container;
  private optionsCursorObj: Phaser.GameObjects.Image;
  private options: integer[];

  private transferMode: boolean;
  private transferOptionCursor: integer;
  private transferCursor: integer;
  
  private lastCursor: integer = 0;
  private selectCallback: PartySelectCallback | PartyModifierTransferSelectCallback;
  private selectFilter: PokemonSelectFilter | PokemonModifierTransferSelectFilter;
  private moveSelectFilter: PokemonMoveSelectFilter;

  private static FilterAll = (_pokemon: PlayerPokemon) => null;

  public static FilterNonFainted = (pokemon: PlayerPokemon) => {
    if (!pokemon.hp)
      return `${pokemon.name} has no energy\nleft to battle!`;
    return null;
  };

  private static FilterAllMoves = (_pokemonMove: PokemonMove) => null;

  public static FilterItemMaxStacks = (pokemon: PlayerPokemon, modifier: PokemonHeldItemModifier) => {
    const matchingModifier = pokemon.scene.findModifier(m => m instanceof PokemonHeldItemModifier && (m as PokemonHeldItemModifier).matchType(modifier)) as PokemonHeldItemModifier;
    if (matchingModifier && matchingModifier.stackCount === matchingModifier.getMaxStackCount())
      return `${pokemon.name} has too many\nof this item!`;
    return null;
  };

  public static NoEffectMessage = 'It won\'t have any effect.';

  constructor(scene: BattleScene) {
    super(scene, Mode.PARTY);
  }

  setup() {
    const ui = this.getUi();

    const partyContainer = this.scene.add.container(0, 0);
    partyContainer.setVisible(false);
    ui.add(partyContainer);

    this.partyContainer = partyContainer;

    const partyBg = this.scene.add.image(0, 0, 'party_bg');
    partyContainer.add(partyBg);

    partyBg.setOrigin(0, 1);

    const partySlotsContainer = this.scene.add.container(0, 0);
    partyContainer.add(partySlotsContainer);

    this.partySlotsContainer = partySlotsContainer;

    const partyMessageBoxContainer = this.scene.add.container(0, -32);
    partyContainer.add(partyMessageBoxContainer);

    const partyMessageBox = this.scene.add.image(1, 31, 'party_message');
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

    this.options = [];

    this.partySlots = [];
  }

  show(args: any[]) {
    if (!args.length || this.active)
      return;

    super.show(args);

    this.partyUiMode = args[0] as PartyUiMode;

    this.partyContainer.setVisible(true);
    this.populatePartySlots();
    this.setCursor(this.cursor < 6 ? this.cursor : 0);

    if (args.length > 1 && args[1] instanceof Function)
      this.selectCallback = args[1];
    this.selectFilter = args.length > 2 && args[2] instanceof Function
      ? args[2] as PokemonSelectFilter
      : PartyUiHandler.FilterAll;
    this.moveSelectFilter = args.length > 3 && args[3] instanceof Function
      ? args[3] as PokemonMoveSelectFilter
      : PartyUiHandler.FilterAllMoves;
  }

  processInput(button: Button) {
    const ui = this.getUi();

    if (this.pendingPrompt)
      return;

    if (this.awaitingActionInput) {
      if (button === Button.ACTION || button === Button.CANCEL) {
        if (this.onActionInput) {
          ui.playSelect();
          const originalOnActionInput = this.onActionInput;
          this.onActionInput = null;
          originalOnActionInput();
          this.awaitingActionInput = false;
        }
      }
      return;
    }

    let success = false;

    if (this.optionsMode) {
      if (button === Button.ACTION) {
        const option = this.options[this.optionsCursor];
        const pokemon = this.scene.getParty()[this.cursor];
        if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER && !this.transferMode && option !== PartyOption.CANCEL) {
          this.startTransfer();
          this.clearOptions();
          ui.playSelect();
        } else if ((option !== PartyOption.SUMMARY && option !== PartyOption.RELEASE && option !== PartyOption.CANCEL)
          || (option === PartyOption.RELEASE && this.partyUiMode === PartyUiMode.RELEASE)) {
          let filterResult: string;
          if (option !== PartyOption.TRANSFER) {
            filterResult = (this.selectFilter as PokemonSelectFilter)(pokemon);
            if (filterResult === null && this.partyUiMode === PartyUiMode.MOVE_MODIFIER)
              filterResult = this.moveSelectFilter(pokemon.moveset[this.optionsCursor]);
          } else {
            const itemModifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
                && (m as PokemonHeldItemModifier).pokemonId === pokemon.id) as PokemonHeldItemModifier[];
            filterResult = (this.selectFilter as PokemonModifierTransferSelectFilter)(pokemon, itemModifiers[this.transferOptionCursor]);
          }
          if (filterResult === null) {
            this.clearOptions();
            if (this.selectCallback) {
              if (option === PartyOption.TRANSFER) {
                (this.selectCallback as PartyModifierTransferSelectCallback)(this.transferCursor, this.transferOptionCursor, this.cursor);
                this.clearTransfer();
              } else if (option === PartyOption.RELEASE)
                this.doRelease(this.cursor);
              else {
                const selectCallback = this.selectCallback;
                this.selectCallback = null;
                selectCallback(this.cursor, option);
              }
            } else if (this.cursor)
              (this.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.POKEMON, this.cursor, option === PartyOption.PASS_BATON);
            if (this.partyUiMode !== PartyUiMode.MODIFIER && this.partyUiMode !== PartyUiMode.MOVE_MODIFIER)
              ui.playSelect();
            return;
          } else {
            this.clearOptions();
            this.showText(filterResult as string, null, () => this.showText(null, 0), null, true);
          }
        } else if (option === PartyOption.SUMMARY) {
          ui.playSelect();
          ui.setModeWithoutClear(Mode.SUMMARY, pokemon).then(() =>  this.clearOptions());
        } else if (option === PartyOption.RELEASE) {
          this.clearOptions();
          ui.playSelect();
          if (this.cursor) {
            this.showText(`Do you really want to release ${pokemon.name}?`, null, () => {
              ui.setModeWithoutClear(Mode.CONFIRM, () => {
                ui.setMode(Mode.PARTY);
                this.doRelease(this.cursor);
              }, () => {
                ui.setMode(Mode.PARTY);
                this.showText(null, 0);
              });
            });
          } else
            this.showText('You can\'t release a POKéMON that\'s in battle!', null, () => this.showText(null, 0), null, true);
        } else if (option === PartyOption.CANCEL)
          this.processInput(Button.CANCEL);
      } else if (button === Button.CANCEL) {
        this.clearOptions();
        ui.playSelect();
      }
      else {
        switch (button) {
          case Button.UP:
            success = this.setCursor(this.optionsCursor ? this.optionsCursor - 1 : this.options.length - 1);
            break;
          case Button.DOWN:
            success = this.setCursor(this.optionsCursor < this.options.length - 1 ? this.optionsCursor + 1 : 0);
            break;
        }
      }
    } else {
      if (button === Button.ACTION) {
        if (this.cursor < 6) {
          this.showOptions();
          ui.playSelect();
        } else if (this.partyUiMode === PartyUiMode.FAINT_SWITCH)
          ui.playError();
        else
          this.processInput(Button.CANCEL);
        return;
      } else if (button === Button.CANCEL) {
        if (this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER && this.transferMode) {
          this.clearTransfer();
          ui.playSelect();
        } else if (this.partyUiMode !== PartyUiMode.FAINT_SWITCH) {
          if (this.selectCallback) {
            const selectCallback = this.selectCallback;
            this.selectCallback = null;
            selectCallback(6, PartyOption.CANCEL);
            ui.playSelect();
          } else {
            ui.setMode(Mode.COMMAND);
            ui.playSelect();
          }
        }
        return;
      }

      const slotCount = this.partySlots.length;

      switch (button) {
        case Button.UP:
          success = this.setCursor(this.cursor ? this.cursor < 6 ? this.cursor - 1 : slotCount - 1 : 6);
          break;
        case Button.DOWN:
          success = this.setCursor(this.cursor < 6 ? this.cursor < slotCount - 1 ? this.cursor + 1 : 6 : 0);
          break;
        case Button.LEFT:
          if (this.cursor && this.cursor < 6)
            success = this.setCursor(0);
          break;
        case Button.RIGHT:
          if (!this.cursor)
            success = this.setCursor(this.lastCursor < 6 ? this.lastCursor || 1 : 1);
          break;
      }
    }

    if (success)
      ui.playSelect();
  }

  populatePartySlots() {
    const party = this.scene.getParty();

    if (this.cursor < 6 && this.cursor >= party.length)
      this.cursor = party.length - 1;
    else if (this.cursor === 6)
      this.partyCancelButton.select();

    for (let p in party) {
      const slotIndex = parseInt(p);
      const partySlot = new PartySlot(this.scene, slotIndex, party[p]);
      this.scene.add.existing(partySlot);
      this.partySlotsContainer.add(partySlot);
      this.partySlots.push(partySlot);
      if (this.cursor === slotIndex)
        partySlot.select();
    }
  }
  
  setCursor(cursor: integer): boolean {
    let changed: boolean;
    
    if (this.optionsMode) {
      changed = this.optionsCursor !== cursor;
      this.optionsCursor = cursor;
      if (!this.optionsCursorObj) {
        this.optionsCursorObj = this.scene.add.image(0, 0, 'cursor');
        this.optionsCursorObj.setOrigin(0, 0);
        this.optionsContainer.add(this.optionsCursorObj);
      }
      const wideOptions = this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER;
      this.optionsCursorObj.setPosition(-86 - (wideOptions ? 50 : 0), -19 - (16 * ((this.options.length - 1) - this.optionsCursor)));
    } else {
      changed = this.cursor !== cursor;
      if (changed) {
        this.lastCursor = this.cursor;
        this.cursor = cursor;
        if (this.lastCursor < 6)
          this.partySlots[this.lastCursor].deselect();
        else if (this.lastCursor === 6)
          this.partyCancelButton.deselect();
        if (cursor < 6)
          this.partySlots[cursor].select();
        else if (cursor === 6)
          this.partyCancelButton.select();
      }
    }

    return changed;
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    if (text === null)
      text = defaultMessage;

    if (text?.indexOf('\n') === -1) {
      this.partyMessageBox.setTexture('party_message');
      this.message.setY(10);
    } else {
      this.partyMessageBox.setTexture('party_message_large');
      this.message.setY(-5);
    }

    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  showOptions() {
    if (this.cursor === 6)
      return;
    
    this.optionsMode = true;

    const wideOptions = this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER;

    this.partyMessageBox.setTexture(`party_message_options${wideOptions ? '_wide' : ''}`);

    let optionsMessage = 'Do what with this Pokémon?';

    switch (this.partyUiMode) {
      case PartyUiMode.MOVE_MODIFIER:
        optionsMessage = 'Select a move.';
        break;
      case PartyUiMode.MODIFIER_TRANSFER:
        if (!this.transferMode)
          optionsMessage = 'Select a held item to transfer.';
        break;
    }

    this.showText(optionsMessage, 0);

    const optionsBottom = this.scene.add.image(0, 0, `party_options${wideOptions ? '_wide' : ''}_bottom`);
    optionsBottom.setOrigin(1, 1);
    this.optionsContainer.add(optionsBottom);

    const pokemon = this.scene.getParty()[this.cursor];

    const itemModifiers = this.partyUiMode === PartyUiMode.MODIFIER_TRANSFER
      ? this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier && (m as PokemonHeldItemModifier).pokemonId === pokemon.id) as PokemonHeldItemModifier[]
      : null;

    if (this.partyUiMode !== PartyUiMode.MOVE_MODIFIER && (this.transferMode || this.partyUiMode !== PartyUiMode.MODIFIER_TRANSFER)) {
      switch (this.partyUiMode) {
        case PartyUiMode.SWITCH:
        case PartyUiMode.FAINT_SWITCH:
        case PartyUiMode.POST_BATTLE_SWITCH:
          if (this.cursor) {
            this.options.push(PartyOption.SEND_OUT);
            if (this.partyUiMode !== PartyUiMode.FAINT_SWITCH
                && this.scene.findModifier(m => m instanceof SwitchEffectTransferModifier && (m as SwitchEffectTransferModifier).pokemonId === this.scene.getPlayerPokemon().id))
              this.options.push(PartyOption.PASS_BATON);
          }
          break;
        case PartyUiMode.MODIFIER:
          this.options.push(PartyOption.APPLY);
          break;
        case PartyUiMode.MODIFIER_TRANSFER:
          this.options.push(PartyOption.TRANSFER);
          break;
        case PartyUiMode.RELEASE:
          this.options.push(PartyOption.RELEASE);
          break;
      }

      this.options.push(PartyOption.SUMMARY);

      if (this.partyUiMode === PartyUiMode.SWITCH)
        this.options.push(PartyOption.RELEASE);
    } else if (this.partyUiMode === PartyUiMode.MOVE_MODIFIER) {
      for (let m = 0; m < pokemon.moveset.length; m++)
        this.options.push(PartyOption.MOVE_1 + m);
    } else {
      for (let im = 0; im < itemModifiers.length; im++)
        this.options.push(im);
    }

    this.options.push(PartyOption.CANCEL);

    for (let o = 0; o < this.options.length; o++) {
      const option = this.options[this.options.length - (o + 1)];
      let optionName: string;
      if (this.partyUiMode !== PartyUiMode.MODIFIER_TRANSFER || this.transferMode || option === PartyOption.CANCEL) {
        switch (option) {
          case PartyOption.MOVE_1:
          case PartyOption.MOVE_2:
          case PartyOption.MOVE_3:
          case PartyOption.MOVE_4:
            optionName = pokemon.moveset[option - PartyOption.MOVE_1].getName();
            break;
          default:
            optionName = PartyOption[option].replace(/\_/g, ' ');
            break;
        }
      } else {
        const itemModifier = itemModifiers[option];
        optionName = itemModifier.type.name;
        if (itemModifier.stackCount > 1)
          optionName += ` (${itemModifier.stackCount})`;
      }

      const yCoord = -6 - 16 * o;
      const optionBg = this.scene.add.image(0, yCoord, `party_options${wideOptions ? '_wide' : ''}_center`);
      const optionText = addTextObject(this.scene, -79 - (wideOptions ? 50 : 0), yCoord - 16, optionName, TextStyle.WINDOW);

      optionBg.setOrigin(1, 1);
      optionText.setOrigin(0, 0);

      this.optionsContainer.add(optionBg);
      this.optionsContainer.add(optionText);
    }

    const optionsTop = this.scene.add.image(0, -6 - 16 * this.options.length, `party_options${wideOptions ? '_wide' : ''}_top`);
    optionsTop.setOrigin(1, 1);
    this.optionsContainer.add(optionsTop);

    this.setCursor(0);
  }

  startTransfer(): void {
    this.transferMode = true;
    this.transferCursor = this.cursor;
    this.transferOptionCursor = this.optionsCursor;

    this.partySlots[this.transferCursor].setTransfer(true);
  }

  clearTransfer(): void {
    this.transferMode = false;
    this.partySlots[this.transferCursor].setTransfer(false);
  }

  doRelease(slotIndex: integer): void {
    this.showText(this.getReleaseMessage(this.scene.getParty()[slotIndex].name), null, () => {
      this.clearPartySlots();
      this.scene.removePartyMemberModifiers(slotIndex);
      const releasedPokemon = this.scene.getParty().splice(slotIndex, 1)[0];
      releasedPokemon.destroy();
      this.populatePartySlots();
      if (this.cursor >= this.scene.getParty().length)
        this.setCursor(this.cursor - 1);
      if (this.partyUiMode === PartyUiMode.RELEASE) {
        const selectCallback = this.selectCallback;
        this.selectCallback = null;
        selectCallback(this.cursor, PartyOption.RELEASE);
      } else
        this.showText(null, 0);
    }, null, true);
  }

  getReleaseMessage(pokemonName: string): string {
    const rand = Utils.randInt(128);
    if (rand < 20)
      return `Goodbye, ${pokemonName}!`;
    else if (rand < 40)
      return `Byebye, ${pokemonName}!`;
    else if (rand < 60)
      return `Farewell, ${pokemonName}!`;
    else if (rand < 80)
      return `So long, ${pokemonName}!`;
    else if (rand < 100)
      return `This is where we part, ${pokemonName}!`;
    else if (rand < 108)
      return `I'll miss you, ${pokemonName}!`;
    else if (rand < 116)
      return `I'll never forget you, ${pokemonName}!`;
    else if (rand < 124)
      return `Until we meet again, ${pokemonName}!`;
    else if (rand < 127)
      return `Sayonara, ${pokemonName}!`
    else
      return `Smell ya later, ${pokemonName}!`;
  }

  clearOptions() {
    this.optionsMode = false;
    this.options.splice(0, this.options.length);
    this.optionsContainer.removeAll(true);
    this.eraseOptionsCursor();

    this.partyMessageBox.setTexture('party_message');
    this.showText(null, 0);
  }

  eraseOptionsCursor() {
    if (this.optionsCursorObj)
      this.optionsCursorObj.destroy();
    this.optionsCursorObj = null;
  }

  clear() {
    super.clear();
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
  private slotPokemonIcon: Phaser.GameObjects.Sprite;
  private slotHpOverlay: Phaser.GameObjects.Sprite;

  constructor(scene: BattleScene, slotIndex: integer, pokemon: PlayerPokemon) {
    super(scene, slotIndex ? 230.5 : 64, slotIndex ? -184 + 28 * slotIndex : -124);

    this.slotIndex = slotIndex;
    this.pokemon = pokemon;
    
    this.setup();
  }

  setup() {
    const slotKey = `party_slot${this.slotIndex ? '' : '_main'}`;

    const slotBg = this.scene.add.sprite(0, 0, slotKey, `${slotKey}${this.pokemon.hp ? '' : '_fnt'}`);
    this.slotBg = slotBg;

    this.add(slotBg);

    const slotPb = this.scene.add.sprite(this.slotIndex ? -85.5 : -51, this.slotIndex ? 0 : -20.5, 'party_pb');
    this.slotPb = slotPb;

    this.add(slotPb);

    const pokemonIcon = this.scene.add.sprite(slotPb.x, slotPb.y, this.pokemon.species.getIconAtlasKey());
    pokemonIcon.play(this.pokemon.getIconKey());
    this.slotPokemonIcon = pokemonIcon;

    this.add(pokemonIcon);

    const slotInfoContainer = this.scene.add.container(0, 0);
    this.add(slotInfoContainer);

    const slotName = addTextObject(this.scene, 0, 0, this.pokemon.name, TextStyle.PARTY);
    slotName.setPositionRelative(slotBg, this.slotIndex ? 21 : 24, this.slotIndex ? 3 : 10);
    slotName.setOrigin(0, 0);

    const slotLevelLabel = this.scene.add.image(0, 0, 'party_slot_overlay_lv');
    slotLevelLabel.setPositionRelative(slotName, 8, 12);
    slotLevelLabel.setOrigin(0, 0);

    const slotLevelText = addTextObject(this.scene, 0, 0, this.pokemon.level.toString(), TextStyle.PARTY);
    slotLevelText.setPositionRelative(slotLevelLabel, 9, 0);
    slotLevelText.setOrigin(0, 0.25);

    const slotHpBar = this.scene.add.image(0, 0, 'party_slot_hp_bar');
    slotHpBar.setPositionRelative(slotBg, this.slotIndex ? 72 : 8, this.slotIndex ? 7 : 31);
    slotHpBar.setOrigin(0, 0);

    const hpRatio = this.pokemon.getHpRatio();

    const slotHpOverlay = this.scene.add.sprite(0, 0, 'party_slot_hp_overlay', hpRatio > 0.5 ? 'high' : hpRatio > 0.25 ? 'medium' : 'low');
    slotHpOverlay.setPositionRelative(slotHpBar, 16, 2);
    slotHpOverlay.setOrigin(0, 0);
    slotHpOverlay.setScale(hpRatio, 1);

    const slotHpText = addTextObject(this.scene, 0, 0, `${this.pokemon.hp}/${this.pokemon.getMaxHp()}`, TextStyle.PARTY);
    slotHpText.setPositionRelative(slotHpBar, slotHpBar.width - 3, slotHpBar.height - 2);
    slotHpText.setOrigin(1, 0);

    slotInfoContainer.add([ slotName, slotLevelLabel, slotLevelText, slotHpBar, slotHpOverlay, slotHpText ]);

    this.slotHpOverlay = slotHpOverlay;
  }

  select(): void {
    if (this.selected)
      return;

    this.selected = true;

    this.updateSlotTexture();
    this.slotPb.setFrame('party_pb_sel');
  }

  deselect(): void {
    if (!this.selected)
      return;

    this.selected = false;

    this.updateSlotTexture();
    this.slotPb.setFrame('party_pb');
  }

  setTransfer(transfer: boolean): void {
    if (this.transfer === transfer)
      return;

    this.transfer = transfer;
    this.updateSlotTexture();
  }

  private updateSlotTexture(): void {
    this.slotBg.setTexture(`party_slot${this.slotIndex ? '' : '_main'}`,
      `party_slot${this.slotIndex ? '' : '_main'}${this.transfer ? '_swap' : this.pokemon.hp ? '' : '_fnt'}${this.selected ? '_sel' : ''}`);
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
    const partyCancelBg = this.scene.add.sprite(0, 0, 'party_cancel');
    this.add(partyCancelBg);

    this.partyCancelBg = partyCancelBg;

    const partyCancelPb = this.scene.add.sprite(-17, 0, 'party_pb');
    this.add(partyCancelPb);

    this.partyCancelPb = partyCancelPb;

    const partyCancelText = addTextObject(this.scene, -7, -6, 'CANCEL', TextStyle.PARTY);
    this.add(partyCancelText);
  }

  select() {
    if (this.selected)
      return;

    this.selected = true;

    this.partyCancelBg.setFrame(`party_cancel_sel`);
    this.partyCancelPb.setFrame('party_pb_sel');
  }

  deselect() {
    if (!this.selected)
      return;

    this.selected = false;

    this.partyCancelBg.setFrame('party_cancel');
    this.partyCancelPb.setFrame('party_pb');
  }
}