import type Battle from "#app/battle";
import { BattlerIndex, BattleType } from "#app/battle";
import { biomeLinks, BiomePoolTier } from "#app/data/balance/biomes";
import type MysteryEncounterOption from "#app/data/mystery-encounters/mystery-encounter-option";
import { AVERAGE_ENCOUNTERS_PER_RUN_TARGET, WEIGHT_INCREMENT_ON_SPAWN_MISS } from "#app/data/mystery-encounters/mystery-encounters";
import { showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import type { AiType, PlayerPokemon } from "#app/field/pokemon";
import type Pokemon from "#app/field/pokemon";
import { EnemyPokemon, FieldPosition, PokemonMove, PokemonSummonData } from "#app/field/pokemon";
import type { CustomModifierSettings, ModifierType } from "#app/modifier/modifier-type";
import { getPartyLuckValue, ModifierPoolType, ModifierTypeGenerator, ModifierTypeOption, modifierTypes, regenerateModifierPoolThresholds } from "#app/modifier/modifier-type";
import { MysteryEncounterBattlePhase, MysteryEncounterBattleStartCleanupPhase, MysteryEncounterPhase, MysteryEncounterRewardsPhase } from "#app/phases/mystery-encounter-phases";
import type PokemonData from "#app/system/pokemon-data";
import type { OptionSelectConfig, OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import type { PartyOption, PokemonSelectFilter } from "#app/ui/party-ui-handler";
import { PartyUiMode } from "#app/ui/party-ui-handler";
import { Mode } from "#app/ui/ui";
import * as Utils from "#app/utils";
import { isNullOrUndefined, randSeedInt, randSeedItem } from "#app/utils";
import type { BattlerTagType } from "#enums/battler-tag-type";
import { Biome } from "#enums/biome";
import type { TrainerType } from "#enums/trainer-type";
import i18next from "i18next";
import Trainer, { TrainerVariant } from "#app/field/trainer";
import type { Gender } from "#app/data/gender";
import type { Nature } from "#enums/nature";
import type { Moves } from "#enums/moves";
import { initMoveAnim, loadMoveAnimAssets } from "#app/data/battle-anims";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { Status } from "#app/data/status-effect";
import type { TrainerConfig } from "#app/data/trainer-config";
import { trainerConfigs, TrainerSlot } from "#app/data/trainer-config";
import type PokemonSpecies from "#app/data/pokemon-species";
import type { IEggOptions } from "#app/data/egg";
import { Egg } from "#app/data/egg";
import type { CustomPokemonData } from "#app/data/custom-pokemon-data";
import type HeldModifierConfig from "#app/interfaces/held-modifier-config";
import { MovePhase } from "#app/phases/move-phase";
import { EggLapsePhase } from "#app/phases/egg-lapse-phase";
import { TrainerVictoryPhase } from "#app/phases/trainer-victory-phase";
import { BattleEndPhase } from "#app/phases/battle-end-phase";
import { GameOverPhase } from "#app/phases/game-over-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { PartyExpPhase } from "#app/phases/party-exp-phase";
import type { Variant } from "#app/data/variant";
import { StatusEffect } from "#enums/status-effect";
import { globalScene } from "#app/global-scene";
import { getPokemonSpecies } from "#app/data/pokemon-species";

/**
 * Animates exclamation sprite over trainer's head at start of encounter
 * @param scene
 */
export function doTrainerExclamation() {
  const exclamationSprite = globalScene.add.sprite(0, 0, "encounter_exclaim");
  exclamationSprite.setName("exclamation");
  globalScene.field.add(exclamationSprite);
  globalScene.field.moveTo(exclamationSprite, globalScene.field.getAll().length - 1);
  exclamationSprite.setVisible(true);
  exclamationSprite.setPosition(110, 68);
  globalScene.tweens.add({
    targets: exclamationSprite,
    y: "-=25",
    ease: "Cubic.easeOut",
    duration: 300,
    yoyo: true,
    onComplete: () => {
      globalScene.time.delayedCall(800, () => {
        globalScene.field.remove(exclamationSprite, true);
      });
    }
  });

  globalScene.playSound("battle_anims/GEN8- Exclaim", { volume: 0.7 });
}

export interface EnemyPokemonConfig {
  species: PokemonSpecies;
  isBoss: boolean;
  nickname?: string;
  bossSegments?: number;
  bossSegmentModifier?: number; // Additive to the determined segment number
  customPokemonData?: CustomPokemonData;
  formIndex?: number;
  abilityIndex?: number;
  level?: number;
  gender?: Gender;
  passive?: boolean;
  moveSet?: Moves[];
  nature?: Nature;
  ivs?: [number, number, number, number, number, number];
  shiny?: boolean;
  /** Is only checked if Pokemon is shiny */
  variant?: Variant;
  /** Can set just the status, or pass a timer on the status turns */
  status?: StatusEffect | [StatusEffect, number];
  mysteryEncounterBattleEffects?: (pokemon: Pokemon) => void;
  modifierConfigs?: HeldModifierConfig[];
  tags?: BattlerTagType[];
  dataSource?: PokemonData;
  aiType?: AiType;
}

export interface EnemyPartyConfig {
  /** Formula for enemy level: level += waveIndex / 10 * levelAdditiveModifier */
  levelAdditiveModifier?: number;
  doubleBattle?: boolean;
  /** Generates trainer battle solely off trainer type */
  trainerType?: TrainerType;
  /** More customizable option for configuring trainer battle */
  trainerConfig?: TrainerConfig;
  pokemonConfigs?: EnemyPokemonConfig[];
  /** `true` for female trainer, false for male */
  female?: boolean;
  /** `true` will prevent player from switching */
  disableSwitch?: boolean;
  /** `true` or leaving undefined will increment dex seen count for the encounter battle, `false` will not */
  countAsSeen?: boolean;
}

/**
 * Generates an enemy party for a mystery encounter battle
 * This will override and replace any standard encounter generation logic
 * Useful for tailoring specific battles to mystery encounters
 * @param partyConfig Can pass various customizable attributes for the enemy party, see EnemyPartyConfig
 */
export async function initBattleWithEnemyConfig(partyConfig: EnemyPartyConfig): Promise<void> {
  const loaded: boolean = false;
  const loadEnemyAssets: Promise<void>[] = [];

  const battle: Battle = globalScene.currentBattle;

  let doubleBattle: boolean = partyConfig?.doubleBattle ?? false;

  // Trainer
  const trainerType = partyConfig?.trainerType;
  const partyTrainerConfig = partyConfig?.trainerConfig;
  let trainerConfig: TrainerConfig;
  if (!isNullOrUndefined(trainerType) || partyTrainerConfig) {
    globalScene.currentBattle.mysteryEncounter!.encounterMode = MysteryEncounterMode.TRAINER_BATTLE;
    if (globalScene.currentBattle.trainer) {
      globalScene.currentBattle.trainer.setVisible(false);
      globalScene.currentBattle.trainer.destroy();
    }

    trainerConfig = partyTrainerConfig ? partyTrainerConfig : trainerConfigs[trainerType!];

    const doubleTrainer = trainerConfig.doubleOnly || (trainerConfig.hasDouble && !!partyConfig.doubleBattle);
    doubleBattle = doubleTrainer;
    const trainerFemale = isNullOrUndefined(partyConfig.female) ? !!(Utils.randSeedInt(2)) : partyConfig.female;
    const newTrainer = new Trainer(trainerConfig.trainerType, doubleTrainer ? TrainerVariant.DOUBLE : trainerFemale ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT, undefined, undefined, undefined, trainerConfig);
    newTrainer.x += 300;
    newTrainer.setVisible(false);
    globalScene.field.add(newTrainer);
    globalScene.currentBattle.trainer = newTrainer;
    loadEnemyAssets.push(newTrainer.loadAssets().then(() => newTrainer.initSprite()));

    battle.enemyLevels = globalScene.currentBattle.trainer.getPartyLevels(globalScene.currentBattle.waveIndex);
  } else {
    // Wild
    globalScene.currentBattle.mysteryEncounter!.encounterMode = MysteryEncounterMode.WILD_BATTLE;
    const numEnemies = partyConfig?.pokemonConfigs && partyConfig.pokemonConfigs.length > 0 ? partyConfig?.pokemonConfigs?.length : doubleBattle ? 2 : 1;
    battle.enemyLevels = new Array(numEnemies).fill(null).map(() => globalScene.currentBattle.getLevelForWave());
  }

  globalScene.getEnemyParty().forEach(enemyPokemon => {
    globalScene.field.remove(enemyPokemon, true);
  });
  battle.enemyParty = [];
  battle.double = doubleBattle;

  // ME levels are modified by an additive value that scales with wave index
  // Base scaling: Every 10 waves, modifier gets +1 level
  // This can be amplified or counteracted by setting levelAdditiveModifier in config
  // levelAdditiveModifier value of 0.5 will halve the modifier scaling, 2 will double it, etc.
  // Leaving null/undefined will disable level scaling
  const mult: number = !isNullOrUndefined(partyConfig.levelAdditiveModifier) ? partyConfig.levelAdditiveModifier : 0;
  const additive = Math.max(Math.round((globalScene.currentBattle.waveIndex / 10) * mult), 0);
  battle.enemyLevels = battle.enemyLevels.map(level => level + additive);

  battle.enemyLevels.forEach((level, e) => {
    let enemySpecies;
    let dataSource;
    let isBoss = false;
    if (!loaded) {
      if ((!isNullOrUndefined(trainerType) || trainerConfig) && battle.trainer) {
        // Allows overriding a trainer's pokemon to use specific species/data
        if (partyConfig?.pokemonConfigs && e < partyConfig.pokemonConfigs.length) {
          const config = partyConfig.pokemonConfigs[e];
          level = config.level ? config.level : level;
          dataSource = config.dataSource;
          enemySpecies = config.species;
          isBoss = config.isBoss;
          battle.enemyParty[e] = globalScene.addEnemyPokemon(enemySpecies, level, TrainerSlot.TRAINER, isBoss, false, dataSource);
        } else {
          battle.enemyParty[e] = battle.trainer.genPartyMember(e);
        }
      } else {
        if (partyConfig?.pokemonConfigs && e < partyConfig.pokemonConfigs.length) {
          const config = partyConfig.pokemonConfigs[e];
          level = config.level ? config.level : level;
          dataSource = config.dataSource;
          enemySpecies = config.species;
          isBoss = config.isBoss;
          if (isBoss) {
            globalScene.currentBattle.mysteryEncounter!.encounterMode = MysteryEncounterMode.BOSS_BATTLE;
          }
        } else {
          enemySpecies = globalScene.randomSpecies(battle.waveIndex, level, true);
        }

        battle.enemyParty[e] = globalScene.addEnemyPokemon(enemySpecies, level, TrainerSlot.NONE, isBoss, false, dataSource);
      }
    }

    const enemyPokemon = globalScene.getEnemyParty()[e];

    // Make sure basic data is clean
    enemyPokemon.hp = enemyPokemon.getMaxHp();
    enemyPokemon.status = null;
    enemyPokemon.passive = false;

    if (e < (doubleBattle ? 2 : 1)) {
      enemyPokemon.setX(-66 + enemyPokemon.getFieldPositionOffset()[0]);
      enemyPokemon.resetSummonData();
    }

    if (!loaded && isNullOrUndefined(partyConfig.countAsSeen) || partyConfig.countAsSeen) {
      globalScene.gameData.setPokemonSeen(enemyPokemon, true, !!(trainerType || trainerConfig));
    }

    if (partyConfig?.pokemonConfigs && e < partyConfig.pokemonConfigs.length) {
      const config = partyConfig.pokemonConfigs[e];

      // Set form
      if (!isNullOrUndefined(config.nickname)) {
        enemyPokemon.nickname = btoa(unescape(encodeURIComponent(config.nickname)));
      }

      // Generate new id, reset status and HP in case using data source
      if (config.dataSource) {
        enemyPokemon.id = Utils.randSeedInt(4294967296);
      }

      // Set form
      if (!isNullOrUndefined(config.formIndex)) {
        enemyPokemon.formIndex = config.formIndex;
      }

      // Set shiny
      if (!isNullOrUndefined(config.shiny)) {
        enemyPokemon.shiny = config.shiny;
      }

      // Set Variant
      if (enemyPokemon.shiny && !isNullOrUndefined(config.variant)) {
        enemyPokemon.variant = config.variant;
      }

      // Set custom mystery encounter data fields (such as sprite scale, custom abilities, types, etc.)
      if (!isNullOrUndefined(config.customPokemonData)) {
        enemyPokemon.customPokemonData = config.customPokemonData;
      }

      // Set Boss
      if (config.isBoss) {
        let segments = !isNullOrUndefined(config.bossSegments) ? config.bossSegments! : globalScene.getEncounterBossSegments(globalScene.currentBattle.waveIndex, level, enemySpecies, true);
        if (!isNullOrUndefined(config.bossSegmentModifier)) {
          segments += config.bossSegmentModifier;
        }
        enemyPokemon.setBoss(true, segments);
      }

      // Set Passive
      if (config.passive) {
        enemyPokemon.passive = true;
      }

      // Set Nature
      if (config.nature) {
        enemyPokemon.nature = config.nature;
      }

      // Set IVs
      if (config.ivs) {
        enemyPokemon.ivs = config.ivs;
      }

      // Set Status
      const statusEffects = config.status;
      if (statusEffects) {
        // Default to cureturn 3 for sleep
        const status = Array.isArray(statusEffects) ? statusEffects[0] : statusEffects;
        const cureTurn = Array.isArray(statusEffects) ? statusEffects[1] : statusEffects === StatusEffect.SLEEP ? 3 : undefined;
        enemyPokemon.status = new Status(status, 0, cureTurn);
      }

      // Set summon data fields
      if (!enemyPokemon.summonData) {
        enemyPokemon.summonData = new PokemonSummonData();
      }

      // Set ability
      if (!isNullOrUndefined(config.abilityIndex)) {
        enemyPokemon.abilityIndex = config.abilityIndex;
      }

      // Set gender
      if (!isNullOrUndefined(config.gender)) {
        enemyPokemon.gender = config.gender!;
        enemyPokemon.summonData.gender = config.gender;
      }

      // Set AI type
      if (!isNullOrUndefined(config.aiType)) {
        enemyPokemon.aiType = config.aiType;
      }

      // Set moves
      if (config?.moveSet && config.moveSet.length > 0) {
        const moves = config.moveSet.map(m => new PokemonMove(m));
        enemyPokemon.moveset = moves;
        enemyPokemon.summonData.moveset = moves;
      }

      // Set tags
      if (config.tags && config.tags.length > 0) {
        const tags = config.tags;
        tags.forEach(tag => enemyPokemon.addTag(tag));
      }

      // mysteryEncounterBattleEffects will only be used IFF MYSTERY_ENCOUNTER_POST_SUMMON tag is applied
      if (config.mysteryEncounterBattleEffects) {
        enemyPokemon.mysteryEncounterBattleEffects = config.mysteryEncounterBattleEffects;
      }

      // Requires re-priming summon data to update everything properly
      enemyPokemon.primeSummonData(enemyPokemon.summonData);

      if (enemyPokemon.isShiny() && !enemyPokemon["shinySparkle"]) {
        enemyPokemon.initShinySparkle();
      }
      enemyPokemon.initBattleInfo();
      enemyPokemon.getBattleInfo().initInfo(enemyPokemon);
      enemyPokemon.generateName();
    }

    loadEnemyAssets.push(enemyPokemon.loadAssets());

    console.log(`Pokemon: ${enemyPokemon.name}`, `Species ID: ${enemyPokemon.species.speciesId}`, `Stats: ${enemyPokemon.stats}`, `Ability: ${enemyPokemon.getAbility().name}`, `Passive Ability: ${enemyPokemon.getPassiveAbility().name}`);
  });

  globalScene.pushPhase(new MysteryEncounterBattlePhase(partyConfig.disableSwitch));

  await Promise.all(loadEnemyAssets);
  battle.enemyParty.forEach((enemyPokemon_2, e_1) => {
    if (e_1 < (doubleBattle ? 2 : 1)) {
      enemyPokemon_2.setVisible(false);
      if (battle.double) {
        enemyPokemon_2.setFieldPosition(e_1 ? FieldPosition.RIGHT : FieldPosition.LEFT);
      }
      // Spawns at current visible field instead of on "next encounter" field (off screen to the left)
      enemyPokemon_2.x += 300;
    }
  });
  if (!loaded) {
    regenerateModifierPoolThresholds(globalScene.getEnemyField(), battle.battleType === BattleType.TRAINER ? ModifierPoolType.TRAINER : ModifierPoolType.WILD);
    const customModifierTypes = partyConfig?.pokemonConfigs
      ?.filter(config => config?.modifierConfigs)
      .map(config => config.modifierConfigs!);
    globalScene.generateEnemyModifiers(customModifierTypes);
  }
}

/**
 * Load special move animations/sfx for hard-coded encounter-specific moves that a pokemon uses at the start of an encounter
 * See: [startOfBattleEffects](IMysteryEncounter.startOfBattleEffects) for more details
 *
 * This promise does not need to be awaited on if called in an encounter onInit (will just load lazily)
 * @param moves
 */
export function loadCustomMovesForEncounter(moves: Moves | Moves[]) {
  moves = Array.isArray(moves) ? moves : [ moves ];
  return Promise.all(moves.map(move => initMoveAnim(move)))
    .then(() => loadMoveAnimAssets(moves));
}

/**
 * Will update player money, and animate change (sound optional)
 * @param changeValue
 * @param playSound
 * @param showMessage
 */
export function updatePlayerMoney(changeValue: number, playSound: boolean = true, showMessage: boolean = true) {
  globalScene.money = Math.min(Math.max(globalScene.money + changeValue, 0), Number.MAX_SAFE_INTEGER);
  globalScene.updateMoneyText();
  globalScene.animateMoneyChanged(false);
  if (playSound) {
    globalScene.playSound("se/buy");
  }
  if (showMessage) {
    if (changeValue < 0) {
      globalScene.queueMessage(i18next.t("mysteryEncounterMessages:paid_money", { amount: -changeValue }), null, true);
    } else {
      globalScene.queueMessage(i18next.t("mysteryEncounterMessages:receive_money", { amount: changeValue }), null, true);
    }
  }
}

/**
 * Converts modifier bullshit to an actual item
 * @param modifier
 * @param pregenArgs Can specify BerryType for berries, TM for TMs, AttackBoostType for item, etc.
 */
export function generateModifierType(modifier: () => ModifierType, pregenArgs?: any[]): ModifierType | null {
  const modifierId = Object.keys(modifierTypes).find(k => modifierTypes[k] === modifier);
  if (!modifierId) {
    return null;
  }

  let result: ModifierType = modifierTypes[modifierId]();

  // Populates item id and tier (order matters)
  result = result
    .withIdFromFunc(modifierTypes[modifierId])
    .withTierFromPool(ModifierPoolType.PLAYER, globalScene.getPlayerParty());

  return result instanceof ModifierTypeGenerator ? result.generateType(globalScene.getPlayerParty(), pregenArgs) : result;
}

/**
 * Converts modifier bullshit to an actual item
 * @param modifier
 * @param pregenArgs - can specify BerryType for berries, TM for TMs, AttackBoostType for item, etc.
 */
export function generateModifierTypeOption(modifier: () => ModifierType, pregenArgs?: any[]): ModifierTypeOption | null {
  const result = generateModifierType(modifier, pregenArgs);
  if (result) {
    return new ModifierTypeOption(result, 0);
  }
  return result;
}

/**
 * This function is intended for use inside onPreOptionPhase() of an encounter option
 * @param onPokemonSelected - Any logic that needs to be performed when Pokemon is chosen
 * If a second option needs to be selected, onPokemonSelected should return a OptionSelectItem[] object
 * @param onPokemonNotSelected - Any logic that needs to be performed if no Pokemon is chosen
 * @param selectablePokemonFilter
 */
export function selectPokemonForOption(onPokemonSelected: (pokemon: PlayerPokemon) => void | OptionSelectItem[], onPokemonNotSelected?: () => void, selectablePokemonFilter?: PokemonSelectFilter): Promise<boolean> {
  return new Promise(resolve => {
    const modeToSetOnExit = globalScene.ui.getMode();

    // Open party screen to choose pokemon
    globalScene.ui.setMode(Mode.PARTY, PartyUiMode.SELECT, -1, (slotIndex: number, option: PartyOption) => {
      if (slotIndex < globalScene.getPlayerParty().length) {
        globalScene.ui.setMode(modeToSetOnExit).then(() => {
          const pokemon = globalScene.getPlayerParty()[slotIndex];
          const secondaryOptions = onPokemonSelected(pokemon);
          if (!secondaryOptions) {
            globalScene.currentBattle.mysteryEncounter!.setDialogueToken("selectedPokemon", pokemon.getNameToRender());
            resolve(true);
            return;
          }

          // There is a second option to choose after selecting the Pokemon
          globalScene.ui.setMode(Mode.MESSAGE).then(() => {
            const displayOptions = () => {
              // Always appends a cancel option to bottom of options
              const fullOptions = secondaryOptions.map(option => {
                // Update handler to resolve promise
                const onSelect = option.handler;
                option.handler = () => {
                  onSelect();
                  globalScene.currentBattle.mysteryEncounter!.setDialogueToken("selectedPokemon", pokemon.getNameToRender());
                  resolve(true);
                  return true;
                };
                return option;
              }).concat({
                label: i18next.t("menu:cancel"),
                handler: () => {
                  globalScene.ui.clearText();
                  globalScene.ui.setMode(modeToSetOnExit);
                  resolve(false);
                  return true;
                },
                onHover: () => {
                  showEncounterText(i18next.t("mysteryEncounterMessages:cancel_option"), 0, 0, false);
                }
              });

              const config: OptionSelectConfig = {
                options: fullOptions,
                maxOptions: 7,
                yOffset: 0,
                supportHover: true
              };

              // Do hover over the starting selection option
              if (fullOptions[0].onHover) {
                fullOptions[0].onHover();
              }
              globalScene.ui.setModeWithoutClear(Mode.OPTION_SELECT, config, null, true);
            };

            const textPromptKey = globalScene.currentBattle.mysteryEncounter?.selectedOption?.dialogue?.secondOptionPrompt;
            if (!textPromptKey) {
              displayOptions();
            } else {
              showEncounterText(textPromptKey).then(() => displayOptions());
            }
          });
        });
      } else {
        globalScene.ui.setMode(modeToSetOnExit).then(() => {
          if (onPokemonNotSelected) {
            onPokemonNotSelected();
          }
          resolve(false);
        });
      }
    }, selectablePokemonFilter);
  });
}

interface PokemonAndOptionSelected {
  selectedPokemonIndex: number;
  selectedOptionIndex: number;
}

/**
 * This function is intended for use inside `onPreOptionPhase()` of an encounter option
 *
 * If a second option needs to be selected, `onPokemonSelected` should return a {@linkcode OptionSelectItem}`[]` object
 * @param options
 * @param optionSelectPromptKey
 * @param selectablePokemonFilter
 * @param onHoverOverCancelOption
 */
export function selectOptionThenPokemon(options: OptionSelectItem[], optionSelectPromptKey: string, selectablePokemonFilter?: PokemonSelectFilter, onHoverOverCancelOption?: () => void): Promise<PokemonAndOptionSelected | null> {
  return new Promise<PokemonAndOptionSelected | null>(resolve => {
    const modeToSetOnExit = globalScene.ui.getMode();

    const displayOptions = (config: OptionSelectConfig) => {
      globalScene.ui.setMode(Mode.MESSAGE).then(() => {
        if (!optionSelectPromptKey) {
          // Do hover over the starting selection option
          if (fullOptions[0].onHover) {
            fullOptions[0].onHover();
          }
          globalScene.ui.setMode(Mode.OPTION_SELECT, config);
        } else {
          showEncounterText(optionSelectPromptKey).then(() => {
            // Do hover over the starting selection option
            if (fullOptions[0].onHover) {
              fullOptions[0].onHover();
            }
            globalScene.ui.setMode(Mode.OPTION_SELECT, config);
          });
        }
      });
    };

    const selectPokemonAfterOption = (selectedOptionIndex: number) => {
      // Open party screen to choose a Pokemon
      globalScene.ui.setMode(Mode.PARTY, PartyUiMode.SELECT, -1, (slotIndex: number, option: PartyOption) => {
        if (slotIndex < globalScene.getPlayerParty().length) {
          // Pokemon and option selected
          globalScene.ui.setMode(modeToSetOnExit).then(() => {
            const result: PokemonAndOptionSelected = { selectedPokemonIndex: slotIndex, selectedOptionIndex: selectedOptionIndex };
            resolve(result);
          });
        } else {
          // Back to first option select screen
          displayOptions(config);
        }
      }, selectablePokemonFilter);
    };

    // Always appends a cancel option to bottom of options
    const fullOptions = options.map((option, index) => {
      // Update handler to resolve promise
      const onSelect = option.handler;
      option.handler = () => {
        onSelect();
        selectPokemonAfterOption(index);
        return true;
      };
      return option;
    }).concat({
      label: i18next.t("menu:cancel"),
      handler: () => {
        globalScene.ui.clearText();
        globalScene.ui.setMode(modeToSetOnExit);
        resolve(null);
        return true;
      },
      onHover: () => {
        if (onHoverOverCancelOption) {
          onHoverOverCancelOption();
        }
        showEncounterText(i18next.t("mysteryEncounterMessages:cancel_option"), 0, 0, false);
      }
    });

    const config: OptionSelectConfig = {
      options: fullOptions,
      maxOptions: 7,
      yOffset: 0,
      supportHover: true
    };

    displayOptions(config);
  });
}

/**
 * Will initialize reward phases to follow the mystery encounter
 * Can have shop displayed or skipped
 * @param customShopRewards - adds a shop phase with the specified rewards / reward tiers
 * @param eggRewards
 * @param preRewardsCallback - can execute an arbitrary callback before the new phases if necessary (useful for updating items/party/injecting new phases before {@linkcode MysteryEncounterRewardsPhase})
 */
export function setEncounterRewards(customShopRewards?: CustomModifierSettings, eggRewards?: IEggOptions[], preRewardsCallback?: Function) {
  globalScene.currentBattle.mysteryEncounter!.doEncounterRewards = () => {
    if (preRewardsCallback) {
      preRewardsCallback();
    }

    if (customShopRewards) {
      globalScene.unshiftPhase(new SelectModifierPhase(0, undefined, customShopRewards));
    } else {
      globalScene.tryRemovePhase(p => p instanceof SelectModifierPhase);
    }

    if (eggRewards) {
      eggRewards.forEach(eggOptions => {
        const egg = new Egg(eggOptions);
        egg.addEggToGameData();
      });
    }

    return true;
  };
}

/**
 * Will initialize exp phases into the phase queue (these are in addition to any combat or other exp earned)
 * Exp Share and Exp Balance will still function as normal
 * @param participantId - id/s of party pokemon that get full exp value. Other party members will receive Exp Share amounts
 * @param baseExpValue - gives exp equivalent to a pokemon of the wave index's level.
 *
 * Guidelines:
 * ```md
 * 36 - Sunkern (lowest in game)
 * 62-64 - regional starter base evos
 * 100 - Scyther
 * 170 - Spiritomb
 * 250 - Gengar
 * 290 - trio legendaries
 * 340 - box legendaries
 * 608 - Blissey (highest in game)
 * ```
 * https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_effort_value_yield_(Generation_IX)
 * @param useWaveIndex - set to false when directly passing the the full exp value instead of baseExpValue
 */
export function setEncounterExp(participantId: number | number[], baseExpValue: number, useWaveIndex: boolean = true) {
  const participantIds = Array.isArray(participantId) ? participantId : [ participantId ];

  globalScene.currentBattle.mysteryEncounter!.doEncounterExp = () => {
    globalScene.unshiftPhase(new PartyExpPhase(baseExpValue, useWaveIndex, new Set(participantIds)));

    return true;
  };
}

export class OptionSelectSettings {
  hideDescription?: boolean;
  slideInDescription?: boolean;
  overrideTitle?: string;
  overrideDescription?: string;
  overrideQuery?: string;
  overrideOptions?: MysteryEncounterOption[];
  startingCursorIndex?: number;
}

/**
 * Can be used to queue a new series of Options to select for an Encounter
 * MUST be used only in onOptionPhase, will not work in onPreOptionPhase or onPostOptionPhase
 * @param optionSelectSettings
 */
export function initSubsequentOptionSelect(optionSelectSettings: OptionSelectSettings) {
  globalScene.pushPhase(new MysteryEncounterPhase(optionSelectSettings));
}

/**
 * Can be used to exit an encounter without any battles or followup
 * Will skip any shops and rewards, and queue the next encounter phase as normal
 * @param addHealPhase - when true, will add a shop phase to end of encounter with 0 rewards but healing items are available
 * @param encounterMode - Can set custom encounter mode if necessary (may be required for forcing Pokemon to return before next phase)
 */
export function leaveEncounterWithoutBattle(addHealPhase: boolean = false, encounterMode: MysteryEncounterMode = MysteryEncounterMode.NO_BATTLE) {
  globalScene.currentBattle.mysteryEncounter!.encounterMode = encounterMode;
  globalScene.clearPhaseQueue();
  globalScene.clearPhaseQueueSplice();
  handleMysteryEncounterVictory(addHealPhase);
}

/**
 *
 * @param addHealPhase - Adds an empty shop phase to allow player to purchase healing items
 * @param doNotContinue - default `false`. If set to true, will not end the battle and continue to next wave
 */
export function handleMysteryEncounterVictory(addHealPhase: boolean = false, doNotContinue: boolean = false) {
  const allowedPkm = globalScene.getPlayerParty().filter((pkm) => pkm.isAllowedInBattle());

  if (allowedPkm.length === 0) {
    globalScene.clearPhaseQueue();
    globalScene.unshiftPhase(new GameOverPhase());
    return;
  }

  // If in repeated encounter variant, do nothing
  // Variant must eventually be swapped in order to handle "true" end of the encounter
  const encounter = globalScene.currentBattle.mysteryEncounter!;
  if (encounter.continuousEncounter || doNotContinue) {
    return;
  } else if (encounter.encounterMode === MysteryEncounterMode.NO_BATTLE) {
    globalScene.pushPhase(new MysteryEncounterRewardsPhase(addHealPhase));
    globalScene.pushPhase(new EggLapsePhase());
  } else if (!globalScene.getEnemyParty().find(p => encounter.encounterMode !== MysteryEncounterMode.TRAINER_BATTLE ? p.isOnField() : !p?.isFainted(true))) {
    globalScene.pushPhase(new BattleEndPhase(true));
    if (encounter.encounterMode === MysteryEncounterMode.TRAINER_BATTLE) {
      globalScene.pushPhase(new TrainerVictoryPhase());
    }
    if (globalScene.gameMode.isEndless || !globalScene.gameMode.isWaveFinal(globalScene.currentBattle.waveIndex)) {
      globalScene.pushPhase(new MysteryEncounterRewardsPhase(addHealPhase));
      if (!encounter.doContinueEncounter) {
        // Only lapse eggs once for multi-battle encounters
        globalScene.pushPhase(new EggLapsePhase());
      }
    }
  }
}

/**
 * Similar to {@linkcode handleMysteryEncounterVictory}, but for cases where the player lost a battle or failed a challenge
 * @param addHealPhase
 */
export function handleMysteryEncounterBattleFailed(addHealPhase: boolean = false, doNotContinue: boolean = false) {
  const allowedPkm = globalScene.getPlayerParty().filter((pkm) => pkm.isAllowedInBattle());

  if (allowedPkm.length === 0) {
    globalScene.clearPhaseQueue();
    globalScene.unshiftPhase(new GameOverPhase());
    return;
  }

  // If in repeated encounter variant, do nothing
  // Variant must eventually be swapped in order to handle "true" end of the encounter
  const encounter = globalScene.currentBattle.mysteryEncounter!;
  if (encounter.continuousEncounter || doNotContinue) {
    return;
  } else if (encounter.encounterMode !== MysteryEncounterMode.NO_BATTLE) {
    globalScene.pushPhase(new BattleEndPhase(false));
  }

  globalScene.pushPhase(new MysteryEncounterRewardsPhase(addHealPhase));

  if (!encounter.doContinueEncounter) {
    // Only lapse eggs once for multi-battle encounters
    globalScene.pushPhase(new EggLapsePhase());
  }
}

/**
 *
 * @param hide - If true, performs ease out and hide visuals. If false, eases in visuals. Defaults to true
 * @param destroy - If true, will destroy visuals ONLY ON HIDE TRANSITION. Does nothing on show. Defaults to true
 * @param duration
 */
export function transitionMysteryEncounterIntroVisuals(hide: boolean = true, destroy: boolean = true, duration: number = 750): Promise<boolean> {
  return new Promise(resolve => {
    const introVisuals = globalScene.currentBattle.mysteryEncounter!.introVisuals;
    const enemyPokemon = globalScene.getEnemyField();
    if (enemyPokemon) {
      globalScene.currentBattle.enemyParty = [];
    }
    if (introVisuals) {
      if (!hide) {
        // Make sure visuals are in proper state for showing
        introVisuals.setVisible(true);
        introVisuals.x = 244;
        introVisuals.y = 60;
        introVisuals.alpha = 0;
      }

      // Transition
      globalScene.tweens.add({
        targets: [ introVisuals, enemyPokemon ],
        x: `${hide ? "+" : "-"}=16`,
        y: `${hide ? "-" : "+"}=16`,
        alpha: hide ? 0 : 1,
        ease: "Sine.easeInOut",
        duration,
        onComplete: () => {
          if (hide && destroy) {
            globalScene.field.remove(introVisuals, true);

            enemyPokemon.forEach(pokemon => {
              globalScene.field.remove(pokemon, true);
            });

            globalScene.currentBattle.mysteryEncounter!.introVisuals = undefined;
          }
          resolve(true);
        }
      });
    } else {
      resolve(true);
    }
  });
}

/**
 * Will queue moves for any pokemon to use before the first CommandPhase of a battle
 * Mostly useful for allowing {@linkcode MysteryEncounter} enemies to "cheat" and use moves before the first turn
 */
export function handleMysteryEncounterBattleStartEffects() {
  const encounter = globalScene.currentBattle.mysteryEncounter;
  if (globalScene.currentBattle.isBattleMysteryEncounter() && encounter && encounter.encounterMode !== MysteryEncounterMode.NO_BATTLE && !encounter.startOfBattleEffectsComplete) {
    const effects = encounter.startOfBattleEffects;
    effects.forEach(effect => {
      let source;
      if (effect.sourcePokemon) {
        source = effect.sourcePokemon;
      } else if (!isNullOrUndefined(effect.sourceBattlerIndex)) {
        if (effect.sourceBattlerIndex === BattlerIndex.ATTACKER) {
          source = globalScene.getEnemyField()[0];
        } else if (effect.sourceBattlerIndex === BattlerIndex.ENEMY) {
          source = globalScene.getEnemyField()[0];
        } else if (effect.sourceBattlerIndex === BattlerIndex.ENEMY_2) {
          source = globalScene.getEnemyField()[1];
        } else if (effect.sourceBattlerIndex === BattlerIndex.PLAYER) {
          source = globalScene.getPlayerField()[0];
        } else if (effect.sourceBattlerIndex === BattlerIndex.PLAYER_2) {
          source = globalScene.getPlayerField()[1];
        }
      } else {
        source = globalScene.getEnemyField()[0];
      }
      globalScene.pushPhase(new MovePhase(source, effect.targets, effect.move, effect.followUp, effect.ignorePp));
    });

    // Pseudo turn end phase to reset flinch states, Endure, etc.
    globalScene.pushPhase(new MysteryEncounterBattleStartCleanupPhase());

    encounter.startOfBattleEffectsComplete = true;
  }
}

/**
 * Can queue extra phases or logic during {@linkcode TurnInitPhase}
 * Should mostly just be used for injecting custom phases into the battle system on turn start
 * @return boolean - if true, will skip the remainder of the {@linkcode TurnInitPhase}
 */
export function handleMysteryEncounterTurnStartEffects(): boolean {
  const encounter = globalScene.currentBattle.mysteryEncounter;
  if (globalScene.currentBattle.isBattleMysteryEncounter() && encounter && encounter.onTurnStart) {
    return encounter.onTurnStart();
  }

  return false;
}

/**
 * Helper function for encounters such as {@linkcode UncommonBreedEncounter} which call for a random species including event encounters.
 * If the mon is from the event encounter list, it will do an extra shiny roll.
 * @param level the level of the mon, which differs between MEs
 * @param isBoss whether the mon should be a Boss
 * @param rerollHidden whether the mon should get an extra roll for Hidden Ability
 * @returns {@linkcode EnemyPokemon} for the requested encounter
 */
export function getRandomEncounterSpecies(level: number, isBoss: boolean = false, rerollHidden: boolean = false): EnemyPokemon {
  let bossSpecies: PokemonSpecies;
  let isEventEncounter = false;
  const eventEncounters = globalScene.eventManager.getEventEncounters();

  if (eventEncounters.length > 0 && randSeedInt(2) === 1) {
    const eventEncounter = randSeedItem(eventEncounters);
    const levelSpecies = getPokemonSpecies(eventEncounter.species).getWildSpeciesForLevel(level, !isNullOrUndefined(eventEncounter.blockEvolution), isBoss, globalScene.gameMode);
    isEventEncounter = true;
    bossSpecies = getPokemonSpecies(levelSpecies);
  } else {
    bossSpecies = globalScene.arena.randomSpecies(globalScene.currentBattle.waveIndex, level, 0, getPartyLuckValue(globalScene.getPlayerParty()), isBoss);
  }
  const ret = new EnemyPokemon(bossSpecies, level, TrainerSlot.NONE, isBoss);

  //Reroll shiny for event encounters
  if (isEventEncounter && !ret.shiny) {
    ret.trySetShinySeed();
  }
  //Reroll hidden ability
  if (rerollHidden && ret.abilityIndex !== 2 && ret.species.abilityHidden) {
    ret.tryRerollHiddenAbilitySeed();
  }

  return ret;
}

/**
 * TODO: remove once encounter spawn rate is finalized
 * Just a helper function to calculate aggregate stats for MEs in a Classic run
 * @param baseSpawnWeight
 */
export function calculateMEAggregateStats(baseSpawnWeight: number) {
  const numRuns = 1000;
  let run = 0;
  const biomes = Object.keys(Biome).filter(key => isNaN(Number(key)));
  const alwaysPickTheseBiomes = [ Biome.ISLAND, Biome.ABYSS, Biome.WASTELAND, Biome.FAIRY_CAVE, Biome.TEMPLE, Biome.LABORATORY, Biome.SPACE, Biome.WASTELAND ];

  const calculateNumEncounters = (): any[] => {
    let encounterRate = baseSpawnWeight; // BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT
    const numEncounters = [ 0, 0, 0, 0 ];
    let mostRecentEncounterWave = 0;
    const encountersByBiome = new Map<string, number>(biomes.map(b => [ b, 0 ]));
    const validMEfloorsByBiome = new Map<string, number>(biomes.map(b => [ b, 0 ]));
    let currentBiome = Biome.TOWN;
    let currentArena = globalScene.newArena(currentBiome);
    globalScene.setSeed(Utils.randomString(24));
    globalScene.resetSeed();
    for (let i = 10; i < 180; i++) {
      // Boss
      if (i % 10 === 0) {
        continue;
      }

      // New biome
      if (i % 10 === 1) {
        if (Array.isArray(biomeLinks[currentBiome])) {
          let biomes: Biome[];
          globalScene.executeWithSeedOffset(() => {
            biomes = (biomeLinks[currentBiome] as (Biome | [Biome, number])[])
              .filter(b => {
                return !Array.isArray(b) || !Utils.randSeedInt(b[1]);
              })
              .map(b => !Array.isArray(b) ? b : b[0]);
          }, i * 100);
          if (biomes! && biomes.length > 0) {
            const specialBiomes = biomes.filter(b => alwaysPickTheseBiomes.includes(b));
            if (specialBiomes.length > 0) {
              currentBiome = specialBiomes[Utils.randSeedInt(specialBiomes.length)];
            } else {
              currentBiome = biomes[Utils.randSeedInt(biomes.length)];
            }
          }
        } else if (biomeLinks.hasOwnProperty(currentBiome)) {
          currentBiome = (biomeLinks[currentBiome] as Biome);
        } else {
          if (!(i % 50)) {
            currentBiome = Biome.END;
          } else {
            currentBiome = globalScene.generateRandomBiome(i);
          }
        }

        currentArena = globalScene.newArena(currentBiome);
      }

      // Fixed battle
      if (globalScene.gameMode.isFixedBattle(i)) {
        continue;
      }

      // Trainer
      if (globalScene.gameMode.isWaveTrainer(i, currentArena)) {
        continue;
      }

      // Otherwise, roll encounter

      const roll = Utils.randSeedInt(256);
      validMEfloorsByBiome.set(Biome[currentBiome], (validMEfloorsByBiome.get(Biome[currentBiome]) ?? 0) + 1);

      // If total number of encounters is lower than expected for the run, slightly favor a new encounter
      // Do the reverse as well
      const expectedEncountersByFloor = AVERAGE_ENCOUNTERS_PER_RUN_TARGET / (180 - 10) * (i - 10);
      const currentRunDiffFromAvg = expectedEncountersByFloor - numEncounters.reduce((a, b) => a + b);
      const favoredEncounterRate = encounterRate + currentRunDiffFromAvg * 15;

      // If the most recent ME was 3 or fewer waves ago, can never spawn a ME
      const canSpawn = (i - mostRecentEncounterWave) > 3;

      if (canSpawn && roll < favoredEncounterRate) {
        mostRecentEncounterWave = i;
        encounterRate = baseSpawnWeight;

        // Calculate encounter rarity
        // Common / Uncommon / Rare / Super Rare (base is out of 128)
        const tierWeights = [ 66, 40, 19, 3 ];

        // Adjust tier weights by currently encountered events (pity system that lowers odds of multiple Common/Great)
        tierWeights[0] = tierWeights[0] - 6 * numEncounters[0];
        tierWeights[1] = tierWeights[1] - 4 * numEncounters[1];

        const totalWeight = tierWeights.reduce((a, b) => a + b);
        const tierValue = Utils.randSeedInt(totalWeight);
        const commonThreshold = totalWeight - tierWeights[0]; // 64 - 32 = 32
        const uncommonThreshold = totalWeight - tierWeights[0] - tierWeights[1]; // 64 - 32 - 16 = 16
        const rareThreshold = totalWeight - tierWeights[0] - tierWeights[1] - tierWeights[2]; // 64 - 32 - 16 - 10 = 6

        tierValue > commonThreshold ? ++numEncounters[0] : tierValue > uncommonThreshold ? ++numEncounters[1] : tierValue > rareThreshold ? ++numEncounters[2] : ++numEncounters[3];
        encountersByBiome.set(Biome[currentBiome], (encountersByBiome.get(Biome[currentBiome]) ?? 0) + 1);
      } else {
        encounterRate += WEIGHT_INCREMENT_ON_SPAWN_MISS;
      }
    }

    return [ numEncounters, encountersByBiome, validMEfloorsByBiome ];
  };

  const encounterRuns: number[][] = [];
  const encountersByBiomeRuns: Map<string, number>[] = [];
  const validFloorsByBiome: Map<string, number>[] = [];
  while (run < numRuns) {
    globalScene.executeWithSeedOffset(() => {
      const [ numEncounters, encountersByBiome, validMEfloorsByBiome ] = calculateNumEncounters();
      encounterRuns.push(numEncounters);
      encountersByBiomeRuns.push(encountersByBiome);
      validFloorsByBiome.push(validMEfloorsByBiome);
    }, 1000 * run);
    run++;
  }

  const n = encounterRuns.length;
  const totalEncountersInRun = encounterRuns.map(run => run.reduce((a, b) => a + b));
  const totalMean = totalEncountersInRun.reduce((a, b) => a + b) / n;
  const totalStd = Math.sqrt(totalEncountersInRun.map(x => Math.pow(x - totalMean, 2)).reduce((a, b) => a + b) / n);
  const commonMean = encounterRuns.reduce((a, b) => a + b[0], 0) / n;
  const uncommonMean = encounterRuns.reduce((a, b) => a + b[1], 0) / n;
  const rareMean = encounterRuns.reduce((a, b) => a + b[2], 0) / n;
  const superRareMean = encounterRuns.reduce((a, b) => a + b[3], 0) / n;

  const encountersPerRunPerBiome = encountersByBiomeRuns.reduce((a, b) => {
    for (const biome of a.keys()) {
      a.set(biome, a.get(biome)! + b.get(biome)!);
    }
    return a;
  });
  const meanEncountersPerRunPerBiome: Map<string, number> = new Map<string, number>();
  encountersPerRunPerBiome.forEach((value, key) => {
    meanEncountersPerRunPerBiome.set(key, value / n);
  });

  const validMEFloorsPerRunPerBiome = validFloorsByBiome.reduce((a, b) => {
    for (const biome of a.keys()) {
      a.set(biome, a.get(biome)! + b.get(biome)!);
    }
    return a;
  });
  const meanMEFloorsPerRunPerBiome: Map<string, number> = new Map<string, number>();
  validMEFloorsPerRunPerBiome.forEach((value, key) => {
    meanMEFloorsPerRunPerBiome.set(key, value / n);
  });

  let stats = `Starting weight: ${baseSpawnWeight}\nAverage MEs per run: ${totalMean}\nStandard Deviation: ${totalStd}\nAvg Commons: ${commonMean}\nAvg Greats: ${uncommonMean}\nAvg Ultras: ${rareMean}\nAvg Rogues: ${superRareMean}\n`;

  const meanEncountersPerRunPerBiomeSorted = [ ...meanEncountersPerRunPerBiome.entries() ].sort((e1, e2) => e2[1] - e1[1]);
  meanEncountersPerRunPerBiomeSorted.forEach(value => stats = stats + `${value[0]}: avg valid floors ${meanMEFloorsPerRunPerBiome.get(value[0])}, avg MEs ${value[1]},\n`);

  console.log(stats);
}


/**
 * TODO: remove once encounter spawn rate is finalized
 * Just a helper function to calculate aggregate stats for MEs in a Classic run
 * @param luckValue - 0 to 14
 */
export function calculateRareSpawnAggregateStats(luckValue: number) {
  const numRuns = 1000;
  let run = 0;

  const calculateNumRareEncounters = (): any[] => {
    const bossEncountersByRarity = [ 0, 0, 0, 0 ];
    globalScene.setSeed(Utils.randomString(24));
    globalScene.resetSeed();
    // There are 12 wild boss floors
    for (let i = 0; i < 12; i++) {
      // Roll boss tier
      // luck influences encounter rarity
      let luckModifier = 0;
      if (!isNaN(luckValue)) {
        luckModifier = luckValue * 0.5;
      }
      const tierValue = Utils.randSeedInt(64 - luckModifier);
      const tier = tierValue >= 20 ? BiomePoolTier.BOSS : tierValue >= 6 ? BiomePoolTier.BOSS_RARE : tierValue >= 1 ? BiomePoolTier.BOSS_SUPER_RARE : BiomePoolTier.BOSS_ULTRA_RARE;

      switch (tier) {
        default:
        case BiomePoolTier.BOSS:
          ++bossEncountersByRarity[0];
          break;
        case BiomePoolTier.BOSS_RARE:
          ++bossEncountersByRarity[1];
          break;
        case BiomePoolTier.BOSS_SUPER_RARE:
          ++bossEncountersByRarity[2];
          break;
        case BiomePoolTier.BOSS_ULTRA_RARE:
          ++bossEncountersByRarity[3];
          break;
      }
    }

    return bossEncountersByRarity;
  };

  const encounterRuns: number[][] = [];
  while (run < numRuns) {
    globalScene.executeWithSeedOffset(() => {
      const bossEncountersByRarity = calculateNumRareEncounters();
      encounterRuns.push(bossEncountersByRarity);
    }, 1000 * run);
    run++;
  }

  const n = encounterRuns.length;
  // const totalEncountersInRun = encounterRuns.map(run => run.reduce((a, b) => a + b));
  // const totalMean = totalEncountersInRun.reduce((a, b) => a + b) / n;
  // const totalStd = Math.sqrt(totalEncountersInRun.map(x => Math.pow(x - totalMean, 2)).reduce((a, b) => a + b) / n);
  const commonMean = encounterRuns.reduce((a, b) => a + b[0], 0) / n;
  const rareMean = encounterRuns.reduce((a, b) => a + b[1], 0) / n;
  const superRareMean = encounterRuns.reduce((a, b) => a + b[2], 0) / n;
  const ultraRareMean = encounterRuns.reduce((a, b) => a + b[3], 0) / n;

  const stats = `Avg Commons: ${commonMean}\nAvg Rare: ${rareMean}\nAvg Super Rare: ${superRareMean}\nAvg Ultra Rare: ${ultraRareMean}\n`;

  console.log(stats);
}
