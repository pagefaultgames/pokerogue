import { clientSessionId } from "#app/account.js";
import BattleScene from "#app/battle-scene.js";
import { BattleType } from "#app/battle.js";
import { miscDialogue, getCharVariantFromDialogue } from "#app/data/dialogue.js";
import { pokemonEvolutions } from "#app/data/pokemon-evolutions.js";
import PokemonSpecies, { getPokemonSpecies } from "#app/data/pokemon-species.js";
import { trainerConfigs } from "#app/data/trainer-config.js";
import { PlayerGender } from "#app/enums/player-gender.js";
import { TrainerType } from "#app/enums/trainer-type.js";
import Pokemon from "#app/field/pokemon.js";
import { modifierTypes } from "#app/modifier/modifier-type.js";
import { achvs, ChallengeAchv } from "#app/system/achv.js";
import { Unlockables } from "#app/system/unlockables.js";
import { Mode } from "#app/ui/ui.js";
import i18next from "i18next";
import * as Utils from "#app/utils.js";
import { BattlePhase } from "./battle-phase";
import { CheckSwitchPhase } from "./check-switch-phase";
import { EncounterPhase } from "./encounter-phase";
import { GameOverModifierRewardPhase } from "./game-over-modifier-reward-phase";
import { RibbonModifierRewardPhase } from "./ribbon-modifier-reward-phase";
import { SummonPhase } from "./summon-phase";
import { EndCardPhase } from "./end-card-phase";
import { PostGameOverPhase } from "./post-game-over-phase";
import { UnlockPhase } from "./unlock-phase";

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
      this.scene.ui.showText(i18next.t("battle:retryBattle"), null, () => {
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
            this.scene.validateAchv(achvs.UNEVOLVED_CLASSIC_VICTORY);
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
        this.scene.gameData.getSession(this.scene.sessionSlotId).then(sessionData => {
          if (sessionData) {
            this.scene.gameData.saveRunHistory(this.scene, sessionData, this.victory);
          }
        }).catch(err => {
          console.error("Failed to save run to history.", err);
        });
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
        Utils.apiFetch(`savedata/session/newclear?slot=${this.scene.sessionSlotId}&clientSessionId=${clientSessionId}`, true)
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
      if (!this.scene.gameData.unlocks[Unlockables.EVIOLITE] && this.scene.getParty().some(p => p.getSpeciesForm(true).speciesId in pokemonEvolutions)) {
        this.scene.unshiftPhase(new UnlockPhase(this.scene, Unlockables.EVIOLITE));
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
