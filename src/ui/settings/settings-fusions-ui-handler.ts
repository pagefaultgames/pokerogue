import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { getIfFolderHandle, onIfFolderHandleChange, setIfFolderHandle } from "#system/if-folder-handle";
import {
  type FusionSettingKey,
  FusionSettings,
  getFusionSettingIndex,
  setFusionSetting,
} from "#system/settings/fusion-settings";
import { MessageUiHandler } from "#ui/message-ui-handler";
import { NavigationManager, NavigationMenu } from "#ui/navigation-menu";
import { addTextObject } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import i18next from "i18next";

interface FusionsRow {
  label: Phaser.GameObjects.Text;
  /** Null for pure action rows. */
  value: Phaser.GameObjects.Text | null;
  /** Null for status / cycle rows. Mutually exclusive with `cycle`. */
  onAction: (() => void) | null;
  /** When set, LEFT/RIGHT/ACTION cycle through this setting's options. */
  cycle: FusionSettingKey | null;
}

export class SettingsFusionsUiHandler extends MessageUiHandler {
  private settingsContainer!: Phaser.GameObjects.Container;
  private navigationContainer!: NavigationMenu;
  private rows: FusionsRow[] = [];
  private cursorObj: Phaser.GameObjects.NineSlice | null = null;
  private unsubHandleChange: (() => void) | null = null;

  constructor() {
    super(UiMode.SETTINGS_FUSIONS);
  }

  setup(): void {
    const ui = this.getUi();
    const canvasWidth = globalScene.scaledCanvas.width;
    const canvasHeight = globalScene.scaledCanvas.height;

    this.settingsContainer = globalScene.add
      .container(1, -canvasHeight + 1)
      .setName("settings-fusions")
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, canvasWidth, canvasHeight - 20), Phaser.Geom.Rectangle.Contains);

    this.navigationContainer = new NavigationMenu(0, 0);
    const navHeight = this.navigationContainer.height;
    const bodyBg = addWindow(0, navHeight, canvasWidth - 2, canvasHeight - 16 - navHeight - 2)
      .setName("window-fusions-bg")
      .setOrigin(0);

    // Row spacing matches AbstractSettingsUiHandler.
    const rowY = (i: number) => 28 + i * 16;
    let i = 0;

    for (const setting of FusionSettings) {
      const y = rowY(i++);
      const label = addTextObject(8, y, i18next.t(setting.labelKey), TextStyle.SETTINGS_LABEL).setOrigin(0);
      const value = addTextObject(
        86,
        y,
        i18next.t(setting.options[getFusionSettingIndex(setting.key)].labelKey),
        TextStyle.SETTINGS_VALUE,
      ).setOrigin(0);
      this.rows.push({ label, value, onAction: null, cycle: setting.key });
    }

    const statusLabel = addTextObject(
      8,
      rowY(i),
      i18next.t("settings:fusionFolder"),
      TextStyle.SETTINGS_LABEL,
    ).setOrigin(0);
    const statusValue = addTextObject(86, rowY(i), this.statusString(), TextStyle.SETTINGS_VALUE).setOrigin(0);
    this.rows.push({ label: statusLabel, value: statusValue, onAction: null, cycle: null });
    i++;

    const chooseLabel = addTextObject(
      8,
      rowY(i++),
      i18next.t("settings:fusionChooseFolder"),
      TextStyle.SETTINGS_LABEL,
    ).setOrigin(0);
    this.rows.push({
      label: chooseLabel,
      value: null,
      onAction: () => void this.openPicker(),
      cycle: null,
    });

    const clearLabel = addTextObject(
      8,
      rowY(i++),
      i18next.t("settings:fusionClearFolder"),
      TextStyle.SETTINGS_LABEL,
    ).setOrigin(0);
    this.rows.push({
      label: clearLabel,
      value: null,
      onAction: () => void setIfFolderHandle(null),
      cycle: null,
    });

    this.settingsContainer.add([bodyBg, this.navigationContainer]);
    for (const r of this.rows) {
      this.settingsContainer.add(r.label);
      if (r.value) {
        this.settingsContainer.add(r.value);
      }
    }
    this.settingsContainer.setVisible(false);
    ui.add(this.settingsContainer);

    this.unsubHandleChange = onIfFolderHandleChange(() => this.refreshStatus());
  }

  private statusString(): string {
    const handle = getIfFolderHandle();
    return handle ? handle.name : i18next.t("settings:fusionFolderNotSet");
  }

  private refreshStatus(): void {
    // Lookup by identity so inserting future settings above doesn't shift the row index.
    for (const row of this.rows) {
      if (row.cycle === null && row.onAction === null && row.value !== null) {
        row.value.setText(this.statusString());
        return;
      }
    }
  }

  private isFocusable(i: number): boolean {
    const row = this.rows[i];
    return !!row && (row.onAction !== null || row.cycle !== null);
  }

  /** Advance the focused cycle row by ±1, wrapping. */
  private cycleSetting(row: FusionsRow, direction: 1 | -1): boolean {
    if (!row.cycle || !row.value) {
      return false;
    }
    const setting = FusionSettings.find(s => s.key === row.cycle);
    if (!setting) {
      return false;
    }
    const current = getFusionSettingIndex(row.cycle);
    const next = (current + direction + setting.options.length) % setting.options.length;
    if (next === current) {
      return false;
    }
    if (!setFusionSetting(row.cycle, next)) {
      return false;
    }
    row.value.setText(i18next.t(setting.options[next].labelKey));
    return true;
  }

  override show(args: any[]): boolean {
    super.show(args);
    NavigationManager.getInstance().selectedMode = UiMode.SETTINGS_FUSIONS;
    NavigationManager.getInstance().updateNavigationMenus();
    this.refreshStatus();
    this.settingsContainer.setVisible(true);
    // Skip the inert status row.
    let initial = 0;
    while (initial < this.rows.length && !this.isFocusable(initial)) {
      initial++;
    }
    this.setCursor(initial);
    this.getUi().moveTo(this.settingsContainer, this.getUi().length - 1);
    this.getUi().hideTooltip();
    return true;
  }

  override setCursor(cursor: number): boolean {
    const changed = this.cursor !== cursor;
    this.cursor = cursor;
    const target = this.rows[cursor]?.label;
    if (!target) {
      return changed;
    }
    if (!this.cursorObj) {
      // Adding directly to the container places the cursor above the body bg.
      const canvasWidth = globalScene.scaledCanvas.width;
      this.cursorObj = globalScene.add
        .nineslice(0, 0, "summary_moves_cursor", undefined, canvasWidth - 10, 16, 1, 1, 1, 1)
        .setOrigin(0);
      this.settingsContainer.add(this.cursorObj);
    }
    this.cursorObj.setPosition(target.x - 4, target.y);
    this.cursorObj.setVisible(true);
    return changed;
  }

  private advanceCursor(direction: 1 | -1): boolean {
    const n = this.rows.length;
    let next = this.cursor;
    for (let step = 0; step < n; step++) {
      next = (next + direction + n) % n;
      if (this.isFocusable(next)) {
        return this.setCursor(next);
      }
    }
    return false;
  }

  override processInput(button: Button): boolean {
    const ui = this.getUi();
    let success = false;

    if (button === Button.CANCEL) {
      NavigationManager.getInstance().reset();
      ui.revertMode();
      success = true;
    } else {
      switch (button) {
        case Button.UP:
          success = this.advanceCursor(-1);
          break;
        case Button.DOWN:
          success = this.advanceCursor(1);
          break;
        case Button.LEFT: {
          const row = this.rows[this.cursor];
          if (row?.cycle) {
            success = this.cycleSetting(row, -1);
          }
          break;
        }
        case Button.RIGHT: {
          const row = this.rows[this.cursor];
          if (row?.cycle) {
            success = this.cycleSetting(row, 1);
          }
          break;
        }
        case Button.CYCLE_FORM:
        case Button.CYCLE_SHINY:
          success = this.navigationContainer.navigate(button);
          break;
        case Button.ACTION: {
          const row = this.rows[this.cursor];
          if (row?.cycle) {
            // ACTION advances by 1, matching vanilla Z/Enter behaviour.
            success = this.cycleSetting(row, 1);
          } else if (row?.onAction) {
            row.onAction();
            success = true;
          }
          break;
        }
      }
    }

    if (success) {
      ui.playSelect();
    }
    return success;
  }

  private async openPicker(): Promise<void> {
    const win = window as unknown as {
      showDirectoryPicker?: (opts?: { mode?: "read" }) => Promise<FileSystemDirectoryHandle>;
    };
    if (typeof win.showDirectoryPicker !== "function") {
      const value = this.rows[0]?.value;
      value?.setText(i18next.t("settings:fusionPickerUnsupported"));
      return;
    }
    try {
      const handle = await win.showDirectoryPicker({ mode: "read" });
      await setIfFolderHandle(handle);
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        console.warn("Folder picker error:", err);
      }
    }
  }

  override clear(): void {
    super.clear();
    this.settingsContainer.setVisible(false);
    if (this.cursorObj) {
      this.cursorObj.setVisible(false);
    }
  }

  override destroy(): void {
    if (this.unsubHandleChange) {
      this.unsubHandleChange();
      this.unsubHandleChange = null;
    }
  }
}
