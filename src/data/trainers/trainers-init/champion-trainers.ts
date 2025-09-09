import { Gender } from "#data/gender";
import { MoveId } from "#enums/move-id";
import { PokeballType } from "#enums/pokeball";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import { PokemonMove } from "#moves/pokemon-move";
import { TrainerConfig, getRandomPartyMemberFunc, nextTrainerId, setTrainerId } from "#trainers/trainer-config";
import { TrainerConfigs } from "#types/trainer-funcs";
import { randSeedIntRange, randSeedItem } from "#utils/common";
import { t } from "i18next";
import { isNullOrUndefined } from "util";


export const championTrainers: TrainerConfigs = {
  //Kanto Johto Champions
  [TrainerType.BLUE]: new TrainerConfig(setTrainerId(TrainerType.BLUE))
    .initForChampion(true)
    .setBattleBgm("battle_kanto_champion")
    .setMixedBattleBgm("battle_kanto_champion")
    .setHasDouble("blue_red_double")
    .setDoubleTrainerType(TrainerType.RED)
    .setDoubleTitle("champion_double")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.ALAKAZAM]))
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [SpeciesId.ARCANINE, SpeciesId.EXEGGUTOR, SpeciesId.GYARADOS],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.generateAndPopulateMoveset();
          p.teraType = p.species.type1;
        },
      ),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.RHYPERIOR, SpeciesId.ELECTIVIRE]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.MACHAMP]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.HO_OH], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
        p.abilityIndex = 2; // Regenerator
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.PIDGEOT], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Pidgeot
        p.generateAndPopulateMoveset();
        p.generateName();
        p.gender = Gender.MALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(1), // Tera Fire Arcanine, Tera Grass Exeggutor, Tera Water Gyarados
  [TrainerType.RED]: new TrainerConfig(nextTrainerId())
    .initForChampion(true)
    .setBattleBgm("battle_johto_champion")
    .setMixedBattleBgm("battle_johto_champion")
    .setHasDouble("red_blue_double")
    .setDoubleTrainerType(TrainerType.BLUE)
    .setDoubleTitle("champion_double")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.PIKACHU], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Partner Pikachu
        p.gender = Gender.MALE;
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.VOLT_TACKLE)) {
          // Check if Volt Tackle is in the moveset, if not, replace the first move with Volt Tackle.
          p.moveset[0] = new PokemonMove(MoveId.VOLT_TACKLE);
        }
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.MEGANIUM, SpeciesId.TYPHLOSION, SpeciesId.FERALIGATR]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.ESPEON, SpeciesId.UMBREON, SpeciesId.SYLVEON]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.SNORLAX]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.LUGIA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
        p.abilityIndex = 2; // Multiscale
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc(
        [SpeciesId.VENUSAUR, SpeciesId.CHARIZARD, SpeciesId.BLASTOISE],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.formIndex = 1; // Mega Venusaur, Mega Charizard X, or Mega Blastoise
          p.generateAndPopulateMoveset();
          p.generateName();
          p.gender = Gender.MALE;
          p.setBoss(true, 2);
        },
      ),
    )
    .setInstantTera(0), // Tera Electric Pikachu
  [TrainerType.LANCE_CHAMPION]: new TrainerConfig(nextTrainerId())
    .setName("Lance")
    .initForChampion(true)
    .setBattleBgm("battle_johto_champion")
    .setMixedBattleBgm("battle_johto_champion")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.GYARADOS, SpeciesId.KINGDRA]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.AERODACTYL]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.CHARIZARD]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc(
        [SpeciesId.TYRANITAR, SpeciesId.GARCHOMP, SpeciesId.HYDREIGON],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.abilityIndex = 2; // Unnerve Tyranitar, Rough Skin Garchomp, Levitate Hydreigon
          p.generateAndPopulateMoveset();
        },
      ),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.SALAMENCE], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Salamence
        p.generateAndPopulateMoveset();
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.DRAGONITE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 2; // Multiscale
        p.gender = Gender.MALE;
        p.setBoss(true, 2);
        p.teraType = PokemonType.DRAGON;
      }),
    )
    .setInstantTera(5), // Tera Dragon Dragonite

  // Hoenn Champion
  [TrainerType.STEVEN]: new TrainerConfig(nextTrainerId())
    .initForChampion(true)
    .setBattleBgm("battle_hoenn_champion_g5")
    .setMixedBattleBgm("battle_hoenn_champion_g6")
    .setHasDouble("steven_wallace_double")
    .setDoubleTrainerType(TrainerType.WALLACE)
    .setDoubleTitle("champion_double")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.GIGALITH], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Sand Stream
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.SKARMORY, SpeciesId.CLAYDOL]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.AGGRON]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.GOLURK, SpeciesId.RUNERIGUS], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 0; // Iron Fist Golurk, Wandering Spirit Runerigus
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc(
        [SpeciesId.REGIROCK, SpeciesId.REGICE, SpeciesId.REGISTEEL],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.generateAndPopulateMoveset();
          p.pokeball = PokeballType.ULTRA_BALL;
        },
      ),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.METAGROSS], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Metagross
        p.generateAndPopulateMoveset();
        p.generateName();
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(4), // Tera Rock Regirock / Ice Regice / Steel Registeel
  [TrainerType.WALLACE]: new TrainerConfig(nextTrainerId())
    .initForChampion(true)
    .setBattleBgm("battle_hoenn_champion_g5")
    .setMixedBattleBgm("battle_hoenn_champion_g6")
    .setHasDouble("wallace_steven_double")
    .setDoubleTrainerType(TrainerType.STEVEN)
    .setDoubleTitle("champion_double")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.PELIPPER], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Drizzle
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.LUDICOLO], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 0; // Swift Swim
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.TENTACRUEL, SpeciesId.WALREIN], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = p.species.speciesId === SpeciesId.TENTACRUEL ? 2 : 0; // Rain Dish Tentacruel, Thick Fat Walrein
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.LATIAS, SpeciesId.LATIOS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.generateName();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.SWAMPERT], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Swampert
        p.generateAndPopulateMoveset();
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.MILOTIC], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.FEMALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(5), // Tera Water Milotic

  // Sinnoh Champion
  [TrainerType.CYNTHIA]: new TrainerConfig(nextTrainerId())
    .initForChampion(false)
    .setBattleBgm("battle_sinnoh_champion")
    .setMixedBattleBgm("battle_sinnoh_champion")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.SPIRITOMB]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.MILOTIC, SpeciesId.ROSERADE, SpeciesId.HISUI_ARCANINE]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.TOGEKISS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.teraType = p.species.type1;
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.LUCARIO]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.GIRATINA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GARCHOMP], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Garchomp
        p.generateAndPopulateMoveset();
        p.generateName();
        p.gender = Gender.FEMALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(2), // Tera Fairy Togekiss

  // Unova Champions
  [TrainerType.ALDER]: new TrainerConfig(nextTrainerId())
    .initForChampion(true)
    .setHasDouble("alder_iris_double")
    .setDoubleTrainerType(TrainerType.IRIS)
    .setDoubleTitle("champion_double")
    .setBattleBgm("battle_champion_alder")
    .setMixedBattleBgm("battle_champion_alder")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.BOUFFALANT, SpeciesId.BRAVIARY]))
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [SpeciesId.HISUI_LILLIGANT, SpeciesId.HISUI_ZOROARK, SpeciesId.BASCULEGION],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.generateAndPopulateMoveset();
          p.pokeball = PokeballType.ROGUE_BALL;
        },
      ),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.CHANDELURE, SpeciesId.KROOKODILE, SpeciesId.REUNICLUS, SpeciesId.CONKELDURR]),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.KELDEO], TrainerSlot.TRAINER, true, p => {
        p.pokeball = PokeballType.ROGUE_BALL;
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.SECRET_SWORD)) {
          // Check if Secret Sword is in the moveset, if not, replace the third move with Secret Sword.
          p.moveset[2] = new PokemonMove(MoveId.SECRET_SWORD);
        }
        p.formIndex = 1; // Resolute Form
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.ZEKROM], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.VOLCARONA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
        p.setBoss(true, 2);
        p.teraType = PokemonType.FIRE;
      }),
    )
    .setInstantTera(5), // Tera Fire Volcarona
  [TrainerType.IRIS]: new TrainerConfig(nextTrainerId())
    .initForChampion(false)
    .setBattleBgm("battle_champion_iris")
    .setMixedBattleBgm("battle_champion_iris")
    .setHasDouble("iris_alder_double")
    .setDoubleTrainerType(TrainerType.ALDER)
    .setDoubleTitle("champion_double")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.DRUDDIGON]))
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.ARCHEOPS], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 2; // Emergency Exit
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.LAPRAS], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // G-Max Lapras
        p.generateAndPopulateMoveset();
        p.generateName();
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.AGGRON, SpeciesId.HYDREIGON, SpeciesId.ARCHALUDON]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.RESHIRAM], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.HAXORUS], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Mold Breaker
        p.generateAndPopulateMoveset();
        p.gender = Gender.FEMALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(5), // Tera Dragon Haxorus

  // Kalos Champion
  [TrainerType.DIANTHA]: new TrainerConfig(nextTrainerId())
    .initForChampion(false)
    .setMixedBattleBgm("battle_kalos_champion")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.HAWLUCHA]))
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.TREVENANT, SpeciesId.GOURGEIST], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 2; // Harvest Trevenant, Insomnia Gourgeist
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.TYRANTRUM, SpeciesId.AURORUS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 2; // Rock Head Tyrantrum, Snow Warning Aurorus
        p.teraType = p.species.type2!;
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.GOODRA]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.XERNEAS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GARDEVOIR], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Mega Gardevoir
        p.generateAndPopulateMoveset();
        p.generateName();
        p.gender = Gender.FEMALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(2), // Tera Dragon Tyrantrum / Ice Aurorus

  // Alola Champions
  [TrainerType.KUKUI]: new TrainerConfig(nextTrainerId())
    .initForChampion(true)
    .setMixedBattleBgm("battle_champion_kukui")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.LYCANROC], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 2; // Dusk Lycanroc
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.MAGNEZONE, SpeciesId.ALOLA_NINETALES], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = p.species.speciesId === SpeciesId.MAGNEZONE ? 1 : 2; // Sturdy Magnezone, Snow Warning Ninetales
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc(
        [SpeciesId.TORNADUS, SpeciesId.THUNDURUS, SpeciesId.LANDORUS],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.formIndex = 1; // Therian Formes
          p.generateAndPopulateMoveset();
          p.pokeball = PokeballType.ROGUE_BALL;
        },
      ),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.TAPU_LELE, SpeciesId.TAPU_FINI], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.abilityIndex = 0; // Psychic / Misty Surge
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.SNORLAX], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // G-Max Snorlax
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.INCINEROAR, SpeciesId.HISUI_DECIDUEYE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
        p.teraType = p.species.type2!;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(5), // Tera Dark Incineroar / Fighting Hisuian Decidueye
  [TrainerType.HAU]: new TrainerConfig(nextTrainerId())
    .initForChampion(true)
    .setMixedBattleBgm("battle_alola_champion")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.ALOLA_RAICHU]))
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.NOIVERN], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Infiltrator
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.BLACEPHALON, SpeciesId.STAKATAKA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.TAPU_KOKO, SpeciesId.TAPU_BULU], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.abilityIndex = 0; // Electric / Grassy Surge
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.SOLGALEO], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.DECIDUEYE, SpeciesId.PRIMARINA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.setBoss(true, 2);
        p.gender = p.species.speciesId === SpeciesId.PRIMARINA ? Gender.FEMALE : Gender.MALE;
        p.teraType = p.species.speciesId === SpeciesId.PRIMARINA ? PokemonType.WATER : PokemonType.GHOST;
      }),
    )
    .setInstantTera(5), // Tera Ghost Decidueye, Water Primarina

  // Galar Champions
  [TrainerType.LEON]: new TrainerConfig(nextTrainerId())
    .initForChampion(true)
    .setMixedBattleBgm("battle_galar_champion")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.AEGISLASH]))
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [SpeciesId.RHYPERIOR, SpeciesId.SEISMITOAD, SpeciesId.MR_RIME],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.abilityIndex = 1; // Solid Rock Rhyperior, Poison Touch Seismitoad, Screen Cleaner Mr. Rime
          p.generateAndPopulateMoveset();
        },
      ),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.DRAGAPULT]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.RILLABOOM, SpeciesId.CINDERACE, SpeciesId.INTELEON]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.ZACIAN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.CHARIZARD], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 3; // G-Max Charizard
        p.generateAndPopulateMoveset();
        p.generateName();
        p.gender = Gender.MALE;
        p.setBoss(true, 2);
      }),
    )
    .setInstantTera(3), // Tera Grass Rillaboom, Fire Cinderace, Water Inteleon
  [TrainerType.MUSTARD]: new TrainerConfig(nextTrainerId())
    .initForChampion(true)
    .setMixedBattleBgm("battle_mustard")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.MIENSHAO], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.CORVIKNIGHT], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.GALAR_SLOWBRO, SpeciesId.GALAR_SLOWKING], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = p.species.speciesId === SpeciesId.GALAR_SLOWBRO ? 0 : 2; // Quick Draw Galar Slowbro, Regenerator Galar Slowking
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.VENUSAUR, SpeciesId.BLASTOISE], TrainerSlot.TRAINER, true, p => {
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.KOMMO_O], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.URSHIFU], TrainerSlot.TRAINER, true, p => {
        p.formIndex = randSeedIntRange(2, 3); // Random G-Max Urshifu form
        p.generateName();
        p.gender = Gender.MALE;
        p.pokeball = PokeballType.ULTRA_BALL;
        p.setBoss(true, 2);
        if (p.formIndex === 2) {
          p.moveset[0] = new PokemonMove(MoveId.WICKED_BLOW);
          p.moveset[1] = new PokemonMove(MoveId.BRICK_BREAK);
          p.moveset[2] = new PokemonMove(randSeedItem([MoveId.FIRE_PUNCH, MoveId.THUNDER_PUNCH, MoveId.ICE_PUNCH]));
          p.moveset[3] = new PokemonMove(MoveId.FOCUS_ENERGY);
        } else if (p.formIndex === 3) {
          p.moveset[0] = new PokemonMove(MoveId.SURGING_STRIKES);
          p.moveset[1] = new PokemonMove(MoveId.BRICK_BREAK);
          p.moveset[2] = new PokemonMove(randSeedItem([MoveId.FIRE_PUNCH, MoveId.THUNDER_PUNCH, MoveId.ICE_PUNCH]));
          p.moveset[3] = new PokemonMove(MoveId.FOCUS_ENERGY);
        }
      }),
    )
    .setInstantTera(4), // Tera Fighting Kommo-o

  // Paldea Champions
  [TrainerType.GEETA]: new TrainerConfig(nextTrainerId())
    .initForChampion(false)
    .setMixedBattleBgm("battle_champion_geeta")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.GLIMMORA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
        p.setBoss(true, 2);
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.ESPATHRA], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 0; // Opportunist
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.BAXCALIBUR]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.CHESNAUGHT, SpeciesId.DELPHOX, SpeciesId.GRENINJA]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.MIRAIDON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.KINGAMBIT], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
        p.abilityIndex = 1; // Supreme Overlord
        p.teraType = PokemonType.FLYING;
      }),
    )
    .setInstantTera(5), // Tera Flying Kingambit
  [TrainerType.NEMONA]: new TrainerConfig(nextTrainerId())
    .initForChampion(false)
    .setMixedBattleBgm("battle_champion_nemona")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.LYCANROC], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 0; // Midday form
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.PAWMOT]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.DUDUNSPARCE], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 0; // Serene Grace
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.ARMAROUGE, SpeciesId.CERULEDGE]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.KORAIDON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc(
        [SpeciesId.MEOWSCARADA, SpeciesId.SKELEDIRGE, SpeciesId.QUAQUAVAL],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.generateAndPopulateMoveset();
          p.gender = Gender.MALE;
          p.setBoss(true, 2);
          p.teraType = p.species.type2!;
        },
      ),
    )
    .setInstantTera(5), // Tera Dark Meowscarada, Ghost Skeledirge, Fighting Quaquaval
  [TrainerType.KIERAN]: new TrainerConfig(nextTrainerId())
    .initForChampion(true)
    .setMixedBattleBgm("battle_champion_kieran")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.POLIWRATH, SpeciesId.POLITOED]))
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.INCINEROAR, SpeciesId.GRIMMSNARL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = p.species.speciesId === SpeciesId.INCINEROAR ? 2 : 0; // Intimidate Incineroar, Prankster Grimmsnarl
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.DRAGONITE], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 2; // Multiscale
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.URSALUNA, SpeciesId.BLOODMOON_URSALUNA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.TERAPAGOS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_STARSTORM)) {
          // Check if Tera Starstorm is in the moveset, if not, replace the first move with Tera Starstorm.
          p.moveset[0] = new PokemonMove(MoveId.TERA_STARSTORM);
        }
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.HYDRAPPLE], TrainerSlot.TRAINER, true, p => {
        p.gender = Gender.MALE;
        p.setBoss(true, 2);
        p.teraType = PokemonType.FIGHTING;
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
      }),
    )
    .setInstantTera(5), // Tera Fighting Hydrapple
}
