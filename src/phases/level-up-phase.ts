import type BattleScene from "#app/battle-scene";
import { ExpNotification } from "#app/enums/exp-notification";
import type { PlayerPokemon } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { EvolutionPhase } from "#app/phases/evolution-phase";
import { LearnMovePhase } from "#app/phases/learn-move-phase";
import { PlayerPartyMemberPokemonPhase } from "#app/phases/player-party-member-pokemon-phase";
import { LevelAchv } from "#app/system/achv";
import { NumberHolder } from "#app/utils";
import i18next from "i18next";

export class LevelUpPhase extends PlayerPartyMemberPokemonPhase {
  protected lastLevel: number;
  protected level: number;
  protected pokemon: PlayerPokemon = this.getPlayerPokemon();

  constructor(scene: BattleScene, partyMemberIndex: number, lastLevel: number, level: number) {
    super(scene, partyMemberIndex);

    this.lastLevel = lastLevel;
    this.level = level;
  }

  public override start() {
    super.start();

    if (this.level > this.scene.gameData.gameStats.highestLevel) {
      this.scene.gameData.gameStats.highestLevel = this.level;
    }

    this.scene.validateAchvs(LevelAchv, new NumberHolder(this.level));

    const prevStats = this.pokemon.stats.slice(0);
    this.pokemon.calculateStats();
    this.pokemon.updateInfo();
    if (this.scene.expParty === ExpNotification.DEFAULT) {
      this.scene.playSound("level_up_fanfare");
      this.scene.ui.showText(
        i18next.t("battle:levelUp", { pokemonName: getPokemonNameWithAffix(this.pokemon), level: this.level }),
        null,
        () => this.scene.ui.getMessageHandler().promptLevelUpStats(this.partyMemberIndex, prevStats, false)
          .then(() => this.end()), null, true);
    } else if (this.scene.expParty === ExpNotification.SKIP) {
      this.end();
    } else {
      // we still want to display the stats if activated
      this.scene.ui.getMessageHandler().promptLevelUpStats(this.partyMemberIndex, prevStats, false).then(() => this.end());
    }
  }

  public override end() {
    if (this.lastLevel < 100) { // this feels like an unnecessary optimization
      const levelMoves = this.getPokemon().getLevelMoves(this.lastLevel + 1);
      for (const lm of levelMoves) {
        this.scene.unshiftPhase(new LearnMovePhase(this.scene, this.partyMemberIndex, lm[1]));
      }
    }
    if (!this.pokemon.pauseEvolutions) {
      const evolution = this.pokemon.getEvolution();
      if (evolution) {
        this.scene.unshiftPhase(new EvolutionPhase(this.scene, this.pokemon, evolution, this.lastLevel));
      }
    }
    return super.end();
  }
}
