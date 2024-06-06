import { MysteryEncounterType } from "./enums/mystery-encounter-type";

export class TextDisplay {
  speaker?: TemplateStringsArray | `mysteryEncounter:${string}`;
  text: TemplateStringsArray | `mysteryEncounter:${string}`;
}

export class OptionTextDisplay {
  buttonLabel: TemplateStringsArray | `mysteryEncounter:${string}`;
  buttonTooltip?: TemplateStringsArray | `mysteryEncounter:${string}`;
  selected?: TextDisplay[];
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

export interface EncounterTypeDialogue {
  [key: integer]: MysteryEncounterDialogue
}

export function getEncounterTypeDialogue(): EncounterTypeDialogue {
  return allMysteryEncounterDialogue;
}


/**
 * Example EncounterText object:
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
        text: "This message will be displayed at the end of the encounter (i.e. post battle, post reward, etc.)"
      }
    ],
 }
 *
 */

export const allMysteryEncounterDialogue: EncounterTypeDialogue  = {
  [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]: {
    intro: [
      {
        text: "mysteryEncounter:mysterious_challengers_intro_message"
      }
    ],
    encounterOptionsDialogue: {
      title: "mysteryEncounter:mysterious_challengers_title",
      description: "mysteryEncounter:mysterious_challengers_description",
      query: "mysteryEncounter:mysterious_challengers_query",
      options: [
        {
          buttonLabel: "mysteryEncounter:mysterious_challengers_option_1_label",
          selected: [
            {
              text: "mysteryEncounter:mysterious_challengers_option_selected_message"
            }
          ]
        },
        {
          buttonLabel: "mysteryEncounter:mysterious_challengers_option_2_label",
          selected: [
            {
              text: "mysteryEncounter:mysterious_challengers_option_selected_message"
            }
          ]
        },
        {
          buttonLabel: "mysteryEncounter:mysterious_challengers_option_3_label",
          selected: [
            {
              text: "mysteryEncounter:mysterious_challengers_option_selected_message"
            }
          ]
        },
        {
          buttonLabel: "mysteryEncounter:mysterious_challengers_option_4_label",
          selected: [
            {
              text: "mysteryEncounter:mysterious_challengers_option_4_selected_message"
            }
          ]
        }
      ]
    },
    outro: [
      {
        text: "mysteryEncounter:mysterious_challengers_outro_win"
      }
    ]
  },
  [MysteryEncounterType.MYSTERIOUS_CHEST]: {
    intro: [
      {
        text: "mysteryEncounter:mysterious_chest_intro_message"
      }
    ],
    encounterOptionsDialogue: {
      title: "mysteryEncounter:mysterious_chest_title",
      description: "mysteryEncounter:mysterious_chest_description",
      query: "mysteryEncounter:mysterious_chest_query",
      options: [
        {
          buttonLabel: "mysteryEncounter:mysterious_chest_option_1_label",
          selected: [
            {
              text: "mysteryEncounter:mysterious_chest_option_1_selected_message"
            }
          ]
        },
        {
          buttonLabel: "mysteryEncounter:mysterious_chest_option_2_label",
          selected: [
            {
              text: "mysteryEncounter:mysterious_chest_option_2_selected_message"
            }
          ]
        }
      ]
    }
  },
  [MysteryEncounterType.DARK_DEAL]: {
    intro: [
      {
        text: "mysteryEncounter:dark_deal_intro_message"
      },
      {
        speaker: "mysteryEncounter:dark_deal_speaker",
        text: "mysteryEncounter:dark_deal_intro_dialogue"
      }
    ],
    encounterOptionsDialogue: {
      title: "mysteryEncounter:dark_deal_title",
      description: "mysteryEncounter:dark_deal_description",
      query: "mysteryEncounter:dark_deal_query",
      options: [
        {
          buttonLabel: "mysteryEncounter:dark_deal_option_1_label",
          buttonTooltip: "mysteryEncounter:optionTooltip",
          selected: [
            {
              speaker: "mysteryEncounter:dark_deal_speaker",
              text: "mysteryEncounter:dark_deal_option_1_selected"
            },
            {
              text: "mysteryEncounter:dark_deal_option_1_selected_message"
            }
          ]
        },
        {
          buttonLabel: "mysteryEncounter:dark_deal_option_2_label",
          buttonTooltip: "mysteryEncounter:optionTooltip",
          selected: [
            {
              speaker: "mysteryEncounter:dark_deal_speaker",
              text: "mysteryEncounter:dark_deal_option_2_selected"
            }
          ]
        }
      ]
    },
    outro: [
      {
        text: "mysteryEncounter:dark_deal_outro"
      }
    ]
  }
};
