import BattleScene from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { WindowVariant, addWindow } from "./window";
import * as Utils from "../utils";

interface RankingEntry {
  rank: integer,
  username: string,
  score: integer,
  wave: integer
}

export class DailyRunScoreboard extends Phaser.GameObjects.Container {
  private loadingLabel: Phaser.GameObjects.Text;
  private titleLabel: Phaser.GameObjects.Text;
  private rankingsContainer: Phaser.GameObjects.Container;

  constructor(scene: BattleScene, x: number, y: number) {
    super(scene, x, y);

    this.setup();
  }

  setup() {
    const titleWindow = addWindow(this.scene, 0, 0, 114, 16, false, false, null, null, WindowVariant.THIN);
    this.add(titleWindow);

    this.titleLabel = addTextObject(this.scene, titleWindow.displayWidth / 2, titleWindow.displayHeight / 2, 'Daily Rankings', TextStyle.WINDOW, { fontSize: '64px' });
    this.titleLabel.setOrigin(0.5, 0.5);
    this.add(this.titleLabel);

    const window = addWindow(this.scene, 0, 15, 114, 115, false, false, null, null, WindowVariant.THIN);
    this.add(window);

    this.rankingsContainer = this.scene.add.container(6, 19);
    this.add(this.rankingsContainer);

    this.loadingLabel = addTextObject(this.scene, window.displayWidth / 2, window.displayHeight / 2 + 16, '', TextStyle.WINDOW);
    this.loadingLabel.setOrigin(0.5, 0.5);
    this.loadingLabel.setVisible(false);

    this.add(this.loadingLabel);

    this.setVisible(false);
  }

  updateRankings(rankings: RankingEntry[]) {
    const getEntry = (rank: string, username: string, score: string, wave: string) => {
      const entryContainer = this.scene.add.container(0, 0);

      const rankLabel = addTextObject(this.scene, 0, 0, rank, TextStyle.WINDOW, { fontSize: '54px' });
      entryContainer.add(rankLabel);

      const usernameLabel = addTextObject(this.scene, 12, 0, username, TextStyle.WINDOW, { fontSize: '54px' });
      entryContainer.add(usernameLabel);

      const scoreLabel = addTextObject(this.scene, 84, 0, score, TextStyle.WINDOW, { fontSize: '54px' });
      entryContainer.add(scoreLabel);

      const waveLabel = addTextObject(this.scene, 68, 0, wave, TextStyle.WINDOW, { fontSize: '54px' });
      entryContainer.add(waveLabel);

      return entryContainer;
    };

    this.rankingsContainer.add(getEntry('#', 'Username', 'Score', 'Wave'));

    rankings.forEach((r: RankingEntry, i: integer) => {
      const entryContainer = getEntry(r.rank.toString(), r.username, r.score.toString(), r.wave.toString());
      entryContainer.setY(r.rank * 9);
      this.rankingsContainer.add(entryContainer);
    });
  }

  showAndUpdate() {
    this.rankingsContainer.removeAll(true);

    this.loadingLabel.setText('Loading…');
    this.loadingLabel.setVisible(true);

    Utils.apiFetch(`daily/rankings`)
      .then(response => response.json())
      .then(jsonResponse => {
        if (jsonResponse) {
          this.loadingLabel.setVisible(false);
          this.updateRankings(jsonResponse);
        } else
          this.loadingLabel.setText('No Rankings');
      });

    this.setVisible(true);
  }

  hide() {
    this.setVisible(false);
  }
}

export interface DailyRunScoreboard {
  scene: BattleScene
};