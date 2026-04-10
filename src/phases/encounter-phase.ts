import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { PLAYER_PARTY_MAX_SIZE, WEIGHT_INCREMENT_ON_SPAWN_MISS } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import Overrides from "#app/overrides";
import { handleTutorial, Tutorial } from "#app/tutorial";
import { initEncounterAnims, loadEncounterAnimAssets } from "#data/battle-anims";
import { getCharVariantFromDialogue } from "#data/dialogue";
import { getNatureName } from "#data/nature";
import { BattleSpec } from "#enums/battle-spec";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { BiomeId } from "#enums/biome-id";
import { FieldPosition } from "#enums/field-position";
import { ModifierPoolType } from "#enums/modifier-pool-type";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { PlayerGender } from "#enums/player-gender";
import { SpeciesId } from "#enums/species-id";
import { TrainerSlot } from "#enums/trainer-slot";
import { UiMode } from "#enums/ui-mode";
import { EncounterPhaseEvent } from "#events/battle-scene";
import type { Pokemon } from "#field/pokemon";
import {
  BoostBugSpawnModifier,
  IvScannerModifier,
  overrideHeldItems,
  overrideModifiers,
  TurnHeldItemTransferModifier,
} from "#modifiers/modifier";
import { regenerateModifierPoolThresholds } from "#modifiers/modifier-type";
import { getEncounterText } from "#mystery-encounters/encounter-dialogue-utils";
import { doTrainerExclamation } from "#mystery-encounters/encounter-phase-utils";
import { getGoldenBugNetSpecies } from "#mystery-encounters/encounter-pokemon-utils";
import { BattlePhase } from "#phases/battle-phase";
import { achvs } from "#system/achv";
import { randSeedInt, randSeedItem } from "#utils/common";
import i18next from "i18next";

export class EncounterPhase extends BattlePhase {
  // Union type is necessary as this is subclassed, and typescript will otherwise complain
  public readonly phaseName: "EncounterPhase" | "NextEncounterPhase" | "NewBiomeEncounterPhase" = "EncounterPhase";

  private readonly loaded: boolean;

  constructor(loaded = false) {
    super();

    this.loaded = loaded;
  }

  public override async start(): Promise<void> {
    super.start();

    const {
      arena,
      currentBattle: battle,
      eventTarget,
      field,
      gameData,
      gameMode,
      lastSavePlayTime,
      load,
      phaseManager,
      ui,
    } = globalScene;
    const { biomeId } = arena;
    const { battleSpec, battleType, double, trainer, waveIndex } = battle;
    const { isClassic } = gameMode;

    globalScene.updateGameInfo();

    globalScene.initSession();

    eventTarget.dispatchEvent(new EncounterPhaseEvent());

    // Failsafe if players somehow skip floor 200 in classic mode
    if (isClassic && waveIndex > 200) {
      phaseManager.unshiftNew("GameOverPhase");
    }

    const loadEnemyAssets: Promise<void>[] = [];

    // Generate and Init Mystery Encounter
    if (battle.isBattleMysteryEncounter() && !battle.mysteryEncounter) {
      globalScene.executeWithSeedOffset(() => {
        const currentSessionEncounterType = battle.mysteryEncounterType;
        battle.mysteryEncounter = globalScene.getMysteryEncounter(currentSessionEncounterType);
      }, waveIndex * 16);
    }
    const { mysteryEncounter } = battle;
    if (mysteryEncounter) {
      // If ME has an onInit() function, call it
      // Usually used for calculating rand data before initializing anything visual
      // Also prepopulates any dialogue tokens from encounter/option requirements
      globalScene.executeWithSeedOffset(() => {
        if (mysteryEncounter.onInit) {
          mysteryEncounter.onInit();
        }
        mysteryEncounter.populateDialogueTokensFromRequirements();
      }, waveIndex);

      // Add any special encounter animations to load
      if (mysteryEncounter.encounterAnimations && mysteryEncounter.encounterAnimations.length > 0) {
        loadEnemyAssets.push(
          initEncounterAnims(mysteryEncounter.encounterAnimations).then(() => loadEncounterAnimAssets(true)),
        );
      }

      // Add intro visuals for mystery encounter
      mysteryEncounter.initIntroVisuals();
      field.add(mysteryEncounter.introVisuals!);
    }

    let totalBst = 0;

    battle.enemyLevels?.forEach((level, e) => {
      if (battle.isBattleMysteryEncounter()) {
        // Skip enemy loading for MEs, those are loaded elsewhere
        return;
      }
      if (!this.loaded) {
        if (battleType === BattleType.TRAINER) {
          battle.enemyParty[e] = trainer?.genPartyMember(e)!; // TODO:: is the bang correct here?
        } else {
          let enemySpecies = globalScene.randomSpecies(waveIndex, level, true);
          // If player has golden bug net, rolls 10% chance to replace non-boss wave wild species from the golden bug net bug pool
          if (
            globalScene.findModifier(m => m instanceof BoostBugSpawnModifier)
            && !gameMode.isBoss(waveIndex)
            && biomeId !== BiomeId.END
            && randSeedInt(10) === 0
          ) {
            enemySpecies = getGoldenBugNetSpecies(level);
          }
          battle.enemyParty[e] = globalScene.addEnemyPokemon(
            enemySpecies,
            level,
            TrainerSlot.NONE,
            !!globalScene.getEncounterBossSegments(waveIndex, level, enemySpecies),
          );
          if (battleSpec === BattleSpec.FINAL_BOSS) {
            battle.enemyParty[e].ivs.fill(31);
          }
          globalScene
            .getPlayerParty()
            .slice(0, double ? 2 : 1)
            .reverse()
            .forEach(playerPokemon => {
              applyAbAttrs("SyncEncounterNatureAbAttr", { pokemon: playerPokemon, target: battle.enemyParty[e] });
            });
        }
      }
      const enemyPokemon = globalScene.getEnemyParty()[e];
      if (e < (double ? 2 : 1)) {
        enemyPokemon.setX(-66 + enemyPokemon.getFieldPositionOffset()[0]);
        enemyPokemon.fieldSetup(true);
      }

      if (!this.loaded) {
        gameData.setPokemonSeen(
          enemyPokemon,
          true,
          battleType === BattleType.TRAINER || mysteryEncounter?.encounterMode === MysteryEncounterMode.TRAINER_BATTLE,
        );
      }

      if (enemyPokemon.species.speciesId === SpeciesId.ETERNATUS) {
        if (isClassic && (battleSpec === BattleSpec.FINAL_BOSS || gameMode.isWaveFinal(waveIndex))) {
          if (battleSpec !== BattleSpec.FINAL_BOSS) {
            enemyPokemon.formIndex = 1;
            enemyPokemon.updateScale();
          }
          enemyPokemon.setBoss();
        } else if (!(waveIndex % 1000)) {
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
        moveset.push(move.getName());
      }

      console.log(
        `Pokemon: ${getPokemonNameWithAffix(enemyPokemon)}`,
        `| Species ID: ${enemyPokemon.species.speciesId}`,
        `| Level: ${enemyPokemon.level}`,
        `| Nature: ${getNatureName(enemyPokemon.nature, true, true, true)}`,
      );
      console.log(`Stats (IVs): ${stats}`);
      console.log(
        `Ability: ${enemyPokemon.getAbility().name}`,
        `| Passive Ability${enemyPokemon.hasPassive() ? "" : " (inactive)"}: ${enemyPokemon.getPassiveAbility().name}`,
        `${enemyPokemon.isBoss() ? `| Boss Bars: ${enemyPokemon.bossSegments}` : ""}`,
      );
      console.log("Moveset:", moveset);
    });

    if (globalScene.getPlayerParty().filter(p => p.isShiny()).length === PLAYER_PARTY_MAX_SIZE) {
      globalScene.validateAchv(achvs.SHINY_PARTY);
    }

    if (battleType === BattleType.TRAINER) {
      loadEnemyAssets.push(trainer?.loadAssets().then(() => trainer?.initSprite())!); // TODO: is this bang correct?
    } else if (battle.isBattleMysteryEncounter()) {
      if (mysteryEncounter?.introVisuals) {
        loadEnemyAssets.push(
          mysteryEncounter.introVisuals.loadAssets().then(() => mysteryEncounter.introVisuals!.initSprite()),
        );
      }
      if (mysteryEncounter?.loadAssets && mysteryEncounter.loadAssets.length > 0) {
        loadEnemyAssets.push(...mysteryEncounter.loadAssets);
      }
      // Load Mystery Encounter Exclamation bubble and sfx
      loadEnemyAssets.push(
        new Promise<void>(resolve => {
          globalScene
            .loadSe("GEN8- Exclaim", "battle_anims", "GEN8- Exclaim.wav")
            .loadImage("encounter_exclaim", "mystery-encounters");
          load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
          if (!load.isLoading()) {
            load.start();
          }
        }),
      );
    } else {
      const overridedBossSegments = Overrides.ENEMY_HEALTH_SEGMENTS_OVERRIDE > 1;
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

    await Promise.all(loadEnemyAssets);
    battle.enemyParty.forEach((enemyPokemon, e) => {
      if (battle.isBattleMysteryEncounter()) {
        return;
      }
      if (e < (double ? 2 : 1)) {
        if (battleType === BattleType.WILD) {
          for (const pokemon of globalScene.getField()) {
            applyAbAttrs("PreSummonAbAttr", { pokemon });
          }
          field.add(enemyPokemon);
          battle.seenEnemyPartyMemberIds.add(enemyPokemon.id);
          const playerPokemon = globalScene.getPlayerPokemon();
          if (playerPokemon?.isOnField()) {
            field.moveBelow(enemyPokemon as Pokemon, playerPokemon);
          }
          enemyPokemon.tint(0, 0.5);
        } else if (battleType === BattleType.TRAINER) {
          enemyPokemon.setVisible(false);
          trainer?.tint(0, 0.5);
        }
        if (double) {
          enemyPokemon.setFieldPosition(e ? FieldPosition.RIGHT : FieldPosition.LEFT);
        }
      }
    });

    if (!this.loaded && battleType !== BattleType.MYSTERY_ENCOUNTER) {
      // generate modifiers for MEs, overriding prior ones as applicable
      regenerateModifierPoolThresholds(
        globalScene.getEnemyField(),
        battleType === BattleType.TRAINER ? ModifierPoolType.TRAINER : ModifierPoolType.WILD,
      );
      globalScene.generateEnemyModifiers();
      overrideModifiers(false);

      for (const enemy of globalScene.getEnemyField()) {
        overrideHeldItems(enemy, false);
      }
    }

    if (battleType === BattleType.TRAINER && trainer) {
      trainer.genAI(globalScene.getEnemyParty());
    }

    await ui.setMode(UiMode.MESSAGE);
    if (this.loaded) {
      this.doEncounter();
      globalScene.resetSeed();
      return;
    }
    // Set weather and terrain before session gets saved
    this.trySetWeatherIfNewBiome();
    this.trySetTerrainIfNewBiome();
    // Game syncs to server on waves X1 and X6 (As of 1.2.0)
    const success = await gameData.saveAll(true, waveIndex % 5 === 1 || (lastSavePlayTime ?? 0) >= 300);
    globalScene.disableMenu = false;
    if (!success) {
      return globalScene.reset(true);
    }
    this.doEncounter();
    globalScene.resetSeed();
  }

  private incrementMysteryEncounterChance(): void {
    const { currentBattle, mysteryEncounterSaveData } = globalScene;
    const { battleType, waveIndex } = currentBattle;

    if (
      globalScene.isMysteryEncounterValidForWave(battleType, waveIndex)
      && !currentBattle.isBattleMysteryEncounter()
    ) {
      // Increment ME spawn chance if an ME could have spawned but did not
      // Only do this AFTER session has been saved to avoid duplicating increments
      mysteryEncounterSaveData.encounterSpawnChance += WEIGHT_INCREMENT_ON_SPAWN_MISS;
    }
  }

  protected doEncounter(): void {
    globalScene.playBgm(undefined, true);
    globalScene.updateModifiers(false);
    globalScene.setFieldScale(1);

    for (const pokemon of globalScene.getPlayerParty()) {
      // Currently, a new wave is not considered a new battle if there is no arena reset
      // Therefore, we only reset wave data here
      if (pokemon) {
        pokemon.resetWaveData();
      }
    }

    const { arenaEnemy, arenaPlayer, currentBattle, trainer, tweens } = globalScene;
    const { trainer: enemyTrainer } = currentBattle;

    const enemyField = globalScene.getEnemyField();
    tweens.add({
      targets: [arenaEnemy, enemyTrainer, enemyField, arenaPlayer, trainer].flat(),
      x: (_target, _key, value, fieldIndex: number) => (fieldIndex < 2 + enemyField.length ? value + 300 : value - 300),
      duration: 2000,
      onComplete: () => {
        if (!this.tryOverrideForBattleSpec()) {
          this.doEncounterCommon();
        }
      },
    });

    const encounterIntroVisuals = currentBattle?.mysteryEncounter?.introVisuals;
    if (encounterIntroVisuals) {
      const enterFromRight = encounterIntroVisuals.enterFromRight;
      if (enterFromRight) {
        encounterIntroVisuals.x += 500;
      }
      tweens.add({
        targets: encounterIntroVisuals,
        x: enterFromRight ? "-=200" : "+=300",
        duration: 2000,
      });
    }
  }

  private getEncounterMessage(): string {
    const enemyField = globalScene.getEnemyField();
    const { battleSpec, battleType, double, trainer } = globalScene.currentBattle;

    if (battleSpec === BattleSpec.FINAL_BOSS) {
      return i18next.t("battle:bossAppeared", {
        bossName: getPokemonNameWithAffix(enemyField[0]),
      });
    }

    if (battleType === BattleType.TRAINER) {
      if (double) {
        return i18next.t("battle:trainerAppearedDouble", { trainerName: trainer?.getName(TrainerSlot.NONE, true) });
      }
      return i18next.t("battle:trainerAppeared", { trainerName: trainer?.getName(TrainerSlot.NONE, true) });
    }

    return enemyField.length === 1
      ? i18next.t("battle:singleWildAppeared", { pokemonName: enemyField[0].getNameToRender() })
      : i18next.t("battle:multiWildAppeared", {
          pokemonName1: enemyField[0].getNameToRender(),
          pokemonName2: enemyField[1].getNameToRender(),
        });
  }

  protected async doEncounterCommon(showEncounterMessage = true): Promise<void> {
    this.incrementMysteryEncounterChance();

    const enemyField = globalScene.getEnemyField();
    const { charSprite, currentBattle, pbTray, pbTrayEnemy, phaseManager, ui } = globalScene;
    const { battleType, double, mysteryEncounter: encounter, trainer, waveIndex } = currentBattle;

    if (battleType === BattleType.WILD) {
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
        await ui.showTextPromise(this.getEncounterMessage(), 1500);
      }
      this.end();
      return;
    }
    if (battleType === BattleType.TRAINER) {
      trainer?.untint(100, "Sine.easeOut");
      trainer?.playAnim();

      const doSummon = async () => {
        currentBattle.started = true;
        globalScene.playBgm(undefined);

        pbTray.showPbTray(globalScene.getPlayerParty());
        pbTrayEnemy.showPbTray(globalScene.getEnemyParty());

        if (showEncounterMessage) {
          await ui.showTextPromise(this.getEncounterMessage(), 1500);
        }

        this.hideEnemyTrainer();

        const availablePartyMembers = globalScene.getEnemyParty().filter(p => !p.isFainted()).length;

        phaseManager.unshiftNew("SummonPhase", 0, false);
        if (double && availablePartyMembers > 1) {
          phaseManager.unshiftNew("SummonPhase", 1, false);
        }

        this.end();
      };

      const encounterMessages = trainer?.getEncounterMessages() ?? [];

      if (encounterMessages.length === 0) {
        doSummon();
        return;
      }

      let message = "";
      globalScene.executeWithSeedOffset(() => (message = randSeedItem(encounterMessages)), waveIndex);

      if (trainer?.config.hasCharSprite && !ui.shouldSkipDialogue(message)) {
        await globalScene.showFieldOverlay(500);
        await charSprite.showCharacter(trainer.getKey()!, getCharVariantFromDialogue(encounterMessages[0]));
      }

      ui.showDialogue(message, trainer?.getName(TrainerSlot.NONE, true), null, async () => {
        await charSprite.hide();
        await globalScene.hideFieldOverlay(250);
        doSummon();
      });

      return;
    }

    if (currentBattle.isBattleMysteryEncounter() && encounter) {
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
          ui.clearText();
          ui.getMessageHandler().hideNameText();

          phaseManager.unshiftNew("MysteryEncounterPhase");
          this.end();
        };

        const introDialogue = encounter.dialogue.intro;
        if (showEncounterMessage && introDialogue) {
          const FIRST_DIALOGUE_PROMPT_DELAY = 750;
          let i = 0;
          const showNextDialogue = () => {
            const nextAction = i === introDialogue.length - 1 ? doShowEncounterOptions : showNextDialogue;
            const dialogue = introDialogue[i];
            const title = getEncounterText(dialogue?.speaker);
            const text = getEncounterText(dialogue.text)!;
            i++;
            if (title) {
              ui.showDialogue(text, title, null, nextAction, 0, i === 1 ? FIRST_DIALOGUE_PROMPT_DELAY : 0);
            } else {
              ui.showText(text, null, nextAction, i === 1 ? FIRST_DIALOGUE_PROMPT_DELAY : 0, true);
            }
          };

          if (introDialogue.length > 0) {
            showNextDialogue();
          }
        } else {
          doShowEncounterOptions();
        }
      };

      const encounterMessage = i18next.t("battle:mysteryEncounterAppeared");

      if (encounterMessage) {
        doTrainerExclamation();
        ui.showDialogue(encounterMessage, "???", null, async () => {
          await charSprite.hide();
          await globalScene.hideFieldOverlay(250);
          doEncounter();
        });
      } else {
        doEncounter();
      }
    }
  }

  public override async end(): Promise<void> {
    const enemyField = globalScene.getEnemyField();
    const { currentBattle, gameMode, phaseManager } = globalScene;
    const { battleType, double, waveIndex } = currentBattle;
    const { isDaily } = gameMode;

    enemyField.forEach((enemyPokemon, e) => {
      if (enemyPokemon.isShiny(true)) {
        phaseManager.unshiftNew("ShinySparklePhase", BattlerIndex.ENEMY + e);
      }
      // This sets Eternatus' held item to be untransferrable, preventing it from being stolen
      if (
        enemyPokemon.species.speciesId === SpeciesId.ETERNATUS
        && (gameMode.isBattleClassicFinalBoss(waveIndex) || gameMode.isEndlessMajorBoss(waveIndex))
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

    if (![BattleType.TRAINER, BattleType.MYSTERY_ENCOUNTER].includes(battleType)) {
      const ivScannerModifier = globalScene.findModifier(m => m instanceof IvScannerModifier);
      if (ivScannerModifier) {
        enemyField.map(p => phaseManager.pushNew("ScanIvsPhase", p.getBattlerIndex()));
      }
    }

    if (!this.loaded) {
      const availablePartyMembers = globalScene.getPokemonAllowedInBattle();

      if (!availablePartyMembers[0].isOnField()) {
        phaseManager.pushNew("SummonPhase", 0);
      }

      if (double) {
        if (availablePartyMembers.length > 1) {
          phaseManager.pushNew("ToggleDoublePositionPhase", true);
          if (!availablePartyMembers[1].isOnField()) {
            phaseManager.pushNew("SummonPhase", 1);
          }
        }
      } else {
        if (availablePartyMembers.length > 1 && availablePartyMembers[1].isOnField()) {
          phaseManager.pushNew("ReturnPhase", 1);
        }
        phaseManager.pushNew("ToggleDoublePositionPhase", false);
      }

      if (battleType !== BattleType.TRAINER && (waveIndex > 1 || !isDaily)) {
        const minPartySize = double ? 2 : 1;
        if (availablePartyMembers.length > minPartySize) {
          phaseManager.pushNew("CheckSwitchPhase", 0, double);
          if (double) {
            phaseManager.pushNew("CheckSwitchPhase", 1, double);
          }
        }
      }
    }

    phaseManager.pushNew("InitEncounterPhase");
    await handleTutorial(Tutorial.ACCESS_MENU);
    super.end();
  }

  // TODO: https://github.com/Despair-Games/poketernity/pull/28
  protected async tryOverrideForBattleSpec(): Promise<boolean> {
    const { currentBattle, gameData, ui } = globalScene;
    const { battleSpec } = currentBattle;
    const { gameStats, gender } = gameData;
    const { classicSessionsPlayed } = gameStats;

    if (battleSpec === BattleSpec.FINAL_BOSS) {
      const enemy = globalScene.getEnemyPokemon();

      await ui.showTextPromise(this.getEncounterMessage(), 1500, true);

      const localizationKey = "battleSpecDialogue:encounter";
      if (ui.shouldSkipDialogue(localizationKey)) {
        // Logging mirrors logging found in dialogue-ui-handler
        console.log(`Dialogue ${localizationKey} skipped`);
        this.doEncounterCommon(false);
      } else {
        const count = 5643853 + classicSessionsPlayed;
        // The line below checks if an English ordinal is necessary or not based on
        // whether an entry for encounterLocalizationKey exists in the language or not.
        const ordinalUsed =
          !i18next.exists(localizationKey, { fallbackLng: [] }) || i18next.resolvedLanguage === "en"
            ? i18next.t("battleSpecDialogue:key", { count, ordinal: true })
            : "";
        const cycleCountNoOrdinal = count.toLocaleString();
        const cycleCount = cycleCountNoOrdinal + ordinalUsed;
        const context = PlayerGender[gender ?? PlayerGender.UNSET].toLowerCase();
        const encounterDialogue = i18next.t(localizationKey, { context, cycleCount, cycleCountNoOrdinal });
        if (!gameData.getSeenDialogues()[localizationKey]) {
          gameData.saveSeenDialogue(localizationKey);
        }
        ui.showDialogue(encounterDialogue, enemy?.species.name, null, () => {
          this.doEncounterCommon(false);
        });
      }

      return true;
    }

    return false;
  }

  /**
   * Set biome weather if and only if this encounter is the start of a new biome.
   * @remarks
   * By using function overrides, this should happen if and only if this phase
   * is exactly a `NewBiomeEncounterPhase` or an `EncounterPhase` (to account for
   * Wave 1 of a Daily Run), but NOT `NextEncounterPhase` (which starts the next
   * wave in the same biome).
   */
  protected trySetWeatherIfNewBiome(): void {
    globalScene.arena.setBiomeWeather();
  }

  /**
   * Set biome terrain if and only if this encounter is the start of a new biome.
   * @remarks
   * By using function overrides, this should happen if and only if this phase
   * is exactly a `NewBiomeEncounterPhase` or an `EncounterPhase` (to account for
   * Wave 1 of a Daily Run), but NOT `NextEncounterPhase` (which starts the next
   * wave in the same biome).
   */
  protected trySetTerrainIfNewBiome(): void {
    globalScene.arena.setBiomeTerrain();
  }
}
