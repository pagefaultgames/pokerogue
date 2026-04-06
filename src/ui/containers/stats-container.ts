import { globalScene } from "#app/global-scene";
import { getStatKey, PERMANENT_STATS } from "#enums/stat";
import { TextStyle } from "#enums/text-style";
import { addBBCodeTextObject, addTextObject, getTextColor } from "#ui/text";
import i18next from "i18next";
import type BBCodeText from "phaser3-rex-plugins/plugins/gameobjects/tagtext/bbcodetext/BBCodeText";

const ivChartSize = 24;
const ivChartStatCoordMultipliers = [
  [0, -1],
  [0.825, -0.5],
  [0.825, 0.5],
  [-0.825, -0.5],
  [-0.825, 0.5],
  [0, 1],
];
const speedLabelOffset = -3;
const sideLabelOffset = 1;
const ivLabelOffset = [0, sideLabelOffset, -sideLabelOffset, sideLabelOffset, -sideLabelOffset, speedLabelOffset];
const ivChartLabelyOffset = [0, 5, 0, 5, 0, 0]; // doing this so attack does not overlap with (+N)
const ivChartStatIndexes = [0, 1, 2, 5, 4, 3]; // swap special attack and speed

const defaultIvChartData: number[] = new Array(12).fill(0);

export class StatsContainer extends Phaser.GameObjects.Container {
  private readonly showDiff: boolean;
  private statsIvsCache: number[];
  private ivChart: Phaser.GameObjects.Polygon;
  private ivStatValueTexts: BBCodeText[];

  constructor(x: number, y: number, showDiff = false) {
    super(globalScene, x, y);

    this.showDiff = showDiff;

    this.setup();
  }

  private setup(): void {
    this.setName("stats");
    // TODO: ...
    const ivChartBgData = new Array(6)
      .fill(null)
      .flatMap((_, i: number) => [
        ivChartSize * ivChartStatCoordMultipliers[ivChartStatIndexes[i]][0],
        ivChartSize * ivChartStatCoordMultipliers[ivChartStatIndexes[i]][1],
      ]);
    const ivChartBg = globalScene.add //
      .polygon(48, 44, ivChartBgData, 0xd8e0f0, 0.625)
      .setOrigin(0);

    const ivChartBorder = globalScene.add
      .polygon(ivChartBg.x, ivChartBg.y, ivChartBgData)
      .setStrokeStyle(1, 0x484050)
      .setOrigin(0);

    const ivChartBgLines = [
      [0, -1, 0, 1],
      [-0.825, -0.5, 0.825, 0.5],
      [0.825, -0.5, -0.825, 0.5],
    ].map(coords => {
      const line = new Phaser.GameObjects.Line(
        globalScene,
        ivChartBg.x,
        ivChartBg.y,
        ivChartSize * coords[0],
        ivChartSize * coords[1],
        ivChartSize * coords[2],
        ivChartSize * coords[3],
        0xffffff,
      )
        .setLineWidth(0.5)
        .setOrigin(0);
      return line;
    });

    this.ivChart = globalScene.add //
      .polygon(ivChartBg.x, ivChartBg.y, defaultIvChartData, 0x98d8a0, 0.75)
      .setOrigin(0);

    this.add(ivChartBg);
    ivChartBgLines.map(l => this.add(l));
    this.add(this.ivChart);
    this.add(ivChartBorder);

    this.ivStatValueTexts = [];

    for (const s of PERMANENT_STATS) {
      const statLabel = addTextObject(
        ivChartBg.x + ivChartSize * ivChartStatCoordMultipliers[s][0] * 1.325 + (this.showDiff ? 0 : ivLabelOffset[s]),
        ivChartBg.y
          + ivChartSize * ivChartStatCoordMultipliers[s][1] * 1.325
          - 4
          + (this.showDiff ? 0 : ivChartLabelyOffset[s]),
        i18next.t(getStatKey(s)),
        TextStyle.STATS_HEXAGON,
      );
      statLabel.setOrigin(0.5);

      this.ivStatValueTexts[s] = addBBCodeTextObject(
        statLabel.x - (this.showDiff ? 0 : ivLabelOffset[s]),
        statLabel.y + 8,
        "0",
        TextStyle.STATS_HEXAGON,
      );
      this.ivStatValueTexts[s].setOrigin(0.5);

      this.add(statLabel);
      this.add(this.ivStatValueTexts[s]);
    }
  }

  public updateIvs(ivs: number[] | null, originalIvs?: number[]): void {
    if (!ivs) {
      this.statsIvsCache = defaultIvChartData;
      this.ivChart.setTo(defaultIvChartData);
      return;
    }

    const ivChartData = new Array(6)
      .fill(null)
      .flatMap((_, i) => [
        (ivs[ivChartStatIndexes[i]] / 31) * ivChartSize * ivChartStatCoordMultipliers[ivChartStatIndexes[i]][0],
        (ivs[ivChartStatIndexes[i]] / 31) * ivChartSize * ivChartStatCoordMultipliers[ivChartStatIndexes[i]][1],
      ]);
    const lastIvChartData = this.statsIvsCache || defaultIvChartData;
    const perfectIVColor: string = getTextColor(TextStyle.SUMMARY_GOLD, false);
    this.statsIvsCache = ivChartData.slice(0);

    this.ivStatValueTexts.forEach((text: BBCodeText, index: number) => {
      let label = "";

      // Check to see if IVs are 31, if so change the text style to gold, otherwise leave them be.
      if (ivs[index] === 31) {
        label += `[color=${perfectIVColor}][shadow]${ivs[index].toString()}[/shadow][/color]`;
      } else {
        label = ivs[index].toString();
      }
      if (this.showDiff && originalIvs) {
        if (originalIvs[index] < ivs[index]) {
          label += ` ([color=${getTextColor(TextStyle.SUMMARY_BLUE, false)}][shadow=${getTextColor(TextStyle.SUMMARY_BLUE, true)}]+${ivs[index] - originalIvs[index]}[/shadow][/color])`;
        } else {
          label += " (-)";
        }
      }
      text.setText(`[shadow]${label}[/shadow]`);
    });

    const newColor = ivs.every(iv => iv === 31) ? Number.parseInt(perfectIVColor.substr(1), 16) : 0x98d8a0;
    const oldColor = this.ivChart.fillColor;
    const interpolateColor =
      oldColor !== newColor
        ? [Phaser.Display.Color.IntegerToColor(oldColor), Phaser.Display.Color.IntegerToColor(newColor)]
        : null;

    globalScene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 1000,
      ease: "Cubic.easeOut",
      onUpdate: (tween: Phaser.Tweens.Tween) => {
        const progress = tween.getValue() ?? 1;
        const interpolatedData = ivChartData.map(
          (v: number, i: number) => v * progress + lastIvChartData[i] * (1 - progress),
        );
        if (interpolateColor) {
          this.ivChart.setFillStyle(
            Phaser.Display.Color.ValueToColor(
              Phaser.Display.Color.Interpolate.ColorWithColor(interpolateColor[0], interpolateColor[1], 1, progress),
            ).color,
            0.75,
          );
        }
        this.ivChart.setTo(interpolatedData);
      },
    });
  }
}
