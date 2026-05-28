import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { ExpNotification } from "#enums/exp-notification";
import type { PlayerPokemon } from "#field/pokemon";
import { PlayerPartyMemberPokemonPhase } from "#phases/player-party-member-pokemon-phase";
import { LevelAchv } from "#system/achv";
import { NumberHolder } from "#utils/common";
import i18next from "i18next";

export class LevelUpPhase extends PlayerPartyMemberPokemonPhase {
  public readonly phaseName = "LevelUpPhase";
  protected lastLevel: number;
  protected level: number;
  protected pokemon: PlayerPokemon = this.getPlayerPokemon();

  constructor(partyMemberIndex: number, lastLevel: number, level: number) {
    super(partyMemberIndex);

    this.lastLevel = lastLevel;
    this.level = level;
  }

  public override start(): void {
    super.start();

    if (this.level > globalScene.gameData.gameStats.highestLevel) {
      globalScene.gameData.gameStats.highestLevel = this.level;
    }

    globalScene.validateAchvs(LevelAchv, new NumberHolder(this.level));

    const prevStats = this.pokemon.stats.slice(0);

    this.pokemon.calculateStats();
    this.pokemon.updateInfo();

    switch (globalScene.expParty) {
      case ExpNotification.DEFAULT:
        this.showLevelUpMessages(prevStats).then(() => this.end());
        return;
      case ExpNotification.ONLY_LEVEL_UP:
        // we still want to display the stats if activated
        globalScene.ui
          .getMessageHandler()
          .promptLevelUpStats(this.partyMemberIndex, prevStats, false)
          .then(() => this.end());
        return;
      case ExpNotification.SKIP:
        this.end();
        return;
    }
  }

  private async showLevelUpMessages(prevStats: number[]): Promise<void> {
    audioManager.playSound("se/level_up_fanfare");

    const { promise, resolve } = Promise.withResolvers<void>();

    globalScene.ui.showText(
      i18next.t("battle:levelUp", {
        pokemonName: getPokemonNameWithAffix(this.pokemon),
        level: this.level,
      }),
      null,
      () =>
        globalScene.ui
          .getMessageHandler()
          .promptLevelUpStats(this.partyMemberIndex, prevStats, false)
          .then(() => resolve()),
      null,
      true,
    );

    return promise;
  }

  public override end(): void {
    // this `if` check feels like an unnecessary optimization
    if (this.lastLevel < 100) {
      const levelMoves = this.getPokemon().getLevelMoves(this.lastLevel + 1);
      for (const lm of levelMoves) {
        globalScene.phaseManager.unshiftNew("LearnMovePhase", this.partyMemberIndex, lm[1]);
      }
    }
    if (!this.pokemon.pauseEvolutions) {
      const evolution = this.pokemon.getEvolution();
      if (evolution) {
        this.pokemon.breakIllusion();
        globalScene.phaseManager.unshiftNew("EvolutionPhase", this.pokemon, evolution, this.lastLevel);
      }
    }
    super.end();
    return;
  }
}
