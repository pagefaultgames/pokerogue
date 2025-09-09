import { Gender } from "#data/gender";
import { MoveId } from "#enums/move-id";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import { PokemonMove } from "#moves/pokemon-move";
import { getRandomPartyMemberFunc, nextTrainerId, setTrainerId, TrainerConfig } from "#trainers/trainer-config";
import { TrainerConfigs } from "#types/trainer-funcs";
import { isNullOrUndefined, randSeedInt } from "#utils/common";

export const evilAdminTrainers: TrainerConfigs = {
  [TrainerType.ROCKET_BOSS_GIOVANNI_1]: new TrainerConfig(setTrainerId(TrainerType.ROCKET_BOSS_GIOVANNI_1))
    .setName("Giovanni")
    .initForEvilTeamLeader("Rocket Boss", [])
    .setMixedBattleBgm("battle_rocket_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.PERSIAN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.DUGTRIO, SpeciesId.ALOLA_DUGTRIO]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.HONCHKROW]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.NIDOQUEEN, SpeciesId.NIDOKING]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.KANGASKHAN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Kangaskhan
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.RHYPERIOR], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.abilityIndex = 1; // Solid Rock
        p.setBoss(true, 2);
      }),
    ),
  [TrainerType.ROCKET_BOSS_GIOVANNI_2]: new TrainerConfig(nextTrainerId())
    .setName("Giovanni")
    .initForEvilTeamLeader("Rocket Boss", [], true)
    .setMixedBattleBgm("battle_rocket_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.RHYPERIOR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Solid Rock
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.NIDOKING, SpeciesId.NIDOQUEEN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 2; // Sheer Force
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.HONCHKROW], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.SUCKER_PUNCH)) {
          // Check if Sucker Punch is in the moveset, if not, replace the third move with Sucker Punch.
          p.moveset[2] = new PokemonMove(MoveId.SUCKER_PUNCH);
        }
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.KANGASKHAN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Kangaskhan
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc(
        [SpeciesId.ARTICUNO, SpeciesId.ZAPDOS, SpeciesId.MOLTRES],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.generateAndPopulateMoveset();
          p.pokeball = PokeballType.ULTRA_BALL;
          p.abilityIndex = 2; // Snow Cloak Articuno, Static Zapdos, Flame Body Moltres
          p.setBoss(true, 2);
        },
      ),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.MEWTWO], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.MAXIE]: new TrainerConfig(nextTrainerId())
    .setName("Maxie")
    .initForEvilTeamLeader("Magma Boss", [])
    .setMixedBattleBgm("battle_aqua_magma_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.TORKOAL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Drought
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.SOLROCK]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.WEEZING, SpeciesId.GALAR_WEEZING]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.SCOVILLAIN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 0; // Chlorophyll
      }),
    )
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.DONPHAN]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.CAMERUPT], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Camerupt
        p.generateName();
        p.gender = Gender.MALE;
      }),
    ),
  [TrainerType.MAXIE_2]: new TrainerConfig(nextTrainerId())
    .setName("Maxie")
    .initForEvilTeamLeader("Magma Boss", [], true)
    .setMixedBattleBgm("battle_aqua_magma_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.TYPHLOSION, SpeciesId.SOLROCK], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.NINETALES, SpeciesId.TORKOAL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === SpeciesId.NINETALES) {
          p.abilityIndex = 2; // Drought
        } else if (p.species.speciesId === SpeciesId.TORKOAL) {
          p.abilityIndex = 1; // Drought
        }
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.SCOVILLAIN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 0; // Chlorophyll
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.GREAT_TUSK], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.CAMERUPT], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Camerupt
        p.generateName();
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GROUDON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.ARCHIE]: new TrainerConfig(nextTrainerId())
    .setName("Archie")
    .initForEvilTeamLeader("Aqua Boss", [])
    .setMixedBattleBgm("battle_aqua_magma_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.PELIPPER], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Drizzle
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.WAILORD]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.MUK, SpeciesId.ALOLA_MUK]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.LUDICOLO]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.QWILFISH], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Swift Swim
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.SHARPEDO], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Sharpedo
        p.generateName();
        p.gender = Gender.MALE;
      }),
    ),
  [TrainerType.ARCHIE_2]: new TrainerConfig(nextTrainerId())
    .setName("Archie")
    .initForEvilTeamLeader("Aqua Boss", [], true)
    .setMixedBattleBgm("battle_aqua_magma_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.LUDICOLO, SpeciesId.EMPOLEON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.POLITOED, SpeciesId.PELIPPER], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === SpeciesId.POLITOED) {
          p.abilityIndex = 2; // Drizzle
        } else if (p.species.speciesId === SpeciesId.PELIPPER) {
          p.abilityIndex = 1; // Drizzle
        }
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.DHELMISE]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.OVERQWIL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Swift Swim
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.SHARPEDO], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Sharpedo
        p.generateName();
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.KYOGRE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.CYRUS]: new TrainerConfig(nextTrainerId())
    .setName("Cyrus")
    .initForEvilTeamLeader("Galactic Boss", [])
    .setMixedBattleBgm("battle_galactic_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.GYARADOS]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.CROBAT, SpeciesId.HONCHKROW]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.MAGNEZONE]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.UXIE, SpeciesId.MESPRIT, SpeciesId.AZELF]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.HOUNDOOM], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.WEAVILE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.gender = Gender.MALE;
      }),
    ),
  [TrainerType.CYRUS_2]: new TrainerConfig(nextTrainerId())
    .setName("Cyrus")
    .initForEvilTeamLeader("Galactic Boss", [], true)
    .setMixedBattleBgm("battle_galactic_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.CROBAT, SpeciesId.HONCHKROW], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.MAGNEZONE]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.UXIE, SpeciesId.MESPRIT, SpeciesId.AZELF], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.HOUNDOOM], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Houndoom
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.WEAVILE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.DIALGA, SpeciesId.PALKIA], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.GHETSIS]: new TrainerConfig(nextTrainerId())
    .setName("Ghetsis")
    .initForEvilTeamLeader("Plasma Boss", [])
    .setMixedBattleBgm("battle_plasma_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.COFAGRIGUS]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.SEISMITOAD]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.GALVANTULA, SpeciesId.EELEKTROSS]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.DRAPION, SpeciesId.TOXICROAK]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.KINGAMBIT]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.HYDREIGON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.gender = Gender.MALE;
      }),
    ),
  [TrainerType.GHETSIS_2]: new TrainerConfig(nextTrainerId())
    .setName("Ghetsis")
    .initForEvilTeamLeader("Plasma Boss", [], true)
    .setMixedBattleBgm("battle_plasma_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.RUNERIGUS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.JELLICENT, SpeciesId.BASCULEGION], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
        p.formIndex = 0;
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.KINGAMBIT]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.VOLCARONA, SpeciesId.IRON_MOTH], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.HYDREIGON, SpeciesId.IRON_JUGULIS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        if (p.species.speciesId === SpeciesId.HYDREIGON) {
          p.gender = Gender.MALE;
        } else if (p.species.speciesId === SpeciesId.IRON_JUGULIS) {
          p.gender = Gender.GENDERLESS;
        }
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.KYUREM], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.LYSANDRE]: new TrainerConfig(nextTrainerId())
    .setName("Lysandre")
    .initForEvilTeamLeader("Flare Boss", [])
    .setMixedBattleBgm("battle_flare_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.MIENSHAO]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.HONCHKROW, SpeciesId.TALONFLAME]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.PYROAR], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.MALAMAR]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.AEGISLASH, SpeciesId.HISUI_GOODRA]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GYARADOS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Gyarados
        p.generateName();
        p.gender = Gender.MALE;
      }),
    ),
  [TrainerType.LYSANDRE_2]: new TrainerConfig(nextTrainerId())
    .setName("Lysandre")
    .initForEvilTeamLeader("Flare Boss", [], true)
    .setMixedBattleBgm("battle_flare_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.PYROAR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.MIENSHAO]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.AEGISLASH, SpeciesId.HISUI_GOODRA]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.VOLCANION], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.GYARADOS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.formIndex = 1; // Mega Gyarados
        p.generateName();
        p.gender = Gender.MALE;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.ZYGARDE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
        p.formIndex = 0; // 50% Forme, Aura Break
      }),
    ),
  [TrainerType.LUSAMINE]: new TrainerConfig(nextTrainerId())
    .setName("Lusamine")
    .initForEvilTeamLeader("Aether Boss", [])
    .setMixedBattleBgm("battle_aether_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.CLEFABLE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.FEMALE;
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.LILLIGANT]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.MILOTIC]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.GALAR_SLOWBRO, SpeciesId.GALAR_SLOWKING]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.BEWEAR, SpeciesId.LOPUNNY]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.NIHILEGO], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    ),
  [TrainerType.LUSAMINE_2]: new TrainerConfig(nextTrainerId())
    .setName("Lusamine")
    .initForEvilTeamLeader("Aether Boss", [], true)
    .setMixedBattleBgm("battle_aether_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.CLEFABLE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.gender = Gender.FEMALE;
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.MILOTIC, SpeciesId.LILLIGANT]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.SILVALLY], TrainerSlot.TRAINER, true, p => {
        p.formIndex = randSeedInt(18); // Random Silvally Form
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.MULTI_ATTACK)) {
          // Check if Multi Attack is in the moveset, if not, replace the first move with Multi Attack.
          p.moveset[0] = new PokemonMove(MoveId.MULTI_ATTACK);
        }
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.PHEROMOSA], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.NIHILEGO], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.NECROZMA], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.formIndex = 2; // Dawn Wings
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.GUZMA]: new TrainerConfig(nextTrainerId())
    .setName("Guzma")
    .initForEvilTeamLeader("Skull Boss", [])
    .setMixedBattleBgm("battle_skull_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.YANMEGA, SpeciesId.LOKIX], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === SpeciesId.YANMEGA) {
          p.abilityIndex = 1; // Tinted Lens
        } else if (p.species.speciesId === SpeciesId.LOKIX) {
          p.abilityIndex = 2; // Tinted Lens
        }
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.HERACROSS]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.SCIZOR, SpeciesId.KLEAVOR], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === SpeciesId.SCIZOR) {
          p.abilityIndex = 1; // Technician
        } else if (p.species.speciesId === SpeciesId.KLEAVOR) {
          p.abilityIndex = 2; // Sharpness
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.GALVANTULA, SpeciesId.VIKAVOLT]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.PINSIR], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // Mega Pinsir
        p.pokeball = PokeballType.ULTRA_BALL;
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GOLISOPOD], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.FIRST_IMPRESSION)) {
          // Check if First Impression is in the moveset, if not, replace the third move with First Impression.
          p.moveset[2] = new PokemonMove(MoveId.FIRST_IMPRESSION);
          p.gender = Gender.MALE;
        }
      }),
    ),
  [TrainerType.GUZMA_2]: new TrainerConfig(nextTrainerId())
    .setName("Guzma")
    .initForEvilTeamLeader("Skull Boss", [], true)
    .setMixedBattleBgm("battle_skull_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.GOLISOPOD], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.FIRST_IMPRESSION)) {
          // Check if First Impression is in the moveset, if not, replace the third move with First Impression.
          p.moveset[2] = new PokemonMove(MoveId.FIRST_IMPRESSION);
          p.abilityIndex = 2; // Anticipation
          p.gender = Gender.MALE;
        }
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.BUZZWOLE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.CRAWDAUNT, SpeciesId.HISUI_SAMUROTT], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 2; // Sharpness Hisuian Samurott, Adaptability Crawdaunt
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.XURKITREE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.GENESECT], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
        p.formIndex = randSeedInt(4, 1); // Shock, Burn, Chill, or Douse Drive
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TECHNO_BLAST)) {
          // Check if Techno Blast is in the moveset, if not, replace the third move with Techno Blast.
          p.moveset[2] = new PokemonMove(MoveId.TECHNO_BLAST);
        }
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.PINSIR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.formIndex = 1; // Mega Pinsir
        p.generateAndPopulateMoveset();
        p.generateName();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    ),
  // Macros
    [TrainerType.ROSE]: new TrainerConfig(nextTrainerId())
    .setName("Rose")
    .initForEvilTeamLeader("Macro Boss", [])
    .setMixedBattleBgm("battle_macro_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.ARCHALUDON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.ESCAVALIER, SpeciesId.FERROTHORN], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.SIRFETCHD, SpeciesId.MR_RIME], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.CORVIKNIGHT], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.KLINKLANG, SpeciesId.PERRSERKER], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.COPPERAJAH], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // G-Max Copperajah
        p.generateName();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.gender = Gender.FEMALE;
      }),
    ),
  [TrainerType.ROSE_2]: new TrainerConfig(nextTrainerId())
    .setName("Rose")
    .initForEvilTeamLeader("Macro Boss", [], true)
    .setMixedBattleBgm("battle_macro_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.ARCHALUDON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.CORVIKNIGHT]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.DRACOZOLT, SpeciesId.DRACOVISH], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.abilityIndex = 1; // Strong Jaw Dracovish, Hustle Dracozolt
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.MELMETAL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.COPPERAJAH], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // G-Max Copperajah
        p.generateName();
        p.pokeball = PokeballType.ULTRA_BALL;
        p.gender = Gender.FEMALE;
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc(
        [SpeciesId.GALAR_ARTICUNO, SpeciesId.GALAR_ZAPDOS, SpeciesId.GALAR_MOLTRES],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.setBoss(true, 2);
          p.generateAndPopulateMoveset();
          p.pokeball = PokeballType.ULTRA_BALL;
        },
      ),
    ),

  // Star Boss
  [TrainerType.PENNY]: new TrainerConfig(nextTrainerId())
    .setName("Cassiopeia")
    .initForEvilTeamLeader("Star Boss", [])
    .setMixedBattleBgm("battle_star_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.ESPEON]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([SpeciesId.UMBREON]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.LEAFEON, SpeciesId.GLACEON]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.VAPOREON, SpeciesId.FLAREON, SpeciesId.JOLTEON]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.SYLVEON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.abilityIndex = 2; // Pixilate
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.HYPER_VOICE)) {
          // Check if Hyper Voice is in the moveset, if not, replace the second move with Hyper Voice.
          p.moveset[1] = new PokemonMove(MoveId.HYPER_VOICE);
          p.gender = Gender.FEMALE;
        }
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.EEVEE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.formIndex = 2; // G-Max Eevee
        p.pokeball = PokeballType.ULTRA_BALL;
        p.generateName();
      }),
    )
    .setInstantTera(4), // Tera Fairy Sylveon
  [TrainerType.PENNY_2]: new TrainerConfig(nextTrainerId())
    .setName("Cassiopeia")
    .initForEvilTeamLeader("Star Boss", [], true)
    .setMixedBattleBgm("battle_star_boss")
    .setVictoryBgm("victory_team_plasma")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.SYLVEON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.abilityIndex = 2; // Pixilate
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.HYPER_VOICE)) {
          // Check if Hyper Voice is in the moveset, if not, replace the second move with Hyper Voice.
          p.moveset[1] = new PokemonMove(MoveId.HYPER_VOICE);
          p.gender = Gender.FEMALE;
        }
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.ROTOM], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = randSeedInt(5, 1); // Heat, Wash, Frost, Fan, or Mow
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.ESPEON, SpeciesId.UMBREON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = p.species.speciesId === SpeciesId.UMBREON ? 0 : 2; // Synchronize Umbreon, Magic Bounce Espeon
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc(
        [SpeciesId.WALKING_WAKE, SpeciesId.GOUGING_FIRE, SpeciesId.RAGING_BOLT],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.generateAndPopulateMoveset();
          p.pokeball = PokeballType.ROGUE_BALL;
        },
      ),
    )
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = randSeedInt(5, 1); // Random Starmobile form
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ROGUE_BALL;
        p.setBoss(true, 2);
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.EEVEE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.formIndex = 2;
        p.generateName();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    ).setInstantTera(0)
}
