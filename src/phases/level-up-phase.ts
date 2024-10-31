import { gScene } from "#app/battle-scene";
import { ExpNotification } from "#app/enums/exp-notification";
import { EvolutionPhase } from "#app/phases/evolution-phase";
import { PlayerPokemon } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { LevelAchv } from "#app/system/achv";
import i18next from "i18next";
import * as Utils from "#app/utils";
import { PlayerPartyMemberPokemonPhase } from "./player-party-member-pokemon-phase";
import { LearnMovePhase } from "./learn-move-phase";

export class LevelUpPhase extends PlayerPartyMemberPokemonPhase {
  private lastLevel: integer;
  private level: integer;

  constructor(partyMemberIndex: integer, lastLevel: integer, level: integer) {
    super(partyMemberIndex);

    this.lastLevel = lastLevel;
    this.level = level;
  }

  start() {
    super.start();

    if (this.level > gScene.gameData.gameStats.highestLevel) {
      gScene.gameData.gameStats.highestLevel = this.level;
    }

    gScene.validateAchvs(LevelAchv, new Utils.NumberHolder(this.level));

    const pokemon = this.getPokemon();
    const prevStats = pokemon.stats.slice(0);
    pokemon.calculateStats();
    pokemon.updateInfo();
    if (gScene.expParty === ExpNotification.DEFAULT) {
      gScene.playSound("level_up_fanfare");
      gScene.ui.showText(i18next.t("battle:levelUp", { pokemonName: getPokemonNameWithAffix(this.getPokemon()), level: this.level }), null, () => gScene.ui.getMessageHandler().promptLevelUpStats(this.partyMemberIndex, prevStats, false).then(() => this.end()), null, true);
    } else if (gScene.expParty === ExpNotification.SKIP) {
      this.end();
    } else {
      // we still want to display the stats if activated
      gScene.ui.getMessageHandler().promptLevelUpStats(this.partyMemberIndex, prevStats, false).then(() => this.end());
    }
    if (this.lastLevel < 100) { // this feels like an unnecessary optimization
      const levelMoves = this.getPokemon().getLevelMoves(this.lastLevel + 1);
      for (const lm of levelMoves) {
        gScene.unshiftPhase(new LearnMovePhase(this.partyMemberIndex, lm[1]));
      }
    }
    if (!pokemon.pauseEvolutions) {
      const evolution = pokemon.getEvolution();
      if (evolution) {
        gScene.unshiftPhase(new EvolutionPhase(pokemon as PlayerPokemon, evolution, this.lastLevel));
      }
    }
  }
}
