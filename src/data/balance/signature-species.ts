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
  BROCK: [Species.ONIX, Species.GEODUDE],
  MISTY: [Species.STARYU, Species.PSYDUCK],
  LT_SURGE: [Species.PIKACHU, Species.ELEKID, Species.VOLTORB],
  ERIKA: [Species.ODDISH, Species.BELLSPROUT, Species.TANGELA, Species.HOPPIP],
  JANINE: [Species.VENONAT, Species.SPINARAK, Species.ZUBAT],
  SABRINA: [Species.ABRA, Species.MR_MIME, Species.ESPEON],
  BLAINE: [Species.GROWLITHE, Species.PONYTA, Species.MAGBY],
  GIOVANNI: [Species.RHYHORN, Species.NIDORAN_M, Species.NIDORAN_F, Species.MEOWTH], // Tera Ground Persian
  // Gym Leaders- Johto
  FALKNER: [Species.PIDGEY, Species.HOOTHOOT, Species.DODUO],
  BUGSY: [Species.SCYTHER, Species.PINECO],
  WHITNEY: [Species.JIGGLYPUFF, Species.MILTANK, Species.AIPOM, Species.GIRAFARIG],
  MORTY: [Species.GASTLY, Species.MISDREAVUS],
  CHUCK: [Species.POLIWRATH, Species.MANKEY],
  JASMINE: [Species.STEELIX, Species.MAGNEMITE],
  PRYCE: [Species.SWINUB, Species.SEEL],
  CLAIR: [Species.DRATINI, Species.HORSEA, Species.GYARADOS],
  // Gym Leaders- Hoenn
  ROXANNE: [Species.NOSEPASS, Species.GEODUDE],
  BRAWLY: [Species.MAKUHITA, Species.MACHOP, Species.MEDITITE],
  WATTSON: [Species.ELECTRIKE, Species.MAGNEMITE, Species.VOLTORB],
  FLANNERY: [Species.TORKOAL, Species.SLUGMA, Species.NUMEL],
  NORMAN: [Species.SLAKOTH, Species.SPINDA, Species.ZIGZAGOON, Species.KECLEON],
  WINONA: [Species.SWABLU, Species.WINGULL, Species.TROPIUS, Species.SKARMORY],
  TATE: [Species.SOLROCK, Species.NATU, Species.CHIMECHO, Species.GALLADE],
  LIZA: [Species.LUNATONE, Species.SPOINK, Species.BALTOY, Species.GARDEVOIR],
  JUAN: [Species.HORSEA, Species.BARBOACH, Species.SPHEAL, Species.RELICANTH],
  // Gym Leaders- Sinnoh
  ROARK: [Species.CRANIDOS, Species.GEODUDE, Species.LARVITAR],
  GARDENIA: [Species.ROSELIA, Species.CHERUBI, Species.TURTWIG, Species.TANGELA],
  MAYLENE: [Species.LUCARIO, Species.MEDITITE, Species.CHIMCHAR],
  CRASHER_WAKE: [Species.BUIZEL, Species.WOOPER, Species.PIPLUP, Species.MAGIKARP],
  FANTINA: [Species.MISDREAVUS, Species.DRIFLOON, Species.DUSKULL],
  BYRON: [Species.SHIELDON, Species.BRONZOR, Species.ARON],
  CANDICE: [Species.SNOVER, Species.SNORUNT, Species.SNEASEL, Species.GLACEON],
  VOLKNER: [Species.SHINX, Species.ELEKID, Species.JOLTEON, Species.REMORAID], // Tera Electric Octillery
  // Gym Leaders- Unova
  CILAN: [Species.PANSAGE, Species.FOONGUS, Species.PETILIL],
  CHILI: [Species.PANSEAR, Species.DARUMAKA, Species.NUMEL],
  CRESS: [Species.PANPOUR, Species.TYMPOLE, Species.SLOWPOKE],
  CHEREN: [Species.LILLIPUP, Species.MINCCINO, Species.PIDOVE],
  LENORA: [Species.PATRAT, Species.DEERLING, Species.AUDINO],
  ROXIE: [Species.VENIPEDE, Species.KOFFING, Species.TRUBBISH],
  BURGH: [Species.SEWADDLE, Species.SHELMET, Species.KARRABLAST],
  ELESA: [Species.EMOLGA, Species.BLITZLE, Species.JOLTIK],
  CLAY: [Species.DRILBUR, Species.SANDILE, Species.GOLETT],
  SKYLA: [Species.DUCKLETT, Species.WOOBAT, Species.RUFFLET],
  BRYCEN: [Species.CRYOGONAL, Species.VANILLITE, Species.CUBCHOO],
  DRAYDEN: [Species.AXEW, Species.DRUDDIGON, Species.DEINO],
  MARLON: [Species.FRILLISH, Species.WAILMER, Species.TIRTOUGA],
  // Gym Leaders- Kalos
  VIOLA: [Species.SCATTERBUG, Species.SURSKIT],
  GRANT: [Species.TYRUNT, Species.AMAURA],
  KORRINA: [Species.HAWLUCHA, Species.LUCARIO, Species.MIENFOO],
  RAMOS: [Species.SKIDDO, Species.HOPPIP, Species.BELLSPROUT],
  CLEMONT: [Species.HELIOPTILE, Species.MAGNEMITE, Species.EMOLGA],
  VALERIE: [Species.SYLVEON, Species.MAWILE, Species.MR_MIME],
  OLYMPIA: [Species.ESPURR, Species.SIGILYPH, Species.SLOWKING],
  WULFRIC: [Species.BERGMITE, Species.SNOVER, Species.CRYOGONAL],
  // Gym Leaders- Galar
  MILO: [Species.APPLIN, Species.GOSSIFLEUR, Species.BOUNSWEET],
  NESSA: [Species.CHEWTLE, Species.ARROKUDA, Species.WIMPOD],
  KABU: [Species.SIZZLIPEDE, Species.GROWLITHE, Species.TORKOAL],
  BEA: [Species.GALAR_FARFETCHD, Species.CLOBBOPUS, Species.MACHOP],
  ALLISTER: [Species.GALAR_YAMASK, Species.GALAR_CORSOLA, Species.GASTLY],
  OPAL: [Species.MILCERY, Species.TOGETIC, Species.GALAR_WEEZING],
  BEDE: [Species.HATENNA, Species.GALAR_PONYTA, Species.GARDEVOIR],
  GORDIE: [Species.ROLYCOLY, Species.STONJOURNER, Species.SHUCKLE, Species.BINACLE],
  MELONY: [Species.SNOM, Species.GALAR_DARUMAKA, Species.GALAR_MR_MIME, Species.LAPRAS],
  PIERS: [Species.GALAR_ZIGZAGOON, Species.SCRAGGY, Species.INKAY],
  MARNIE: [Species.MORPEKO, Species.IMPIDIMP, Species.PURRLOIN],
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
  LANCE: [Species.DRAGONITE, Species.GYARADOS, Species.AERODACTYL, [Species.KINGDRA, Species.ALOLA_EXEGGUTOR]],
  // Elite Four- Johto (Bruno included)
  WILL: [Species.XATU, Species.JYNX, [Species.SLOWBRO, Species.SLOWKING], Species.EXEGGUTOR],
  KOGA: [Species.CROBAT, [Species.MUK, Species.WEEZING], [Species.VENOMOTH, Species.ARIADOS], Species.TENTACRUEL],
  KAREN: [Species.UMBREON, Species.HONCHKROW, Species.HOUNDOOM, Species.WEAVILE],
  // Elite Four- Hoenn
  SIDNEY: [
    Species.ABSOL,
    [Species.SHIFTRY, Species.CACTURNE],
    [Species.SHARPEDO, Species.CRAWDAUNT],
    Species.MIGHTYENA,
  ],
  PHOEBE: [Species.DUSKNOIR, Species.SABLEYE, Species.BANETTE, [Species.DRIFBLIM, Species.MISMAGIUS]],
  GLACIA: [Species.GLALIE, Species.WALREIN, Species.FROSLASS, Species.ABOMASNOW],
  DRAKE: [Species.SALAMENCE, Species.FLYGON, Species.ALTARIA, Species.KINGDRA],
  // Elite Four- Sinnoh
  AARON: [Species.DRAPION, [Species.SCIZOR, Species.KLEAVOR], Species.HERACROSS, [Species.VESPIQUEN, Species.YANMEGA]],
  BERTHA: [Species.RHYPERIOR, Species.HIPPOWDON, Species.GLISCOR, Species.WHISCASH],
  FLINT: [
    Species.INFERNAPE,
    Species.MAGMORTAR,
    [Species.STEELIX, Species.LOPUNNY],
    [Species.RAPIDASH, Species.FLAREON],
  ], // Tera Fire Steelix or Lopunny
  LUCIAN: [Species.GALLADE, Species.BRONZONG, Species.MR_MIME, [Species.ALAKAZAM, Species.ESPEON]],
  // Elite Four- Unova
  SHAUNTAL: [Species.CHANDELURE, Species.GOLURK, Species.JELLICENT, Species.COFAGRIGUS],
  MARSHAL: [Species.CONKELDURR, Species.MIENSHAO, Species.THROH, Species.SAWK],
  GRIMSLEY: [Species.KINGAMBIT, Species.SCRAFTY, Species.KROOKODILE, Species.LIEPARD],
  CAITLIN: [Species.GOTHITELLE, Species.SIGILYPH, Species.REUNICLUS, Species.MUSHARNA],
  // Elite Four- Kalos
  MALVA: [Species.TALONFLAME, Species.TORKOAL, Species.CHANDELURE, Species.PYROAR],
  SIEBOLD: [Species.BARBARACLE, Species.GYARADOS, Species.STARMIE, Species.CLAWITZER],
  WIKSTROM: [Species.AEGISLASH, Species.PROBOPASS, Species.SCIZOR, Species.KLEFKI],
  DRASNA: [Species.NOIVERN, Species.DRUDDIGON, Species.ALTARIA, Species.DRAGALGE],
  // Elite Four- Alola
  HALA: [Species.CRABOMINABLE, Species.BEWEAR, Species.HARIYAMA, [Species.POLIWRATH, Species.ANNIHILAPE]],
  MOLAYNE: [Species.ALOLA_DUGTRIO, Species.MAGNEZONE, Species.METAGROSS, Species.KLEFKI],
  OLIVIA: [Species.LYCANROC, Species.RELICANTH, Species.CARBINK, Species.ALOLA_GOLEM],
  ACEROLA: [Species.PALOSSAND, [Species.FROSLASS, Species.DRIFBLIM], Species.MIMIKYU, Species.DHELMISE],
  KAHILI: [Species.TOUCANNON, [Species.BRAVIARY, Species.MANDIBUZZ], Species.HAWLUCHA, Species.ORICORIO],
  // Elite Four- Galar
  MARNIE_ELITE: [Species.GRIMMSNARL, Species.MORPEKO, [Species.TOXICROAK, Species.SCRAFTY], Species.LIEPARD],
  NESSA_ELITE: [Species.DREDNAW, Species.BARRASKEWDA, [Species.TOXAPEX, Species.PELIPPER], Species.GOLISOPOD],
  BEA_ELITE: [Species.SIRFETCHD, Species.GRAPPLOCT, Species.FALINKS, Species.MACHAMP],
  ALLISTER_ELITE: [Species.CURSOLA, Species.RUNERIGUS, Species.POLTEAGEIST, Species.GENGAR],
  RAIHAN_ELITE: [Species.ARCHALUDON, [Species.TORKOAL, Species.TURTONATOR], Species.FLYGON, Species.GOODRA],
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
