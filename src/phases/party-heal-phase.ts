import { globalScene } from "#app/global-scene";
import { BooleanHolder, fixedInt } from "#app/utils/common";
import { BattlePhase } from "./battle-phase";
import { applyChallenges, ChallengeType } from "#app/data/challenge";

export class PartyHealPhase extends BattlePhase {
  public readonly phaseName = "PartyHealPhase";
  private resumeBgm: boolean;

  constructor(resumeBgm: boolean) {
    super();

    this.resumeBgm = resumeBgm;
  }

  start() {
    super.start();

    const isHealPhaseActive = new BooleanHolder(true);
    const isReviveActive = new BooleanHolder(true);
    applyChallenges(ChallengeType.NO_HEAL_PHASE, isHealPhaseActive);
    if (!isHealPhaseActive.value) {
      return this.end();
    }
    const bgmPlaying = globalScene.isBgmPlaying();
    if (bgmPlaying) {
      globalScene.fadeOutBgm(1000, false);
    }
    globalScene.ui.fadeOut(1000).then(() => {
      for (const pokemon of globalScene.getPlayerParty()) {
        applyChallenges(ChallengeType.PREVENT_REVIVE, isReviveActive);
        if (isReviveActive.value || !pokemon.isFainted()) {
          pokemon.hp = pokemon.getMaxHp();
          pokemon.resetStatus(true, false, false, true);
          for (const move of pokemon.moveset) {
            move.ppUsed = 0;
          }
          pokemon.updateInfo(true);
        }
      }
      const healSong = globalScene.playSoundWithoutBgm("heal");
      globalScene.time.delayedCall(fixedInt(healSong.totalDuration * 1000), () => {
        healSong.destroy();
        if (this.resumeBgm && bgmPlaying) {
          globalScene.playBgm();
        }
        globalScene.ui.fadeIn(500).then(() => this.end());
      });
    });
    globalScene.arena.playerTerasUsed = 0;
  }
}
