import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { EncounterBattleAnim } from "#data/battle-anims";
import { allAbilities, modifierTypes } from "#data/data-lists";
import { CustomPokemonData } from "#data/pokemon-data";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BerryType } from "#enums/berry-type";
import { Challenges } from "#enums/challenges";
import { EncounterAnim } from "#enums/encounter-anims";
import { ModifierPoolType } from "#enums/modifier-pool-type";
import { ModifierTier } from "#enums/modifier-tier";
import { MoveCategory } from "#enums/move-category";
import { MoveId } from "#enums/move-id";
import { MoveUseMode } from "#enums/move-use-mode";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PartyMemberStrength } from "#enums/party-member-strength";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TrainerType } from "#enums/trainer-type";
import { UiMode } from "#enums/ui-mode";
import type { PlayerPokemon } from "#field/pokemon";
import { BerryModifier } from "#modifiers/modifier";
import type { PokemonHeldItemModifierType } from "#modifiers/modifier-type";
import { PokemonMove } from "#moves/pokemon-move";
import { showEncounterDialogue, showEncounterText } from "#mystery-encounters/encounter-dialogue-utils";
import type { EnemyPartyConfig } from "#mystery-encounters/encounter-phase-utils";
import {
  generateModifierType,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  loadCustomMovesForEncounter,
  selectPokemonForOption,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
} from "#mystery-encounters/encounter-phase-utils";
import {
  applyAbilityOverrideToPokemon,
  applyModifierTypeToPlayerPokemon,
} from "#mystery-encounters/encounter-pokemon-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import { trainerConfigs } from "#trainers/trainer-config";
import { TrainerPartyCompoundTemplate, TrainerPartyTemplate } from "#trainers/trainer-party-template";
import type { OptionSelectConfig } from "#ui/handlers/abstract-option-select-ui-handler";
import { randSeedInt, randSeedShuffle } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounters/clowningAround";

const RANDOM_ABILITY_POOL = [
  AbilityId.STURDY,
  AbilityId.PICKUP,
  AbilityId.INTIMIDATE,
  AbilityId.GUTS,
  AbilityId.DROUGHT,
  AbilityId.DRIZZLE,
  AbilityId.SNOW_WARNING,
  AbilityId.SAND_STREAM,
  AbilityId.ELECTRIC_SURGE,
  AbilityId.PSYCHIC_SURGE,
  AbilityId.GRASSY_SURGE,
  AbilityId.MISTY_SURGE,
  AbilityId.MAGICIAN,
  AbilityId.SHEER_FORCE,
  AbilityId.PRANKSTER,
];

/**
 * Clowning Around encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3807 | GitHub Issue #3807}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const ClowningAroundEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.CLOWNING_AROUND,
)
  .withEncounterTier(MysteryEncounterTier.ULTRA)
  .withDisallowedChallenges(Challenges.SINGLE_TYPE)
  .withSceneWaveRangeRequirement(80, CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES[1])
  .withAnimations(EncounterAnim.SMOKESCREEN)
  .withAutoHideIntroVisuals(false)
  .withIntroSpriteConfigs([
    {
      spriteKey: SpeciesId.MR_MIME.toString(),
      fileRoot: "pokemon",
      hasShadow: true,
      repeat: true,
      x: -25,
      tint: 0.3,
      y: -3,
      yShadow: -3,
    },
    {
      spriteKey: SpeciesId.BLACEPHALON.toString(),
      fileRoot: "pokemon/exp",
      hasShadow: true,
      repeat: true,
      x: 25,
      tint: 0.3,
      y: -3,
      yShadow: -3,
    },
    {
      spriteKey: "harlequin",
      fileRoot: "trainer",
      hasShadow: true,
      x: 0,
      y: 2,
      yShadow: 2,
    },
  ])
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
    {
      text: `${namespace}:introDialogue`,
      speaker: `${namespace}:speaker`,
    },
  ])
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;

    const clownTrainerType = TrainerType.HARLEQUIN;
    const clownConfig = trainerConfigs[clownTrainerType].clone();
    const clownPartyTemplate = new TrainerPartyCompoundTemplate(
      new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
      new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER),
    );
    clownConfig.setPartyTemplates(clownPartyTemplate);
    clownConfig.setDoubleOnly();
    // @ts-expect-error
    clownConfig.partyTemplateFunc = null; // Overrides party template func if it exists

    // Generate random ability for Blacephalon from pool
    // TODO: should this use `randSeedItem`?
    const ability = RANDOM_ABILITY_POOL[randSeedInt(RANDOM_ABILITY_POOL.length)];
    encounter.setDialogueToken("ability", allAbilities[ability].name);
    encounter.misc = { ability };

    // Decide the random types for Blacephalon. They should not be the same.
    const firstType: number = randSeedInt(18);
    let secondType: number = randSeedInt(17);
    if (secondType >= firstType) {
      secondType++;
    }

    encounter.enemyPartyConfigs.push({
      trainerConfig: clownConfig,
      pokemonConfigs: [
        // Overrides first 2 pokemon to be Mr. Mime and Blacephalon
        {
          species: getPokemonSpecies(SpeciesId.MR_MIME),
          isBoss: true,
          moveSet: [MoveId.TEETER_DANCE, MoveId.ALLY_SWITCH, MoveId.DAZZLING_GLEAM, MoveId.PSYCHIC],
        },
        {
          // Blacephalon has the random ability from pool, and 2 entirely random types to fit with the theme of the encounter
          species: getPokemonSpecies(SpeciesId.BLACEPHALON),
          customPokemonData: new CustomPokemonData({
            ability,
            types: [firstType, secondType],
          }),
          isBoss: true,
          moveSet: [MoveId.TRICK, MoveId.HYPNOSIS, MoveId.SHADOW_BALL, MoveId.MIND_BLOWN],
        },
      ],
      doubleBattle: true,
    });

    // Load animations/sfx for start of fight moves
    loadCustomMovesForEncounter([MoveId.ROLE_PLAY, MoveId.TAUNT]);

    encounter.setDialogueToken("blacephalonName", getPokemonSpecies(SpeciesId.BLACEPHALON).getName());

    return true;
  })
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.1.selected`,
            speaker: `${namespace}:speaker`,
          },
        ],
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        // Spawn battle
        const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

        setEncounterRewards({ fillRemaining: true });

        // TODO: when Magic Room and Wonder Room are implemented, add those to start of battle
        encounter.startOfBattleEffects.push(
          {
            // Mr. Mime copies the Blacephalon's random ability
            sourceBattlerIndex: BattlerIndex.ENEMY,
            targets: [BattlerIndex.ENEMY_2],
            move: new PokemonMove(MoveId.ROLE_PLAY),
            useMode: MoveUseMode.IGNORE_PP,
          },
          {
            sourceBattlerIndex: BattlerIndex.ENEMY_2,
            targets: [BattlerIndex.PLAYER],
            move: new PokemonMove(MoveId.TAUNT),
            useMode: MoveUseMode.IGNORE_PP,
          },
          {
            sourceBattlerIndex: BattlerIndex.ENEMY_2,
            targets: [BattlerIndex.PLAYER_2],
            move: new PokemonMove(MoveId.TAUNT),
            useMode: MoveUseMode.IGNORE_PP,
          },
        );

        await transitionMysteryEncounterIntroVisuals();
        await initBattleWithEnemyConfig(config);
      })
      .withPostOptionPhase(async (): Promise<boolean> => {
        // After the battle, offer the player the opportunity to permanently swap ability
        const abilityWasSwapped = await handleSwapAbility();
        if (abilityWasSwapped) {
          await showEncounterText(`${namespace}:option.1.abilityGained`);
        }

        // Play animations once ability swap is complete
        // Trainer sprite that is shown at end of battle is not the same as mystery encounter intro visuals
        globalScene.tweens.add({
          targets: globalScene.currentBattle.trainer,
          x: "+=16",
          y: "-=16",
          alpha: 0,
          ease: "Sine.easeInOut",
          duration: 250,
        });
        const background = new EncounterBattleAnim(
          EncounterAnim.SMOKESCREEN,
          globalScene.getPlayerPokemon()!,
          globalScene.getPlayerPokemon(),
        );
        background.playWithoutTargets(230, 40, 2);
        return true;
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
            speaker: `${namespace}:speaker`,
          },
          {
            text: `${namespace}:option.2.selected2`,
          },
          {
            text: `${namespace}:option.2.selected3`,
            speaker: `${namespace}:speaker`,
          },
        ],
      })
      .withPreOptionPhase(async () => {
        // Swap player's items on pokemon with the most items
        // Item comparisons look at whichever Pokemon has the greatest number of TRANSFERABLE, non-berry items
        // So Vitamins, form change items, etc. are not included
        const encounter = globalScene.currentBattle.mysteryEncounter!;

        const party = globalScene.getPlayerParty();
        let mostHeldItemsPokemon = party[0];
        let count = mostHeldItemsPokemon
          .getHeldItems()
          .filter(m => m.isTransferable && !(m instanceof BerryModifier))
          .reduce((v, m) => v + m.stackCount, 0);

        for (const pokemon of party) {
          const nextCount = pokemon
            .getHeldItems()
            .filter(m => m.isTransferable && !(m instanceof BerryModifier))
            .reduce((v, m) => v + m.stackCount, 0);
          if (nextCount > count) {
            mostHeldItemsPokemon = pokemon;
            count = nextCount;
          }
        }

        encounter.setDialogueToken("switchPokemon", mostHeldItemsPokemon.getNameToRender());

        const items = mostHeldItemsPokemon.getHeldItems();

        // Shuffles Berries (if they have any)
        let numBerries = 0;
        for (const m of items.filter(m => m instanceof BerryModifier)) {
          numBerries += m.stackCount;
          globalScene.removeModifier(m);
        }

        generateItemsOfTier(mostHeldItemsPokemon, numBerries, "Berries");

        // Shuffle Transferable held items in the same tier (only shuffles Ultra and Rogue atm)
        // For the purpose of this ME, Soothe Bells and Lucky Eggs are counted as Ultra tier
        // And Golden Eggs as Rogue tier
        let numUltra = 0;
        let numRogue = 0;

        for (const m of items.filter(m => m.isTransferable && !(m instanceof BerryModifier))) {
          const type = m.type.withTierFromPool(ModifierPoolType.PLAYER, party);
          const tier = type.tier ?? ModifierTier.ULTRA;
          if (type.id === "GOLDEN_EGG" || tier === ModifierTier.ROGUE) {
            numRogue += m.stackCount;
            globalScene.removeModifier(m);
          } else if (type.id === "LUCKY_EGG" || type.id === "SOOTHE_BELL" || tier === ModifierTier.ULTRA) {
            numUltra += m.stackCount;
            globalScene.removeModifier(m);
          }
        }

        generateItemsOfTier(mostHeldItemsPokemon, numUltra, ModifierTier.ULTRA);
        generateItemsOfTier(mostHeldItemsPokemon, numRogue, ModifierTier.ROGUE);
      })
      .withOptionPhase(async () => {
        leaveEncounterWithoutBattle(true);
      })
      .withPostOptionPhase(async () => {
        // Play animations
        const background = new EncounterBattleAnim(
          EncounterAnim.SMOKESCREEN,
          globalScene.getPlayerPokemon()!,
          globalScene.getPlayerPokemon(),
        );
        background.playWithoutTargets(230, 40, 2);
        await transitionMysteryEncounterIntroVisuals(true, true, 200);
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
            speaker: `${namespace}:speaker`,
          },
          {
            text: `${namespace}:option.3.selected2`,
          },
          {
            text: `${namespace}:option.3.selected3`,
            speaker: `${namespace}:speaker`,
          },
        ],
      })
      .withPreOptionPhase(async () => {
        // Randomize the second type of all player's pokemon
        // If the pokemon does not normally have a second type, it will gain 1
        for (const pokemon of globalScene.getPlayerParty()) {
          const originalTypes = pokemon.getTypes(false, false, true);

          // If the Pokemon has non-status moves that don't match the Pokemon's type, prioritizes those as the new type
          // Makes the "randomness" of the shuffle slightly less punishing
          let priorityTypes = pokemon.moveset
            .filter(
              move =>
                move && !originalTypes.includes(move.getMove().type) && move.getMove().category !== MoveCategory.STATUS,
            )
            .map(move => move!.getMove().type);
          if (priorityTypes?.length > 0) {
            priorityTypes = [...new Set(priorityTypes)].sort();
            priorityTypes = randSeedShuffle(priorityTypes);
          }

          const newTypes = [PokemonType.UNKNOWN];
          let secondType: PokemonType | null = null;
          while (secondType === null || secondType === newTypes[0] || originalTypes.includes(secondType)) {
            if (priorityTypes.length > 0) {
              secondType = priorityTypes.pop() ?? null;
            } else {
              secondType = randSeedInt(18) as PokemonType;
            }
          }
          newTypes.push(secondType);

          // Apply the type changes (to both base and fusion, if pokemon is fused)
          pokemon.customPokemonData.types = newTypes;
          if (pokemon.isFusion()) {
            if (!pokemon.fusionCustomPokemonData) {
              pokemon.fusionCustomPokemonData = new CustomPokemonData();
            }
            pokemon.fusionCustomPokemonData.types = newTypes;
          }
        }
      })
      .withOptionPhase(async () => {
        leaveEncounterWithoutBattle(true);
      })
      .withPostOptionPhase(async () => {
        // Play animations
        const background = new EncounterBattleAnim(
          EncounterAnim.SMOKESCREEN,
          globalScene.getPlayerPokemon()!,
          globalScene.getPlayerPokemon(),
        );
        background.playWithoutTargets(230, 40, 2);
        await transitionMysteryEncounterIntroVisuals(true, true, 200);
      })
      .build(),
  )
  .withOutroDialogue([
    {
      text: `${namespace}:outro`,
    },
  ])
  .build();

async function handleSwapAbility() {
  // biome-ignore lint/suspicious/noAsyncPromiseExecutor: TODO: Consider refactoring to avoid async promise executor
  return new Promise<boolean>(async resolve => {
    await showEncounterDialogue(`${namespace}:option.1.applyAbilityDialogue`, `${namespace}:speaker`);
    await showEncounterText(`${namespace}:option.1.applyAbilityMessage`);

    globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
      displayYesNoOptions(resolve);
    });
  });
}

function displayYesNoOptions(resolve) {
  showEncounterText(`${namespace}:option.1.abilityPrompt`, null, 500, false);
  const fullOptions = [
    {
      label: i18next.t("menu:yes"),
      handler: () => {
        onYesAbilitySwap(resolve);
        return true;
      },
    },
    {
      label: i18next.t("menu:no"),
      handler: () => {
        resolve(false);
        return true;
      },
    },
  ];

  const config: OptionSelectConfig = {
    options: fullOptions,
    maxOptions: 7,
    yOffset: 0,
  };
  globalScene.ui.setModeWithoutClear(UiMode.OPTION_SELECT, config, null, true);
}

function onYesAbilitySwap(resolve) {
  const onPokemonSelected = (pokemon: PlayerPokemon) => {
    // Do ability swap
    const encounter = globalScene.currentBattle.mysteryEncounter!;

    applyAbilityOverrideToPokemon(pokemon, encounter.misc.ability);
    encounter.setDialogueToken("chosenPokemon", pokemon.getNameToRender());
    globalScene.ui.setMode(UiMode.MESSAGE).then(() => resolve(true));
  };

  const onPokemonNotSelected = () => {
    globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
      displayYesNoOptions(resolve);
    });
  };

  selectPokemonForOption(onPokemonSelected, onPokemonNotSelected);
}

function generateItemsOfTier(pokemon: PlayerPokemon, numItems: number, tier: ModifierTier | "Berries") {
  // These pools have to be defined at runtime so that modifierTypes exist
  // Pools have instances of the modifier type equal to the max stacks that modifier can be applied to any one pokemon
  // This is to prevent "over-generating" a random item of a certain type during item swaps
  const ultraPool = [
    [modifierTypes.REVIVER_SEED, 1],
    [modifierTypes.GOLDEN_PUNCH, 5],
    [modifierTypes.ATTACK_TYPE_BOOSTER, 99],
    [modifierTypes.QUICK_CLAW, 3],
    [modifierTypes.WIDE_LENS, 3],
  ];

  const roguePool = [
    [modifierTypes.LEFTOVERS, 4],
    [modifierTypes.SHELL_BELL, 4],
    [modifierTypes.SOUL_DEW, 10],
    [modifierTypes.SCOPE_LENS, 1],
    [modifierTypes.BATON, 1],
    [modifierTypes.FOCUS_BAND, 5],
    [modifierTypes.KINGS_ROCK, 3],
    [modifierTypes.GRIP_CLAW, 5],
  ];

  const berryPool = [
    [BerryType.APICOT, 3],
    [BerryType.ENIGMA, 2],
    [BerryType.GANLON, 3],
    [BerryType.LANSAT, 3],
    [BerryType.LEPPA, 2],
    [BerryType.LIECHI, 3],
    [BerryType.LUM, 2],
    [BerryType.PETAYA, 3],
    [BerryType.SALAC, 2],
    [BerryType.SITRUS, 2],
    [BerryType.STARF, 3],
  ];

  let pool: any[];
  if (tier === "Berries") {
    pool = berryPool;
  } else {
    pool = tier === ModifierTier.ULTRA ? ultraPool : roguePool;
  }

  for (let i = 0; i < numItems; i++) {
    if (pool.length === 0) {
      // Stop generating new items if somehow runs out of items to spawn
      return;
    }
    const randIndex = randSeedInt(pool.length);
    const newItemType = pool[randIndex];
    let newMod: PokemonHeldItemModifierType;
    if (tier === "Berries") {
      newMod = generateModifierType(modifierTypes.BERRY, [newItemType[0]]) as PokemonHeldItemModifierType;
    } else {
      newMod = generateModifierType(newItemType[0]) as PokemonHeldItemModifierType;
    }
    applyModifierTypeToPlayerPokemon(pokemon, newMod);
    // Decrement max stacks and remove from pool if at max
    newItemType[1]--;
    if (newItemType[1] <= 0) {
      pool.splice(randIndex, 1);
    }
  }
}
