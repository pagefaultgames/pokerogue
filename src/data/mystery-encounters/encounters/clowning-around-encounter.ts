import { EnemyPartyConfig, generateModifierType, initBattleWithEnemyConfig, leaveEncounterWithoutBattle, loadCustomMovesForEncounter, selectPokemonForOption, setEncounterRewards, transitionMysteryEncounterIntroVisuals } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { trainerConfigs, TrainerPartyCompoundTemplate, TrainerPartyTemplate, } from "#app/data/trainer-config";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { modifierTypes, PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PartyMemberStrength } from "#enums/party-member-strength";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { Species } from "#enums/species";
import { TrainerType } from "#enums/trainer-type";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { Abilities } from "#enums/abilities";
import { applyModifierTypeToPlayerPokemon } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { Type } from "#app/data/type";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { randSeedInt, randSeedShuffle } from "#app/utils";
import { showEncounterDialogue, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import { OptionSelectConfig } from "#app/ui/abstact-option-select-ui-handler";
import { PlayerPokemon, PokemonMove } from "#app/field/pokemon";
import { Ability } from "#app/data/ability";
import { BerryModifier } from "#app/modifier/modifier";
import { BerryType } from "#enums/berry-type";
import { BattlerIndex } from "#app/battle";
import { Moves } from "#enums/moves";
import { EncounterBattleAnim } from "#app/data/battle-anims";
import { MoveCategory } from "#app/data/move";
import { MysteryEncounterPokemonData } from "#app/data/mystery-encounters/mystery-encounter-pokemon-data";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";
import { EncounterAnim } from "#enums/encounter-anims";
import { Challenges } from "#enums/challenges";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounters/clowningAround";

const RANDOM_ABILITY_POOL = [
  Abilities.STURDY,
  Abilities.PICKUP,
  Abilities.INTIMIDATE,
  Abilities.GUTS,
  Abilities.DROUGHT,
  Abilities.DRIZZLE,
  Abilities.SNOW_WARNING,
  Abilities.SAND_STREAM,
  Abilities.ELECTRIC_SURGE,
  Abilities.PSYCHIC_SURGE,
  Abilities.GRASSY_SURGE,
  Abilities.MISTY_SURGE,
  Abilities.MAGICIAN,
  Abilities.SHEER_FORCE,
  Abilities.PRANKSTER
];

/**
 * Clowning Around encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3807 | GitHub Issue #3807}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const ClowningAroundEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.CLOWNING_AROUND)
    .withEncounterTier(MysteryEncounterTier.ULTRA)
    .withDisallowedChallenges(Challenges.SINGLE_TYPE)
    .withSceneWaveRangeRequirement(80, CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES[1])
    .withAnimations(EncounterAnim.SMOKESCREEN)
    .withAutoHideIntroVisuals(false)
    .withIntroSpriteConfigs([
      {
        spriteKey: Species.MR_MIME.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        repeat: true,
        x: -25,
        tint: 0.3,
        y: -3,
        yShadow: -3
      },
      {
        spriteKey: Species.BLACEPHALON.toString(),
        fileRoot: "pokemon/exp",
        hasShadow: true,
        repeat: true,
        x: 25,
        tint: 0.3,
        y: -3,
        yShadow: -3
      },
      {
        spriteKey: "harlequin",
        fileRoot: "trainer",
        hasShadow: true,
        x: 0,
        y: 2,
        yShadow: 2
      },
    ])
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      },
      {
        text: `${namespace}:intro_dialogue`,
        speaker: `${namespace}:speaker`
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;

      const clownTrainerType = TrainerType.HARLEQUIN;
      const clownConfig = trainerConfigs[clownTrainerType].clone();
      const clownPartyTemplate = new TrainerPartyCompoundTemplate(
        new TrainerPartyTemplate(1, PartyMemberStrength.STRONG),
        new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER));
      clownConfig.setPartyTemplates(clownPartyTemplate);
      clownConfig.setDoubleOnly();
      // @ts-ignore
      clownConfig.partyTemplateFunc = null; // Overrides party template func if it exists

      // Generate random ability for Blacephalon from pool
      const ability = RANDOM_ABILITY_POOL[randSeedInt(RANDOM_ABILITY_POOL.length)];
      encounter.setDialogueToken("ability", new Ability(ability, 3).name);
      encounter.misc = { ability };

      encounter.enemyPartyConfigs.push({
        trainerConfig: clownConfig,
        pokemonConfigs: [ // Overrides first 2 pokemon to be Mr. Mime and Blacephalon
          {
            species: getPokemonSpecies(Species.MR_MIME),
            isBoss: true,
            moveSet: [ Moves.TEETER_DANCE, Moves.ALLY_SWITCH, Moves.DAZZLING_GLEAM, Moves.PSYCHIC ]
          },
          { // Blacephalon has the random ability from pool, and 2 entirely random types to fit with the theme of the encounter
            species: getPokemonSpecies(Species.BLACEPHALON),
            mysteryEncounterPokemonData: new MysteryEncounterPokemonData({ ability: ability, types: [ randSeedInt(18), randSeedInt(18) ]}),
            isBoss: true,
            moveSet: [ Moves.TRICK, Moves.HYPNOSIS, Moves.SHADOW_BALL, Moves.MIND_BLOWN ]
          },
        ],
        doubleBattle: true
      });

      // Load animations/sfx for start of fight moves
      loadCustomMovesForEncounter(scene, [ Moves.ROLE_PLAY, Moves.TAUNT ]);

      encounter.setDialogueToken("blacephalonName", getPokemonSpecies(Species.BLACEPHALON).getName());

      return true;
    })
    .setLocalizationKey(`${namespace}`)
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}:option.1.label`,
          buttonTooltip: `${namespace}:option.1.tooltip`,
          selected: [
            {
              text: `${namespace}:option.1.selected`,
              speaker: `${namespace}:speaker`
            },
          ],
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          // Spawn battle
          const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

          setEncounterRewards(scene, { fillRemaining: true });

          // TODO: when Magic Room and Wonder Room are implemented, add those to start of battle
          encounter.startOfBattleEffects.push(
            { // Mr. Mime copies the Blacephalon's random ability
              sourceBattlerIndex: BattlerIndex.ENEMY,
              targets: [ BattlerIndex.ENEMY_2 ],
              move: new PokemonMove(Moves.ROLE_PLAY),
              ignorePp: true
            },
            {
              sourceBattlerIndex: BattlerIndex.ENEMY_2,
              targets: [ BattlerIndex.PLAYER ],
              move: new PokemonMove(Moves.TAUNT),
              ignorePp: true
            },
            {
              sourceBattlerIndex: BattlerIndex.ENEMY_2,
              targets: [ BattlerIndex.PLAYER_2 ],
              move: new PokemonMove(Moves.TAUNT),
              ignorePp: true
            });

          await transitionMysteryEncounterIntroVisuals(scene);
          await initBattleWithEnemyConfig(scene, config);
        })
        .withPostOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          // After the battle, offer the player the opportunity to permanently swap ability
          const abilityWasSwapped = await handleSwapAbility(scene);
          if (abilityWasSwapped) {
            await showEncounterText(scene, `${namespace}:option.1.ability_gained`);
          }

          // Play animations once ability swap is complete
          // Trainer sprite that is shown at end of battle is not the same as mystery encounter intro visuals
          scene.tweens.add({
            targets: scene.currentBattle.trainer,
            x: "+=16",
            y: "-=16",
            alpha: 0,
            ease: "Sine.easeInOut",
            duration: 250
          });
          const background = new EncounterBattleAnim(EncounterAnim.SMOKESCREEN, scene.getPlayerPokemon()!, scene.getPlayerPokemon());
          background.playWithoutTargets(scene, 230, 40, 2);
          return true;
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}:option.2.label`,
          buttonTooltip: `${namespace}:option.2.tooltip`,
          selected: [
            {
              text: `${namespace}:option.2.selected`,
              speaker: `${namespace}:speaker`
            },
            {
              text: `${namespace}:option.2.selected_2`,
            },
            {
              text: `${namespace}:option.2.selected_3`,
              speaker: `${namespace}:speaker`
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene) => {
          // Swap player's items on pokemon with the most items
          // Item comparisons look at whichever Pokemon has the greatest number of TRANSFERABLE, non-berry items
          // So Vitamins, form change items, etc. are not included
          const encounter = scene.currentBattle.mysteryEncounter!;

          const party = scene.getParty();
          let mostHeldItemsPokemon = party[0];
          let count = mostHeldItemsPokemon.getHeldItems()
            .filter(m => m.isTransferable && !(m instanceof BerryModifier))
            .reduce((v, m) => v + m.stackCount, 0);

          party.forEach(pokemon => {
            const nextCount = pokemon.getHeldItems()
              .filter(m => m.isTransferable && !(m instanceof BerryModifier))
              .reduce((v, m) => v + m.stackCount, 0);
            if (nextCount > count) {
              mostHeldItemsPokemon = pokemon;
              count = nextCount;
            }
          });

          encounter.setDialogueToken("switchPokemon", mostHeldItemsPokemon.getNameToRender());

          const items = mostHeldItemsPokemon.getHeldItems();

          // Shuffles Berries (if they have any)
          let numBerries = 0;
          items.filter(m => m instanceof BerryModifier)
            .forEach(m => {
              numBerries += m.stackCount;
              scene.removeModifier(m);
            });

          generateItemsOfTier(scene, mostHeldItemsPokemon, numBerries, "Berries");

          // Shuffle Transferable held items in the same tier (only shuffles Ultra and Rogue atm)
          let numUltra = 0;
          let numRogue = 0;
          items.filter(m => m.isTransferable && !(m instanceof BerryModifier))
            .forEach(m => {
              const type = m.type.withTierFromPool();
              const tier = type.tier ?? ModifierTier.ULTRA;
              if (type.id === "GOLDEN_EGG" || tier === ModifierTier.ROGUE) {
                numRogue += m.stackCount;
                scene.removeModifier(m);
              } else if (type.id === "LUCKY_EGG" || tier === ModifierTier.ULTRA) {
                numUltra += m.stackCount;
                scene.removeModifier(m);
              }
            });

          generateItemsOfTier(scene, mostHeldItemsPokemon, numUltra, ModifierTier.ULTRA);
          generateItemsOfTier(scene, mostHeldItemsPokemon, numRogue, ModifierTier.ROGUE);
        })
        .withOptionPhase(async (scene: BattleScene) => {
          leaveEncounterWithoutBattle(scene, true);
        })
        .withPostOptionPhase(async (scene: BattleScene) => {
          // Play animations
          const background = new EncounterBattleAnim(EncounterAnim.SMOKESCREEN, scene.getPlayerPokemon()!, scene.getPlayerPokemon());
          background.playWithoutTargets(scene, 230, 40, 2);
          await transitionMysteryEncounterIntroVisuals(scene, true, true, 200);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}:option.3.label`,
          buttonTooltip: `${namespace}:option.3.tooltip`,
          selected: [
            {
              text: `${namespace}:option.3.selected`,
              speaker: `${namespace}:speaker`
            },
            {
              text: `${namespace}:option.3.selected_2`,
            },
            {
              text: `${namespace}:option.3.selected_3`,
              speaker: `${namespace}:speaker`
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene) => {
          // Randomize the second type of all player's pokemon
          // If the pokemon does not normally have a second type, it will gain 1
          for (const pokemon of scene.getParty()) {
            const originalTypes = pokemon.getTypes(false, false, true);

            // If the Pokemon has non-status moves that don't match the Pokemon's type, prioritizes those as the new type
            // Makes the "randomness" of the shuffle slightly less punishing
            let priorityTypes = pokemon.moveset
              .filter(move => move && !originalTypes.includes(move.getMove().type) && move.getMove().category !== MoveCategory.STATUS)
              .map(move => move!.getMove().type);
            if (priorityTypes?.length > 0) {
              priorityTypes = [ ...new Set(priorityTypes) ].sort();
              priorityTypes = randSeedShuffle(priorityTypes);
            }

            const newTypes = [ originalTypes[0] ];
            let secondType: Type | null = null;
            while (secondType === null || secondType === newTypes[0] || originalTypes.includes(secondType)) {
              if (priorityTypes.length > 0) {
                secondType = priorityTypes.pop() ?? null;
              } else {
                secondType = randSeedInt(18) as Type;
              }
            }
            newTypes.push(secondType);

            // Apply the type changes (to both base and fusion, if pokemon is fused)
            if (!pokemon.mysteryEncounterPokemonData) {
              pokemon.mysteryEncounterPokemonData = new MysteryEncounterPokemonData();
            }
            pokemon.mysteryEncounterPokemonData.types = newTypes;
            if (pokemon.isFusion()) {
              if (!pokemon.fusionMysteryEncounterPokemonData) {
                pokemon.fusionMysteryEncounterPokemonData = new MysteryEncounterPokemonData();
              }
              pokemon.fusionMysteryEncounterPokemonData.types = newTypes;
            }
          }
        })
        .withOptionPhase(async (scene: BattleScene) => {
          leaveEncounterWithoutBattle(scene, true);
        })
        .withPostOptionPhase(async (scene: BattleScene) => {
          // Play animations
          const background = new EncounterBattleAnim(EncounterAnim.SMOKESCREEN, scene.getPlayerPokemon()!, scene.getPlayerPokemon());
          background.playWithoutTargets(scene, 230, 40, 2);
          await transitionMysteryEncounterIntroVisuals(scene, true, true, 200);
        })
        .build()
    )
    .withOutroDialogue([
      {
        text: `${namespace}:outro`,
      },
    ])
    .build();

async function handleSwapAbility(scene: BattleScene) {
  return new Promise<boolean>(async resolve => {
    await showEncounterDialogue(scene, `${namespace}:option.1.apply_ability_dialogue`, `${namespace}:speaker`);
    await showEncounterText(scene, `${namespace}:option.1.apply_ability_message`);

    scene.ui.setMode(Mode.MESSAGE).then(() => {
      displayYesNoOptions(scene, resolve);
    });
  });
}

function displayYesNoOptions(scene: BattleScene, resolve) {
  showEncounterText(scene, `${namespace}:option.1.ability_prompt`, null, 500, false);
  const fullOptions = [
    {
      label: i18next.t("menu:yes"),
      handler: () => {
        onYesAbilitySwap(scene, resolve);
        return true;
      }
    },
    {
      label: i18next.t("menu:no"),
      handler: () => {
        resolve(false);
        return true;
      }
    }
  ];

  const config: OptionSelectConfig = {
    options: fullOptions,
    maxOptions: 7,
    yOffset: 0
  };
  scene.ui.setModeWithoutClear(Mode.OPTION_SELECT, config, null, true);
}

function onYesAbilitySwap(scene: BattleScene, resolve) {
  const onPokemonSelected = (pokemon: PlayerPokemon) => {
    // Do ability swap
    const encounter = scene.currentBattle.mysteryEncounter!;
    if (pokemon.isFusion()) {
      if (!pokemon.fusionMysteryEncounterPokemonData) {
        pokemon.fusionMysteryEncounterPokemonData = new MysteryEncounterPokemonData();
      }
      pokemon.fusionMysteryEncounterPokemonData.ability = encounter.misc.ability;
    } else {
      if (!pokemon.mysteryEncounterPokemonData) {
        pokemon.mysteryEncounterPokemonData = new MysteryEncounterPokemonData();
      }
      pokemon.mysteryEncounterPokemonData.ability = encounter.misc.ability;
    }
    encounter.setDialogueToken("chosenPokemon", pokemon.getNameToRender());
    scene.ui.setMode(Mode.MESSAGE).then(() => resolve(true));
  };

  const onPokemonNotSelected = () => {
    scene.ui.setMode(Mode.MESSAGE).then(() => {
      displayYesNoOptions(scene, resolve);
    });
  };

  selectPokemonForOption(scene, onPokemonSelected, onPokemonNotSelected);
}

function generateItemsOfTier(scene: BattleScene, pokemon: PlayerPokemon, numItems: number, tier: ModifierTier | "Berries") {
  // These pools have to be defined at runtime so that modifierTypes exist
  // Pools have instances of the modifier type equal to the max stacks that modifier can be applied to any one pokemon
  // This is to prevent "over-generating" a random item of a certain type during item swaps
  const ultraPool = [
    [ modifierTypes.REVIVER_SEED, 1 ],
    [ modifierTypes.GOLDEN_PUNCH, 5 ],
    [ modifierTypes.ATTACK_TYPE_BOOSTER, 99 ],
    [ modifierTypes.QUICK_CLAW, 3 ],
    [ modifierTypes.WIDE_LENS, 3 ]
  ];

  const roguePool = [
    [ modifierTypes.LEFTOVERS, 4 ],
    [ modifierTypes.SHELL_BELL, 4 ],
    [ modifierTypes.SOUL_DEW, 10 ],
    [ modifierTypes.SOOTHE_BELL, 3 ],
    [ modifierTypes.SCOPE_LENS, 1 ],
    [ modifierTypes.BATON, 1 ],
    [ modifierTypes.FOCUS_BAND, 5 ],
    [ modifierTypes.KINGS_ROCK, 3 ],
    [ modifierTypes.GRIP_CLAW, 5 ]
  ];

  const berryPool = [
    [ BerryType.APICOT, 3 ],
    [ BerryType.ENIGMA, 2 ],
    [ BerryType.GANLON, 3 ],
    [ BerryType.LANSAT, 3 ],
    [ BerryType.LEPPA, 2 ],
    [ BerryType.LIECHI, 3 ],
    [ BerryType.LUM, 2 ],
    [ BerryType.PETAYA, 3 ],
    [ BerryType.SALAC, 2 ],
    [ BerryType.SITRUS, 2 ],
    [ BerryType.STARF, 3 ]
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
      newMod = generateModifierType(scene, modifierTypes.BERRY, [ newItemType[0] ]) as PokemonHeldItemModifierType;
    } else {
      newMod = generateModifierType(scene, newItemType[0]) as PokemonHeldItemModifierType;
    }
    applyModifierTypeToPlayerPokemon(scene, pokemon, newMod);
    // Decrement max stacks and remove from pool if at max
    newItemType[1]--;
    if (newItemType[1] <= 0) {
      pool.splice(randIndex, 1);
    }
  }
}
