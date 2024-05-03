import BattleScene, { Button } from "../battle-scene";
import { gameModes } from "../game-mode";
import { SessionSaveData } from "../system/game-data";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";
import * as Utils from "../utils";
import PokemonData from "../system/pokemon-data";
import { PokemonHeldItemModifier } from "../modifier/modifier";
import MessageUiHandler from "./message-ui-handler";

const sessionSlotCount = 5;

export enum SaveSlotUiMode {
  LOAD,
  SAVE
}

export type SaveSlotSelectCallback = (cursor: integer) => void;

export default class SaveSlotSelectUiHandler extends MessageUiHandler {

  private saveSlotSelectContainer: Phaser.GameObjects.Container;
  private sessionSlotsContainer: Phaser.GameObjects.Container;
  private saveSlotSelectMessageBox: Phaser.GameObjects.NineSlice;
  private saveSlotSelectMessageBoxContainer: Phaser.GameObjects.Container;
  private sessionSlots: SessionSlot[];

  private uiMode: SaveSlotUiMode;
  private saveSlotSelectCallback: SaveSlotSelectCallback;

  private scrollCursor: integer = 0;

  private cursorObj: Phaser.GameObjects.NineSlice;

  private sessionSlotsContainerInitialY: number;

  constructor(scene: BattleScene) {
    super(scene, Mode.SAVE_SLOT);
  }

  setup() {
    const ui = this.getUi();

    this.saveSlotSelectContainer = this.scene.add.container(0, 0);
    this.saveSlotSelectContainer.setVisible(false);
    ui.add(this.saveSlotSelectContainer);

    const loadSessionBg = this.scene.add.rectangle(0, 0, this.scene.game.canvas.width / 6, -this.scene.game.canvas.height / 6, 0x006860);
    loadSessionBg.setOrigin(0, 0);
    this.saveSlotSelectContainer.add(loadSessionBg);

    this.sessionSlotsContainerInitialY = -this.scene.game.canvas.height / 6 + 8;

    this.sessionSlotsContainer = this.scene.add.container(8, this.sessionSlotsContainerInitialY);
    this.saveSlotSelectContainer.add(this.sessionSlotsContainer);

    this.saveSlotSelectMessageBoxContainer = this.scene.add.container(0, 0);
    this.saveSlotSelectMessageBoxContainer.setVisible(false);
    this.saveSlotSelectContainer.add(this.saveSlotSelectMessageBoxContainer);

    this.saveSlotSelectMessageBox = addWindow(this.scene, 1, -1, 318, 28);
    this.saveSlotSelectMessageBox.setOrigin(0, 1);
    this.saveSlotSelectMessageBoxContainer.add(this.saveSlotSelectMessageBox);

    this.message = addTextObject(this.scene, 8, 8, '', TextStyle.WINDOW, { maxLines: 2 });
    this.message.setOrigin(0, 0);
    this.saveSlotSelectMessageBoxContainer.add(this.message);

    this.sessionSlots = [];
  }

  show(args: any[]): boolean {
    if ((args.length < 2 || !(args[1] instanceof Function)))
      return false;

    super.show(args);

    this.uiMode = args[0] as SaveSlotUiMode;;
    this.saveSlotSelectCallback = args[1] as SaveSlotSelectCallback;

    this.saveSlotSelectContainer.setVisible(true);
    this.populateSessionSlots();
    this.setScrollCursor(0);
    this.setCursor(0);

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    let error = false;

    if (button === Button.ACTION || button === Button.CANCEL) {
      const originalCallback = this.saveSlotSelectCallback;
      if (button === Button.ACTION) {
        const cursor = this.cursor + this.scrollCursor;
        if (this.uiMode === SaveSlotUiMode.LOAD && !this.sessionSlots[cursor].hasData)
          error = true;
        else {
          switch (this.uiMode) {
            case SaveSlotUiMode.LOAD:
              this.saveSlotSelectCallback = null;
              originalCallback(cursor);
              break;
            case SaveSlotUiMode.SAVE:
              const saveAndCallback = () => {
                const originalCallback = this.saveSlotSelectCallback;
                this.saveSlotSelectCallback = null;
                ui.revertMode();
                ui.showText(null, 0);
                ui.setMode(Mode.MESSAGE);
                originalCallback(cursor);
              };
              if (this.sessionSlots[cursor].hasData) {
                ui.showText('Overwrite the data in the selected slot?', null, () => {
                  ui.setOverlayMode(Mode.CONFIRM, () => saveAndCallback(), () => {
                    ui.revertMode();
                    ui.showText(null, 0);
                  }, false, 0, 19, 2000);
                });
              } else if (this.sessionSlots[cursor].hasData === false)
                saveAndCallback();
              else
                return false;
              break;
          }
          success = true;
        }
      } else {
        this.saveSlotSelectCallback = null;
        originalCallback(-1);
        success = true;
      }
    } else {
      switch (button) {
        case Button.UP:
          if (this.cursor)
            success = this.setCursor(this.cursor - 1);
          else if (this.scrollCursor)
            success = this.setScrollCursor(this.scrollCursor - 1);
          break;
        case Button.DOWN:
          if (this.cursor < 2)
            success = this.setCursor(this.cursor + 1);
          else if (this.scrollCursor < sessionSlotCount - 3)
            success = this.setScrollCursor(this.scrollCursor + 1);
          break;
      }
    }

    if (success)
      ui.playSelect();
    else if (error)
      ui.playError();

    return success || error;
  }

  populateSessionSlots() {
    for (let s = 0; s < sessionSlotCount; s++) {
      const sessionSlot = new SessionSlot(this.scene, s);
      sessionSlot.load();
      this.scene.add.existing(sessionSlot);
      this.sessionSlotsContainer.add(sessionSlot);
      this.sessionSlots.push(sessionSlot);
    }
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);

    if (text?.indexOf('\n') === -1) {
      this.saveSlotSelectMessageBox.setSize(318, 28);
      this.message.setY(-22);
    } else {
      this.saveSlotSelectMessageBox.setSize(318, 42);
      this.message.setY(-37);
    }

    this.saveSlotSelectMessageBoxContainer.setVisible(!!text?.length);
  }
  
  setCursor(cursor: integer): boolean {
    let changed = super.setCursor(cursor);
    
    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.nineslice(0, 0, 'select_cursor_highlight_thick', null, 296, 44, 6, 6, 6, 6);
      this.cursorObj.setOrigin(0, 0);
      this.sessionSlotsContainer.add(this.cursorObj);
    }
    this.cursorObj.setPosition(4, 4 + (cursor + this.scrollCursor) * 56);

    return changed;
  }

  setScrollCursor(scrollCursor: integer): boolean {
    let changed = scrollCursor !== this.scrollCursor;
    
    if (changed) {
      this.scrollCursor = scrollCursor;
      this.setCursor(this.cursor);
      this.scene.tweens.add({
        targets: this.sessionSlotsContainer,
        y: this.sessionSlotsContainerInitialY - 56 * scrollCursor,
        duration: Utils.fixedInt(325),
        ease: 'Sine.easeInOut'
      });
    }

    return changed;
  }

  clear() {
    super.clear();
    this.saveSlotSelectContainer.setVisible(false);
    this.eraseCursor();
    this.saveSlotSelectCallback = null;
    this.clearSessionSlots();
  }

  eraseCursor() {
    if (this.cursorObj)
      this.cursorObj.destroy();
    this.cursorObj = null;
  }

  clearSessionSlots() {
    this.sessionSlots.splice(0, this.sessionSlots.length);
    this.sessionSlotsContainer.removeAll(true);
  }
}

class SessionSlot extends Phaser.GameObjects.Container {
  public slotId: integer;
  public hasData: boolean;
  private loadingLabel: Phaser.GameObjects.Text;

  constructor(scene: BattleScene, slotId: integer) {
    super(scene, 0, slotId * 56);

    this.slotId = slotId;
    
    this.setup();
  }

  setup() {
    const slotWindow = addWindow(this.scene, 0, 0, 304, 52);
    this.add(slotWindow);

    this.loadingLabel = addTextObject(this.scene, 152, 26, 'Loading…', TextStyle.WINDOW);
    this.loadingLabel.setOrigin(0.5, 0.5);
    this.add(this.loadingLabel);
  }

  async setupWithData(data: SessionSaveData) {
    this.remove(this.loadingLabel, true);

    const gameModeLabel = addTextObject(this.scene, 8, 5, `${gameModes[data.gameMode].getName()} - Wave ${data.waveIndex}`, TextStyle.WINDOW);
    this.add(gameModeLabel);

    const timestampLabel = addTextObject(this.scene, 8, 19, new Date(data.timestamp).toLocaleString(), TextStyle.WINDOW);
    this.add(timestampLabel);

    const playTimeLabel = addTextObject(this.scene, 8, 33, Utils.getPlayTimeString(data.playTime), TextStyle.WINDOW);
    this.add(playTimeLabel);

    const pokemonIconsContainer = this.scene.add.container(144, 4);
    data.party.forEach((p: PokemonData, i: integer) => {
      const iconContainer = this.scene.add.container(26 * i, 0);
      iconContainer.setScale(0.75);

      const pokemon = p.toPokemon(this.scene);
      const icon = this.scene.addPokemonIcon(pokemon, 0, 0, 0, 0);

      const text = addTextObject(this.scene, 32, 20, `Lv${Utils.formatLargeNumber(pokemon.level, 1000)}`, TextStyle.PARTY, { fontSize: '54px', color: '#f8f8f8' });
      text.setShadow(0, 0, null);
      text.setStroke('#424242', 14);
      text.setOrigin(1, 0);

      iconContainer.add(icon);
      iconContainer.add(text);

      pokemonIconsContainer.add(iconContainer);

      pokemon.destroy();
    });

    this.add(pokemonIconsContainer);

    const modifiersModule = await import('../modifier/modifier');

    const modifierIconsContainer = this.scene.add.container(148, 30);
    modifierIconsContainer.setScale(0.5);
    let visibleModifierIndex = 0;
    for (let m of data.modifiers) {
      const modifier = m.toModifier(this.scene, modifiersModule[m.className]);
      if (modifier instanceof PokemonHeldItemModifier)
        continue;
      const icon = modifier.getIcon(this.scene, false);
      icon.setPosition(24 * visibleModifierIndex, 0);
      modifierIconsContainer.add(icon);
      if (++visibleModifierIndex === 12)
        break;
    }

    this.add(modifierIconsContainer);
  }

  load(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.scene.gameData.getSession(this.slotId).then(async sessionData => {
        if (!sessionData) {
          this.hasData = false;
          this.loadingLabel.setText('Empty');
          resolve(false);
          return;
        }
        this.hasData = true;
        await this.setupWithData(sessionData);
        resolve(true);
      });
    });
  }
}

interface SessionSlot {
  scene: BattleScene;
}