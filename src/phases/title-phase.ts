import { loggedInUser } from "#app/account";
import BattleScene from "#app/battle-scene";
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
import * as LoggerTools from "../logger";
import { Biome } from "#app/enums/biome.js";
import { GameDataType } from "#app/enums/game-data-type.js";


export class TitlePhase extends Phase {
  private loaded: boolean;
  private lastSessionData: SessionSaveData;
  public gameMode: GameModes;

  constructor(scene: BattleScene) {
    super(scene);

    this.loaded = false;
  }

  setBiomeByType(biome: Biome, override?: boolean): void {
    if (!this.scene.menuChangesBiome && !override)
      return;
    this.scene.arenaBg.setTexture(`${getBiomeKey(biome)}_bg`);
  }
  setBiomeByName(biome: string, override?: boolean): void {
    if (!this.scene.menuChangesBiome && !override)
      return;
    this.scene.arenaBg.setTexture(`${getBiomeKey(Utils.getEnumValues(Biome)[Utils.getEnumKeys(Biome).indexOf(biome)])}_bg`);
  }
  setBiomeByFile(sessionData: SessionSaveData, override?: boolean): void {
    if (!this.scene.menuChangesBiome && !override)
      return;
    this.scene.arenaBg.setTexture(`${getBiomeKey(sessionData.arena.biome)}_bg`);
  }

  confirmSlot = (message: string, slotFilter: (i: integer) => boolean, callback: (i: integer) => void) => {
    const p = this;
    this.scene.ui.revertMode();
    this.scene.ui.showText(message, null, () => {
      const config: OptionSelectConfig = {
        options: new Array(5).fill(null).map((_, i) => i).filter(slotFilter).map(i => {
          var data = LoggerTools.parseSlotData(i)
          return {
            //label: `${i18next.t("menuUiHandler:slot", {slotNumber: i+1})}`,
            label: (data ? `${i18next.t("menuUiHandler:slot", {slotNumber: i+1})}${data.description.substring(1)}` : `${i18next.t("menuUiHandler:slot", {slotNumber: i+1})}`),
            handler: () => {
              callback(i);
              this.scene.ui.revertMode();
              this.scene.ui.showText("", 0);
              return true;
            }
          };
        }).concat([{
          label: i18next.t("menuUiHandler:cancel"),
          handler: () => {
            p.callEnd()
            return true
          }
        }]),
        //xOffset: 98
      };
      this.scene.ui.setOverlayMode(Mode.MENU_OPTION_SELECT, config);
    });
  };

  start(): void {
    super.start();
    //console.log(LoggerTools.importDocument(JSON.stringify(LoggerTools.newDocument())))

    this.scene.ui.clearText();
    this.scene.ui.fadeIn(250);

    this.scene.playBgm("title", true);

    this.scene.biomeChangeMode = false

    this.scene.gameData.getSession(loggedInUser?.lastSessionSlot ?? -1).then(sessionData => {
      if (sessionData) {
        this.lastSessionData = sessionData;
        this.setBiomeByFile(sessionData, true)
        this.setBiomeByType(Biome.END)
      }
      this.showOptions();
    }).catch(err => {
      console.error(err);
      this.showOptions();
    });
  }

  getLastSave(log?: boolean, dailyOnly?: boolean, noDaily?: boolean): SessionSaveData | undefined {
    var saves: Array<Array<any>> = [];
    for (var i = 0; i < 5; i++) {
      var s = LoggerTools.parseSlotData(i);
      if (s != undefined) {
        if ((!noDaily && !dailyOnly) || (s.gameMode == GameModes.DAILY && dailyOnly) || (s.gameMode != GameModes.DAILY && noDaily)) {
          saves.push([i, s, s.timestamp]);
        }
      }
    }
    saves.sort((a, b): integer => {return b[2] - a[2]})
    if (log) console.log(saves)
    if (saves == undefined) return undefined;
    if (saves[0] == undefined) return undefined;
    return saves[0][1]
  }
  getLastSavesOfEach(log?: boolean): SessionSaveData[] | undefined {
    var saves: Array<Array<SessionSaveData | number>> = [];
    for (var i = 0; i < 5; i++) {
      var s = LoggerTools.parseSlotData(i);
      if (s != undefined) {
        saves.push([i, s, s.timestamp]);
      }
    }
    saves.sort((a, b): integer => {return (b[2] as number) - (a[2] as number)})
    if (log) console.log(saves)
    if (saves == undefined) return undefined;
    if (saves[0] == undefined) return undefined;
    var validSaves: Array<Array<SessionSaveData | number>> = []
    var hasNormal = false;
    var hasDaily = false;
    for (var i = 0; i < saves.length; i++) {
      if ((saves[i][1] as SessionSaveData).gameMode == GameModes.DAILY && !hasDaily) {
        hasDaily = true;
        validSaves.push(saves[i])
      }
      if ((saves[i][1] as SessionSaveData).gameMode != GameModes.DAILY && !hasNormal) {
        hasNormal = true;
        validSaves.push(saves[i])
      }
    }
    console.log(saves, validSaves)
    if (validSaves.length == 0)
      return undefined;
    return validSaves.map(f => f[1] as SessionSaveData);
  }
  getSaves(log?: boolean, dailyOnly?: boolean): SessionSaveData[] | undefined {
    var saves: Array<Array<any>> = [];
    for (var i = 0; i < 5; i++) {
      var s = LoggerTools.parseSlotData(i);
      if (s != undefined) {
        if (!dailyOnly || s.gameMode == GameModes.DAILY) {
          saves.push([i, s, s.timestamp]);
        }
      }
    }
    saves.sort((a, b): integer => {return b[2] - a[2]})
    if (log) console.log(saves)
    if (saves == undefined) return undefined;
    return saves.map(f => f[1]);
  }
  getSavesUnsorted(log?: boolean, dailyOnly?: boolean): SessionSaveData[] | undefined {
    var saves: Array<Array<any>> = [];
    for (var i = 0; i < 5; i++) {
      var s = LoggerTools.parseSlotData(i);
      if (s != undefined) {
        if (!dailyOnly || s.gameMode == GameModes.DAILY) {
          saves.push([i, s, s.timestamp]);
        }
      }
    }
    if (log) console.log(saves)
    if (saves == undefined) return undefined;
    return saves.map(f => f[1]);
  }

  callEnd(): boolean {
    this.scene.clearPhaseQueue();
    this.scene.pushPhase(new TitlePhase(this.scene));
    super.end();
    return true;
  }

  showLoggerOptions(txt: string, options: OptionSelectItem[]): boolean {
    this.scene.ui.showText("Export or clear game logs.", null, () => this.scene.ui.setOverlayMode(Mode.OPTION_SELECT, { options: options }));
    return true;
  }

  logMenu(): boolean {
    const options: OptionSelectItem[] = [];
    LoggerTools.getLogs()
    for (var i = 0; i < LoggerTools.logs.length; i++) {
      if (localStorage.getItem(LoggerTools.logs[i][1]) != null) {
        options.push(LoggerTools.generateOption(i, this.getSaves()) as OptionSelectItem)
      } else {
        //options.push(LoggerTools.generateAddOption(i, this.scene, this))
      }
    }
    options.push({
      label: "Delete all",
      handler: () => {
        for (var i = 0; i < LoggerTools.logs.length; i++) {
          if (localStorage.getItem(LoggerTools.logs[i][1]) != null) {
            localStorage.removeItem(LoggerTools.logs[i][1])
          }
        }
        this.scene.clearPhaseQueue();
        this.scene.pushPhase(new TitlePhase(this.scene));
        super.end();
        return true;
      }
    }, {
      label: i18next.t("menu:cancel"),
      handler: () => {
        this.scene.clearPhaseQueue();
        this.scene.pushPhase(new TitlePhase(this.scene));
        super.end();
        return true;
      }
    });
    this.scene.ui.showText("Export or clear game logs.", null, () => this.scene.ui.setOverlayMode(Mode.OPTION_SELECT, { options: options }));
    return true;
  }
  logRenameMenu(): boolean {
    const options: OptionSelectItem[] = [];
    LoggerTools.getLogs()
    this.setBiomeByType(Biome.FACTORY)
    for (var i = 0; i < LoggerTools.logs.length; i++) {
      if (localStorage.getItem(LoggerTools.logs[i][1]) != null) {
        options.push(LoggerTools.generateEditOption(this.scene, i, this.getSaves(), this) as OptionSelectItem)
      } else {
        //options.push(LoggerTools.generateAddOption(i, this.scene, this))
      }
    }
    options.push({
      label: "Delete all",
      handler: () => {
        for (var i = 0; i < LoggerTools.logs.length; i++) {
          if (localStorage.getItem(LoggerTools.logs[i][1]) != null) {
            localStorage.removeItem(LoggerTools.logs[i][1])
          }
        }
        this.scene.clearPhaseQueue();
        this.scene.pushPhase(new TitlePhase(this.scene));
        super.end();
        return true;
      }
    }, {
      label: i18next.t("menu:cancel"),
      handler: () => {
        this.scene.clearPhaseQueue();
        this.scene.pushPhase(new TitlePhase(this.scene));
        super.end();
        return true;
      }
    });
    this.scene.ui.showText("Export, rename, or delete logs.", null, () => this.scene.ui.setOverlayMode(Mode.OPTION_SELECT, { options: options }));
    return true;
  }

  showOptions(): void {
    this.scene.biomeChangeMode = true
    const options: OptionSelectItem[] = [];
    if (false)
    if (loggedInUser && loggedInUser!.lastSessionSlot > -1) {
      options.push({
        label: i18next.t("continue", {ns: "menu"}),
        handler: () => {
          this.loadSaveSlot(this.lastSessionData ? -1 : loggedInUser!.lastSessionSlot);
          return true;
        }
      });
    }
    // Replaces 'Continue' with all Daily Run saves, sorted by when they last saved
    // If there are no daily runs, it instead shows the most recently saved run
    // If this fails too, there are no saves, and the option does not appear
    var lastsaves = this.getSaves(false, true); // Gets all Daily Runs sorted by last play time
    var lastsave = this.getLastSave(); // Gets the last save you played
    var ls1 = this.getLastSave(false, true)
    var ls2 = this.getLastSavesOfEach()
    this.scene.quickloadDisplayMode = "Both"
    switch (true) {
      case (this.scene.quickloadDisplayMode == "Daily" && ls1 != undefined):
        options.push({
          label: (ls1.description ? ls1.description : "[???]"),
          handler: () => {
            this.loadSaveSlot(ls1!.slot);
            return true;
          }
        })
        break;
      case this.scene.quickloadDisplayMode == "Dailies" && lastsaves != undefined && ls1 != undefined:
        lastsaves.forEach(lastsave1 => {
          options.push({
            label: (lastsave1.description ? lastsave1.description : "[???]"),
            handler: () => {
              this.loadSaveSlot(lastsave1.slot);
              return true;
            }
          })
        })
        break;
      case lastsave != undefined && (this.scene.quickloadDisplayMode == "Latest" || ((this.scene.quickloadDisplayMode == "Daily" || this.scene.quickloadDisplayMode == "Dailies") && ls1 == undefined)):
        options.push({
          label: (lastsave.description ? lastsave.description : "[???]"),
          handler: () => {
            this.loadSaveSlot(lastsave!.slot);
            return true;
          }
        })
        break;
      case this.scene.quickloadDisplayMode == "Both" && ls2 != undefined:
        ls2.forEach(lastsave2 => {
          options.push({
            label: (lastsave2.description ? lastsave2.description : "[???]"),
            handler: () => {
              this.loadSaveSlot(lastsave2.slot);
              return true;
            }
          })
        })
        break;
      default: // If set to "Off" or all above conditions failed
        if (loggedInUser && loggedInUser.lastSessionSlot > -1) {
          options.push({
            label: i18next.t("continue", { ns: "menu"}),
            handler: () => {
              this.loadSaveSlot(this.lastSessionData ? -1 : loggedInUser!.lastSessionSlot);
              return true;
            }
          });
        }
        break;
    }
    options.push({
      label: i18next.t("menu:newGame"),
      handler: () => {
        this.scene.biomeChangeMode = false
        this.setBiomeByType(Biome.TOWN)
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
            label: i18next.t("menuUiHandler:importSession"),
            handler: () => {
              this.confirmSlot(i18next.t("menuUiHandler:importSlotSelect"), () => true, slotId => this.scene.gameData.importData(GameDataType.SESSION, slotId));
              return true;
            },
            keepOpen: true
          })
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
          const options: OptionSelectItem[] = [
            {
              label: GameMode.getModeName(GameModes.CLASSIC),
              handler: () => {
                setModeAndEnd(GameModes.CLASSIC);
                return true;
              }
            }
          ];
          options.push({
            label: i18next.t("menuUiHandler:importSession"),
            handler: () => {
              this.confirmSlot(i18next.t("menuUiHandler:importSlotSelect"), () => true, slotId => this.scene.gameData.importData(GameDataType.SESSION, slotId));
              return true;
            },
            keepOpen: true
          })
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
        }
        return true;
      }
    }, {
      label: "Manage Logs",
      handler: () => {
        this.scene.biomeChangeMode = false
        //return this.logRenameMenu()
        this.scene.ui.setOverlayMode(Mode.LOG_HANDLER,
          (k: string) => {
            if (k === undefined) {
              return this.showOptions();
            }
            console.log(k)
            this.showOptions();
          }, () => {
            this.showOptions();
          });
        return true;
      }
    }, {
      label: "Manage Logs (Old Menu)",
      handler: () => {
        return this.logRenameMenu()
      }
    })
    options.push({
      label: i18next.t("menu:loadGame"),
      handler: () => {
        this.scene.biomeChangeMode = false
        this.scene.ui.setOverlayMode(Mode.SAVE_SLOT, SaveSlotUiMode.LOAD,
          (slotId: integer, autoSlot: integer) => {
            if (slotId === -1) {
              return this.showOptions();
            }
            this.loadSaveSlot(slotId, autoSlot);
          });
        return true;
      }
    })
    if (false) {
      options.push({
        label: i18next.t("menu:dailyRun"),
        handler: () => {
          this.scene.biomeChangeMode = false
          this.setupDaily();
          return true;
        },
        keepOpen: true
      })
    }
    options.push({
      label: i18next.t("menu:settings"),
      handler: () => {
        this.scene.biomeChangeMode = false
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

  loadSaveSlot(slotId: integer, autoSlot?: integer): void {
    this.scene.sessionSlotId = slotId > -1 || !loggedInUser ? slotId : loggedInUser.lastSessionSlot;
    this.scene.ui.setMode(Mode.MESSAGE);
    this.scene.ui.resetModeChain();
    this.scene.gameData.loadSession(this.scene, slotId, slotId === -1 ? this.lastSessionData : undefined, autoSlot).then((success: boolean) => {
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
          .concat(getDailyRunStarterModifiers(party))
          .filter((m) => m !== null);

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
  setupDaily(): void {
    // TODO
    var saves = this.getSaves()
    var saveNames = new Array(5).fill("")
    for (var i = 0; i < saves!.length; i++) {
      saveNames[saves![i][0]] = saves![i][1].description
    }
    const ui = this.scene.ui
    const confirmSlot = (message: string, slotFilter: (i: integer) => boolean, callback: (i: integer) => void) => {
      ui.revertMode();
      ui.showText(message, null, () => {
        const config: OptionSelectConfig = {
          options: new Array(5).fill(null).map((_, i) => i).filter(slotFilter).map(i => {
            return {
              label: (i+1) + " " + saveNames[i],
              handler: () => {
                callback(i);
                ui.revertMode();
                ui.showText("", 0);
                return true;
              }
            };
          }).concat([{
            label: i18next.t("menuUiHandler:cancel"),
            handler: () => {
              ui.revertMode();
              ui.showText("", 0);
              return true;
            }
          }]),
          xOffset: 98
        };
        ui.setOverlayMode(Mode.MENU_OPTION_SELECT, config);
      });
    };
    ui.showText("This feature is incomplete.", null, () => {
      this.scene.clearPhaseQueue();
      this.scene.pushPhase(new TitlePhase(this.scene));
      super.end();
      return true;
    })
    return;
    confirmSlot("Select a slot to replace.", () => true, slotId => this.scene.gameData.importData(GameDataType.SESSION, slotId));
  }
  end(): void {
    this.scene.biomeChangeMode = false
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
      if (vouchers.hasOwnProperty(achv) && achv !== "CLASSIC_VICTORY") {
        this.scene.validateVoucher(vouchers[achv]);
      }
    }

    super.end();
  }
}
