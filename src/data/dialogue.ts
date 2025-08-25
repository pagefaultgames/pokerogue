import { BattleSpec } from "#enums/battle-spec";
import { TrainerType } from "#enums/trainer-type";
import { trainerConfigs } from "#trainers/trainer-config";
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
  [TrainerType.YOUNGSTER]: [
    {
      encounter: [
        "dialogue:youngster.encounter.1",
        "dialogue:youngster.encounter.2",
        "dialogue:youngster.encounter.3",
        "dialogue:youngster.encounter.4",
        "dialogue:youngster.encounter.5",
        "dialogue:youngster.encounter.6",
        "dialogue:youngster.encounter.7",
        "dialogue:youngster.encounter.8",
        "dialogue:youngster.encounter.9",
        "dialogue:youngster.encounter.10",
        "dialogue:youngster.encounter.11",
        "dialogue:youngster.encounter.12",
        "dialogue:youngster.encounter.13",
      ],
      victory: [
        "dialogue:youngster.victory.1",
        "dialogue:youngster.victory.2",
        "dialogue:youngster.victory.3",
        "dialogue:youngster.victory.4",
        "dialogue:youngster.victory.5",
        "dialogue:youngster.victory.6",
        "dialogue:youngster.victory.7",
        "dialogue:youngster.victory.8",
        "dialogue:youngster.victory.9",
        "dialogue:youngster.victory.10",
        "dialogue:youngster.victory.11",
        "dialogue:youngster.victory.12",
        "dialogue:youngster.victory.13",
      ],
    },
    //LASS
    {
      encounter: [
        "dialogue:lass.encounter.1",
        "dialogue:lass.encounter.2",
        "dialogue:lass.encounter.3",
        "dialogue:lass.encounter.4",
        "dialogue:lass.encounter.5",
        "dialogue:lass.encounter.6",
        "dialogue:lass.encounter.7",
        "dialogue:lass.encounter.8",
        "dialogue:lass.encounter.9",
      ],
      victory: [
        "dialogue:lass.victory.1",
        "dialogue:lass.victory.2",
        "dialogue:lass.victory.3",
        "dialogue:lass.victory.4",
        "dialogue:lass.victory.5",
        "dialogue:lass.victory.6",
        "dialogue:lass.victory.7",
        "dialogue:lass.victory.8",
        "dialogue:lass.victory.9",
      ],
    },
  ],
  [TrainerType.BREEDER]: [
    {
      encounter: ["dialogue:breeder.encounter.1", "dialogue:breeder.encounter.2", "dialogue:breeder.encounter.3"],
      victory: ["dialogue:breeder.victory.1", "dialogue:breeder.victory.2", "dialogue:breeder.victory.3"],
      defeat: ["dialogue:breeder.defeat.1", "dialogue:breeder.defeat.2", "dialogue:breeder.defeat.3"],
    },
    {
      encounter: [
        "dialogue:breederFemale.encounter.1",
        "dialogue:breederFemale.encounter.2",
        "dialogue:breederFemale.encounter.3",
      ],
      victory: [
        "dialogue:breederFemale.victory.1",
        "dialogue:breederFemale.victory.2",
        "dialogue:breederFemale.victory.3",
      ],
      defeat: ["dialogue:breederFemale.defeat.1", "dialogue:breederFemale.defeat.2", "dialogue:breederFemale.defeat.3"],
    },
  ],
  [TrainerType.FISHERMAN]: [
    {
      encounter: ["dialogue:fisherman.encounter.1", "dialogue:fisherman.encounter.2", "dialogue:fisherman.encounter.3"],
      victory: ["dialogue:fisherman.victory.1", "dialogue:fisherman.victory.2", "dialogue:fisherman.victory.3"],
    },
    {
      encounter: [
        "dialogue:fishermanFemale.encounter.1",
        "dialogue:fishermanFemale.encounter.2",
        "dialogue:fishermanFemale.encounter.3",
      ],
      victory: [
        "dialogue:fishermanFemale.victory.1",
        "dialogue:fishermanFemale.victory.2",
        "dialogue:fishermanFemale.victory.3",
      ],
    },
  ],
  [TrainerType.SWIMMER]: [
    {
      encounter: ["dialogue:swimmer.encounter.1", "dialogue:swimmer.encounter.2", "dialogue:swimmer.encounter.3"],
      victory: ["dialogue:swimmer.victory.1", "dialogue:swimmer.victory.2", "dialogue:swimmer.victory.3"],
    },
  ],
  [TrainerType.BACKPACKER]: [
    {
      encounter: [
        "dialogue:backpacker.encounter.1",
        "dialogue:backpacker.encounter.2",
        "dialogue:backpacker.encounter.3",
        "dialogue:backpacker.encounter.4",
      ],
      victory: [
        "dialogue:backpacker.victory.1",
        "dialogue:backpacker.victory.2",
        "dialogue:backpacker.victory.3",
        "dialogue:backpacker.victory.4",
      ],
    },
  ],
  [TrainerType.ACE_TRAINER]: [
    {
      encounter: [
        "dialogue:aceTrainer.encounter.1",
        "dialogue:aceTrainer.encounter.2",
        "dialogue:aceTrainer.encounter.3",
        "dialogue:aceTrainer.encounter.4",
      ],
      victory: [
        "dialogue:aceTrainer.victory.1",
        "dialogue:aceTrainer.victory.2",
        "dialogue:aceTrainer.victory.3",
        "dialogue:aceTrainer.victory.4",
      ],
      defeat: [
        "dialogue:aceTrainer.defeat.1",
        "dialogue:aceTrainer.defeat.2",
        "dialogue:aceTrainer.defeat.3",
        "dialogue:aceTrainer.defeat.4",
      ],
    },
  ],
  [TrainerType.PARASOL_LADY]: [
    {
      encounter: ["dialogue:parasolLady.encounter.1"],
      victory: ["dialogue:parasolLady.victory.1"],
    },
  ],
  [TrainerType.TWINS]: [
    {
      encounter: ["dialogue:twins.encounter.1", "dialogue:twins.encounter.2", "dialogue:twins.encounter.3"],
      victory: ["dialogue:twins.victory.1", "dialogue:twins.victory.2", "dialogue:twins.victory.3"],
      defeat: ["dialogue:twins.defeat.1", "dialogue:twins.defeat.2", "dialogue:twins.defeat.3"],
    },
  ],
  [TrainerType.CYCLIST]: [
    {
      encounter: ["dialogue:cyclist.encounter.1", "dialogue:cyclist.encounter.2", "dialogue:cyclist.encounter.3"],
      victory: ["dialogue:cyclist.victory.1", "dialogue:cyclist.victory.2", "dialogue:cyclist.victory.3"],
    },
  ],
  [TrainerType.BLACK_BELT]: [
    {
      encounter: ["dialogue:blackBelt.encounter.1", "dialogue:blackBelt.encounter.2"],
      victory: ["dialogue:blackBelt.victory.1", "dialogue:blackBelt.victory.2"],
    },
    //BATTLE GIRL
    {
      encounter: ["dialogue:battleGirl.encounter.1"],
      victory: ["dialogue:battleGirl.victory.1"],
    },
  ],
  [TrainerType.HIKER]: [
    {
      encounter: ["dialogue:hiker.encounter.1", "dialogue:hiker.encounter.2"],
      victory: ["dialogue:hiker.victory.1", "dialogue:hiker.victory.2"],
    },
  ],
  [TrainerType.RANGER]: [
    {
      encounter: ["dialogue:ranger.encounter.1", "dialogue:ranger.encounter.2"],
      victory: ["dialogue:ranger.victory.1", "dialogue:ranger.victory.2"],
      defeat: ["dialogue:ranger.defeat.1", "dialogue:ranger.defeat.2"],
    },
  ],
  [TrainerType.SCIENTIST]: [
    {
      encounter: ["dialogue:scientist.encounter.1"],
      victory: ["dialogue:scientist.victory.1"],
    },
  ],
  [TrainerType.SCHOOL_KID]: [
    {
      encounter: ["dialogue:schoolKid.encounter.1", "dialogue:schoolKid.encounter.2"],
      victory: ["dialogue:schoolKid.victory.1", "dialogue:schoolKid.victory.2"],
    },
  ],
  [TrainerType.ARTIST]: [
    {
      encounter: ["dialogue:artist.encounter.1"],
      victory: ["dialogue:artist.victory.1"],
    },
  ],
  [TrainerType.GUITARIST]: [
    {
      encounter: ["dialogue:guitarist.encounter.1"],
      victory: ["dialogue:guitarist.victory.1"],
    },
  ],
  [TrainerType.WORKER]: [
    {
      encounter: ["dialogue:worker.encounter.1"],
      victory: ["dialogue:worker.victory.1"],
    },
    {
      encounter: ["dialogue:workerFemale.encounter.1"],
      victory: ["dialogue:workerFemale.victory.1"],
      defeat: ["dialogue:workerFemale.defeat.1"],
    },
    {
      encounter: ["dialogue:workerDouble.encounter.1"],
      victory: ["dialogue:workerDouble.victory.1"],
    },
  ],
  // Defeat dialogue in the language .JSONS exist as translated or placeholders; (en, fr, it, es, de, ja, ko, zh_cn, zh_tw, pt_br)
  [TrainerType.SNOW_WORKER]: [
    {
      encounter: ["dialogue:snowWorker.encounter.1"],
      victory: ["dialogue:snowWorker.victory.1"],
    },
    {
      encounter: ["dialogue:snowWorkerDouble.encounter.1"],
      victory: ["dialogue:snowWorkerDouble.victory.1"],
    },
  ],
  [TrainerType.HEX_MANIAC]: [
    {
      encounter: ["dialogue:hexManiac.encounter.1", "dialogue:hexManiac.encounter.2"],
      victory: ["dialogue:hexManiac.victory.1", "dialogue:hexManiac.victory.2"],
      defeat: ["dialogue:hexManiac.defeat.1", "dialogue:hexManiac.defeat.2"],
    },
  ],
  [TrainerType.PSYCHIC]: [
    {
      encounter: ["dialogue:psychic.encounter.1"],
      victory: ["dialogue:psychic.victory.1"],
    },
  ],
  [TrainerType.OFFICER]: [
    {
      encounter: ["dialogue:officer.encounter.1", "dialogue:officer.encounter.2"],
      victory: ["dialogue:officer.victory.1", "dialogue:officer.victory.2"],
    },
  ],
  [TrainerType.BEAUTY]: [
    {
      encounter: ["dialogue:beauty.encounter.1"],
      victory: ["dialogue:beauty.victory.1"],
    },
  ],
  [TrainerType.BAKER]: [
    {
      encounter: ["dialogue:baker.encounter.1"],
      victory: ["dialogue:baker.victory.1"],
    },
  ],
  [TrainerType.BIKER]: [
    {
      encounter: ["dialogue:biker.encounter.1"],
      victory: ["dialogue:biker.victory.1"],
    },
  ],
  [TrainerType.FIREBREATHER]: [
    {
      encounter: [
        "dialogue:firebreather.encounter.1",
        "dialogue:firebreather.encounter.2",
        "dialogue:firebreather.encounter.3",
      ],
      victory: [
        "dialogue:firebreather.victory.1",
        "dialogue:firebreather.victory.2",
        "dialogue:firebreather.victory.3",
      ],
    },
  ],
  [TrainerType.SAILOR]: [
    {
      encounter: ["dialogue:sailor.encounter.1", "dialogue:sailor.encounter.2", "dialogue:sailor.encounter.3"],
      victory: ["dialogue:sailor.victory.1", "dialogue:sailor.victory.2", "dialogue:sailor.victory.3"],
    },
  ],
  [TrainerType.CLERK]: [
    {
      encounter: ["dialogue:clerk.encounter.1", "dialogue:clerk.encounter.2", "dialogue:clerk.encounter.3"],
      victory: ["dialogue:clerk.victory.1", "dialogue:clerk.victory.2", "dialogue:clerk.victory.3"],
    },
    {
      encounter: [
        "dialogue:clerkFemale.encounter.1",
        "dialogue:clerkFemale.encounter.2",
        "dialogue:clerkFemale.encounter.3",
      ],
      victory: ["dialogue:clerkFemale.victory.1", "dialogue:clerkFemale.victory.2", "dialogue:clerkFemale.victory.3"],
    },
  ],
  [TrainerType.HOOLIGANS]: [
    {
      encounter: ["dialogue:hooligans.encounter.1", "dialogue:hooligans.encounter.2"],
      victory: ["dialogue:hooligans.victory.1", "dialogue:hooligans.victory.2"],
    },
  ],
  [TrainerType.MUSICIAN]: [
    {
      encounter: [
        "dialogue:musician.encounter.1",
        "dialogue:musician.encounter.2",
        "dialogue:musician.encounter.3",
        "dialogue:musician.encounter.4",
      ],
      victory: ["dialogue:musician.victory.1", "dialogue:musician.victory.2", "dialogue:musician.victory.3"],
    },
  ],
  [TrainerType.PILOT]: [
    {
      encounter: [
        "dialogue:pilot.encounter.1",
        "dialogue:pilot.encounter.2",
        "dialogue:pilot.encounter.3",
        "dialogue:pilot.encounter.4",
      ],
      victory: [
        "dialogue:pilot.victory.1",
        "dialogue:pilot.victory.2",
        "dialogue:pilot.victory.3",
        "dialogue:pilot.victory.4",
      ],
    },
  ],
  [TrainerType.POKEFAN]: [
    {
      encounter: ["dialogue:pokefan.encounter.1", "dialogue:pokefan.encounter.2", "dialogue:pokefan.encounter.3"],
      victory: ["dialogue:pokefan.victory.1", "dialogue:pokefan.victory.2", "dialogue:pokefan.victory.3"],
    },
    {
      encounter: [
        "dialogue:pokefanFemale.encounter.1",
        "dialogue:pokefanFemale.encounter.2",
        "dialogue:pokefanFemale.encounter.3",
      ],
      victory: [
        "dialogue:pokefanFemale.victory.1",
        "dialogue:pokefanFemale.victory.2",
        "dialogue:pokefanFemale.victory.3",
      ],
    },
  ],
  [TrainerType.RICH]: [
    {
      encounter: ["dialogue:rich.encounter.1", "dialogue:rich.encounter.2", "dialogue:rich.encounter.3"],
      victory: ["dialogue:rich.victory.1", "dialogue:rich.victory.2", "dialogue:rich.victory.3"],
    },
    {
      encounter: [
        "dialogue:richFemale.encounter.1",
        "dialogue:richFemale.encounter.2",
        "dialogue:richFemale.encounter.3",
      ],
      victory: ["dialogue:richFemale.victory.1", "dialogue:richFemale.victory.2", "dialogue:richFemale.victory.3"],
    },
  ],
  [TrainerType.RICH_KID]: [
    {
      encounter: ["dialogue:richKid.encounter.1", "dialogue:richKid.encounter.2", "dialogue:richKid.encounter.3"],
      victory: [
        "dialogue:richKid.victory.1",
        "dialogue:richKid.victory.2",
        "dialogue:richKid.victory.3",
        "dialogue:richKid.victory.4",
      ],
    },
    {
      encounter: [
        "dialogue:richKidFemale.encounter.1",
        "dialogue:richKidFemale.encounter.2",
        "dialogue:richKidFemale.encounter.3",
      ],
      victory: [
        "dialogue:richKidFemale.victory.1",
        "dialogue:richKidFemale.victory.2",
        "dialogue:richKidFemale.victory.3",
        "dialogue:richKidFemale.victory.4",
      ],
    },
  ],
  [TrainerType.ROCKET_GRUNT]: [
    {
      encounter: [
        "dialogue:rocketGrunt.encounter.1",
        "dialogue:rocketGrunt.encounter.2",
        "dialogue:rocketGrunt.encounter.3",
        "dialogue:rocketGrunt.encounter.4",
        "dialogue:rocketGrunt.encounter.5",
      ],
      victory: [
        "dialogue:rocketGrunt.victory.1",
        "dialogue:rocketGrunt.victory.2",
        "dialogue:rocketGrunt.victory.3",
        "dialogue:rocketGrunt.victory.4",
        "dialogue:rocketGrunt.victory.5",
      ],
    },
  ],
  [TrainerType.ARCHER]: [
    {
      encounter: ["dialogue:archer.encounter.1", "dialogue:archer.encounter.2", "dialogue:archer.encounter.3"],
      victory: ["dialogue:archer.victory.1", "dialogue:archer.victory.2", "dialogue:archer.victory.3"],
    },
  ],
  [TrainerType.ARIANA]: [
    {
      encounter: ["dialogue:ariana.encounter.1", "dialogue:ariana.encounter.2", "dialogue:ariana.encounter.3"],
      victory: ["dialogue:ariana.victory.1", "dialogue:ariana.victory.2", "dialogue:ariana.victory.3"],
    },
  ],
  [TrainerType.PROTON]: [
    {
      encounter: ["dialogue:proton.encounter.1", "dialogue:proton.encounter.2", "dialogue:proton.encounter.3"],
      victory: ["dialogue:proton.victory.1", "dialogue:proton.victory.2", "dialogue:proton.victory.3"],
    },
  ],
  [TrainerType.PETREL]: [
    {
      encounter: ["dialogue:petrel.encounter.1", "dialogue:petrel.encounter.2", "dialogue:petrel.encounter.3"],
      victory: ["dialogue:petrel.victory.1", "dialogue:petrel.victory.2", "dialogue:petrel.victory.3"],
    },
  ],
  [TrainerType.MAGMA_GRUNT]: [
    {
      encounter: [
        "dialogue:magmaGrunt.encounter.1",
        "dialogue:magmaGrunt.encounter.2",
        "dialogue:magmaGrunt.encounter.3",
        "dialogue:magmaGrunt.encounter.4",
        "dialogue:magmaGrunt.encounter.5",
      ],
      victory: [
        "dialogue:magmaGrunt.victory.1",
        "dialogue:magmaGrunt.victory.2",
        "dialogue:magmaGrunt.victory.3",
        "dialogue:magmaGrunt.victory.4",
        "dialogue:magmaGrunt.victory.5",
      ],
    },
  ],
  [TrainerType.TABITHA]: [
    {
      encounter: ["dialogue:tabitha.encounter.1", "dialogue:tabitha.encounter.2", "dialogue:tabitha.encounter.3"],
      victory: ["dialogue:tabitha.victory.1", "dialogue:tabitha.victory.2", "dialogue:tabitha.victory.3"],
    },
  ],
  [TrainerType.COURTNEY]: [
    {
      encounter: ["dialogue:courtney.encounter.1", "dialogue:courtney.encounter.2", "dialogue:courtney.encounter.3"],
      victory: ["dialogue:courtney.victory.1", "dialogue:courtney.victory.2", "dialogue:courtney.victory.3"],
    },
  ],
  [TrainerType.AQUA_GRUNT]: [
    {
      encounter: [
        "dialogue:aquaGrunt.encounter.1",
        "dialogue:aquaGrunt.encounter.2",
        "dialogue:aquaGrunt.encounter.3",
        "dialogue:aquaGrunt.encounter.4",
        "dialogue:aquaGrunt.encounter.5",
      ],
      victory: [
        "dialogue:aquaGrunt.victory.1",
        "dialogue:aquaGrunt.victory.2",
        "dialogue:aquaGrunt.victory.3",
        "dialogue:aquaGrunt.victory.4",
        "dialogue:aquaGrunt.victory.5",
      ],
    },
  ],
  [TrainerType.MATT]: [
    {
      encounter: ["dialogue:matt.encounter.1", "dialogue:matt.encounter.2", "dialogue:matt.encounter.3"],
      victory: ["dialogue:matt.victory.1", "dialogue:matt.victory.2", "dialogue:matt.victory.3"],
    },
  ],
  [TrainerType.SHELLY]: [
    {
      encounter: ["dialogue:shelly.encounter.1", "dialogue:shelly.encounter.2", "dialogue:shelly.encounter.3"],
      victory: ["dialogue:shelly.victory.1", "dialogue:shelly.victory.2", "dialogue:shelly.victory.3"],
    },
  ],
  [TrainerType.GALACTIC_GRUNT]: [
    {
      encounter: [
        "dialogue:galacticGrunt.encounter.1",
        "dialogue:galacticGrunt.encounter.2",
        "dialogue:galacticGrunt.encounter.3",
        "dialogue:galacticGrunt.encounter.4",
        "dialogue:galacticGrunt.encounter.5",
      ],
      victory: [
        "dialogue:galacticGrunt.victory.1",
        "dialogue:galacticGrunt.victory.2",
        "dialogue:galacticGrunt.victory.3",
        "dialogue:galacticGrunt.victory.4",
        "dialogue:galacticGrunt.victory.5",
      ],
    },
  ],
  [TrainerType.JUPITER]: [
    {
      encounter: ["dialogue:jupiter.encounter.1", "dialogue:jupiter.encounter.2", "dialogue:jupiter.encounter.3"],
      victory: ["dialogue:jupiter.victory.1", "dialogue:jupiter.victory.2", "dialogue:jupiter.victory.3"],
    },
  ],
  [TrainerType.MARS]: [
    {
      encounter: ["dialogue:mars.encounter.1", "dialogue:mars.encounter.2", "dialogue:mars.encounter.3"],
      victory: ["dialogue:mars.victory.1", "dialogue:mars.victory.2", "dialogue:mars.victory.3"],
    },
  ],
  [TrainerType.SATURN]: [
    {
      encounter: ["dialogue:saturn.encounter.1", "dialogue:saturn.encounter.2", "dialogue:saturn.encounter.3"],
      victory: ["dialogue:saturn.victory.1", "dialogue:saturn.victory.2", "dialogue:saturn.victory.3"],
    },
  ],
  [TrainerType.PLASMA_GRUNT]: [
    {
      encounter: [
        "dialogue:plasmaGrunt.encounter.1",
        "dialogue:plasmaGrunt.encounter.2",
        "dialogue:plasmaGrunt.encounter.3",
        "dialogue:plasmaGrunt.encounter.4",
        "dialogue:plasmaGrunt.encounter.5",
      ],
      victory: [
        "dialogue:plasmaGrunt.victory.1",
        "dialogue:plasmaGrunt.victory.2",
        "dialogue:plasmaGrunt.victory.3",
        "dialogue:plasmaGrunt.victory.4",
        "dialogue:plasmaGrunt.victory.5",
      ],
    },
  ],
  [TrainerType.ZINZOLIN]: [
    {
      encounter: ["dialogue:zinzolin.encounter.1", "dialogue:zinzolin.encounter.2", "dialogue:zinzolin.encounter.3"],
      victory: ["dialogue:zinzolin.victory.1", "dialogue:zinzolin.victory.2", "dialogue:zinzolin.victory.3"],
    },
  ],
  [TrainerType.COLRESS]: [
    {
      encounter: ["dialogue:colress.encounter.1", "dialogue:colress.encounter.2", "dialogue:colress.encounter.3"],
      victory: ["dialogue:colress.victory.1", "dialogue:colress.victory.2", "dialogue:colress.victory.3"],
    },
  ],
  [TrainerType.FLARE_GRUNT]: [
    {
      encounter: [
        "dialogue:flareGrunt.encounter.1",
        "dialogue:flareGrunt.encounter.2",
        "dialogue:flareGrunt.encounter.3",
        "dialogue:flareGrunt.encounter.4",
        "dialogue:flareGrunt.encounter.5",
      ],
      victory: [
        "dialogue:flareGrunt.victory.1",
        "dialogue:flareGrunt.victory.2",
        "dialogue:flareGrunt.victory.3",
        "dialogue:flareGrunt.victory.4",
        "dialogue:flareGrunt.victory.5",
      ],
    },
  ],
  [TrainerType.BRYONY]: [
    {
      encounter: ["dialogue:bryony.encounter.1", "dialogue:bryony.encounter.2", "dialogue:bryony.encounter.3"],
      victory: ["dialogue:bryony.victory.1", "dialogue:bryony.victory.2", "dialogue:bryony.victory.3"],
    },
  ],
  [TrainerType.XEROSIC]: [
    {
      encounter: ["dialogue:xerosic.encounter.1", "dialogue:xerosic.encounter.2", "dialogue:xerosic.encounter.3"],
      victory: ["dialogue:xerosic.victory.1", "dialogue:xerosic.victory.2", "dialogue:xerosic.victory.3"],
    },
  ],
  [TrainerType.AETHER_GRUNT]: [
    {
      encounter: [
        "dialogue:aetherGrunt.encounter.1",
        "dialogue:aetherGrunt.encounter.2",
        "dialogue:aetherGrunt.encounter.3",
        "dialogue:aetherGrunt.encounter.4",
        "dialogue:aetherGrunt.encounter.5",
      ],
      victory: [
        "dialogue:aetherGrunt.victory.1",
        "dialogue:aetherGrunt.victory.2",
        "dialogue:aetherGrunt.victory.3",
        "dialogue:aetherGrunt.victory.4",
        "dialogue:aetherGrunt.victory.5",
      ],
    },
  ],
  [TrainerType.FABA]: [
    {
      encounter: ["dialogue:faba.encounter.1", "dialogue:faba.encounter.2", "dialogue:faba.encounter.3"],
      victory: ["dialogue:faba.victory.1", "dialogue:faba.victory.2", "dialogue:faba.victory.3"],
    },
  ],
  [TrainerType.SKULL_GRUNT]: [
    {
      encounter: [
        "dialogue:skullGrunt.encounter.1",
        "dialogue:skullGrunt.encounter.2",
        "dialogue:skullGrunt.encounter.3",
        "dialogue:skullGrunt.encounter.4",
        "dialogue:skullGrunt.encounter.5",
      ],
      victory: [
        "dialogue:skullGrunt.victory.1",
        "dialogue:skullGrunt.victory.2",
        "dialogue:skullGrunt.victory.3",
        "dialogue:skullGrunt.victory.4",
        "dialogue:skullGrunt.victory.5",
      ],
    },
  ],
  [TrainerType.PLUMERIA]: [
    {
      encounter: ["dialogue:plumeria.encounter.1", "dialogue:plumeria.encounter.2", "dialogue:plumeria.encounter.3"],
      victory: ["dialogue:plumeria.victory.1", "dialogue:plumeria.victory.2", "dialogue:plumeria.victory.3"],
    },
  ],
  [TrainerType.MACRO_GRUNT]: [
    {
      encounter: [
        "dialogue:macroGrunt.encounter.1",
        "dialogue:macroGrunt.encounter.2",
        "dialogue:macroGrunt.encounter.3",
        "dialogue:macroGrunt.encounter.4",
        "dialogue:macroGrunt.encounter.5",
      ],
      victory: [
        "dialogue:macroGrunt.victory.1",
        "dialogue:macroGrunt.victory.2",
        "dialogue:macroGrunt.victory.3",
        "dialogue:macroGrunt.victory.4",
        "dialogue:macroGrunt.victory.5",
      ],
    },
  ],
  [TrainerType.OLEANA]: [
    {
      encounter: ["dialogue:oleana.encounter.1", "dialogue:oleana.encounter.2", "dialogue:oleana.encounter.3"],
      victory: ["dialogue:oleana.victory.1", "dialogue:oleana.victory.2", "dialogue:oleana.victory.3"],
    },
  ],
  [TrainerType.STAR_GRUNT]: [
    {
      encounter: [
        "dialogue:starGrunt.encounter.1",
        "dialogue:starGrunt.encounter.2",
        "dialogue:starGrunt.encounter.3",
        "dialogue:starGrunt.encounter.4",
        "dialogue:starGrunt.encounter.5",
      ],
      victory: [
        "dialogue:starGrunt.victory.1",
        "dialogue:starGrunt.victory.2",
        "dialogue:starGrunt.victory.3",
        "dialogue:starGrunt.victory.4",
        "dialogue:starGrunt.victory.5",
      ],
    },
  ],
  [TrainerType.GIACOMO]: [
    {
      encounter: ["dialogue:giacomo.encounter.1", "dialogue:giacomo.encounter.2"],
      victory: ["dialogue:giacomo.victory.1", "dialogue:giacomo.victory.2"],
    },
  ],
  [TrainerType.MELA]: [
    {
      encounter: ["dialogue:mela.encounter.1", "dialogue:mela.encounter.2"],
      victory: ["dialogue:mela.victory.1", "dialogue:mela.victory.2"],
    },
  ],
  [TrainerType.ATTICUS]: [
    {
      encounter: ["dialogue:atticus.encounter.1", "dialogue:atticus.encounter.2"],
      victory: ["dialogue:atticus.victory.1", "dialogue:atticus.victory.2"],
    },
  ],
  [TrainerType.ORTEGA]: [
    {
      encounter: ["dialogue:ortega.encounter.1", "dialogue:ortega.encounter.2"],
      victory: ["dialogue:ortega.victory.1", "dialogue:ortega.victory.2"],
    },
  ],
  [TrainerType.ERI]: [
    {
      encounter: ["dialogue:eri.encounter.1", "dialogue:eri.encounter.2"],
      victory: ["dialogue:eri.victory.1", "dialogue:eri.victory.2"],
    },
  ],
  [TrainerType.ROCKET_BOSS_GIOVANNI_1]: [
    {
      encounter: ["dialogue:rocketBossGiovanni1.encounter.1"],
      victory: ["dialogue:rocketBossGiovanni1.victory.1"],
      defeat: ["dialogue:rocketBossGiovanni1.defeat.1"],
    },
  ],
  [TrainerType.ROCKET_BOSS_GIOVANNI_2]: [
    {
      encounter: ["dialogue:rocketBossGiovanni2.encounter.1"],
      victory: ["dialogue:rocketBossGiovanni2.victory.1"],
      defeat: ["dialogue:rocketBossGiovanni2.defeat.1"],
    },
  ],
  [TrainerType.MAXIE]: [
    {
      encounter: ["dialogue:magmaBossMaxie1.encounter.1"],
      victory: ["dialogue:magmaBossMaxie1.victory.1"],
      defeat: ["dialogue:magmaBossMaxie1.defeat.1"],
    },
  ],
  [TrainerType.MAXIE_2]: [
    {
      encounter: ["dialogue:magmaBossMaxie2.encounter.1"],
      victory: ["dialogue:magmaBossMaxie2.victory.1"],
      defeat: ["dialogue:magmaBossMaxie2.defeat.1"],
    },
  ],
  [TrainerType.ARCHIE]: [
    {
      encounter: ["dialogue:aquaBossArchie1.encounter.1"],
      victory: ["dialogue:aquaBossArchie1.victory.1"],
      defeat: ["dialogue:aquaBossArchie1.defeat.1"],
    },
  ],
  [TrainerType.ARCHIE_2]: [
    {
      encounter: ["dialogue:aquaBossArchie2.encounter.1"],
      victory: ["dialogue:aquaBossArchie2.victory.1"],
      defeat: ["dialogue:aquaBossArchie2.defeat.1"],
    },
  ],
  [TrainerType.CYRUS]: [
    {
      encounter: ["dialogue:galacticBossCyrus1.encounter.1"],
      victory: ["dialogue:galacticBossCyrus1.victory.1"],
      defeat: ["dialogue:galacticBossCyrus1.defeat.1"],
    },
  ],
  [TrainerType.CYRUS_2]: [
    {
      encounter: ["dialogue:galacticBossCyrus2.encounter.1"],
      victory: ["dialogue:galacticBossCyrus2.victory.1"],
      defeat: ["dialogue:galacticBossCyrus2.defeat.1"],
    },
  ],
  [TrainerType.GHETSIS]: [
    {
      encounter: ["dialogue:plasmaBossGhetsis1.encounter.1"],
      victory: ["dialogue:plasmaBossGhetsis1.victory.1"],
      defeat: ["dialogue:plasmaBossGhetsis1.defeat.1"],
    },
  ],
  [TrainerType.GHETSIS_2]: [
    {
      encounter: ["dialogue:plasmaBossGhetsis2.encounter.1"],
      victory: ["dialogue:plasmaBossGhetsis2.victory.1"],
      defeat: ["dialogue:plasmaBossGhetsis2.defeat.1"],
    },
  ],
  [TrainerType.LYSANDRE]: [
    {
      encounter: ["dialogue:flareBossLysandre1.encounter.1"],
      victory: ["dialogue:flareBossLysandre1.victory.1"],
      defeat: ["dialogue:flareBossLysandre1.defeat.1"],
    },
  ],
  [TrainerType.LYSANDRE_2]: [
    {
      encounter: ["dialogue:flareBossLysandre2.encounter.1"],
      victory: ["dialogue:flareBossLysandre2.victory.1"],
      defeat: ["dialogue:flareBossLysandre2.defeat.1"],
    },
  ],
  [TrainerType.LUSAMINE]: [
    {
      encounter: ["dialogue:aetherBossLusamine1.encounter.1"],
      victory: ["dialogue:aetherBossLusamine1.victory.1"],
      defeat: ["dialogue:aetherBossLusamine1.defeat.1"],
    },
  ],
  [TrainerType.LUSAMINE_2]: [
    {
      encounter: ["dialogue:aetherBossLusamine2.encounter.1"],
      victory: ["dialogue:aetherBossLusamine2.victory.1"],
      defeat: ["dialogue:aetherBossLusamine2.defeat.1"],
    },
  ],
  [TrainerType.GUZMA]: [
    {
      encounter: ["dialogue:skullBossGuzma1.encounter.1"],
      victory: ["dialogue:skullBossGuzma1.victory.1"],
      defeat: ["dialogue:skullBossGuzma1.defeat.1"],
    },
  ],
  [TrainerType.GUZMA_2]: [
    {
      encounter: ["dialogue:skullBossGuzma2.encounter.1"],
      victory: ["dialogue:skullBossGuzma2.victory.1"],
      defeat: ["dialogue:skullBossGuzma2.defeat.1"],
    },
  ],
  [TrainerType.ROSE]: [
    {
      encounter: ["dialogue:macroBossRose1.encounter.1"],
      victory: ["dialogue:macroBossRose1.victory.1"],
      defeat: ["dialogue:macroBossRose1.defeat.1"],
    },
  ],
  [TrainerType.ROSE_2]: [
    {
      encounter: ["dialogue:macroBossRose2.encounter.1"],
      victory: ["dialogue:macroBossRose2.victory.1"],
      defeat: ["dialogue:macroBossRose2.defeat.1"],
    },
  ],
  [TrainerType.PENNY]: [
    {
      encounter: ["dialogue:starBossPenny1.encounter.1"],
      victory: ["dialogue:starBossPenny1.victory.1"],
      defeat: ["dialogue:starBossPenny1.defeat.1"],
    },
  ],
  [TrainerType.PENNY_2]: [
    {
      encounter: ["dialogue:starBossPenny2.encounter.1"],
      victory: ["dialogue:starBossPenny2.victory.1"],
      defeat: ["dialogue:starBossPenny2.defeat.1"],
    },
  ],
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
  [TrainerType.BROCK]: {
    encounter: ["dialogue:brock.encounter.1", "dialogue:brock.encounter.2", "dialogue:brock.encounter.3"],
    victory: ["dialogue:brock.victory.1", "dialogue:brock.victory.2", "dialogue:brock.victory.3"],
    defeat: ["dialogue:brock.defeat.1", "dialogue:brock.defeat.2", "dialogue:brock.defeat.3"],
  },
  [TrainerType.MISTY]: {
    encounter: ["dialogue:misty.encounter.1", "dialogue:misty.encounter.2", "dialogue:misty.encounter.3"],
    victory: ["dialogue:misty.victory.1", "dialogue:misty.victory.2", "dialogue:misty.victory.3"],
    defeat: ["dialogue:misty.defeat.1", "dialogue:misty.defeat.2", "dialogue:misty.defeat.3"],
  },
  [TrainerType.LT_SURGE]: {
    encounter: ["dialogue:ltSurge.encounter.1", "dialogue:ltSurge.encounter.2", "dialogue:ltSurge.encounter.3"],
    victory: ["dialogue:ltSurge.victory.1", "dialogue:ltSurge.victory.2", "dialogue:ltSurge.victory.3"],
    defeat: ["dialogue:ltSurge.defeat.1", "dialogue:ltSurge.defeat.2", "dialogue:ltSurge.defeat.3"],
  },
  [TrainerType.ERIKA]: {
    encounter: [
      "dialogue:erika.encounter.1",
      "dialogue:erika.encounter.2",
      "dialogue:erika.encounter.3",
      "dialogue:erika.encounter.4",
    ],
    victory: [
      "dialogue:erika.victory.1",
      "dialogue:erika.victory.2",
      "dialogue:erika.victory.3",
      "dialogue:erika.victory.4",
    ],
    defeat: [
      "dialogue:erika.defeat.1",
      "dialogue:erika.defeat.2",
      "dialogue:erika.defeat.3",
      "dialogue:erika.defeat.4",
    ],
  },
  [TrainerType.JANINE]: {
    encounter: ["dialogue:janine.encounter.1", "dialogue:janine.encounter.2", "dialogue:janine.encounter.3"],
    victory: ["dialogue:janine.victory.1", "dialogue:janine.victory.2", "dialogue:janine.victory.3"],
    defeat: ["dialogue:janine.defeat.1", "dialogue:janine.defeat.2", "dialogue:janine.defeat.3"],
  },
  [TrainerType.SABRINA]: {
    encounter: ["dialogue:sabrina.encounter.1", "dialogue:sabrina.encounter.2", "dialogue:sabrina.encounter.3"],
    victory: ["dialogue:sabrina.victory.1", "dialogue:sabrina.victory.2", "dialogue:sabrina.victory.3"],
    defeat: ["dialogue:sabrina.defeat.1", "dialogue:sabrina.defeat.2", "dialogue:sabrina.defeat.3"],
  },
  [TrainerType.BLAINE]: {
    encounter: ["dialogue:blaine.encounter.1", "dialogue:blaine.encounter.2", "dialogue:blaine.encounter.3"],
    victory: ["dialogue:blaine.victory.1", "dialogue:blaine.victory.2", "dialogue:blaine.victory.3"],
    defeat: ["dialogue:blaine.defeat.1", "dialogue:blaine.defeat.2", "dialogue:blaine.defeat.3"],
  },
  [TrainerType.GIOVANNI]: {
    encounter: ["dialogue:giovanni.encounter.1", "dialogue:giovanni.encounter.2", "dialogue:giovanni.encounter.3"],
    victory: ["dialogue:giovanni.victory.1", "dialogue:giovanni.victory.2", "dialogue:giovanni.victory.3"],
    defeat: ["dialogue:giovanni.defeat.1", "dialogue:giovanni.defeat.2", "dialogue:giovanni.defeat.3"],
  },
  [TrainerType.ROXANNE]: {
    encounter: ["dialogue:roxanne.encounter.1", "dialogue:roxanne.encounter.2", "dialogue:roxanne.encounter.3"],
    victory: ["dialogue:roxanne.victory.1", "dialogue:roxanne.victory.2", "dialogue:roxanne.victory.3"],
    defeat: ["dialogue:roxanne.defeat.1", "dialogue:roxanne.defeat.2", "dialogue:roxanne.defeat.3"],
  },
  [TrainerType.BRAWLY]: {
    encounter: ["dialogue:brawly.encounter.1", "dialogue:brawly.encounter.2", "dialogue:brawly.encounter.3"],
    victory: ["dialogue:brawly.victory.1", "dialogue:brawly.victory.2", "dialogue:brawly.victory.3"],
    defeat: ["dialogue:brawly.defeat.1", "dialogue:brawly.defeat.2", "dialogue:brawly.defeat.3"],
  },
  [TrainerType.WATTSON]: {
    encounter: ["dialogue:wattson.encounter.1", "dialogue:wattson.encounter.2", "dialogue:wattson.encounter.3"],
    victory: ["dialogue:wattson.victory.1", "dialogue:wattson.victory.2", "dialogue:wattson.victory.3"],
    defeat: ["dialogue:wattson.defeat.1", "dialogue:wattson.defeat.2", "dialogue:wattson.defeat.3"],
  },
  [TrainerType.FLANNERY]: {
    encounter: ["dialogue:flannery.encounter.1", "dialogue:flannery.encounter.2", "dialogue:flannery.encounter.3"],
    victory: ["dialogue:flannery.victory.1", "dialogue:flannery.victory.2", "dialogue:flannery.victory.3"],
    defeat: ["dialogue:flannery.defeat.1", "dialogue:flannery.defeat.2", "dialogue:flannery.defeat.3"],
  },
  [TrainerType.NORMAN]: {
    encounter: ["dialogue:norman.encounter.1", "dialogue:norman.encounter.2", "dialogue:norman.encounter.3"],
    victory: ["dialogue:norman.victory.1", "dialogue:norman.victory.2", "dialogue:norman.victory.3"],
    defeat: ["dialogue:norman.defeat.1", "dialogue:norman.defeat.2", "dialogue:norman.defeat.3"],
  },
  [TrainerType.WINONA]: {
    encounter: ["dialogue:winona.encounter.1", "dialogue:winona.encounter.2", "dialogue:winona.encounter.3"],
    victory: ["dialogue:winona.victory.1", "dialogue:winona.victory.2", "dialogue:winona.victory.3"],
    defeat: ["dialogue:winona.defeat.1", "dialogue:winona.defeat.2", "dialogue:winona.defeat.3"],
  },
  [TrainerType.TATE]: {
    encounter: ["dialogue:tate.encounter.1", "dialogue:tate.encounter.2", "dialogue:tate.encounter.3"],
    victory: ["dialogue:tate.victory.1", "dialogue:tate.victory.2", "dialogue:tate.victory.3"],
    defeat: ["dialogue:tate.defeat.1", "dialogue:tate.defeat.2", "dialogue:tate.defeat.3"],
  },
  [TrainerType.LIZA]: {
    encounter: ["dialogue:liza.encounter.1", "dialogue:liza.encounter.2", "dialogue:liza.encounter.3"],
    victory: ["dialogue:liza.victory.1", "dialogue:liza.victory.2", "dialogue:liza.victory.3"],
    defeat: ["dialogue:liza.defeat.1", "dialogue:liza.defeat.2", "dialogue:liza.defeat.3"],
  },
  [TrainerType.JUAN]: {
    encounter: [
      "dialogue:juan.encounter.1",
      "dialogue:juan.encounter.2",
      "dialogue:juan.encounter.3",
      "dialogue:juan.encounter.4",
    ],
    victory: [
      "dialogue:juan.victory.1",
      "dialogue:juan.victory.2",
      "dialogue:juan.victory.3",
      "dialogue:juan.victory.4",
    ],
    defeat: ["dialogue:juan.defeat.1", "dialogue:juan.defeat.2", "dialogue:juan.defeat.3", "dialogue:juan.defeat.4"],
  },
  [TrainerType.CRASHER_WAKE]: {
    encounter: [
      "dialogue:crasherWake.encounter.1",
      "dialogue:crasherWake.encounter.2",
      "dialogue:crasherWake.encounter.3",
    ],
    victory: ["dialogue:crasherWake.victory.1", "dialogue:crasherWake.victory.2", "dialogue:crasherWake.victory.3"],
    defeat: ["dialogue:crasherWake.defeat.1", "dialogue:crasherWake.defeat.2", "dialogue:crasherWake.defeat.3"],
  },
  [TrainerType.FALKNER]: {
    encounter: ["dialogue:falkner.encounter.1", "dialogue:falkner.encounter.2", "dialogue:falkner.encounter.3"],
    victory: ["dialogue:falkner.victory.1", "dialogue:falkner.victory.2", "dialogue:falkner.victory.3"],
    defeat: ["dialogue:falkner.defeat.1", "dialogue:falkner.defeat.2", "dialogue:falkner.defeat.3"],
  },
  [TrainerType.NESSA]: {
    encounter: ["dialogue:nessa.encounter.1", "dialogue:nessa.encounter.2", "dialogue:nessa.encounter.3"],
    victory: ["dialogue:nessa.victory.1", "dialogue:nessa.victory.2", "dialogue:nessa.victory.3"],
    defeat: ["dialogue:nessa.defeat.1", "dialogue:nessa.defeat.2", "dialogue:nessa.defeat.3"],
  },
  [TrainerType.MELONY]: {
    encounter: ["dialogue:melony.encounter.1", "dialogue:melony.encounter.2", "dialogue:melony.encounter.3"],
    victory: ["dialogue:melony.victory.1", "dialogue:melony.victory.2", "dialogue:melony.victory.3"],
    defeat: ["dialogue:melony.defeat.1", "dialogue:melony.defeat.2", "dialogue:melony.defeat.3"],
  },
  [TrainerType.MARLON]: {
    encounter: ["dialogue:marlon.encounter.1", "dialogue:marlon.encounter.2", "dialogue:marlon.encounter.3"],
    victory: ["dialogue:marlon.victory.1", "dialogue:marlon.victory.2", "dialogue:marlon.victory.3"],
    defeat: ["dialogue:marlon.defeat.1", "dialogue:marlon.defeat.2", "dialogue:marlon.defeat.3"],
  },
  [TrainerType.SHAUNTAL]: {
    encounter: ["dialogue:shauntal.encounter.1", "dialogue:shauntal.encounter.2", "dialogue:shauntal.encounter.3"],
    victory: ["dialogue:shauntal.victory.1", "dialogue:shauntal.victory.2", "dialogue:shauntal.victory.3"],
    defeat: ["dialogue:shauntal.defeat.1", "dialogue:shauntal.defeat.2", "dialogue:shauntal.defeat.3"],
  },
  [TrainerType.MARSHAL]: {
    encounter: ["dialogue:marshal.encounter.1", "dialogue:marshal.encounter.2", "dialogue:marshal.encounter.3"],
    victory: ["dialogue:marshal.victory.1", "dialogue:marshal.victory.2", "dialogue:marshal.victory.3"],
    defeat: ["dialogue:marshal.defeat.1", "dialogue:marshal.defeat.2", "dialogue:marshal.defeat.3"],
  },
  [TrainerType.CHEREN]: {
    encounter: ["dialogue:cheren.encounter.1", "dialogue:cheren.encounter.2", "dialogue:cheren.encounter.3"],
    victory: ["dialogue:cheren.victory.1", "dialogue:cheren.victory.2", "dialogue:cheren.victory.3"],
    defeat: ["dialogue:cheren.defeat.1", "dialogue:cheren.defeat.2", "dialogue:cheren.defeat.3"],
  },
  [TrainerType.CHILI]: {
    encounter: ["dialogue:chili.encounter.1", "dialogue:chili.encounter.2", "dialogue:chili.encounter.3"],
    victory: ["dialogue:chili.victory.1", "dialogue:chili.victory.2", "dialogue:chili.victory.3"],
    defeat: ["dialogue:chili.defeat.1", "dialogue:chili.defeat.2", "dialogue:chili.defeat.3"],
  },
  [TrainerType.CILAN]: {
    encounter: ["dialogue:cilan.encounter.1", "dialogue:cilan.encounter.2", "dialogue:cilan.encounter.3"],
    victory: ["dialogue:cilan.victory.1", "dialogue:cilan.victory.2", "dialogue:cilan.victory.3"],
    defeat: ["dialogue:cilan.defeat.1", "dialogue:cilan.defeat.2", "dialogue:cilan.defeat.3"],
  },
  [TrainerType.ROARK]: {
    encounter: [
      "dialogue:roark.encounter.1",
      "dialogue:roark.encounter.2",
      "dialogue:roark.encounter.3",
      "dialogue:roark.encounter.4",
    ],
    victory: [
      "dialogue:roark.victory.1",
      "dialogue:roark.victory.2",
      "dialogue:roark.victory.3",
      "dialogue:roark.victory.4",
    ],
    defeat: ["dialogue:roark.defeat.1", "dialogue:roark.defeat.2", "dialogue:roark.defeat.3"],
  },
  [TrainerType.MORTY]: {
    encounter: [
      "dialogue:morty.encounter.1",
      "dialogue:morty.encounter.2",
      "dialogue:morty.encounter.3",
      "dialogue:morty.encounter.4",
      "dialogue:morty.encounter.5",
      "dialogue:morty.encounter.6",
    ],
    victory: [
      "dialogue:morty.victory.1",
      "dialogue:morty.victory.2",
      "dialogue:morty.victory.3",
      "dialogue:morty.victory.4",
      "dialogue:morty.victory.5",
      "dialogue:morty.victory.6",
    ],
    defeat: [
      "dialogue:morty.defeat.1",
      "dialogue:morty.defeat.2",
      "dialogue:morty.defeat.3",
      "dialogue:morty.defeat.4",
      "dialogue:morty.defeat.5",
      "dialogue:morty.defeat.6",
    ],
  },
  [TrainerType.CRISPIN]: {
    encounter: ["dialogue:crispin.encounter.1", "dialogue:crispin.encounter.2"],
    victory: ["dialogue:crispin.victory.1", "dialogue:crispin.victory.2"],
    defeat: ["dialogue:crispin.defeat.1", "dialogue:crispin.defeat.2"],
  },
  [TrainerType.AMARYS]: {
    encounter: ["dialogue:amarys.encounter.1"],
    victory: ["dialogue:amarys.victory.1"],
    defeat: ["dialogue:amarys.defeat.1"],
  },
  [TrainerType.LACEY]: {
    encounter: ["dialogue:lacey.encounter.1"],
    victory: ["dialogue:lacey.victory.1"],
    defeat: ["dialogue:lacey.defeat.1"],
  },
  [TrainerType.DRAYTON]: {
    encounter: ["dialogue:drayton.encounter.1"],
    victory: ["dialogue:drayton.victory.1"],
    defeat: ["dialogue:drayton.defeat.1"],
  },
  [TrainerType.RAMOS]: {
    encounter: ["dialogue:ramos.encounter.1"],
    victory: ["dialogue:ramos.victory.1"],
    defeat: ["dialogue:ramos.defeat.1"],
  },
  [TrainerType.VIOLA]: {
    encounter: ["dialogue:viola.encounter.1", "dialogue:viola.encounter.2"],
    victory: ["dialogue:viola.victory.1", "dialogue:viola.victory.2"],
    defeat: ["dialogue:viola.defeat.1", "dialogue:viola.defeat.2"],
  },
  [TrainerType.CANDICE]: {
    encounter: ["dialogue:candice.encounter.1", "dialogue:candice.encounter.2"],
    victory: ["dialogue:candice.victory.1", "dialogue:candice.victory.2"],
    defeat: ["dialogue:candice.defeat.1", "dialogue:candice.defeat.2"],
  },
  [TrainerType.GARDENIA]: {
    encounter: ["dialogue:gardenia.encounter.1"],
    victory: ["dialogue:gardenia.victory.1"],
    defeat: ["dialogue:gardenia.defeat.1"],
  },
  [TrainerType.AARON]: {
    encounter: ["dialogue:aaron.encounter.1"],
    victory: ["dialogue:aaron.victory.1"],
    defeat: ["dialogue:aaron.defeat.1"],
  },
  [TrainerType.CRESS]: {
    encounter: ["dialogue:cress.encounter.1"],
    victory: ["dialogue:cress.victory.1"],
    defeat: ["dialogue:cress.defeat.1"],
  },
  [TrainerType.ALLISTER]: {
    encounter: ["dialogue:allister.encounter.1"],
    victory: ["dialogue:allister.victory.1"],
    defeat: ["dialogue:allister.defeat.1"],
  },
  [TrainerType.CLAY]: {
    encounter: ["dialogue:clay.encounter.1"],
    victory: ["dialogue:clay.victory.1"],
    defeat: ["dialogue:clay.defeat.1"],
  },
  [TrainerType.KOFU]: {
    encounter: ["dialogue:kofu.encounter.1"],
    victory: ["dialogue:kofu.victory.1"],
    defeat: ["dialogue:kofu.defeat.1"],
  },
  [TrainerType.TULIP]: {
    encounter: ["dialogue:tulip.encounter.1"],
    victory: ["dialogue:tulip.victory.1"],
    defeat: ["dialogue:tulip.defeat.1"],
  },
  [TrainerType.SIDNEY]: {
    encounter: ["dialogue:sidney.encounter.1"],
    victory: ["dialogue:sidney.victory.1"],
    defeat: ["dialogue:sidney.defeat.1"],
  },
  [TrainerType.PHOEBE]: {
    encounter: ["dialogue:phoebe.encounter.1"],
    victory: ["dialogue:phoebe.victory.1"],
    defeat: ["dialogue:phoebe.defeat.1"],
  },
  [TrainerType.GLACIA]: {
    encounter: ["dialogue:glacia.encounter.1"],
    victory: ["dialogue:glacia.victory.1"],
    defeat: ["dialogue:glacia.defeat.1"],
  },
  [TrainerType.DRAKE]: {
    encounter: ["dialogue:drake.encounter.1"],
    victory: ["dialogue:drake.victory.1"],
    defeat: ["dialogue:drake.defeat.1"],
  },
  [TrainerType.WALLACE]: {
    encounter: ["dialogue:wallace.encounter.1"],
    victory: ["dialogue:wallace.victory.1"],
    defeat: ["dialogue:wallace.defeat.1"],
  },
  [TrainerType.LORELEI]: {
    encounter: ["dialogue:lorelei.encounter.1"],
    victory: ["dialogue:lorelei.victory.1"],
    defeat: ["dialogue:lorelei.defeat.1"],
  },
  [TrainerType.WILL]: {
    encounter: ["dialogue:will.encounter.1"],
    victory: ["dialogue:will.victory.1"],
    defeat: ["dialogue:will.defeat.1"],
  },
  [TrainerType.MALVA]: {
    encounter: ["dialogue:malva.encounter.1"],
    victory: ["dialogue:malva.victory.1"],
    defeat: ["dialogue:malva.defeat.1"],
  },
  [TrainerType.HALA]: {
    encounter: ["dialogue:hala.encounter.1"],
    victory: ["dialogue:hala.victory.1"],
    defeat: ["dialogue:hala.defeat.1"],
  },
  [TrainerType.MOLAYNE]: {
    encounter: ["dialogue:molayne.encounter.1"],
    victory: ["dialogue:molayne.victory.1"],
    defeat: ["dialogue:molayne.defeat.1"],
  },
  [TrainerType.RIKA]: {
    encounter: ["dialogue:rika.encounter.1"],
    victory: ["dialogue:rika.victory.1"],
    defeat: ["dialogue:rika.defeat.1"],
  },
  [TrainerType.BRUNO]: {
    encounter: ["dialogue:bruno.encounter.1"],
    victory: ["dialogue:bruno.victory.1"],
    defeat: ["dialogue:bruno.defeat.1"],
  },
  [TrainerType.BUGSY]: {
    encounter: ["dialogue:bugsy.encounter.1"],
    victory: ["dialogue:bugsy.victory.1"],
    defeat: ["dialogue:bugsy.defeat.1"],
  },
  [TrainerType.KOGA]: {
    encounter: ["dialogue:koga.encounter.1"],
    victory: ["dialogue:koga.victory.1"],
    defeat: ["dialogue:koga.defeat.1"],
  },
  [TrainerType.BERTHA]: {
    encounter: ["dialogue:bertha.encounter.1"],
    victory: ["dialogue:bertha.victory.1"],
    defeat: ["dialogue:bertha.defeat.1"],
  },
  [TrainerType.LENORA]: {
    encounter: ["dialogue:lenora.encounter.1"],
    victory: ["dialogue:lenora.victory.1"],
    defeat: ["dialogue:lenora.defeat.1"],
  },
  [TrainerType.SIEBOLD]: {
    encounter: ["dialogue:siebold.encounter.1"],
    victory: ["dialogue:siebold.victory.1"],
    defeat: ["dialogue:siebold.defeat.1"],
  },
  [TrainerType.ROXIE]: {
    encounter: ["dialogue:roxie.encounter.1"],
    victory: ["dialogue:roxie.victory.1"],
    defeat: ["dialogue:roxie.defeat.1"],
  },
  [TrainerType.OLIVIA]: {
    encounter: ["dialogue:olivia.encounter.1"],
    victory: ["dialogue:olivia.victory.1"],
    defeat: ["dialogue:olivia.defeat.1"],
  },
  [TrainerType.POPPY]: {
    encounter: ["dialogue:poppy.encounter.1"],
    victory: ["dialogue:poppy.victory.1"],
    defeat: ["dialogue:poppy.defeat.1"],
  },
  [TrainerType.AGATHA]: {
    encounter: ["dialogue:agatha.encounter.1"],
    victory: ["dialogue:agatha.victory.1"],
    defeat: ["dialogue:agatha.defeat.1"],
  },
  [TrainerType.FLINT]: {
    encounter: ["dialogue:flint.encounter.1"],
    victory: ["dialogue:flint.victory.1"],
    defeat: ["dialogue:flint.defeat.1"],
  },
  [TrainerType.GRIMSLEY]: {
    encounter: ["dialogue:grimsley.encounter.1"],
    victory: ["dialogue:grimsley.victory.1"],
    defeat: ["dialogue:grimsley.defeat.1"],
  },
  [TrainerType.CAITLIN]: {
    encounter: ["dialogue:caitlin.encounter.1"],
    victory: ["dialogue:caitlin.victory.1"],
    defeat: ["dialogue:caitlin.defeat.1"],
  },
  [TrainerType.DIANTHA]: {
    encounter: ["dialogue:diantha.encounter.1"],
    victory: ["dialogue:diantha.victory.1"],
    defeat: ["dialogue:diantha.defeat.1"],
  },
  [TrainerType.WIKSTROM]: {
    encounter: ["dialogue:wikstrom.encounter.1"],
    victory: ["dialogue:wikstrom.victory.1"],
    defeat: ["dialogue:wikstrom.defeat.1"],
  },
  [TrainerType.ACEROLA]: {
    encounter: ["dialogue:acerola.encounter.1"],
    victory: ["dialogue:acerola.victory.1"],
    defeat: ["dialogue:acerola.defeat.1"],
  },
  [TrainerType.LARRY_ELITE]: {
    encounter: ["dialogue:larryElite.encounter.1"],
    victory: ["dialogue:larryElite.victory.1"],
    defeat: ["dialogue:larryElite.defeat.1"],
  },
  [TrainerType.LANCE]: {
    encounter: ["dialogue:lance.encounter.1", "dialogue:lance.encounter.2"],
    victory: ["dialogue:lance.victory.1", "dialogue:lance.victory.2"],
    defeat: ["dialogue:lance.defeat.1", "dialogue:lance.defeat.2"],
  },
  [TrainerType.KAREN]: {
    encounter: ["dialogue:karen.encounter.1", "dialogue:karen.encounter.2", "dialogue:karen.encounter.3"],
    victory: ["dialogue:karen.victory.1", "dialogue:karen.victory.2", "dialogue:karen.victory.3"],
    defeat: ["dialogue:karen.defeat.1", "dialogue:karen.defeat.2", "dialogue:karen.defeat.3"],
  },
  [TrainerType.MILO]: {
    encounter: ["dialogue:milo.encounter.1"],
    victory: ["dialogue:milo.victory.1"],
    defeat: ["dialogue:milo.defeat.1"],
  },
  [TrainerType.LUCIAN]: {
    encounter: ["dialogue:lucian.encounter.1"],
    victory: ["dialogue:lucian.victory.1"],
    defeat: ["dialogue:lucian.defeat.1"],
  },
  [TrainerType.DRASNA]: {
    encounter: ["dialogue:drasna.encounter.1"],
    victory: ["dialogue:drasna.victory.1"],
    defeat: ["dialogue:drasna.defeat.1"],
  },
  [TrainerType.KAHILI]: {
    encounter: ["dialogue:kahili.encounter.1"],
    victory: ["dialogue:kahili.victory.1"],
    defeat: ["dialogue:kahili.defeat.1"],
  },
  [TrainerType.HASSEL]: {
    encounter: ["dialogue:hassel.encounter.1"],
    victory: ["dialogue:hassel.victory.1"],
    defeat: ["dialogue:hassel.defeat.1"],
  },
  [TrainerType.BLUE]: {
    encounter: ["dialogue:blue.encounter.1"],
    victory: ["dialogue:blue.victory.1"],
    defeat: ["dialogue:blue.defeat.1"],
  },
  [TrainerType.PIERS]: {
    encounter: ["dialogue:piers.encounter.1"],
    victory: ["dialogue:piers.victory.1"],
    defeat: ["dialogue:piers.defeat.1"],
  },
  [TrainerType.RED]: {
    encounter: ["dialogue:red.encounter.1"],
    victory: ["dialogue:red.victory.1"],
    defeat: ["dialogue:red.defeat.1"],
  },
  [TrainerType.JASMINE]: {
    encounter: ["dialogue:jasmine.encounter.1"],
    victory: ["dialogue:jasmine.victory.1"],
    defeat: ["dialogue:jasmine.defeat.1"],
  },
  [TrainerType.LANCE_CHAMPION]: {
    encounter: ["dialogue:lanceChampion.encounter.1"],
    victory: ["dialogue:lanceChampion.victory.1"],
    defeat: ["dialogue:lanceChampion.defeat.1"],
  },
  [TrainerType.STEVEN]: {
    encounter: ["dialogue:steven.encounter.1"],
    victory: ["dialogue:steven.victory.1"],
    defeat: ["dialogue:steven.defeat.1"],
  },
  [TrainerType.CYNTHIA]: {
    encounter: ["dialogue:cynthia.encounter.1"],
    victory: ["dialogue:cynthia.victory.1"],
    defeat: ["dialogue:cynthia.defeat.1"],
  },
  [TrainerType.IRIS]: {
    encounter: ["dialogue:iris.encounter.1"],
    victory: ["dialogue:iris.victory.1"],
    defeat: ["dialogue:iris.defeat.1"],
  },
  [TrainerType.KUKUI]: {
    encounter: ["dialogue:kukui.encounter.1"],
    victory: ["dialogue:kukui.victory.1"],
    defeat: ["dialogue:kukui.defeat.1"],
  },
  [TrainerType.HAU]: {
    encounter: ["dialogue:hau.encounter.1"],
    victory: ["dialogue:hau.victory.1"],
    defeat: ["dialogue:hau.defeat.1"],
  },
  [TrainerType.GEETA]: {
    encounter: ["dialogue:geeta.encounter.1"],
    victory: ["dialogue:geeta.victory.1"],
    defeat: ["dialogue:geeta.defeat.1"],
  },
  [TrainerType.NEMONA]: {
    encounter: ["dialogue:nemona.encounter.1"],
    victory: ["dialogue:nemona.victory.1"],
    defeat: ["dialogue:nemona.defeat.1"],
  },
  [TrainerType.LEON]: {
    encounter: ["dialogue:leon.encounter.1"],
    victory: ["dialogue:leon.victory.1"],
    defeat: ["dialogue:leon.defeat.1"],
  },
  [TrainerType.MUSTARD]: {
    encounter: ["dialogue:mustard.encounter.1"],
    victory: ["dialogue:mustard.victory.1"],
    defeat: ["dialogue:mustard.defeat.1"],
  },
  [TrainerType.WHITNEY]: {
    encounter: ["dialogue:whitney.encounter.1"],
    victory: ["dialogue:whitney.victory.1"],
    defeat: ["dialogue:whitney.defeat.1"],
  },
  [TrainerType.CHUCK]: {
    encounter: ["dialogue:chuck.encounter.1"],
    victory: ["dialogue:chuck.victory.1"],
    defeat: ["dialogue:chuck.defeat.1"],
  },
  [TrainerType.KATY]: {
    encounter: ["dialogue:katy.encounter.1"],
    victory: ["dialogue:katy.victory.1"],
    defeat: ["dialogue:katy.defeat.1"],
  },
  [TrainerType.PRYCE]: {
    encounter: ["dialogue:pryce.encounter.1"],
    victory: ["dialogue:pryce.victory.1"],
    defeat: ["dialogue:pryce.defeat.1"],
  },
  [TrainerType.CLAIR]: {
    encounter: ["dialogue:clair.encounter.1"],
    victory: ["dialogue:clair.victory.1"],
    defeat: ["dialogue:clair.defeat.1"],
  },
  [TrainerType.MAYLENE]: {
    encounter: ["dialogue:maylene.encounter.1"],
    victory: ["dialogue:maylene.victory.1"],
    defeat: ["dialogue:maylene.defeat.1"],
  },
  [TrainerType.FANTINA]: {
    encounter: ["dialogue:fantina.encounter.1"],
    victory: ["dialogue:fantina.victory.1"],
    defeat: ["dialogue:fantina.defeat.1"],
  },
  [TrainerType.BYRON]: {
    encounter: ["dialogue:byron.encounter.1"],
    victory: ["dialogue:byron.victory.1"],
    defeat: ["dialogue:byron.defeat.1"],
  },
  [TrainerType.OLYMPIA]: {
    encounter: ["dialogue:olympia.encounter.1"],
    victory: ["dialogue:olympia.victory.1"],
    defeat: ["dialogue:olympia.defeat.1"],
  },
  [TrainerType.VOLKNER]: {
    encounter: ["dialogue:volkner.encounter.1"],
    victory: ["dialogue:volkner.victory.1"],
    defeat: ["dialogue:volkner.defeat.1"],
  },
  [TrainerType.BURGH]: {
    encounter: ["dialogue:burgh.encounter.1", "dialogue:burgh.encounter.2"],
    victory: ["dialogue:burgh.victory.1", "dialogue:burgh.victory.2"],
    defeat: ["dialogue:burgh.defeat.1", "dialogue:burgh.defeat.2"],
  },
  [TrainerType.ELESA]: {
    encounter: ["dialogue:elesa.encounter.1"],
    victory: ["dialogue:elesa.victory.1"],
    defeat: ["dialogue:elesa.defeat.1"],
  },
  [TrainerType.SKYLA]: {
    encounter: ["dialogue:skyla.encounter.1"],
    victory: ["dialogue:skyla.victory.1"],
    defeat: ["dialogue:skyla.defeat.1"],
  },
  [TrainerType.BRYCEN]: {
    encounter: ["dialogue:brycen.encounter.1"],
    victory: ["dialogue:brycen.victory.1"],
    defeat: ["dialogue:brycen.defeat.1"],
  },
  [TrainerType.DRAYDEN]: {
    encounter: ["dialogue:drayden.encounter.1"],
    victory: ["dialogue:drayden.victory.1"],
    defeat: ["dialogue:drayden.defeat.1"],
  },
  [TrainerType.GRANT]: {
    encounter: ["dialogue:grant.encounter.1"],
    victory: ["dialogue:grant.victory.1"],
    defeat: ["dialogue:grant.defeat.1"],
  },
  [TrainerType.KORRINA]: {
    encounter: ["dialogue:korrina.encounter.1"],
    victory: ["dialogue:korrina.victory.1"],
    defeat: ["dialogue:korrina.defeat.1"],
  },
  [TrainerType.CLEMONT]: {
    encounter: ["dialogue:clemont.encounter.1"],
    victory: ["dialogue:clemont.victory.1"],
    defeat: ["dialogue:clemont.defeat.1"],
  },
  [TrainerType.VALERIE]: {
    encounter: ["dialogue:valerie.encounter.1"],
    victory: ["dialogue:valerie.victory.1"],
    defeat: ["dialogue:valerie.defeat.1"],
  },
  [TrainerType.WULFRIC]: {
    encounter: ["dialogue:wulfric.encounter.1"],
    victory: ["dialogue:wulfric.victory.1"],
    defeat: ["dialogue:wulfric.defeat.1"],
  },
  [TrainerType.KABU]: {
    encounter: ["dialogue:kabu.encounter.1"],
    victory: ["dialogue:kabu.victory.1"],
    defeat: ["dialogue:kabu.defeat.1"],
  },
  [TrainerType.BEA]: {
    encounter: ["dialogue:bea.encounter.1"],
    victory: ["dialogue:bea.victory.1"],
    defeat: ["dialogue:bea.defeat.1"],
  },
  [TrainerType.OPAL]: {
    encounter: ["dialogue:opal.encounter.1"],
    victory: ["dialogue:opal.victory.1"],
    defeat: ["dialogue:opal.defeat.1"],
  },
  [TrainerType.BEDE]: {
    encounter: ["dialogue:bede.encounter.1"],
    victory: ["dialogue:bede.victory.1"],
    defeat: ["dialogue:bede.defeat.1"],
  },
  [TrainerType.GORDIE]: {
    encounter: ["dialogue:gordie.encounter.1"],
    victory: ["dialogue:gordie.victory.1"],
    defeat: ["dialogue:gordie.defeat.1"],
  },
  [TrainerType.MARNIE]: {
    encounter: ["dialogue:marnie.encounter.1"],
    victory: ["dialogue:marnie.victory.1"],
    defeat: ["dialogue:marnie.defeat.1"],
  },
  [TrainerType.RAIHAN]: {
    encounter: ["dialogue:raihan.encounter.1"],
    victory: ["dialogue:raihan.victory.1"],
    defeat: ["dialogue:raihan.defeat.1"],
  },
  [TrainerType.BRASSIUS]: {
    encounter: ["dialogue:brassius.encounter.1"],
    victory: ["dialogue:brassius.victory.1"],
    defeat: ["dialogue:brassius.defeat.1"],
  },
  [TrainerType.IONO]: {
    encounter: ["dialogue:iono.encounter.1"],
    victory: ["dialogue:iono.victory.1"],
    defeat: ["dialogue:iono.defeat.1"],
  },
  [TrainerType.LARRY]: {
    encounter: ["dialogue:larry.encounter.1"],
    victory: ["dialogue:larry.victory.1"],
    defeat: ["dialogue:larry.defeat.1"],
  },
  [TrainerType.RYME]: {
    encounter: ["dialogue:ryme.encounter.1"],
    victory: ["dialogue:ryme.victory.1"],
    defeat: ["dialogue:ryme.defeat.1"],
  },
  [TrainerType.GRUSHA]: {
    encounter: ["dialogue:grusha.encounter.1"],
    victory: ["dialogue:grusha.victory.1"],
    defeat: ["dialogue:grusha.defeat.1"],
  },
  [TrainerType.MARNIE_ELITE]: {
    encounter: ["dialogue:marnieElite.encounter.1", "dialogue:marnieElite.encounter.2"],
    victory: ["dialogue:marnieElite.victory.1", "dialogue:marnieElite.victory.2"],
    defeat: ["dialogue:marnieElite.defeat.1", "dialogue:marnieElite.defeat.2"],
  },
  [TrainerType.NESSA_ELITE]: {
    encounter: ["dialogue:nessaElite.encounter.1", "dialogue:nessaElite.encounter.2"],
    victory: ["dialogue:nessaElite.victory.1", "dialogue:nessaElite.victory.2"],
    defeat: ["dialogue:nessaElite.defeat.1", "dialogue:nessaElite.defeat.2"],
  },
  [TrainerType.BEA_ELITE]: {
    encounter: ["dialogue:beaElite.encounter.1", "dialogue:beaElite.encounter.2"],
    victory: ["dialogue:beaElite.victory.1", "dialogue:beaElite.victory.2"],
    defeat: ["dialogue:beaElite.defeat.1", "dialogue:beaElite.defeat.2"],
  },
  [TrainerType.ALLISTER_ELITE]: {
    encounter: ["dialogue:allisterElite.encounter.1", "dialogue:allisterElite.encounter.2"],
    victory: ["dialogue:allisterElite.victory.1", "dialogue:allisterElite.victory.2"],
    defeat: ["dialogue:allisterElite.defeat.1", "dialogue:allisterElite.defeat.2"],
  },
  [TrainerType.RAIHAN_ELITE]: {
    encounter: ["dialogue:raihanElite.encounter.1", "dialogue:raihanElite.encounter.2"],
    victory: ["dialogue:raihanElite.victory.1", "dialogue:raihanElite.victory.2"],
    defeat: ["dialogue:raihanElite.defeat.1", "dialogue:raihanElite.defeat.2"],
  },
  [TrainerType.ALDER]: {
    encounter: ["dialogue:alder.encounter.1"],
    victory: ["dialogue:alder.victory.1"],
    defeat: ["dialogue:alder.defeat.1"],
  },
  [TrainerType.KIERAN]: {
    encounter: ["dialogue:kieran.encounter.1"],
    victory: ["dialogue:kieran.victory.1"],
    defeat: ["dialogue:kieran.defeat.1"],
  },
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
