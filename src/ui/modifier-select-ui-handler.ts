import BattleScene, { Button } from "../battle-scene";
import { ModifierTier, ModifierTypeOption } from "../modifier/modifier-type";
import { getPokeballAtlasKey, PokeballType } from "../data/pokeball";
import { addTextObject, TextStyle } from "./text";
import AwaitableUiHandler from "./awaitable-ui-handler";
import { Mode } from "./ui";
import { PokemonHeldItemModifier } from "../modifier/modifier";

export default class ModifierSelectUiHandler extends AwaitableUiHandler {
  private overlayBg: Phaser.GameObjects.Rectangle;
  private modifierContainer: Phaser.GameObjects.Container;
  private transferButtonContainer: Phaser.GameObjects.Container;

  private lastCursor: integer = 0;

  public options: ModifierOption[];

  private cursorObj: Phaser.GameObjects.Image;

  constructor(scene: BattleScene) {
    super(scene, Mode.CONFIRM);

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

    this.transferButtonContainer = this.scene.add.container((this.scene.game.canvas.width / 6) - 1, -64);
    this.transferButtonContainer.setVisible(false);
    ui.add(this.transferButtonContainer);

    const transferButtonText = addTextObject(this.scene, -4, -2, 'Transfer', TextStyle.PARTY);
    transferButtonText.setOrigin(1, 0);
    this.transferButtonContainer.add(transferButtonText);
  }

  show(args: any[]) {
    if (this.active) {
      if (args.length === 2) {
        this.awaitingActionInput = true;
        this.onActionInput = args[1];
      }
      return;
    }

    if (args.length !== 2 || !(args[0] instanceof Array) || !args[0].length || !(args[1] instanceof Function))
      return;

    super.show(args);

    this.getUi().clearText();

    const partyHasHeldItem = !!this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier && (m as PokemonHeldItemModifier).getTransferrable(true)).length;

    this.transferButtonContainer.setVisible(false);
    this.transferButtonContainer.setAlpha(0);

    const typeOptions = args[0] as ModifierTypeOption[];
    for (let m = 0; m < typeOptions.length; m++) {
      const sliceWidth = (this.scene.game.canvas.width / 6) / (typeOptions.length + 2);
      const option = new ModifierOption(this.scene, sliceWidth * (m + 1) + (sliceWidth * 0.5), -this.scene.game.canvas.height / 12 - 24, typeOptions[m]);
      option.setScale(0.5);
      this.scene.add.existing(option);
      this.modifierContainer.add(option);
      this.options.push(option);
    }

    const hasUpgrade = typeOptions.filter(to => to.upgraded).length;

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
        const index = Math.floor(value * typeOptions.length);
        if (index > i && index <= typeOptions.length) {
          const option = this.options[i++];
          option?.show(Math.floor((1 - value) * 1250) * 0.325 + (hasUpgrade ? 2000 : 0));
        }
      }
    });

    this.scene.time.delayedCall(4000 + (hasUpgrade ? 2000 : 0), () => {
      if (partyHasHeldItem) {
        this.transferButtonContainer.setAlpha(0);
        this.transferButtonContainer.setVisible(true);
        this.scene.tweens.add({
          targets: this.transferButtonContainer,
          alpha: 1,
          duration: 250
        });
      }

      this.setCursor(0);
      this.awaitingActionInput = true;
      this.onActionInput = args[1];
    });
  }

  processInput(button: Button) {
    const ui = this.getUi();

    if (!this.awaitingActionInput)
      return;

    let success = false;

    if (button === Button.ACTION) {
      success = true;
      if (this.onActionInput) {
        const originalOnActionInput = this.onActionInput;
        this.awaitingActionInput = false;
        this.onActionInput = null;
        originalOnActionInput(this.cursor);
      }
    } else if (button === Button.CANCEL) {
      success = true;
      if (this.onActionInput) {
        const originalOnActionInput = this.onActionInput;
        this.awaitingActionInput = false;
        this.onActionInput = null;
        originalOnActionInput(-1);
      }
    } else {
      switch (button) {
        case Button.UP:
          if (this.cursor === this.options.length)
            success = this.setCursor(this.lastCursor);
          break;
        case Button.DOWN:
          if (this.cursor < this.options.length && this.transferButtonContainer.visible)
            success = this.setCursor(this.options.length);
          break;
        case Button.LEFT:
          if (this.cursor)
            success = this.setCursor(this.cursor - 1);
          break;
        case Button.RIGHT:
          if (this.cursor < this.options.length - (this.transferButtonContainer.visible ? 0 : 1))
            success = this.setCursor(this.cursor + 1);
          break;
      }
    }

    if (success)
      ui.playSelect();
  }

  setCursor(cursor: integer): boolean {
    const lastCursor = this.cursor;

    const ui = this.getUi();
    const ret = super.setCursor(cursor);

    if (ret)
      this.lastCursor = lastCursor;

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, 'cursor');
      this.modifierContainer.add(this.cursorObj);
    }

    this.cursorObj.setScale(cursor < this.options.length ? 2 : 1);

    if (cursor < this.options.length) {
      const sliceWidth = (this.scene.game.canvas.width / 6) / (this.options.length + 2);
      this.cursorObj.setPosition(sliceWidth * (cursor + 1) + (sliceWidth * 0.5) - 20, -this.scene.game.canvas.height / 12 - 20);
      ui.showText(this.options[this.cursor].modifierTypeOption.type.description);
    } else {
      this.cursorObj.setPosition((this.scene.game.canvas.width / 6) - 50, -60);
      ui.showText('Transfer a held item from one Pokémon to another instead of selecting an item');
    }

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
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.options.forEach(o => o.destroy());
        this.options.splice(0, this.options.length);
      }
    });
    if (this.transferButtonContainer.visible) {
      this.scene.tweens.add({
        targets: this.transferButtonContainer,
        alpha: 0,
        duration: 250,
        ease: 'Cubic.easeIn',
        onComplete: () => this.transferButtonContainer.setVisible(false)
      })
    }
  }

  eraseCursor() {
    if (this.cursorObj)
      this.cursorObj.destroy();
    this.cursorObj = null;
  }
}

class ModifierOption extends Phaser.GameObjects.Container {
  public modifierTypeOption: ModifierTypeOption;
  private pb: Phaser.GameObjects.Sprite;
  private pbTint: Phaser.GameObjects.Sprite;
  private itemContainer: Phaser.GameObjects.Container;
  private item: Phaser.GameObjects.Sprite;
  private itemTint: Phaser.GameObjects.Sprite;
  private itemText: Phaser.GameObjects.Text;

  constructor(scene: BattleScene, x: number, y: number, modifierTypeOption: ModifierTypeOption) {
    super(scene, x, y);

    this.modifierTypeOption = modifierTypeOption;

    this.setup();
  }

  setup() {
    const getPb = (): Phaser.GameObjects.Sprite => {
      const pb = this.scene.add.sprite(0, -150, 'pb', this.getPbAtlasKey(true));
      pb.setScale(2);
      return pb;
    };

    this.pb = getPb();
    this.add(this.pb);

    this.pbTint = getPb();
    this.pbTint.setVisible(false);
    this.add(this.pbTint);

    this.itemContainer = this.scene.add.container(0, 0);
    this.itemContainer.setScale(0.5);
    this.itemContainer.setAlpha(0);
    this.add(this.itemContainer);

    const getItem = () => {
      const item = this.scene.add.sprite(0, 0, 'items', this.modifierTypeOption.type.iconImage);
      return item;
    };

    this.item = getItem();
    this.itemContainer.add(this.item);

    this.itemTint = getItem();
    this.itemTint.setTintFill(Phaser.Display.Color.GetColor(255, 192, 255));
    this.itemContainer.add(this.itemTint);

    this.itemText = addTextObject(this.scene, 0, 35, this.modifierTypeOption.type.name, TextStyle.PARTY, { align: 'center' });
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

    if (this.modifierTypeOption.upgraded) {
      this.scene.time.delayedCall(remainingDuration, () => {
        this.scene.sound.play('upgrade');
        this.pbTint.setPosition(this.pb.x, this.pb.y);
        this.pbTint.setTintFill(0xFFFFFF);
        this.pbTint.setAlpha(0);
        this.pbTint.setVisible(true);
        this.scene.tweens.add({
          targets: this.pbTint,
          alpha: 1,
          duration: 1000,
          ease: 'Sine.easeIn',
          onComplete: () => {
            this.pb.setTexture('pb', this.getPbAtlasKey(false));
            this.scene.tweens.add({
              targets: this.pbTint,
              alpha: 0,
              duration: 1000,
              ease: 'Sine.easeOut',
              onComplete: () => {
                this.pbTint.setVisible(false);
              }
            });
          }
        });
      });
    }

    this.scene.time.delayedCall(remainingDuration + 2000, () => {
      if (!this.scene)
        return;

      this.pb.setTexture('pb', `${this.getPbAtlasKey(false)}_open`);
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

  getPbAtlasKey(beforeUpgrade: boolean) {
    return getPokeballAtlasKey((this.modifierTypeOption.type.tier - (beforeUpgrade && this.modifierTypeOption.upgraded ? 1 : 0)) as integer as PokeballType);
  }

  getTextTint(): integer {
    switch (this.modifierTypeOption.type.tier) {
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