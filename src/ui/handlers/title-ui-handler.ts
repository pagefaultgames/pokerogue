import { pokerogueApi } from "#api/api";
import { loggedInUser } from "#app/account";
import { FAKE_TITLE_LOGO_CHANCE } from "#app/constants";
import { eventBus } from "#app/event-bus";
import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { speciesDataRegistry } from "#app/global-species-data-registry";
import { bypassLogin, isBeta, isDev } from "#constants/app-constants";
import { getSplashMessages } from "#data/splash-messages";
import { SpeciesId } from "#enums/species-id";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { version } from "#package.json";
import type { SettingsUpdateEventArgs } from "#types/event-bus-types";
import { TimedEventDisplay } from "#ui/event-display";
import { OptionSelectUiHandler } from "#ui/option-select-ui-handler";
import { addTextObject } from "#ui/text";
import { fixedInt, randInt, randItem } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import i18next, { type TOptions } from "i18next";

/** If the stats can not be retrieved, use this fallback value */
const BATTLES_WON_FALLBACK = -1;

export class TitleUiHandler extends OptionSelectUiHandler {
  private titleContainer: Phaser.GameObjects.Container;
  private usernameLabel: Phaser.GameObjects.Text;
  private playerCountLabel: Phaser.GameObjects.Text;
  private eventDisplay: TimedEventDisplay;
  private appVersionText: Phaser.GameObjects.Text;
  private snow: Phaser.GameObjects.TileSprite;
  private splashMessageText: Phaser.GameObjects.Text;

  private splashMessage: string;

  private titleStatsTimer: NodeJS.Timeout | null;

  constructor() {
    super(UiMode.TITLE);
  }

  /**
   * @returns The username of the logged in user,
   * or the trainer name (based on currently selected gender) if the "Hide Username" setting is enabled
   */
  private getUsername(): string {
    const usernameReplacement = i18next.t(settings.isPlayerFemale ? "trainerNames:playerF" : "trainerNames:playerM");

    const displayName = settings.display.hideUsername
      ? usernameReplacement
      : (loggedInUser?.username ?? i18next.t("common:guest"));

    return i18next.t("menu:loggedInAs", { username: displayName });
  }

  private updateUsername(): void {
    this.usernameLabel.setText(this.getUsername());
  }

  public override setup(): void {
    super.setup();

    const ui = this.getUi();

    const { height, width } = globalScene.scaledCanvas;

    this.titleContainer = globalScene.add
      .container(0, -height) // formatting
      .setName("title")
      .setAlpha(0);
    ui.add(this.titleContainer);

    const logo = globalScene.add
      .image(width / 2, 8, this.getLogo()) // formatting
      .setOrigin(0.5, 0);

    if (timedEventManager.isEventActive()) {
      this.eventDisplay = new TimedEventDisplay(0, 0, timedEventManager.activeEvent());
      this.eventDisplay.setup();

      this.titleContainer.add(this.eventDisplay);
    }

    const labelPosX = width - 2;
    // Actual y positions will be determined after the title menu has been populated with options
    this.usernameLabel = addTextObject(labelPosX, 0, this.getUsername(), TextStyle.MESSAGE, { fontSize: "54px" }) // formatting
      .setOrigin(1, 0);

    this.playerCountLabel = addTextObject(labelPosX, 0, `? ${i18next.t("menu:playersOnline")}`, TextStyle.MESSAGE, {
      fontSize: "54px",
    }) //
      .setOrigin(1, 0);

    const logoHeight = logo.y + logo.displayHeight;

    this.splashMessageText = addTextObject(logo.x + 64, logoHeight - 8, "", TextStyle.MONEY, { fontSize: "54px" })
      .setOrigin()
      .setAngle(-20);

    globalScene.tweens.add({
      targets: this.splashMessageText,
      duration: fixedInt(350),
      scale: "*=1.25",
      loop: -1,
      yoyo: true,
    });

    this.appVersionText = addTextObject(logo.x - 60, logoHeight + 4, "", TextStyle.MONEY, { fontSize: "54px" }) // formatting
      .setOrigin();

    this.titleContainer.add([
      logo,
      this.usernameLabel,
      this.playerCountLabel,
      this.splashMessageText,
      this.appVersionText,
    ]);

    eventBus.on("settings/update/success", ({ key }: SettingsUpdateEventArgs) => {
      if (key === "hideUsername" || key === "playerGender") {
        this.updateUsername();
      }
    });
  }

  private updateTitleStats(): void {
    pokerogueApi
      .getGameTitleStats()
      .then(stats => {
        if (stats == null) {
          return;
        }
        this.playerCountLabel.setText(`${stats.playerCount} ${i18next.t("menu:playersOnline")}`);
        const splashMessage = this.splashMessage;
        if (splashMessage === "splashMessages:battlesWon") {
          this.splashMessageText.setText(i18next.t(splashMessage, { count: stats.battleCount }));
        }
      })
      .catch(err => {
        if (!bypassLogin) {
          console.error("Failed to fetch title stats:\n", err);
        }
      });
  }

  private getSplashMessageI18nParams(): TOptions & Record<string, unknown> {
    switch (this.splashMessage) {
      case "splashMessages:battlesWon":
        return { count: BATTLES_WON_FALLBACK };
      case "splashMessages:itsBeenTotalRuns":
        return { cycleCountNoOrdinal: 5643853 + globalScene.gameData.gameStats.classicSessionsPlayed };
      case "splashMessages:aprilFools.helloKyleAmber": {
        const trainerName = settings.isPlayerFemale ? "trainerNames:playerF" : "trainerNames:playerM";
        return { name: i18next.t(trainerName) };
      }
      case "splashMessages:underratedPokemon":
      case "splashMessages:dontTalkAboutThePokemonIncident":
      case "splashMessages:aWildPokemonAppeared":
      case "splashMessages:aprilFools.removedPokemon": {
        const randSpeciesId = randItem(getEnumValues(SpeciesId));
        const species = speciesDataRegistry.getSpecies(randSpeciesId);
        const pokemonName = randSpeciesId > 2000 ? species.getFormNameToDisplay(0, true) : species.name;
        return { pokemonName };
      }
    }

    return {};
  }

  public override show(args: any[]): boolean {
    const ret = super.show(args);

    if (!ret) {
      return false;
    }

    const scaledHeight = globalScene.scaledCanvas.height;
    const windowHeight = this.getWindowHeight();

    this.updateUsername();

    // Move username and player count to top of the menu and sort it,
    // to display the shorter one on top
    const UPPER_LABEL = scaledHeight - 23 - windowHeight;
    const LOWER_LABEL = scaledHeight - 13 - windowHeight;

    if (this.usernameLabel.width < this.playerCountLabel.width) {
      this.usernameLabel.setY(UPPER_LABEL);
      this.playerCountLabel.setY(LOWER_LABEL);
    } else {
      this.usernameLabel.setY(LOWER_LABEL);
      this.playerCountLabel.setY(UPPER_LABEL);
    }

    this.splashMessage = randItem(getSplashMessages());
    this.splashMessageText.setText(i18next.t(this.splashMessage, this.getSplashMessageI18nParams()));

    const betaText = isBeta || isDev ? " (Beta)" : "";
    this.appVersionText.setText("v" + version + betaText);

    const ui = this.getUi();

    if (timedEventManager.isEventActive()) {
      this.eventDisplay.setWidth(globalScene.scaledCanvas.width - this.optionSelectBg.width - this.optionSelectBg.x);
      this.eventDisplay.show();
    }

    const now = new Date();
    if (now.getMonth() === 11 || (now.getMonth() === 0 && now.getDate() <= 15)) {
      this.addSnow();
    }

    this.updateTitleStats();

    this.titleStatsTimer = setInterval(() => {
      this.updateTitleStats();
    }, 60000);

    globalScene.tweens.add({
      targets: [this.titleContainer, ui.getMessageHandler().bg],
      duration: fixedInt(325),
      alpha: (target: any) => (target === this.titleContainer ? 1 : 0),
      ease: "Sine.easeInOut",
    });

    return true;
  }

  public override clear(): void {
    super.clear();

    this.snow?.destroy();

    const ui = this.getUi();

    this.eventDisplay?.clear();

    this.titleStatsTimer && clearInterval(this.titleStatsTimer);
    this.titleStatsTimer = null;

    globalScene.tweens.add({
      targets: [this.titleContainer, ui.getMessageHandler().bg],
      duration: fixedInt(325),
      alpha: (target: any) => (target === this.titleContainer ? 0 : 1),
      ease: "Sine.easeInOut",
    });
  }

  /**
   * Get the logo file path to load, with a 0.1% chance to use the fake logo instead.
   * @returns The path to the image.
   */
  private getLogo(): string {
    // Invert spawn chances on april fools
    const aprilFools = timedEventManager.isAprilFoolsActive();
    return aprilFools === !!randInt(FAKE_TITLE_LOGO_CHANCE) ? "logo_fake" : "logo";
  }

  /** Adds a snow effect on the title screen during the winter season. */
  private addSnow(): void {
    const { height, width } = globalScene.scaledCanvas;

    this.snow?.destroy(); // Ensures no duplicate snow layers

    this.snow = globalScene.add //
      .tileSprite(width, height, width, height, "snow")
      .setOrigin(1, 1);

    globalScene.tweens.add({
      targets: this.snow,
      tilePositionX: { from: 0, to: -512 },
      tilePositionY: { from: 0, to: -512 },
      duration: 100000,
      repeat: -1,
      yoyo: false,
      ease: "Linear",
      onUpdate: () => {
        if (this.snow) {
          this.snow.tilePositionX -= 0.5;
          this.snow.tilePositionY -= 0.5;
        }
      },
    });

    this.titleContainer.addAt(this.snow, 0);
  }
}
