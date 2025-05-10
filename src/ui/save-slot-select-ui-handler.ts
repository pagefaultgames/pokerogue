import i18next from "i18next";
import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { GameMode } from "../game-mode";
// biome-ignore lint/style/noNamespaceImport: See `src/system/game-data.ts`
import * as Modifier from "#app/modifier/modifier";
import type { SessionSaveData } from "../system/game-data";
import type PokemonData from "../system/pokemon-data";
import { isNullOrUndefined, fixedInt, getPlayTimeString, formatLargeNumber } from "#app/utils/common";
import MessageUiHandler from "./message-ui-handler";
import { TextStyle, addTextObject } from "./text";
import { UiMode } from "#enums/ui-mode";
import { addWindow } from "./ui-theme";
import { RunDisplayMode } from "#app/ui/run-info-ui-handler";

const SESSION_SLOTS_COUNT = 5;
const SLOTS_ON_SCREEN = 3;

export enum SaveSlotUiMode {
  LOAD,
  SAVE,
}

export type SaveSlotSelectCallback = (cursor: number) => void;

export default class SaveSlotSelectUiHandler extends MessageUiHandler {
  private saveSlotSelectContainer: Phaser.GameObjects.Container;
  private sessionSlotsContainer: Phaser.GameObjects.Container;
  private saveSlotSelectMessageBox: Phaser.GameObjects.NineSlice;
  private saveSlotSelectMessageBoxContainer: Phaser.GameObjects.Container;
  private sessionSlots: SessionSlot[];

  private uiMode: SaveSlotUiMode;
  private saveSlotSelectCallback: SaveSlotSelectCallback | null;

  private scrollCursor = 0;

  private cursorObj: Phaser.GameObjects.Container | null;

  private sessionSlotsContainerInitialY: number;

  constructor() {
    super(UiMode.SAVE_SLOT);
  }

  setup() {
    const ui = this.getUi();

    this.saveSlotSelectContainer = globalScene.add.container(0, 0);
    this.saveSlotSelectContainer.setVisible(false);
    ui.add(this.saveSlotSelectContainer);

    const loadSessionBg = globalScene.add.rectangle(
      0,
      0,
      globalScene.game.canvas.width / 6,
      -globalScene.game.canvas.height / 6,
      0x006860,
    );
    loadSessionBg.setOrigin(0, 0);
    this.saveSlotSelectContainer.add(loadSessionBg);

    this.sessionSlotsContainerInitialY = -globalScene.game.canvas.height / 6 + 8;

    this.sessionSlotsContainer = globalScene.add.container(8, this.sessionSlotsContainerInitialY);
    this.saveSlotSelectContainer.add(this.sessionSlotsContainer);

    this.saveSlotSelectMessageBoxContainer = globalScene.add.container(0, 0);
    this.saveSlotSelectMessageBoxContainer.setVisible(false);
    this.saveSlotSelectContainer.add(this.saveSlotSelectMessageBoxContainer);

    this.saveSlotSelectMessageBox = addWindow(1, -1, 318, 28);
    this.saveSlotSelectMessageBox.setOrigin(0, 1);
    this.saveSlotSelectMessageBoxContainer.add(this.saveSlotSelectMessageBox);

    this.message = addTextObject(8, 8, "", TextStyle.WINDOW, { maxLines: 2 });
    this.message.setOrigin(0, 0);
    this.saveSlotSelectMessageBoxContainer.add(this.message);

    this.sessionSlots = [];
  }

  show(args: any[]): boolean {
    if (args.length < 2 || !(args[1] instanceof Function)) {
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
              this.saveSlotSelectCallback = null;
              originalCallback?.(cursor);
              break;
            case SaveSlotUiMode.SAVE: {
              const saveAndCallback = () => {
                const originalCallback = this.saveSlotSelectCallback;
                this.saveSlotSelectCallback = null;
                ui.revertMode();
                ui.showText("", 0);
                ui.setMode(UiMode.MESSAGE);
                originalCallback?.(cursor);
              };
              if (this.sessionSlots[cursor].hasData) {
                ui.showText(i18next.t("saveSlotSelectUiHandler:overwriteData"), null, () => {
                  ui.setOverlayMode(
                    UiMode.CONFIRM,
                    () => {
                      globalScene.gameData.deleteSession(cursor).then(response => {
                        if (response === false) {
                          globalScene.reset(true);
                        } else {
                          saveAndCallback();
                        }
                      });
                    },
                    () => {
                      ui.revertMode();
                      ui.showText("", 0);
                    },
                    false,
                    0,
                    19,
                    import.meta.env.DEV ? 300 : 2000,
                  );
                });
              } else if (this.sessionSlots[cursor].hasData === false) {
                saveAndCallback();
              } else {
                return false;
              }
              break;
            }
          }
          success = true;
        }
      } else {
        this.saveSlotSelectCallback = null;
        originalCallback?.(-1);
        success = true;
      }
    } else {
      const cursorPosition = this.cursor + this.scrollCursor;
      switch (button) {
        case Button.UP:
          if (this.cursor) {
            // Check to prevent cursor from accessing a negative index
            success = this.cursor === 0 ? this.setCursor(this.cursor) : this.setCursor(this.cursor - 1, cursorPosition);
          } else if (this.scrollCursor) {
            success = this.setScrollCursor(this.scrollCursor - 1, cursorPosition);
          } else if (this.cursor === 0 && this.scrollCursor === 0) {
            this.setScrollCursor(SESSION_SLOTS_COUNT - SLOTS_ON_SCREEN);
            // Revert to avoid an extra session slot sticking out
            this.revertSessionSlot(SESSION_SLOTS_COUNT - SLOTS_ON_SCREEN);
            this.setCursor(SLOTS_ON_SCREEN - 1);
            success = true;
          }
          break;
        case Button.DOWN:
          if (this.cursor < SLOTS_ON_SCREEN - 1) {
            success = this.setCursor(this.cursor + 1, cursorPosition);
          } else if (this.scrollCursor < SESSION_SLOTS_COUNT - SLOTS_ON_SCREEN) {
            success = this.setScrollCursor(this.scrollCursor + 1, cursorPosition);
          } else if (
            this.cursor === SLOTS_ON_SCREEN - 1 &&
            this.scrollCursor === SESSION_SLOTS_COUNT - SLOTS_ON_SCREEN
          ) {
            this.setScrollCursor(0);
            this.revertSessionSlot(SLOTS_ON_SCREEN - 1);
            this.setCursor(0);
            success = true;
          }
          break;
        case Button.RIGHT:
          if (this.sessionSlots[cursorPosition].hasData && this.sessionSlots[cursorPosition].saveData) {
            globalScene.ui.setOverlayMode(
              UiMode.RUN_INFO,
              this.sessionSlots[cursorPosition].saveData,
              RunDisplayMode.SESSION_PREVIEW,
            );
            success = true;
          }
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
    for (let s = 0; s < SESSION_SLOTS_COUNT; s++) {
      const sessionSlot = new SessionSlot(s);
      globalScene.add.existing(sessionSlot);
      this.sessionSlotsContainer.add(sessionSlot);
      this.sessionSlots.push(sessionSlot);
      sessionSlot.load().then(success => {
        // If the cursor was moved to this slot while the session was loading
        // call setCursor again to shift the slot position and show the arrow for save preview
        if (success && this.cursor + this.scrollCursor === s) {
          this.setCursor(s);
        }
      });
    }
  }

  showText(
    text: string,
    delay?: number,
    callback?: Function,
    callbackDelay?: number,
    prompt?: boolean,
    promptDelay?: number,
  ) {
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

  /**
   * Move the cursor to a new position and update the view accordingly
   * @param cursor the new cursor position, between `0` and `SLOTS_ON_SCREEN - 1`
   * @param prevSlotIndex index of the previous session occupied by the cursor, between `0` and `SESSION_SLOTS_COUNT - 1` - optional
   * @returns `true` if the cursor position has changed | `false` if it has not
   */
  override setCursor(cursor: number, prevSlotIndex?: number): boolean {
    const changed = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = globalScene.add.container(0, 0);
      const cursorBox = globalScene.add.nineslice(
        0,
        0,
        "select_cursor_highlight_thick",
        undefined,
        296,
        44,
        6,
        6,
        6,
        6,
      );
      const rightArrow = globalScene.add.image(0, 0, "cursor");
      rightArrow.setPosition(160, 0);
      rightArrow.setName("rightArrow");
      this.cursorObj.add([cursorBox, rightArrow]);
      this.sessionSlotsContainer.add(this.cursorObj);
    }
    const cursorPosition = cursor + this.scrollCursor;
    const cursorIncrement = cursorPosition * 56;
    if (this.sessionSlots[cursorPosition] && this.cursorObj) {
      const hasData = this.sessionSlots[cursorPosition].hasData;
      // If the session slot lacks session data, it does not move from its default, central position.
      // Only session slots with session data will move leftwards and have a visible arrow.
      if (!hasData) {
        this.cursorObj.setPosition(151, 26 + cursorIncrement);
        this.sessionSlots[cursorPosition].setPosition(0, cursorIncrement);
      } else {
        this.cursorObj.setPosition(145, 26 + cursorIncrement);
        this.sessionSlots[cursorPosition].setPosition(-6, cursorIncrement);
      }
      this.setArrowVisibility(hasData);
    }
    if (!isNullOrUndefined(prevSlotIndex)) {
      this.revertSessionSlot(prevSlotIndex);
    }

    return changed;
  }

  /**
   * Helper function that resets the given session slot to its default central position
   */
  revertSessionSlot(slotIndex: number): void {
    const sessionSlot = this.sessionSlots[slotIndex];
    if (sessionSlot) {
      sessionSlot.setPosition(0, slotIndex * 56);
    }
  }

  /**
   * Helper function that checks if the session slot involved holds data or not
   * @param hasData `true` if session slot contains data | 'false' if not
   */
  setArrowVisibility(hasData: boolean): void {
    if (this.cursorObj) {
      const rightArrow = this.cursorObj?.getByName("rightArrow") as Phaser.GameObjects.Image;
      rightArrow.setVisible(hasData);
    }
  }

  /**
   * Move the scrolling cursor to a new position and update the view accordingly
   * @param scrollCursor the new cursor position, between `0` and `SESSION_SLOTS_COUNT - SLOTS_ON_SCREEN`
   * @param prevSlotIndex index of the previous slot occupied by the cursor, between `0` and `SESSION_SLOTS_COUNT-1` - optional
   * @returns `true` if the cursor position has changed | `false` if it has not
   */
  setScrollCursor(scrollCursor: number, prevSlotIndex?: number): boolean {
    const changed = scrollCursor !== this.scrollCursor;

    if (changed) {
      this.scrollCursor = scrollCursor;
      this.setCursor(this.cursor, prevSlotIndex);
      globalScene.tweens.add({
        targets: this.sessionSlotsContainer,
        y: this.sessionSlotsContainerInitialY - 56 * scrollCursor,
        duration: fixedInt(325),
        ease: "Sine.easeInOut",
      });
    }

    return changed;
  }

  clear() {
    super.clear();
    this.saveSlotSelectContainer.setVisible(false);
    this.setScrollCursor(0);
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
  public slotId: number;
  public hasData: boolean;
  private loadingLabel: Phaser.GameObjects.Text;

  public saveData: SessionSaveData;

  constructor(slotId: number) {
    super(globalScene, 0, slotId * 56);

    this.slotId = slotId;

    this.setup();
  }

  setup() {
    const slotWindow = addWindow(0, 0, 304, 52);
    this.add(slotWindow);

    this.loadingLabel = addTextObject(152, 26, i18next.t("saveSlotSelectUiHandler:loading"), TextStyle.WINDOW);
    this.loadingLabel.setOrigin(0.5, 0.5);
    this.add(this.loadingLabel);
  }

  async setupWithData(data: SessionSaveData) {
    this.remove(this.loadingLabel, true);

    const gameModeLabel = addTextObject(
      8,
      5,
      `${GameMode.getModeName(data.gameMode) || i18next.t("gameMode:unkown")} - ${i18next.t("saveSlotSelectUiHandler:wave")} ${data.waveIndex}`,
      TextStyle.WINDOW,
    );
    this.add(gameModeLabel);

    const timestampLabel = addTextObject(8, 19, new Date(data.timestamp).toLocaleString(), TextStyle.WINDOW);
    this.add(timestampLabel);

    const playTimeLabel = addTextObject(8, 33, getPlayTimeString(data.playTime), TextStyle.WINDOW);
    this.add(playTimeLabel);

    const pokemonIconsContainer = globalScene.add.container(144, 4);
    data.party.forEach((p: PokemonData, i: number) => {
      const iconContainer = globalScene.add.container(26 * i, 0);
      iconContainer.setScale(0.75);

      const pokemon = p.toPokemon();
      const icon = globalScene.addPokemonIcon(pokemon, 0, 0, 0, 0);

      const text = addTextObject(
        32,
        20,
        `${i18next.t("saveSlotSelectUiHandler:lv")}${formatLargeNumber(pokemon.level, 1000)}`,
        TextStyle.PARTY,
        { fontSize: "54px", color: "#f8f8f8" },
      );
      text.setShadow(0, 0, undefined);
      text.setStroke("#424242", 14);
      text.setOrigin(1, 0);

      iconContainer.add(icon);
      iconContainer.add(text);

      pokemonIconsContainer.add(iconContainer);

      pokemon.destroy();
    });

    this.add(pokemonIconsContainer);

    const modifierIconsContainer = globalScene.add.container(148, 30);
    modifierIconsContainer.setScale(0.5);
    let visibleModifierIndex = 0;
    for (const m of data.modifiers) {
      const modifier = m.toModifier(Modifier[m.className]);
      if (modifier instanceof Modifier.PokemonHeldItemModifier) {
        continue;
      }
      const icon = modifier?.getIcon(false);
      if (icon) {
        icon.setPosition(24 * visibleModifierIndex, 0);
        modifierIconsContainer.add(icon);
      }
      if (++visibleModifierIndex === 12) {
        break;
      }
    }

    this.add(modifierIconsContainer);
  }

  load(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      globalScene.gameData.getSession(this.slotId).then(async sessionData => {
        // Ignore the results if the view was exited
        if (!this.active) {
          return;
        }
        if (!sessionData) {
          this.hasData = false;
          this.loadingLabel.setText(i18next.t("saveSlotSelectUiHandler:empty"));
          resolve(false);
          return;
        }
        this.hasData = true;
        this.saveData = sessionData;
        await this.setupWithData(sessionData);
        resolve(true);
      });
    });
  }
}
