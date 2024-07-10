import MysteryEncounterDialogue from "#app/data/mystery-encounters/mystery-encounter-dialogue";

export const DarkDealDialogue: MysteryEncounterDialogue = {
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
        buttonTooltip: "mysteryEncounter:dark_deal_option_1_tooltip",
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
        buttonTooltip: "mysteryEncounter:dark_deal_option_2_tooltip",
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
};
