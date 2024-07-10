import MysteryEncounterDialogue from "#app/data/mystery-encounters/mystery-encounter-dialogue";

export const ShadyVitaminDealerDialogue: MysteryEncounterDialogue = {
  intro: [
    {
      text: "mysteryEncounter:shady_vitamin_dealer_intro_message"
    },
    {
      text: "mysteryEncounter:shady_vitamin_dealer_intro_dialogue",
      speaker: "mysteryEncounter:shady_vitamin_dealer_speaker"
    }
  ],
  encounterOptionsDialogue: {
    title: "mysteryEncounter:shady_vitamin_dealer_title",
    description: "mysteryEncounter:shady_vitamin_dealer_description",
    query: "mysteryEncounter:shady_vitamin_dealer_query",
    options: [
      {
        buttonLabel: "mysteryEncounter:shady_vitamin_dealer_option_1_label",
        buttonTooltip: "mysteryEncounter:shady_vitamin_dealer_option_1_tooltip",
        selected: [
          {
            text: "mysteryEncounter:shady_vitamin_dealer_option_selected"
          },
        ]
      },
      {
        buttonLabel: "mysteryEncounter:shady_vitamin_dealer_option_2_label",
        buttonTooltip: "mysteryEncounter:shady_vitamin_dealer_option_2_tooltip",
        selected: [
          {
            text: "mysteryEncounter:shady_vitamin_dealer_option_selected"
          },
        ]
      },
      {
        buttonLabel: "mysteryEncounter:shady_vitamin_dealer_option_3_label",
        buttonTooltip: "mysteryEncounter:shady_vitamin_dealer_option_3_tooltip"
      }
    ]
  }
};
