import type { EnemyPartyConfig } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import {
  generateModifierType,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  loadCustomMovesForEncounter,
  selectPokemonForOption,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { trainerConfigs } from "#app/data/trainers/trainer-config";
import { TrainerPartyCompoundTemplate } from "#app/data/trainers/TrainerPartyTemplate";
import { TrainerPartyTemplate } from "#app/data/trainers/TrainerPartyTemplate";
import { ModifierTier } from "#enums/modifier-tier";
import type { PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { ModifierPoolType } from "#enums/modifier-pool-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PartyMemberStrength } from "#enums/party-member-strength";
import { globalScene } from "#app/global-scene";
import type MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { SpeciesId } from "#enums/species-id";
import { TrainerType } from "#enums/trainer-type";
import { getPokemonSpecies } from "#app/utils/pokemon-utils";
import { AbilityId } from "#enums/ability-id";
import {
  applyAbilityOverrideToPokemon,
  applyModifierTypeToPlayerPokemon,
} from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { PokemonType } from "#enums/pokemon-type";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { randSeedInt, randSeedShuffle } from "#app/utils/common";
import { showEncounterDialogue, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { UiMode } from "#enums/ui-mode";
import i18next from "i18next";
import type { OptionSelectConfig } from "#app/ui/abstact-option-select-ui-handler";
import type { PlayerPokemon } from "#app/field/pokemon";
import { PokemonMove } from "#app/data/moves/pokemon-move";
import { BerryModifier } from "#app/modifier/modifier";
import { BerryType } from "#enums/berry-type";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { EncounterBattleAnim } from "#app/data/battle-anims";
import { MoveCategory } from "#enums/MoveCategory";
import { CustomPokemonData } from "#app/data/custom-pokemon-data";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { EncounterAnim } from "#enums/encounter-anims";
import { Challenges } from "#enums/challenges";
import { MoveUseMode } from "#enums/move-use-mode";
import { allAbilities, modifierTypes } from "#app/data/data-lists";

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
      text: `${namespace}:intro_dialogue`,
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
    // @ts-ignore
    clownConfig.partyTemplateFunc = null; // Overrides party template func if it exists

    // Generate random ability for Blacephalon from pool
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
            ability: ability,
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
          await showEncounterText(`${namespace}:option.1.ability_gained`);
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
            text: `${namespace}:option.2.selected_2`,
          },
          {
            text: `${namespace}:option.2.selected_3`,
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
            text: `${namespace}:option.3.selected_2`,
          },
          {
            text: `${namespace}:option.3.selected_3`,
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
    await showEncounterDialogue(`${namespace}:option.1.apply_ability_dialogue`, `${namespace}:speaker`);
    await showEncounterText(`${namespace}:option.1.apply_ability_message`);

    globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
      displayYesNoOptions(resolve);
    });
  });
}

function displayYesNoOptions(resolve) {
  showEncounterText(`${namespace}:option.1.ability_prompt`, null, 500, false);
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
