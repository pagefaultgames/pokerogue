import BattleScene from "../battle-scene";
import { ModifierTier, ModifierType } from "../modifier";
import { getPokeballAtlasKey, PokeballType } from "../pokeball";
import { addTextObject, TextStyle } from "../text";
import AwaitableUiHandler from "./awaitable-ui-handler";
import { Mode } from "./ui";

export default class ModifierSelectUiHandler extends AwaitableUiHandler {
  private overlayBg: Phaser.GameObjects.Rectangle;
  private modifierContainer: Phaser.GameObjects.Container;
  public options: ModifierOption[];

  private cursorObj: Phaser.GameObjects.Image;

  constructor(scene: BattleScene) {
    super(scene, Mode.SWITCH_CHECK);

    this.options = [];
  }

  setup() {
    const ui = this.getUi();

    const overlayWidth = this.scene.game.canvas.width / 6;
    const overlayHeight = (this.scene.game.canvas.height / 6) - 48;
    this.overlayBg = this.scene.add.rectangle(0, overlayHeight * -1 - 48, overlayWidth, overlayHeight, 0x424242);
    this.overlayBg.setOrigin(0, 0);
    this.overlayBg.setAlpha(0);
    ui.add(this.overlayBg);
    
    this.modifierContainer = this.scene.add.container(0, 0);
    ui.add(this.modifierContainer);
  }

  show(args: any[]) {
    if (this.active || args.length !== 2 || !(args[0] instanceof Array) || !args[0].length || !(args[1] instanceof Function))
      return;

    super.show(args);

    this.getUi().clearText();

    const types = args[0] as ModifierType[];
    for (let m = 0; m < types.length; m++) {
      const sliceWidth = (this.scene.game.canvas.width / 6) / (types.length + 2);
      const option = new ModifierOption(this.scene, sliceWidth * (m + 1) + (sliceWidth * 0.5), -this.scene.game.canvas.height / 12 - 24, types[m]);
      option.setScale(0.5);
      this.scene.add.existing(option);
      this.modifierContainer.add(option);
      this.options.push(option);
    }

    this.scene.tweens.add({
      targets: this.overlayBg,
      alpha: 0.5,
      ease: 'Sine.easeOut',
      duration: 750
    });

    let i = 0;
    
    this.scene.tweens.addCounter({
      ease: 'Sine.easeIn',
      duration: 1250,
      onUpdate: t => {
        const value = t.getValue();
        const index = Math.floor(value * types.length);
        if (index > i && index <= types.length) {
          const option = this.options[i++];
          option?.show(Math.floor((1 - value) * 1250) * 0.325);
        }
      }
    });

    this.scene.time.delayedCall(4000, () => {
      this.setCursor(0);
      this.awaitingActionInput = true;
      this.onActionInput = args[1];
    });
  }

  processInput(keyCode: integer) {
    const keyCodes = Phaser.Input.Keyboard.KeyCodes;
    const ui = this.getUi();

    if (!this.awaitingActionInput)
      return;

    let success = false;

    if (keyCode === keyCodes.Z) {
      success = true;
      if (this.onActionInput)
        this.onActionInput(this.cursor);
    } else if (keyCode === keyCodes.X) {
      success = true;
      if (this.onActionInput)
        this.onActionInput(-1);
    } else {
      switch (keyCode) {
        case keyCodes.LEFT:
          if (this.cursor)
            success = this.setCursor(this.cursor - 1);
          break;
        case keyCodes.RIGHT:
          if (this.cursor < this.options.length - 1)
            success = this.setCursor(this.cursor + 1);
          break;
      }
    }

    if (success)
      ui.playSelect();
  }

  setCursor(cursor: integer): boolean {
    const ui = this.getUi();
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, 'cursor');
      this.cursorObj.setScale(2);
      this.modifierContainer.add(this.cursorObj);
    }

    const sliceWidth = (this.scene.game.canvas.width / 6) / (this.options.length + 2);
    this.cursorObj.setPosition(sliceWidth * (cursor + 1) + (sliceWidth * 0.5) - 20, -this.scene.game.canvas.height / 12 - 20);
    ui.showText(this.options[this.cursor].modifierType.description);

    return ret;
  }

  clear() {
    super.clear();

    this.awaitingActionInput = false;
    this.onActionInput = null;
    this.getUi().clearText();
    this.eraseCursor();

    this.scene.tweens.add({
      targets: this.overlayBg,
      alpha: 0,
      duration: 250,
      ease: 'Cubic.easeIn'
    });
    this.scene.tweens.add({
      targets: this.options,
      scale: 0.01,
      duration: 250,
      east: 'Elastic.easeIn',
      onComplete: () => {
        this.options.forEach(o => o.destroy());
        this.options.splice(0, this.options.length);
      }
    });
  }

  eraseCursor() {
    if (this.cursorObj)
      this.cursorObj.destroy();
    this.cursorObj = null;
  }
}

class ModifierOption extends Phaser.GameObjects.Container {
  public modifierType: ModifierType;
  private pb: Phaser.GameObjects.Sprite;
  private itemContainer: Phaser.GameObjects.Container;
  private item: Phaser.GameObjects.Sprite;
  private itemTint: Phaser.GameObjects.Sprite;
  private itemText: Phaser.GameObjects.Text;

  constructor(scene: BattleScene, x: number, y: number, modifierType: ModifierType) {
    super(scene, x, y);

    this.modifierType = modifierType;

    this.setup();
  }

  setup() {
    this.pb = this.scene.add.sprite(0, -150, 'pb', this.getPbAtlasKey());
    this.pb.setScale(2);
    this.add(this.pb);

    this.itemContainer = this.scene.add.container(0, 0);
    this.itemContainer.setScale(0.5);
    this.itemContainer.setAlpha(0);
    this.add(this.itemContainer);

    const getItem = () => {
      const item = this.scene.add.sprite(0, 0, 'items', this.modifierType.iconImage);
      return item;
    };

    this.item = getItem();
    this.itemContainer.add(this.item);

    this.itemTint = getItem();
    this.itemTint.setTintFill(Phaser.Display.Color.GetColor(255, 192, 255));
    this.itemContainer.add(this.itemTint);

    this.itemText = addTextObject(this.scene, 0, 35, this.modifierType.name, TextStyle.PARTY, { align: 'center' });
    this.itemText.setOrigin(0.5, 0);
    this.itemText.setAlpha(0);
    this.itemText.setTint(this.getTextTint());
    this.add(this.itemText);
  }

  show(remainingDuration: integer) {
    this.scene.tweens.add({
      targets: this.pb,
      y: 0,
      duration: 1250,
      ease: 'Bounce.Out'
    });

    let lastValue = 1;
    let bounceCount = 0;
    let bounce = false;

    this.scene.tweens.addCounter({
      from: 1,
      to: 0,
      duration: 1250,
      ease: 'Bounce.Out',
      onUpdate: t => {
        if (!this.scene)
          return;
        const value = t.getValue();
        if (!bounce && value > lastValue) {
          this.scene.sound.play('pb_bounce_1', { volume: 1 / ++bounceCount });
          bounce = true;
        } else if (bounce && value < lastValue)
          bounce = false;
        lastValue = value;
      }
    });

    this.scene.time.delayedCall(remainingDuration + 2000, () => {
      if (!this.scene)
        return;

      this.pb.setTexture('pb', `${this.getPbAtlasKey()}_open`);
      this.scene.sound.play('pb_rel');
      
      this.scene.tweens.add({
        targets: this.pb,
        duration: 500,
        delay: 250,
        ease: 'Sine.easeIn',
        alpha: 0,
        onComplete: () => this.pb.destroy()
      })
      this.scene.tweens.add({
        targets: this.itemContainer,
        duration: 500,
        ease: 'Elastic.Out',
        scale: 2,
        alpha: 1
      });
      this.scene.tweens.add({
        targets: this.itemTint,
        alpha: 0,
        duration: 500,
        ease: 'Sine.easeIn',
        onComplete: () => this.itemTint.destroy()
      });
      this.scene.tweens.add({
        targets: this.itemText,
        duration: 500,
        alpha: 1,
        y: 25,
        ease: 'Cubic.easeInOut'
      });
    })
  }

  getPbAtlasKey() {
    return getPokeballAtlasKey(this.modifierType.tier as integer as PokeballType);
  }

  getTextTint(): integer {
    switch (this.modifierType.tier) {
      case ModifierTier.COMMON:
        return 0xffffff
      case ModifierTier.GREAT:
        return 0x3890f8;
      case ModifierTier.ULTRA:
        return 0xf8d038
      case ModifierTier.MASTER:
        return 0xe020c0;
      case ModifierTier.LUXURY:
        return 0xe64a18;
    }
  }
}