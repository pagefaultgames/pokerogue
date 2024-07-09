import { BgmEvent } from "./bgm-event";

export class BgmVolumeChangedEvent extends BgmEvent {
  public static readonly NAME = `${this.PREFIX}/volume/changed`;

  constructor(public readonly volume: number) {
    super(BgmVolumeChangedEvent.NAME);
  }
}
