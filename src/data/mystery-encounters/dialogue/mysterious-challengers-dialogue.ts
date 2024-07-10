import MysteryEncounterDialogue from "#app/data/mystery-encounters/mystery-encounter-dialogue";

export const MysteriousChallengersDialogue: MysteryEncounterDialogue = {
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
        buttonTooltip: "mysteryEncounter:mysterious_challengers_option_1_tooltip",
        selected: [
          {
            text: "mysteryEncounter:mysterious_challengers_option_selected_message"
          }
        ]
      },
      {
        buttonLabel: "mysteryEncounter:mysterious_challengers_option_2_label",
        buttonTooltip: "mysteryEncounter:mysterious_challengers_option_2_tooltip",
        selected: [
          {
            text: "mysteryEncounter:mysterious_challengers_option_selected_message"
          }
        ]
      },
      {
        buttonLabel: "mysteryEncounter:mysterious_challengers_option_3_label",
        buttonTooltip: "mysteryEncounter:mysterious_challengers_option_3_tooltip",
        selected: [
          {
            text: "mysteryEncounter:mysterious_challengers_option_selected_message"
          }
        ]
      },
      {
        buttonLabel: "mysteryEncounter:mysterious_challengers_option_4_label",
        buttonTooltip: "mysteryEncounter:mysterious_challengers_option_4_tooltip",
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
};
