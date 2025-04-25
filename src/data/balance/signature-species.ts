import { Species } from "#enums/species";

export type SignatureSpecies = {
  [key in string]: (Species | Species[])[];
};

/**
 * The signature species for each Gym Leader, Elite Four member, and Champion.
 * The key is the trainer type, and the value is an array of Species or Species arrays.
 * This is in a separate const so it can be accessed from other places and not just the trainerConfigs
 * 
 * @remarks
 * The `Proxy` object allows us to define a handler that will intercept 
 * the property access and return an empty array if the property does not exist in the object.
 * 
 * This means that accessing `signatureSpecies` will not throw an error if the property does not exist,
 * but instead default to an empty array.
 */
export const signatureSpecies: SignatureSpecies = new Proxy({
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
}, {
  get(target, prop: string) {
    return target[prop as keyof SignatureSpecies] ?? [];
  }
});
