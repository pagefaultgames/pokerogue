import MysteryEncounter from "../mystery-encounter";
import { DarkDealEncounter } from "./dark-deal";
import { MysteriousChallengersEncounter } from "./mysterious-challengers";
import { MysteriousChestEncounter } from "./mysterious-chest";

export const allMysteryEncounters: MysteryEncounter[] = [];

export function initMysteryEncounters() {
  allMysteryEncounters.push(
    MysteriousChallengersEncounter,
    MysteriousChestEncounter,
    DarkDealEncounter
  );
}
