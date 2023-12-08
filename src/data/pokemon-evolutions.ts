import { Gender } from "./gender";
import { AttackTypeBoosterModifier, FlinchChanceModifier } from "../modifier/modifier";
import { AttackTypeBoosterModifierType } from "../modifier/modifier-type";
import { Moves } from "./move";
import { PokeballType } from "./pokeball";
import Pokemon from "../pokemon";
import { Stat } from "./pokemon-stat";
import { Species } from "./species";
import { Type } from "./type";
import * as Utils from "../utils";
import { SpeciesFormKey } from "./pokemon-species";
import { WeatherType } from "./weather";

export enum SpeciesWildEvolutionDelay {
  NONE,
  SHORT,
  MEDIUM,
  LONG,
  VERY_LONG,
  MEGA
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

  ABOMASITE = 100,
  ABSOLITE,
  AERODACTYLITE,
  AGGRONITE,
  ALAKAZITE,
  ALTARIANITE,
  AMPHAROSITE,
  AUDINITE,
  BANETTITE,
  BEEDRILLITE,
  BLASTOISINITE,
  BLAZIKENITE,
  CAMERUPTITE,
  CHARIZARDITE_X,
  CHARIZARDITE_Y,
  DIANCITE,
  GALLADITE,
  GARCHOMPITE,
  GARDEVOIRITE,
  GENGARITE,
  GLALITITE,
  GYARADOSITE,
  HERACRONITE,
  HOUNDOOMINITE,
  KANGASKHANITE,
  LATIASITE,
  LATIOSITE,
  LOPUNNITE,
  LUCARIONITE,
  MANECTITE,
  MAWILITE,
  MEDICHAMITE,
  METAGROSSITE,
  MEWTWONITE_X,
  MEWTWONITE_Y,
  PIDGEOTITE,
  PINSIRITE,
  RAYQUAZITE,
  SABLENITE,
  SALAMENCITE,
  SCEPTILITE,
  SCIZORITE,
  SHARPEDONITE,
  SLOWBRONITE,
  STEELIXITE,
  SWAMPERTITE,
  TYRANITARITE,
  VENUSAURITE,
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

export class SpeciesEvolutionCondition {
  public predicate: EvolutionConditionPredicate;
  public enforceFunc: EvolutionConditionEnforceFunc;

  constructor(predicate: EvolutionConditionPredicate, enforceFunc?: EvolutionConditionEnforceFunc) {
    this.predicate = predicate;
    this.enforceFunc = enforceFunc;
  }
}

interface PokemonEvolutions {
  [key: string]: SpeciesEvolution[]
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
    new SpeciesEvolution(Species.PERSIAN, 28, null, null)
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
    new SpeciesEvolution(Species.SLOWKING, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition((p: Pokemon) => !!p.scene.findModifier(m => (m instanceof FlinchChanceModifier) && (m as FlinchChanceModifier).pokemonId === p.id, true)), SpeciesWildEvolutionDelay.VERY_LONG)
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
    new SpeciesEvolution(Species.MAROWAK, 28, null, null)
  ],
  [Species.TYROGUE]: [
    new SpeciesEvolution(Species.HITMONLEE, 20, null, new SpeciesEvolutionCondition((p: Pokemon) => p.stats[Stat.ATK] > p.stats[Stat.DEF])),
    new SpeciesEvolution(Species.HITMONCHAN, 20, null, new SpeciesEvolutionCondition((p: Pokemon) => p.stats[Stat.ATK] < p.stats[Stat.DEF])),
    new SpeciesEvolution(Species.HITMONTOP, 20, null, new SpeciesEvolutionCondition((p: Pokemon) => p.stats[Stat.ATK] === p.stats[Stat.DEF]))
  ],
  [Species.KOFFING]: [
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
    new SpeciesEvolution(Species.TYPHLOSION, 36, null, null)
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
    new SpeciesEvolution(Species.SILCOON, 7, null, new SpeciesEvolutionCondition((p: Pokemon) => Utils.randInt(2) === 0)), // TODO: Improve these conditions
    new SpeciesEvolution(Species.CASCOON, 7, null, null)
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
    new SpeciesEvolution(Species.GARDEVOIR, 30, null, new SpeciesEvolutionCondition((p: Pokemon) => p.gender === Gender.FEMALE, (p: Pokemon) => p.gender = Gender.FEMALE)),
    new SpeciesEvolution(Species.GALLADE, 1, EvolutionItem.DAWN_STONE, new SpeciesEvolutionCondition((p: Pokemon) => p.gender === Gender.MALE, (p: Pokemon) => p.gender = Gender.MALE), SpeciesWildEvolutionDelay.LONG)
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
    new SpeciesEvolution(Species.SHEDINJA, 20, null, new SpeciesEvolutionCondition((p: Pokemon) => p.scene.getParty().length < 6 && p.scene.pokeballCounts[PokeballType.POKEBALL] > 0))
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
    new SpeciesEvolution(Species.GLALIE, 42, null, null),
    new SpeciesEvolution(Species.FROSLASS, 1, EvolutionItem.DAWN_STONE, new SpeciesEvolutionCondition((p: Pokemon) => p.gender === Gender.FEMALE, (p: Pokemon) => p.gender = Gender.FEMALE), SpeciesWildEvolutionDelay.VERY_LONG)
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
    new SpeciesEvolution(Species.MOTHIM, 20, null, new SpeciesEvolutionCondition((p: Pokemon) => p.gender === Gender.MALE, (p: Pokemon) => p.gender = Gender.MALE)),
    new SpeciesEvolution(Species.WORMADAM, 20, null, new SpeciesEvolutionCondition((p: Pokemon) => p.gender === Gender.FEMALE, (p: Pokemon) => p.gender = Gender.FEMALE))
  ],
  [Species.COMBEE]: [
    new SpeciesEvolution(Species.VESPIQUEN, 21, null, new SpeciesEvolutionCondition((p: Pokemon) => p.gender === Gender.FEMALE, (p: Pokemon) => p.gender = Gender.FEMALE))
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
    new SpeciesEvolution(Species.SAMUROTT, 36, null, null)
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
  [Species.RUFFLET]: [
    new SpeciesEvolution(Species.BRAVIARY, 54, null, null)
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
    new SpeciesEvolution(Species.PANGORO, 32, null, new SpeciesEvolutionCondition((p: Pokemon) => !!p.scene.getParty().find(p => p.getTypes(true).indexOf(Type.DARK) > -1)), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.ESPURR]: [
    new SpeciesFormEvolution(Species.MEOWSTIC, '', '', 25, null, new SpeciesEvolutionCondition((p: Pokemon) => p.gender === Gender.MALE, (p: Pokemon) => p.gender = Gender.MALE)),
    new SpeciesFormEvolution(Species.MEOWSTIC, '', 'female', 25, null, new SpeciesEvolutionCondition((p: Pokemon) => p.gender === Gender.FEMALE, (p: Pokemon) => p.gender = Gender.FEMALE))
  ],
  [Species.HONEDGE]: [
    new SpeciesEvolution(Species.DOUBLADE, 35, null, null)
  ],
  [Species.INKAY]: [
    new SpeciesEvolution(Species.MALAMAR, 30, null, null)
  ],
  [Species.BINACLE]: [
    new SpeciesEvolution(Species.MALAMAR, 39, null, null)
  ],
  [Species.SKRELP]: [
    new SpeciesEvolution(Species.DRAGALGE, 48, null, null)
  ],
  [Species.CLAUNCHER]: [
    new SpeciesEvolution(Species.CLAWITZER, 37, null, null)
  ],
  [Species.TYRUNT]: [
    new SpeciesEvolution(Species.TYRANTRUM, 39, null, new SpeciesEvolutionCondition((p: Pokemon) => !p.scene.arena.isDaytime()), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.AMAURA]: [
    new SpeciesEvolution(Species.AURORUS, 39, null, new SpeciesEvolutionCondition((p: Pokemon) => !p.scene.arena.isDaytime()), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.GOOMY]: [
    new SpeciesEvolution(Species.SLIGGOO, 40, null, null)
  ],
  [Species.SLIGGOO]: [
    new SpeciesEvolution(Species.GOODRA, 50, null, new SpeciesEvolutionCondition((p: Pokemon) => [ WeatherType.RAIN, WeatherType.HEAVY_RAIN ].indexOf(p.scene.arena.weather?.weatherType || WeatherType.NONE) > -1), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.BERGMITE]: [
    new SpeciesEvolution(Species.AVALUGG, 37, null, null)
  ],
  [Species.NOIBAT]: [
    new SpeciesEvolution(Species.NOIVERN, 48, null, null)
  ],
  [Species.PIKACHU]: [
    new SpeciesEvolution(Species.RAICHU, 1, EvolutionItem.THUNDER_STONE, null, SpeciesWildEvolutionDelay.LONG)
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
    new SpeciesEvolution(Species.POLITOED, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition((p: Pokemon) => !!p.scene.findModifier(m => (m instanceof FlinchChanceModifier) && (m as FlinchChanceModifier).pokemonId === p.id, true)), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.WEEPINBELL]: [
    new SpeciesEvolution(Species.VICTREEBEL, 1, EvolutionItem.LEAF_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.MAGNETON]: [
    new SpeciesEvolution(Species.MAGNEZONE, 1, EvolutionItem.THUNDER_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.SHELLDER]: [
    new SpeciesEvolution(Species.CLOYSTER, 1, EvolutionItem.WATER_STONE, null, SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.EXEGGCUTE]: [
    new SpeciesEvolution(Species.EXEGGUTOR, 1, EvolutionItem.LEAF_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.TANGELA]: [
    new SpeciesEvolution(Species.TANGROWTH, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.moveset.filter(m => m.moveId === Moves.ANCIENT_POWER).length > 0), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.LICKITUNG]: [
    new SpeciesEvolution(Species.LICKILICKY, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.moveset.filter(m => m.moveId === Moves.ROLLOUT).length > 0), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.STARYU]: [
    new SpeciesEvolution(Species.STARMIE, 1, EvolutionItem.WATER_STONE, null, SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.EEVEE]: [
    new SpeciesEvolution(Species.SYLVEON, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10 && !!p.getMoveset().find(m => m.getMove().type === Type.FAIRY)), SpeciesWildEvolutionDelay.MEDIUM),
    new SpeciesEvolution(Species.ESPEON, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10 && p.scene.arena.isDaytime()), SpeciesWildEvolutionDelay.MEDIUM),
    new SpeciesEvolution(Species.UMBREON, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10 && !p.scene.arena.isDaytime()), SpeciesWildEvolutionDelay.MEDIUM),
    new SpeciesEvolution(Species.VAPOREON, 1, EvolutionItem.WATER_STONE, null, SpeciesWildEvolutionDelay.MEDIUM),
    new SpeciesEvolution(Species.JOLTEON, 1, EvolutionItem.THUNDER_STONE, null, SpeciesWildEvolutionDelay.MEDIUM),
    new SpeciesEvolution(Species.FLAREON, 1, EvolutionItem.FIRE_STONE, null, SpeciesWildEvolutionDelay.MEDIUM),
    new SpeciesEvolution(Species.LEAFEON, 1, EvolutionItem.LEAF_STONE, null, SpeciesWildEvolutionDelay.MEDIUM),
    new SpeciesEvolution(Species.GLACEON, 1, EvolutionItem.ICE_STONE, null, SpeciesWildEvolutionDelay.MEDIUM),
  ],
  [Species.TOGETIC]: [
    new SpeciesEvolution(Species.TOGEKISS, 1, EvolutionItem.SHINY_STONE, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.AIPOM]: [
    new SpeciesEvolution(Species.AMBIPOM, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.moveset.filter(m => m.moveId === Moves.DOUBLE_HIT).length > 0), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.SUNKERN]: [
    new SpeciesEvolution(Species.SUNFLORA, 1, EvolutionItem.SUN_STONE, null, SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.YANMA]: [
    new SpeciesEvolution(Species.YANMEGA, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.moveset.filter(m => m.moveId === Moves.ROLLOUT).length > 0), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.MURKROW]: [
    new SpeciesEvolution(Species.HONCHKROW, 1, EvolutionItem.DUSK_STONE, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.MISDREAVUS]: [
    new SpeciesEvolution(Species.MISMAGIUS, 1, EvolutionItem.DUSK_STONE, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.GLIGAR]: [
    new SpeciesEvolution(Species.GLISCOR, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => !p.scene.arena.isDaytime() /* Razor fang at night*/), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.SNEASEL]: [
    new SpeciesEvolution(Species.WEAVILE, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => !p.scene.arena.isDaytime() /* Razor claw at night*/), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.PILOSWINE]: [
    new SpeciesEvolution(Species.MAMOSWINE, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.moveset.filter(m => m.moveId === Moves.ANCIENT_POWER).length > 0), SpeciesWildEvolutionDelay.VERY_LONG)
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
    new SpeciesEvolution(Species.DELCATTY, 1, EvolutionItem.MOON_STONE, null, SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.ROSELIA]: [
    new SpeciesEvolution(Species.ROSERADE, 1, EvolutionItem.SHINY_STONE, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.BONSLY]: [
    new SpeciesEvolution(Species.SUDOWOODO, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.moveset.filter(m => m.moveId === Moves.MIMIC).length > 0), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.MIME_JR]: [
    new SpeciesEvolution(Species.MR_MIME, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.moveset.filter(m => m.moveId === Moves.MIMIC).length > 0), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.MANTYKE]: [
    new SpeciesEvolution(Species.MANTINE, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => !!p.scene.getParty().find(p => p.species.speciesId === Species.REMORAID)), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.PANSAGE]: [
    new SpeciesEvolution(Species.SIMISAGE, 1, EvolutionItem.LEAF_STONE, null, SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.PANSEAR]: [
    new SpeciesEvolution(Species.SIMISEAR, 1, EvolutionItem.FIRE_STONE, null, SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.PANPOUR]: [
    new SpeciesEvolution(Species.SIMIPOUR, 1, EvolutionItem.WATER_STONE, null, SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.MUNNA]: [
    new SpeciesEvolution(Species.MUSHARNA, 1, EvolutionItem.MOON_STONE, null, SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.COTTONEE]: [
    new SpeciesEvolution(Species.WHIMSICOTT, 1, EvolutionItem.SUN_STONE, null, SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.PETILIL]: [
    new SpeciesEvolution(Species.LILLIGANT, 1, EvolutionItem.SUN_STONE, null, SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.MINCCINO]: [
    new SpeciesEvolution(Species.CINCCINO, 1, EvolutionItem.SHINY_STONE, null, SpeciesWildEvolutionDelay.SHORT)
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
        (p: Pokemon) => !!p.scene.findModifier(m => m instanceof AttackTypeBoosterModifier && (m.type as AttackTypeBoosterModifierType).moveType === Type.STEEL)),
        SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.RHYDON]: [
    new SpeciesEvolution(Species.RHYPERIOR, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition((p: Pokemon) => true /* Protector */), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.SEADRA]: [
    new SpeciesEvolution(Species.KINGDRA, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition((p: Pokemon) => true /* Dragon scale*/), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.SCYTHER]: [
    new SpeciesEvolution(Species.SCIZOR, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition(
      (p: Pokemon) => !!p.scene.findModifier(m => m instanceof AttackTypeBoosterModifier && (m.type as AttackTypeBoosterModifierType).moveType === Type.STEEL) ),
      SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.ELECTABUZZ]: [
    new SpeciesEvolution(Species.ELECTIVIRE, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition((p: Pokemon) => true /* Electirizer*/), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.MAGMAR]: [
    new SpeciesEvolution(Species.MAGMORTAR, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition((p: Pokemon) => true /* Magmarizer*/), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.PORYGON]: [
    new SpeciesEvolution(Species.PORYGON2, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition((p: Pokemon) => true /*Upgrade*/), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.PORYGON2]: [
    new SpeciesEvolution(Species.PORYGON_Z, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition((p: Pokemon) => true /* Dubious disc*/), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.FEEBAS]: [
    new SpeciesEvolution(Species.MILOTIC, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition((p: Pokemon) => true /* Prism scale*/), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.DUSCLOPS]: [
    new SpeciesEvolution(Species.DUSKNOIR, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition((p: Pokemon) => true /* Reaper cloth*/), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.CLAMPERL]: [
    new SpeciesEvolution(Species.HUNTAIL, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition((p: Pokemon) => p.gender === Gender.MALE, (p: Pokemon) => p.gender = Gender.MALE /* Deep Sea Tooth */), SpeciesWildEvolutionDelay.MEDIUM),
    new SpeciesEvolution(Species.GOREBYSS, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition((p: Pokemon) => p.gender === Gender.FEMALE, (p: Pokemon) => p.gender = Gender.FEMALE /* Deep Sea Scale */), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.BOLDORE]: [
    new SpeciesEvolution(Species.GIGALITH, 1, EvolutionItem.LINKING_CORD, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.GURDURR]: [
    new SpeciesEvolution(Species.CONKELDURR, 1, EvolutionItem.LINKING_CORD, null, SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.KARRABLAST]: [
    new SpeciesEvolution(Species.ESCAVALIER, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition((p: Pokemon) => !!p.scene.getParty().find(p => p.species.speciesId === Species.SHELMET)), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.SHELMET]: [
    new SpeciesEvolution(Species.ACCELGOR, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition((p: Pokemon) => !!p.scene.getParty().find(p => p.species.speciesId === Species.KARRABLAST)), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.SPRITZEE]: [
    new SpeciesEvolution(Species.AROMATISSE, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition((p: Pokemon) => true /*Sachet*/), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.SWIRLIX]: [
    new SpeciesEvolution(Species.SLURPUFF, 1, EvolutionItem.LINKING_CORD, new SpeciesEvolutionCondition((p: Pokemon) => true /*Whipped Dream*/), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.PHANTUMP]: [
    new SpeciesEvolution(Species.TREVENANT, 1, EvolutionItem.LINKING_CORD, null, SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.PUMPKABOO]: [
    new SpeciesEvolution(Species.GOURGEIST, 1, EvolutionItem.LINKING_CORD, null, SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.PRIMEAPE]: [
    new SpeciesEvolution(Species.ANNIHILAPE, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.moveset.filter(m => m.moveId === Moves.RAGE_FIST).length > 0), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.PICHU]: [
    new SpeciesEvolution(Species.PIKACHU, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.CLEFFA]: [
    new SpeciesEvolution(Species.CLEFAIRY, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.IGGLYBUFF]: [
    new SpeciesEvolution(Species.JIGGLYPUFF, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.GOLBAT]: [
    new SpeciesEvolution(Species.CROBAT, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10), SpeciesWildEvolutionDelay.VERY_LONG)
  ],
  [Species.CHANSEY]: [
    new SpeciesEvolution(Species.BLISSEY, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.MUNCHLAX]: [
    new SpeciesEvolution(Species.SNORLAX, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.TOGEPI]: [
    new SpeciesEvolution(Species.TOGETIC, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.AZURILL]: [
    new SpeciesEvolution(Species.MARILL, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.BUDEW]: [
    new SpeciesEvolution(Species.ROSELIA, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount > 10 && p.scene.arena.isDaytime()), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.CHINGLING]: [
    new SpeciesEvolution(Species.CHIMECHO, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10 && !p.scene.arena.isDaytime()), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.BUNEARY]: [
    new SpeciesEvolution(Species.LOPUNNY, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.HAPPINY]: [
    new SpeciesEvolution(Species.CHANSEY, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10), SpeciesWildEvolutionDelay.SHORT)
  ],
  [Species.RIOLU]: [
    new SpeciesEvolution(Species.LUCARIO, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10 && p.scene.arena.isDaytime()), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.WOOBAT]: [
    new SpeciesEvolution(Species.SWOOBAT, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10), SpeciesWildEvolutionDelay.MEDIUM)
  ],
  [Species.SWADLOON]: [
    new SpeciesEvolution(Species.LEAVANNY, 1, null, new SpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10), SpeciesWildEvolutionDelay.LONG)
  ],
  [Species.VENUSAUR]: [
    new SpeciesFormEvolution(Species.VENUSAUR, '', SpeciesFormKey.MEGA, 1, EvolutionItem.VENUSAURITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.BLASTOISE]: [
    new SpeciesFormEvolution(Species.BLASTOISE, '', SpeciesFormKey.MEGA, 1, EvolutionItem.BLASTOISINITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.CHARIZARD]: [
    new SpeciesFormEvolution(Species.CHARIZARD, '', SpeciesFormKey.MEGA_X, 1, EvolutionItem.CHARIZARDITE_X, null, SpeciesWildEvolutionDelay.MEGA),
    new SpeciesFormEvolution(Species.CHARIZARD, '', SpeciesFormKey.MEGA_Y, 1, EvolutionItem.CHARIZARDITE_Y, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.BEEDRILL]: [
    new SpeciesFormEvolution(Species.BEEDRILL, '', SpeciesFormKey.MEGA, 1, EvolutionItem.BEEDRILLITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.PIDGEOT]: [
    new SpeciesFormEvolution(Species.PIDGEOT, '', SpeciesFormKey.MEGA, 1, EvolutionItem.PIDGEOTITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.ALAKAZAM]: [
    new SpeciesFormEvolution(Species.ALAKAZAM, '', SpeciesFormKey.MEGA, 1, EvolutionItem.ALAKAZITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.SLOWBRO]: [
    new SpeciesFormEvolution(Species.SLOWBRO, '', SpeciesFormKey.MEGA, 1, EvolutionItem.SLOWBRONITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.GENGAR]: [
    new SpeciesFormEvolution(Species.GENGAR, '', SpeciesFormKey.MEGA, 1, EvolutionItem.GENGARITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.KANGASKHAN]: [
    new SpeciesFormEvolution(Species.KANGASKHAN, '', SpeciesFormKey.MEGA, 1, EvolutionItem.KANGASKHANITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.PINSIR]: [
    new SpeciesFormEvolution(Species.PINSIR, '', SpeciesFormKey.MEGA, 1, EvolutionItem.PINSIRITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.GYARADOS]: [
    new SpeciesFormEvolution(Species.GYARADOS, '', SpeciesFormKey.MEGA, 1, EvolutionItem.GYARADOSITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.AERODACTYL]: [
    new SpeciesFormEvolution(Species.AERODACTYL, '', SpeciesFormKey.MEGA, 1, EvolutionItem.AERODACTYLITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.MEWTWO]: [
    new SpeciesFormEvolution(Species.MEWTWO, '', SpeciesFormKey.MEGA_X, 1, EvolutionItem.MEWTWONITE_X, null, SpeciesWildEvolutionDelay.MEGA),
    new SpeciesFormEvolution(Species.MEWTWO, '', SpeciesFormKey.MEGA_Y, 1, EvolutionItem.MEWTWONITE_Y, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.AMPHAROS]: [
    new SpeciesFormEvolution(Species.AMPHAROS, '', SpeciesFormKey.MEGA, 1, EvolutionItem.AMPHAROSITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.STEELIX]: [
    new SpeciesFormEvolution(Species.STEELIX, '', SpeciesFormKey.MEGA, 1, EvolutionItem.STEELIXITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.SCIZOR]: [
    new SpeciesFormEvolution(Species.SCIZOR, '', SpeciesFormKey.MEGA, 1, EvolutionItem.SCIZORITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.HERACROSS]: [
    new SpeciesFormEvolution(Species.HERACROSS, '', SpeciesFormKey.MEGA, 1, EvolutionItem.HERACRONITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.HOUNDOOM]: [
    new SpeciesFormEvolution(Species.HOUNDOOM, '', SpeciesFormKey.MEGA, 1, EvolutionItem.HOUNDOOMINITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.TYRANITAR]: [
    new SpeciesFormEvolution(Species.TYRANITAR, '', SpeciesFormKey.MEGA, 1, EvolutionItem.TYRANITARITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.SCEPTILE]: [
    new SpeciesFormEvolution(Species.SCEPTILE, '', SpeciesFormKey.MEGA, 1, EvolutionItem.SCEPTILITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.BLAZIKEN]: [
    new SpeciesFormEvolution(Species.BLAZIKEN, '', SpeciesFormKey.MEGA, 1, EvolutionItem.BLAZIKENITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.SWAMPERT]: [
    new SpeciesFormEvolution(Species.SWAMPERT, '', SpeciesFormKey.MEGA, 1, EvolutionItem.SWAMPERTITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.GARDEVOIR]: [
    new SpeciesFormEvolution(Species.GARDEVOIR, '', SpeciesFormKey.MEGA, 1, EvolutionItem.GARDEVOIRITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.SABLEYE]: [
    new SpeciesFormEvolution(Species.SABLEYE, '', SpeciesFormKey.MEGA, 1, EvolutionItem.SABLENITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.MAWILE]: [
    new SpeciesFormEvolution(Species.MAWILE, '', SpeciesFormKey.MEGA, 1, EvolutionItem.MAWILITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.AGGRON]: [
    new SpeciesFormEvolution(Species.AGGRON, '', SpeciesFormKey.MEGA, 1, EvolutionItem.AGGRONITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.MEDICHAM]: [
    new SpeciesFormEvolution(Species.MEDICHAM, '', SpeciesFormKey.MEGA, 1, EvolutionItem.MEDICHAMITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.MANECTRIC]: [
    new SpeciesFormEvolution(Species.MANECTRIC, '', SpeciesFormKey.MEGA, 1, EvolutionItem.MANECTITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.SHARPEDO]: [
    new SpeciesFormEvolution(Species.SHARPEDO, '', SpeciesFormKey.MEGA, 1, EvolutionItem.SHARPEDONITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.CAMERUPT]: [
    new SpeciesFormEvolution(Species.CAMERUPT, '', SpeciesFormKey.MEGA, 1, EvolutionItem.CAMERUPTITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.ALTARIA]: [
    new SpeciesFormEvolution(Species.ALTARIA, '', SpeciesFormKey.MEGA, 1, EvolutionItem.ALTARIANITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.BANETTE]: [
    new SpeciesFormEvolution(Species.BANETTE, '', SpeciesFormKey.MEGA, 1, EvolutionItem.BANETTITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.ABSOL]: [
    new SpeciesFormEvolution(Species.ABSOL, '', SpeciesFormKey.MEGA, 1, EvolutionItem.ABSOLITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.GLALIE]: [
    new SpeciesFormEvolution(Species.GLALIE, '', SpeciesFormKey.MEGA, 1, EvolutionItem.GLALITITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.SALAMENCE]: [
    new SpeciesFormEvolution(Species.SALAMENCE, '', SpeciesFormKey.MEGA, 1, EvolutionItem.SALAMENCITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.METAGROSS]: [
    new SpeciesFormEvolution(Species.METAGROSS, '', SpeciesFormKey.MEGA, 1, EvolutionItem.METAGROSSITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.LATIAS]: [
    new SpeciesFormEvolution(Species.LATIAS, '', SpeciesFormKey.MEGA, 1, EvolutionItem.LATIASITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.LATIOS]: [
    new SpeciesFormEvolution(Species.LATIOS, '', SpeciesFormKey.MEGA, 1, EvolutionItem.LATIOSITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.RAYQUAZA]: [
    new SpeciesFormEvolution(Species.RAYQUAZA, '', SpeciesFormKey.MEGA, 1, EvolutionItem.RAYQUAZITE, new SpeciesEvolutionCondition((p: Pokemon) => p.moveset.filter(m => m.moveId === Moves.DRAGON_ASCENT).length > 0), SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.LOPUNNY]: [
    new SpeciesFormEvolution(Species.LOPUNNY, '', SpeciesFormKey.MEGA, 1, EvolutionItem.LOPUNNITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.GARCHOMP]: [
    new SpeciesFormEvolution(Species.GARCHOMP, '', SpeciesFormKey.MEGA, 1, EvolutionItem.GARCHOMPITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.LUCARIO]: [
    new SpeciesFormEvolution(Species.LUCARIO, '', SpeciesFormKey.MEGA, 1, EvolutionItem.LUCARIONITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.ABOMASNOW]: [
    new SpeciesFormEvolution(Species.ABOMASNOW, '', SpeciesFormKey.MEGA, 1, EvolutionItem.ABOMASITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.GALLADE]: [
    new SpeciesFormEvolution(Species.GALLADE, '', SpeciesFormKey.MEGA, 1, EvolutionItem.GALLADITE, null, SpeciesWildEvolutionDelay.MEGA)
  ],
  [Species.AUDINO]: [
    new SpeciesFormEvolution(Species.AUDINO, '', SpeciesFormKey.MEGA, 1, EvolutionItem.AUDINITE, null, SpeciesWildEvolutionDelay.MEGA)
  ]
};

interface PokemonPrevolutions {
  [key: string]: Species
}

export const pokemonPrevolutions: PokemonPrevolutions = {};

{
  const megaFormKeys = [ SpeciesFormKey.MEGA, '', SpeciesFormKey.MEGA_X, '', SpeciesFormKey.MEGA_Y ].map(sfk => sfk as string);
  const prevolutionKeys = Object.keys(pokemonEvolutions);
  prevolutionKeys.forEach(pk => {
    const evolutions = pokemonEvolutions[pk];
    for (let ev of evolutions) {
      if (ev.evoFormKey && megaFormKeys.indexOf(ev.evoFormKey) > -1)
        continue;
      pokemonPrevolutions[ev.speciesId] = parseInt(pk) as Species;
    }
  });
}