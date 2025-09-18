import { SpeciesId } from "#enums/species-id";

export type SignatureSpecies = {
  [key in string]: (SpeciesId | SpeciesId[])[];
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
  BROCK: [SpeciesId.ONIX, SpeciesId.GEODUDE, [SpeciesId.OMANYTE, SpeciesId.KABUTO], SpeciesId.AERODACTYL],
  MISTY: [SpeciesId.STARYU, SpeciesId.PSYDUCK, SpeciesId.WOOPER, SpeciesId.LAPRAS],
  LT_SURGE: [SpeciesId.PICHU, SpeciesId.VOLTORB, SpeciesId.ELEKID, SpeciesId.JOLTEON],
  ERIKA: [SpeciesId.ODDISH, SpeciesId.BELLSPROUT, SpeciesId.TANGELA, SpeciesId.HOPPIP],
  JANINE: [SpeciesId.VENONAT, SpeciesId.SPINARAK, SpeciesId.ZUBAT, SpeciesId.KOFFING],
  SABRINA: [SpeciesId.ABRA, SpeciesId.MR_MIME, SpeciesId.SMOOCHUM, SpeciesId.ESPEON],
  BLAINE: [SpeciesId.GROWLITHE, SpeciesId.PONYTA, SpeciesId.MAGBY, SpeciesId.VULPIX],
  GIOVANNI: [SpeciesId.RHYHORN, SpeciesId.MEOWTH, [SpeciesId.NIDORAN_F, SpeciesId.NIDORAN_M], SpeciesId.DIGLETT], // Tera Ground Meowth
  // Gym Leaders- Johto
  FALKNER: [SpeciesId.PIDGEY, SpeciesId.HOOTHOOT, SpeciesId.NATU, SpeciesId.MURKROW],
  BUGSY: [SpeciesId.SCYTHER, SpeciesId.SHUCKLE, SpeciesId.YANMA, [SpeciesId.PINSIR, SpeciesId.HERACROSS]],
  WHITNEY: [SpeciesId.MILTANK, SpeciesId.AIPOM, SpeciesId.IGGLYBUFF, [SpeciesId.GIRAFARIG, SpeciesId.STANTLER]],
  MORTY: [SpeciesId.GASTLY, SpeciesId.MISDREAVUS, SpeciesId.DUSKULL, SpeciesId.HISUI_TYPHLOSION],
  CHUCK: [SpeciesId.POLIWRATH, SpeciesId.MANKEY, SpeciesId.TYROGUE, SpeciesId.MACHOP],
  JASMINE: [SpeciesId.STEELIX, SpeciesId.MAGNEMITE, SpeciesId.PINECO, SpeciesId.SKARMORY],
  PRYCE: [SpeciesId.SWINUB, SpeciesId.SEEL, SpeciesId.SHELLDER, SpeciesId.SNEASEL],
  CLAIR: [SpeciesId.HORSEA, SpeciesId.DRATINI, SpeciesId.MAGIKARP, SpeciesId.DRUDDIGON], // Tera Dragon Magikarp
  // Gym Leaders- Hoenn
  ROXANNE: [SpeciesId.NOSEPASS, SpeciesId.GEODUDE, [SpeciesId.LILEEP, SpeciesId.ANORITH], SpeciesId.ARON],
  BRAWLY: [SpeciesId.MAKUHITA, SpeciesId.MACHOP, SpeciesId.MEDITITE, SpeciesId.SHROOMISH],
  WATTSON: [SpeciesId.ELECTRIKE, SpeciesId.VOLTORB, SpeciesId.MAGNEMITE, [SpeciesId.PLUSLE, SpeciesId.MINUN]],
  FLANNERY: [SpeciesId.TORKOAL, SpeciesId.SLUGMA, SpeciesId.NUMEL, SpeciesId.HOUNDOUR],
  NORMAN: [SpeciesId.SLAKOTH, SpeciesId.KECLEON, SpeciesId.WHISMUR, SpeciesId.ZANGOOSE],
  WINONA: [SpeciesId.SWABLU, SpeciesId.WINGULL, SpeciesId.TROPIUS, SpeciesId.SKARMORY],
  TATE: [SpeciesId.SOLROCK, SpeciesId.NATU, SpeciesId.CHINGLING, SpeciesId.GALLADE],
  LIZA: [SpeciesId.LUNATONE, SpeciesId.BALTOY, SpeciesId.SPOINK, SpeciesId.GARDEVOIR],
  JUAN: [SpeciesId.HORSEA, SpeciesId.SPHEAL, SpeciesId.BARBOACH, SpeciesId.CORPHISH],
  // Gym Leaders- Sinnoh
  ROARK: [SpeciesId.CRANIDOS, SpeciesId.GEODUDE, SpeciesId.NOSEPASS, SpeciesId.LARVITAR],
  GARDENIA: [SpeciesId.BUDEW, SpeciesId.CHERUBI, SpeciesId.TURTWIG, SpeciesId.LEAFEON],
  MAYLENE: [SpeciesId.RIOLU, SpeciesId.MEDITITE, SpeciesId.CHIMCHAR, SpeciesId.CROAGUNK],
  CRASHER_WAKE: [SpeciesId.BUIZEL, SpeciesId.WOOPER, SpeciesId.PIPLUP, SpeciesId.MAGIKARP],
  FANTINA: [SpeciesId.MISDREAVUS, SpeciesId.DRIFLOON, SpeciesId.DUSKULL, SpeciesId.SPIRITOMB],
  BYRON: [SpeciesId.SHIELDON, SpeciesId.BRONZOR, SpeciesId.ARON, SpeciesId.SKARMORY],
  CANDICE: [SpeciesId.FROSLASS, SpeciesId.SNOVER, SpeciesId.SNEASEL, SpeciesId.GLACEON],
  VOLKNER: [SpeciesId.ELEKID, SpeciesId.SHINX, SpeciesId.CHINCHOU, SpeciesId.ROTOM],
  // Gym Leaders- Unova
  CILAN: [SpeciesId.PANSAGE, SpeciesId.SNIVY, SpeciesId.MARACTUS, SpeciesId.FERROSEED],
  CHILI: [SpeciesId.PANSEAR, SpeciesId.TEPIG, SpeciesId.HEATMOR, SpeciesId.DARUMAKA],
  CRESS: [SpeciesId.PANPOUR, SpeciesId.OSHAWOTT, SpeciesId.BASCULIN, SpeciesId.TYMPOLE],
  CHEREN: [SpeciesId.LILLIPUP, SpeciesId.MINCCINO, SpeciesId.PIDOVE, SpeciesId.BOUFFALANT],
  LENORA: [SpeciesId.PATRAT, SpeciesId.DEERLING, SpeciesId.AUDINO, SpeciesId.BRAVIARY],
  ROXIE: [SpeciesId.VENIPEDE, SpeciesId.KOFFING, SpeciesId.TRUBBISH, SpeciesId.TOXEL],
  BURGH: [SpeciesId.SEWADDLE, SpeciesId.DWEBBLE, [SpeciesId.KARRABLAST, SpeciesId.SHELMET], SpeciesId.DURANT],
  ELESA: [SpeciesId.BLITZLE, SpeciesId.EMOLGA, SpeciesId.JOLTIK, SpeciesId.TYNAMO],
  CLAY: [SpeciesId.DRILBUR, SpeciesId.SANDILE, SpeciesId.TYMPOLE, SpeciesId.GOLETT],
  SKYLA: [SpeciesId.DUCKLETT, SpeciesId.WOOBAT, [SpeciesId.RUFFLET, SpeciesId.VULLABY], SpeciesId.ARCHEN],
  BRYCEN: [SpeciesId.CRYOGONAL, SpeciesId.VANILLITE, SpeciesId.CUBCHOO, SpeciesId.GALAR_DARUMAKA],
  DRAYDEN: [SpeciesId.AXEW, SpeciesId.DRUDDIGON, SpeciesId.TRAPINCH, SpeciesId.DEINO],
  MARLON: [SpeciesId.FRILLISH, SpeciesId.TIRTOUGA, SpeciesId.WAILMER, SpeciesId.MANTYKE],
  // Gym Leaders- Kalos
  VIOLA: [SpeciesId.SCATTERBUG, SpeciesId.SURSKIT, SpeciesId.CUTIEFLY, SpeciesId.BLIPBUG],
  GRANT: [SpeciesId.TYRUNT, SpeciesId.AMAURA, SpeciesId.BINACLE, SpeciesId.DWEBBLE],
  KORRINA: [SpeciesId.RIOLU, SpeciesId.MIENFOO, SpeciesId.HAWLUCHA, SpeciesId.PANCHAM],
  RAMOS: [SpeciesId.SKIDDO, SpeciesId.HOPPIP, SpeciesId.BELLSPROUT, [SpeciesId.PHANTUMP, SpeciesId.PUMPKABOO]],
  CLEMONT: [SpeciesId.HELIOPTILE, SpeciesId.MAGNEMITE, SpeciesId.DEDENNE, SpeciesId.ROTOM],
  VALERIE: [SpeciesId.SYLVEON, SpeciesId.MAWILE, SpeciesId.MR_MIME, [SpeciesId.SPRITZEE, SpeciesId.SWIRLIX]],
  OLYMPIA: [SpeciesId.ESPURR, SpeciesId.SIGILYPH, SpeciesId.INKAY, SpeciesId.SLOWKING],
  WULFRIC: [SpeciesId.BERGMITE, SpeciesId.SNOVER, SpeciesId.CRYOGONAL, SpeciesId.SWINUB],
  // Gym Leaders- Galar
  MILO: [SpeciesId.GOSSIFLEUR, SpeciesId.SEEDOT, SpeciesId.APPLIN, SpeciesId.LOTAD],
  NESSA: [SpeciesId.CHEWTLE, SpeciesId.WIMPOD, SpeciesId.ARROKUDA, SpeciesId.MAREANIE],
  KABU: [SpeciesId.SIZZLIPEDE, SpeciesId.VULPIX, SpeciesId.GROWLITHE, SpeciesId.TORKOAL],
  BEA: [SpeciesId.MACHOP, SpeciesId.GALAR_FARFETCHD, SpeciesId.CLOBBOPUS, SpeciesId.FALINKS],
  ALLISTER: [SpeciesId.GASTLY, SpeciesId.GALAR_YAMASK, SpeciesId.GALAR_CORSOLA, SpeciesId.SINISTEA],
  OPAL: [SpeciesId.MILCERY, SpeciesId.GALAR_WEEZING, SpeciesId.TOGEPI, SpeciesId.MAWILE],
  BEDE: [SpeciesId.HATENNA, SpeciesId.GALAR_PONYTA, SpeciesId.GARDEVOIR, SpeciesId.SYLVEON],
  GORDIE: [SpeciesId.ROLYCOLY, [SpeciesId.SHUCKLE, SpeciesId.BINACLE], SpeciesId.STONJOURNER, SpeciesId.LARVITAR],
  MELONY: [SpeciesId.LAPRAS, SpeciesId.SNOM, SpeciesId.EISCUE, [SpeciesId.GALAR_MR_MIME, SpeciesId.GALAR_DARUMAKA]],
  PIERS: [SpeciesId.GALAR_ZIGZAGOON, SpeciesId.SCRAGGY, SpeciesId.TOXEL, SpeciesId.INKAY], // Tera Dark Toxel
  MARNIE: [SpeciesId.IMPIDIMP, SpeciesId.MORPEKO, SpeciesId.PURRLOIN, SpeciesId.CROAGUNK], // Tera Dark Croagunk
  RAIHAN: [SpeciesId.DURALUDON, SpeciesId.TRAPINCH, SpeciesId.GOOMY, SpeciesId.TURTONATOR],
  // Gym Leaders- Paldea; First slot is Tera
  KATY: [SpeciesId.TEDDIURSA, SpeciesId.NYMBLE, SpeciesId.TAROUNTULA, SpeciesId.RELLOR], // Tera Bug Teddiursa
  BRASSIUS: [SpeciesId.BONSLY, SpeciesId.SMOLIV, SpeciesId.BRAMBLIN, SpeciesId.SUNKERN], // Tera Grass Bonsly
  IONO: [SpeciesId.MISDREAVUS, SpeciesId.TADBULB, SpeciesId.WATTREL, SpeciesId.MAGNEMITE], // Tera Ghost Misdreavus
  KOFU: [SpeciesId.CRABRAWLER, SpeciesId.VELUZA, SpeciesId.WIGLETT, SpeciesId.WINGULL], // Tera Water Crabrawler
  LARRY: [SpeciesId.STARLY, SpeciesId.DUNSPARCE, SpeciesId.LECHONK, SpeciesId.KOMALA], // Tera Normal Starly
  RYME: [SpeciesId.TOXEL, SpeciesId.GREAVARD, SpeciesId.SHUPPET, SpeciesId.MIMIKYU], // Tera Ghost Toxel
  TULIP: [SpeciesId.FLABEBE, SpeciesId.FLITTLE, SpeciesId.RALTS, SpeciesId.GIRAFARIG], // Tera Psychic Flabebe
  GRUSHA: [SpeciesId.SWABLU, SpeciesId.CETODDLE, SpeciesId.SNOM, SpeciesId.CUBCHOO], // Tera Ice Swablu
}, {
  get(target, prop: string) {
    return target[prop as keyof SignatureSpecies] ?? [];
  }
});
