import { globalScene } from "#app/global-scene";
import { allSpecies, modifierTypes } from "#data/data-lists";
import { getLevelTotalExp } from "#data/exp";
import type { PokemonSpecies } from "#data/pokemon-species";
import { AbilityId } from "#enums/ability-id";
import { Challenges } from "#enums/challenges";
import { ModifierTier } from "#enums/modifier-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Nature } from "#enums/nature";
import { PartyMemberStrength } from "#enums/party-member-strength";
import { PlayerGender } from "#enums/player-gender";
import { MAX_POKEMON_TYPE, PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { TrainerType } from "#enums/trainer-type";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import type { PokemonHeldItemModifier } from "#modifiers/modifier";
import { HiddenAbilityRateBoosterModifier, PokemonFormChangeItemModifier } from "#modifiers/modifier";
import type { PokemonHeldItemModifierType } from "#modifiers/modifier-type";
import { PokemonMove } from "#moves/pokemon-move";
import { showEncounterText } from "#mystery-encounters/encounter-dialogue-utils";
import type { EnemyPartyConfig, EnemyPokemonConfig } from "#mystery-encounters/encounter-phase-utils";
import {
  generateModifierType,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  setEncounterRewards,
} from "#mystery-encounters/encounter-phase-utils";
import {
  doPokemonTransformationSequence,
  TransformationScreenPosition,
} from "#mystery-encounters/encounter-transformation-sequence";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import i18next from "#plugins/i18n";
import { achvs } from "#system/achv";
import { PokemonData } from "#system/pokemon-data";
import { trainerConfigs } from "#trainers/trainer-config";
import { TrainerPartyTemplate } from "#trainers/trainer-party-template";
import type { HeldModifierConfig } from "#types/held-modifier-config";
import { isNullOrUndefined, NumberHolder, randSeedInt, randSeedShuffle } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";

/** i18n namespace for encounter */
const namespace = "mysteryEncounters/weirdDream";

/** Exclude Ultra Beasts, Paradox, Eternatus, and all legendary/mythical/trio pokemon that are below 570 BST */
const EXCLUDED_TRANSFORMATION_SPECIES = [
  SpeciesId.ARCEUS,
  SpeciesId.ETERNATUS,
  /** UBs */
  SpeciesId.NIHILEGO,
  SpeciesId.BUZZWOLE,
  SpeciesId.PHEROMOSA,
  SpeciesId.XURKITREE,
  SpeciesId.CELESTEELA,
  SpeciesId.KARTANA,
  SpeciesId.GUZZLORD,
  SpeciesId.POIPOLE,
  SpeciesId.NAGANADEL,
  SpeciesId.STAKATAKA,
  SpeciesId.BLACEPHALON,
  /** Paradox */
  SpeciesId.GREAT_TUSK,
  SpeciesId.SCREAM_TAIL,
  SpeciesId.BRUTE_BONNET,
  SpeciesId.FLUTTER_MANE,
  SpeciesId.SLITHER_WING,
  SpeciesId.SANDY_SHOCKS,
  SpeciesId.ROARING_MOON,
  SpeciesId.WALKING_WAKE,
  SpeciesId.GOUGING_FIRE,
  SpeciesId.RAGING_BOLT,
  SpeciesId.IRON_TREADS,
  SpeciesId.IRON_BUNDLE,
  SpeciesId.IRON_HANDS,
  SpeciesId.IRON_JUGULIS,
  SpeciesId.IRON_MOTH,
  SpeciesId.IRON_THORNS,
  SpeciesId.IRON_VALIANT,
  SpeciesId.IRON_LEAVES,
  SpeciesId.IRON_BOULDER,
  SpeciesId.IRON_CROWN,
  /** These are banned so they don't appear in the < 570 BST pool */
  SpeciesId.PHIONE,
  SpeciesId.TYPE_NULL,
  SpeciesId.COSMOG,
  SpeciesId.COSMOEM,
  SpeciesId.MELTAN,
  SpeciesId.KUBFU,
  SpeciesId.URSHIFU,
  SpeciesId.CALYREX,
  SpeciesId.OGERPON,
  SpeciesId.OKIDOGI,
  SpeciesId.MUNKIDORI,
  SpeciesId.FEZANDIPITI,
  SpeciesId.TERAPAGOS,
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
export const WeirdDreamEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.WEIRD_DREAM,
)
  .withEncounterTier(MysteryEncounterTier.ROGUE)
  .withDisallowedChallenges(Challenges.SINGLE_TYPE, Challenges.SINGLE_GENERATION)
  // TODO: should reset minimum wave to 10 when there are more Rogue tiers in pool. Matching Dark Deal minimum for now.
  .withSceneWaveRangeRequirement(30, 140)
  .withIntroSpriteConfigs([
    {
      spriteKey: "weird_dream_woman",
      fileRoot: "mystery-encounters",
      hasShadow: true,
      y: 11,
      yShadow: 6,
      x: 4,
    },
  ])
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
    {
      speaker: `${namespace}:speaker`,
      text: `${namespace}:introDialogue`,
    },
  ])
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOnInit(() => {
    globalScene.loadBgm("mystery_encounter_weird_dream", "mystery_encounter_weird_dream.mp3");

    // Calculate all the newly transformed Pokemon and begin asset load
    const teamTransformations = getTeamTransformations();
    const loadAssets = teamTransformations.map(t => (t.newPokemon as PlayerPokemon).loadAssets());
    globalScene.currentBattle.mysteryEncounter!.misc = {
      teamTransformations,
      loadAssets,
    };

    return true;
  })
  .withOnVisualsStart(() => {
    globalScene.fadeAndSwitchBgm("mystery_encounter_weird_dream");
    return true;
  })
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withHasDexProgress(true)
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
        // Play the animation as the player goes through the dialogue
        globalScene.time.delayedCall(1000, () => {
          doShowDreamBackground();
        });

        for (const transformation of globalScene.currentBattle.mysteryEncounter!.misc.teamTransformations) {
          globalScene.removePokemonFromPlayerParty(transformation.previousPokemon, false);
          globalScene.getPlayerParty().push(transformation.newPokemon);
        }
      })
      .withOptionPhase(async () => {
        // Starts cutscene dialogue, but does not await so that cutscene plays as player goes through dialogue
        const cutsceneDialoguePromise = showEncounterText(`${namespace}:option.1.cutscene`);

        // Change the entire player's party
        // Wait for all new Pokemon assets to be loaded before showing transformation animations
        await Promise.all(globalScene.currentBattle.mysteryEncounter!.misc.loadAssets);
        const transformations = globalScene.currentBattle.mysteryEncounter!.misc.teamTransformations;

        // If there are 1-3 transformations, do them centered back to back
        // Otherwise, the first 3 transformations are executed side-by-side, then any remaining 1-3 transformations occur in those same respective positions
        if (transformations.length <= 3) {
          for (const transformation of transformations) {
            const pokemon1 = transformation.previousPokemon;
            const pokemon2 = transformation.newPokemon;

            await doPokemonTransformationSequence(pokemon1, pokemon2, TransformationScreenPosition.CENTER);
          }
        } else {
          await doSideBySideTransformations(transformations);
        }

        // Make sure player has finished cutscene dialogue
        await cutsceneDialoguePromise;

        doHideDreamBackground();
        await showEncounterText(`${namespace}:option.1.dreamComplete`);

        await doNewTeamPostProcess(transformations);
        globalScene.phaseManager.unshiftNew("PartyHealPhase", true);
        setEncounterRewards({
          guaranteedModifierTypeFuncs: [
            modifierTypes.MEMORY_MUSHROOM,
            modifierTypes.ROGUE_BALL,
            modifierTypes.MINT,
            modifierTypes.MINT,
            modifierTypes.MINT,
            modifierTypes.MINT,
          ],
          fillRemaining: false,
        });
        leaveEncounterWithoutBattle(false);
      })
      .build(),
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
    async () => {
      // Battle your "future" team for some item rewards
      const transformations: PokemonTransformation[] =
        globalScene.currentBattle.mysteryEncounter!.misc.teamTransformations;

      // Uses the pokemon that player's party would have transformed into
      const enemyPokemonConfigs: EnemyPokemonConfig[] = [];
      for (const transformation of transformations) {
        const newPokemon = transformation.newPokemon;
        const previousPokemon = transformation.previousPokemon;

        await postProcessTransformedPokemon(previousPokemon, newPokemon, newPokemon.species.getRootSpeciesId(), true);

        const dataSource = new PokemonData(newPokemon);
        dataSource.player = false;

        // Copy held items to new pokemon
        const newPokemonHeldItemConfigs: HeldModifierConfig[] = [];
        for (const item of transformation.heldItems) {
          newPokemonHeldItemConfigs.push({
            modifier: item.clone() as PokemonHeldItemModifier,
            stackCount: item.getStackCount(),
            isTransferable: false,
          });
        }
        // Any pokemon that is below 570 BST gets +20 permanent BST to 3 stats
        if (shouldGetOldGateau(newPokemon)) {
          newPokemonHeldItemConfigs.push({
            modifier: generateModifierType(modifierTypes.MYSTERY_ENCOUNTER_OLD_GATEAU) as PokemonHeldItemModifierType,
            stackCount: 1,
            isTransferable: false,
          });
        }

        const enemyConfig: EnemyPokemonConfig = {
          species: transformation.newSpecies,
          isBoss: newPokemon.getSpeciesForm().getBaseStatTotal() > NON_LEGENDARY_BST_THRESHOLD,
          level: previousPokemon.level,
          dataSource,
          modifierConfigs: newPokemonHeldItemConfigs,
        };

        enemyPokemonConfigs.push(enemyConfig);
      }

      const genderIndex = globalScene.gameData.gender ?? PlayerGender.UNSET;
      const trainerConfig =
        trainerConfigs[
          genderIndex === PlayerGender.FEMALE ? TrainerType.FUTURE_SELF_F : TrainerType.FUTURE_SELF_M
        ].clone();
      trainerConfig.setPartyTemplates(new TrainerPartyTemplate(transformations.length, PartyMemberStrength.STRONG));
      const enemyPartyConfig: EnemyPartyConfig = {
        trainerConfig,
        pokemonConfigs: enemyPokemonConfigs,
        female: genderIndex === PlayerGender.FEMALE,
      };

      const onBeforeRewards = () => {
        // Before battle rewards, unlock the passive on a pokemon in the player's team for the rest of the run (not permanently)
        // One random pokemon will get its passive unlocked
        const passiveDisabledPokemon = globalScene.getPlayerParty().filter(p => !p.passive);
        if (passiveDisabledPokemon?.length > 0) {
          // TODO: should this use `randSeedItem`?
          const enablePassiveMon = passiveDisabledPokemon[randSeedInt(passiveDisabledPokemon.length)];
          enablePassiveMon.passive = true;
          enablePassiveMon.updateInfo(true);
        }
      };

      setEncounterRewards(
        {
          guaranteedModifierTiers: [
            ModifierTier.ROGUE,
            ModifierTier.ROGUE,
            ModifierTier.ULTRA,
            ModifierTier.ULTRA,
            ModifierTier.GREAT,
            ModifierTier.GREAT,
          ],
          fillRemaining: false,
        },
        undefined,
        onBeforeRewards,
      );

      await showEncounterText(`${namespace}:option.2.selected2`, null, undefined, true);
      await initBattleWithEnemyConfig(enemyPartyConfig);
    },
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
    async () => {
      // Leave, reduce party levels by 10%
      for (const pokemon of globalScene.getPlayerParty()) {
        pokemon.level = Math.max(Math.ceil(((100 - PERCENT_LEVEL_LOSS_ON_REFUSE) / 100) * pokemon.level), 1);
        pokemon.exp = getLevelTotalExp(pokemon.level, pokemon.species.growthRate);
        pokemon.levelExp = 0;

        pokemon.calculateStats();
        pokemon.getBattleInfo().setLevel(pokemon.level);
        await pokemon.updateInfo();
      }

      leaveEncounterWithoutBattle(true);
      return true;
    },
  )
  .build();

interface PokemonTransformation {
  previousPokemon: PlayerPokemon;
  newSpecies: PokemonSpecies;
  newPokemon: PlayerPokemon;
  heldItems: PokemonHeldItemModifier[];
}

function getTeamTransformations(): PokemonTransformation[] {
  const party = globalScene.getPlayerParty();
  // Removes all pokemon from the party
  const alreadyUsedSpecies: PokemonSpecies[] = party.map(p => p.species);
  const pokemonTransformations: PokemonTransformation[] = party.map(p => {
    return {
      previousPokemon: p,
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
    pokemonTransformations[index].heldItems = removed
      .getHeldItems()
      .filter(m => !(m instanceof PokemonFormChangeItemModifier));

    const bst = removed.getSpeciesForm().getBaseStatTotal();
    let newBstRange: [number, number];
    if (i < 2) {
      newBstRange = HIGH_BST_TRANSFORM_BASE_VALUES;
    } else {
      newBstRange = STANDARD_BST_TRANSFORM_BASE_VALUES;
    }

    const newSpecies = getTransformedSpecies(
      bst,
      newBstRange,
      hasPokemonInSuperLegendaryBstThreshold,
      hasPokemonInLegendaryBstThreshold,
      alreadyUsedSpecies,
    );

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
    transformation.newPokemon = globalScene.addPlayerPokemon(
      transformation.newSpecies,
      transformation.previousPokemon.level,
      newAbilityIndex,
      undefined,
    );

    transformation.newPokemon.teraType = randSeedInt(MAX_POKEMON_TYPE);
  }

  return pokemonTransformations;
}

async function doNewTeamPostProcess(transformations: PokemonTransformation[]) {
  let atLeastOneNewStarter = false;
  for (const transformation of transformations) {
    const previousPokemon = transformation.previousPokemon;
    const oldHpRatio = previousPokemon.getHpRatio(true);
    const oldStatus = previousPokemon.status;
    const newPokemon = transformation.newPokemon;
    const speciesRootForm = newPokemon.species.getRootSpeciesId();

    if (await postProcessTransformedPokemon(previousPokemon, newPokemon, speciesRootForm)) {
      atLeastOneNewStarter = true;
    }

    // Copy old items to new pokemon
    for (const item of transformation.heldItems) {
      item.pokemonId = newPokemon.id;
      globalScene.addModifier(item, false, false, false, true);
    }
    // Any pokemon that is below 570 BST gets +20 permanent BST to 3 stats
    if (shouldGetOldGateau(newPokemon)) {
      const modType = modifierTypes.MYSTERY_ENCOUNTER_OLD_GATEAU();
      const modifier = modType?.newModifier(newPokemon);
      if (modifier) {
        globalScene.addModifier(modifier, false, false, false, true);
      }
    }

    newPokemon.calculateStats();
    if (oldHpRatio > 0) {
      newPokemon.hp = Math.ceil(oldHpRatio * newPokemon.getMaxHp());
      // Assume that the `status` instance can always safely be transferred to the new pokemon
      // This is the case (as of version 1.10.4)
      // Safeguard against COMATOSE here
      if (!newPokemon.hasAbility(AbilityId.COMATOSE, false, true)) {
        newPokemon.status = oldStatus;
      }
    } else {
      newPokemon.hp = 0;
      newPokemon.doSetStatus(StatusEffect.FAINT);
    }

    await newPokemon.updateInfo();
  }

  // One random pokemon will get its passive unlocked
  const passiveDisabledPokemon = globalScene.getPlayerParty().filter(p => !p.passive);
  if (passiveDisabledPokemon?.length > 0) {
    // TODO: should this use `randSeedItem`?
    const enablePassiveMon = passiveDisabledPokemon[randSeedInt(passiveDisabledPokemon.length)];
    enablePassiveMon.passive = true;
    await enablePassiveMon.updateInfo(true);
  }

  // If at least one new starter was unlocked, play 1 fanfare
  if (atLeastOneNewStarter) {
    globalScene.playSound("level_up_fanfare");
  }
}

/**
 * Applies special changes to the newly transformed pokemon, such as passing previous moves, gaining egg moves, etc.
 * Returns whether the transformed pokemon unlocks a new starter for the player.
 * @param previousPokemon
 * @param newPokemon
 * @param speciesRootForm
 * @param forBattle Default `false`. If false, will perform achievements and dex unlocks for the player.
 */
async function postProcessTransformedPokemon(
  previousPokemon: PlayerPokemon,
  newPokemon: PlayerPokemon,
  speciesRootForm: SpeciesId,
  forBattle = false,
): Promise<boolean> {
  let isNewStarter = false;
  // Roll HA a second time
  if (newPokemon.species.abilityHidden) {
    const hiddenIndex = newPokemon.species.ability2 ? 2 : 1;
    if (newPokemon.abilityIndex < hiddenIndex) {
      const hiddenAbilityChance = new NumberHolder(256);
      globalScene.applyModifiers(HiddenAbilityRateBoosterModifier, true, hiddenAbilityChance);

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
  if (
    !forBattle
    && (newPokemon.getSpeciesForm().getBaseStatTotal() <= NON_LEGENDARY_BST_THRESHOLD || newPokemon.isShiny())
  ) {
    if (
      newPokemon.getSpeciesForm().abilityHidden
      && newPokemon.abilityIndex === newPokemon.getSpeciesForm().getAbilityCount() - 1
    ) {
      globalScene.validateAchv(achvs.HIDDEN_ABILITY);
    }

    if (newPokemon.species.subLegendary) {
      globalScene.validateAchv(achvs.CATCH_SUB_LEGENDARY);
    }

    if (newPokemon.species.legendary) {
      globalScene.validateAchv(achvs.CATCH_LEGENDARY);
    }

    if (newPokemon.species.mythical) {
      globalScene.validateAchv(achvs.CATCH_MYTHICAL);
    }

    globalScene.gameData.updateSpeciesDexIvs(newPokemon.species.getRootSpeciesId(true), newPokemon.ivs);
    const newStarterUnlocked = await globalScene.gameData.setPokemonCaught(newPokemon, true, false, false);
    if (newStarterUnlocked) {
      isNewStarter = true;
      await showEncounterText(
        i18next.t("battle:addedAsAStarter", {
          pokemonName: getPokemonSpecies(speciesRootForm).getName(),
        }),
      );
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
  if (!forBattle && !!globalScene.gameData.dexData[speciesRootForm].caughtAttr) {
    globalScene.gameData.addStarterCandy(getPokemonSpecies(speciesRootForm), 1);
  }

  // Set the moveset of the new pokemon to be the same as previous, but with 1 egg move and 1 (attempted) STAB move of the new species
  newPokemon.generateAndPopulateMoveset();
  // Store a copy of a "standard" generated moveset for the new pokemon, will be used later for finding a favored move
  const newPokemonGeneratedMoveset = newPokemon.moveset;

  newPokemon.moveset = previousPokemon.moveset.slice(0);

  const newEggMoveIndex = await addEggMoveToNewPokemonMoveset(newPokemon, speciesRootForm, forBattle);

  // Try to add a favored STAB move (might fail if Pokemon already knows a bunch of moves from newPokemonGeneratedMoveset)
  addFavoredMoveToNewPokemonMoveset(newPokemon, newPokemonGeneratedMoveset, newEggMoveIndex);

  // Randomize the second type of the pokemon
  // If the pokemon does not normally have a second type, it will gain 1
  const newTypes = [PokemonType.UNKNOWN];
  let newType = randSeedInt(18) as PokemonType;
  while (newType === newTypes[0]) {
    newType = randSeedInt(18) as PokemonType;
  }
  newTypes.push(newType);
  newPokemon.customPokemonData.types = newTypes;

  // Enable passive if previous had it
  newPokemon.passive = previousPokemon.passive;

  return isNewStarter;
}

/**
 * @returns `true` if a given Pokemon has valid BST to be given an Old Gateau
 */
function shouldGetOldGateau(pokemon: Pokemon): boolean {
  return pokemon.getSpeciesForm().getBaseStatTotal() < NON_LEGENDARY_BST_THRESHOLD;
}

function getTransformedSpecies(
  originalBst: number,
  bstSearchRange: [number, number],
  hasPokemonBstHigherThan600: boolean,
  hasPokemonBstBetween570And600: boolean,
  alreadyUsedSpecies: PokemonSpecies[],
): PokemonSpecies {
  let newSpecies: PokemonSpecies | undefined;
  while (isNullOrUndefined(newSpecies)) {
    const bstCap = originalBst + bstSearchRange[1];
    const bstMin = Math.max(originalBst + bstSearchRange[0], 0);

    // Get any/all species that fall within the Bst range requirements
    let validSpecies = allSpecies.filter(s => {
      const speciesBst = s.getBaseStatTotal();
      const bstInRange = speciesBst >= bstMin && speciesBst <= bstCap;
      // Checks that a Pokemon has not already been added in the +600 or 570-600 slots;
      const validBst =
        (!hasPokemonBstBetween570And600
          || speciesBst < NON_LEGENDARY_BST_THRESHOLD
          || speciesBst > SUPER_LEGENDARY_BST_THRESHOLD)
        && (!hasPokemonBstHigherThan600 || speciesBst <= SUPER_LEGENDARY_BST_THRESHOLD);
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

function doShowDreamBackground() {
  const transformationContainer = globalScene.add.container(0, -globalScene.scaledCanvas.height);
  transformationContainer.name = "Dream Background";

  // In case it takes a bit for video to load
  const transformationStaticBg = globalScene.add.rectangle(
    0,
    0,
    globalScene.scaledCanvas.width,
    globalScene.scaledCanvas.height,
    0,
  );
  transformationStaticBg.setName("Black Background");
  transformationStaticBg.setOrigin(0, 0);
  transformationContainer.add(transformationStaticBg);
  transformationStaticBg.setVisible(true);

  const transformationVideoBg: Phaser.GameObjects.Video = globalScene.add.video(0, 0, "evo_bg").stop();
  transformationVideoBg.setLoop(true);
  transformationVideoBg.setOrigin(0, 0);
  transformationVideoBg.setScale(0.4359673025);
  transformationContainer.add(transformationVideoBg);

  globalScene.fieldUI.add(transformationContainer);
  globalScene.fieldUI.bringToTop(transformationContainer);
  transformationVideoBg.play();

  transformationContainer.setVisible(true);
  transformationContainer.alpha = 0;

  globalScene.tweens.add({
    targets: transformationContainer,
    alpha: 1,
    duration: 3000,
    ease: "Sine.easeInOut",
  });
}

function doHideDreamBackground() {
  const transformationContainer = globalScene.fieldUI.getByName("Dream Background");

  globalScene.tweens.add({
    targets: transformationContainer,
    alpha: 0,
    duration: 3000,
    ease: "Sine.easeInOut",
    onComplete: () => {
      globalScene.fieldUI.remove(transformationContainer, true);
    },
  });
}

function doSideBySideTransformations(transformations: PokemonTransformation[]) {
  return new Promise<void>(resolve => {
    const allTransformationPromises: Promise<void>[] = [];
    for (let i = 0; i < 3; i++) {
      const delay = i * 4000;
      globalScene.time.delayedCall(delay, () => {
        const transformation = transformations[i];
        const pokemon1 = transformation.previousPokemon;
        const pokemon2 = transformation.newPokemon;
        const screenPosition = i as TransformationScreenPosition;

        const transformationPromise = doPokemonTransformationSequence(pokemon1, pokemon2, screenPosition).then(() => {
          if (transformations.length > i + 3) {
            const nextTransformationAtPosition = transformations[i + 3];
            const nextPokemon1 = nextTransformationAtPosition.previousPokemon;
            const nextPokemon2 = nextTransformationAtPosition.newPokemon;

            allTransformationPromises.push(doPokemonTransformationSequence(nextPokemon1, nextPokemon2, screenPosition));
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
 * @param newPokemon
 * @param speciesRootForm
 */
async function addEggMoveToNewPokemonMoveset(
  newPokemon: PlayerPokemon,
  speciesRootForm: SpeciesId,
  forBattle = false,
): Promise<number | null> {
  let eggMoveIndex: null | number = null;
  const eggMoves = newPokemon.getEggMoves()?.slice(0);
  if (eggMoves) {
    const eggMoveIndices = randSeedShuffle([0, 1, 2, 3]);
    let randomEggMoveIndex = eggMoveIndices.pop();
    let randomEggMove = !isNullOrUndefined(randomEggMoveIndex) ? eggMoves[randomEggMoveIndex] : null;
    let retries = 0;
    while (retries < 3 && (!randomEggMove || newPokemon.moveset.some(m => m.moveId === randomEggMove))) {
      // If Pokemon already knows this move, roll for another egg move
      randomEggMoveIndex = eggMoveIndices.pop();
      randomEggMove = !isNullOrUndefined(randomEggMoveIndex) ? eggMoves[randomEggMoveIndex] : null;
      retries++;
    }

    if (randomEggMove) {
      if (!newPokemon.moveset.some(m => m.moveId === randomEggMove)) {
        if (newPokemon.moveset.length < 4) {
          newPokemon.moveset.push(new PokemonMove(randomEggMove));
        } else {
          eggMoveIndex = randSeedInt(4);
          newPokemon.moveset[eggMoveIndex] = new PokemonMove(randomEggMove);
        }
      }

      // For pokemon that the player owns (including ones just caught), unlock the egg move
      if (
        !forBattle
        && !isNullOrUndefined(randomEggMoveIndex)
        && !!globalScene.gameData.dexData[speciesRootForm].caughtAttr
      ) {
        await globalScene.gameData.setEggMoveUnlocked(getPokemonSpecies(speciesRootForm), randomEggMoveIndex, true);
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
function addFavoredMoveToNewPokemonMoveset(
  newPokemon: PlayerPokemon,
  newPokemonGeneratedMoveset: PokemonMove[],
  newEggMoveIndex: number | null,
) {
  let favoredMove: PokemonMove | null = null;
  for (const move of newPokemonGeneratedMoveset) {
    // Needs to match first type, second type will be replaced
    if (move?.getMove().type === newPokemon.getTypes()[0] && !newPokemon.moveset.some(m => m.moveId === move.moveId)) {
      favoredMove = move;
      break;
    }
  }
  // If was unable to find a favored move, uses first move in moveset that isn't already known (typically a high power STAB move)
  // Otherwise, it gains no favored move
  if (!favoredMove) {
    for (const move of newPokemonGeneratedMoveset) {
      // Needs to match first type, second type will be replaced
      if (!newPokemon.moveset.some(m => m.moveId === move.moveId)) {
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
