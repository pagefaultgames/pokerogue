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
  private tmpCharts: Phaser.GameObjects.Polygon[] = [];
  private ivStatValueTexts: BBCodeText[];

  constructor(scene: BattleScene, x: number, y: number, showDiff?: boolean) {
    super(scene, x, y);

    this.showDiff = !!showDiff;

    this.setup();
  }

  setup() {
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
        let label = ivs[i].toString();
        if (this.showDiff && originalIvs) {
          if (originalIvs[i] < ivs[i]) {
            label += ` ([color=${getTextColor(TextStyle.SUMMARY_BLUE, false, (this.scene as BattleScene).uiTheme)}][shadow=${getTextColor(TextStyle.SUMMARY_BLUE, true, (this.scene as BattleScene).uiTheme)}]+${ivs[i] - originalIvs[i]}[/shadow][/color])`;
          } else {
            label += " (-)";
          }
        }
        t.setText(`[shadow]${label}[/shadow]`);
      });
	  
	  this.ivChart.setFillStyle(0x98d8a0, 0.75);
	  this.tmpCharts.map(c => {
		  if(c.parentContainer)
			  c.parentContainer.remove(c);
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

  updateBase(base: integer[], forms: integer[][]): void {
    if (base) {
      const ivChartData = new Array(6).fill(null).map((_, i) => [ (base[ivChartStatIndexes[i]] / 200) * ivChartSize * ivChartStatCoordMultipliers[ivChartStatIndexes[i]][0], (base[ivChartStatIndexes[i]] / 200) * ivChartSize * ivChartStatCoordMultipliers[ivChartStatIndexes[i]][1] ] ).flat();
      const lastIvChartData = this.statsIvsCache || defaultIvChartData;
	  const formsChartData = forms.map(f => new Array(6).fill(null).map((_, i) => [ (f[ivChartStatIndexes[i]] / 200) * ivChartSize * ivChartStatCoordMultipliers[ivChartStatIndexes[i]][0], (f[ivChartStatIndexes[i]] / 200) * ivChartSize * ivChartStatCoordMultipliers[ivChartStatIndexes[i]][1] ] ).flat()).reverse();
      this.statsIvsCache = ivChartData.slice(0);
      
      this.ivStatValueTexts.map((t: BBCodeText, i: integer) => {
        let label = base[i].toString();
        t.setText(`[shadow]${label}[/shadow]`);
      });
	  
	  this.ivChart.setFillStyle(0xFF0000, 0.75);
	  
	  const fcount = formsChartData?.length || 0;
	  this.remove(this.ivChart);
	  for(let x = this.tmpCharts.length; x < fcount; x++){
		  let tmp = this.scene.add.polygon(this.ivChart.x, this.ivChart.y, defaultIvChartData, 0, 0.5);
		  tmp.setOrigin(0, 0);
		  this.tmpCharts.push(tmp);
	  }
	  this.tmpCharts.forEach((c : Phaser.GameObjects.Polygon, i : integer) => {
		  if(i < fcount){
			  c.setFillStyle(Math.floor(255 * (i) / (fcount - 1)), 0.2);
			  c.setTo(lastIvChartData);
			  this.add(c);
		  }else{
			  if(c.parentContainer)
				this.remove(c);
		  }
	  });
	  this.add(this.ivChart); // readd to adjust z-index

      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 1000,
        ease: "Cubic.easeOut",
        onUpdate: (tween: Phaser.Tweens.Tween) => {
          const progress = tween.getValue();
          const interpolatedData = ivChartData.map((v: number, i: integer) => v * progress + (lastIvChartData[i] * (1 - progress)));
		  formsChartData.forEach((data, i) => {
			const fid = data.map((v: number, i: integer) => v * progress + (lastIvChartData[i] * (1 - progress)));
			this.tmpCharts[i].setTo(fid);
		  });
          this.ivChart.setTo(interpolatedData);
        }
      });
    } else {
      this.statsIvsCache = defaultIvChartData;
      this.ivChart.setTo(defaultIvChartData);
    }
  }
}
