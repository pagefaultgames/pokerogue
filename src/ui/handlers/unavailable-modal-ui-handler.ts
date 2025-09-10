import { updateUserInfo } from "#app/account";
import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import type { UiMode } from "#enums/ui-mode";
import type { ModalConfig } from "#ui/handlers/modal-ui-handler";
import { ModalUiHandler } from "#ui/handlers/modal-ui-handler";
import { addTextObject } from "#ui/text";
import { sessionIdKey } from "#utils/common";
import { removeCookie } from "#utils/cookies";
import i18next from "i18next";

export class UnavailableModalUiHandler extends ModalUiHandler {
  private reconnectDuration: number;
  private reconnectCallback: () => void;

  private readonly minTime = 1000 * 5;
  private readonly maxTime = 1000 * 60 * 5;

  private readonly randVarianceTime = 1000 * 10;

  constructor(mode: UiMode | null = null) {
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
    return [0, 0, 48, 0];
  }

  getButtonLabels(): string[] {
    return [];
  }

  setup(): void {
    super.setup();

    const label = addTextObject(
      this.getWidth() / 2,
      this.getHeight() / 2,
      i18next.t("menu:errorServerDown"),
      TextStyle.WINDOW,
      { fontSize: "48px", align: "center" },
    );
    label.setOrigin(0.5, 0.5);

    this.modalContainer.add(label);
  }

  tryReconnect(): void {
    updateUserInfo().then(response => {
      if (response[0] || [200, 400].includes(response[1])) {
        this.reconnectDuration = this.minTime;
        globalScene.playSound("se/pb_bounce_1");
        this.reconnectCallback();
      } else if (response[1] === 401) {
        removeCookie(sessionIdKey);
        globalScene.reset(true, true);
      } else {
        this.reconnectDuration = Math.min(this.reconnectDuration * 2, this.maxTime); // Set a max delay so it isn't infinite
        setTimeout(
          () => this.tryReconnect(),
          // Adds a random factor to avoid pendulum effect during long total breakdown
          this.reconnectDuration + Math.random() * this.randVarianceTime,
        );
      }
    });
  }

  show(args: any[]): boolean {
    if (args.length > 0 && args[0] instanceof Function) {
      const config: ModalConfig = {
        buttonActions: [],
      };

      this.reconnectCallback = args[0];
      this.reconnectDuration = this.minTime;
      setTimeout(() => this.tryReconnect(), this.reconnectDuration);

      return super.show([config]);
    }

    return false;
  }
}
