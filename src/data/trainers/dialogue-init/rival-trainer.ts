import { TrainerType, TrainerTypeDialogue } from "#data/dialogue";


export const rivalDialogue: TrainerTypeDialogue = {
  [TrainerType.RIVAL]: [
    {
      encounter: ["dialogue:rival.encounter.1"],
      victory: ["dialogue:rival.victory.1"],
    },
    {
      encounter: ["dialogue:rivalFemale.encounter.1"],
      victory: ["dialogue:rivalFemale.victory.1"],
    },
  ],
  [TrainerType.RIVAL_2]: [
    {
      encounter: ["dialogue:rival2.encounter.1"],
      victory: ["dialogue:rival2.victory.1"],
    },
    {
      encounter: ["dialogue:rival2Female.encounter.1"],
      victory: ["dialogue:rival2Female.victory.1"],
      defeat: ["dialogue:rival2Female.defeat.1"],
    },
  ],
  [TrainerType.RIVAL_3]: [
    {
      encounter: ["dialogue:rival3.encounter.1"],
      victory: ["dialogue:rival3.victory.1"],
    },
    {
      encounter: ["dialogue:rival3Female.encounter.1"],
      victory: ["dialogue:rival3Female.victory.1"],
      defeat: ["dialogue:rival3Female.defeat.1"],
    },
  ],
  [TrainerType.RIVAL_4]: [
    {
      encounter: ["dialogue:rival4.encounter.1"],
      victory: ["dialogue:rival4.victory.1"],
    },
    {
      encounter: ["dialogue:rival4Female.encounter.1"],
      victory: ["dialogue:rival4Female.victory.1"],
      defeat: ["dialogue:rival4Female.defeat.1"],
    },
  ],
  [TrainerType.RIVAL_5]: [
    {
      encounter: ["dialogue:rival5.encounter.1"],
      victory: ["dialogue:rival5.victory.1"],
    },
    {
      encounter: ["dialogue:rival5Female.encounter.1"],
      victory: ["dialogue:rival5Female.victory.1"],
      defeat: ["dialogue:rival5Female.defeat.1"],
    },
  ],
  [TrainerType.RIVAL_6]: [
    {
      encounter: ["dialogue:rival6.encounter.1"],
      victory: ["dialogue:rival6.victory.1"],
    },
    {
      encounter: ["dialogue:rival6Female.encounter.1"],
      victory: ["dialogue:rival6Female.victory.1"],
    },
  ],
}