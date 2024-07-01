import MysteryEncounter from "../mystery-encounter";
import {DarkDealEncounter} from "./dark-deal";
import {MysteriousChallengersEncounter} from "./mysterious-challengers";
import {MysteriousChestEncounter} from "./mysterious-chest";
import {FightOrFlightEncounter} from "#app/data/mystery-encounters/fight-or-flight";
import {TrainingSessionEncounter} from "#app/data/mystery-encounters/training-session";

// TODO: reset BASE_MYSTYERY_ENCOUNTER_WEIGHT to 4, 90 is for test branch
export const BASE_MYSTYERY_ENCOUNTER_WEIGHT = 90;

export const allMysteryEncounters: MysteryEncounter[] = [];

export function initMysteryEncounters() {
  allMysteryEncounters.push(
    MysteriousChallengersEncounter,
    MysteriousChestEncounter,
    DarkDealEncounter,
    FightOrFlightEncounter,
    TrainingSessionEncounter
  );
}
