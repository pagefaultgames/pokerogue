import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { EncounterBattleAnim } from "#data/battle-anims";
import { modifierTypes } from "#data/data-lists";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BiomeId } from "#enums/biome-id";
import { EncounterAnim } from "#enums/encounter-anims";
import { MoveId } from "#enums/move-id";
import { MoveUseMode } from "#enums/move-use-mode";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { TrainerSlot } from "#enums/trainer-slot";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import { EnemyPokemon } from "#field/pokemon";
import { PokemonMove } from "#moves/pokemon-move";
import { getEncounterText, queueEncounterMessage } from "#mystery-encounters/encounter-dialogue-utils";
import type { EnemyPartyConfig } from "#mystery-encounters/encounter-phase-utils";
import {
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  selectPokemonForOption,
  setEncounterRewards,
} from "#mystery-encounters/encounter-phase-utils";
import {
  catchPokemon,
  getEncounterPokemonLevelForWave,
  STANDARD_ENCOUNTER_BOOSTED_LEVEL_MODIFIER,
} from "#mystery-encounters/encounter-pokemon-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import { MoveRequirement } from "#mystery-encounters/mystery-encounter-requirements";
import { DANCING_MOVES } from "#mystery-encounters/requirement-groups";
import { PokemonData } from "#system/pokemon-data";
import type { OptionSelectItem } from "#ui/handlers/abstract-option-select-ui-handler";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounters/dancingLessons";

// Fire form
const BAILE_STYLE_BIOMES = [
  BiomeId.VOLCANO,
  BiomeId.BEACH,
  BiomeId.ISLAND,
  BiomeId.WASTELAND,
  BiomeId.MOUNTAIN,
  BiomeId.BADLANDS,
  BiomeId.DESERT,
];

// Electric form
const POM_POM_STYLE_BIOMES = [
  BiomeId.CONSTRUCTION_SITE,
  BiomeId.POWER_PLANT,
  BiomeId.FACTORY,
  BiomeId.LABORATORY,
  BiomeId.SLUM,
  BiomeId.METROPOLIS,
  BiomeId.DOJO,
];

// Psychic form
const PAU_STYLE_BIOMES = [
  BiomeId.JUNGLE,
  BiomeId.FAIRY_CAVE,
  BiomeId.MEADOW,
  BiomeId.PLAINS,
  BiomeId.GRASS,
  BiomeId.TALL_GRASS,
  BiomeId.FOREST,
];

// Ghost form
const SENSU_STYLE_BIOMES = [
  BiomeId.RUINS,
  BiomeId.SWAMP,
  BiomeId.CAVE,
  BiomeId.ABYSS,
  BiomeId.GRAVEYARD,
  BiomeId.LAKE,
  BiomeId.TEMPLE,
];

/**
 * Dancing Lessons encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3823 | GitHub Issue #3823}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const DancingLessonsEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.DANCING_LESSONS,
)
  .withEncounterTier(MysteryEncounterTier.GREAT)
  .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
  .withIntroSpriteConfigs([]) // Uses a real Pokemon sprite instead of ME Intro Visuals
  .withAnimations(EncounterAnim.DANCE)
  .withHideWildIntroMessage(true)
  .withAutoHideIntroVisuals(false)
  .withCatchAllowed(true)
  .withFleeAllowed(false)
  .withOnVisualsStart(() => {
    const oricorio = globalScene.getEnemyPokemon()!;
    const danceAnim = new EncounterBattleAnim(EncounterAnim.DANCE, oricorio, globalScene.getPlayerPokemon()!);
    danceAnim.play(false, () => {
      if (oricorio.shiny) {
        oricorio.sparkle();
      }
    });
    return true;
  })
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
  ])
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;

    const species = getPokemonSpecies(SpeciesId.ORICORIO);
    const level = getEncounterPokemonLevelForWave(STANDARD_ENCOUNTER_BOOSTED_LEVEL_MODIFIER);
    const enemyPokemon = new EnemyPokemon(species, level, TrainerSlot.NONE, false);
    if (!enemyPokemon.moveset.some(m => m && m.getMove().id === MoveId.REVELATION_DANCE)) {
      if (enemyPokemon.moveset.length < 4) {
        enemyPokemon.moveset.push(new PokemonMove(MoveId.REVELATION_DANCE));
      } else {
        enemyPokemon.moveset[0] = new PokemonMove(MoveId.REVELATION_DANCE);
      }
    }

    // Set the form index based on the biome
    // Defaults to Baile style if somehow nothing matches
    const currentBiome = globalScene.arena.biomeType;
    if (BAILE_STYLE_BIOMES.includes(currentBiome)) {
      enemyPokemon.formIndex = 0;
    } else if (POM_POM_STYLE_BIOMES.includes(currentBiome)) {
      enemyPokemon.formIndex = 1;
    } else if (PAU_STYLE_BIOMES.includes(currentBiome)) {
      enemyPokemon.formIndex = 2;
    } else if (SENSU_STYLE_BIOMES.includes(currentBiome)) {
      enemyPokemon.formIndex = 3;
    } else {
      enemyPokemon.formIndex = 0;
    }

    const oricorioData = new PokemonData(enemyPokemon);
    const oricorio = globalScene.addEnemyPokemon(species, level, TrainerSlot.NONE, false, false, oricorioData);

    // Adds a real Pokemon sprite to the field (required for the animation)
    for (const enemyPokemon of globalScene.getEnemyParty()) {
      enemyPokemon.leaveField(true, true, true);
    }
    globalScene.currentBattle.enemyParty = [oricorio];
    globalScene.field.add(oricorio);
    // Spawns on offscreen field
    oricorio.x -= 300;
    encounter.loadAssets.push(oricorio.loadAssets());

    const config: EnemyPartyConfig = {
      pokemonConfigs: [
        {
          species,
          dataSource: oricorioData,
          isBoss: true,
          // Gets +1 to all stats except SPD on battle start
          tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
          mysteryEncounterBattleEffects: (pokemon: Pokemon) => {
            queueEncounterMessage(`${namespace}:option.1.bossEnraged`);
            globalScene.phaseManager.unshiftNew(
              "StatStageChangePhase",
              pokemon.getBattlerIndex(),
              true,
              [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF],
              1,
            );
          },
        },
      ],
    };
    encounter.enemyPartyConfigs = [config];
    encounter.misc = {
      oricorioData,
    };

    encounter.setDialogueToken("oricorioName", getPokemonSpecies(SpeciesId.ORICORIO).getName());

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
      .withOptionPhase(async () => {
        // Pick battle
        const encounter = globalScene.currentBattle.mysteryEncounter!;

        encounter.startOfBattleEffects.push({
          sourceBattlerIndex: BattlerIndex.ENEMY,
          targets: [BattlerIndex.PLAYER],
          move: new PokemonMove(MoveId.REVELATION_DANCE),
          useMode: MoveUseMode.IGNORE_PP,
        });

        await hideOricorioPokemon();
        setEncounterRewards({
          guaranteedModifierTypeFuncs: [modifierTypes.BATON],
          fillRemaining: true,
        });
        await initBattleWithEnemyConfig(encounter.enemyPartyConfigs[0]);
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
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
        // Learn its Dance
        const encounter = globalScene.currentBattle.mysteryEncounter!;

        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          encounter.setDialogueToken("selectedPokemon", pokemon.getNameToRender());
          globalScene.phaseManager.unshiftNew(
            "LearnMovePhase",
            globalScene.getPlayerParty().indexOf(pokemon),
            MoveId.REVELATION_DANCE,
          );

          // Play animation again to "learn" the dance
          const danceAnim = new EncounterBattleAnim(
            EncounterAnim.DANCE,
            globalScene.getEnemyPokemon()!,
            globalScene.getPlayerPokemon(),
          );
          danceAnim.play();
        };

        return selectPokemonForOption(onPokemonSelected);
      })
      .withOptionPhase(async () => {
        // Learn its Dance
        await hideOricorioPokemon();
        leaveEncounterWithoutBattle(true);
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
      .withPrimaryPokemonRequirement(new MoveRequirement(DANCING_MOVES, true)) // Will set option3PrimaryName and option3PrimaryMove dialogue tokens automatically
      .withDialogue({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        disabledButtonTooltip: `${namespace}:option.3.disabledTooltip`,
        secondOptionPrompt: `${namespace}:option.3.selectPrompt`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      })
      .withPreOptionPhase(async () => {
        // Open menu for selecting pokemon with a Dancing move
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          // Return the options for nature selection
          return pokemon.moveset
            .filter(move => move && DANCING_MOVES.includes(move.getMove().id))
            .map((move: PokemonMove) => {
              const option: OptionSelectItem = {
                label: move.getName(),
                handler: () => {
                  // Pokemon and second option selected
                  encounter.setDialogueToken("selectedPokemon", pokemon.getNameToRender());
                  encounter.setDialogueToken("selectedMove", move.getName());
                  encounter.misc.selectedMove = move;

                  return true;
                },
              };
              return option;
            });
        };

        // Only challenge legal/unfainted Pokemon that have a Dancing move can be selected
        const selectableFilter = (pokemon: Pokemon) => {
          // If pokemon meets primary pokemon reqs, it can be selected
          if (!pokemon.isAllowedInBattle()) {
            return (
              i18next.t("partyUiHandler:cantBeUsed", {
                pokemonName: pokemon.getNameToRender(),
              }) ?? null
            );
          }
          const meetsReqs = encounter.options[2].pokemonMeetsPrimaryRequirements(pokemon);
          if (!meetsReqs) {
            return getEncounterText(`${namespace}:invalidSelection`) ?? null;
          }

          return null;
        };

        return selectPokemonForOption(onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async () => {
        // Show the Oricorio a dance, and recruit it
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const oricorio = encounter.misc.oricorioData.toPokemon() as EnemyPokemon;
        oricorio.passive = true;

        // Ensure the Oricorio's moveset gains the Dance move the player used
        const move = encounter.misc.selectedMove?.getMove().id;
        if (!oricorio.moveset.some(m => m.getMove().id === move)) {
          if (oricorio.moveset.length < 4) {
            oricorio.moveset.push(new PokemonMove(move));
          } else {
            oricorio.moveset[3] = new PokemonMove(move);
          }
        }

        await hideOricorioPokemon();
        await catchPokemon(oricorio, null, PokeballType.POKEBALL, false);
        leaveEncounterWithoutBattle(true);
      })
      .build(),
  )
  .build();

function hideOricorioPokemon() {
  return new Promise<void>(resolve => {
    const oricorioSprite = globalScene.getEnemyParty()[0];
    globalScene.tweens.add({
      targets: oricorioSprite,
      x: "+=16",
      y: "-=16",
      alpha: 0,
      ease: "Sine.easeInOut",
      duration: 750,
      onComplete: () => {
        globalScene.field.remove(oricorioSprite, true);
        resolve();
      },
    });
  });
}
