import MysteryEncounterDialogue from "#app/data/mystery-encounters/dialogue/mystery-encounter-dialogue";

export const DepartmentStoreSaleDialogue: MysteryEncounterDialogue = {
  intro: [
    {
      text: "mysteryEncounter:department_store_sale_intro_message"
    },
    {
      text: "mysteryEncounter:department_store_sale_intro_dialogue",
      speaker: "mysteryEncounter:department_store_sale_speaker"
    }
  ],
  encounterOptionsDialogue: {
    title: "mysteryEncounter:department_store_sale_title",
    description: "mysteryEncounter:department_store_sale_description",
    query: "mysteryEncounter:department_store_sale_query",
    options: [
      {
        buttonLabel: "mysteryEncounter:department_store_sale_option_1_label",
        buttonTooltip: "mysteryEncounter:department_store_sale_option_1_tooltip"
      },
      {
        buttonLabel: "mysteryEncounter:department_store_sale_option_2_label",
        buttonTooltip: "mysteryEncounter:department_store_sale_option_2_tooltip"
      },
      {
        buttonLabel: "mysteryEncounter:department_store_sale_option_3_label",
        buttonTooltip: "mysteryEncounter:department_store_sale_option_3_tooltip"
      },
      {
        buttonLabel: "mysteryEncounter:department_store_sale_option_4_label",
        buttonTooltip: "mysteryEncounter:department_store_sale_option_4_tooltip"
      }
    ]
  }
};
