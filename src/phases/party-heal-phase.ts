import { globalScene } from "#app/global-scene";
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

    const bgmPlaying = globalScene.isBgmPlaying();
    if (bgmPlaying) {
      globalScene.fadeOutBgm(1000, false);
    }
    globalScene.ui.fadeOut(1000).then(() => {
      for (const pokemon of globalScene.getPlayerParty()) {
        pokemon.hp = pokemon.getMaxHp();
        pokemon.resetStatus();
        for (const move of pokemon.moveset) {
            move!.ppUsed = 0; // TODO: is this bang correct?
        }
        pokemon.updateInfo(true);
      }
      const healSong = globalScene.playSoundWithoutBgm("heal");
      globalScene.time.delayedCall(Utils.fixedInt(healSong.totalDuration * 1000), () => {
        healSong.destroy();
        if (this.resumeBgm && bgmPlaying) {
          globalScene.playBgm();
        }
        globalScene.ui.fadeIn(500).then(() => this.end());
      });
    });
  }
}
