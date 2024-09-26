import BattleScene from "#app/battle-scene";
import { initMoveAnim, loadMoveAnimAssets } from "#app/data/battle-anims";
import Move, { allMoves } from "#app/data/move";
import { SpeciesFormChangeMoveLearnedTrigger } from "#app/data/pokemon-forms";
import { Moves } from "#app/enums/moves";
import { getPokemonNameWithAffix } from "#app/messages";
import EvolutionSceneHandler from "#app/ui/evolution-scene-handler";
import { SummaryUiMode } from "#app/ui/summary-ui-handler";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import { PlayerPartyMemberPokemonPhase } from "./player-party-member-pokemon-phase";
import Pokemon, { PokemonMove } from "#app/field/pokemon";
import * as LoggerTools from "../logger";

export class LearnMovePhase extends PlayerPartyMemberPokemonPhase {
  private moveId: Moves;
  private messageMode: Mode;
  private fromTM: boolean;

  constructor(scene: BattleScene, partyMemberIndex: integer, moveId: Moves, fromTM?: boolean) {
    super(scene, partyMemberIndex);
    this.moveId = moveId;
    this.fromTM = fromTM ?? false;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    const move = allMoves[this.moveId];
    const currentMoveset = pokemon.getMoveset();

    // The game first checks if the Pokemon already has the move and ends the phase if it does.
    const hasMoveAlready = currentMoveset.some(m => m?.moveId === move.id) && this.moveId !== Moves.SKETCH;
    if (hasMoveAlready) {
      return this.end();
    }

    const emptyMoveIndex = pokemon.getMoveset().length < 4
      ? pokemon.getMoveset().length
      : pokemon.getMoveset().findIndex(m => m === null);

    const messageMode = this.scene.ui.getHandler() instanceof EvolutionSceneHandler
      ? Mode.EVOLUTION_SCENE
      : Mode.MESSAGE;
    const noHandler = () => {
      this.scene.ui.setMode(messageMode).then(() => {
        this.scene.ui.showText(i18next.t("battle:learnMoveStopTeaching", { moveName: move.name }), null, () => {
          this.scene.ui.setModeWithoutClear(Mode.CONFIRM, () => {
            this.scene.ui.setMode(messageMode);
            var W = LoggerTools.getWave(LoggerTools.getDRPD(this.scene), this.scene.currentBattle.waveIndex, this.scene)
            if (W.shop != "") {
              LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, W.shop + "; skip learning it")
            } else {
              var actions = LoggerTools.getActionCount(this.scene, this.scene.currentBattle.waveIndex)
              LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, "Skip " + move.name)
            }
            this.scene.ui.showText(i18next.t("battle:learnMoveNotLearned", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name }), null, () => this.end(), null, true);
          }, (false ? movesFullHandler : () => {
            this.scene.ui.setMode(messageMode);
            this.scene.unshiftPhase(new LearnMovePhase(this.scene, this.partyMemberIndex, this.moveId));
            this.end();
          }));
        });
      });
    };
    const noHandlerInstant = () => {
      this.scene.ui.setMode(messageMode);
      var W = LoggerTools.getWave(LoggerTools.getDRPD(this.scene), this.scene.currentBattle.waveIndex, this.scene)
      if (W.shop != "") {
        LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, W.shop + "; skip learning it")
      } else {
        var actions = LoggerTools.getActionCount(this.scene, this.scene.currentBattle.waveIndex)
        LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, (actions == 0 ? "" : "") + LoggerTools.playerPokeName(this.scene, pokemon) + " | Skip " + move.name)
      }
      this.scene.ui.showText(i18next.t("battle:learnMoveNotLearned", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name }), null, () => this.end(), null, true);
    };
    const movesFullHandler = () => {
      this.scene.ui.showText(i18next.t("battle:learnMovePrompt", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name }), null, () => {
        this.scene.ui.showText(i18next.t("battle:learnMoveLimitReached", { pokemonName: getPokemonNameWithAffix(pokemon) }), null, () => {
          this.scene.ui.showText(i18next.t("battle:learnMoveReplaceQuestion", { moveName: move.name }), null, () => {
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
                      this.scene.ui.showText(i18next.t("battle:learnMoveForgetSuccess", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: pokemon.moveset[moveIndex]!.getName() }), null, () => { // TODO: is the bang correct?
                        this.scene.ui.showText(i18next.t("battle:learnMoveAnd"), null, () => {
                          var W = LoggerTools.getWave(LoggerTools.getDRPD(this.scene), this.scene.currentBattle.waveIndex, this.scene)
                          if (W.shop != "") {
                            LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, W.shop + " | " + new PokemonMove(this.moveId).getName() + " → " + pokemon.moveset[moveIndex]!.getName())
                          } else {
                            var actions = LoggerTools.getActionCount(this.scene, this.scene.currentBattle.waveIndex)
                            LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, (actions == 0 ? "" : "") + LoggerTools.playerPokeName(this.scene, pokemon) + " | " + new PokemonMove(this.moveId).getName() + " → " + pokemon.moveset[moveIndex]!.getName())
                          }
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
    }
    if (emptyMoveIndex > -1) {
      pokemon.setMove(emptyMoveIndex, this.moveId);
      if (this.fromTM) {
        if (!pokemon.usedTMs) {
          pokemon.usedTMs = [];
        }
        pokemon.usedTMs.push(this.moveId);
      }
      initMoveAnim(this.scene, this.moveId).then(() => {
        loadMoveAnimAssets(this.scene, [this.moveId], true)
          .then(() => {
            this.scene.ui.setMode(messageMode).then(() => {
              this.scene.playSound("level_up_fanfare");
              this.scene.ui.showText(i18next.t("battle:learnMove", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name }), null, () => {
                this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeMoveLearnedTrigger, true);
                this.end();
              }, messageMode === Mode.EVOLUTION_SCENE ? 1000 : null, true);
            });
          });
      });
    } else if (move.isUnimplemented() && false) {
      this.scene.ui.setMode(messageMode).then(() => {
        this.scene.ui.showText(i18next.t("battle:learnMovePrompt", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name }), null, () => {
          this.scene.ui.showText(i18next.t("battle:learnMoveLimitReached", { pokemonName: getPokemonNameWithAffix(pokemon) }), null, () => {
            this.scene.ui.showText(i18next.t("battle:learnMoveReplaceQuestion", { moveName: move.name }), null, () => {
              const noHandler = () => {
                this.scene.ui.setMode(messageMode).then(() => {
                  this.scene.ui.showText(i18next.t("battle:learnMoveStopTeaching", { moveName: move.name }), null, () => {
                    this.scene.ui.setModeWithoutClear(Mode.CONFIRM, () => {
                      this.scene.ui.setMode(messageMode);
                      this.scene.ui.showText(i18next.t("battle:learnMoveNotLearned", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name }), null, () => this.end(), null, true);
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
                        this.scene.ui.showText(i18next.t("battle:learnMoveForgetSuccess", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: pokemon.moveset[moveIndex]!.getName() }), null, () => { // TODO: is the bang correct?
                          this.scene.ui.showText(i18next.t("battle:learnMoveAnd"), null, () => {
                            if (this.fromTM) {
                              if (!pokemon.usedTMs) {
                                pokemon.usedTMs = [];
                              }
                              pokemon.usedTMs.push(this.moveId);
                            }
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
    } else {
      this.replaceMoveCheck(move, pokemon);
    }
  }

  /**
   * This displays a chain of messages (listed below) and asks if the user wishes to forget a move.
   *
   * > [Pokemon] wants to learn the move [MoveName]
   * > However, [Pokemon] already knows four moves.
   * > Should a move be forgotten and replaced with [MoveName]? --> `Mode.CONFIRM` -> Yes: Go to `this.forgetMoveProcess()`, No: Go to `this.rejectMoveAndEnd()`
   * @param move The Move to be learned
   * @param Pokemon The Pokemon learning the move
   */
  async replaceMoveCheck(move: Move, pokemon: Pokemon) {
    const learnMovePrompt = i18next.t("battle:learnMovePrompt", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name });
    const moveLimitReached = i18next.t("battle:learnMoveLimitReached", { pokemonName: getPokemonNameWithAffix(pokemon) });
    const shouldReplaceQ = i18next.t("battle:learnMoveReplaceQuestion", { moveName: move.name });
    const preQText = [learnMovePrompt, moveLimitReached].join("$");
    await this.scene.ui.showTextPromise(preQText);
    await this.scene.ui.showTextPromise(shouldReplaceQ, undefined, false);
    await this.scene.ui.setModeWithoutClear(Mode.CONFIRM,
      () => this.forgetMoveProcess(move, pokemon), // Yes
      () => { // No
        this.scene.ui.setMode(this.messageMode);
        this.rejectMoveAndEnd(move, pokemon);
      }
    );
  }

  /**
   * This facilitates the process in which an old move is chosen to be forgotten.
   *
   * > Which move should be forgotten?
   *
   * The game then goes `Mode.SUMMARY` to select a move to be forgotten.
   * If a player does not select a move or chooses the new move (`moveIndex === 4`), the game goes to `this.rejectMoveAndEnd()`.
   * If an old move is selected, the function then passes the `moveIndex` to `this.learnMove()`
   * @param move The Move to be learned
   * @param Pokemon The Pokemon learning the move
   */
  async forgetMoveProcess(move: Move, pokemon: Pokemon) {
    this.scene.ui.setMode(this.messageMode);
    await this.scene.ui.showTextPromise(i18next.t("battle:learnMoveForgetQuestion"), undefined, true);
    await this.scene.ui.setModeWithoutClear(Mode.SUMMARY, pokemon, SummaryUiMode.LEARN_MOVE, move, (moveIndex: integer) => {
      if (moveIndex === 4) {
        this.scene.ui.setMode(this.messageMode).then(() => this.rejectMoveAndEnd(move, pokemon));
        return;
      }
      const forgetSuccessText = i18next.t("battle:learnMoveForgetSuccess", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: pokemon.moveset[moveIndex]!.getName() });
      const fullText = [i18next.t("battle:countdownPoof"), forgetSuccessText, i18next.t("battle:learnMoveAnd")].join("$");
      this.scene.ui.setMode(this.messageMode).then(() => this.learnMove(moveIndex, move, pokemon, fullText));
    });
  }

  /**
   * This asks the player if they wish to end the current move learning process.
   *
   * > Stop trying to teach [MoveName]? --> `Mode.CONFIRM` --> Yes: > [Pokemon] did not learn the move [MoveName], No: `this.replaceMoveCheck()`
   *
   * If the player wishes to not teach the Pokemon the move, it displays a message and ends the phase.
   * If the player reconsiders, it repeats the process for a Pokemon with a full moveset once again.
   * @param move The Move to be learned
   * @param Pokemon The Pokemon learning the move
   */
  async rejectMoveAndEnd(move: Move, pokemon: Pokemon) {
    await this.scene.ui.showTextPromise(i18next.t("battle:learnMoveStopTeaching", { moveName: move.name }), undefined, false);
    this.scene.ui.setModeWithoutClear(Mode.CONFIRM,
      () => {
        this.scene.ui.setMode(this.messageMode);
        this.scene.ui.showTextPromise(i18next.t("battle:learnMoveNotLearned", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name }), undefined, true).then(() => this.end());
      },
      () => {
        this.scene.ui.setMode(this.messageMode);
        this.replaceMoveCheck(move, pokemon);
      }
    );
  }

  /**
   * This teaches the Pokemon the new move and ends the phase.
   * When a Pokemon forgets a move and learns a new one, its 'Learn Move' message is significantly longer.
   *
   * Pokemon with a `moveset.length < 4`
   * > [Pokemon] learned [MoveName]
   *
   * Pokemon with a `moveset.length > 4`
   * > 1... 2... and 3... and Poof!
   * > [Pokemon] forgot how to use [MoveName]
   * > And...
   * > [Pokemon] learned [MoveName]!
   * @param move The Move to be learned
   * @param Pokemon The Pokemon learning the move
   */
  async learnMove(index: number, move: Move, pokemon: Pokemon, textMessage?: string) {
    if (this.fromTM) {
      pokemon.usedTMs.push(this.moveId);
    }
    pokemon.setMove(index, this.moveId);
    initMoveAnim(this.scene, this.moveId).then(() => {
      loadMoveAnimAssets(this.scene, [this.moveId], true);
      this.scene.playSound("level_up_fanfare"); // Sound loaded into game as is
    });
    this.scene.ui.setMode(this.messageMode);
    const learnMoveText = i18next.t("battle:learnMove", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name });
    textMessage = textMessage ? textMessage+"$"+learnMoveText : learnMoveText;
    await this.scene.ui.showTextPromise(textMessage, this.messageMode === Mode.EVOLUTION_SCENE ? 1000 : undefined, true);
    this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeMoveLearnedTrigger, true);
    this.end();
  }
}
