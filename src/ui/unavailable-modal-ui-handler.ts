import BattleScene from "../battle-scene";
import { ModalConfig, ModalUiHandler } from "./modal-ui-handler";
import { addTextObject, TextStyle } from "./text";
import { Mode } from "./ui";
import { updateUserInfo } from "#app/account";
import * as Utils from "#app/utils";

export default class UnavailableModalUiHandler extends ModalUiHandler {
  private reconnectTimer: NodeJS.Timeout;
  private reconnectDuration: number;
  private reconnectCallback: () => void;

  private readonly minTime = 1000 * 5;
  private readonly maxTime = 1000 * 60 * 5;

  private readonly randVarianceTime = 1000 * 10;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
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

    const label = addTextObject(this.scene, this.getWidth() / 2, this.getHeight() / 2, "Oops! There was an issue contacting the server.\n\nYou may leave this window open,\nthe game will automatically reconnect.", TextStyle.WINDOW, { fontSize: "48px", align: "center" });
    label.setOrigin(0.5, 0.5);

    this.modalContainer.add(label);
  }

  tryReconnect(): void {
    updateUserInfo().then(response => {
      if (response[0] || [200, 400].includes(response[1])) {
        this.reconnectTimer = null;
        this.reconnectDuration = this.minTime;
        this.scene.playSound("pb_bounce_1");
        this.reconnectCallback();
      } else if (response[1] === 401) {
        Utils.setCookie(Utils.sessionIdKey, "");
        this.scene.reset(true, true);
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
