/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Builders for {@linkcode AssetRequest}s.
 * These hold the path logic for every kind of asset, so the scene helpers and the asset manager load from the same URLs.
 * @module
 */

import { timedEventManager } from "#app/global-event-manager";
import { settings } from "#app/global-settings-manager";
import { hasExpSprite } from "#sprites/sprite-utils";
import type {
  AnimSpec,
  AssetRequest,
  AtlasAssetRequest,
  AudioAssetRequest,
  ImageAssetRequest,
  SpritesheetAssetRequest,
} from "#types/asset-set";
import { coerceArray } from "#utils/array";
import { getCachedUrl } from "#utils/fetch-utils";

/** The animation every Pokémon sprite atlas gets. */
export const POKEMON_SPRITE_ANIM: AnimSpec = { end: 400, frameRate: 10, repeat: -1 };

/** The animation every trainer sprite atlas gets. */
export const TRAINER_SPRITE_ANIM: AnimSpec = { end: 128, frameRate: 24, repeat: -1 };

/**
 * Build the requests for a single image, plus its legacy version for UI images.
 * @param key - The texture key
 * @param folder - The folder under `images/`
 * @param filename - (Default `<key>.png`) Name of the image file
 * @returns The asset requests needed for the image.
 */
export function imageAsset(key: string, folder: string, filename = `${key}.png`): ImageAssetRequest[] {
  const eventReplacment = timedEventManager.getEventImageReplacement(key);
  if (eventReplacment) {
    folder = "events";
    filename = `${eventReplacment}.png`;
  }
  const requests: ImageAssetRequest[] = [{ kind: "image", key, url: getCachedUrl(`images/${folder}/${filename}`) }];
  if (folder.startsWith("ui")) {
    folder = folder.replace("ui", "ui/legacy");
    requests.push({ kind: "image", key: `${key}_legacy`, url: getCachedUrl(`images/${folder}/${filename}`) });
  }
  return requests;
}

/**
 * Build the requests for a spritesheet of square frames, plus its legacy version for UI spritesheets.
 * @param key - The texture key
 * @param folder - The folder under `images/`
 * @param size - The width and height of each frame
 * @param filename - (Default `<key>.png`) Name of the spritesheet file
 * @returns The asset requests needed for the spritesheet.
 *
 */
export function spritesheetAsset(
  key: string,
  folder: string,
  size: number,
  filename = `${key}.png`,
): SpritesheetAssetRequest[] {
  const requests: SpritesheetAssetRequest[] = [
    {
      kind: "spritesheet",
      key,
      url: getCachedUrl(`images/${folder}/${filename}`),
      frameWidth: size,
      frameHeight: size,
    },
  ];
  if (folder.startsWith("ui")) {
    folder = folder.replace("ui", "ui/legacy");
    requests.push({
      kind: "spritesheet",
      key: `${key}_legacy`,
      url: getCachedUrl(`images/${folder}/${filename}`),
      frameWidth: size,
      frameHeight: size,
    });
  }
  return requests;
}

/**
 * Build the requests for a texture atlas, plus its legacy version for UI atlases.
 * @param key - The texture key
 * @param folder - The folder under `images/`; may be empty
 * @param filenameRoot - (Default `key`) The file name without extension
 * @param anim - If set, the animation to create from the atlas once it loads
 * @returns The asset requests needed for the atlas.
 */
export function atlasAsset(key: string, folder: string, filenameRoot = key, anim?: AnimSpec): AtlasAssetRequest[] {
  if (folder) {
    folder += "/";
  }
  const eventReplacment = timedEventManager.getEventImageReplacement(key);
  if (eventReplacment) {
    folder = "events/";
    filenameRoot = `${eventReplacment}`;
  }
  const requests: AtlasAssetRequest[] = [
    {
      kind: "atlas",
      key,
      textureUrl: getCachedUrl(`images/${folder}${filenameRoot}.png`),
      atlasUrl: getCachedUrl(`images/${folder}${filenameRoot}.json`),
      anim,
    },
  ];
  if (folder.startsWith("ui")) {
    folder = folder.replace("ui", "ui/legacy");
    requests.push({
      kind: "atlas",
      key: `${key}_legacy`,
      textureUrl: getCachedUrl(`images/${folder}${filenameRoot}.png`),
      atlasUrl: getCachedUrl(`images/${folder}${filenameRoot}.json`),
    });
  }
  return requests;
}

/**
 * Build the request for a Pokémon sprite atlas, choosing the variant and experimental sprite folders as needed.
 * @param key - The texture key
 * @param atlasPath - The atlas path under `images/pokemon/`, without extension
 * @param experimental - (Default from settings) Whether to use the experimental sprite, if one exists
 * @param anim - (Default {@linkcode POKEMON_SPRITE_ANIM}) The animation to create from the atlas once it loads,
 * or `null` for none
 * @returns The asset request needed for the Pokémon sprite atlas.
 */
export function pokemonAtlasAsset(
  key: string,
  atlasPath: string,
  experimental = settings.expSpritesEnabled,
  anim: AnimSpec | null = POKEMON_SPRITE_ANIM,
): AtlasAssetRequest {
  const variant = atlasPath.includes("variant/") || /_[0-3]$/.test(atlasPath);
  if (experimental) {
    experimental = hasExpSprite(key);
  }
  if (variant) {
    atlasPath = atlasPath.replace("variant/", "");
  }
  const root = `images/pokemon/${variant ? "variant/" : ""}${experimental ? "exp/" : ""}${atlasPath}`;
  return { kind: "atlas", key, textureUrl: `${root}.png`, atlasUrl: `${root}.json`, anim: anim ?? undefined };
}

/**
 * Build the requests for a sound effect.
 * @param key - The key within the folder; the audio key is `<folder>/<key>`
 * @param folder - (Default `"se"`) The folder under `audio/`
 * @param filenames - (Default `<key>.wav`) The file name(s)
 * @returns The asset requests needed for the sound effect.
 */
export function seAsset(key: string, folder = "se", filenames: string | string[] = `${key}.wav`): AudioAssetRequest[] {
  folder += "/";
  // TODO: Use actual path joining logic
  return coerceArray(filenames).map(f => ({
    kind: "audio",
    key: folder + key,
    url: getCachedUrl(`audio/${folder}${f}`),
  }));
}

/**
 * Build the request for a Pokémon cry.
 * @param key - The cry's audio key, e.g. `cry/25`
 * @returns The asset request needed for the Pokémon cry.
 */
export function cryAsset(key: string): AudioAssetRequest {
  return { kind: "audio", key, url: `audio/${key}.m4a` };
}

/**
 * Queue a request on a scene's loader. Does not start the loader.
 * @param loader - The loader to queue the request on
 * @param request - The request to queue
 */
export function queueAssetRequest(loader: Phaser.Loader.LoaderPlugin, request: AssetRequest): void {
  switch (request.kind) {
    case "image":
      loader.image(request.key, request.url);
      break;
    case "atlas":
      loader.atlas(request.key, request.textureUrl, request.atlasUrl);
      break;
    case "spritesheet":
      loader.spritesheet(request.key, request.url, {
        frameWidth: request.frameWidth,
        frameHeight: request.frameHeight,
      });
      break;
    case "audio":
      loader.audio(request.key, request.url);
      break;
    default:
      request satisfies never;
  }
}
