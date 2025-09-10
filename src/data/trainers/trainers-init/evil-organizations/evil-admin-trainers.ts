import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import { PokemonMove } from "#moves/pokemon-move";
import { TrainerConfig, getRandomPartyMemberFunc, nextTrainerId, setTrainerId } from "#trainers/trainer-config";
import { getEvilGruntPartyTemplate } from "#trainers/trainer-party-template";
import { TrainerConfigs } from "#types/trainer-funcs";


export const evilAdminTrainerConfigs: TrainerConfigs ={
// Johto And Kanto Evil Admins
  [TrainerType.ARCHER]: new TrainerConfig(setTrainerId(TrainerType.ARCHER))
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("rocket_admin", "rocket", [SpeciesId.HOUNDOOM])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_rocket_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.ARIANA]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("rocket_admin_female", "rocket", [SpeciesId.ARBOK])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_rocket_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.PROTON]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("rocket_admin", "rocket", [SpeciesId.CROBAT])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_rocket_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.PETREL]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("rocket_admin", "rocket", [SpeciesId.WEEZING])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_rocket_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
// Hoenn Evil Admins
  [TrainerType.TABITHA]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("magma_admin", "magma", [SpeciesId.CAMERUPT])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aqua_magma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.COURTNEY]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("magma_admin_female", "magma", [SpeciesId.CAMERUPT])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aqua_magma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.MATT]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("aqua_admin", "aqua", [SpeciesId.SHARPEDO])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aqua_magma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.SHELLY]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("aqua_admin_female", "aqua", [SpeciesId.SHARPEDO])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aqua_magma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
// Sinnoh Evil Admins
  [TrainerType.JUPITER]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("galactic_commander_female", "galactic", [SpeciesId.SKUNTANK])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_galactic_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.MARS]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("galactic_commander_female", "galactic", [SpeciesId.PURUGLY])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_galactic_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.SATURN]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("galactic_commander", "galactic", [SpeciesId.TOXICROAK])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_galactic_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
// Unova Evil Admins
  [TrainerType.ZINZOLIN]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("plasma_sage", "plasma_zinzolin", [SpeciesId.CRYOGONAL])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_plasma_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.COLRESS]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("plasma_boss", "plasma_colress", [SpeciesId.KLINKLANG])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_colress")
    .setMixedBattleBgm("battle_colress")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
// Kalos Evil Admins
  [TrainerType.BRYONY]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("flare_admin_female", "flare", [SpeciesId.LIEPARD])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_flare_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  [TrainerType.XEROSIC]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("flare_admin", "flare", [SpeciesId.MALAMAR])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_flare_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  
// Alola Evil Admins
  [TrainerType.FABA]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("aether_admin", "aether", [SpeciesId.HYPNO])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_aether_grunt")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),

  [TrainerType.PLUMERIA]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("skull_admin", "skull", [SpeciesId.SALAZZLE])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_skull_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),
  

// Galar Evil Admin
  [TrainerType.OLEANA]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("macro_admin", "macro_cosmos", [SpeciesId.GARBODOR])
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_oleana")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate()),

// Paldea Evil Admins
  [TrainerType.GIACOMO]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("star_admin", "star_dark", [SpeciesId.KINGAMBIT], PokemonType.DARK)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_star_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Segin Starmobile
        p.moveset = [
          new PokemonMove(MoveId.WICKED_TORQUE),
          new PokemonMove(MoveId.SPIN_OUT),
          new PokemonMove(MoveId.PARTING_SHOT),
          new PokemonMove(MoveId.HIGH_HORSEPOWER),
        ];
      }),
    ),
  [TrainerType.MELA]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("star_admin", "star_fire", [SpeciesId.ARMAROUGE], PokemonType.FIRE)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_star_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 2; // Schedar Starmobile
        p.moveset = [
          new PokemonMove(MoveId.BLAZING_TORQUE),
          new PokemonMove(MoveId.SPIN_OUT),
          new PokemonMove(MoveId.FLAME_CHARGE),
          new PokemonMove(MoveId.HIGH_HORSEPOWER),
        ];
      }),
    ),
  [TrainerType.ATTICUS]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("star_admin", "star_poison", [SpeciesId.REVAVROOM], PokemonType.POISON)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_star_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 3; // Navi Starmobile
        p.moveset = [
          new PokemonMove(MoveId.NOXIOUS_TORQUE),
          new PokemonMove(MoveId.SPIN_OUT),
          new PokemonMove(MoveId.TOXIC_SPIKES),
          new PokemonMove(MoveId.HIGH_HORSEPOWER),
        ];
      }),
    ),
  [TrainerType.ORTEGA]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("star_admin", "star_fairy", [SpeciesId.DACHSBUN], PokemonType.FAIRY)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_star_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 4; // Ruchbah Starmobile
        p.moveset = [
          new PokemonMove(MoveId.MAGICAL_TORQUE),
          new PokemonMove(MoveId.SPIN_OUT),
          new PokemonMove(MoveId.MISTY_TERRAIN),
          new PokemonMove(MoveId.HIGH_HORSEPOWER),
        ];
      }),
    ),
  [TrainerType.ERI]: new TrainerConfig(nextTrainerId())
    .setMoneyMultiplier(1.5)
    .initForEvilTeamAdmin("star_admin", "star_fighting", [SpeciesId.ANNIHILAPE], PokemonType.FIGHTING)
    .setEncounterBgm(TrainerType.PLASMA_GRUNT)
    .setBattleBgm("battle_plasma_grunt")
    .setMixedBattleBgm("battle_star_admin")
    .setVictoryBgm("victory_team_plasma")
    .setPartyTemplateFunc(() => getEvilGruntPartyTemplate())
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.REVAVROOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 5; // Caph Starmobile
        p.moveset = [
          new PokemonMove(MoveId.COMBAT_TORQUE),
          new PokemonMove(MoveId.SPIN_OUT),
          new PokemonMove(MoveId.IRON_DEFENSE),
          new PokemonMove(MoveId.HIGH_HORSEPOWER),
        ];
      }),
    ),
}