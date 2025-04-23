import { BattlerIndex } from "#app/battle";
import { globalScene } from "#app/global-scene";
import { EncounterBattleAnim } from "#app/data/battle-anims";
import type MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { MoveRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { DANCING_MOVES } from "#app/data/mystery-encounters/requirements/requirement-groups";
import { getEncounterText, queueEncounterMessage } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import type { EnemyPartyConfig } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import {
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  selectPokemonForOption,
  setEncounterRewards,
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import {
  catchPokemon,
  getEncounterPokemonLevelForWave,
  STANDARD_ENCOUNTER_BOOSTED_LEVEL_MODIFIER,
} from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { TrainerSlot } from "#enums/trainer-slot";
import type { PlayerPokemon } from "#app/field/pokemon";
import type Pokemon from "#app/field/pokemon";
import { EnemyPokemon, PokemonMove } from "#app/field/pokemon";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { modifierTypes } from "#app/modifier/modifier-type";
import { LearnMovePhase } from "#app/phases/learn-move-phase";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import PokemonData from "#app/system/pokemon-data";
import type { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Biome } from "#enums/biome";
import { EncounterAnim } from "#enums/encounter-anims";
import { Moves } from "#enums/moves";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PokeballType } from "#enums/pokeball";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import i18next from "i18next";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounters/dancingLessons";

// Fire form
const BAILE_STYLE_BIOMES = [
  Biome.VOLCANO,
  Biome.BEACH,
  Biome.ISLAND,
  Biome.WASTELAND,
  Biome.MOUNTAIN,
  Biome.BADLANDS,
  Biome.DESERT,
];

// Electric form
const POM_POM_STYLE_BIOMES = [
  Biome.CONSTRUCTION_SITE,
  Biome.POWER_PLANT,
  Biome.FACTORY,
  Biome.LABORATORY,
  Biome.SLUM,
  Biome.METROPOLIS,
  Biome.DOJO,
];

// Psychic form
const PAU_STYLE_BIOMES = [
  Biome.JUNGLE,
  Biome.FAIRY_CAVE,
  Biome.MEADOW,
  Biome.PLAINS,
  Biome.GRASS,
  Biome.TALL_GRASS,
  Biome.FOREST,
];

// Ghost form
const SENSU_STYLE_BIOMES = [
  Biome.RUINS,
  Biome.SWAMP,
  Biome.CAVE,
  Biome.ABYSS,
  Biome.GRAVEYARD,
  Biome.LAKE,
  Biome.TEMPLE,
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

    const species = getPokemonSpecies(Species.ORICORIO);
    const level = getEncounterPokemonLevelForWave(STANDARD_ENCOUNTER_BOOSTED_LEVEL_MODIFIER);
    const enemyPokemon = new EnemyPokemon(species, level, TrainerSlot.NONE, false);
    if (!enemyPokemon.moveset.some(m => m && m.getMove().id === Moves.REVELATION_DANCE)) {
      if (enemyPokemon.moveset.length < 4) {
        enemyPokemon.moveset.push(new PokemonMove(Moves.REVELATION_DANCE));
      } else {
        enemyPokemon.moveset[0] = new PokemonMove(Moves.REVELATION_DANCE);
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
          species: species,
          dataSource: oricorioData,
          isBoss: true,
          // Gets +1 to all stats except SPD on battle start
          tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
          mysteryEncounterBattleEffects: (pokemon: Pokemon) => {
            queueEncounterMessage(`${namespace}:option.1.boss_enraged`);
            globalScene.unshiftPhase(
              new StatStageChangePhase(
                pokemon.getBattlerIndex(),
                true,
                [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF],
                1,
              ),
            );
          },
        },
      ],
    };
    encounter.enemyPartyConfigs = [config];
    encounter.misc = {
      oricorioData,
    };

    encounter.setDialogueToken("oricorioName", getPokemonSpecies(Species.ORICORIO).getName());

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
          move: new PokemonMove(Moves.REVELATION_DANCE),
          ignorePp: true,
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
          globalScene.unshiftPhase(
            new LearnMovePhase(globalScene.getPlayerParty().indexOf(pokemon), Moves.REVELATION_DANCE),
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
        disabledButtonTooltip: `${namespace}:option.3.disabled_tooltip`,
        secondOptionPrompt: `${namespace}:option.3.select_prompt`,
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
            return getEncounterText(`${namespace}:invalid_selection`) ?? null;
          }

          return null;
        };

        return selectPokemonForOption(onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async () => {
        // Show the Oricorio a dance, and recruit it
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const oricorio = encounter.misc.oricorioData.toPokemon();
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
