import { globalScene } from "#app/global-scene";
import {
  type FusionSpritePair,
  type FusionSpriteVariant,
  fusionSpriteAtlasPath,
  fusionSpriteKey,
} from "#sprites/fusion-sprite-paths";
import {
  clearFusionSpriteCaches,
  describeFusionSprite,
  describeFusionSpriteCandidates,
  hasBeenChecked,
  markMissing,
  markPresent,
  resolveFusionSprite,
} from "#sprites/fusion-sprite-resolver";
import { getBlobUrlFromIfFolder, getIfFolderHandle } from "#system/if-folder-handle";
import { FusionSettingKeys, getFusionSettingValue, onFusionSettingChange } from "#system/settings/fusion-settings";

// Source-priority changes swap which folder/URL a pair resolves to, so wipe
// probe state and any registered IF textures to force re-resolution.
onFusionSettingChange(key => {
  if (key !== FusionSettingKeys.Sprite_Source) {
    return;
  }
  clearFusionSpriteCaches();
  inFlight.clear();
  if (!globalScene?.textures) {
    return;
  }
  for (const texKey of Object.keys(globalScene.textures.list as Record<string, unknown>)) {
    if (texKey.startsWith("pkmn__fusion__") || texKey.startsWith("pkmn__back__fusion__")) {
      globalScene.textures.remove(texKey);
    }
  }
});

// Vanilla render paths call `sprite.play(key)`; without an animation registered
// under the texture key Phaser errors with "Missing animation". A 1-frame anim
// renders as a static image, matching species without BW-style multi-frame anims.
function ensureSingleFrameAnim(textureKey: string): void {
  if (globalScene.anims.exists(textureKey)) {
    return;
  }
  globalScene.anims.create({
    key: textureKey,
    frames: [{ key: textureKey, frame: "__BASE" }],
    frameRate: 1,
    repeat: -1,
  });
}

const inFlight = new Map<string, Promise<string | null>>();

/**
 * Ensure the fusion sprite for this pair is in Phaser's texture cache.
 * Falls back to the default variant when a preferred variant 404s.
 * @returns the texture key on success, or null if no custom sprite exists.
 */
export function ensureFusionSpriteLoaded(
  pair: FusionSpritePair,
  back = false,
  variant: FusionSpriteVariant = "",
): Promise<string | null> {
  return loadVariant(pair, back, variant).then(key => {
    if (key !== null || !variant) {
      return key;
    }
    return loadVariant(pair, back, "");
  });
}

function loadVariant(pair: FusionSpritePair, back: boolean, variant: FusionSpriteVariant): Promise<string | null> {
  const resolved = resolveFusionSprite(pair, back, variant);
  if (!resolved) {
    return Promise.resolve(null);
  }

  if (globalScene.textures.exists(resolved.key)) {
    return Promise.resolve(resolved.key);
  }

  const existing = inFlight.get(resolved.key);
  if (existing) {
    return existing;
  }

  const candidates = describeFusionSpriteCandidates(pair, back, variant);
  const urls = candidates.map(c => c.url);
  const promise = loadOne(resolved.key, urls, pair, back, variant);
  inFlight.set(resolved.key, promise);
  promise.finally(() => inFlight.delete(resolved.key));
  return promise;
}

// Resolves with the texture key on first 200, or null after all 404.
function loadOne(
  key: string,
  urls: string[],
  pair: FusionSpritePair,
  back: boolean,
  variant: FusionSpriteVariant,
): Promise<string | null> {
  return new Promise<string | null>(async resolve => {
    // User-granted IF folder takes precedence over bundled HTTP candidates.
    if (getIfFolderHandle()) {
      const atlasPath = fusionSpriteAtlasPath(pair, back, variant);
      const sourcePref = getFusionSettingValue(FusionSettingKeys.Sprite_Source);
      const artist = "Graphics/CustomBattlers/indexed";
      const autogen = "Graphics/Battlers";
      let subdirs: string[];
      if (variant || sourcePref === "CUSTOM_ONLY") {
        subdirs = [artist];
      } else if (sourcePref === "AUTOGEN_FIRST") {
        subdirs = [autogen, artist];
      } else {
        subdirs = [artist, autogen];
      }
      for (const subdir of subdirs) {
        const path = `${subdir}/${atlasPath}.png`;
        const blobUrl = await getBlobUrlFromIfFolder(path);
        if (!blobUrl) {
          continue;
        }
        const ok = await tryUrl(key, blobUrl);
        // Revoke regardless of outcome — Phaser has already copied the pixels.
        URL.revokeObjectURL(blobUrl);
        if (ok) {
          markPresent(pair, back, variant);
          ensureSingleFrameAnim(key);
          resolve(key);
          return;
        }
        if (globalScene.textures.exists(key)) {
          globalScene.textures.remove(key);
        }
      }
      // File missing in handle — fall through to HTTP (covers dev-symlink setup).
    }
    for (const url of urls) {
      const ok = await tryUrl(key, url);
      if (ok) {
        markPresent(pair, back, variant);
        ensureSingleFrameAnim(key);
        resolve(key);
        return;
      }
      // Phaser may have registered a broken entry on the failed URL; clear it
      // before the next attempt.
      if (globalScene.textures.exists(key)) {
        globalScene.textures.remove(key);
      }
    }

    markMissing(pair, back, variant);
    resolve(null);
  });
}

/**
 * Generate a back sprite by horizontally mirroring the front IF sprite.
 * IF's pack has no back-view sprites; vanilla IF uses the same trick. Call
 * AFTER both front and back loads have settled. No-op when back already
 * exists or front isn't loaded.
 */
export function ensureBackSpriteFromFrontMirror(
  pair: FusionSpritePair,
  variant: FusionSpriteVariant = "",
): string | null {
  const backKey = fusionSpriteKey(pair, true, variant);
  if (globalScene.textures.exists(backKey)) {
    markPresent(pair, true, variant);
    return backKey;
  }
  const frontKey = fusionSpriteKey(pair, false, variant);
  if (!globalScene.textures.exists(frontKey)) {
    return null;
  }
  const tex = globalScene.textures.get(frontKey);
  const frame = tex.frames[tex.firstFrame];
  if (!frame) {
    return null;
  }
  const img = tex.getSourceImage() as HTMLImageElement;
  const canvas = document.createElement("canvas");
  canvas.width = frame.cutWidth;
  canvas.height = frame.cutHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, frame.cutWidth, frame.cutHeight);
  // IF sprites are 96x96 with transparent padding; vanilla atlases are tightly
  // cropped. Without trimming, Phaser's bottom-center origin (0.5, 1.0) lifts
  // the Pokemon off the UI overlay by however many transparent rows sit below
  // the feet. Preserve width and top padding for horizontal centering.
  const trimmed = trimBottomTransparent(canvas);
  globalScene.textures.addCanvas(backKey, trimmed);
  ensureSingleFrameAnim(backKey);
  markPresent(pair, true, variant);
  return backKey;
}

function trimBottomTransparent(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let lastOpaqueRow = -1;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 0) {
        lastOpaqueRow = y;
        break;
      }
    }
    if (lastOpaqueRow >= 0) {
      break;
    }
  }
  if (lastOpaqueRow < 0 || lastOpaqueRow === height - 1) {
    return canvas;
  }
  const newHeight = lastOpaqueRow + 1;
  const out = document.createElement("canvas");
  out.width = width;
  out.height = newHeight;
  const octx = out.getContext("2d");
  if (!octx) {
    return canvas;
  }
  octx.drawImage(canvas, 0, 0, width, newHeight, 0, 0, width, newHeight);
  return out;
}

function tryUrl(key: string, url: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    const loader = globalScene.load;
    const onComplete = (_key: string) => {
      if (_key !== key) {
        return;
      }
      loader.off(Phaser.Loader.Events.FILE_COMPLETE, onComplete);
      loader.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
      resolve(true);
    };
    const onError = (file: Phaser.Loader.File) => {
      if (file.key !== key) {
        return;
      }
      loader.off(Phaser.Loader.Events.FILE_COMPLETE, onComplete);
      loader.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
      resolve(false);
    };
    loader.on(Phaser.Loader.Events.FILE_COMPLETE, onComplete);
    loader.on(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
    loader.image(key, url);
    if (!loader.isLoading()) {
      loader.start();
    }
  });
}

/**
 * Synchronous presence check for render paths that cannot await. Falls back
 * to the default variant when the requested one isn't loaded.
 */
export function hasLoadedFusionSprite(
  pair: FusionSpritePair,
  back = false,
  variant: FusionSpriteVariant = "",
): boolean {
  if (variant) {
    const desc = describeFusionSprite(pair, back, variant);
    if (desc && hasBeenChecked(pair, back, variant) && globalScene.textures.exists(desc.key)) {
      return true;
    }
  }
  const defaultDesc = describeFusionSprite(pair, back, "");
  return !!defaultDesc && hasBeenChecked(pair, back, "") && globalScene.textures.exists(defaultDesc.key);
}

/**
 * Texture key currently available for this pair+variant, with
 * preference→default fallback. Returns null when neither is loaded.
 */
export function loadedFusionSpriteKey(
  pair: FusionSpritePair,
  back = false,
  variant: FusionSpriteVariant = "",
): string | null {
  if (variant) {
    const desc = describeFusionSprite(pair, back, variant);
    if (desc && globalScene.textures.exists(desc.key)) {
      return desc.key;
    }
  }
  const defaultDesc = describeFusionSprite(pair, back, "");
  return defaultDesc && globalScene.textures.exists(defaultDesc.key) ? defaultDesc.key : null;
}
