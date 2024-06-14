import BattleScene, { bypassLogin } from "./battle-scene";
import { default as Pokemon, PlayerPokemon, EnemyPokemon, PokemonMove, MoveResult, DamageResult, FieldPosition, HitResult, TurnMove } from "./field/pokemon";
import * as Utils from "./utils";
import { allMoves, applyMoveAttrs, BypassSleepAttr, ChargeAttr, applyFilteredMoveAttrs, HitsTagAttr, MissEffectAttr, MoveAttr, MoveEffectAttr, MoveFlags, MultiHitAttr, OverrideMoveEffectAttr, VariableAccuracyAttr, MoveTarget, getMoveTargets, MoveTargetSet, MoveEffectTrigger, CopyMoveAttr, AttackMove, SelfStatusMove, PreMoveMessageAttr, HealStatusEffectAttr, IgnoreOpponentStatChangesAttr, NoEffectAttr, BypassRedirectAttr, FixedDamageAttr, PostVictoryStatChangeAttr, OneHitKOAccuracyAttr, ForceSwitchOutAttr, VariableTargetAttr, IncrementMovePriorityAttr  } from "./data/move";
import { Mode } from "./ui/ui";
import { Command } from "./ui/command-ui-handler";
import { Stat } from "./data/pokemon-stat";
import { BerryModifier, ContactHeldItemTransferChanceModifier, EnemyAttackStatusEffectChanceModifier, EnemyPersistentModifier, EnemyStatusEffectHealChanceModifier, EnemyTurnHealModifier, ExpBalanceModifier, ExpBoosterModifier, ExpShareModifier, ExtraModifierModifier, FlinchChanceModifier, HealingBoosterModifier, HitHealModifier, LapsingPersistentModifier, MapModifier, Modifier, MultipleParticipantExpBonusModifier, PersistentModifier, PokemonExpBoosterModifier, PokemonHeldItemModifier, PokemonInstantReviveModifier, SwitchEffectTransferModifier, TempBattleStatBoosterModifier, TurnHealModifier, TurnHeldItemTransferModifier, MoneyMultiplierModifier, MoneyInterestModifier, IvScannerModifier, LapsingPokemonHeldItemModifier, PokemonMultiHitModifier, PokemonMoveAccuracyBoosterModifier, overrideModifiers, overrideHeldItems, BypassSpeedChanceModifier, TurnStatusEffectModifier } from "./modifier/modifier";
import PartyUiHandler, { PartyOption, PartyUiMode } from "./ui/party-ui-handler";
import { doPokeballBounceAnim, getPokeballAtlasKey, getPokeballCatchMultiplier, getPokeballTintColor, PokeballType } from "./data/pokeball";
import { CommonAnim, CommonBattleAnim, MoveAnim, initMoveAnim, loadMoveAnimAssets } from "./data/battle-anims";
import { StatusEffect, getStatusEffectActivationText, getStatusEffectCatchRateMultiplier, getStatusEffectHealText, getStatusEffectObtainText, getStatusEffectOverlapText } from "./data/status-effect";
import { SummaryUiMode } from "./ui/summary-ui-handler";
import EvolutionSceneHandler from "./ui/evolution-scene-handler";
import { EvolutionPhase } from "./evolution-phase";
import { Phase } from "./phase";
import { BattleStat, getBattleStatLevelChangeDescription, getBattleStatName } from "./data/battle-stat";
import { biomeLinks, getBiomeName } from "./data/biomes";
import { ModifierTier } from "./modifier/modifier-tier";
import { FusePokemonModifierType, ModifierPoolType, ModifierType, ModifierTypeFunc, ModifierTypeOption, PokemonModifierType, PokemonMoveModifierType, PokemonPpRestoreModifierType, PokemonPpUpModifierType, RememberMoveModifierType, TmModifierType, getDailyRunStarterModifiers, getEnemyBuffModifierForWave, getModifierType, getPlayerModifierTypeOptions, getPlayerShopModifierTypeOptionsForWave, modifierTypes, regenerateModifierPoolThresholds } from "./modifier/modifier-type";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import { BattlerTagLapseType, EncoreTag, HideSpriteTag as HiddenTag, ProtectedTag, TrappedTag } from "./data/battler-tags";
import { getPokemonMessage, getPokemonNameWithAffix } from "./messages";
import { Starter } from "./ui/starter-select-ui-handler";
import { Gender } from "./data/gender";
import { Weather, WeatherType, getRandomWeatherType, getTerrainBlockMessage, getWeatherDamageMessage, getWeatherLapseMessage } from "./data/weather";
import { TempBattleStat } from "./data/temp-battle-stat";
import { ArenaTagSide, ArenaTrapTag, MistTag, TrickRoomTag } from "./data/arena-tag";
import { CheckTrappedAbAttr, IgnoreOpponentStatChangesAbAttr, IgnoreOpponentEvasionAbAttr, PostAttackAbAttr, PostBattleAbAttr, PostDefendAbAttr, PostSummonAbAttr, PostTurnAbAttr, PostWeatherLapseAbAttr, PreSwitchOutAbAttr, PreWeatherDamageAbAttr, ProtectStatAbAttr, RedirectMoveAbAttr, BlockRedirectAbAttr, RunSuccessAbAttr, StatChangeMultiplierAbAttr, SuppressWeatherEffectAbAttr, SyncEncounterNatureAbAttr, applyAbAttrs, applyCheckTrappedAbAttrs, applyPostAttackAbAttrs, applyPostBattleAbAttrs, applyPostDefendAbAttrs, applyPostSummonAbAttrs, applyPostTurnAbAttrs, applyPostWeatherLapseAbAttrs, applyPreStatChangeAbAttrs, applyPreSwitchOutAbAttrs, applyPreWeatherEffectAbAttrs, BattleStatMultiplierAbAttr, applyBattleStatMultiplierAbAttrs, IncrementMovePriorityAbAttr, applyPostVictoryAbAttrs, PostVictoryAbAttr, BlockNonDirectDamageAbAttr as BlockNonDirectDamageAbAttr, applyPostKnockOutAbAttrs, PostKnockOutAbAttr, PostBiomeChangeAbAttr, applyPostFaintAbAttrs, PostFaintAbAttr, IncreasePpAbAttr, PostStatChangeAbAttr, applyPostStatChangeAbAttrs, AlwaysHitAbAttr, PreventBerryUseAbAttr, StatChangeCopyAbAttr, PokemonTypeChangeAbAttr, applyPreAttackAbAttrs, applyPostMoveUsedAbAttrs, PostMoveUsedAbAttr, MaxMultiHitAbAttr, HealFromBerryUseAbAttr } from "./data/ability";
import { Unlockables, getUnlockableName } from "./system/unlockables";
import { getBiomeKey } from "./field/arena";
import { BattleType, BattlerIndex, TurnCommand } from "./battle";
import { ChallengeAchv, HealAchv, LevelAchv, achvs } from "./system/achv";
import { TrainerSlot, trainerConfigs } from "./data/trainer-config";
import { EggHatchPhase } from "./egg-hatch-phase";
import { Egg } from "./data/egg";
import { vouchers } from "./system/voucher";
import { loggedInUser, updateUserInfo } from "./account";
import { SessionSaveData } from "./system/game-data";
import { addPokeballCaptureStars, addPokeballOpenParticles } from "./field/anims";
import { SpeciesFormChangeActiveTrigger, SpeciesFormChangeManualTrigger, SpeciesFormChangeMoveLearnedTrigger, SpeciesFormChangePostMoveTrigger, SpeciesFormChangePreMoveTrigger } from "./data/pokemon-forms";
import { battleSpecDialogue, getCharVariantFromDialogue, miscDialogue } from "./data/dialogue";
import ModifierSelectUiHandler, { SHOP_OPTIONS_ROW_LIMIT } from "./ui/modifier-select-ui-handler";
import { SettingKeys } from "./system/settings/settings";
import { Tutorial, handleTutorial } from "./tutorial";
import { TerrainType } from "./data/terrain";
import { OptionSelectConfig, OptionSelectItem } from "./ui/abstact-option-select-ui-handler";
import { SaveSlotUiMode } from "./ui/save-slot-select-ui-handler";
import { fetchDailyRunSeed, getDailyRunStarters } from "./data/daily-run";
import { GameMode, GameModes, getGameMode } from "./game-mode";
import PokemonSpecies, { getPokemonSpecies, speciesStarters } from "./data/pokemon-species";
import i18next from "./plugins/i18n";
import * as Overrides from "./overrides";
import { TextStyle, addTextObject } from "./ui/text";
import { Type } from "./data/type";
import { BerryUsedEvent, EncounterPhaseEvent, MoveUsedEvent, TurnEndEvent, TurnInitEvent } from "./events/battle-scene";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleSpec } from "#enums/battle-spec";
import { BattleStyle } from "#enums/battle-style";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Biome } from "#enums/biome";
import { ExpNotification } from "#enums/exp-notification";
import { Moves } from "#enums/moves";
import { PlayerGender } from "#enums/player-gender";
import { Species } from "#enums/species";
import { TrainerType } from "#enums/trainer-type";


export class LoginPhase extends Phase {
  private showText: boolean;

  constructor(scene: BattleScene, showText?: boolean) {
    super(scene);

    this.showText = showText === undefined || !!showText;
  }

  start(): void {
    super.start();

    const hasSession = !!Utils.getCookie(Utils.sessionIdKey);

    this.scene.ui.setMode(Mode.LOADING, { buttonActions: [] });
    Utils.executeIf(bypassLogin || hasSession, updateUserInfo).then(response => {
      const success = response ? response[0] : false;
      const statusCode = response ? response[1] : null;
      if (!success) {
        if (!statusCode || statusCode === 400) {
          if (this.showText) {
            this.scene.ui.showText(i18next.t("menu:logInOrCreateAccount"));
          }

          this.scene.playSound("menu_open");

          const loadData = () => {
            updateUserInfo().then(() => this.scene.gameData.loadSystem().then(() => this.end()));
          };

          this.scene.ui.setMode(Mode.LOGIN_FORM, {
            buttonActions: [
              () => {
                this.scene.ui.playSelect();
                loadData();
              }, () => {
                this.scene.playSound("menu_open");
                this.scene.ui.setMode(Mode.REGISTRATION_FORM, {
                  buttonActions: [
                    () => {
                      this.scene.ui.playSelect();
                      updateUserInfo().then(() => this.end());
                    }, () => {
                      this.scene.unshiftPhase(new LoginPhase(this.scene, false));
                      this.end();
                    }
                  ]
                });
              }
            ]
          });
        } else {
          this.scene.unshiftPhase(new UnavailablePhase(this.scene));
          super.end();
        }
        return null;
      } else {
        this.scene.gameData.loadSystem().then(success => {
          if (success || bypassLogin) {
            this.end();
          } else {
            this.scene.ui.setMode(Mode.MESSAGE);
            this.scene.ui.showText(i18next.t("menu:failedToLoadSaveData"));
          }
        });
      }
    });
  }

  end(): void {
    this.scene.ui.setMode(Mode.MESSAGE);

    if (!this.scene.gameData.gender) {
      this.scene.unshiftPhase(new SelectGenderPhase(this.scene));
    }

    handleTutorial(this.scene, Tutorial.Intro).then(() => super.end());
  }
}

export class TitlePhase extends Phase {
  private loaded: boolean;
  private lastSessionData: SessionSaveData;
  public gameMode: GameModes;

  constructor(scene: BattleScene) {
    super(scene);

    this.loaded = false;
  }

  start(): void {
    super.start();

    this.scene.ui.clearText();
    this.scene.ui.fadeIn(250);

    this.scene.playBgm("title", true);

    this.scene.gameData.getSession(loggedInUser.lastSessionSlot).then(sessionData => {
      if (sessionData) {
        this.lastSessionData = sessionData;
        const biomeKey = getBiomeKey(sessionData.arena.biome);
        const bgTexture = `${biomeKey}_bg`;
        this.scene.arenaBg.setTexture(bgTexture);
      }
      this.showOptions();
    }).catch(err => {
      console.error(err);
      this.showOptions();
    });
  }

  showOptions(): void {
    const options: OptionSelectItem[] = [];
    if (loggedInUser.lastSessionSlot > -1) {
      options.push({
        label: i18next.t("menu:continue"),
        handler: () => {
          this.loadSaveSlot(this.lastSessionData ? -1 : loggedInUser.lastSessionSlot);
          return true;
        }
      });
    }
    options.push({
      label: i18next.t("menu:newGame"),
      handler: () => {
        const setModeAndEnd = (gameMode: GameModes) => {
          this.gameMode = gameMode;
          this.scene.ui.setMode(Mode.MESSAGE);
          this.scene.ui.clearText();
          this.end();
        };
        if (this.scene.gameData.unlocks[Unlockables.ENDLESS_MODE]) {
          const options: OptionSelectItem[] = [
            {
              label: GameMode.getModeName(GameModes.CLASSIC),
              handler: () => {
                setModeAndEnd(GameModes.CLASSIC);
                return true;
              }
            },
            {
              label: GameMode.getModeName(GameModes.CHALLENGE),
              handler: () => {
                setModeAndEnd(GameModes.CHALLENGE);
                return true;
              }
            },
            {
              label: GameMode.getModeName(GameModes.ENDLESS),
              handler: () => {
                setModeAndEnd(GameModes.ENDLESS);
                return true;
              }
            }
          ];
          if (this.scene.gameData.unlocks[Unlockables.SPLICED_ENDLESS_MODE]) {
            options.push({
              label: GameMode.getModeName(GameModes.SPLICED_ENDLESS),
              handler: () => {
                setModeAndEnd(GameModes.SPLICED_ENDLESS);
                return true;
              }
            });
          }
          options.push({
            label: i18next.t("menu:cancel"),
            handler: () => {
              this.scene.clearPhaseQueue();
              this.scene.pushPhase(new TitlePhase(this.scene));
              super.end();
              return true;
            }
          });
          this.scene.ui.showText(i18next.t("menu:selectGameMode"), null, () => this.scene.ui.setOverlayMode(Mode.OPTION_SELECT, { options: options }));
        } else {
          this.gameMode = GameModes.CLASSIC;
          this.scene.ui.setMode(Mode.MESSAGE);
          this.scene.ui.clearText();
          this.end();
        }
        return true;
      }
    },
    {
      label: i18next.t("menu:loadGame"),
      handler: () => {
        this.scene.ui.setOverlayMode(Mode.SAVE_SLOT, SaveSlotUiMode.LOAD,
          (slotId: integer) => {
            if (slotId === -1) {
              return this.showOptions();
            }
            this.loadSaveSlot(slotId);
          });
        return true;
      }
    },
    {
      label: i18next.t("menu:dailyRun"),
      handler: () => {
        this.initDailyRun();
        return true;
      },
      keepOpen: true
    },
    {
      label: i18next.t("menu:settings"),
      handler: () => {
        this.scene.ui.setOverlayMode(Mode.SETTINGS);
        return true;
      },
      keepOpen: true
    });
    const config: OptionSelectConfig = {
      options: options,
      noCancel: true,
      yOffset: 47
    };
    this.scene.ui.setMode(Mode.TITLE, config);
  }

  loadSaveSlot(slotId: integer): void {
    this.scene.sessionSlotId = slotId > -1 ? slotId : loggedInUser.lastSessionSlot;
    this.scene.ui.setMode(Mode.MESSAGE);
    this.scene.gameData.loadSession(this.scene, slotId, slotId === -1 ? this.lastSessionData : null).then((success: boolean) => {
      if (success) {
        this.loaded = true;
        this.scene.ui.showText(i18next.t("menu:sessionSuccess"), null, () => this.end());
      } else {
        this.end();
      }
    }).catch(err => {
      console.error(err);
      this.scene.ui.showText(i18next.t("menu:failedToLoadSession"), null);
    });
  }

  initDailyRun(): void {
    this.scene.ui.setMode(Mode.SAVE_SLOT, SaveSlotUiMode.SAVE, (slotId: integer) => {
      this.scene.clearPhaseQueue();
      if (slotId === -1) {
        this.scene.pushPhase(new TitlePhase(this.scene));
        return super.end();
      }
      this.scene.sessionSlotId = slotId;

      const generateDaily = (seed: string) => {
        this.scene.gameMode = getGameMode(GameModes.DAILY);

        this.scene.setSeed(seed);
        this.scene.resetSeed(1);

        this.scene.money = this.scene.gameMode.getStartingMoney();

        const starters = getDailyRunStarters(this.scene, seed);
        const startingLevel = this.scene.gameMode.getStartingLevel();

        const party = this.scene.getParty();
        const loadPokemonAssets: Promise<void>[] = [];
        for (const starter of starters) {
          const starterProps = this.scene.gameData.getSpeciesDexAttrProps(starter.species, starter.dexAttr);
          const starterFormIndex = Math.min(starterProps.formIndex, Math.max(starter.species.forms.length - 1, 0));
          const starterGender = starter.species.malePercent !== null
            ? !starterProps.female ? Gender.MALE : Gender.FEMALE
            : Gender.GENDERLESS;
          const starterPokemon = this.scene.addPlayerPokemon(starter.species, startingLevel, starter.abilityIndex, starterFormIndex, starterGender, starterProps.shiny, starterProps.variant, undefined, starter.nature);
          starterPokemon.setVisible(false);
          party.push(starterPokemon);
          loadPokemonAssets.push(starterPokemon.loadAssets());
        }

        regenerateModifierPoolThresholds(party, ModifierPoolType.DAILY_STARTER);
        const modifiers: Modifier[] = Array(3).fill(null).map(() => modifierTypes.EXP_SHARE().withIdFromFunc(modifierTypes.EXP_SHARE).newModifier())
          .concat(Array(3).fill(null).map(() => modifierTypes.GOLDEN_EXP_CHARM().withIdFromFunc(modifierTypes.GOLDEN_EXP_CHARM).newModifier()))
          .concat(getDailyRunStarterModifiers(party));

        for (const m of modifiers) {
          this.scene.addModifier(m, true, false, false, true);
        }
        this.scene.updateModifiers(true, true);

        Promise.all(loadPokemonAssets).then(() => {
          this.scene.time.delayedCall(500, () => this.scene.playBgm());
          this.scene.gameData.gameStats.dailyRunSessionsPlayed++;
          this.scene.newArena(this.scene.gameMode.getStartingBiome(this.scene));
          this.scene.newBattle();
          this.scene.arena.init();
          this.scene.sessionPlayTime = 0;
          this.scene.lastSavePlayTime = 0;
          this.end();
        });
      };

      // If Online, calls seed fetch from db to generate daily run. If Offline, generates a daily run based on current date.
      if (!Utils.isLocal) {
        fetchDailyRunSeed().then(seed => {
          generateDaily(seed);
        }).catch(err => {
          console.error("Failed to load daily run:\n", err);
        });
      } else {
        generateDaily(btoa(new Date().toISOString().substring(0, 10)));
      }
    });
  }

  end(): void {
    if (!this.loaded && !this.scene.gameMode.isDaily) {
      this.scene.arena.preloadBgm();
      this.scene.gameMode = getGameMode(this.gameMode);
      if (this.gameMode === GameModes.CHALLENGE) {
        this.scene.pushPhase(new SelectChallengePhase(this.scene));
      } else {
        this.scene.pushPhase(new SelectStarterPhase(this.scene));
      }
      this.scene.newArena(this.scene.gameMode.getStartingBiome(this.scene));
    } else {
      this.scene.playBgm();
    }

    this.scene.pushPhase(new EncounterPhase(this.scene, this.loaded));

    if (this.loaded) {
      const availablePartyMembers = this.scene.getParty().filter(p => p.isAllowedInBattle()).length;

      this.scene.pushPhase(new SummonPhase(this.scene, 0, true, true));
      if (this.scene.currentBattle.double && availablePartyMembers > 1) {
        this.scene.pushPhase(new SummonPhase(this.scene, 1, true, true));
      }

      if (this.scene.currentBattle.battleType !== BattleType.TRAINER && (this.scene.currentBattle.waveIndex > 1 || !this.scene.gameMode.isDaily)) {
        const minPartySize = this.scene.currentBattle.double ? 2 : 1;
        if (availablePartyMembers > minPartySize) {
          this.scene.pushPhase(new CheckSwitchPhase(this.scene, 0, this.scene.currentBattle.double));
          if (this.scene.currentBattle.double) {
            this.scene.pushPhase(new CheckSwitchPhase(this.scene, 1, this.scene.currentBattle.double));
          }
        }
      }
    }

    for (const achv of Object.keys(this.scene.gameData.achvUnlocks)) {
      if (vouchers.hasOwnProperty(achv)) {
        this.scene.validateVoucher(vouchers[achv]);
      }
    }

    super.end();
  }
}

export class UnavailablePhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start(): void {
    this.scene.ui.setMode(Mode.UNAVAILABLE, () => {
      this.scene.unshiftPhase(new LoginPhase(this.scene, true));
      this.end();
    });
  }
}

export class ReloadSessionPhase extends Phase {
  private systemDataStr: string;

  constructor(scene: BattleScene, systemDataStr?: string) {
    super(scene);

    this.systemDataStr = systemDataStr;
  }

  start(): void {
    this.scene.ui.setMode(Mode.SESSION_RELOAD);

    let delayElapsed = false;
    let loaded = false;

    this.scene.time.delayedCall(Utils.fixedInt(1500), () => {
      if (loaded) {
        this.end();
      } else {
        delayElapsed = true;
      }
    });

    this.scene.gameData.clearLocalData();

    (this.systemDataStr ? this.scene.gameData.initSystem(this.systemDataStr) : this.scene.gameData.loadSystem()).then(() => {
      if (delayElapsed) {
        this.end();
      } else {
        loaded = true;
      }
    });
  }
}

export class OutdatedPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start(): void {
    this.scene.ui.setMode(Mode.OUTDATED);
  }
}

export class SelectGenderPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start(): void {
    super.start();

    this.scene.ui.showText(i18next.t("menu:boyOrGirl"), null, () => {
      this.scene.ui.setMode(Mode.OPTION_SELECT, {
        options: [
          {
            label: i18next.t("menu:boy"),
            handler: () => {
              this.scene.gameData.gender = PlayerGender.MALE;
              this.scene.gameData.saveSetting(SettingKeys.Player_Gender, 0);
              this.scene.gameData.saveSystem().then(() => this.end());
              return true;
            }
          },
          {
            label: i18next.t("menu:girl"),
            handler: () => {
              this.scene.gameData.gender = PlayerGender.FEMALE;
              this.scene.gameData.saveSetting(SettingKeys.Player_Gender, 1);
              this.scene.gameData.saveSystem().then(() => this.end());
              return true;
            }
          }
        ]
      });
    });
  }

  end(): void {
    this.scene.ui.setMode(Mode.MESSAGE);
    super.end();
  }
}

export class SelectChallengePhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.playBgm("menu");

    this.scene.ui.setMode(Mode.CHALLENGE_SELECT);
  }
}

export class SelectStarterPhase extends Phase {

  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.playBgm("menu");

    this.scene.ui.setMode(Mode.STARTER_SELECT, (starters: Starter[]) => {
      this.scene.ui.clearText();
      this.scene.ui.setMode(Mode.SAVE_SLOT, SaveSlotUiMode.SAVE, (slotId: integer) => {
        if (slotId === -1) {
          this.scene.clearPhaseQueue();
          this.scene.pushPhase(new TitlePhase(this.scene));
          return this.end();
        }
        this.scene.sessionSlotId = slotId;
        this.initBattle(starters);
      });
    });
  }

  /**
   * Initialize starters before starting the first battle
   * @param starters {@linkcode Pokemon} with which to start the first battle
   */
  initBattle(starters: Starter[]) {
    const party = this.scene.getParty();
    const loadPokemonAssets: Promise<void>[] = [];
    starters.forEach((starter: Starter, i: integer) => {
      if (!i && Overrides.STARTER_SPECIES_OVERRIDE) {
        starter.species = getPokemonSpecies(Overrides.STARTER_SPECIES_OVERRIDE as Species);
      }
      const starterProps = this.scene.gameData.getSpeciesDexAttrProps(starter.species, starter.dexAttr);
      let starterFormIndex = Math.min(starterProps.formIndex, Math.max(starter.species.forms.length - 1, 0));
      if (
        starter.species.speciesId in Overrides.STARTER_FORM_OVERRIDES &&
        starter.species.forms[Overrides.STARTER_FORM_OVERRIDES[starter.species.speciesId]]
      ) {
        starterFormIndex = Overrides.STARTER_FORM_OVERRIDES[starter.species.speciesId];
      }

      let starterGender = starter.species.malePercent !== null
        ? !starterProps.female ? Gender.MALE : Gender.FEMALE
        : Gender.GENDERLESS;
      if (Overrides.GENDER_OVERRIDE !== null) {
        starterGender = Overrides.GENDER_OVERRIDE;
      }
      const starterIvs = this.scene.gameData.dexData[starter.species.speciesId].ivs.slice(0);
      const starterPokemon = this.scene.addPlayerPokemon(starter.species, this.scene.gameMode.getStartingLevel(), starter.abilityIndex, starterFormIndex, starterGender, starterProps.shiny, starterProps.variant, starterIvs, starter.nature);
      starterPokemon.tryPopulateMoveset(starter.moveset);
      if (starter.passive) {
        starterPokemon.passive = true;
      }
      starterPokemon.luck = this.scene.gameData.getDexAttrLuck(this.scene.gameData.dexData[starter.species.speciesId].caughtAttr);
      if (starter.pokerus) {
        starterPokemon.pokerus = true;
      }
      if (this.scene.gameMode.isSplicedOnly) {
        starterPokemon.generateFusionSpecies(true);
      }
      starterPokemon.setVisible(false);
      party.push(starterPokemon);
      loadPokemonAssets.push(starterPokemon.loadAssets());
    });
    overrideModifiers(this.scene);
    overrideHeldItems(this.scene, party[0]);
    Promise.all(loadPokemonAssets).then(() => {
      SoundFade.fadeOut(this.scene, this.scene.sound.get("menu"), 500, true);
      this.scene.time.delayedCall(500, () => this.scene.playBgm());
      if (this.scene.gameMode.isClassic) {
        this.scene.gameData.gameStats.classicSessionsPlayed++;
      } else {
        this.scene.gameData.gameStats.endlessSessionsPlayed++;
      }
      this.scene.newBattle();
      this.scene.arena.init();
      this.scene.sessionPlayTime = 0;
      this.scene.lastSavePlayTime = 0;
      this.end();
    });
  }
}

export class BattlePhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  showEnemyTrainer(trainerSlot: TrainerSlot = TrainerSlot.NONE): void {
    const sprites = this.scene.currentBattle.trainer.getSprites();
    const tintSprites = this.scene.currentBattle.trainer.getTintSprites();
    for (let i = 0; i < sprites.length; i++) {
      const visible = !trainerSlot || !i === (trainerSlot === TrainerSlot.TRAINER) || sprites.length < 2;
      [ sprites[i], tintSprites[i] ].map(sprite => {
        if (visible) {
          sprite.x = trainerSlot || sprites.length < 2 ? 0 : i ? 16 : -16;
        }
        sprite.setVisible(visible);
        sprite.clearTint();
      });
      sprites[i].setVisible(visible);
      tintSprites[i].setVisible(visible);
      sprites[i].clearTint();
      tintSprites[i].clearTint();
    }
    this.scene.tweens.add({
      targets: this.scene.currentBattle.trainer,
      x: "-=16",
      y: "+=16",
      alpha: 1,
      ease: "Sine.easeInOut",
      duration: 750
    });
  }

  hideEnemyTrainer(): void {
    this.scene.tweens.add({
      targets: this.scene.currentBattle.trainer,
      x: "+=16",
      y: "-=16",
      alpha: 0,
      ease: "Sine.easeInOut",
      duration: 750
    });
  }
}

type PokemonFunc = (pokemon: Pokemon) => void;

export abstract class FieldPhase extends BattlePhase {
  getOrder(): BattlerIndex[] {
    const playerField = this.scene.getPlayerField().filter(p => p.isActive()) as Pokemon[];
    const enemyField = this.scene.getEnemyField().filter(p => p.isActive()) as Pokemon[];

    // We shuffle the list before sorting so speed ties produce random results
    let orderedTargets: Pokemon[] = playerField.concat(enemyField);
    // We seed it with the current turn to prevent an inconsistency where it
    // was varying based on how long since you last reloaded
    this.scene.executeWithSeedOffset(() => {
      orderedTargets = Utils.randSeedShuffle(orderedTargets);
    }, this.scene.currentBattle.turn, this.scene.waveSeed);

    orderedTargets.sort((a: Pokemon, b: Pokemon) => {
      const aSpeed = a?.getBattleStat(Stat.SPD) || 0;
      const bSpeed = b?.getBattleStat(Stat.SPD) || 0;

      return bSpeed - aSpeed;
    });

    const speedReversed = new Utils.BooleanHolder(false);
    this.scene.arena.applyTags(TrickRoomTag, speedReversed);

    if (speedReversed.value) {
      orderedTargets = orderedTargets.reverse();
    }

    return orderedTargets.map(t => t.getFieldIndex() + (!t.isPlayer() ? BattlerIndex.ENEMY : 0));
  }

  executeForAll(func: PokemonFunc): void {
    const field = this.scene.getField(true).filter(p => p.summonData);
    field.forEach(pokemon => func(pokemon));
  }
}

export abstract class PokemonPhase extends FieldPhase {
  protected battlerIndex: BattlerIndex | integer;
  public player: boolean;
  public fieldIndex: integer;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex | integer) {
    super(scene);

    if (battlerIndex === undefined) {
      battlerIndex = scene.getField().find(p => p?.isActive()).getBattlerIndex();
    }

    this.battlerIndex = battlerIndex;
    this.player = battlerIndex < 2;
    this.fieldIndex = battlerIndex % 2;
  }

  getPokemon() {
    if (this.battlerIndex > BattlerIndex.ENEMY_2) {
      return this.scene.getPokemonById(this.battlerIndex);
    }
    return this.scene.getField()[this.battlerIndex];
  }
}

export abstract class PartyMemberPokemonPhase extends FieldPhase {
  protected partyMemberIndex: integer;
  protected fieldIndex: integer;
  protected player: boolean;

  constructor(scene: BattleScene, partyMemberIndex: integer, player: boolean) {
    super(scene);

    this.partyMemberIndex = partyMemberIndex;
    this.fieldIndex = partyMemberIndex < this.scene.currentBattle.getBattlerCount()
      ? partyMemberIndex
      : -1;
    this.player = player;
  }

  getParty(): Pokemon[] {
    return this.player ? this.scene.getParty() : this.scene.getEnemyParty();
  }

  getPokemon(): Pokemon {
    return this.getParty()[this.partyMemberIndex];
  }
}

export abstract class PlayerPartyMemberPokemonPhase extends PartyMemberPokemonPhase {
  constructor(scene: BattleScene, partyMemberIndex: integer) {
    super(scene, partyMemberIndex, true);
  }

  getPlayerPokemon(): PlayerPokemon {
    return super.getPokemon() as PlayerPokemon;
  }
}

export abstract class EnemyPartyMemberPokemonPhase extends PartyMemberPokemonPhase {
  constructor(scene: BattleScene, partyMemberIndex: integer) {
    super(scene, partyMemberIndex, false);
  }

  getEnemyPokemon(): EnemyPokemon {
    return super.getPokemon() as EnemyPokemon;
  }
}

export class EncounterPhase extends BattlePhase {
  private loaded: boolean;

  constructor(scene: BattleScene, loaded?: boolean) {
    super(scene);

    this.loaded = !!loaded;
  }

  start() {
    super.start();

    this.scene.updateGameInfo();

    this.scene.initSession();

    this.scene.eventTarget.dispatchEvent(new EncounterPhaseEvent());

    // Failsafe if players somehow skip floor 200 in classic mode
    if (this.scene.gameMode.isClassic && this.scene.currentBattle.waveIndex > 200) {
      this.scene.unshiftPhase(new GameOverPhase(this.scene));
    }

    const loadEnemyAssets = [];

    const battle = this.scene.currentBattle;

    let totalBst = 0;

    battle.enemyLevels.forEach((level, e) => {
      if (!this.loaded) {
        if (battle.battleType === BattleType.TRAINER) {
          battle.enemyParty[e] = battle.trainer.genPartyMember(e);
        } else {
          const enemySpecies = this.scene.randomSpecies(battle.waveIndex, level, true);
          battle.enemyParty[e] = this.scene.addEnemyPokemon(enemySpecies, level, TrainerSlot.NONE, !!this.scene.getEncounterBossSegments(battle.waveIndex, level, enemySpecies));
          if (this.scene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
            battle.enemyParty[e].ivs = new Array(6).fill(31);
          }
          this.scene.getParty().slice(0, !battle.double ? 1 : 2).reverse().forEach(playerPokemon => {
            applyAbAttrs(SyncEncounterNatureAbAttr, playerPokemon, null, battle.enemyParty[e]);
          });
        }
      }
      const enemyPokemon = this.scene.getEnemyParty()[e];
      if (e < (battle.double ? 2 : 1)) {
        enemyPokemon.setX(-66 + enemyPokemon.getFieldPositionOffset()[0]);
        enemyPokemon.resetSummonData();
      }

      if (!this.loaded) {
        this.scene.gameData.setPokemonSeen(enemyPokemon, true, battle.battleType === BattleType.TRAINER);
      }

      if (enemyPokemon.species.speciesId === Species.ETERNATUS) {
        if (this.scene.gameMode.isClassic && (battle.battleSpec === BattleSpec.FINAL_BOSS || this.scene.gameMode.isWaveFinal(battle.waveIndex))) {
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

      console.log(enemyPokemon.name, enemyPokemon.species.speciesId, enemyPokemon.stats);
    });

    if (this.scene.getParty().filter(p => p.isShiny()).length === 6) {
      this.scene.validateAchv(achvs.SHINY_PARTY);
    }

    if (battle.battleType === BattleType.TRAINER) {
      loadEnemyAssets.push(battle.trainer.loadAssets().then(() => battle.trainer.initSprite()));
    } else {
      if (battle.enemyParty.filter(p => p.isBoss()).length > 1) {
        for (const enemyPokemon of battle.enemyParty) {
          if (enemyPokemon.isBoss()) {
            enemyPokemon.setBoss(true, Math.ceil(enemyPokemon.bossSegments * (enemyPokemon.getSpeciesForm().baseTotal / totalBst)));
            enemyPokemon.initBattleInfo();
          }
        }
      }
    }

    Promise.all(loadEnemyAssets).then(() => {
      battle.enemyParty.forEach((enemyPokemon, e) => {
        if (e < (battle.double ? 2 : 1)) {
          if (battle.battleType === BattleType.WILD) {
            this.scene.field.add(enemyPokemon);
            battle.seenEnemyPartyMemberIds.add(enemyPokemon.id);
            const playerPokemon = this.scene.getPlayerPokemon();
            if (playerPokemon?.visible) {
              this.scene.field.moveBelow(enemyPokemon as Pokemon, playerPokemon);
            }
            enemyPokemon.tint(0, 0.5);
          } else if (battle.battleType === BattleType.TRAINER) {
            enemyPokemon.setVisible(false);
            this.scene.currentBattle.trainer.tint(0, 0.5);
          }
          if (battle.double) {
            enemyPokemon.setFieldPosition(e ? FieldPosition.RIGHT : FieldPosition.LEFT);
          }
        }
      });

      if (!this.loaded) {
        regenerateModifierPoolThresholds(this.scene.getEnemyField(), battle.battleType === BattleType.TRAINER ? ModifierPoolType.TRAINER : ModifierPoolType.WILD);
        this.scene.generateEnemyModifiers();
      }

      this.scene.ui.setMode(Mode.MESSAGE).then(() => {
        if (!this.loaded) {
          this.scene.gameData.saveAll(this.scene, true, battle.waveIndex % 10 === 1 || this.scene.lastSavePlayTime >= 300).then(success => {
            this.scene.disableMenu = false;
            if (!success) {
              return this.scene.reset(true);
            }
            this.doEncounter();
          });
        } else {
          this.doEncounter();
        }
      });
    });
  }

  doEncounter() {
    this.scene.playBgm(undefined, true);
    this.scene.updateModifiers(false);
    this.scene.setFieldScale(1);

    /*if (startingWave > 10) {
      for (let m = 0; m < Math.min(Math.floor(startingWave / 10), 99); m++)
        this.scene.addModifier(getPlayerModifierTypeOptionsForWave((m + 1) * 10, 1, this.scene.getParty())[0].type.newModifier(), true);
      this.scene.updateModifiers(true);
    }*/

    for (const pokemon of this.scene.getParty()) {
      if (pokemon) {
        pokemon.resetBattleData();
      }
    }

    if (!this.loaded) {
      this.scene.arena.trySetWeather(getRandomWeatherType(this.scene.arena), false);
    }

    const enemyField = this.scene.getEnemyField();
    this.scene.tweens.add({
      targets: [ this.scene.arenaEnemy, this.scene.currentBattle.trainer, enemyField, this.scene.arenaPlayer, this.scene.trainer ].flat(),
      x: (_target, _key, value, fieldIndex: integer) => fieldIndex < 2 + (enemyField.length) ? value + 300 : value - 300,
      duration: 2000,
      onComplete: () => {
        if (!this.tryOverrideForBattleSpec()) {
          this.doEncounterCommon();
        }
      }
    });
  }

  getEncounterMessage(): string {
    const enemyField = this.scene.getEnemyField();

    if (this.scene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
      return i18next.t("battle:bossAppeared", {bossName: enemyField[0].name});
    }

    if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
      if (this.scene.currentBattle.double) {
        return i18next.t("battle:trainerAppearedDouble", {trainerName: this.scene.currentBattle.trainer.getName(TrainerSlot.NONE, true)});

      } else {
        return i18next.t("battle:trainerAppeared", {trainerName: this.scene.currentBattle.trainer.getName(TrainerSlot.NONE, true)});
      }
    }

    return enemyField.length === 1
      ? i18next.t("battle:singleWildAppeared", {pokemonName: enemyField[0].name})
      : i18next.t("battle:multiWildAppeared", {pokemonName1: enemyField[0].name, pokemonName2: enemyField[1].name});
  }

  doEncounterCommon(showEncounterMessage: boolean = true) {
    const enemyField = this.scene.getEnemyField();

    if (this.scene.currentBattle.battleType === BattleType.WILD) {
      enemyField.forEach(enemyPokemon => {
        enemyPokemon.untint(100, "Sine.easeOut");
        enemyPokemon.cry();
        enemyPokemon.showInfo();
        if (enemyPokemon.isShiny()) {
          this.scene.validateAchv(achvs.SEE_SHINY);
        }
      });
      this.scene.updateFieldScale();
      if (showEncounterMessage) {
        this.scene.ui.showText(this.getEncounterMessage(), null, () => this.end(), 1500);
      } else {
        this.end();
      }
    } else if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
      const trainer = this.scene.currentBattle.trainer;
      trainer.untint(100, "Sine.easeOut");
      trainer.playAnim();

      const doSummon = () => {
        this.scene.currentBattle.started = true;
        this.scene.playBgm(undefined);
        this.scene.pbTray.showPbTray(this.scene.getParty());
			  this.scene.pbTrayEnemy.showPbTray(this.scene.getEnemyParty());
        const doTrainerSummon = () => {
          this.hideEnemyTrainer();
          const availablePartyMembers = this.scene.getEnemyParty().filter(p => !p.isFainted()).length;
          this.scene.unshiftPhase(new SummonPhase(this.scene, 0, false));
          if (this.scene.currentBattle.double && availablePartyMembers > 1) {
            this.scene.unshiftPhase(new SummonPhase(this.scene, 1, false));
          }
          this.end();
        };
        if (showEncounterMessage) {
          this.scene.ui.showText(this.getEncounterMessage(), null, doTrainerSummon, 1500, true);
        } else {
          doTrainerSummon();
        }
      };

      const encounterMessages = this.scene.currentBattle.trainer.getEncounterMessages();

      if (!encounterMessages?.length) {
        doSummon();
      } else {
        let message: string;
        this.scene.executeWithSeedOffset(() => message = Utils.randSeedItem(encounterMessages), this.scene.currentBattle.waveIndex);

        const showDialogueAndSummon = () => {
          this.scene.ui.showDialogue(message, trainer.getName(TrainerSlot.NONE,true), null, () => {
            this.scene.charSprite.hide().then(() => this.scene.hideFieldOverlay(250).then(() => doSummon()));
          });
        };
        if (this.scene.currentBattle.trainer.config.hasCharSprite && !this.scene.ui.shouldSkipDialogue(message)) {
          this.scene.showFieldOverlay(500).then(() => this.scene.charSprite.showCharacter(trainer.getKey(), getCharVariantFromDialogue(encounterMessages[0])).then(() => showDialogueAndSummon()));
        } else {
          showDialogueAndSummon();
        }
      }
    }
  }

  end() {
    const enemyField = this.scene.getEnemyField();

    enemyField.forEach((enemyPokemon, e) => {
      if (enemyPokemon.isShiny()) {
        this.scene.unshiftPhase(new ShinySparklePhase(this.scene, BattlerIndex.ENEMY + e));
      }
    });

    if (this.scene.currentBattle.battleType !== BattleType.TRAINER) {
      enemyField.map(p => this.scene.pushConditionalPhase(new PostSummonPhase(this.scene, p.getBattlerIndex()), () => {
        // if there is not a player party, we can't continue
        if (!this.scene.getParty()?.length) {
          return false;
        }
        // how many player pokemon are on the field ?
        const pokemonsOnFieldCount = this.scene.getParty().filter(p => p.isOnField()).length;
        // if it's a 2vs1, there will never be a 2nd pokemon on our field even
        const requiredPokemonsOnField  = Math.min(this.scene.getParty().filter((p) => !p.isFainted()).length, 2);
        // if it's a double, there should be 2, otherwise 1
        if (this.scene.currentBattle.double) {
          return pokemonsOnFieldCount === requiredPokemonsOnField;
        }
        return pokemonsOnFieldCount === 1;
      }));
      const ivScannerModifier = this.scene.findModifier(m => m instanceof IvScannerModifier);
      if (ivScannerModifier) {
        enemyField.map(p => this.scene.pushPhase(new ScanIvsPhase(this.scene, p.getBattlerIndex(), Math.min(ivScannerModifier.getStackCount() * 2, 6))));
      }
    }

    if (!this.loaded) {
      const availablePartyMembers = this.scene.getParty().filter(p => p.isAllowedInBattle());

      if (!availablePartyMembers[0].isOnField()) {
        this.scene.pushPhase(new SummonPhase(this.scene, 0));
      }

      if (this.scene.currentBattle.double) {
        if (availablePartyMembers.length > 1) {
          this.scene.pushPhase(new ToggleDoublePositionPhase(this.scene, true));
          if (!availablePartyMembers[1].isOnField()) {
            this.scene.pushPhase(new SummonPhase(this.scene, 1));
          }
        }
      } else {
        if (availablePartyMembers.length > 1 && availablePartyMembers[1].isOnField()) {
          this.scene.pushPhase(new ReturnPhase(this.scene, 1));
        }
        this.scene.pushPhase(new ToggleDoublePositionPhase(this.scene, false));
      }

      if (this.scene.currentBattle.battleType !== BattleType.TRAINER && (this.scene.currentBattle.waveIndex > 1 || !this.scene.gameMode.isDaily)) {
        const minPartySize = this.scene.currentBattle.double ? 2 : 1;
        if (availablePartyMembers.length > minPartySize) {
          this.scene.pushPhase(new CheckSwitchPhase(this.scene, 0, this.scene.currentBattle.double));
          if (this.scene.currentBattle.double) {
            this.scene.pushPhase(new CheckSwitchPhase(this.scene, 1, this.scene.currentBattle.double));
          }
        }
      }
    }
    handleTutorial(this.scene, Tutorial.Access_Menu).then(() => super.end());
  }

  tryOverrideForBattleSpec(): boolean {
    switch (this.scene.currentBattle.battleSpec) {
    case BattleSpec.FINAL_BOSS:
      const enemy = this.scene.getEnemyPokemon();
      this.scene.ui.showText(this.getEncounterMessage(), null, () => {
        this.scene.ui.showDialogue(battleSpecDialogue[BattleSpec.FINAL_BOSS].encounter, enemy.species.name, null, () => {
          this.doEncounterCommon(false);
        });
      }, 1500, true);
      return true;
    }

    return false;
  }
}

export class NextEncounterPhase extends EncounterPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();
  }

  doEncounter(): void {
    this.scene.playBgm(undefined, true);

    for (const pokemon of this.scene.getParty()) {
      if (pokemon) {
        pokemon.resetBattleData();
      }
    }

    this.scene.arenaNextEnemy.setBiome(this.scene.arena.biomeType);
    this.scene.arenaNextEnemy.setVisible(true);

    const enemyField = this.scene.getEnemyField();
    this.scene.tweens.add({
      targets: [ this.scene.arenaEnemy, this.scene.arenaNextEnemy, this.scene.currentBattle.trainer, enemyField, this.scene.lastEnemyTrainer ].flat(),
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        this.scene.arenaEnemy.setBiome(this.scene.arena.biomeType);
        this.scene.arenaEnemy.setX(this.scene.arenaNextEnemy.x);
        this.scene.arenaEnemy.setAlpha(1);
        this.scene.arenaNextEnemy.setX(this.scene.arenaNextEnemy.x - 300);
        this.scene.arenaNextEnemy.setVisible(false);
        if (this.scene.lastEnemyTrainer) {
          this.scene.lastEnemyTrainer.destroy();
        }

        if (!this.tryOverrideForBattleSpec()) {
          this.doEncounterCommon();
        }
      }
    });
  }
}

export class NewBiomeEncounterPhase extends NextEncounterPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  doEncounter(): void {
    this.scene.playBgm(undefined, true);

    for (const pokemon of this.scene.getParty()) {
      if (pokemon) {
        pokemon.resetBattleData();
      }
    }

    this.scene.arena.trySetWeather(getRandomWeatherType(this.scene.arena), false);

    for (const pokemon of this.scene.getParty().filter(p => p.isOnField())) {
      applyAbAttrs(PostBiomeChangeAbAttr, pokemon, null);
    }

    const enemyField = this.scene.getEnemyField();
    this.scene.tweens.add({
      targets: [ this.scene.arenaEnemy, enemyField ].flat(),
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        if (!this.tryOverrideForBattleSpec()) {
          this.doEncounterCommon();
        }
      }
    });
  }
}

export class PostSummonPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();

    if (pokemon.status?.effect === StatusEffect.TOXIC) {
      pokemon.status.turnCount = 0;
    }
    this.scene.arena.applyTags(ArenaTrapTag, pokemon);
    applyPostSummonAbAttrs(PostSummonAbAttr, pokemon).then(() => this.end());
  }
}

export class SelectBiomePhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    const currentBiome = this.scene.arena.biomeType;

    const setNextBiome = (nextBiome: Biome) => {
      if (this.scene.currentBattle.waveIndex % 10 === 1) {
        this.scene.applyModifiers(MoneyInterestModifier, true, this.scene);
        this.scene.unshiftPhase(new PartyHealPhase(this.scene, false));
      }
      this.scene.unshiftPhase(new SwitchBiomePhase(this.scene, nextBiome));
      this.end();
    };

    if ((this.scene.gameMode.isClassic && this.scene.gameMode.isWaveFinal(this.scene.currentBattle.waveIndex + 9))
      || (this.scene.gameMode.isDaily && this.scene.gameMode.isWaveFinal(this.scene.currentBattle.waveIndex))
      || (this.scene.gameMode.hasShortBiomes && !(this.scene.currentBattle.waveIndex % 50))) {
      setNextBiome(Biome.END);
    } else if (this.scene.gameMode.hasRandomBiomes) {
      setNextBiome(this.generateNextBiome());
    } else if (Array.isArray(biomeLinks[currentBiome])) {
      let biomes: Biome[];
      this.scene.executeWithSeedOffset(() => {
        biomes = (biomeLinks[currentBiome] as (Biome | [Biome, integer])[])
          .filter(b => !Array.isArray(b) || !Utils.randSeedInt(b[1]))
          .map(b => !Array.isArray(b) ? b : b[0]);
      }, this.scene.currentBattle.waveIndex);
      if (biomes.length > 1 && this.scene.findModifier(m => m instanceof MapModifier)) {
        let biomeChoices: Biome[];
        this.scene.executeWithSeedOffset(() => {
          biomeChoices = (!Array.isArray(biomeLinks[currentBiome])
            ? [ biomeLinks[currentBiome] as Biome ]
            : biomeLinks[currentBiome] as (Biome | [Biome, integer])[])
            .filter((b, i) => !Array.isArray(b) || !Utils.randSeedInt(b[1]))
            .map(b => Array.isArray(b) ? b[0] : b);
        }, this.scene.currentBattle.waveIndex);
        const biomeSelectItems = biomeChoices.map(b => {
          const ret: OptionSelectItem = {
            label: getBiomeName(b),
            handler: () => {
              this.scene.ui.setMode(Mode.MESSAGE);
              setNextBiome(b);
              return true;
            }
          };
          return ret;
        });
        this.scene.ui.setMode(Mode.OPTION_SELECT, {
          options: biomeSelectItems,
          delay: 1000
        });
      } else {
        setNextBiome(biomes[Utils.randSeedInt(biomes.length)]);
      }
    } else if (biomeLinks.hasOwnProperty(currentBiome)) {
      setNextBiome(biomeLinks[currentBiome] as Biome);
    } else {
      setNextBiome(this.generateNextBiome());
    }
  }

  generateNextBiome(): Biome {
    if (!(this.scene.currentBattle.waveIndex % 50)) {
      return Biome.END;
    }
    return this.scene.generateRandomBiome(this.scene.currentBattle.waveIndex);
  }
}

export class SwitchBiomePhase extends BattlePhase {
  private nextBiome: Biome;

  constructor(scene: BattleScene, nextBiome: Biome) {
    super(scene);

    this.nextBiome = nextBiome;
  }

  start() {
    super.start();

    if (this.nextBiome === undefined) {
      return this.end();
    }

    this.scene.tweens.add({
      targets: [ this.scene.arenaEnemy, this.scene.lastEnemyTrainer ],
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        this.scene.arenaEnemy.setX(this.scene.arenaEnemy.x - 600);

        this.scene.newArena(this.nextBiome);

        const biomeKey = getBiomeKey(this.nextBiome);
        const bgTexture = `${biomeKey}_bg`;
        this.scene.arenaBgTransition.setTexture(bgTexture);
        this.scene.arenaBgTransition.setAlpha(0);
        this.scene.arenaBgTransition.setVisible(true);
        this.scene.arenaPlayerTransition.setBiome(this.nextBiome);
        this.scene.arenaPlayerTransition.setAlpha(0);
        this.scene.arenaPlayerTransition.setVisible(true);

        this.scene.tweens.add({
          targets: [ this.scene.arenaPlayer, this.scene.arenaBgTransition, this.scene.arenaPlayerTransition ],
          duration: 1000,
          delay: 1000,
          ease: "Sine.easeInOut",
          alpha: (target: any) => target === this.scene.arenaPlayer ? 0 : 1,
          onComplete: () => {
            this.scene.arenaBg.setTexture(bgTexture);
            this.scene.arenaPlayer.setBiome(this.nextBiome);
            this.scene.arenaPlayer.setAlpha(1);
            this.scene.arenaEnemy.setBiome(this.nextBiome);
            this.scene.arenaEnemy.setAlpha(1);
            this.scene.arenaNextEnemy.setBiome(this.nextBiome);
            this.scene.arenaBgTransition.setVisible(false);
            this.scene.arenaPlayerTransition.setVisible(false);
            if (this.scene.lastEnemyTrainer) {
              this.scene.lastEnemyTrainer.destroy();
            }

            this.end();
          }
        });
      }
    });
  }
}

export class SummonPhase extends PartyMemberPokemonPhase {
  private loaded: boolean;

  constructor(scene: BattleScene, fieldIndex: integer, player: boolean = true, loaded: boolean = false) {
    super(scene, fieldIndex, player);

    this.loaded = loaded;
  }

  start() {
    super.start();

    this.preSummon();
  }

  /**
  * Sends out a Pokemon before the battle begins and shows the appropriate messages
  */
  preSummon(): void {
    const partyMember = this.getPokemon();
    // If the Pokemon about to be sent out is fainted or illegal under a challenge, switch to the first non-fainted legal Pokemon
    if (!partyMember.isAllowedInBattle()) {
      console.warn("The Pokemon about to be sent out is fainted or illegal under a challenge. Attempting to resolve...");

      // First check if they're somehow still in play, if so remove them.
      if (partyMember.isOnField()) {
        partyMember.hideInfo();
        partyMember.setVisible(false);
        this.scene.field.remove(partyMember);
        this.scene.triggerPokemonFormChange(partyMember, SpeciesFormChangeActiveTrigger, true);
      }

      const party = this.getParty();

      // Find the first non-fainted Pokemon index above the current one
      const legalIndex = party.findIndex((p, i) => i > this.partyMemberIndex && p.isAllowedInBattle());
      if (legalIndex === -1) {
        console.error("Party Details:\n", party);
        console.error("All available Pokemon were fainted or illegal!");
        this.scene.clearPhaseQueue();
        this.scene.unshiftPhase(new GameOverPhase(this.scene));
        this.end();
        return;
      }

      // Swaps the fainted Pokemon and the first non-fainted legal Pokemon in the party
      [party[this.partyMemberIndex], party[legalIndex]] = [party[legalIndex], party[this.partyMemberIndex]];
      console.warn("Swapped %s %O with %s %O", partyMember?.name, partyMember, party[0]?.name, party[0]);
    }

    if (this.player) {
      this.scene.ui.showText(i18next.t("battle:playerGo", { pokemonName: this.getPokemon().name }));
      if (this.player) {
        this.scene.pbTray.hide();
      }
      this.scene.trainer.setTexture(`trainer_${this.scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back_pb`);
      this.scene.time.delayedCall(562, () => {
        this.scene.trainer.setFrame("2");
        this.scene.time.delayedCall(64, () => {
          this.scene.trainer.setFrame("3");
        });
      });
      this.scene.tweens.add({
        targets: this.scene.trainer,
        x: -36,
        duration: 1000,
        onComplete: () => this.scene.trainer.setVisible(false)
      });
      this.scene.time.delayedCall(750, () => this.summon());
    } else {
      const trainerName = this.scene.currentBattle.trainer.getName(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER);
      const pokemonName = this.getPokemon().name;
      const message = i18next.t("battle:trainerSendOut", { trainerName, pokemonName });

      this.scene.pbTrayEnemy.hide();
      this.scene.ui.showText(message, null, () => this.summon());
    }
  }

  summon(): void {
    const pokemon = this.getPokemon();

    const pokeball = this.scene.addFieldSprite(this.player ? 36 : 248, this.player ? 80 : 44, "pb", getPokeballAtlasKey(pokemon.pokeball));
    pokeball.setVisible(false);
    pokeball.setOrigin(0.5, 0.625);
    this.scene.field.add(pokeball);

    if (this.fieldIndex === 1) {
      pokemon.setFieldPosition(FieldPosition.RIGHT, 0);
    } else {
      const availablePartyMembers = this.getParty().filter(p => p.isAllowedInBattle()).length;
      pokemon.setFieldPosition(!this.scene.currentBattle.double || availablePartyMembers === 1 ? FieldPosition.CENTER : FieldPosition.LEFT);
    }

    const fpOffset = pokemon.getFieldPositionOffset();

    pokeball.setVisible(true);

    this.scene.tweens.add({
      targets: pokeball,
      duration: 650,
      x: (this.player ? 100 : 236) + fpOffset[0]
    });

    this.scene.tweens.add({
      targets: pokeball,
      duration: 150,
      ease: "Cubic.easeOut",
      y: (this.player ? 70 : 34) + fpOffset[1],
      onComplete: () => {
        this.scene.tweens.add({
          targets: pokeball,
          duration: 500,
          ease: "Cubic.easeIn",
          angle: 1440,
          y: (this.player ? 132 : 86) + fpOffset[1],
          onComplete: () => {
            this.scene.playSound("pb_rel");
            pokeball.destroy();
            this.scene.add.existing(pokemon);
            this.scene.field.add(pokemon);
            if (!this.player) {
              const playerPokemon = this.scene.getPlayerPokemon() as Pokemon;
              if (playerPokemon?.visible) {
                this.scene.field.moveBelow(pokemon, playerPokemon);
              }
              this.scene.currentBattle.seenEnemyPartyMemberIds.add(pokemon.id);
            }
            addPokeballOpenParticles(this.scene, pokemon.x, pokemon.y - 16, pokemon.pokeball);
            this.scene.updateModifiers(this.player);
            this.scene.updateFieldScale();
            pokemon.showInfo();
            pokemon.playAnim();
            pokemon.setVisible(true);
            pokemon.getSprite().setVisible(true);
            pokemon.setScale(0.5);
            pokemon.tint(getPokeballTintColor(pokemon.pokeball));
            pokemon.untint(250, "Sine.easeIn");
            this.scene.updateFieldScale();
            this.scene.tweens.add({
              targets: pokemon,
              duration: 250,
              ease: "Sine.easeIn",
              scale: pokemon.getSpriteScale(),
              onComplete: () => {
                pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
                pokemon.getSprite().clearTint();
                pokemon.resetSummonData();
                this.scene.time.delayedCall(1000, () => this.end());
              }
            });
          }
        });
      }
    });
  }

  onEnd(): void {
    const pokemon = this.getPokemon();

    if (pokemon.isShiny()) {
      this.scene.unshiftPhase(new ShinySparklePhase(this.scene, pokemon.getBattlerIndex()));
    }

    pokemon.resetTurnData();

    if (!this.loaded || this.scene.currentBattle.battleType === BattleType.TRAINER || (this.scene.currentBattle.waveIndex % 10) === 1) {
      this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
      this.queuePostSummon();
    }
  }

  queuePostSummon(): void {
    this.scene.pushPhase(new PostSummonPhase(this.scene, this.getPokemon().getBattlerIndex()));
  }

  end() {
    this.onEnd();

    super.end();
  }
}

export class SwitchSummonPhase extends SummonPhase {
  private slotIndex: integer;
  private doReturn: boolean;
  private batonPass: boolean;

  private lastPokemon: Pokemon;

  constructor(scene: BattleScene, fieldIndex: integer, slotIndex: integer, doReturn: boolean, batonPass: boolean, player?: boolean) {
    super(scene, fieldIndex, player !== undefined ? player : true);

    this.slotIndex = slotIndex;
    this.doReturn = doReturn;
    this.batonPass = batonPass;
  }

  start(): void {
    super.start();
  }

  preSummon(): void {
    if (!this.player) {
      if (this.slotIndex === -1) {
        this.slotIndex = this.scene.currentBattle.trainer.getNextSummonIndex(!this.fieldIndex ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER);
      }
      if (this.slotIndex > -1) {
        this.showEnemyTrainer(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER);
        this.scene.pbTrayEnemy.showPbTray(this.scene.getEnemyParty());
      }
    }

    if (!this.doReturn || (this.slotIndex !== -1 && !(this.player ? this.scene.getParty() : this.scene.getEnemyParty())[this.slotIndex])) {
      if (this.player) {
        return this.switchAndSummon();
      } else {
        this.scene.time.delayedCall(750, () => this.switchAndSummon());
        return;
      }
    }

    const pokemon = this.getPokemon();

    if (!this.batonPass) {
      (this.player ? this.scene.getEnemyField() : this.scene.getPlayerField()).forEach(enemyPokemon => enemyPokemon.removeTagsBySourceId(pokemon.id));
    }

    this.scene.ui.showText(this.player ?
      i18next.t("battle:playerComeBack", { pokemonName: pokemon.name }) :
      i18next.t("battle:trainerComeBack", {
        trainerName: this.scene.currentBattle.trainer.getName(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER),
        pokemonName: pokemon.name
      })
    );
    this.scene.playSound("pb_rel");
    pokemon.hideInfo();
    pokemon.tint(getPokeballTintColor(pokemon.pokeball), 1, 250, "Sine.easeIn");
    this.scene.tweens.add({
      targets: pokemon,
      duration: 250,
      ease: "Sine.easeIn",
      scale: 0.5,
      onComplete: () => {
        pokemon.setVisible(false);
        this.scene.field.remove(pokemon);
        this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
        this.scene.time.delayedCall(750, () => this.switchAndSummon());
      }
    });
  }

  switchAndSummon() {
    const party = this.player ? this.getParty() : this.scene.getEnemyParty();
    const switchedPokemon = party[this.slotIndex];
    this.lastPokemon = this.getPokemon();
    applyPreSwitchOutAbAttrs(PreSwitchOutAbAttr, this.lastPokemon);
    if (this.batonPass && switchedPokemon) {
      (this.player ? this.scene.getEnemyField() : this.scene.getPlayerField()).forEach(enemyPokemon => enemyPokemon.transferTagsBySourceId(this.lastPokemon.id, switchedPokemon.id));
      if (!this.scene.findModifier(m => m instanceof SwitchEffectTransferModifier && (m as SwitchEffectTransferModifier).pokemonId === switchedPokemon.id)) {
        const batonPassModifier = this.scene.findModifier(m => m instanceof SwitchEffectTransferModifier
          && (m as SwitchEffectTransferModifier).pokemonId === this.lastPokemon.id) as SwitchEffectTransferModifier;
        if (batonPassModifier && !this.scene.findModifier(m => m instanceof SwitchEffectTransferModifier && (m as SwitchEffectTransferModifier).pokemonId === switchedPokemon.id)) {
          this.scene.tryTransferHeldItemModifier(batonPassModifier, switchedPokemon, false);
        }
      }
    }
    if (switchedPokemon) {
      party[this.slotIndex] = this.lastPokemon;
      party[this.fieldIndex] = switchedPokemon;
      const showTextAndSummon = () => {
        this.scene.ui.showText(this.player ?
          i18next.t("battle:playerGo", { pokemonName: switchedPokemon.name }) :
          i18next.t("battle:trainerGo", {
            trainerName: this.scene.currentBattle.trainer.getName(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER),
            pokemonName: this.getPokemon().name
          })
        );
        this.summon();
      };
      if (this.player) {
        showTextAndSummon();
      } else {
        this.scene.time.delayedCall(1500, () => {
          this.hideEnemyTrainer();
          this.scene.pbTrayEnemy.hide();
          showTextAndSummon();
        });
      }
    } else {
      this.end();
    }
  }

  onEnd(): void {
    super.onEnd();

    const pokemon = this.getPokemon();

    const moveId = this.lastPokemon?.scene.currentBattle.lastMove;
    const lastUsedMove = moveId ? allMoves[moveId] : undefined;

    const currentCommand = pokemon.scene.currentBattle.turnCommands[this.fieldIndex]?.command;
    const lastPokemonIsForceSwitchedAndNotFainted = lastUsedMove?.hasAttr(ForceSwitchOutAttr) && !this.lastPokemon.isFainted();

    // Compensate for turn spent summoning
    // Or compensate for force switch move if switched out pokemon is not fainted
    if (currentCommand === Command.POKEMON || lastPokemonIsForceSwitchedAndNotFainted) {
      pokemon.battleSummonData.turnCount--;
    }

    if (this.batonPass && pokemon) {
      pokemon.transferSummon(this.lastPokemon);
    }

    this.lastPokemon?.resetSummonData();

    this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
  }

  queuePostSummon(): void {
    this.scene.unshiftPhase(new PostSummonPhase(this.scene, this.getPokemon().getBattlerIndex()));
  }
}

export class ReturnPhase extends SwitchSummonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, fieldIndex, -1, true, false);
  }

  switchAndSummon(): void {
    this.end();
  }

  summon(): void { }

  onEnd(): void {
    const pokemon = this.getPokemon();

    pokemon.resetTurnData();
    pokemon.resetSummonData();

    this.scene.updateFieldScale();

    this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger);
  }
}

export class ShowTrainerPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.trainer.setVisible(true);

    this.scene.trainer.setTexture(`trainer_${this.scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`);

    this.scene.tweens.add({
      targets: this.scene.trainer,
      x: 106,
      duration: 1000,
      onComplete: () => this.end()
    });
  }
}

export class ToggleDoublePositionPhase extends BattlePhase {
  private double: boolean;

  constructor(scene: BattleScene, double: boolean) {
    super(scene);

    this.double = double;
  }

  start() {
    super.start();

    const playerPokemon = this.scene.getPlayerField().find(p => p.isActive(true));
    if (playerPokemon) {
      playerPokemon.setFieldPosition(this.double && this.scene.getParty().filter(p => p.isAllowedInBattle()).length > 1 ? FieldPosition.LEFT : FieldPosition.CENTER, 500).then(() => {
        if (playerPokemon.getFieldIndex() === 1) {
          const party = this.scene.getParty();
          party[1] = party[0];
          party[0] = playerPokemon;
        }
        this.end();
      });
    } else {
      this.end();
    }
  }
}

export class CheckSwitchPhase extends BattlePhase {
  protected fieldIndex: integer;
  protected useName: boolean;

  constructor(scene: BattleScene, fieldIndex: integer, useName: boolean) {
    super(scene);

    this.fieldIndex = fieldIndex;
    this.useName = useName;
  }

  start() {
    super.start();

    const pokemon = this.scene.getPlayerField()[this.fieldIndex];

    if (this.scene.battleStyle === BattleStyle.SET) {
      super.end();
      return;
    }

    if (this.scene.field.getAll().indexOf(pokemon) === -1) {
      this.scene.unshiftPhase(new SummonMissingPhase(this.scene, this.fieldIndex));
      super.end();
      return;
    }

    if (!this.scene.getParty().slice(1).filter(p => p.isActive()).length) {
      super.end();
      return;
    }

    if (pokemon.getTag(BattlerTagType.FRENZY)) {
      super.end();
      return;
    }

    this.scene.ui.showText(i18next.t("battle:switchQuestion", { pokemonName: this.useName ? pokemon.name : i18next.t("battle:pokemon") }), null, () => {
      this.scene.ui.setMode(Mode.CONFIRM, () => {
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.tryRemovePhase(p => p instanceof PostSummonPhase && p.player && p.fieldIndex === this.fieldIndex);
        this.scene.unshiftPhase(new SwitchPhase(this.scene, this.fieldIndex, false, true));
        this.end();
      }, () => {
        this.scene.ui.setMode(Mode.MESSAGE);
        this.end();
      });
    });
  }
}

export class SummonMissingPhase extends SummonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, fieldIndex);
  }

  preSummon(): void {
    this.scene.ui.showText(i18next.t("battle:sendOutPokemon", { pokemonName: this.getPokemon().name}));
    this.scene.time.delayedCall(250, () => this.summon());
  }
}

export class LevelCapPhase extends FieldPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start(): void {
    super.start();

    this.scene.ui.setMode(Mode.MESSAGE).then(() => {
      this.scene.playSound("level_up_fanfare");
      this.scene.ui.showText(i18next.t("battle:levelCapUp", { levelCap: this.scene.getMaxExpLevel() }), null, () => this.end(), null, true);
      this.executeForAll(pokemon => pokemon.updateInfo(true));
    });
  }
}

export class TurnInitPhase extends FieldPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.getPlayerField().forEach(p => {
      // If this pokemon is in play and evolved into something illegal under the current challenge, force a switch
      if (p.isOnField() && !p.isAllowedInBattle()) {
        this.scene.queueMessage(i18next.t("challenges:illegalEvolution", {"pokemon": p.name}), null, true);

        const allowedPokemon = this.scene.getParty().filter(p => p.isAllowedInBattle());

        if (!allowedPokemon.length) {
          // If there are no longer any legal pokemon in the party, game over.
          this.scene.clearPhaseQueue();
          this.scene.unshiftPhase(new GameOverPhase(this.scene));
        } else if (allowedPokemon.length >= this.scene.currentBattle.getBattlerCount() || (this.scene.currentBattle.double && !allowedPokemon[0].isActive(true))) {
          // If there is at least one pokemon in the back that is legal to switch in, force a switch.
          p.switchOut(false, true);
        } else {
          // If there are no pokemon in the back but we're not game overing, just hide the pokemon.
          // This should only happen in double battles.
          p.hideInfo();
          p.setVisible(false);
          this.scene.field.remove(p);
          this.scene.triggerPokemonFormChange(p, SpeciesFormChangeActiveTrigger, true);
        }
        if (allowedPokemon.length === 1 && this.scene.currentBattle.double) {
          this.scene.unshiftPhase(new ToggleDoublePositionPhase(this.scene, true));
        }
      }
    });

    //this.scene.pushPhase(new MoveAnimTestPhase(this.scene));
    this.scene.eventTarget.dispatchEvent(new TurnInitEvent());

    this.scene.getField().forEach((pokemon, i) => {
      if (pokemon?.isActive()) {
        if (pokemon.isPlayer()) {
          this.scene.currentBattle.addParticipant(pokemon as PlayerPokemon);
        }

        pokemon.resetTurnData();

        this.scene.pushPhase(pokemon.isPlayer() ? new CommandPhase(this.scene, i) : new EnemyCommandPhase(this.scene, i - BattlerIndex.ENEMY));
      }
    });

    this.scene.pushPhase(new TurnStartPhase(this.scene));

    this.end();
  }
}

export class CommandPhase extends FieldPhase {
  protected fieldIndex: integer;

  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene);

    this.fieldIndex = fieldIndex;
  }

  start() {
    super.start();

    if (this.fieldIndex) {
      // If we somehow are attempting to check the right pokemon but there's only one pokemon out
      // Switch back to the center pokemon. This can happen rarely in double battles with mid turn switching
      if (this.scene.getPlayerField().filter(p => p.isActive()).length === 1) {
        this.fieldIndex = FieldPosition.CENTER;
      } else {
        const allyCommand = this.scene.currentBattle.turnCommands[this.fieldIndex - 1];
        if (allyCommand.command === Command.BALL || allyCommand.command === Command.RUN) {
          this.scene.currentBattle.turnCommands[this.fieldIndex] = { command: allyCommand.command, skip: true };
        }
      }
    }

    if (this.scene.currentBattle.turnCommands[this.fieldIndex]?.skip) {
      return this.end();
    }

    const playerPokemon = this.scene.getPlayerField()[this.fieldIndex];

    const moveQueue = playerPokemon.getMoveQueue();

    while (moveQueue.length && moveQueue[0]
      && moveQueue[0].move && (!playerPokemon.getMoveset().find(m => m.moveId === moveQueue[0].move)
      || !playerPokemon.getMoveset()[playerPokemon.getMoveset().findIndex(m => m.moveId === moveQueue[0].move)].isUsable(playerPokemon, moveQueue[0].ignorePP))) {
      moveQueue.shift();
    }

    if (moveQueue.length) {
      const queuedMove = moveQueue[0];
      if (!queuedMove.move) {
        this.handleCommand(Command.FIGHT, -1, false);
      } else {
        const moveIndex = playerPokemon.getMoveset().findIndex(m => m.moveId === queuedMove.move);
        if (moveIndex > -1 && playerPokemon.getMoveset()[moveIndex].isUsable(playerPokemon, queuedMove.ignorePP)) {
          this.handleCommand(Command.FIGHT, moveIndex, queuedMove.ignorePP, { targets: queuedMove.targets, multiple: queuedMove.targets.length > 1 });
        } else {
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }
      }
    } else {
      this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
    }
  }

  handleCommand(command: Command, cursor: integer, ...args: any[]): boolean {
    const playerPokemon = this.scene.getPlayerField()[this.fieldIndex];
    const enemyField = this.scene.getEnemyField();
    let success: boolean;

    switch (command) {
    case Command.FIGHT:
      let useStruggle = false;
      if (cursor === -1 ||
            playerPokemon.trySelectMove(cursor, args[0] as boolean) ||
           (useStruggle = cursor > -1 && !playerPokemon.getMoveset().filter(m => m.isUsable(playerPokemon)).length)) {
        const moveId = !useStruggle ? cursor > -1 ? playerPokemon.getMoveset()[cursor].moveId : Moves.NONE : Moves.STRUGGLE;
        const turnCommand: TurnCommand = { command: Command.FIGHT, cursor: cursor, move: { move: moveId, targets: [], ignorePP: args[0] }, args: args };
        const moveTargets: MoveTargetSet = args.length < 3 ? getMoveTargets(playerPokemon, moveId) : args[2];
        if (!moveId) {
          turnCommand.targets = [ this.fieldIndex ];
        }
        console.log(moveTargets, playerPokemon.name);
        if (moveTargets.targets.length <= 1 || moveTargets.multiple) {
          turnCommand.move.targets = moveTargets.targets;
        } else if (playerPokemon.getTag(BattlerTagType.CHARGING) && playerPokemon.getMoveQueue().length >= 1) {
          turnCommand.move.targets = playerPokemon.getMoveQueue()[0].targets;
        } else {
          this.scene.unshiftPhase(new SelectTargetPhase(this.scene, this.fieldIndex));
        }
        this.scene.currentBattle.turnCommands[this.fieldIndex] = turnCommand;
        success = true;
      } else if (cursor < playerPokemon.getMoveset().length) {
        const move = playerPokemon.getMoveset()[cursor];
        this.scene.ui.setMode(Mode.MESSAGE);

        // Decides between a Disabled, Not Implemented, or No PP translation message
        const errorMessage =
            playerPokemon.summonData.disabledMove === move.moveId ? "battle:moveDisabled" :
              move.getName().endsWith(" (N)") ? "battle:moveNotImplemented" : "battle:moveNoPP";
        const moveName = move.getName().replace(" (N)", ""); // Trims off the indicator

        this.scene.ui.showText(i18next.t(errorMessage, { moveName: moveName }), null, () => {
          this.scene.ui.clearText();
          this.scene.ui.setMode(Mode.FIGHT, this.fieldIndex);
        }, null, true);
      }
      break;
    case Command.BALL:
      if (this.scene.arena.biomeType === Biome.END && (!this.scene.gameMode.isClassic || (this.scene.getEnemyField().filter(p => p.isActive(true)).some(p => !p.scene.gameData.dexData[p.species.speciesId].caughtAttr) && this.scene.gameData.getStarterCount(d => !!d.caughtAttr) < Object.keys(speciesStarters).length - 1))) {
        this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:noPokeballForce"), null, () => {
          this.scene.ui.showText(null, 0);
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }, null, true);
      } else if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
        this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:noPokeballTrainer"), null, () => {
          this.scene.ui.showText(null, 0);
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }, null, true);
      } else {
        const targets = this.scene.getEnemyField().filter(p => p.isActive(true)).map(p => p.getBattlerIndex());
        if (targets.length > 1) {
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          this.scene.ui.setMode(Mode.MESSAGE);
          this.scene.ui.showText(i18next.t("battle:noPokeballMulti"), null, () => {
            this.scene.ui.showText(null, 0);
            this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          }, null, true);
        } else if (cursor < 5) {
          const targetPokemon = this.scene.getEnemyField().find(p => p.isActive(true));
          if (targetPokemon.isBoss() && targetPokemon.bossSegmentIndex >= 1 && !targetPokemon.hasAbility(Abilities.WONDER_GUARD, false, true) && cursor < PokeballType.MASTER_BALL) {
            this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            this.scene.ui.setMode(Mode.MESSAGE);
            this.scene.ui.showText(i18next.t("battle:noPokeballStrong"), null, () => {
              this.scene.ui.showText(null, 0);
              this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            }, null, true);
          } else {
            this.scene.currentBattle.turnCommands[this.fieldIndex] = { command: Command.BALL, cursor: cursor };
            this.scene.currentBattle.turnCommands[this.fieldIndex].targets = targets;
            if (this.fieldIndex) {
              this.scene.currentBattle.turnCommands[this.fieldIndex - 1].skip = true;
            }
            success = true;
          }
        }
      }
      break;
    case Command.POKEMON:
    case Command.RUN:
      const isSwitch = command === Command.POKEMON;
      if (!isSwitch && this.scene.arena.biomeType === Biome.END) {
        this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:noEscapeForce"), null, () => {
          this.scene.ui.showText(null, 0);
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }, null, true);
      } else if (!isSwitch && this.scene.currentBattle.battleType === BattleType.TRAINER) {
        this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:noEscapeTrainer"), null, () => {
          this.scene.ui.showText(null, 0);
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }, null, true);
      } else {
        const trapTag = playerPokemon.findTag(t => t instanceof TrappedTag) as TrappedTag;
        const trapped = new Utils.BooleanHolder(false);
        const batonPass = isSwitch && args[0] as boolean;
        if (!batonPass) {
          enemyField.forEach(enemyPokemon => applyCheckTrappedAbAttrs(CheckTrappedAbAttr, enemyPokemon, trapped, playerPokemon));
        }
        if (batonPass || (!trapTag && !trapped.value)) {
          this.scene.currentBattle.turnCommands[this.fieldIndex] = isSwitch
            ? { command: Command.POKEMON, cursor: cursor, args: args }
            : { command: Command.RUN };
          success = true;
          if (!isSwitch && this.fieldIndex) {
            this.scene.currentBattle.turnCommands[this.fieldIndex - 1].skip = true;
          }
        } else if (trapTag) {
          if (trapTag.sourceMove === Moves.INGRAIN && this.scene.getPokemonById(trapTag.sourceId).isOfType(Type.GHOST)) {
            success = true;
            this.scene.currentBattle.turnCommands[this.fieldIndex] = isSwitch
              ? { command: Command.POKEMON, cursor: cursor, args: args }
              : { command: Command.RUN };
            break;
          }
          if (!isSwitch) {
            this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            this.scene.ui.setMode(Mode.MESSAGE);
          }
          this.scene.ui.showText(
            i18next.t("battle:noEscapePokemon", {
              pokemonName: this.scene.getPokemonById(trapTag.sourceId).name,
              moveName: trapTag.getMoveName(),
              escapeVerb: isSwitch ? i18next.t("battle:escapeVerbSwitch") : i18next.t("battle:escapeVerbFlee")
            }),
            null,
            () => {
              this.scene.ui.showText(null, 0);
              if (!isSwitch) {
                this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
              }
            }, null, true);
        }
      }
      break;
    }

    if (success) {
      this.end();
    }

    return success;
  }

  cancel() {
    if (this.fieldIndex) {
      this.scene.unshiftPhase(new CommandPhase(this.scene, 0));
      this.scene.unshiftPhase(new CommandPhase(this.scene, 1));
      this.end();
    }
  }

  checkFightOverride(): boolean {
    const pokemon = this.getPokemon();

    const encoreTag = pokemon.getTag(EncoreTag) as EncoreTag;

    if (!encoreTag) {
      return false;
    }

    const moveIndex = pokemon.getMoveset().findIndex(m => m.moveId === encoreTag.moveId);

    if (moveIndex === -1 || !pokemon.getMoveset()[moveIndex].isUsable(pokemon)) {
      return false;
    }

    this.handleCommand(Command.FIGHT, moveIndex, false);

    return true;
  }

  getFieldIndex(): integer {
    return this.fieldIndex;
  }

  getPokemon(): PlayerPokemon {
    return this.scene.getPlayerField()[this.fieldIndex];
  }

  end() {
    this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
  }
}

export class EnemyCommandPhase extends FieldPhase {
  protected fieldIndex: integer;

  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene);

    this.fieldIndex = fieldIndex;
  }

  start() {
    super.start();

    const enemyPokemon = this.scene.getEnemyField()[this.fieldIndex];

    const battle = this.scene.currentBattle;

    const trainer = battle.trainer;

    if (trainer && !enemyPokemon.getMoveQueue().length) {
      const opponents = enemyPokemon.getOpponents();

      const trapTag = enemyPokemon.findTag(t => t instanceof TrappedTag) as TrappedTag;
      const trapped = new Utils.BooleanHolder(false);
      opponents.forEach(playerPokemon => applyCheckTrappedAbAttrs(CheckTrappedAbAttr, playerPokemon, trapped, enemyPokemon));
      if (!trapTag && !trapped.value) {
        const partyMemberScores = trainer.getPartyMemberMatchupScores(enemyPokemon.trainerSlot, true);

        if (partyMemberScores.length) {
          const matchupScores = opponents.map(opp => enemyPokemon.getMatchupScore(opp));
          const matchupScore = matchupScores.reduce((total, score) => total += score, 0) / matchupScores.length;

          const sortedPartyMemberScores = trainer.getSortedPartyMemberMatchupScores(partyMemberScores);

          const switchMultiplier = 1 - (battle.enemySwitchCounter ? Math.pow(0.1, (1 / battle.enemySwitchCounter)) : 0);

          if (sortedPartyMemberScores[0][1] * switchMultiplier >= matchupScore * (trainer.config.isBoss ? 2 : 3)) {
            const index = trainer.getNextSummonIndex(enemyPokemon.trainerSlot, partyMemberScores);

            battle.turnCommands[this.fieldIndex + BattlerIndex.ENEMY] =
              { command: Command.POKEMON, cursor: index, args: [ false ] };

            battle.enemySwitchCounter++;

            return this.end();
          }
        }
      }
    }

    const nextMove = enemyPokemon.getNextMove();

    this.scene.currentBattle.turnCommands[this.fieldIndex + BattlerIndex.ENEMY] =
      { command: Command.FIGHT, move: nextMove };

    this.scene.currentBattle.enemySwitchCounter = Math.max(this.scene.currentBattle.enemySwitchCounter - 1, 0);

    this.end();
  }
}

export class SelectTargetPhase extends PokemonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, fieldIndex);
  }

  start() {
    super.start();

    const turnCommand = this.scene.currentBattle.turnCommands[this.fieldIndex];
    const move = turnCommand.move?.move;
    this.scene.ui.setMode(Mode.TARGET_SELECT, this.fieldIndex, move, (cursor: integer) => {
      this.scene.ui.setMode(Mode.MESSAGE);
      if (cursor === -1) {
        this.scene.currentBattle.turnCommands[this.fieldIndex] = null;
        this.scene.unshiftPhase(new CommandPhase(this.scene, this.fieldIndex));
      } else {
        turnCommand.targets = [ cursor ];
      }
      if (turnCommand.command === Command.BALL && this.fieldIndex) {
        this.scene.currentBattle.turnCommands[this.fieldIndex - 1].skip = true;
      }
      this.end();
    });
  }
}

export class TurnStartPhase extends FieldPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    const field = this.scene.getField();
    const order = this.getOrder();

    const battlerBypassSpeed = {};

    this.scene.getField(true).filter(p => p.summonData).map(p => {
      const bypassSpeed = new Utils.BooleanHolder(false);
      this.scene.applyModifiers(BypassSpeedChanceModifier, p.isPlayer(), p, bypassSpeed);
      battlerBypassSpeed[p.getBattlerIndex()] = bypassSpeed;
    });

    const moveOrder = order.slice(0);

    moveOrder.sort((a, b) => {
      const aCommand = this.scene.currentBattle.turnCommands[a];
      const bCommand = this.scene.currentBattle.turnCommands[b];

      if (aCommand.command !== bCommand.command) {
        if (aCommand.command === Command.FIGHT) {
          return 1;
        } else if (bCommand.command === Command.FIGHT) {
          return -1;
        }
      } else if (aCommand.command === Command.FIGHT) {
        const aMove = allMoves[aCommand.move.move];
        const bMove = allMoves[bCommand.move.move];

        const aPriority = new Utils.IntegerHolder(aMove.priority);
        const bPriority = new Utils.IntegerHolder(bMove.priority);

        applyMoveAttrs(IncrementMovePriorityAttr,this.scene.getField().find(p => p?.isActive() && p.getBattlerIndex() === a),null,aMove,aPriority);
        applyMoveAttrs(IncrementMovePriorityAttr,this.scene.getField().find(p => p?.isActive() && p.getBattlerIndex() === b),null,bMove,bPriority);

		    applyAbAttrs(IncrementMovePriorityAbAttr, this.scene.getField().find(p => p?.isActive() && p.getBattlerIndex() === a), null, aMove, aPriority);
        applyAbAttrs(IncrementMovePriorityAbAttr, this.scene.getField().find(p => p?.isActive() && p.getBattlerIndex() === b), null, bMove, bPriority);

        if (aPriority.value !== bPriority.value) {
          return aPriority.value < bPriority.value ? 1 : -1;
        }
      }

      if (battlerBypassSpeed[a].value !== battlerBypassSpeed[b].value) {
        return battlerBypassSpeed[a].value ? -1 : 1;
      }

      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);

      return aIndex < bIndex ? -1 : aIndex > bIndex ? 1 : 0;
    });

    for (const o of moveOrder) {

      const pokemon = field[o];
      const turnCommand = this.scene.currentBattle.turnCommands[o];

      if (turnCommand.skip) {
        continue;
      }

      switch (turnCommand.command) {
      case Command.FIGHT:
        const queuedMove = turnCommand.move;
        if (!queuedMove) {
          continue;
        }
        const move = pokemon.getMoveset().find(m => m.moveId === queuedMove.move) || new PokemonMove(queuedMove.move);
        if (pokemon.isPlayer()) {
          if (turnCommand.cursor === -1) {
            this.scene.pushPhase(new MovePhase(this.scene, pokemon, turnCommand.targets || turnCommand.move.targets, move));
          } else {
            const playerPhase = new MovePhase(this.scene, pokemon, turnCommand.targets || turnCommand.move.targets, move, false, queuedMove.ignorePP);
            this.scene.pushPhase(playerPhase);
          }
        } else {
          this.scene.pushPhase(new MovePhase(this.scene, pokemon, turnCommand.targets || turnCommand.move.targets, move, false, queuedMove.ignorePP));
        }
        break;
      case Command.BALL:
        this.scene.unshiftPhase(new AttemptCapturePhase(this.scene, turnCommand.targets[0] % 2, turnCommand.cursor));
        break;
      case Command.POKEMON:
        this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, pokemon.getFieldIndex(), turnCommand.cursor, true, turnCommand.args[0] as boolean, pokemon.isPlayer()));
        break;
      case Command.RUN:
        let runningPokemon = pokemon;
        if (this.scene.currentBattle.double) {
          const playerActivePokemon = field.filter(pokemon => {
            if (!!pokemon) {
              return pokemon.isPlayer() && pokemon.isActive();
            } else {
              return;
            }
          });
          // if only one pokemon is alive, use that one
          if (playerActivePokemon.length > 1) {
            // find which active pokemon has faster speed
            const fasterPokemon = playerActivePokemon[0].getStat(Stat.SPD) > playerActivePokemon[1].getStat(Stat.SPD) ? playerActivePokemon[0] : playerActivePokemon[1];
            // check if either active pokemon has the ability "Run Away"
            const hasRunAway = playerActivePokemon.find(p => p.hasAbility(Abilities.RUN_AWAY));
            runningPokemon = hasRunAway !== undefined ? hasRunAway : fasterPokemon;
          }
        }
        this.scene.unshiftPhase(new AttemptRunPhase(this.scene, runningPokemon.getFieldIndex()));
        break;
      }
    }


    this.scene.pushPhase(new WeatherEffectPhase(this.scene));

    for (const o of order) {
      if (field[o].status && field[o].status.isPostTurn()) {
        this.scene.pushPhase(new PostTurnStatusEffectPhase(this.scene, o));
      }
    }

    this.scene.pushPhase(new BerryPhase(this.scene));
    this.scene.pushPhase(new TurnEndPhase(this.scene));

    this.end();
  }
}

/** The phase after attacks where the pokemon eat berries */
export class BerryPhase extends FieldPhase {
  start() {
    super.start();

    this.executeForAll((pokemon) => {
      const hasUsableBerry = !!this.scene.findModifier((m) => {
        return m instanceof BerryModifier && m.shouldApply([pokemon]);
      }, pokemon.isPlayer());

      if (hasUsableBerry) {
        const cancelled = new Utils.BooleanHolder(false);
        pokemon.getOpponents().map((opp) => applyAbAttrs(PreventBerryUseAbAttr, opp, cancelled));

        if (cancelled.value) {
          pokemon.scene.queueMessage(getPokemonMessage(pokemon, " is too\nnervous to eat berries!"));
        } else {
          this.scene.unshiftPhase(
            new CommonAnimPhase(this.scene, pokemon.getBattlerIndex(), pokemon.getBattlerIndex(), CommonAnim.USE_ITEM)
          );

          for (const berryModifier of this.scene.applyModifiers(BerryModifier, pokemon.isPlayer(), pokemon) as BerryModifier[]) {
            if (berryModifier.consumed) {
              if (!--berryModifier.stackCount) {
                this.scene.removeModifier(berryModifier);
              } else {
                berryModifier.consumed = false;
              }
            }
            this.scene.eventTarget.dispatchEvent(new BerryUsedEvent(berryModifier)); // Announce a berry was used
          }

          this.scene.updateModifiers(pokemon.isPlayer());

          applyAbAttrs(HealFromBerryUseAbAttr, pokemon, new Utils.BooleanHolder(false));
        }
      }
    });

    this.end();
  }
}

export class TurnEndPhase extends FieldPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.currentBattle.incrementTurn(this.scene);
    this.scene.eventTarget.dispatchEvent(new TurnEndEvent(this.scene.currentBattle.turn));

    const handlePokemon = (pokemon: Pokemon) => {
      pokemon.lapseTags(BattlerTagLapseType.TURN_END);

      if (pokemon.summonData.disabledMove && !--pokemon.summonData.disabledTurns) {
        this.scene.pushPhase(new MessagePhase(this.scene, i18next.t("battle:notDisabled", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: allMoves[pokemon.summonData.disabledMove].name })));
        pokemon.summonData.disabledMove = Moves.NONE;
      }

      this.scene.applyModifiers(TurnHealModifier, pokemon.isPlayer(), pokemon);

      if (this.scene.arena.terrain?.terrainType === TerrainType.GRASSY && pokemon.isGrounded()) {
        this.scene.unshiftPhase(new PokemonHealPhase(this.scene, pokemon.getBattlerIndex(),
          Math.max(pokemon.getMaxHp() >> 4, 1), getPokemonMessage(pokemon, "'s HP was restored."), true));
      }

      if (!pokemon.isPlayer()) {
        this.scene.applyModifiers(EnemyTurnHealModifier, false, pokemon);
        this.scene.applyModifier(EnemyStatusEffectHealChanceModifier, false, pokemon);
      }

      applyPostTurnAbAttrs(PostTurnAbAttr, pokemon);

      this.scene.applyModifiers(TurnStatusEffectModifier, pokemon.isPlayer(), pokemon);

      this.scene.applyModifiers(TurnHeldItemTransferModifier, pokemon.isPlayer(), pokemon);

      pokemon.battleSummonData.turnCount++;
    };

    this.executeForAll(handlePokemon);

    this.scene.arena.lapseTags();

    if (this.scene.arena.weather && !this.scene.arena.weather.lapse()) {
      this.scene.arena.trySetWeather(WeatherType.NONE, false);
    }

    if (this.scene.arena.terrain && !this.scene.arena.terrain.lapse()) {
      this.scene.arena.trySetTerrain(TerrainType.NONE, false);
    }

    this.end();
  }
}

export class BattleEndPhase extends BattlePhase {
  start() {
    super.start();

    this.scene.currentBattle.addBattleScore(this.scene);

    this.scene.gameData.gameStats.battles++;
    if (this.scene.currentBattle.trainer) {
      this.scene.gameData.gameStats.trainersDefeated++;
    }
    if (this.scene.gameMode.isEndless && this.scene.currentBattle.waveIndex + 1 > this.scene.gameData.gameStats.highestEndlessWave) {
      this.scene.gameData.gameStats.highestEndlessWave = this.scene.currentBattle.waveIndex + 1;
    }

    // Endless graceful end
    if (this.scene.gameMode.isEndless && this.scene.currentBattle.waveIndex >= 5850) {
      this.scene.clearPhaseQueue();
      this.scene.unshiftPhase(new GameOverPhase(this.scene, true));
    }

    for (const pokemon of this.scene.getField()) {
      if (pokemon) {
        pokemon.resetBattleSummonData();
      }
    }

    for (const pokemon of this.scene.getParty().filter(p => p.isAllowedInBattle())) {
      applyPostBattleAbAttrs(PostBattleAbAttr, pokemon);
    }

    if (this.scene.currentBattle.moneyScattered) {
      this.scene.currentBattle.pickUpScatteredMoney(this.scene);
    }

    this.scene.clearEnemyHeldItemModifiers();

    const lapsingModifiers = this.scene.findModifiers(m => m instanceof LapsingPersistentModifier || m instanceof LapsingPokemonHeldItemModifier) as (LapsingPersistentModifier | LapsingPokemonHeldItemModifier)[];
    for (const m of lapsingModifiers) {
      const args: any[] = [];
      if (m instanceof LapsingPokemonHeldItemModifier) {
        args.push(this.scene.getPokemonById(m.pokemonId));
      }
      if (!m.lapse(args)) {
        this.scene.removeModifier(m);
      }
    }

    this.scene.updateModifiers().then(() => this.end());
  }
}

export class NewBattlePhase extends BattlePhase {
  start() {
    super.start();

    this.scene.newBattle();

    this.end();
  }
}

export class CommonAnimPhase extends PokemonPhase {
  private anim: CommonAnim;
  private targetIndex: integer;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, targetIndex: BattlerIndex, anim: CommonAnim) {
    super(scene, battlerIndex);

    this.anim = anim;
    this.targetIndex = targetIndex;
  }

  setAnimation(anim: CommonAnim) {
    this.anim = anim;
  }

  start() {
    new CommonBattleAnim(this.anim, this.getPokemon(), this.targetIndex !== undefined ? (this.player ? this.scene.getEnemyField() : this.scene.getPlayerField())[this.targetIndex] : this.getPokemon()).play(this.scene, () => {
      this.end();
    });
  }
}

export class MovePhase extends BattlePhase {
  public pokemon: Pokemon;
  public move: PokemonMove;
  public targets: BattlerIndex[];
  protected followUp: boolean;
  protected ignorePp: boolean;
  protected failed: boolean;
  protected cancelled: boolean;

  constructor(scene: BattleScene, pokemon: Pokemon, targets: BattlerIndex[], move: PokemonMove, followUp?: boolean, ignorePp?: boolean) {
    super(scene);

    this.pokemon = pokemon;
    this.targets = targets;
    this.move = move;
    this.followUp = !!followUp;
    this.ignorePp = !!ignorePp;
    this.failed = false;
    this.cancelled = false;
  }

  canMove(): boolean {
    return this.pokemon.isActive(true) && this.move.isUsable(this.pokemon, this.ignorePp) && !!this.targets.length;
  }

  /**Signifies the current move should fail but still use PP */
  fail(): void {
    this.failed = true;
  }

  /**Signifies the current move should cancel and retain PP */
  cancel(): void {
    this.cancelled = true;
  }

  start() {
    super.start();

    console.log(Moves[this.move.moveId]);

    if (!this.canMove()) {
      if (this.move.moveId && this.pokemon.summonData?.disabledMove === this.move.moveId) {
        this.scene.queueMessage(`${this.move.getName()} is disabled!`);
      }
      return this.end();
    }

    if (!this.followUp) {
      if (this.move.getMove().checkFlag(MoveFlags.IGNORE_ABILITIES, this.pokemon, null)) {
        this.scene.arena.setIgnoreAbilities();
      }
    } else {
      this.pokemon.turnData.hitsLeft = undefined;
      this.pokemon.turnData.hitCount = undefined;
    }

    // Move redirection abilities (ie. Storm Drain) only support single target moves
    const moveTarget = this.targets.length === 1
      ? new Utils.IntegerHolder(this.targets[0])
      : null;
    if (moveTarget) {
      const oldTarget = moveTarget.value;
      this.scene.getField(true).filter(p => p !== this.pokemon).forEach(p => applyAbAttrs(RedirectMoveAbAttr, p, null, this.move.moveId, moveTarget));
      //Check if this move is immune to being redirected, and restore its target to the intended target if it is.
      if ((this.pokemon.hasAbilityWithAttr(BlockRedirectAbAttr) || this.move.getMove().hasAttr(BypassRedirectAttr))) {
        //If an ability prevented this move from being redirected, display its ability pop up.
        if ((this.pokemon.hasAbilityWithAttr(BlockRedirectAbAttr) && !this.move.getMove().hasAttr(BypassRedirectAttr)) && oldTarget !== moveTarget.value) {
          this.scene.unshiftPhase(new ShowAbilityPhase(this.scene, this.pokemon.getBattlerIndex(), this.pokemon.getPassiveAbility().hasAttr(BlockRedirectAbAttr)));
        }
        moveTarget.value = oldTarget;
	    }
      this.targets[0] = moveTarget.value;
    }

    if (this.targets.length === 1 && this.targets[0] === BattlerIndex.ATTACKER) {
      if (this.pokemon.turnData.attacksReceived.length) {
        const attacker = this.pokemon.turnData.attacksReceived.length ? this.pokemon.scene.getPokemonById(this.pokemon.turnData.attacksReceived[0].sourceId) : null;
        if (attacker?.isActive(true)) {
          this.targets[0] = attacker.getBattlerIndex();
        }
      }
      if (this.targets[0] === BattlerIndex.ATTACKER) {
        this.fail(); // Marks the move as failed for later in doMove
        this.showMoveText();
        this.showFailedText();
      }
    }

    const targets = this.scene.getField(true).filter(p => {
      if (this.targets.indexOf(p.getBattlerIndex()) > -1) {
        return true;
      }
      return false;
    });

    const doMove = () => {
      this.pokemon.turnData.acted = true; // Record that the move was attempted, even if it fails

      this.pokemon.lapseTags(BattlerTagLapseType.PRE_MOVE);

      let ppUsed = 1;
      // Filter all opponents to include only those this move is targeting
      const targetedOpponents = this.pokemon.getOpponents().filter(o => this.targets.includes(o.getBattlerIndex()));
      for (const opponent of targetedOpponents) {
        if (this.move.ppUsed + ppUsed >= this.move.getMovePp()) { // If we're already at max PP usage, stop checking
          break;
        }
        if (opponent.hasAbilityWithAttr(IncreasePpAbAttr)) { // Accounting for abilities like Pressure
          ppUsed++;
        }
      }

      if (!this.followUp && this.canMove() && !this.cancelled) {
        this.pokemon.lapseTags(BattlerTagLapseType.MOVE);
      }

      const moveQueue = this.pokemon.getMoveQueue();
      if (this.cancelled || this.failed) {
        if (this.failed) {
          this.move.usePp(ppUsed); // Only use PP if the move failed
          this.scene.eventTarget.dispatchEvent(new MoveUsedEvent(this.pokemon?.id, this.move.getMove(), ppUsed));
        }

        // Record a failed move so Abilities like Truant don't trigger next turn and soft-lock
        this.pokemon.pushMoveHistory({ move: Moves.NONE, result: MoveResult.FAIL });

        this.pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT); // Remove any tags from moves like Fly/Dive/etc.
        moveQueue.shift(); // Remove the second turn of charge moves
        return this.end();
      }

      this.scene.triggerPokemonFormChange(this.pokemon, SpeciesFormChangePreMoveTrigger);

      if (this.move.moveId) {
        this.showMoveText();
      }

      // This should only happen when there are no valid targets left on the field
      if ((moveQueue.length && moveQueue[0].move === Moves.NONE) || !targets.length) {
        this.showFailedText();
        this.cancel();

        // Record a failed move so Abilities like Truant don't trigger next turn and soft-lock
        this.pokemon.pushMoveHistory({ move: Moves.NONE, result: MoveResult.FAIL });

        this.pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT); // Remove any tags from moves like Fly/Dive/etc.

        moveQueue.shift();
        return this.end();
      }

      if (!moveQueue.length || !moveQueue.shift().ignorePP) { // using .shift here clears out two turn moves once they've been used
        this.move.usePp(ppUsed);
        this.scene.eventTarget.dispatchEvent(new MoveUsedEvent(this.pokemon?.id, this.move.getMove(), ppUsed));
      }

      if (!allMoves[this.move.moveId].hasAttr(CopyMoveAttr)) {
        this.scene.currentBattle.lastMove = this.move.moveId;
      }

      // Assume conditions affecting targets only apply to moves with a single target
      let success = this.move.getMove().applyConditions(this.pokemon, targets[0], this.move.getMove());
      const cancelled = new Utils.BooleanHolder(false);
      let failedText = this.move.getMove().getFailedText(this.pokemon, targets[0], this.move.getMove(), cancelled);
      if (success && this.scene.arena.isMoveWeatherCancelled(this.move.getMove())) {
        success = false;
      } else if (success && this.scene.arena.isMoveTerrainCancelled(this.pokemon, this.targets, this.move.getMove())) {
        success = false;
        if (failedText === null) {
          failedText = getTerrainBlockMessage(targets[0], this.scene.arena.terrain.terrainType);
        }
      }

      /**
       * Trigger pokemon type change before playing the move animation
       * Will still change the user's type when using Roar, Whirlwind, Trick-or-Treat, and Forest's Curse,
       * regardless of whether the move successfully executes or not.
       */
      if (success || [Moves.ROAR, Moves.WHIRLWIND, Moves.TRICK_OR_TREAT, Moves.FORESTS_CURSE].includes(this.move.moveId)) {
        applyPreAttackAbAttrs(PokemonTypeChangeAbAttr, this.pokemon, null, this.move.getMove());
      }

      if (success) {
        this.scene.unshiftPhase(this.getEffectPhase());
      } else {
        this.pokemon.pushMoveHistory({ move: this.move.moveId, targets: this.targets, result: MoveResult.FAIL, virtual: this.move.virtual });
        if (!cancelled.value) {
          this.showFailedText(failedText);
        }
      }
      // Checks if Dancer ability is triggered
      if (this.move.getMove().hasFlag(MoveFlags.DANCE_MOVE) && !this.followUp) {
        // Pokemon with Dancer can be on either side of the battle so we check in both cases
        this.scene.getPlayerField().forEach(pokemon => {
          applyPostMoveUsedAbAttrs(PostMoveUsedAbAttr, pokemon, this.move, this.pokemon, this.targets);
        });
        this.scene.getEnemyField().forEach(pokemon => {
          applyPostMoveUsedAbAttrs(PostMoveUsedAbAttr, pokemon, this.move, this.pokemon, this.targets);
        });
      }
      this.end();
    };

    if (!this.followUp && this.pokemon.status && !this.pokemon.status.isPostTurn()) {
      this.pokemon.status.incrementTurn();
      let activated = false;
      let healed = false;

      switch (this.pokemon.status.effect) {
      case StatusEffect.PARALYSIS:
        if (!this.pokemon.randSeedInt(4)) {
          activated = true;
          this.cancelled = true;
        }
        break;
      case StatusEffect.SLEEP:
        applyMoveAttrs(BypassSleepAttr, this.pokemon, null, this.move.getMove());
        healed = this.pokemon.status.turnCount === this.pokemon.status.cureTurn;
        activated = !healed && !this.pokemon.getTag(BattlerTagType.BYPASS_SLEEP);
        this.cancelled = activated;
        break;
      case StatusEffect.FREEZE:
        healed = !!this.move.getMove().findAttr(attr => attr instanceof HealStatusEffectAttr && attr.selfTarget && attr.isOfEffect(StatusEffect.FREEZE)) || !this.pokemon.randSeedInt(5);
        activated = !healed;
        this.cancelled = activated;
        break;
      }

      if (activated) {
        this.scene.queueMessage(getPokemonMessage(this.pokemon, getStatusEffectActivationText(this.pokemon.status.effect)));
        this.scene.unshiftPhase(new CommonAnimPhase(this.scene, this.pokemon.getBattlerIndex(), undefined, CommonAnim.POISON + (this.pokemon.status.effect - 1)));
        doMove();
      } else {
        if (healed) {
          this.scene.queueMessage(getPokemonMessage(this.pokemon, getStatusEffectHealText(this.pokemon.status.effect)));
          this.pokemon.resetStatus();
          this.pokemon.updateInfo();
        }
        doMove();
      }
    } else {
      doMove();
    }
  }

  getEffectPhase(): MoveEffectPhase {
    return new MoveEffectPhase(this.scene, this.pokemon.getBattlerIndex(), this.targets, this.move);
  }

  showMoveText(): void {
    if (this.move.getMove().hasAttr(ChargeAttr)) {
      const lastMove = this.pokemon.getLastXMoves() as TurnMove[];
      if (!lastMove.length || lastMove[0].move !== this.move.getMove().id || lastMove[0].result !== MoveResult.OTHER) {
        this.scene.queueMessage(i18next.t("battle:useMove", {
          pokemonNameWithAffix: getPokemonNameWithAffix(this.pokemon),
          moveName: this.move.getName()
        }), 500);
        return;
      }
    }

    if (this.pokemon.getTag(BattlerTagType.RECHARGING || BattlerTagType.INTERRUPTED)) {
      return;
    }

    this.scene.queueMessage(i18next.t("battle:useMove", {
      pokemonNameWithAffix: getPokemonNameWithAffix(this.pokemon),
      moveName: this.move.getName()
    }), 500);
    applyMoveAttrs(PreMoveMessageAttr, this.pokemon, this.pokemon.getOpponents().find(() => true), this.move.getMove());
  }

  showFailedText(failedText: string = null): void {
    this.scene.queueMessage(failedText || i18next.t("battle:attackFailed"));
  }

  end() {
    if (!this.followUp && this.canMove()) {
      this.scene.unshiftPhase(new MoveEndPhase(this.scene, this.pokemon.getBattlerIndex()));
    }

    super.end();
  }
}

export class MoveEffectPhase extends PokemonPhase {
  public move: PokemonMove;
  protected targets: BattlerIndex[];

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, targets: BattlerIndex[], move: PokemonMove) {
    super(scene, battlerIndex);
    this.move = move;
    // In double battles, if the right Pokemon selects a spread move and the left Pokemon dies
    // with no party members available to switch in, then the right Pokemon takes the index
    // of the left Pokemon and gets hit unless this is checked.
    if (targets.includes(battlerIndex) && this.move.getMove().moveTarget === MoveTarget.ALL_NEAR_OTHERS) {
      const i = targets.indexOf(battlerIndex);
      targets.splice(i,i+1);
    }
    this.targets = targets;
  }

  start() {
    super.start();

    const user = this.getUserPokemon();
    const targets = this.getTargets();

    if (!user?.isOnField()) {
      return super.end();
    }

    const overridden = new Utils.BooleanHolder(false);
    const move = this.move.getMove();

    // Assume single target for override
    applyMoveAttrs(OverrideMoveEffectAttr, user, this.getTarget(), move, overridden, this.move.virtual).then(() => {

      if (overridden.value) {
        return this.end();
      }

      user.lapseTags(BattlerTagLapseType.MOVE_EFFECT);

      if (user.turnData.hitsLeft === undefined) {
        const hitCount = new Utils.IntegerHolder(1);
        // Assume single target for multi hit
        applyMoveAttrs(MultiHitAttr, user, this.getTarget(), move, hitCount);
        if (move instanceof AttackMove && !move.hasAttr(FixedDamageAttr)) {
          this.scene.applyModifiers(PokemonMultiHitModifier, user.isPlayer(), user, hitCount, new Utils.IntegerHolder(0));
        }
        user.turnData.hitsLeft = user.turnData.hitCount = hitCount.value;
      }

      const moveHistoryEntry = { move: this.move.moveId, targets: this.targets, result: MoveResult.PENDING, virtual: this.move.virtual };
      user.pushMoveHistory(moveHistoryEntry);

      const targetHitChecks = Object.fromEntries(targets.map(p => [ p.getBattlerIndex(), this.hitCheck(p) ]));
      const activeTargets = targets.map(t => t.isActive(true));
      if (!activeTargets.length || (!move.hasAttr(VariableTargetAttr) && !move.isMultiTarget() && !targetHitChecks[this.targets[0]])) {
        user.turnData.hitCount = 1;
        user.turnData.hitsLeft = 1;
        if (activeTargets.length) {
          this.scene.queueMessage(getPokemonMessage(user, "'s\nattack missed!"));
          moveHistoryEntry.result = MoveResult.MISS;
          applyMoveAttrs(MissEffectAttr, user, null, move);
        } else {
          this.scene.queueMessage(i18next.t("battle:attackFailed"));
          moveHistoryEntry.result = MoveResult.FAIL;
        }
        return this.end();
      }

      const applyAttrs: Promise<void>[] = [];

      // Move animation only needs one target
      new MoveAnim(move.id as Moves, user, this.getTarget()?.getBattlerIndex()).play(this.scene, () => {
        for (const target of targets) {
          if (!targetHitChecks[target.getBattlerIndex()]) {
            user.turnData.hitCount = 1;
            user.turnData.hitsLeft = 1;
            this.scene.queueMessage(getPokemonMessage(user, "'s\nattack missed!"));
            if (moveHistoryEntry.result === MoveResult.PENDING) {
              moveHistoryEntry.result = MoveResult.MISS;
            }
            applyMoveAttrs(MissEffectAttr, user, null, move);
            continue;
          }

          const isProtected = !move.hasFlag(MoveFlags.IGNORE_PROTECT) && target.findTags(t => t instanceof ProtectedTag).find(t => target.lapseTag(t.tagType));

          const firstHit = moveHistoryEntry.result !== MoveResult.SUCCESS;

          moveHistoryEntry.result = MoveResult.SUCCESS;

          const hitResult = !isProtected ? target.apply(user, move) : HitResult.NO_EFFECT;

          this.scene.triggerPokemonFormChange(user, SpeciesFormChangePostMoveTrigger);

          applyAttrs.push(new Promise(resolve => {
            applyFilteredMoveAttrs((attr: MoveAttr) => attr instanceof MoveEffectAttr && attr.trigger === MoveEffectTrigger.PRE_APPLY && (!attr.firstHitOnly || firstHit),
              user, target, move).then(() => {
              if (hitResult !== HitResult.FAIL) {
                const chargeEffect = !!move.getAttrs(ChargeAttr).find(ca => ca.usedChargeEffect(user, this.getTarget(), move));
                // Charge attribute with charge effect takes all effect attributes and applies them to charge stage, so ignore them if this is present
                Utils.executeIf(!chargeEffect, () => applyFilteredMoveAttrs((attr: MoveAttr) => attr instanceof MoveEffectAttr && attr.trigger === MoveEffectTrigger.POST_APPLY
                  && attr.selfTarget && (!attr.firstHitOnly || firstHit), user, target, move)).then(() => {
                  if (hitResult !== HitResult.NO_EFFECT) {
                    applyFilteredMoveAttrs((attr: MoveAttr) => attr instanceof MoveEffectAttr && attr.trigger === MoveEffectTrigger.POST_APPLY
                      && !attr.selfTarget && (!attr.firstHitOnly || firstHit), user, target, move).then(() => {
                      if (hitResult < HitResult.NO_EFFECT) {
                        const flinched = new Utils.BooleanHolder(false);
                        user.scene.applyModifiers(FlinchChanceModifier, user.isPlayer(), user, flinched);
                        if (flinched.value) {
                          target.addTag(BattlerTagType.FLINCHED, undefined, this.move.moveId, user.id);
                        }
                      }
                      Utils.executeIf(!isProtected && !chargeEffect, () => applyFilteredMoveAttrs((attr: MoveAttr) => attr instanceof MoveEffectAttr && attr.trigger === MoveEffectTrigger.HIT && (!attr.firstHitOnly || firstHit),
                        user, target, move).then(() => {
                        return Utils.executeIf(!target.isFainted() || target.canApplyAbility(), () => applyPostDefendAbAttrs(PostDefendAbAttr, target, user, move, hitResult).then(() => {
                          if (!user.isPlayer() && move instanceof AttackMove) {
                            user.scene.applyShuffledModifiers(this.scene, EnemyAttackStatusEffectChanceModifier, false, target);
                          }
                        })).then(() => {
                          applyPostAttackAbAttrs(PostAttackAbAttr, user, target, move, hitResult).then(() => {
                            if (move instanceof AttackMove) {
                              this.scene.applyModifiers(ContactHeldItemTransferChanceModifier, this.player, user, target.getFieldIndex());
                            }
                            resolve();
                          });
                        });
                      })
                      ).then(() => resolve());
                    });
                  } else {
                    applyMoveAttrs(NoEffectAttr, user, null, move).then(() => resolve());
                  }
                });
              } else {
                resolve();
              }
            });
          }));
        }
        // Trigger effect which should only apply one time after all targeted effects have already applied
        const postTarget = applyFilteredMoveAttrs((attr: MoveAttr) => attr instanceof MoveEffectAttr && attr.trigger === MoveEffectTrigger.POST_TARGET,
          user, null, move);

        if (applyAttrs.length) { // If there is a pending asynchronous move effect, do this after
          applyAttrs[applyAttrs.length - 1]?.then(() => postTarget);
        } else { // Otherwise, push a new asynchronous move effect
          applyAttrs.push(postTarget);
        }

        Promise.allSettled(applyAttrs).then(() => this.end());
      });
    });
  }

  end() {
    const move = this.move.getMove();
    move.type = move.defaultType;
    const user = this.getUserPokemon();
    if (user) {
      if (--user.turnData.hitsLeft >= 1 && this.getTarget()?.isActive()) {
        this.scene.unshiftPhase(this.getNewHitPhase());
      } else {
        const hitsTotal = user.turnData.hitCount - Math.max(user.turnData.hitsLeft, 0);
        if (hitsTotal > 1) {
          this.scene.queueMessage(i18next.t("battle:attackHitsCount", { count: hitsTotal }));
        }
        this.scene.applyModifiers(HitHealModifier, this.player, user);
      }
    }

    super.end();
  }

  hitCheck(target: Pokemon): boolean {
    // Moves targeting the user and entry hazards can't miss
    if ([MoveTarget.USER, MoveTarget.ENEMY_SIDE].includes(this.move.getMove().moveTarget)) {
      return true;
    }

    const user = this.getUserPokemon();

    // Hit check only calculated on first hit for multi-hit moves unless flag is set to check all hits.
    // However, if an ability with the MaxMultiHitAbAttr, namely Skill Link, is present, act as a normal
    // multi-hit move and proceed with all hits
    if (user.turnData.hitsLeft < user.turnData.hitCount) {
      if (!this.move.getMove().hasFlag(MoveFlags.CHECK_ALL_HITS) || user.hasAbilityWithAttr(MaxMultiHitAbAttr)) {
        return true;
      }
    }

    if (user.hasAbilityWithAttr(AlwaysHitAbAttr) || target.hasAbilityWithAttr(AlwaysHitAbAttr)) {
      return true;
    }

    // If the user should ignore accuracy on a target, check who the user targeted last turn and see if they match
    if (user.getTag(BattlerTagType.IGNORE_ACCURACY) && (user.getLastXMoves().slice(1).find(() => true)?.targets || []).indexOf(target.getBattlerIndex()) !== -1) {
      return true;
    }

    const hiddenTag = target.getTag(HiddenTag);
    if (hiddenTag && !this.move.getMove().getAttrs(HitsTagAttr).some(hta => hta.tagType === hiddenTag.tagType)) {
      return false;
    }

    const moveAccuracy = new Utils.NumberHolder(this.move.getMove().accuracy);

    applyMoveAttrs(VariableAccuracyAttr, user, target, this.move.getMove(), moveAccuracy);

    if (moveAccuracy.value === -1) {
      return true;
    }

    const isOhko = this.move.getMove().hasAttr(OneHitKOAccuracyAttr);

    if (!isOhko) {
      user.scene.applyModifiers(PokemonMoveAccuracyBoosterModifier, user.isPlayer(), user, moveAccuracy);
    }

    if (this.scene.arena.weather?.weatherType === WeatherType.FOG) {
      moveAccuracy.value = Math.floor(moveAccuracy.value * 0.9);
    }

    if (!isOhko && this.scene.arena.getTag(ArenaTagType.GRAVITY)) {
      moveAccuracy.value = Math.floor(moveAccuracy.value * 1.67);
    }

    const userAccuracyLevel = new Utils.IntegerHolder(user.summonData.battleStats[BattleStat.ACC]);
    const targetEvasionLevel = new Utils.IntegerHolder(target.summonData.battleStats[BattleStat.EVA]);
    applyAbAttrs(IgnoreOpponentStatChangesAbAttr, target, null, userAccuracyLevel);
    applyAbAttrs(IgnoreOpponentStatChangesAbAttr, user, null, targetEvasionLevel);
    applyAbAttrs(IgnoreOpponentEvasionAbAttr, user, null, targetEvasionLevel);
    applyMoveAttrs(IgnoreOpponentStatChangesAttr, user, target, this.move.getMove(), targetEvasionLevel);
    this.scene.applyModifiers(TempBattleStatBoosterModifier, this.player, TempBattleStat.ACC, userAccuracyLevel);

    const rand = user.randSeedInt(100, 1);

    const accuracyMultiplier = new Utils.NumberHolder(1);
    if (userAccuracyLevel.value !== targetEvasionLevel.value) {
      accuracyMultiplier.value = userAccuracyLevel.value > targetEvasionLevel.value
        ? (3 + Math.min(userAccuracyLevel.value - targetEvasionLevel.value, 6)) / 3
        : 3 / (3 + Math.min(targetEvasionLevel.value - userAccuracyLevel.value, 6));
    }

    applyBattleStatMultiplierAbAttrs(BattleStatMultiplierAbAttr, user, BattleStat.ACC, accuracyMultiplier, this.move.getMove());

    const evasionMultiplier = new Utils.NumberHolder(1);
    applyBattleStatMultiplierAbAttrs(BattleStatMultiplierAbAttr, this.getTarget(), BattleStat.EVA, evasionMultiplier);

    accuracyMultiplier.value /= evasionMultiplier.value;

    return rand <= moveAccuracy.value * accuracyMultiplier.value;
  }

  getUserPokemon(): Pokemon {
    if (this.battlerIndex > BattlerIndex.ENEMY_2) {
      return this.scene.getPokemonById(this.battlerIndex);
    }
    return (this.player ? this.scene.getPlayerField() : this.scene.getEnemyField())[this.fieldIndex];
  }

  getTargets(): Pokemon[] {
    return this.scene.getField(true).filter(p => this.targets.indexOf(p.getBattlerIndex()) > -1);
  }

  getTarget(): Pokemon {
    return this.getTargets().find(() => true);
  }

  getNewHitPhase() {
    return new MoveEffectPhase(this.scene, this.battlerIndex, this.targets, this.move);
  }
}

export class MoveEndPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    if (pokemon.isActive(true)) {
      pokemon.lapseTags(BattlerTagLapseType.AFTER_MOVE);
    }

    this.scene.arena.setIgnoreAbilities(false);

    this.end();
  }
}

export class MoveAnimTestPhase extends BattlePhase {
  private moveQueue: Moves[];

  constructor(scene: BattleScene, moveQueue?: Moves[]) {
    super(scene);

    this.moveQueue = moveQueue || Utils.getEnumValues(Moves).slice(1);
  }

  start() {
    const moveQueue = this.moveQueue.slice(0);
    this.playMoveAnim(moveQueue, true);
  }

  playMoveAnim(moveQueue: Moves[], player: boolean) {
    const moveId = player ? moveQueue[0] : moveQueue.shift();
    if (moveId === undefined) {
      this.playMoveAnim(this.moveQueue.slice(0), true);
      return;
    } else if (player) {
      console.log(Moves[moveId]);
    }

    initMoveAnim(this.scene, moveId).then(() => {
      loadMoveAnimAssets(this.scene, [ moveId ], true)
        .then(() => {
          new MoveAnim(moveId, player ? this.scene.getPlayerPokemon() : this.scene.getEnemyPokemon(), (player !== (allMoves[moveId] instanceof SelfStatusMove) ? this.scene.getEnemyPokemon() : this.scene.getPlayerPokemon()).getBattlerIndex()).play(this.scene, () => {
            if (player) {
              this.playMoveAnim(moveQueue, false);
            } else {
              this.playMoveAnim(moveQueue, true);
            }
          });
        });
    });
  }
}

export class ShowAbilityPhase extends PokemonPhase {
  private passive: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, passive: boolean = false) {
    super(scene, battlerIndex);

    this.passive = passive;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();

    this.scene.abilityBar.showAbility(pokemon, this.passive);
    if (pokemon.battleData) {
      pokemon.battleData.abilityRevealed = true;
    }

    this.end();
  }
}

export class StatChangePhase extends PokemonPhase {
  private stats: BattleStat[];
  private selfTarget: boolean;
  private levels: integer;
  private showMessage: boolean;
  private ignoreAbilities: boolean;
  private canBeCopied: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, selfTarget: boolean, stats: BattleStat[], levels: integer, showMessage: boolean = true, ignoreAbilities: boolean = false, canBeCopied: boolean = true) {
    super(scene, battlerIndex);

    this.selfTarget = selfTarget;
    this.stats = stats;
    this.levels = levels;
    this.showMessage = showMessage;
    this.ignoreAbilities = ignoreAbilities;
    this.canBeCopied = canBeCopied;
  }

  start() {
    const pokemon = this.getPokemon();

    let random = false;

    if (this.stats.length === 1 && this.stats[0] === BattleStat.RAND) {
      this.stats[0] = this.getRandomStat();
      random = true;
    }

    this.aggregateStatChanges(random);

    if (!pokemon.isActive(true)) {
      return this.end();
    }

    const filteredStats = this.stats.map(s => s !== BattleStat.RAND ? s : this.getRandomStat()).filter(stat => {
      const cancelled = new Utils.BooleanHolder(false);

      if (!this.selfTarget && this.levels < 0) {
        this.scene.arena.applyTagsForSide(MistTag, pokemon.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY, cancelled);
      }

      if (!cancelled.value && !this.selfTarget && this.levels < 0) {
        applyPreStatChangeAbAttrs(ProtectStatAbAttr, this.getPokemon(), stat, cancelled);
      }

      return !cancelled.value;
    });

    const levels = new Utils.IntegerHolder(this.levels);

    if (!this.ignoreAbilities) {
      applyAbAttrs(StatChangeMultiplierAbAttr, pokemon, null, levels);
    }

    const battleStats = this.getPokemon().summonData.battleStats;
    const relLevels = filteredStats.map(stat => (levels.value >= 1 ? Math.min(battleStats[stat] + levels.value, 6) : Math.max(battleStats[stat] + levels.value, -6)) - battleStats[stat]);

    const end = () => {
      if (this.showMessage) {
        const messages = this.getStatChangeMessages(filteredStats, levels.value, relLevels);
        for (const message of messages) {
          this.scene.queueMessage(message);
        }
      }

      for (const stat of filteredStats) {
        pokemon.summonData.battleStats[stat] = Math.max(Math.min(pokemon.summonData.battleStats[stat] + levels.value, 6), -6);
      }

      if (levels.value > 0 && this.canBeCopied) {
        for (const opponent of pokemon.getOpponents()) {
          applyAbAttrs(StatChangeCopyAbAttr, opponent, null, this.stats, levels.value);
        }
      }

      applyPostStatChangeAbAttrs(PostStatChangeAbAttr, pokemon, filteredStats, this.levels, this.selfTarget);

      pokemon.updateInfo();

      handleTutorial(this.scene, Tutorial.Stat_Change).then(() => super.end());
    };

    if (relLevels.filter(l => l).length && this.scene.moveAnimations) {
      pokemon.enableMask();
      const pokemonMaskSprite = pokemon.maskSprite;

      const tileX = (this.player ? 106 : 236) * pokemon.getSpriteScale() * this.scene.field.scale;
      const tileY = ((this.player ? 148 : 84) + (levels.value >= 1 ? 160 : 0)) * pokemon.getSpriteScale() * this.scene.field.scale;
      const tileWidth = 156 * this.scene.field.scale * pokemon.getSpriteScale();
      const tileHeight = 316 * this.scene.field.scale * pokemon.getSpriteScale();

      // On increase, show the red sprite located at ATK
      // On decrease, show the blue sprite located at SPD
      const spriteColor = levels.value >= 1 ? BattleStat[BattleStat.ATK].toLowerCase() : BattleStat[BattleStat.SPD].toLowerCase();
      const statSprite = this.scene.add.tileSprite(tileX, tileY, tileWidth, tileHeight, "battle_stats", spriteColor);
      statSprite.setPipeline(this.scene.fieldSpritePipeline);
      statSprite.setAlpha(0);
      statSprite.setScale(6);
      statSprite.setOrigin(0.5, 1);

      this.scene.playSound(`stat_${levels.value >= 1 ? "up" : "down"}`);

      statSprite.setMask(new Phaser.Display.Masks.BitmapMask(this.scene, pokemonMaskSprite));

      this.scene.tweens.add({
        targets: statSprite,
        duration: 250,
        alpha: 0.8375,
        onComplete: () => {
          this.scene.tweens.add({
            targets: statSprite,
            delay: 1000,
            duration: 250,
            alpha: 0
          });
        }
      });

      this.scene.tweens.add({
        targets: statSprite,
        duration: 1500,
        y: `${levels.value >= 1 ? "-" : "+"}=${160 * 6}`
      });

      this.scene.time.delayedCall(1750, () => {
        pokemon.disableMask();
        end();
      });
    } else {
      end();
    }
  }

  getRandomStat(): BattleStat {
    const allStats = Utils.getEnumValues(BattleStat);
    return allStats[this.getPokemon().randSeedInt(BattleStat.SPD + 1)];
  }

  aggregateStatChanges(random: boolean = false): void {
    const isAccEva = [ BattleStat.ACC, BattleStat.EVA ].some(s => this.stats.includes(s));
    let existingPhase: StatChangePhase;
    if (this.stats.length === 1) {
      while ((existingPhase = (this.scene.findPhase(p => p instanceof StatChangePhase && p.battlerIndex === this.battlerIndex && p.stats.length === 1
        && (p.stats[0] === this.stats[0] || (random && p.stats[0] === BattleStat.RAND))
        && p.selfTarget === this.selfTarget && p.showMessage === this.showMessage && p.ignoreAbilities === this.ignoreAbilities) as StatChangePhase))) {
        if (existingPhase.stats[0] === BattleStat.RAND) {
          existingPhase.stats[0] = this.getRandomStat();
          if (existingPhase.stats[0] !== this.stats[0]) {
            continue;
          }
        }
        this.levels += existingPhase.levels;

        if (!this.scene.tryRemovePhase(p => p === existingPhase)) {
          break;
        }
      }
    }
    while ((existingPhase = (this.scene.findPhase(p => p instanceof StatChangePhase && p.battlerIndex === this.battlerIndex && p.selfTarget === this.selfTarget
      && ([ BattleStat.ACC, BattleStat.EVA ].some(s => p.stats.includes(s)) === isAccEva)
      && p.levels === this.levels && p.showMessage === this.showMessage && p.ignoreAbilities === this.ignoreAbilities) as StatChangePhase))) {
      this.stats.push(...existingPhase.stats);
      if (!this.scene.tryRemovePhase(p => p === existingPhase)) {
        break;
      }
    }
  }

  getStatChangeMessages(stats: BattleStat[], levels: integer, relLevels: integer[]): string[] {
    const messages: string[] = [];

    const relLevelStatIndexes = {};
    for (let rl = 0; rl < relLevels.length; rl++) {
      const relLevel = relLevels[rl];
      if (!relLevelStatIndexes[relLevel]) {
        relLevelStatIndexes[relLevel] = [];
      }
      relLevelStatIndexes[relLevel].push(rl);
    }

    Object.keys(relLevelStatIndexes).forEach(rl => {
      const relLevelStats = stats.filter((_, i) => relLevelStatIndexes[rl].includes(i));
      let statsFragment = "";

      if (relLevelStats.length > 1) {
        statsFragment = relLevelStats.length >= 5
          ? "stats"
          : `${relLevelStats.slice(0, -1).map(s => getBattleStatName(s)).join(", ")}${relLevelStats.length > 2 ? "," : ""} and ${getBattleStatName(relLevelStats[relLevelStats.length - 1])}`;
      } else {
        statsFragment = getBattleStatName(relLevelStats[0]);
      }
      messages.push(getPokemonMessage(this.getPokemon(), `'s ${statsFragment} ${getBattleStatLevelChangeDescription(Math.abs(parseInt(rl)), levels >= 1)}!`));
    });

    return messages;
  }
}

export class WeatherEffectPhase extends CommonAnimPhase {
  public weather: Weather;

  constructor(scene: BattleScene) {
    super(scene, undefined, undefined, CommonAnim.SUNNY + ((scene?.arena?.weather?.weatherType || WeatherType.NONE) - 1));
    this.weather = scene?.arena?.weather;
  }

  start() {
    // Update weather state with any changes that occurred during the turn
    this.weather = this.scene?.arena?.weather;

    if (!this.weather) {
      this.end();
      return;
    }

    this.setAnimation(CommonAnim.SUNNY + (this.weather.weatherType - 1));

    if (this.weather.isDamaging()) {

      const cancelled = new Utils.BooleanHolder(false);

      this.executeForAll((pokemon: Pokemon) => applyPreWeatherEffectAbAttrs(SuppressWeatherEffectAbAttr, pokemon, this.weather, cancelled));

      if (!cancelled.value) {
        const inflictDamage = (pokemon: Pokemon) => {
          const cancelled = new Utils.BooleanHolder(false);

          applyPreWeatherEffectAbAttrs(PreWeatherDamageAbAttr, pokemon, this.weather, cancelled);
          applyAbAttrs(BlockNonDirectDamageAbAttr, pokemon, cancelled);

          if (cancelled.value) {
            return;
          }

          const damage = Math.ceil(pokemon.getMaxHp() / 16);

          this.scene.queueMessage(getWeatherDamageMessage(this.weather.weatherType, pokemon));
          pokemon.damageAndUpdate(damage, HitResult.EFFECTIVE, false, false, true);
        };

        this.executeForAll((pokemon: Pokemon) => {
          const immune = !pokemon || !!pokemon.getTypes(true, true).filter(t => this.weather.isTypeDamageImmune(t)).length;
          if (!immune) {
            inflictDamage(pokemon);
          }
        });
      }
    }

    this.scene.ui.showText(getWeatherLapseMessage(this.weather.weatherType), null, () => {
      this.executeForAll((pokemon: Pokemon) => applyPostWeatherLapseAbAttrs(PostWeatherLapseAbAttr, pokemon, this.weather));

      super.start();
    });
  }
}

export class ObtainStatusEffectPhase extends PokemonPhase {
  private statusEffect: StatusEffect;
  private cureTurn: integer;
  private sourceText: string;
  private sourcePokemon: Pokemon;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, statusEffect: StatusEffect, cureTurn?: integer, sourceText?: string, sourcePokemon?: Pokemon) {
    super(scene, battlerIndex);

    this.statusEffect = statusEffect;
    this.cureTurn = cureTurn;
    this.sourceText = sourceText;
    this.sourcePokemon = sourcePokemon; // For tracking which Pokemon caused the status effect
  }

  start() {
    const pokemon = this.getPokemon();
    if (!pokemon.status) {
      if (pokemon.trySetStatus(this.statusEffect, false, this.sourcePokemon)) {
        if (this.cureTurn) {
          pokemon.status.cureTurn = this.cureTurn;
        }
        pokemon.updateInfo(true);
        new CommonBattleAnim(CommonAnim.POISON + (this.statusEffect - 1), pokemon).play(this.scene, () => {
          this.scene.queueMessage(getPokemonMessage(pokemon, getStatusEffectObtainText(this.statusEffect, this.sourceText)));
          if (pokemon.status.isPostTurn()) {
            this.scene.pushPhase(new PostTurnStatusEffectPhase(this.scene, this.battlerIndex));
          }
          this.end();
        });
        return;
      }
    } else if (pokemon.status.effect === this.statusEffect) {
      this.scene.queueMessage(getPokemonMessage(pokemon, getStatusEffectOverlapText(this.statusEffect)));
    }
    this.end();
  }
}

export class PostTurnStatusEffectPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    const pokemon = this.getPokemon();
    if (pokemon?.isActive(true) && pokemon.status && pokemon.status.isPostTurn()) {
      pokemon.status.incrementTurn();
      const cancelled = new Utils.BooleanHolder(false);
      applyAbAttrs(BlockNonDirectDamageAbAttr, pokemon, cancelled);

      if (!cancelled.value) {
        this.scene.queueMessage(getPokemonMessage(pokemon, getStatusEffectActivationText(pokemon.status.effect)));
        let damage: integer = 0;
        switch (pokemon.status.effect) {
        case StatusEffect.POISON:
          damage = Math.max(pokemon.getMaxHp() >> 3, 1);
          break;
        case StatusEffect.TOXIC:
          damage = Math.max(Math.floor((pokemon.getMaxHp() / 16) * pokemon.status.turnCount), 1);
          break;
        case StatusEffect.BURN:
          damage = Math.max(pokemon.getMaxHp() >> 4, 1);
          break;
        }
        if (damage) {
		  // Set preventEndure flag to avoid pokemon surviving thanks to focus band, sturdy, endure ...
          this.scene.damageNumberHandler.add(this.getPokemon(), pokemon.damage(damage, false, true));
          pokemon.updateInfo();
        }
        new CommonBattleAnim(CommonAnim.POISON + (pokemon.status.effect - 1), pokemon).play(this.scene, () => this.end());
      } else {
        this.end();
      }
    } else {
      this.end();
    }
  }
}

export class MessagePhase extends Phase {
  private text: string;
  private callbackDelay: integer;
  private prompt: boolean;
  private promptDelay: integer;

  constructor(scene: BattleScene, text: string, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    super(scene);

    this.text = text;
    this.callbackDelay = callbackDelay;
    this.prompt = prompt;
    this.promptDelay = promptDelay;
  }

  start() {
    super.start();

    if (this.text.indexOf("$") > -1) {
      const pageIndex = this.text.indexOf("$");
      this.scene.unshiftPhase(new MessagePhase(this.scene, this.text.slice(pageIndex + 1), this.callbackDelay, this.prompt, this.promptDelay));
      this.text = this.text.slice(0, pageIndex).trim();
    }

    this.scene.ui.showText(this.text, null, () => this.end(), this.callbackDelay || (this.prompt ? 0 : 1500), this.prompt, this.promptDelay);
  }

  end() {
    if (this.scene.abilityBar.shown) {
      this.scene.abilityBar.hide();
    }

    super.end();
  }
}

export class DamagePhase extends PokemonPhase {
  private amount: integer;
  private damageResult: DamageResult;
  private critical: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, amount: integer, damageResult?: DamageResult, critical: boolean = false) {
    super(scene, battlerIndex);

    this.amount = amount;
    this.damageResult = damageResult || HitResult.EFFECTIVE;
    this.critical = critical;
  }

  start() {
    super.start();

    if (this.damageResult === HitResult.ONE_HIT_KO) {
      this.scene.toggleInvert(true);
      this.scene.time.delayedCall(Utils.fixedInt(1000), () => {
        this.scene.toggleInvert(false);
        this.applyDamage();
      });
      return;
    }

    this.applyDamage();
  }

  updateAmount(amount: integer): void {
    this.amount = amount;
  }

  applyDamage() {
    switch (this.damageResult) {
    case HitResult.EFFECTIVE:
      this.scene.playSound("hit");
      break;
    case HitResult.SUPER_EFFECTIVE:
    case HitResult.ONE_HIT_KO:
      this.scene.playSound("hit_strong");
      break;
    case HitResult.NOT_VERY_EFFECTIVE:
      this.scene.playSound("hit_weak");
      break;
    }

    if (this.amount) {
      this.scene.damageNumberHandler.add(this.getPokemon(), this.amount, this.damageResult, this.critical);
    }

    if (this.damageResult !== HitResult.OTHER) {
      const flashTimer = this.scene.time.addEvent({
        delay: 100,
        repeat: 5,
        startAt: 200,
        callback: () => {
          this.getPokemon().getSprite().setVisible(flashTimer.repeatCount % 2 === 0);
          if (!flashTimer.repeatCount) {
            this.getPokemon().updateInfo().then(() => this.end());
          }
        }
      });
    } else {
      this.getPokemon().updateInfo().then(() => this.end());
    }
  }

  end() {
    switch (this.scene.currentBattle.battleSpec) {
    case BattleSpec.FINAL_BOSS:
      const pokemon = this.getPokemon();
      if (pokemon instanceof EnemyPokemon && pokemon.isBoss() && !pokemon.formIndex && pokemon.bossSegmentIndex < 1) {
        this.scene.fadeOutBgm(Utils.fixedInt(2000), false);
        this.scene.ui.showDialogue(battleSpecDialogue[BattleSpec.FINAL_BOSS].firstStageWin, pokemon.species.name, null, () => {
          this.scene.addEnemyModifier(getModifierType(modifierTypes.MINI_BLACK_HOLE).newModifier(pokemon) as PersistentModifier, false, true);
          pokemon.generateAndPopulateMoveset(1);
          this.scene.setFieldScale(0.75);
          this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeManualTrigger, false);
          this.scene.currentBattle.double = true;
          const availablePartyMembers = this.scene.getParty().filter(p => p.isAllowedInBattle());
          if (availablePartyMembers.length > 1) {
            this.scene.pushPhase(new ToggleDoublePositionPhase(this.scene, true));
            if (!availablePartyMembers[1].isOnField()) {
              this.scene.pushPhase(new SummonPhase(this.scene, 1));
            }
          }

          super.end();
        });
        return;
      }
      break;
    }

    super.end();
  }
}

export class FaintPhase extends PokemonPhase {
  private preventEndure: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, preventEndure?: boolean) {
    super(scene, battlerIndex);

    this.preventEndure = preventEndure;
  }

  start() {
    super.start();

    if (!this.preventEndure) {
      const instantReviveModifier = this.scene.applyModifier(PokemonInstantReviveModifier, this.player, this.getPokemon()) as PokemonInstantReviveModifier;

      if (instantReviveModifier) {
        if (!--instantReviveModifier.stackCount) {
          this.scene.removeModifier(instantReviveModifier);
        }
        this.scene.updateModifiers(this.player);
        return this.end();
      }
    }

    if (!this.tryOverrideForBattleSpec()) {
      this.doFaint();
    }
  }

  doFaint(): void {
    const pokemon = this.getPokemon();

    // Track total times pokemon have been KO'd for supreme overlord/last respects
    if (pokemon.isPlayer()) {
      this.scene.currentBattle.playerFaints += 1;
    } else {
      this.scene.currentBattle.enemyFaints += 1;
    }

    this.scene.queueMessage(i18next.t("battle:fainted", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }), null, true);

    if (pokemon.turnData?.attacksReceived?.length) {
      const lastAttack = pokemon.turnData.attacksReceived[0];
      applyPostFaintAbAttrs(PostFaintAbAttr, pokemon, this.scene.getPokemonById(lastAttack.sourceId), new PokemonMove(lastAttack.move).getMove(), lastAttack.result);
    }

    const alivePlayField = this.scene.getField(true);
    alivePlayField.forEach(p => applyPostKnockOutAbAttrs(PostKnockOutAbAttr, p, pokemon));
    if (pokemon.turnData?.attacksReceived?.length) {
      const defeatSource = this.scene.getPokemonById(pokemon.turnData.attacksReceived[0].sourceId);
      if (defeatSource?.isOnField()) {
        applyPostVictoryAbAttrs(PostVictoryAbAttr, defeatSource);
        const pvmove = allMoves[pokemon.turnData.attacksReceived[0].move];
        const pvattrs = pvmove.getAttrs(PostVictoryStatChangeAttr);
        if (pvattrs.length) {
          for (const pvattr of pvattrs) {
            pvattr.applyPostVictory(defeatSource, defeatSource, pvmove);
          }
        }
      }
    }

    if (this.player) {
      const nonFaintedLegalPartyMembers = this.scene.getParty().filter(p => p.isAllowedInBattle());
      const nonFaintedPartyMemberCount = nonFaintedLegalPartyMembers.length;
      if (!nonFaintedPartyMemberCount) {
        this.scene.unshiftPhase(new GameOverPhase(this.scene));
      } else if (nonFaintedPartyMemberCount >= this.scene.currentBattle.getBattlerCount() || (this.scene.currentBattle.double && !nonFaintedLegalPartyMembers[0].isActive(true))) {
        this.scene.pushPhase(new SwitchPhase(this.scene, this.fieldIndex, true, false));
      }
      if (nonFaintedPartyMemberCount === 1 && this.scene.currentBattle.double) {
        this.scene.unshiftPhase(new ToggleDoublePositionPhase(this.scene, true));
      }
    } else {
      this.scene.unshiftPhase(new VictoryPhase(this.scene, this.battlerIndex));
      if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
        const hasReservePartyMember = !!this.scene.getEnemyParty().filter(p => p.isActive() && !p.isOnField() && p.trainerSlot === (pokemon as EnemyPokemon).trainerSlot).length;
        if (hasReservePartyMember) {
          this.scene.pushPhase(new SwitchSummonPhase(this.scene, this.fieldIndex, -1, false, false, false));
        }
      }
    }

    if (this.scene.currentBattle.double) {
      const allyPokemon = pokemon.getAlly();
      if (allyPokemon?.isActive(true)) {
        let targetingMovePhase: MovePhase;
        do {
          targetingMovePhase = this.scene.findPhase(mp => mp instanceof MovePhase && mp.targets.length === 1 && mp.targets[0] === pokemon.getBattlerIndex() && mp.pokemon.isPlayer() !== allyPokemon.isPlayer()) as MovePhase;
          if (targetingMovePhase && targetingMovePhase.targets[0] !== allyPokemon.getBattlerIndex()) {
            targetingMovePhase.targets[0] = allyPokemon.getBattlerIndex();
          }
        } while (targetingMovePhase);
      }
    }

    pokemon.lapseTags(BattlerTagLapseType.FAINT);
    this.scene.getField(true).filter(p => p !== pokemon).forEach(p => p.removeTagsBySourceId(pokemon.id));

    pokemon.faintCry(() => {
      if (pokemon instanceof PlayerPokemon) {
        pokemon.addFriendship(-10);
      }
      pokemon.hideInfo();
      this.scene.playSound("faint");
      this.scene.tweens.add({
        targets: pokemon,
        duration: 500,
        y: pokemon.y + 150,
        ease: "Sine.easeIn",
        onComplete: () => {
          pokemon.setVisible(false);
          pokemon.y -= 150;
          pokemon.trySetStatus(StatusEffect.FAINT);
          if (pokemon.isPlayer()) {
            this.scene.currentBattle.removeFaintedParticipant(pokemon as PlayerPokemon);
          } else {
            this.scene.addFaintedEnemyScore(pokemon as EnemyPokemon);
            this.scene.currentBattle.addPostBattleLoot(pokemon as EnemyPokemon);
          }
          this.scene.field.remove(pokemon);
          this.end();
        }
      });
    });
  }

  tryOverrideForBattleSpec(): boolean {
    switch (this.scene.currentBattle.battleSpec) {
    case BattleSpec.FINAL_BOSS:
      if (!this.player) {
        const enemy = this.getPokemon();
        if (enemy.formIndex) {
          this.scene.ui.showDialogue(battleSpecDialogue[BattleSpec.FINAL_BOSS].secondStageWin, enemy.species.name, null, () => this.doFaint());
        } else {
          // Final boss' HP threshold has been bypassed; cancel faint and force check for 2nd phase
          enemy.hp++;
          this.scene.unshiftPhase(new DamagePhase(this.scene, enemy.getBattlerIndex(), 0, HitResult.OTHER));
          this.end();
        }
        return true;
      }
    }

    return false;
  }
}

export class VictoryPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    super.start();

    this.scene.gameData.gameStats.pokemonDefeated++;

    const participantIds = this.scene.currentBattle.playerParticipantIds;
    const party = this.scene.getParty();
    const expShareModifier = this.scene.findModifier(m => m instanceof ExpShareModifier) as ExpShareModifier;
    const expBalanceModifier = this.scene.findModifier(m => m instanceof ExpBalanceModifier) as ExpBalanceModifier;
    const multipleParticipantExpBonusModifier = this.scene.findModifier(m => m instanceof MultipleParticipantExpBonusModifier) as MultipleParticipantExpBonusModifier;
    const nonFaintedPartyMembers = party.filter(p => p.hp);
    const expPartyMembers = nonFaintedPartyMembers.filter(p => p.level < this.scene.getMaxExpLevel());
    const partyMemberExp = [];

    if (participantIds.size) {
      let expValue = this.getPokemon().getExpValue();
      if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
        expValue = Math.floor(expValue * 1.5);
      }
      for (const partyMember of nonFaintedPartyMembers) {
        const pId = partyMember.id;
        const participated = participantIds.has(pId);
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
          expMultiplier += (1 / participantIds.size);
          if (participantIds.size > 1 && multipleParticipantExpBonusModifier) {
            expMultiplier += multipleParticipantExpBonusModifier.getStackCount() * 0.2;
          }
        } else if (expShareModifier) {
          expMultiplier += (expShareModifier.getStackCount() * 0.2) / participantIds.size;
        }
        if (partyMember.pokerus) {
          expMultiplier *= 1.5;
        }
        if (Overrides.XP_MULTIPLIER_OVERRIDE !== null) {
          expMultiplier = Overrides.XP_MULTIPLIER_OVERRIDE;
        }
        const pokemonExp = new Utils.NumberHolder(expValue * expMultiplier);
        this.scene.applyModifiers(PokemonExpBoosterModifier, true, partyMember, pokemonExp);
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
          this.scene.unshiftPhase(expPartyMembers[pm].isOnField() ? new ExpPhase(this.scene, partyMemberIndex, exp) : new ShowPartyExpBarPhase(this.scene, partyMemberIndex, exp));
        }
      }
    }

    if (!this.scene.getEnemyParty().find(p => this.scene.currentBattle.battleType ? !p?.isFainted(true) : p.isOnField())) {
      this.scene.pushPhase(new BattleEndPhase(this.scene));
      if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
        this.scene.pushPhase(new TrainerVictoryPhase(this.scene));
      }
      if (this.scene.gameMode.isEndless || !this.scene.gameMode.isWaveFinal(this.scene.currentBattle.waveIndex)) {
        this.scene.pushPhase(new EggLapsePhase(this.scene));
        if (this.scene.currentBattle.waveIndex % 10) {
          this.scene.pushPhase(new SelectModifierPhase(this.scene));
        } else if (this.scene.gameMode.isDaily) {
          this.scene.pushPhase(new ModifierRewardPhase(this.scene, modifierTypes.EXP_CHARM));
          if (this.scene.currentBattle.waveIndex > 10 && !this.scene.gameMode.isWaveFinal(this.scene.currentBattle.waveIndex)) {
            this.scene.pushPhase(new ModifierRewardPhase(this.scene, modifierTypes.GOLDEN_POKEBALL));
          }
        } else {
          const superExpWave = !this.scene.gameMode.isEndless ? (this.scene.offsetGym ? 0 : 20) : 10;
          if (this.scene.gameMode.isEndless && this.scene.currentBattle.waveIndex === 10) {
            this.scene.pushPhase(new ModifierRewardPhase(this.scene, modifierTypes.EXP_SHARE));
          }
          if (this.scene.currentBattle.waveIndex <= 750 && (this.scene.currentBattle.waveIndex <= 500 || (this.scene.currentBattle.waveIndex % 30) === superExpWave)) {
            this.scene.pushPhase(new ModifierRewardPhase(this.scene, (this.scene.currentBattle.waveIndex % 30) !== superExpWave || this.scene.currentBattle.waveIndex > 250 ? modifierTypes.EXP_CHARM : modifierTypes.SUPER_EXP_CHARM));
          }
          if (this.scene.currentBattle.waveIndex <= 150 && !(this.scene.currentBattle.waveIndex % 50)) {
            this.scene.pushPhase(new ModifierRewardPhase(this.scene, modifierTypes.GOLDEN_POKEBALL));
          }
          if (this.scene.gameMode.isEndless && !(this.scene.currentBattle.waveIndex % 50)) {
            this.scene.pushPhase(new ModifierRewardPhase(this.scene, !(this.scene.currentBattle.waveIndex % 250) ? modifierTypes.VOUCHER_PREMIUM : modifierTypes.VOUCHER_PLUS));
            this.scene.pushPhase(new AddEnemyBuffModifierPhase(this.scene));
          }
        }
        this.scene.pushPhase(new NewBattlePhase(this.scene));
      } else {
        this.scene.currentBattle.battleType = BattleType.CLEAR;
        this.scene.score += this.scene.gameMode.getClearScoreBonus();
        this.scene.updateScoreText();
        this.scene.pushPhase(new GameOverPhase(this.scene, true));
      }
    }

    this.end();
  }
}

export class TrainerVictoryPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    this.scene.disableMenu = true;

    this.scene.playBgm(this.scene.currentBattle.trainer.config.victoryBgm);

    this.scene.unshiftPhase(new MoneyRewardPhase(this.scene, this.scene.currentBattle.trainer.config.moneyMultiplier));

    const modifierRewardFuncs = this.scene.currentBattle.trainer.config.modifierRewardFuncs;
    for (const modifierRewardFunc of modifierRewardFuncs) {
      this.scene.unshiftPhase(new ModifierRewardPhase(this.scene, modifierRewardFunc));
    }

    const trainerType = this.scene.currentBattle.trainer.config.trainerType;
    if (vouchers.hasOwnProperty(TrainerType[trainerType])) {
      if (!this.scene.validateVoucher(vouchers[TrainerType[trainerType]]) && this.scene.currentBattle.trainer.config.isBoss) {
        this.scene.unshiftPhase(new ModifierRewardPhase(this.scene, [ modifierTypes.VOUCHER, modifierTypes.VOUCHER, modifierTypes.VOUCHER_PLUS, modifierTypes.VOUCHER_PREMIUM ][vouchers[TrainerType[trainerType]].voucherType]));
      }
    }

    this.scene.ui.showText(i18next.t("battle:trainerDefeated", { trainerName: this.scene.currentBattle.trainer.getName(TrainerSlot.NONE, true) }), null, () => {
      const victoryMessages = this.scene.currentBattle.trainer.getVictoryMessages();
      let message: string;
      this.scene.executeWithSeedOffset(() => message = Utils.randSeedItem(victoryMessages), this.scene.currentBattle.waveIndex);

      const showMessage = () => {
        const originalFunc = showMessageOrEnd;
        showMessageOrEnd = () => this.scene.ui.showDialogue(message, this.scene.currentBattle.trainer.getName(), null, originalFunc);

        showMessageOrEnd();
      };
      let showMessageOrEnd = () => this.end();
      if (victoryMessages?.length) {
        if (this.scene.currentBattle.trainer.config.hasCharSprite && !this.scene.ui.shouldSkipDialogue(message)) {
          const originalFunc = showMessageOrEnd;
          showMessageOrEnd = () => this.scene.charSprite.hide().then(() => this.scene.hideFieldOverlay(250).then(() => originalFunc()));
          this.scene.showFieldOverlay(500).then(() => this.scene.charSprite.showCharacter(this.scene.currentBattle.trainer.getKey(), getCharVariantFromDialogue(victoryMessages[0])).then(() => showMessage()));
        } else {
          showMessage();
        }
      } else {
        showMessageOrEnd();
      }
    }, null, true);

    this.showEnemyTrainer();
  }
}

export class MoneyRewardPhase extends BattlePhase {
  private moneyMultiplier: number;

  constructor(scene: BattleScene, moneyMultiplier: number) {
    super(scene);

    this.moneyMultiplier = moneyMultiplier;
  }

  start() {
    const moneyAmount = new Utils.IntegerHolder(this.scene.getWaveMoneyAmount(this.moneyMultiplier));

    this.scene.applyModifiers(MoneyMultiplierModifier, true, moneyAmount);

    this.scene.addMoney(moneyAmount.value);

    const userLocale = navigator.language || "en-US";
    const formattedMoneyAmount = moneyAmount.value.toLocaleString(userLocale);
    const message = i18next.t("battle:moneyWon", { moneyAmount: formattedMoneyAmount });

    this.scene.ui.showText(message, null, () => this.end(), null, true);
  }
}

export class ModifierRewardPhase extends BattlePhase {
  protected modifierType: ModifierType;

  constructor(scene: BattleScene, modifierTypeFunc: ModifierTypeFunc) {
    super(scene);

    this.modifierType = getModifierType(modifierTypeFunc);
  }

  start() {
    super.start();

    this.doReward().then(() => this.end());
  }

  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      const newModifier = this.modifierType.newModifier();
      this.scene.addModifier(newModifier).then(() => {
        this.scene.playSound("item_fanfare");
        this.scene.ui.showText(`You received\n${newModifier.type.name}!`, null, () => resolve(), null, true);
      });
    });
  }
}

export class GameOverModifierRewardPhase extends ModifierRewardPhase {
  constructor(scene: BattleScene, modifierTypeFunc: ModifierTypeFunc) {
    super(scene, modifierTypeFunc);
  }

  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      const newModifier = this.modifierType.newModifier();
      this.scene.addModifier(newModifier).then(() => {
        this.scene.playSound("level_up_fanfare");
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.fadeIn(250).then(() => {
          this.scene.ui.showText(`You received\n${newModifier.type.name}!`, null, () => {
            this.scene.time.delayedCall(1500, () => this.scene.arenaBg.setVisible(true));
            resolve();
          }, null, true, 1500);
        });
      });
    });
  }
}

export class RibbonModifierRewardPhase extends ModifierRewardPhase {
  private species: PokemonSpecies;

  constructor(scene: BattleScene, modifierTypeFunc: ModifierTypeFunc, species: PokemonSpecies) {
    super(scene, modifierTypeFunc);

    this.species = species;
  }

  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      const newModifier = this.modifierType.newModifier();
      this.scene.addModifier(newModifier).then(() => {
        this.scene.playSound("level_up_fanfare");
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(`${this.species.name} beat ${this.scene.gameMode.getName()} Mode for the first time!\nYou received ${newModifier.type.name}!`, null, () => {
          resolve();
        }, null, true, 1500);
      });
    });
  }
}

export class GameOverPhase extends BattlePhase {
  private victory: boolean;
  private firstRibbons: PokemonSpecies[] = [];

  constructor(scene: BattleScene, victory?: boolean) {
    super(scene);

    this.victory = !!victory;
  }

  start() {
    super.start();

    // Failsafe if players somehow skip floor 200 in classic mode
    if (this.scene.gameMode.isClassic && this.scene.currentBattle.waveIndex > 200) {
      this.victory = true;
    }

    if (this.victory && this.scene.gameMode.isEndless) {
      this.scene.ui.showDialogue(i18next.t("PGMmiscDialogue:ending_endless"), i18next.t("PGMmiscDialogue:ending_name"), 0, () => this.handleGameOver());
    } else if (this.victory || !this.scene.enableRetries) {
      this.handleGameOver();
    } else {
      this.scene.ui.showText("Would you like to retry from the start of the battle?", null, () => {
        this.scene.ui.setMode(Mode.CONFIRM, () => {
          this.scene.ui.fadeOut(1250).then(() => {
            this.scene.reset();
            this.scene.clearPhaseQueue();
            this.scene.gameData.loadSession(this.scene, this.scene.sessionSlotId).then(() => {
              this.scene.pushPhase(new EncounterPhase(this.scene, true));

              const availablePartyMembers = this.scene.getParty().filter(p => p.isAllowedInBattle()).length;

              this.scene.pushPhase(new SummonPhase(this.scene, 0));
              if (this.scene.currentBattle.double && availablePartyMembers > 1) {
                this.scene.pushPhase(new SummonPhase(this.scene, 1));
              }
              if (this.scene.currentBattle.waveIndex > 1 && this.scene.currentBattle.battleType !== BattleType.TRAINER) {
                this.scene.pushPhase(new CheckSwitchPhase(this.scene, 0, this.scene.currentBattle.double));
                if (this.scene.currentBattle.double && availablePartyMembers > 1) {
                  this.scene.pushPhase(new CheckSwitchPhase(this.scene, 1, this.scene.currentBattle.double));
                }
              }

              this.scene.ui.fadeIn(1250);
              this.end();
            });
          });
        }, () => this.handleGameOver(), false, 0, 0, 1000);
      });
    }
  }

  handleGameOver(): void {
    const doGameOver = (newClear: boolean) => {
      this.scene.disableMenu = true;
      this.scene.time.delayedCall(1000, () => {
        let firstClear = false;
        if (this.victory && newClear) {
          if (this.scene.gameMode.isClassic) {
            firstClear = this.scene.validateAchv(achvs.CLASSIC_VICTORY);
            this.scene.gameData.gameStats.sessionsWon++;
            for (const pokemon of this.scene.getParty()) {
              this.awardRibbon(pokemon);

              if (pokemon.species.getRootSpeciesId() !== pokemon.species.getRootSpeciesId(true)) {
                this.awardRibbon(pokemon, true);
              }
            }
          } else if (this.scene.gameMode.isDaily && newClear) {
            this.scene.gameData.gameStats.dailyRunSessionsWon++;
          }
        }
        const fadeDuration = this.victory ? 10000 : 5000;
        this.scene.fadeOutBgm(fadeDuration, true);
        const activeBattlers = this.scene.getField().filter(p => p?.isActive(true));
        activeBattlers.map(p => p.hideInfo());
        this.scene.ui.fadeOut(fadeDuration).then(() => {
          activeBattlers.map(a => a.setVisible(false));
          this.scene.setFieldScale(1, true);
          this.scene.clearPhaseQueue();
          this.scene.ui.clearText();

          if (this.victory && this.scene.gameMode.isChallenge) {
            this.scene.gameMode.challenges.forEach(c => this.scene.validateAchvs(ChallengeAchv, c));
          }

          const clear = (endCardPhase?: EndCardPhase) => {
            if (newClear) {
              this.handleUnlocks();
            }
            if (this.victory && newClear) {
              for (const species of this.firstRibbons) {
                this.scene.unshiftPhase(new RibbonModifierRewardPhase(this.scene, modifierTypes.VOUCHER_PLUS, species));
              }
              if (!firstClear) {
                this.scene.unshiftPhase(new GameOverModifierRewardPhase(this.scene, modifierTypes.VOUCHER_PREMIUM));
              }
            }
            this.scene.pushPhase(new PostGameOverPhase(this.scene, endCardPhase));
            this.end();
          };

          if (this.victory && this.scene.gameMode.isClassic) {
            const message = miscDialogue.ending[this.scene.gameData.gender === PlayerGender.FEMALE ? 0 : 1];

            if (!this.scene.ui.shouldSkipDialogue(message)) {
              this.scene.ui.fadeIn(500).then(() => {
                this.scene.charSprite.showCharacter(`rival_${this.scene.gameData.gender === PlayerGender.FEMALE ? "m" : "f"}`, getCharVariantFromDialogue(miscDialogue.ending[this.scene.gameData.gender === PlayerGender.FEMALE ? 0 : 1])).then(() => {
                  this.scene.ui.showDialogue(message, this.scene.gameData.gender === PlayerGender.FEMALE ? trainerConfigs[TrainerType.RIVAL].name : trainerConfigs[TrainerType.RIVAL].nameFemale, null, () => {
                    this.scene.ui.fadeOut(500).then(() => {
                      this.scene.charSprite.hide().then(() => {
                        const endCardPhase = new EndCardPhase(this.scene);
                        this.scene.unshiftPhase(endCardPhase);
                        clear(endCardPhase);
                      });
                    });
                  });
                });
              });
            } else {
              const endCardPhase = new EndCardPhase(this.scene);
              this.scene.unshiftPhase(endCardPhase);
              clear(endCardPhase);
            }
          } else {
            clear();
          }
        });
      });
    };

    /* Added a local check to see if the game is running offline on victory
    If Online, execute apiFetch as intended
    If Offline, execute offlineNewClear(), a localStorage implementation of newClear daily run checks */
    if (this.victory) {
      if (!Utils.isLocal) {
        Utils.apiFetch(`savedata/newclear?slot=${this.scene.sessionSlotId}`, true)
          .then(response => response.json())
          .then(newClear => doGameOver(newClear));
      } else {
        this.scene.gameData.offlineNewClear(this.scene).then(result => {
          doGameOver(result);
        });
      }
    } else {
      doGameOver(false);
    }
  }

  handleUnlocks(): void {
    if (this.victory && this.scene.gameMode.isClassic) {
      if (!this.scene.gameData.unlocks[Unlockables.ENDLESS_MODE]) {
        this.scene.unshiftPhase(new UnlockPhase(this.scene, Unlockables.ENDLESS_MODE));
      }
      if (this.scene.getParty().filter(p => p.fusionSpecies).length && !this.scene.gameData.unlocks[Unlockables.SPLICED_ENDLESS_MODE]) {
        this.scene.unshiftPhase(new UnlockPhase(this.scene, Unlockables.SPLICED_ENDLESS_MODE));
      }
      if (!this.scene.gameData.unlocks[Unlockables.MINI_BLACK_HOLE]) {
        this.scene.unshiftPhase(new UnlockPhase(this.scene, Unlockables.MINI_BLACK_HOLE));
      }
    }
  }

  awardRibbon(pokemon: Pokemon, forStarter: boolean = false): void {
    const speciesId = getPokemonSpecies(pokemon.species.speciesId);
    const speciesRibbonCount = this.scene.gameData.incrementRibbonCount(speciesId, forStarter);
    // first time classic win, award voucher
    if (speciesRibbonCount === 1) {
      this.firstRibbons.push(getPokemonSpecies(pokemon.species.getRootSpeciesId(forStarter)));
    }
  }
}

export class EndCardPhase extends Phase {
  public endCard: Phaser.GameObjects.Image;
  public text: Phaser.GameObjects.Text;

  constructor(scene: BattleScene) {
    super(scene);
  }

  start(): void {
    super.start();

    this.scene.ui.getMessageHandler().bg.setVisible(false);
    this.scene.ui.getMessageHandler().nameBoxContainer.setVisible(false);

    this.endCard = this.scene.add.image(0, 0, `end_${this.scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}`);
    this.endCard.setOrigin(0);
    this.endCard.setScale(0.5);
    this.scene.field.add(this.endCard);

    this.text = addTextObject(this.scene, this.scene.game.canvas.width / 12, (this.scene.game.canvas.height / 6) - 16, "Congratulations!", TextStyle.SUMMARY, { fontSize: "128px" });
    this.text.setOrigin(0.5);
    this.scene.field.add(this.text);

    this.scene.ui.clearText();

    this.scene.ui.fadeIn(1000).then(() => {

      this.scene.ui.showText("", null, () => {
        this.scene.ui.getMessageHandler().bg.setVisible(true);
        this.end();
      }, null, true);
    });
  }
}

export class UnlockPhase extends Phase {
  private unlockable: Unlockables;

  constructor(scene: BattleScene, unlockable: Unlockables) {
    super(scene);

    this.unlockable = unlockable;
  }

  start(): void {
    this.scene.time.delayedCall(2000, () => {
      this.scene.gameData.unlocks[this.unlockable] = true;
      this.scene.playSound("level_up_fanfare");
      this.scene.ui.setMode(Mode.MESSAGE);
      this.scene.ui.showText(`${getUnlockableName(this.unlockable)}\nhas been unlocked.`, null, () => {
        this.scene.time.delayedCall(1500, () => this.scene.arenaBg.setVisible(true));
        this.end();
      }, null, true, 1500);
    });
  }
}

export class PostGameOverPhase extends Phase {
  private endCardPhase: EndCardPhase;

  constructor(scene: BattleScene, endCardPhase: EndCardPhase) {
    super(scene);

    this.endCardPhase = endCardPhase;
  }

  start() {
    super.start();

    const saveAndReset = () => {
      this.scene.gameData.saveAll(this.scene, true, true, true).then(success => {
        if (!success) {
          return this.scene.reset(true);
        }
        this.scene.gameData.tryClearSession(this.scene, this.scene.sessionSlotId).then((success: boolean | [boolean, boolean]) => {
          if (!success[0]) {
            return this.scene.reset(true);
          }
          this.scene.reset();
          this.scene.unshiftPhase(new TitlePhase(this.scene));
          this.end();
        });
      });
    };

    if (this.endCardPhase) {
      this.scene.ui.fadeOut(500).then(() => {
        this.scene.ui.getMessageHandler().bg.setVisible(true);

        this.endCardPhase.endCard.destroy();
        this.endCardPhase.text.destroy();
        saveAndReset();
      });
    } else {
      saveAndReset();
    }
  }
}

export class SwitchPhase extends BattlePhase {
  protected fieldIndex: integer;
  private isModal: boolean;
  private doReturn: boolean;

  constructor(scene: BattleScene, fieldIndex: integer, isModal: boolean, doReturn: boolean) {
    super(scene);

    this.fieldIndex = fieldIndex;
    this.isModal = isModal;
    this.doReturn = doReturn;
  }

  start() {
    super.start();

    // Skip modal switch if impossible
    if (this.isModal && !this.scene.getParty().filter(p => p.isAllowedInBattle() && !p.isActive(true)).length) {
      return super.end();
    }

    // Check if there is any space still in field
    if (this.isModal && this.scene.getPlayerField().filter(p => p.isAllowedInBattle() && p.isActive(true)).length >= this.scene.currentBattle.getBattlerCount()) {
      return super.end();
    }

    // Override field index to 0 in case of double battle where 2/3 remaining legal party members fainted at once
    const fieldIndex = this.scene.currentBattle.getBattlerCount() === 1 || this.scene.getParty().filter(p => p.isAllowedInBattle()).length > 1 ? this.fieldIndex : 0;

    this.scene.ui.setMode(Mode.PARTY, this.isModal ? PartyUiMode.FAINT_SWITCH : PartyUiMode.POST_BATTLE_SWITCH, fieldIndex, (slotIndex: integer, option: PartyOption) => {
      if (slotIndex >= this.scene.currentBattle.getBattlerCount() && slotIndex < 6) {
        this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, fieldIndex, slotIndex, this.doReturn, option === PartyOption.PASS_BATON));
      }
      this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
    }, PartyUiHandler.FilterNonFainted);
  }
}

export class ExpPhase extends PlayerPartyMemberPokemonPhase {
  private expValue: number;

  constructor(scene: BattleScene, partyMemberIndex: integer, expValue: number) {
    super(scene, partyMemberIndex);

    this.expValue = expValue;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    const exp = new Utils.NumberHolder(this.expValue);
    this.scene.applyModifiers(ExpBoosterModifier, true, exp);
    exp.value = Math.floor(exp.value);
    this.scene.ui.showText(i18next.t("battle:expGain", { pokemonName: pokemon.name, exp: exp.value }), null, () => {
      const lastLevel = pokemon.level;
      pokemon.addExp(exp.value);
      const newLevel = pokemon.level;
      if (newLevel > lastLevel) {
        this.scene.unshiftPhase(new LevelUpPhase(this.scene, this.partyMemberIndex, lastLevel, newLevel));
      }
      pokemon.updateInfo().then(() => this.end());
    }, null, true);
  }
}

export class ShowPartyExpBarPhase extends PlayerPartyMemberPokemonPhase {
  private expValue: number;

  constructor(scene: BattleScene, partyMemberIndex: integer, expValue: number) {
    super(scene, partyMemberIndex);

    this.expValue = expValue;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    const exp = new Utils.NumberHolder(this.expValue);
    this.scene.applyModifiers(ExpBoosterModifier, true, exp);
    exp.value = Math.floor(exp.value);

    const lastLevel = pokemon.level;
    pokemon.addExp(exp.value);
    const newLevel = pokemon.level;
    if (newLevel > lastLevel) {
      this.scene.unshiftPhase(new LevelUpPhase(this.scene, this.partyMemberIndex, lastLevel, newLevel));
    }
    this.scene.unshiftPhase(new HidePartyExpBarPhase(this.scene));
    pokemon.updateInfo();

    if (this.scene.expParty === ExpNotification.SKIP) {
      this.end();
    } else if (this.scene.expParty === ExpNotification.ONLY_LEVEL_UP) {
      if (newLevel > lastLevel) { // this means if we level up
        // instead of displaying the exp gain in the small frame, we display the new level
        // we use the same method for mode 0 & 1, by giving a parameter saying to display the exp or the level
        this.scene.partyExpBar.showPokemonExp(pokemon, exp.value, this.scene.expParty === ExpNotification.ONLY_LEVEL_UP, newLevel).then(() => {
          setTimeout(() => this.end(), 800 / Math.pow(2, this.scene.expGainsSpeed));
        });
      } else {
        this.end();
      }
    } else if (this.scene.expGainsSpeed < 3) {
      this.scene.partyExpBar.showPokemonExp(pokemon, exp.value, false, newLevel).then(() => {
        setTimeout(() => this.end(), 500 / Math.pow(2, this.scene.expGainsSpeed));
      });
    } else {
      this.end();
    }

  }
}

export class HidePartyExpBarPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.partyExpBar.hide().then(() => this.end());
  }
}

export class LevelUpPhase extends PlayerPartyMemberPokemonPhase {
  private lastLevel: integer;
  private level: integer;

  constructor(scene: BattleScene, partyMemberIndex: integer, lastLevel: integer, level: integer) {
    super(scene, partyMemberIndex);

    this.lastLevel = lastLevel;
    this.level = level;
    this.scene = scene;
  }

  start() {
    super.start();

    if (this.level > this.scene.gameData.gameStats.highestLevel) {
      this.scene.gameData.gameStats.highestLevel = this.level;
    }

    this.scene.validateAchvs(LevelAchv, new Utils.IntegerHolder(this.level));

    const pokemon = this.getPokemon();
    const prevStats = pokemon.stats.slice(0);
    pokemon.calculateStats();
    pokemon.updateInfo();
    if (this.scene.expParty === ExpNotification.DEFAULT) {
      this.scene.playSound("level_up_fanfare");
      this.scene.ui.showText(i18next.t("battle:levelUp", { pokemonName: this.getPokemon().name, level: this.level }), null, () => this.scene.ui.getMessageHandler().promptLevelUpStats(this.partyMemberIndex, prevStats, false).then(() => this.end()), null, true);
    } else if (this.scene.expParty === ExpNotification.SKIP) {
      this.end();
    } else {
      // we still want to display the stats if activated
      this.scene.ui.getMessageHandler().promptLevelUpStats(this.partyMemberIndex, prevStats, false).then(() => this.end());
    }
    if (this.level <= 100) {
      const levelMoves = this.getPokemon().getLevelMoves(this.lastLevel + 1);
      for (const lm of levelMoves) {
        this.scene.unshiftPhase(new LearnMovePhase(this.scene, this.partyMemberIndex, lm[1]));
      }
    }
    if (!pokemon.pauseEvolutions) {
      const evolution = pokemon.getEvolution();
      if (evolution) {
        this.scene.unshiftPhase(new EvolutionPhase(this.scene, pokemon as PlayerPokemon, evolution, this.lastLevel));
      }
    }
  }
}

export class LearnMovePhase extends PlayerPartyMemberPokemonPhase {
  private moveId: Moves;

  constructor(scene: BattleScene, partyMemberIndex: integer, moveId: Moves) {
    super(scene, partyMemberIndex);

    this.moveId = moveId;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    const move = allMoves[this.moveId];

    const existingMoveIndex = pokemon.getMoveset().findIndex(m => m?.moveId === move.id);

    if (existingMoveIndex > -1) {
      return this.end();
    }

    const emptyMoveIndex = pokemon.getMoveset().length < 4
      ? pokemon.getMoveset().length
      : pokemon.getMoveset().findIndex(m => m === null);

    const messageMode = this.scene.ui.getHandler() instanceof EvolutionSceneHandler
      ? Mode.EVOLUTION_SCENE
      : Mode.MESSAGE;

    if (emptyMoveIndex > -1) {
      pokemon.setMove(emptyMoveIndex, this.moveId);
      initMoveAnim(this.scene, this.moveId).then(() => {
        loadMoveAnimAssets(this.scene, [ this.moveId ], true)
          .then(() => {
            this.scene.ui.setMode(messageMode).then(() => {
              this.scene.playSound("level_up_fanfare");
              this.scene.ui.showText(i18next.t("battle:learnMove", { pokemonName: pokemon.name, moveName: move.name }), null, () => {
                this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeMoveLearnedTrigger, true);
                this.end();
              }, messageMode === Mode.EVOLUTION_SCENE ? 1000 : null, true);
            });
          });
      });
    } else {
      this.scene.ui.setMode(messageMode).then(() => {
        this.scene.ui.showText(i18next.t("battle:learnMovePrompt", { pokemonName: pokemon.name, moveName: move.name }), null, () => {
          this.scene.ui.showText(i18next.t("battle:learnMoveLimitReached", { pokemonName: pokemon.name }), null, () => {
            this.scene.ui.showText(i18next.t("battle:learnMoveReplaceQuestion", { moveName: move.name }), null, () => {
              const noHandler = () => {
                this.scene.ui.setMode(messageMode).then(() => {
                  this.scene.ui.showText(i18next.t("battle:learnMoveStopTeaching", { moveName: move.name }), null, () => {
                    this.scene.ui.setModeWithoutClear(Mode.CONFIRM, () => {
                      this.scene.ui.setMode(messageMode);
                      this.scene.ui.showText(i18next.t("battle:learnMoveNotLearned", { pokemonName: pokemon.name, moveName: move.name }), null, () => this.end(), null, true);
                    }, () => {
                      this.scene.ui.setMode(messageMode);
                      this.scene.unshiftPhase(new LearnMovePhase(this.scene, this.partyMemberIndex, this.moveId));
                      this.end();
                    });
                  });
                });
              };
              this.scene.ui.setModeWithoutClear(Mode.CONFIRM, () => {
                this.scene.ui.setMode(messageMode);
                this.scene.ui.showText(i18next.t("battle:learnMoveForgetQuestion"), null, () => {
                  this.scene.ui.setModeWithoutClear(Mode.SUMMARY, this.getPokemon(), SummaryUiMode.LEARN_MOVE, move, (moveIndex: integer) => {
                    if (moveIndex === 4) {
                      noHandler();
                      return;
                    }
                    this.scene.ui.setMode(messageMode).then(() => {
                      this.scene.ui.showText(i18next.t("battle:countdownPoof"), null, () => {
                        this.scene.ui.showText(i18next.t("battle:learnMoveForgetSuccess", { pokemonName: pokemon.name, moveName: pokemon.moveset[moveIndex].getName() }), null, () => {
                          this.scene.ui.showText(i18next.t("battle:learnMoveAnd"), null, () => {
                            pokemon.setMove(moveIndex, Moves.NONE);
                            this.scene.unshiftPhase(new LearnMovePhase(this.scene, this.partyMemberIndex, this.moveId));
                            this.end();
                          }, null, true);
                        }, null, true);
                      }, null, true);
                    });
                  });
                }, null, true);
              }, noHandler);
            });
          }, null, true);
        }, null, true);
      });
    }
  }
}

export class PokemonHealPhase extends CommonAnimPhase {
  private hpHealed: integer;
  private message: string;
  private showFullHpMessage: boolean;
  private skipAnim: boolean;
  private revive: boolean;
  private healStatus: boolean;
  private preventFullHeal: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, hpHealed: integer, message: string, showFullHpMessage: boolean, skipAnim: boolean = false, revive: boolean = false, healStatus: boolean = false, preventFullHeal: boolean = false) {
    super(scene, battlerIndex, undefined, CommonAnim.HEALTH_UP);

    this.hpHealed = hpHealed;
    this.message = message;
    this.showFullHpMessage = showFullHpMessage;
    this.skipAnim = skipAnim;
    this.revive = revive;
    this.healStatus = healStatus;
    this.preventFullHeal = preventFullHeal;
  }

  start() {
    if (!this.skipAnim && (this.revive || this.getPokemon().hp) && this.getPokemon().getHpRatio() < 1) {
      super.start();
    } else {
      this.end();
    }
  }

  end() {
    const pokemon = this.getPokemon();

    if (!pokemon.isOnField() || (!this.revive && !pokemon.isActive())) {
      super.end();
      return;
    }

    const fullHp = pokemon.getHpRatio() >= 1;

    const hasMessage = !!this.message;
    const healOrDamage = (!fullHp || this.hpHealed < 0);
    let lastStatusEffect = StatusEffect.NONE;

    if (healOrDamage) {
      const hpRestoreMultiplier = new Utils.IntegerHolder(1);
      if (!this.revive) {
        this.scene.applyModifiers(HealingBoosterModifier, this.player, hpRestoreMultiplier);
      }
      const healAmount = new Utils.NumberHolder(Math.floor(this.hpHealed * hpRestoreMultiplier.value));
      if (healAmount.value < 0) {
        pokemon.damageAndUpdate(healAmount.value * -1, HitResult.HEAL as DamageResult);
        healAmount.value = 0;
      }
      // Prevent healing to full if specified (in case of healing tokens so Sturdy doesn't cause a softlock)
      if (this.preventFullHeal && pokemon.hp + healAmount.value >= pokemon.getMaxHp()) {
        healAmount.value = (pokemon.getMaxHp() - pokemon.hp) - 1;
      }
      healAmount.value = pokemon.heal(healAmount.value);
      if (healAmount.value) {
        this.scene.damageNumberHandler.add(pokemon, healAmount.value, HitResult.HEAL);
      }
      if (pokemon.isPlayer()) {
        this.scene.validateAchvs(HealAchv, healAmount);
        if (healAmount.value > this.scene.gameData.gameStats.highestHeal) {
          this.scene.gameData.gameStats.highestHeal = healAmount.value;
        }
      }
      if (this.healStatus && !this.revive && pokemon.status) {
        lastStatusEffect = pokemon.status.effect;
        pokemon.resetStatus();
      }
      pokemon.updateInfo().then(() => super.end());
    } else if (this.healStatus && !this.revive && pokemon.status) {
      lastStatusEffect = pokemon.status.effect;
      pokemon.resetStatus();
      pokemon.updateInfo().then(() => super.end());
    } else if (this.showFullHpMessage) {
      this.message = getPokemonMessage(pokemon, "'s\nHP is full!");
    }

    if (this.message) {
      this.scene.queueMessage(this.message);
    }

    if (this.healStatus && lastStatusEffect && !hasMessage) {
      this.scene.queueMessage(getPokemonMessage(pokemon, getStatusEffectHealText(lastStatusEffect)));
    }

    if (!healOrDamage && !lastStatusEffect) {
      super.end();
    }
  }
}

export class AttemptCapturePhase extends PokemonPhase {
  private pokeballType: PokeballType;
  private pokeball: Phaser.GameObjects.Sprite;
  private originalY: number;

  constructor(scene: BattleScene, targetIndex: integer, pokeballType: PokeballType) {
    super(scene, BattlerIndex.ENEMY + targetIndex);

    this.pokeballType = pokeballType;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon() as EnemyPokemon;

    if (!pokemon?.hp) {
      return this.end();
    }

    this.scene.pokeballCounts[this.pokeballType]--;

    this.originalY = pokemon.y;

    const _3m = 3 * pokemon.getMaxHp();
    const _2h = 2 * pokemon.hp;
    const catchRate = pokemon.species.catchRate;
    const pokeballMultiplier = getPokeballCatchMultiplier(this.pokeballType);
    const statusMultiplier = pokemon.status ? getStatusEffectCatchRateMultiplier(pokemon.status.effect) : 1;
    const x = Math.round((((_3m - _2h) * catchRate * pokeballMultiplier) / _3m) * statusMultiplier);
    const y = Math.round(65536 / Math.sqrt(Math.sqrt(255 / x)));
    const fpOffset = pokemon.getFieldPositionOffset();

    const pokeballAtlasKey = getPokeballAtlasKey(this.pokeballType);
    this.pokeball = this.scene.addFieldSprite(16, 80, "pb", pokeballAtlasKey);
    this.pokeball.setOrigin(0.5, 0.625);
    this.scene.field.add(this.pokeball);

    this.scene.playSound("pb_throw");
    this.scene.time.delayedCall(300, () => {
      this.scene.field.moveBelow(this.pokeball as Phaser.GameObjects.GameObject, pokemon);
    });

    this.scene.tweens.add({
      targets: this.pokeball,
      x: { value: 236 + fpOffset[0], ease: "Linear" },
      y: { value: 16 + fpOffset[1], ease: "Cubic.easeOut" },
      duration: 500,
      onComplete: () => {
        this.pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
        this.scene.time.delayedCall(17, () => this.pokeball.setTexture("pb", `${pokeballAtlasKey}_open`));
        this.scene.playSound("pb_rel");
        pokemon.tint(getPokeballTintColor(this.pokeballType));

        addPokeballOpenParticles(this.scene, this.pokeball.x, this.pokeball.y, this.pokeballType);

        this.scene.tweens.add({
          targets: pokemon,
          duration: 500,
          ease: "Sine.easeIn",
          scale: 0.25,
          y: 20,
          onComplete: () => {
            this.pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
            pokemon.setVisible(false);
            this.scene.playSound("pb_catch");
            this.scene.time.delayedCall(17, () => this.pokeball.setTexture("pb", `${pokeballAtlasKey}`));

            const doShake = () => {
              let shakeCount = 0;
              const pbX = this.pokeball.x;
              const shakeCounter = this.scene.tweens.addCounter({
                from: 0,
                to: 1,
                repeat: 4,
                yoyo: true,
                ease: "Cubic.easeOut",
                duration: 250,
                repeatDelay: 500,
                onUpdate: t => {
                  if (shakeCount && shakeCount < 4) {
                    const value = t.getValue();
                    const directionMultiplier = shakeCount % 2 === 1 ? 1 : -1;
                    this.pokeball.setX(pbX + value * 4 * directionMultiplier);
                    this.pokeball.setAngle(value * 27.5 * directionMultiplier);
                  }
                },
                onRepeat: () => {
                  if (!pokemon.species.isObtainable()) {
                    shakeCounter.stop();
                    this.failCatch(shakeCount);
                  } else if (shakeCount++ < 3) {
                    if (pokeballMultiplier === -1 || pokemon.randSeedInt(65536) < y) {
                      this.scene.playSound("pb_move");
                    } else {
                      shakeCounter.stop();
                      this.failCatch(shakeCount);
                    }
                  } else {
                    this.scene.playSound("pb_lock");
                    addPokeballCaptureStars(this.scene, this.pokeball);

                    const pbTint = this.scene.add.sprite(this.pokeball.x, this.pokeball.y, "pb", "pb");
                    pbTint.setOrigin(this.pokeball.originX, this.pokeball.originY);
                    pbTint.setTintFill(0);
                    pbTint.setAlpha(0);
                    this.scene.field.add(pbTint);
                    this.scene.tweens.add({
                      targets: pbTint,
                      alpha: 0.375,
                      duration: 200,
                      easing: "Sine.easeOut",
                      onComplete: () => {
                        this.scene.tweens.add({
                          targets: pbTint,
                          alpha: 0,
                          duration: 200,
                          easing: "Sine.easeIn",
                          onComplete: () => pbTint.destroy()
                        });
                      }
                    });
                  }
                },
                onComplete: () => this.catch()
              });
            };

            this.scene.time.delayedCall(250, () => doPokeballBounceAnim(this.scene, this.pokeball, 16, 72, 350, doShake));
          }
        });
      }
    });
  }

  failCatch(shakeCount: integer) {
    const pokemon = this.getPokemon();

    this.scene.playSound("pb_rel");
    pokemon.setY(this.originalY);
    if (pokemon.status?.effect !== StatusEffect.SLEEP) {
      pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
    }
    pokemon.tint(getPokeballTintColor(this.pokeballType));
    pokemon.setVisible(true);
    pokemon.untint(250, "Sine.easeOut");

    const pokeballAtlasKey = getPokeballAtlasKey(this.pokeballType);
    this.pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
    this.scene.time.delayedCall(17, () => this.pokeball.setTexture("pb", `${pokeballAtlasKey}_open`));

    this.scene.tweens.add({
      targets: pokemon,
      duration: 250,
      ease: "Sine.easeOut",
      scale: 1
    });

    this.scene.currentBattle.lastUsedPokeball = this.pokeballType;
    this.removePb();
    this.end();
  }

  catch() {
    const pokemon = this.getPokemon() as EnemyPokemon;
    this.scene.unshiftPhase(new VictoryPhase(this.scene, this.battlerIndex));

    const speciesForm = !pokemon.fusionSpecies ? pokemon.getSpeciesForm() : pokemon.getFusionSpeciesForm();

    if (speciesForm.abilityHidden && (pokemon.fusionSpecies ? pokemon.fusionAbilityIndex : pokemon.abilityIndex) === speciesForm.getAbilityCount() - 1) {
      this.scene.validateAchv(achvs.HIDDEN_ABILITY);
    }

    if (pokemon.species.subLegendary) {
      this.scene.validateAchv(achvs.CATCH_SUB_LEGENDARY);
    }

    if (pokemon.species.legendary) {
      this.scene.validateAchv(achvs.CATCH_LEGENDARY);
    }

    if (pokemon.species.mythical) {
      this.scene.validateAchv(achvs.CATCH_MYTHICAL);
    }

    this.scene.pokemonInfoContainer.show(pokemon, true);

    this.scene.gameData.updateSpeciesDexIvs(pokemon.species.getRootSpeciesId(true), pokemon.ivs);

    this.scene.ui.showText(i18next.t("battle:pokemonCaught", { pokemonName: pokemon.name }), null, () => {
      const end = () => {
        this.scene.pokemonInfoContainer.hide();
        this.removePb();
        this.end();
      };
      const removePokemon = () => {
        this.scene.addFaintedEnemyScore(pokemon);
        this.scene.getPlayerField().filter(p => p.isActive(true)).forEach(playerPokemon => playerPokemon.removeTagsBySourceId(pokemon.id));
        pokemon.hp = 0;
        pokemon.trySetStatus(StatusEffect.FAINT);
        this.scene.clearEnemyHeldItemModifiers();
        this.scene.field.remove(pokemon, true);
      };
      const addToParty = () => {
        const newPokemon = pokemon.addToParty(this.pokeballType);
        const modifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier, false);
        if (this.scene.getParty().filter(p => p.isShiny()).length === 6) {
          this.scene.validateAchv(achvs.SHINY_PARTY);
        }
        Promise.all(modifiers.map(m => this.scene.addModifier(m, true))).then(() => {
          this.scene.updateModifiers(true);
          removePokemon();
          if (newPokemon) {
            newPokemon.loadAssets().then(end);
          } else {
            end();
          }
        });
      };
      Promise.all([ pokemon.hideInfo(), this.scene.gameData.setPokemonCaught(pokemon) ]).then(() => {
        if (this.scene.getParty().length === 6) {
          const promptRelease = () => {
            this.scene.ui.showText(i18next.t("battle:partyFull", { pokemonName: pokemon.name }), null, () => {
              this.scene.pokemonInfoContainer.makeRoomForConfirmUi();
              this.scene.ui.setMode(Mode.CONFIRM, () => {
                this.scene.ui.setMode(Mode.PARTY, PartyUiMode.RELEASE, this.fieldIndex, (slotIndex: integer, _option: PartyOption) => {
                  this.scene.ui.setMode(Mode.MESSAGE).then(() => {
                    if (slotIndex < 6) {
                      addToParty();
                    } else {
                      promptRelease();
                    }
                  });
                });
              }, () => {
                this.scene.ui.setMode(Mode.MESSAGE).then(() => {
                  removePokemon();
                  end();
                });
              });
            });
          };
          promptRelease();
        } else {
          addToParty();
        }
      });
    }, 0, true);
  }

  removePb() {
    this.scene.tweens.add({
      targets: this.pokeball,
      duration: 250,
      delay: 250,
      ease: "Sine.easeIn",
      alpha: 0,
      onComplete: () => this.pokeball.destroy()
    });
  }
}

export class AttemptRunPhase extends PokemonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, fieldIndex);
  }

  start() {
    super.start();

    const playerPokemon = this.getPokemon();
    const enemyField = this.scene.getEnemyField();

    const enemySpeed = enemyField.reduce((total: integer, enemyPokemon: Pokemon) => total + enemyPokemon.getStat(Stat.SPD), 0) / enemyField.length;

    const escapeChance = new Utils.IntegerHolder((((playerPokemon.getStat(Stat.SPD) * 128) / enemySpeed) + (30 * this.scene.currentBattle.escapeAttempts++)) % 256);
    applyAbAttrs(RunSuccessAbAttr, playerPokemon, null, escapeChance);

    if (playerPokemon.randSeedInt(256) < escapeChance.value) {
      this.scene.playSound("flee");
      this.scene.queueMessage(i18next.t("battle:runAwaySuccess"), null, true, 500);

      this.scene.tweens.add({
        targets: [ this.scene.arenaEnemy, enemyField ].flat(),
        alpha: 0,
        duration: 250,
        ease: "Sine.easeIn",
        onComplete: () => enemyField.forEach(enemyPokemon => enemyPokemon.destroy())
      });

      this.scene.clearEnemyHeldItemModifiers();

      enemyField.forEach(enemyPokemon => {
        enemyPokemon.hideInfo().then(() => enemyPokemon.destroy());
        enemyPokemon.hp = 0;
        enemyPokemon.trySetStatus(StatusEffect.FAINT);
      });

      this.scene.pushPhase(new BattleEndPhase(this.scene));
      this.scene.pushPhase(new NewBattlePhase(this.scene));
    } else {
      this.scene.queueMessage(i18next.t("battle:runAwayCannotEscape"), null, true, 500);
    }

    this.end();
  }
}

export class SelectModifierPhase extends BattlePhase {
  private rerollCount: integer;
  private modifierTiers: ModifierTier[];

  constructor(scene: BattleScene, rerollCount: integer = 0, modifierTiers?: ModifierTier[]) {
    super(scene);

    this.rerollCount = rerollCount;
    this.modifierTiers = modifierTiers;
  }

  start() {
    super.start();

    if (!this.rerollCount) {
      this.updateSeed();
    } else {
      this.scene.reroll = false;
    }

    const party = this.scene.getParty();
    regenerateModifierPoolThresholds(party, this.getPoolType(), this.rerollCount);
    const modifierCount = new Utils.IntegerHolder(3);
    if (this.isPlayer()) {
      this.scene.applyModifiers(ExtraModifierModifier, true, modifierCount);
    }
    const typeOptions: ModifierTypeOption[] = this.getModifierTypeOptions(modifierCount.value);

    const modifierSelectCallback = (rowCursor: integer, cursor: integer) => {
      if (rowCursor < 0 || cursor < 0) {
        this.scene.ui.showText(i18next.t("battle:skipItemQuestion"), null, () => {
          this.scene.ui.setOverlayMode(Mode.CONFIRM, () => {
            this.scene.ui.revertMode();
            this.scene.ui.setMode(Mode.MESSAGE);
            super.end();
          }, () => this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers)));
        });
        return false;
      }
      let modifierType: ModifierType;
      let cost: integer;
      switch (rowCursor) {
      case 0:
        switch (cursor) {
        case 0:
          const rerollCost = this.getRerollCost(typeOptions, this.scene.lockModifierTiers);
          if (this.scene.money < rerollCost) {
            this.scene.ui.playError();
            return false;
          } else {
            this.scene.reroll = true;
            this.scene.unshiftPhase(new SelectModifierPhase(this.scene, this.rerollCount + 1, typeOptions.map(o => o.type.tier)));
            this.scene.ui.clearText();
            this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
            this.scene.money -= rerollCost;
            this.scene.updateMoneyText();
            this.scene.animateMoneyChanged(false);
            this.scene.playSound("buy");
          }
          break;
        case 1:
          this.scene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.MODIFIER_TRANSFER, -1, (fromSlotIndex: integer, itemIndex: integer, itemQuantity: integer, toSlotIndex: integer) => {
            if (toSlotIndex !== undefined && fromSlotIndex < 6 && toSlotIndex < 6 && fromSlotIndex !== toSlotIndex && itemIndex > -1) {
              const itemModifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
                      && (m as PokemonHeldItemModifier).getTransferrable(true) && (m as PokemonHeldItemModifier).pokemonId === party[fromSlotIndex].id) as PokemonHeldItemModifier[];
              const itemModifier = itemModifiers[itemIndex];
              this.scene.tryTransferHeldItemModifier(itemModifier, party[toSlotIndex], true, itemQuantity);
            } else {
              this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
            }
          }, PartyUiHandler.FilterItemMaxStacks);
          break;
        case 2:
          this.scene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.CHECK, -1, () => {
            this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
          });
          break;
        case 3:
          this.scene.lockModifierTiers = !this.scene.lockModifierTiers;
          const uiHandler = this.scene.ui.getHandler() as ModifierSelectUiHandler;
          uiHandler.setRerollCost(this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
          uiHandler.updateLockRaritiesText();
          uiHandler.updateRerollCostText();
          return false;
        }
        return true;
      case 1:
        modifierType = typeOptions[cursor].type;
        break;
      default:
        const shopOptions = getPlayerShopModifierTypeOptionsForWave(this.scene.currentBattle.waveIndex, this.scene.getWaveMoneyAmount(1));
        const shopOption = shopOptions[rowCursor > 2 || shopOptions.length <= SHOP_OPTIONS_ROW_LIMIT ? cursor : cursor + SHOP_OPTIONS_ROW_LIMIT];
        modifierType = shopOption.type;
        cost = shopOption.cost;
        break;
      }

      if (cost && this.scene.money < cost) {
        this.scene.ui.playError();
        return false;
      }

      const applyModifier = (modifier: Modifier, playSound: boolean = false) => {
        const result = this.scene.addModifier(modifier, false, playSound);
        if (cost) {
          result.then(success => {
            if (success) {
              this.scene.money -= cost;
              this.scene.updateMoneyText();
              this.scene.animateMoneyChanged(false);
              this.scene.playSound("buy");
              (this.scene.ui.getHandler() as ModifierSelectUiHandler).updateCostText();
            } else {
              this.scene.ui.playError();
            }
          });
        } else {
          const doEnd = () => {
            this.scene.ui.clearText();
            this.scene.ui.setMode(Mode.MESSAGE);
            super.end();
          };
          if (result instanceof Promise) {
            result.then(() => doEnd());
          } else {
            doEnd();
          }
        }
      };

      if (modifierType instanceof PokemonModifierType) {
        if (modifierType instanceof FusePokemonModifierType) {
          this.scene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.SPLICE, -1, (fromSlotIndex: integer, spliceSlotIndex: integer) => {
            if (spliceSlotIndex !== undefined && fromSlotIndex < 6 && spliceSlotIndex < 6 && fromSlotIndex !== spliceSlotIndex) {
              this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer()).then(() => {
                const modifier = modifierType.newModifier(party[fromSlotIndex], party[spliceSlotIndex]);
                applyModifier(modifier, true);
              });
            } else {
              this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
            }
          }, modifierType.selectFilter);
        } else {
          const pokemonModifierType = modifierType as PokemonModifierType;
          const isMoveModifier = modifierType instanceof PokemonMoveModifierType;
          const isTmModifier = modifierType instanceof TmModifierType;
          const isRememberMoveModifier = modifierType instanceof RememberMoveModifierType;
          const isPpRestoreModifier = (modifierType instanceof PokemonPpRestoreModifierType || modifierType instanceof PokemonPpUpModifierType);
          const partyUiMode = isMoveModifier ? PartyUiMode.MOVE_MODIFIER
            : isTmModifier ? PartyUiMode.TM_MODIFIER
              : isRememberMoveModifier ? PartyUiMode.REMEMBER_MOVE_MODIFIER
                : PartyUiMode.MODIFIER;
          const tmMoveId = isTmModifier
            ? (modifierType as TmModifierType).moveId
            : undefined;
          this.scene.ui.setModeWithoutClear(Mode.PARTY, partyUiMode, -1, (slotIndex: integer, option: PartyOption) => {
            if (slotIndex < 6) {
              this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer()).then(() => {
                const modifier = !isMoveModifier
                  ? !isRememberMoveModifier
                    ? modifierType.newModifier(party[slotIndex])
                    : modifierType.newModifier(party[slotIndex], option as integer)
                  : modifierType.newModifier(party[slotIndex], option - PartyOption.MOVE_1);
                applyModifier(modifier, true);
              });
            } else {
              this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
            }
          }, pokemonModifierType.selectFilter, modifierType instanceof PokemonMoveModifierType ? (modifierType as PokemonMoveModifierType).moveSelectFilter : undefined, tmMoveId, isPpRestoreModifier);
        }
      } else {
        applyModifier(modifierType.newModifier());
      }

      return !cost;
    };
    this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
  }

  updateSeed(): void {
    this.scene.resetSeed();
  }

  isPlayer(): boolean {
    return true;
  }

  getRerollCost(typeOptions: ModifierTypeOption[], lockRarities: boolean): integer {
    let baseValue = 0;
    if (lockRarities) {
      const tierValues = [ 50, 125, 300, 750, 2000 ];
      for (const opt of typeOptions) {
        baseValue += tierValues[opt.type.tier];
      }
    } else {
      baseValue = 250;
    }
    return Math.min(Math.ceil(this.scene.currentBattle.waveIndex / 10) * baseValue * Math.pow(2, this.rerollCount), Number.MAX_SAFE_INTEGER);
  }

  getPoolType(): ModifierPoolType {
    return ModifierPoolType.PLAYER;
  }

  getModifierTypeOptions(modifierCount: integer): ModifierTypeOption[] {
    return getPlayerModifierTypeOptions(modifierCount, this.scene.getParty(), this.scene.lockModifierTiers ? this.modifierTiers : undefined);
  }

  addModifier(modifier: Modifier): Promise<boolean> {
    return this.scene.addModifier(modifier, false, true);
  }
}

export class EggLapsePhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    const eggsToHatch: Egg[] = this.scene.gameData.eggs.filter((egg: Egg) => {
      return Overrides.IMMEDIATE_HATCH_EGGS_OVERRIDE ? true : --egg.hatchWaves < 1;
    });

    let eggCount: integer = eggsToHatch.length;

    if (eggCount) {
      this.scene.queueMessage(i18next.t("battle:eggHatching"));

      for (const egg of eggsToHatch) {
        this.scene.unshiftPhase(new EggHatchPhase(this.scene, egg, eggCount));
        if (eggCount > 0) {
          eggCount--;
        }
      }

    }
    this.end();
  }
}

export class AddEnemyBuffModifierPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    const waveIndex = this.scene.currentBattle.waveIndex;
    const tier = !(waveIndex % 1000) ? ModifierTier.ULTRA : !(waveIndex % 250) ? ModifierTier.GREAT : ModifierTier.COMMON;

    regenerateModifierPoolThresholds(this.scene.getEnemyParty(), ModifierPoolType.ENEMY_BUFF);

    const count = Math.ceil(waveIndex / 250);
    for (let i = 0; i < count; i++) {
      this.scene.addEnemyModifier(getEnemyBuffModifierForWave(tier, this.scene.findModifiers(m => m instanceof EnemyPersistentModifier, false), this.scene), true, true);
    }
    this.scene.updateModifiers(false, true).then(() => this.end());
  }
}

/**
 * Cures the party of all non-volatile status conditions, shows a message
 * @param {BattleScene} scene The current scene
 * @param {Pokemon} user The user of the move that cures the party
 * @param {string} message The message that should be displayed
 * @param {Abilities} abilityCondition Pokemon with this ability will not be affected ie. Soundproof
 */
export class PartyStatusCurePhase extends BattlePhase {
  private user: Pokemon;
  private message: string;
  private abilityCondition: Abilities;

  constructor(scene: BattleScene, user: Pokemon, message: string, abilityCondition: Abilities) {
    super(scene);

    this.user = user;
    this.message = message;
    this.abilityCondition = abilityCondition;
  }

  start() {
    super.start();
    for (const pokemon of this.scene.getParty()) {
      if (!pokemon.isOnField() || pokemon === this.user) {
        pokemon.resetStatus(false);
        pokemon.updateInfo(true);
      } else {
        if (!pokemon.hasAbility(this.abilityCondition)) {
          pokemon.resetStatus();
          pokemon.updateInfo(true);
        } else {
          // Manually show ability bar, since we're not hooked into the targeting system
          pokemon.scene.unshiftPhase(new ShowAbilityPhase(pokemon.scene, pokemon.id, pokemon.getPassiveAbility()?.id === this.abilityCondition));
        }
      }
    }
    if (this.message) {
      this.scene.queueMessage(this.message);
    }
    this.end();
  }
}

export class PartyHealPhase extends BattlePhase {
  private resumeBgm: boolean;

  constructor(scene: BattleScene, resumeBgm: boolean) {
    super(scene);

    this.resumeBgm = resumeBgm;
  }

  start() {
    super.start();

    const bgmPlaying = this.scene.isBgmPlaying();
    if (bgmPlaying) {
      this.scene.fadeOutBgm(1000, false);
    }
    this.scene.ui.fadeOut(1000).then(() => {
      for (const pokemon of this.scene.getParty()) {
        pokemon.hp = pokemon.getMaxHp();
        pokemon.resetStatus();
        for (const move of pokemon.moveset) {
          move.ppUsed = 0;
        }
        pokemon.updateInfo(true);
      }
      const healSong = this.scene.playSoundWithoutBgm("heal");
      this.scene.time.delayedCall(Utils.fixedInt(healSong.totalDuration * 1000), () => {
        healSong.destroy();
        if (this.resumeBgm && bgmPlaying) {
          this.scene.playBgm();
        }
        this.scene.ui.fadeIn(500).then(() => this.end());
      });
    });
  }
}

export class ShinySparklePhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    super.start();

    this.getPokemon().sparkle();
    this.scene.time.delayedCall(1000, () => this.end());
  }
}

export class ScanIvsPhase extends PokemonPhase {
  private shownIvs: integer;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, shownIvs: integer) {
    super(scene, battlerIndex);

    this.shownIvs = shownIvs;
  }

  start() {
    super.start();

    if (!this.shownIvs) {
      return this.end();
    }

    const pokemon = this.getPokemon();

    this.scene.ui.showText(i18next.t("battle:ivScannerUseQuestion", { pokemonName: pokemon.name }), null, () => {
      this.scene.ui.setMode(Mode.CONFIRM, () => {
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.clearText();
        new CommonBattleAnim(CommonAnim.LOCK_ON, pokemon, pokemon).play(this.scene, () => {
          this.scene.ui.getMessageHandler().promptIvs(pokemon.id, pokemon.ivs, this.shownIvs).then(() => this.end());
        });
      }, () => {
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.clearText();
        this.end();
      });
    });
  }
}

export class TrainerMessageTestPhase extends BattlePhase {
  private trainerTypes: TrainerType[];

  constructor(scene: BattleScene, ...trainerTypes: TrainerType[]) {
    super(scene);

    this.trainerTypes = trainerTypes;
  }

  start() {
    super.start();

    const testMessages: string[] = [];

    for (const t of Object.keys(trainerConfigs)) {
      const type = parseInt(t);
      if (this.trainerTypes.length && !this.trainerTypes.find(tt => tt === type as TrainerType)) {
        continue;
      }
      const config = trainerConfigs[type];
      [ config.encounterMessages, config.femaleEncounterMessages, config.victoryMessages, config.femaleVictoryMessages, config.defeatMessages, config.femaleDefeatMessages ]
        .map(messages => {
          if (messages?.length) {
            testMessages.push(...messages);
          }
        });
    }

    for (const message of testMessages) {
      this.scene.pushPhase(new TestMessagePhase(this.scene, message));
    }

    this.end();
  }
}

export class TestMessagePhase extends MessagePhase {
  constructor(scene: BattleScene, message: string) {
    super(scene, message, null, true);
  }
}
