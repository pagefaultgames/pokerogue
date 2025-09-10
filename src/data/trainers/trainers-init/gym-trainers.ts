import { signatureSpecies } from "#balance/signature-species";
import { PokemonType } from "#enums/pokemon-type";
import { TrainerType } from "#enums/trainer-type";
import { nextTrainerId, setTrainerId, TrainerConfig } from "#trainers/trainer-config";
import { TrainerConfigs } from "#types/trainer-funcs";


export const gymLeaderTrainersConfigs : TrainerConfigs = {
    [TrainerType.BROCK]: new TrainerConfig(setTrainerId(TrainerType.BROCK))
    .initForGymLeader(signatureSpecies["BROCK"], true, PokemonType.ROCK, false, -1)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.MISTY]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["MISTY"], false, PokemonType.WATER, false, -1)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.LT_SURGE]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["LT_SURGE"], true, PokemonType.ELECTRIC, false, -1)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.ERIKA]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["ERIKA"], false, PokemonType.GRASS, false, -1)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.JANINE]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["JANINE"], false, PokemonType.POISON, false, -1)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.SABRINA]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["SABRINA"], false, PokemonType.PSYCHIC, false, -1)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.BLAINE]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["BLAINE"], true, PokemonType.FIRE, false, -1)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.GIOVANNI]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["GIOVANNI"], true, PokemonType.GROUND, false, -2)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym"),
  [TrainerType.FALKNER]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["FALKNER"], true, PokemonType.FLYING, false, -1)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.BUGSY]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["BUGSY"], true, PokemonType.BUG, false, -1)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.WHITNEY]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["WHITNEY"], false, PokemonType.NORMAL, false, -1)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.MORTY]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["MORTY"], true, PokemonType.GHOST, false, -1)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.CHUCK]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["CHUCK"], true, PokemonType.FIGHTING, false, -1)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.JASMINE]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["JASMINE"], false, PokemonType.STEEL, false, -1)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.PRYCE]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["PRYCE"], true, PokemonType.ICE, false, -1)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.CLAIR]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["CLAIR"], false, PokemonType.DRAGON, false, -3)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym"),
  [TrainerType.ROXANNE]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["ROXANNE"], false, PokemonType.ROCK, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.BRAWLY]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["BRAWLY"], true, PokemonType.FIGHTING, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.WATTSON]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["WATTSON"], true, PokemonType.ELECTRIC, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.FLANNERY]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["FLANNERY"], false, PokemonType.FIRE, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.NORMAN]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["NORMAN"], true, PokemonType.NORMAL, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.WINONA]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["WINONA"], false, PokemonType.FLYING, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.TATE]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["TATE"], true, PokemonType.PSYCHIC, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym")
    .setHasDouble("tate_liza_double")
    .setDoubleTrainerType(TrainerType.LIZA)
    .setDoubleTitle("gym_leader_double"),
  [TrainerType.LIZA]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["LIZA"], false, PokemonType.PSYCHIC, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym")
    .setHasDouble("liza_tate_double")
    .setDoubleTrainerType(TrainerType.TATE)
    .setDoubleTitle("gym_leader_double"),
  [TrainerType.JUAN]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["JUAN"], true, PokemonType.WATER, false, -1)
    .setBattleBgm("battle_hoenn_gym")
    .setMixedBattleBgm("battle_hoenn_gym"),
  [TrainerType.ROARK]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["ROARK"], true, PokemonType.ROCK, false, -1)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.GARDENIA]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["GARDENIA"], false, PokemonType.GRASS, false, -1)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.MAYLENE]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["MAYLENE"], false, PokemonType.FIGHTING, false, -1)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.CRASHER_WAKE]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["CRASHER_WAKE"], true, PokemonType.WATER, false, -1)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.FANTINA]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["FANTINA"], false, PokemonType.GHOST, false, -1)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.BYRON]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["BYRON"], true, PokemonType.STEEL, false, -1)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.CANDICE]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["CANDICE"], false, PokemonType.ICE, false, -1)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.VOLKNER]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["VOLKNER"], true, PokemonType.ELECTRIC, false, -1)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym"),
  [TrainerType.CILAN]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["CILAN"], true, PokemonType.GRASS, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.CHILI]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["CHILI"], true, PokemonType.FIRE, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.CRESS]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["CRESS"], true, PokemonType.WATER, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.CHEREN]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["CHEREN"], true, PokemonType.NORMAL, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.LENORA]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["LENORA"], false, PokemonType.NORMAL, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.ROXIE]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["ROXIE"], false, PokemonType.POISON, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.BURGH]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["BURGH"], true, PokemonType.BUG, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.ELESA]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["ELESA"], false, PokemonType.ELECTRIC, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.CLAY]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["CLAY"], true, PokemonType.GROUND, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.SKYLA]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["SKYLA"], false, PokemonType.FLYING, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.BRYCEN]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["BRYCEN"], true, PokemonType.ICE, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.DRAYDEN]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["DRAYDEN"], true, PokemonType.DRAGON, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.MARLON]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["MARLON"], true, PokemonType.WATER, false, -1)
    .setMixedBattleBgm("battle_unova_gym"),
  [TrainerType.VIOLA]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["VIOLA"], false, PokemonType.BUG, false, -1)
    .setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.GRANT]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["GRANT"], true, PokemonType.ROCK, false, -1)
    .setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.KORRINA]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["KORRINA"], false, PokemonType.FIGHTING, false, -1)
    .setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.RAMOS]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["RAMOS"], true, PokemonType.GRASS, false, -1)
    .setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.CLEMONT]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["CLEMONT"], true, PokemonType.ELECTRIC, false, -1)
    .setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.VALERIE]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["VALERIE"], false, PokemonType.FAIRY, false, -1)
    .setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.OLYMPIA]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["OLYMPIA"], false, PokemonType.PSYCHIC, false, -1)
    .setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.WULFRIC]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["WULFRIC"], true, PokemonType.ICE, false, -1)
    .setMixedBattleBgm("battle_kalos_gym"),
  [TrainerType.MILO]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["MILO"], true, PokemonType.GRASS, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.NESSA]: new TrainerConfig(nextTrainerId())
    .setName("Nessa")
    .initForGymLeader(signatureSpecies["NESSA"], false, PokemonType.WATER, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.KABU]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["KABU"], true, PokemonType.FIRE, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.BEA]: new TrainerConfig(nextTrainerId())
    .setName("Bea")
    .initForGymLeader(signatureSpecies["BEA"], false, PokemonType.FIGHTING, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.ALLISTER]: new TrainerConfig(nextTrainerId())
    .setName("Allister")
    .initForGymLeader(signatureSpecies["ALLISTER"], true, PokemonType.GHOST, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.OPAL]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["OPAL"], false, PokemonType.FAIRY, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.BEDE]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["BEDE"], true, PokemonType.FAIRY, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.GORDIE]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["GORDIE"], true, PokemonType.ROCK, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.MELONY]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["MELONY"], false, PokemonType.ICE, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.PIERS]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["PIERS"], true, PokemonType.DARK, false, -3)
    .setHasDouble("piers_marnie_double")
    .setDoubleTrainerType(TrainerType.MARNIE)
    .setDoubleTitle("gym_leader_double")
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.MARNIE]: new TrainerConfig(nextTrainerId())
    .setName("Marnie")
    .initForGymLeader(signatureSpecies["MARNIE"], false, PokemonType.DARK, false, -4)
    .setHasDouble("marnie_piers_double")
    .setDoubleTrainerType(TrainerType.PIERS)
    .setDoubleTitle("gym_leader_double")
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.RAIHAN]: new TrainerConfig(nextTrainerId())
    .setName("Raihan")
    .initForGymLeader(signatureSpecies["RAIHAN"], true, PokemonType.DRAGON, false, -1)
    .setMixedBattleBgm("battle_galar_gym"),
  [TrainerType.KATY]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["KATY"], false, PokemonType.BUG, true, -1)
    .setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.BRASSIUS]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["BRASSIUS"], true, PokemonType.GRASS, true, -1)
    .setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.IONO]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["IONO"], false, PokemonType.ELECTRIC, true, -1)
    .setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.KOFU]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["KOFU"], true, PokemonType.WATER, true, -1)
    .setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.LARRY]: new TrainerConfig(nextTrainerId())
    .setName("Larry")
    .initForGymLeader(signatureSpecies["LARRY"], true, PokemonType.NORMAL, true, -1)
    .setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.RYME]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["RYME"], false, PokemonType.GHOST, true, -1)
    .setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.TULIP]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["TULIP"], false, PokemonType.PSYCHIC, true, -1)
    .setMixedBattleBgm("battle_paldea_gym"),
  [TrainerType.GRUSHA]: new TrainerConfig(nextTrainerId())
    .initForGymLeader(signatureSpecies["GRUSHA"], true, PokemonType.ICE, true, -1)
    .setMixedBattleBgm("battle_paldea_gym"),
}