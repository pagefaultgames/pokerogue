import OptionSelectUiHandler from "./settings/option-select-ui-handler";
import { Mode } from "./ui";
import * as Utils from "../utils";
import { TextStyle, addTextObject, getTextStyleOptions } from "./text";
import { getSplashMessages } from "../data/splash-messages";
import i18next from "i18next";
import { TimedEventDisplay } from "#app/timed-event-manager";
import { version } from "../../package.json";
import { pokerogueApi } from "#app/plugins/api/pokerogue-api";
import { globalScene } from "#app/global-scene";
import { addWindow } from "./ui-theme";

export default class TitleUiHandler extends OptionSelectUiHandler {
  /** If the stats can not be retrieved, use this fallback value */
  private static readonly BATTLES_WON_FALLBACK: number = -99999999;

  private titleContainer: Phaser.GameObjects.Container;
  private playerCountLabel: Phaser.GameObjects.Text;
  private splashMessage: string;
  private splashMessageText: Phaser.GameObjects.Text;
  private eventDisplay: TimedEventDisplay;
  private appVersionText: Phaser.GameObjects.Text;
  // -- start temporary maintenance announcement fields --
  private announcementText: Phaser.GameObjects.Text;
  private announcementBg: Phaser.GameObjects.NineSlice;
  // -- end temporary maintenance announcement fields --

  private titleStatsTimer: NodeJS.Timeout | null;

  constructor(mode: Mode = Mode.TITLE) {
    super(mode);
  }

  setup() {
    super.setup();

    const ui = this.getUi();

    this.titleContainer = globalScene.add.container(0, -(globalScene.game.canvas.height / 6));
    this.titleContainer.setName("title");
    this.titleContainer.setAlpha(0);
    ui.add(this.titleContainer);

    const logo = globalScene.add.image((globalScene.game.canvas.width / 6) / 2, 8, "logo");
    logo.setOrigin(0.5, 0);
    this.titleContainer.add(logo);

    if (globalScene.eventManager.isEventActive()) {
      this.eventDisplay = new TimedEventDisplay(0, 0, globalScene.eventManager.activeEvent());
      this.eventDisplay.setup();
      this.titleContainer.add(this.eventDisplay);
    }

    this.playerCountLabel = addTextObject(
      (globalScene.game.canvas.width / 6) - 2,
      (globalScene.game.canvas.height / 6) - 13 - 576 * getTextStyleOptions(TextStyle.WINDOW, globalScene.uiTheme).scale,
      `? ${i18next.t("menu:playersOnline")}`,
      TextStyle.MESSAGE,
      { fontSize: "54px" }
    );
    this.playerCountLabel.setOrigin(1, 0);
    this.titleContainer.add(this.playerCountLabel);

    this.splashMessageText = addTextObject(logo.x + 64, logo.y + logo.displayHeight - 8, "", TextStyle.MONEY, { fontSize: "54px" });
    this.splashMessageText.setOrigin(0.5, 0.5);
    this.splashMessageText.setAngle(-20);
    this.titleContainer.add(this.splashMessageText);

    const originalSplashMessageScale = this.splashMessageText.scale;

    globalScene.tweens.add({
      targets: this.splashMessageText,
      duration: Utils.fixedInt(350),
      scale: originalSplashMessageScale * 1.25,
      loop: -1,
      yoyo: true,
    });

    this.appVersionText = addTextObject(logo.x - 60, logo.y + logo.displayHeight + 4, "", TextStyle.MONEY, { fontSize: "54px" });
    this.appVersionText.setOrigin(0.5, 0.5);
    this.appVersionText.setAngle(0);
    this.titleContainer.add(this.appVersionText);

    // #region Temporary Maintenance Announcement
    const currentLanguage = i18next.resolvedLanguage ?? "en";
    const getTimeFormat = (): boolean => {
      switch (currentLanguage) {
        case "en":
        case "es-ES":
        case "ko":
        case "zh-TW":
        default:
          return true; // 12h
        case "de":
        case "fr":
        case "it":
        case "ja":
        case "pt-BR": // <-- in review
        case "zh-CN":
          return false; // 24h
      }
    };
    const startDate = new Date(1738994400000);
    const endDate = new Date(1739167200000);
    const dateOptions: Intl.DateTimeFormatOptions = {
      dateStyle: "short",
      timeStyle: "short",
      hour12: getTimeFormat(),
    };
    const startDateLocalized = new Intl.DateTimeFormat(currentLanguage, dateOptions).format(startDate);
    const endDateLocalized = new Intl.DateTimeFormat(currentLanguage, dateOptions).format(endDate);
    const localizedAnnouncementString: { [key: string]: string } = {
      "en": ` - INFORMATION - \nServer maintenance is scheduled for the following period:\n${startDateLocalized} until ${endDateLocalized}\nEnd date and hour are an estimate.\nMaintenance may end at an earlier or later time.`,
      "de": ` - INFORMATION - German translation goes here:\n${startDateLocalized} until ${endDateLocalized}`,
      "es-ES": ` - INFORMACIÓN -\nUn mantenimiento del servidor está programado para el siguiente período:\nDesde el ${startDateLocalized} hasta el ${endDateLocalized}.\nLa fecha y hora de finalización son aproximadas.\nEl mantenimiento podría finalizar antes o extenderse más de lo previsto.`,
      "fr": ` - INFORMATION - \nUne maintenance du serveur est prévue sur la période suivante :\nDu ${startDateLocalized} au ${endDateLocalized}\nL’heure de fin est une estimation et peut s’avérer plus en avance ou tardive qu’annoncé.`,
      "it": ` - INFORMATION - Italian translation goes here:\n${startDateLocalized} until ${endDateLocalized}`,
      "pt-BR": ` - INFORMATION - Portugese translation goes here:\n${startDateLocalized} until ${endDateLocalized}`,
      "zh-TW": ` - 通知 - \n伺服器預計在以下時間維護：\n${startDateLocalized} 至 ${endDateLocalized}\n維護結束時間是預計時間\n維護可能稍早或稍晚結束。`,
      "zh-CN": ` - 通知 - \n服务器预计在以下时间维护：\n${startDateLocalized} 至 ${endDateLocalized}\n维护结束时间是预计时间\n维护可能稍早或稍晚结束。`,
      "ko": ` - INFORMATION - Korean translation goes here:\n${startDateLocalized} until ${endDateLocalized}`,
      "ja": ` - 情報 - \nサーバーメンテナンスの予定は以下の期間:\n${startDateLocalized} から ${endDateLocalized} まで\n終了日・時間は推定です。\nメンテナンスはこの時期より早く終了する場合も遅く終了する場合もあります。`,
    };
    const announcementString = localizedAnnouncementString[Object.keys(localizedAnnouncementString).find(lang => currentLanguage.includes(lang)) ?? "en"];
    this.announcementText = addTextObject(logo.x - 138, logo.y + logo.displayHeight + 116, announcementString, TextStyle.MONEY, { fontSize: "78px", wordWrap: { width: 200 * 6 }});
    this.announcementText.setOrigin(0, 1);
    this.announcementText.setAngle(0);
    this.announcementBg = addWindow(this.announcementText.x - 8, this.announcementText.y + 6, this.announcementText.width / 6 + 14, this.announcementText.height / 6 + 12);
    this.announcementBg.setName("announcement-bg");
    this.announcementBg.setOrigin(0, 1);
    this.titleContainer.add(this.announcementText);
    this.titleContainer.add(this.announcementBg);
    this.titleContainer.bringToTop(this.announcementText);
    // #endregion
  }

  updateTitleStats(): void {
    pokerogueApi.getGameTitleStats()
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

  show(args: any[]): boolean {
    const ret = super.show(args);

    if (ret) {
      this.splashMessage = Utils.randItem(getSplashMessages());
      this.splashMessageText.setText(i18next.t(this.splashMessage, { count: TitleUiHandler.BATTLES_WON_FALLBACK }));

      this.appVersionText.setText("v" + version);

      const ui = this.getUi();

      if (globalScene.eventManager.isEventActive()) {
        this.eventDisplay.setWidth(globalScene.scaledCanvas.width - this.optionSelectBg.width - this.optionSelectBg.x);
        this.eventDisplay.show();
      }

      this.updateTitleStats();

      this.titleStatsTimer = setInterval(() => {
        this.updateTitleStats();
      }, 60000);

      globalScene.tweens.add({
        targets: [ this.titleContainer, ui.getMessageHandler().bg ],
        duration: Utils.fixedInt(325),
        alpha: (target: any) => target === this.titleContainer ? 1 : 0,
        ease: "Sine.easeInOut"
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
      targets: [ this.titleContainer, ui.getMessageHandler().bg ],
      duration: Utils.fixedInt(325),
      alpha: (target: any) => target === this.titleContainer ? 0 : 1,
      ease: "Sine.easeInOut"
    });
  }
}
