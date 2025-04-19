import { BattlerIndex } from "#app/battle";
import { BattleType } from "#enums/battle-type";
import { globalScene } from "#app/global-scene";
import { PLAYER_PARTY_MAX_SIZE } from "#app/constants";
import { applyAbAttrs, SyncEncounterNatureAbAttr, applyPreSummonAbAttrs, PreSummonAbAttr } from "#app/data/abilities/ability";
import { initEncounterAnims, loadEncounterAnimAssets } from "#app/data/battle-anims";
import { getCharVariantFromDialogue } from "#app/data/dialogue";
import { getEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { doTrainerExclamation } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { getGoldenBugNetSpecies } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { TrainerSlot } from "#enums/trainer-slot";
import { getRandomWeatherType } from "#app/data/weather";
import { EncounterPhaseEvent } from "#app/events/battle-scene";
import type Pokemon from "#app/field/pokemon";
import { FieldPosition } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { BoostBugSpawnModifier, IvScannerModifier, TurnHeldItemTransferModifier } from "#app/modifier/modifier";
import { ModifierPoolType, regenerateModifierPoolThresholds } from "#app/modifier/modifier-type";
import Overrides from "#app/overrides";
import { BattlePhase } from "#app/phases/battle-phase";
import { CheckSwitchPhase } from "#app/phases/check-switch-phase";
import { GameOverPhase } from "#app/phases/game-over-phase";
import { MysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";
import { PostSummonPhase } from "#app/phases/post-summon-phase";
import { ReturnPhase } from "#app/phases/return-phase";
import { ScanIvsPhase } from "#app/phases/scan-ivs-phase";
import { ShinySparklePhase } from "#app/phases/shiny-sparkle-phase";
import { SummonPhase } from "#app/phases/summon-phase";
import { ToggleDoublePositionPhase } from "#app/phases/toggle-double-position-phase";
import { achvs } from "#app/system/achv";
import { handleTutorial, Tutorial } from "#app/tutorial";
import { UiMode } from "#enums/ui-mode";
import { randSeedInt, randSeedItem } from "#app/utils/common";
import { BattleSpec } from "#enums/battle-spec";
import { Biome } from "#enums/biome";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { PlayerGender } from "#enums/player-gender";
import { Species } from "#enums/species";
import { overrideHeldItems, overrideModifiers } from "#app/modifier/modifier";
import i18next from "i18next";
import { WEIGHT_INCREMENT_ON_SPAWN_MISS } from "#app/data/mystery-encounters/mystery-encounters";
import { getNatureName } from "#app/data/nature";

export class EncounterPhase extends BattlePhase {
  private loaded: boolean;

  constructor(loaded = false) {
    super();

    this.loaded = loaded;
  }

  start() {
    super.start();

    globalScene.updateGameInfo();

    globalScene.initSession();

    globalScene.eventTarget.dispatchEvent(new EncounterPhaseEvent());

    // Failsafe if players somehow skip floor 200 in classic mode
    if (globalScene.gameMode.isClassic && globalScene.currentBattle.waveIndex > 200) {
      globalScene.unshiftPhase(new GameOverPhase());
    }

    const loadEnemyAssets: Promise<void>[] = [];

    const battle = globalScene.currentBattle;

    // Generate and Init Mystery Encounter
    if (battle.isBattleMysteryEncounter() && !battle.mysteryEncounter) {
      globalScene.executeWithSeedOffset(() => {
        const currentSessionEncounterType = battle.mysteryEncounterType;
        battle.mysteryEncounter = globalScene.getMysteryEncounter(currentSessionEncounterType);
      }, battle.waveIndex * 16);
    }
    const mysteryEncounter = battle.mysteryEncounter;
    if (mysteryEncounter) {
      // If ME has an onInit() function, call it
      // Usually used for calculating rand data before initializing anything visual
      // Also prepopulates any dialogue tokens from encounter/option requirements
      globalScene.executeWithSeedOffset(() => {
        if (mysteryEncounter.onInit) {
          mysteryEncounter.onInit();
        }
        mysteryEncounter.populateDialogueTokensFromRequirements();
      }, battle.waveIndex);

      // Add any special encounter animations to load
      if (mysteryEncounter.encounterAnimations && mysteryEncounter.encounterAnimations.length > 0) {
        loadEnemyAssets.push(
          initEncounterAnims(mysteryEncounter.encounterAnimations).then(() => loadEncounterAnimAssets(true)),
        );
      }

      // Add intro visuals for mystery encounter
      mysteryEncounter.initIntroVisuals();
      globalScene.field.add(mysteryEncounter.introVisuals!);
    }

    let totalBst = 0;

    battle.enemyLevels?.every((level, e) => {
      if (battle.isBattleMysteryEncounter()) {
        // Skip enemy loading for MEs, those are loaded elsewhere
        return false;
      }
      if (!this.loaded) {
        if (battle.battleType === BattleType.TRAINER) {
          //resets hitRecCount during Trainer ecnounter
          for (const pokemon of globalScene.getPlayerParty()) {
            if (pokemon) {
              pokemon.customPokemonData.resetHitReceivedCount();
            }
          }
          battle.enemyParty[e] = battle.trainer?.genPartyMember(e)!; // TODO:: is the bang correct here?
        } else {
          let enemySpecies = globalScene.randomSpecies(battle.waveIndex, level, true);
          // If player has golden bug net, rolls 10% chance to replace non-boss wave wild species from the golden bug net bug pool
          if (
            globalScene.findModifier(m => m instanceof BoostBugSpawnModifier) &&
            !globalScene.gameMode.isBoss(battle.waveIndex) &&
            globalScene.arena.biomeType !== Biome.END &&
            randSeedInt(10) === 0
          ) {
            enemySpecies = getGoldenBugNetSpecies(level);
          }
          battle.enemyParty[e] = globalScene.addEnemyPokemon(
            enemySpecies,
            level,
            TrainerSlot.NONE,
            !!globalScene.getEncounterBossSegments(battle.waveIndex, level, enemySpecies),
          );
          if (globalScene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
            battle.enemyParty[e].ivs = new Array(6).fill(31);
          }
          // biome-ignore lint/complexity/noForEach: Improves readability
          globalScene
            .getPlayerParty()
            .slice(0, !battle.double ? 1 : 2)
            .reverse()
            .forEach(playerPokemon => {
              applyAbAttrs(SyncEncounterNatureAbAttr, playerPokemon, null, false, battle.enemyParty[e]);
            });
        }
      }
      const enemyPokemon = globalScene.getEnemyParty()[e];
      if (e < (battle.double ? 2 : 1)) {
        enemyPokemon.setX(-66 + enemyPokemon.getFieldPositionOffset()[0]);
        enemyPokemon.resetSummonData();
      }

      if (!this.loaded) {
        globalScene.gameData.setPokemonSeen(
          enemyPokemon,
          true,
          battle.battleType === BattleType.TRAINER ||
            battle?.mysteryEncounter?.encounterMode === MysteryEncounterMode.TRAINER_BATTLE,
        );
      }

      if (enemyPokemon.species.speciesId === Species.ETERNATUS) {
        if (
          globalScene.gameMode.isClassic &&
          (battle.battleSpec === BattleSpec.FINAL_BOSS || globalScene.gameMode.isWaveFinal(battle.waveIndex))
        ) {
          if (battle.battleSpec !== BattleSpec.FINAL_BOSS) {
            enemyPokemon.formIndex = 1;
            enemyPokemon.updateScale();
          }
          enemyPokemon.setBoss();
        } else if (!(battle.waveIndex % 1000)) {
          enemyPokemon.formIndex = 1;
          enemyPokemon.updateScale();
        }
      }

      totalBst += enemyPokemon.getSpeciesForm().baseTotal;

      loadEnemyAssets.push(enemyPokemon.loadAssets());

      const stats: string[] = [
        `HP: ${enemyPokemon.stats[0]} (${enemyPokemon.ivs[0]})`,
        ` Atk: ${enemyPokemon.stats[1]} (${enemyPokemon.ivs[1]})`,
        ` Def: ${enemyPokemon.stats[2]} (${enemyPokemon.ivs[2]})`,
        ` Spatk: ${enemyPokemon.stats[3]} (${enemyPokemon.ivs[3]})`,
        ` Spdef: ${enemyPokemon.stats[4]} (${enemyPokemon.ivs[4]})`,
        ` Spd: ${enemyPokemon.stats[5]} (${enemyPokemon.ivs[5]})`,
      ];
      const moveset: string[] = [];
      for (const move of enemyPokemon.getMoveset()) {
        moveset.push(move!.getName()); // TODO: remove `!` after moveset-null removal PR
      }

      console.log(
        `Pokemon: ${getPokemonNameWithAffix(enemyPokemon)}`,
        `| Species ID: ${enemyPokemon.species.speciesId}`,
        `| Nature: ${getNatureName(enemyPokemon.nature, true, true, true)}`,
      );
      console.log(`Stats (IVs): ${stats}`);
      console.log(
        `Ability: ${enemyPokemon.getAbility().name}`,
        `| Passive Ability${enemyPokemon.hasPassive() ? "" : " (inactive)"}: ${enemyPokemon.getPassiveAbility().name}`,
        `${enemyPokemon.isBoss() ? `| Boss Bars: ${enemyPokemon.bossSegments}` : ""}`,
      );
      console.log("Moveset:", moveset);
      return true;
    });

    if (globalScene.getPlayerParty().filter(p => p.isShiny()).length === PLAYER_PARTY_MAX_SIZE) {
      globalScene.validateAchv(achvs.SHINY_PARTY);
    }

    if (battle.battleType === BattleType.TRAINER) {
      loadEnemyAssets.push(battle.trainer?.loadAssets().then(() => battle.trainer?.initSprite())!); // TODO: is this bang correct?
    } else if (battle.isBattleMysteryEncounter()) {
      if (battle.mysteryEncounter?.introVisuals) {
        loadEnemyAssets.push(
          battle.mysteryEncounter.introVisuals
            .loadAssets()
            .then(() => battle.mysteryEncounter!.introVisuals!.initSprite()),
        );
      }
      if (battle.mysteryEncounter?.loadAssets && battle.mysteryEncounter.loadAssets.length > 0) {
        loadEnemyAssets.push(...battle.mysteryEncounter.loadAssets);
      }
      // Load Mystery Encounter Exclamation bubble and sfx
      loadEnemyAssets.push(
        new Promise<void>(resolve => {
          globalScene.loadSe("GEN8- Exclaim", "battle_anims", "GEN8- Exclaim.wav");
          globalScene.loadImage("encounter_exclaim", "mystery-encounters");
          globalScene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
          if (!globalScene.load.isLoading()) {
            globalScene.load.start();
          }
        }),
      );
    } else {
      const overridedBossSegments = Overrides.OPP_HEALTH_SEGMENTS_OVERRIDE > 1;
      // for double battles, reduce the health segments for boss Pokemon unless there is an override
      if (!overridedBossSegments && battle.enemyParty.filter(p => p.isBoss()).length > 1) {
        for (const enemyPokemon of battle.enemyParty) {
          // If the enemy pokemon is a boss and wasn't populated from data source, then update the number of segments
          if (enemyPokemon.isBoss() && !enemyPokemon.isPopulatedFromDataSource) {
            enemyPokemon.setBoss(
              true,
              Math.ceil(enemyPokemon.bossSegments * (enemyPokemon.getSpeciesForm().baseTotal / totalBst)),
            );
            enemyPokemon.initBattleInfo();
          }
        }
      }
    }

    Promise.all(loadEnemyAssets).then(() => {
      battle.enemyParty.every((enemyPokemon, e) => {
        if (battle.isBattleMysteryEncounter()) {
          return false;
        }
        if (e < (battle.double ? 2 : 1)) {
          if (battle.battleType === BattleType.WILD) {
            for (const pokemon of globalScene.getField()) {
              applyPreSummonAbAttrs(PreSummonAbAttr, pokemon, []);
            }
            globalScene.field.add(enemyPokemon);
            battle.seenEnemyPartyMemberIds.add(enemyPokemon.id);
            const playerPokemon = globalScene.getPlayerPokemon();
            if (playerPokemon?.isOnField()) {
              globalScene.field.moveBelow(enemyPokemon as Pokemon, playerPokemon);
            }
            enemyPokemon.tint(0, 0.5);
          } else if (battle.battleType === BattleType.TRAINER) {
            enemyPokemon.setVisible(false);
            globalScene.currentBattle.trainer?.tint(0, 0.5);
          }
          if (battle.double) {
            enemyPokemon.setFieldPosition(e ? FieldPosition.RIGHT : FieldPosition.LEFT);
          }
        }
        return true;
      });

      if (!this.loaded && battle.battleType !== BattleType.MYSTERY_ENCOUNTER) {
        regenerateModifierPoolThresholds(
          globalScene.getEnemyField(),
          battle.battleType === BattleType.TRAINER ? ModifierPoolType.TRAINER : ModifierPoolType.WILD,
        );
        globalScene.generateEnemyModifiers();
        overrideModifiers(false);

        for (const enemy of globalScene.getEnemyField()) {
          overrideHeldItems(enemy, false);
        }
      }

      if (battle.battleType === BattleType.TRAINER) {
        globalScene.currentBattle.trainer!.genAI(globalScene.getEnemyParty());
      }

      globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
        if (!this.loaded) {
          this.trySetWeatherIfNewBiome(); // Set weather before session gets saved
          // Game syncs to server on waves X1 and X6 (As of 1.2.0)
          globalScene.gameData
            .saveAll(true, battle.waveIndex % 5 === 1 || (globalScene.lastSavePlayTime ?? 0) >= 300)
            .then(success => {
              globalScene.disableMenu = false;
              if (!success) {
                return globalScene.reset(true);
              }
              this.doEncounter();
              globalScene.resetSeed();
            });
        } else {
          this.doEncounter();
          globalScene.resetSeed();
        }
      });
    });
  }

  doEncounter() {
    globalScene.playBgm(undefined, true);
    globalScene.updateModifiers(false);
    globalScene.setFieldScale(1);

    const { battleType, waveIndex } = globalScene.currentBattle;
    if (
      globalScene.isMysteryEncounterValidForWave(battleType, waveIndex) &&
      !globalScene.currentBattle.isBattleMysteryEncounter()
    ) {
      // Increment ME spawn chance if an ME could have spawned but did not
      // Only do this AFTER session has been saved to avoid duplicating increments
      globalScene.mysteryEncounterSaveData.encounterSpawnChance += WEIGHT_INCREMENT_ON_SPAWN_MISS;
    }

    for (const pokemon of globalScene.getPlayerParty()) {
      if (pokemon) {
        pokemon.resetBattleData();
      }
    }

    const enemyField = globalScene.getEnemyField();
    globalScene.tweens.add({
      targets: [
        globalScene.arenaEnemy,
        globalScene.currentBattle.trainer,
        enemyField,
        globalScene.arenaPlayer,
        globalScene.trainer,
      ].flat(),
      x: (_target, _key, value, fieldIndex: number) => (fieldIndex < 2 + enemyField.length ? value + 300 : value - 300),
      duration: 2000,
      onComplete: () => {
        if (!this.tryOverrideForBattleSpec()) {
          this.doEncounterCommon();
        }
      },
    });

    const encounterIntroVisuals = globalScene.currentBattle?.mysteryEncounter?.introVisuals;
    if (encounterIntroVisuals) {
      const enterFromRight = encounterIntroVisuals.enterFromRight;
      if (enterFromRight) {
        encounterIntroVisuals.x += 500;
      }
      globalScene.tweens.add({
        targets: encounterIntroVisuals,
        x: enterFromRight ? "-=200" : "+=300",
        duration: 2000,
      });
    }
  }

  getEncounterMessage(): string {
    const enemyField = globalScene.getEnemyField();

    if (globalScene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
      return i18next.t("battle:bossAppeared", {
        bossName: getPokemonNameWithAffix(enemyField[0]),
      });
    }

    if (globalScene.currentBattle.battleType === BattleType.TRAINER) {
      if (globalScene.currentBattle.double) {
        return i18next.t("battle:trainerAppearedDouble", {
          trainerName: globalScene.currentBattle.trainer?.getName(TrainerSlot.NONE, true),
        });
      }
      return i18next.t("battle:trainerAppeared", {
        trainerName: globalScene.currentBattle.trainer?.getName(TrainerSlot.NONE, true),
      });
    }

    return enemyField.length === 1
      ? i18next.t("battle:singleWildAppeared", {
          pokemonName: enemyField[0].getNameToRender(),
        })
      : i18next.t("battle:multiWildAppeared", {
          pokemonName1: enemyField[0].getNameToRender(),
          pokemonName2: enemyField[1].getNameToRender(),
        });
  }

  doEncounterCommon(showEncounterMessage = true) {
    const enemyField = globalScene.getEnemyField();

    if (globalScene.currentBattle.battleType === BattleType.WILD) {
      for (const enemyPokemon of enemyField) {
        enemyPokemon.untint(100, "Sine.easeOut");
        enemyPokemon.cry();
        enemyPokemon.showInfo();
        if (enemyPokemon.isShiny()) {
          globalScene.validateAchv(achvs.SEE_SHINY);
        }
      }
      globalScene.updateFieldScale();
      if (showEncounterMessage) {
        globalScene.ui.showText(this.getEncounterMessage(), null, () => this.end(), 1500);
      } else {
        this.end();
      }
    } else if (globalScene.currentBattle.battleType === BattleType.TRAINER) {
      const trainer = globalScene.currentBattle.trainer;
      trainer?.untint(100, "Sine.easeOut");
      trainer?.playAnim();

      const doSummon = () => {
        globalScene.currentBattle.started = true;
        globalScene.playBgm(undefined);
        globalScene.pbTray.showPbTray(globalScene.getPlayerParty());
        globalScene.pbTrayEnemy.showPbTray(globalScene.getEnemyParty());
        const doTrainerSummon = () => {
          this.hideEnemyTrainer();
          const availablePartyMembers = globalScene.getEnemyParty().filter(p => !p.isFainted()).length;
          globalScene.unshiftPhase(new SummonPhase(0, false));
          if (globalScene.currentBattle.double && availablePartyMembers > 1) {
            globalScene.unshiftPhase(new SummonPhase(1, false));
          }
          this.end();
        };
        if (showEncounterMessage) {
          globalScene.ui.showText(this.getEncounterMessage(), null, doTrainerSummon, 1500, true);
        } else {
          doTrainerSummon();
        }
      };

      const encounterMessages = globalScene.currentBattle.trainer?.getEncounterMessages();

      if (!encounterMessages?.length) {
        doSummon();
      } else {
        let message: string;
        globalScene.executeWithSeedOffset(
          () => (message = randSeedItem(encounterMessages)),
          globalScene.currentBattle.waveIndex,
        );
        message = message!; // tell TS compiler it's defined now
        const showDialogueAndSummon = () => {
          globalScene.ui.showDialogue(message, trainer?.getName(TrainerSlot.NONE, true), null, () => {
            globalScene.charSprite.hide().then(() => globalScene.hideFieldOverlay(250).then(() => doSummon()));
          });
        };
        if (globalScene.currentBattle.trainer?.config.hasCharSprite && !globalScene.ui.shouldSkipDialogue(message)) {
          globalScene
            .showFieldOverlay(500)
            .then(() =>
              globalScene.charSprite
                .showCharacter(trainer?.getKey()!, getCharVariantFromDialogue(encounterMessages[0]))
                .then(() => showDialogueAndSummon()),
            ); // TODO: is this bang correct?
        } else {
          showDialogueAndSummon();
        }
      }
    } else if (globalScene.currentBattle.isBattleMysteryEncounter() && globalScene.currentBattle.mysteryEncounter) {
      const encounter = globalScene.currentBattle.mysteryEncounter;
      const introVisuals = encounter.introVisuals;
      introVisuals?.playAnim();

      if (encounter.onVisualsStart) {
        encounter.onVisualsStart();
      } else if (encounter.spriteConfigs && introVisuals) {
        // If the encounter doesn't have any special visual intro, show sparkle for shiny Pokemon
        introVisuals.playShinySparkles();
      }

      const doEncounter = () => {
        const doShowEncounterOptions = () => {
          globalScene.ui.clearText();
          globalScene.ui.getMessageHandler().hideNameText();

          globalScene.unshiftPhase(new MysteryEncounterPhase());
          this.end();
        };

        if (showEncounterMessage) {
          const introDialogue = encounter.dialogue.intro;
          if (!introDialogue) {
            doShowEncounterOptions();
          } else {
            const FIRST_DIALOGUE_PROMPT_DELAY = 750;
            let i = 0;
            const showNextDialogue = () => {
              const nextAction = i === introDialogue.length - 1 ? doShowEncounterOptions : showNextDialogue;
              const dialogue = introDialogue[i];
              const title = getEncounterText(dialogue?.speaker);
              const text = getEncounterText(dialogue.text)!;
              i++;
              if (title) {
                globalScene.ui.showDialogue(
                  text,
                  title,
                  null,
                  nextAction,
                  0,
                  i === 1 ? FIRST_DIALOGUE_PROMPT_DELAY : 0,
                );
              } else {
                globalScene.ui.showText(text, null, nextAction, i === 1 ? FIRST_DIALOGUE_PROMPT_DELAY : 0, true);
              }
            };

            if (introDialogue.length > 0) {
              showNextDialogue();
            }
          }
        } else {
          doShowEncounterOptions();
        }
      };

      const encounterMessage = i18next.t("battle:mysteryEncounterAppeared");

      if (!encounterMessage) {
        doEncounter();
      } else {
        doTrainerExclamation();
        globalScene.ui.showDialogue(encounterMessage, "???", null, () => {
          globalScene.charSprite.hide().then(() => globalScene.hideFieldOverlay(250).then(() => doEncounter()));
        });
      }
    }
  }

  end() {
    const enemyField = globalScene.getEnemyField();

    enemyField.forEach((enemyPokemon, e) => {
      if (enemyPokemon.isShiny(true)) {
        globalScene.unshiftPhase(new ShinySparklePhase(BattlerIndex.ENEMY + e));
      }
      /** This sets Eternatus' held item to be untransferrable, preventing it from being stolen  */
      if (
        enemyPokemon.species.speciesId === Species.ETERNATUS &&
        (globalScene.gameMode.isBattleClassicFinalBoss(globalScene.currentBattle.waveIndex) ||
          globalScene.gameMode.isEndlessMajorBoss(globalScene.currentBattle.waveIndex))
      ) {
        const enemyMBH = globalScene.findModifier(
          m => m instanceof TurnHeldItemTransferModifier,
          false,
        ) as TurnHeldItemTransferModifier;
        if (enemyMBH) {
          globalScene.removeModifier(enemyMBH, true);
          enemyMBH.setTransferrableFalse();
          globalScene.addEnemyModifier(enemyMBH);
        }
      }
    });

    if (![BattleType.TRAINER, BattleType.MYSTERY_ENCOUNTER].includes(globalScene.currentBattle.battleType)) {
      enemyField.map(p =>
        globalScene.pushConditionalPhase(new PostSummonPhase(p.getBattlerIndex()), () => {
          // if there is not a player party, we can't continue
          if (!globalScene.getPlayerParty().length) {
            return false;
          }
          // how many player pokemon are on the field ?
          const pokemonsOnFieldCount = globalScene.getPlayerParty().filter(p => p.isOnField()).length;
          // if it's a 2vs1, there will never be a 2nd pokemon on our field even
          const requiredPokemonsOnField = Math.min(globalScene.getPlayerParty().filter(p => !p.isFainted()).length, 2);
          // if it's a double, there should be 2, otherwise 1
          if (globalScene.currentBattle.double) {
            return pokemonsOnFieldCount === requiredPokemonsOnField;
          }
          return pokemonsOnFieldCount === 1;
        }),
      );
      const ivScannerModifier = globalScene.findModifier(m => m instanceof IvScannerModifier);
      if (ivScannerModifier) {
        enemyField.map(p => globalScene.pushPhase(new ScanIvsPhase(p.getBattlerIndex())));
      }
    }

    if (!this.loaded) {
      const availablePartyMembers = globalScene.getPokemonAllowedInBattle();

      if (!availablePartyMembers[0].isOnField()) {
        globalScene.pushPhase(new SummonPhase(0));
      }

      if (globalScene.currentBattle.double) {
        if (availablePartyMembers.length > 1) {
          globalScene.pushPhase(new ToggleDoublePositionPhase(true));
          if (!availablePartyMembers[1].isOnField()) {
            globalScene.pushPhase(new SummonPhase(1));
          }
        }
      } else {
        if (availablePartyMembers.length > 1 && availablePartyMembers[1].isOnField()) {
          globalScene.pushPhase(new ReturnPhase(1));
        }
        globalScene.pushPhase(new ToggleDoublePositionPhase(false));
      }

      if (
        globalScene.currentBattle.battleType !== BattleType.TRAINER &&
        (globalScene.currentBattle.waveIndex > 1 || !globalScene.gameMode.isDaily)
      ) {
        const minPartySize = globalScene.currentBattle.double ? 2 : 1;
        if (availablePartyMembers.length > minPartySize) {
          globalScene.pushPhase(new CheckSwitchPhase(0, globalScene.currentBattle.double));
          if (globalScene.currentBattle.double) {
            globalScene.pushPhase(new CheckSwitchPhase(1, globalScene.currentBattle.double));
          }
        }
      }
    }
    handleTutorial(Tutorial.Access_Menu).then(() => super.end());
  }

  tryOverrideForBattleSpec(): boolean {
    switch (globalScene.currentBattle.battleSpec) {
      case BattleSpec.FINAL_BOSS: {
        const enemy = globalScene.getEnemyPokemon();
        globalScene.ui.showText(
          this.getEncounterMessage(),
          null,
          () => {
            const localizationKey = "battleSpecDialogue:encounter";
            if (globalScene.ui.shouldSkipDialogue(localizationKey)) {
              // Logging mirrors logging found in dialogue-ui-handler
              console.log(`Dialogue ${localizationKey} skipped`);
              this.doEncounterCommon(false);
            } else {
              const count = 5643853 + globalScene.gameData.gameStats.classicSessionsPlayed;
              // The line below checks if an English ordinal is necessary or not based on whether an entry for encounterLocalizationKey exists in the language or not.
              const ordinalUsed =
                !i18next.exists(localizationKey, { fallbackLng: [] }) || i18next.resolvedLanguage === "en"
                  ? i18next.t("battleSpecDialogue:key", {
                      count: count,
                      ordinal: true,
                    })
                  : "";
              const cycleCount = count.toLocaleString() + ordinalUsed;
              const genderIndex = globalScene.gameData.gender ?? PlayerGender.UNSET;
              const genderStr = PlayerGender[genderIndex].toLowerCase();
              const encounterDialogue = i18next.t(localizationKey, {
                context: genderStr,
                cycleCount: cycleCount,
              });
              if (!globalScene.gameData.getSeenDialogues()[localizationKey]) {
                globalScene.gameData.saveSeenDialogue(localizationKey);
              }
              globalScene.ui.showDialogue(encounterDialogue, enemy?.species.name, null, () => {
                this.doEncounterCommon(false);
              });
            }
          },
          1500,
          true,
        );
        return true;
      }
    }
    return false;
  }

  /**
   * Set biome weather if and only if this encounter is the start of a new biome.
   *
   * By using function overrides, this should happen if and only if this phase
   * is exactly a NewBiomeEncounterPhase or an EncounterPhase (to account for
   * Wave 1 of a Daily Run), but NOT NextEncounterPhase (which starts the next
   * wave in the same biome).
   */
  trySetWeatherIfNewBiome(): void {
    if (!this.loaded) {
      globalScene.arena.trySetWeather(getRandomWeatherType(globalScene.arena));
    }
  }
}
