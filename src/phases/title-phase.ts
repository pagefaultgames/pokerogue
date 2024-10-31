import { loggedInUser } from "#app/account";
import { BattleType } from "#app/battle";
import { getDailyRunStarters, fetchDailyRunSeed } from "#app/data/daily-run";
import { Gender } from "#app/data/gender";
import { getBiomeKey } from "#app/field/arena";
import { GameModes, GameMode, getGameMode } from "#app/game-mode";
import { regenerateModifierPoolThresholds, ModifierPoolType, modifierTypes, getDailyRunStarterModifiers } from "#app/modifier/modifier-type";
import { Phase } from "#app/phase";
import { SessionSaveData } from "#app/system/game-data";
import { Unlockables } from "#app/system/unlockables";
import { vouchers } from "#app/system/voucher";
import { OptionSelectItem, OptionSelectConfig } from "#app/ui/abstact-option-select-ui-handler";
import { SaveSlotUiMode } from "#app/ui/save-slot-select-ui-handler";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import * as Utils from "#app/utils";
import { Modifier } from "#app/modifier/modifier";
import { CheckSwitchPhase } from "./check-switch-phase";
import { EncounterPhase } from "./encounter-phase";
import { SelectChallengePhase } from "./select-challenge-phase";
import { SelectStarterPhase } from "./select-starter-phase";
import { SummonPhase } from "./summon-phase";
import { gScene } from "#app/battle-scene";


export class TitlePhase extends Phase {
  private loaded: boolean;
  private lastSessionData: SessionSaveData;
  public gameMode: GameModes;

  constructor() {
    super();

    this.loaded = false;
  }

  start(): void {
    super.start();

    gScene.ui.clearText();
    gScene.ui.fadeIn(250);

    gScene.playBgm("title", true);

    gScene.gameData.getSession(loggedInUser?.lastSessionSlot ?? -1).then(sessionData => {
      if (sessionData) {
        this.lastSessionData = sessionData;
        const biomeKey = getBiomeKey(sessionData.arena.biome);
        const bgTexture = `${biomeKey}_bg`;
        gScene.arenaBg.setTexture(bgTexture);
      }
      this.showOptions();
    }).catch(err => {
      console.error(err);
      this.showOptions();
    });
  }

  showOptions(): void {
    const options: OptionSelectItem[] = [];
    if (loggedInUser && loggedInUser.lastSessionSlot > -1) {
      options.push({
        label: i18next.t("continue", { ns: "menu" }),
        handler: () => {
          this.loadSaveSlot(this.lastSessionData || !loggedInUser ? -1 : loggedInUser.lastSessionSlot);
          return true;
        }
      });
    }
    options.push({
      label: i18next.t("menu:newGame"),
      handler: () => {
        const setModeAndEnd = (gameMode: GameModes) => {
          this.gameMode = gameMode;
          gScene.ui.setMode(Mode.MESSAGE);
          gScene.ui.clearText();
          this.end();
        };
        const { gameData } = gScene;
        if (gameData.isUnlocked(Unlockables.ENDLESS_MODE)) {
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
          if (gameData.isUnlocked(Unlockables.SPLICED_ENDLESS_MODE)) {
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
              gScene.clearPhaseQueue();
              gScene.pushPhase(new TitlePhase());
              super.end();
              return true;
            }
          });
          gScene.ui.showText(i18next.t("menu:selectGameMode"), null, () => gScene.ui.setOverlayMode(Mode.OPTION_SELECT, { options: options }));
        } else {
          this.gameMode = GameModes.CLASSIC;
          gScene.ui.setMode(Mode.MESSAGE);
          gScene.ui.clearText();
          this.end();
        }
        return true;
      }
    },
    {
      label: i18next.t("menu:loadGame"),
      handler: () => {
        gScene.ui.setOverlayMode(Mode.SAVE_SLOT, SaveSlotUiMode.LOAD,
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
        gScene.ui.setOverlayMode(Mode.SETTINGS);
        return true;
      },
      keepOpen: true
    });
    const config: OptionSelectConfig = {
      options: options,
      noCancel: true,
      yOffset: 47
    };
    gScene.ui.setMode(Mode.TITLE, config);
  }

  loadSaveSlot(slotId: integer): void {
    gScene.sessionSlotId = slotId > -1 || !loggedInUser ? slotId : loggedInUser.lastSessionSlot;
    gScene.ui.setMode(Mode.MESSAGE);
    gScene.ui.resetModeChain();
    gScene.gameData.loadSession(slotId, slotId === -1 ? this.lastSessionData : undefined).then((success: boolean) => {
      if (success) {
        this.loaded = true;
        gScene.ui.showText(i18next.t("menu:sessionSuccess"), null, () => this.end());
      } else {
        this.end();
      }
    }).catch(err => {
      console.error(err);
      gScene.ui.showText(i18next.t("menu:failedToLoadSession"), null);
    });
  }

  initDailyRun(): void {
    gScene.ui.setMode(Mode.SAVE_SLOT, SaveSlotUiMode.SAVE, (slotId: integer) => {
      gScene.clearPhaseQueue();
      if (slotId === -1) {
        gScene.pushPhase(new TitlePhase());
        return super.end();
      }
      gScene.sessionSlotId = slotId;

      const generateDaily = (seed: string) => {
        gScene.gameMode = getGameMode(GameModes.DAILY);

        gScene.setSeed(seed);
        gScene.resetSeed(0);

        gScene.money = gScene.gameMode.getStartingMoney();

        const starters = getDailyRunStarters(seed);
        const startingLevel = gScene.gameMode.getStartingLevel();

        const party = gScene.getParty();
        const loadPokemonAssets: Promise<void>[] = [];
        for (const starter of starters) {
          const starterProps = gScene.gameData.getSpeciesDexAttrProps(starter.species, starter.dexAttr);
          const starterFormIndex = Math.min(starterProps.formIndex, Math.max(starter.species.forms.length - 1, 0));
          const starterGender = starter.species.malePercent !== null
            ? !starterProps.female ? Gender.MALE : Gender.FEMALE
            : Gender.GENDERLESS;
          const starterPokemon = gScene.addPlayerPokemon(starter.species, startingLevel, starter.abilityIndex, starterFormIndex, starterGender, starterProps.shiny, starterProps.variant, undefined, starter.nature);
          starterPokemon.setVisible(false);
          party.push(starterPokemon);
          loadPokemonAssets.push(starterPokemon.loadAssets());
        }

        regenerateModifierPoolThresholds(party, ModifierPoolType.DAILY_STARTER);

        const modifiers: Modifier[] = Array(3).fill(null).map(() => modifierTypes.EXP_SHARE().withIdFromFunc(modifierTypes.EXP_SHARE).newModifier())
          .concat(Array(3).fill(null).map(() => modifierTypes.GOLDEN_EXP_CHARM().withIdFromFunc(modifierTypes.GOLDEN_EXP_CHARM).newModifier()))
          .concat([ modifierTypes.MAP().withIdFromFunc(modifierTypes.MAP).newModifier() ])
          .concat(getDailyRunStarterModifiers(party))
          .filter((m) => m !== null);

        for (const m of modifiers) {
          gScene.addModifier(m, true, false, false, true);
        }
        gScene.updateModifiers(true, true);

        Promise.all(loadPokemonAssets).then(() => {
          gScene.time.delayedCall(500, () => gScene.playBgm());
          gScene.gameData.gameStats.dailyRunSessionsPlayed++;
          gScene.newArena(gScene.gameMode.getStartingBiome());
          gScene.newBattle();
          gScene.arena.init();
          gScene.sessionPlayTime = 0;
          gScene.lastSavePlayTime = 0;
          this.end();
        });
      };

      // If Online, calls seed fetch from db to generate daily run. If Offline, generates a daily run based on current date.
      if (!Utils.isLocal) {
        fetchDailyRunSeed().then(seed => {
          if (seed) {
            generateDaily(seed);
          } else {
            throw new Error("Daily run seed is null!");
          }
        }).catch(err => {
          console.error("Failed to load daily run:\n", err);
        });
      } else {
        generateDaily(btoa(new Date().toISOString().substring(0, 10)));
      }
    });
  }

  end(): void {
    if (!this.loaded && !gScene.gameMode.isDaily) {
      gScene.arena.preloadBgm();
      gScene.gameMode = getGameMode(this.gameMode);
      if (this.gameMode === GameModes.CHALLENGE) {
        gScene.pushPhase(new SelectChallengePhase());
      } else {
        gScene.pushPhase(new SelectStarterPhase());
      }
      gScene.newArena(gScene.gameMode.getStartingBiome());
    } else {
      gScene.playBgm();
    }

    gScene.pushPhase(new EncounterPhase(this.loaded));

    if (this.loaded) {
      const availablePartyMembers = gScene.getParty().filter(p => p.isAllowedInBattle()).length;

      gScene.pushPhase(new SummonPhase(0, true, true));
      if (gScene.currentBattle.double && availablePartyMembers > 1) {
        gScene.pushPhase(new SummonPhase(1, true, true));
      }

      if (gScene.currentBattle.battleType !== BattleType.TRAINER && (gScene.currentBattle.waveIndex > 1 || !gScene.gameMode.isDaily)) {
        const minPartySize = gScene.currentBattle.double ? 2 : 1;
        if (availablePartyMembers > minPartySize) {
          gScene.pushPhase(new CheckSwitchPhase(0, gScene.currentBattle.double));
          if (gScene.currentBattle.double) {
            gScene.pushPhase(new CheckSwitchPhase(1, gScene.currentBattle.double));
          }
        }
      }
    }

    for (const achv of Object.keys(gScene.gameData.achvUnlocks)) {
      if (vouchers.hasOwnProperty(achv) && achv !== "CLASSIC_VICTORY") {
        gScene.validateVoucher(vouchers[achv]);
      }
    }

    super.end();
  }
}
