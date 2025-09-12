import { TrainerTypeDialogue } from "#data/dialogue";
import { TrainerType } from "#enums/trainer-type";

export const gymLeaderDialogue : TrainerTypeDialogue = { 
  // Kanto Gym Leaders
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
  // Johto Gym Leaders
    [TrainerType.FALKNER]: {
      encounter: ["dialogue:falkner.encounter.1", "dialogue:falkner.encounter.2", "dialogue:falkner.encounter.3"],
      victory: ["dialogue:falkner.victory.1", "dialogue:falkner.victory.2", "dialogue:falkner.victory.3"],
      defeat: ["dialogue:falkner.defeat.1", "dialogue:falkner.defeat.2", "dialogue:falkner.defeat.3"],
    },
  [TrainerType.BUGSY]: {
    encounter: ["dialogue:bugsy.encounter.1"],
    victory: ["dialogue:bugsy.victory.1"],
    defeat: ["dialogue:bugsy.defeat.1"],
  },
  [TrainerType.WHITNEY]: {
    encounter: ["dialogue:whitney.encounter.1"],
    victory: ["dialogue:whitney.victory.1"],
    defeat: ["dialogue:whitney.defeat.1"],
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
  [TrainerType.CHUCK]: {
    encounter: ["dialogue:chuck.encounter.1"],
    victory: ["dialogue:chuck.victory.1"],
    defeat: ["dialogue:chuck.defeat.1"],
  },
  [TrainerType.JASMINE]: {
    encounter: ["dialogue:jasmine.encounter.1"],
    victory: ["dialogue:jasmine.victory.1"],
    defeat: ["dialogue:jasmine.defeat.1"],
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
  // Hoenn Gym Leaders
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
  // Sinnoh Gym Leaders
    
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
  [TrainerType.GARDENIA]: {
    encounter: ["dialogue:gardenia.encounter.1"],
    victory: ["dialogue:gardenia.victory.1"],
    defeat: ["dialogue:gardenia.defeat.1"],
  },
  [TrainerType.MAYLENE]: {
    encounter: ["dialogue:maylene.encounter.1"],
    victory: ["dialogue:maylene.victory.1"],
    defeat: ["dialogue:maylene.defeat.1"],
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
  [TrainerType.CANDICE]: {
    encounter: ["dialogue:candice.encounter.1", "dialogue:candice.encounter.2"],
    victory: ["dialogue:candice.victory.1", "dialogue:candice.victory.2"],
    defeat: ["dialogue:candice.defeat.1", "dialogue:candice.defeat.2"],
  },
  [TrainerType.VOLKNER]: {
    encounter: ["dialogue:volkner.encounter.1"],
    victory: ["dialogue:volkner.victory.1"],
    defeat: ["dialogue:volkner.defeat.1"],
  },
  // Unova Gym Leaders
  [TrainerType.CILAN]: {
    encounter: ["dialogue:cilan.encounter.1", "dialogue:cilan.encounter.2", "dialogue:cilan.encounter.3"],
    victory: ["dialogue:cilan.victory.1", "dialogue:cilan.victory.2", "dialogue:cilan.victory.3"],
    defeat: ["dialogue:cilan.defeat.1", "dialogue:cilan.defeat.2", "dialogue:cilan.defeat.3"],
  },
  [TrainerType.CHILI]: {
    encounter: ["dialogue:chili.encounter.1", "dialogue:chili.encounter.2", "dialogue:chili.encounter.3"],
    victory: ["dialogue:chili.victory.1", "dialogue:chili.victory.2", "dialogue:chili.victory.3"],
    defeat: ["dialogue:chili.defeat.1", "dialogue:chili.defeat.2", "dialogue:chili.defeat.3"],
  },
  [TrainerType.CRESS]: {
    encounter: ["dialogue:cress.encounter.1"],
    victory: ["dialogue:cress.victory.1"],
    defeat: ["dialogue:cress.defeat.1"],
  },
  [TrainerType.CHEREN]: {
    encounter: ["dialogue:cheren.encounter.1", "dialogue:cheren.encounter.2", "dialogue:cheren.encounter.3"],
    victory: ["dialogue:cheren.victory.1", "dialogue:cheren.victory.2", "dialogue:cheren.victory.3"],
    defeat: ["dialogue:cheren.defeat.1", "dialogue:cheren.defeat.2", "dialogue:cheren.defeat.3"],
  },
  [TrainerType.LENORA]: {
    encounter: ["dialogue:lenora.encounter.1"],
    victory: ["dialogue:lenora.victory.1"],
    defeat: ["dialogue:lenora.defeat.1"],
  },
  [TrainerType.ROXIE]: {
    encounter: ["dialogue:roxie.encounter.1"],
    victory: ["dialogue:roxie.victory.1"],
    defeat: ["dialogue:roxie.defeat.1"],
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
  [TrainerType.CLAY]: {
    encounter: ["dialogue:clay.encounter.1"],
    victory: ["dialogue:clay.victory.1"],
    defeat: ["dialogue:clay.defeat.1"],
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
  [TrainerType.MARLON]: {
    encounter: ["dialogue:marlon.encounter.1", "dialogue:marlon.encounter.2", "dialogue:marlon.encounter.3"],
    victory: ["dialogue:marlon.victory.1", "dialogue:marlon.victory.2", "dialogue:marlon.victory.3"],
    defeat: ["dialogue:marlon.defeat.1", "dialogue:marlon.defeat.2", "dialogue:marlon.defeat.3"],
  },
  // Kalos Gym Leaders
  [TrainerType.VIOLA]: {
    encounter: ["dialogue:viola.encounter.1", "dialogue:viola.encounter.2"],
    victory: ["dialogue:viola.victory.1", "dialogue:viola.victory.2"],
    defeat: ["dialogue:viola.defeat.1", "dialogue:viola.defeat.2"],
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
  [TrainerType.RAMOS]: {
    encounter: ["dialogue:ramos.encounter.1"],
    victory: ["dialogue:ramos.victory.1"],
    defeat: ["dialogue:ramos.defeat.1"],
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
  [TrainerType.OLYMPIA]: {
    encounter: ["dialogue:olympia.encounter.1"],
    victory: ["dialogue:olympia.victory.1"],
    defeat: ["dialogue:olympia.defeat.1"],
  },
  [TrainerType.WULFRIC]: {
    encounter: ["dialogue:wulfric.encounter.1"],
    victory: ["dialogue:wulfric.victory.1"],
    defeat: ["dialogue:wulfric.defeat.1"],
  },
  // Galar Gym Leaders
  [TrainerType.MILO]: {
    encounter: ["dialogue:milo.encounter.1"],
    victory: ["dialogue:milo.victory.1"],
    defeat: ["dialogue:milo.defeat.1"],
  },
  [TrainerType.NESSA]: {
    encounter: ["dialogue:nessa.encounter.1", "dialogue:nessa.encounter.2", "dialogue:nessa.encounter.3"],
    victory: ["dialogue:nessa.victory.1", "dialogue:nessa.victory.2", "dialogue:nessa.victory.3"],
    defeat: ["dialogue:nessa.defeat.1", "dialogue:nessa.defeat.2", "dialogue:nessa.defeat.3"],
  },
  [TrainerType.KABU]: {
    encounter: ["dialogue:kabu.encounter.1"],
    victory: ["dialogue:kabu.victory.1"],
    defeat: ["dialogue:kabu.defeat.1"],
  },
  [TrainerType.ALLISTER]: {
    encounter: ["dialogue:allister.encounter.1"],
    victory: ["dialogue:allister.victory.1"],
    defeat: ["dialogue:allister.defeat.1"],
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
  [TrainerType.MELONY]: {
    encounter: ["dialogue:melony.encounter.1", "dialogue:melony.encounter.2", "dialogue:melony.encounter.3"],
    victory: ["dialogue:melony.victory.1", "dialogue:melony.victory.2", "dialogue:melony.victory.3"],
    defeat: ["dialogue:melony.defeat.1", "dialogue:melony.defeat.2", "dialogue:melony.defeat.3"],
  },
  [TrainerType.PIERS]: {
    encounter: ["dialogue:piers.encounter.1"],
    victory: ["dialogue:piers.victory.1"],
    defeat: ["dialogue:piers.defeat.1"],
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
  // Paldea Gym Leaders
  [TrainerType.KATY]: {
    encounter: ["dialogue:katy.encounter.1"],
    victory: ["dialogue:katy.victory.1"],
    defeat: ["dialogue:katy.defeat.1"],
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
  [TrainerType.KOFU]: {
    encounter: ["dialogue:kofu.encounter.1"],
    victory: ["dialogue:kofu.victory.1"],
    defeat: ["dialogue:kofu.defeat.1"],
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
  [TrainerType.TULIP]: {
    encounter: ["dialogue:tulip.encounter.1"],
    victory: ["dialogue:tulip.victory.1"],
    defeat: ["dialogue:tulip.defeat.1"],
  },
  [TrainerType.GRUSHA]: {
    encounter: ["dialogue:grusha.encounter.1"],
    victory: ["dialogue:grusha.victory.1"],
    defeat: ["dialogue:grusha.defeat.1"],
  },
}