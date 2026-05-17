import { SpeciesId } from "#enums/species-id";
import { TrainerType } from "#enums/trainer-type";

export type FusionPairSpec = readonly [SpeciesId, SpeciesId, number?];

export interface TrainerFusionSlot {
  readonly slotIndex: number;
  readonly pool: readonly FusionPairSpec[];
}

export const trainerFusionPools: Partial<Record<TrainerType, readonly TrainerFusionSlot[]>> = {
  [TrainerType.BROCK]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.STEELIX, SpeciesId.TYRANITAR, 3],
        [SpeciesId.TYRANITAR, SpeciesId.AGGRON, 3],
        [SpeciesId.STEELIX, SpeciesId.RHYPERIOR, 1],
      ],
    },
    {
      slotIndex: -2,
      pool: [
        [SpeciesId.AERODACTYL, SpeciesId.TYRANTRUM, 3],
        [SpeciesId.TYRANTRUM, SpeciesId.AURORUS, 3],
        [SpeciesId.AERODACTYL, SpeciesId.CHARIZARD, 1],
      ],
    },
    {
      slotIndex: -3,
      pool: [
        [SpeciesId.KABUTOPS, SpeciesId.OMASTAR, 3],
        [SpeciesId.OMASTAR, SpeciesId.CRADILY, 3],
        [SpeciesId.KABUTOPS, SpeciesId.CRADILY, 1],
      ],
    },
  ],
  [TrainerType.MISTY]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.GYARADOS, SpeciesId.LAPRAS, 3],
        [SpeciesId.KINGDRA, SpeciesId.GYARADOS, 3],
        [SpeciesId.GYARADOS, SpeciesId.KINGDRA, 1],
        [SpeciesId.GYARADOS, SpeciesId.CHARIZARD, 1],
      ],
    },
    {
      slotIndex: -2,
      pool: [
        [SpeciesId.VAPOREON, SpeciesId.STARMIE, 3],
        [SpeciesId.SLOWBRO, SpeciesId.STARMIE, 3],
        [SpeciesId.MILOTIC, SpeciesId.VAPOREON, 1],
        [SpeciesId.VAPOREON, SpeciesId.SLOWBRO, 1],
      ],
    },
  ],
  [TrainerType.LT_SURGE]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.MAGNEZONE, SpeciesId.RAICHU, 3],
        [SpeciesId.ELECTRODE, SpeciesId.RAICHU, 3],
        [SpeciesId.RAICHU, SpeciesId.ELECTRODE, 1],
        [SpeciesId.MAGNEZONE, SpeciesId.HERACROSS, 1],
      ],
    },
    {
      slotIndex: -2,
      pool: [
        [SpeciesId.LUXRAY, SpeciesId.JOLTEON, 3],
        [SpeciesId.JOLTEON, SpeciesId.LUXRAY, 3],
        [SpeciesId.GALVANTULA, SpeciesId.JOLTEON, 1],
      ],
    },
  ],
  [TrainerType.ERIKA]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.VILEPLUME, SpeciesId.BELLOSSOM, 3],
        [SpeciesId.BELLOSSOM, SpeciesId.VILEPLUME, 3],
        [SpeciesId.VILEPLUME, SpeciesId.VICTREEBEL, 1],
        [SpeciesId.WHIMSICOTT, SpeciesId.BELLOSSOM, 1],
        [SpeciesId.VILEPLUME, SpeciesId.GENGAR, 1],
      ],
    },
  ],
  [TrainerType.KOGA]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.CROBAT, SpeciesId.WEEZING, 3],
        [SpeciesId.WEEZING, SpeciesId.GENGAR, 3],
        [SpeciesId.GENGAR, SpeciesId.WEEZING, 1],
        [SpeciesId.GENGAR, SpeciesId.MUK, 1],
        [SpeciesId.CROBAT, SpeciesId.AERODACTYL, 1],
      ],
    },
  ],
  [TrainerType.SABRINA]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.ESPEON, SpeciesId.ALAKAZAM, 3],
        [SpeciesId.ALAKAZAM, SpeciesId.ESPEON, 3],
        [SpeciesId.ALAKAZAM, SpeciesId.GENGAR, 1],
      ],
    },
    {
      slotIndex: -2,
      pool: [
        [SpeciesId.GARDEVOIR, SpeciesId.GALLADE, 3],
        [SpeciesId.GALLADE, SpeciesId.GARDEVOIR, 3],
        [SpeciesId.REUNICLUS, SpeciesId.GARDEVOIR, 1],
      ],
    },
  ],
  [TrainerType.BLAINE]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.TYPHLOSION, SpeciesId.ARCANINE, 3],
        [SpeciesId.ARCANINE, SpeciesId.TYPHLOSION, 3],
        [SpeciesId.HOUNDOOM, SpeciesId.ARCANINE, 1],
        [SpeciesId.ARCANINE, SpeciesId.HOUNDOOM, 1],
      ],
    },
    {
      slotIndex: -2,
      pool: [
        [SpeciesId.RAPIDASH, SpeciesId.CHARIZARD, 3],
        [SpeciesId.NINETALES, SpeciesId.CHARIZARD, 3],
        [SpeciesId.VOLCARONA, SpeciesId.CHARIZARD, 1],
        [SpeciesId.CHARIZARD, SpeciesId.ALAKAZAM, 1],
      ],
    },
  ],
  [TrainerType.GIOVANNI]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.PERSIAN, SpeciesId.NIDOKING, 3],
        [SpeciesId.NIDOKING, SpeciesId.PERSIAN, 3],
        [SpeciesId.NIDOQUEEN, SpeciesId.NIDOKING, 1],
        [SpeciesId.KANGASKHAN, SpeciesId.NIDOKING, 1],
        [SpeciesId.NIDOKING, SpeciesId.HERACROSS, 1],
      ],
    },
  ],

  [TrainerType.LORELEI]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.LAPRAS, SpeciesId.CLOYSTER, 3],
        [SpeciesId.CLOYSTER, SpeciesId.LAPRAS, 3],
        [SpeciesId.GLALIE, SpeciesId.LAPRAS, 1],
        [SpeciesId.FROSLASS, SpeciesId.LAPRAS, 1],
        [SpeciesId.LAPRAS, SpeciesId.CHARIZARD, 1],
      ],
    },
  ],
  [TrainerType.BRUNO]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.MACHAMP, SpeciesId.HITMONCHAN, 3],
        [SpeciesId.HITMONCHAN, SpeciesId.MACHAMP, 3],
        [SpeciesId.LUCARIO, SpeciesId.MACHAMP, 1],
        [SpeciesId.HAWLUCHA, SpeciesId.MACHAMP, 1],
      ],
    },
  ],
  [TrainerType.AGATHA]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.GENGAR, SpeciesId.MISMAGIUS, 3],
        [SpeciesId.MISMAGIUS, SpeciesId.GENGAR, 3],
        [SpeciesId.GENGAR, SpeciesId.CROBAT, 1],
        [SpeciesId.GENGAR, SpeciesId.ALAKAZAM, 1],
      ],
    },
    {
      slotIndex: -2,
      pool: [
        [SpeciesId.DUSKNOIR, SpeciesId.BANETTE, 3],
        [SpeciesId.BANETTE, SpeciesId.DUSKNOIR, 3],
        [SpeciesId.SPIRITOMB, SpeciesId.BANETTE, 1],
        [SpeciesId.COFAGRIGUS, SpeciesId.DUSKNOIR, 1],
      ],
    },
  ],
  [TrainerType.LANCE]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.CHARIZARD, SpeciesId.DRAGONITE, 3],
        [SpeciesId.GYARADOS, SpeciesId.DRAGONITE, 3],
        [SpeciesId.HAXORUS, SpeciesId.DRAGONITE, 1],
      ],
    },
    {
      slotIndex: -2,
      pool: [
        [SpeciesId.AERODACTYL, SpeciesId.CHARIZARD, 3],
        [SpeciesId.FLYGON, SpeciesId.CHARIZARD, 3],
      ],
    },
    {
      slotIndex: -3,
      pool: [
        [SpeciesId.DRAGONITE, SpeciesId.GYARADOS, 3],
        [SpeciesId.KINGDRA, SpeciesId.GYARADOS, 3],
      ],
    },
  ],
  [TrainerType.LANCE_CHAMPION]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.CHARIZARD, SpeciesId.DRAGONITE, 3],
        [SpeciesId.GYARADOS, SpeciesId.DRAGONITE, 3],
        [SpeciesId.HAXORUS, SpeciesId.DRAGONITE, 1],
      ],
    },
    {
      slotIndex: -2,
      pool: [
        [SpeciesId.AERODACTYL, SpeciesId.CHARIZARD, 3],
        [SpeciesId.FLYGON, SpeciesId.CHARIZARD, 3],
      ],
    },
    {
      slotIndex: -3,
      pool: [
        [SpeciesId.DRAGONITE, SpeciesId.GYARADOS, 3],
        [SpeciesId.KINGDRA, SpeciesId.GYARADOS, 3],
      ],
    },
  ],
  [TrainerType.FALKNER]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.PIDGEOT, SpeciesId.NOCTOWL, 3],
        [SpeciesId.HONCHKROW, SpeciesId.NOCTOWL, 3],
        [SpeciesId.NOCTOWL, SpeciesId.HONCHKROW, 1],
        [SpeciesId.SKARMORY, SpeciesId.PIDGEOT, 1],
      ],
    },
  ],
  [TrainerType.BUGSY]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.PINSIR, SpeciesId.SCIZOR, 3],
        [SpeciesId.HERACROSS, SpeciesId.SCIZOR, 3],
        [SpeciesId.BEEDRILL, SpeciesId.SCIZOR, 1],
        [SpeciesId.YANMEGA, SpeciesId.SCIZOR, 1],
      ],
    },
    {
      slotIndex: -2,
      pool: [
        [SpeciesId.SCIZOR, SpeciesId.PINSIR, 3],
        [SpeciesId.SCIZOR, SpeciesId.FORRETRESS, 3],
      ],
    },
  ],
  [TrainerType.WHITNEY]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.MILTANK, SpeciesId.TAUROS, 3],
        [SpeciesId.TAUROS, SpeciesId.MILTANK, 3],
        [SpeciesId.KANGASKHAN, SpeciesId.MILTANK, 1],
        [SpeciesId.AMBIPOM, SpeciesId.MILTANK, 1],
        [SpeciesId.BIBAREL, SpeciesId.MILTANK, 1],
      ],
    },
  ],
  [TrainerType.MORTY]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.DUSCLOPS, SpeciesId.CHANDELURE, 3],
        [SpeciesId.CHANDELURE, SpeciesId.DRIFBLIM, 3],
        [SpeciesId.DRIFBLIM, SpeciesId.COFAGRIGUS, 1],
      ],
    },
  ],
  [TrainerType.CHUCK]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.HITMONLEE, SpeciesId.POLIWRATH, 3],
        [SpeciesId.POLIWRATH, SpeciesId.KANGASKHAN, 1],
      ],
    },
  ],
  [TrainerType.JASMINE]: [
    {
      slotIndex: -1,
      pool: [[SpeciesId.EMPOLEON, SpeciesId.AGGRON, 3]],
    },
  ],
  [TrainerType.PRYCE]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.GLALIE, SpeciesId.AURORUS, 3],
        [SpeciesId.FROSLASS, SpeciesId.AURORUS, 3],
      ],
    },
  ],
  [TrainerType.BLUE]: [
    {
      slotIndex: -1,
      pool: [
        [SpeciesId.HERACROSS, SpeciesId.CHARIZARD, 3],
        [SpeciesId.PIDGEOT, SpeciesId.CHARIZARD, 3],
        [SpeciesId.ALAKAZAM, SpeciesId.CHARIZARD, 1],
      ],
    },
    {
      slotIndex: -2,
      pool: [[SpeciesId.CHARIZARD, SpeciesId.ALAKAZAM, 3]],
    },
    {
      slotIndex: -3,
      pool: [
        [SpeciesId.TYRANITAR, SpeciesId.HERACROSS, 3],
        [SpeciesId.RHYPERIOR, SpeciesId.HERACROSS, 1],
      ],
    },
  ],
};
