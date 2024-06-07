import * as Utils from "../utils";

export class MysteryEncounterFlags {
  encounteredEvents: number[] = [];

  constructor(flags: MysteryEncounterFlags) {
    if (!Utils.isNullOrUndefined(flags)) {
      Object.assign(this, flags);
    }
  }
}
