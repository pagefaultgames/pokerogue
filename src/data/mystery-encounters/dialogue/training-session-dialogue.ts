import MysteryEncounterDialogue from "#app/data/mystery-encounters/dialogue/mystery-encounter-dialogue";

export const TrainingSessionDialogue: MysteryEncounterDialogue = {
  intro: [
    {
      text: "mysteryEncounter:training_session_intro_message"
    }
  ],
  encounterOptionsDialogue: {
    title: "mysteryEncounter:training_session_title",
    description: "mysteryEncounter:training_session_description",
    query: "mysteryEncounter:training_session_query",
    options: [
      {
        buttonLabel: "mysteryEncounter:training_session_option_1_label",
        buttonTooltip: "mysteryEncounter:training_session_option_1_tooltip",
        selected: [
          {
            text: "mysteryEncounter:training_session_option_selected_message"
          }
        ]
      },
      {
        buttonLabel: "mysteryEncounter:training_session_option_2_label",
        buttonTooltip: "mysteryEncounter:training_session_option_2_tooltip",
        secondOptionPrompt: "mysteryEncounter:training_session_option_2_select_prompt",
        selected: [
          {
            text: "mysteryEncounter:training_session_option_selected_message"
          }
        ]
      },
      {
        buttonLabel: "mysteryEncounter:training_session_option_3_label",
        buttonTooltip: "mysteryEncounter:training_session_option_3_tooltip",
        secondOptionPrompt: "mysteryEncounter:training_session_option_3_select_prompt",
        selected: [
          {
            text: "mysteryEncounter:training_session_option_selected_message"
          }
        ]
      }
    ]
  },
  outro: [
    {
      text: "mysteryEncounter:training_session_outro_win"
    }
  ]
};
