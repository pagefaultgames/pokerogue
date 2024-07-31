import BBCodeText from "phaser3-rex-plugins/plugins/gameobjects/tagtext/bbcodetext/BBCodeText";
import BattleScene from "../battle-scene";
import { Stat, getStatName } from "../data/pokemon-stat";
import { TextStyle, addBBCodeTextObject, addTextObject, getTextColor } from "./text";

const ivChartSize = 24;
const ivChartStatCoordMultipliers = [ [ 0, -1 ], [ 0.825, -0.5 ], [ 0.825, 0.5 ], [ -0.825, -0.5 ], [ -0.825, 0.5 ], [ 0, 1 ] ];
const ivChartStatIndexes = [0,1,2,5,4,3]; // swap special attack and speed
const defaultIvChartData = new Array(12).fill(null).map(() => 0);

export class StatsContainer extends Phaser.GameObjects.Container {
  private showDiff: boolean;
  private statsIvsCache: integer[];
  private ivChart: Phaser.GameObjects.Polygon;
  private ivStatValueTexts: BBCodeText[];

  constructor(scene: BattleScene, x: number, y: number, showDiff?: boolean) {
    super(scene, x, y);

    this.showDiff = !!showDiff;

    this.setup();
  }

  setup() {
    this.setName("container-stats");
    const ivChartBgData = new Array(6).fill(null).map((_, i: integer) => [ ivChartSize * ivChartStatCoordMultipliers[ivChartStatIndexes[i]][0], ivChartSize * ivChartStatCoordMultipliers[ivChartStatIndexes[i]][1] ] ).flat();

    const ivChartBg = this.scene.add.polygon(48, 44, ivChartBgData, 0xd8e0f0, 0.625);
    ivChartBg.setOrigin(0, 0);

    const ivChartBorder = this.scene.add.polygon(ivChartBg.x, ivChartBg.y, ivChartBgData)
      .setStrokeStyle(1, 0x484050);
    ivChartBorder.setOrigin(0, 0);

    const ivChartBgLines = [ [ 0, -1, 0, 1 ], [ -0.825, -0.5, 0.825, 0.5 ], [ 0.825, -0.5, -0.825, 0.5 ] ].map(coords => {
      const line = new Phaser.GameObjects.Line(this.scene, ivChartBg.x, ivChartBg.y, ivChartSize * coords[0], ivChartSize * coords[1], ivChartSize * coords[2], ivChartSize * coords[3], 0xffffff)
        .setLineWidth(0.5);
      line.setOrigin(0, 0);
      return line;
    });

    this.ivChart = this.scene.add.polygon(ivChartBg.x, ivChartBg.y, defaultIvChartData, 0x98d8a0, 0.75);
    this.ivChart.setOrigin(0, 0);

    this.add(ivChartBg);
    ivChartBgLines.map(l => this.add(l));
    this.add(this.ivChart);
    this.add(ivChartBorder);

    this.ivStatValueTexts = [];

    new Array(6).fill(null).map((_, i: integer) => {
      const statLabel = addTextObject(this.scene, ivChartBg.x + (ivChartSize) * ivChartStatCoordMultipliers[i][0] * 1.325, ivChartBg.y + (ivChartSize) * ivChartStatCoordMultipliers[i][1] * 1.325 - 4, getStatName(i as Stat), TextStyle.TOOLTIP_CONTENT);
      statLabel.setOrigin(0.5);

      this.ivStatValueTexts[i] = addBBCodeTextObject(this.scene, statLabel.x, statLabel.y + 8, "0", TextStyle.TOOLTIP_CONTENT);
      this.ivStatValueTexts[i].setOrigin(0.5);

      this.add(statLabel);
      this.add(this.ivStatValueTexts[i]);
    });
  }

  updateIvs(ivs: integer[], originalIvs?: integer[]): void {
    if (ivs) {
      const ivChartData = new Array(6).fill(null).map((_, i) => [ (ivs[ivChartStatIndexes[i]] / 31) * ivChartSize * ivChartStatCoordMultipliers[ivChartStatIndexes[i]][0], (ivs[ivChartStatIndexes[i]] / 31) * ivChartSize * ivChartStatCoordMultipliers[ivChartStatIndexes[i]][1] ] ).flat();
      const lastIvChartData = this.statsIvsCache || defaultIvChartData;
      this.statsIvsCache = ivChartData.slice(0);

      this.ivStatValueTexts.map((t: BBCodeText, i: integer) => {
        let label = "";

        // Check to see if IVs are 31, if so change the text style to gold, otherwise leave them be.
        if (ivs[i] === 31) {
          label += `[color=${getTextColor(TextStyle.SUMMARY_GOLD, false, (this.scene as BattleScene).uiTheme)}][shadow]${ivs[i].toString()}[/shadow][/color]`;
        } else {
          label = ivs[i].toString();
        }
        if (this.showDiff && originalIvs) {
          if (originalIvs[i] < ivs[i]) {
            label += ` ([color=${getTextColor(TextStyle.SUMMARY_BLUE, false, (this.scene as BattleScene).uiTheme)}][shadow=${getTextColor(TextStyle.SUMMARY_BLUE, true, (this.scene as BattleScene).uiTheme)}]+${ivs[i] - originalIvs[i]}[/shadow][/color])`;
          } else {
            label += " (-)";
          }
        }
        t.setText(`[shadow]${label}[/shadow]`);
      });

      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 1000,
        ease: "Cubic.easeOut",
        onUpdate: (tween: Phaser.Tweens.Tween) => {
          const progress = tween.getValue();
          const interpolatedData = ivChartData.map((v: number, i: integer) => v * progress + (lastIvChartData[i] * (1 - progress)));
          this.ivChart.setTo(interpolatedData);
        }
      });
    } else {
      this.statsIvsCache = defaultIvChartData;
      this.ivChart.setTo(defaultIvChartData);
    }
  }
}
