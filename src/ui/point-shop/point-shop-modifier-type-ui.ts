import BattleScene from "#app/battle-scene.js";
import { TextStyle, addTextObject } from "#app/ui/text";
import { ActiveChangedEvent, ActiveOptionChangedEvent, PointShopModifierCategory, PointShopModifierEvent, PointShopModifierType } from "#app/ui/point-shop/point-shop-modifier-type";
import { AbstractMultiPointShopModifierType } from "#app/ui/point-shop/point-shop-modifier-types";
import { CategoryChangeEvent, PointShopEvent } from "./point-shop-ui-handler";

export class PointShopModifierTypeUi extends Phaser.GameObjects.Container {
  private icon: Phaser.GameObjects.Image;
  private enabledIcon: Phaser.GameObjects.Image;
  private text: Phaser.GameObjects.Text;

  private category: PointShopModifierCategory;
  private modifierType: PointShopModifierType;

  public constructor(
    scene: BattleScene,
    x: number, y: number,
    category: PointShopModifierCategory, modifierType: PointShopModifierType,
    uiEventTarget: EventTarget) {
    super(scene, x, y);

    this.category = category;
    this.modifierType = modifierType;

    this.icon = this.scene.add
      .image(0, 0, "items", this.modifierType.iconImage)
      .setOrigin(0, 0)
      .setScale(0.5);
    this.enabledIcon = this.scene.add
      .image(8, 8, "select_cursor_highlight")
      .setOrigin()
      .setScale(0.75)
      .setVisible(this.modifierType.active);

    this.add([this.icon, this.enabledIcon]);

    const cost = !(this.modifierType instanceof AbstractMultiPointShopModifierType)
      ? this.modifierType.cost.toString()
      : this.modifierType.cost + "+" ;

    this.text = addTextObject(this.scene, x, y, cost, TextStyle.PARTY);
    this.text.setScale(this.text.scaleX / 2, this.text.scaleY / 2);

    this.setVisible(false);

    uiEventTarget.addEventListener(PointShopEvent.CATEGORY_CHANGE_EVENT, (event) => this.onCategoryChange(event));

    this.modifierType.eventTarget.addEventListener(PointShopModifierEvent.INIT_EVENT, (event) => this.onInit(event));
    this.modifierType.eventTarget.addEventListener(PointShopModifierEvent.ACTIVE_CHANGED_EVENT, (event) => this.onActiveChanged(event));
    this.modifierType.eventTarget.addEventListener(PointShopModifierEvent.ACTIVE_OPTION_CHANGED_EVENT, (event) => this.onActiveOptionChanged(event));
  }

  public setVisible(value: boolean): this {
    super.setVisible(value);
    this.text.setVisible(value);

    return this;
  }

  public setTextContainer() {
    this.parentContainer.add(this.text);
  }

  private onCategoryChange(event: Event) {
    const categoryChangedEvent: CategoryChangeEvent = event as CategoryChangeEvent;
    if (!categoryChangedEvent) {
      return;
    }

    if (this.category === categoryChangedEvent.oldCategory) {
      this.setVisible(false);
    }
    if (this.category === categoryChangedEvent.newCategory) {
      this.setVisible(true);
    }
  }

  private onInit(event: Event) {
    if (!event) {
      return;
    }

    if (!this.modifierType.meetsRequirements()) {
      this.icon.setTint(0x808080);
    } else {
      this.icon.clearTint();
    }
  }

  private onActiveChanged(event: Event) {
    const activeChangedEvent: ActiveChangedEvent = event as ActiveChangedEvent;
    if (!activeChangedEvent) {
      return;
    }

    this.enabledIcon.setVisible(activeChangedEvent.value);
  }
  onActiveOptionChanged(event: Event): void {
    const activeOptionChangedEvent: ActiveOptionChangedEvent = event as ActiveOptionChangedEvent;
    if (!activeOptionChangedEvent) {
      return;
    }

    if (this.modifierType instanceof AbstractMultiPointShopModifierType) {
      this.enabledIcon.setVisible(this.modifierType.modifierOptions.some(option => option.active));
    }
  }
}
