import { pokerogueApi } from "#api/pokerogue-api";
import { clientSessionId } from "#app/account";
import { globalScene } from "#app/global-scene";
import { pokemonEvolutions } from "#balance/pokemon-evolutions";
import { modifierTypes } from "#data/data-lists";
import { getCharVariantFromDialogue } from "#data/dialogue";
import type { PokemonSpecies } from "#data/pokemon-species";
import { BattleType } from "#enums/battle-type";
import { PlayerGender } from "#enums/player-gender";
import { TrainerType } from "#enums/trainer-type";
import { UiMode } from "#enums/ui-mode";
import { Unlockables } from "#enums/unlockables";
import type { Pokemon } from "#field/pokemon";
import { BattlePhase } from "#phases/battle-phase";
import type { EndCardPhase } from "#phases/end-card-phase";
import { achvs, ChallengeAchv } from "#system/achv";
import { ArenaData } from "#system/arena-data";
import { ChallengeData } from "#system/challenge-data";
import type { SessionSaveData } from "#system/game-data";
import { ModifierData as PersistentModifierData } from "#system/modifier-data";
import { PokemonData } from "#system/pokemon-data";
import { RibbonData, type RibbonFlag } from "#system/ribbons/ribbon-data";
import { awardRibbonsToSpeciesLine } from "#system/ribbons/ribbon-methods";
import { TrainerData } from "#system/trainer-data";
import { trainerConfigs } from "#trainers/trainer-config";
import { checkSpeciesValidForChallenge, isNuzlockeChallenge } from "#utils/challenge-utils";
import { isLocal, isLocalServerConnected } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";

export class GameOverPhase extends BattlePhase {
  public readonly phaseName = "GameOverPhase";
  private isVictory: boolean;
  private firstRibbons: PokemonSpecies[] = [];

  constructor(isVictory = false) {
    super();

    this.isVictory = isVictory;
  }

  start() {
    super.start();

    globalScene.phaseManager.hideAbilityBar();

    // Failsafe if players somehow skip floor 200 in classic mode
    if (globalScene.gameMode.isClassic && globalScene.currentBattle.waveIndex > 200) {
      this.isVictory = true;
    }

    // Handle Mystery Encounter special Game Over cases
    // Situations such as when player lost a battle, but it isn't treated as full Game Over
    if (
      !this.isVictory
      && globalScene.currentBattle.mysteryEncounter?.onGameOver
      && !globalScene.currentBattle.mysteryEncounter.onGameOver()
    ) {
      // Do not end the game
      return this.end();
    }
    // Otherwise, continue standard Game Over logic

    if (this.isVictory && globalScene.gameMode.isEndless) {
      const genderIndex = globalScene.gameData.gender ?? PlayerGender.UNSET;
      const genderStr = PlayerGender[genderIndex].toLowerCase();
      globalScene.ui.showDialogue(
        i18next.t("miscDialogue:endingEndless", { context: genderStr }),
        i18next.t("miscDialogue:endingName"),
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
              globalScene.phaseManager.clearPhaseQueue();
              globalScene.gameData.loadSession(globalScene.sessionSlotId).then(() => {
                globalScene.phaseManager.pushNew("EncounterPhase", true);

                const availablePartyMembers = globalScene.getPokemonAllowedInBattle().length;

                globalScene.phaseManager.pushNew("SummonPhase", 0);
                if (globalScene.currentBattle.double && availablePartyMembers > 1) {
                  globalScene.phaseManager.pushNew("SummonPhase", 1);
                }
                if (
                  globalScene.currentBattle.waveIndex > 1
                  && globalScene.currentBattle.battleType !== BattleType.TRAINER
                ) {
                  globalScene.phaseManager.pushNew("CheckSwitchPhase", 0, globalScene.currentBattle.double);
                  if (globalScene.currentBattle.double && availablePartyMembers > 1) {
                    globalScene.phaseManager.pushNew("CheckSwitchPhase", 1, globalScene.currentBattle.double);
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

  /**
   * Submethod of {@linkcode handleGameOver} that awards ribbons to Pokémon in the player's party based on the current
   * game mode and challenges.
   */
  private awardRibbons(): void {
    let ribbonFlags = 0n;
    for (const challenge of globalScene.gameMode.challenges) {
      const ribbon = challenge.ribbonAwarded;
      if (challenge.value && ribbon) {
        ribbonFlags |= ribbon;
      }
    }
    // Block other ribbons if flip stats or inverse is active
    const flip_or_inverse = ribbonFlags & (RibbonData.FLIP_STATS | RibbonData.INVERSE);
    if (flip_or_inverse) {
      ribbonFlags = flip_or_inverse;
    } else {
      if (globalScene.gameMode.isClassic) {
        ribbonFlags |= RibbonData.CLASSIC;
      }
      if (isNuzlockeChallenge()) {
        ribbonFlags |= RibbonData.NUZLOCKE;
      }
    }
    // Award ribbons to all Pokémon in the player's party that are considered valid
    // for the current game mode and challenges.
    for (const pokemon of globalScene.getPlayerParty()) {
      const species = pokemon.species;
      if (
        checkSpeciesValidForChallenge(
          species,
          globalScene.gameData.getSpeciesDexAttrProps(species, pokemon.getDexAttr()),
          false,
        )
      ) {
        awardRibbonsToSpeciesLine(species.speciesId, ribbonFlags as RibbonFlag);
      }
    }
  }

  handleGameOver(): void {
    const doGameOver = (newClear: boolean) => {
      globalScene.disableMenu = true;
      globalScene.time.delayedCall(1000, () => {
        let firstClear = false;
        if (this.isVictory) {
          if (globalScene.gameMode.isClassic) {
            firstClear = globalScene.validateAchv(achvs.CLASSIC_VICTORY);
            globalScene.validateAchv(achvs.UNEVOLVED_CLASSIC_VICTORY);
            globalScene.gameData.gameStats.sessionsWon++;
            for (const pokemon of globalScene.getPlayerParty()) {
              this.awardFirstClassicCompletion(pokemon);
              if (pokemon.species.getRootSpeciesId() !== pokemon.species.getRootSpeciesId(true)) {
                this.awardFirstClassicCompletion(pokemon, true);
              }
            }
            this.awardRibbons();
          } else if (globalScene.gameMode.isDaily && newClear) {
            globalScene.gameData.gameStats.dailyRunSessionsWon++;
            globalScene.validateAchv(achvs.DAILY_VICTORY);
          }
        }

        const fadeDuration = this.isVictory ? 10000 : 5000;
        globalScene.fadeOutBgm(fadeDuration, true);
        const activeBattlers = globalScene.getField().filter(p => p?.isActive(true));
        activeBattlers.map(p => p.hideInfo());
        globalScene.ui.fadeOut(fadeDuration).then(() => {
          activeBattlers.map(a => a.setVisible(false));
          globalScene.setFieldScale(1, true);
          globalScene.phaseManager.clearPhaseQueue();
          globalScene.ui.clearText();

          if (this.isVictory && globalScene.gameMode.isChallenge) {
            globalScene.gameMode.challenges.forEach(c => globalScene.validateAchvs(ChallengeAchv, c));
          }

          const clear = (endCardPhase?: EndCardPhase) => {
            if (this.isVictory && newClear) {
              this.handleUnlocks();

              for (const species of this.firstRibbons) {
                globalScene.phaseManager.unshiftNew("RibbonModifierRewardPhase", modifierTypes.VOUCHER_PLUS, species);
              }
              if (!firstClear) {
                globalScene.phaseManager.unshiftNew("GameOverModifierRewardPhase", modifierTypes.VOUCHER_PREMIUM);
              }
            }
            this.getRunHistoryEntry().then(runHistoryEntry => {
              globalScene.gameData.saveRunHistory(runHistoryEntry, this.isVictory);
              globalScene.phaseManager.pushNew("PostGameOverPhase", globalScene.sessionSlotId, endCardPhase);
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
                            const endCardPhase = globalScene.phaseManager.create("EndCardPhase");
                            globalScene.phaseManager.unshiftPhase(endCardPhase);
                            clear(endCardPhase);
                          });
                        });
                      },
                    );
                  });
              });
            } else {
              const endCardPhase = globalScene.phaseManager.create("EndCardPhase");
              globalScene.phaseManager.unshiftPhase(endCardPhase);
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
          clientSessionId,
        })
        .then(success => doGameOver(!globalScene.gameMode.isDaily || !!success))
        .catch(_err => {
          globalScene.phaseManager.clearPhaseQueue();
          globalScene.phaseManager.clearPhaseQueueSplice();
          globalScene.phaseManager.unshiftNew("MessagePhase", i18next.t("menu:serverCommunicationFailed"), 2500);
          // force the game to reload after 2 seconds.
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          this.end();
        });
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
        globalScene.phaseManager.unshiftNew("UnlockPhase", Unlockables.ENDLESS_MODE);
      }
      if (
        globalScene.getPlayerParty().filter(p => p.fusionSpecies).length > 0
        && !globalScene.gameData.unlocks[Unlockables.SPLICED_ENDLESS_MODE]
      ) {
        globalScene.phaseManager.unshiftNew("UnlockPhase", Unlockables.SPLICED_ENDLESS_MODE);
      }
      if (!globalScene.gameData.unlocks[Unlockables.MINI_BLACK_HOLE]) {
        globalScene.phaseManager.unshiftNew("UnlockPhase", Unlockables.MINI_BLACK_HOLE);
      }
      if (
        !globalScene.gameData.unlocks[Unlockables.EVIOLITE]
        && globalScene.getPlayerParty().some(p => p.getSpeciesForm(true).speciesId in pokemonEvolutions)
      ) {
        globalScene.phaseManager.unshiftNew("UnlockPhase", Unlockables.EVIOLITE);
      }
    }
  }

  awardFirstClassicCompletion(pokemon: Pokemon, forStarter = false): void {
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
      timestamp: Date.now(),
      challenges: globalScene.gameMode.challenges.map(c => new ChallengeData(c)),
      mysteryEncounterType: globalScene.currentBattle.mysteryEncounter?.encounterType ?? -1,
      mysteryEncounterSaveData: globalScene.mysteryEncounterSaveData,
      playerFaints: globalScene.arena.playerFaints,
    } as SessionSaveData;
  }
}
