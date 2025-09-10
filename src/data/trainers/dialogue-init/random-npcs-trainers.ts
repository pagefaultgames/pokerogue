import { TrainerTypeDialogue } from "#data/dialogue";
import { TrainerType } from "#enums/trainer-type";

export const randomNPCDialogue: TrainerTypeDialogue = {
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
			encounter: [
				"dialogue:breeder.encounter.1",
				"dialogue:breeder.encounter.2",
				"dialogue:breeder.encounter.3",
			],
			victory: [
				"dialogue:breeder.victory.1",
				"dialogue:breeder.victory.2",
				"dialogue:breeder.victory.3",
			],
			defeat: [
				"dialogue:breeder.defeat.1",
				"dialogue:breeder.defeat.2",
				"dialogue:breeder.defeat.3",
			],
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
			defeat: [
				"dialogue:breederFemale.defeat.1",
				"dialogue:breederFemale.defeat.2",
				"dialogue:breederFemale.defeat.3",
			],
		},
	],
	[TrainerType.FISHERMAN]: [
		{
			encounter: [
				"dialogue:fisherman.encounter.1",
				"dialogue:fisherman.encounter.2",
				"dialogue:fisherman.encounter.3",
			],
			victory: [
				"dialogue:fisherman.victory.1",
				"dialogue:fisherman.victory.2",
				"dialogue:fisherman.victory.3",
			],
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
			encounter: [
				"dialogue:swimmer.encounter.1",
				"dialogue:swimmer.encounter.2",
				"dialogue:swimmer.encounter.3",
			],
			victory: [
				"dialogue:swimmer.victory.1",
				"dialogue:swimmer.victory.2",
				"dialogue:swimmer.victory.3",
			],
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
			encounter: [
				"dialogue:twins.encounter.1",
				"dialogue:twins.encounter.2",
				"dialogue:twins.encounter.3",
			],
			victory: [
				"dialogue:twins.victory.1",
				"dialogue:twins.victory.2",
				"dialogue:twins.victory.3",
			],
			defeat: [
				"dialogue:twins.defeat.1",
				"dialogue:twins.defeat.2",
				"dialogue:twins.defeat.3",
			],
		},
	],
	[TrainerType.CYCLIST]: [
		{
			encounter: [
				"dialogue:cyclist.encounter.1",
				"dialogue:cyclist.encounter.2",
				"dialogue:cyclist.encounter.3",
			],
			victory: [
				"dialogue:cyclist.victory.1",
				"dialogue:cyclist.victory.2",
				"dialogue:cyclist.victory.3",
			],
		},
	],
	[TrainerType.BLACK_BELT]: [
		{
			encounter: [
				"dialogue:blackBelt.encounter.1",
				"dialogue:blackBelt.encounter.2",
			],
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
			encounter: [
				"dialogue:schoolKid.encounter.1",
				"dialogue:schoolKid.encounter.2",
			],
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
			encounter: [
				"dialogue:hexManiac.encounter.1",
				"dialogue:hexManiac.encounter.2",
			],
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
			encounter: [
				"dialogue:officer.encounter.1",
				"dialogue:officer.encounter.2",
			],
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
			encounter: [
				"dialogue:sailor.encounter.1",
				"dialogue:sailor.encounter.2",
				"dialogue:sailor.encounter.3",
			],
			victory: [
				"dialogue:sailor.victory.1",
				"dialogue:sailor.victory.2",
				"dialogue:sailor.victory.3",
			],
		},
	],
	[TrainerType.CLERK]: [
		{
			encounter: [
				"dialogue:clerk.encounter.1",
				"dialogue:clerk.encounter.2",
				"dialogue:clerk.encounter.3",
			],
			victory: [
				"dialogue:clerk.victory.1",
				"dialogue:clerk.victory.2",
				"dialogue:clerk.victory.3",
			],
		},
		{
			encounter: [
				"dialogue:clerkFemale.encounter.1",
				"dialogue:clerkFemale.encounter.2",
				"dialogue:clerkFemale.encounter.3",
			],
			victory: [
				"dialogue:clerkFemale.victory.1",
				"dialogue:clerkFemale.victory.2",
				"dialogue:clerkFemale.victory.3",
			],
		},
	],
	[TrainerType.HOOLIGANS]: [
		{
			encounter: [
				"dialogue:hooligans.encounter.1",
				"dialogue:hooligans.encounter.2",
			],
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
			victory: [
				"dialogue:musician.victory.1",
				"dialogue:musician.victory.2",
				"dialogue:musician.victory.3",
			],
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
			encounter: [
				"dialogue:pokefan.encounter.1",
				"dialogue:pokefan.encounter.2",
				"dialogue:pokefan.encounter.3",
			],
			victory: [
				"dialogue:pokefan.victory.1",
				"dialogue:pokefan.victory.2",
				"dialogue:pokefan.victory.3",
			],
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
			encounter: [
				"dialogue:rich.encounter.1",
				"dialogue:rich.encounter.2",
				"dialogue:rich.encounter.3",
			],
			victory: [
				"dialogue:rich.victory.1",
				"dialogue:rich.victory.2",
				"dialogue:rich.victory.3",
			],
		},
		{
			encounter: [
				"dialogue:richFemale.encounter.1",
				"dialogue:richFemale.encounter.2",
				"dialogue:richFemale.encounter.3",
			],
			victory: [
				"dialogue:richFemale.victory.1",
				"dialogue:richFemale.victory.2",
				"dialogue:richFemale.victory.3",
			],
		},
	],
	[TrainerType.RICH_KID]: [
		{
			encounter: [
				"dialogue:richKid.encounter.1",
				"dialogue:richKid.encounter.2",
				"dialogue:richKid.encounter.3",
			],
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
};
