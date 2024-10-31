import { gScene } from "#app/battle-scene";
import * as Utils from "#app/utils";
import { BattlePhase } from "./battle-phase";

export class PartyHealPhase extends BattlePhase {
  private resumeBgm: boolean;

  constructor(resumeBgm: boolean) {
    super();

    this.resumeBgm = resumeBgm;
  }

  start() {
    super.start();

    const bgmPlaying = gScene.isBgmPlaying();
    if (bgmPlaying) {
      gScene.fadeOutBgm(1000, false);
    }
    gScene.ui.fadeOut(1000).then(() => {
      for (const pokemon of gScene.getParty()) {
        pokemon.hp = pokemon.getMaxHp();
        pokemon.resetStatus();
        for (const move of pokemon.moveset) {
            move!.ppUsed = 0; // TODO: is this bang correct?
        }
        pokemon.updateInfo(true);
      }
      const healSong = gScene.playSoundWithoutBgm("heal");
      gScene.time.delayedCall(Utils.fixedInt(healSong.totalDuration * 1000), () => {
        healSong.destroy();
        if (this.resumeBgm && bgmPlaying) {
          gScene.playBgm();
        }
        gScene.ui.fadeIn(500).then(() => this.end());
      });
    });
  }
}
