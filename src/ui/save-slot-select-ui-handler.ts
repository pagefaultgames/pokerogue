import i18next from "i18next";
import BattleScene from "../battle-scene";
import { Button } from "#enums/buttons";
import { GameMode } from "../game-mode";
import * as Modifier from "../modifier/modifier";
import { SessionSaveData } from "../system/game-data";
import PokemonData from "../system/pokemon-data";
import * as Utils from "../utils";
import MessageUiHandler from "./message-ui-handler";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";
import * as LoggerTools from "../logger"
import { loggedInUser } from "#app/account.js";
import { allpanels, biomePanelIDs } from "../loading-scene"
import { getBiomeName } from "#app/data/biomes.js";

const sessionSlotCount = 5;

export enum SaveSlotUiMode {
  LOAD,
  SAVE
}

export type SaveSlotSelectCallback = (cursor: integer, cursor2?: integer) => void;

export default class SaveSlotSelectUiHandler extends MessageUiHandler {

  private saveSlotSelectContainer: Phaser.GameObjects.Container;
  private sessionSlotsContainer: Phaser.GameObjects.Container;
  private saveSlotSelectMessageBox: Phaser.GameObjects.NineSlice;
  private saveSlotSelectMessageBoxContainer: Phaser.GameObjects.Container;
  private sessionSlots: SessionSlot[];

  private uiMode: SaveSlotUiMode;
  private saveSlotSelectCallback: SaveSlotSelectCallback | null;

  private scrollCursor: integer = 0;

  private cursorObj: Phaser.GameObjects.NineSlice | null;

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

    this.message = addTextObject(this.scene, 8, 8, "", TextStyle.WINDOW, { maxLines: 2 });
    this.message.setOrigin(0, 0);
    this.saveSlotSelectMessageBoxContainer.add(this.message);

    this.sessionSlots = [];
  }

  show(args: any[]): boolean {
    if ((args.length < 2 || !(args[1] instanceof Function))) {
      return false;
    }

    super.show(args);

    this.uiMode = args[0] as SaveSlotUiMode;
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
        if (this.uiMode === SaveSlotUiMode.LOAD && !this.sessionSlots[cursor].hasData) {
          error = true;
        } else {
          switch (this.uiMode) {
          case SaveSlotUiMode.LOAD:
            if (this.sessionSlots[cursor].autoSlot) {
              ui.showText("This will revert slot " + (this.sessionSlots[cursor].slotId + 1) + " to wave " + (this.sessionSlots[cursor].wv) + ".\nIs that okay?", null, () => {
                ui.setOverlayMode(Mode.CONFIRM, () => {
                  this.saveSlotSelectCallback = null;
                  originalCallback && originalCallback(cursor);
                }, () => {
                  ui.revertMode();
                  ui.showText("", 0);
                }, false, 0, 19, 500);
              });
            } else {
              this.saveSlotSelectCallback = null;
              originalCallback && originalCallback(cursor);
            }
            break;
          case SaveSlotUiMode.SAVE:
            const saveAndCallback = () => {
              const originalCallback = this.saveSlotSelectCallback;
              this.saveSlotSelectCallback = null;
              var dataslot = this.sessionSlots[cursor].slotId
              for (var i = 0; i < LoggerTools.autoCheckpoints.length; i++) {
                // Delete any autosaves associated with this slot
                localStorage.removeItem(`sessionData${dataslot ? dataslot : ""}_${loggedInUser ? loggedInUser.username : "Guest"}_auto${i}`)
              }
              ui.revertMode();
              ui.showText("", 0);
              ui.setMode(Mode.MESSAGE);
              originalCallback && originalCallback(this.sessionSlots[cursor].slotId, this.sessionSlots[cursor].autoSlot);
            };
            if (this.sessionSlots[cursor].autoSlot != undefined) {
              return false;
            }
            if (this.sessionSlots[cursor].hasData) {
              ui.showText(i18next.t("saveSlotSelectUiHandler:overwriteData"), null, () => {
                ui.setOverlayMode(Mode.CONFIRM, () => {
                  this.scene.gameData.deleteSession(cursor).then(response => {
                    if (response === false) {
                      this.scene.reset(true);
                    } else {
                      saveAndCallback();
                    }
                  });
                }, () => {
                  ui.revertMode();
                  ui.showText("", 0);
                }, false, 0, 19, 2000);
              });
            } else if (this.sessionSlots[cursor].hasData === false) {
              saveAndCallback();
            } else {
              return false;
            }
            break;
          }
          success = true;
        }
      } else {
        this.saveSlotSelectCallback = null;
        originalCallback && originalCallback(-1);
        success = true;
      }
    } else {
      switch (button) {
      case Button.UP:
        if (this.cursor) {
          success = this.setCursor(this.cursor - 1);
        } else if (this.scrollCursor) {
          success = this.setScrollCursor(this.scrollCursor - 1);
        }
        break;
      case Button.DOWN:
        if (this.cursor < 2) {
          success = this.setCursor(this.cursor + 1);
        } else if (this.scrollCursor < this.sessionSlots.length - 3) {
          success = this.setScrollCursor(this.scrollCursor + 1);
        }
        break;
      }
    }

    if (success) {
      ui.playSelect();
    } else if (error) {
      ui.playError();
    }

    return success || error;
  }

  populateSessionSlots() {
    var ui = this.getUi();
    var ypos = 0;
    for (let s = 0; s < sessionSlotCount; s++) {
      const sessionSlot = new SessionSlot(this.scene, s, ypos);
      ypos++
      sessionSlot.load();
      this.scene.add.existing(sessionSlot);
      this.sessionSlotsContainer.add(sessionSlot);
      this.sessionSlots.push(sessionSlot);
      if (this.uiMode != SaveSlotUiMode.SAVE && this.scene.showAutosaves) {
        for (var j = 0; j < LoggerTools.autoCheckpoints.length; j++) {
          var k = "sessionData" + (s ? s : "") + "_Guest_auto" + j
          if (localStorage.getItem(k) != null) {
            const sessionSlot = new SessionSlot(this.scene, s, ypos, j);
            ypos++
            sessionSlot.load();
            this.scene.add.existing(sessionSlot);
            this.sessionSlotsContainer.add(sessionSlot);
            this.sessionSlots.push(sessionSlot);
          }
        }
      }
    }
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);

    if (text?.indexOf("\n") === -1) {
      this.saveSlotSelectMessageBox.setSize(318, 28);
      this.message.setY(-22);
    } else {
      this.saveSlotSelectMessageBox.setSize(318, 42);
      this.message.setY(-37);
    }

    this.saveSlotSelectMessageBoxContainer.setVisible(!!text?.length);
  }

  setCursor(cursor: integer): boolean {
    const changed = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.nineslice(0, 0, "select_cursor_highlight_thick", undefined, 296, 44, 6, 6, 6, 6);
      this.cursorObj.setOrigin(0, 0);
      this.sessionSlotsContainer.add(this.cursorObj);
    }
    this.cursorObj.setPosition(4, 4 + (cursor + this.scrollCursor) * 56);

    return changed;
  }

  setScrollCursor(scrollCursor: integer): boolean {
    const changed = scrollCursor !== this.scrollCursor;

    if (changed) {
      this.scrollCursor = scrollCursor;
      this.setCursor(this.cursor);
      this.scene.tweens.add({
        targets: this.sessionSlotsContainer,
        y: this.sessionSlotsContainerInitialY - 56 * scrollCursor,
        duration: Utils.fixedInt(325),
        ease: "Sine.easeInOut"
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
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }

  clearSessionSlots() {
    this.sessionSlots.splice(0, this.sessionSlots.length);
    this.sessionSlotsContainer.removeAll(true);
  }
}

class SessionSlot extends Phaser.GameObjects.Container {
  public slotId: integer;
  public autoSlot: integer | undefined;
  public hasData: boolean;
  public wv: integer;
  private loadingLabel: Phaser.GameObjects.Text;
  public backer: Phaser.GameObjects.Image

  constructor(scene: BattleScene, slotId: integer, ypos: integer, autoSlot?: integer) {
    super(scene, 0, ypos * 56);

    this.slotId = slotId;
    this.autoSlot = autoSlot

    this.setup();
  }

  setup() {
    const slotWindow = addWindow(this.scene, 0, 0, 304, 52);
    this.add(slotWindow);

    if (this.scene.doBiomePanels) {
      this.backer = this.scene.add.image(0, 0, `end_panel`)
      this.backer.setOrigin(0.5, 0.5)
      this.backer.setScale(304/909, 52/155)
      this.backer.setPosition(102*1.5 - 1, 26)
      this.backer.setSize(304, 52)
      this.backer.setVisible(false)
      this.add(this.backer)
    }

    this.loadingLabel = addTextObject(this.scene, 152, 26, i18next.t("saveSlotSelectUiHandler:loading"), TextStyle.WINDOW);
    this.loadingLabel.setOrigin(0.5, 0.5);
    this.add(this.loadingLabel);
  }

  async setupWithData(data: SessionSaveData) {
    this.remove(this.loadingLabel, true);
    this.wv = data.waveIndex;
    var lbl = `Slot ${this.slotId+1} (${GameMode.getModeName(data.gameMode) || i18next.t("gameMode:unkown")}) - ${i18next.t("saveSlotSelectUiHandler:wave")} ${data.waveIndex}`
    if (this.autoSlot != undefined) {
      lbl = `Slot ${this.slotId+1} (Auto) - ${i18next.t("saveSlotSelectUiHandler:wave")} ${data.waveIndex}`
    }
    console.log(data, this.slotId, this.autoSlot, lbl)
    const gameModeLabel = addTextObject(this.scene, 8, 5, lbl, TextStyle.WINDOW);
    this.add(gameModeLabel);

    const timestampLabel = addTextObject(this.scene, 8, 19, new Date(data.timestamp).toLocaleString(), TextStyle.WINDOW);
    this.add(timestampLabel);

    const playTimeLabel = addTextObject(this.scene, 8, 33, Utils.getPlayTimeString(data.playTime) + "    " + (getBiomeName(data.arena.biome) == "Construction Site" ? "Construction" : getBiomeName(data.arena.biome)), TextStyle.WINDOW);
    this.add(playTimeLabel);

    console.log(biomePanelIDs[data.arena.biome])

    if (this.backer && allpanels.includes(biomePanelIDs[data.arena.biome]) && this.scene.doBiomePanels) {
      this.backer.setTexture(`${biomePanelIDs[data.arena.biome]}_panel`)
      this.backer.setVisible(true)
    }

    const pokemonIconsContainer = this.scene.add.container(144, 4);
    data.party.forEach((p: PokemonData, i: integer) => {
      const iconContainer = this.scene.add.container(26 * i, 0);
      iconContainer.setScale(0.75);

      const pokemon = p.toPokemon(this.scene);
      const icon = this.scene.addPokemonIcon(pokemon, 0, 0, 0, 0);

      const text = addTextObject(this.scene, 32, 20, `${i18next.t("saveSlotSelectUiHandler:lv")}${Utils.formatLargeNumber(pokemon.level, 1000)}`, TextStyle.PARTY, { fontSize: "54px", color: "#f8f8f8" });
      text.setShadow(0, 0, undefined);
      text.setStroke("#424242", 14);
      text.setOrigin(1, 0);

      iconContainer.add(icon);
      iconContainer.add(text);

      pokemonIconsContainer.add(iconContainer);

      pokemon.destroy();
    });

    this.add(pokemonIconsContainer);

    const modifiersModule = await import("../modifier/modifier");

    const modifierIconsContainer = this.scene.add.container(148, 30);
    modifierIconsContainer.setScale(0.5);
    let visibleModifierIndex = 0;
    let numberOfModifiers = 0
    const itemDisplayLimit = 9
    for (const m of data.modifiers) {
      const modifier = m.toModifier(this.scene, modifiersModule[m.className]);
      if (modifier instanceof Modifier.PokemonHeldItemModifier) {
        continue;
      }
      numberOfModifiers++;
    }
    for (const m of data.modifiers) {
      const modifier = m.toModifier(this.scene, modifiersModule[m.className]);
      if (modifier instanceof Modifier.PokemonHeldItemModifier) {
        continue;
      }
      const icon = modifier?.getIcon(this.scene, false);
      if (icon) {
        icon.setPosition(24 * visibleModifierIndex, 0);
        modifierIconsContainer.add(icon);
      }
      if (++visibleModifierIndex === (numberOfModifiers == itemDisplayLimit ? itemDisplayLimit : itemDisplayLimit - 1)) {
        break;
      }
    }
    if (numberOfModifiers > itemDisplayLimit) {
      var plusText = addTextObject(this.scene, 24 * visibleModifierIndex + 20, 4, `+${numberOfModifiers - visibleModifierIndex}`, TextStyle.PARTY, { fontSize: "80px", color: "#f8f8f8" });
      plusText.setShadow(0, 0, undefined);
      plusText.setStroke("#424242", 14);
      plusText.setOrigin(1, 0);
      modifierIconsContainer.add(plusText);
    }
    var spacing = 20
    if (data.enemyParty.length == 4) {
      spacing = 17
    }
    if (data.enemyParty.length == 5) {
      spacing = 12
    }
    if (data.enemyParty.length == 6) {
      spacing = 10
    }
    data.enemyParty.forEach((p, i) => {
      const iconContainer = this.scene.add.container(24 * 9 + 1 + i*spacing, -1);
      const pokemon = p.toPokemon(this.scene);
      const icon = this.scene.addPokemonIcon(pokemon, 0, 0, 0, 0);
      iconContainer.add(icon);
      pokemon.destroy();
      modifierIconsContainer.add(iconContainer);
    })
    if (true) {
      const vsLabel = addTextObject(this.scene, 24 * 9 + 20, 15, `vs`, TextStyle.PARTY, { fontSize: "80px", color: "#f8f8f8" });
      vsLabel.setShadow(0, 0, undefined);
      vsLabel.setStroke("#424242", 14);
      vsLabel.setOrigin(1, 0);
      modifierIconsContainer.add(vsLabel);
    }
    this.add(modifierIconsContainer);
  }

  load(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.scene.gameData.getSession(this.slotId, this.autoSlot).then(async sessionData => {
        if (!sessionData) {
          this.hasData = false;
          this.loadingLabel.setText(i18next.t("saveSlotSelectUiHandler:empty"));
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
