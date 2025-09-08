import { pokerogueApi } from "#api/pokerogue-api";
import { FAKE_TITLE_LOGO_CHANCE } from "#app/constants";
import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { TimedEventDisplay } from "#app/timed-event-manager";
import { getSplashMessages } from "#data/splash-messages";
import { PlayerGender } from "#enums/player-gender";
import type { SpeciesId } from "#enums/species-id";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { version } from "#package.json";
import { OptionSelectUiHandler } from "#ui/option-select-ui-handler";
import { addTextObject } from "#ui/text";
import { fixedInt, randInt, randItem } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";

export class TitleUiHandler extends OptionSelectUiHandler {
  /** If the stats can not be retrieved, use this fallback value */
  private static readonly BATTLES_WON_FALLBACK: number = -1;

  private titleContainer: Phaser.GameObjects.Container;
  private playerCountLabel: Phaser.GameObjects.Text;
  private splashMessage: string;
  private splashMessageText: Phaser.GameObjects.Text;
  private eventDisplay: TimedEventDisplay;
  private appVersionText: Phaser.GameObjects.Text;

  private titleStatsTimer: NodeJS.Timeout | null;

  constructor(mode: UiMode = UiMode.TITLE) {
    super(mode);
  }

  setup() {
    super.setup();

    const ui = this.getUi();

    this.titleContainer = globalScene.add.container(0, -globalScene.scaledCanvas.height);
    this.titleContainer.setName("title");
    this.titleContainer.setAlpha(0);
    ui.add(this.titleContainer);

    const logo = globalScene.add.image(globalScene.scaledCanvas.width / 2, 8, this.getLogo());
    logo.setOrigin(0.5, 0);
    this.titleContainer.add(logo);

    if (timedEventManager.isEventActive()) {
      this.eventDisplay = new TimedEventDisplay(0, 0, timedEventManager.activeEvent());
      this.eventDisplay.setup();
      this.titleContainer.add(this.eventDisplay);
    }

    this.playerCountLabel = addTextObject(
      // Actual y position will be determined after the title menu has been populated with options
      globalScene.scaledCanvas.width - 2,
      0,
      `? ${i18next.t("menu:playersOnline")}`,
      TextStyle.MESSAGE,
      { fontSize: "54px" },
    );
    this.playerCountLabel.setOrigin(1, 0);
    this.titleContainer.add(this.playerCountLabel);

    this.splashMessageText = addTextObject(logo.x + 64, logo.y + logo.displayHeight - 8, "", TextStyle.MONEY, {
      fontSize: "54px",
    });
    this.splashMessageText.setOrigin(0.5, 0.5);
    this.splashMessageText.setAngle(-20);
    this.titleContainer.add(this.splashMessageText);

    const originalSplashMessageScale = this.splashMessageText.scale;

    globalScene.tweens.add({
      targets: this.splashMessageText,
      duration: fixedInt(350),
      scale: originalSplashMessageScale * 1.25,
      loop: -1,
      yoyo: true,
    });

    this.appVersionText = addTextObject(logo.x - 60, logo.y + logo.displayHeight + 4, "", TextStyle.MONEY, {
      fontSize: "54px",
    });
    this.appVersionText.setOrigin(0.5, 0.5);
    this.appVersionText.setAngle(0);
    this.titleContainer.add(this.appVersionText);
  }

  updateTitleStats(): void {
    pokerogueApi
      .getGameTitleStats()
      .then(stats => {
        if (stats) {
          this.playerCountLabel.setText(`${stats.playerCount} ${i18next.t("menu:playersOnline")}`);
          if (this.splashMessage === "splashMessages:battlesWon") {
            this.splashMessageText.setText(i18next.t(this.splashMessage, { count: stats.battleCount }));
          }
        }
      })
      .catch(err => {
        console.error("Failed to fetch title stats:\n", err);
      });
  }

  /** Used solely to display a random Pokémon name in a splash message. */
  randomPokemon(): void {
    const rand = randInt(1025, 1);
    const pokemon = getPokemonSpecies(rand as SpeciesId);
    if (
      this.splashMessage === "splashMessages:underratedPokemon"
      || this.splashMessage === "splashMessages:dontTalkAboutThePokemonIncident"
      || this.splashMessage === "splashMessages:aWildPokemonAppeared"
      || this.splashMessage === "splashMessages:aprilFools.removedPokemon"
    ) {
      this.splashMessageText.setText(i18next.t(this.splashMessage, { pokemonName: pokemon.name }));
    }
  }

  /** Used for a specific April Fools splash message. */
  genderSplash(): void {
    if (this.splashMessage === "splashMessages:aprilFools.helloKyleAmber") {
      globalScene.gameData.gender === PlayerGender.MALE
        ? this.splashMessageText.setText(i18next.t(this.splashMessage, { name: i18next.t("trainerNames:playerM") }))
        : this.splashMessageText.setText(i18next.t(this.splashMessage, { name: i18next.t("trainerNames:playerF") }));
    }
  }

  show(args: any[]): boolean {
    const ret = super.show(args);

    if (ret) {
      // Moving player count to top of the menu
      this.playerCountLabel.setY(globalScene.scaledCanvas.height - 13 - this.getWindowHeight());

      this.splashMessage = randItem(getSplashMessages());
      this.splashMessageText.setText(
        i18next.t(this.splashMessage, {
          count: TitleUiHandler.BATTLES_WON_FALLBACK,
        }),
      );

      const betaText = import.meta.env.DEV ? " (Beta)" : "";
      this.appVersionText.setText("v" + version + betaText);

      const ui = this.getUi();

      if (timedEventManager.isEventActive()) {
        this.eventDisplay.setWidth(globalScene.scaledCanvas.width - this.optionSelectBg.width - this.optionSelectBg.x);
        this.eventDisplay.show();
      }

      this.randomPokemon();
      this.genderSplash();

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
    }

    return ret;
  }

  clear(): void {
    super.clear();

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
}
