import i18next from "i18next";
import BattleScene from "../battle-scene";
import * as Utils from "../utils";
import { TextStyle, addTextObject } from "./text";
import { WindowVariant, addWindow } from "./ui-theme";

interface RankingEntry {
  rank: integer,
  username: string,
  score: integer,
  wave: integer
}

// Don't forget to update translations when adding a new category
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

  private _isUpdating: boolean;

  constructor(scene: BattleScene, x: number, y: number) {
    super(scene, x, y);

    this._isUpdating = false;
    this.setup();
  }

  /**
   * Sets the updating state and updates button states accordingly.
   * If value is true (updating), disables the buttons; if false, enables the buttons.
   * @param {boolean} value - The new updating state.
   */
  set isUpdating(value) {
    this._isUpdating = value;
    this.setButtonsState(!value);
  }

  /**
   * Gets the current updating state.
   * @returns {boolean} - The current updating state.
   */
  get isUpdating() {
    return this._isUpdating;
  }

  setup() {
    const titleWindow = addWindow(this.scene, 0, 0, 114, 18, false, false, null, null, WindowVariant.THIN);
    this.add(titleWindow);

    this.titleLabel = addTextObject(this.scene, titleWindow.displayWidth / 2, titleWindow.displayHeight / 2, i18next.t("menu:loading"), TextStyle.WINDOW, { fontSize: "64px" });
    this.titleLabel.setOrigin(0.5, 0.5);
    this.add(this.titleLabel);

    const window = addWindow(this.scene, 0, 17, 114, 118, false, false, null, null, WindowVariant.THIN);
    this.add(window);

    this.rankingsContainer = this.scene.add.container(6, 21);
    this.add(this.rankingsContainer);

    this.loadingLabel = addTextObject(this.scene, window.displayWidth / 2, window.displayHeight / 2 + 16, "", TextStyle.WINDOW);
    this.loadingLabel.setOrigin(0.5, 0.5);
    this.loadingLabel.setVisible(false);

    this.prevCategoryButton = this.scene.add.sprite(4, 4, "cursor_reverse");
    this.prevCategoryButton.setOrigin(0, 0);
    this.add(this.prevCategoryButton);

    this.prevCategoryButton.setInteractive(new Phaser.Geom.Rectangle(0, 0, 6, 10), Phaser.Geom.Rectangle.Contains);
    this.prevCategoryButton.on("pointerup", () => {
      this.update(this.category ? this.category - 1 : Utils.getEnumKeys(ScoreboardCategory).length - 1);
    });

    this.nextCategoryButton = this.scene.add.sprite(window.displayWidth - 4, 4, "cursor");
    this.nextCategoryButton.setOrigin(1, 0);
    this.add(this.nextCategoryButton);

    this.nextCategoryButton.setInteractive(new Phaser.Geom.Rectangle(0, 0, 6, 10), Phaser.Geom.Rectangle.Contains);
    this.nextCategoryButton.on("pointerup", () => {
      this.update(this.category < Utils.getEnumKeys(ScoreboardCategory).length - 1 ? this.category + 1 : 0);
    });

    this.prevPageButton = this.scene.add.sprite(window.displayWidth / 2 - 16, titleWindow.displayHeight + window.displayHeight - 15, "cursor_reverse");
    this.prevPageButton.setOrigin(0, 0);
    this.prevPageButton.setAlpha(0.5);
    this.add(this.prevPageButton);

    this.prevPageButton.setInteractive(new Phaser.Geom.Rectangle(0, 0, 6, 10), Phaser.Geom.Rectangle.Contains);
    this.prevPageButton.on("pointerup", () => {
      if (this.page > 1) {
        this.update(undefined, this.page > 1 ? this.page - 1 : this.pageCount);
      }
    });

    this.pageNumberLabel = addTextObject(this.scene, window.displayWidth / 2, titleWindow.displayHeight + window.displayHeight - 16, "1", TextStyle.WINDOW, { fontSize: "64px" });
    this.pageNumberLabel.setOrigin(0.5, 0);
    this.add(this.pageNumberLabel);

    this.nextPageButton = this.scene.add.sprite(window.displayWidth / 2 + 16, titleWindow.displayHeight + window.displayHeight - 15, "cursor");
    this.nextPageButton.setOrigin(1, 0);
    this.nextPageButton.setAlpha(0.5);
    this.add(this.nextPageButton);

    this.nextPageButton.setInteractive(new Phaser.Geom.Rectangle(0, 0, 6, 10), Phaser.Geom.Rectangle.Contains);
    this.nextPageButton.on("pointerup", () => {
      if (this.page < this.pageCount) {
        this.update(undefined, this.page < this.pageCount ? this.page + 1 : 0);
      }
    });

    this.add(this.loadingLabel);

    this.page = 1;
    this.category = ScoreboardCategory.DAILY;
  }

  updateRankings(rankings: RankingEntry[]) {
    const getEntry = (rank: string, username: string, score: string, wave: string) => {
      const entryContainer = this.scene.add.container(0, 0);

      const rankLabel = addTextObject(this.scene, 0, 0, rank, TextStyle.WINDOW, { fontSize: "54px" });
      entryContainer.add(rankLabel);

      const usernameLabel = addTextObject(this.scene, 12, 0, username, TextStyle.WINDOW, { fontSize: "54px" });
      entryContainer.add(usernameLabel);

      const scoreLabel = addTextObject(this.scene, 84, 0, score, TextStyle.WINDOW, { fontSize: "54px" });
      entryContainer.add(scoreLabel);

      switch (this.category) {
      case ScoreboardCategory.DAILY:
        const waveLabel = addTextObject(this.scene, 68, 0, wave, TextStyle.WINDOW, { fontSize: "54px" });
        entryContainer.add(waveLabel);
        break;
      case ScoreboardCategory.WEEKLY:
        scoreLabel.x -= 16;
        break;
      }

      return entryContainer;
    };

    this.rankingsContainer.add(getEntry(i18next.t("menu:positionIcon"), i18next.t("menu:usernameScoreboard"), i18next.t("menu:score"), i18next.t("menu:wave")));

    rankings.forEach((r: RankingEntry, i: integer) => {
      const entryContainer = getEntry(r.rank.toString(), r.username, r.score.toString(), r.wave.toString());
      entryContainer.setY((i + 1) * 9);
      this.rankingsContainer.add(entryContainer);
    });
  }

  /**
   * Updates the scoreboard rankings based on the selected category and page.
   *
   * If the update process is already ongoing, the method exits early. Otherwise, it begins the update process by clearing
   * the current rankings and showing a loading label. If the category changes, the page is reset to 1.
   *
   * The method fetches the total page count if necessary, followed by fetching the rankings for the specified category
   * and page. It updates the UI with the fetched rankings or shows an appropriate message if no rankings are found.
   *
   * @param {ScoreboardCategory} [category=this.category] - The category to fetch rankings for. Defaults to the current category.
   * @param {number} [page=this.page] - The page number to fetch. Defaults to the current page.
  */
  update(category: ScoreboardCategory = this.category, page: integer = this.page) {
    if (this.isUpdating) {
      return;
    }

    this.isUpdating = true;
    this.rankingsContainer.removeAll(true);

    this.loadingLabel.setText(i18next.t("menu:loading"));
    this.loadingLabel.setVisible(true);

    if (category !== this.category) {
      this.page = page = 1;
    }

    Utils.executeIf(category !== this.category || this.pageCount === undefined,
      () => Utils.apiFetch(`daily/rankingpagecount?category=${category}`).then(response => response.json()).then(count => this.pageCount = count)
    ).then(() => {
      Utils.apiFetch(`daily/rankings?category=${category}&page=${page}`)
        .then(response => response.json())
        .then(jsonResponse => {
          this.page = page;
          this.category = category;
          this.titleLabel.setText(`${i18next.t(`menu:${ScoreboardCategory[category].toLowerCase()}Rankings`)}`);
          this.pageNumberLabel.setText(page.toString());
          if (jsonResponse) {
            this.loadingLabel.setVisible(false);
            this.updateRankings(jsonResponse);
          } else {
            this.loadingLabel.setText(i18next.t("menu:noRankings"));
          }
        }).finally(() => {
          this.isUpdating = false;
        });
    }).catch(err => {
      console.error("Failed to load daily rankings:\n", err);
    });
  }

  /**
   * Sets the state of the navigation buttons.
   * @param {boolean} [enabled=true] - Whether the buttons should be enabled or disabled.
   */
  setButtonsState(enabled: boolean = true) {
    const buttons = [
      { button: this.prevPageButton, alphaValue: enabled ? (this.page > 1 ? 1 : 0.5) : 0.5 },
      { button: this.nextPageButton, alphaValue: enabled ? (this.page < this.pageCount ? 1 : 0.5) : 0.5 },
      { button: this.nextCategoryButton, alphaValue: enabled ? 1 : 0.5 },
      { button: this.prevCategoryButton, alphaValue: enabled ? 1 : 0.5 }
    ];

    buttons.forEach(({ button, alphaValue }) => {
      if (enabled) {
        button.setInteractive();
      } else {
        button.disableInteractive();
      }
      button.setAlpha(alphaValue);
    });
  }
}

export interface DailyRunScoreboard {
  scene: BattleScene
}
