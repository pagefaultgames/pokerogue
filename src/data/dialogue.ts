import { trainerConfigs } from "./trainer-config";
import { TrainerType } from "./enums/trainer-type";
import { BattleSpec } from "../enums/battle-spec";
import i18next from "i18next";
import {getIsInitialized, initI18n} from "#app/plugins/i18n";

export interface TrainerTypeMessages {
  encounter?: string | string[],
  victory?: string | string[],
  defeat?: string | string[]
}

export interface TrainerTypeDialogue {
  [key: integer]: TrainerTypeMessages | [ TrainerTypeMessages, TrainerTypeMessages ]
}

export function getTrainerTypeDialogue(): TrainerTypeDialogue {
  return trainerTypeDialogue
}

export let trainerTypeDialogue = {
  [TrainerType.YOUNGSTER]: [
    {
      encounter: [
        'dialogue:youngster.encounter.1',
        'dialogue:youngster.encounter.2',
        'dialogue:youngster.encounter.3',
        'dialogue:youngster.encounter.4',
        'dialogue:youngster.encounter.5',
        'dialogue:youngster.encounter.6',
        'dialogue:youngster.encounter.7',
        'dialogue:youngster.encounter.8',
        'dialogue:youngster.encounter.9',
        'dialogue:youngster.encounter.10',
        'dialogue:youngster.encounter.11',
        'dialogue:youngster.encounter.12',
        'dialogue:youngster.encounter.13'
      ],
      victory: [
        'dialogue:youngster.victory.1',
        'dialogue:youngster.victory.2',
        'dialogue:youngster.victory.3',
        'dialogue:youngster.victory.4',
        'dialogue:youngster.victory.5',
        'dialogue:youngster.victory.6',
        'dialogue:youngster.victory.7',
        'dialogue:youngster.victory.8',
        'dialogue:youngster.victory.9',
        'dialogue:youngster.victory.10',
        'dialogue:youngster.victory.11',
        'dialogue:youngster.victory.12',
        'dialogue:youngster.victory.13',
      ]
    },
    //LASS
    {
      encounter: [
        'dialogue:lass.encounter.1',
        'dialogue:lass.encounter.2',
        'dialogue:lass.encounter.3',
        'dialogue:lass.encounter.4',
        'dialogue:lass.encounter.5',
        'dialogue:lass.encounter.6',
        'dialogue:lass.encounter.7',
        'dialogue:lass.encounter.8',
        'dialogue:lass.encounter.9'
      ],
      victory: [
        'dialogue:lass.victory.1',
        'dialogue:lass.victory.2',
        'dialogue:lass.victory.3',
        'dialogue:lass.victory.4',
        'dialogue:lass.victory.5',
        'dialogue:lass.victory.6',
        'dialogue:lass.victory.7',
        'dialogue:lass.victory.8',
        'dialogue:lass.victory.9'
      ]
    }
  ],
  [TrainerType.BREEDER]: [
    {
      encounter: [
        'dialogue:breeder.encounter.1',
        'dialogue:breeder.encounter.2',
        'dialogue:breeder.encounter.3',
      ],
      victory: [
        'dialogue:breeder.victory.1',
        'dialogue:breeder.victory.2',
        'dialogue:breeder.victory.3',
      ],
      defeat:[
        'dialogue:breeder.defeat.1',
        'dialogue:breeder.defeat.2',
        'dialogue:breeder.defeat.3',
      ]
    },
    {
      encounter: [
        'dialogue:breeder_female.encounter.1',
        'dialogue:breeder_female.encounter.2',
        'dialogue:breeder_female.encounter.3',
      ],
      victory: [
        'dialogue:breeder_female.victory.1',
        'dialogue:breeder_female.victory.2',
        'dialogue:breeder_female.victory.3',
      ],
      defeat:[
        'dialogue:breeder_female.defeat.1',
        'dialogue:breeder_female.defeat.2',
        'dialogue:breeder_female.defeat.3',
      ]
    }
  ],
  [TrainerType.FISHERMAN]: [
    {
      encounter: [
        `dialogue:fisherman.encounter.1`,
        `dialogue:fisherman.encounter.2`,
        `dialogue:fisherman.encounter.3`,
      ],
      victory: [
        `dialogue:fisherman.victory.1`,
        `dialogue:fisherman.victory.2`,
        `dialogue:fisherman.victory.3`,
      ]
    },
    {
      encounter: [
        `dialogue:fisherman_female.encounter.1`,
        `dialogue:fisherman_female.encounter.2`,
        `dialogue:fisherman_female.encounter.3`,
      ],
      victory: [
        `dialogue:fisherman_female.victory.1`,
        `dialogue:fisherman_female.victory.2`,
        `dialogue:fisherman_female.victory.3`,
      ]
    }
  ],
  [TrainerType.SWIMMER]: [
    {
      encounter: [
        `dialogue:swimmer.encounter.1`,
        `dialogue:swimmer.encounter.2`,
        `dialogue:swimmer.encounter.3`,
      ],
      victory: [
        `dialogue:swimmer.victory.1`,
        `dialogue:swimmer.victory.2`,
        `dialogue:swimmer.victory.3`,
      ]
    }
  ],
  [TrainerType.BACKPACKER]: [
    {
      encounter: [
        `dialogue:backpacker.encounter.1`,
        `dialogue:backpacker.encounter.2`,
        `dialogue:backpacker.encounter.3`,
        `dialogue:backpacker.encounter.4`,
      ],
      victory: [
        `dialogue:backpacker.victory.1`,
        `dialogue:backpacker.victory.2`,
        `dialogue:backpacker.victory.3`,
        `dialogue:backpacker.victory.4`,
      ]
    }
  ],
  [TrainerType.ACE_TRAINER]: [
    {
      encounter: [
        `dialogue:ace_trainer.encounter.1`,
        `dialogue:ace_trainer.encounter.2`,
        `dialogue:ace_trainer.encounter.3`,
        `dialogue:ace_trainer.encounter.4`,
      ],
      victory: [
        `dialogue:ace_trainer.victory.1`,
        `dialogue:ace_trainer.victory.2`,
        `dialogue:ace_trainer.victory.3`,
        `dialogue:ace_trainer.victory.4`,
      ],
      defeat: [
        `dialogue:ace_trainer.defeat.1`,
        `dialogue:ace_trainer.defeat.2`,
        `dialogue:ace_trainer.defeat.3`,
        `dialogue:ace_trainer.defeat.4`,
      ]
    }
  ],
  [TrainerType.PARASOL_LADY]: [
    {
      encounter: [
        `dialogue:parasol_lady.encounter.1`,
      ],
      victory: [
        `dialogue:parasol_lady.victory.1`,
      ]
    }
  ],
  [TrainerType.TWINS]: [
    {
      encounter: [
        `dialogue:twins.encounter.1`,
        `dialogue:twins.encounter.2`,
        `dialogue:twins.encounter.3`,
      ],
      victory: [
        `dialogue:twins.victory.1`,
        `dialogue:twins.victory.2`,
        `dialogue:twins.victory.3`,
      ],
      defeat: [
        `dialogue:twins.defeat.1`,
        `dialogue:twins.defeat.2`,
        `dialogue:twins.defeat.3`,
      ],
    }
  ],
  [TrainerType.CYCLIST]: [
    {
      encounter: [
        `dialogue:cyclist.encounter.1`,
        `dialogue:cyclist.encounter.2`,
        `dialogue:cyclist.encounter.3`,
      ],
      victory: [
        `dialogue:cyclist.victory.1`,
        `dialogue:cyclist.victory.2`,
        `dialogue:cyclist.victory.3`,
      ]
    }
  ],
  [TrainerType.BLACK_BELT]: [
    {
      encounter: [
        `dialogue:black_belt.encounter.1`,
        `dialogue:black_belt.encounter.2`,
      ],
      victory: [
        `dialogue:black_belt.victory.1`,
        `dialogue:black_belt.victory.2`,
      ]
    },
    //BATTLE GIRL
    {
      encounter: [
        `dialogue:battle_girl.encounter.1`,
      ],
      victory: [
        `dialogue.battle_girl.victory.1`,
      ]
    }
  ],
  [TrainerType.HIKER]: [
    {
      encounter: [
        `dialogue:hiker.encounter.1`,
        `dialogue:hiker.encounter.2`,
      ],
      victory: [
        `dialogue:hiker.victory.1`,
        `dialogue:hiker.victory.2`,
      ]
    }
  ],
  [TrainerType.RANGER]: [
    {
      encounter: [
        `dialogue:ranger.encounter.1`,
        `dialogue:ranger.encounter.2`,
      ],
      victory: [
        `dialogue:ranger.victory.1`,
        `dialogue:ranger.victory.2`,
      ],
      defeat: [
        `dialogue:ranger.defeat.1`,
        `dialogue:ranger.defeat.2`,
      ]
    }
  ],
  [TrainerType.SCIENTIST]: [
    {
      encounter: [
        `dialogue:scientist.encounter.1`,
      ],
      victory: [
        `dialogue:scientist.victory.1`,
      ]
    }
  ],
  [TrainerType.SCHOOL_KID]: [
    {
      encounter: [
        `dialogue:school_kid.encounter.1`,
        `dialogue:school_kid.encounter.2`,
      ],
      victory: [
        `dialogue:school_kid.victory.1`,
        `dialogue:school_kid.victory.2`,
      ]
    }
  ],
  [TrainerType.ARTIST]: [
    {
      encounter: [
        `dialogue:artist.encounter.1`,
      ],
      victory: [
        `dialogue:artist.victory.1`,
      ]
    }
  ],
  [TrainerType.GUITARIST]: [
    {
      encounter: [
        `dialogue:guitarist.encounter.1`,
      ],
      victory: [
        `dialogue:guitarist.victory.1`,
      ]
    }
  ],
  [TrainerType.WORKER]: [
    {
      encounter: [
        `dialogue:worker.encounter.1`,
      ],
      victory: [
        `dialogue:worker.victory.1`,
      ]
    },
    {
      encounter: [
        `dialogue:worker_female.encounter.1`,
      ],
      victory: [
        `dialogue:worker_female.victory.1`,
      ],
      defeat: [
        `dialogue:worker_female.defeat.1`,
      ]
    },
    {
      encounter: [
        `dialogue:worker_double.encounter.1`,
      ],
      victory: [
        `dialogue:worker_double.victory.1`,
      ]
    },
  ],
  [TrainerType.HEX_MANIAC]: [
    {
      encounter: [
        `dialogue:hex_maniac.encounter.1`,
        `dialogue:hex_maniac.encounter.2`,
      ],
      victory: [
        `dialogue:hex_maniac.victory.1`,
        `dialogue:hex_maniac.victory.2`,
      ],
      defeat: [
        `dialogue:hex_maniac.defeat.1`,
        `dialogue:hex_maniac.defeat.2`,
      ]
    }
  ],
  [TrainerType.PSYCHIC]: [
    {
      encounter: [
        `dialogue:psychic.encounter.1`,
      ],
      victory: [
        `dialogue:psychic.victory.1`,
      ]
    }
  ],
  [TrainerType.OFFICER]: [
    {
      encounter: [
        `dialogue:officer.encounter.1`,
        `dialogue:officer.encounter.2`,
      ],
      victory: [
        `dialogue:officer.victory.1`,
        `dialogue:officer.victory.2`,
      ],
    }
  ],
  [TrainerType.BEAUTY]: [
    {
      encounter: [
        `dialogue:beauty.encounter.1`,
      ],
      victory: [
        `dialogue:beauty.victory.1`,
      ]
    }
  ],
  [TrainerType.BAKER]: [
    {
      encounter: [
        `dialogue:baker.encounter.1`,
      ],
      victory: [
        `dialogue:baker.victory.1`,
      ]
    }
  ],
  [TrainerType.BIKER]: [
    {
      encounter: [
        `dialogue:biker.encounter.1`,
      ],
      victory: [
        `dialogue:biker.victory.1`,
      ]
    }
  ],
  [TrainerType.BROCK]: {
    encounter: [
        `dialogue:brock.encounter.1`,
        `dialogue:brock.encounter.2`,
        `dialogue:brock.encounter.3`,
    ],
    victory: [
        `dialogue:brock.victory.1`,
        `dialogue:brock.victory.2`,
        `dialogue:brock.victory.3`,
    ],
    defeat: [
        `dialogue:brock.defeat.1`,
        `dialogue:brock.defeat.2`,
        `dialogue:brock.defeat.3`,
    ]
  },
  [TrainerType.MISTY]: {
    encounter: [
        `dialogue:misty.encounter.1`,
        `dialogue:misty.encounter.2`,
        `dialogue:misty.encounter.3`,
    ],
    victory: [
        `dialogue:misty.victory.1`,
        `dialogue:misty.victory.2`,
        `dialogue:misty.victory.3`,
    ],
    defeat: [
        `dialogue:misty.defeat.1`,
        `dialogue:misty.defeat.2`,
        `dialogue:misty.defeat.3`,
    ]
  },
  [TrainerType.LT_SURGE]: {
    encounter: [
        `dialogue:lt_surge.encounter.1`,
        `dialogue:lt_surge.encounter.2`,
        `dialogue:lt_surge.encounter.3`,
    ],
    victory: [
        `dialogue:lt_surge.victory.1`,
        `dialogue:lt_surge.victory.2`,
        `dialogue:lt_surge.victory.3`,
    ],
    defeat: [
        `dialogue:lt_surge.defeat.1`,
        `dialogue:lt_surge.defeat.2`,
        `dialogue:lt_surge.defeat.3`,
    ]
  },
  [TrainerType.ERIKA]: {
    encounter: [
        `dialogue:erika.encounter.1`,
        `dialogue:erika.encounter.2`,
        `dialogue:erika.encounter.3`,
        `dialogue:erika.encounter.4`,
    ],
    victory: [
        `dialogue:erika.victory.1`,
        `dialogue:erika.victory.2`,
        `dialogue:erika.victory.3`,
        `dialogue:erika.victory.4`,
    ],
    defeat: [
        `dialogue:erika.defeat.1`,
        `dialogue:erika.defeat.2`,
        `dialogue:erika.defeat.3`,
        `dialogue:erika.defeat.4`,
    ]
  },
  [TrainerType.JANINE]: {
    encounter: [
        `dialogue:janine.encounter.1`,
        `dialogue:janine.encounter.2`,
        `dialogue:janine.encounter.3`,
    ],
    victory: [
        `dialogue:janine.victory.1`,
        `dialogue:janine.victory.2`,
        `dialogue:janine.victory.3`,
    ],
    defeat: [
        `dialogue:janine.defeat.1`,
        `dialogue:janine.defeat.2`,
        `dialogue:janine.defeat.3`,
    ]
  },
  [TrainerType.SABRINA]: {
    encounter: [
      "dialogue:sabrina.encounter.1",
      "dialogue:sabrina.encounter.2",
      "dialogue:sabrina.encounter.3",
    ],
    victory: [
      "dialogue:sabrina.victory.1",
      "dialogue:sabrina.victory.2",
      "dialogue:sabrina.victory.3",
    ],
    defeat: [
      "dialogue:sabrina.defeat.1",
      "dialogue:sabrina.defeat.2",
      "dialogue:sabrina.defeat.3",
    ]
  },
  [TrainerType.BLAINE]: {
    encounter: [
      "dialogue:blaine.encounter.1",
      "dialogue:blaine.encounter.2",
      "dialogue:blaine.encounter.3",
    ],
    victory: [
      "dialogue:blaine.victory.1",
      "dialogue:blaine.victory.2",
      "dialogue:blaine.victory.3",
    ],
    defeat: [
      "dialogue:blaine.defeat.1",
      "dialogue:blaine.defeat.2",
      "dialogue:blaine.defeat.3",
    ]
  },
  [TrainerType.GIOVANNI]: {
    encounter: [
      "dialogue:giovanni.encounter.1",
      "dialogue:giovanni.encounter.2",
      "dialogue:giovanni.encounter.3",
    ],
    victory: [
      "dialogue:giovanni.victory.1",
      "dialogue:giovanni.victory.2",
      "dialogue:giovanni.victory.3",
    ],
    defeat: [
      "dialogue:giovanni.defeat.1",
      "dialogue:giovanni.defeat.2",
      "dialogue:giovanni.defeat.3",
    ]
  },
  [TrainerType.ROXANNE]: {
    encounter: [
      "dialogue:roxanne.encounter.1",
      "dialogue:roxanne.encounter.2",
      "dialogue:roxanne.encounter.3"
    ],
    victory: [
      "dialogue:roxanne.victory.1",
      "dialogue:roxanne.victory.2",
      "dialogue:roxanne.victory.3"
    ],
    defeat: [
      "dialogue:roxanne.defeat.1",
      "dialogue:roxanne.defeat.2",
      "dialogue:roxanne.defeat.3"
    ]
  },
  [TrainerType.BRAWLY]: {
    encounter: [
      "dialogue:brawly.encounter.1",
      "dialogue:brawly.encounter.2",
      "dialogue:brawly.encounter.3"
    ],
    victory: [
      "dialogue:brawly.victory.1",
      "dialogue:brawly.victory.2",
      "dialogue:brawly.victory.3"
    ],
    defeat: [
      "dialogue:brawly.defeat.1",
      "dialogue:brawly.defeat.2",
      "dialogue:brawly.defeat.3"
    ]
  },
  [TrainerType.WATTSON]: {
    encounter: [
      "dialogue:wattson.encounter.1",
      "dialogue:wattson.encounter.2",
      "dialogue:wattson.encounter.3"
    ],
    victory: [
      "dialogue:wattson.victory.1",
      "dialogue:wattson.victory.2",
      "dialogue:wattson.victory.3"
    ],
    defeat: [
      "dialogue:wattson.defeat.1",
      "dialogue:wattson.defeat.2",
      "dialogue:wattson.defeat.3"
    ]
  },
  [TrainerType.FLANNERY]: {
    encounter: [
      "dialogue:flannery.encounter.1",
      "dialogue:flannery.encounter.2",
      "dialogue:flannery.encounter.3"
    ],
    victory: [
      "dialogue:flannery.victory.1",
      "dialogue:flannery.victory.2",
      "dialogue:flannery.victory.3"
    ],
    defeat: [
      "dialogue:flannery.defeat.1",
      "dialogue:flannery.defeat.2",
      "dialogue:flannery.defeat.3"
    ]
  },
  [TrainerType.NORMAN]: {
    encounter: [
      "dialogue:norman.encounter.1",
      "dialogue:norman.encounter.2",
      "dialogue:norman.encounter.3"
    ],
    victory: [
      "dialogue:norman.victory.1",
      "dialogue:norman.victory.2",
      "dialogue:norman.victory.3"
    ],
    defeat: [
      "dialogue:norman.defeat.1",
      "dialogue:norman.defeat.2",
      "dialogue:norman.defeat.3"
    ]
  },
  [TrainerType.WINONA]: {
    encounter: [
      "dialogue:winona.encounter.1",
      "dialogue:winona.encounter.2",
      "dialogue:winona.encounter.3"
    ],
    victory: [
      "dialogue:winona.victory.1",
      "dialogue:winona.victory.2",
      "dialogue:winona.victory.3"
    ],
    defeat: [
      "dialogue:winona.defeat.1",
      "dialogue:winona.defeat.2",
      "dialogue:winona.defeat.3"
    ]
  },
  [TrainerType.TATE]: {
    encounter: [
      "dialogue:tate.encounter.1",
      "dialogue:tate.encounter.2",
      "dialogue:tate.encounter.3"
    ],
    victory: [
      "dialogue:tate.victory.1",
      "dialogue:tate.victory.2",
      "dialogue:tate.victory.3"
    ],
    defeat: [
      "dialogue:tate.defeat.1",
      "dialogue:tate.defeat.2",
      "dialogue:tate.defeat.3"
    ]
  },
  [TrainerType.LIZA]: {
    encounter: [
      "dialogue:liza.encounter.1",
      "dialogue:liza.encounter.2",
      "dialogue:liza.encounter.3"
    ],
    victory: [
      "dialogue:liza.victory.1",
      "dialogue:liza.victory.2",
      "dialogue:liza.victory.3"
    ],
    defeat: [
      "dialogue:liza.defeat.1",
      "dialogue:liza.defeat.2",
      "dialogue:liza.defeat.3"
    ]
  },
  [TrainerType.JUAN]: {
    encounter: [
      "dialogue:juan.encounter.1",
      "dialogue:juan.encounter.2",
      "dialogue:juan.encounter.3",
      "dialogue:juan.encounter.4"
    ],
    victory: [
      "dialogue:juan.victory.1",
      "dialogue:juan.victory.2",
      "dialogue:juan.victory.3",
      "dialogue:juan.victory.4"
    ],
    defeat: [
      "dialogue:juan.defeat.1",
      "dialogue:juan.defeat.2",
      "dialogue:juan.defeat.3",
      "dialogue:juan.defeat.4"
    ]
  },
  [TrainerType.CRASHER_WAKE]: {
    encounter: [
      "dialogue:crasher_wake.encounter.1",
      "dialogue:crasher_wake.encounter.2",
      "dialogue:crasher_wake.encounter.3"
    ],
    victory: [
      "dialogue:crasher_wake.victory.1",
      "dialogue:crasher_wake.victory.2",
      "dialogue:crasher_wake.victory.3"
    ],
    defeat: [
      "dialogue:crasher_wake.defeat.1",
      "dialogue:crasher_wake.defeat.2",
      "dialogue:crasher_wake.defeat.3"
    ]
  },
  [TrainerType.FALKNER]: {
    encounter: [
      "dialogue:falkner.encounter.1",
      "dialogue:falkner.encounter.2",
      "dialogue:falkner.encounter.3"
    ],
    victory: [
      "dialogue:falkner.victory.1",
      "dialogue:falkner.victory.2",
      "dialogue:falkner.victory.3"
    ],
    defeat: [
      "dialogue:falkner.defeat.1",
      "dialogue:falkner.defeat.2",
      "dialogue:falkner.defeat.3"
    ]
  },
  [TrainerType.NESSA]: {
    encounter: [
      "dialogue:nessa.encounter.1",
      "dialogue:nessa.encounter.2",
      "dialogue:nessa.encounter.3"
    ],
    victory: [
      "dialogue:nessa.victory.1",
      "dialogue:nessa.victory.2",
      "dialogue:nessa.victory.3"
    ],
    defeat: [
      "dialogue:nessa.defeat.1",
      "dialogue:nessa.defeat.2",
      "dialogue:nessa.defeat.3"
    ]
  },
  [TrainerType.MELONY]: {
    encounter: [
      "dialogue:melony.encounter.1",
      "dialogue:melony.encounter.2",
      "dialogue:melony.encounter.3"
    ],
    victory: [
      "dialogue:melony.victory.1",
      "dialogue:melony.victory.2",
      "dialogue:melony.victory.3"
    ],
    defeat: [
      "dialogue:melony.defeat.1",
      "dialogue:melony.defeat.2",
      "dialogue:melony.defeat.3"
    ]
  },
  [TrainerType.MARLON]: {
    encounter: [
      "dialogue:marlon.encounter.1",
      "dialogue:marlon.encounter.2",
      "dialogue:marlon.encounter.3"
    ],
    victory: [
      "dialogue:marlon.victory.1",
      "dialogue:marlon.victory.2",
      "dialogue:marlon.victory.3"
    ],
    defeat: [
      "dialogue:marlon.defeat.1",
      "dialogue:marlon.defeat.2",
      "dialogue:marlon.defeat.3"
    ]
  },
  [TrainerType.SHAUNTAL]: {
    encounter: [
      "dialogue:shauntal.encounter.1",
      "dialogue:shauntal.encounter.2",
      "dialogue:shauntal.encounter.3"
    ],
    victory: [
      "dialogue:shauntal.victory.1",
      "dialogue:shauntal.victory.2",
      "dialogue:shauntal.victory.3"
    ],
    defeat: [
      "dialogue:shauntal.defeat.1",
      "dialogue:shauntal.defeat.2",
      "dialogue:shauntal.defeat.3"
    ]
  },
  [TrainerType.MARSHAL]: {
    encounter: [
      "dialogue:marshal.encounter.1",
      "dialogue:marshal.encounter.2",
      "dialogue:marshal.encounter.3"
    ],
    victory: [
      "dialogue:marshal.victory.1",
      "dialogue:marshal.victory.2",
      "dialogue:marshal.victory.3"
    ],
    defeat: [
      "dialogue:marshal.defeat.1",
      "dialogue:marshal.defeat.2",
      "dialogue:marshal.defeat.3"
    ]
  },
  [TrainerType.CHEREN]: {
    encounter: [
      "dialogue:cheren.encounter.1",
      "dialogue:cheren.encounter.2",
      "dialogue:cheren.encounter.3"
    ],
    victory: [
      "dialogue:cheren.victory.1",
      "dialogue:cheren.victory.2",
      "dialogue:cheren.victory.3"
    ],
    defeat: [
      "dialogue:cheren.defeat.1",
      "dialogue:cheren.defeat.2",
      "dialogue:cheren.defeat.3"
    ]
  },
  [TrainerType.CHILI]: {
    encounter: [
      "dialogue:chili.encounter.1",
      "dialogue:chili.encounter.2",
      "dialogue:chili.encounter.3"
    ],
    victory: [
      "dialogue:chili.victory.1",
      "dialogue:chili.victory.2",
      "dialogue:chili.victory.3"
    ],
    defeat: [
      "dialogue:chili.defeat.1",
      "dialogue:chili.defeat.2",
      "dialogue:chili.defeat.3"
    ]
  },
  [TrainerType.CILAN]: {
    encounter: [
      "dialogue:cilan.encounter.1",
      "dialogue:cilan.encounter.2",
      "dialogue:cilan.encounter.3"
    ],
    victory: [
      "dialogue:cilan.victory.1",
      "dialogue:cilan.victory.2",
      "dialogue:cilan.victory.3"
    ],
    defeat: [
      "dialogue:cilan.defeat.1",
      "dialogue:cilan.defeat.2",
      "dialogue:cilan.defeat.3"
    ]
  },
  [TrainerType.ROARK]: {
    encounter: [
      "dialogue:roark.encounter.1",
      "dialogue:roark.encounter.2",
      "dialogue:roark.encounter.3",
      "dialogue:roark.encounter.4"
    ],
    victory: [
      "dialogue:roark.victory.1",
      "dialogue:roark.victory.2",
      "dialogue:roark.victory.3",
      "dialogue:roark.victory.4",
      "dialogue:roark.victory.5"
    ],
    defeat: [
      "dialogue:roark.defeat.1",
      "dialogue:roark.defeat.2",
      "dialogue:roark.defeat.3"
    ]
  },
  [TrainerType.MORTY]: {
    encounter: [
      "dialogue:morty.encounter.1",
      "dialogue:morty.encounter.2",
      "dialogue:morty.encounter.3",
      "dialogue:morty.encounter.4",
      "dialogue:morty.encounter.5",
      "dialogue:morty.encounter.6"
    ],
    victory: [
      "dialogue:morty.victory.1",
      "dialogue:morty.victory.2",
      "dialogue:morty.victory.3",
      "dialogue:morty.victory.4",
      "dialogue:morty.victory.5",
      "dialogue:morty.victory.6"
    ],
    defeat: [
      "dialogue:morty.defeat.1",
      "dialogue:morty.defeat.2",
      "dialogue:morty.defeat.3",
      "dialogue:morty.defeat.4",
      "dialogue:morty.defeat.5",
      "dialogue:morty.defeat.6"
    ]
  },
  [TrainerType.CRISPIN]: {
    encounter: [
      "dialogue:crispin.encounter.1",
      "dialogue:crispin.encounter.2"
    ],
    victory: [
      "dialogue:crispin.victory.1",
      "dialogue:crispin.victory.2"
    ],
    defeat: [
      "dialogue:crispin.defeat.1",
      "dialogue:crispin.defeat.2"
    ]
  },
  [TrainerType.AMARYS]: {
    encounter: [
      "dialogue:amarys.encounter.1"
    ],
    victory: [
      "dialogue:amarys.victory.1"
    ],
    defeat: [
      "dialogue:amarys.defeat.1"
    ]
  },
  [TrainerType.LACEY]: {
    encounter: [
      "dialogue:lacey.encounter.1"
    ],
    victory: [
      "dialogue:lacey.victory.1"
    ],
    defeat: [
      "dialogue:lacey.defeat.1"
    ]
  },
  [TrainerType.DRAYTON]: {
    encounter: [
      "dialogue:drayton.encounter.1"
    ],
    victory: [
      "dialogue:drayton.victory.1"
    ],
    defeat: [
      "dialogue:drayton.defeat.1"
    ]
  },
  [TrainerType.RAMOS]: {
    encounter: [
      "dialogue:ramos.encounter.1"
    ],
    victory: [
      "dialogue:ramos.victory.1"
    ],
    defeat: [
      "dialogue:ramos.defeat.1"
    ]
  },
  [TrainerType.VIOLA]: {
    encounter: [
      "dialogue:viola.encounter.1",
      "dialogue:viola.encounter.2"
    ],
    victory: [
      "dialogue:viola.victory.1",
      "dialogue:viola.victory.2"
    ],
    defeat: [
      "dialogue:viola.defeat.1",
      "dialogue:viola.defeat.2"
    ]
  },
  [TrainerType.CANDICE]: {
    encounter: [
      "dialogue:candice.encounter.1",
      "dialogue:candice.encounter.2"
    ],
    victory: [
      "dialogue:candice.victory.1",
      "dialogue:candice.victory.2"
    ],
    defeat: [
      "dialogue:candice.defeat.1",
      "dialogue:candice.defeat.2"
    ]
  },
  [TrainerType.GARDENIA]: {
    encounter: [
      "dialogue:gardenia.encounter.1"
    ],
    victory: [
      "dialogue:gardenia.victory.1"
    ],
    defeat: [
      "dialogue:gardenia.defeat.1"
    ]
  },
  [TrainerType.AARON]: {
    encounter: [
      "dialogue:aaron.encounter.1"
    ],
    victory: [
      "dialogue:aaron.victory.1"
    ],
    defeat: [
      "dialogue:aaron.defeat.1"
    ]
  },
  [TrainerType.CRESS]: {
    encounter: [
      "dialogue:cress.encounter.1"
    ],
    victory: [
      "dialogue:cress.victory.1"
    ],
    defeat: [
      "dialogue:cress.defeat.1"
    ]
  },
  [TrainerType.ALLISTER]: {
    encounter: [
      "dialogue:allister.encounter.1"
    ],
    victory: [
      "dialogue:allister.victory.1"
    ],
    defeat: [
      "dialogue:allister.defeat.1"
    ]
  },
  [TrainerType.CLAY]: {
    encounter: [
      "dialogue:clay.encounter.1"
    ],
    victory: [
      "dialogue:clay.victory.1"
    ],
    defeat: [
      "dialogue:clay.defeat.1"
    ]
  },
  [TrainerType.KOFU]: {
    encounter: [
      "dialogue:kofu.encounter.1"
    ],
    victory: [
      "dialogue:kofu.victory.1"
    ],
    defeat: [
      "dialogue:kofu.defeat.1"
    ]
  },
  [TrainerType.TULIP]: {
    encounter: [
      "dialogue:tulip.encounter.1"
    ],
    victory: [
      "dialogue:tulip.victory.1"
    ],
    defeat: [
      "dialogue:tulip.defeat.1"
    ]
  },
  [TrainerType.SIDNEY]: {
    encounter: [
      "dialogue:sidney.encounter.1"
    ],
    victory: [
      "dialogue:sidney.victory.1"
    ],
    defeat: [
      "dialogue:sidney.defeat.1"
    ]
  },
  [TrainerType.PHOEBE]: {
    encounter: [
      "dialogue:phoebe.encounter.1"
    ],
    victory: [
      "dialogue:phoebe.victory.1"
    ],
    defeat: [
      "dialogue:phoebe.defeat.1"
    ]
  },
  [TrainerType.GLACIA]: {
    encounter: [
      "dialogue:glacia.encounter.1"
    ],
    victory: [
      "dialogue:glacia.victory.1"
    ],
    defeat: [
      "dialogue:glacia.defeat.1"
    ]
  },
  [TrainerType.DRAKE]: {
    encounter: [
      "dialogue:drake.encounter.1"
    ],
    victory: [
      "dialogue:drake.victory.1"
    ],
    defeat: [
      "dialogue:drake.defeat.1"
    ]
  },
  [TrainerType.WALLACE]: {
    encounter: [
      "dialogue:wallace.encounter.1"
    ],
    victory: [
      "dialogue:wallace.victory.1"
    ],
    defeat: [
      "dialogue:wallace.defeat.1"
    ]
  },
  [TrainerType.LORELEI]: {
    encounter: [
      "dialogue:lorelei.encounter.1"
    ],
    victory: [
      "dialogue:lorelei.victory.1"
    ],
    defeat: [
      "dialogue:lorelei.defeat.1"
    ]
  },
  [TrainerType.WILL]: {
    encounter: [
      "dialogue:will.encounter.1"
    ],
    victory: [
      "dialogue:will.victory.1"
    ],
    defeat: [
      "dialogue:will.defeat.1"
    ]
  },
  [TrainerType.MALVA]: {
    encounter: [
      "dialogue:malva.encounter.1"
    ],
    victory: [
      "dialogue:malva.victory.1"
    ],
    defeat: [
      "dialogue:malva.defeat.1"
    ]
  },
  [TrainerType.HALA]: {
    encounter: [
      "dialogue:hala.encounter.1"
    ],
    victory: [
      "dialogue:hala.victory.1"
    ],
    defeat: [
      "dialogue:hala.defeat.1"
    ]
  },
  [TrainerType.MOLAYNE]: {
    encounter: [
      "dialogue:molayne.encounter.1"
    ],
    victory: [
      "dialogue:molayne.victory.1"
    ],
    defeat: [
      "dialogue:molayne.defeat.1"
    ]
  },
  [TrainerType.RIKA]: {
    encounter: [
      "dialogue:rika.encounter.1"
    ],
    victory: [
      "dialogue:rika.victory.1"
    ],
    defeat: [
      "dialogue:rika.defeat.1"
    ]
  },
  [TrainerType.BRUNO]: {
    encounter: [
      "dialogue:bruno.encounter.1"
    ],
    victory: [
      "dialogue:bruno.victory.1"
    ],
    defeat: [
      "dialogue:bruno.defeat.1"
    ]
  },
  [TrainerType.BUGSY]: {
    encounter: [
      "dialogue:bugsy.encounter.1"
    ],
    victory: [
      "dialogue:bugsy.victory.1"
    ],
    defeat: [
      "dialogue:bugsy.defeat.1"
    ]
  },
  [TrainerType.KOGA]: {
    encounter: [
      "dialogue:koga.encounter.1"
    ],
    victory: [
      "dialogue:koga.victory.1"
    ],
    defeat: [
      "dialogue:koga.defeat.1"
    ]
  },
  [TrainerType.BERTHA]: {
    encounter: [
      "dialogue:bertha.encounter.1"
    ],
    victory: [
      "dialogue:bertha.victory.1"
    ],
    defeat: [
      "dialogue:bertha.defeat.1"
    ]
  },
  [TrainerType.LENORA]: {
    encounter: [
      "dialogue:lenora.encounter.1"
    ],
    victory: [
      "dialogue:lenora.victory.1"
    ],
    defeat: [
      "dialogue:lenora.defeat.1"
    ]
  },
  [TrainerType.SIEBOLD]: {
    encounter: [
      "dialogue:siebold.encounter.1"
    ],
    victory: [
      "dialogue:siebold.victory.1"
    ],
    defeat: [
      "dialogue:siebold.defeat.1"
    ]
  },
  [TrainerType.ROXIE]: {
    encounter: [
      "dialogue:roxie.encounter.1"
    ],
    victory: [
      "dialogue:roxie.victory.1"
    ],
    defeat: [
      "dialogue:roxie.defeat.1"
    ]
  },
  [TrainerType.OLIVIA]: {
    encounter: [
      "dialogue:olivia.encounter.1"
    ],
    victory: [
      "dialogue:olivia.victory.1"
    ],
    defeat: [
      "dialogue:olivia.defeat.1"
    ]
  },
  [TrainerType.POPPY]: {
    encounter: [
      "dialogue:poppy.encounter.1"
    ],
    victory: [
      "dialogue:poppy.victory.1"
    ],
    defeat: [
      "dialogue:poppy.defeat.1"
    ]
  },
  [TrainerType.AGATHA]: {
    encounter: [
      "dialogue:agatha.encounter.1"
    ],
    victory: [
      "dialogue:agatha.victory.1"
    ],
    defeat: [
      "dialogue:agatha.defeat.1"
    ]
  },
  [TrainerType.FLINT]: {
    encounter: [
      "dialogue:flint.encounter.1"
    ],
    victory: [
      "dialogue:flint.victory.1"
    ],
    defeat: [
      "dialogue:flint.defeat.1"
    ]
  },
  [TrainerType.GRIMSLEY]: {
    encounter: [
      "dialogue:grimsley.encounter.1"
    ],
    victory: [
      "dialogue:grimsley.victory.1"
    ],
    defeat: [
      "dialogue:grimsley.defeat.1"
    ]
  },
  [TrainerType.CAITLIN]: {
    encounter: [
      "dialogue:caitlin.encounter.1"
    ],
    victory: [
      "dialogue:caitlin.victory.1"
    ],
    defeat: [
      "dialogue:caitlin.defeat.1"
    ]
  },
  [TrainerType.DIANTHA]: {
    encounter: [
      "dialogue:diantha.encounter.1"
    ],
    victory: [
      "dialogue:diantha.victory.1"
    ],
    defeat: [
      "dialogue:diantha.defeat.1"
    ]
  },
  [TrainerType.WIKSTROM]: {
    encounter: [
      "dialogue:wikstrom.encounter.1"
    ],
    victory: [
      "dialogue:wikstrom.victory.1"
    ],
    defeat: [
      "dialogue:wikstrom.defeat.1"
    ]
  },
  [TrainerType.ACEROLA]: {
    encounter: [
      "dialogue:acerola.encounter.1"
    ],
    victory: [
      "dialogue:acerola.victory.1"
    ],
    defeat: [
      "dialogue:acerola.defeat.1"
    ]
  },
  [TrainerType.LARRY_ELITE]: {
    encounter: [
      "dialogue:larry_elite.encounter.1"
    ],
    victory: [
      "dialogue:larry_elite.victory.1"
    ],
    defeat: [
      "dialogue:larry_elite.defeat.1"
    ]
  },
  [TrainerType.LANCE]: {
    encounter: [
      "dialogue:lance.encounter.1",
      "dialogue:lance.encounter.2"
    ],
    victory: [
      "dialogue:lance.victory.1",
      "dialogue:lance.victory.2"
    ],
    defeat: [
      "dialogue:lance.defeat.1",
      "dialogue:lance.defeat.2"
    ]
  },
  [TrainerType.KAREN]: {
    encounter: [
      "dialogue:karen.encounter.1",
      "dialogue:karen.encounter.2",
      "dialogue:karen.encounter.3"
    ],
    victory: [
      "dialogue:karen.victory.1",
      "dialogue:karen.victory.2",
      "dialogue:karen.victory.3"
    ],
    defeat: [
      "dialogue:karen.defeat.1",
      "dialogue:karen.defeat.2",
      "dialogue:karen.defeat.3"
    ]
  },
  [TrainerType.MILO]: {
    encounter: [
      "dialogue:milo.encounter.1"
    ],
    victory: [
      "dialogue:milo.victory.1"
    ],
    defeat: [
      "dialogue:milo.defeat.1"
    ]
  },
  [TrainerType.LUCIAN]: {
    encounter: [
      "dialogue:lucian.encounter.1"
    ],
    victory: [
      "dialogue:lucian.victory.1"
    ],
    defeat: [
      "dialogue:lucian.defeat.1"
    ]
  },
  [TrainerType.DRASNA]: {
    encounter: [
      "dialogue:drasna.encounter.1"
    ],
    victory: [
      "dialogue:drasna.victory.1"
    ],
    defeat: [
      "dialogue:drasna.defeat.1"
    ]
  },
  [TrainerType.KAHILI]: {
    encounter: [
      "dialogue:kahili.encounter.1"
    ],
    victory: [
      "dialogue:kahili.victory.1"
    ],
    defeat: [
      "dialogue:kahili.defeat.1"
    ]
  },
  [TrainerType.HASSEL]: {
    encounter: [
      "dialogue:hassel.encounter.1"
    ],
    victory: [
      "dialogue:hassel.victory.1"
    ],
    defeat: [
      "dialogue:hassel.defeat.1"
    ]
  },
  [TrainerType.BLUE]: {
    encounter: [
      "dialogue:blue.encounter.1"
    ],
    victory: [
      "dialogue:blue.victory.1"
    ],
    defeat: [
      "dialogue:blue.defeat.1"
    ]
  },
  [TrainerType.PIERS]: {
    encounter: [
      "dialogue:piers.encounter.1"
    ],
    victory: [
      "dialogue:piers.victory.1"
    ],
    defeat: [
      "dialogue:piers.defeat.1"
    ]
  },
  [TrainerType.RED]: {
    encounter: [
      "dialogue:red.encounter.1"
    ],
    victory: [
      "dialogue:red.victory.1"
    ],
    defeat: [
      "dialogue:red.defeat.1"
    ]
  },
  [TrainerType.JASMINE]: {
    encounter: [
      "dialogue:jasmine.encounter.1"
    ],
    victory: [
      "dialogue:jasmine.victory.1"
    ],
    defeat: [
      "dialogue:jasmine.defeat.1"
    ]
  },
  [TrainerType.LANCE_CHAMPION]: {
    encounter: [
      "dialogue:lance_champion.encounter.1"
    ],
    victory: [
      "dialogue:lance_champion.victory.1"
    ],
    defeat: [
      "dialogue:lance_champion.defeat.1"
    ]
  },
  [TrainerType.STEVEN]: {
    encounter: [
      "dialogue:steven.encounter.1"
    ],
    victory: [
      "dialogue:steven.victory.1"
    ],
    defeat: [
      "dialogue:steven.defeat.1"
    ]
  },
  [TrainerType.CYNTHIA]: {
    encounter: [
      "dialogue:cynthia.encounter.1"
    ],
    victory: [
      "dialogue:cynthia.victory.1"
    ],
    defeat: [
      "dialogue:cynthia.defeat.1"
    ]
  },
  [TrainerType.IRIS]: {
    encounter: [
      "dialogue:iris.encounter.1"
    ],
    victory: [
      "dialogue:iris.victory.1"
    ],
    defeat: [
      "dialogue:iris.defeat.1"
    ]
  },
  [TrainerType.HAU]: {
    encounter: [
      "dialogue:hau.encounter.1"
    ],
    victory: [
      "dialogue:hau.victory.1"
    ],
    defeat: [
      "dialogue:hau.defeat.1"
    ]
  },
  [TrainerType.GEETA]: {
    encounter: [
      "dialogue:geeta.encounter.1"
    ],
    victory: [
      "dialogue:geeta.victory.1"
    ],
    defeat: [
      "dialogue:geeta.defeat.1"
    ]
  },
  [TrainerType.NEMONA]: {
    encounter: [
      "dialogue:nemona.encounter.1"
    ],
    victory: [
      "dialogue:nemona.victory.1"
    ],
    defeat: [
      "dialogue:nemona.defeat.1"
    ]
  },
  [TrainerType.LEON]: {
    encounter: [
      "dialogue:leon.encounter.1"
    ],
    victory: [
      "dialogue:leon.victory.1"
    ],
    defeat: [
      "dialogue:leon.defeat.1"
    ]
  },
  [TrainerType.WHITNEY]: {
    encounter: [
      "dialogue:whitney.encounter.1"
    ],
    victory: [
      "dialogue:whitney.victory.1"
    ],
    defeat: [
      "dialogue:whitney.defeat.1"
    ]
  },
  [TrainerType.CHUCK]: {
    encounter: [
      "dialogue:chuck.encounter.1"
    ],
    victory: [
      "dialogue:chuck.victory.1"
    ],
    defeat: [
      "dialogue:chuck.defeat.1"
    ]
  },
  [TrainerType.KATY]: {
    encounter: [
      "dialogue:katy.encounter.1"
    ],
    victory: [
      "dialogue:katy.victory.1"
    ],
    defeat: [
      "dialogue:katy.defeat.1"
    ]
  },
  [TrainerType.PRYCE]: {
    encounter: [
      "dialogue:pryce.encounter.1"
    ],
    victory: [
      "dialogue:pryce.victory.1"
    ],
    defeat: [
      "dialogue:pryce.defeat.1"
    ]
  },
  [TrainerType.CLAIR]: {
    encounter: [
      "dialogue:clair.encounter.1"
    ],
    victory: [
      "dialogue:clair.victory.1"
    ],
    defeat: [
      "dialogue:clair.defeat.1"
    ]
  },
  [TrainerType.MAYLENE]: {
    encounter: [
      "dialogue:maylene.encounter.1"
    ],
    victory: [
      "dialogue:maylene.victory.1"
    ],
    defeat: [
      "dialogue:maylene.defeat.1"
    ]
  },
  [TrainerType.FANTINA]: {
    encounter: [
      "dialogue:fantina.encounter.1"
    ],
    victory: [
      "dialogue:fantina.victory.1"
    ],
    defeat: [
      "dialogue:fantina.defeat.1"
    ]
  },
  [TrainerType.BYRON]: {
    encounter: [
      "dialogue:byron.encounter.1"
    ],
    victory: [
      "dialogue:byron.victory.1"
    ],
    defeat: [
      "dialogue:byron.defeat.1"
    ]
  },
  [TrainerType.OLYMPIA]: {
    encounter: [
      "dialogue:olympia.encounter.1"
    ],
    victory: [
      "dialogue:olympia.victory.1"
    ],
    defeat: [
      "dialogue:olympia.defeat.1"
    ]
  },
  [TrainerType.VOLKNER]: {
    encounter: [
      "dialogue:volkner.encounter.1"
    ],
    victory: [
      "dialogue:volkner.victory.1"
    ],
    defeat: [
      "dialogue:volkner.defeat.1"
    ]
  },
  [TrainerType.BURGH]: {
    encounter: [
      "dialogue:burgh.encounter.1",
      "dialogue:burgh.encounter.2"
    ],
    victory: [
      "dialogue:burgh.victory.1",
      "dialogue:burgh.victory.2"
    ],
    defeat: [
      "dialogue:burgh.defeat.1",
      "dialogue:burgh.defeat.2"
    ]
  },
  [TrainerType.ELESA]: {
    encounter: [
      "dialogue:elesa.encounter.1"
    ],
    victory: [
      "dialogue:elesa.victory.1"
    ],
    defeat: [
      "dialogue:elesa.defeat.1"
    ]
  },
  [TrainerType.SKYLA]: {
    encounter: [
      "dialogue:skyla.encounter.1"
    ],
    victory: [
      "dialogue:skyla.victory.1"
    ],
    defeat: [
      "dialogue:skyla.defeat.1"
    ]
  },
  [TrainerType.BRYCEN]: {
    encounter: [
      "dialogue:brycen.encounter.1"
    ],
    victory: [
      "dialogue:brycen.victory.1"
    ],
    defeat: [
      "dialogue:brycen.defeat.1"
    ]
  },
  [TrainerType.DRAYDEN]: {
    encounter: [
      "dialogue:drayden.encounter.1"
    ],
    victory: [
      "dialogue:drayden.victory.1"
    ],
    defeat: [
      "dialogue:drayden.defeat.1"
    ]
  },
  [TrainerType.GRANT]: {
    encounter: [
      "dialogue:grant.encounter.1"
    ],
    victory: [
      "dialogue:grant.victory.1"
    ],
    defeat: [
      "dialogue:grant.defeat.1"
    ]
  },
  [TrainerType.KORRINA]: {
    encounter: [
      "dialogue:korrina.encounter.1"
    ],
    victory: [
      "dialogue:korrina.victory.1"
    ],
    defeat: [
      "dialogue:korrina.defeat.1"
    ]
  },
  [TrainerType.CLEMONT]: {
    encounter: [
      "dialogue:clemont.encounter.1"
    ],
    victory: [
      "dialogue:clemont.victory.1"
    ],
    defeat: [
      "dialogue:clemont.defeat.1"
    ]
  },
  [TrainerType.VALERIE]: {
    encounter: [
      "dialogue:valerie.encounter.1"
    ],
    victory: [
      "dialogue:valerie.victory.1"
    ],
    defeat: [
      "dialogue:valerie.defeat.1"
    ]
  },
  [TrainerType.WULFRIC]: {
    encounter: [
      "dialogue:wulfric.encounter.1"
    ],
    victory: [
      "dialogue:wulfric.victory.1"
    ],
    defeat: [
      "dialogue:wulfric.defeat.1"
    ]
  },
  [TrainerType.KABU]: {
    encounter: [
      "dialogue:kabu.encounter.1"
    ],
    victory: [
      "dialogue:kabu.victory.1"
    ],
    defeat: [
      "dialogue:kabu.defeat.1"
    ]
  },
  [TrainerType.BEA]: {
    encounter: [
      "dialogue:bea.encounter.1"
    ],
    victory: [
      "dialogue:bea.victory.1"
    ],
    defeat: [
      "dialogue:bea.defeat.1"
    ]
  },
  [TrainerType.OPAL]: {
    encounter: [
      "dialogue:opal.encounter.1"
    ],
    victory: [
      "dialogue:opal.victory.1"
    ],
    defeat: [
      "dialogue:opal.defeat.1"
    ]
  },
  [TrainerType.BEDE]: {
    encounter: [
      "dialogue:bede.encounter.1"
    ],
    victory: [
      "dialogue:bede.victory.1"
    ],
    defeat: [
      "dialogue:bede.defeat.1"
    ]
  },
  [TrainerType.GORDIE]: {
    encounter: [
      "dialogue:gordie.encounter.1"
    ],
    victory: [
      "dialogue:gordie.victory.1"
    ],
    defeat: [
      "dialogue:gordie.defeat.1"
    ]
  },
  [TrainerType.MARNIE]: {
    encounter: [
      "dialogue:marnie.encounter.1"
    ],
    victory: [
      "dialogue:marnie.victory.1"
    ],
    defeat: [
      "dialogue:marnie.defeat.1"
    ]
  },
  [TrainerType.RAIHAN]: {
    encounter: [
      "dialogue:raihan.encounter.1"
    ],
    victory: [
      "dialogue:raihan.victory.1"
    ],
    defeat: [
      "dialogue:raihan.defeat.1"
    ]
  },
  [TrainerType.BRASSIUS]: {
    encounter: [
      "dialogue:brassius.encounter.1"
    ],
    victory: [
      "dialogue:brassius.victory.1"
    ],
    defeat: [
      "dialogue:brassius.defeat.1"
    ]
  },
  [TrainerType.IONO]: {
    encounter: [
      "dialogue:iono.encounter.1"
    ],
    victory: [
      "dialogue:iono.victory.1"
    ],
    defeat: [
      "dialogue:iono.defeat.1"
    ]
  },
  [TrainerType.LARRY]: {
    encounter: [
      "dialogue:larry.encounter.1"
    ],
    victory: [
      "dialogue:larry.victory.1"
    ],
    defeat: [
      "dialogue:larry.defeat.1"
    ]
  },
  [TrainerType.RYME]: {
    encounter: [
      "dialogue:ryme.encounter.1"
    ],
    victory: [
      "dialogue:ryme.victory.1"
    ],
    defeat: [
      "dialogue:ryme.defeat.1"
    ]
  },
  [TrainerType.GRUSHA]: {
    encounter: [
      "dialogue:grusha.encounter.1"
    ],
    victory: [
      "dialogue:grusha.victory.1"
    ],
    defeat: [
      "dialogue:grusha.defeat.1"
    ]
  },
  [TrainerType.RIVAL]: [
    {
      encounter: [
        `@c{smile}Hey, I was looking for you! I knew you were eager to get going but I expected at least a goodbye…
        $@c{smile_eclosed}So you're really pursuing your dream after all?\n I almost can't believe it.
        $@c{serious_smile_fists}Since we're here, how about a battle?\nAfter all, I want to make sure you're ready.
        $@c{serious_mopen_fists}Don't hold back, I want you to give me everything you've got!`
      ],
      victory: [
        `@c{shock}Wow… You cleaned me out.\nAre you actually a beginner?
        $@c{smile}Maybe it was a bit of luck but…\nWho knows you might just be able to go all the way.
        $By the way, the professor asked me to give you these items. They look pretty cool.
        $@c{serious_smile_fists}Good luck out there!`
      ]
    },
    {
      encounter: [
        `@c{smile_wave}There you are! I've been looking everywhere for you!\n@c{angry_mopen}Did you forget to say goodbye to your best friend?
        $@c{smile_ehalf}You're going after your dream, huh?\nThat day is really today isn't it…
        $@c{smile}Anyway, I'll forgive you for forgetting me, but on one condition. @c{smile_wave_wink}You have to battle me!
        $@c{angry_mopen}Give it your all! Wouldn't want your adventure to be over before it started, right?`
      ],
      victory: [
        `@c{shock}You just started and you're already this strong?!@d{96}\n@c{angry}You totally cheated, didn't you?
        $@c{smile_wave_wink}Just kidding!@d{64} @c{smile_eclosed}I lost fair and square… I have a feeling you're going to do really well out there.
        $@c{smile}By the way, the professor wanted me to give you some items. Hopefully they're helpful!
        $@c{smile_wave}Do your best like always! I believe in you!`
      ]
    }
  ],
  [TrainerType.RIVAL_2]: [
    {
      encounter: [
        `@c{smile}Hey, you're here too?\n@c{smile_eclosed}Still a perfect record, huh…?
        $@c{serious_mopen_fists}I know it kind of looks like I followed you here, but that's mostly not true.
        $@c{serious_smile_fists}Honestly though, I've been itching for a rematch since you beat me back at home.
        $I've been doing a lot of my own training so I'll definitely put up a fight this time.
        $@c{serious_mopen_fists}Don't hold back, just like before!\nLet's go!`
      ],
      victory: [
        `@c{neutral_eclosed}Oh. I guess I was overconfident.
        $@c{smile}That's alright, though. I figured this might happen.\n@c{serious_mopen_fists}It just means I need to try harder for next time!\n
        $@c{smile}Oh, not that you really need the help, but I had an extra one of these lying around and figured you might want it.\n
        $@c{serious_smile_fists}Don't expect another one after this, though!\nI can't keep giving my opponent an advantage after all.
        $@c{smile}Anyway, take care!`
      ]
    },
    {
      encounter: [
        `@c{smile_wave}Oh, fancy meeting you here. Looks like you're still undefeated. @c{angry_mopen}Huh… Not bad!
        $@c{angry_mopen}I know what you're thinking, and no, I wasn't creeping on you. @c{smile_eclosed}I just happened to be in the area.
        $@c{smile_ehalf}I'm happy for you but I just want to let you know that it's OK to lose sometimes.
        $@c{smile}We learn from our mistakes, often more than we would if we kept succeeding.
        $@c{angry_mopen}In any case, I've been training hard for our rematch, so you'd better give it your all!`
      ],
      victory: [
        `@c{neutral}I… wasn't supposed to lose that time…
        $@c{smile}Aw well. That just means I'll have to train even harder for next time!
        $@c{smile_wave}I also got you another one of these!\n@c{smile_wave_wink}No need to thank me~.
        $@c{angry_mopen}This is the last one, though! You won't be getting anymore freebies from me after this!
        $@c{smile_wave}Keep at it!`
      ],
      defeat: [
        `It's OK to lose sometimes…`
      ]
    }
  ],
  [TrainerType.RIVAL_3]: [
    {
      encounter: [
        `@c{smile}Hey, look who it is! It's been a while.\n@c{neutral}You're… still undefeated? Huh.
        $@c{neutral_eclosed}Things have been kind of… strange.\nIt's not the same back home without you.
        $@c{serious}I know it's selfish, but I need to get this off my chest.\n@c{neutral_eclosed}I think you're in over your head here.
        $@c{serious}Never losing once is just unrealistic.\nWe need to lose sometimes in order to grow.
        $@c{neutral_eclosed}You've had a great run but there's still so much ahead, and it only gets harder. @c{neutral}Are you prepared for that?
        $@c{serious_mopen_fists}If so, prove it to me.`
      ],
      victory: [
        `@c{angry_mhalf}This is ridiculous… I've hardly stopped training…\nHow are we still so far apart?`
      ]
    },
    {
      encounter: [
        `@c{smile_wave}Long time no see! Still haven't lost, huh.\n@c{angry}You're starting to get on my nerves. @c{smile_wave_wink}Just kidding!
        $@c{smile_ehalf}But really, don't you miss home by now? Or… me?\nI… I mean, we've really missed you.
        $@c{smile_eclosed}I support you in your dream and everything, but the reality is you're going to lose sooner or later.
        $@c{smile}And when you do, I'll be there for you like always.\n@c{angry_mopen}Now, let me show you how strong I've become!`
      ],
      victory: [
        `@c{shock}After all that… it wasn't enough…?\nYou'll never come back at this rate…`
      ],
      defeat: [
        `You gave it your best, now let's go home.`
      ]
    }
  ],
  [TrainerType.RIVAL_4]: [
    {
      encounter: [
        `@c{neutral}Hey.
        $I won't mince words or pleasantries with you.\n@c{neutral_eclosed}I'm here to win, plain and simple.
        $@c{serious_mhalf_fists}I've learned to maximize my potential by putting all my time into training.
        $@c{smile}You get a lot of extra time when you cut out the unnecessary sleep and social interaction.
        $@c{serious_mopen_fists}None of that matters anymore, not until I win.
        $@c{neutral_eclosed}I've even reached the point where I don't lose anymore.\n@c{smile_eclosed}I suppose your philosophy wasn't so wrong after all.
        $@c{angry_mhalf}Losing is for the weak, and I'm not weak anymore.
        $@c{serious_mopen_fists}Prepare yourself.`
      ],
      victory: [
        `@c{neutral}What…@d{64} What are you?`
      ]
    },
    {
      encounter: [
        `@c{neutral}It's me! You didn't forget about me again… did you?
        $@c{smile}You should be proud of how far you made it. Congrats!\nBut it looks like it's the end of your journey.
        $@c{smile_eclosed}You've awoken something in me I never knew was there.\nIt seems like all I do now is train.
        $@c{smile_ehalf}I hardly even eat or sleep now, I just train my Pokémon all day, getting stronger every time.
        $@c{neutral}In fact, I… hardly recognize myself.
        $And now, I've finally reached peak performance.\nI don't think anyone could beat me now.
        $And you know what? It's all because of you.\n@c{smile_ehalf}I don't know whether to thank you or hate you.
        $@c{angry_mopen}Prepare yourself.`
      ],
      victory: [
        `@c{neutral}What…@d{64} What are you?`
      ],
      defeat: [
        `$@c{smile}You should be proud of how far you made it.`
      ]
    }
  ],
  [TrainerType.RIVAL_5]: [
    {
      encounter: [
        `@c{neutral}…`
      ],
      victory: [
        `@c{neutral}…`
      ]
    },
    {
      encounter: [
        `@c{neutral}…`
      ],
      victory: [
        `@c{neutral}…`
      ]
    },
    {
      defeat: [
        `$@c{smile_ehalf}…`
      ]
    }
  ],
  [TrainerType.RIVAL_6]: [
    {
      encounter: [
        `@c{smile_eclosed}We meet again.
        $@c{neutral}I've had some time to reflect on all this.\nThere's a reason this all seems so strange.
        $@c{neutral_eclosed}Your dream, my drive to beat you…\nIt's all a part of something greater.
        $@c{serious}This isn't about me, or about you… This is about the world, @c{serious_mhalf_fists}and it's my purpose to push you to your limits.
        $@c{neutral_eclosed}Whether I've fulfilled that purpose I can't say, but I've done everything in my power.
        $@c{neutral}This place we ended up in is terrifying… Yet somehow I feel unphased, like I've been here before.
        $@c{serious_mhalf_fists}You feel the same, don't you?
        $@c{serious}…and it's like something here is speaking to me.\nThis is all the world's known for a long time now.
        $Those times we cherished together that seem so recent are nothing but a distant memory.
        $@c{neutral_eclosed}Who can say whether they were ever even real in the first place.
        $@c{serious_mopen_fists}You need to keep pushing, because if you don't, it will never end. You're the only one who can do this.
        $@c{serious_smile_fists}I hardly know what any of this means, I just know that it's true.
        $@c{serious_mopen_fists}If you can't defeat me here and now, you won't stand a chance.`
      ],
      victory: [
        `@c{smile_eclosed}It looks like my work is done here.
        $I want you to promise me one thing.\n@c{smile}After you heal the world, please come home.`
      ]
    },
    {
      encounter: [
        `@c{smile_ehalf}So it's just us again.
        $@c{smile_eclosed}You know, I keep going around and around in my head…
        $@c{smile_ehalf}There's something to all this, why everything seems so strange now…
        $@c{smile}You have your dream, and I have this ambition in me…
        $I just can't help but feel there's a greater purpose to all this, to what we're doing, you and I.
        $@c{smile_eclosed}I think I'm supposed to push you… to your limits.
        $@c{smile_ehalf}I'm not sure if I've been doing a good job at that, but I've tried my best up to now.
        $It's something about this strange and dreadful place… Everything seems so clear…
        $This… is all the world's known for a long time now.
        $@c{smile_eclosed}It's like I can barely remember the memories we cherished together.
        $@c{smile_ehalf}Were they even real? They seem so far away now…
        $@c{angry_mopen}You need to keep pushing, because if you don't, it will never end. You're the only one who can do this.
        $@c{smile_ehalf}I… don't know what all this means… but I feel it's true.
        $@c{neutral}If you can't defeat me here and now, you won't stand a chance.`
      ],
      victory: [
        `@c{smile_ehalf}I… I think I fulfilled my purpose…
        $@c{smile_eclosed}Promise me… After you heal the world… Please… come home safe.
        $@c{smile_ehalf}…Thank you.`
      ]
    }
  ]
};

export const battleSpecDialogue = {
  [BattleSpec.FINAL_BOSS]: {
    encounter: `It appears the time has finally come once again.\nYou know why you have come here, do you not?
               $You were drawn here, because you have been here before.\nCountless times.
               $Though, perhaps it can be counted.\nTo be precise, this is in fact your 5,643,853rd cycle.
               $Each cycle your mind reverts to its former state.\nEven so, somehow, remnants of your former selves remain.
               $Until now you have yet to succeed, but I sense a different presence in you this time.\n
               $You are the only one here, though it is as if there is… another.
               $Will you finally prove a formidable challenge to me?\nThe challenge I have longed for for millennia?
               $We begin.`,
    firstStageWin: `I see. The presence I felt was indeed real.\nIt appears I no longer need to hold back.
                   $Do not disappoint me.`,
    secondStageWin: `…Magnificent.`
  }
};

export const miscDialogue = {
  ending: [
    `@c{smile}Oh? You won?@d{96} @c{smile_eclosed}I guess I should've known.\nBut, you're back now.
    $@c{smile}It's over.@d{64} You ended the loop.
    $@c{serious_smile_fists}You fulfilled your dream too, didn't you?\nYou didn't lose even once.
    $@c{neutral}I'm the only one who'll remember what you did.@d{96}\nI guess that's okay, isn't it?
    $@c{serious_smile_fists}Your legend will always live on in our hearts.
    $@c{smile_eclosed}Anyway, I've had about enough of this place, haven't you? Let's head home.
    $@c{serious_smile_fists}Maybe when we get back, we can have another battle?\nIf you're up to it.`,
    `@c{shock}You're back?@d{32} Does that mean…@d{96} you won?!\n@c{smile_ehalf}I should have known you had it in you.
    $@c{smile_eclosed}Of course… I always had that feeling.\n@c{smile}It's over now, right? You ended the loop.
    $@c{smile_ehalf}You fulfilled your dream too, didn't you?\nYou didn't lose even once.
    $I'll be the only one to remember what you did.\n@c{angry_mopen}I'll try not to forget!
    $@c{smile_wave_wink}Just kidding!@d{64} @c{smile}I'd never forget.@d{32}\nYour legend will live on in our hearts.
    $@c{smile_wave}Anyway,@d{64} it's getting late…@d{96} I think?\nIt's hard to tell in this place.
    $Let's go home. @c{smile_wave_wink}Maybe tomorrow, we can have another battle, for old time's sake?`
  ]
}

export function getCharVariantFromDialogue(message: string): string {
  const variantMatch = /@c\{(.*?)\}/.exec(message);
  if (variantMatch)
    return variantMatch[1];
  return 'neutral';
}

export function initTrainerTypeDialogue(): void {
  const trainerTypes = Object.keys(trainerTypeDialogue).map(t => parseInt(t) as TrainerType);
  for (let trainerType of trainerTypes) {
    const messages = trainerTypeDialogue[trainerType];
      const messageTypes = [ 'encounter', 'victory', 'defeat' ];
      for (let messageType of messageTypes) {
        if (Array.isArray(messages)) {
          if (messages[0][messageType])
            trainerConfigs[trainerType][`${messageType}Messages`] = messages[0][messageType];
          if (messages.length > 1)
            trainerConfigs[trainerType][`female${messageType.slice(0, 1).toUpperCase()}${messageType.slice(1)}Messages`] = messages[1][messageType];
        } else
          trainerConfigs[trainerType][`${messageType}Messages`] = messages[messageType];
      }
  }
}