import BattleScene from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { WindowVariant, addWindow } from "./ui-theme";
import * as Utils from "../utils";
import i18next from "i18next";

interface RankingEntry {
  rank: integer,
  username: string,
  score: integer,
  wave: integer
}

enum ScoreboardCategory {
  DAILY,
  WEEKLY
}

export class DailyRunScoreboard extends Phaser.GameObjects.Container {
  private loadingLabel: Phaser.GameObjects.Text;
  private titleLabel: Phaser.GameObjects.Text;
  private rankingsContainer: Phaser.GameObjects.Container;
  private prevCategoryButton: Phaser.GameObjects.Sprite;
  private nextCategoryButton: Phaser.GameObjects.Sprite;
  private prevPageButton: Phaser.GameObjects.Sprite;
  private pageNumberLabel: Phaser.GameObjects.Text;
  private nextPageButton: Phaser.GameObjects.Sprite;

  private pageCount: integer;
  private page: integer;
  private category: ScoreboardCategory;

  constructor(scene: BattleScene, x: number, y: number) {
    super(scene, x, y);

    this.setup();
  }

  setup() {
    const titleWindow = addWindow(this.scene, 0, 0, 114, 18, false, false, null, null, WindowVariant.THIN);
    this.add(titleWindow);

    this.titleLabel = addTextObject(this.scene, titleWindow.displayWidth / 2, titleWindow.displayHeight / 2, i18next.t('menu:dailyRankings'), TextStyle.WINDOW, { fontSize: '64px' });
    this.titleLabel.setOrigin(0.5, 0.5);
    this.add(this.titleLabel);

    const window = addWindow(this.scene, 0, 17, 114, 118, false, false, null, null, WindowVariant.THIN);
    this.add(window);

    this.rankingsContainer = this.scene.add.container(6, 21);
    this.add(this.rankingsContainer);

    this.loadingLabel = addTextObject(this.scene, window.displayWidth / 2, window.displayHeight / 2 + 16, '', TextStyle.WINDOW);
    this.loadingLabel.setOrigin(0.5, 0.5);
    this.loadingLabel.setVisible(false);

    this.prevCategoryButton = this.scene.add.sprite(4, 4, 'cursor_reverse');
    this.prevCategoryButton.setOrigin(0, 0);
    this.add(this.prevCategoryButton);

    this.prevCategoryButton.setInteractive(new Phaser.Geom.Rectangle(0, 0, 6, 10), Phaser.Geom.Rectangle.Contains);
    this.prevCategoryButton.on('pointerup', () => {
      this.update(this.category ? this.category - 1 : Utils.getEnumKeys(ScoreboardCategory).length - 1);
    });

    this.nextCategoryButton = this.scene.add.sprite(window.displayWidth - 4, 4, 'cursor');
    this.nextCategoryButton.setOrigin(1, 0);
    this.add(this.nextCategoryButton);

    this.nextCategoryButton.setInteractive(new Phaser.Geom.Rectangle(0, 0, 6, 10), Phaser.Geom.Rectangle.Contains);
    this.nextCategoryButton.on('pointerup', () => {
      this.update(this.category < Utils.getEnumKeys(ScoreboardCategory).length - 1 ? this.category + 1 : 0);
    });

    this.prevPageButton = this.scene.add.sprite(window.displayWidth / 2 - 16, titleWindow.displayHeight + window.displayHeight - 15, 'cursor_reverse');
    this.prevPageButton.setOrigin(0, 0);
    this.prevPageButton.setAlpha(0.5);
    this.add(this.prevPageButton);

    this.prevPageButton.setInteractive(new Phaser.Geom.Rectangle(0, 0, 6, 10), Phaser.Geom.Rectangle.Contains);
    this.prevPageButton.on('pointerup', () => {
      if (this.page > 1)
        this.update(undefined, this.page > 1 ? this.page - 1 : this.pageCount);
    });

    this.pageNumberLabel = addTextObject(this.scene, window.displayWidth / 2, titleWindow.displayHeight + window.displayHeight - 16, '1', TextStyle.WINDOW, { fontSize: '64px' });
    this.pageNumberLabel.setOrigin(0.5, 0);
    this.add(this.pageNumberLabel);

    this.nextPageButton = this.scene.add.sprite(window.displayWidth / 2 + 16, titleWindow.displayHeight + window.displayHeight - 15, 'cursor');
    this.nextPageButton.setOrigin(1, 0);
    this.nextPageButton.setAlpha(0.5);
    this.add(this.nextPageButton);

    this.nextPageButton.setInteractive(new Phaser.Geom.Rectangle(0, 0, 6, 10), Phaser.Geom.Rectangle.Contains);
    this.nextPageButton.on('pointerup', () => {
      if (this.page < this.pageCount)
        this.update(undefined, this.page < this.pageCount ? this.page + 1 : 0);
    });

    this.add(this.loadingLabel);

    this.page = 1;
    this.category = ScoreboardCategory.DAILY;
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

      switch (this.category) {
        case ScoreboardCategory.DAILY:
          const waveLabel = addTextObject(this.scene, 68, 0, wave, TextStyle.WINDOW, { fontSize: '54px' });
          entryContainer.add(waveLabel);
          break;
        case ScoreboardCategory.WEEKLY:
          scoreLabel.x -= 16;
          break;
      }

      return entryContainer;
    };

    this.rankingsContainer.add(getEntry('#', 'Username', 'Score', 'Wave'));

    rankings.forEach((r: RankingEntry, i: integer) => {
      const entryContainer = getEntry(r.rank.toString(), r.username, r.score.toString(), r.wave.toString());
      entryContainer.setY((i + 1) * 9);
      this.rankingsContainer.add(entryContainer);
    });
  }

  update(category: ScoreboardCategory = this.category, page: integer = this.page) {
    this.rankingsContainer.removeAll(true);

    this.loadingLabel.setText(i18next.t('menu:loading'));
    this.loadingLabel.setVisible(true);

    if (category !== this.category)
      this.page = page = 1;

    Utils.executeIf(category !== this.category || this.pageCount === undefined,
      () =>  Utils.apiFetch(`daily/rankingpagecount?category=${category}`).then(response => response.json()).then(count => this.pageCount = count)
    ).then(() => {
      Utils.apiFetch(`daily/rankings?category=${category}&page=${page}`)
        .then(response => response.json())
        .then(jsonResponse => {
          this.page = page;
          this.category = category;
          this.titleLabel.setText(`${Utils.toReadableString(ScoreboardCategory[category])} ${i18next.t("menu:rankings")}`);
          this.prevPageButton.setAlpha(page > 1 ? 1 : 0.5);
          this.nextPageButton.setAlpha(page < this.pageCount ? 1 : 0.5);
          this.pageNumberLabel.setText(page.toString());
          if (jsonResponse) {
            this.loadingLabel.setVisible(false);
            this.updateRankings(jsonResponse);
          } else
            this.loadingLabel.setText(i18next.t('menu:noRankings'));
        });
    });
  }
}

export interface DailyRunScoreboard {
  scene: BattleScene
};