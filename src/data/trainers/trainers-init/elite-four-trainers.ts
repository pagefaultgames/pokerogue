import { signatureSpecies } from "#balance/signature-species";
import { Gender } from "#data/gender";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import { PokemonMove } from "#moves/pokemon-move";
import { getRandomPartyMemberFunc, nextTrainerId, setTrainerId, TrainerConfig } from "#trainers/trainer-config";
import { TrainerConfigs } from "#types/trainer-funcs";
import { t } from "i18next";
import { isNullOrUndefined } from "util";


export const eliteFourTrainers: TrainerConfigs = {
  // Kanto Elite Four
  [TrainerType.LORELEI]: new TrainerConfig(setTrainerId(TrainerType.LORELEI))
    .initForEliteFour(signatureSpecies["LORELEI"], false, PokemonType.ICE, 2)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.DEWGONG], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 0; // Thick Fat
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.SLOWBRO, SpeciesId.GALAR_SLOWBRO], TrainerSlot.TRAINER, true, p => {
        // Tera Ice Slowbro/G-Slowbro
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.ICE_BEAM)) {
          // Check if Ice Beam is in the moveset, if not, replace the third move with Ice Beam.
          p.moveset[2] = new PokemonMove(MoveId.ICE_BEAM);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.JYNX]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.CLOYSTER, SpeciesId.ALOLA_SANDSLASH]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.LAPRAS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.BRUNO]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["BRUNO"], true, PokemonType.FIGHTING, 2)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.HITMONLEE, SpeciesId.HITMONCHAN, SpeciesId.HITMONTOP]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.STEELIX], TrainerSlot.TRAINER, true, p => {
        // Tera Fighting Steelix
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.BODY_PRESS)) {
          // Check if Body Press is in the moveset, if not, replace the third move with Body Press.
          p.moveset[2] = new PokemonMove(MoveId.BODY_PRESS);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.POLIWRATH]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.ANNIHILAPE]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.MACHAMP], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.AGATHA]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["AGATHA"], false, PokemonType.GHOST, 2)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.MISMAGIUS]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.ARBOK, SpeciesId.WEEZING], TrainerSlot.TRAINER, true, p => {
        // Tera Ghost Arbok/Weezing
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.ALOLA_MAROWAK]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.CURSOLA]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GENGAR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.LANCE]: new TrainerConfig(nextTrainerId())
    .setName("Lance")
    .initForEliteFour(signatureSpecies["LANCE"], true, PokemonType.DRAGON, 2)
    .setBattleBgm("battle_kanto_gym")
    .setMixedBattleBgm("battle_kanto_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.KINGDRA]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.GYARADOS, SpeciesId.AERODACTYL], TrainerSlot.TRAINER, true, p => {
        // Tera Dragon Gyarados/Aerodactyl
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.ALOLA_EXEGGUTOR]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.SALAMENCE]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.DRAGONITE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
    // Johto Elite Four
  [TrainerType.WILL]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["WILL"], true, PokemonType.PSYCHIC, 2)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.JYNX]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.SLOWKING, SpeciesId.GALAR_SLOWKING])) // Tera Psychic Slowking/G-Slowking
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.EXEGGUTOR]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.WYRDEER, SpeciesId.FARIGIRAF]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.XATU], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.KOGA]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["KOGA"], true, PokemonType.POISON, 2)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.VENOMOTH], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Tinted Lens
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.MUK, SpeciesId.WEEZING])) // Tera Poison Muk/Weezing
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.TENTACRUEL]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.SNEASLER, SpeciesId.OVERQWIL]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.CROBAT], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.KAREN]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["KAREN"], false, PokemonType.DARK, 2)
    .setBattleBgm("battle_johto_gym")
    .setMixedBattleBgm("battle_johto_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.UMBREON]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.GENGAR], TrainerSlot.TRAINER, true, p => {
        // Tera Dark Gengar
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.DARK_PULSE)) {
          // Check if Dark Pulse is in the moveset, if not, replace the third move with Dark Pulse.
          p.moveset[2] = new PokemonMove(MoveId.DARK_PULSE);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.HONCHKROW]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.WEAVILE]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.HOUNDOOM], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  // Hoenn Elite Four
  [TrainerType.SIDNEY]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["SIDNEY"], true, PokemonType.DARK, 2)
    .setMixedBattleBgm("battle_hoenn_elite")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.MIGHTYENA], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 0; // Intimidate
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.OBSTAGOON])) // Tera Dark Obstagoon
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.SHIFTRY, SpeciesId.CACTURNE]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.SHARPEDO, SpeciesId.CRAWDAUNT]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.ABSOL], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.PHOEBE]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["PHOEBE"], false, PokemonType.GHOST, 2)
    .setMixedBattleBgm("battle_hoenn_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.SABLEYE]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.BANETTE])) // Tera Ghost Banette
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.DRIFBLIM, SpeciesId.MISMAGIUS]))
    .setPartyMemberFunc(
      4,
      getRandomPartyMemberFunc([SpeciesId.ORICORIO, SpeciesId.ALOLA_MAROWAK], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = p.species.speciesId === SpeciesId.ORICORIO ? 3 : 0; // Oricorio-Sensu
      }),
    )
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.DUSKNOIR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.GLACIA]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["GLACIA"], false, PokemonType.ICE, 2)
    .setMixedBattleBgm("battle_hoenn_elite")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.ABOMASNOW], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 0; // Snow Warning
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.GLALIE])) // Tera Ice Glalie
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.FROSLASS]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.ALOLA_NINETALES]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.WALREIN], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.DRAKE]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["DRAKE"], true, PokemonType.DRAGON, 2)
    .setMixedBattleBgm("battle_hoenn_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.ALTARIA]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.DHELMISE], TrainerSlot.TRAINER, true, p => {
        // Tera Dragon Dhelmise
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.FLYGON]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.KINGDRA]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.SALAMENCE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),

  // Sinnoh Elite Four
  [TrainerType.AARON]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["AARON"], true, PokemonType.BUG, 5)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.YANMEGA]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.HERACROSS]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.VESPIQUEN]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.SCIZOR, SpeciesId.KLEAVOR]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.DRAPION], TrainerSlot.TRAINER, true, p => {
        // Tera Bug Drapion
        p.setBoss(true, 2);
        p.abilityIndex = 1; // Sniper
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.X_SCISSOR)) {
          // Check if X-Scissor is in the moveset, if not, replace the third move with X-Scissor.
          p.moveset[2] = new PokemonMove(MoveId.X_SCISSOR);
        }
      }),
    ),
  [TrainerType.BERTHA]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["BERTHA"], false, PokemonType.GROUND, 2)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.WHISCASH]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.HIPPOWDON], TrainerSlot.TRAINER, true, p => {
        // Tera Ground Hippowdon
        p.abilityIndex = 0; // Sand Stream
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.GLISCOR]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.MAMOSWINE, SpeciesId.URSALUNA]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.RHYPERIOR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.abilityIndex = 1; // Solid Rock
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.FLINT]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["FLINT"], true, PokemonType.FIRE, 2)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.RAPIDASH]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.STEELIX, SpeciesId.LOPUNNY], TrainerSlot.TRAINER, true, p => {
        // Tera Fire Steelix/Lopunny
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.INFERNAPE]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.ARCANINE, SpeciesId.HISUI_ARCANINE]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.MAGMORTAR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.LUCIAN]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["LUCIAN"], true, PokemonType.PSYCHIC, 2)
    .setBattleBgm("battle_sinnoh_gym")
    .setMixedBattleBgm("battle_sinnoh_gym")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.ESPEON, SpeciesId.ALAKAZAM]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.FARIGIRAF])) // Tera Psychic Farigiraf
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.BRONZONG]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.MR_RIME, SpeciesId.HISUI_BRAVIARY]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GALLADE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.abilityIndex = 1; // Sharpness
        p.generateAndPopulateMoveset();
      }),
    ),
  // Unova Elite Four
  [TrainerType.SHAUNTAL]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["SHAUNTAL"], false, PokemonType.GHOST, 2)
    .setMixedBattleBgm("battle_unova_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.COFAGRIGUS]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.GOLURK])) // Tera Ghost Golurk
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.JELLICENT]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.MISMAGIUS, SpeciesId.FROSLASS]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.CHANDELURE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.MARSHAL]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["MARSHAL"], true, PokemonType.FIGHTING, 2)
    .setMixedBattleBgm("battle_unova_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.THROH, SpeciesId.SAWK]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.MIENSHAO])) // Tera Fighting Mienshao
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.EMBOAR]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.BRELOOM, SpeciesId.TOXICROAK]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.CONKELDURR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.GRIMSLEY]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["GRIMSLEY"], true, PokemonType.DARK, 2)
    .setMixedBattleBgm("battle_unova_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.LIEPARD]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.KROOKODILE])) // Tera Dark Krookodile
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.SCRAFTY]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.ZOROARK, SpeciesId.HISUI_SAMUROTT]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.KINGAMBIT], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.CAITLIN]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["CAITLIN"], false, PokemonType.PSYCHIC, 2)
    .setMixedBattleBgm("battle_unova_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.MUSHARNA]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.REUNICLUS])) // Tera Psychic Reuniclus
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.GALLADE], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Sharpness
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.SIGILYPH, SpeciesId.HISUI_BRAVIARY]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GOTHITELLE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),

  // Kalos Elite Four
  [TrainerType.MALVA]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["MALVA"], false, PokemonType.FIRE, 2)
    .setMixedBattleBgm("battle_kalos_elite")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.PYROAR], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.gender = Gender.FEMALE;
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.HOUNDOOM])) // Tera Fire Houndoom
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.TORKOAL], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Drought
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.CHANDELURE, SpeciesId.DELPHOX]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.TALONFLAME], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.SIEBOLD]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["SIEBOLD"], true, PokemonType.WATER, 2)
    .setMixedBattleBgm("battle_kalos_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.CLAWITZER]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.GYARADOS])) // Tera Water Gyarados
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.STARMIE]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.BLASTOISE, SpeciesId.DONDOZO]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.BARBARACLE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.abilityIndex = 1; // Tough Claws
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.WIKSTROM]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["WIKSTROM"], true, PokemonType.STEEL, 2)
    .setMixedBattleBgm("battle_kalos_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.KLEFKI]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.CERULEDGE], TrainerSlot.TRAINER, true, p => {
        // Tera Steel Ceruledge
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.IRON_HEAD)) {
          // Check if Iron Head is in the moveset, if not, replace the third move with Iron Head.
          p.moveset[2] = new PokemonMove(MoveId.IRON_HEAD);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.SCIZOR]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.CORVIKNIGHT]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.AEGISLASH], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.DRASNA]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["DRASNA"], false, PokemonType.DRAGON, 2)
    .setMixedBattleBgm("battle_kalos_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.DRAGALGE]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.GARCHOMP])) // Tera Dragon Garchomp
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.ALTARIA]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.DRUDDIGON]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.NOIVERN], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),

  // Alola Elite Four
  [TrainerType.HALA]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["HALA"], true, PokemonType.FIGHTING, 2)
    .setMixedBattleBgm("battle_alola_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.HARIYAMA]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.INCINEROAR], TrainerSlot.TRAINER, true, p => {
        // Tera Fighting Incineroar
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.CROSS_CHOP)) {
          // Check if Cross Chop is in the moveset, if not, replace the third move with Cross Chop.
          p.moveset[2] = new PokemonMove(MoveId.CROSS_CHOP);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.BEWEAR]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.POLIWRATH, SpeciesId.ANNIHILAPE]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.CRABOMINABLE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.MOLAYNE]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["MOLAYNE"], true, PokemonType.STEEL, 2)
    .setMixedBattleBgm("battle_alola_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.KLEFKI]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.ALOLA_SANDSLASH])) // Tera Steel A-Sandslash
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.MAGNEZONE]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.METAGROSS, SpeciesId.KINGAMBIT]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.ALOLA_DUGTRIO], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.OLIVIA]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["OLIVIA"], false, PokemonType.ROCK, 2)
    .setMixedBattleBgm("battle_alola_elite")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.GIGALITH], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Sand Stream
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.PROBOPASS])) // Tera Rock Probopass
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.ALOLA_GOLEM]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.RELICANTH, SpeciesId.CARBINK]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.LYCANROC], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.formIndex = 1;
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.ACEROLA]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["ACEROLA"], false, PokemonType.GHOST, 2)
    .setMixedBattleBgm("battle_alola_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.DRIFBLIM]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.MIMIKYU])) // Tera Ghost Mimikyu
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.DHELMISE]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.FROSLASS]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.PALOSSAND], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.KAHILI]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["KAHILI"], false, PokemonType.FLYING, 2)
    .setMixedBattleBgm("battle_alola_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.HAWLUCHA]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.DECIDUEYE], TrainerSlot.TRAINER, true, p => {
        // Tera Flying Decidueye
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.BRAVE_BIRD)) {
          // Check if Brave Bird is in the moveset, if not, replace the third move with Brave Bird.
          p.moveset[2] = new PokemonMove(MoveId.BRAVE_BIRD);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.BRAVIARY, SpeciesId.MANDIBUZZ]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.ORICORIO]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.TOUCANNON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  // Galar Elite Four
  [TrainerType.MARNIE_ELITE]: new TrainerConfig(nextTrainerId())
    .setName("Marnie")
    .initForEliteFour(signatureSpecies["MARNIE_ELITE"], false, PokemonType.DARK, 2)
    .setMixedBattleBgm("battle_galar_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.LIEPARD]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.TOXICROAK], TrainerSlot.TRAINER, true, p => {
        // Tera Dark Toxicroak
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.SUCKER_PUNCH)) {
          // Check if Sucker Punch is in the moveset, if not, replace the third move with Sucker Punch.
          p.moveset[2] = new PokemonMove(MoveId.SUCKER_PUNCH);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.SCRAFTY, SpeciesId.PANGORO]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.MORPEKO]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GRIMMSNARL], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.NESSA_ELITE]: new TrainerConfig(nextTrainerId())
    .setName("Nessa")
    .initForEliteFour(signatureSpecies["NESSA_ELITE"], false, PokemonType.WATER, 2)
    .setMixedBattleBgm("battle_galar_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.GOLISOPOD]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.EISCUE], TrainerSlot.TRAINER, true, p => {
        // Tera Water Eiscue
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.LIQUIDATION)) {
          // Check if Liquidation is in the moveset, if not, replace the third move with Liquidation.
          p.moveset[2] = new PokemonMove(MoveId.LIQUIDATION);
        }
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.PELIPPER], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = 1; // Drizzle
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.TOXAPEX]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.DREDNAW], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.BEA_ELITE]: new TrainerConfig(nextTrainerId())
    .setName("Bea")
    .initForEliteFour(signatureSpecies["BEA_ELITE"], false, PokemonType.FIGHTING, 2)
    .setMixedBattleBgm("battle_galar_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.HAWLUCHA]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.SIRFETCHD])) // Tera Fighting Sirfetch'd
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.GRAPPLOCT, SpeciesId.FALINKS]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.HITMONTOP]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.MACHAMP], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.ALLISTER_ELITE]: new TrainerConfig(nextTrainerId())
    .setName("Allister")
    .initForEliteFour(signatureSpecies["ALLISTER_ELITE"], true, PokemonType.GHOST, 2)
    .setMixedBattleBgm("battle_galar_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.DUSKNOIR]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.RUNERIGUS])) // Tera Ghost Runerigus
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.POLTEAGEIST, SpeciesId.SINISTCHA]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.CURSOLA]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.GENGAR], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.RAIHAN_ELITE]: new TrainerConfig(nextTrainerId())
    .setName("Raihan")
    .initForEliteFour(signatureSpecies["RAIHAN_ELITE"], true, PokemonType.DRAGON, 2)
    .setMixedBattleBgm("battle_galar_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.FLYGON]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.TORKOAL], TrainerSlot.TRAINER, true, p => {
        // Tera Dragon Torkoal
        p.abilityIndex = 1; // Drought
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.GOODRA]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.TURTONATOR]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.ARCHALUDON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),

  // Paldea Elite Four
  [TrainerType.RIKA]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["RIKA"], false, PokemonType.GROUND, 5)
    .setMixedBattleBgm("battle_paldea_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.DUGTRIO]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.DONPHAN]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.SWAMPERT, SpeciesId.TORTERRA]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.CAMERUPT]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.CLODSIRE], TrainerSlot.TRAINER, true, p => {
        // Tera Ground Clodsire
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.POPPY]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["POPPY"], false, PokemonType.STEEL, 5)
    .setMixedBattleBgm("battle_paldea_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.COPPERAJAH]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.MAGNEZONE]))
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.BRONZONG, SpeciesId.CORVIKNIGHT], TrainerSlot.TRAINER, true, p => {
        p.abilityIndex = p.species.speciesId === SpeciesId.BRONZONG ? 0 : 1; // Levitate Bronzong, Unnerve Corviknight
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.STEELIX]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.TINKATON], TrainerSlot.TRAINER, true, p => {
        // Tera Steel Tinkaton
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.LARRY_ELITE]: new TrainerConfig(nextTrainerId())
    .setName("Larry")
    .initForEliteFour(signatureSpecies["LARRY_ELITE"], true, PokemonType.FLYING, 5)
    .setMixedBattleBgm("battle_paldea_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.ALTARIA]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.BOMBIRDIER]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.TROPIUS]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.STARAPTOR]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.FLAMIGO], TrainerSlot.TRAINER, true, p => {
        // Tera Flying Flamigo
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.HASSEL]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["HASSEL"], true, PokemonType.DRAGON, 5)
    .setMixedBattleBgm("battle_paldea_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.NOIVERN]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.DRAGALGE]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.FLAPPLE, SpeciesId.APPLETUN, SpeciesId.HYDRAPPLE]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.HAXORUS]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.BAXCALIBUR], TrainerSlot.TRAINER, true, p => {
        // Tera Dragon Baxcalibur
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),

  // Blueberry Academy BB League
  [TrainerType.CRISPIN]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["CRISPIN"], true, PokemonType.FIRE, 2)
    .setMixedBattleBgm("battle_bb_elite")
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.ROTOM], TrainerSlot.TRAINER, true, p => {
        p.formIndex = 1; // Heat Rotom
        p.generateAndPopulateMoveset();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.EXEGGUTOR], TrainerSlot.TRAINER, true, p => {
        // Tera Fire Exeggutor
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.TALONFLAME], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.SUNNY_DAY)) {
          // Check if Sunny Day is in the moveset, if not, replace the third move with Sunny Day.
          p.moveset[2] = new PokemonMove(MoveId.SUNNY_DAY);
        }
      }),
    )
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.MAGMORTAR]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.BLAZIKEN], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.AMARYS]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["AMARYS"], false, PokemonType.STEEL, 2)
    .setMixedBattleBgm("battle_bb_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.SKARMORY]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.REUNICLUS], TrainerSlot.TRAINER, true, p => {
        // Tera Steel Reuniclus
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.FLASH_CANNON)) {
          // Check if Flash Cannon is in the moveset, if not, replace the third move with Flash Cannon.
          p.moveset[2] = new PokemonMove(MoveId.FLASH_CANNON);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.EMPOLEON]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.SCIZOR]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.METAGROSS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
  [TrainerType.LACEY]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["LACEY"], false, PokemonType.FAIRY, 5)
    .setMixedBattleBgm("battle_bb_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.WHIMSICOTT]))
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.PRIMARINA]))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.GRANBULL]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.ALCREMIE]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.EXCADRILL], TrainerSlot.TRAINER, true, p => {
        // Tera Fairy Excadrill
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.TERA_BLAST)) {
          // Check if Tera Blast is in the moveset, if not, replace the third move with Tera Blast.
          p.moveset[2] = new PokemonMove(MoveId.TERA_BLAST);
        }
      }),
    ),
  [TrainerType.DRAYTON]: new TrainerConfig(nextTrainerId())
    .initForEliteFour(signatureSpecies["DRAYTON"], true, PokemonType.DRAGON, 2)
    .setMixedBattleBgm("battle_bb_elite")
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([SpeciesId.DRAGONITE]))
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.SCEPTILE], TrainerSlot.TRAINER, true, p => {
        // Tera Dragon Sceptile
        p.generateAndPopulateMoveset();
        if (!p.moveset.some(move => !isNullOrUndefined(move) && move.moveId === MoveId.DUAL_CHOP)) {
          // Check if Dual Chop is in the moveset, if not, replace the third move with Dual Chop.
          p.moveset[2] = new PokemonMove(MoveId.DUAL_CHOP);
        }
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.HAXORUS]))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.KINGDRA, SpeciesId.DRACOVISH]))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.ARCHALUDON], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
      }),
    ),
}
