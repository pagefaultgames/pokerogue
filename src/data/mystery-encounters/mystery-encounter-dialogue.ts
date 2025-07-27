import type { TextStyle } from "#enums/text-style";

export class TextDisplay {
  speaker?: string;
  text: string;
  style?: TextStyle;
}

export class OptionTextDisplay {
  buttonLabel: string;
  buttonTooltip?: string;
  disabledButtonLabel?: string;
  disabledButtonTooltip?: string;
  secondOptionPrompt?: string;
  selected?: TextDisplay[];
  style?: TextStyle;
}

export class EncounterOptionsDialogue {
  title?: string;
  description?: string;
  query?: string;
  /** Options array with minimum 2 options */
  options?: [...OptionTextDisplay[]];
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
export class MysteryEncounterDialogue {
  intro?: TextDisplay[];
  encounterOptionsDialogue?: EncounterOptionsDialogue;
  outro?: TextDisplay[];
}
