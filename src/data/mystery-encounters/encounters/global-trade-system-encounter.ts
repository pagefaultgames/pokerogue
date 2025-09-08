import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { allSpecies } from "#data/data-lists";
import { Gender, getGenderSymbol } from "#data/gender";
import { getNatureName } from "#data/nature";
import { getPokeballAtlasKey, getPokeballTintColor } from "#data/pokeball";
import type { PokemonSpecies } from "#data/pokemon-species";
import { getTypeRgb } from "#data/type";
import { ModifierPoolType } from "#enums/modifier-pool-type";
import { ModifierTier } from "#enums/modifier-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import { doShinySparkleAnim } from "#field/anims";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import { EnemyPokemon } from "#field/pokemon";
import type { PokemonHeldItemModifier } from "#modifiers/modifier";
import {
  HiddenAbilityRateBoosterModifier,
  PokemonFormChangeItemModifier,
  ShinyRateBoosterModifier,
  SpeciesStatBoosterModifier,
} from "#modifiers/modifier";
import type { ModifierTypeOption } from "#modifiers/modifier-type";
import { getPlayerModifierTypeOptions, regenerateModifierPoolThresholds } from "#modifiers/modifier-type";
import { PokemonMove } from "#moves/pokemon-move";
import { getEncounterText, showEncounterText } from "#mystery-encounters/encounter-dialogue-utils";
import {
  leaveEncounterWithoutBattle,
  selectPokemonForOption,
  setEncounterRewards,
} from "#mystery-encounters/encounter-phase-utils";
import { addPokemonDataToDexAndValidateAchievements } from "#mystery-encounters/encounter-pokemon-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import { PartySizeRequirement } from "#mystery-encounters/mystery-encounter-requirements";
import { PokemonData } from "#system/pokemon-data";
import { MusicPreference } from "#system/settings";
import type { OptionSelectItem } from "#ui/handlers/abstract-option-select-ui-handler";
import { isNullOrUndefined, NumberHolder, randInt, randSeedInt, randSeedItem, randSeedShuffle } from "#utils/common";
import { getEnumKeys } from "#utils/enums";
import { getRandomLocaleEntry } from "#utils/i18n";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounters/globalTradeSystem";

/** Base shiny chance of 512/65536 -> 1/128 odds, affected by events and Shiny Charms. Cannot exceed 1/16 odds. */
const WONDER_TRADE_SHINY_CHANCE = 512;
/** Max shiny chance of 4096/65536 -> 1/16 odds. */
const MAX_WONDER_TRADE_SHINY_CHANCE = 4096;

const LEGENDARY_TRADE_POOLS = {
  1: [SpeciesId.RATTATA, SpeciesId.PIDGEY, SpeciesId.WEEDLE],
  2: [SpeciesId.SENTRET, SpeciesId.HOOTHOOT, SpeciesId.LEDYBA],
  3: [SpeciesId.POOCHYENA, SpeciesId.ZIGZAGOON, SpeciesId.TAILLOW],
  4: [SpeciesId.BIDOOF, SpeciesId.STARLY, SpeciesId.KRICKETOT],
  5: [SpeciesId.PATRAT, SpeciesId.PURRLOIN, SpeciesId.PIDOVE],
  6: [SpeciesId.BUNNELBY, SpeciesId.LITLEO, SpeciesId.SCATTERBUG],
  7: [SpeciesId.PIKIPEK, SpeciesId.YUNGOOS, SpeciesId.ROCKRUFF],
  8: [SpeciesId.SKWOVET, SpeciesId.WOOLOO, SpeciesId.ROOKIDEE],
  9: [SpeciesId.LECHONK, SpeciesId.FIDOUGH, SpeciesId.TAROUNTULA],
};

/** Exclude Paradox mons as they aren't considered legendary/mythical */
const EXCLUDED_TRADE_SPECIES = [
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
];

/**
 * Global Trade System encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3812 | GitHub Issue #3812}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const GlobalTradeSystemEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.GLOBAL_TRADE_SYSTEM,
)
  .withEncounterTier(MysteryEncounterTier.COMMON)
  .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
  .withAutoHideIntroVisuals(false)
  .withIntroSpriteConfigs([
    {
      spriteKey: "global_trade_system",
      fileRoot: "mystery-encounters",
      hasShadow: true,
      disableAnimation: true,
      x: 3,
      y: 5,
      yShadow: 1,
    },
  ])
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

    // Load bgm
    let bgmKey: string;
    if (globalScene.musicPreference === MusicPreference.GENFIVE) {
      bgmKey = "mystery_encounter_gen_5_gts";
      globalScene.loadBgm(bgmKey, `${bgmKey}.mp3`);
    } else {
      // Mixed option
      bgmKey = "mystery_encounter_gen_6_gts";
      globalScene.loadBgm(bgmKey, `${bgmKey}.mp3`);
    }

    // Load possible trade options
    // Maps current party member's id to 3 EnemyPokemon objects
    // None of the trade options can be the same species
    const tradeOptionsMap: Map<number, EnemyPokemon[]> = getPokemonTradeOptions();
    encounter.misc = {
      tradeOptionsMap,
      bgmKey,
    };

    return true;
  })
  .withOnVisualsStart(() => {
    globalScene.fadeAndSwitchBgm(globalScene.currentBattle.mysteryEncounter!.misc.bgmKey);
    return true;
  })
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
      .withSceneRequirement(new PartySizeRequirement([2, 6], true)) // Requires 2 valid party members
      .withHasDexProgress(true)
      .withDialogue({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        secondOptionPrompt: `${namespace}:option.1.tradeOptionsPrompt`,
      })
      .withPreOptionPhase(async (): Promise<boolean> => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          // Get the trade species options for the selected pokemon
          const tradeOptionsMap: Map<number, EnemyPokemon[]> = encounter.misc.tradeOptionsMap;
          const tradeOptions = tradeOptionsMap.get(pokemon.id);
          if (!tradeOptions) {
            return [];
          }

          return tradeOptions.map((tradePokemon: EnemyPokemon) => {
            const option: OptionSelectItem = {
              label: tradePokemon.getNameToRender(),
              handler: () => {
                // Pokemon trade selected
                encounter.setDialogueToken("tradedPokemon", pokemon.getNameToRender());
                encounter.setDialogueToken("received", tradePokemon.getNameToRender());
                encounter.misc.tradedPokemon = pokemon;
                encounter.misc.receivedPokemon = tradePokemon;
                return true;
              },
              onHover: () => {
                const formName =
                  tradePokemon.species.forms && tradePokemon.species.forms.length > tradePokemon.formIndex
                    ? tradePokemon.species.forms[tradePokemon.formIndex].formName
                    : null;
                const line1 = `${i18next.t("pokemonInfoContainer:ability")} ${tradePokemon.getAbility().name}${
                  tradePokemon.getGender() !== Gender.GENDERLESS
                    ? `     |     ${i18next.t("pokemonInfoContainer:gender")} ${getGenderSymbol(tradePokemon.getGender())}`
                    : ""
                }`;
                const line2 =
                  i18next.t("pokemonInfoContainer:nature")
                  + " "
                  + getNatureName(tradePokemon.getNature())
                  + (formName ? `     |     ${i18next.t("pokemonInfoContainer:form")} ${formName}` : "");
                showEncounterText(`${line1}\n${line2}`, 0, 0, false);
              },
            };
            return option;
          });
        };

        return selectPokemonForOption(onPokemonSelected);
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const tradedPokemon: PlayerPokemon = encounter.misc.tradedPokemon;
        const receivedPokemonData: EnemyPokemon = encounter.misc.receivedPokemon;
        const modifiers = tradedPokemon
          .getHeldItems()
          .filter(m => !(m instanceof PokemonFormChangeItemModifier) && !(m instanceof SpeciesStatBoosterModifier));

        // Generate a trainer name
        const traderName = generateRandomTraderName();
        encounter.setDialogueToken("tradeTrainerName", traderName.trim());

        // Remove the original party member from party
        globalScene.removePokemonFromPlayerParty(tradedPokemon, false);

        // Set data properly, then generate the new Pokemon's assets
        receivedPokemonData.passive = tradedPokemon.passive;
        // Pokeball to Ultra ball, randomly
        receivedPokemonData.pokeball = randInt(4) as PokeballType;
        const dataSource = new PokemonData(receivedPokemonData);
        const newPlayerPokemon = globalScene.addPlayerPokemon(
          receivedPokemonData.species,
          receivedPokemonData.level,
          dataSource.abilityIndex,
          dataSource.formIndex,
          dataSource.gender,
          dataSource.shiny,
          dataSource.variant,
          dataSource.ivs,
          dataSource.nature,
          dataSource,
        );
        globalScene.getPlayerParty().push(newPlayerPokemon);
        await newPlayerPokemon.loadAssets();

        for (const mod of modifiers) {
          mod.pokemonId = newPlayerPokemon.id;
          globalScene.addModifier(mod, true, false, false, true);
        }

        // Show the trade animation
        await showTradeBackground();
        await doPokemonTradeSequence(tradedPokemon, newPlayerPokemon);
        await showEncounterText(`${namespace}:tradeReceived`, null, 0, true, 4000);
        globalScene.playBgm(encounter.misc.bgmKey);
        await addPokemonDataToDexAndValidateAchievements(newPlayerPokemon);
        await hideTradeBackground();
        tradedPokemon.destroy();

        leaveEncounterWithoutBattle(true);
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
      .withSceneRequirement(new PartySizeRequirement([2, 6], true)) // Requires 2 valid party members
      .withHasDexProgress(true)
      .withDialogue({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
      })
      .withPreOptionPhase(async (): Promise<boolean> => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          // Randomly generate a Wonder Trade pokemon
          const randomTradeOption = generateTradeOption(globalScene.getPlayerParty().map(p => p.species));
          const tradePokemon = new EnemyPokemon(randomTradeOption, pokemon.level, TrainerSlot.NONE, false);
          // Extra shiny roll at 1/128 odds (boosted by events and charms)
          if (!tradePokemon.shiny) {
            const shinyThreshold = new NumberHolder(WONDER_TRADE_SHINY_CHANCE);
            if (timedEventManager.isEventActive()) {
              shinyThreshold.value *= timedEventManager.getShinyMultiplier();
            }
            globalScene.applyModifiers(ShinyRateBoosterModifier, true, shinyThreshold);

            // Base shiny chance of 512/65536 -> 1/128, affected by events and Shiny Charms
            // Maximum shiny chance of 4096/65536 -> 1/16, cannot improve further after that
            const shinyChance = Math.min(shinyThreshold.value, MAX_WONDER_TRADE_SHINY_CHANCE);

            tradePokemon.trySetShinySeed(shinyChance, false);
          }

          // Extra HA roll at base 1/64 odds (boosted by events and charms)
          const hiddenIndex = tradePokemon.species.ability2 ? 2 : 1;
          if (tradePokemon.species.abilityHidden && tradePokemon.abilityIndex < hiddenIndex) {
            const hiddenAbilityChance = new NumberHolder(64);
            globalScene.applyModifiers(HiddenAbilityRateBoosterModifier, true, hiddenAbilityChance);

            const hasHiddenAbility = !randSeedInt(hiddenAbilityChance.value);

            if (hasHiddenAbility) {
              tradePokemon.abilityIndex = hiddenIndex;
            }
          }

          // If Pokemon is still not shiny or with HA, give the Pokemon a random Common egg move in its moveset
          if (!tradePokemon.shiny && (!tradePokemon.species.abilityHidden || tradePokemon.abilityIndex < hiddenIndex)) {
            const eggMoves = tradePokemon.getEggMoves();
            if (eggMoves) {
              // Cannot gen the rare egg move, only 1 of the first 3 common moves
              const eggMove = eggMoves[randSeedInt(3)];
              if (!tradePokemon.moveset.some(m => m.moveId === eggMove)) {
                if (tradePokemon.moveset.length < 4) {
                  tradePokemon.moveset.push(new PokemonMove(eggMove));
                } else {
                  const eggMoveIndex = randSeedInt(4);
                  tradePokemon.moveset[eggMoveIndex] = new PokemonMove(eggMove);
                }
              }
            }
          }

          encounter.setDialogueToken("tradedPokemon", pokemon.getNameToRender());
          encounter.setDialogueToken("received", tradePokemon.getNameToRender());
          encounter.misc.tradedPokemon = pokemon;
          encounter.misc.receivedPokemon = tradePokemon;
        };

        return selectPokemonForOption(onPokemonSelected);
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const tradedPokemon: PlayerPokemon = encounter.misc.tradedPokemon;
        const receivedPokemonData: EnemyPokemon = encounter.misc.receivedPokemon;
        const modifiers = tradedPokemon
          .getHeldItems()
          .filter(m => !(m instanceof PokemonFormChangeItemModifier) && !(m instanceof SpeciesStatBoosterModifier));

        // Generate a trainer name
        const traderName = generateRandomTraderName();
        encounter.setDialogueToken("tradeTrainerName", traderName.trim());

        // Remove the original party member from party
        globalScene.removePokemonFromPlayerParty(tradedPokemon, false);

        // Set data properly, then generate the new Pokemon's assets
        receivedPokemonData.passive = tradedPokemon.passive;
        receivedPokemonData.pokeball = randInt(4) as PokeballType;
        const dataSource = new PokemonData(receivedPokemonData);
        const newPlayerPokemon = globalScene.addPlayerPokemon(
          receivedPokemonData.species,
          receivedPokemonData.level,
          dataSource.abilityIndex,
          dataSource.formIndex,
          dataSource.gender,
          dataSource.shiny,
          dataSource.variant,
          dataSource.ivs,
          dataSource.nature,
          dataSource,
        );
        globalScene.getPlayerParty().push(newPlayerPokemon);
        await newPlayerPokemon.loadAssets();

        for (const mod of modifiers) {
          mod.pokemonId = newPlayerPokemon.id;
          globalScene.addModifier(mod, true, false, false, true);
        }

        // Show the trade animation
        await showTradeBackground();
        await doPokemonTradeSequence(tradedPokemon, newPlayerPokemon);
        await showEncounterText(`${namespace}:tradeReceived`, null, 0, true, 4000);
        globalScene.playBgm(encounter.misc.bgmKey);
        await addPokemonDataToDexAndValidateAchievements(newPlayerPokemon);
        await hideTradeBackground();
        tradedPokemon.destroy();

        leaveEncounterWithoutBattle(true);
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        secondOptionPrompt: `${namespace}:option.3.tradeOptionsPrompt`,
      })
      .withPreOptionPhase(async (): Promise<boolean> => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          // Get Pokemon held items and filter for valid ones
          const validItems = pokemon.getHeldItems().filter(it => {
            return it.isTransferable;
          });

          return validItems.map((modifier: PokemonHeldItemModifier) => {
            const option: OptionSelectItem = {
              label: modifier.type.name,
              handler: () => {
                // Pokemon and item selected
                encounter.setDialogueToken("chosenItem", modifier.type.name);
                encounter.misc.chosenModifier = modifier;
                encounter.misc.chosenPokemon = pokemon;
                return true;
              },
            };
            return option;
          });
        };

        const selectableFilter = (pokemon: Pokemon) => {
          // If pokemon has items to trade
          const meetsReqs =
            pokemon.getHeldItems().filter(it => {
              return it.isTransferable;
            }).length > 0;
          if (!meetsReqs) {
            return getEncounterText(`${namespace}:option.3.invalidSelection`) ?? null;
          }

          return null;
        };

        return selectPokemonForOption(onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const modifier = encounter.misc.chosenModifier as PokemonHeldItemModifier;
        const party = globalScene.getPlayerParty();
        const chosenPokemon: PlayerPokemon = encounter.misc.chosenPokemon;

        // Check tier of the traded item, the received item will be one tier up
        const type = modifier.type.withTierFromPool(ModifierPoolType.PLAYER, party);
        let tier = type.tier ?? ModifierTier.GREAT;
        // Eggs and White Herb are not in the pool
        if (type.id === "WHITE_HERB") {
          tier = ModifierTier.GREAT;
        } else if (type.id === "LUCKY_EGG") {
          tier = ModifierTier.ULTRA;
        } else if (type.id === "GOLDEN_EGG") {
          tier = ModifierTier.ROGUE;
        }
        // Increment tier by 1
        if (tier < ModifierTier.MASTER) {
          tier++;
        }

        regenerateModifierPoolThresholds(party, ModifierPoolType.PLAYER, 0);
        let item: ModifierTypeOption | null = null;
        // TMs excluded from possible rewards
        while (!item || item.type.id.includes("TM_")) {
          item = getPlayerModifierTypeOptions(1, party, [], {
            guaranteedModifierTiers: [tier],
            allowLuckUpgrades: false,
          })[0];
        }

        encounter.setDialogueToken("itemName", item.type.name);
        setEncounterRewards({
          guaranteedModifierTypeOptions: [item],
          fillRemaining: false,
        });

        chosenPokemon.loseHeldItem(modifier, false);
        await globalScene.updateModifiers(true, true);

        // Generate a trainer name
        const traderName = generateRandomTraderName();
        encounter.setDialogueToken("tradeTrainerName", traderName.trim());
        await showEncounterText(`${namespace}:itemTradeSelected`);
        leaveEncounterWithoutBattle();
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
      // Leave encounter with no rewards or exp
      leaveEncounterWithoutBattle(true);
      return true;
    },
  )
  .build();

function getPokemonTradeOptions(): Map<number, EnemyPokemon[]> {
  const tradeOptionsMap: Map<number, EnemyPokemon[]> = new Map<number, EnemyPokemon[]>();
  // Starts by filtering out any current party members as valid resulting species
  const alreadyUsedSpecies: PokemonSpecies[] = globalScene.getPlayerParty().map(p => p.species);

  for (const pokemon of globalScene.getPlayerParty()) {
    // If the party member is legendary/mythical, the only trade options available are always pulled from generation-specific legendary trade pools
    if (pokemon.species.legendary || pokemon.species.subLegendary || pokemon.species.mythical) {
      const generation = pokemon.species.generation;
      const tradeOptions: EnemyPokemon[] = LEGENDARY_TRADE_POOLS[generation].map(s => {
        const pokemonSpecies = getPokemonSpecies(s);
        return new EnemyPokemon(pokemonSpecies, 5, TrainerSlot.NONE, false);
      });
      tradeOptionsMap.set(pokemon.id, tradeOptions);
    } else {
      const originalBst = pokemon.getSpeciesForm().getBaseStatTotal();

      const tradeOptions: PokemonSpecies[] = [];
      for (let i = 0; i < 3; i++) {
        const speciesTradeOption = generateTradeOption(alreadyUsedSpecies, originalBst);
        alreadyUsedSpecies.push(speciesTradeOption);
        tradeOptions.push(speciesTradeOption);
      }

      // Add trade options to map
      tradeOptionsMap.set(
        pokemon.id,
        tradeOptions.map(s => {
          return new EnemyPokemon(s, pokemon.level, TrainerSlot.NONE, false);
        }),
      );
    }
  }

  return tradeOptionsMap;
}

function generateTradeOption(alreadyUsedSpecies: PokemonSpecies[], originalBst?: number): PokemonSpecies {
  let newSpecies: PokemonSpecies | undefined;
  let bstCap = 9999;
  let bstMin = 0;
  if (originalBst) {
    bstCap = originalBst + 100;
    bstMin = originalBst - 100;
  }
  while (isNullOrUndefined(newSpecies)) {
    // Get all non-legendary species that fall within the Bst range requirements
    let validSpecies = allSpecies.filter(s => {
      const isLegendaryOrMythical = s.legendary || s.subLegendary || s.mythical;
      const speciesBst = s.getBaseStatTotal();
      const bstInRange = speciesBst >= bstMin && speciesBst <= bstCap;
      return !isLegendaryOrMythical && bstInRange && !EXCLUDED_TRADE_SPECIES.includes(s.speciesId);
    });

    // There must be at least 20 species available before it will choose one
    if (validSpecies?.length > 20) {
      validSpecies = randSeedShuffle(validSpecies);
      newSpecies = validSpecies.pop();
      while (isNullOrUndefined(newSpecies) || alreadyUsedSpecies.includes(newSpecies)) {
        newSpecies = validSpecies.pop();
      }
    } else {
      // Expands search range until at least 20 are in the pool
      bstMin -= 10;
      bstCap += 10;
    }
  }

  return newSpecies!;
}

function showTradeBackground() {
  return new Promise<void>(resolve => {
    const tradeContainer = globalScene.add.container(0, -globalScene.scaledCanvas.height);
    tradeContainer.setName("Trade Background");

    const flyByStaticBg = globalScene.add.rectangle(
      0,
      0,
      globalScene.scaledCanvas.width,
      globalScene.scaledCanvas.height,
      0,
    );
    flyByStaticBg.setName("Black Background");
    flyByStaticBg.setOrigin(0, 0);
    flyByStaticBg.setVisible(false);
    tradeContainer.add(flyByStaticBg);

    const tradeBaseBg = globalScene.add.image(0, 0, "default_bg");
    tradeBaseBg.setName("Trade Background Image");
    tradeBaseBg.setOrigin(0, 0);
    tradeContainer.add(tradeBaseBg);

    globalScene.fieldUI.add(tradeContainer);
    globalScene.fieldUI.bringToTop(tradeContainer);
    tradeContainer.setVisible(true);
    tradeContainer.alpha = 0;

    globalScene.tweens.add({
      targets: tradeContainer,
      alpha: 1,
      duration: 500,
      ease: "Sine.easeInOut",
      onComplete: () => {
        resolve();
      },
    });
  });
}

function hideTradeBackground() {
  return new Promise<void>(resolve => {
    const transformationContainer = globalScene.fieldUI.getByName("Trade Background");

    globalScene.tweens.add({
      targets: transformationContainer,
      alpha: 0,
      duration: 1000,
      ease: "Sine.easeInOut",
      onComplete: () => {
        globalScene.fieldUI.remove(transformationContainer, true);
        resolve();
      },
    });
  });
}

/**
 * Initiates an "evolution-like" animation to transform a previousPokemon (presumably from the player's party) into a new one, not necessarily an evolution species.
 * @param tradedPokemon
 * @param receivedPokemon
 */
function doPokemonTradeSequence(tradedPokemon: PlayerPokemon, receivedPokemon: PlayerPokemon) {
  return new Promise<void>(resolve => {
    const tradeContainer = globalScene.fieldUI.getByName("Trade Background") as Phaser.GameObjects.Container;
    const tradeBaseBg = tradeContainer.getByName("Trade Background Image") as Phaser.GameObjects.Image;

    let tradedPokemonSprite: Phaser.GameObjects.Sprite;
    let tradedPokemonTintSprite: Phaser.GameObjects.Sprite;
    let receivedPokemonSprite: Phaser.GameObjects.Sprite;
    let receivedPokemonTintSprite: Phaser.GameObjects.Sprite;

    const getPokemonSprite = () => {
      const ret = globalScene.addPokemonSprite(
        tradedPokemon,
        tradeBaseBg.displayWidth / 2,
        tradeBaseBg.displayHeight / 2,
        "pkmn__sub",
      );
      ret.setPipeline(globalScene.spritePipeline, {
        tone: [0.0, 0.0, 0.0, 0.0],
        ignoreTimeTint: true,
      });
      return ret;
    };

    tradeContainer.add((tradedPokemonSprite = getPokemonSprite()));
    tradeContainer.add((tradedPokemonTintSprite = getPokemonSprite()));
    tradeContainer.add((receivedPokemonSprite = getPokemonSprite()));
    tradeContainer.add((receivedPokemonTintSprite = getPokemonSprite()));

    tradedPokemonSprite.setAlpha(0);
    tradedPokemonTintSprite.setAlpha(0);
    tradedPokemonTintSprite.setTintFill(getPokeballTintColor(tradedPokemon.pokeball));
    receivedPokemonSprite.setVisible(false);
    receivedPokemonTintSprite.setVisible(false);
    receivedPokemonTintSprite.setTintFill(getPokeballTintColor(receivedPokemon.pokeball));

    [tradedPokemonSprite, tradedPokemonTintSprite].map(sprite => {
      const spriteKey = tradedPokemon.getSpriteKey(true);
      try {
        sprite.play(spriteKey);
      } catch (err: unknown) {
        console.error(`Failed to play animation for ${spriteKey}`, err);
      }

      sprite.setPipeline(globalScene.spritePipeline, {
        tone: [0.0, 0.0, 0.0, 0.0],
        hasShadow: false,
        teraColor: getTypeRgb(tradedPokemon.getTeraType()),
        isTerastallized: tradedPokemon.isTerastallized,
      });
      sprite.setPipelineData("ignoreTimeTint", true);
      sprite.setPipelineData("spriteKey", tradedPokemon.getSpriteKey());
      sprite.setPipelineData("shiny", tradedPokemon.shiny);
      sprite.setPipelineData("variant", tradedPokemon.variant);
      ["spriteColors", "fusionSpriteColors"].map(k => {
        if (tradedPokemon.summonData.speciesForm) {
          k += "Base";
        }
        sprite.pipelineData[k] = tradedPokemon.getSprite().pipelineData[k];
      });
    });

    [receivedPokemonSprite, receivedPokemonTintSprite].map(sprite => {
      const spriteKey = receivedPokemon.getSpriteKey(true);
      try {
        sprite.play(spriteKey);
      } catch (err: unknown) {
        console.error(`Failed to play animation for ${spriteKey}`, err);
      }

      sprite.setPipeline(globalScene.spritePipeline, {
        tone: [0.0, 0.0, 0.0, 0.0],
        hasShadow: false,
        teraColor: getTypeRgb(tradedPokemon.getTeraType()),
        isTerastallized: tradedPokemon.isTerastallized,
      });
      sprite.setPipelineData("ignoreTimeTint", true);
      sprite.setPipelineData("spriteKey", receivedPokemon.getSpriteKey());
      sprite.setPipelineData("shiny", receivedPokemon.shiny);
      sprite.setPipelineData("variant", receivedPokemon.variant);
      ["spriteColors", "fusionSpriteColors"].map(k => {
        if (receivedPokemon.summonData.speciesForm) {
          k += "Base";
        }
        sprite.pipelineData[k] = receivedPokemon.getSprite().pipelineData[k];
      });
    });

    // Traded pokemon pokeball
    const tradedPbAtlasKey = getPokeballAtlasKey(tradedPokemon.pokeball);
    const tradedPokeball: Phaser.GameObjects.Sprite = globalScene.add.sprite(
      tradeBaseBg.displayWidth / 2,
      tradeBaseBg.displayHeight / 2,
      "pb",
      tradedPbAtlasKey,
    );
    tradedPokeball.setVisible(false);
    tradeContainer.add(tradedPokeball);

    // Received pokemon pokeball
    const receivedPbAtlasKey = getPokeballAtlasKey(receivedPokemon.pokeball);
    const receivedPokeball: Phaser.GameObjects.Sprite = globalScene.add.sprite(
      tradeBaseBg.displayWidth / 2,
      tradeBaseBg.displayHeight / 2,
      "pb",
      receivedPbAtlasKey,
    );
    receivedPokeball.setVisible(false);
    tradeContainer.add(receivedPokeball);

    globalScene.tweens.add({
      targets: tradedPokemonSprite,
      alpha: 1,
      ease: "Cubic.easeInOut",
      duration: 500,
      onComplete: async () => {
        globalScene.fadeOutBgm(1000, false);
        await showEncounterText(`${namespace}:pokemonTradeSelected`);
        tradedPokemon.cry();
        globalScene.playBgm("evolution");
        await showEncounterText(`${namespace}:pokemonTradeGoodbye`);

        tradedPokeball.setAlpha(0);
        tradedPokeball.setVisible(true);
        globalScene.tweens.add({
          targets: tradedPokeball,
          alpha: 1,
          ease: "Cubic.easeInOut",
          duration: 250,
          onComplete: () => {
            tradedPokeball.setTexture("pb", `${tradedPbAtlasKey}_opening`);
            globalScene.time.delayedCall(17, () => tradedPokeball.setTexture("pb", `${tradedPbAtlasKey}_open`));
            globalScene.playSound("se/pb_rel");
            tradedPokemonTintSprite.setVisible(true);

            // TODO: need to add particles to fieldUI instead of field
            // addPokeballOpenParticles(tradedPokemon.x, tradedPokemon.y, tradedPokemon.pokeball);

            globalScene.tweens.add({
              targets: [tradedPokemonTintSprite, tradedPokemonSprite],
              duration: 500,
              ease: "Sine.easeIn",
              scale: 0.25,
              onComplete: () => {
                tradedPokemonSprite.setVisible(false);
                tradedPokeball.setTexture("pb", `${tradedPbAtlasKey}_opening`);
                tradedPokemonTintSprite.setVisible(false);
                globalScene.playSound("se/pb_catch");
                globalScene.time.delayedCall(17, () => tradedPokeball.setTexture("pb", `${tradedPbAtlasKey}`));

                globalScene.tweens.add({
                  targets: tradedPokeball,
                  y: "+=10",
                  duration: 200,
                  delay: 250,
                  ease: "Cubic.easeIn",
                  onComplete: () => {
                    globalScene.playSound("se/pb_bounce_1");

                    globalScene.tweens.add({
                      targets: tradedPokeball,
                      y: "-=100",
                      duration: 200,
                      delay: 1000,
                      ease: "Cubic.easeInOut",
                      onStart: () => {
                        globalScene.playSound("se/pb_throw");
                      },
                      onComplete: async () => {
                        await doPokemonTradeFlyBySequence(tradedPokemonSprite, receivedPokemonSprite);
                        await doTradeReceivedSequence(
                          receivedPokemon,
                          receivedPokemonSprite,
                          receivedPokemonTintSprite,
                          receivedPokeball,
                          receivedPbAtlasKey,
                        );
                        resolve();
                      },
                    });
                  },
                });
              },
            });
          },
        });
      },
    });
  });
}

function doPokemonTradeFlyBySequence(
  tradedPokemonSprite: Phaser.GameObjects.Sprite,
  receivedPokemonSprite: Phaser.GameObjects.Sprite,
) {
  return new Promise<void>(resolve => {
    const tradeContainer = globalScene.fieldUI.getByName("Trade Background") as Phaser.GameObjects.Container;
    const tradeBaseBg = tradeContainer.getByName("Trade Background Image") as Phaser.GameObjects.Image;
    const flyByStaticBg = tradeContainer.getByName("Black Background") as Phaser.GameObjects.Rectangle;
    flyByStaticBg.setVisible(true);
    tradeContainer.bringToTop(tradedPokemonSprite);
    tradeContainer.bringToTop(receivedPokemonSprite);

    tradedPokemonSprite.x = tradeBaseBg.displayWidth / 4;
    tradedPokemonSprite.y = 200;
    tradedPokemonSprite.scale = 1;
    tradedPokemonSprite.setVisible(true);
    receivedPokemonSprite.x = (tradeBaseBg.displayWidth * 3) / 4;
    receivedPokemonSprite.y = -200;
    receivedPokemonSprite.scale = 1;
    receivedPokemonSprite.setVisible(true);

    const FADE_DELAY = 300;
    const ANIM_DELAY = 750;
    const BASE_ANIM_DURATION = 1000;

    // Fade out trade background
    globalScene.tweens.add({
      targets: tradeBaseBg,
      alpha: 0,
      ease: "Cubic.easeInOut",
      duration: FADE_DELAY,
      onComplete: () => {
        globalScene.tweens.add({
          targets: [receivedPokemonSprite, tradedPokemonSprite],
          y: tradeBaseBg.displayWidth / 2 - 100,
          ease: "Cubic.easeInOut",
          duration: BASE_ANIM_DURATION * 3,
          onComplete: () => {
            globalScene.tweens.add({
              targets: receivedPokemonSprite,
              x: tradeBaseBg.displayWidth / 4,
              ease: "Cubic.easeInOut",
              duration: BASE_ANIM_DURATION / 2,
              delay: ANIM_DELAY,
            });
            globalScene.tweens.add({
              targets: tradedPokemonSprite,
              x: (tradeBaseBg.displayWidth * 3) / 4,
              ease: "Cubic.easeInOut",
              duration: BASE_ANIM_DURATION / 2,
              delay: ANIM_DELAY,
              onComplete: () => {
                globalScene.tweens.add({
                  targets: receivedPokemonSprite,
                  y: "+=200",
                  ease: "Cubic.easeInOut",
                  duration: BASE_ANIM_DURATION * 2,
                  delay: ANIM_DELAY,
                });
                globalScene.tweens.add({
                  targets: tradedPokemonSprite,
                  y: "-=200",
                  ease: "Cubic.easeInOut",
                  duration: BASE_ANIM_DURATION * 2,
                  delay: ANIM_DELAY,
                  onComplete: () => {
                    globalScene.tweens.add({
                      targets: tradeBaseBg,
                      alpha: 1,
                      ease: "Cubic.easeInOut",
                      duration: FADE_DELAY,
                      onComplete: () => {
                        resolve();
                      },
                    });
                  },
                });
              },
            });
          },
        });
      },
    });
  });
}

function doTradeReceivedSequence(
  receivedPokemon: PlayerPokemon,
  receivedPokemonSprite: Phaser.GameObjects.Sprite,
  receivedPokemonTintSprite: Phaser.GameObjects.Sprite,
  receivedPokeballSprite: Phaser.GameObjects.Sprite,
  receivedPbAtlasKey: string,
) {
  return new Promise<void>(resolve => {
    const tradeContainer = globalScene.fieldUI.getByName("Trade Background") as Phaser.GameObjects.Container;
    const tradeBaseBg = tradeContainer.getByName("Trade Background Image") as Phaser.GameObjects.Image;

    receivedPokemonSprite.setVisible(false);
    receivedPokemonSprite.x = tradeBaseBg.displayWidth / 2;
    receivedPokemonSprite.y = tradeBaseBg.displayHeight / 2;
    receivedPokemonTintSprite.setVisible(false);
    receivedPokemonTintSprite.x = tradeBaseBg.displayWidth / 2;
    receivedPokemonTintSprite.y = tradeBaseBg.displayHeight / 2;

    receivedPokeballSprite.setVisible(true);
    receivedPokeballSprite.x = tradeBaseBg.displayWidth / 2;
    receivedPokeballSprite.y = tradeBaseBg.displayHeight / 2 - 100;

    // Received pokemon sparkles
    let pokemonShinySparkle: Phaser.GameObjects.Sprite;
    if (receivedPokemon.shiny) {
      pokemonShinySparkle = globalScene.add.sprite(receivedPokemonSprite.x, receivedPokemonSprite.y, "shiny");
      pokemonShinySparkle.setVisible(false);
      tradeContainer.add(pokemonShinySparkle);
    }

    const BASE_ANIM_DURATION = 1000;

    // Pokeball falls to the screen
    globalScene.playSound("se/pb_throw");
    globalScene.tweens.add({
      targets: receivedPokeballSprite,
      y: "+=100",
      ease: "Cubic.easeInOut",
      duration: BASE_ANIM_DURATION,
      onComplete: () => {
        globalScene.playSound("se/pb_bounce_1");
        globalScene.time.delayedCall(100, () => globalScene.playSound("se/pb_bounce_1"));

        globalScene.time.delayedCall(2000, () => {
          globalScene.playSound("se/pb_rel");
          globalScene.fadeOutBgm(500, false);
          receivedPokemon.cry();
          receivedPokemonTintSprite.scale = 0.25;
          receivedPokemonTintSprite.alpha = 1;
          receivedPokemonSprite.setVisible(true);
          receivedPokemonSprite.scale = 0.25;
          receivedPokemonTintSprite.alpha = 1;
          receivedPokemonTintSprite.setVisible(true);
          receivedPokeballSprite.setTexture("pb", `${receivedPbAtlasKey}_opening`);
          globalScene.time.delayedCall(17, () => receivedPokeballSprite.setTexture("pb", `${receivedPbAtlasKey}_open`));
          globalScene.tweens.add({
            targets: receivedPokemonSprite,
            duration: 250,
            ease: "Sine.easeOut",
            scale: 1,
          });
          globalScene.tweens.add({
            targets: receivedPokemonTintSprite,
            duration: 250,
            ease: "Sine.easeOut",
            scale: 1,
            alpha: 0,
            onComplete: () => {
              if (receivedPokemon.shiny) {
                globalScene.time.delayedCall(500, () => {
                  doShinySparkleAnim(pokemonShinySparkle, receivedPokemon.variant);
                });
              }
              receivedPokeballSprite.destroy();
              globalScene.time.delayedCall(2000, () => resolve());
            },
          });
        });
      },
    });
  });
}

function generateRandomTraderName() {
  const allTrainerNames = getEnumKeys(TrainerType);
  // Exclude TrainerType.UNKNOWN and everything after Ace Trainers (grunts and unique trainers)
  const eligibleNames = allTrainerNames.slice(
    1,
    allTrainerNames.indexOf(TrainerType[TrainerType.YOUNGSTER] as keyof typeof TrainerType),
  );
  const randomTrainer = toCamelCase(randSeedItem(eligibleNames));
  const classKey = `trainersCommon:${randomTrainer}`;
  // Pick a random gender for ones with gendered pools, or access the raw object for ones without.
  const genderKey = i18next.exists(`${classKey}.male`) ? randSeedItem([".male", ".female"]) : "";
  const trainerNameString = getRandomLocaleEntry(`${classKey}${genderKey}`)[1];
  // Split the string by &s (for duo trainers)
  return randSeedItem(trainerNameString.split(" & "));
}
