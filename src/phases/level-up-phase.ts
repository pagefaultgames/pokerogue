import { globalScene } from "#app/global-scene";
import { ExpNotification } from "#app/enums/exp-notification";
import type { PlayerPokemon } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { EvolutionPhase } from "#app/phases/evolution-phase";
import { LearnMovePhase } from "#app/phases/learn-move-phase";
import { PlayerPartyMemberPokemonPhase } from "#app/phases/player-party-member-pokemon-phase";
import { LevelAchv } from "#app/system/achv";
import { NumberHolder } from "#app/utils/common";
import i18next from "i18next";

export class LevelUpPhase extends PlayerPartyMemberPokemonPhase {
  protected lastLevel: number;
  protected level: number;
  protected pokemon: PlayerPokemon = this.getPlayerPokemon();

  constructor(partyMemberIndex: number, lastLevel: number, level: number) {
    super(partyMemberIndex);

    this.lastLevel = lastLevel;
    this.level = level;
  }

  public override start() {
    super.start();

    if (this.level > globalScene.gameData.gameStats.highestLevel) {
      globalScene.gameData.gameStats.highestLevel = this.level;
    }

    globalScene.validateAchvs(LevelAchv, new NumberHolder(this.level));

    const prevStats = this.pokemon.stats.slice(0);
    this.pokemon.calculateStats();
    this.pokemon.updateInfo();
    if (globalScene.expParty === ExpNotification.DEFAULT) {
      globalScene.playSound("level_up_fanfare");
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
            .then(() => this.end()),
        null,
        true,
      );
    } else if (globalScene.expParty === ExpNotification.SKIP) {
      this.end();
    } else {
      // we still want to display the stats if activated
      globalScene.ui
        .getMessageHandler()
        .promptLevelUpStats(this.partyMemberIndex, prevStats, false)
        .then(() => this.end());
    }
  }

  public override end() {
    if (this.lastLevel < 100) {
      // this feels like an unnecessary optimization
      const levelMoves = this.getPokemon().getLevelMoves(this.lastLevel + 1);
      for (const lm of levelMoves) {
        globalScene.unshiftPhase(new LearnMovePhase(this.partyMemberIndex, lm[1]));
      }
    }
    if (!this.pokemon.pauseEvolutions) {
      const evolution = this.pokemon.getEvolution();
      if (evolution) {
        this.pokemon.breakIllusion();
        globalScene.unshiftPhase(new EvolutionPhase(this.pokemon, evolution, this.lastLevel));
      }
    }
    return super.end();
  }
}
