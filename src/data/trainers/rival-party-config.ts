import { timedEventManager } from "#app/global-event-manager";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import type { EnemyPokemon } from "#field/pokemon";
import { randSeedIntRange, randSeedItem } from "#utils/common";

//#region constants

// Levels for slots 1 and 2 do not need post-processing logic

// Fight 1 doesn't have slot 3
const SLOT_3_FIGHT_2_LEVEL = 16;
const SLOT_3_FIGHT_3_LEVEL = 36;
const SLOT_3_FIGHT_4_LEVEL = 71;
const SLOT_3_FIGHT_5_LEVEL = 125;
const SLOT_3_FIGHT_6_LEVEL = 189;

// Fights 1 and 2 don't have slot 4
const SLOT_4_FIGHT_3_LEVEL = 38;
const SLOT_4_FIGHT_4_LEVEL = 71;
const SLOT_4_FIGHT_5_LEVEL = 125;
const SLOT_4_FIGHT_6_LEVEL = 189;

// Fights 1-3 don't have slot 5
const SLOT_5_FIGHT_4_LEVEL = 69;
const SLOT_5_FIGHT_5_LEVEL = 127;
const SLOT_5_FIGHT_6_LEVEL = 189;

// Fights 1-4 don't have slot 6
const SLOT_6_FIGHT_5_LEVEL = 129;
const SLOT_6_FIGHT_6_LEVEL = 200;

//#endregion constants

//#region Slot 1

/**
 * Set the abiltiy index to 0 and the tera type to the primary type
 *
 * @param pokemon - The pokemon to force traits for
 * @param bars - (default `0`) The number of boss bar segments to set. If `zero`, the pokemon will not be a boss
 */

function forceRivalStarterTraits(pokemon: EnemyPokemon, bars = 0): void {
  pokemon.abilityIndex = 0;
  pokemon.teraType = pokemon.species.type1;
  if (bars > 0) {
    pokemon.setBoss(true, bars);
    pokemon.generateAndPopulateMoveset();
  }
}

/** Rival's slot 1 species pool for fight 1 */
const SLOT_1_FIGHT_1 = [
  SpeciesId.BULBASAUR,
  SpeciesId.CHARMANDER,
  SpeciesId.SQUIRTLE,
  SpeciesId.CHIKORITA,
  SpeciesId.CYNDAQUIL,
  SpeciesId.TOTODILE,
  SpeciesId.TREECKO,
  SpeciesId.TORCHIC,
  SpeciesId.MUDKIP,
  SpeciesId.TURTWIG,
  SpeciesId.CHIMCHAR,
  SpeciesId.PIPLUP,
  SpeciesId.SNIVY,
  SpeciesId.TEPIG,
  SpeciesId.OSHAWOTT,
  SpeciesId.CHESPIN,
  SpeciesId.FENNEKIN,
  SpeciesId.FROAKIE,
  SpeciesId.ROWLET,
  SpeciesId.LITTEN,
  SpeciesId.POPPLIO,
  SpeciesId.GROOKEY,
  SpeciesId.SCORBUNNY,
  SpeciesId.SOBBLE,
  SpeciesId.SPRIGATITO,
  SpeciesId.FUECOCO,
  SpeciesId.QUAXLY,
];

/** Rival's slot 1 species pool for fight 2 */
const SLOT_1_FIGHT_2 = [
  SpeciesId.IVYSAUR,
  SpeciesId.CHARMELEON,
  SpeciesId.WARTORTLE,
  SpeciesId.BAYLEEF,
  SpeciesId.QUILAVA,
  SpeciesId.CROCONAW,
  SpeciesId.GROVYLE,
  SpeciesId.COMBUSKEN,
  SpeciesId.MARSHTOMP,
  SpeciesId.GROTLE,
  SpeciesId.MONFERNO,
  SpeciesId.PRINPLUP,
  SpeciesId.SERVINE,
  SpeciesId.PIGNITE,
  SpeciesId.DEWOTT,
  SpeciesId.QUILLADIN,
  SpeciesId.BRAIXEN,
  SpeciesId.FROGADIER,
  SpeciesId.DARTRIX,
  SpeciesId.TORRACAT,
  SpeciesId.BRIONNE,
  SpeciesId.THWACKEY,
  SpeciesId.RABOOT,
  SpeciesId.DRIZZILE,
  SpeciesId.FLORAGATO,
  SpeciesId.CROCALOR,
  SpeciesId.QUAXWELL,
];

/** Rival's slot 1 species pool for fight 3 and beyond */
const SLOT_1_FINAL = [
  SpeciesId.VENUSAUR,
  SpeciesId.CHARIZARD,
  SpeciesId.BLASTOISE,
  SpeciesId.MEGANIUM,
  SpeciesId.TYPHLOSION,
  SpeciesId.FERALIGATR,
  SpeciesId.SCEPTILE,
  SpeciesId.BLAZIKEN,
  SpeciesId.SWAMPERT,
  SpeciesId.TORTERRA,
  SpeciesId.INFERNAPE,
  SpeciesId.EMPOLEON,
  SpeciesId.SERPERIOR,
  SpeciesId.EMBOAR,
  SpeciesId.SAMUROTT,
  SpeciesId.CHESNAUGHT,
  SpeciesId.DELPHOX,
  SpeciesId.GRENINJA,
  SpeciesId.DECIDUEYE,
  SpeciesId.INCINEROAR,
  SpeciesId.PRIMARINA,
  SpeciesId.RILLABOOM,
  SpeciesId.CINDERACE,
  SpeciesId.INTELEON,
  SpeciesId.MEOWSCARADA,
  SpeciesId.SKELEDIRGE,
  SpeciesId.QUAQUAVAL,
];
//#endregion slot 1

//#region Slot 2
/**
 * Post-process rival birds to override their sets
 *
 * @remarks
 * Currently used to force ability indices
 *
 * @param pokemon - The rival bird pokemon to force an ability for
 * @param bars - (default `0`) The number of boss bar segments to set. If `zero`, the pokemon will not be a boss
 */

function forceRivalBirdAbility(pokemon: EnemyPokemon, bars = 0): void {
  switch (pokemon.species.speciesId) {
    // Guts for Tailow line
    case SpeciesId.TAILLOW:
    case SpeciesId.SWELLOW:
    // Intimidate for Starly line
    case SpeciesId.STARLY:
    case SpeciesId.STARAVIA:
    case SpeciesId.STARAPTOR: {
      pokemon.abilityIndex = 0;
      break;
    }
    // Tangled Feet for Pidgey line
    case SpeciesId.PIDGEY:
    case SpeciesId.PIDGEOTTO:
    case SpeciesId.PIDGEOT:
    // Super Luck for pidove line
    case SpeciesId.PIDOVE:
    case SpeciesId.TRANQUILL:
    case SpeciesId.UNFEZANT:
    // Volt Absorb for Wattrel line
    case SpeciesId.WATTREL:
    case SpeciesId.KILOWATTREL: {
      pokemon.abilityIndex = 1;
      break;
    }
    // Tinted lens for Hoothoot line
    case SpeciesId.HOOTHOOT:
    case SpeciesId.NOCTOWL:
    // Skill link for Pikipek line
    case SpeciesId.PIKIPEK:
    case SpeciesId.TRUMBEAK:
    case SpeciesId.TOUCANNON:
    // Gale Wings for Fletchling line
    case SpeciesId.FLETCHLING:
    case SpeciesId.FLETCHINDER:
    case SpeciesId.TALONFLAME: {
      pokemon.abilityIndex = 2;
      break;
    }
  }

  if (bars > 0) {
    pokemon.setBoss(true, bars);
    pokemon.generateAndPopulateMoveset();
  }
}
/** Rival's slot 2 species pool for fight 1 */
const SLOT_2_FIGHT_1 = [
  SpeciesId.PIDGEY,
  SpeciesId.HOOTHOOT,
  SpeciesId.TAILLOW,
  SpeciesId.STARLY,
  SpeciesId.PIDOVE,
  SpeciesId.FLETCHLING,
  SpeciesId.PIKIPEK,
  SpeciesId.ROOKIDEE,
  SpeciesId.WATTREL,
];

/** Rival's slot 2 species pool for fight 2 */
const SLOT_2_FIGHT_2 = [
  SpeciesId.PIDGEOTTO,
  SpeciesId.HOOTHOOT,
  SpeciesId.TAILLOW,
  SpeciesId.STARAVIA,
  SpeciesId.TRANQUILL,
  SpeciesId.FLETCHINDER,
  SpeciesId.TRUMBEAK,
  SpeciesId.CORVISQUIRE,
  SpeciesId.WATTREL,
];

/** Rival's slot 2 species pool for fight 3 and beyond */
const SLOT_2_FINAL = [
  SpeciesId.PIDGEOT,
  SpeciesId.NOCTOWL,
  SpeciesId.SWELLOW,
  SpeciesId.STARAPTOR,
  SpeciesId.UNFEZANT,
  SpeciesId.TALONFLAME,
  SpeciesId.TOUCANNON,
  SpeciesId.CORVIKNIGHT,
  SpeciesId.KILOWATTREL,
];
//#endregion Slot 2

//#region Slot 3
/** Rival's slot 3 species pool for fight 2 */
const SLOT_3_FIGHT_2 = [
  SpeciesId.NIDORINA,
  SpeciesId.NIDORINO,
  SpeciesId.MANKEY,
  SpeciesId.GROWLITHE,
  SpeciesId.ABRA,
  SpeciesId.MACHOP,
  SpeciesId.GASTLY,
  SpeciesId.MAGNEMITE,
  SpeciesId.RHYDON,
  SpeciesId.TANGELA,
  SpeciesId.PORYGON,
  SpeciesId.ELEKID,
  SpeciesId.MAGBY,
  SpeciesId.MARILL,
  SpeciesId.TEDDIURSA,
  SpeciesId.SWINUB,
  SpeciesId.SLAKOTH,
  SpeciesId.ARON,
  SpeciesId.SPHEAL,
  SpeciesId.FEEBAS,
  SpeciesId.MUNCHLAX,
  SpeciesId.ROGGENROLA,
  SpeciesId.TIMBURR,
  SpeciesId.TYMPOLE,
  SpeciesId.SANDILE,
  SpeciesId.YAMASK,
  SpeciesId.SOLOSIS,
  SpeciesId.VANILLITE,
  SpeciesId.TYMPOLE,
  SpeciesId.LITWICK,
  SpeciesId.MUDBRAY,
  SpeciesId.DEWPIDER,
  SpeciesId.WIMPOD,
  SpeciesId.HATENNA,
  SpeciesId.IMPIDIMP,
  SpeciesId.SMOLIV,
  SpeciesId.NACLI,
  [SpeciesId.CHARCADET, SpeciesId.CHARCADET],
  SpeciesId.TINKATINK,
  SpeciesId.GLIMMET,
];

/** Rival's slot 3 species pool for fight 3 */
const SLOT_3_FIGHT_3 = [
  SpeciesId.NIDOQUEEN,
  SpeciesId.NIDOKING,
  SpeciesId.PRIMEAPE,
  SpeciesId.ARCANINE,
  SpeciesId.KADABRA,
  SpeciesId.MACHOKE,
  SpeciesId.HAUNTER,
  SpeciesId.MAGNETON,
  SpeciesId.RHYDON,
  SpeciesId.TANGROWTH,
  SpeciesId.PORYGON2,
  SpeciesId.ELECTIVIRE,
  SpeciesId.MAGMAR,
  SpeciesId.AZUMARILL,
  SpeciesId.URSARING,
  SpeciesId.PILOSWINE,
  SpeciesId.VIGOROTH,
  SpeciesId.LAIRON,
  SpeciesId.SEALEO,
  SpeciesId.MILOTIC,
  SpeciesId.SNORLAX,
  SpeciesId.BOLDORE,
  SpeciesId.GURDURR,
  SpeciesId.PALPITOAD,
  SpeciesId.KROKOROK,
  SpeciesId.COFAGRIGUS,
  SpeciesId.DUOSION,
  SpeciesId.VANILLISH,
  SpeciesId.EELEKTRIK,
  SpeciesId.LAMPENT,
  SpeciesId.MUDSDALE,
  SpeciesId.ARAQUANID,
  SpeciesId.GOLISOPOD,
  SpeciesId.HATTREM,
  SpeciesId.MORGREM,
  SpeciesId.DOLLIV,
  SpeciesId.NACLSTACK,
  [SpeciesId.ARMAROUGE, SpeciesId.CERULEDGE],
  SpeciesId.TINKATUFF,
  SpeciesId.GLIMMORA,
];

/** Rival's slot 3 species pool for fight 4 and beyond */
const SLOT_3_FINAL = [
  SpeciesId.NIDOQUEEN,
  SpeciesId.NIDOKING,
  SpeciesId.ANNIHILAPE,
  SpeciesId.ARCANINE,
  SpeciesId.ALAKAZAM,
  SpeciesId.MACHAMP,
  SpeciesId.GENGAR,
  SpeciesId.MAGNEZONE,
  SpeciesId.RHYPERIOR,
  SpeciesId.TANGROWTH,
  SpeciesId.PORYGON_Z,
  SpeciesId.ELECTIVIRE,
  SpeciesId.MAGMORTAR,
  SpeciesId.AZUMARILL,
  SpeciesId.URSALUNA,
  SpeciesId.MAMOSWINE,
  SpeciesId.SLAKING,
  SpeciesId.AGGRON,
  SpeciesId.WALREIN,
  SpeciesId.MILOTIC,
  SpeciesId.SNORLAX,
  SpeciesId.GIGALITH,
  SpeciesId.CONKELDURR,
  SpeciesId.SEISMITOAD,
  SpeciesId.KROOKODILE,
  SpeciesId.COFAGRIGUS,
  SpeciesId.REUNICLUS,
  SpeciesId.VANILLUXE,
  SpeciesId.EELEKTROSS,
  SpeciesId.CHANDELURE,
  SpeciesId.MUDSDALE,
  SpeciesId.ARAQUANID,
  SpeciesId.GOLISOPOD,
  SpeciesId.HATTERENE,
  SpeciesId.GRIMMSNARL,
  SpeciesId.ARBOLIVA,
  SpeciesId.GARGANACL,
  [SpeciesId.ARMAROUGE, SpeciesId.CERULEDGE],
  SpeciesId.TINKATON,
  SpeciesId.GLIMMORA,
];
//#endregion Slot 3

//#region Slot 4

/**
 * Post-process logic for rival slot 4, fight 4
 * @remarks
 * Set level to 38 and specific forms for certain species
 * @param pokemon - The pokemon to post-process
 */
function postProcessSlot4Fight3(pokemon: EnemyPokemon): void {
  pokemon.level = SLOT_4_FIGHT_3_LEVEL;
  switch (pokemon.species.speciesId) {
    case SpeciesId.BASCULIN:
      pokemon.formIndex = 2; // White
      return;
    case SpeciesId.ROTOM:
      // Heat, Wash, Mow
      pokemon.formIndex = randSeedItem([1, 2, 5]);
      return;
    case SpeciesId.PALDEA_TAUROS:
      pokemon.formIndex = randSeedIntRange(1, 2); // Blaze, Aqua
      return;
  }
}
/** Rival's slot 4 species pool for fight 3 */
const SLOT_4_FIGHT_3 = [
  SpeciesId.CLEFABLE,
  [SpeciesId.SLOWBRO, SpeciesId.SLOWKING],
  SpeciesId.PINSIR,
  SpeciesId.LAPRAS,
  SpeciesId.SCIZOR,
  SpeciesId.HERACROSS,
  SpeciesId.SNEASEL,
  SpeciesId.GARDEVOIR,
  SpeciesId.ROSERADE,
  SpeciesId.SPIRITOMB,
  SpeciesId.LUCARIO,
  SpeciesId.DRAPION,
  SpeciesId.GALLADE,
  SpeciesId.ROTOM,
  SpeciesId.EXCADRILL,
  [SpeciesId.ZOROARK, SpeciesId.HISUI_ZOROARK],
  SpeciesId.FERROTHORN,
  SpeciesId.DURANT,
  SpeciesId.FLORGES,
  SpeciesId.DOUBLADE,
  SpeciesId.VIKAVOLT,
  SpeciesId.MIMIKYU,
  SpeciesId.DHELMISE,
  SpeciesId.POLTEAGEIST,
  SpeciesId.COPPERAJAH,
  SpeciesId.KLEAVOR,
  SpeciesId.BASCULIN,
  SpeciesId.HISUI_SNEASEL,
  SpeciesId.HISUI_QWILFISH,
  SpeciesId.PAWMOT,
  SpeciesId.CETITAN,
  SpeciesId.DONDOZO,
  SpeciesId.DUDUNSPARCE,
  SpeciesId.GHOLDENGO,
  SpeciesId.POLTCHAGEIST,
  [SpeciesId.GALAR_SLOWBRO, SpeciesId.GALAR_SLOWKING],
  SpeciesId.HISUI_ARCANINE,
  SpeciesId.PALDEA_TAUROS,
];

/**
 * Set level and and specific forms for the species in slot 4
 * @param pokemon - The pokemon to post-process
 * @param level - (default {@linkcode SLOT_4_FIGHT_4_LEVEL}) The level to set the pokemon to
 */
function postProcessSlot4Fight4(pokemon: EnemyPokemon, level = SLOT_4_FIGHT_4_LEVEL): void {
  pokemon.level = level;
  switch (pokemon.species.speciesId) {
    case SpeciesId.BASCULEGION:
      pokemon.formIndex = randSeedIntRange(0, 1);
      return;
    case SpeciesId.ROTOM:
      // Heat, Wash, Mow
      pokemon.formIndex = randSeedItem([1, 2, 5]);
      return;
    case SpeciesId.PALDEA_TAUROS:
      pokemon.formIndex = randSeedIntRange(1, 2); // Blaze, Aqua
      return;
  }
}

/** Rival's slot 4 species pool for fight 4 and beyond */
const SLOT_4_FINAL = [
  SpeciesId.CLEFABLE,
  [SpeciesId.SLOWBRO, SpeciesId.SLOWKING],
  SpeciesId.PINSIR,
  SpeciesId.LAPRAS,
  SpeciesId.SCIZOR,
  SpeciesId.HERACROSS,
  SpeciesId.WEAVILE,
  SpeciesId.GARDEVOIR,
  SpeciesId.ROSERADE,
  SpeciesId.SPIRITOMB,
  SpeciesId.LUCARIO,
  SpeciesId.DRAPION,
  SpeciesId.GALLADE,
  SpeciesId.ROTOM,
  SpeciesId.EXCADRILL,
  [SpeciesId.ZOROARK, SpeciesId.HISUI_ZOROARK],
  SpeciesId.FERROTHORN,
  SpeciesId.DURANT,
  SpeciesId.FLORGES,
  SpeciesId.AEGISLASH,
  SpeciesId.VIKAVOLT,
  SpeciesId.MIMIKYU,
  SpeciesId.DHELMISE,
  SpeciesId.POLTEAGEIST,
  SpeciesId.COPPERAJAH,
  SpeciesId.KLEAVOR,
  SpeciesId.BASCULEGION, // Ensure gender does not change
  SpeciesId.SNEASLER,
  SpeciesId.OVERQWIL,
  SpeciesId.PAWMOT,
  SpeciesId.CETITAN,
  SpeciesId.DONDOZO,
  SpeciesId.DUDUNSPARCE,
  SpeciesId.GHOLDENGO,
  SpeciesId.POLTCHAGEIST,
  [SpeciesId.GALAR_SLOWBRO, SpeciesId.GALAR_SLOWKING],
  SpeciesId.HISUI_ARCANINE,
  SpeciesId.PALDEA_TAUROS,
];
//#endregion Slot 4

//#region Slot 5
/** Rival's slot 5 species pool for fight 4 and beyond */
const SLOT_5_FINAL = [
  SpeciesId.DRAGONITE,
  SpeciesId.KINGDRA,
  SpeciesId.TYRANITAR,
  SpeciesId.SALAMENCE,
  SpeciesId.METAGROSS,
  SpeciesId.GARCHOMP,
  SpeciesId.HAXORUS,
  SpeciesId.HYDREIGON,
  SpeciesId.VOLCARONA,
  SpeciesId.GOODRA,
  SpeciesId.KOMMO_O,
  SpeciesId.DRAGAPULT,
  SpeciesId.KINGAMBIT,
  SpeciesId.BAXCALIBUR,
  SpeciesId.GHOLDENGO,
  SpeciesId.ARCHALUDON,
  SpeciesId.HYDRAPPLE,
  SpeciesId.HISUI_GOODRA,
];
//#endregion Slot 5

//#region Slot 6
/**
 * Post-process logic for rival slot 6, fight 5
 *
 * @remarks
 * Sets the level to the provided argument, sets the Pokémon to be caught in a Master Ball, sets boss
 * @param pokemon - The pokemon to post-process
 * @param level - (default {@linkcode SLOT_6_FIGHT_5_LEVEL}) The level to set the pokemon to
 * @param overrideSegments - If `true`, will force the pokemon to have 3 boss bar segments
 */
function postProcessSlot6Fight5(pokemon: EnemyPokemon, level = SLOT_6_FIGHT_5_LEVEL, overrideSegments = true): void {
  pokemon.level = level;
  pokemon.pokeball = PokeballType.MASTER_BALL;
  if (timedEventManager.getClassicTrainerShinyChance() === 0) {
    pokemon.shiny = true;
    pokemon.variant = 1;
  }
  // When called for fight 5, uses 3 segments.
  // For fight 6, uses the logic from `getEncounterBossSegments`
  pokemon.setBoss(true, overrideSegments ? 3 : undefined);
}

/**
 * Post-process logic for rival slot 6, fight 6
 *
 * @remarks
 * Applies {@linkcode postProcessSlot6Fight5} with an updated level
 * and also sets the `formIndex` to `1` for Mega Rayquaza
 * @param pokemon
 */
function postProcessSlot6Fight6(pokemon: EnemyPokemon): void {
  // Guard just in case species gets overridden
  if (pokemon.species.speciesId === SpeciesId.RAYQUAZA) {
    pokemon.formIndex = 1; // Mega
  }
  postProcessSlot6Fight5(pokemon, SLOT_6_FIGHT_6_LEVEL, false);
  pokemon.generateName();
}

/** Rival's slot 6 species pool for fight 5 and beyond */
const SLOT_6_FINAL = [SpeciesId.RAYQUAZA];
//#endregion Slot 6

export interface RivalSlotConfig {
  /**
   * The pool of `SpeciesId`s to choose from
   *
   * @remarks
   * An entry may be either a single `SpeciesId` or an array of `SpeciesId`s. An
   * array entry indicates that another roll is required, and is used for split
   * evolution lines such as Charcadet to Armarouge/Ceruledge.
   */
  readonly pool: readonly (SpeciesId | readonly SpeciesId[])[];

  /** A function that will post-process the Pokémon after it has fully generated */
  readonly postProcess: (enemyPokemon: EnemyPokemon) => void;

  /**
   * Whether to try to balance types in this slot to avoid sharing types with previous slots
   * @defaultValue `false`
   */
  readonly balanceTypes?: boolean;

  /**
   * Whether to try to balance weaknesses in this slot to avoid adding too many weaknesses to the overall party
   * @defaultValue `false`
   */
  readonly balanceWeaknesses?: boolean;
}

export type RivalPoolConfig = RivalSlotConfig[];

/** Pools for the first rival fight */
export const RIVAL_1_POOL: RivalPoolConfig = [
  { pool: SLOT_1_FIGHT_1, postProcess: forceRivalStarterTraits },
  { pool: SLOT_2_FIGHT_1, postProcess: forceRivalBirdAbility },
];

/** Pools for the second rival fight */
export const RIVAL_2_POOL: RivalPoolConfig = [
  { pool: SLOT_1_FIGHT_2, postProcess: forceRivalStarterTraits },
  { pool: SLOT_2_FIGHT_2, postProcess: forceRivalBirdAbility },
  {
    pool: SLOT_3_FIGHT_2,
    postProcess: p => (p.level = SLOT_3_FIGHT_2_LEVEL),
    balanceTypes: true,
    balanceWeaknesses: true,
  },
];

/** Pools for the third rival fight */
export const RIVAL_3_POOL: RivalPoolConfig = [
  { pool: SLOT_1_FINAL, postProcess: forceRivalStarterTraits },
  { pool: SLOT_2_FINAL, postProcess: forceRivalBirdAbility },
  {
    pool: SLOT_3_FIGHT_3,
    postProcess: p => (p.level = SLOT_3_FIGHT_3_LEVEL),
    balanceTypes: true,
    balanceWeaknesses: true,
  },
  { pool: SLOT_4_FIGHT_3, postProcess: postProcessSlot4Fight3, balanceTypes: true, balanceWeaknesses: true },
];

/** Pools for the fourth rival fight */
export const RIVAL_4_POOL: RivalPoolConfig = [
  { pool: SLOT_1_FINAL, postProcess: forceRivalStarterTraits },
  { pool: SLOT_2_FINAL, postProcess: forceRivalBirdAbility },
  {
    pool: SLOT_3_FINAL,
    postProcess: p => (p.level = SLOT_3_FIGHT_4_LEVEL),
    balanceTypes: true,
    balanceWeaknesses: true,
  },
  {
    pool: SLOT_4_FINAL,
    postProcess: p => postProcessSlot4Fight4(p, SLOT_4_FIGHT_4_LEVEL),
    balanceTypes: true,
    balanceWeaknesses: true,
  },
  { pool: SLOT_5_FINAL, postProcess: p => (p.level = SLOT_5_FIGHT_4_LEVEL) },
];

/** Pools for the fifth rival fight */
export const RIVAL_5_POOL: RivalPoolConfig = [
  { pool: SLOT_1_FINAL, postProcess: p => forceRivalStarterTraits(p, 2) },
  { pool: SLOT_2_FINAL, postProcess: forceRivalBirdAbility },
  {
    pool: SLOT_3_FINAL,
    postProcess: p => (p.level = SLOT_3_FIGHT_5_LEVEL),
    balanceTypes: true,
    balanceWeaknesses: true,
  },
  {
    pool: SLOT_4_FINAL,
    postProcess: p => postProcessSlot4Fight4(p, SLOT_4_FIGHT_5_LEVEL),
    balanceTypes: true,
    balanceWeaknesses: true,
  },
  { pool: SLOT_5_FINAL, postProcess: p => (p.level = SLOT_5_FIGHT_5_LEVEL) },
  { pool: SLOT_6_FINAL, postProcess: postProcessSlot6Fight5 },
];

/** Pools for the sixth rival fight */
export const RIVAL_6_POOL: RivalPoolConfig = [
  { pool: SLOT_1_FINAL, postProcess: p => forceRivalStarterTraits(p, 3) },
  { pool: SLOT_2_FINAL, postProcess: p => forceRivalBirdAbility(p, 2) },
  {
    pool: SLOT_3_FINAL,
    postProcess: p => (p.level = SLOT_3_FIGHT_6_LEVEL),
    balanceTypes: true,
    balanceWeaknesses: true,
  },
  {
    pool: SLOT_4_FINAL,
    postProcess: p => postProcessSlot4Fight4(p, SLOT_4_FIGHT_6_LEVEL),
    balanceTypes: true,
    balanceWeaknesses: true,
  },
  { pool: SLOT_5_FINAL, postProcess: p => (p.level = SLOT_5_FIGHT_6_LEVEL) },
  { pool: SLOT_6_FINAL, postProcess: postProcessSlot6Fight6 },
];
