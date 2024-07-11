import MysteryEncounterDialogue from "#app/data/mystery-encounters/mystery-encounter-dialogue";

const namepsace = "mysteryEncounter:lostAtSea";

export const LostAtSeaDialogue: MysteryEncounterDialogue = {
  intro: [
    {
      text: `${namepsace}:intro`
    }
  ],
  encounterOptionsDialogue: {
    title: `${namepsace}:title`,
    description: `${namepsace}:description`,
    query: `${namepsace}:query`,
    options: [
      {
        buttonLabel: `${namepsace}:option:1:label`,
        buttonTooltip: `${namepsace}:option:1:tooltip`,
        selected: [
          {
            text: `${namepsace}:option:1:selected`,
          },
        ],
      },
      {
        buttonLabel: `${namepsace}:option:2:label`,
        buttonTooltip: `${namepsace}:option:2:tooltip`,
        selected: [
          {
            text: `${namepsace}:option:2:selected`,
          },
        ],
      },
      {
        buttonLabel: `${namepsace}:option:3:label`,
        buttonTooltip: `${namepsace}:option:3:tooltip`,
        selected: [
          {
            text: `${namepsace}:option:3:selected`,
          },
        ],
      },
    ],
  },
  outro: [
    {
      text: `${namepsace}:outro`,
    },
  ],
};
