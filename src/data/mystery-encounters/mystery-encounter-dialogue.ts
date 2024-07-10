import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { MysteriousChallengersDialogue } from "#app/data/mystery-encounters/dialogue/mysterious-challengers-dialogue";
import { MysteriousChestDialogue } from "#app/data/mystery-encounters/dialogue/mysterious-chest-dialogue";
import { DarkDealDialogue } from "#app/data/mystery-encounters/dialogue/dark-deal-dialogue";
import { FightOrFlightDialogue } from "#app/data/mystery-encounters/dialogue/fight-or-flight-dialogue";
import { TrainingSessionDialogue } from "#app/data/mystery-encounters/dialogue/training-session-dialogue";
import { SleepingSnorlaxDialogue } from "./dialogue/sleeping-snorlax-dialogue";
import { DepartmentStoreSaleDialogue } from "#app/data/mystery-encounters/dialogue/department-store-sale-dialogue";
import { ShadyVitaminDealerDialogue } from "#app/data/mystery-encounters/dialogue/shady-vitamin-dealer";
import { TextStyle } from "#app/ui/text";

export class TextDisplay {
  speaker?: TemplateStringsArray | `mysteryEncounter:${string}`;
  text: TemplateStringsArray | `mysteryEncounter:${string}`;
  style?: TextStyle;
}

export class OptionTextDisplay {
  buttonLabel: TemplateStringsArray | `mysteryEncounter:${string}`;
  buttonTooltip?: TemplateStringsArray | `mysteryEncounter:${string}`;
  disabledTooltip?: TemplateStringsArray | `mysteryEncounter:${string}`;
  secondOptionPrompt?: TemplateStringsArray | `mysteryEncounter:${string}`;
  selected?: TextDisplay[];
  style?: TextStyle;
}

export class EncounterOptionsDialogue {
  title: TemplateStringsArray | `mysteryEncounter:${string}`;
  description: TemplateStringsArray | `mysteryEncounter:${string}`;
  query?: TemplateStringsArray | `mysteryEncounter:${string}`;
  options: [OptionTextDisplay, OptionTextDisplay, ...OptionTextDisplay[]]; // Options array with minimum 2 options
}

export default class MysteryEncounterDialogue {
  intro?: TextDisplay[];
  encounterOptionsDialogue: EncounterOptionsDialogue;
  outro?: TextDisplay[];
}

/**
 * Example MysteryEncounterDialogue object:
 *
 {
    intro: [
      {
        text: "this is a rendered as a message window (no title display)"
      },
      {
        speaker: "John"
        text: "this is a rendered as a dialogue window (title "John" is displayed above text)"
      }
    ],
    encounterOptionsDialogue: {
      title: "This is the title displayed at top of encounter description box",
      description: "This is the description in the middle of encounter description box",
      query: "This is an optional question displayed at the bottom of the description box (keep it short)",
      options: [
        {
          buttonLabel: "Option #1 button label (keep these short)",
          selected: [ // Optional dialogue windows displayed when specific option is selected and before functional logic for the option is executed
            {
              text: "You chose option #1 message"
            },
            {
              speaker: "John"
              text: "So, you've chosen option #1! It's time to d-d-d-duel!"
            }
          ]
        },
        {
          buttonLabel: "Option #2"
        }
      ],
    },
    outro: [
      {
        text: "This message will be displayed at the very end of the encounter (i.e. post battle, post reward, etc.)"
      }
    ],
 }
 *
 */

export const allMysteryEncounterDialogue: { [encounterType: number]: MysteryEncounterDialogue } = {};

export function initMysteryEncounterDialogue() {
  allMysteryEncounterDialogue[MysteryEncounterType.MYSTERIOUS_CHALLENGERS] = MysteriousChallengersDialogue;
  allMysteryEncounterDialogue[MysteryEncounterType.MYSTERIOUS_CHEST] = MysteriousChestDialogue;
  allMysteryEncounterDialogue[MysteryEncounterType.DARK_DEAL] = DarkDealDialogue;
  allMysteryEncounterDialogue[MysteryEncounterType.FIGHT_OR_FLIGHT] = FightOrFlightDialogue;
  allMysteryEncounterDialogue[MysteryEncounterType.TRAINING_SESSION] = TrainingSessionDialogue;
  allMysteryEncounterDialogue[MysteryEncounterType.SLEEPING_SNORLAX] = SleepingSnorlaxDialogue;
  allMysteryEncounterDialogue[MysteryEncounterType.DEPARTMENT_STORE_SALE] = DepartmentStoreSaleDialogue;
  allMysteryEncounterDialogue[MysteryEncounterType.SHADY_VITAMIN_DEALER] = ShadyVitaminDealerDialogue;
}
