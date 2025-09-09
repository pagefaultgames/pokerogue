import { timedEventManager } from "#app/global-event-manager";
import { pokemonEvolutions, pokemonPrevolutions } from "#balance/pokemon-evolutions";
import { modifierTypes } from "#data/data-lists";
import { PokemonSpecies } from "#data/pokemon-species";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import { getRandomPartyMemberFunc, nextTrainerId, setTrainerId, TrainerConfig } from "#trainers/trainer-config";
import { trainerPartyTemplates } from "#trainers/trainer-party-template";
import { TrainerConfigs } from "#types/trainer-funcs";

export const rivalTrainer : TrainerConfigs = {
  // Rival floor 8
  [TrainerType.RIVAL]: new TrainerConfig(setTrainerId(TrainerType.RIVAL))
    .setName("Finn")
    .setHasGenders("Ivy")
    .setHasCharSprite()
    .setTitle("Rival")
    .setStaticParty()
    .setEncounterBgm(TrainerType.RIVAL)
    .setBattleBgm("battle_rival")
    .setMixedBattleBgm("battle_rival")
    .setPartyTemplates(trainerPartyTemplates.RIVAL)
    .setModifierRewardFuncs(
      () => modifierTypes.SUPER_EXP_CHARM,
      () => modifierTypes.EXP_SHARE,
    )
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc(
        [
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
        ],
        TrainerSlot.TRAINER,
        true,
        p => (p.abilityIndex = 0),
      ),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [
          SpeciesId.PIDGEY,
          SpeciesId.HOOTHOOT,
          SpeciesId.TAILLOW,
          SpeciesId.STARLY,
          SpeciesId.PIDOVE,
          SpeciesId.FLETCHLING,
          SpeciesId.PIKIPEK,
          SpeciesId.ROOKIDEE,
          SpeciesId.WATTREL,
        ],
        TrainerSlot.TRAINER,
        true,
      ),
    ),
  // Rival Floor 25
  [TrainerType.RIVAL_2]: new TrainerConfig(nextTrainerId())
    .setName("Finn")
    .setHasGenders("Ivy")
    .setHasCharSprite()
    .setTitle("Rival")
    .setStaticParty()
    .setMoneyMultiplier(1.25)
    .setEncounterBgm(TrainerType.RIVAL)
    .setBattleBgm("battle_rival")
    .setMixedBattleBgm("battle_rival")
    .setPartyTemplates(trainerPartyTemplates.RIVAL_2)
    .setModifierRewardFuncs(() => modifierTypes.EXP_SHARE)
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc(
        [
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
        ],
        TrainerSlot.TRAINER,
        true,
        p => (p.abilityIndex = 0),
      ),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [
          SpeciesId.PIDGEOTTO,
          SpeciesId.HOOTHOOT,
          SpeciesId.TAILLOW,
          SpeciesId.STARAVIA,
          SpeciesId.TRANQUILL,
          SpeciesId.FLETCHINDER,
          SpeciesId.TRUMBEAK,
          SpeciesId.CORVISQUIRE,
          SpeciesId.WATTREL,
        ],
        TrainerSlot.TRAINER,
        true,
      ),
    )
    .setPartyMemberFunc(
      2,
      getSpeciesFilterRandomPartyMemberFunc(
        (species: PokemonSpecies) =>
          !pokemonEvolutions.hasOwnProperty(species.speciesId)
          && !pokemonPrevolutions.hasOwnProperty(species.speciesId)
          && species.baseTotal >= 450,
      ),
    ),
  // Rival Floor 55
  [TrainerType.RIVAL_3]: new TrainerConfig(nextTrainerId())
    .setName("Finn")
    .setHasGenders("Ivy")
    .setHasCharSprite()
    .setTitle("Rival")
    .setStaticParty()
    .setMoneyMultiplier(1.5)
    .setEncounterBgm(TrainerType.RIVAL)
    .setBattleBgm("battle_rival")
    .setMixedBattleBgm("battle_rival")
    .setPartyTemplates(trainerPartyTemplates.RIVAL_3)
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc(
        [
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
        ],
        TrainerSlot.TRAINER,
        true,
        p => (p.abilityIndex = 0),
      ),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [
          SpeciesId.PIDGEOT,
          SpeciesId.NOCTOWL,
          SpeciesId.SWELLOW,
          SpeciesId.STARAPTOR,
          SpeciesId.UNFEZANT,
          SpeciesId.TALONFLAME,
          SpeciesId.TOUCANNON,
          SpeciesId.CORVIKNIGHT,
          SpeciesId.KILOWATTREL,
        ],
        TrainerSlot.TRAINER,
        true,
      ),
    )
    .setPartyMemberFunc(
      2,
      getSpeciesFilterRandomPartyMemberFunc(
        (species: PokemonSpecies) =>
          !pokemonEvolutions.hasOwnProperty(species.speciesId)
          && !pokemonPrevolutions.hasOwnProperty(species.speciesId)
          && species.baseTotal >= 450,
      ),
    )
    .setSpeciesFilter(species => species.baseTotal >= 540),
  // Rival floor 95
  [TrainerType.RIVAL_4]: new TrainerConfig(nextTrainerId())
    .setName("Finn")
    .setHasGenders("Ivy")
    .setHasCharSprite()
    .setTitle("Rival")
    .setBoss()
    .setStaticParty()
    .setMoneyMultiplier(1.75)
    .setEncounterBgm(TrainerType.RIVAL)
    .setBattleBgm("battle_rival_2")
    .setMixedBattleBgm("battle_rival_2")
    .setPartyTemplates(trainerPartyTemplates.RIVAL_4)
    .setModifierRewardFuncs(() => modifierTypes.TERA_ORB)
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc(
        [
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
        ],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.abilityIndex = 0;
          p.teraType = p.species.type1;
        },
      ),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [
          SpeciesId.PIDGEOT,
          SpeciesId.NOCTOWL,
          SpeciesId.SWELLOW,
          SpeciesId.STARAPTOR,
          SpeciesId.UNFEZANT,
          SpeciesId.TALONFLAME,
          SpeciesId.TOUCANNON,
          SpeciesId.CORVIKNIGHT,
          SpeciesId.KILOWATTREL,
        ],
        TrainerSlot.TRAINER,
        true,
      ),
    )
    .setPartyMemberFunc(
      2,
      getSpeciesFilterRandomPartyMemberFunc(
        (species: PokemonSpecies) =>
          !pokemonEvolutions.hasOwnProperty(species.speciesId)
          && !pokemonPrevolutions.hasOwnProperty(species.speciesId)
          && species.baseTotal >= 450,
      ),
    )
    .setSpeciesFilter(species => species.baseTotal >= 540)
    .setInstantTera(0), // Tera starter to primary type
  // Rival Floor 145
  [TrainerType.RIVAL_5]: new TrainerConfig(nextTrainerId())
    .setName("Finn")
    .setHasGenders("Ivy")
    .setHasCharSprite()
    .setTitle("Rival")
    .setBoss()
    .setStaticParty()
    .setMoneyMultiplier(2.25)
    .setEncounterBgm(TrainerType.RIVAL)
    .setBattleBgm("battle_rival_3")
    .setMixedBattleBgm("battle_rival_3")
    .setPartyTemplates(trainerPartyTemplates.RIVAL_5)
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc(
        [
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
        ],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.setBoss(true, 2);
          p.abilityIndex = 0;
          p.teraType = p.species.type1;
        },
      ),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [
          SpeciesId.PIDGEOT,
          SpeciesId.NOCTOWL,
          SpeciesId.SWELLOW,
          SpeciesId.STARAPTOR,
          SpeciesId.UNFEZANT,
          SpeciesId.TALONFLAME,
          SpeciesId.TOUCANNON,
          SpeciesId.CORVIKNIGHT,
          SpeciesId.KILOWATTREL,
        ],
        TrainerSlot.TRAINER,
        true,
      ),
    )
    .setPartyMemberFunc(
      2,
      getSpeciesFilterRandomPartyMemberFunc(
        (species: PokemonSpecies) =>
          !pokemonEvolutions.hasOwnProperty(species.speciesId)
          && !pokemonPrevolutions.hasOwnProperty(species.speciesId)
          && species.baseTotal >= 450,
      ),
    )
    .setSpeciesFilter(species => species.baseTotal >= 540)
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.RAYQUAZA], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 3);
        p.pokeball = PokeballType.MASTER_BALL;
        p.shiny = timedEventManager.getClassicTrainerShinyChance() === 0;
        p.variant = 1;
      }),
    )
    .setInstantTera(0), // Tera starter to primary type
  // Floor 195
  [TrainerType.RIVAL_6]: new TrainerConfig(nextTrainerId())
    .setName("Finn")
    .setHasGenders("Ivy")
    .setHasCharSprite()
    .setTitle("Rival")
    .setBoss()
    .setStaticParty()
    .setMoneyMultiplier(3)
    .setEncounterBgm("final")
    .setBattleBgm("battle_rival_3")
    .setMixedBattleBgm("battle_rival_3")
    .setPartyTemplates(trainerPartyTemplates.RIVAL_6)
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc(
        [
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
        ],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.setBoss(true, 3);
          p.abilityIndex = 0;
          p.teraType = p.species.type1;
          p.generateAndPopulateMoveset();
        },
      ),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc(
        [
          SpeciesId.PIDGEOT,
          SpeciesId.NOCTOWL,
          SpeciesId.SWELLOW,
          SpeciesId.STARAPTOR,
          SpeciesId.UNFEZANT,
          SpeciesId.TALONFLAME,
          SpeciesId.TOUCANNON,
          SpeciesId.CORVIKNIGHT,
          SpeciesId.KILOWATTREL,
        ],
        TrainerSlot.TRAINER,
        true,
        p => {
          p.setBoss(true, 2);
          p.generateAndPopulateMoveset();
        },
      ),
    )
    .setPartyMemberFunc(
      2,
      getSpeciesFilterRandomPartyMemberFunc(
        (species: PokemonSpecies) =>
          !pokemonEvolutions.hasOwnProperty(species.speciesId)
          && !pokemonPrevolutions.hasOwnProperty(species.speciesId)
          && species.baseTotal >= 450,
      ),
    )
    .setSpeciesFilter(species => species.baseTotal >= 540)
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.RAYQUAZA], TrainerSlot.TRAINER, true, p => {
        p.setBoss();
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
        p.shiny = timedEventManager.getClassicTrainerShinyChance() === 0;
        p.variant = 1;
        p.formIndex = 1; // Mega Rayquaza
        p.generateName();
      }),
    )
    .setInstantTera(0), // Tera starter to primary type
}
function getSpeciesFilterRandomPartyMemberFunc(arg0: (species: PokemonSpecies) => boolean): import("#types/trainer-funcs").PartyMemberFunc {
  throw new Error("Function not implemented.");
}

