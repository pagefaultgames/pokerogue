import Pokemon from "./pokemon";
import { Stat } from "./pokemon-stat";
import { Species } from "./species";

export enum WildEvolutionRate {
  NORMAL,
  UNCOMMON,
  RARE,
  ULTRA_RARE,
  TAG_NONE
}

export class PokemonSpeciesEvolution {
  public speciesId: Species;
  public level: integer;
  public item: string;
  public condition: PokemonSpeciesEvolutionCondition | string;
  public wildRate: WildEvolutionRate;

  constructor(speciesId: Species, level: integer, item: string, condition: PokemonSpeciesEvolutionCondition | string, wildRate?: WildEvolutionRate) {
    this.speciesId = speciesId;
    this.level = level;
    this.item = item;
    this.condition = condition;
    this.wildRate = wildRate || WildEvolutionRate.NORMAL;
  }
}

export class PokemonSpeciesEvolutionCondition {
  public predicate: Function;
  public applyToWild: boolean;

  constructor(predicate: Function, applyToWild?: boolean) {
    this.predicate = predicate;
    this.applyToWild = !!applyToWild;
  }
}

export const pokemonEvolutions = {
  [Species.BULBASAUR]: [
    new PokemonSpeciesEvolution(Species.IVYSAUR, 16, null, null)
  ],
  [Species.IVYSAUR]: [
    new PokemonSpeciesEvolution(Species.VENUSAUR, 32, null, null)
  ],
  [Species.CHARMANDER]: [
    new PokemonSpeciesEvolution(Species.CHARMELEON, 16, null, null)
  ],
  [Species.CHARMELEON]: [
    new PokemonSpeciesEvolution(Species.CHARIZARD, 36, null, null)
  ],
  [Species.SQUIRTLE]: [
    new PokemonSpeciesEvolution(Species.WARTORTLE, 16, null, null)
  ],
  [Species.WARTORTLE]: [
    new PokemonSpeciesEvolution(Species.BLASTOISE, 36, null, null)
  ],
  [Species.CATERPIE]: [
    new PokemonSpeciesEvolution(Species.METAPOD, 7, null, null)
  ],
  [Species.METAPOD]: [
    new PokemonSpeciesEvolution(Species.BUTTERFREE, 10, null, null)
  ],
  [Species.WEEDLE]: [
    new PokemonSpeciesEvolution(Species.KAKUNA, 7, null, null)
  ],
  [Species.KAKUNA]: [
    new PokemonSpeciesEvolution(Species.BEEDRILL, 10, null, null)
  ],
  [Species.PIDGEY]: [
    new PokemonSpeciesEvolution(Species.PIDGEOTTO, 18, null, null)
  ],
  [Species.PIDGEOTTO]: [
    new PokemonSpeciesEvolution(Species.PIDGEOT, 36, null, null)
  ],
  [Species.RATTATA]: [
    new PokemonSpeciesEvolution(Species.RATICATE, 20, null, null)
  ],
  [Species.SPEAROW]: [
    new PokemonSpeciesEvolution(Species.FEAROW, 20, null, null)
  ],
  [Species.EKANS]: [
    new PokemonSpeciesEvolution(Species.ARBOK, 22, null, null)
  ],
  [Species.SANDSHREW]: [
    new PokemonSpeciesEvolution(Species.SANDSLASH, 22, null, null)
  ],
  [Species.NIDORAN_F]: [
    new PokemonSpeciesEvolution(Species.NIDORINA, 16, null, null)
  ],
  [Species.NIDORAN_M]: [
    new PokemonSpeciesEvolution(Species.NIDORINO, 16, null, null)
  ],
  [Species.ZUBAT]: [
    new PokemonSpeciesEvolution(Species.GOLBAT, 22, null, null)
  ],
  [Species.ODDISH]: [
    new PokemonSpeciesEvolution(Species.GLOOM, 21, null, null)
  ],
  [Species.PARAS]: [
    new PokemonSpeciesEvolution(Species.PARASECT, 24, null, null)
  ],
  [Species.VENONAT]: [
    new PokemonSpeciesEvolution(Species.VENOMOTH, 31, null, null)
  ],
  [Species.DIGLETT]: [
    new PokemonSpeciesEvolution(Species.DUGTRIO, 26, null, null)
  ],
  [Species.MEOWTH]: [
    new PokemonSpeciesEvolution(Species.PERSIAN, 28, null, null)
  ],
  [Species.PSYDUCK]: [
    new PokemonSpeciesEvolution(Species.GOLDUCK, 33, null, null)
  ],
  [Species.MANKEY]: [
    new PokemonSpeciesEvolution(Species.PRIMEAPE, 28, null, null)
  ],
  [Species.POLIWAG]: [
    new PokemonSpeciesEvolution(Species.POLIWHIRL, 25, null, null)
  ],
  [Species.ABRA]: [
    new PokemonSpeciesEvolution(Species.KADABRA, 16, null, null)
  ],
  [Species.MACHOP]: [
    new PokemonSpeciesEvolution(Species.MACHOKE, 28, null, null)
  ],
  [Species.BELLSPROUT]: [
    new PokemonSpeciesEvolution(Species.WEEPINBELL, 21, null, null)
  ],
  [Species.TENTACOOL]: [
    new PokemonSpeciesEvolution(Species.TENTACRUEL, 30, null, null)
  ],
  [Species.GEODUDE]: [
    new PokemonSpeciesEvolution(Species.GRAVELER, 25, null, null)
  ],
  [Species.PONYTA]: [
    new PokemonSpeciesEvolution(Species.RAPIDASH, 40, null, null)
  ],
  [Species.SLOWPOKE]: [
    new PokemonSpeciesEvolution(Species.SLOWBRO, 37, null, null)
  ],
  [Species.MAGNEMITE]: [
    new PokemonSpeciesEvolution(Species.MAGNETON, 30, null, null)
  ],
  [Species.DODUO]: [
    new PokemonSpeciesEvolution(Species.DODRIO, 31, null, null)
  ],
  [Species.SEEL]: [
    new PokemonSpeciesEvolution(Species.DEWGONG, 34, null, null)
  ],
  [Species.GRIMER]: [
    new PokemonSpeciesEvolution(Species.MUK, 38, null, null)
  ],
  [Species.GASTLY]: [
    new PokemonSpeciesEvolution(Species.HAUNTER, 25, null, null)
  ],
  [Species.DROWZEE]: [
    new PokemonSpeciesEvolution(Species.HYPNO, 26, null, null)
  ],
  [Species.KRABBY]: [
    new PokemonSpeciesEvolution(Species.KINGLER, 28, null, null)
  ],
  [Species.VOLTORB]: [
    new PokemonSpeciesEvolution(Species.ELECTRODE, 30, null, null)
  ],
  [Species.CUBONE]: [
    new PokemonSpeciesEvolution(Species.MAROWAK, 28, null, null)
  ],
  [Species.TYROGUE]: [
    new PokemonSpeciesEvolution(Species.HITMONLEE, 20, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.stats[Stat.ATK] > p.stats[Stat.DEF])),
    new PokemonSpeciesEvolution(Species.HITMONCHAN, 20, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.stats[Stat.ATK] < p.stats[Stat.DEF])),
    new PokemonSpeciesEvolution(Species.HITMONTOP, 20, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.stats[Stat.ATK] === p.stats[Stat.DEF]))
  ],
  [Species.KOFFING]: [
    new PokemonSpeciesEvolution(Species.WEEZING, 35, null, null)
  ],
  [Species.RHYHORN]: [
    new PokemonSpeciesEvolution(Species.RHYDON, 42, null, null)
  ],
  [Species.HORSEA]: [
    new PokemonSpeciesEvolution(Species.SEADRA, 32, null, null)
  ],
  [Species.GOLDEEN]: [
    new PokemonSpeciesEvolution(Species.SEAKING, 33, null, null)
  ],
  [Species.SMOOCHUM]: [
    new PokemonSpeciesEvolution(Species.JYNX, 30, null, null)
  ],
  [Species.ELEKID]: [
    new PokemonSpeciesEvolution(Species.ELECTABUZZ, 30, null, null)
  ],
  [Species.MAGBY]: [
    new PokemonSpeciesEvolution(Species.MAGMAR, 30, null, null)
  ],
  [Species.MAGIKARP]: [
    new PokemonSpeciesEvolution(Species.GYARADOS, 20, null, null)
  ],
  [Species.OMANYTE]: [
    new PokemonSpeciesEvolution(Species.OMASTAR, 40, null, null)
  ],
  [Species.KABUTO]: [
    new PokemonSpeciesEvolution(Species.KABUTOPS, 40, null, null)
  ],
  [Species.DRATINI]: [
    new PokemonSpeciesEvolution(Species.DRAGONAIR, 30, null, null)
  ],
  [Species.DRAGONAIR]: [
    new PokemonSpeciesEvolution(Species.DRAGONITE, 55, null, null)
  ],
  [Species.CHIKORITA]: [
    new PokemonSpeciesEvolution(Species.BAYLEEF, 16, null, null)
  ],
  [Species.BAYLEEF]: [
    new PokemonSpeciesEvolution(Species.MEGANIUM, 32, null, null)
  ],
  [Species.CYNDAQUIL]: [
    new PokemonSpeciesEvolution(Species.QUILAVA, 14, null, null)
  ],
  [Species.QUILAVA]: [
    new PokemonSpeciesEvolution(Species.TYPHLOSION, 36, null, null)
  ],
  [Species.TOTODILE]: [
    new PokemonSpeciesEvolution(Species.CROCONAW, 18, null, null)
  ],
  [Species.CROCONAW]: [
    new PokemonSpeciesEvolution(Species.FERALIGATR, 30, null, null)
  ],
  [Species.SENTRET]: [
    new PokemonSpeciesEvolution(Species.FURRET, 15, null, null)
  ],
  [Species.HOOTHOOT]: [
    new PokemonSpeciesEvolution(Species.NOCTOWL, 20, null, null)
  ],
  [Species.LEDYBA]: [
    new PokemonSpeciesEvolution(Species.LEDIAN, 18, null, null)
  ],
  [Species.SPINARAK]: [
    new PokemonSpeciesEvolution(Species.ARIADOS, 22, null, null)
  ],
  [Species.CHINCHOU]: [
    new PokemonSpeciesEvolution(Species.LANTURN, 27, null, null)
  ],
  [Species.NATU]: [
    new PokemonSpeciesEvolution(Species.XATU, 25, null, null)
  ],
  [Species.MAREEP]: [
    new PokemonSpeciesEvolution(Species.FLAAFFY, 15, null, null)
  ],
  [Species.FLAAFFY]: [
    new PokemonSpeciesEvolution(Species.AMPHAROS, 30, null, null)
  ],
  [Species.MARILL]: [
    new PokemonSpeciesEvolution(Species.AZUMARILL, 18, null, null)
  ],
  [Species.HOPPIP]: [
    new PokemonSpeciesEvolution(Species.SKIPLOOM, 18, null, null)
  ],
  [Species.SKIPLOOM]: [
    new PokemonSpeciesEvolution(Species.JUMPLUFF, 27, null, null)
  ],
  [Species.WOOPER]: [
    new PokemonSpeciesEvolution(Species.QUAGSIRE, 20, null, null)
  ],
  [Species.WYNAUT]: [
    new PokemonSpeciesEvolution(Species.WOBBUFFET, 15, null, null)
  ],
  [Species.PINECO]: [
    new PokemonSpeciesEvolution(Species.FORRETRESS, 31, null, null)
  ],
  [Species.SNUBBULL]: [
    new PokemonSpeciesEvolution(Species.GRANBULL, 23, null, null)
  ],
  [Species.TEDDIURSA]: [
    new PokemonSpeciesEvolution(Species.URSARING, 30, null, null)
  ],
  [Species.SLUGMA]: [
    new PokemonSpeciesEvolution(Species.MAGCARGO, 38, null, null)
  ],
  [Species.SWINUB]: [
    new PokemonSpeciesEvolution(Species.PILOSWINE, 33, null, null)
  ],
  [Species.REMORAID]: [
    new PokemonSpeciesEvolution(Species.OCTILLERY, 25, null, null)
  ],
  [Species.HOUNDOUR]: [
    new PokemonSpeciesEvolution(Species.HOUNDOOM, 24, null, null)
  ],
  [Species.PHANPY]: [
    new PokemonSpeciesEvolution(Species.DONPHAN, 25, null, null)
  ],
  [Species.LARVITAR]: [
    new PokemonSpeciesEvolution(Species.PUPITAR, 30, null, null)
  ],
  [Species.PUPITAR]: [
    new PokemonSpeciesEvolution(Species.TYRANITAR, 55, null, null)
  ],
  [Species.TREECKO]: [
    new PokemonSpeciesEvolution(Species.GROVYLE, 16, null, null)
  ],
  [Species.GROVYLE]: [
    new PokemonSpeciesEvolution(Species.SCEPTILE, 36, null, null)
  ],
  [Species.TORCHIC]: [
    new PokemonSpeciesEvolution(Species.COMBUSKEN, 16, null, null)
  ],
  [Species.COMBUSKEN]: [
    new PokemonSpeciesEvolution(Species.BLAZIKEN, 36, null, null)
  ],
  [Species.MUDKIP]: [
    new PokemonSpeciesEvolution(Species.MARSHTOMP, 16, null, null)
  ],
  [Species.MARSHTOMP]: [
    new PokemonSpeciesEvolution(Species.SWAMPERT, 36, null, null)
  ],
  [Species.POOCHYENA]: [
    new PokemonSpeciesEvolution(Species.MIGHTYENA, 18, null, null)
  ],
  [Species.ZIGZAGOON]: [
    new PokemonSpeciesEvolution(Species.LINOONE, 20, null, null)
  ],
  [Species.WURMPLE]: [
    new PokemonSpeciesEvolution(Species.SILCOON, 7, null, 'random based on personality'),
    new PokemonSpeciesEvolution(Species.CASCOON, 7, null, 'random based on personality')
  ],
  [Species.SILCOON]: [
    new PokemonSpeciesEvolution(Species.BEAUTIFLY, 10, null, null)
  ],
  [Species.CASCOON]: [
    new PokemonSpeciesEvolution(Species.DUSTOX, 10, null, null)
  ],
  [Species.LOTAD]: [
    new PokemonSpeciesEvolution(Species.LOMBRE, 14, null, null)
  ],
  [Species.SEEDOT]: [
    new PokemonSpeciesEvolution(Species.NUZLEAF, 14, null, null)
  ],
  [Species.TAILLOW]: [
    new PokemonSpeciesEvolution(Species.SWELLOW, 22, null, null)
  ],
  [Species.WINGULL]: [
    new PokemonSpeciesEvolution(Species.PELIPPER, 25, null, null)
  ],
  [Species.RALTS]: [
    new PokemonSpeciesEvolution(Species.KIRLIA, 20, null, null)
  ],
  [Species.KIRLIA]: [
    new PokemonSpeciesEvolution(Species.GARDEVOIR, 30, null, null),
    new PokemonSpeciesEvolution(Species.GALLADE, 1, "Dawn Stone", new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.gender, true), WildEvolutionRate.RARE)
  ],
  [Species.SURSKIT]: [
    new PokemonSpeciesEvolution(Species.MASQUERAIN, 22, null, null)
  ],
  [Species.SHROOMISH]: [
    new PokemonSpeciesEvolution(Species.BRELOOM, 23, null, null)
  ],
  [Species.SLAKOTH]: [
    new PokemonSpeciesEvolution(Species.VIGOROTH, 18, null, null)
  ],
  [Species.VIGOROTH]: [
    new PokemonSpeciesEvolution(Species.SLAKING, 36, null, null)
  ],
  [Species.NINCADA]: [
    new PokemonSpeciesEvolution(Species.NINJASK, 20, null, null),
    new PokemonSpeciesEvolution(Species.SHEDINJA, 20, null, 'empty spot in party, Pokéball in bag', WildEvolutionRate.ULTRA_RARE)
  ],
  [Species.WHISMUR]: [
    new PokemonSpeciesEvolution(Species.LOUDRED, 20, null, null)
  ],
  [Species.LOUDRED]: [
    new PokemonSpeciesEvolution(Species.EXPLOUD, 40, null, null)
  ],
  [Species.MAKUHITA]: [
    new PokemonSpeciesEvolution(Species.HARIYAMA, 24, null, null)
  ],
  [Species.ARON]: [
    new PokemonSpeciesEvolution(Species.LAIRON, 32, null, null)
  ],
  [Species.LAIRON]: [
    new PokemonSpeciesEvolution(Species.AGGRON, 42, null, null)
  ],
  [Species.MEDITITE]: [
    new PokemonSpeciesEvolution(Species.MEDICHAM, 37, null, null)
  ],
  [Species.ELECTRIKE]: [
    new PokemonSpeciesEvolution(Species.MANECTRIC, 26, null, null)
  ],
  [Species.GULPIN]: [
    new PokemonSpeciesEvolution(Species.SWALOT, 26, null, null)
  ],
  [Species.CARVANHA]: [
    new PokemonSpeciesEvolution(Species.SHARPEDO, 30, null, null)
  ],
  [Species.WAILMER]: [
    new PokemonSpeciesEvolution(Species.WAILORD, 40, null, null, WildEvolutionRate.UNCOMMON)
  ],
  [Species.NUMEL]: [
    new PokemonSpeciesEvolution(Species.CAMERUPT, 33, null, null)
  ],
  [Species.SPOINK]: [
    new PokemonSpeciesEvolution(Species.GRUMPIG, 32, null, null)
  ],
  [Species.TRAPINCH]: [
    new PokemonSpeciesEvolution(Species.VIBRAVA, 35, null, null)
  ],
  [Species.VIBRAVA]: [
    new PokemonSpeciesEvolution(Species.FLYGON, 45, null, null)
  ],
  [Species.CACNEA]: [
    new PokemonSpeciesEvolution(Species.CACTURNE, 32, null, null)
  ],
  [Species.SWABLU]: [
    new PokemonSpeciesEvolution(Species.ALTARIA, 35, null, null)
  ],
  [Species.BARBOACH]: [
    new PokemonSpeciesEvolution(Species.WHISCASH, 30, null, null)
  ],
  [Species.CORPHISH]: [
    new PokemonSpeciesEvolution(Species.CRAWDAUNT, 30, null, null)
  ],
  [Species.BALTOY]: [
    new PokemonSpeciesEvolution(Species.CLAYDOL, 36, null, null)
  ],
  [Species.LILEEP]: [
    new PokemonSpeciesEvolution(Species.CRADILY, 40, null, null)
  ],
  [Species.ANORITH]: [
    new PokemonSpeciesEvolution(Species.ARMALDO, 40, null, null)
  ],
  [Species.SHUPPET]: [
    new PokemonSpeciesEvolution(Species.BANETTE, 37, null, null)
  ],
  [Species.DUSKULL]: [
    new PokemonSpeciesEvolution(Species.DUSCLOPS, 37, null, null)
  ],
  [Species.SNORUNT]: [
    new PokemonSpeciesEvolution(Species.GLALIE, 42, null, null),
    new PokemonSpeciesEvolution(Species.FROSLASS, 1, "Dawn Stone", new PokemonSpeciesEvolutionCondition((p: Pokemon) => !p.gender, true), WildEvolutionRate.RARE)
  ],
  [Species.SPHEAL]: [
    new PokemonSpeciesEvolution(Species.SEALEO, 32, null, null)
  ],
  [Species.SEALEO]: [
    new PokemonSpeciesEvolution(Species.WALREIN, 44, null, null)
  ],
  [Species.BAGON]: [
    new PokemonSpeciesEvolution(Species.SHELGON, 30, null, null)
  ],
  [Species.SHELGON]: [
    new PokemonSpeciesEvolution(Species.SALAMENCE, 50, null, null)
  ],
  [Species.BELDUM]: [
    new PokemonSpeciesEvolution(Species.METANG, 20, null, null)
  ],
  [Species.METANG]: [
    new PokemonSpeciesEvolution(Species.METAGROSS, 45, null, null)
  ],
  [Species.TURTWIG]: [
    new PokemonSpeciesEvolution(Species.GROTLE, 18, null, null)
  ],
  [Species.GROTLE]: [
    new PokemonSpeciesEvolution(Species.TORTERRA, 32, null, null)
  ],
  [Species.CHIMCHAR]: [
    new PokemonSpeciesEvolution(Species.MONFERNO, 14, null, null)
  ],
  [Species.MONFERNO]: [
    new PokemonSpeciesEvolution(Species.INFERNAPE, 36, null, null)
  ],
  [Species.PIPLUP]: [
    new PokemonSpeciesEvolution(Species.PRINPLUP, 16, null, null)
  ],
  [Species.PRINPLUP]: [
    new PokemonSpeciesEvolution(Species.EMPOLEON, 36, null, null)
  ],
  [Species.STARLY]: [
    new PokemonSpeciesEvolution(Species.STARAVIA, 14, null, null)
  ],
  [Species.STARAVIA]: [
    new PokemonSpeciesEvolution(Species.STARAPTOR, 34, null, null)
  ],
  [Species.BIDOOF]: [
    new PokemonSpeciesEvolution(Species.BIBAREL, 15, null, null)
  ],
  [Species.KRICKETOT]: [
    new PokemonSpeciesEvolution(Species.KRICKETUNE, 10, null, null)
  ],
  [Species.SHINX]: [
    new PokemonSpeciesEvolution(Species.LUXIO, 15, null, null)
  ],
  [Species.LUXIO]: [
    new PokemonSpeciesEvolution(Species.LUXRAY, 30, null, null)
  ],
  [Species.CRANIDOS]: [
    new PokemonSpeciesEvolution(Species.RAMPARDOS, 30, null, null)
  ],
  [Species.SHIELDON]: [
    new PokemonSpeciesEvolution(Species.BASTIODON, 30, null, null)
  ],
  [Species.BURMY]: [
    new PokemonSpeciesEvolution(Species.MOTHIM, 20, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.gender, true)),
    new PokemonSpeciesEvolution(Species.WORMADAM, 20, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => !p.gender/* && grass*/, true)),
    new PokemonSpeciesEvolution(Species.WORMADAM, 20, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => !p.gender/* && cave*/, true)),
    new PokemonSpeciesEvolution(Species.WORMADAM, 20, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => !p.gender/* && building*/, true))
  ],
  [Species.COMBEE]: [
    new PokemonSpeciesEvolution(Species.VESPIQUEN, 21, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => !p.gender, true))
  ],
  [Species.BUIZEL]: [
    new PokemonSpeciesEvolution(Species.FLOATZEL, 26, null, null)
  ],
  [Species.CHERUBI]: [
    new PokemonSpeciesEvolution(Species.CHERRIM, 25, null, null)
  ],
  [Species.SHELLOS]: [
    new PokemonSpeciesEvolution(Species.GASTRODON, 30, null, null)
  ],
  [Species.DRIFLOON]: [
    new PokemonSpeciesEvolution(Species.DRIFBLIM, 28, null, null)
  ],
  [Species.GLAMEOW]: [
    new PokemonSpeciesEvolution(Species.PURUGLY, 38, null, null)
  ],
  [Species.STUNKY]: [
    new PokemonSpeciesEvolution(Species.SKUNTANK, 34, null, null)
  ],
  [Species.BRONZOR]: [
    new PokemonSpeciesEvolution(Species.BRONZONG, 33, null, null)
  ],
  [Species.GIBLE]: [
    new PokemonSpeciesEvolution(Species.GABITE, 24, null, null)
  ],
  [Species.GABITE]: [
    new PokemonSpeciesEvolution(Species.GARCHOMP, 48, null, null)
  ],
  [Species.HIPPOPOTAS]: [
    new PokemonSpeciesEvolution(Species.HIPPOWDON, 34, null, null)
  ],
  [Species.SKORUPI]: [
    new PokemonSpeciesEvolution(Species.DRAPION, 40, null, null)
  ],
  [Species.CROAGUNK]: [
    new PokemonSpeciesEvolution(Species.TOXICROAK, 37, null, null)
  ],
  [Species.FINNEON]: [
    new PokemonSpeciesEvolution(Species.LUMINEON, 31, null, null)
  ],
  [Species.SNOVER]: [
    new PokemonSpeciesEvolution(Species.ABOMASNOW, 40, null, null)
  ],
  [Species.SNIVY]: [
    new PokemonSpeciesEvolution(Species.SERVINE, 17, null, null)
  ],
  [Species.SERVINE]: [
    new PokemonSpeciesEvolution(Species.SERPERIOR, 36, null, null)
  ],
  [Species.TEPIG]: [
    new PokemonSpeciesEvolution(Species.PIGNITE, 17, null, null)
  ],
  [Species.PIGNITE]: [
    new PokemonSpeciesEvolution(Species.EMBOAR, 36, null, null)
  ],
  [Species.OSHAWOTT]: [
    new PokemonSpeciesEvolution(Species.DEWOTT, 17, null, null)
  ],
  [Species.DEWOTT]: [
    new PokemonSpeciesEvolution(Species.SAMUROTT, 36, null, null)
  ],
  [Species.PATRAT]: [
    new PokemonSpeciesEvolution(Species.WATCHOG, 20, null, null)
  ],
  [Species.LILLIPUP]: [
    new PokemonSpeciesEvolution(Species.HERDIER, 16, null, null)
  ],
  [Species.HERDIER]: [
    new PokemonSpeciesEvolution(Species.STOUTLAND, 32, null, null)
  ],
  [Species.PURRLOIN]: [
    new PokemonSpeciesEvolution(Species.LIEPARD, 20, null, null)
  ],
  [Species.PIDOVE]: [
    new PokemonSpeciesEvolution(Species.TRANQUILL, 21, null, null)
  ],
  [Species.TRANQUILL]: [
    new PokemonSpeciesEvolution(Species.UNFEZANT, 32, null, null)
  ],
  [Species.BLITZLE]: [
    new PokemonSpeciesEvolution(Species.ZEBSTRIKA, 27, null, null)
  ],
  [Species.ROGGENROLA]: [
    new PokemonSpeciesEvolution(Species.BOLDORE, 25, null, null)
  ],
  [Species.DRILBUR]: [
    new PokemonSpeciesEvolution(Species.EXCADRILL, 31, null, null)
  ],
  [Species.TIMBURR]: [
    new PokemonSpeciesEvolution(Species.GURDURR, 25, null, null)
  ],
  [Species.TYMPOLE]: [
    new PokemonSpeciesEvolution(Species.PALPITOAD, 25, null, null)
  ],
  [Species.PALPITOAD]: [
    new PokemonSpeciesEvolution(Species.SEISMITOAD, 36, null, null)
  ],
  [Species.SEWADDLE]: [
    new PokemonSpeciesEvolution(Species.SWADLOON, 20, null, null)
  ],
  [Species.VENIPEDE]: [
    new PokemonSpeciesEvolution(Species.WHIRLIPEDE, 22, null, null)
  ],
  [Species.WHIRLIPEDE]: [
    new PokemonSpeciesEvolution(Species.SCOLIPEDE, 30, null, null)
  ],
  [Species.SANDILE]: [
    new PokemonSpeciesEvolution(Species.KROKOROK, 29, null, null)
  ],
  [Species.KROKOROK]: [
    new PokemonSpeciesEvolution(Species.KROOKODILE, 40, null, null)
  ],
  [Species.DARUMAKA]: [
    new PokemonSpeciesEvolution(Species.DARMANITAN, 35, null, null)
  ],
  [Species.DWEBBLE]: [
    new PokemonSpeciesEvolution(Species.CRUSTLE, 34, null, null)
  ],
  [Species.SCRAGGY]: [
    new PokemonSpeciesEvolution(Species.SCRAFTY, 39, null, null)
  ],
  [Species.YAMASK]: [
    new PokemonSpeciesEvolution(Species.COFAGRIGUS, 34, null, null)
  ],
  [Species.TIRTOUGA]: [
    new PokemonSpeciesEvolution(Species.CARRACOSTA, 37, null, null)
  ],
  [Species.ARCHEN]: [
    new PokemonSpeciesEvolution(Species.ARCHEOPS, 37, null, null)
  ],
  [Species.TRUBBISH]: [
    new PokemonSpeciesEvolution(Species.GARBODOR, 36, null, null)
  ],
  [Species.ZORUA]: [
    new PokemonSpeciesEvolution(Species.ZOROARK, 30, null, null)
  ],
  [Species.GOTHITA]: [
    new PokemonSpeciesEvolution(Species.GOTHORITA, 32, null, null)
  ],
  [Species.GOTHORITA]: [
    new PokemonSpeciesEvolution(Species.GOTHITELLE, 41, null, null)
  ],
  [Species.SOLOSIS]: [
    new PokemonSpeciesEvolution(Species.DUOSION, 32, null, null)
  ],
  [Species.DUOSION]: [
    new PokemonSpeciesEvolution(Species.REUNICLUS, 41, null, null)
  ],
  [Species.DUCKLETT]: [
    new PokemonSpeciesEvolution(Species.SWANNA, 35, null, null)
  ],
  [Species.VANILLITE]: [
    new PokemonSpeciesEvolution(Species.VANILLISH, 35, null, null)
  ],
  [Species.VANILLISH]: [
    new PokemonSpeciesEvolution(Species.VANILLUXE, 47, null, null)
  ],
  [Species.DEERLING]: [
    new PokemonSpeciesEvolution(Species.SAWSBUCK, 34, null, null)
  ],
  [Species.FOONGUS]: [
    new PokemonSpeciesEvolution(Species.AMOONGUSS, 39, null, null)
  ],
  [Species.FRILLISH]: [
    new PokemonSpeciesEvolution(Species.JELLICENT, 40, null, null)
  ],
  [Species.JOLTIK]: [
    new PokemonSpeciesEvolution(Species.GALVANTULA, 36, null, null)
  ],
  [Species.FERROSEED]: [
    new PokemonSpeciesEvolution(Species.FERROTHORN, 40, null, null)
  ],
  [Species.KLINK]: [
    new PokemonSpeciesEvolution(Species.KLANG, 38, null, null)
  ],
  [Species.KLANG]: [
    new PokemonSpeciesEvolution(Species.KLINKLANG, 49, null, null)
  ],
  [Species.TYNAMO]: [
    new PokemonSpeciesEvolution(Species.EELEKTRIK, 39, null, null)
  ],
  [Species.ELGYEM]: [
    new PokemonSpeciesEvolution(Species.BEHEEYEM, 42, null, null)
  ],
  [Species.LITWICK]: [
    new PokemonSpeciesEvolution(Species.LAMPENT, 41, null, null)
  ],
  [Species.AXEW]: [
    new PokemonSpeciesEvolution(Species.FRAXURE, 38, null, null)
  ],
  [Species.FRAXURE]: [
    new PokemonSpeciesEvolution(Species.HAXORUS, 48, null, null)
  ],
  [Species.CUBCHOO]: [
    new PokemonSpeciesEvolution(Species.BEARTIC, 37, null, null)
  ],
  [Species.MIENFOO]: [
    new PokemonSpeciesEvolution(Species.MIENSHAO, 50, null, null)
  ],
  [Species.GOLETT]: [
    new PokemonSpeciesEvolution(Species.GOLURK, 43, null, null)
  ],
  [Species.PAWNIARD]: [
    new PokemonSpeciesEvolution(Species.BISHARP, 52, null, null)
  ],
  [Species.RUFFLET]: [
    new PokemonSpeciesEvolution(Species.BRAVIARY, 54, null, null)
  ],
  [Species.VULLABY]: [
    new PokemonSpeciesEvolution(Species.MANDIBUZZ, 54, null, null)
  ],
  [Species.DEINO]: [
    new PokemonSpeciesEvolution(Species.ZWEILOUS, 50, null, null)
  ],
  [Species.ZWEILOUS]: [
    new PokemonSpeciesEvolution(Species.HYDREIGON, 64, null, null)
  ],
  [Species.LARVESTA]: [
    new PokemonSpeciesEvolution(Species.VOLCARONA, 59, null, null)
  ],
  [Species.PIKACHU]: [
    new PokemonSpeciesEvolution(Species.RAICHU, 1, "Thunder Stone", null)
  ],
  [Species.NIDORINA]: [
    new PokemonSpeciesEvolution(Species.NIDOQUEEN, 1, "Moon Stone", null)
  ],
  [Species.NIDORINO]: [
    new PokemonSpeciesEvolution(Species.NIDOKING, 1, "Moon Stone", null)
  ],
  [Species.CLEFAIRY]: [
    new PokemonSpeciesEvolution(Species.CLEFABLE, 1, "Moon Stone", null)
  ],
  [Species.VULPIX]: [
    new PokemonSpeciesEvolution(Species.NINETALES, 1, "Fire Stone", null)
  ],
  [Species.JIGGLYPUFF]: [
    new PokemonSpeciesEvolution(Species.WIGGLYTUFF, 1, "Moon Stone", null)
  ],
  [Species.GLOOM]: [
    new PokemonSpeciesEvolution(Species.VILEPLUME, 1, "Leaf Stone", null),
    new PokemonSpeciesEvolution(Species.BELLOSSOM, 1, "Sun Stone", null)
  ],
  [Species.GROWLITHE]: [
    new PokemonSpeciesEvolution(Species.ARCANINE, 1, "Fire Stone", null)
  ],
  [Species.POLIWHIRL]: [
    new PokemonSpeciesEvolution(Species.POLIWRATH, 1, "Water Stone", null),
    new PokemonSpeciesEvolution(Species.POLITOED, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true /* King's rock*/), WildEvolutionRate.RARE)
  ],
  [Species.WEEPINBELL]: [
    new PokemonSpeciesEvolution(Species.VICTREEBEL, 1, "Leaf Stone", null)
  ],
  [Species.MAGNETON]: [
    new PokemonSpeciesEvolution(Species.MAGNEZONE, 1, "Thunder Stone", null)
  ],
  [Species.SHELLDER]: [
    new PokemonSpeciesEvolution(Species.CLOYSTER, 1, "Water Stone", null)
  ],
  [Species.EXEGGCUTE]: [
    new PokemonSpeciesEvolution(Species.EXEGGUTOR, 1, "Leaf Stone", null)
  ],
  [Species.STARYU]: [
    new PokemonSpeciesEvolution(Species.STARMIE, 1, "Water Stone", null)
  ],
  [Species.EEVEE]: [
    new PokemonSpeciesEvolution(Species.ESPEON, 1, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10 /* daytime */), WildEvolutionRate.RARE),
    new PokemonSpeciesEvolution(Species.UMBREON, 1, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10 /* nighttime */), WildEvolutionRate.RARE),
    new PokemonSpeciesEvolution(Species.VAPOREON, 1, "Water Stone", null, WildEvolutionRate.UNCOMMON),
    new PokemonSpeciesEvolution(Species.JOLTEON, 1, "Thunder Stone", null, WildEvolutionRate.UNCOMMON),
    new PokemonSpeciesEvolution(Species.FLAREON, 1, "Fire Stone", null, WildEvolutionRate.UNCOMMON),
    new PokemonSpeciesEvolution(Species.LEAFEON, 1, "Leaf Stone", null, WildEvolutionRate.UNCOMMON),
    new PokemonSpeciesEvolution(Species.GLACEON, 1, "Ice Stone", null, WildEvolutionRate.UNCOMMON)
  ],
  [Species.TOGETIC]: [
    new PokemonSpeciesEvolution(Species.TOGEKISS, 1, "Shiny Stone", null, WildEvolutionRate.RARE)
  ],
  [Species.SUNKERN]: [
    new PokemonSpeciesEvolution(Species.SUNFLORA, 1, "Sun Stone", null)
  ],
  [Species.MURKROW]: [
    new PokemonSpeciesEvolution(Species.HONCHKROW, 1, "Dusk Stone", null, WildEvolutionRate.RARE)
  ],
  [Species.MISDREAVUS]: [
    new PokemonSpeciesEvolution(Species.MISMAGIUS, 1, "Dusk Stone", null, WildEvolutionRate.RARE)
  ],
  [Species.LOMBRE]: [
    new PokemonSpeciesEvolution(Species.LUDICOLO, 1, "Water Stone", null)
  ],
  [Species.NUZLEAF]: [
    new PokemonSpeciesEvolution(Species.SHIFTRY, 1, "Leaf Stone", null)
  ],
  [Species.SKITTY]: [
    new PokemonSpeciesEvolution(Species.DELCATTY, 1, "Moon Stone", null)
  ],
  [Species.ROSELIA]: [
    new PokemonSpeciesEvolution(Species.ROSERADE, 1, "Shiny Stone", null)
  ],
  [Species.PANSAGE]: [
    new PokemonSpeciesEvolution(Species.SIMISAGE, 1, "Leaf Stone", null)
  ],
  [Species.PANSEAR]: [
    new PokemonSpeciesEvolution(Species.SIMISEAR, 1, "Fire Stone", null)
  ],
  [Species.PANPOUR]: [
    new PokemonSpeciesEvolution(Species.SIMIPOUR, 1, "Water Stone", null)
  ],
  [Species.MUNNA]: [
    new PokemonSpeciesEvolution(Species.MUSHARNA, 1, "Moon Stone", null)
  ],
  [Species.COTTONEE]: [
    new PokemonSpeciesEvolution(Species.WHIMSICOTT, 1, "Sun Stone", null)
  ],
  [Species.PETILIL]: [
    new PokemonSpeciesEvolution(Species.LILLIGANT, 1, "Sun Stone", null)
  ],
  [Species.MINCCINO]: [
    new PokemonSpeciesEvolution(Species.CINCCINO, 1, "Shiny Stone", null, WildEvolutionRate.UNCOMMON)
  ],
  [Species.EELEKTRIK]: [
    new PokemonSpeciesEvolution(Species.EELEKTROSS, 1, "Thunder Stone", null)
  ],
  [Species.LAMPENT]: [
    new PokemonSpeciesEvolution(Species.CHANDELURE, 1, "Dusk Stone", null)
  ],
  [Species.KADABRA]: [
    new PokemonSpeciesEvolution(Species.ALAKAZAM, 1, "Link Cable", null)
  ],
  [Species.MACHOKE]: [
    new PokemonSpeciesEvolution(Species.MACHAMP, 1, "Link Cable", null, WildEvolutionRate.UNCOMMON)
  ],
  [Species.GRAVELER]: [
    new PokemonSpeciesEvolution(Species.GOLEM, 1, "Link Cable", null, WildEvolutionRate.UNCOMMON)
  ],
  [Species.SLOWPOKE]: [
    new PokemonSpeciesEvolution(Species.SLOWKING, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true /* King's rock*/), WildEvolutionRate.RARE)
  ],
  [Species.HAUNTER]: [
    new PokemonSpeciesEvolution(Species.GENGAR, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true), WildEvolutionRate.UNCOMMON)
  ],
  [Species.ONIX]: [
    new PokemonSpeciesEvolution(Species.STEELIX, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true /* Metal coat*/ ), WildEvolutionRate.RARE)
  ],
  [Species.RHYDON]: [
    new PokemonSpeciesEvolution(Species.RHYPERIOR, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true /* Protector */), WildEvolutionRate.RARE)
  ],
  [Species.SEADRA]: [
    new PokemonSpeciesEvolution(Species.KINGDRA, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true /* Dragon scale*/), WildEvolutionRate.RARE)
  ],
  [Species.SCYTHER]: [
    new PokemonSpeciesEvolution(Species.SCIZOR, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true /* Metal coat*/), WildEvolutionRate.UNCOMMON)
  ],
  [Species.ELECTABUZZ]: [
    new PokemonSpeciesEvolution(Species.ELECTIVIRE, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true /* Electirizer*/), WildEvolutionRate.UNCOMMON)
  ],
  [Species.MAGMAR]: [
    new PokemonSpeciesEvolution(Species.MAGMORTAR, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true /* Magmarizer*/), WildEvolutionRate.UNCOMMON)
  ],
  [Species.PORYGON]: [
    new PokemonSpeciesEvolution(Species.PORYGON2, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true /*Upgrade*/), WildEvolutionRate.RARE)
  ],
  [Species.PORYGON2]: [
    new PokemonSpeciesEvolution(Species.PORYGON_Z, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true /* Dubious disc*/), WildEvolutionRate.ULTRA_RARE)
  ],
  [Species.FEEBAS]: [
    new PokemonSpeciesEvolution(Species.MILOTIC, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true /* Prism scale*/), WildEvolutionRate.ULTRA_RARE)
  ],
  [Species.DUSCLOPS]: [
    new PokemonSpeciesEvolution(Species.DUSKNOIR, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true /* Reaper cloth*/), WildEvolutionRate.RARE)
  ],
  [Species.CLAMPERL]: [
    new PokemonSpeciesEvolution(Species.HUNTAIL, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true /* Deep sea tooth*/), WildEvolutionRate.RARE),
    new PokemonSpeciesEvolution(Species.GOREBYSS, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true /* Deep sea scale*/), WildEvolutionRate.RARE)
  ],
  [Species.BOLDORE]: [
    new PokemonSpeciesEvolution(Species.GIGALITH, 1, "Link Cable", null)
  ],
  [Species.GURDURR]: [
    new PokemonSpeciesEvolution(Species.CONKELDURR, 1, "Link Cable", null)
  ],
  [Species.KARRABLAST]: [
    new PokemonSpeciesEvolution(Species.ESCAVALIER, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true /* Trade with shelmet??*/), WildEvolutionRate.RARE)
  ],
  [Species.SHELMET]: [
    new PokemonSpeciesEvolution(Species.ACCELGOR, 1, "Link Cable", new PokemonSpeciesEvolutionCondition((p: Pokemon) => true /* Trade with karrablast??*/), WildEvolutionRate.RARE)
  ],
  [Species.PICHU]: [
    new PokemonSpeciesEvolution(Species.PIKACHU, 1, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10))
  ],
  [Species.CLEFFA]: [
    new PokemonSpeciesEvolution(Species.CLEFAIRY, 1, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10))
  ],
  [Species.IGGLYBUFF]: [
    new PokemonSpeciesEvolution(Species.JIGGLYPUFF, 1, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10))
  ],
  [Species.GOLBAT]: [
    new PokemonSpeciesEvolution(Species.CROBAT, 1, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10))
  ],
  [Species.CHANSEY]: [
    new PokemonSpeciesEvolution(Species.BLISSEY, 1, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10))
  ],
  [Species.MUNCHLAX]: [
    new PokemonSpeciesEvolution(Species.SNORLAX, 1, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10))
  ],
  [Species.TOGEPI]: [
    new PokemonSpeciesEvolution(Species.TOGETIC, 1, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10))
  ],
  [Species.AZURILL]: [
    new PokemonSpeciesEvolution(Species.MARILL, 1, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10))
  ],
  [Species.BUDEW]: [
    new PokemonSpeciesEvolution(Species.ROSELIA, 1, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.winCount > 10 /* daytime */))
  ],
  [Species.CHINGLING]: [
    new PokemonSpeciesEvolution(Species.CHIMECHO, 1, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10 /* nighttime */))
  ],
  [Species.BUNEARY]: [
    new PokemonSpeciesEvolution(Species.LOPUNNY, 1, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10))
  ],
  [Species.RIOLU]: [
    new PokemonSpeciesEvolution(Species.LUCARIO, 1, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10 /* daytime */))
  ],
  [Species.WOOBAT]: [
    new PokemonSpeciesEvolution(Species.SWOOBAT, 1, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10))
  ],
  [Species.SWADLOON]: [
    new PokemonSpeciesEvolution(Species.LEAVANNY, 1, null, new PokemonSpeciesEvolutionCondition((p: Pokemon) => p.winCount >= 10))
  ]
}