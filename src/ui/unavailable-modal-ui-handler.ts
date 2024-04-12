import BattleScene from "../battle-scene";
import { ModalConfig, ModalUiHandler } from "./modal-ui-handler";
import { addTextObject, TextStyle } from "./text";
import { Mode } from "./ui";
import { updateUserInfo } from "#app/account";

export default class UnavailableModalUiHandler extends ModalUiHandler {
  private reconnectTimer: number;
  private reconnectCallback: () => void;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
  }

  getModalTitle(): string {
    return '';
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

    const label = addTextObject(this.scene, this.getWidth() / 2, this.getHeight() / 2, 'Oops! There was an issue contacting the server.\n\nYou may leave this window open,\nthe game will automatically reconnect.', TextStyle.WINDOW, { fontSize: '48px', align: 'center' });
    label.setOrigin(0.5, 0.5);

    this.modalContainer.add(label);
  }

  show(args: any[]): boolean {
    if (args.length >= 1 && args[0] instanceof Function) {
      const config: ModalConfig = {
        buttonActions: []
      };

      this.reconnectCallback = args[0];

      this.reconnectTimer = setInterval(() => {
        updateUserInfo().then(response => {
          if (response[0] || [200, 400].includes(response[1])) {
            clearInterval(this.reconnectTimer);
            this.reconnectTimer = null;
            this.scene.playSound('pb_bounce_1');
            this.reconnectCallback();
          }
        })
      }, 5000);

      return super.show([ config ]);
    }

    return false;
  }
}