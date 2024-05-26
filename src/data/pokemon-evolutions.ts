import { Gender } from "./gender";
import { FlinchChanceModifier } from "../modifier/modifier";
import { Moves } from "./enums/moves";
import { PokeballType } from "./pokeball";
import Pokemon from "../field/pokemon";
import { Stat } from "./pokemon-stat";
import { Species } from "./enums/species";
import { Type } from "./type";
import * as Utils from "../utils";
import { SpeciesFormKey } from "./pokemon-species";
import { WeatherType } from "./weather";
import { Biome } from "./enums/biome";
import { TimeOfDay } from "./enums/time-of-day";
import { Nature } from "./nature";

export enum SpeciesWildEvolutionDelay {
  NONE,
  SHORT,
  MEDIUM,
  LONG,
  VERY_LONG
}

export enum EvolutionItem {
  NONE,

  LINKING_CORD,
  SUN_STONE,
  MOON_STONE,
  LEAF_STONE,
  FIRE_STONE,
  WATER_STONE,
  THUNDER_STONE,
  ICE_STONE,
  DUSK_STONE,
  DAWN_STONE,
  SHINY_STONE,
  CRACKED_POT,
  SWEET_APPLE,
  TART_APPLE,
  STRAWBERRY_SWEET,
  UNREMARKABLE_TEACUP,

  CHIPPED_POT = 51,
  BLACK_AUGURITE,
  GALARICA_CUFF,
  GALARICA_WREATH,
  PEAT_BLOCK,
  AUSPICIOUS_ARMOR,
  MALICIOUS_ARMOR,
  MASTERPIECE_TEACUP,
  METAL_ALLOY,
  SCROLL_OF_DARKNESS,
  SCROLL_OF_WATERS,
  SYRUPY_APPLE
}

export type EvolutionConditionPredicate = (p: Pokemon) => boolean;
export type EvolutionConditionEnforceFunc = (p: Pokemon) => void;

export class SpeciesFormEvolution {
  public speciesId: Species;
  public preFormKey: string;
  public evoFormKey: string;
  public level: integer;
  public item: EvolutionItem;
  public condition: SpeciesEvolutionCondition;
  public wildDelay: SpeciesWildEvolutionDelay;

  constructor(speciesId: Species, preFormKey: string, evoFormKey: string, level: integer, item: EvolutionItem, condition: SpeciesEvolutionCondition, wildDelay?: SpeciesWildEvolutionDelay) {
    this.speciesId = speciesId;
    this.preFormKey = preFormKey;
    this.evoFormKey = evoFormKey;
    this.level = level;
    this.item = item || EvolutionItem.NONE;
    this.condition = condition;
    this.wildDelay = wildDelay || SpeciesWildEvolutionDelay.NONE;
  }
}

export class SpeciesEvolution extends SpeciesFormEvolution {
  constructor(speciesId: Species, level: integer, item: EvolutionItem, condition: SpeciesEvolutionCondition, wildDelay?: SpeciesWildEvolutionDelay) {
    super(speciesId, null, null, level, item, condition, wildDelay);
  }
}

export class FusionSpeciesFormEvolution extends SpeciesFormEvolution {
  public primarySpeciesId: Species;

  constructor(primarySpeciesId: Species, evolution: SpeciesFormEvolution) {
    super(evolution.speciesId, evolution.preFormKey, evolution.evoFormKey, evolution.level, evolution.item, evolution.condition, evolution.wildDelay);

    this.primarySpeciesId = primarySpeciesId;
  }
}

export class SpeciesEvolutionCondition {
  public predicate: EvolutionConditionPredicate;
  public enforceFunc: EvolutionConditionEnforceFunc;

  constructor(predicate: EvolutionConditionPredicate, enforceFunc?: EvolutionConditionEnforceFunc) {
    this.predicate = predicate;
    this.enforceFunc = enforceFunc;
  }
}

export class SpeciesFriendshipEvolutionCondition extends SpeciesEvolutionCondition {
  constructor(friendshipAmount: integer, predicate?: EvolutionConditionPredicate, enforceFunc?: EvolutionConditionEnforceFunc) {
    super(p => p.friendship >= friendshipAmount && (!predicate || predicate(p)), enforceFunc);
  }
}

interface PokemonEvolutions {
  [key: string]: SpeciesFormEvolution[]
}

export const pokemonEvolutions: PokemonEvolutions = {
  [Species.BULBASAUR]: [
    new SpeciesEvolution(Species.IVYSAUR, 16, null, null)
  ],
  [Species.IVYSAUR]: [
    new SpeciesEvolution(Species.VENUSAUR, 32, null, null)
  ],
  [Species.CHARMANDER]: [
    new SpeciesEvolution(Species.CHARMELEON, 16, null, null)
  ],
  [Species.CHARMELEON]: [
    new SpeciesEvolution(Species.CHARIZARD, 36, null, null)
  ],
  [Species.SQUIRTLE]: [
    new SpeciesEvolution(Species.WARTORTLE, 16, null, null)
  ],
  [Species.WARTORTLE]: [
    new SpeciesEvolution(Species.BLASTOISE, 36, null, null)
  ],
  [Species.CATERPIE]: [
    new SpeciesEvolution(Species.METAPOD, 7, null, null)
  ],
  [Species.METAPOD]: [
    new SpeciesEvolution(Species.BUTTERFREE, 10, null, null)
  ],
  [Species.WEEDLE]: [
    new SpeciesEvolution(Species.KAKUNA, 7, null, null)
  ],
  [Species.KAKUNA]: [
    new SpeciesEvolution(Species.BEEDRILL, 10, null, null)
  ],
  [Species.PIDGEY]: [
    new SpeciesEvolution(Species.PIDGEOTTO, 18, null, null)
  ],
  [Species.PIDGEOTTO]: [
    new SpeciesEvolution(Species.PIDGEOT, 36, null, null)
  ],
  [Species.RATTATA]: [
    new SpeciesEvolution(Species.RATICATE, 20, null, null)
  ],
  [Species.SPEAROW]: [
    new SpeciesEvolution(Species.FEAROW, 20, null, null)
  ],
  [Species.EKANS]: [
    new SpeciesEvolution(Species.ARBOK, 22, null, null)
  ],
  [Species.SANDSHREW]: [
    new SpeciesEvolution(Species.SANDSLASH, 22, null, null)
  ],
  [Species.NIDORAN_F]: [
    new SpeciesEvolution(Species.NIDORINA, 16, null, null)
  ],
  [Species.NIDORAN_M]: [
    new SpeciesEvolution(Species.NIDORINO, 16, null, null)
  ],
  [Species.ZUBAT]: [
    new SpeciesEvolution(Species.GOLBAT, 22, null, null)
  ],
  [Species.ODDISH]: [
    new SpeciesEvolution(Species.GLOOM, 21, null, null)
  ],
  [Species.PARAS]: [
    new SpeciesEvolution(Species.PARASECT, 24, null, null)
  ],
  [Species.VENONAT]: [
    new SpeciesEvolution(Species.VENOMOTH, 31, null, null)
  ],
  [Species.DIGLETT]: [
    new SpeciesEvolution(Species.DUGTRIO, 26, null, null)
  ],
  [Species.MEOWTH]: [
    new SpeciesFormEvolution(Species.PERSIAN, "", "", 28, null, null)
  ],
  [Species.PSYDUCK]: [
    new SpeciesEvolution(Species.GOLDUCK, 33, null, null)
  ],
  [Species.MANKEY]: [
    new SpeciesEvolution(Species.PRIMEAPE, 28, null, null)
  ],
  [Species.POLIWAG]: [
    new SpeciesEvolution(Species.POLIWHIRL, 25, null, null)
  ],
  [Species.ABRA]: [
    new SpeciesEvolution(Species.KADABRA, 16, null, null)
  ],
  [Species.MACHOP]: [
    new SpeciesEvolution(Species.MACHOKE, 28, null, null)
  ],
  [Species.BELLSPROUT]: [
    new SpeciesEvolution(Species.WEEPINBELL, 21, null, null)
  ],
  [Species.TENTACOOL]: [
    new SpeciesEvolution(Species.TENTACRUEL, 30, null, null)
  ],
  [Species.GEODUDE]: [
    new SpeciesEvolution(Species.GRAVELER, 25, null, null)
  ],
  [Species.PONYTA]: [
    new SpeciesEvolution(Species.RAPIDASH, 40, null, null)
  ],
  [Species.SLOWPOKE]: [
    new SpeciesEvolution(Species.SLOWBRO, 37, null, null),
    new SpeciesEvolution(Species.SLOWKING, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(p => !!p.scene.findModifier(m => (m instanceof FlinchChanceModifier) && (m as FlinchChanceModifier).pokemonId === p.id, true)), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.MAGNEMITE]: [
    new SpeciesEvolution(Species.MAGNETON, 30, null, null)
  ],
  [Species.DODUO]: [
    new SpeciesEvolution(Species.DODRIO, 31, null, null)
  ],
  [Species.SEEL]: [
    new SpeciesEvolution(Species.DEWGONG, 34, null, null)
  ],
  [Species.GRIMER]: [
    new SpeciesEvolution(Species.MUK, 38, null, null)
  ],
  [Species.GASTLY]: [
    new SpeciesEvolution(Species.HAUNTER, 25, null, null)
  ],
  [Species.DROWZEE]: [
    new SpeciesEvolution(Species.HYPNO, 26, null, null)
  ],
  [Species.KRABBY]: [
    new SpeciesEvolution(Species.KINGLER, 28, null, null)
  ],
  [Species.VOLTORB]: [
    new SpeciesEvolution(Species.ELECTRODE, 30, null, null)
  ],
  [Species.CUBONE]: [
    new SpeciesEvolution(Species.ALOLA_MAROWAK, 28, null, new SpeciesEvolutionCondition(p => p.scene.arena.biomeType === Biome.ISLAND || p.scene.arena.biomeType === Biome.BEACH), SpeciesWildEvolutionDelay.MEDIUM),
    new SpeciesEvolution(Species.MAROWAK, 28, null, null)
  ],
  [Species.TYROGUE]: [
    new SpeciesEvolution(Species.HITMONLEE, 20, null, new SpeciesEvolutionCondition(p => p.stats[Stat.ATK] > p.stats[Stat.DEF])),
    new SpeciesEvolution(Species.HITMONCHAN, 20, null, new SpeciesEvolutionCondition(p => p.stats[Stat.ATK] < p.stats[Stat.DEF])),
    new SpeciesEvolution(Species.HITMONTOP, 20, null, new SpeciesEvolutionCondition(p => p.stats[Stat.ATK] === p.stats[Stat.DEF]))
  ],
  [Species.KOFFING]: [
    new SpeciesEvolution(Species.GALAR_WEEZING, 35, null, new SpeciesEvolutionCondition(p => p.scene.arena.biomeType === Biome.METROPOLIS || p.scene.arena.biomeType === Biome.SLUM), SpeciesWildEvolutionDelay.MEDIUM),
    new SpeciesEvolution(Species.WEEZING, 35, null, null)
  ],
  [Species.RHYHORN]: [
    new SpeciesEvolution(Species.RHYDON, 42, null, null)
  ],
  [Species.HORSEA]: [
    new SpeciesEvolution(Species.SEADRA, 32, null, null)
  ],
  [Species.GOLDEEN]: [
    new SpeciesEvolution(Species.SEAKING, 33, null, null)
  ],
  [Species.SMOOCHUM]: [
    new SpeciesEvolution(Species.JYNX, 30, null, null)
  ],
  [Species.ELEKID]: [
    new SpeciesEvolution(Species.ELECTABUZZ, 30, null, null)
  ],
  [Species.MAGBY]: [
    new SpeciesEvolution(Species.MAGMAR, 30, null, null)
  ],
  [Species.MAGIKARP]: [
    new SpeciesEvolution(Species.GYARADOS, 20, null, null)
  ],
  [Species.OMANYTE]: [
    new SpeciesEvolution(Species.OMASTAR, 40, null, null)
  ],
  [Species.KABUTO]: [
    new SpeciesEvolution(Species.KABUTOPS, 40, null, null)
  ],
  [Species.DRATINI]: [
    new SpeciesEvolution(Species.DRAGONAIR, 30, null, null)
  ],
  [Species.DRAGONAIR]: [
    new SpeciesEvolution(Species.DRAGONITE, 55, null, null)
  ],
  [Species.CHIKORITA]: [
    new SpeciesEvolution(Species.BAYLEEF, 16, null, null)
  ],
  [Species.BAYLEEF]: [
    new SpeciesEvolution(Species.MEGANIUM, 32, null, null)
  ],
  [Species.CYNDAQUIL]: [
    new SpeciesEvolution(Species.QUILAVA, 14, null, null)
  ],
  [Species.QUILAVA]: [
    new SpeciesEvolution(Species.HISUI_TYPHLOSION, 36, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DUSK || p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), SpeciesWildEvolutionDelay.LONG),
    new SpeciesEvolution(Species.TYPHLOSION, 36, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAWN || p.scene.arena.getTimeOfDay() === TimeOfDay.DAY))
  ],
  [Species.TOTODILE]: [
    new SpeciesEvolution(Species.CROCONAW, 18, null, null)
  ],
  [Species.CROCONAW]: [
    new SpeciesEvolution(Species.FERALIGATR, 30, null, null)
  ],
  [Species.SENTRET]: [
    new SpeciesEvolution(Species.FURRET, 15, null, null)
  ],
  [Species.HOOTHOOT]: [
    new SpeciesEvolution(Species.NOCTOWL, 20, null, null)
  ],
  [Species.LEDYBA]: [
    new SpeciesEvolution(Species.LEDIAN, 18, null, null)
  ],
  [Species.SPINARAK]: [
    new SpeciesEvolution(Species.ARIADOS, 22, null, null)
  ],
  [Species.CHINCHOU]: [
    new SpeciesEvolution(Species.LANTURN, 27, null, null)
  ],
  [Species.NATU]: [
    new SpeciesEvolution(Species.XATU, 25, null, null)
  ],
  [Species.MAREEP]: [
    new SpeciesEvolution(Species.FLAAFFY, 15, null, null)
  ],
  [Species.FLAAFFY]: [
    new SpeciesEvolution(Species.AMPHAROS, 30, null, null)
  ],
  [Species.MARILL]: [
    new SpeciesEvolution(Species.AZUMARILL, 18, null, null)
  ],
  [Species.HOPPIP]: [
    new SpeciesEvolution(Species.SKIPLOOM, 18, null, null)
  ],
  [Species.SKIPLOOM]: [
    new SpeciesEvolution(Species.JUMPLUFF, 27, null, null)
  ],
  [Species.WOOPER]: [
    new SpeciesEvolution(Species.QUAGSIRE, 20, null, null)
  ],
  [Species.WYNAUT]: [
    new SpeciesEvolution(Species.WOBBUFFET, 15, null, null)
  ],
  [Species.PINECO]: [
    new SpeciesEvolution(Species.FORRETRESS, 31, null, null)
  ],
  [Species.SNUBBULL]: [
    new SpeciesEvolution(Species.GRANBULL, 23, null, null)
  ],
  [Species.TEDDIURSA]: [
    new SpeciesEvolution(Species.URSARING, 30, null, null)
  ],
  [Species.SLUGMA]: [
    new SpeciesEvolution(Species.MAGCARGO, 38, null, null)
  ],
  [Species.SWINUB]: [
    new SpeciesEvolution(Species.PILOSWINE, 33, null, null)
  ],
  [Species.REMORAID]: [
    new SpeciesEvolution(Species.OCTILLERY, 25, null, null)
  ],
  [Species.HOUNDOUR]: [
    new SpeciesEvolution(Species.HOUNDOOM, 24, null, null)
  ],
  [Species.PHANPY]: [
    new SpeciesEvolution(Species.DONPHAN, 25, null, null)
  ],
  [Species.LARVITAR]: [
    new SpeciesEvolution(Species.PUPITAR, 30, null, null)
  ],
  [Species.PUPITAR]: [
    new SpeciesEvolution(Species.TYRANITAR, 55, null, null)
  ],
  [Species.TREECKO]: [
    new SpeciesEvolution(Species.GROVYLE, 16, null, null)
  ],
  [Species.GROVYLE]: [
    new SpeciesEvolution(Species.SCEPTILE, 36, null, null)
  ],
  [Species.TORCHIC]: [
    new SpeciesEvolution(Species.COMBUSKEN, 16, null, null)
  ],
  [Species.COMBUSKEN]: [
    new SpeciesEvolution(Species.BLAZIKEN, 36, null, null)
  ],
  [Species.MUDKIP]: [
    new SpeciesEvolution(Species.MARSHTOMP, 16, null, null)
  ],
  [Species.MARSHTOMP]: [
    new SpeciesEvolution(Species.SWAMPERT, 36, null, null)
  ],
  [Species.POOCHYENA]: [
    new SpeciesEvolution(Species.MIGHTYENA, 18, null, null)
  ],
  [Species.ZIGZAGOON]: [
    new SpeciesEvolution(Species.LINOONE, 20, null, null)
  ],
  [Species.WURMPLE]: [
    new SpeciesEvolution(Species.SILCOON, 7, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAWN || p.scene.arena.getTimeOfDay() === TimeOfDay.DAY), null),
    new SpeciesEvolution(Species.CASCOON, 7, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DUSK || p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), null)
  ],
  [Species.SILCOON]: [
    new SpeciesEvolution(Species.BEAUTIFLY, 10, null, null)
  ],
  [Species.CASCOON]: [
    new SpeciesEvolution(Species.DUSTOX, 10, null, null)
  ],
  [Species.LOTAD]: [
    new SpeciesEvolution(Species.LOMBRE, 14, null, null)
  ],
  [Species.SEEDOT]: [
    new SpeciesEvolution(Species.NUZLEAF, 14, null, null)
  ],
  [Species.TAILLOW]: [
    new SpeciesEvolution(Species.SWELLOW, 22, null, null)
  ],
  [Species.WINGULL]: [
    new SpeciesEvolution(Species.PELIPPER, 25, null, null)
  ],
  [Species.RALTS]: [
    new SpeciesEvolution(Species.KIRLIA, 20, null, null)
  ],
  [Species.KIRLIA]: [
    new SpeciesEvolution(Species.GARDEVOIR, 30, null, new SpeciesEvolutionCondition(p => p.gender === Gender.FEMALE, p => p.gender = Gender.FEMALE)),
    new SpeciesEvolution(Species.GALLADE, 30, null, new SpeciesEvolutionCondition(p => p.gender === Gender.MALE, p => p.gender = Gender.MALE))
  ],
  [Species.SURSKIT]: [
    new SpeciesEvolution(Species.MASQUERAIN, 22, null, null)
  ],
  [Species.SHROOMISH]: [
    new SpeciesEvolution(Species.BRELOOM, 23, null, null)
  ],
  [Species.SLAKOTH]: [
    new SpeciesEvolution(Species.VIGOROTH, 18, null, null)
  ],
  [Species.VIGOROTH]: [
    new SpeciesEvolution(Species.SLAKING, 36, null, null)
  ],
  [Species.NINCADA]: [
    new SpeciesEvolution(Species.NINJASK, 20, null, null),
    new SpeciesEvolution(Species.SHEDINJA, 20, null, new SpeciesEvolutionCondition(p => p.scene.getParty().length < 6 && p.scene.pokeballCounts[PokeballType.POKEBALL] > 0))
  ],
  [Species.WHISMUR]: [
    new SpeciesEvolution(Species.LOUDRED, 20, null, null)
  ],
  [Species.LOUDRED]: [
    new SpeciesEvolution(Species.EXPLOUD, 40, null, null)
  ],
  [Species.MAKUHITA]: [
    new SpeciesEvolution(Species.HARIYAMA, 24, null, null)
  ],
  [Species.ARON]: [
    new SpeciesEvolution(Species.LAIRON, 32, null, null)
  ],
  [Species.LAIRON]: [
    new SpeciesEvolution(Species.AGGRON, 42, null, null)
  ],
  [Species.MEDITITE]: [
    new SpeciesEvolution(Species.MEDICHAM, 37, null, null)
  ],
  [Species.ELECTRIKE]: [
    new SpeciesEvolution(Species.MANECTRIC, 26, null, null)
  ],
  [Species.GULPIN]: [
    new SpeciesEvolution(Species.SWALOT, 26, null, null)
  ],
  [Species.CARVANHA]: [
    new SpeciesEvolution(Species.SHARPEDO, 30, null, null)
  ],
  [Species.WAILMER]: [
    new SpeciesEvolution(Species.WAILORD, 40, null, null)
  ],
  [Species.NUMEL]: [
    new SpeciesEvolution(Species.CAMERUPT, 33, null, null)
  ],
  [Species.SPOINK]: [
    new SpeciesEvolution(Species.GRUMPIG, 32, null, null)
  ],
  [Species.TRAPINCH]: [
    new SpeciesEvolution(Species.VIBRAVA, 35, null, null)
  ],
  [Species.VIBRAVA]: [
    new SpeciesEvolution(Species.FLYGON, 45, null, null)
  ],
  [Species.CACNEA]: [
    new SpeciesEvolution(Species.CACTURNE, 32, null, null)
  ],
  [Species.SWABLU]: [
    new SpeciesEvolution(Species.ALTARIA, 35, null, null)
  ],
  [Species.BARBOACH]: [
    new SpeciesEvolution(Species.WHISCASH, 30, null, null)
  ],
  [Species.CORPHISH]: [
    new SpeciesEvolution(Species.CRAWDAUNT, 30, null, null)
  ],
  [Species.BALTOY]: [
    new SpeciesEvolution(Species.CLAYDOL, 36, null, null)
  ],
  [Species.LILEEP]: [
    new SpeciesEvolution(Species.CRADILY, 40, null, null)
  ],
  [Species.ANORITH]: [
    new SpeciesEvolution(Species.ARMALDO, 40, null, null)
  ],
  [Species.SHUPPET]: [
    new SpeciesEvolution(Species.BANETTE, 37, null, null)
  ],
  [Species.DUSKULL]: [
    new SpeciesEvolution(Species.DUSCLOPS, 37, null, null)
  ],
  [Species.SNORUNT]: [
    new SpeciesEvolution(Species.GLALIE, 42, null, new SpeciesEvolutionCondition(p => p.gender === Gender.MALE, p => p.gender = Gender.MALE)),
    new SpeciesEvolution(Species.FROSLASS, 42, null, new SpeciesEvolutionCondition(p => p.gender === Gender.FEMALE, p => p.gender = Gender.FEMALE))
  ],
  [Species.SPHEAL]: [
    new SpeciesEvolution(Species.SEALEO, 32, null, null)
  ],
  [Species.SEALEO]: [
    new SpeciesEvolution(Species.WALREIN, 44, null, null)
  ],
  [Species.BAGON]: [
    new SpeciesEvolution(Species.SHELGON, 30, null, null)
  ],
  [Species.SHELGON]: [
    new SpeciesEvolution(Species.SALAMENCE, 50, null, null)
  ],
  [Species.BELDUM]: [
    new SpeciesEvolution(Species.METANG, 20, null, null)
  ],
  [Species.METANG]: [
    new SpeciesEvolution(Species.METAGROSS, 45, null, null)
  ],
  [Species.TURTWIG]: [
    new SpeciesEvolution(Species.GROTLE, 18, null, null)
  ],
  [Species.GROTLE]: [
    new SpeciesEvolution(Species.TORTERRA, 32, null, null)
  ],
  [Species.CHIMCHAR]: [
    new SpeciesEvolution(Species.MONFERNO, 14, null, null)
  ],
  [Species.MONFERNO]: [
    new SpeciesEvolution(Species.INFERNAPE, 36, null, null)
  ],
  [Species.PIPLUP]: [
    new SpeciesEvolution(Species.PRINPLUP, 16, null, null)
  ],
  [Species.PRINPLUP]: [
    new SpeciesEvolution(Species.EMPOLEON, 36, null, null)
  ],
  [Species.STARLY]: [
    new SpeciesEvolution(Species.STARAVIA, 14, null, null)
  ],
  [Species.STARAVIA]: [
    new SpeciesEvolution(Species.STARAPTOR, 34, null, null)
  ],
  [Species.BIDOOF]: [
    new SpeciesEvolution(Species.BIBAREL, 15, null, null)
  ],
  [Species.KRICKETOT]: [
    new SpeciesEvolution(Species.KRICKETUNE, 10, null, null)
  ],
  [Species.SHINX]: [
    new SpeciesEvolution(Species.LUXIO, 15, null, null)
  ],
  [Species.LUXIO]: [
    new SpeciesEvolution(Species.LUXRAY, 30, null, null)
  ],
  [Species.CRANIDOS]: [
    new SpeciesEvolution(Species.RAMPARDOS, 30, null, null)
  ],
  [Species.SHIELDON]: [
    new SpeciesEvolution(Species.BASTIODON, 30, null, null)
  ],
  [Species.BURMY]: [
    new SpeciesEvolution(Species.MOTHIM, 20, null, new SpeciesEvolutionCondition(p => p.gender === Gender.MALE, p => p.gender = Gender.MALE)),
    new SpeciesEvolution(Species.WORMADAM, 20, null, new SpeciesEvolutionCondition(p => p.gender === Gender.FEMALE, p => p.gender = Gender.FEMALE))
  ],
  [Species.COMBEE]: [
    new SpeciesEvolution(Species.VESPIQUEN, 21, null, new SpeciesEvolutionCondition(p => p.gender === Gender.FEMALE, p => p.gender = Gender.FEMALE))
  ],
  [Species.BUIZEL]: [
    new SpeciesEvolution(Species.FLOATZEL, 26, null, null)
  ],
  [Species.CHERUBI]: [
    new SpeciesEvolution(Species.CHERRIM, 25, null, null)
  ],
  [Species.SHELLOS]: [
    new SpeciesEvolution(Species.GASTRODON, 30, null, null)
  ],
  [Species.DRIFLOON]: [
    new SpeciesEvolution(Species.DRIFBLIM, 28, null, null)
  ],
  [Species.GLAMEOW]: [
    new SpeciesEvolution(Species.PURUGLY, 38, null, null)
  ],
  [Species.STUNKY]: [
    new SpeciesEvolution(Species.SKUNTANK, 34, null, null)
  ],
  [Species.BRONZOR]: [
    new SpeciesEvolution(Species.BRONZONG, 33, null, null)
  ],
  [Species.GIBLE]: [
    new SpeciesEvolution(Species.GABITE, 24, null, null)
  ],
  [Species.GABITE]: [
    new SpeciesEvolution(Species.GARCHOMP, 48, null, null)
  ],
  [Species.HIPPOPOTAS]: [
    new SpeciesEvolution(Species.HIPPOWDON, 34, null, null)
  ],
  [Species.SKORUPI]: [
    new SpeciesEvolution(Species.DRAPION, 40, null, null)
  ],
  [Species.CROAGUNK]: [
    new SpeciesEvolution(Species.TOXICROAK, 37, null, null)
  ],
  [Species.FINNEON]: [
    new SpeciesEvolution(Species.LUMINEON, 31, null, null)
  ],
  [Species.MANTYKE]: [
    new SpeciesEvolution(Species.MANTINE, 32, null, new SpeciesEvolutionCondition(p => !!p.scene.gameData.dexData[Species.REMORAID].caughtAttr), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.SNOVER]: [
    new SpeciesEvolution(Species.ABOMASNOW, 40, null, null)
  ],
  [Species.SNIVY]: [
    new SpeciesEvolution(Species.SERVINE, 17, null, null)
  ],
  [Species.SERVINE]: [
    new SpeciesEvolution(Species.SERPERIOR, 36, null, null)
  ],
  [Species.TEPIG]: [
    new SpeciesEvolution(Species.PIGNITE, 17, null, null)
  ],
  [Species.PIGNITE]: [
    new SpeciesEvolution(Species.EMBOAR, 36, null, null)
  ],
  [Species.OSHAWOTT]: [
    new SpeciesEvolution(Species.DEWOTT, 17, null, null)
  ],
  [Species.DEWOTT]: [
    new SpeciesEvolution(Species.HISUI_SAMUROTT, 36, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DUSK || p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), SpeciesWildEvolutionDelay.LONG),
    new SpeciesEvolution(Species.SAMUROTT, 36, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAWN || p.scene.arena.getTimeOfDay() === TimeOfDay.DAY))
  ],
  [Species.PATRAT]: [
    new SpeciesEvolution(Species.WATCHOG, 20, null, null)
  ],
  [Species.LILLIPUP]: [
    new SpeciesEvolution(Species.HERDIER, 16, null, null)
  ],
  [Species.HERDIER]: [
    new SpeciesEvolution(Species.STOUTLAND, 32, null, null)
  ],
  [Species.PURRLOIN]: [
    new SpeciesEvolution(Species.LIEPARD, 20, null, null)
  ],
  [Species.PIDOVE]: [
    new SpeciesEvolution(Species.TRANQUILL, 21, null, null)
  ],
  [Species.TRANQUILL]: [
    new SpeciesEvolution(Species.UNFEZANT, 32, null, null)
  ],
  [Species.BLITZLE]: [
    new SpeciesEvolution(Species.ZEBSTRIKA, 27, null, null)
  ],
  [Species.ROGGENROLA]: [
    new SpeciesEvolution(Species.BOLDORE, 25, null, null)
  ],
  [Species.DRILBUR]: [
    new SpeciesEvolution(Species.EXCADRILL, 31, null, null)
  ],
  [Species.TIMBURR]: [
    new SpeciesEvolution(Species.GURDURR, 25, null, null)
  ],
  [Species.TYMPOLE]: [
    new SpeciesEvolution(Species.PALPITOAD, 25, null, null)
  ],
  [Species.PALPITOAD]: [
    new SpeciesEvolution(Species.SEISMITOAD, 36, null, null)
  ],
  [Species.SEWADDLE]: [
    new SpeciesEvolution(Species.SWADLOON, 20, null, null)
  ],
  [Species.VENIPEDE]: [
    new SpeciesEvolution(Species.WHIRLIPEDE, 22, null, null)
  ],
  [Species.WHIRLIPEDE]: [
    new SpeciesEvolution(Species.SCOLIPEDE, 30, null, null)
  ],
  [Species.SANDILE]: [
    new SpeciesEvolution(Species.KROKOROK, 29, null, null)
  ],
  [Species.KROKOROK]: [
    new SpeciesEvolution(Species.KROOKODILE, 40, null, null)
  ],
  [Species.DARUMAKA]: [
    new SpeciesEvolution(Species.DARMANITAN, 35, null, null)
  ],
  [Species.DWEBBLE]: [
    new SpeciesEvolution(Species.CRUSTLE, 34, null, null)
  ],
  [Species.SCRAGGY]: [
    new SpeciesEvolution(Species.SCRAFTY, 39, null, null)
  ],
  [Species.YAMASK]: [
    new SpeciesEvolution(Species.COFAGRIGUS, 34, null, null)
  ],
  [Species.TIRTOUGA]: [
    new SpeciesEvolution(Species.CARRACOSTA, 37, null, null)
  ],
  [Species.ARCHEN]: [
    new SpeciesEvolution(Species.ARCHEOPS, 37, null, null)
  ],
  [Species.TRUBBISH]: [
    new SpeciesEvolution(Species.GARBODOR, 36, null, null)
  ],
  [Species.ZORUA]: [
    new SpeciesEvolution(Species.ZOROARK, 30, null, null)
  ],
  [Species.GOTHITA]: [
    new SpeciesEvolution(Species.GOTHORITA, 32, null, null)
  ],
  [Species.GOTHORITA]: [
    new SpeciesEvolution(Species.GOTHITELLE, 41, null, null)
  ],
  [Species.SOLOSIS]: [
    new SpeciesEvolution(Species.DUOSION, 32, null, null)
  ],
  [Species.DUOSION]: [
    new SpeciesEvolution(Species.REUNICLUS, 41, null, null)
  ],
  [Species.DUCKLETT]: [
    new SpeciesEvolution(Species.SWANNA, 35, null, null)
  ],
  [Species.VANILLITE]: [
    new SpeciesEvolution(Species.VANILLISH, 35, null, null)
  ],
  [Species.VANILLISH]: [
    new SpeciesEvolution(Species.VANILLUXE, 47, null, null)
  ],
  [Species.DEERLING]: [
    new SpeciesEvolution(Species.SAWSBUCK, 34, null, null)
  ],
  [Species.FOONGUS]: [
    new SpeciesEvolution(Species.AMOONGUSS, 39, null, null)
  ],
  [Species.FRILLISH]: [
    new SpeciesEvolution(Species.JELLICENT, 40, null, null)
  ],
  [Species.JOLTIK]: [
    new SpeciesEvolution(Species.GALVANTULA, 36, null, null)
  ],
  [Species.FERROSEED]: [
    new SpeciesEvolution(Species.FERROTHORN, 40, null, null)
  ],
  [Species.KLINK]: [
    new SpeciesEvolution(Species.KLANG, 38, null, null)
  ],
  [Species.KLANG]: [
    new SpeciesEvolution(Species.KLINKLANG, 49, null, null)
  ],
  [Species.TYNAMO]: [
    new SpeciesEvolution(Species.EELEKTRIK, 39, null, null)
  ],
  [Species.ELGYEM]: [
    new SpeciesEvolution(Species.BEHEEYEM, 42, null, null)
  ],
  [Species.LITWICK]: [
    new SpeciesEvolution(Species.LAMPENT, 41, null, null)
  ],
  [Species.AXEW]: [
    new SpeciesEvolution(Species.FRAXURE, 38, null, null)
  ],
  [Species.FRAXURE]: [
    new SpeciesEvolution(Species.HAXORUS, 48, null, null)
  ],
  [Species.CUBCHOO]: [
    new SpeciesEvolution(Species.BEARTIC, 37, null, null)
  ],
  [Species.MIENFOO]: [
    new SpeciesEvolution(Species.MIENSHAO, 50, null, null)
  ],
  [Species.GOLETT]: [
    new SpeciesEvolution(Species.GOLURK, 43, null, null)
  ],
  [Species.PAWNIARD]: [
    new SpeciesEvolution(Species.BISHARP, 52, null, null)
  ],
  [Species.BISHARP]: [
    new SpeciesEvolution(Species.KINGAMBIT, 64, null, null)
  ],
  [Species.RUFFLET]: [
    new SpeciesEvolution(Species.HISUI_BRAVIARY, 54, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DUSK || p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), SpeciesWildEvolutionDelay.LONG),
    new SpeciesEvolution(Species.BRAVIARY, 54, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAWN || p.scene.arena.getTimeOfDay() === TimeOfDay.DAY))
  ],
  [Species.VULLABY]: [
    new SpeciesEvolution(Species.MANDIBUZZ, 54, null, null)
  ],
  [Species.DEINO]: [
    new SpeciesEvolution(Species.ZWEILOUS, 50, null, null)
  ],
  [Species.ZWEILOUS]: [
    new SpeciesEvolution(Species.HYDREIGON, 64, null, null)
  ],
  [Species.LARVESTA]: [
    new SpeciesEvolution(Species.VOLCARONA, 59, null, null)
  ],
  [Species.CHESPIN]: [
    new SpeciesEvolution(Species.QUILLADIN, 16, null, null)
  ],
  [Species.QUILLADIN]: [
    new SpeciesEvolution(Species.CHESNAUGHT, 36, null, null)
  ],
  [Species.FENNEKIN]: [
    new SpeciesEvolution(Species.BRAIXEN, 16, null, null)
  ],
  [Species.BRAIXEN]: [
    new SpeciesEvolution(Species.DELPHOX, 36, null, null)
  ],
  [Species.FROAKIE]: [
    new SpeciesEvolution(Species.FROGADIER, 16, null, null)
  ],
  [Species.FROGADIER]: [
    new SpeciesEvolution(Species.GRENINJA, 36, null, null)
  ],
  [Species.BUNNELBY]: [
    new SpeciesEvolution(Species.DIGGERSBY, 20, null, null)
  ],
  [Species.FLETCHLING]: [
    new SpeciesEvolution(Species.FLETCHINDER, 17, null, null)
  ],
  [Species.FLETCHINDER]: [
    new SpeciesEvolution(Species.TALONFLAME, 35, null, null)
  ],
  [Species.SCATTERBUG]: [
    new SpeciesEvolution(Species.SPEWPA, 9, null, null)
  ],
  [Species.SPEWPA]: [
    new SpeciesEvolution(Species.VIVILLON, 12, null, null)
  ],
  [Species.LITLEO]: [
    new SpeciesEvolution(Species.PYROAR, 35, null, null)
  ],
  [Species.FLABEBE]: [
    new SpeciesEvolution(Species.FLOETTE, 19, null, null)
  ],
  [Species.SKIDDO]: [
    new SpeciesEvolution(Species.GOGOAT, 32, null, null)
  ],
  [Species.PANCHAM]: [
    new SpeciesEvolution(Species.PANGORO, 32, null, new SpeciesEvolutionCondition(p => !!p.scene.getParty().find(p => p.getTypes(false, false, true).indexOf(Type.DARK) > -1)), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.ESPURR]: [
    new SpeciesFormEvolution(Species.MEOWSTIC, "", "female", 25, null, new SpeciesEvolutionCondition(p => p.gender === Gender.FEMALE, p => p.gender = Gender.FEMALE)),
    new SpeciesFormEvolution(Species.MEOWSTIC, "", "", 25, null, new SpeciesEvolutionCondition(p => p.gender === Gender.MALE, p => p.gender = Gender.MALE))
  ],
  [Species.HONEDGE]: [
    new SpeciesEvolution(Species.DOUBLADE, 35, null, null)
  ],
  [Species.INKAY]: [
    new SpeciesEvolution(Species.MALAMAR, 30, null, null)
  ],
  [Species.BINACLE]: [
    new SpeciesEvolution(Species.BARBARACLE, 39, null, null)
  ],
  [Species.SKRELP]: [
    new SpeciesEvolution(Species.DRAGALGE, 48, null, null)
  ],
  [Species.CLAUNCHER]: [
    new SpeciesEvolution(Species.CLAWITZER, 37, null, null)
  ],
  [Species.TYRUNT]: [
    new SpeciesEvolution(Species.TYRANTRUM, 39, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAY), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.AMAURA]: [
    new SpeciesEvolution(Species.AURORUS, 39, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.GOOMY]: [
    new SpeciesEvolution(Species.HISUI_SLIGGOO, 40, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DUSK || p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), SpeciesWildEvolutionDelay.LONG),
    new SpeciesEvolution(Species.SLIGGOO, 40, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAWN || p.scene.arena.getTimeOfDay() === TimeOfDay.DAY))
  ],
  [Species.SLIGGOO]: [
    new SpeciesEvolution(Species.GOODRA, 50, null, new SpeciesEvolutionCondition(p => [ WeatherType.RAIN, WeatherType.FOG, WeatherType.HEAVY_RAIN ].indexOf(p.scene.arena.weather?.weatherType || WeatherType.NONE) > -1), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.BERGMITE]: [
    new SpeciesEvolution(Species.HISUI_AVALUGG, 37, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DUSK || p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), SpeciesWildEvolutionDelay.LONG),
    new SpeciesEvolution(Species.AVALUGG, 37, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAWN || p.scene.arena.getTimeOfDay() === TimeOfDay.DAY))
  ],
  [Species.NOIBAT]: [
    new SpeciesEvolution(Species.NOIVERN, 48, null, null)
  ],
  [Species.ROWLET]: [
    new SpeciesEvolution(Species.DARTRIX, 17, null, null)
  ],
  [Species.DARTRIX]: [
    new SpeciesEvolution(Species.HISUI_DECIDUEYE, 36, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DUSK || p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), SpeciesWildEvolutionDelay.LONG),
    new SpeciesEvolution(Species.DECIDUEYE, 34, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAWN || p.scene.arena.getTimeOfDay() === TimeOfDay.DAY))
  ],
  [Species.LITTEN]: [
    new SpeciesEvolution(Species.TORRACAT, 17, null, null)
  ],
  [Species.TORRACAT]: [
    new SpeciesEvolution(Species.INCINEROAR, 34, null, null)
  ],
  [Species.POPPLIO]: [
    new SpeciesEvolution(Species.BRIONNE, 17, null, null)
  ],
  [Species.BRIONNE]: [
    new SpeciesEvolution(Species.PRIMARINA, 34, null, null)
  ],
  [Species.PIKIPEK]: [
    new SpeciesEvolution(Species.TRUMBEAK, 14, null, null)
  ],
  [Species.TRUMBEAK]: [
    new SpeciesEvolution(Species.TOUCANNON, 28, null, null)
  ],
  [Species.YUNGOOS]: [
    new SpeciesEvolution(Species.GUMSHOOS, 20, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAY), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.GRUBBIN]: [
    new SpeciesEvolution(Species.CHARJABUG, 20, null, null)
  ],
  [Species.CUTIEFLY]: [
    new SpeciesEvolution(Species.RIBOMBEE, 25, null, null)
  ],
  [Species.MAREANIE]: [
    new SpeciesEvolution(Species.TOXAPEX, 38, null, null)
  ],
  [Species.MUDBRAY]: [
    new SpeciesEvolution(Species.MUDSDALE, 30, null, null)
  ],
  [Species.DEWPIDER]: [
    new SpeciesEvolution(Species.ARAQUANID, 22, null, null)
  ],
  [Species.FOMANTIS]: [
    new SpeciesEvolution(Species.LURANTIS, 34, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAY), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.MORELULL]: [
    new SpeciesEvolution(Species.SHIINOTIC, 24, null, null)
  ],
  [Species.SALANDIT]: [
    new SpeciesEvolution(Species.SALAZZLE, 33, null, new SpeciesEvolutionCondition(p => p.gender === Gender.FEMALE, p => p.gender = Gender.FEMALE), null)
  ],
  [Species.STUFFUL]: [
    new SpeciesEvolution(Species.BEWEAR, 27, null, null)
  ],
  [Species.BOUNSWEET]: [
    new SpeciesEvolution(Species.STEENEE, 18, null, null)
  ],
  [Species.WIMPOD]: [
    new SpeciesEvolution(Species.GOLISOPOD, 30, null, null)
  ],
  [Species.SANDYGAST]: [
    new SpeciesEvolution(Species.PALOSSAND, 42, null, null)
  ],
  [Species.JANGMO_O]: [
    new SpeciesEvolution(Species.HAKAMO_O, 35, null, null)
  ],
  [Species.HAKAMO_O]: [
    new SpeciesEvolution(Species.KOMMO_O, 45, null, null)
  ],
  [Species.COSMOG]: [
    new SpeciesEvolution(Species.COSMOEM, 43, null, null)
  ],
  [Species.COSMOEM]: [
    new SpeciesEvolution(Species.SOLGALEO, 53, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAY), null),
    new SpeciesEvolution(Species.LUNALA, 53, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), null)
  ],
  [Species.MELTAN]: [
    new SpeciesEvolution(Species.MELMETAL, 48, null, null)
  ],
  [Species.ALOLA_RATTATA]: [
    new SpeciesEvolution(Species.ALOLA_RATICATE, 20, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.ALOLA_DIGLETT]: [
    new SpeciesEvolution(Species.ALOLA_DUGTRIO, 26, null, null)
  ],
  [Species.ALOLA_GEODUDE]: [
    new SpeciesEvolution(Species.ALOLA_GRAVELER, 25, null, null)
  ],
  [Species.ALOLA_GRIMER]: [
    new SpeciesEvolution(Species.ALOLA_MUK, 38, null, null)
  ],
  [Species.GROOKEY]: [
    new SpeciesEvolution(Species.THWACKEY, 16, null, null)
  ],
  [Species.THWACKEY]: [
    new SpeciesEvolution(Species.RILLABOOM, 35, null, null)
  ],
  [Species.SCORBUNNY]: [
    new SpeciesEvolution(Species.RABOOT, 16, null, null)
  ],
  [Species.RABOOT]: [
    new SpeciesEvolution(Species.CINDERACE, 35, null, null)
  ],
  [Species.SOBBLE]: [
    new SpeciesEvolution(Species.DRIZZILE, 16, null, null)
  ],
  [Species.DRIZZILE]: [
    new SpeciesEvolution(Species.INTELEON, 35, null, null)
  ],
  [Species.SKWOVET]: [
    new SpeciesEvolution(Species.GREEDENT, 24, null, null)
  ],
  [Species.ROOKIDEE]: [
    new SpeciesEvolution(Species.CORVISQUIRE, 18, null, null)
  ],
  [Species.CORVISQUIRE]: [
    new SpeciesEvolution(Species.CORVIKNIGHT, 38, null, null)
  ],
  [Species.BLIPBUG]: [
    new SpeciesEvolution(Species.DOTTLER, 10, null, null)
  ],
  [Species.DOTTLER]: [
    new SpeciesEvolution(Species.ORBEETLE, 30, null, null)
  ],
  [Species.NICKIT]: [
    new SpeciesEvolution(Species.THIEVUL, 18, null, null)
  ],
  [Species.GOSSIFLEUR]: [
    new SpeciesEvolution(Species.ELDEGOSS, 20, null, null)
  ],
  [Species.WOOLOO]: [
    new SpeciesEvolution(Species.DUBWOOL, 24, null, null)
  ],
  [Species.CHEWTLE]: [
    new SpeciesEvolution(Species.DREDNAW, 22, null, null)
  ],
  [Species.YAMPER]: [
    new SpeciesEvolution(Species.BOLTUND, 25, null, null)
  ],
  [Species.ROLYCOLY]: [
    new SpeciesEvolution(Species.CARKOL, 18, null, null)
  ],
  [Species.CARKOL]: [
    new SpeciesEvolution(Species.COALOSSAL, 34, null, null)
  ],
  [Species.SILICOBRA]: [
    new SpeciesEvolution(Species.SANDACONDA, 36, null, null)
  ],
  [Species.ARROKUDA]: [
    new SpeciesEvolution(Species.BARRASKEWDA, 26, null, null)
  ],
  [Species.TOXEL]: [
    new SpeciesFormEvolution(Species.TOXTRICITY, "", "lowkey", 30, null,
      new SpeciesEvolutionCondition(p => [ Nature.LONELY, Nature.BOLD, Nature.RELAXED, Nature.TIMID, Nature.SERIOUS, Nature.MODEST, Nature.MILD, Nature.QUIET, Nature.BASHFUL, Nature.CALM, Nature.GENTLE, Nature.CAREFUL ].indexOf(p.getNature()) > -1)),
    new SpeciesFormEvolution(Species.TOXTRICITY, "", "amped", 30, null, null)
  ],
  [Species.SIZZLIPEDE]: [
    new SpeciesEvolution(Species.CENTISKORCH, 28, null, null)
  ],
  [Species.HATENNA]: [
    new SpeciesEvolution(Species.HATTREM, 32, null, null)
  ],
  [Species.HATTREM]: [
    new SpeciesEvolution(Species.HATTERENE, 42, null, null)
  ],
  [Species.IMPIDIMP]: [
    new SpeciesEvolution(Species.MORGREM, 32, null, null)
  ],
  [Species.MORGREM]: [
    new SpeciesEvolution(Species.GRIMMSNARL, 42, null, null)
  ],
  [Species.CUFANT]: [
    new SpeciesEvolution(Species.COPPERAJAH, 34, null, null)
  ],
  [Species.DREEPY]: [
    new SpeciesEvolution(Species.DRAKLOAK, 50, null, null)
  ],
  [Species.DRAKLOAK]: [
    new SpeciesEvolution(Species.DRAGAPULT, 60, null, null)
  ],
  [Species.GALAR_MEOWTH]: [
    new SpeciesEvolution(Species.PERRSERKER, 28, null, null)
  ],
  [Species.GALAR_PONYTA]: [
    new SpeciesEvolution(Species.GALAR_RAPIDASH, 40, null, null)
  ],
  [Species.GALAR_FARFETCHD]: [
    new SpeciesEvolution(Species.SIRFETCHD, 30, null, null)
  ],
  [Species.GALAR_SLOWPOKE]: [
    new SpeciesEvolution(Species.GALAR_SLOWBRO, 1, EvolutionItem.GALARICA_CUFF, null, SpeciesWildEvolutionDelay.VERY_LONG),
    new SpeciesEvolution(Species.GALAR_SLOWKING, 1, EvolutionItem.GALARICA_WREATH, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.GALAR_MR_MIME]: [
    new SpeciesEvolution(Species.MR_RIME, 42, null, null)
  ],
  [Species.GALAR_CORSOLA]: [
    new SpeciesEvolution(Species.CURSOLA, 38, null, null)
  ],
  [Species.GALAR_ZIGZAGOON]: [
    new SpeciesEvolution(Species.GALAR_LINOONE, 20, null, null)
  ],
  [Species.GALAR_LINOONE]: [
    new SpeciesEvolution(Species.OBSTAGOON, 35, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.GALAR_YAMASK]: [
    new SpeciesEvolution(Species.RUNERIGUS, 34, null, null)
  ],
  [Species.HISUI_ZORUA]: [
    new SpeciesEvolution(Species.HISUI_ZOROARK, 30, null, null)
  ],
  [Species.HISUI_SLIGGOO]: [
    new SpeciesEvolution(Species.HISUI_GOODRA, 50, null, new SpeciesEvolutionCondition(p => [ WeatherType.RAIN, WeatherType.FOG, WeatherType.HEAVY_RAIN ].indexOf(p.scene.arena.weather?.weatherType || WeatherType.NONE) > -1), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.SPRIGATITO]: [
    new SpeciesEvolution(Species.FLORAGATO, 16, null, null)
  ],
  [Species.FLORAGATO]: [
    new SpeciesEvolution(Species.MEOWSCARADA, 36, null, null)
  ],
  [Species.FUECOCO]: [
    new SpeciesEvolution(Species.CROCALOR, 16, null, null)
  ],
  [Species.CROCALOR]: [
    new SpeciesEvolution(Species.SKELEDIRGE, 36, null, null)
  ],
  [Species.QUAXLY]: [
    new SpeciesEvolution(Species.QUAXWELL, 16, null, null)
  ],
  [Species.QUAXWELL]: [
    new SpeciesEvolution(Species.QUAQUAVAL, 36, null, null)
  ],
  [Species.LECHONK]: [
    new SpeciesFormEvolution(Species.OINKOLOGNE, "", "female", 18, null, new SpeciesEvolutionCondition(p => p.gender === Gender.FEMALE, p => p.gender = Gender.FEMALE)),
    new SpeciesFormEvolution(Species.OINKOLOGNE, "", "", 18, null, new SpeciesEvolutionCondition(p => p.gender === Gender.MALE, p => p.gender = Gender.MALE))
  ],
  [Species.TAROUNTULA]: [
    new SpeciesEvolution(Species.SPIDOPS, 15, null, null)
  ],
  [Species.NYMBLE]: [
    new SpeciesEvolution(Species.LOKIX, 24, null, null)
  ],
  [Species.PAWMI]: [
    new SpeciesEvolution(Species.PAWMO, 18, null, null)
  ],
  [Species.PAWMO]: [
    new SpeciesEvolution(Species.PAWMOT, 32, null, null)
  ],
  [Species.TANDEMAUS]: [
    new SpeciesEvolution(Species.MAUSHOLD, 25, null, null)
  ],
  [Species.FIDOUGH]: [
    new SpeciesEvolution(Species.DACHSBUN, 26, null, null)
  ],
  [Species.SMOLIV]: [
    new SpeciesEvolution(Species.DOLLIV, 25, null, null)
  ],
  [Species.DOLLIV]: [
    new SpeciesEvolution(Species.ARBOLIVA, 35, null, null)
  ],
  [Species.NACLI]: [
    new SpeciesEvolution(Species.NACLSTACK, 24, null, null)
  ],
  [Species.NACLSTACK]: [
    new SpeciesEvolution(Species.GARGANACL, 38, null, null)
  ],
  [Species.WATTREL]: [
    new SpeciesEvolution(Species.KILOWATTREL, 25, null, null)
  ],
  [Species.MASCHIFF]: [
    new SpeciesEvolution(Species.MABOSSTIFF, 30, null, null)
  ],
  [Species.SHROODLE]: [
    new SpeciesEvolution(Species.GRAFAIAI, 28, null, null)
  ],
  [Species.BRAMBLIN]: [
    new SpeciesEvolution(Species.BRAMBLEGHAST, 30, null, null)
  ],
  [Species.TOEDSCOOL]: [
    new SpeciesEvolution(Species.TOEDSCRUEL, 30, null, null)
  ],
  [Species.RELLOR]: [
    new SpeciesEvolution(Species.RABSCA, 29, null, null)
  ],
  [Species.FLITTLE]: [
    new SpeciesEvolution(Species.ESPATHRA, 35, null, null)
  ],
  [Species.TINKATINK]: [
    new SpeciesEvolution(Species.TINKATUFF, 24, null, null)
  ],
  [Species.TINKATUFF]: [
    new SpeciesEvolution(Species.TINKATON, 38, null, null)
  ],
  [Species.WIGLETT]: [
    new SpeciesEvolution(Species.WUGTRIO, 26, null, null)
  ],
  [Species.FINIZEN]: [
    new SpeciesEvolution(Species.PALAFIN, 38, null, null)
  ],
  [Species.VAROOM]: [
    new SpeciesEvolution(Species.REVAVROOM, 40, null, null)
  ],
  [Species.GLIMMET]: [
    new SpeciesEvolution(Species.GLIMMORA, 35, null, null)
  ],
  [Species.GREAVARD]: [
    new SpeciesEvolution(Species.HOUNDSTONE, 30, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.FRIGIBAX]: [
    new SpeciesEvolution(Species.ARCTIBAX, 35, null, null)
  ],
  [Species.ARCTIBAX]: [
    new SpeciesEvolution(Species.BAXCALIBUR, 54, null, null)
  ],
  [Species.PALDEA_WOOPER]: [
    new SpeciesEvolution(Species.CLODSIRE, 20, null, null)
  ],
  [Species.PIKACHU]: [
    new SpeciesFormEvolution(Species.ALOLA_RAICHU, "", "", 1, EvolutionItem.THUNDER_STONE, new SpeciesEvolutionCondition(p => p.scene.arena.biomeType === Biome.ISLAND || p.scene.arena.biomeType === Biome.BEACH), SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.ALOLA_RAICHU, "partner", "", 1, EvolutionItem.THUNDER_STONE, new SpeciesEvolutionCondition(p => p.scene.arena.biomeType === Biome.ISLAND || p.scene.arena.biomeType === Biome.BEACH), SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.RAICHU, "", "", 1, EvolutionItem.THUNDER_STONE, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.RAICHU, "partner", "", 1, EvolutionItem.THUNDER_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.NIDORINA]: [
    new SpeciesEvolution(Species.NIDOQUEEN, 1, EvolutionItem.MOON_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.NIDORINO]: [
    new SpeciesEvolution(Species.NIDOKING, 1, EvolutionItem.MOON_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.CLEFAIRY]: [
    new SpeciesEvolution(Species.CLEFABLE, 1, EvolutionItem.MOON_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.VULPIX]: [
    new SpeciesEvolution(Species.NINETALES, 1, EvolutionItem.FIRE_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.JIGGLYPUFF]: [
    new SpeciesEvolution(Species.WIGGLYTUFF, 1, EvolutionItem.MOON_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.GLOOM]: [
    new SpeciesEvolution(Species.VILEPLUME, 1, EvolutionItem.LEAF_STONE, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesEvolution(Species.BELLOSSOM, 1, EvolutionItem.SUN_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.GROWLITHE]: [
    new SpeciesEvolution(Species.ARCANINE, 1, EvolutionItem.FIRE_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.POLIWHIRL]: [
    new SpeciesEvolution(Species.POLIWRATH, 1, EvolutionItem.WATER_STONE, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesEvolution(Species.POLITOED, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(p => !!p.scene.findModifier(m => (m instanceof FlinchChanceModifier) && (m as FlinchChanceModifier).pokemonId === p.id, true)), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.WEEPINBELL]: [
    new SpeciesEvolution(Species.VICTREEBEL, 1, EvolutionItem.LEAF_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.MAGNETON]: [
    new SpeciesEvolution(Species.MAGNEZONE, 1, EvolutionItem.THUNDER_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.SHELLDER]: [
    new SpeciesEvolution(Species.CLOYSTER, 1, EvolutionItem.WATER_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.EXEGGCUTE]: [
    new SpeciesEvolution(Species.ALOLA_EXEGGUTOR, 1, EvolutionItem.LEAF_STONE, new SpeciesEvolutionCondition(p => p.scene.arena.biomeType === Biome.ISLAND || p.scene.arena.biomeType === Biome.BEACH), SpeciesWildEvolutionDelay.LONG),
    new SpeciesEvolution(Species.EXEGGUTOR, 1, EvolutionItem.LEAF_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.TANGELA]: [
    new SpeciesEvolution(Species.TANGROWTH, 34, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.ANCIENT_POWER).length > 0), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.LICKITUNG]: [
    new SpeciesEvolution(Species.LICKILICKY, 32, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.ROLLOUT).length > 0), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.STARYU]: [
    new SpeciesEvolution(Species.STARMIE, 1, EvolutionItem.WATER_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.EEVEE]: [
    new SpeciesFormEvolution(Species.SYLVEON, "", "", 1, null, new SpeciesFriendshipEvolutionCondition(70, p => !!p.getMoveset().find(m => m.getMove().type === Type.FAIRY)), SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.SYLVEON, "partner", "", 1, null, new SpeciesFriendshipEvolutionCondition(70, p => !!p.getMoveset().find(m => m.getMove().type === Type.FAIRY)), SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.ESPEON, "", "", 1, null, new SpeciesFriendshipEvolutionCondition(70, p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAY), SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.ESPEON, "partner", "", 1, null, new SpeciesFriendshipEvolutionCondition(70, p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAY), SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.UMBREON, "", "", 1, null, new SpeciesFriendshipEvolutionCondition(70, p => p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.UMBREON, "partner", "", 1, null, new SpeciesFriendshipEvolutionCondition(70, p => p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.VAPOREON, "", "", 1, EvolutionItem.WATER_STONE, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.VAPOREON, "partner", "", 1, EvolutionItem.WATER_STONE, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.JOLTEON, "", "", 1, EvolutionItem.THUNDER_STONE, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.JOLTEON, "partner", "", 1, EvolutionItem.THUNDER_STONE, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.FLAREON, "", "", 1, EvolutionItem.FIRE_STONE, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.FLAREON, "partner", "", 1, EvolutionItem.FIRE_STONE, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.LEAFEON, "", "", 1, EvolutionItem.LEAF_STONE, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.LEAFEON, "partner", "", 1, EvolutionItem.LEAF_STONE, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.GLACEON, "", "", 1, EvolutionItem.ICE_STONE, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.GLACEON, "partner", "", 1, EvolutionItem.ICE_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.TOGETIC]: [
    new SpeciesEvolution(Species.TOGEKISS, 1, EvolutionItem.SHINY_STONE, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.AIPOM]: [
    new SpeciesEvolution(Species.AMBIPOM, 32, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.DOUBLE_HIT).length > 0), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.SUNKERN]: [
    new SpeciesEvolution(Species.SUNFLORA, 1, EvolutionItem.SUN_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.YANMA]: [
    new SpeciesEvolution(Species.YANMEGA, 33, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.ANCIENT_POWER).length > 0), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.MURKROW]: [
    new SpeciesEvolution(Species.HONCHKROW, 1, EvolutionItem.DUSK_STONE, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.MISDREAVUS]: [
    new SpeciesEvolution(Species.MISMAGIUS, 1, EvolutionItem.DUSK_STONE, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.GIRAFARIG]: [
    new SpeciesEvolution(Species.FARIGIRAF, 32, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.TWIN_BEAM).length > 0), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.DUNSPARCE]: [
    new SpeciesFormEvolution(Species.DUDUNSPARCE, "", "three-segment", 32, null, new SpeciesEvolutionCondition(p => {
      let ret = false;
      if (p.moveset.filter(m => m.moveId === Moves.HYPER_DRILL).length > 0) {
        p.scene.executeWithSeedOffset(() => ret = !Utils.randSeedInt(4), p.id);
      }
      return ret;
    }), SpeciesWildEvolutionDelay.LONG),
    new SpeciesEvolution(Species.DUDUNSPARCE, 32, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.HYPER_DRILL).length > 0), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.GLIGAR]: [
    new SpeciesEvolution(Species.GLISCOR, 1, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT /* Razor fang at night*/), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.SNEASEL]: [
    new SpeciesEvolution(Species.WEAVILE, 1, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT /* Razor claw at night*/), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.URSARING]: [
    new SpeciesEvolution(Species.URSALUNA, 1, EvolutionItem.PEAT_BLOCK, null, SpeciesWildEvolutionDelay.VERY_LONG) //Ursaring does not evolve into Bloodmoon Ursaluna
  ],
  [Species.PILOSWINE]: [
    new SpeciesEvolution(Species.MAMOSWINE, 1, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.ANCIENT_POWER).length > 0), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.STANTLER]: [
    new SpeciesEvolution(Species.WYRDEER, 25, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.PSYSHIELD_BASH).length > 0), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.LOMBRE]: [
    new SpeciesEvolution(Species.LUDICOLO, 1, EvolutionItem.WATER_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.NUZLEAF]: [
    new SpeciesEvolution(Species.SHIFTRY, 1, EvolutionItem.LEAF_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.NOSEPASS]: [
    new SpeciesEvolution(Species.PROBOPASS, 1, EvolutionItem.THUNDER_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.SKITTY]: [
    new SpeciesEvolution(Species.DELCATTY, 1, EvolutionItem.MOON_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.ROSELIA]: [
    new SpeciesEvolution(Species.ROSERADE, 1, EvolutionItem.SHINY_STONE, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.BONSLY]: [
    new SpeciesEvolution(Species.SUDOWOODO, 1, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.MIMIC).length > 0), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.MIME_JR]: [
    new SpeciesEvolution(Species.GALAR_MR_MIME, 1, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.MIMIC).length > 0 && (p.scene.arena.biomeType === Biome.ICE_CAVE || p.scene.arena.biomeType === Biome.SNOWY_FOREST)), SpeciesWildEvolutionDelay.MEDIUM),
    new SpeciesEvolution(Species.MR_MIME, 1, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.MIMIC).length > 0), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.PANSAGE]: [
    new SpeciesEvolution(Species.SIMISAGE, 1, EvolutionItem.LEAF_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.PANSEAR]: [
    new SpeciesEvolution(Species.SIMISEAR, 1, EvolutionItem.FIRE_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.PANPOUR]: [
    new SpeciesEvolution(Species.SIMIPOUR, 1, EvolutionItem.WATER_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.MUNNA]: [
    new SpeciesEvolution(Species.MUSHARNA, 1, EvolutionItem.MOON_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.COTTONEE]: [
    new SpeciesEvolution(Species.WHIMSICOTT, 1, EvolutionItem.SUN_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.PETILIL]: [
    new SpeciesEvolution(Species.HISUI_LILLIGANT, 1, EvolutionItem.SUN_STONE, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DUSK || p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), SpeciesWildEvolutionDelay.VERY_LONG),
    new SpeciesEvolution(Species.LILLIGANT, 1, EvolutionItem.SUN_STONE, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAWN || p.scene.arena.getTimeOfDay() === TimeOfDay.DAY), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.BASCULIN]: [
    new SpeciesFormEvolution(Species.BASCULEGION, "white-striped", "female", 40, null, new SpeciesEvolutionCondition(p => p.gender === Gender.FEMALE, p => p.gender = Gender.FEMALE), SpeciesWildEvolutionDelay.VERY_LONG),
    new SpeciesFormEvolution(Species.BASCULEGION, "white-striped", "male", 40, null, new SpeciesEvolutionCondition(p => p.gender === Gender.MALE, p => p.gender = Gender.MALE), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.MINCCINO]: [
    new SpeciesEvolution(Species.CINCCINO, 1, EvolutionItem.SHINY_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.EELEKTRIK]: [
    new SpeciesEvolution(Species.EELEKTROSS, 1, EvolutionItem.THUNDER_STONE, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.LAMPENT]: [
    new SpeciesEvolution(Species.CHANDELURE, 1, EvolutionItem.DUSK_STONE, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.FLOETTE]: [
    new SpeciesEvolution(Species.FLORGES, 1, EvolutionItem.SHINY_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.DOUBLADE]: [
    new SpeciesEvolution(Species.AEGISLASH, 1, EvolutionItem.DUSK_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.HELIOPTILE]: [
    new SpeciesEvolution(Species.HELIOLISK, 1, EvolutionItem.SUN_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.CHARJABUG]: [
    new SpeciesEvolution(Species.VIKAVOLT, 1, EvolutionItem.THUNDER_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.CRABRAWLER]: [
    new SpeciesEvolution(Species.CRABOMINABLE, 1, EvolutionItem.ICE_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.ROCKRUFF]: [
    new SpeciesFormEvolution(Species.LYCANROC, "", "midday", 25, null, new SpeciesEvolutionCondition(p => (p.scene.arena.getTimeOfDay() === TimeOfDay.DAWN || p.scene.arena.getTimeOfDay() === TimeOfDay.DAY) && (p.formIndex === 0)), null),
    new SpeciesFormEvolution(Species.LYCANROC, "", "dusk", 25, null, new SpeciesEvolutionCondition(p =>  p.formIndex === 1), null),
    new SpeciesFormEvolution(Species.LYCANROC, "", "midnight", 25, null, new SpeciesEvolutionCondition(p => (p.scene.arena.getTimeOfDay() === TimeOfDay.DUSK || p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT) && (p.formIndex === 0)), null)
  ],
  [Species.STEENEE]: [
    new SpeciesEvolution(Species.TSAREENA, 28, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.STOMP).length > 0), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.POIPOLE]: [
    new SpeciesEvolution(Species.NAGANADEL, 1, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.DRAGON_PULSE).length > 0), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.ALOLA_SANDSHREW]: [
    new SpeciesEvolution(Species.ALOLA_SANDSLASH, 1, EvolutionItem.ICE_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.ALOLA_VULPIX]: [
    new SpeciesEvolution(Species.ALOLA_NINETALES, 1, EvolutionItem.ICE_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.APPLIN]: [
    new SpeciesEvolution(Species.DIPPLIN, 1, EvolutionItem.SYRUPY_APPLE, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesEvolution(Species.FLAPPLE, 1, EvolutionItem.TART_APPLE, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesEvolution(Species.APPLETUN, 1, EvolutionItem.SWEET_APPLE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.CLOBBOPUS]: [
    new SpeciesEvolution(Species.GRAPPLOCT, 35, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.TAUNT).length > 0), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.SINISTEA]: [
    new SpeciesFormEvolution(Species.POLTEAGEIST, "phony", "phony", 1, EvolutionItem.CRACKED_POT, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.POLTEAGEIST, "antique", "antique", 1, EvolutionItem.CHIPPED_POT, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.MILCERY]: [
    new SpeciesFormEvolution(Species.ALCREMIE, "", "vanilla-cream", 1, EvolutionItem.STRAWBERRY_SWEET, new SpeciesEvolutionCondition(p => p.scene.arena.biomeType === Biome.TOWN || p.scene.arena.biomeType === Biome.PLAINS || p.scene.arena.biomeType === Biome.GRASS || p.scene.arena.biomeType === Biome.TALL_GRASS || p.scene.arena.biomeType === Biome.METROPOLIS), SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.ALCREMIE, "", "ruby-cream", 1, EvolutionItem.STRAWBERRY_SWEET, new SpeciesEvolutionCondition(p => p.scene.arena.biomeType === Biome.BADLANDS || p.scene.arena.biomeType === Biome.VOLCANO || p.scene.arena.biomeType === Biome.GRAVEYARD || p.scene.arena.biomeType === Biome.FACTORY || p.scene.arena.biomeType === Biome.SLUM), SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.ALCREMIE, "", "matcha-cream", 1, EvolutionItem.STRAWBERRY_SWEET, new SpeciesEvolutionCondition(p => p.scene.arena.biomeType === Biome.FOREST || p.scene.arena.biomeType === Biome.SWAMP || p.scene.arena.biomeType === Biome.MEADOW || p.scene.arena.biomeType === Biome.JUNGLE), SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.ALCREMIE, "", "mint-cream", 1, EvolutionItem.STRAWBERRY_SWEET, new SpeciesEvolutionCondition(p => p.scene.arena.biomeType === Biome.SEA || p.scene.arena.biomeType === Biome.BEACH || p.scene.arena.biomeType === Biome.LAKE || p.scene.arena.biomeType === Biome.SEABED), SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.ALCREMIE, "", "lemon-cream", 1, EvolutionItem.STRAWBERRY_SWEET, new SpeciesEvolutionCondition(p => p.scene.arena.biomeType === Biome.DESERT || p.scene.arena.biomeType === Biome.POWER_PLANT || p.scene.arena.biomeType === Biome.DOJO || p.scene.arena.biomeType === Biome.RUINS || p.scene.arena.biomeType === Biome.CONSTRUCTION_SITE), SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.ALCREMIE, "", "salted-cream", 1, EvolutionItem.STRAWBERRY_SWEET, new SpeciesEvolutionCondition(p => p.scene.arena.biomeType === Biome.MOUNTAIN || p.scene.arena.biomeType === Biome.CAVE || p.scene.arena.biomeType === Biome.ICE_CAVE || p.scene.arena.biomeType === Biome.FAIRY_CAVE || p.scene.arena.biomeType === Biome.SNOWY_FOREST), SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.ALCREMIE, "", "ruby-swirl", 1, EvolutionItem.STRAWBERRY_SWEET, new SpeciesEvolutionCondition(p => p.scene.arena.biomeType === Biome.WASTELAND || p.scene.arena.biomeType === Biome.LABORATORY), SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.ALCREMIE, "", "caramel-swirl", 1, EvolutionItem.STRAWBERRY_SWEET, new SpeciesEvolutionCondition(p => p.scene.arena.biomeType === Biome.TEMPLE || p.scene.arena.biomeType === Biome.ISLAND), SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.ALCREMIE, "", "rainbow-swirl", 1, EvolutionItem.STRAWBERRY_SWEET, new SpeciesEvolutionCondition(p => p.scene.arena.biomeType === Biome.ABYSS || p.scene.arena.biomeType === Biome.SPACE || p.scene.arena.biomeType === Biome.END), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.DURALUDON]: [
    new SpeciesFormEvolution(Species.ARCHALUDON, "", "", 1, EvolutionItem.METAL_ALLOY, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.KUBFU]: [
    new SpeciesFormEvolution(Species.URSHIFU, "", "single-strike", 1, EvolutionItem.SCROLL_OF_DARKNESS, null, SpeciesWildEvolutionDelay.VERY_LONG),
    new SpeciesFormEvolution(Species.URSHIFU, "", "rapid-strike", 1, EvolutionItem.SCROLL_OF_WATERS, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.GALAR_DARUMAKA]: [
    new SpeciesEvolution(Species.GALAR_DARMANITAN, 1, EvolutionItem.ICE_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.HISUI_GROWLITHE]: [
    new SpeciesEvolution(Species.HISUI_ARCANINE, 1, EvolutionItem.FIRE_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.HISUI_VOLTORB]: [
    new SpeciesEvolution(Species.HISUI_ELECTRODE, 1, EvolutionItem.LEAF_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.HISUI_QWILFISH]: [
    new SpeciesEvolution(Species.OVERQWIL, 28, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.BARB_BARRAGE).length > 0), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.HISUI_SNEASEL]: [
    new SpeciesEvolution(Species.SNEASLER, 1, null, new SpeciesEvolutionCondition(p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAY /* Razor claw at day*/), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.CHARCADET]: [
    new SpeciesEvolution(Species.ARMAROUGE, 1, EvolutionItem.AUSPICIOUS_ARMOR, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesEvolution(Species.CERULEDGE, 1, EvolutionItem.MALICIOUS_ARMOR, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.TADBULB]: [
    new SpeciesEvolution(Species.BELLIBOLT, 1, EvolutionItem.THUNDER_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.CAPSAKID]: [
    new SpeciesEvolution(Species.SCOVILLAIN, 1, EvolutionItem.FIRE_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.CETODDLE]: [
    new SpeciesEvolution(Species.CETITAN, 1, EvolutionItem.ICE_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.POLTCHAGEIST]: [
    new SpeciesFormEvolution(Species.SINISTCHA, "counterfeit", "unremarkable", 1, EvolutionItem.UNREMARKABLE_TEACUP, null, SpeciesWildEvolutionDelay.LONG),
    new SpeciesFormEvolution(Species.SINISTCHA, "artisan", "masterpiece", 1, EvolutionItem.MASTERPIECE_TEACUP, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.DIPPLIN]: [
    new SpeciesEvolution(Species.HYDRAPPLE, 1, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.DRAGON_CHEER).length > 0), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.KADABRA]: [
    new SpeciesEvolution(Species.ALAKAZAM, 1, EvolutionItem.LINKING_CORD, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.MACHOKE]: [
    new SpeciesEvolution(Species.MACHAMP, 1, EvolutionItem.LINKING_CORD, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.GRAVELER]: [
    new SpeciesEvolution(Species.GOLEM, 1, EvolutionItem.LINKING_CORD, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.HAUNTER]: [
    new SpeciesEvolution(Species.GENGAR, 1, EvolutionItem.LINKING_CORD, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.ONIX]: [
    new SpeciesEvolution(Species.STEELIX, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(
      p => p.moveset.filter(m => m.getMove().type === Type.STEEL).length > 0),
    SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.RHYDON]: [
    new SpeciesEvolution(Species.RHYPERIOR, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(p => true /* Protector */), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.SEADRA]: [
    new SpeciesEvolution(Species.KINGDRA, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(p => true /* Dragon scale*/), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.SCYTHER]: [
    new SpeciesEvolution(Species.SCIZOR, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(
      p => p.moveset.filter(m => m.getMove().type === Type.STEEL).length > 0),
    SpeciesWildEvolutionDelay.VERY_LONG),
    new SpeciesEvolution(Species.KLEAVOR, 1, EvolutionItem.BLACK_AUGURITE, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.ELECTABUZZ]: [
    new SpeciesEvolution(Species.ELECTIVIRE, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(p => true /* Electirizer*/), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.MAGMAR]: [
    new SpeciesEvolution(Species.MAGMORTAR, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(p => true /* Magmarizer*/), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.PORYGON]: [
    new SpeciesEvolution(Species.PORYGON2, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(p => true /*Upgrade*/), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.PORYGON2]: [
    new SpeciesEvolution(Species.PORYGON_Z, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(p => true /* Dubious disc*/), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.FEEBAS]: [
    new SpeciesEvolution(Species.MILOTIC, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(p => true /* Prism scale*/), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.DUSCLOPS]: [
    new SpeciesEvolution(Species.DUSKNOIR, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(p => true /* Reaper cloth*/), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.CLAMPERL]: [
    new SpeciesEvolution(Species.HUNTAIL, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(p => p.gender === Gender.MALE, p => p.gender = Gender.MALE /* Deep Sea Tooth */), SpeciesWildEvolutionDelay.VERY_LONG),
    new SpeciesEvolution(Species.GOREBYSS, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(p => p.gender === Gender.FEMALE, p => p.gender = Gender.FEMALE /* Deep Sea Scale */), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.BOLDORE]: [
    new SpeciesEvolution(Species.GIGALITH, 1, EvolutionItem.LINKING_CORD, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.GURDURR]: [
    new SpeciesEvolution(Species.CONKELDURR, 1, EvolutionItem.LINKING_CORD, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.KARRABLAST]: [
    new SpeciesEvolution(Species.ESCAVALIER, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(p => !!p.scene.gameData.dexData[Species.SHELMET].caughtAttr), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.SHELMET]: [
    new SpeciesEvolution(Species.ACCELGOR, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(p => !!p.scene.gameData.dexData[Species.KARRABLAST].caughtAttr), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.SPRITZEE]: [
    new SpeciesEvolution(Species.AROMATISSE, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(p => true /*Sachet*/), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.SWIRLIX]: [
    new SpeciesEvolution(Species.SLURPUFF, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(p => true /*Whipped Dream*/), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.PHANTUMP]: [
    new SpeciesEvolution(Species.TREVENANT, 1, EvolutionItem.LINKING_CORD, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.PUMPKABOO]: [
    new SpeciesEvolution(Species.GOURGEIST, 1, EvolutionItem.LINKING_CORD, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.ALOLA_GRAVELER]: [
    new SpeciesEvolution(Species.ALOLA_GOLEM, 1, EvolutionItem.LINKING_CORD, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.PRIMEAPE]: [
    new SpeciesEvolution(Species.ANNIHILAPE, 35, null, new SpeciesEvolutionCondition(p => p.moveset.filter(m => m.moveId === Moves.RAGE_FIST).length > 0), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.GOLBAT]: [
    new SpeciesEvolution(Species.CROBAT, 1, null, new SpeciesFriendshipEvolutionCondition(110), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.CHANSEY]: [
    new SpeciesEvolution(Species.BLISSEY, 1, null, new SpeciesFriendshipEvolutionCondition(200), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.PICHU]: [
    new SpeciesEvolution(Species.PIKACHU, 1, null, new SpeciesFriendshipEvolutionCondition(90), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.CLEFFA]: [
    new SpeciesEvolution(Species.CLEFAIRY, 1, null, new SpeciesFriendshipEvolutionCondition(160), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.IGGLYBUFF]: [
    new SpeciesEvolution(Species.JIGGLYPUFF, 1, null, new SpeciesFriendshipEvolutionCondition(70), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.TOGEPI]: [
    new SpeciesEvolution(Species.TOGETIC, 1, null, new SpeciesFriendshipEvolutionCondition(70), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.AZURILL]: [
    new SpeciesEvolution(Species.MARILL, 1, null, new SpeciesFriendshipEvolutionCondition(70), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.BUDEW]: [
    new SpeciesEvolution(Species.ROSELIA, 1, null, new SpeciesFriendshipEvolutionCondition(70, p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAWN || p.scene.arena.getTimeOfDay() === TimeOfDay.DAY), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.BUNEARY]: [
    new SpeciesEvolution(Species.LOPUNNY, 1, null, new SpeciesFriendshipEvolutionCondition(70), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.CHINGLING]: [
    new SpeciesEvolution(Species.CHIMECHO, 1, null, new SpeciesFriendshipEvolutionCondition(90, p => p.scene.arena.getTimeOfDay() === TimeOfDay.DUSK || p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.HAPPINY]: [
    new SpeciesEvolution(Species.CHANSEY, 1, null, new SpeciesFriendshipEvolutionCondition(160), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.MUNCHLAX]: [
    new SpeciesEvolution(Species.SNORLAX, 1, null, new SpeciesFriendshipEvolutionCondition(90), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.RIOLU]: [
    new SpeciesEvolution(Species.LUCARIO, 1, null, new SpeciesFriendshipEvolutionCondition(90, p => p.scene.arena.getTimeOfDay() === TimeOfDay.DAWN || p.scene.arena.getTimeOfDay() === TimeOfDay.DAY), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.WOOBAT]: [
    new SpeciesEvolution(Species.SWOOBAT, 1, null, new SpeciesFriendshipEvolutionCondition(70), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.SWADLOON]: [
    new SpeciesEvolution(Species.LEAVANNY, 1, null, new SpeciesFriendshipEvolutionCondition(110), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.TYPE_NULL]: [
    new SpeciesEvolution(Species.SILVALLY, 1, null, new SpeciesFriendshipEvolutionCondition(70), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.ALOLA_MEOWTH]: [
    new SpeciesEvolution(Species.ALOLA_PERSIAN, 1, null, new SpeciesFriendshipEvolutionCondition(70), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.SNOM]: [
    new SpeciesEvolution(Species.FROSMOTH, 1, null, new SpeciesFriendshipEvolutionCondition(90, p => p.scene.arena.getTimeOfDay() === TimeOfDay.DUSK || p.scene.arena.getTimeOfDay() === TimeOfDay.NIGHT), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.GIMMIGHOUL]: [
    new SpeciesEvolution(Species.GHOLDENGO, 1, null, new SpeciesFriendshipEvolutionCondition(70), SpeciesWildEvolutionDelay.VERY_LONG)
  ]
};

interface PokemonPrevolutions {
  [key: string]: Species
}

export const pokemonPrevolutions: PokemonPrevolutions = {};

export function initPokemonPrevolutions(): void {
  const megaFormKeys = [ SpeciesFormKey.MEGA, "", SpeciesFormKey.MEGA_X, "", SpeciesFormKey.MEGA_Y ].map(sfk => sfk as string);
  const prevolutionKeys = Object.keys(pokemonEvolutions);
  prevolutionKeys.forEach(pk => {
    const evolutions = pokemonEvolutions[pk];
    for (const ev of evolutions) {
      if (ev.evoFormKey && megaFormKeys.indexOf(ev.evoFormKey) > -1) {
        continue;
      }
      pokemonPrevolutions[ev.speciesId] = parseInt(pk) as Species;
    }
  });
}
