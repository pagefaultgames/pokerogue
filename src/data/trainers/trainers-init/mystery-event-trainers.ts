import { PartyMemberStrength } from "#enums/party-member-strength";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import { getRandomPartyMemberFunc, nextTrainerId, TrainerConfig } from "#trainers/trainer-config";
import { TrainerPartyCompoundTemplate, TrainerPartyTemplate, trainerPartyTemplates } from "#trainers/trainer-party-template";
import { TrainerConfigs } from "#types/trainer-funcs";

export const mysteryEventTrainers: TrainerConfigs = {

  // Mystery Event Test Trainer Encounter
[TrainerType.BUCK]: new TrainerConfig(nextTrainerId())
    .setName("Buck")
    .initForStatTrainer(true)
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.CLAYDOL], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 3);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.VENUSAUR, SpeciesId.COALOSSAL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.GREAT_BALL;
        if (p.species.speciesId === SpeciesId.VENUSAUR) {
          p.formIndex = 2; // Gmax
          p.abilityIndex = 2; // Venusaur gets Chlorophyll
        } else {
          p.formIndex = 1; // Gmax
        }
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.AGGRON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // Mega
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      3,
      getRandomPartyMemberFunc([SpeciesId.TORKOAL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.abilityIndex = 1; // Drought
      }),
    )
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.GREAT_TUSK], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.HEATRAN], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.CHERYL]: new TrainerConfig(nextTrainerId())
    .setName("Cheryl")
    .initForStatTrainer()
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.BLISSEY], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 3);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.SNORLAX, SpeciesId.LAPRAS], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.GREAT_BALL;
        p.formIndex = 1; // Gmax
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.AUDINO], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // Mega
        p.generateName();
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.GOODRA], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.IRON_HANDS], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.CRESSELIA, SpeciesId.ENAMORUS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === SpeciesId.ENAMORUS) {
          p.formIndex = 1; // Therian
          p.generateName();
        }
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.MARLEY]: new TrainerConfig(nextTrainerId())
    .setName("Marley")
    .initForStatTrainer()
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.ARCANINE], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 3);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.ULTRA_BALL;
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.CINDERACE, SpeciesId.INTELEON], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.GREAT_BALL;
        p.formIndex = 1; // Gmax
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      2,
      getRandomPartyMemberFunc([SpeciesId.AERODACTYL], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.formIndex = 1; // Mega
        p.generateName();
      }),
    )
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.DRAGAPULT], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.IRON_BUNDLE], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.REGIELEKI], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.MIRA]: new TrainerConfig(nextTrainerId())
    .setName("Mira")
    .initForStatTrainer()
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.ALAKAZAM], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.formIndex = 1;
        p.pokeball = PokeballType.ULTRA_BALL;
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.GENGAR, SpeciesId.HATTERENE], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.GREAT_BALL;
        p.formIndex = p.species.speciesId === SpeciesId.GENGAR ? 2 : 1; // Gmax
        p.generateName();
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.FLUTTER_MANE], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.HYDREIGON], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.MAGNEZONE], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.LATIOS, SpeciesId.LATIAS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),
  [TrainerType.RILEY]: new TrainerConfig(nextTrainerId())
    .setName("Riley")
    .initForStatTrainer(true)
    .setPartyMemberFunc(
      0,
      getRandomPartyMemberFunc([SpeciesId.LUCARIO], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        p.formIndex = 1;
        p.pokeball = PokeballType.ULTRA_BALL;
        p.generateName();
      }),
    )
    .setPartyMemberFunc(
      1,
      getRandomPartyMemberFunc([SpeciesId.RILLABOOM, SpeciesId.CENTISKORCH], TrainerSlot.TRAINER, true, p => {
        p.generateAndPopulateMoveset();
        p.pokeball = PokeballType.GREAT_BALL;
        p.formIndex = 1; // Gmax
        p.generateName();
      }),
    )
    .setPartyMemberFunc(2, getRandomPartyMemberFunc([SpeciesId.TYRANITAR], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(3, getRandomPartyMemberFunc([SpeciesId.ROARING_MOON], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(4, getRandomPartyMemberFunc([SpeciesId.URSALUNA], TrainerSlot.TRAINER, true))
    .setPartyMemberFunc(
      5,
      getRandomPartyMemberFunc([SpeciesId.REGIGIGAS, SpeciesId.LANDORUS], TrainerSlot.TRAINER, true, p => {
        p.setBoss(true, 2);
        p.generateAndPopulateMoveset();
        if (p.species.speciesId === SpeciesId.LANDORUS) {
          p.formIndex = 1; // Therian
          p.generateName();
        }
        p.pokeball = PokeballType.MASTER_BALL;
      }),
    ),


  // Mystery Event Winstrates
  [TrainerType.VICTOR]: new TrainerConfig(nextTrainerId())
    .setTitle("The Winstrates")
    .setLocalizedName("Victor")
    .setMoneyMultiplier(1) // The Winstrate trainers have total money multiplier of 6
    .setPartyTemplates(trainerPartyTemplates.ONE_AVG_ONE_STRONG),
  [TrainerType.VICTORIA]: new TrainerConfig(nextTrainerId())
    .setTitle("The Winstrates")
    .setLocalizedName("Victoria")
    .setMoneyMultiplier(1)
    .setPartyTemplates(trainerPartyTemplates.ONE_AVG_ONE_STRONG),
  [TrainerType.VIVI]: new TrainerConfig(nextTrainerId())
    .setTitle("The Winstrates")
    .setLocalizedName("Vivi")
    .setMoneyMultiplier(1)
    .setPartyTemplates(trainerPartyTemplates.TWO_AVG_ONE_STRONG),
  [TrainerType.VICKY]: new TrainerConfig(nextTrainerId())
    .setTitle("The Winstrates")
    .setLocalizedName("Vicky")
    .setMoneyMultiplier(1)
    .setPartyTemplates(trainerPartyTemplates.ONE_AVG),
  [TrainerType.VITO]: new TrainerConfig(nextTrainerId())
    .setTitle("The Winstrates")
    .setLocalizedName("Vito")
    .setMoneyMultiplier(2)
    .setPartyTemplates(
      new TrainerPartyCompoundTemplate(
        new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE),
        new TrainerPartyTemplate(2, PartyMemberStrength.STRONG),
      ),
    ),

  // Mystery Event Bug Type Super Fan
  [TrainerType.BUG_TYPE_SUPERFAN]: new TrainerConfig(nextTrainerId())
      .setMoneyMultiplier(2.25)
      .setEncounterBgm(TrainerType.ACE_TRAINER)
      .setPartyTemplates(new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE)),
   // Mystery Event Pokemon Breeder
    [TrainerType.EXPERT_POKEMON_BREEDER]: new TrainerConfig(nextTrainerId())
      .setMoneyMultiplier(3)
      .setEncounterBgm(TrainerType.ACE_TRAINER)
      .setLocalizedName("Expert Pokemon Breeder")
      .setPartyTemplates(new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE)),

  // Mystery Event Giratina Event, Weird Dream Event.
    [TrainerType.FUTURE_SELF_M]: new TrainerConfig(nextTrainerId())
      .setMoneyMultiplier(0)
      .setEncounterBgm("mystery_encounter_weird_dream")
      .setBattleBgm("mystery_encounter_weird_dream")
      .setMixedBattleBgm("mystery_encounter_weird_dream")
      .setVictoryBgm("mystery_encounter_weird_dream")
      .setLocalizedName("Future Self M")
      .setPartyTemplates(new TrainerPartyTemplate(6, PartyMemberStrength.STRONG)),
    [TrainerType.FUTURE_SELF_F]: new TrainerConfig(nextTrainerId())
      .setMoneyMultiplier(0)
      .setEncounterBgm("mystery_encounter_weird_dream")
      .setBattleBgm("mystery_encounter_weird_dream")
      .setMixedBattleBgm("mystery_encounter_weird_dream")
      .setVictoryBgm("mystery_encounter_weird_dream")
      .setLocalizedName("Future Self F")
      .setPartyTemplates(new TrainerPartyTemplate(6, PartyMemberStrength.STRONG)),
}
