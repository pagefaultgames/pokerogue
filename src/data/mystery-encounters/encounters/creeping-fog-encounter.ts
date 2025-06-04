import type { EnemyPartyConfig, EnemyPokemonConfig } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import {
  initBattleWithEnemyConfig,
  setEncounterRewards,
  leaveEncounterWithoutBattle,
  transitionMysteryEncounterIntroVisuals,
  generateModifierType,
  setEncounterExp,
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { BerryType } from "#enums/berry-type";
import { randSeedInt } from "#app/utils/common";
import { globalScene } from "#app/global-scene";
import { modifierTypes } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Nature } from "#enums/nature";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import type { PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { TimeOfDayRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { TimeOfDay } from "#enums/time-of-day";
import type { Abilities } from "#enums/abilities";
import { Stat } from "#enums/stat";
import type HeldModifierConfig from "#app/interfaces/held-modifier-config";
import { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { CustomPokemonData } from "#app/data/custom-pokemon-data";
import { ModifierTier } from "#app/modifier/modifier-tier";
import {
  MoveRequirement,
  AbilityRequirement,
  CombinationPokemonRequirement,
} from "#app/data/mystery-encounters/mystery-encounter-requirements";
import {
  DEFOG_MOVES,
  DEFOG_ABILITIES,
  LIGHT_ABILITIES,
  LIGHT_MOVES,
} from "#app/data/mystery-encounters/requirements/requirement-groups";
import { Biome } from "#enums/biome";
import { WeatherType } from "#enums/weather-type";
import FogOverlay from "#app/ui/fog-overlay";

// the i18n namespace for the encounter
const namespace = "mysteryEncounters/creepingFog";

/**
 * Creeping Fog Mystery Encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/4418 | GitHub Issue #4418}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 **/
export const CreepingFogEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.CREEPING_FOG,
)
  .withSceneRequirement(new TimeOfDayRequirement([TimeOfDay.DUSK, TimeOfDay.DAWN, TimeOfDay.NIGHT]))
  .withEncounterTier(MysteryEncounterTier.ULTRA)
  .withSceneWaveRangeRequirement(51, 179)
  .withFleeAllowed(false)
  .withIntroSpriteConfigs([])
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
  ])
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOnInit(() => {
    const waveIndex = globalScene.currentBattle.waveIndex;
    const encounter = globalScene.currentBattle.mysteryEncounter!;
    const chosenPokemonAttributes = chooseBoss();
    const chosenPokemon = chosenPokemonAttributes[0] as Species;
    const naturePokemon = chosenPokemonAttributes[1] as Nature;
    const abilityPokemon = chosenPokemonAttributes[2] as Abilities;
    const passivePokemon = chosenPokemon[3] as boolean;
    const movesPokemon = chosenPokemonAttributes[4] as Moves[];
    const modifPokemon = chosenPokemonAttributes[5] as HeldModifierConfig[];
    const segments = waveIndex < 80 ? 2 : waveIndex < 140 ? 3 : 4;

    const pokemonConfig: EnemyPokemonConfig = {
      species: getPokemonSpecies(chosenPokemon),
      formIndex: [Species.LYCANROC, Species.PIDGEOT].includes(chosenPokemon) ? 1 : 0,
      isBoss: true,
      shiny: false,
      customPokemonData: new CustomPokemonData({ spriteScale: 1 + segments * 0.05 }),
      nature: naturePokemon,
      moveSet: movesPokemon,
      abilityIndex: abilityPokemon,
      passive: passivePokemon,
      bossSegments: segments,
      modifierConfigs: modifPokemon,
    };

    const config: EnemyPartyConfig = {
      levelAdditiveModifier: 0.5,
      pokemonConfigs: [pokemonConfig],
    };
    encounter.enemyPartyConfigs = [config];
    encounter.spriteConfigs = [
      {
        spriteKey: chosenPokemon.toString(),
        fileRoot: "pokemon",
        repeat: true,
        hasShadow: true,
        hidden: true,
        x: 0,
        tint: 1,
        y: 0,
        yShadow: -3,
      },
    ];

    const overlayWidth = globalScene.game.canvas.width / 6;
    const overlayHeight = globalScene.game.canvas.height / 6 - 48;
    const fogOverlay = new FogOverlay({
      delayVisibility: false,
      scale: 1,
      onSide: true,
      right: true,
      x: 1,
      y: overlayHeight * -1 - 48,
      width: overlayWidth,
      height: overlayHeight,
    });
    encounter.misc = {
      fogOverlay,
    };
    globalScene.ui.add(fogOverlay);
    globalScene.ui.sendToBack(fogOverlay);
    globalScene.tweens.add({
      targets: fogOverlay,
      alpha: 0.5,
      ease: "Sine.easeIn",
      duration: 2000,
    });
    fogOverlay.active = true;
    fogOverlay.setVisible(true);

    return true;
  })
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.1.selected`,
          },
        ],
      })
      .withPreOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        globalScene.tweens.add({
          targets: encounter.misc.fogOverlay,
          alpha: 0,
          ease: "Sine.easeOut",
          duration: 2000,
        });
      })
      .withOptionPhase(async () => {
        //Battle Fog Boss
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        globalScene.arena.trySetWeather(WeatherType.HEAVY_FOG);
        //TODO start fog and stuff
        const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];
        setEncounterRewards({
          guaranteedModifierTiers: [ModifierTier.ROGUE, ModifierTier.ROGUE],
          fillRemaining: true,
        });
        await transitionMysteryEncounterIntroVisuals();
        await initBattleWithEnemyConfig(config);
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
      .withPrimaryPokemonRequirement(
        CombinationPokemonRequirement.Some(
          new MoveRequirement(DEFOG_MOVES, true),
          new AbilityRequirement(DEFOG_ABILITIES, true),
        ),
      )
      .withDialogue({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        selected: [
          {
            text: `${namespace}:option.2.selected`,
          },
        ],
      })
      .withPreOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        globalScene.tweens.add({
          targets: encounter.misc.fogOverlay,
          alpha: 0,
          ease: "Sine.easeOut",
          duration: 2000,
        });
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const primary = encounter.options[1].primaryPokemon!;
        if (globalScene.currentBattle.waveIndex >= 140) {
          setEncounterExp([primary.id], encounter.enemyPartyConfigs![0].pokemonConfigs![0].species.baseExp);
          const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

          setEncounterRewards({
            guaranteedModifierTiers: [ModifierTier.ROGUE, ModifierTier.ROGUE],
            fillRemaining: true,
          });
          await transitionMysteryEncounterIntroVisuals();
          await initBattleWithEnemyConfig(config);
        } else {
          setEncounterExp([primary.id], encounter.enemyPartyConfigs![0].pokemonConfigs![0].species.baseExp);
          leaveEncounterWithoutBattle();
        }
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
      .withPrimaryPokemonRequirement(
        CombinationPokemonRequirement.Some(
          new MoveRequirement(LIGHT_MOVES, true),
          new AbilityRequirement(LIGHT_ABILITIES, true),
        ),
      )
      .withDialogue({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      })
      .withPreOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        globalScene.tweens.add({
          targets: encounter.misc.fogOverlay,
          alpha: 0,
          ease: "Sine.easeOut",
          duration: 2000,
        });
      })
      .withOptionPhase(async () => {
        //Navigate through the Fog
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const primary = encounter.options[2].primaryPokemon!;
        globalScene.arena.trySetWeather(WeatherType.HEAVY_FOG);
        if (globalScene.currentBattle.waveIndex >= 140) {
          setEncounterExp([primary.id], encounter.enemyPartyConfigs![0].pokemonConfigs![0].species.baseExp);
          const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

          setEncounterRewards({
            guaranteedModifierTiers: [ModifierTier.ROGUE, ModifierTier.ROGUE],
            fillRemaining: true,
          });
          await transitionMysteryEncounterIntroVisuals();
          await initBattleWithEnemyConfig(config);
        } else {
          setEncounterRewards({
            guaranteedModifierTiers: [ModifierTier.ULTRA],
            fillRemaining: true,
          });
          setEncounterExp([primary.id], encounter.enemyPartyConfigs![0].pokemonConfigs![0].species.baseExp);
          leaveEncounterWithoutBattle();
        }
      })
      .build(),
  )

  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.4.label`,
      buttonTooltip: `${namespace}:option.4.tooltip`,
      selected: [
        {
          text: `${namespace}:option.4.selected`,
        },
      ],
    },
    async () => {
      const encounter = globalScene.currentBattle.mysteryEncounter!;
      globalScene.tweens.add({
        targets: encounter.misc.fogOverlay,
        alpha: 0,
        ease: "Sine.easeOut",
        duration: 2000,
      });
      const pokemon = globalScene.getPlayerPokemon(); //Can we use this?
      globalScene.arena.trySetWeather(WeatherType.FOG, pokemon);

      // Leave encounter with no rewards or exp
      leaveEncounterWithoutBattle(true);
      return true;
    },
  )
  .build();

function chooseBoss() {
  const biome = globalScene.arena.biomeType;
  const wave = globalScene.currentBattle.waveIndex;
  const allBiomePokemon = [
    [
      Species.MACHAMP,
      Nature.JOLLY,
      1,
      false,
      [Moves.DYNAMIC_PUNCH, Moves.STONE_EDGE, Moves.DUAL_CHOP, Moves.FISSURE],
      [],
    ],
    [
      Species.GRIMMSNARL,
      Nature.ADAMANT,
      null,
      false,
      [Moves.STONE_EDGE, Moves.CLOSE_COMBAT, Moves.IRON_TAIL, Moves.PLAY_ROUGH],
      [{ modifier: generateModifierType(modifierTypes.MICLE_BERRY) as PokemonHeldItemModifierType }],
    ],
  ];
  const ForestTallGrassPokemon = [
    [
      Species.LYCANROC,
      Nature.JOLLY,
      2,
      false,
      [Moves.STONE_EDGE, Moves.CLOSE_COMBAT, Moves.IRON_TAIL, Moves.PLAY_ROUGH],
      [],
    ],
    [
      Species.ALOLA_RATICATE,
      Nature.ADAMANT,
      1,
      false,
      [Moves.FALSE_SURRENDER, Moves.SUCKER_PUNCH, Moves.PLAY_ROUGH, Moves.POPULATION_BOMB],
      [{ modifier: generateModifierType(modifierTypes.REVIVER_SEED) as PokemonHeldItemModifierType }],
    ],
  ];
  const SwampLakePokemon = [
    [
      Species.POLIWRATH,
      Nature.NAIVE,
      null,
      true,
      [Moves.DYNAMIC_PUNCH, Moves.HYDRO_PUMP, Moves.DUAL_CHOP, Moves.HYPNOSIS],
      [
        { modifier: generateModifierType(modifierTypes.BERRY, [BerryType.SITRUS]) as PokemonHeldItemModifierType },
        { modifier: generateModifierType(modifierTypes.BASE_STAT_BOOSTER, [Stat.HP]) as PokemonHeldItemModifierType },
      ],
    ],
  ];
  const GraveyardPokemon = [
    [
      Species.GOLURK,
      Nature.ADAMANT,
      2,
      false,
      [Moves.EARTHQUAKE, Moves.POLTERGEIST, Moves.DYNAMIC_PUNCH, Moves.STONE_EDGE],
      [],
    ],
    [
      Species.HONEDGE,
      Nature.CAREFUL,
      0,
      false,
      [Moves.IRON_HEAD, Moves.POLTERGEIST, Moves.SACRED_SWORD, Moves.SHADOW_SNEAK],
      [],
    ],
    [
      Species.ZWEILOUS,
      Nature.BRAVE,
      null,
      true,
      [Moves.DRAGON_RUSH, Moves.CRUNCH, Moves.GUNK_SHOT, Moves.SCREECH],
      [{ modifier: generateModifierType(modifierTypes.QUICK_CLAW) as PokemonHeldItemModifierType, stackCount: 2 }],
    ],
  ];
  const wave110_140Pokemon = [
    [
      Species.SCOLIPEDE,
      Nature.ADAMANT,
      2,
      false,
      [Moves.MEGAHORN, Moves.NOXIOUS_TORQUE, Moves.ROLLOUT, Moves.BANEFUL_BUNKER],
      [{ modifier: generateModifierType(modifierTypes.MICLE_BERRY) as PokemonHeldItemModifierType }],
    ],
    [
      Species.MIENSHAO,
      Nature.JOLLY,
      null,
      true,
      [Moves.HIGH_JUMP_KICK, Moves.STONE_EDGE, Moves.BLAZE_KICK, Moves.GUNK_SHOT],
      [],
    ],
    [
      Species.DRACOZOLT,
      Nature.JOLLY,
      null,
      true,
      [Moves.BOLT_BEAK, Moves.DRAGON_RUSH, Moves.EARTHQUAKE, Moves.STONE_EDGE],
      [],
    ],
  ];
  const wave140PlusPokemon = [
    [
      Species.PIDGEOT,
      Nature.HASTY,
      0,
      false,
      [Moves.HURRICANE, Moves.HEAT_WAVE, Moves.FOCUS_BLAST, Moves.WILDBOLT_STORM],
      [],
    ],
  ];

  let pool = allBiomePokemon as [Species, Nature, Abilities, boolean, Moves[], HeldModifierConfig[]][];

  // Include biome-specific Pokémon if within wave 50-80
  if (wave >= 50) {
    if (biome === Biome.FOREST || biome === Biome.TALL_GRASS) {
      pool = pool.concat(
        ForestTallGrassPokemon as [Species, Nature, Abilities, boolean, Moves[], HeldModifierConfig[]][],
      );
    }
    if (biome === Biome.SWAMP || biome === Biome.LAKE) {
      pool = pool.concat(SwampLakePokemon as [Species, Nature, Abilities, boolean, Moves[], HeldModifierConfig[]][]);
    }
    if (biome === Biome.GRAVEYARD) {
      pool = pool.concat(GraveyardPokemon as [Species, Nature, Abilities, boolean, Moves[], HeldModifierConfig[]][]);
    }
  }

  // Waves 110-140 content
  if (wave >= 110) {
    pool = pool.concat(wave110_140Pokemon as [Species, Nature, Abilities, boolean, Moves[], HeldModifierConfig[]][]);
  }

  // Wave 140+
  if (wave >= 140) {
    pool = pool.concat(wave140PlusPokemon as [Species, Nature, Abilities, boolean, Moves[], HeldModifierConfig[]][]);
  }
  // Randomly choose one
  return pool[randSeedInt(pool.length, 0)];
}
