export class MysteryEncounterFlags {
  encounteredEvents: number[] = [];

  constructor(flags: MysteryEncounterFlags) {
    Object.assign(this, flags);
  }
}
