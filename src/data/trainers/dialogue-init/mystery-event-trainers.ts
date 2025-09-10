import { TrainerType, TrainerTypeDialogue } from "#data/dialogue";


export const mysteryEventTrainerDialogue: TrainerTypeDialogue = {
  [TrainerType.BUCK]: [
      {
        encounter: ["dialogue:statTrainerBuck.encounter.1", "dialogue:statTrainerBuck.encounter.2"],
        victory: ["dialogue:statTrainerBuck.victory.1", "dialogue:statTrainerBuck.victory.2"],
        defeat: ["dialogue:statTrainerBuck.defeat.1", "dialogue:statTrainerBuck.defeat.2"],
      },
    ],
    [TrainerType.CHERYL]: [
      {
        encounter: ["dialogue:statTrainerCheryl.encounter.1", "dialogue:statTrainerCheryl.encounter.2"],
        victory: ["dialogue:statTrainerCheryl.victory.1", "dialogue:statTrainerCheryl.victory.2"],
        defeat: ["dialogue:statTrainerCheryl.defeat.1", "dialogue:statTrainerCheryl.defeat.2"],
      },
    ],
    [TrainerType.MARLEY]: [
      {
        encounter: ["dialogue:statTrainerMarley.encounter.1", "dialogue:statTrainerMarley.encounter.2"],
        victory: ["dialogue:statTrainerMarley.victory.1", "dialogue:statTrainerMarley.victory.2"],
        defeat: ["dialogue:statTrainerMarley.defeat.1", "dialogue:statTrainerMarley.defeat.2"],
      },
    ],
    [TrainerType.MIRA]: [
      {
        encounter: ["dialogue:statTrainerMira.encounter.1", "dialogue:statTrainerMira.encounter.2"],
        victory: ["dialogue:statTrainerMira.victory.1", "dialogue:statTrainerMira.victory.2"],
        defeat: ["dialogue:statTrainerMira.defeat.1", "dialogue:statTrainerMira.defeat.2"],
      },
    ],
    [TrainerType.RILEY]: [
      {
        encounter: ["dialogue:statTrainerRiley.encounter.1", "dialogue:statTrainerRiley.encounter.2"],
        victory: ["dialogue:statTrainerRiley.victory.1", "dialogue:statTrainerRiley.victory.2"],
        defeat: ["dialogue:statTrainerRiley.defeat.1", "dialogue:statTrainerRiley.defeat.2"],
      },
    ],
    [TrainerType.VICTOR]: [
      {
        encounter: ["dialogue:winstratesVictor.encounter.1"],
        victory: ["dialogue:winstratesVictor.victory.1"],
      },
    ],
    [TrainerType.VICTORIA]: [
      {
        encounter: ["dialogue:winstratesVictoria.encounter.1"],
        victory: ["dialogue:winstratesVictoria.victory.1"],
      },
    ],
    [TrainerType.VIVI]: [
      {
        encounter: ["dialogue:winstratesVivi.encounter.1"],
        victory: ["dialogue:winstratesVivi.victory.1"],
      },
    ],
    [TrainerType.VICKY]: [
      {
        encounter: ["dialogue:winstratesVicky.encounter.1"],
        victory: ["dialogue:winstratesVicky.victory.1"],
      },
    ],
    [TrainerType.VITO]: [
      {
        encounter: ["dialogue:winstratesVito.encounter.1"],
        victory: ["dialogue:winstratesVito.victory.1"],
      },
    ],
}