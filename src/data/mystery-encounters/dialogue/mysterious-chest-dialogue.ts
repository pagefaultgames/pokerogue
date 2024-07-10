import MysteryEncounterDialogue from "#app/data/mystery-encounters/mystery-encounter-dialogue";

export const MysteriousChestDialogue: MysteryEncounterDialogue = {
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
        buttonTooltip: "mysteryEncounter:mysterious_chest_option_1_tooltip",
        selected: [
          {
            text: "mysteryEncounter:mysterious_chest_option_1_selected_message"
          }
        ]
      },
      {
        buttonLabel: "mysteryEncounter:mysterious_chest_option_2_label",
        buttonTooltip: "mysteryEncounter:mysterious_chest_option_2_tooltip",
        selected: [
          {
            text: "mysteryEncounter:mysterious_chest_option_2_selected_message"
          }
        ]
      }
    ]
  }
};
