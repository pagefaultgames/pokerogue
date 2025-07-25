import { FixedBattleConfig, getRandomTrainerFunc } from "#app/battle";
import { Trainer } from "#app/field/trainer";
import { globalScene } from "#app/global-scene";
import { randSeedInt } from "#app/utils/common";
import { BattleType } from "#enums/battle-type";
import { ClassicFixedBossWaves } from "#enums/fixed-boss-waves";
import { ModifierTier } from "#enums/modifier-tier";
import { PlayerGender } from "#enums/player-gender";
import { TrainerType } from "#enums/trainer-type";
import { TrainerVariant } from "#enums/trainer-variant";

export interface FixedBattleConfigs {
  [key: number]: FixedBattleConfig;
}
/**
 * Youngster/Lass on 5
 * Rival on 8, 55, 95, 145, 195
 * Evil team grunts on 35, 62, 64, and 112
 * Evil team admin on 66 and 114
 * Evil leader on 115, 165
 * E4 on 182, 184, 186, 188
 * Champion on 190
 */
export const classicFixedBattles: FixedBattleConfigs = {
  [ClassicFixedBossWaves.TOWN_YOUNGSTER]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      () => new Trainer(TrainerType.YOUNGSTER, randSeedInt(2) ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT),
    ),
  [ClassicFixedBossWaves.RIVAL_1]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      () =>
        new Trainer(
          TrainerType.RIVAL,
          globalScene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT,
        ),
    ),
  [ClassicFixedBossWaves.RIVAL_2]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      () =>
        new Trainer(
          TrainerType.RIVAL_2,
          globalScene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT,
        ),
    )
    .setCustomModifierRewards({
      guaranteedModifierTiers: [ModifierTier.ULTRA, ModifierTier.GREAT, ModifierTier.GREAT],
      allowLuckUpgrades: false,
    }),
  [ClassicFixedBossWaves.EVIL_GRUNT_1]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      getRandomTrainerFunc(
        [
          TrainerType.ROCKET_GRUNT,
          TrainerType.MAGMA_GRUNT,
          TrainerType.AQUA_GRUNT,
          TrainerType.GALACTIC_GRUNT,
          TrainerType.PLASMA_GRUNT,
          TrainerType.FLARE_GRUNT,
          TrainerType.AETHER_GRUNT,
          TrainerType.SKULL_GRUNT,
          TrainerType.MACRO_GRUNT,
          TrainerType.STAR_GRUNT,
        ],
        true,
      ),
    ),
  [ClassicFixedBossWaves.RIVAL_3]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      () =>
        new Trainer(
          TrainerType.RIVAL_3,
          globalScene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT,
        ),
    )
    .setCustomModifierRewards({
      guaranteedModifierTiers: [ModifierTier.ULTRA, ModifierTier.ULTRA, ModifierTier.GREAT, ModifierTier.GREAT],
      allowLuckUpgrades: false,
    }),
  [ClassicFixedBossWaves.EVIL_GRUNT_2]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc(
        [
          TrainerType.ROCKET_GRUNT,
          TrainerType.MAGMA_GRUNT,
          TrainerType.AQUA_GRUNT,
          TrainerType.GALACTIC_GRUNT,
          TrainerType.PLASMA_GRUNT,
          TrainerType.FLARE_GRUNT,
          TrainerType.AETHER_GRUNT,
          TrainerType.SKULL_GRUNT,
          TrainerType.MACRO_GRUNT,
          TrainerType.STAR_GRUNT,
        ],
        true,
      ),
    ),
  [ClassicFixedBossWaves.EVIL_GRUNT_3]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc(
        [
          TrainerType.ROCKET_GRUNT,
          TrainerType.MAGMA_GRUNT,
          TrainerType.AQUA_GRUNT,
          TrainerType.GALACTIC_GRUNT,
          TrainerType.PLASMA_GRUNT,
          TrainerType.FLARE_GRUNT,
          TrainerType.AETHER_GRUNT,
          TrainerType.SKULL_GRUNT,
          TrainerType.MACRO_GRUNT,
          TrainerType.STAR_GRUNT,
        ],
        true,
      ),
    ),
  [ClassicFixedBossWaves.EVIL_ADMIN_1]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc(
        [
          [TrainerType.ARCHER, TrainerType.ARIANA, TrainerType.PROTON, TrainerType.PETREL],
          [TrainerType.TABITHA, TrainerType.COURTNEY],
          [TrainerType.MATT, TrainerType.SHELLY],
          [TrainerType.JUPITER, TrainerType.MARS, TrainerType.SATURN],
          [TrainerType.ZINZOLIN, TrainerType.COLRESS],
          [TrainerType.XEROSIC, TrainerType.BRYONY],
          TrainerType.FABA,
          TrainerType.PLUMERIA,
          TrainerType.OLEANA,
          [TrainerType.GIACOMO, TrainerType.MELA, TrainerType.ATTICUS, TrainerType.ORTEGA, TrainerType.ERI],
        ],
        true,
      ),
    ),
  [ClassicFixedBossWaves.RIVAL_4]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      () =>
        new Trainer(
          TrainerType.RIVAL_4,
          globalScene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT,
        ),
    )
    .setCustomModifierRewards({
      guaranteedModifierTiers: [ModifierTier.ULTRA, ModifierTier.ULTRA, ModifierTier.ULTRA, ModifierTier.ULTRA],
      allowLuckUpgrades: false,
    }),
  [ClassicFixedBossWaves.EVIL_GRUNT_4]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc(
        [
          TrainerType.ROCKET_GRUNT,
          TrainerType.MAGMA_GRUNT,
          TrainerType.AQUA_GRUNT,
          TrainerType.GALACTIC_GRUNT,
          TrainerType.PLASMA_GRUNT,
          TrainerType.FLARE_GRUNT,
          TrainerType.AETHER_GRUNT,
          TrainerType.SKULL_GRUNT,
          TrainerType.MACRO_GRUNT,
          TrainerType.STAR_GRUNT,
        ],
        true,
      ),
    ),
  [ClassicFixedBossWaves.EVIL_ADMIN_2]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc(
        [
          [TrainerType.ARCHER, TrainerType.ARIANA, TrainerType.PROTON, TrainerType.PETREL],
          [TrainerType.TABITHA, TrainerType.COURTNEY],
          [TrainerType.MATT, TrainerType.SHELLY],
          [TrainerType.JUPITER, TrainerType.MARS, TrainerType.SATURN],
          [TrainerType.ZINZOLIN, TrainerType.COLRESS],
          [TrainerType.XEROSIC, TrainerType.BRYONY],
          TrainerType.FABA,
          TrainerType.PLUMERIA,
          TrainerType.OLEANA,
          [TrainerType.GIACOMO, TrainerType.MELA, TrainerType.ATTICUS, TrainerType.ORTEGA, TrainerType.ERI],
        ],
        true,
        1,
      ),
    ),
  [ClassicFixedBossWaves.EVIL_BOSS_1]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc([
        TrainerType.ROCKET_BOSS_GIOVANNI_1,
        TrainerType.MAXIE,
        TrainerType.ARCHIE,
        TrainerType.CYRUS,
        TrainerType.GHETSIS,
        TrainerType.LYSANDRE,
        TrainerType.LUSAMINE,
        TrainerType.GUZMA,
        TrainerType.ROSE,
        TrainerType.PENNY,
      ]),
    )
    .setCustomModifierRewards({
      guaranteedModifierTiers: [
        ModifierTier.ROGUE,
        ModifierTier.ROGUE,
        ModifierTier.ULTRA,
        ModifierTier.ULTRA,
        ModifierTier.ULTRA,
      ],
      allowLuckUpgrades: false,
    }),
  [ClassicFixedBossWaves.RIVAL_5]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      () =>
        new Trainer(
          TrainerType.RIVAL_5,
          globalScene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT,
        ),
    )
    .setCustomModifierRewards({
      guaranteedModifierTiers: [
        ModifierTier.ROGUE,
        ModifierTier.ROGUE,
        ModifierTier.ROGUE,
        ModifierTier.ULTRA,
        ModifierTier.ULTRA,
      ],
      allowLuckUpgrades: false,
    }),
  [ClassicFixedBossWaves.EVIL_BOSS_2]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc([
        TrainerType.ROCKET_BOSS_GIOVANNI_2,
        TrainerType.MAXIE_2,
        TrainerType.ARCHIE_2,
        TrainerType.CYRUS_2,
        TrainerType.GHETSIS_2,
        TrainerType.LYSANDRE_2,
        TrainerType.LUSAMINE_2,
        TrainerType.GUZMA_2,
        TrainerType.ROSE_2,
        TrainerType.PENNY_2,
      ]),
    )
    .setCustomModifierRewards({
      guaranteedModifierTiers: [
        ModifierTier.ROGUE,
        ModifierTier.ROGUE,
        ModifierTier.ULTRA,
        ModifierTier.ULTRA,
        ModifierTier.ULTRA,
        ModifierTier.ULTRA,
      ],
      allowLuckUpgrades: false,
    }),
  [ClassicFixedBossWaves.ELITE_FOUR_1]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      getRandomTrainerFunc([
        TrainerType.LORELEI,
        TrainerType.WILL,
        TrainerType.SIDNEY,
        TrainerType.AARON,
        TrainerType.SHAUNTAL,
        TrainerType.MALVA,
        [TrainerType.HALA, TrainerType.MOLAYNE],
        TrainerType.MARNIE_ELITE,
        TrainerType.RIKA,
        TrainerType.CRISPIN,
      ]),
    ),
  [ClassicFixedBossWaves.ELITE_FOUR_2]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.ELITE_FOUR_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc([
        TrainerType.BRUNO,
        TrainerType.KOGA,
        TrainerType.PHOEBE,
        TrainerType.BERTHA,
        TrainerType.MARSHAL,
        TrainerType.SIEBOLD,
        TrainerType.OLIVIA,
        TrainerType.NESSA_ELITE,
        TrainerType.POPPY,
        TrainerType.AMARYS,
      ]),
    ),
  [ClassicFixedBossWaves.ELITE_FOUR_3]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.ELITE_FOUR_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc([
        TrainerType.AGATHA,
        TrainerType.BRUNO,
        TrainerType.GLACIA,
        TrainerType.FLINT,
        TrainerType.GRIMSLEY,
        TrainerType.WIKSTROM,
        TrainerType.ACEROLA,
        [TrainerType.BEA_ELITE, TrainerType.ALLISTER_ELITE],
        TrainerType.LARRY_ELITE,
        TrainerType.LACEY,
      ]),
    ),
  [ClassicFixedBossWaves.ELITE_FOUR_4]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.ELITE_FOUR_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc([
        TrainerType.LANCE,
        TrainerType.KAREN,
        TrainerType.DRAKE,
        TrainerType.LUCIAN,
        TrainerType.CAITLIN,
        TrainerType.DRASNA,
        TrainerType.KAHILI,
        TrainerType.RAIHAN_ELITE,
        TrainerType.HASSEL,
        TrainerType.DRAYTON,
      ]),
    ),
  [ClassicFixedBossWaves.CHAMPION]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.ELITE_FOUR_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc([
        TrainerType.BLUE,
        [TrainerType.RED, TrainerType.LANCE_CHAMPION],
        [TrainerType.STEVEN, TrainerType.WALLACE],
        TrainerType.CYNTHIA,
        [TrainerType.ALDER, TrainerType.IRIS],
        TrainerType.DIANTHA,
        [TrainerType.KUKUI, TrainerType.HAU],
        [TrainerType.LEON, TrainerType.MUSTARD],
        [TrainerType.GEETA, TrainerType.NEMONA],
        TrainerType.KIERAN,
      ]),
    ),
  [ClassicFixedBossWaves.RIVAL_6]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      () =>
        new Trainer(
          TrainerType.RIVAL_6,
          globalScene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT,
        ),
    )
    .setCustomModifierRewards({
      guaranteedModifierTiers: [
        ModifierTier.ROGUE,
        ModifierTier.ROGUE,
        ModifierTier.ULTRA,
        ModifierTier.ULTRA,
        ModifierTier.GREAT,
        ModifierTier.GREAT,
      ],
      allowLuckUpgrades: false,
    }),
};
