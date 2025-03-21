import { Species } from "#enums/species";

export type SignatureSpecies = {
  [key in string]: (Species | Species[])[];
};

/*
 * The signature species for each Gym Leader, Elite Four member, and Champion.
 * The key is the trainer type, and the value is an array of Species or Species arrays.
 * This is in a separate const so it can be accessed from other places and not just the trainerConfigs
 */
export const signatureSpecies: SignatureSpecies = {
  // Gym Leaders- Kanto
  BROCK: [Species.GEODUDE, Species.ONIX],
  MISTY: [Species.STARYU, Species.PSYDUCK],
  LT_SURGE: [Species.VOLTORB, Species.PIKACHU, Species.ELECTABUZZ],
  ERIKA: [Species.ODDISH, Species.BELLSPROUT, Species.TANGELA, Species.HOPPIP],
  JANINE: [Species.VENONAT, Species.SPINARAK, Species.ZUBAT],
  SABRINA: [Species.ABRA, Species.MR_MIME, Species.ESPEON],
  BLAINE: [Species.GROWLITHE, Species.PONYTA, Species.MAGMAR],
  GIOVANNI: [Species.SANDILE, Species.MURKROW, Species.NIDORAN_M, Species.NIDORAN_F],
  // Gym Leaders- Johto
  FALKNER: [Species.PIDGEY, Species.HOOTHOOT, Species.DODUO],
  BUGSY: [Species.SCYTHER, Species.HERACROSS, Species.SHUCKLE, Species.PINSIR],
  WHITNEY: [Species.JIGGLYPUFF, Species.MILTANK, Species.AIPOM, Species.GIRAFARIG],
  MORTY: [Species.GASTLY, Species.MISDREAVUS, Species.SABLEYE],
  CHUCK: [Species.POLIWRATH, Species.MANKEY],
  JASMINE: [Species.MAGNEMITE, Species.STEELIX],
  PRYCE: [Species.SEEL, Species.SWINUB],
  CLAIR: [Species.DRATINI, Species.HORSEA, Species.GYARADOS],
  // Gym Leaders- Hoenn
  ROXANNE: [Species.GEODUDE, Species.NOSEPASS],
  BRAWLY: [Species.MACHOP, Species.MAKUHITA],
  WATTSON: [Species.MAGNEMITE, Species.VOLTORB, Species.ELECTRIKE],
  FLANNERY: [Species.SLUGMA, Species.TORKOAL, Species.NUMEL],
  NORMAN: [Species.SLAKOTH, Species.SPINDA, Species.ZIGZAGOON, Species.KECLEON],
  WINONA: [Species.SWABLU, Species.WINGULL, Species.TROPIUS, Species.SKARMORY],
  TATE: [Species.SOLROCK, Species.NATU, Species.CHIMECHO, Species.GALLADE],
  LIZA: [Species.LUNATONE, Species.SPOINK, Species.BALTOY, Species.GARDEVOIR],
  JUAN: [Species.HORSEA, Species.BARBOACH, Species.SPHEAL, Species.RELICANTH],
  // Gym Leaders- Sinnoh
  ROARK: [Species.CRANIDOS, Species.LARVITAR, Species.GEODUDE],
  GARDENIA: [Species.ROSELIA, Species.TANGELA, Species.TURTWIG],
  MAYLENE: [Species.LUCARIO, Species.MEDITITE, Species.CHIMCHAR],
  CRASHER_WAKE: [Species.BUIZEL, Species.WOOPER, Species.PIPLUP, Species.MAGIKARP],
  FANTINA: [Species.MISDREAVUS, Species.DRIFLOON, Species.SPIRITOMB],
  BYRON: [Species.SHIELDON, Species.BRONZOR, Species.AGGRON],
  CANDICE: [Species.SNEASEL, Species.SNOVER, Species.SNORUNT],
  VOLKNER: [Species.SHINX, Species.CHINCHOU, Species.ROTOM],
  // Gym Leaders- Unova
  CILAN: [Species.PANSAGE, Species.FOONGUS, Species.PETILIL],
  CHILI: [Species.PANSEAR, Species.DARUMAKA, Species.NUMEL],
  CRESS: [Species.PANPOUR, Species.TYMPOLE, Species.SLOWPOKE],
  CHEREN: [Species.LILLIPUP, Species.MINCCINO, Species.PIDOVE],
  LENORA: [Species.PATRAT, Species.DEERLING, Species.AUDINO],
  ROXIE: [Species.VENIPEDE, Species.TRUBBISH, Species.SKORUPI],
  BURGH: [Species.SEWADDLE, Species.SHELMET, Species.KARRABLAST],
  ELESA: [Species.EMOLGA, Species.BLITZLE, Species.JOLTIK],
  CLAY: [Species.DRILBUR, Species.SANDILE, Species.GOLETT],
  SKYLA: [Species.DUCKLETT, Species.WOOBAT, Species.RUFFLET],
  BRYCEN: [Species.CRYOGONAL, Species.VANILLITE, Species.CUBCHOO],
  DRAYDEN: [Species.DRUDDIGON, Species.AXEW, Species.DEINO],
  MARLON: [Species.WAILMER, Species.FRILLISH, Species.TIRTOUGA],
  // Gym Leaders- Kalos
  VIOLA: [Species.SURSKIT, Species.SCATTERBUG],
  GRANT: [Species.AMAURA, Species.TYRUNT],
  KORRINA: [Species.HAWLUCHA, Species.LUCARIO, Species.MIENFOO],
  RAMOS: [Species.SKIDDO, Species.HOPPIP, Species.BELLSPROUT],
  CLEMONT: [Species.HELIOPTILE, Species.MAGNEMITE, Species.EMOLGA],
  VALERIE: [Species.SYLVEON, Species.MAWILE, Species.MR_MIME],
  OLYMPIA: [Species.ESPURR, Species.SIGILYPH, Species.SLOWKING],
  WULFRIC: [Species.BERGMITE, Species.SNOVER, Species.CRYOGONAL],
  // Gym Leaders- Galar
  MILO: [Species.GOSSIFLEUR, Species.APPLIN, Species.BOUNSWEET],
  NESSA: [Species.CHEWTLE, Species.ARROKUDA, Species.WIMPOD],
  KABU: [Species.SIZZLIPEDE, Species.VULPIX, Species.TORKOAL],
  BEA: [Species.GALAR_FARFETCHD, Species.MACHOP, Species.CLOBBOPUS],
  ALLISTER: [Species.GALAR_YAMASK, Species.GALAR_CORSOLA, Species.GASTLY],
  OPAL: [Species.MILCERY, Species.TOGETIC, Species.GALAR_WEEZING],
  BEDE: [Species.HATENNA, Species.GALAR_PONYTA, Species.GARDEVOIR],
  GORDIE: [Species.ROLYCOLY, Species.STONJOURNER, Species.BINACLE],
  MELONY: [Species.SNOM, Species.GALAR_DARUMAKA, Species.GALAR_MR_MIME],
  PIERS: [Species.GALAR_ZIGZAGOON, Species.SCRAGGY, Species.INKAY],
  MARNIE: [Species.IMPIDIMP, Species.PURRLOIN, Species.MORPEKO],
  RAIHAN: [Species.DURALUDON, Species.TURTONATOR, Species.GOOMY],
  // Gym Leaders- Paldea; First slot is Tera
  KATY: [Species.TEDDIURSA, Species.NYMBLE, Species.TAROUNTULA], // Tera Bug Teddiursa
  BRASSIUS: [Species.SUDOWOODO, Species.BRAMBLIN, Species.SMOLIV], // Tera Grass Sudowoodo
  IONO: [Species.MISDREAVUS, Species.TADBULB, Species.WATTREL], // Tera Ghost Misdreavus
  KOFU: [Species.CRABRAWLER, Species.VELUZA, Species.WIGLETT, Species.WINGULL], // Tera Water Crabrawler
  LARRY: [Species.STARLY, Species.DUNSPARCE, Species.LECHONK, Species.KOMALA], // Tera Normal Starly
  RYME: [Species.TOXEL, Species.GREAVARD, Species.SHUPPET, Species.MIMIKYU], // Tera Ghost Toxel
  TULIP: [Species.FLABEBE, Species.FLITTLE, Species.RALTS, Species.GIRAFARIG], // Tera Psychic Flabebe
  GRUSHA: [Species.SWABLU, Species.CETODDLE, Species.CUBCHOO, Species.ALOLA_VULPIX], // Tera Ice Swablu

  // Elite Four- Kanto
  LORELEI: [
    Species.JYNX,
    [Species.SLOWBRO, Species.GALAR_SLOWBRO],
    Species.LAPRAS,
    [Species.CLOYSTER, Species.ALOLA_SANDSLASH],
  ],
  BRUNO: [Species.MACHAMP, Species.HITMONCHAN, Species.HITMONLEE, [Species.GOLEM, Species.ALOLA_GOLEM]],
  AGATHA: [Species.GENGAR, [Species.ARBOK, Species.WEEZING], Species.CROBAT, Species.ALOLA_MAROWAK],
  LANCE: [Species.DRAGONITE, Species.GYARADOS, Species.AERODACTYL, Species.ALOLA_EXEGGUTOR],
  // Elite Four- Johto (Bruno included)
  WILL: [Species.XATU, Species.JYNX, [Species.SLOWBRO, Species.SLOWKING], Species.EXEGGUTOR],
  KOGA: [[Species.MUK, Species.WEEZING], [Species.VENOMOTH, Species.ARIADOS], Species.CROBAT, Species.TENTACRUEL],
  KAREN: [Species.UMBREON, Species.HONCHKROW, Species.HOUNDOOM, Species.WEAVILE],
  // Elite Four- Hoenn
  SIDNEY: [
    [Species.SHIFTRY, Species.CACTURNE],
    [Species.SHARPEDO, Species.CRAWDAUNT],
    Species.ABSOL,
    Species.MIGHTYENA,
  ],
  PHOEBE: [Species.SABLEYE, Species.DUSKNOIR, Species.BANETTE, [Species.DRIFBLIM, Species.MISMAGIUS]],
  GLACIA: [Species.GLALIE, Species.WALREIN, Species.FROSLASS, Species.ABOMASNOW],
  DRAKE: [Species.ALTARIA, Species.SALAMENCE, Species.FLYGON, Species.KINGDRA],
  // Elite Four- Sinnoh
  AARON: [[Species.SCIZOR, Species.KLEAVOR], Species.HERACROSS, [Species.VESPIQUEN, Species.YANMEGA], Species.DRAPION],
  BERTHA: [Species.WHISCASH, Species.HIPPOWDON, Species.GLISCOR, Species.RHYPERIOR],
  FLINT: [
    [Species.RAPIDASH, Species.FLAREON],
    Species.MAGMORTAR,
    [Species.STEELIX, Species.LOPUNNY],
    Species.INFERNAPE,
  ], // Tera Fire Steelix or Lopunny
  LUCIAN: [Species.MR_MIME, Species.GALLADE, Species.BRONZONG, [Species.ALAKAZAM, Species.ESPEON]],
  // Elite Four- Unova
  SHAUNTAL: [Species.COFAGRIGUS, Species.CHANDELURE, Species.GOLURK, Species.JELLICENT],
  MARSHAL: [Species.CONKELDURR, Species.MIENSHAO, Species.THROH, Species.SAWK],
  GRIMSLEY: [Species.LIEPARD, Species.KINGAMBIT, Species.SCRAFTY, Species.KROOKODILE],
  CAITLIN: [Species.MUSHARNA, Species.GOTHITELLE, Species.SIGILYPH, Species.REUNICLUS],
  // Elite Four- Kalos
  MALVA: [Species.PYROAR, Species.TORKOAL, Species.CHANDELURE, Species.TALONFLAME],
  SIEBOLD: [Species.CLAWITZER, Species.GYARADOS, Species.BARBARACLE, Species.STARMIE],
  WIKSTROM: [Species.KLEFKI, Species.PROBOPASS, Species.SCIZOR, Species.AEGISLASH],
  DRASNA: [Species.DRAGALGE, Species.DRUDDIGON, Species.ALTARIA, Species.NOIVERN],
  // Elite Four- Alola
  HALA: [Species.HARIYAMA, Species.BEWEAR, Species.CRABOMINABLE, [Species.POLIWRATH, Species.ANNIHILAPE]],
  MOLAYNE: [Species.KLEFKI, Species.MAGNEZONE, Species.METAGROSS, Species.ALOLA_DUGTRIO],
  OLIVIA: [Species.RELICANTH, Species.CARBINK, Species.ALOLA_GOLEM, Species.LYCANROC],
  ACEROLA: [[Species.BANETTE, Species.DRIFBLIM], Species.MIMIKYU, Species.DHELMISE, Species.PALOSSAND],
  KAHILI: [[Species.BRAVIARY, Species.MANDIBUZZ], Species.HAWLUCHA, Species.ORICORIO, Species.TOUCANNON],
  // Elite Four- Galar
  MARNIE_ELITE: [Species.MORPEKO, Species.LIEPARD, [Species.TOXICROAK, Species.SCRAFTY], Species.GRIMMSNARL],
  NESSA_ELITE: [Species.GOLISOPOD, [Species.QUAGSIRE, Species.PELIPPER], Species.TOXAPEX, Species.DREDNAW],
  BEA_ELITE: [Species.HAWLUCHA, [Species.GRAPPLOCT, Species.SIRFETCHD], Species.FALINKS, Species.MACHAMP],
  ALLISTER_ELITE: [Species.DUSKNOIR, [Species.POLTEAGEIST, Species.RUNERIGUS], Species.CURSOLA, Species.GENGAR],
  RAIHAN_ELITE: [Species.GOODRA, [Species.TORKOAL, Species.TURTONATOR], Species.FLYGON, Species.ARCHALUDON],
  // Elite Four- Paldea
  RIKA: [Species.CLODSIRE, [Species.DUGTRIO, Species.DONPHAN], Species.CAMERUPT, Species.WHISCASH], // Tera Ground Clodsire
  POPPY: [Species.TINKATON, Species.BRONZONG, Species.CORVIKNIGHT, Species.COPPERAJAH], // Tera Steel Tinkaton
  LARRY_ELITE: [Species.FLAMIGO, Species.STARAPTOR, [Species.ALTARIA, Species.TROPIUS], Species.ORICORIO], // Tera Flying Flamigo; random Oricorio
  HASSEL: [Species.BAXCALIBUR, [Species.FLAPPLE, Species.APPLETUN], Species.DRAGALGE, Species.NOIVERN], // Tera Dragon Baxcalibur
  // Elite Four- BBL
  CRISPIN: [Species.BLAZIKEN, Species.MAGMORTAR, [Species.CAMERUPT, Species.TALONFLAME], Species.ROTOM], // Tera Fire Blaziken; Heat Rotom
  AMARYS: [Species.METAGROSS, Species.SCIZOR, Species.EMPOLEON, Species.SKARMORY], // Tera Steel Metagross
  LACEY: [Species.EXCADRILL, Species.PRIMARINA, [Species.WHIMSICOTT, Species.ALCREMIE], Species.GRANBULL], // Tera Fairy Excadrill
  DRAYTON: [Species.ARCHALUDON, Species.DRAGONITE, Species.HAXORUS, Species.SCEPTILE], // Tera Dragon Archaludon
};
