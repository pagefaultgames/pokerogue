import { AudioEvent } from "./audio-event";

export abstract class BgmEvent extends AudioEvent {
  protected static PREFIX: string = `${super.PREFIX}/bgm`;
}
