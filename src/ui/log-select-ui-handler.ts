import i18next from "i18next";
import BattleScene from "../battle-scene";
import { Button } from "#enums/buttons";
import { GameMode } from "../game-mode";
import { PokemonHeldItemModifier } from "../modifier/modifier";
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
import { Species } from "#app/enums/species.js";
import { allSpecies, getPokemonSpecies, getPokemonSpeciesForm } from "#app/data/pokemon-species.js";

const sessionSlotCount = 5;
const gap = 20;

export type LogSelectCallback = (key?: string) => void;

export default class LogSelectUiHandler extends MessageUiHandler {

  private saveSlotSelectContainer: Phaser.GameObjects.Container;
  private sessionSlotsContainer: Phaser.GameObjects.Container;
  private saveSlotSelectMessageBox: Phaser.GameObjects.NineSlice;
  private saveSlotSelectMessageBoxContainer: Phaser.GameObjects.Container;
  private sessionSlots: SessionSlot[];

  private selectCallback?: LogSelectCallback;
  private quitCallback: LogSelectCallback;

  private scrollCursor: integer = 0;

  private cursorObj?: Phaser.GameObjects.NineSlice;

  private sessionSlotsContainerInitialY: number;

  private extrasLabel: Phaser.GameObjects.Text

  constructor(scene: BattleScene) {
    super(scene, Mode.LOG_HANDLER);
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

    this.extrasLabel = addTextObject(this.scene, 40, 56 * 5 + 5, "Other Files", TextStyle.WINDOW);
    this.extrasLabel.setAlign("center");
    this.sessionSlotsContainer.add(this.extrasLabel);

    this.sessionSlots = [];
  }

  show(args: any[]): boolean {
    if ((args.length < 1 || !(args[0] instanceof Function))) {
      return false;
    }

    super.show(args);

    this.selectCallback = args[0] as LogSelectCallback;
    this.quitCallback = args[1] as LogSelectCallback;
    
    console.log(this.selectCallback)

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

    if (button === Button.ACTION) {
      const originalCallback = this.selectCallback!;
      const cursor = this.cursor + this.scrollCursor;
      var k = this.sessionSlots[cursor].key
      if (k != undefined) {
        var file = JSON.parse(localStorage.getItem(k)!) as LoggerTools.DRPD;
        console.log(k, file)
        LoggerTools.generateEditHandlerForLog(this.scene, this.sessionSlots[cursor].logIndex, () => {
          this.selectCallback = undefined;
          originalCallback(k)
        })()
        success = true;
      }
    } else if (button === Button.CANCEL) {
      this.quitCallback!(undefined);
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
    LoggerTools.getLogs()
    for (let s = 0; s < sessionSlotCount; s++) {
      var found = false
      for (var i = 0; i < LoggerTools.logs.length; i++) {
        if (LoggerTools.logs[i][3] == s.toString()) {
          found = true
          const sessionSlot = new SessionSlot(this.scene, s, ypos);
          ypos++
          sessionSlot.load(LoggerTools.logs[i][1]);
          sessionSlot.logIndex = i
          this.scene.add.existing(sessionSlot);
          this.sessionSlotsContainer.add(sessionSlot);
          this.sessionSlots.push(sessionSlot);
        }
      }
      if (!found) {
        const sessionSlot = new SessionSlot(this.scene, s, ypos);
        ypos++
        sessionSlot.load(undefined);
        this.scene.add.existing(sessionSlot);
        this.sessionSlotsContainer.add(sessionSlot);
        this.sessionSlots.push(sessionSlot);
      }
    }
    for (var i = 0; i < LoggerTools.logs.length; i++) {
      if (LoggerTools.logs[i][3] == "") {
        const sessionSlot = new SessionSlot(this.scene, undefined, ypos);
        ypos++
        sessionSlot.load(LoggerTools.logs[i][1]);
        sessionSlot.logIndex = i
        this.scene.add.existing(sessionSlot);
        this.sessionSlotsContainer.add(sessionSlot);
        this.sessionSlots.push(sessionSlot);
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
    this.cursorObj.setPosition(4, 4 + (cursor + this.scrollCursor) * 56 + ((cursor + this.scrollCursor) > 4 ? gap : 0));

    return changed;
  }

  setScrollCursor(scrollCursor: integer): boolean {
    const changed = scrollCursor !== this.scrollCursor;

    if (changed) {
      this.scrollCursor = scrollCursor;
      this.setCursor(this.cursor);
      this.scene.tweens.add({
        targets: this.sessionSlotsContainer,
        y: this.sessionSlotsContainerInitialY - 56 * scrollCursor - ((this.cursor + this.scrollCursor) > 4 ? gap : 0),
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
    this.selectCallback = undefined;
    this.clearSessionSlots();
  }

  eraseCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = undefined;
  }

  clearSessionSlots() {
    this.sessionSlots.splice(0, this.sessionSlots.length);
    this.sessionSlotsContainer.removeAll(true);
  }
}

class SessionSlot extends Phaser.GameObjects.Container {
  public slotId?: integer;
  public autoSlot: integer;
  public hasData: boolean;
  public wv: integer;
  public key: string;
  private loadingLabel: Phaser.GameObjects.Text;
  public logIndex: integer;

  constructor(scene: BattleScene, slotId: integer | undefined = undefined, ypos: integer, autoSlot?: integer) {
    super(scene, 0, ypos * 56 + (ypos > 4 ? gap : 0));

    this.slotId = slotId!;
    this.autoSlot = autoSlot!

    this.setup();
  }

  setup() {
    const slotWindow = addWindow(this.scene, 0, 0, 304, 52);
    this.add(slotWindow);

    this.loadingLabel = addTextObject(this.scene, 152, 26, i18next.t("saveSlotSelectUiHandler:loading"), TextStyle.WINDOW);
    this.loadingLabel.setOrigin(0.5, 0.5);
    this.add(this.loadingLabel);
  }

  async setupWithData(data: LoggerTools.DRPD) {
    this.remove(this.loadingLabel, true);
    var lbl = `???`
    lbl = data.title!
    var matchesFile = 0
    if (this.slotId != undefined) {
      lbl = `[${this.slotId + 1}] ${lbl}`
      matchesFile = this.slotId + 1
    }
    //console.log(data, this.slotId, this.autoSlot, lbl)
    const gameModeLabel = addTextObject(this.scene, 8, 5, lbl, TextStyle.WINDOW);
    this.add(gameModeLabel);

    const timestampLabel = addTextObject(this.scene, 8, 19, data.date, TextStyle.WINDOW);
    this.add(timestampLabel);

    const playTimeLabel = addTextObject(this.scene, 8, 33, data.version + " / Path: " + (data.label || ""), TextStyle.WINDOW);
    this.add(playTimeLabel);
    
    var wavecount = 0
    data.waves.forEach((wv, idx) => {
      if (wv) {
        if (wv.id != 0) {
          wavecount++
        }
      }
    })
    const waveLabel = addTextObject(this.scene, 185, 33, wavecount + " wv" + (wavecount == 1 ? "" : "s"), TextStyle.WINDOW);
    this.add(waveLabel);
    const fileSizeLabel = addTextObject(this.scene, 255, 33, LoggerTools.getSize(JSON.stringify(data)), TextStyle.WINDOW);
    //fileSizeLabel.setAlign("right")
    this.add(fileSizeLabel);

    const pokemonIconsContainer = this.scene.add.container(144, 4);
    if (data.starters && data.starters![0] != null) {
      data.starters.forEach((p: LoggerTools.PokeData, i: integer) => {
        if (p == undefined)
          return;
        const iconContainer = this.scene.add.container(26 * i, 0);
        iconContainer.setScale(0.75);

        //if (Utils.getEnumValues(Species)[p.id] == undefined)
          //return;

        //if (getPokemonSpecies(Utils.getEnumValues(Species)[p.id]) == undefined)
          //return;

        if (allSpecies[Utils.getEnumValues(Species).indexOf(p.id)] == undefined) {
          // Do nothing
          //console.log(p.id)
          const icon = this.scene.addPkIcon(getPokemonSpecies(Utils.getEnumValues(Species)[p.id]), 0, 0, 0, 0, 0);
          iconContainer.add(icon);
        } else {
          const icon = this.scene.addPkIcon(getPokemonSpecies(Utils.getEnumValues(Species)[p.id]), 0, 0, 0, 0, 0);
          //const icon = this.scene.addPkIcon(getPokemonSpecies(Utils.getEnumValues(Species)[allSpecies[Utils.getEnumValues(Species).indexOf(p.id)].speciesId]), 0, 0, 0, 0, 0);
          iconContainer.add(icon);
        }

        const text = addTextObject(this.scene, 32, 20, ``, TextStyle.PARTY, { fontSize: "54px", color: "#f8f8f8" });
        text.setShadow(0, 0, undefined);
        text.setStroke("#424242", 14);
        text.setOrigin(1, 0);

        iconContainer.add(text);

        pokemonIconsContainer.add(iconContainer);
      });
    } else if (this.slotId != undefined) {
      var gamedata = LoggerTools.parseSlotData(this.slotId)!
      //console.log(gamedata)
      gamedata.party.forEach((pk: PokemonData, i: integer) => {
        if (pk == undefined)
          return;
        var p = LoggerTools.exportPokemonFromData(pk)
        const iconContainer = this.scene.add.container(26 * i, 0);
        iconContainer.setScale(0.75);

        //if (Utils.getEnumValues(Species)[p.id] == undefined)
          //return;

        //if (getPokemonSpecies(Utils.getEnumValues(Species)[p.id]) == undefined)
          //return;

        var sp = getPokemonSpecies(pk.species);
        if (allSpecies[Utils.getEnumValues(Species).indexOf(p.id)] == undefined) {
          // Do nothing
          const icon = this.scene.addPkIcon(sp, pk.formIndex, 0, 0, 0, 0, undefined, pk.shiny, pk.variant);
          iconContainer.add(icon);
        } else {
          //console.log(p.id, Utils.getEnumValues(Species)[p.id])
          const icon = this.scene.addPkIcon(sp, pk.formIndex, 0, 0, 0, 0, undefined, pk.shiny, pk.variant);
          //const icon = this.scene.addPkIcon(getPokemonSpecies(Utils.getEnumValues(Species)[allSpecies[Utils.getEnumValues(Species).indexOf(p.id)].speciesId]), 0, 0, 0, 0, 0);
          iconContainer.add(icon);
        }

        const text = addTextObject(this.scene, 32, 20, ``, TextStyle.PARTY, { fontSize: "54px", color: "#f8f8f8" });
        text.setShadow(0, 0, undefined);
        text.setStroke("#424242", 14);
        text.setOrigin(1, 0);

        iconContainer.add(text);

        pokemonIconsContainer.add(iconContainer);
      });
    } else {
      const timestampLabel = addTextObject(this.scene, 144, 10, "No Starter data", TextStyle.WINDOW);
      this.add(timestampLabel);
    }

    this.add(pokemonIconsContainer);

    //const modifiersModule = await import("../modifier/modifier");

    const modifierIconsContainer = this.scene.add.container(148, 30);
    modifierIconsContainer.setScale(0.5);
    let visibleModifierIndex = 0;

    this.add(modifierIconsContainer);
  }

  load(l?: string, slot?: integer): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (l == undefined) {
        this.hasData = false;
        this.loadingLabel.setText("No data for this run");
        resolve(false);
        return;
      }
      this.key = l
      if (slot) {
        this.slotId = slot
      }
      this.setupWithData(JSON.parse(localStorage.getItem(l)!))
      resolve(true);
    });
    /*
    return new Promise<boolean>(resolve => {
      this.scene.gameData.getSession(this.slotId, this.autoSlot).then(async sessionData => {
        if (!sessionData) {
          this.hasData = false;
          this.loadingLabel.setText(i18next.t("saveSlotSelectUiHandler:empty"));
          resolve(false);
          return;
        }
        this.hasData = true;
        await this.setupWithData(undefined);
        resolve(true);
      });
    });
    */
  }
}

interface SessionSlot {
  scene: BattleScene;
}
