import { clientSessionId } from "#app/account";
import { BattleType } from "#app/battle";
import { gScene } from "#app/battle-scene";
import { getCharVariantFromDialogue } from "#app/data/dialogue";
import { pokemonEvolutions } from "#app/data/balance/pokemon-evolutions";
import PokemonSpecies, { getPokemonSpecies } from "#app/data/pokemon-species";
import { trainerConfigs } from "#app/data/trainer-config";
import Pokemon from "#app/field/pokemon";
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
import { Mode } from "#app/ui/ui";
import * as Utils from "#app/utils";
import { PlayerGender } from "#enums/player-gender";
import { TrainerType } from "#enums/trainer-type";
import i18next from "i18next";

export class GameOverPhase extends BattlePhase {
  private victory: boolean;
  private firstRibbons: PokemonSpecies[] = [];

  constructor(victory?: boolean) {
    super();

    this.victory = !!victory;
  }

  start() {
    super.start();

    // Failsafe if players somehow skip floor 200 in classic mode
    if (gScene.gameMode.isClassic && gScene.currentBattle.waveIndex > 200) {
      this.victory = true;
    }

    // Handle Mystery Encounter special Game Over cases
    // Situations such as when player lost a battle, but it isn't treated as full Game Over
    if (!this.victory && gScene.currentBattle.mysteryEncounter?.onGameOver && !gScene.currentBattle.mysteryEncounter.onGameOver()) {
      // Do not end the game
      return this.end();
    }
    // Otherwise, continue standard Game Over logic

    if (this.victory && gScene.gameMode.isEndless) {
      const genderIndex = gScene.gameData.gender ?? PlayerGender.UNSET;
      const genderStr = PlayerGender[genderIndex].toLowerCase();
      gScene.ui.showDialogue(i18next.t("miscDialogue:ending_endless", { context: genderStr }), i18next.t("miscDialogue:ending_name"), 0, () => this.handleGameOver());
    } else if (this.victory || !gScene.enableRetries) {
      this.handleGameOver();
    } else {
      gScene.ui.showText(i18next.t("battle:retryBattle"), null, () => {
        gScene.ui.setMode(Mode.CONFIRM, () => {
          gScene.ui.fadeOut(1250).then(() => {
            gScene.reset();
            gScene.clearPhaseQueue();
            gScene.gameData.loadSession(gScene.sessionSlotId).then(() => {
              gScene.pushPhase(new EncounterPhase(true));

              const availablePartyMembers = gScene.getParty().filter(p => p.isAllowedInBattle()).length;

              gScene.pushPhase(new SummonPhase(0));
              if (gScene.currentBattle.double && availablePartyMembers > 1) {
                gScene.pushPhase(new SummonPhase(1));
              }
              if (gScene.currentBattle.waveIndex > 1 && gScene.currentBattle.battleType !== BattleType.TRAINER) {
                gScene.pushPhase(new CheckSwitchPhase(0, gScene.currentBattle.double));
                if (gScene.currentBattle.double && availablePartyMembers > 1) {
                  gScene.pushPhase(new CheckSwitchPhase(1, gScene.currentBattle.double));
                }
              }

              gScene.ui.fadeIn(1250);
              this.end();
            });
          });
        }, () => this.handleGameOver(), false, 0, 0, 1000);
      });
    }
  }

  handleGameOver(): void {
    const doGameOver = (newClear: boolean) => {
      gScene.disableMenu = true;
      gScene.time.delayedCall(1000, () => {
        let firstClear = false;
        if (this.victory && newClear) {
          if (gScene.gameMode.isClassic) {
            firstClear = gScene.validateAchv(achvs.CLASSIC_VICTORY);
            gScene.validateAchv(achvs.UNEVOLVED_CLASSIC_VICTORY);
            gScene.gameData.gameStats.sessionsWon++;
            for (const pokemon of gScene.getParty()) {
              this.awardRibbon(pokemon);

              if (pokemon.species.getRootSpeciesId() !== pokemon.species.getRootSpeciesId(true)) {
                this.awardRibbon(pokemon, true);
              }
            }
          } else if (gScene.gameMode.isDaily && newClear) {
            gScene.gameData.gameStats.dailyRunSessionsWon++;
          }
        }
        gScene.gameData.saveRunHistory(gScene.gameData.getSessionSaveData(), this.victory);
        const fadeDuration = this.victory ? 10000 : 5000;
        gScene.fadeOutBgm(fadeDuration, true);
        const activeBattlers = gScene.getField().filter(p => p?.isActive(true));
        activeBattlers.map(p => p.hideInfo());
        gScene.ui.fadeOut(fadeDuration).then(() => {
          activeBattlers.map(a => a.setVisible(false));
          gScene.setFieldScale(1, true);
          gScene.clearPhaseQueue();
          gScene.ui.clearText();

          if (this.victory && gScene.gameMode.isChallenge) {
            gScene.gameMode.challenges.forEach(c => gScene.validateAchvs(ChallengeAchv, c));
          }

          const clear = (endCardPhase?: EndCardPhase) => {
            if (newClear) {
              this.handleUnlocks();
            }
            if (this.victory && newClear) {
              for (const species of this.firstRibbons) {
                gScene.unshiftPhase(new RibbonModifierRewardPhase(modifierTypes.VOUCHER_PLUS, species));
              }
              if (!firstClear) {
                gScene.unshiftPhase(new GameOverModifierRewardPhase(modifierTypes.VOUCHER_PREMIUM));
              }
            }
            gScene.pushPhase(new PostGameOverPhase(endCardPhase));
            this.end();
          };

          if (this.victory && gScene.gameMode.isClassic) {
            const dialogueKey = "miscDialogue:ending";

            if (!gScene.ui.shouldSkipDialogue(dialogueKey)) {
              gScene.ui.fadeIn(500).then(() => {
                const genderIndex = gScene.gameData.gender ?? PlayerGender.UNSET;
                const genderStr = PlayerGender[genderIndex].toLowerCase();
                // Dialogue has to be retrieved so that the rival's expressions can be loaded and shown via getCharVariantFromDialogue
                const dialogue = i18next.t(dialogueKey, { context: genderStr });
                gScene.charSprite.showCharacter(`rival_${gScene.gameData.gender === PlayerGender.FEMALE ? "m" : "f"}`, getCharVariantFromDialogue(dialogue)).then(() => {
                  gScene.ui.showDialogue(dialogueKey, gScene.gameData.gender === PlayerGender.FEMALE ? trainerConfigs[TrainerType.RIVAL].name : trainerConfigs[TrainerType.RIVAL].nameFemale, null, () => {
                    gScene.ui.fadeOut(500).then(() => {
                      gScene.charSprite.hide().then(() => {
                        const endCardPhase = new EndCardPhase();
                        gScene.unshiftPhase(endCardPhase);
                        clear(endCardPhase);
                      });
                    });
                  });
                });
              });
            } else {
              const endCardPhase = new EndCardPhase();
              gScene.unshiftPhase(endCardPhase);
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
        Utils.apiFetch(`savedata/session/newclear?slot=${gScene.sessionSlotId}&clientSessionId=${clientSessionId}`, true)
          .then(response => response.json())
          .then(newClear => doGameOver(newClear));
      } else {
        gScene.gameData.offlineNewClear().then(result => {
          doGameOver(result);
        });
      }
    } else {
      doGameOver(false);
    }
  }

  handleUnlocks(): void {
    if (this.victory && gScene.gameMode.isClassic) {
      if (!gScene.gameData.unlocks[Unlockables.ENDLESS_MODE]) {
        gScene.unshiftPhase(new UnlockPhase(Unlockables.ENDLESS_MODE));
      }
      if (gScene.getParty().filter(p => p.fusionSpecies).length && !gScene.gameData.unlocks[Unlockables.SPLICED_ENDLESS_MODE]) {
        gScene.unshiftPhase(new UnlockPhase(Unlockables.SPLICED_ENDLESS_MODE));
      }
      if (!gScene.gameData.unlocks[Unlockables.MINI_BLACK_HOLE]) {
        gScene.unshiftPhase(new UnlockPhase(Unlockables.MINI_BLACK_HOLE));
      }
      if (!gScene.gameData.unlocks[Unlockables.EVIOLITE] && gScene.getParty().some(p => p.getSpeciesForm(true).speciesId in pokemonEvolutions)) {
        gScene.unshiftPhase(new UnlockPhase(Unlockables.EVIOLITE));
      }
    }
  }

  awardRibbon(pokemon: Pokemon, forStarter: boolean = false): void {
    const speciesId = getPokemonSpecies(pokemon.species.speciesId);
    const speciesRibbonCount = gScene.gameData.incrementRibbonCount(speciesId, forStarter);
    // first time classic win, award voucher
    if (speciesRibbonCount === 1) {
      this.firstRibbons.push(getPokemonSpecies(pokemon.species.getRootSpeciesId(forStarter)));
    }
  }
}

