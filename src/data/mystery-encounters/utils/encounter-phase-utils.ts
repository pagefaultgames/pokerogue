import { BattlerIndex, BattleType } from "#app/battle";
import { biomeLinks } from "#app/data/biomes";
import MysteryEncounterOption from "#app/data/mystery-encounters/mystery-encounter-option";
import { WIGHT_INCREMENT_ON_SPAWN_MISS } from "#app/data/mystery-encounters/mystery-encounters";
import { queueEncounterMessage, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import Pokemon, { FieldPosition, PlayerPokemon, PokemonMove } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { ExpBalanceModifier, ExpShareModifier, MultipleParticipantExpBonusModifier, PokemonExpBoosterModifier } from "#app/modifier/modifier";
import { CustomModifierSettings, getModifierPoolForType, ModifierPoolType, ModifierType, ModifierTypeFunc, ModifierTypeGenerator, ModifierTypeOption, modifierTypes, PokemonHeldItemModifierType, regenerateModifierPoolThresholds } from "#app/modifier/modifier-type";
import * as Overrides from "#app/overrides";
import { BattleEndPhase, EggLapsePhase, ExpPhase, GameOverPhase, ModifierRewardPhase, MovePhase, SelectModifierPhase, ShowPartyExpBarPhase, TrainerVictoryPhase } from "#app/phases";
import { MysteryEncounterBattlePhase, MysteryEncounterBattleStartCleanupPhase, MysteryEncounterPhase, MysteryEncounterRewardsPhase } from "#app/phases/mystery-encounter-phases";
import PokemonData from "#app/system/pokemon-data";
import { OptionSelectConfig, OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import { PartyOption, PartyUiMode } from "#app/ui/party-ui-handler";
import { Mode } from "#app/ui/ui";
import { isNullOrUndefined } from "#app/utils";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Biome } from "#enums/biome";
import { TrainerType } from "#enums/trainer-type";
import i18next from "i18next";
import BattleScene from "../../../battle-scene";
import Trainer, { TrainerVariant } from "../../../field/trainer";
import * as Utils from "../../../utils";
import PokemonSpecies from "../../pokemon-species";
import { Status, StatusEffect } from "../../status-effect";
import { TrainerConfig, trainerConfigs, TrainerSlot } from "../../trainer-config";
import { MysteryEncounterVariant } from "../mystery-encounter";
import { Gender } from "#app/data/gender";
import { Moves } from "#enums/moves";
import { initMoveAnim, loadMoveAnimAssets } from "#app/data/battle-anims";

/**
 * Animates exclamation sprite over trainer's head at start of encounter
 * @param scene
 */
export function doTrainerExclamation(scene: BattleScene) {
  const exclamationSprite = scene.addFieldSprite(0, 0, "exclaim");
  exclamationSprite.setName("exclamation");
  scene.field.add(exclamationSprite);
  scene.field.moveTo(exclamationSprite, scene.field.getAll().length - 1);
  exclamationSprite.setVisible(true);
  exclamationSprite.setPosition(110, 68);
  scene.tweens.add({
    targets: exclamationSprite,
    y: "-=25",
    ease: "Cubic.easeOut",
    duration: 300,
    yoyo: true,
    onComplete: () => {
      scene.time.delayedCall(800, () => {
        scene.field.remove(exclamationSprite, true);
      });
    }
  });

  scene.playSound("GEN8- Exclaim.wav", { volume: 0.8 });
}

export interface EnemyPokemonConfig {
  species: PokemonSpecies;
  isBoss: boolean;
  bossSegments?: number;
  bossSegmentModifier?: number; // Additive to the determined segment number
  formIndex?: number;
  level?: number;
  gender?: Gender;
  passive?: boolean;
  moveSet?: Moves[];
  /** Can set just the status, or pass a timer on the status turns */
  status?: StatusEffect | [StatusEffect, number];
  mysteryEncounterBattleEffects?: (pokemon: Pokemon) => void;
  modifierTypes?: PokemonHeldItemModifierType[];
  tags?: BattlerTagType[];
  dataSource?: PokemonData;
}

export interface EnemyPartyConfig {
  levelAdditiveMultiplier?: number; // Formula for enemy: level += waveIndex / 10 * levelAdditive
  doubleBattle?: boolean;
  trainerType?: TrainerType; // Generates trainer battle solely off trainer type
  trainerConfig?: TrainerConfig; // More customizable option for configuring trainer battle
  pokemonConfigs?: EnemyPokemonConfig[];
  female?: boolean; // True for female trainer, false for male
  disableSwitch?: boolean; // True will prevent player from switching
}

/**
 * Generates an enemy party for a mystery encounter battle
 * This will override and replace any standard encounter generation logic
 * Useful for tailoring specific battles to mystery encounters
 * @param scene - Battle Scene
 * @param partyConfig - Can pass various customizable attributes for the enemy party, see EnemyPartyConfig
 */
export async function initBattleWithEnemyConfig(scene: BattleScene, partyConfig: EnemyPartyConfig): Promise<void> {
  const loaded = false;
  const loadEnemyAssets = [];

  const battle = scene.currentBattle;

  let doubleBattle = partyConfig?.doubleBattle;

  // Trainer
  const trainerType = partyConfig?.trainerType;
  let trainerConfig = partyConfig?.trainerConfig;
  if (trainerType || trainerConfig) {
    scene.currentBattle.mysteryEncounter.encounterVariant = MysteryEncounterVariant.TRAINER_BATTLE;
    if (scene.currentBattle.trainer) {
      scene.currentBattle.trainer.setVisible(false);
      scene.currentBattle.trainer.destroy();
    }

    trainerConfig = partyConfig?.trainerConfig ? partyConfig?.trainerConfig : trainerConfigs[trainerType];

    const doubleTrainer = trainerConfig.doubleOnly || (trainerConfig.hasDouble && partyConfig.doubleBattle);
    doubleBattle = doubleTrainer;
    const trainerFemale = isNullOrUndefined(partyConfig.female) ? !!(Utils.randSeedInt(2)) : partyConfig.female;
    const newTrainer = new Trainer(scene, trainerConfig.trainerType, doubleTrainer ? TrainerVariant.DOUBLE : trainerFemale ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT, null, null, null, trainerConfig);
    newTrainer.x += 300;
    newTrainer.setVisible(false);
    scene.field.add(newTrainer);
    scene.currentBattle.trainer = newTrainer;
    loadEnemyAssets.push(newTrainer.loadAssets());

    battle.enemyLevels = scene.currentBattle.trainer.getPartyLevels(scene.currentBattle.waveIndex);
  } else {
    // Wild
    scene.currentBattle.mysteryEncounter.encounterVariant = MysteryEncounterVariant.WILD_BATTLE;
    battle.enemyLevels = new Array(partyConfig?.pokemonConfigs?.length > 0 ? partyConfig?.pokemonConfigs?.length : doubleBattle ? 2 : 1).fill(null).map(() => scene.currentBattle.getLevelForWave());
  }

  scene.getEnemyParty().forEach(enemyPokemon => enemyPokemon.destroy());
  battle.enemyParty = [];
  battle.double = doubleBattle;

  // ME levels are modified by an additive value that scales with wave index
  // Base scaling: Every 10 waves, modifier gets +1 level
  // This can be amplified or counteracted by setting levelAdditiveMultiplier in config
  // levelAdditiveMultiplier value of 0.5 will halve the modifier scaling, 2 will double it, etc.
  // Leaving null/undefined will disable level scaling
  const mult = !isNullOrUndefined(partyConfig.levelAdditiveMultiplier) ? partyConfig.levelAdditiveMultiplier : 0;
  const additive = Math.max(Math.round((scene.currentBattle.waveIndex / 10) * mult), 0);
  battle.enemyLevels = battle.enemyLevels.map(level => level + additive);

  battle.enemyLevels.forEach((level, e) => {
    let enemySpecies;
    let dataSource;
    let isBoss = false;
    if (!loaded) {
      if (trainerType || trainerConfig) {
        battle.enemyParty[e] = battle.trainer.genPartyMember(e);
      } else {
        if (e < partyConfig?.pokemonConfigs?.length) {
          const config = partyConfig?.pokemonConfigs?.[e];
          level = config.level ? config.level : level;
          dataSource = config.dataSource;
          enemySpecies = config.species;
          isBoss = config.isBoss;
          if (isBoss) {
            scene.currentBattle.mysteryEncounter.encounterVariant = MysteryEncounterVariant.BOSS_BATTLE;
          }
        } else {
          enemySpecies = scene.randomSpecies(battle.waveIndex, level, true);
        }

        battle.enemyParty[e] = scene.addEnemyPokemon(enemySpecies, level, TrainerSlot.NONE, isBoss, dataSource);
      }
    }

    const enemyPokemon = scene.getEnemyParty()[e];

    // Make sure basic data is clean
    enemyPokemon.hp = enemyPokemon.getMaxHp();
    enemyPokemon.status = null;
    enemyPokemon.passive = false;

    if (e < (doubleBattle ? 2 : 1)) {
      enemyPokemon.setX(-66 + enemyPokemon.getFieldPositionOffset()[0]);
      enemyPokemon.resetSummonData();
    }

    if (!loaded) {
      scene.gameData.setPokemonSeen(enemyPokemon, true, !!(trainerType || trainerConfig));
    }

    if (e < partyConfig?.pokemonConfigs?.length) {
      const config = partyConfig?.pokemonConfigs?.[e];

      // Generate new id, reset status and HP in case using data source
      if (config.dataSource) {
        enemyPokemon.id = Utils.randSeedInt(4294967296);
      }

      // Set form
      if (!isNullOrUndefined(config.formIndex)) {
        enemyPokemon.formIndex = config.formIndex;
      }

      // Set Boss
      if (config.isBoss) {
        let segments = !isNullOrUndefined(config.bossSegments) ? config.bossSegments : scene.getEncounterBossSegments(scene.currentBattle.waveIndex, level, enemySpecies, true);
        if (!isNullOrUndefined(config.bossSegmentModifier)) {
          segments += config.bossSegmentModifier;
        }
        enemyPokemon.setBoss(true, segments);
      }

      // Set Passive
      if (partyConfig.pokemonConfigs[e].passive) {
        enemyPokemon.passive = true;
      }

      // Set Status
      const statusEffects = partyConfig.pokemonConfigs[e].status;
      if (statusEffects) {
        // Default to cureturn 3 for sleep
        const status = Array.isArray(statusEffects) ? statusEffects[0] : statusEffects;
        const cureTurn = Array.isArray(statusEffects) ? statusEffects[1] : statusEffects === StatusEffect.SLEEP ? 3 : null;
        enemyPokemon.status = new Status(status, 0, cureTurn);
      }

      // Set summon data fields

      // Set gender
      if (!isNullOrUndefined(config.gender)) {
        enemyPokemon.gender = config.gender;
        enemyPokemon.summonData.gender = config.gender;
      }

      // Set moves
      if (config?.moveSet?.length > 0) {
        const moves = config.moveSet.map(m => new PokemonMove(m));
        enemyPokemon.moveset = moves;
        enemyPokemon.summonData.moveset = moves;
      }

      // Set tags
      if (config.tags?.length > 0) {
        const tags = config.tags;
        tags.forEach(tag => enemyPokemon.addTag(tag));
      }

      // mysteryEncounterBattleEffects will only be used IFF MYSTERY_ENCOUNTER_POST_SUMMON tag is applied
      if (config.mysteryEncounterBattleEffects) {
        enemyPokemon.mysteryEncounterBattleEffects = config.mysteryEncounterBattleEffects;
      }

      // Requires re-priming summon data to update everything properly
      enemyPokemon.primeSummonData(enemyPokemon.summonData);

      enemyPokemon.initBattleInfo();
      enemyPokemon.getBattleInfo().initInfo(enemyPokemon);
    }

    loadEnemyAssets.push(enemyPokemon.loadAssets());

    console.log(enemyPokemon.name, enemyPokemon.species.speciesId, enemyPokemon.stats);
  });

  scene.pushPhase(new MysteryEncounterBattlePhase(scene, partyConfig.disableSwitch));

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
    regenerateModifierPoolThresholds(scene.getEnemyField(), battle.battleType === BattleType.TRAINER ? ModifierPoolType.TRAINER : ModifierPoolType.WILD);
    const customModifiers = partyConfig?.pokemonConfigs?.map(config => config?.modifierTypes);
    scene.generateEnemyModifiers(customModifiers);
  }
}

/**
 * Load special move animations/sfx for hard-coded encounter-specific moves that a pokemon uses at the start of an encounter
 * See: [startOfBattleEffects](IMysteryEncounter.startOfBattleEffects) for more details
 *
 * This promise does not need to be awaited on if called in an encounter onInit (will just load lazily)
 * @param scene
 * @param moves
 */
export function initCustomMovesForEncounter(scene: BattleScene, moves: Moves | Moves[]) {
  moves = Array.isArray(moves) ? moves : [moves];
  return Promise.all(moves.map(move => initMoveAnim(scene, move)))
    .then(() => loadMoveAnimAssets(scene, moves));
}

/**
 * Will update player money, and animate change (sound optional)
 * @param scene - Battle Scene
 * @param changeValue
 * @param playSound
 */
export function updatePlayerMoney(scene: BattleScene, changeValue: number, playSound: boolean = true) {
  scene.money += changeValue;
  scene.updateMoneyText();
  scene.animateMoneyChanged(false);
  if (playSound) {
    scene.playSound("buy");
  }
  if (changeValue < 0) {
    scene.queueMessage(i18next.t("mysteryEncounter:paid_money", { amount: -changeValue }), null, true);
  } else {
    scene.queueMessage(i18next.t("mysteryEncounter:receive_money", { amount: changeValue }), null, true);
  }
}

/**
 * Converts modifier bullshit to an actual item
 * @param scene - Battle Scene
 * @param modifier
 * @param pregenArgs - can specify BerryType for berries, TM for TMs, AttackBoostType for item, etc.
 */
export function generateModifierTypeOption(scene: BattleScene, modifier: () => ModifierType, pregenArgs?: any[]): ModifierTypeOption {
  const modifierId = Object.keys(modifierTypes).find(k => modifierTypes[k] === modifier);
  let result: ModifierType = modifierTypes[modifierId]?.();

  // Gets tier of item by checking player item pool
  const modifierPool = getModifierPoolForType(ModifierPoolType.PLAYER);
  Object.keys(modifierPool).every(modifierTier => {
    const modType = modifierPool[modifierTier].find(m => {
      if (m.modifierType.id === modifierId) {
        return m;
      }
    });
    if (modType) {
      result = modType.modifierType;
      return false;
    }
    return true;
  });

  result = result instanceof ModifierTypeGenerator ? result.generateType(scene.getParty(), pregenArgs) : result;
  return new ModifierTypeOption(result, 0);
}

/**
 * This function is intended for use inside onPreOptionPhase() of an encounter option
 * @param scene
 * @param onPokemonSelected - Any logic that needs to be performed when Pokemon is chosen
 * If a second option needs to be selected, onPokemonSelected should return a OptionSelectItem[] object
 * @param onPokemonNotSelected - Any logic that needs to be performed if no Pokemon is chosen
 * @param selectablePokemonFilter
 */
export function selectPokemonForOption(scene: BattleScene, onPokemonSelected: (pokemon: PlayerPokemon) => void | OptionSelectItem[], onPokemonNotSelected?: () => void, selectablePokemonFilter?: (pokemon: PlayerPokemon) => string): Promise<boolean> {
  return new Promise(resolve => {
    // Open party screen to choose pokemon to train
    scene.ui.setMode(Mode.PARTY, PartyUiMode.SELECT, -1, (slotIndex: integer, option: PartyOption) => {
      if (slotIndex < scene.getParty().length) {
        scene.ui.setMode(Mode.MYSTERY_ENCOUNTER).then(() => {
          const pokemon = scene.getParty()[slotIndex];
          const secondaryOptions = onPokemonSelected(pokemon);
          if (!secondaryOptions) {
            scene.currentBattle.mysteryEncounter.setDialogueToken("selectedPokemon", pokemon.name);
            resolve(true);
            return;
          }

          // There is a second option to choose after selecting the Pokemon
          scene.ui.setMode(Mode.MESSAGE).then(() => {
            const displayOptions = () => {
              // Always appends a cancel option to bottom of options
              const fullOptions = secondaryOptions.map(option => {
                // Update handler to resolve promise
                const onSelect = option.handler;
                option.handler = () => {
                  onSelect();
                  scene.currentBattle.mysteryEncounter.setDialogueToken("selectedPokemon", pokemon.name);
                  resolve(true);
                  return true;
                };
                return option;
              }).concat({
                label: i18next.t("menu:cancel"),
                handler: () => {
                  scene.ui.setMode(Mode.MYSTERY_ENCOUNTER);
                  resolve(false);
                  return true;
                },
                onHover: () => {
                  scene.ui.showText("Return to encounter option select.");
                }
              });

              const config: OptionSelectConfig = {
                options: fullOptions,
                maxOptions: 7,
                yOffset: 0,
                supportHover: true
              };
              scene.ui.setModeWithoutClear(Mode.OPTION_SELECT, config, null, true);
            };

            const textPromptKey = scene.currentBattle.mysteryEncounter.selectedOption.dialogue.secondOptionPrompt;
            if (!textPromptKey) {
              displayOptions();
            } else {
              showEncounterText(scene, textPromptKey).then(() => displayOptions());
            }
          });
        });
      } else {
        scene.ui.setMode(Mode.MYSTERY_ENCOUNTER).then(() => {
          if (onPokemonNotSelected) {
            onPokemonNotSelected();
          }
          resolve(false);
        });
      }
    }, selectablePokemonFilter);
  });
}

/**
 * Will initialize reward phases to follow the mystery encounter
 * Can have shop displayed or skipped
 * @param scene - Battle Scene
 * @param customShopRewards - adds a shop phase with the specified rewards / reward tiers
 * @param nonShopPlayerItemRewards - will add a non-shop reward phase for each specified item/modifier (can happen in addition to a shop)
 * @param preRewardsCallback - can execute an arbitrary callback before the new phases if necessary (useful for updating items/party/injecting new phases before MysteryEncounterRewardsPhase)
 */
export function setEncounterRewards(scene: BattleScene, customShopRewards?: CustomModifierSettings, nonShopPlayerItemRewards?: ModifierTypeFunc[], preRewardsCallback?: Function) {
  scene.currentBattle.mysteryEncounter.doEncounterRewards = (scene: BattleScene) => {
    if (preRewardsCallback) {
      preRewardsCallback();
    }

    if (customShopRewards) {
      scene.unshiftPhase(new SelectModifierPhase(scene, 0, null, customShopRewards));
    } else {
      scene.tryRemovePhase(p => p instanceof SelectModifierPhase);
    }

    if (nonShopPlayerItemRewards?.length > 0) {
      nonShopPlayerItemRewards.forEach((reward) => {
        scene.unshiftPhase(new ModifierRewardPhase(scene, reward));
      });
    } else {
      while (!isNullOrUndefined(scene.findPhase(p => p instanceof ModifierRewardPhase))) {
        scene.tryRemovePhase(p => p instanceof ModifierRewardPhase);
      }
    }

    return true;
  };
}

/**
 * Will initialize exp phases into the phase queue (these are in addition to any combat or other exp earned)
 * Exp Share and Exp Balance will still function as normal
 * @param scene - Battle Scene
 * @param participantId - id/s of party pokemon that get full exp value. Other party members will receive Exp Share amounts
 * @param baseExpValue - gives exp equivalent to a pokemon of the wave index's level.
 * Guidelines:
 * 36 - Sunkern (lowest in game)
 * 62-64 - regional starter base evos
 * 100 - Scyther
 * 170 - Spiritomb
 * 250 - Gengar
 * 290 - trio legendaries
 * 340 - box legendaries
 * 608 - Blissey (highest in game)
 * https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_effort_value_yield_(Generation_IX)
 * @param useWaveIndex - set to false when directly passing the the full exp value instead of baseExpValue
 */
export function setEncounterExp(scene: BattleScene, participantId: integer | integer[], baseExpValue: number, useWaveIndex: boolean = true) {
  const participantIds = Array.isArray(participantId) ? participantId : [participantId];

  scene.currentBattle.mysteryEncounter.doEncounterExp = (scene: BattleScene) => {
    const party = scene.getParty();
    const expShareModifier = scene.findModifier(m => m instanceof ExpShareModifier) as ExpShareModifier;
    const expBalanceModifier = scene.findModifier(m => m instanceof ExpBalanceModifier) as ExpBalanceModifier;
    const multipleParticipantExpBonusModifier = scene.findModifier(m => m instanceof MultipleParticipantExpBonusModifier) as MultipleParticipantExpBonusModifier;
    const nonFaintedPartyMembers = party.filter(p => p.hp);
    const expPartyMembers = nonFaintedPartyMembers.filter(p => p.level < scene.getMaxExpLevel());
    const partyMemberExp = [];
    // EXP value calculation is based off Pokemon.getExpValue
    let expValue = Math.floor(baseExpValue * (useWaveIndex ? scene.currentBattle.waveIndex : 1) / 5 + 1);

    if (participantIds?.length > 0) {
      if (scene.currentBattle.mysteryEncounter.encounterVariant === MysteryEncounterVariant.TRAINER_BATTLE) {
        expValue = Math.floor(expValue * 1.5);
      }
      for (const partyMember of nonFaintedPartyMembers) {
        const pId = partyMember.id;
        const participated = participantIds.includes(pId);
        if (participated) {
          partyMember.addFriendship(2);
        }
        if (!expPartyMembers.includes(partyMember)) {
          continue;
        }
        if (!participated && !expShareModifier) {
          partyMemberExp.push(0);
          continue;
        }
        let expMultiplier = 0;
        if (participated) {
          expMultiplier += (1 / participantIds.length);
          if (participantIds.length > 1 && multipleParticipantExpBonusModifier) {
            expMultiplier += multipleParticipantExpBonusModifier.getStackCount() * 0.2;
          }
        } else if (expShareModifier) {
          expMultiplier += (expShareModifier.getStackCount() * 0.2) / participantIds.length;
        }
        if (partyMember.pokerus) {
          expMultiplier *= 1.5;
        }
        if (Overrides.XP_MULTIPLIER_OVERRIDE !== null) {
          expMultiplier = Overrides.XP_MULTIPLIER_OVERRIDE;
        }
        const pokemonExp = new Utils.NumberHolder(expValue * expMultiplier);
        scene.applyModifiers(PokemonExpBoosterModifier, true, partyMember, pokemonExp);
        partyMemberExp.push(Math.floor(pokemonExp.value));
      }

      if (expBalanceModifier) {
        let totalLevel = 0;
        let totalExp = 0;
        expPartyMembers.forEach((expPartyMember, epm) => {
          totalExp += partyMemberExp[epm];
          totalLevel += expPartyMember.level;
        });

        const medianLevel = Math.floor(totalLevel / expPartyMembers.length);

        const recipientExpPartyMemberIndexes = [];
        expPartyMembers.forEach((expPartyMember, epm) => {
          if (expPartyMember.level <= medianLevel) {
            recipientExpPartyMemberIndexes.push(epm);
          }
        });

        const splitExp = Math.floor(totalExp / recipientExpPartyMemberIndexes.length);

        expPartyMembers.forEach((_partyMember, pm) => {
          partyMemberExp[pm] = Phaser.Math.Linear(partyMemberExp[pm], recipientExpPartyMemberIndexes.indexOf(pm) > -1 ? splitExp : 0, 0.2 * expBalanceModifier.getStackCount());
        });
      }

      for (let pm = 0; pm < expPartyMembers.length; pm++) {
        const exp = partyMemberExp[pm];

        if (exp) {
          const partyMemberIndex = party.indexOf(expPartyMembers[pm]);
          scene.unshiftPhase(expPartyMembers[pm].isOnField() ? new ExpPhase(scene, partyMemberIndex, exp) : new ShowPartyExpBarPhase(scene, partyMemberIndex, exp));
        }
      }
    }

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
 * @param scene
 * @param optionSelectSettings
 */
export function initSubsequentOptionSelect(scene: BattleScene, optionSelectSettings: OptionSelectSettings) {
  scene.pushPhase(new MysteryEncounterPhase(scene, optionSelectSettings));
}

/**
 * Can be used to exit an encounter without any battles or followup
 * Will skip any shops and rewards, and queue the next encounter phase as normal
 * @param scene
 * @param addHealPhase - when true, will add a shop phase to end of encounter with 0 rewards but healing items are available
 */
export function leaveEncounterWithoutBattle(scene: BattleScene, addHealPhase: boolean = false) {
  scene.currentBattle.mysteryEncounter.encounterVariant = MysteryEncounterVariant.NO_BATTLE;
  scene.clearPhaseQueue();
  scene.clearPhaseQueueSplice();
  handleMysteryEncounterVictory(scene, addHealPhase);
}

export function handleMysteryEncounterVictory(scene: BattleScene, addHealPhase: boolean = false) {
  const allowedPkm = scene.getParty().filter((pkm) => pkm.isAllowedInBattle());

  if (allowedPkm.length === 0) {
    scene.clearPhaseQueue();
    scene.unshiftPhase(new GameOverPhase(scene));
    return;
  }

  // If in repeated encounter variant, do nothing
  // Variant must eventually be swapped in order to handle "true" end of the encounter
  if (scene.currentBattle.mysteryEncounter.encounterVariant === MysteryEncounterVariant.CONTINUOUS_ENCOUNTER) {
    return;
  } else if (scene.currentBattle.mysteryEncounter.encounterVariant === MysteryEncounterVariant.NO_BATTLE) {
    scene.pushPhase(new EggLapsePhase(scene));
    scene.pushPhase(new MysteryEncounterRewardsPhase(scene, addHealPhase));
  } else if (!scene.getEnemyParty().find(p => scene.currentBattle.mysteryEncounter.encounterVariant !== MysteryEncounterVariant.TRAINER_BATTLE ? p.isOnField() : !p?.isFainted(true))) {
    scene.pushPhase(new BattleEndPhase(scene));
    if (scene.currentBattle.mysteryEncounter.encounterVariant === MysteryEncounterVariant.TRAINER_BATTLE) {
      scene.pushPhase(new TrainerVictoryPhase(scene));
    }
    if (scene.gameMode.isEndless || !scene.gameMode.isWaveFinal(scene.currentBattle.waveIndex)) {
      scene.pushPhase(new EggLapsePhase(scene));
      scene.pushPhase(new MysteryEncounterRewardsPhase(scene, addHealPhase));
    }
  }
}

/**
 *
 * @param scene
 * @param hide - If true, performs ease out and hide visuals. If false, eases in visuals. Defaults to true
 * @param destroy - If true, will destroy visuals ONLY ON HIDE TRANSITION. Does nothing on show. Defaults to true
 * @param duration
 */
export function transitionMysteryEncounterIntroVisuals(scene: BattleScene, hide: boolean = true, destroy: boolean = true, duration: number = 750): Promise<boolean> {
  return new Promise(resolve => {
    const introVisuals = scene.currentBattle.mysteryEncounter.introVisuals;
    if (introVisuals) {
      if (!hide) {
        // Make sure visuals are in proper state for showing
        introVisuals.setVisible(true);
        introVisuals.x += 16;
        introVisuals.y -= 16;
        introVisuals.alpha = 0;
      }

      // Transition
      scene.tweens.add({
        targets: introVisuals,
        x: hide ? "+=16" : "-=16",
        y: hide ? "-=16" : "+=16",
        alpha: hide ? 0 : 1,
        ease: "Sine.easeInOut",
        duration: duration,
        onComplete: () => {
          if (hide && destroy) {
            scene.field.remove(introVisuals);
            introVisuals.setVisible(false);
            introVisuals.destroy();
            scene.currentBattle.mysteryEncounter.introVisuals = null;
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
 * Mostly useful for allowing MysteryEncounter enemies to "cheat" and use moves before the first turn
 * @param scene
 */
export function handleMysteryEncounterBattleStartEffects(scene: BattleScene) {
  const encounter = scene.currentBattle?.mysteryEncounter;
  if (scene.currentBattle.battleType === BattleType.MYSTERY_ENCOUNTER && encounter.encounterVariant !== MysteryEncounterVariant.NO_BATTLE && !encounter.startOfBattleEffectsComplete) {
    const effects = encounter.startOfBattleEffects;
    effects.forEach(effect => {
      let source;
      if (effect.sourcePokemon) {
        source = effect.sourcePokemon;
      } else if (!isNullOrUndefined(effect.sourceBattlerIndex)) {
        if (effect.sourceBattlerIndex === BattlerIndex.ATTACKER) {
          source = scene.getEnemyField()[0];
        } else if (effect.sourceBattlerIndex === BattlerIndex.ENEMY) {
          source = scene.getEnemyField()[0];
        } else if (effect.sourceBattlerIndex === BattlerIndex.ENEMY_2) {
          source = scene.getEnemyField()[1];
        } else if (effect.sourceBattlerIndex === BattlerIndex.PLAYER) {
          source = scene.getPlayerField()[0];
        } else if (effect.sourceBattlerIndex === BattlerIndex.PLAYER_2) {
          source = scene.getPlayerField()[1];
        }
      } else {
        source = scene.getEnemyField()[0];
      }
      scene.pushPhase(new MovePhase(scene, source, effect.targets, effect.move, effect.followUp, effect.ignorePp));
    });

    // Pseudo turn end phase to reset flinch states, Endure, etc.
    scene.pushPhase(new MysteryEncounterBattleStartCleanupPhase(scene));

    encounter.startOfBattleEffectsComplete = true;
  }
}

/**
 * TODO: remove once encounter spawn rate is finalized
 * Just a helper function to calculate aggregate stats for MEs in a Classic run
 * @param scene
 * @param baseSpawnWeight
 */
export function calculateMEAggregateStats(scene: BattleScene, baseSpawnWeight: number) {
  const numRuns = 1000;
  let run = 0;
  const targetEncountersPerRun = 15; // AVERAGE_ENCOUNTERS_PER_RUN_TARGET

  const calculateNumEncounters = (): number[] => {
    let encounterRate = baseSpawnWeight; // BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT
    const numEncounters = [0, 0, 0, 0];
    let currentBiome = Biome.TOWN;
    let currentArena = scene.newArena(currentBiome);
    for (let i = 10; i < 180; i++) {
      // Boss
      if (i % 10 === 0) {
        continue;
      }

      // New biome
      if (i % 10 === 1) {
        if (Array.isArray(biomeLinks[currentBiome])) {
          let biomes: Biome[];
          scene.executeWithSeedOffset(() => {
            biomes = (biomeLinks[currentBiome] as (Biome | [Biome, integer])[])
              .filter(b => !Array.isArray(b) || !Utils.randSeedInt(b[1]))
              .map(b => !Array.isArray(b) ? b : b[0]);
          }, i);
          currentBiome = biomes[Utils.randSeedInt(biomes.length)];
        } else if (biomeLinks.hasOwnProperty(currentBiome)) {
          currentBiome = (biomeLinks[currentBiome] as Biome);
        } else {
          if (!(i % 50)) {
            currentBiome = Biome.END;
          } else {
            currentBiome = scene.generateRandomBiome(i);
          }
        }

        currentArena = scene.newArena(currentBiome);
      }

      // Fixed battle
      if (scene.gameMode.isFixedBattle(i)) {
        continue;
      }

      // Trainer
      if (scene.gameMode.isWaveTrainer(i, currentArena)) {
        continue;
      }

      // Otherwise, roll encounter

      const roll = Utils.randSeedInt(256);

      // If total number of encounters is lower than expected for the run, slightly favor a new encounter
      // Do the reverse as well
      const expectedEncountersByFloor = targetEncountersPerRun / (180 - 10) * i;
      const currentRunDiffFromAvg = expectedEncountersByFloor - numEncounters.reduce((a, b) => a + b);
      const favoredEncounterRate = encounterRate + currentRunDiffFromAvg * 5;

      if (roll < favoredEncounterRate) {
        encounterRate = baseSpawnWeight;

        // Calculate encounter rarity
        // Common / Uncommon / Rare / Super Rare (base is out of 128)
        const tierWeights = [64, 40, 21, 3];

        // Adjust tier weights by currently encountered events (pity system that lowers odds of multiple common/uncommons)
        tierWeights[0] = tierWeights[0] - 6 * numEncounters[0];
        tierWeights[1] = tierWeights[1] - 4 * numEncounters[1];

        const totalWeight = tierWeights.reduce((a, b) => a + b);
        const tierValue = Utils.randSeedInt(totalWeight);
        const commonThreshold = totalWeight - tierWeights[0]; // 64 - 32 = 32
        const uncommonThreshold = totalWeight - tierWeights[0] - tierWeights[1]; // 64 - 32 - 16 = 16
        const rareThreshold = totalWeight - tierWeights[0] - tierWeights[1] - tierWeights[2]; // 64 - 32 - 16 - 10 = 6

        tierValue > commonThreshold ? ++numEncounters[0] : tierValue > uncommonThreshold ? ++numEncounters[1] : tierValue > rareThreshold ? ++numEncounters[2] : ++numEncounters[3];
      } else {
        encounterRate += WIGHT_INCREMENT_ON_SPAWN_MISS;
      }
    }

    return numEncounters;
  };

  const runs = [];
  while (run < numRuns) {
    scene.executeWithSeedOffset(() => {
      const numEncounters = calculateNumEncounters();
      runs.push(numEncounters);
    }, 1000 * run);
    run++;
  }

  const n = runs.length;
  const totalEncountersInRun = runs.map(run => run.reduce((a, b) => a + b));
  const totalMean = totalEncountersInRun.reduce((a, b) => a + b) / n;
  const totalStd = Math.sqrt(totalEncountersInRun.map(x => Math.pow(x - totalMean, 2)).reduce((a, b) => a + b) / n);
  const commonMean = runs.reduce((a, b) => a + b[0], 0) / n;
  const uncommonMean = runs.reduce((a, b) => a + b[1], 0) / n;
  const rareMean = runs.reduce((a, b) => a + b[2], 0) / n;
  const superRareMean = runs.reduce((a, b) => a + b[3], 0) / n;

  console.log(`Starting weight: ${baseSpawnWeight}\nAverage MEs per run: ${totalMean}\nStandard Deviation: ${totalStd}\nAvg Commons: ${commonMean}\nAvg Uncommons: ${uncommonMean}\nAvg Rares: ${rareMean}\nAvg Super Rares: ${superRareMean}`);
}

/**
 * Takes care of handling player pokemon KO (with all its side effects)
 *
 * @param scene the battle scene
 * @param pokemon the player pokemon to KO
 */
export function koPlayerPokemon(scene: BattleScene, pokemon: PlayerPokemon) {
  pokemon.hp = 0;
  pokemon.trySetStatus(StatusEffect.FAINT);
  pokemon.updateInfo();
  queueEncounterMessage(scene, i18next.t("battle:fainted", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }));
}

/**
 * Handles applying hp changes to a player pokemon.
 * Takes care of not going below `0`, above max-hp, adding `FNT` status correctly and updating the pokemon info.
 * TODO: handle special cases like wonder-guard/ninjask
 * @param scene the battle scene
 * @param pokemon the player pokemon to apply the hp change to
 * @param value the hp change amount. Positive for heal. Negative for damage
 *
 */
function applyHpChangeToPokemon(scene: BattleScene, pokemon: PlayerPokemon, value: number) {
  const hpChange = Math.round(pokemon.hp + value);
  const nextHp = Math.max(Math.min(hpChange, pokemon.getMaxHp()), 0);
  if (nextHp === 0) {
    koPlayerPokemon(scene, pokemon);
  } else {
    pokemon.hp = nextHp;
  }
}

/**
 * Handles applying damage to a player pokemon
 * @param scene the battle scene
 * @param pokemon the player pokemon to apply damage to
 * @param damage the amount of damage to apply
 * @see {@linkcode applyHpChangeToPokemon}
 */
export function applyDamageToPokemon(scene: BattleScene, pokemon: PlayerPokemon, damage: number) {
  if (damage <= 0) {
    console.warn("Healing pokemon with `applyDamageToPokemon` is not recommended! Please use `applyHealToPokemon` instead.");
  }

  applyHpChangeToPokemon(scene, pokemon, -damage);
}

/**
 * Handles applying heal to a player pokemon
 * @param scene the battle scene
 * @param pokemon the player pokemon to apply heal to
 * @param heal the amount of heal to apply
 * @see {@linkcode applyHpChangeToPokemon}
 */
export function applyHealToPokemon(scene: BattleScene, pokemon: PlayerPokemon, heal: number) {
  if (heal <= 0) {
    console.warn("Damaging pokemong with `applyHealToPokemon` is not recommended! Please use `applyDamageToPokemon` instead.");
  }

  applyHpChangeToPokemon(scene, pokemon, heal);
}
