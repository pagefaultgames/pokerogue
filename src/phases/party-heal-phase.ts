import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { ChallengeType } from "#enums/challenge-type";
import { BattlePhase } from "#phases/battle-phase";
import { applyChallenges } from "#utils/challenge-utils";
import { BooleanHolder } from "#utils/common";

export class PartyHealPhase extends BattlePhase {
  public readonly phaseName = "PartyHealPhase";
  private resumeBgm: boolean;

  constructor(resumeBgm: boolean) {
    super();

    this.resumeBgm = resumeBgm;
  }

  start() {
    super.start();

    audioManager.fadeOutBgm(1000, false, !this.resumeBgm);
    globalScene.ui.fadeOut(1000).then(() => {
      const preventRevive = new BooleanHolder(false);
      applyChallenges(ChallengeType.PREVENT_REVIVE, preventRevive);
      for (const pokemon of globalScene.getPlayerParty()) {
        // Prevent reviving fainted pokemon during certain challenges
        if (pokemon.isFainted() && preventRevive.value) {
          continue;
        }

        pokemon.hp = pokemon.getMaxHp();
        pokemon.resetStatus(true, false, false, true);
        for (const move of pokemon.moveset) {
          move.ppUsed = 0;
        }
        pokemon.updateInfo(true);
      }

      const healSound = this.resumeBgm
        ? audioManager.replaceBgmUntilEnd("bw/heal")
        : audioManager.playBgm("bw/heal", false, false);
      if (healSound == null) {
        this.end();
      } else {
        healSound.onEnd(() => this.end());
      }
    });
    globalScene.arena.playerTerasUsed = 0;
  }

  public override end() {
    globalScene.ui.fadeIn(500).then(() => super.end());
  }
}
