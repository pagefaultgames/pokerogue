import { AudioEvent } from "./audio-event";

export class MasterVolumeChangedEvent extends AudioEvent {
  public static readonly NAME = `${this.PREFIX}/masterVolume/changed`;

  constructor(public readonly volume: number) {
    super(MasterVolumeChangedEvent.NAME);
  }
}
