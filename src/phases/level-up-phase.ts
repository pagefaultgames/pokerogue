import BattleScene from "#app/battle-scene.js";
import { ExpNotification } from "#app/enums/exp-notification.js";
import { EvolutionPhase } from "#app/phases/evolution-phase.js";
import { PlayerPokemon } from "#app/field/pokemon.js";
import { getPokemonNameWithAffix } from "#app/messages.js";
import { LevelAchv } from "#app/system/achv.js";
import i18next from "i18next";
import * as Utils from "#app/utils.js";
import { PlayerPartyMemberPokemonPhase } from "./player-party-member-pokemon-phase";
import { LearnMovePhase } from "./learn-move-phase";

export class LevelUpPhase extends PlayerPartyMemberPokemonPhase {
  private lastLevel: integer;
  private level: integer;

  constructor(scene: BattleScene, partyMemberIndex: integer, lastLevel: integer, level: integer) {
    super(scene, partyMemberIndex);

    this.lastLevel = lastLevel;
    this.level = level;
    this.scene = scene;
  }

  start() {
    super.start();

    if (this.level > this.scene.gameData.gameStats.highestLevel) {
      this.scene.gameData.gameStats.highestLevel = this.level;
    }

    this.scene.validateAchvs(LevelAchv, new Utils.IntegerHolder(this.level));

    const pokemon = this.getPokemon();
    const prevStats = pokemon.stats.slice(0);
    pokemon.calculateStats();
    pokemon.updateInfo();
    if (this.scene.expParty === ExpNotification.DEFAULT) {
      this.scene.playSound("level_up_fanfare");
      this.scene.ui.showText(i18next.t("battle:levelUp", { pokemonName: getPokemonNameWithAffix(this.getPokemon()), level: this.level }), null, () => this.scene.ui.getMessageHandler().promptLevelUpStats(this.partyMemberIndex, prevStats, false).then(() => this.end()), null, true);
    } else if (this.scene.expParty === ExpNotification.SKIP) {
      this.end();
    } else {
      // we still want to display the stats if activated
      this.scene.ui.getMessageHandler().promptLevelUpStats(this.partyMemberIndex, prevStats, false).then(() => this.end());
    }
    if (this.lastLevel < 100) { // this feels like an unnecessary optimization
      const levelMoves = this.getPokemon().getLevelMoves(this.lastLevel + 1);
      for (const lm of levelMoves) {
        this.scene.unshiftPhase(new LearnMovePhase(this.scene, this.partyMemberIndex, lm[1]));
      }
    }
    if (!pokemon.pauseEvolutions) {
      const evolution = pokemon.getEvolution();
      if (evolution) {
        this.scene.unshiftPhase(new EvolutionPhase(this.scene, pokemon as PlayerPokemon, evolution, this.lastLevel));
      }
    }
  }
}
