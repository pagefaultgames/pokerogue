import { gScene } from "#app/battle-scene";
import { BattlerIndex, BattleType } from "#app/battle";
import { applyAbAttrs, SyncEncounterNatureAbAttr } from "#app/data/ability";
import { getCharVariantFromDialogue } from "#app/data/dialogue";
import { TrainerSlot } from "#app/data/trainer-config";
import { getRandomWeatherType } from "#app/data/weather";
import { BattleSpec } from "#app/enums/battle-spec";
import { PlayerGender } from "#app/enums/player-gender";
import { Species } from "#app/enums/species";
import { EncounterPhaseEvent } from "#app/events/battle-scene";
import Pokemon, { FieldPosition } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { ModifierPoolType, regenerateModifierPoolThresholds } from "#app/modifier/modifier-type";
import { BoostBugSpawnModifier, IvScannerModifier, TurnHeldItemTransferModifier } from "#app/modifier/modifier";
import { achvs } from "#app/system/achv";
import { handleTutorial, Tutorial } from "#app/tutorial";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import { BattlePhase } from "./battle-phase";
import * as Utils from "#app/utils";
import { randSeedInt } from "#app/utils";
import { CheckSwitchPhase } from "./check-switch-phase";
import { GameOverPhase } from "./game-over-phase";
import { PostSummonPhase } from "./post-summon-phase";
import { ReturnPhase } from "./return-phase";
import { ScanIvsPhase } from "./scan-ivs-phase";
import { ShinySparklePhase } from "./shiny-sparkle-phase";
import { SummonPhase } from "./summon-phase";
import { ToggleDoublePositionPhase } from "./toggle-double-position-phase";
import Overrides from "#app/overrides";
import { initEncounterAnims, loadEncounterAnimAssets } from "#app/data/battle-anims";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { doTrainerExclamation } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { getEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { MysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";
import { getGoldenBugNetSpecies } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { Biome } from "#enums/biome";
import { WEIGHT_INCREMENT_ON_SPAWN_MISS } from "#app/data/mystery-encounters/mystery-encounters";

export class EncounterPhase extends BattlePhase {
  private loaded: boolean;

  constructor(loaded?: boolean) {
    super();

    this.loaded = !!loaded;
  }

  start() {
    super.start();

    gScene.updateGameInfo();

    gScene.initSession();

    gScene.eventTarget.dispatchEvent(new EncounterPhaseEvent());

    // Failsafe if players somehow skip floor 200 in classic mode
    if (gScene.gameMode.isClassic && gScene.currentBattle.waveIndex > 200) {
      gScene.unshiftPhase(new GameOverPhase());
    }

    const loadEnemyAssets: Promise<void>[] = [];

    const battle = gScene.currentBattle;

    // Generate and Init Mystery Encounter
    if (battle.isBattleMysteryEncounter() && !battle.mysteryEncounter) {
      gScene.executeWithSeedOffset(() => {
        const currentSessionEncounterType = battle.mysteryEncounterType;
        battle.mysteryEncounter = gScene.getMysteryEncounter(currentSessionEncounterType);
      }, battle.waveIndex * 16);
    }
    const mysteryEncounter = battle.mysteryEncounter;
    if (mysteryEncounter) {
      // If ME has an onInit() function, call it
      // Usually used for calculating rand data before initializing anything visual
      // Also prepopulates any dialogue tokens from encounter/option requirements
      gScene.executeWithSeedOffset(() => {
        if (mysteryEncounter.onInit) {
          mysteryEncounter.onInit();
        }
        mysteryEncounter.populateDialogueTokensFromRequirements();
      }, battle.waveIndex);

      // Add any special encounter animations to load
      if (mysteryEncounter.encounterAnimations && mysteryEncounter.encounterAnimations.length > 0) {
        loadEnemyAssets.push(initEncounterAnims(mysteryEncounter.encounterAnimations).then(() => loadEncounterAnimAssets(true)));
      }

      // Add intro visuals for mystery encounter
      mysteryEncounter.initIntroVisuals();
      gScene.field.add(mysteryEncounter.introVisuals!);
    }

    let totalBst = 0;

    battle.enemyLevels?.every((level, e) => {
      if (battle.isBattleMysteryEncounter()) {
        // Skip enemy loading for MEs, those are loaded elsewhere
        return false;
      }
      if (!this.loaded) {
        if (battle.battleType === BattleType.TRAINER) {
          battle.enemyParty[e] = battle.trainer?.genPartyMember(e)!; // TODO:: is the bang correct here?
        } else {
          let enemySpecies = gScene.randomSpecies(battle.waveIndex, level, true);
          // If player has golden bug net, rolls 10% chance to replace non-boss wave wild species from the golden bug net bug pool
          if (gScene.findModifier(m => m instanceof BoostBugSpawnModifier)
            && !gScene.gameMode.isBoss(battle.waveIndex)
            && gScene.arena.biomeType !== Biome.END
            && randSeedInt(10) === 0) {
            enemySpecies = getGoldenBugNetSpecies(level);
          }
          battle.enemyParty[e] = gScene.addEnemyPokemon(enemySpecies, level, TrainerSlot.NONE, !!gScene.getEncounterBossSegments(battle.waveIndex, level, enemySpecies));
          if (gScene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
            battle.enemyParty[e].ivs = new Array(6).fill(31);
          }
          gScene.getParty().slice(0, !battle.double ? 1 : 2).reverse().forEach(playerPokemon => {
            applyAbAttrs(SyncEncounterNatureAbAttr, playerPokemon, null, false, battle.enemyParty[e]);
          });
        }
      }
      const enemyPokemon = gScene.getEnemyParty()[e];
      if (e < (battle.double ? 2 : 1)) {
        enemyPokemon.setX(-66 + enemyPokemon.getFieldPositionOffset()[0]);
        enemyPokemon.resetSummonData();
      }

      if (!this.loaded) {
        gScene.gameData.setPokemonSeen(enemyPokemon, true, battle.battleType === BattleType.TRAINER || battle?.mysteryEncounter?.encounterMode === MysteryEncounterMode.TRAINER_BATTLE);
      }

      if (enemyPokemon.species.speciesId === Species.ETERNATUS) {
        if (gScene.gameMode.isClassic && (battle.battleSpec === BattleSpec.FINAL_BOSS || gScene.gameMode.isWaveFinal(battle.waveIndex))) {
          if (battle.battleSpec !== BattleSpec.FINAL_BOSS) {
            enemyPokemon.formIndex = 1;
            enemyPokemon.updateScale();
          }
          enemyPokemon.setBoss();
        } else if (!(battle.waveIndex % 1000)) {
          enemyPokemon.formIndex = 1;
          enemyPokemon.updateScale();
          const bossMBH = gScene.findModifier(m => m instanceof TurnHeldItemTransferModifier && m.pokemonId === enemyPokemon.id, false) as TurnHeldItemTransferModifier;
          gScene.removeModifier(bossMBH!);
          bossMBH?.setTransferrableFalse();
          gScene.addEnemyModifier(bossMBH!);
        }
      }

      totalBst += enemyPokemon.getSpeciesForm().baseTotal;

      loadEnemyAssets.push(enemyPokemon.loadAssets());

      console.log(`Pokemon: ${getPokemonNameWithAffix(enemyPokemon)}`, `Species ID: ${enemyPokemon.species.speciesId}`, `Stats: ${enemyPokemon.stats}`, `Ability: ${enemyPokemon.getAbility().name}`, `Passive Ability: ${enemyPokemon.getPassiveAbility().name}`);
      return true;
    });

    if (gScene.getParty().filter(p => p.isShiny()).length === 6) {
      gScene.validateAchv(achvs.SHINY_PARTY);
    }

    if (battle.battleType === BattleType.TRAINER) {
      loadEnemyAssets.push(battle.trainer?.loadAssets().then(() => battle.trainer?.initSprite())!); // TODO: is this bang correct?
    } else if (battle.isBattleMysteryEncounter()) {
      if (battle.mysteryEncounter?.introVisuals) {
        loadEnemyAssets.push(battle.mysteryEncounter.introVisuals.loadAssets().then(() => battle.mysteryEncounter!.introVisuals!.initSprite()));
      }
      if (battle.mysteryEncounter?.loadAssets && battle.mysteryEncounter.loadAssets.length > 0) {
        loadEnemyAssets.push(...battle.mysteryEncounter.loadAssets);
      }
      // Load Mystery Encounter Exclamation bubble and sfx
      loadEnemyAssets.push(new Promise<void>(resolve => {
        gScene.loadSe("GEN8- Exclaim", "battle_anims", "GEN8- Exclaim.wav");
        gScene.loadImage("encounter_exclaim", "mystery-encounters");
        gScene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
        if (!gScene.load.isLoading()) {
          gScene.load.start();
        }
      }));
    } else {
      const overridedBossSegments = Overrides.OPP_HEALTH_SEGMENTS_OVERRIDE > 1;
      // for double battles, reduce the health segments for boss Pokemon unless there is an override
      if (!overridedBossSegments && battle.enemyParty.filter(p => p.isBoss()).length > 1) {
        for (const enemyPokemon of battle.enemyParty) {
          // If the enemy pokemon is a boss and wasn't populated from data source, then update the number of segments
          if (enemyPokemon.isBoss() && !enemyPokemon.isPopulatedFromDataSource) {
            enemyPokemon.setBoss(true, Math.ceil(enemyPokemon.bossSegments * (enemyPokemon.getSpeciesForm().baseTotal / totalBst)));
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
            gScene.field.add(enemyPokemon);
            battle.seenEnemyPartyMemberIds.add(enemyPokemon.id);
            const playerPokemon = gScene.getPlayerPokemon();
            if (playerPokemon?.visible) {
              gScene.field.moveBelow(enemyPokemon as Pokemon, playerPokemon);
            }
            enemyPokemon.tint(0, 0.5);
          } else if (battle.battleType === BattleType.TRAINER) {
            enemyPokemon.setVisible(false);
            gScene.currentBattle.trainer?.tint(0, 0.5);
          }
          if (battle.double) {
            enemyPokemon.setFieldPosition(e ? FieldPosition.RIGHT : FieldPosition.LEFT);
          }
        }
        return true;
      });

      if (!this.loaded && battle.battleType !== BattleType.MYSTERY_ENCOUNTER) {
        regenerateModifierPoolThresholds(gScene.getEnemyField(), battle.battleType === BattleType.TRAINER ? ModifierPoolType.TRAINER : ModifierPoolType.WILD);
        gScene.generateEnemyModifiers();
      }

      gScene.ui.setMode(Mode.MESSAGE).then(() => {
        if (!this.loaded) {
          this.trySetWeatherIfNewBiome(); // Set weather before session gets saved
          gScene.gameData.saveAll(true, battle.waveIndex % 10 === 1 || (gScene.lastSavePlayTime ?? 0) >= 300).then(success => {
            gScene.disableMenu = false;
            if (!success) {
              return gScene.reset(true);
            }
            this.doEncounter();
            gScene.resetSeed();
          });
        } else {
          this.doEncounter();
          gScene.resetSeed();
        }
      });
    });
  }

  doEncounter() {
    gScene.playBgm(undefined, true);
    gScene.updateModifiers(false);
    gScene.setFieldScale(1);

    /*if (startingWave > 10) {
        for (let m = 0; m < Math.min(Math.floor(startingWave / 10), 99); m++)
          gScene.addModifier(getPlayerModifierTypeOptionsForWave((m + 1) * 10, 1, gScene.getParty())[0].type.newModifier(), true);
        gScene.updateModifiers(true);
      }*/

    const { battleType, waveIndex } = gScene.currentBattle;
    if (gScene.isMysteryEncounterValidForWave(battleType,  waveIndex) && !gScene.currentBattle.isBattleMysteryEncounter()) {
      // Increment ME spawn chance if an ME could have spawned but did not
      // Only do this AFTER session has been saved to avoid duplicating increments
      gScene.mysteryEncounterSaveData.encounterSpawnChance += WEIGHT_INCREMENT_ON_SPAWN_MISS;
    }

    for (const pokemon of gScene.getParty()) {
      if (pokemon) {
        pokemon.resetBattleData();
      }
    }

    const enemyField = gScene.getEnemyField();
    gScene.tweens.add({
      targets: [ gScene.arenaEnemy, gScene.currentBattle.trainer, enemyField, gScene.arenaPlayer, gScene.trainer ].flat(),
      x: (_target, _key, value, fieldIndex: integer) => fieldIndex < 2 + (enemyField.length) ? value + 300 : value - 300,
      duration: 2000,
      onComplete: () => {
        if (!this.tryOverrideForBattleSpec()) {
          this.doEncounterCommon();
        }
      }
    });

    const encounterIntroVisuals = gScene.currentBattle?.mysteryEncounter?.introVisuals;
    if (encounterIntroVisuals) {
      const enterFromRight = encounterIntroVisuals.enterFromRight;
      if (enterFromRight) {
        encounterIntroVisuals.x += 500;
      }
      gScene.tweens.add({
        targets: encounterIntroVisuals,
        x: enterFromRight ? "-=200" : "+=300",
        duration: 2000
      });
    }
  }

  getEncounterMessage(): string {
    const enemyField = gScene.getEnemyField();

    if (gScene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
      return i18next.t("battle:bossAppeared", { bossName: getPokemonNameWithAffix(enemyField[0]) });
    }

    if (gScene.currentBattle.battleType === BattleType.TRAINER) {
      if (gScene.currentBattle.double) {
        return i18next.t("battle:trainerAppearedDouble", { trainerName: gScene.currentBattle.trainer?.getName(TrainerSlot.NONE, true) });

      } else {
        return i18next.t("battle:trainerAppeared", { trainerName: gScene.currentBattle.trainer?.getName(TrainerSlot.NONE, true) });
      }
    }

    return enemyField.length === 1
      ? i18next.t("battle:singleWildAppeared", { pokemonName: enemyField[0].getNameToRender() })
      : i18next.t("battle:multiWildAppeared", { pokemonName1: enemyField[0].getNameToRender(), pokemonName2: enemyField[1].getNameToRender() });
  }

  doEncounterCommon(showEncounterMessage: boolean = true) {
    const enemyField = gScene.getEnemyField();

    if (gScene.currentBattle.battleType === BattleType.WILD) {
      enemyField.forEach(enemyPokemon => {
        enemyPokemon.untint(100, "Sine.easeOut");
        enemyPokemon.cry();
        enemyPokemon.showInfo();
        if (enemyPokemon.isShiny()) {
          gScene.validateAchv(achvs.SEE_SHINY);
        }
      });
      gScene.updateFieldScale();
      if (showEncounterMessage) {
        gScene.ui.showText(this.getEncounterMessage(), null, () => this.end(), 1500);
      } else {
        this.end();
      }
    } else if (gScene.currentBattle.battleType === BattleType.TRAINER) {
      const trainer = gScene.currentBattle.trainer;
      trainer?.untint(100, "Sine.easeOut");
      trainer?.playAnim();

      const doSummon = () => {
        gScene.currentBattle.started = true;
        gScene.playBgm(undefined);
        gScene.pbTray.showPbTray(gScene.getParty());
        gScene.pbTrayEnemy.showPbTray(gScene.getEnemyParty());
        const doTrainerSummon = () => {
          this.hideEnemyTrainer();
          const availablePartyMembers = gScene.getEnemyParty().filter(p => !p.isFainted()).length;
          gScene.unshiftPhase(new SummonPhase(0, false));
          if (gScene.currentBattle.double && availablePartyMembers > 1) {
            gScene.unshiftPhase(new SummonPhase(1, false));
          }
          this.end();
        };
        if (showEncounterMessage) {
          gScene.ui.showText(this.getEncounterMessage(), null, doTrainerSummon, 1500, true);
        } else {
          doTrainerSummon();
        }
      };

      const encounterMessages = gScene.currentBattle.trainer?.getEncounterMessages();

      if (!encounterMessages?.length) {
        doSummon();
      } else {
        let message: string;
        gScene.executeWithSeedOffset(() => message = Utils.randSeedItem(encounterMessages), gScene.currentBattle.waveIndex);
        message = message!; // tell TS compiler it's defined now
        const showDialogueAndSummon = () => {
          gScene.ui.showDialogue(message, trainer?.getName(TrainerSlot.NONE, true), null, () => {
            gScene.charSprite.hide().then(() => gScene.hideFieldOverlay(250).then(() => doSummon()));
          });
        };
        if (gScene.currentBattle.trainer?.config.hasCharSprite && !gScene.ui.shouldSkipDialogue(message)) {
          gScene.showFieldOverlay(500).then(() => gScene.charSprite.showCharacter(trainer?.getKey()!, getCharVariantFromDialogue(encounterMessages[0])).then(() => showDialogueAndSummon())); // TODO: is this bang correct?
        } else {
          showDialogueAndSummon();
        }
      }
    } else if (gScene.currentBattle.isBattleMysteryEncounter() && gScene.currentBattle.mysteryEncounter) {
      const encounter = gScene.currentBattle.mysteryEncounter;
      const introVisuals = encounter.introVisuals;
      introVisuals?.playAnim();

      if (encounter.onVisualsStart) {
        encounter.onVisualsStart();
      }

      const doEncounter = () => {
        const doShowEncounterOptions = () => {
          gScene.ui.clearText();
          gScene.ui.getMessageHandler().hideNameText();

          gScene.unshiftPhase(new MysteryEncounterPhase());
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
                gScene.ui.showDialogue(text, title, null, nextAction, 0, i === 1 ? FIRST_DIALOGUE_PROMPT_DELAY : 0);
              } else {
                gScene.ui.showText(text, null, nextAction, i === 1 ? FIRST_DIALOGUE_PROMPT_DELAY : 0, true);
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
        gScene.ui.showDialogue(encounterMessage, "???", null, () => {
          gScene.charSprite.hide().then(() => gScene.hideFieldOverlay(250).then(() => doEncounter()));
        });
      }
    }
  }

  end() {
    const enemyField = gScene.getEnemyField();

    enemyField.forEach((enemyPokemon, e) => {
      if (enemyPokemon.isShiny()) {
        gScene.unshiftPhase(new ShinySparklePhase(BattlerIndex.ENEMY + e));
      }
    });

    if (![ BattleType.TRAINER, BattleType.MYSTERY_ENCOUNTER ].includes(gScene.currentBattle.battleType)) {
      enemyField.map(p => gScene.pushConditionalPhase(new PostSummonPhase(p.getBattlerIndex()), () => {
        // if there is not a player party, we can't continue
        if (!gScene.getParty()?.length) {
          return false;
        }
        // how many player pokemon are on the field ?
        const pokemonsOnFieldCount = gScene.getParty().filter(p => p.isOnField()).length;
        // if it's a 2vs1, there will never be a 2nd pokemon on our field even
        const requiredPokemonsOnField = Math.min(gScene.getParty().filter((p) => !p.isFainted()).length, 2);
        // if it's a double, there should be 2, otherwise 1
        if (gScene.currentBattle.double) {
          return pokemonsOnFieldCount === requiredPokemonsOnField;
        }
        return pokemonsOnFieldCount === 1;
      }));
      const ivScannerModifier = gScene.findModifier(m => m instanceof IvScannerModifier);
      if (ivScannerModifier) {
        enemyField.map(p => gScene.pushPhase(new ScanIvsPhase(p.getBattlerIndex(), Math.min(ivScannerModifier.getStackCount() * 2, 6))));
      }
    }

    if (!this.loaded) {
      const availablePartyMembers = gScene.getParty().filter(p => p.isAllowedInBattle());

      if (!availablePartyMembers[0].isOnField()) {
        gScene.pushPhase(new SummonPhase(0));
      }

      if (gScene.currentBattle.double) {
        if (availablePartyMembers.length > 1) {
          gScene.pushPhase(new ToggleDoublePositionPhase(true));
          if (!availablePartyMembers[1].isOnField()) {
            gScene.pushPhase(new SummonPhase(1));
          }
        }
      } else {
        if (availablePartyMembers.length > 1 && availablePartyMembers[1].isOnField()) {
          gScene.pushPhase(new ReturnPhase(1));
        }
        gScene.pushPhase(new ToggleDoublePositionPhase(false));
      }

      if (gScene.currentBattle.battleType !== BattleType.TRAINER && (gScene.currentBattle.waveIndex > 1 || !gScene.gameMode.isDaily)) {
        const minPartySize = gScene.currentBattle.double ? 2 : 1;
        if (availablePartyMembers.length > minPartySize) {
          gScene.pushPhase(new CheckSwitchPhase(0, gScene.currentBattle.double));
          if (gScene.currentBattle.double) {
            gScene.pushPhase(new CheckSwitchPhase(1, gScene.currentBattle.double));
          }
        }
      }
    }
    handleTutorial(Tutorial.Access_Menu).then(() => super.end());
  }

  tryOverrideForBattleSpec(): boolean {
    switch (gScene.currentBattle.battleSpec) {
      case BattleSpec.FINAL_BOSS:
        const enemy = gScene.getEnemyPokemon();
        gScene.ui.showText(this.getEncounterMessage(), null, () => {
          const localizationKey = "battleSpecDialogue:encounter";
          if (gScene.ui.shouldSkipDialogue(localizationKey)) {
          // Logging mirrors logging found in dialogue-ui-handler
            console.log(`Dialogue ${localizationKey} skipped`);
            this.doEncounterCommon(false);
          } else {
            const count = 5643853 + gScene.gameData.gameStats.classicSessionsPlayed;
            // The line below checks if an English ordinal is necessary or not based on whether an entry for encounterLocalizationKey exists in the language or not.
            const ordinalUsed = !i18next.exists(localizationKey, { fallbackLng: []}) || i18next.resolvedLanguage === "en" ? i18next.t("battleSpecDialogue:key", { count: count, ordinal: true }) : "";
            const cycleCount = count.toLocaleString() + ordinalUsed;
            const genderIndex = gScene.gameData.gender ?? PlayerGender.UNSET;
            const genderStr = PlayerGender[genderIndex].toLowerCase();
            const encounterDialogue = i18next.t(localizationKey, { context: genderStr, cycleCount: cycleCount });
            if (!gScene.gameData.getSeenDialogues()[localizationKey]) {
              gScene.gameData.saveSeenDialogue(localizationKey);
            }
            gScene.ui.showDialogue(encounterDialogue, enemy?.species.name, null, () => {
              this.doEncounterCommon(false);
            });
          }
        }, 1500, true);
        return true;
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
      gScene.arena.trySetWeather(getRandomWeatherType(gScene.arena), false);
    }
  }
}
