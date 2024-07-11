import MysteryEncounterDialogue from "#app/data/mystery-encounters/mystery-encounter-dialogue";

export const FieldTripDialogue: MysteryEncounterDialogue = {
  intro: [
    {
      text: "mysteryEncounter:field_trip_intro_message"
    },
    {
      text: "mysteryEncounter:field_trip_intro_dialogue",
      speaker: "mysteryEncounter:field_trip_speaker"
    }
  ],
  encounterOptionsDialogue: {
    title: "mysteryEncounter:field_trip_title",
    description: "mysteryEncounter:field_trip_description",
    query: "mysteryEncounter:field_trip_query",
    options: [
      {
        buttonLabel: "mysteryEncounter:field_trip_option_1_label",
        buttonTooltip: "mysteryEncounter:field_trip_option_1_tooltip",
        secondOptionPrompt: "mysteryEncounter:field_trip_second_option_prompt",
        selected: [
          {
            text: "mysteryEncounter:field_trip_option_selected"
          }
        ]
      },
      {
        buttonLabel: "mysteryEncounter:field_trip_option_2_label",
        buttonTooltip: "mysteryEncounter:field_trip_option_2_tooltip",
        secondOptionPrompt: "mysteryEncounter:field_trip_second_option_prompt",
        selected: [
          {
            text: "mysteryEncounter:field_trip_option_selected"
          }
        ]
      },
      {
        buttonLabel: "mysteryEncounter:field_trip_option_3_label",
        buttonTooltip: "mysteryEncounter:field_trip_option_3_tooltip",
        secondOptionPrompt: "mysteryEncounter:field_trip_second_option_prompt",
        selected: [
          {
            text: "mysteryEncounter:field_trip_option_selected"
          }
        ]
      }
    ]
  }
};
