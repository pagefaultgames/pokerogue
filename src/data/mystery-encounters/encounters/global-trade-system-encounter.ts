import { generateModifierType, leaveEncounterWithoutBattle, selectPokemonForOption, setEncounterRewards, transitionMysteryEncounterIntroVisuals } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { TrainerSlot, } from "#app/data/trainer-config";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { modifierTypes, PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "../mystery-encounter";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { Species } from "#enums/species";
import PokemonSpecies, { allSpecies, getPokemonSpecies } from "#app/data/pokemon-species";
import { applyModifierTypeToPlayerPokemon } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { getTypeRgb, Type } from "#app/data/type";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { isNullOrUndefined, randInt, randSeedInt, randSeedShuffle } from "#app/utils";
import { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import { BerryModifier, PokemonFormChangeItemModifier, SpeciesStatBoosterModifier } from "#app/modifier/modifier";
import { BerryType } from "#enums/berry-type";
import { EncounterAnim, EncounterBattleAnim } from "#app/data/battle-anims";
import { MoveCategory } from "#app/data/move";
import { MysteryEncounterPokemonData } from "#app/data/mystery-encounters/mystery-encounter-pokemon-data";
import { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import PokemonData from "#app/system/pokemon-data";
import i18next from "i18next";
import { Gender, getGenderSymbol } from "#app/data/gender";
import { getNatureName } from "#app/data/nature";
import { getPokeballAtlasKey, getPokeballTintColor } from "#app/data/pokeball";
import { showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { trainerNamePools } from "#app/data/trainer-names";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:globalTradeSystem";

const LEGENDARY_TRADE_POOLS = {
  1: [Species.RATTATA, Species.PIDGEY, Species.WEEDLE],
  2: [Species.SENTRET, Species.HOOTHOOT, Species.LEDYBA],
  3: [Species.POOCHYENA, Species.ZIGZAGOON, Species.TAILLOW],
  4: [Species.BIDOOF, Species.STARLY, Species.KRICKETOT],
  5: [Species.PATRAT, Species.PURRLOIN, Species.PIDOVE],
  6: [Species.BUNNELBY, Species.LITLEO, Species.SCATTERBUG],
  7: [Species.PIKIPEK, Species.YUNGOOS, Species.ROCKRUFF],
  8: [Species.SKWOVET, Species.WOOLOO, Species.ROOKIDEE],
  9: [Species.LECHONK, Species.FIDOUGH, Species.TAROUNTULA]
};

/** Exclude Paradox mons as they aren't considered legendary/mythical */
const EXCLUDED_TRADE_SPECIES = [
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
  Species.IRON_CROWN
];

/**
 * Global Trade System encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3812 | GitHub Issue #3812}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const GlobalTradeSystemEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.GLOBAL_TRADE_SYSTEM)
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(10, 180)
    .withAutoHideIntroVisuals(false)
    .withIntroSpriteConfigs([
      {
        spriteKey: "gts_placeholder",
        fileRoot: "mystery-encounters",
        hasShadow: false,
        disableAnimation: true
      }
    ])
    .withIntroDialogue([
      {
        text: `${namespace}.intro`,
      }
    ])
    .withTitle(`${namespace}.title`)
    .withDescription(`${namespace}.description`)
    .withQuery(`${namespace}.query`)
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;

      // Load bgm
      if (scene.musicPreference === 0) {
        scene.loadBgm("mystery_encounter_gts", "mystery_encounter_gen_5_gts.mp3");
      } else {
        // Mixed option
        scene.loadBgm("mystery_encounter_gts", "mystery_encounter_gen_6_gts.mp3");
      }

      // Load possible trade options
      // Maps current party member's id to 3 EnemyPokemon objects
      // None of the trade options can be the same species
      const tradeOptionsMap: Map<number, EnemyPokemon[]> = getPokemonTradeOptions(scene);
      encounter.misc = {
        tradeOptionsMap
      };

      return true;
    })
    .withOnVisualsStart((scene: BattleScene) => {
      // Change the bgm
      scene.fadeOutBgm(1500, false);
      scene.time.delayedCall(1500, () => {
        scene.playBgm("mystery_encounter_gts");
      });

      return true;
    })
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}.option.1.label`,
          buttonTooltip: `${namespace}.option.1.tooltip`,
          secondOptionPrompt: `${namespace}.option.1.trade_options_prompt`,
        })
        .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          const encounter = scene.currentBattle.mysteryEncounter!;
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
                  encounter.misc = {
                    tradedPokemon: pokemon,
                    receivedPokemon: tradePokemon,
                  };
                  return true;
                },
                onHover: () => {
                  const formName = tradePokemon.species.forms?.[pokemon.formIndex]?.formName;
                  const line1 = i18next.t("pokemonInfoContainer:ability") + " " + tradePokemon.getAbility().name + (tradePokemon.getGender() !== Gender.GENDERLESS ? "     |     " + i18next.t("pokemonInfoContainer:gender") + " " + getGenderSymbol(tradePokemon.getGender()) : "");
                  const line2 = i18next.t("pokemonInfoContainer:nature") + " " + getNatureName(tradePokemon.getNature()) + (formName ? "     |     " + i18next.t("pokemonInfoContainer:form") + " " + formName : "");
                  scene.ui.showText(`${line1}\n${line2}`, 0);
                },
              };
              return option;
            });
          };

          return selectPokemonForOption(scene, onPokemonSelected);
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          const tradedPokemon: PlayerPokemon = encounter.misc.tradedPokemon;
          const receivedPokemonData: EnemyPokemon = encounter.misc.receivedPokemon;
          const modifiers = tradedPokemon.getHeldItems().filter(m => !(m instanceof PokemonFormChangeItemModifier) && !(m instanceof SpeciesStatBoosterModifier));

          // Generate a trainer name
          const traderName = generateRandomTraderName();
          encounter.setDialogueToken("tradeTrainerName", traderName.trim());

          // Remove the original party member from party
          scene.removePokemonFromPlayerParty(tradedPokemon, false);

          // Set data properly, then generate the new Pokemon's assets
          receivedPokemonData.passive = tradedPokemon.passive;
          receivedPokemonData.pokeball = randSeedInt(5);
          const dataSource = new PokemonData(receivedPokemonData);
          const newPlayerPokemon = scene.addPlayerPokemon(receivedPokemonData.species, receivedPokemonData.level, undefined, undefined, undefined, undefined, undefined, undefined, undefined, dataSource);
          scene.getParty().push(newPlayerPokemon);
          await newPlayerPokemon.loadAssets();

          for (const mod of modifiers) {
            mod.pokemonId = newPlayerPokemon.id;
            scene.addModifier(mod, true, false, false, true);
          }

          // Show the trade animation
          await showTradeBackground(scene);
          await doPokemonTradeSequence(scene, tradedPokemon, newPlayerPokemon);
          await showEncounterText(scene, `${namespace}.trade_received`, 0, true, 4000);
          scene.playBgm("mystery_encounter_gts");
          await hideTradeBackground(scene);

          setEncounterRewards(scene, { fillRemaining: true });
          leaveEncounterWithoutBattle(scene);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}.option.2.label`,
          buttonTooltip: `${namespace}.option.2.tooltip`,
          selected: [
            {
              text: `${namespace}.option.2.selected`,
              speaker: `${namespace}.speaker`
            },
            {
              text: `${namespace}.option.2.selected_2`,
            },
            {
              text: `${namespace}.option.2.selected_3`,
              speaker: `${namespace}.speaker`
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
            .filter(m => m.isTransferrable && !(m instanceof BerryModifier))
            .reduce((v, m) => v + m.stackCount, 0);

          party.forEach(pokemon => {
            const nextCount = pokemon.getHeldItems()
              .filter(m => m.isTransferrable && !(m instanceof BerryModifier))
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
          items.filter(m => m.isTransferrable && !(m instanceof BerryModifier))
            .forEach(m => {
              const type = m.type.withTierFromPool();
              const tier = type.tier ?? ModifierTier.ULTRA;
              if (type.id === "LUCKY_EGG" || tier === ModifierTier.ULTRA) {
                numUltra += m.stackCount;
                scene.removeModifier(m);
              } else if (type.id === "GOLDEN_EGG" || tier === ModifierTier.ROGUE) {
                numRogue += m.stackCount;
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
          await transitionMysteryEncounterIntroVisuals(scene);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}.option.3.label`,
          buttonTooltip: `${namespace}.option.3.tooltip`,
          selected: [
            {
              text: `${namespace}.option.3.selected`,
              speaker: `${namespace}.speaker`
            },
            {
              text: `${namespace}.option.3.selected_2`,
            },
            {
              text: `${namespace}.option.3.selected_3`,
              speaker: `${namespace}.speaker`
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene) => {
          // Swap player's types on all party pokemon
          // If a Pokemon had a single type prior, they will still have a single type after
          for (const pokemon of scene.getParty()) {
            const originalTypes = pokemon.getTypes(false, false, true);

            // If the Pokemon has non-status moves that don't match the Pokemon's type, prioritizes those as the new type
            // Makes the "randomness" of the shuffle slightly less punishing
            let priorityTypes = pokemon.moveset
              .filter(move => move && !originalTypes.includes(move.getMove().type) && move.getMove().category !== MoveCategory.STATUS)
              .map(move => move!.getMove().type);
            if (priorityTypes?.length > 0) {
              priorityTypes = [...new Set(priorityTypes)];
              randSeedShuffle(priorityTypes);
            }

            let newTypes: Type[];
            if (!originalTypes || originalTypes.length < 1) {
              newTypes = priorityTypes && priorityTypes.length > 0 ? [priorityTypes.pop()!] : [(randSeedInt(18) as Type)];
            } else {
              newTypes = originalTypes.map(m => {
                if (priorityTypes && priorityTypes.length > 0) {
                  const ret = priorityTypes.pop()!;
                  randSeedShuffle(priorityTypes);
                  return ret;
                }

                return randSeedInt(18) as Type;
              });
            }

            if (!pokemon.mysteryEncounterData) {
              pokemon.mysteryEncounterData = new MysteryEncounterPokemonData(undefined, undefined, undefined, newTypes);
            } else {
              pokemon.mysteryEncounterData.types = newTypes;
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
          await transitionMysteryEncounterIntroVisuals(scene);
        })
        .build()
    )
    .withOutroDialogue([
      {
        text: `${namespace}.outro`,
      },
    ])
    .build();

function getPokemonTradeOptions(scene: BattleScene): Map<number, EnemyPokemon[]> {
  const tradeOptionsMap: Map<number, EnemyPokemon[]> = new Map<number, EnemyPokemon[]>();
  // Starts by filtering out any current party members as valid resulting species
  const alreadyUsedSpecies: PokemonSpecies[] = scene.getParty().map(p => p.species);

  scene.getParty().forEach(pokemon => {
    // If the party member is legendary/mythical, the only trade options available are always pulled from generation-specific legendary trade pools
    if (pokemon.species.legendary || pokemon.species.subLegendary || pokemon.species.mythical) {
      const generation = pokemon.species.generation;
      const tradeOptions: EnemyPokemon[] = LEGENDARY_TRADE_POOLS[generation].map(s => {
        const pokemonSpecies = getPokemonSpecies(s);
        return new EnemyPokemon(scene, pokemonSpecies, 5, TrainerSlot.NONE, false);
      });
      tradeOptionsMap.set(pokemon.id, tradeOptions);
    } else {
      const originalBst = pokemon.calculateBaseStats().reduce((a, b) => a + b, 0);

      const tradeOptions: PokemonSpecies[] = [];
      for (let i = 0; i < 3; i++) {
        const speciesTradeOption = generateTradeOption(originalBst, alreadyUsedSpecies);
        alreadyUsedSpecies.push(speciesTradeOption);
        tradeOptions.push(speciesTradeOption);
      }

      // Add trade options to map
      tradeOptionsMap.set(pokemon.id, tradeOptions.map(s => {
        return new EnemyPokemon(scene, s, pokemon.level, TrainerSlot.NONE, false);
      }));
    }
  });

  return tradeOptionsMap;
}

function generateTradeOption(originalBst: number, alreadyUsedSpecies: PokemonSpecies[]): PokemonSpecies {
  let newSpecies: PokemonSpecies | undefined;
  while (isNullOrUndefined(newSpecies)) {
    let bstCap = originalBst + 100;
    let bstMin = originalBst - 100;

    // Get all non-legendary species that fall within the Bst range requirements
    let validSpecies = allSpecies
      .filter(s => {
        const isLegendaryOrMythical = s.legendary || s.subLegendary || s.mythical;
        const speciesBst = s.getBaseStatTotal();
        const bstInRange = speciesBst >= bstMin && speciesBst <= bstCap;
        return !isLegendaryOrMythical && bstInRange && !EXCLUDED_TRADE_SPECIES.includes(s.speciesId);
      });

    // There must be at least 20 species available before it will choose one
    if (validSpecies?.length > 20) {
      validSpecies = randSeedShuffle(validSpecies);
      newSpecies = validSpecies.pop();
      while (isNullOrUndefined(newSpecies) || alreadyUsedSpecies.includes(newSpecies!)) {
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

function generateItemsOfTier(scene: BattleScene, pokemon: PlayerPokemon, numItems: integer, tier: ModifierTier | "Berries") {
  // These pools have to be defined at runtime so that modifierTypes exist
  // Pools have instances of the modifier type equal to the max stacks that modifier can be applied to any one pokemon
  // This is to prevent "over-generating" a random item of a certain type during item swaps
  const ultraPool = [
    [modifierTypes.REVIVER_SEED, 1],
    [modifierTypes.GOLDEN_PUNCH, 5],
    [modifierTypes.ATTACK_TYPE_BOOSTER, 99],
    [modifierTypes.QUICK_CLAW, 3],
    [modifierTypes.WIDE_LENS, 3]
  ];

  const roguePool = [
    [modifierTypes.LEFTOVERS, 4],
    [modifierTypes.SHELL_BELL, 4],
    [modifierTypes.SOUL_DEW, 10],
    [modifierTypes.SOOTHE_BELL, 3],
    [modifierTypes.SCOPE_LENS, 1],
    [modifierTypes.BATON, 1],
    [modifierTypes.FOCUS_BAND, 5],
    [modifierTypes.KINGS_ROCK, 3],
    [modifierTypes.GRIP_CLAW, 5]
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
    [BerryType.STARF, 3]
  ];

  let pool: any[];
  if (tier === "Berries") {
    pool = berryPool;
  } else {
    pool = tier === ModifierTier.ULTRA ? ultraPool : roguePool;
  }

  for (let i = 0; i < numItems; i++) {
    const randIndex = randSeedInt(pool.length);
    const newItemType = pool[randIndex];
    let newMod;
    if (tier === "Berries") {
      newMod = generateModifierType(scene, modifierTypes.BERRY, [newItemType[0]]) as PokemonHeldItemModifierType;
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

function showTradeBackground(scene: BattleScene) {
  return new Promise<void>(resolve => {
    const tradeContainer = scene.add.container(0, -scene.game.canvas.height / 6);
    tradeContainer.setName("Trade Background");

    const flyByStaticBg = scene.add.rectangle(0, 0, scene.game.canvas.width / 6, scene.game.canvas.height / 6, 0);
    flyByStaticBg.setName("Black Background");
    flyByStaticBg.setOrigin(0, 0);
    flyByStaticBg.setVisible(false);
    tradeContainer.add(flyByStaticBg);

    const tradeBaseBg = scene.add.image(0, 0, "default_bg");
    tradeBaseBg.setName("Trade Background Image");
    tradeBaseBg.setOrigin(0, 0);
    tradeContainer.add(tradeBaseBg);

    scene.fieldUI.add(tradeContainer);
    scene.fieldUI.bringToTop(tradeContainer);
    tradeContainer.setVisible(true);
    tradeContainer.alpha = 0;

    scene.tweens.add({
      targets: tradeContainer,
      alpha: 1,
      duration: 500,
      ease: "Sine.easeInOut",
      onComplete: () => {
        resolve();
      }
    });
  });
}

function hideTradeBackground(scene: BattleScene) {
  return new Promise<void>(resolve => {
    const transformationContainer = scene.fieldUI.getByName("Trade Background");

    scene.tweens.add({
      targets: transformationContainer,
      alpha: 0,
      duration: 1000,
      ease: "Sine.easeInOut",
      onComplete: () => {
        scene.fieldUI.remove(transformationContainer, true);
        resolve();
      }
    });
  });
}

/**
 * Initiates an "evolution-like" animation to transform a previousPokemon (presumably from the player's party) into a new one, not necessarily an evolution species.
 * @param scene
 * @param tradedPokemon
 * @param receivedPokemon
 */
function doPokemonTradeSequence(scene: BattleScene, tradedPokemon: PlayerPokemon, receivedPokemon: PlayerPokemon) {
  return new Promise<void>(resolve => {
    const tradeContainer = scene.fieldUI.getByName("Trade Background") as Phaser.GameObjects.Container;
    const tradeBaseBg = tradeContainer.getByName("Trade Background Image") as Phaser.GameObjects.Image;

    let tradedPokemonSprite: Phaser.GameObjects.Sprite;
    let tradedPokemonTintSprite: Phaser.GameObjects.Sprite;
    let receivedPokemonSprite: Phaser.GameObjects.Sprite;
    let receivedPokemonTintSprite: Phaser.GameObjects.Sprite;

    const getPokemonSprite = () => {
      const ret = scene.addPokemonSprite(tradedPokemon, tradeBaseBg.displayWidth / 2, tradeBaseBg.displayHeight / 2, "pkmn__sub");
      ret.setPipeline(scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], ignoreTimeTint: true });
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

    [ tradedPokemonSprite, tradedPokemonTintSprite ].map(sprite => {
      sprite.play(tradedPokemon.getSpriteKey(true));
      sprite.setPipeline(scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], hasShadow: false, teraColor: getTypeRgb(tradedPokemon.getTeraType()) });
      sprite.setPipelineData("ignoreTimeTint", true);
      sprite.setPipelineData("spriteKey", tradedPokemon.getSpriteKey());
      sprite.setPipelineData("shiny", tradedPokemon.shiny);
      sprite.setPipelineData("variant", tradedPokemon.variant);
      [ "spriteColors", "fusionSpriteColors" ].map(k => {
        if (tradedPokemon.summonData?.speciesForm) {
          k += "Base";
        }
        sprite.pipelineData[k] = tradedPokemon.getSprite().pipelineData[k];
      });
    });

    [ receivedPokemonSprite, receivedPokemonTintSprite ].map(sprite => {
      sprite.play(receivedPokemon.getSpriteKey(true));
      sprite.setPipeline(scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], hasShadow: false, teraColor: getTypeRgb(tradedPokemon.getTeraType()) });
      sprite.setPipelineData("ignoreTimeTint", true);
      sprite.setPipelineData("spriteKey", receivedPokemon.getSpriteKey());
      sprite.setPipelineData("shiny", receivedPokemon.shiny);
      sprite.setPipelineData("variant", receivedPokemon.variant);
      [ "spriteColors", "fusionSpriteColors" ].map(k => {
        if (receivedPokemon.summonData?.speciesForm) {
          k += "Base";
        }
        sprite.pipelineData[k] = receivedPokemon.getSprite().pipelineData[k];
      });
    });

    // Traded pokemon pokeball
    const tradedPbAtlasKey = getPokeballAtlasKey(tradedPokemon.pokeball);
    const tradedPokeball: Phaser.GameObjects.Sprite = scene.add.sprite(tradeBaseBg.displayWidth / 2, tradeBaseBg.displayHeight / 2, "pb", tradedPbAtlasKey);
    tradedPokeball.setVisible(false);
    tradeContainer.add(tradedPokeball);

    // Received pokemon pokeball
    const receivedPbAtlasKey = getPokeballAtlasKey(receivedPokemon.pokeball);
    const receivedPokeball: Phaser.GameObjects.Sprite = scene.add.sprite(tradeBaseBg.displayWidth / 2, tradeBaseBg.displayHeight / 2, "pb", receivedPbAtlasKey);
    receivedPokeball.setVisible(false);
    tradeContainer.add(receivedPokeball);

    scene.tweens.add({
      targets: tradedPokemonSprite,
      alpha: 1,
      ease: "Cubic.easeInOut",
      duration: 500,
      onComplete: async () => {
        scene.fadeOutBgm(1000, false);
        await showEncounterText(scene, `${namespace}.pokemon_trade_selected`);
        tradedPokemon.cry();
        scene.playBgm("evolution");
        await showEncounterText(scene, `${namespace}.pokemon_trade_goodbye`);

        tradedPokeball.setAlpha(0);
        tradedPokeball.setVisible(true);
        scene.tweens.add({
          targets: tradedPokeball,
          alpha: 1,
          ease: "Cubic.easeInOut",
          duration: 250,
          onComplete: () => {
            tradedPokeball.setTexture("pb", `${tradedPbAtlasKey}_opening`);
            scene.time.delayedCall(17, () => tradedPokeball.setTexture("pb", `${tradedPbAtlasKey}_open`));
            scene.playSound("se/pb_rel");
            tradedPokemonTintSprite.setVisible(true);

            // TODO: need to add particles to fieldUI instead of field
            // addPokeballOpenParticles(scene, tradedPokemon.x, tradedPokemon.y, tradedPokemon.pokeball);

            scene.tweens.add({
              targets: [tradedPokemonTintSprite, tradedPokemonSprite],
              duration: 500,
              ease: "Sine.easeIn",
              scale: 0.25,
              onComplete: () => {
                tradedPokemonSprite.setVisible(false);
                tradedPokeball.setTexture("pb", `${tradedPbAtlasKey}_opening`);
                tradedPokemonTintSprite.setVisible(false);
                scene.playSound("se/pb_catch");
                scene.time.delayedCall(17, () => tradedPokeball.setTexture("pb", `${tradedPbAtlasKey}`));

                scene.tweens.add({
                  targets: tradedPokeball,
                  y: "+=10",
                  duration: 200,
                  delay: 250,
                  ease: "Cubic.easeIn",
                  onComplete: () => {
                    scene.playSound("se/pb_bounce_1");

                    scene.tweens.add({
                      targets: tradedPokeball,
                      y: "-=100",
                      duration: 200,
                      delay: 1000,
                      ease: "Cubic.easeInOut",
                      onStart: () => {
                        scene.playSound("se/pb_throw");
                      },
                      onComplete: async () => {
                        await doPokemonTradeFlyBySequence(scene, tradedPokemonSprite, receivedPokemonSprite);
                        await doTradeReceivedSequence(scene, receivedPokemon, receivedPokemonSprite, receivedPokemonTintSprite, receivedPokeball, receivedPbAtlasKey);
                        resolve();
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });
}

function doPokemonTradeFlyBySequence(scene: BattleScene, tradedPokemonSprite: Phaser.GameObjects.Sprite, receivedPokemonSprite: Phaser.GameObjects.Sprite) {
  return new Promise<void>(resolve => {
    const tradeContainer = scene.fieldUI.getByName("Trade Background") as Phaser.GameObjects.Container;
    const tradeBaseBg = tradeContainer.getByName("Trade Background Image") as Phaser.GameObjects.Image;
    const flyByStaticBg = tradeContainer.getByName("Black Background") as Phaser.GameObjects.Rectangle;
    flyByStaticBg.setVisible(true);
    tradeContainer.bringToTop(tradedPokemonSprite);
    tradeContainer.bringToTop(receivedPokemonSprite);

    tradedPokemonSprite.x = tradeBaseBg.displayWidth / 4;
    tradedPokemonSprite.y = 200;
    tradedPokemonSprite.scale = 1;
    tradedPokemonSprite.setVisible(true);
    receivedPokemonSprite.x = tradeBaseBg.displayWidth * 3 / 4;
    receivedPokemonSprite.y = -200;
    receivedPokemonSprite.scale = 1;
    receivedPokemonSprite.setVisible(true);

    const FADE_DELAY = 300;
    const ANIM_DELAY = 750;
    const BASE_ANIM_DURATION = 1000;

    // Fade out trade background
    scene.tweens.add({
      targets: tradeBaseBg,
      alpha: 0,
      ease: "Cubic.easeInOut",
      duration: FADE_DELAY,
      onComplete: () => {
        scene.tweens.add({
          targets: [receivedPokemonSprite, tradedPokemonSprite],
          y: tradeBaseBg.displayWidth / 2 - 100,
          ease: "Cubic.easeInOut",
          duration: BASE_ANIM_DURATION * 3,
          onComplete: () => {
            scene.tweens.add({
              targets: receivedPokemonSprite,
              x: tradeBaseBg.displayWidth / 4,
              ease: "Cubic.easeInOut",
              duration: BASE_ANIM_DURATION / 2,
              delay: ANIM_DELAY
            });
            scene.tweens.add({
              targets: tradedPokemonSprite,
              x: tradeBaseBg.displayWidth * 3 / 4,
              ease: "Cubic.easeInOut",
              duration: BASE_ANIM_DURATION / 2,
              delay: ANIM_DELAY,
              onComplete: () => {
                scene.tweens.add({
                  targets: receivedPokemonSprite,
                  y: "+=200",
                  ease: "Cubic.easeInOut",
                  duration: BASE_ANIM_DURATION * 2,
                  delay: ANIM_DELAY,
                });
                scene.tweens.add({
                  targets: tradedPokemonSprite,
                  y: "-=200",
                  ease: "Cubic.easeInOut",
                  duration: BASE_ANIM_DURATION * 2,
                  delay: ANIM_DELAY,
                  onComplete: () => {
                    scene.tweens.add({
                      targets: tradeBaseBg,
                      alpha: 1,
                      ease: "Cubic.easeInOut",
                      duration: FADE_DELAY,
                      onComplete: () => {
                        resolve();
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });
}

function doTradeReceivedSequence(scene: BattleScene, receivedPokemon: PlayerPokemon, receivedPokemonSprite: Phaser.GameObjects.Sprite, receivedPokemonTintSprite: Phaser.GameObjects.Sprite, receivedPokeballSprite: Phaser.GameObjects.Sprite, receivedPbAtlasKey: string) {
  return new Promise<void>(resolve => {
    const tradeContainer = scene.fieldUI.getByName("Trade Background") as Phaser.GameObjects.Container;
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

    const BASE_ANIM_DURATION = 1000;

    // Pokeball falls to the screen
    scene.playSound("se/pb_throw");
    scene.tweens.add({
      targets: receivedPokeballSprite,
      y: "+=100",
      ease: "Cubic.easeInOut",
      duration: BASE_ANIM_DURATION,
      onComplete: () => {
        scene.playSound("se/pb_bounce_1");
        scene.time.delayedCall(100, () => scene.playSound("se/pb_bounce_1"));

        scene.time.delayedCall(2000, () => {
          scene.playSound("se/pb_rel");
          scene.fadeOutBgm(500, false);
          receivedPokemon.cry();
          receivedPokemonTintSprite.scale = 0.25;
          receivedPokemonTintSprite.alpha = 1;
          receivedPokemonSprite.setVisible(true);
          receivedPokemonSprite.scale = 0.25;
          receivedPokemonTintSprite.alpha = 1;
          receivedPokemonTintSprite.setVisible(true);
          receivedPokeballSprite.setTexture("pb", `${receivedPbAtlasKey}_opening`);
          scene.time.delayedCall(17, () => receivedPokeballSprite.setTexture("pb", `${receivedPbAtlasKey}_open`));
          scene.tweens.add({
            targets: receivedPokemonSprite,
            duration: 250,
            ease: "Sine.easeOut",
            scale: 1
          });
          scene.tweens.add({
            targets: receivedPokemonTintSprite,
            duration: 250,
            ease: "Sine.easeOut",
            scale: 1,
            alpha: 0,
            onComplete: () => {
              receivedPokeballSprite.destroy();
              scene.time.delayedCall(2000, () => resolve());
            }
          });
        });
      }
    });
  });
}

function generateRandomTraderName() {
  const length = Object.keys(trainerNamePools).length;
  const trainerTypePool = trainerNamePools[randInt(length)];
  const genderedPool = trainerTypePool[randInt(trainerTypePool.length)];
  const trainerNameString = genderedPool instanceof Array ? genderedPool[randInt(genderedPool.length)] : genderedPool;
  // Some names have an '&' symbol and need to be trimmed to a single name instead of a double name
  const trainerNames = trainerNameString.split(" & ");
  return trainerNames[randInt(trainerNames.length)];
}
