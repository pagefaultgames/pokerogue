import { BgmEvent } from "./bgm-event";

export class BgmChangedEvent extends BgmEvent {
  public static readonly NAME = `${this.PREFIX}/changed`;

  constructor(public readonly title: string) {
    super(BgmChangedEvent.NAME);
  }
}
