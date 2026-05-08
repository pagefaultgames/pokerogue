import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { ExpNotification } from "#enums/exp-notification";
import type { PlayerPokemon } from "#field/pokemon";
import { PlayerPartyMemberPokemonPhase } from "#phases/player-party-member-pokemon-phase";
import { LevelAchv } from "#system/achv";
import { a11yManager } from "#ui/accessibility-manager";
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

  public override start() {
    super.start();

    if (this.level > globalScene.gameData.gameStats.highestLevel) {
      globalScene.gameData.gameStats.highestLevel = this.level;
    }

    globalScene.validateAchvs(LevelAchv, new NumberHolder(this.level));

    const prevStats = this.pokemon.stats.slice(0);
    this.pokemon.calculateStats();
    this.pokemon.updateInfo();

    // Always announce the level-up to screen readers, regardless of the visual notification setting.
    // The visual showText path below is suppressed when expParty !== DEFAULT, which would otherwise
    // make level-ups silent for AT users.
    const levelUpMessage = i18next.t("battle:levelUp", {
      pokemonName: getPokemonNameWithAffix(this.pokemon),
      level: this.level,
    });

    if (globalScene.expParty === ExpNotification.DEFAULT) {
      globalScene.playSound("level_up_fanfare");
      globalScene.ui.showText(
        levelUpMessage,
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
      a11yManager.announceMessage(levelUpMessage);
      this.end();
    } else {
      // we still want to display the stats if activated
      a11yManager.announceMessage(levelUpMessage);
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
    return super.end();
  }
}
