import BattleScene from "#app/battle-scene";
import { initMoveAnim, loadMoveAnimAssets } from "#app/data/battle-anims";
import { allMoves } from "#app/data/move";
import { SpeciesFormChangeMoveLearnedTrigger } from "#app/data/pokemon-forms";
import { Moves } from "#app/enums/moves";
import { getPokemonNameWithAffix } from "#app/messages";
import EvolutionSceneHandler from "#app/ui/evolution-scene-handler";
import { SummaryUiMode } from "#app/ui/summary-ui-handler";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import { PlayerPartyMemberPokemonPhase } from "./player-party-member-pokemon-phase";

export class LearnMovePhase extends PlayerPartyMemberPokemonPhase {
  private moveId: Moves;
  private messageMode: Mode;

  constructor(scene: BattleScene, partyMemberIndex: integer, moveId: Moves) {
    super(scene, partyMemberIndex);

    this.moveId = moveId;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    const move = allMoves[this.moveId];
    const currentMoveset = pokemon.getMoveset();

    this.messageMode = this.scene.ui.getHandler() instanceof EvolutionSceneHandler ? Mode.EVOLUTION_SCENE : Mode.MESSAGE;

    const hasMoveAlready = currentMoveset.some(m => m?.moveId === move.id);

    if (hasMoveAlready) {
      return this.end();
    }

    if (currentMoveset.length < 4) {
      this.scene.playSound("level_up_fanfare");
      this.learnMove(currentMoveset.length, move, pokemon);
    } else {
      this.replaceMoveCheck(move, pokemon);
    }
  }

  replaceMoveCheck(move, pokemon) {
    const learnMovePrompt = i18next.t("battle:learnMovePrompt", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name });
    const moveLimitReached = i18next.t("battle:learnMoveLimitReached", { pokemonName: getPokemonNameWithAffix(pokemon) });
    const shouldReplaceQ = i18next.t("battle:learnMoveReplaceQuestion", { moveName: move.name });
    const preQText = [learnMovePrompt, moveLimitReached].join("$");
    this.scene.ui.showText(preQText, null, () => {
      this.scene.ui.showText(shouldReplaceQ, null, () => {
        this.scene.ui.setModeWithoutClear(Mode.CONFIRM, () => this.forgetMoveProcess(move, pokemon), () => this.rejectMoveAndEnd(move, pokemon));
      }, null);
    }, null, true);
  }

  forgetMoveProcess(move, pokemon) {
    this.scene.ui.setMode(this.messageMode);
    this.scene.ui.showText(i18next.t("battle:learnMoveForgetQuestion"), null, () => {
      this.scene.ui.setModeWithoutClear(Mode.SUMMARY, pokemon, SummaryUiMode.LEARN_MOVE, move, (moveIndex: integer) => {
        if (moveIndex === 4) {
          this.rejectMoveAndEnd(move, pokemon);
          return;
        }
        this.scene.ui.setMode(this.messageMode);
        const forgetSuccessText = i18next.t("battle:learnMoveForgetSuccess", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: pokemon.moveset[moveIndex]!.getName() });
        const fullText = [i18next.t("battle:countdownPoof"), forgetSuccessText, i18next.t("battle:learnMoveAnd")].join("$");
        this.learnMove(moveIndex, move, pokemon, fullText);
      });
    }, null, true);
  }

  rejectMoveAndEnd(move, pokemon) {
    this.scene.ui.setMode(this.messageMode);
    this.scene.ui.showText(i18next.t("battle:learnMoveStopTeaching", { moveName: move.name }), null, () => {
      this.scene.ui.setModeWithoutClear(Mode.CONFIRM,
        () => {
          this.scene.ui.setMode(this.messageMode);
          this.scene.ui.showText(i18next.t("battle:learnMoveNotLearned", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name }), null, () => this.end(), null, true);
        },
        () => {
          this.scene.ui.setMode(this.messageMode);
          this.replaceMoveCheck(move, pokemon);
        });
    }, null);
  }

  learnMove(index: number, move, pokemon, textMessage?: string) {
    pokemon.setMove(index, this.moveId);
    initMoveAnim(this.scene, this.moveId).then(() => {
      loadMoveAnimAssets(this.scene, [this.moveId], true);
    });
    this.scene.ui.setMode(this.messageMode);
    const learnMoveText = i18next.t("battle:learnMove", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name });
    textMessage = textMessage ? textMessage+"$"+learnMoveText : learnMoveText;
    this.scene.ui.showText(textMessage, null, () => {
      this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeMoveLearnedTrigger, true);
      this.end();
    }, this.messageMode === Mode.EVOLUTION_SCENE ? 1000 : null, true);
  }
}
