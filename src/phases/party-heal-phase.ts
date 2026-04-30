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

    const bgmPlaying = globalScene.isBgmPlaying();
    if (bgmPlaying) {
      globalScene.fadeOutBgm(1000);
    }
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
      const healSound = globalScene.playSound("se/heal");
      if (healSound == null) {
        this.end();
      } else {
        healSound.on("complete", () => globalScene.ui.fadeIn(500).then(() => this.end()));
      }
    });
    globalScene.arena.playerTerasUsed = 0;
  }
}
