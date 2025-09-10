import { BattleSpec } from "#enums/battle-spec";
import { TrainerType } from "#enums/trainer-type";
import { championDialogue } from "#trainers/dialogue-init/champion-trainers";
import { eliteFourDialogue } from "#trainers/dialogue-init/elite-four-trainers";
import { evilAdminDialogue } from "#trainers/dialogue-init/evil-organizations/evil-admin-trainers";
import { evilGruntsDialogue } from "#trainers/dialogue-init/evil-organizations/evil-grunts-trainers";
import { evilLeaderDialogue } from "#trainers/dialogue-init/evil-organizations/evil-leader-trainers";
import { gymLeaderDialogue } from "#trainers/dialogue-init/gym-trainers";
import { mysteryEventTrainerDialogue } from "#trainers/dialogue-init/mystery-event-trainers";
import { randomNPCDialogue } from "#trainers/dialogue-init/random-npcs-trainers";
import { rivalDialogue } from "#trainers/dialogue-init/rival-trainer";
import { trainerConfigs } from "#trainers/trainer-configs-init";
import { capitalizeFirstLetter } from "#utils/strings";

export interface TrainerTypeMessages {
  encounter?: string | string[];
  victory?: string | string[];
  defeat?: string | string[];
}

export interface TrainerTypeDialogue {
  [key: number]: TrainerTypeMessages | Array<TrainerTypeMessages>;
}

export function getTrainerTypeDialogue(): TrainerTypeDialogue {
  return trainerTypeDialogue;
}

export const trainerTypeDialogue: TrainerTypeDialogue = {
  ... randomNPCDialogue,
  ... evilGruntsDialogue,
  ... evilAdminDialogue,
  ... evilLeaderDialogue,
  ... mysteryEventTrainerDialogue,
  ... gymLeaderDialogue,
  ... eliteFourDialogue,
  ... championDialogue,
  ... rivalDialogue
};

export const battleSpecDialogue = {
  [BattleSpec.FINAL_BOSS]: {
    encounter: "battleSpecDialogue:encounter",
    firstStageWin: "battleSpecDialogue:firstStageWin",
    secondStageWin: "battleSpecDialogue:secondStageWin",
  },
};

export const miscDialogue = {
  ending: ["miscDialogue:ending", "miscDialogue:ending_female"],
};

export function getCharVariantFromDialogue(message: string): string {
  const variantMatch = /@c\{(.*?)\}/.exec(message);
  if (variantMatch) {
    return variantMatch[1];
  }
  return "neutral";
}

export function initTrainerTypeDialogue(): void {
  // TODO: this should not be using `Object.Keys`
  const trainerTypes = Object.keys(trainerTypeDialogue).map(t => Number.parseInt(t) as TrainerType);
  for (const trainerType of trainerTypes) {
    const messages = trainerTypeDialogue[trainerType];
    const messageTypes = ["encounter", "victory", "defeat"];
    for (const messageType of messageTypes) {
      if (Array.isArray(messages)) {
        if (messages[0][messageType]) {
          trainerConfigs[trainerType][`${messageType}Messages`] = messages[0][messageType];
        }
        if (messages.length > 1) {
          trainerConfigs[trainerType][`female${capitalizeFirstLetter(messageType)}Messages`] = messages[1][messageType];
        }
      } else {
        trainerConfigs[trainerType][`${messageType}Messages`] = messages[messageType];
      }
    }
  }
}
export { TrainerType };

