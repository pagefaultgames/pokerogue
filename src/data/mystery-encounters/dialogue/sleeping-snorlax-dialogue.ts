import MysteryEncounterDialogue from "#app/data/mystery-encounters/mystery-encounter-dialogue";

export const SleepingSnorlaxDialogue: MysteryEncounterDialogue = {
  intro: [
    {
      text: "mysteryEncounter:sleeping_snorlax_intro_message"
    }
  ],
  encounterOptionsDialogue: {
    title: "mysteryEncounter:sleeping_snorlax_title",
    description: "mysteryEncounter:sleeping_snorlax_description",
    query: "mysteryEncounter:sleeping_snorlax_query",
    options: [
      {
        buttonLabel: "mysteryEncounter:sleeping_snorlax_option_1_label",
        buttonTooltip: "mysteryEncounter:sleeping_snorlax_option_1_tooltip",
        selected: [
          {
            text: "mysteryEncounter:sleeping_snorlax_option_1_selected_message"
          }
        ]
      },
      {
        buttonLabel: "mysteryEncounter:sleeping_snorlax_option_2_label",
        buttonTooltip: "mysteryEncounter:sleeping_snorlax_option_2_tooltip",
        selected: [
          {
            text: "mysteryEncounter:sleeping_snorlax_option_2_selected_message"
          }
        ]
      },
      {
        buttonLabel: "mysteryEncounter:sleeping_snorlax_option_3_label",
        buttonTooltip: "mysteryEncounter:sleeping_snorlax_option_3_tooltip",
        disabledTooltip: "mysteryEncounter:sleeping_snorlax_option_3_disabled_tooltip"
      }
    ]
  }
};
