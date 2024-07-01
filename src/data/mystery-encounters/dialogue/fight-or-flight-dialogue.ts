import MysteryEncounterDialogue from "#app/data/mystery-encounters/dialogue/mystery-encounter-dialogue";

export const FightOrFlightDialogue: MysteryEncounterDialogue = {
  intro: [
    {
      text: "mysteryEncounter:fight_or_flight_intro_message"
    }
  ],
  encounterOptionsDialogue: {
    title: "mysteryEncounter:fight_or_flight_title",
    description: "mysteryEncounter:fight_or_flight_description",
    query: "mysteryEncounter:fight_or_flight_query",
    options: [
      {
        buttonLabel: "mysteryEncounter:fight_or_flight_option_1_label",
        buttonTooltip: "mysteryEncounter:fight_or_flight_option_1_tooltip",
        selected: [
          {
            text: "mysteryEncounter:fight_or_flight_option_1_selected_message"
          }
        ]
      },
      {
        buttonLabel: "mysteryEncounter:fight_or_flight_option_2_label",
        buttonTooltip: "mysteryEncounter:fight_or_flight_option_2_tooltip"
      },
      {
        buttonLabel: "mysteryEncounter:fight_or_flight_option_3_label",
        buttonTooltip: "mysteryEncounter:fight_or_flight_option_3_tooltip",
        selected: [
          {
            text: "mysteryEncounter:fight_or_flight_option_3_selected"
          }
        ]
      }
    ]
  }
};
