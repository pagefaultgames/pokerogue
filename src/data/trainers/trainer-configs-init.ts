import { TrainerType } from "#enums/trainer-type";
import { TrainerConfigs } from "#types/trainer-funcs";
import { TrainerConfig } from "./trainer-config";
import { championTrainersConfigs } from "./trainers-init/champion-trainers";
import { eliteFourTrainersConfigs } from "./trainers-init/elite-four-trainers";
import { evilAdminTrainerConfigs } from "./trainers-init/evil-organizations/evil-admin-trainers";
import { evilGruntTrainerConfig } from "./trainers-init/evil-organizations/evil-grunts-trainers";
import { evilAdminTrainersConfig } from "./trainers-init/evil-organizations/evil-leaders-trainers";
import { gymLeaderTrainersConfigs } from "./trainers-init/gym-trainers";
import { mysteryEventTrainersConfigs } from "./trainers-init/mystery-event-trainers";
import { randomNPCTrainersConfig } from "./trainers-init/random-npcs-trainers";
import { rivalTrainerConfigs } from "./trainers-init/rival-trainer";

export const trainerConfigs: TrainerConfigs = {
    [TrainerType.UNKNOWN]: new TrainerConfig(0).setHasGenders(),
    ... randomNPCTrainersConfig,
    ... evilGruntTrainerConfig,
    ... evilAdminTrainerConfigs,
    ... gymLeaderTrainersConfigs,
    ... eliteFourTrainersConfigs,
    ... championTrainersConfigs,
    ... rivalTrainerConfigs,
    ... evilAdminTrainersConfig,
    ... mysteryEventTrainersConfigs,
};
