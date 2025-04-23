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
  BROCK: [Species.ONIX, Species.GEODUDE, [Species.OMANYTE, Species.KABUTO], Species.AERODACTYL],
  MISTY: [Species.STARYU, Species.PSYDUCK, Species.WOOPER, Species.LAPRAS],
  LT_SURGE: [Species.PICHU, Species.VOLTORB, Species.ELEKID, Species.JOLTEON],
  ERIKA: [Species.ODDISH, Species.BELLSPROUT, Species.TANGELA, Species.HOPPIP],
  JANINE: [Species.VENONAT, Species.SPINARAK, Species.ZUBAT, Species.KOFFING],
  SABRINA: [Species.ABRA, Species.MR_MIME, Species.SMOOCHUM, Species.ESPEON],
  BLAINE: [Species.GROWLITHE, Species.PONYTA, Species.MAGBY, Species.VULPIX],
  GIOVANNI: [Species.RHYHORN, Species.MEOWTH, [Species.NIDORAN_F, Species.NIDORAN_M], Species.DIGLETT], // Tera Ground Meowth
  // Gym Leaders- Johto
  FALKNER: [Species.PIDGEY, Species.HOOTHOOT, Species.NATU, Species.MURKROW],
  BUGSY: [Species.SCYTHER, Species.SHUCKLE, Species.YANMA, [Species.PINSIR, Species.HERACROSS]],
  WHITNEY: [Species.MILTANK, Species.AIPOM, Species.IGGLYBUFF, [Species.GIRAFARIG, Species.STANTLER]],
  MORTY: [Species.GASTLY, Species.MISDREAVUS, Species.DUSKULL, Species.SABLEYE],
  CHUCK: [Species.POLIWRATH, Species.MANKEY, Species.TYROGUE, Species.MACHOP],
  JASMINE: [Species.STEELIX, Species.MAGNEMITE, Species.PINECO, Species.SKARMORY],
  PRYCE: [Species.SWINUB, Species.SEEL, Species.SHELLDER, Species.SNEASEL],
  CLAIR: [Species.HORSEA, Species.DRATINI, Species.MAGIKARP, Species.DRUDDIGON], // Tera Dragon Magikarp
  // Gym Leaders- Hoenn
  ROXANNE: [Species.NOSEPASS, Species.GEODUDE, [Species.LILEEP, Species.ANORITH], Species.ARON],
  BRAWLY: [Species.MAKUHITA, Species.MACHOP, Species.MEDITITE, Species.SHROOMISH],
  WATTSON: [Species.ELECTRIKE, Species.VOLTORB, Species.MAGNEMITE, [Species.PLUSLE, Species.MINUN]],
  FLANNERY: [Species.TORKOAL, Species.SLUGMA, Species.NUMEL, Species.HOUNDOUR],
  NORMAN: [Species.SLAKOTH, Species.KECLEON, Species.WHISMUR, Species.ZANGOOSE],
  WINONA: [Species.SWABLU, Species.WINGULL, Species.TROPIUS, Species.SKARMORY],
  TATE: [Species.SOLROCK, Species.NATU, Species.CHINGLING, Species.GALLADE],
  LIZA: [Species.LUNATONE, Species.BALTOY, Species.SPOINK, Species.GARDEVOIR],
  JUAN: [Species.HORSEA, Species.SPHEAL, Species.BARBOACH, Species.CORPHISH],
  // Gym Leaders- Sinnoh
  ROARK: [Species.CRANIDOS, Species.GEODUDE, Species.NOSEPASS, Species.LARVITAR],
  GARDENIA: [Species.BUDEW, Species.CHERUBI, Species.TURTWIG, Species.LEAFEON],
  MAYLENE: [Species.RIOLU, Species.MEDITITE, Species.CHIMCHAR, Species.CROAGUNK],
  CRASHER_WAKE: [Species.BUIZEL, Species.WOOPER, Species.PIPLUP, Species.MAGIKARP],
  FANTINA: [Species.MISDREAVUS, Species.DRIFLOON, Species.DUSKULL, Species.SPIRITOMB],
  BYRON: [Species.SHIELDON, Species.BRONZOR, Species.ARON, Species.SKARMORY],
  CANDICE: [Species.FROSLASS, Species.SNOVER, Species.SNEASEL, Species.GLACEON],
  VOLKNER: [Species.ELEKID, Species.SHINX, Species.CHINCHOU, Species.ROTOM],
  // Gym Leaders- Unova
  CILAN: [Species.PANSAGE, Species.SNIVY, Species.MARACTUS, Species.FERROSEED],
  CHILI: [Species.PANSEAR, Species.TEPIG, Species.HEATMOR, Species.DARUMAKA],
  CRESS: [Species.PANPOUR, Species.OSHAWOTT, Species.BASCULIN, Species.TYMPOLE],
  CHEREN: [Species.LILLIPUP, Species.MINCCINO, Species.PIDOVE, Species.BOUFFALANT],
  LENORA: [Species.PATRAT, Species.DEERLING, Species.AUDINO, Species.BRAVIARY],
  ROXIE: [Species.VENIPEDE, Species.KOFFING, Species.TRUBBISH, Species.TOXEL],
  BURGH: [Species.SEWADDLE, Species.DWEBBLE, [Species.KARRABLAST, Species.SHELMET], Species.DURANT],
  ELESA: [Species.BLITZLE, Species.EMOLGA, Species.JOLTIK, Species.TYNAMO],
  CLAY: [Species.DRILBUR, Species.SANDILE, Species.TYMPOLE, Species.GOLETT],
  SKYLA: [Species.DUCKLETT, Species.WOOBAT, [Species.RUFFLET, Species.VULLABY], Species.ARCHEN],
  BRYCEN: [Species.CRYOGONAL, Species.VANILLITE, Species.CUBCHOO, Species.GALAR_DARUMAKA],
  DRAYDEN: [Species.AXEW, Species.DRUDDIGON, Species.TRAPINCH, Species.DEINO],
  MARLON: [Species.FRILLISH, Species.TIRTOUGA, Species.WAILMER, Species.MANTYKE],
  // Gym Leaders- Kalos
  VIOLA: [Species.SCATTERBUG, Species.SURSKIT, Species.CUTIEFLY, Species.BLIPBUG],
  GRANT: [Species.TYRUNT, Species.AMAURA, Species.BINACLE, Species.DWEBBLE],
  KORRINA: [Species.RIOLU, Species.MIENFOO, Species.HAWLUCHA, Species.PANCHAM],
  RAMOS: [Species.SKIDDO, Species.HOPPIP, Species.BELLSPROUT, [Species.PHANTUMP, Species.PUMPKABOO]],
  CLEMONT: [Species.HELIOPTILE, Species.MAGNEMITE, Species.DEDENNE, Species.ROTOM],
  VALERIE: [Species.SYLVEON, Species.MAWILE, Species.MR_MIME, [Species.SPRITZEE, Species.SWIRLIX]],
  OLYMPIA: [Species.ESPURR, Species.SIGILYPH, Species.INKAY, Species.SLOWKING],
  WULFRIC: [Species.BERGMITE, Species.SNOVER, Species.CRYOGONAL, Species.SWINUB],
  // Gym Leaders- Galar
  MILO: [Species.GOSSIFLEUR, Species.SEEDOT, Species.APPLIN, Species.LOTAD],
  NESSA: [Species.CHEWTLE, Species.WIMPOD, Species.ARROKUDA, Species.MAREANIE],
  KABU: [Species.SIZZLIPEDE, Species.VULPIX, Species.GROWLITHE, Species.TORKOAL],
  BEA: [Species.MACHOP, Species.GALAR_FARFETCHD, Species.CLOBBOPUS, Species.FALINKS],
  ALLISTER: [Species.GASTLY, Species.GALAR_YAMASK, Species.GALAR_CORSOLA, Species.SINISTEA],
  OPAL: [Species.MILCERY, Species.GALAR_WEEZING, Species.TOGEPI, Species.MAWILE],
  BEDE: [Species.HATENNA, Species.GALAR_PONYTA, Species.GARDEVOIR, Species.SYLVEON],
  GORDIE: [Species.ROLYCOLY, [Species.SHUCKLE, Species.BINACLE], Species.STONJOURNER, Species.LARVITAR],
  MELONY: [Species.LAPRAS, Species.SNOM, Species.EISCUE, [Species.GALAR_MR_MIME, Species.GALAR_DARUMAKA]],
  PIERS: [Species.GALAR_ZIGZAGOON, Species.SCRAGGY, Species.TOXEL, Species.INKAY], // Tera Dark Toxel
  MARNIE: [Species.IMPIDIMP, Species.MORPEKO, Species.PURRLOIN, Species.CROAGUNK], // Tera Dark Croagunk
  RAIHAN: [Species.DURALUDON, Species.TRAPINCH, Species.GOOMY, Species.TURTONATOR],
  // Gym Leaders- Paldea; First slot is Tera
  KATY: [Species.TEDDIURSA, Species.NYMBLE, Species.TAROUNTULA, Species.RELLOR], // Tera Bug Teddiursa
  BRASSIUS: [Species.BONSLY, Species.SMOLIV, Species.BRAMBLIN, Species.SUNKERN], // Tera Grass Bonsly
  IONO: [Species.MISDREAVUS, Species.TADBULB, Species.WATTREL, Species.MAGNEMITE], // Tera Ghost Misdreavus
  KOFU: [Species.CRABRAWLER, Species.VELUZA, Species.WIGLETT, Species.WINGULL], // Tera Water Crabrawler
  LARRY: [Species.STARLY, Species.DUNSPARCE, Species.LECHONK, Species.KOMALA], // Tera Normal Starly
  RYME: [Species.TOXEL, Species.GREAVARD, Species.SHUPPET, Species.MIMIKYU], // Tera Ghost Toxel
  TULIP: [Species.FLABEBE, Species.FLITTLE, Species.RALTS, Species.GIRAFARIG], // Tera Psychic Flabebe
  GRUSHA: [Species.SWABLU, Species.CETODDLE, Species.SNOM, Species.CUBCHOO], // Tera Ice Swablu

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
