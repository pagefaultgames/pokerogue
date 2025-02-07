import type { ModalConfig } from "./modal-ui-handler";
import { ModalUiHandler } from "./modal-ui-handler";
import { addTextObject, TextStyle } from "./text";
import type { Mode } from "./ui";
import { updateUserInfo } from "#app/account";
import * as Utils from "#app/utils";
import i18next from "i18next";
import { globalScene } from "#app/global-scene";

export default class UnavailableModalUiHandler extends ModalUiHandler {
  private reconnectTimer: NodeJS.Timeout | null;
  private reconnectDuration: number;
  private reconnectCallback: () => void;

  private readonly minTime = 1000 * 5;
  private readonly maxTime = 1000 * 60 * 5;

  private readonly randVarianceTime = 1000 * 10;

  constructor(mode: Mode | null = null) {
    super(mode);
    this.reconnectDuration = this.minTime;
  }

  getModalTitle(): string {
    return "";
  }

  getWidth(): number {
    return 160;
  }

  getHeight(): number {
    return 64;
  }

  getMargin(): [number, number, number, number] {
    return [ 0, 0, 48, 0 ];
  }

  getButtonLabels(): string[] {
    return [ ];
  }

  setup(): void {
    super.setup();

    //    const label = addTextObject(this.getWidth() / 2, this.getHeight() / 2, i18next.t("menu:errorServerDown"), TextStyle.WINDOW, { fontSize: "48px", align: "center" });
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
      "en": ` - INFORMATION -\nServer maintenance is scheduled for the following period:\n${startDateLocalized} until ${endDateLocalized}\nEnd date and hour are an estimate.\nMaintenance may end at an earlier or later time.`,
      "de": `- INFORMATION -\nServerwartung ist für den folgenden Zeitraum geplant:\n${startDateLocalized} bis ${endDateLocalized}\nEnddatum und Uhrzeit sind eine Schätzung.\nDie Wartung kann früher oder später beendet werden.`,
      "es-ES": ` - INFORMACIÓN -\nUn mantenimiento del servidor está programado para el siguiente período:\nDesde el ${startDateLocalized} hasta el ${endDateLocalized}.\nLa fecha y hora de finalización son aproximadas.\nEl mantenimiento podría finalizar antes o extenderse más de lo previsto.`,
      "fr": ` - INFORMATION -\nUne maintenance du serveur est prévue sur la période suivante :\nDu ${startDateLocalized} au ${endDateLocalized}\nL’heure de fin est une estimation et peut s’avérer plus en avance ou tardive qu’annoncé.`,
      "it": ` - ANNUNCIO -\nUna manutenzione del server avrà luogo nel periodo seguente:\nDal ${startDateLocalized} al ${endDateLocalized}\nData e ora di fine manutenzione sono una stima,\npotrebbe terminare in anticipo o più tardi.`,
      "pt-BR": ` - INFORMATION - Portugese translation goes here:\n${startDateLocalized} until ${endDateLocalized}`,
      "zh-TW": ` - 通知 -\n伺服器預計在以下時間維護：\n${startDateLocalized} 至 ${endDateLocalized}\n維護結束時間是預計時間\n維護可能稍早或稍晚結束。`,
      "zh-CN": ` - 通知 -\n服务器预计在以下时间维护：\n${startDateLocalized} 至 ${endDateLocalized}\n维护结束时间是预计时间\n维护可能稍早或稍晚结束。`,
      "ko": ` - 공지사항 -\n아래 기간동안 점검 예정입니다. :\n${startDateLocalized} ~ ${endDateLocalized}\n종료시각은 예상시간입니다.\n점검은 예상했던 것보다 빠르게 혹은 늦게  끝날 수 있습니다.`,
      "ja": ` - 情報 -\nサーバーメンテナンスの予定は以下の期間:\n${startDateLocalized} から ${endDateLocalized} まで\n終了日・時間は推定です。\nメンテナンスはこの時期より早く終了する場合も\n遅く終了する場合もあります。`,
    };
    const announcementString = localizedAnnouncementString[Object.keys(localizedAnnouncementString).find(lang => currentLanguage.includes(lang)) ?? "en"];
    const label = addTextObject(this.getWidth() / 2, this.getHeight() / 2, announcementString, TextStyle.WINDOW, { fontSize: "48px", align: "center" });
    label.setOrigin(0.5, 0.5);

    this.modalContainer.add(label);
  }

  tryReconnect(): void {
    updateUserInfo().then(response => {
      if (response[0] || [ 200, 400 ].includes(response[1])) {
        this.reconnectTimer = null;
        this.reconnectDuration = this.minTime;
        globalScene.playSound("se/pb_bounce_1");
        this.reconnectCallback();
      } else if (response[1] === 401) {
        Utils.removeCookie(Utils.sessionIdKey);
        globalScene.reset(true, true);
      } else {
        this.reconnectDuration = Math.min(this.reconnectDuration * 2, this.maxTime); // Set a max delay so it isn't infinite
        this.reconnectTimer =
          setTimeout(
            () => this.tryReconnect(),
            // Adds a random factor to avoid pendulum effect during long total breakdown
            this.reconnectDuration + (Math.random() * this.randVarianceTime));
      }
    });
  }

  show(args: any[]): boolean {
    if (args.length >= 1 && args[0] instanceof Function) {
      const config: ModalConfig = {
        buttonActions: []
      };

      this.reconnectCallback = args[0];
      this.reconnectDuration = this.minTime;
      this.reconnectTimer = setTimeout(() => this.tryReconnect(), this.reconnectDuration);

      return super.show([ config ]);
    }

    return false;
  }
}
