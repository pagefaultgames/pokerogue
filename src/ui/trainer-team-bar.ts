import BattleScene from "../battle-scene";
import {addTextObject, TextStyle} from "./text";
import i18next from "i18next";
import * as Utils from "#app/utils";
import { EnemyPokemon } from "#app/field/pokemon.js";

export default class TeamBar extends Phaser.GameObjects.Container {
  // Public vars
  public party: EnemyPokemon[];
  public gamescene: BattleScene;

  // Private vars
  private bg: Phaser.GameObjects.NineSlice;
  private teamIcons: Array<Phaser.GameObjects.Sprite[]>;
  private tween: Phaser.Tweens.Tween;
  private components: any[] = [];

  // Constructor
  constructor(scene: Phaser.Scene) {
    super(scene, -150, 0);
    this.gamescene = scene as BattleScene;
    this.components = [this]
    this.bg = this.scene.add.nineslice(-5, -5, "ability_bar_left", null, 200, 100, 0, 0, 10, 10);
    this.bg.setOrigin(0, 0);
    this.add(this.bg);
    for (var i = 0; i < 1; i++) {
      for (var j = 0; j < 6; j++) {
        if (i == 0) this.teamIcons[j] = []
        this.teamIcons[j][i] = this.scene.add.sprite(0, 0, "pb_tray_ball", "empty")
        this.teamIcons[j][i].setOrigin(0, 0);
        //this.teamIcons[j][i].setVisible(false);
        this.add(this.teamIcons[j][i])
        this.components.push(this.teamIcons[j][i])
      }
    }
  }

  /*
    Show or hide the BGM bar.
    @param {boolean} visible Whether to show or hide the BGM bar.
   */
  public toggleFlyout(visible: boolean): void {
    this.scene.tweens.add({
      targets: this,
      x: visible ? 0 : -200,
      alpha: visible ? 1 : 0,
      duration: 500,
      ease: "Sine.easeInOut"
      //onComplete: () => {
        //
      //}
    });
  }
}