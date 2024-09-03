import BattleScene from "#app/battle-scene.js";
import { initMoveAnim, loadMoveAnimAssets } from "#app/data/battle-anims.js";
import { allMoves } from "#app/data/move.js";
import { SpeciesFormChangeMoveLearnedTrigger } from "#app/data/pokemon-forms.js";
import { Moves } from "#app/enums/moves.js";
import { getPokemonNameWithAffix } from "#app/messages.js";
import EvolutionSceneHandler from "#app/ui/evolution-scene-handler.js";
import { SummaryUiMode } from "#app/ui/summary-ui-handler.js";
import { Mode } from "#app/ui/ui.js";
import i18next from "i18next";
import { PlayerPartyMemberPokemonPhase } from "./player-party-member-pokemon-phase";
import { PokemonMove } from "#app/field/pokemon.js";
import * as LoggerTools from "../logger";

export class LearnMovePhase extends PlayerPartyMemberPokemonPhase {
  private moveId: Moves;
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
        this.scene.ui.showText(`${getPokemonNameWithAffix(pokemon)} wants to learn ${move.name}, but this move does nothing.`, null, () => {
          this.scene.ui.showText(`Would you like to teach ${move.name} anyways? (This will be logged as normal)`, null, () => {
            this.scene.ui.setModeWithoutClear(Mode.CONFIRM, movesFullHandler, noHandler)
          })
        })
      });
    } else {
      this.scene.ui.setMode(messageMode).then(movesFullHandler);
    }
  }
}
