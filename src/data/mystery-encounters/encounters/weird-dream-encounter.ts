import { Type } from "#app/data/type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Species } from "#enums/species";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { EnemyPartyConfig, EnemyPokemonConfig, generateModifierType, initBattleWithEnemyConfig, leaveEncounterWithoutBattle, setEncounterRewards, } from "../utils/encounter-phase-utils";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { PlayerPokemon, PokemonMove } from "#app/field/pokemon";
import { IntegerHolder, isNullOrUndefined, randSeedInt, randSeedShuffle } from "#app/utils";
import PokemonSpecies, { allSpecies, getPokemonSpecies } from "#app/data/pokemon-species";
import { HiddenAbilityRateBoosterModifier, PokemonBaseStatFlatModifier, PokemonFormChangeItemModifier, PokemonHeldItemModifier } from "#app/modifier/modifier";
import { achvs } from "#app/system/achv";
import { CustomPokemonData } from "#app/data/mystery-encounters/custom-pokemon-data";
import { showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { modifierTypes, PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import i18next from "#app/plugins/i18n";
import { doPokemonTransformationSequence, TransformationScreenPosition } from "#app/data/mystery-encounters/utils/encounter-transformation-sequence";
import { getLevelTotalExp } from "#app/data/exp";
import { Stat } from "#enums/stat";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";
import { Challenges } from "#enums/challenges";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { PlayerGender } from "#enums/player-gender";
import { TrainerType } from "#enums/trainer-type";
import PokemonData from "#app/system/pokemon-data";
import { Nature } from "#enums/nature";
import HeldModifierConfig from "#app/interfaces/held-modifier-config";
import { trainerConfigs, TrainerPartyTemplate } from "#app/data/trainer-config";
import { PartyMemberStrength } from "#enums/party-member-strength";

/** i18n namespace for encounter */
const namespace = "mysteryEncounters/weirdDream";

/** Exclude Ultra Beasts, Paradox, Eternatus, and all legendary/mythical/trio pokemon that are below 570 BST */
const EXCLUDED_TRANSFORMATION_SPECIES = [
  Species.ETERNATUS,
  /** UBs */
  Species.NIHILEGO,
  Species.BUZZWOLE,
  Species.PHEROMOSA,
  Species.XURKITREE,
  Species.CELESTEELA,
  Species.KARTANA,
  Species.GUZZLORD,
  Species.POIPOLE,
  Species.NAGANADEL,
  Species.STAKATAKA,
  Species.BLACEPHALON,
  /** Paradox */
  Species.GREAT_TUSK,
  Species.SCREAM_TAIL,
  Species.BRUTE_BONNET,
  Species.FLUTTER_MANE,
  Species.SLITHER_WING,
  Species.SANDY_SHOCKS,
  Species.ROARING_MOON,
  Species.WALKING_WAKE,
  Species.GOUGING_FIRE,
  Species.RAGING_BOLT,
  Species.IRON_TREADS,
  Species.IRON_BUNDLE,
  Species.IRON_HANDS,
  Species.IRON_JUGULIS,
  Species.IRON_MOTH,
  Species.IRON_THORNS,
  Species.IRON_VALIANT,
  Species.IRON_LEAVES,
  Species.IRON_BOULDER,
  Species.IRON_CROWN,
  /** These are banned so they don't appear in the < 570 BST pool */
  Species.COSMOG,
  Species.MELTAN,
  Species.KUBFU,
  Species.COSMOEM,
  Species.POIPOLE,
  Species.TERAPAGOS,
  Species.TYPE_NULL,
  Species.CALYREX,
  Species.NAGANADEL,
  Species.URSHIFU,
  Species.OGERPON,
  Species.OKIDOGI,
  Species.MUNKIDORI,
  Species.FEZANDIPITI,
];

const SUPER_LEGENDARY_BST_THRESHOLD = 600;
const NON_LEGENDARY_BST_THRESHOLD = 570;

/** 0-100 */
const PERCENT_LEVEL_LOSS_ON_REFUSE = 10;

/**
 * Value ranges of the resulting species BST transformations after adding values to original species
 * 2 Pokemon in the party use this range
 */
const HIGH_BST_TRANSFORM_BASE_VALUES: [number, number] = [90, 110];
/**
 * Value ranges of the resulting species BST transformations after adding values to original species
 * All remaining Pokemon in the party use this range
 */
const STANDARD_BST_TRANSFORM_BASE_VALUES: [number, number] = [40, 50];

/**
 * Weird Dream encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3822 | GitHub Issue #3822}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const WeirdDreamEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.WEIRD_DREAM)
    .withEncounterTier(MysteryEncounterTier.ROGUE)
    .withDisallowedChallenges(Challenges.SINGLE_TYPE, Challenges.SINGLE_GENERATION)
    // TODO: should reset minimum wave to 10 when there are more Rogue tiers in pool. Matching Dark Deal minimum for now.
    .withSceneWaveRangeRequirement(30, CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES[1])
    .withIntroSpriteConfigs([
      {
        spriteKey: "weird_dream_woman",
        fileRoot: "mystery-encounters",
        hasShadow: true,
        y: 11,
        yShadow: 6,
        x: 4
      },
    ])
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      },
      {
        speaker: `${namespace}:speaker`,
        text: `${namespace}:intro_dialogue`,
      },
    ])
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withOnInit((scene: BattleScene) => {
      scene.loadBgm("mystery_encounter_weird_dream", "mystery_encounter_weird_dream.mp3");

      // Calculate all the newly transformed Pokemon and begin asset load
      const teamTransformations = getTeamTransformations(scene);
      const loadAssets = teamTransformations.map(t => (t.newPokemon as PlayerPokemon).loadAssets());
      scene.currentBattle.mysteryEncounter!.misc = {
        teamTransformations,
        loadAssets
      };

      return true;
    })
    .withOnVisualsStart((scene: BattleScene) => {
      scene.fadeAndSwitchBgm("mystery_encounter_weird_dream");
      return true;
    })
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withHasDexProgress(true)
        .withDialogue({
          buttonLabel: `${namespace}:option.1.label`,
          buttonTooltip: `${namespace}:option.1.tooltip`,
          selected: [
            {
              text: `${namespace}:option.1.selected`,
            }
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene) => {
          // Play the animation as the player goes through the dialogue
          scene.time.delayedCall(1000, () => {
            doShowDreamBackground(scene);
          });

          for (const transformation of scene.currentBattle.mysteryEncounter!.misc.teamTransformations) {
            scene.removePokemonFromPlayerParty(transformation.previousPokemon, false);
            scene.getParty().push(transformation.newPokemon);
          }
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Starts cutscene dialogue, but does not await so that cutscene plays as player goes through dialogue
          const cutsceneDialoguePromise = showEncounterText(scene, `${namespace}:option.1.cutscene`);

          // Change the entire player's party
          // Wait for all new Pokemon assets to be loaded before showing transformation animations
          await Promise.all(scene.currentBattle.mysteryEncounter!.misc.loadAssets);
          const transformations = scene.currentBattle.mysteryEncounter!.misc.teamTransformations;

          // If there are 1-3 transformations, do them centered back to back
          // Otherwise, the first 3 transformations are executed side-by-side, then any remaining 1-3 transformations occur in those same respective positions
          if (transformations.length <= 3) {
            for (const transformation of transformations) {
              const pokemon1 = transformation.previousPokemon;
              const pokemon2 = transformation.newPokemon;

              await doPokemonTransformationSequence(scene, pokemon1, pokemon2, TransformationScreenPosition.CENTER);
            }
          } else {
            await doSideBySideTransformations(scene, transformations);
          }

          // Make sure player has finished cutscene dialogue
          await cutsceneDialoguePromise;

          doHideDreamBackground(scene);
          await showEncounterText(scene, `${namespace}:option.1.dream_complete`);

          await doNewTeamPostProcess(scene, transformations);
          setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.MEMORY_MUSHROOM, modifierTypes.ROGUE_BALL, modifierTypes.MINT, modifierTypes.MINT, modifierTypes.MINT], fillRemaining: false });
          leaveEncounterWithoutBattle(scene, true);
        })
        .build()
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        selected: [
          {
            text: `${namespace}:option.2.selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Battle your "future" team for some item rewards
        const transformations: PokemonTransformation[] = scene.currentBattle.mysteryEncounter!.misc.teamTransformations;

        // Uses the pokemon that player's party would have transformed into
        const enemyPokemonConfigs: EnemyPokemonConfig[] = [];
        for (const transformation of transformations) {
          const newPokemon = transformation.newPokemon;
          const previousPokemon = transformation.previousPokemon;

          await postProcessTransformedPokemon(scene, previousPokemon, newPokemon, newPokemon.species.getRootSpeciesId(), true);

          const dataSource = new PokemonData(newPokemon);
          dataSource.player = false;

          // Copy all held items
          const heldItems = previousPokemon.getHeldItems();
          const newPokemonHeldItemConfigs: HeldModifierConfig[] = heldItems.map(previousMod => {
            return {
              modifier: previousMod.clone() as PokemonHeldItemModifier,
              stackCount: previousMod.getStackCount(),
              isTransferable: false
            };
          });

          if (newPokemonHeldItemConfigs.filter(config => config.modifier instanceof PokemonBaseStatFlatModifier).length === 0) {
            // Also add Old Gateau (even on transformed mons that shouldn't normally get it)
            newPokemonHeldItemConfigs.push({
              modifier: generateModifierType(scene, modifierTypes.MYSTERY_ENCOUNTER_OLD_GATEAU) as PokemonHeldItemModifierType,
              stackCount: 1,
              isTransferable: false
            });
          }

          const enemyConfig: EnemyPokemonConfig = {
            species: transformation.newSpecies,
            isBoss: newPokemon.getSpeciesForm().getBaseStatTotal() > NON_LEGENDARY_BST_THRESHOLD,
            level: previousPokemon.level,
            dataSource: dataSource,
            modifierConfigs: newPokemonHeldItemConfigs
          };

          enemyPokemonConfigs.push(enemyConfig);
        }

        const genderIndex = scene.gameData.gender ?? PlayerGender.UNSET;
        const trainerConfig = trainerConfigs[genderIndex === PlayerGender.FEMALE ? TrainerType.FUTURE_SELF_F : TrainerType.FUTURE_SELF_M].clone();
        trainerConfig.setPartyTemplates(new TrainerPartyTemplate(transformations.length, PartyMemberStrength.STRONG));
        const enemyPartyConfig: EnemyPartyConfig = {
          trainerConfig: trainerConfig,
          pokemonConfigs: enemyPokemonConfigs,
          female: genderIndex === PlayerGender.FEMALE
        };

        const onBeforeRewards = () => {
          // Before battle rewards, unlock the passive on a pokemon in the player's team for the rest of the run (not permanently)
          // One random pokemon will get its passive unlocked
          const passiveDisabledPokemon = scene.getParty().filter(p => !p.passive);
          if (passiveDisabledPokemon?.length > 0) {
            const enablePassiveMon = passiveDisabledPokemon[randSeedInt(passiveDisabledPokemon.length)];
            enablePassiveMon.passive = true;
            enablePassiveMon.updateInfo(true);
          }
        };

        setEncounterRewards(scene, { guaranteedModifierTiers: [ModifierTier.ROGUE, ModifierTier.ROGUE, ModifierTier.ULTRA, ModifierTier.ULTRA, ModifierTier.GREAT, ModifierTier.GREAT], fillRemaining: false }, undefined, onBeforeRewards);

        await showEncounterText(scene, `${namespace}:option.2.selected_2`, null, undefined, true);
        await initBattleWithEnemyConfig(scene, enemyPartyConfig);
      }
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Leave, reduce party levels by 10%
        for (const pokemon of scene.getParty()) {
          pokemon.level = Math.max(Math.ceil((100 - PERCENT_LEVEL_LOSS_ON_REFUSE) / 100 * pokemon.level), 1);
          pokemon.exp = getLevelTotalExp(pokemon.level, pokemon.species.growthRate);
          pokemon.levelExp = 0;

          pokemon.calculateStats();
          await pokemon.updateInfo();
        }

        leaveEncounterWithoutBattle(scene, true);
        return true;
      }
    )
    .build();

interface PokemonTransformation {
  previousPokemon: PlayerPokemon;
  newSpecies: PokemonSpecies;
  newPokemon: PlayerPokemon;
  heldItems: PokemonHeldItemModifier[];
}

function getTeamTransformations(scene: BattleScene): PokemonTransformation[] {
  const party = scene.getParty();
  // Removes all pokemon from the party
  const alreadyUsedSpecies: PokemonSpecies[] = party.map(p => p.species);
  const pokemonTransformations: PokemonTransformation[] = party.map(p => {
    return {
      previousPokemon: p
    } as PokemonTransformation;
  });

  // Only 1 Pokemon can be transformed into BST higher than 600
  let hasPokemonInSuperLegendaryBstThreshold = false;
  // Only 1 other Pokemon can be transformed into BST between 570-600
  let hasPokemonInLegendaryBstThreshold = false;

  // First, roll 2 of the party members to new Pokemon at a +90 to +110 BST difference
  // Then, roll the remainder of the party members at a +40 to +50 BST difference
  const numPokemon = party.length;
  const removedPokemon = randSeedShuffle(party.slice(0));
  for (let i = 0; i < numPokemon; i++) {
    const removed = removedPokemon[i];
    const index = pokemonTransformations.findIndex(p => p.previousPokemon.id === removed.id);
    pokemonTransformations[index].heldItems = removed.getHeldItems().filter(m => !(m instanceof PokemonFormChangeItemModifier));

    const bst = removed.calculateBaseStats().reduce((a, b) => a + b, 0);
    let newBstRange: [number, number];
    if (i < 2) {
      newBstRange = HIGH_BST_TRANSFORM_BASE_VALUES;
    } else {
      newBstRange = STANDARD_BST_TRANSFORM_BASE_VALUES;
    }

    const newSpecies = getTransformedSpecies(bst, newBstRange, hasPokemonInSuperLegendaryBstThreshold, hasPokemonInLegendaryBstThreshold, alreadyUsedSpecies);

    const newSpeciesBst = newSpecies.getBaseStatTotal();
    if (newSpeciesBst > SUPER_LEGENDARY_BST_THRESHOLD) {
      hasPokemonInSuperLegendaryBstThreshold = true;
    }
    if (newSpeciesBst <= SUPER_LEGENDARY_BST_THRESHOLD && newSpeciesBst >= NON_LEGENDARY_BST_THRESHOLD) {
      hasPokemonInLegendaryBstThreshold = true;
    }


    pokemonTransformations[index].newSpecies = newSpecies;
    console.log("New species: " + JSON.stringify(newSpecies));
    alreadyUsedSpecies.push(newSpecies);
  }

  for (const transformation of pokemonTransformations) {
    const newAbilityIndex = randSeedInt(transformation.newSpecies.getAbilityCount());
    transformation.newPokemon = scene.addPlayerPokemon(transformation.newSpecies, transformation.previousPokemon.level, newAbilityIndex, undefined);
  }

  return pokemonTransformations;
}

async function doNewTeamPostProcess(scene: BattleScene, transformations: PokemonTransformation[]) {
  let atLeastOneNewStarter = false;
  for (const transformation of transformations) {
    const previousPokemon = transformation.previousPokemon;
    const newPokemon = transformation.newPokemon;
    const speciesRootForm = newPokemon.species.getRootSpeciesId();

    if (await postProcessTransformedPokemon(scene, previousPokemon, newPokemon, speciesRootForm)) {
      atLeastOneNewStarter = true;
    }

    // Copy old items to new pokemon
    for (const item of transformation.heldItems) {
      item.pokemonId = newPokemon.id;
      await scene.addModifier(item, false, false, false, true);
    }

    newPokemon.calculateStats();
    await newPokemon.updateInfo();
  }

  // One random pokemon will get its passive unlocked
  const passiveDisabledPokemon = scene.getParty().filter(p => !p.passive);
  if (passiveDisabledPokemon?.length > 0) {
    const enablePassiveMon = passiveDisabledPokemon[randSeedInt(passiveDisabledPokemon.length)];
    enablePassiveMon.passive = true;
    await enablePassiveMon.updateInfo(true);
  }

  // If at least one new starter was unlocked, play 1 fanfare
  if (atLeastOneNewStarter) {
    scene.playSound("level_up_fanfare");
  }
}

/**
 * Applies special changes to the newly transformed pokemon, such as passing previous moves, gaining egg moves, etc.
 * Returns whether the transformed pokemon unlocks a new starter for the player.
 * @param scene
 * @param previousPokemon
 * @param newPokemon
 * @param speciesRootForm
 * @param forBattle Default `false`. If true, will perform notifications and dex unlocks for the player.
 */
async function postProcessTransformedPokemon(scene: BattleScene, previousPokemon: PlayerPokemon, newPokemon: PlayerPokemon, speciesRootForm: Species, forBattle: boolean = false): Promise<boolean> {
  let isNewStarter = false;
  // Roll HA a second time
  if (newPokemon.species.abilityHidden) {
    const hiddenIndex = newPokemon.species.ability2 ? 2 : 1;
    if (newPokemon.abilityIndex < hiddenIndex) {
      const hiddenAbilityChance = new IntegerHolder(256);
      scene.applyModifiers(HiddenAbilityRateBoosterModifier, true, hiddenAbilityChance);

      const hasHiddenAbility = !randSeedInt(hiddenAbilityChance.value);

      if (hasHiddenAbility) {
        newPokemon.abilityIndex = hiddenIndex;
      }
    }
  }

  // Roll IVs a second time
  newPokemon.ivs = newPokemon.ivs.map(iv => {
    const newValue = randSeedInt(31);
    return newValue > iv ? newValue : iv;
  });

  // Roll a neutral nature
  newPokemon.nature = [Nature.HARDY, Nature.DOCILE, Nature.BASHFUL, Nature.QUIRKY, Nature.SERIOUS][randSeedInt(5)];

  // For pokemon at/below 570 BST or any shiny pokemon, unlock it permanently as if you had caught it
  if (!forBattle && (newPokemon.getSpeciesForm().getBaseStatTotal() <= NON_LEGENDARY_BST_THRESHOLD || newPokemon.isShiny())) {
    if (newPokemon.getSpeciesForm().abilityHidden && newPokemon.abilityIndex === newPokemon.getSpeciesForm().getAbilityCount() - 1) {
      scene.validateAchv(achvs.HIDDEN_ABILITY);
    }

    if (newPokemon.species.subLegendary) {
      scene.validateAchv(achvs.CATCH_SUB_LEGENDARY);
    }

    if (newPokemon.species.legendary) {
      scene.validateAchv(achvs.CATCH_LEGENDARY);
    }

    if (newPokemon.species.mythical) {
      scene.validateAchv(achvs.CATCH_MYTHICAL);
    }

    scene.gameData.updateSpeciesDexIvs(newPokemon.species.getRootSpeciesId(true), newPokemon.ivs);
    const newStarterUnlocked = await scene.gameData.setPokemonCaught(newPokemon, true, false, false);
    if (newStarterUnlocked) {
      isNewStarter = true;
      await showEncounterText(scene, i18next.t("battle:addedAsAStarter", { pokemonName: getPokemonSpecies(speciesRootForm).getName() }));
    }
  }

  // If the previous pokemon had pokerus, transfer to new pokemon
  newPokemon.pokerus = previousPokemon.pokerus;

  // Transfer previous Pokemon's luck value
  newPokemon.luck = previousPokemon.getLuck();

  // If the previous pokemon had higher IVs, override to those (after updating dex IVs > prevents perfect 31s on a new unlock)
  newPokemon.ivs = newPokemon.ivs.map((iv, index) => {
    return previousPokemon.ivs[index] > iv ? previousPokemon.ivs[index] : iv;
  });

  // For pokemon that the player owns (including ones just caught), gain a candy
  if (!forBattle && !!scene.gameData.dexData[speciesRootForm].caughtAttr) {
    scene.gameData.addStarterCandy(getPokemonSpecies(speciesRootForm), 1);
  }

  // Set the moveset of the new pokemon to be the same as previous, but with 1 egg move and 1 (attempted) STAB move of the new species
  newPokemon.generateAndPopulateMoveset();
  // Store a copy of a "standard" generated moveset for the new pokemon, will be used later for finding a favored move
  const newPokemonGeneratedMoveset = newPokemon.moveset;

  newPokemon.moveset = previousPokemon.moveset.slice(0);

  const newEggMoveIndex = await addEggMoveToNewPokemonMoveset(scene, newPokemon, speciesRootForm, forBattle);

  // Try to add a favored STAB move (might fail if Pokemon already knows a bunch of moves from newPokemonGeneratedMoveset)
  addFavoredMoveToNewPokemonMoveset(newPokemon, newPokemonGeneratedMoveset, newEggMoveIndex);

  // Randomize the second type of the pokemon
  // If the pokemon does not normally have a second type, it will gain 1
  const newTypes = [newPokemon.getTypes()[0]];
  let newType = randSeedInt(18) as Type;
  while (newType === newTypes[0]) {
    newType = randSeedInt(18) as Type;
  }
  newTypes.push(newType);
  if (!newPokemon.customPokemonData) {
    newPokemon.customPokemonData = new CustomPokemonData();
  }
  newPokemon.customPokemonData.types = newTypes;

  // Any pokemon that is below 570 BST gets +20 permanent BST to 3 stats:  lowest of HP/Spd, lowest of Atk/SpAtk, and lowest of Def/SpDef
  if (newPokemon.getSpeciesForm().getBaseStatTotal() < NON_LEGENDARY_BST_THRESHOLD) {
    const stats: Stat[] = [];
    const baseStats = newPokemon.getSpeciesForm().baseStats.slice(0);
    // HP or Speed
    stats.push(baseStats[Stat.HP] < baseStats[Stat.SPD] ? Stat.HP : Stat.SPD);
    // Attack or SpAtk
    stats.push(baseStats[Stat.ATK] < baseStats[Stat.SPATK] ? Stat.ATK : Stat.SPATK);
    // Def or SpDef
    stats.push(baseStats[Stat.DEF] < baseStats[Stat.SPDEF] ? Stat.DEF : Stat.SPDEF);
    const modType = modifierTypes.MYSTERY_ENCOUNTER_OLD_GATEAU()
      .generateType(scene.getParty(), [20, stats])
      ?.withIdFromFunc(modifierTypes.MYSTERY_ENCOUNTER_OLD_GATEAU);
    const modifier = modType?.newModifier(newPokemon);
    if (modifier) {
      await scene.addModifier(modifier, false, false, false, true);
    }
  }

  // Enable passive if previous had it
  newPokemon.passive = previousPokemon.passive;

  return isNewStarter;
}

function getTransformedSpecies(originalBst: number, bstSearchRange: [number, number], hasPokemonBstHigherThan600: boolean, hasPokemonBstBetween570And600: boolean, alreadyUsedSpecies: PokemonSpecies[]): PokemonSpecies {
  let newSpecies: PokemonSpecies | undefined;
  while (isNullOrUndefined(newSpecies)) {
    const bstCap = originalBst + bstSearchRange[1];
    const bstMin = Math.max(originalBst + bstSearchRange[0], 0);

    // Get any/all species that fall within the Bst range requirements
    let validSpecies = allSpecies
      .filter(s => {
        const speciesBst = s.getBaseStatTotal();
        const bstInRange = speciesBst >= bstMin && speciesBst <= bstCap;
        // Checks that a Pokemon has not already been added in the +600 or 570-600 slots;
        const validBst = (!hasPokemonBstBetween570And600 || (speciesBst < NON_LEGENDARY_BST_THRESHOLD || speciesBst > SUPER_LEGENDARY_BST_THRESHOLD)) &&
          (!hasPokemonBstHigherThan600 || speciesBst <= SUPER_LEGENDARY_BST_THRESHOLD);
        return bstInRange && validBst && !EXCLUDED_TRANSFORMATION_SPECIES.includes(s.speciesId);
      });

    // There must be at least 20 species available before it will choose one
    if (validSpecies?.length > 20) {
      validSpecies = randSeedShuffle(validSpecies);
      newSpecies = validSpecies.pop();
      while (isNullOrUndefined(newSpecies) || alreadyUsedSpecies.includes(newSpecies)) {
        newSpecies = validSpecies.pop();
      }
    } else {
      // Expands search rand until a Pokemon is found
      bstSearchRange[0] -= 10;
      bstSearchRange[1] += 10;
    }
  }

  return newSpecies;
}

function doShowDreamBackground(scene: BattleScene) {
  const transformationContainer = scene.add.container(0, -scene.game.canvas.height / 6);
  transformationContainer.name = "Dream Background";

  // In case it takes a bit for video to load
  const transformationStaticBg = scene.add.rectangle(0, 0, scene.game.canvas.width / 6, scene.game.canvas.height / 6, 0);
  transformationStaticBg.setName("Black Background");
  transformationStaticBg.setOrigin(0, 0);
  transformationContainer.add(transformationStaticBg);
  transformationStaticBg.setVisible(true);

  const transformationVideoBg: Phaser.GameObjects.Video = scene.add.video(0, 0, "evo_bg").stop();
  transformationVideoBg.setLoop(true);
  transformationVideoBg.setOrigin(0, 0);
  transformationVideoBg.setScale(0.4359673025);
  transformationContainer.add(transformationVideoBg);

  scene.fieldUI.add(transformationContainer);
  scene.fieldUI.bringToTop(transformationContainer);
  transformationVideoBg.play();

  transformationContainer.setVisible(true);
  transformationContainer.alpha = 0;

  scene.tweens.add({
    targets: transformationContainer,
    alpha: 1,
    duration: 3000,
    ease: "Sine.easeInOut"
  });
}

function doHideDreamBackground(scene: BattleScene) {
  const transformationContainer = scene.fieldUI.getByName("Dream Background");

  scene.tweens.add({
    targets: transformationContainer,
    alpha: 0,
    duration: 3000,
    ease: "Sine.easeInOut",
    onComplete: () => {
      scene.fieldUI.remove(transformationContainer, true);
    }
  });
}

function doSideBySideTransformations(scene: BattleScene, transformations: PokemonTransformation[]) {
  return new Promise<void>(resolve => {
    const allTransformationPromises: Promise<void>[] = [];
    for (let i = 0; i < 3; i++) {
      const delay = i * 4000;
      scene.time.delayedCall(delay, () => {
        const transformation = transformations[i];
        const pokemon1 = transformation.previousPokemon;
        const pokemon2 = transformation.newPokemon;
        const screenPosition = i as TransformationScreenPosition;

        const transformationPromise = doPokemonTransformationSequence(scene, pokemon1, pokemon2, screenPosition)
          .then(() => {
            if (transformations.length > i + 3) {
              const nextTransformationAtPosition = transformations[i + 3];
              const nextPokemon1 = nextTransformationAtPosition.previousPokemon;
              const nextPokemon2 = nextTransformationAtPosition.newPokemon;

              allTransformationPromises.push(doPokemonTransformationSequence(scene, nextPokemon1, nextPokemon2, screenPosition));
            }
          });
        allTransformationPromises.push(transformationPromise);
      });
    }

    // Wait for all transformations to be loaded into promise array
    const id = setInterval(checkAllPromisesExist, 500);
    async function checkAllPromisesExist() {
      if (allTransformationPromises.length === transformations.length) {
        clearInterval(id);
        await Promise.all(allTransformationPromises);
        resolve();
      }
    }
  });
}

/**
 * Returns index of the new egg move within the Pokemon's moveset (not the index of the move in `speciesEggMoves`)
 * @param scene
 * @param newPokemon
 * @param speciesRootForm
 */
async function addEggMoveToNewPokemonMoveset(scene: BattleScene, newPokemon: PlayerPokemon, speciesRootForm: Species, forBattle: boolean = false): Promise<number | null> {
  let eggMoveIndex: null | number = null;
  const eggMoves = newPokemon.getEggMoves()?.slice(0);
  if (eggMoves) {
    const eggMoveIndices = randSeedShuffle([0, 1, 2, 3]);
    let randomEggMoveIndex = eggMoveIndices.pop();
    let randomEggMove = !isNullOrUndefined(randomEggMoveIndex) ? eggMoves[randomEggMoveIndex] : null;
    let retries = 0;
    while (retries < 3 && (!randomEggMove || newPokemon.moveset.some(m => m?.moveId === randomEggMove))) {
      // If Pokemon already knows this move, roll for another egg move
      randomEggMoveIndex = eggMoveIndices.pop();
      randomEggMove = !isNullOrUndefined(randomEggMoveIndex) ? eggMoves[randomEggMoveIndex] : null;
      retries++;
    }

    if (randomEggMove) {
      if (!newPokemon.moveset.some(m => m?.moveId === randomEggMove)) {
        if (newPokemon.moveset.length < 4) {
          newPokemon.moveset.push(new PokemonMove(randomEggMove));
        } else {
          eggMoveIndex = randSeedInt(4);
          newPokemon.moveset[eggMoveIndex] = new PokemonMove(randomEggMove);
        }
      }

      // For pokemon that the player owns (including ones just caught), unlock the egg move
      if (!forBattle && !isNullOrUndefined(randomEggMoveIndex) && !!scene.gameData.dexData[speciesRootForm].caughtAttr) {
        await scene.gameData.setEggMoveUnlocked(getPokemonSpecies(speciesRootForm), randomEggMoveIndex, true);
      }
    }
  }

  return eggMoveIndex;
}

/**
 * Returns index of the new egg move within the Pokemon's moveset (not the index of the move in `speciesEggMoves`)
 * @param newPokemon
 * @param newPokemonGeneratedMoveset
 * @param newEggMoveIndex
 */
function addFavoredMoveToNewPokemonMoveset(newPokemon: PlayerPokemon, newPokemonGeneratedMoveset: (PokemonMove | null)[], newEggMoveIndex: number | null) {
  let favoredMove: PokemonMove | null = null;
  for (const move of newPokemonGeneratedMoveset) {
    // Needs to match first type, second type will be replaced
    if (move?.getMove().type === newPokemon.getTypes()[0] && !newPokemon.moveset.some(m => m?.moveId === move?.moveId)) {
      favoredMove = move;
      break;
    }
  }
  // If was unable to find a favored move, uses first move in moveset that isn't already known (typically a high power STAB move)
  // Otherwise, it gains no favored move
  if (!favoredMove) {
    for (const move of newPokemonGeneratedMoveset) {
      // Needs to match first type, second type will be replaced
      if (!newPokemon.moveset.some(m => m?.moveId === move?.moveId)) {
        favoredMove = move;
        break;
      }
    }
  }
  // Finally, assign favored move to random index that isn't the new egg move index
  if (favoredMove) {
    if (newPokemon.moveset.length < 4) {
      newPokemon.moveset.push(favoredMove);
    } else {
      let favoredMoveIndex = randSeedInt(4);
      while (newEggMoveIndex !== null && favoredMoveIndex === newEggMoveIndex) {
        favoredMoveIndex = randSeedInt(4);
      }

      newPokemon.moveset[favoredMoveIndex] = favoredMove;
    }
  }
}
