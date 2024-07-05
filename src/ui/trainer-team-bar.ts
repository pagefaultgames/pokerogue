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
  private teamIcons: Array<Phaser.GameObjects.Sprite[]> = [];
  private tween: Phaser.Tweens.Tween;
  private components: any[] = [];
  private shown: boolean = false;
  private overridden: boolean = false;

  // Constructor
  constructor(scene: Phaser.Scene) {
    super(scene, -200, -107);
    this.gamescene = scene as BattleScene;
    this.components = [this]
    this.bg = this.scene.add.nineslice(-5, -5, "ability_bar_left", null, 200, 70, 10, 10);
    this.bg.setOrigin(0, 0);
    this.add(this.bg);
  }

  /*
    Show or hide the BGM bar.
    @param {boolean} visible Whether to show or hide the BGM bar.
   */
  public toggleFlyout(visible: boolean): void {
    //console.log("Update team bar", visible)
    if (this.overridden) return; // Don't toggle the state if it has been overridden
    this.shown = visible
    this.scene.tweens.add({
      targets: this,
      x: visible ? -100 : -200,
      duration: 500,
      ease: "Sine.easeInOut",
      onUpdate: () => {
      }
    });
  }
  public tempToggleFlyout(visible: boolean): void {
    this.overridden = true
    //console.log("Update team bar", visible)
    this.scene.tweens.add({
      targets: this,
      x: visible ? -100 : -200,
      duration: 500,
      ease: "Sine.easeInOut",
      onUpdate: () => {
      }
    });
  }
  public revertFlyout(): void {
    var visible = this.shown
    this.overridden = false
    //console.log("Update team bar", visible)
    this.scene.tweens.add({
      targets: this,
      x: visible ? -100 : -200,
      duration: 500,
      ease: "Sine.easeInOut",
      onUpdate: () => {
      }
    });
  }
}