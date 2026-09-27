// e.g. #sprites/sprite-shadow.ts
import { globalScene } from "#app/global-scene";

interface ShadowState {
  shadow: Phaser.GameObjects.Image;
  offsetY: number;
  sizedFor: Phaser.Textures.Frame | null;
}

const shadows = new Map<Phaser.GameObjects.Sprite, ShadowState>();
let listening = false;

function getShadowTextureKey(w: number, h: number): string {
  const key = `shadow_${w}x${h}`;
  if (!globalScene.textures.exists(key)) {
    const tex = globalScene.textures.createCanvas(key, w, h)!;
    const ctx = tex.getContext();
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = (x + 0.5) / w - 0.5;
        const dy = (y + 0.5) / h - 0.5;
        if (dx * dx + dy * dy < 0.25) {
          img.data[(y * w + x) * 4 + 3] = 128; // black at ~50% alpha
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    tex.refresh();
  }
  return key;
}

export function setSpriteShadow(sprite: Phaser.GameObjects.Sprite, enabled: boolean, offsetY = 0): void {
  const state = shadows.get(sprite);
  if (!enabled) {
    if (state) {
      removeShadow(sprite, state);
    }
    return;
  }
  if (state) {
    state.offsetY = offsetY;
    state.sizedFor = null; // force a resize
    return;
  }

  const shadow = globalScene.make.image({ key: getShadowTextureKey(1, 1) }, false).setOrigin(0, 0);
  shadows.set(sprite, { shadow, offsetY, sizedFor: null });
  sprite.once(Phaser.GameObjects.Events.DESTROY, () => {
    const s = shadows.get(sprite);
    if (s) {
      removeShadow(sprite, s);
    }
  });

  if (!listening) {
    globalScene.events.on(Phaser.Scenes.Events.PRE_RENDER, syncShadows);
    listening = true;
  }
}

function removeShadow(sprite: Phaser.GameObjects.Sprite, state: ShadowState): void {
  state.shadow.destroy();
  shadows.delete(sprite);
}

function placeBehind(sprite: Phaser.GameObjects.Sprite, shadow: Phaser.GameObjects.Image): void {
  const parent = sprite.parentContainer ?? sprite.displayList;
  if (!parent) {
    return;
  }
  if (shadow.parentContainer !== sprite.parentContainer || shadow.displayList !== sprite.displayList) {
    shadow.removeFromDisplayList();
    shadow.parentContainer?.remove(shadow);
    parent.addAt(shadow, parent.getIndex(sprite));
  } else if (parent.getIndex(shadow) !== parent.getIndex(sprite) - 1) {
    parent.moveBelow(shadow, sprite);
  }
  shadow.setDepth(sprite.depth);
}

function syncShadows(): void {
  for (const [sprite, state] of shadows) {
    const { shadow } = state;
    shadow.setVisible(sprite.visible);
    if (!sprite.visible) {
      continue;
    }

    placeBehind(sprite, shadow);

    const frame = sprite.frame; // trimmed: x/width/height describe the visible content
    const W = sprite.width; // untrimmed source size
    const H = sprite.height;
    const w = Math.max(1, Math.round(frame.width - (H - frame.height) / 2));
    const h = Math.max(1, Math.round(H * 0.15));

    if (state.sizedFor !== frame) {
      state.sizedFor = frame;
      // Create a new shadow texture with the correct size
      const key = getShadowTextureKey(w, h);
      if (shadow.texture.key !== key) {
        shadow.setTexture(key);
      }
    }

    // Everything in sprite-local pixels (untrimmed frame spans [0, W] x [0, H], feet at y = H)
    let cx = frame.x + frame.width / 2;
    if (sprite.flipX) {
      cx = W - cx;
    }
    const localLeft = Math.round(cx - w / 2);
    const localTop = Math.round(H - 0.1 * H + state.offsetY);

    shadow
      .setScale(sprite.scaleX, sprite.scaleY)
      .setPosition(
        sprite.x + (localLeft - sprite.originX * W) * sprite.scaleX,
        sprite.y + (localTop - sprite.originY * H) * sprite.scaleY,
      );
  }
}
