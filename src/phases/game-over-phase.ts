import { clientSessionId } from "#app/account";
import { BattleType } from "#enums/battle-type";
import { globalScene } from "#app/global-scene";
import { pokemonEvolutions } from "#app/data/balance/pokemon-evolutions";
import { getCharVariantFromDialogue } from "#app/data/dialogue";
import type PokemonSpecies from "#app/data/pokemon-species";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { trainerConfigs } from "#app/data/trainers/trainer-config";
import type Pokemon from "#app/field/pokemon";
import { modifierTypes } from "#app/modifier/modifier-type";
import { BattlePhase } from "#app/phases/battle-phase";
import { CheckSwitchPhase } from "#app/phases/check-switch-phase";
import { EncounterPhase } from "#app/phases/encounter-phase";
import { EndCardPhase } from "#app/phases/end-card-phase";
import { GameOverModifierRewardPhase } from "#app/phases/game-over-modifier-reward-phase";
import { PostGameOverPhase } from "#app/phases/post-game-over-phase";
import { RibbonModifierRewardPhase } from "#app/phases/ribbon-modifier-reward-phase";
import { SummonPhase } from "#app/phases/summon-phase";
import { UnlockPhase } from "#app/phases/unlock-phase";
import { achvs, ChallengeAchv } from "#app/system/achv";
import { Unlockables } from "#app/system/unlockables";
import { UiMode } from "#enums/ui-mode";
import { isLocal, isLocalServerConnected } from "#app/utils/common";
import { PlayerGender } from "#enums/player-gender";
import { TrainerType } from "#enums/trainer-type";
import i18next from "i18next";
import type { SessionSaveData } from "#app/system/game-data";
import PersistentModifierData from "#app/system/modifier-data";
import PokemonData from "#app/system/pokemon-data";
import ChallengeData from "#app/system/challenge-data";
import TrainerData from "#app/system/trainer-data";
import ArenaData from "#app/system/arena-data";
import { pokerogueApi } from "#app/plugins/api/pokerogue-api";

export class GameOverPhase extends BattlePhase {
  private isVictory: boolean;
  private firstRibbons: PokemonSpecies[] = [];

  constructor(isVictory = false) {
    super();

    this.isVictory = isVictory;
  }

  start() {
    super.start();

    globalScene.hideAbilityBar();

    // Failsafe if players somehow skip floor 200 in classic mode
    if (globalScene.gameMode.isClassic && globalScene.currentBattle.waveIndex > 200) {
      this.isVictory = true;
    }

    // Handle Mystery Encounter special Game Over cases
    // Situations such as when player lost a battle, but it isn't treated as full Game Over
    if (
      !this.isVictory &&
      globalScene.currentBattle.mysteryEncounter?.onGameOver &&
      !globalScene.currentBattle.mysteryEncounter.onGameOver()
    ) {
      // Do not end the game
      return this.end();
    }
    // Otherwise, continue standard Game Over logic

    if (this.isVictory && globalScene.gameMode.isEndless) {
      const genderIndex = globalScene.gameData.gender ?? PlayerGender.UNSET;
      const genderStr = PlayerGender[genderIndex].toLowerCase();
      globalScene.ui.showDialogue(
        i18next.t("miscDialogue:ending_endless", { context: genderStr }),
        i18next.t("miscDialogue:ending_name"),
        0,
        () => this.handleGameOver(),
      );
    } else if (this.isVictory || !globalScene.enableRetries) {
      this.handleGameOver();
    } else {
      globalScene.ui.showText(i18next.t("battle:retryBattle"), null, () => {
        globalScene.ui.setMode(
          UiMode.CONFIRM,
          () => {
            globalScene.ui.fadeOut(1250).then(() => {
              globalScene.reset();
              globalScene.clearPhaseQueue();
              globalScene.gameData.loadSession(globalScene.sessionSlotId).then(() => {
                globalScene.pushPhase(new EncounterPhase(true));

                const availablePartyMembers = globalScene.getPokemonAllowedInBattle().length;

                globalScene.pushPhase(new SummonPhase(0));
                if (globalScene.currentBattle.double && availablePartyMembers > 1) {
                  globalScene.pushPhase(new SummonPhase(1));
                }
                if (
                  globalScene.currentBattle.waveIndex > 1 &&
                  globalScene.currentBattle.battleType !== BattleType.TRAINER
                ) {
                  globalScene.pushPhase(new CheckSwitchPhase(0, globalScene.currentBattle.double));
                  if (globalScene.currentBattle.double && availablePartyMembers > 1) {
                    globalScene.pushPhase(new CheckSwitchPhase(1, globalScene.currentBattle.double));
                  }
                }

                globalScene.ui.fadeIn(1250);
                this.end();
              });
            });
          },
          () => this.handleGameOver(),
          false,
          0,
          0,
          1000,
        );
      });
    }
  }

  handleGameOver(): void {
    const doGameOver = (newClear: boolean) => {
      globalScene.disableMenu = true;
      globalScene.time.delayedCall(1000, () => {
        let firstClear = false;
        if (this.isVictory && newClear) {
          if (globalScene.gameMode.isClassic) {
            firstClear = globalScene.validateAchv(achvs.CLASSIC_VICTORY);
            globalScene.validateAchv(achvs.UNEVOLVED_CLASSIC_VICTORY);
            globalScene.gameData.gameStats.sessionsWon++;
            for (const pokemon of globalScene.getPlayerParty()) {
              this.awardRibbon(pokemon);

              if (pokemon.species.getRootSpeciesId() !== pokemon.species.getRootSpeciesId(true)) {
                this.awardRibbon(pokemon, true);
              }
            }
          } else if (globalScene.gameMode.isDaily && newClear) {
            globalScene.gameData.gameStats.dailyRunSessionsWon++;
          }
        }

        const fadeDuration = this.isVictory ? 10000 : 5000;
        globalScene.fadeOutBgm(fadeDuration, true);
        const activeBattlers = globalScene.getField().filter(p => p?.isActive(true));
        activeBattlers.map(p => p.hideInfo());
        globalScene.ui.fadeOut(fadeDuration).then(() => {
          activeBattlers.map(a => a.setVisible(false));
          globalScene.setFieldScale(1, true);
          globalScene.clearPhaseQueue();
          globalScene.ui.clearText();

          if (this.isVictory && globalScene.gameMode.isChallenge) {
            globalScene.gameMode.challenges.forEach(c => globalScene.validateAchvs(ChallengeAchv, c));
          }

          const clear = (endCardPhase?: EndCardPhase) => {
            if (this.isVictory && newClear) {
              this.handleUnlocks();

              for (const species of this.firstRibbons) {
                globalScene.unshiftPhase(new RibbonModifierRewardPhase(modifierTypes.VOUCHER_PLUS, species));
              }
              if (!firstClear) {
                globalScene.unshiftPhase(new GameOverModifierRewardPhase(modifierTypes.VOUCHER_PREMIUM));
              }
            }
            this.getRunHistoryEntry().then(runHistoryEntry => {
              globalScene.gameData.saveRunHistory(runHistoryEntry, this.isVictory);
              globalScene.pushPhase(new PostGameOverPhase(endCardPhase));
              this.end();
            });
          };

          if (this.isVictory && globalScene.gameMode.isClassic) {
            const dialogueKey = "miscDialogue:ending";

            if (!globalScene.ui.shouldSkipDialogue(dialogueKey)) {
              globalScene.ui.fadeIn(500).then(() => {
                const genderIndex = globalScene.gameData.gender ?? PlayerGender.UNSET;
                const genderStr = PlayerGender[genderIndex].toLowerCase();
                // Dialogue has to be retrieved so that the rival's expressions can be loaded and shown via getCharVariantFromDialogue
                const dialogue = i18next.t(dialogueKey, { context: genderStr });
                globalScene.charSprite
                  .showCharacter(
                    `rival_${globalScene.gameData.gender === PlayerGender.FEMALE ? "m" : "f"}`,
                    getCharVariantFromDialogue(dialogue),
                  )
                  .then(() => {
                    globalScene.ui.showDialogue(
                      dialogueKey,
                      globalScene.gameData.gender === PlayerGender.FEMALE
                        ? trainerConfigs[TrainerType.RIVAL].name
                        : trainerConfigs[TrainerType.RIVAL].nameFemale,
                      null,
                      () => {
                        globalScene.ui.fadeOut(500).then(() => {
                          globalScene.charSprite.hide().then(() => {
                            const endCardPhase = new EndCardPhase();
                            globalScene.unshiftPhase(endCardPhase);
                            clear(endCardPhase);
                          });
                        });
                      },
                    );
                  });
              });
            } else {
              const endCardPhase = new EndCardPhase();
              globalScene.unshiftPhase(endCardPhase);
              clear(endCardPhase);
            }
          } else {
            clear();
          }
        });
      });
    };

    /* Added a local check to see if the game is running offline
      If Online, execute apiFetch as intended
      If Offline, execute offlineNewClear() only for victory, a localStorage implementation of newClear daily run checks */
    if (!isLocal || isLocalServerConnected) {
      pokerogueApi.savedata.session
        .newclear({
          slot: globalScene.sessionSlotId,
          isVictory: this.isVictory,
          clientSessionId: clientSessionId,
        })
        .then(success => doGameOver(!!success));
    } else if (this.isVictory) {
      globalScene.gameData.offlineNewClear().then(result => {
        doGameOver(result);
      });
    } else {
      doGameOver(false);
    }
  }

  handleUnlocks(): void {
    if (this.isVictory && globalScene.gameMode.isClassic) {
      if (!globalScene.gameData.unlocks[Unlockables.ENDLESS_MODE]) {
        globalScene.unshiftPhase(new UnlockPhase(Unlockables.ENDLESS_MODE));
      }
      if (
        globalScene.getPlayerParty().filter(p => p.fusionSpecies).length &&
        !globalScene.gameData.unlocks[Unlockables.SPLICED_ENDLESS_MODE]
      ) {
        globalScene.unshiftPhase(new UnlockPhase(Unlockables.SPLICED_ENDLESS_MODE));
      }
      if (!globalScene.gameData.unlocks[Unlockables.MINI_BLACK_HOLE]) {
        globalScene.unshiftPhase(new UnlockPhase(Unlockables.MINI_BLACK_HOLE));
      }
      if (
        !globalScene.gameData.unlocks[Unlockables.EVIOLITE] &&
        globalScene.getPlayerParty().some(p => p.getSpeciesForm(true).speciesId in pokemonEvolutions)
      ) {
        globalScene.unshiftPhase(new UnlockPhase(Unlockables.EVIOLITE));
      }
    }
  }

  awardRibbon(pokemon: Pokemon, forStarter = false): void {
    const speciesId = getPokemonSpecies(pokemon.species.speciesId);
    const speciesRibbonCount = globalScene.gameData.incrementRibbonCount(speciesId, forStarter);
    // first time classic win, award voucher
    if (speciesRibbonCount === 1) {
      this.firstRibbons.push(getPokemonSpecies(pokemon.species.getRootSpeciesId(forStarter)));
    }
  }

  // TODO: Make function use existing getSessionSaveData() function and then modify the values from there.
  /**
   * Slightly modified version of {@linkcode GameData.getSessionSaveData}.
   * @returns A promise containing the {@linkcode SessionSaveData}
   */
  private async getRunHistoryEntry(): Promise<SessionSaveData> {
    const preWaveSessionData = await globalScene.gameData.getSession(globalScene.sessionSlotId);
    return {
      seed: globalScene.seed,
      playTime: globalScene.sessionPlayTime,
      gameMode: globalScene.gameMode.modeId,
      party: globalScene.getPlayerParty().map(p => new PokemonData(p)),
      enemyParty: globalScene.getEnemyParty().map(p => new PokemonData(p)),
      modifiers: preWaveSessionData
        ? preWaveSessionData.modifiers
        : globalScene.findModifiers(() => true).map(m => new PersistentModifierData(m, true)),
      enemyModifiers: preWaveSessionData
        ? preWaveSessionData.enemyModifiers
        : globalScene.findModifiers(() => true, false).map(m => new PersistentModifierData(m, false)),
      arena: new ArenaData(globalScene.arena),
      pokeballCounts: globalScene.pokeballCounts,
      money: Math.floor(globalScene.money),
      score: globalScene.score,
      waveIndex: globalScene.currentBattle.waveIndex,
      battleType: globalScene.currentBattle.battleType,
      trainer: globalScene.currentBattle.trainer ? new TrainerData(globalScene.currentBattle.trainer) : null,
      gameVersion: globalScene.game.config.gameVersion,
      timestamp: new Date().getTime(),
      challenges: globalScene.gameMode.challenges.map(c => new ChallengeData(c)),
      mysteryEncounterType: globalScene.currentBattle.mysteryEncounter?.encounterType ?? -1,
      mysteryEncounterSaveData: globalScene.mysteryEncounterSaveData,
      playerFaints: globalScene.arena.playerFaints,
    } as SessionSaveData;
  }
}
