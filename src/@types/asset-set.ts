/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * How to build the looping animation that goes with an atlas, once the atlas has loaded.
 * Frames are named `0001.png` to `<end>.png`; missing frames are skipped.
 */
export interface AnimSpec {
  /** The last frame number to look for */
  end: number;
  frameRate: number;
  /** Number of times to repeat; `-1` loops forever */
  repeat: number;
}

/** A single image file, loaded as a texture. */
export interface ImageAssetRequest {
  kind: "image";
  key: string;
  url: string;
}

/** A texture atlas (image + JSON frame data), optionally with an animation created from its frames. */
export interface AtlasAssetRequest {
  kind: "atlas";
  key: string;
  textureUrl: string;
  atlasUrl: string;
  /** If set, an animation with the same key as the atlas is created after it loads, and removed along with it. */
  anim?: AnimSpec | undefined;
}

/** An image split into equally sized frames, loaded as a texture. */
export interface SpritesheetAssetRequest {
  kind: "spritesheet";
  key: string;
  url: string;
  frameWidth: number;
  frameHeight: number;
}

/** An audio file, stored in the audio cache. */
export interface AudioAssetRequest {
  kind: "audio";
  key: string;
  url: string;
}

/**
 * Everything needed to load one asset, and to identify it when deciding whether it is still needed.
 */
export type AssetRequest = ImageAssetRequest | AtlasAssetRequest | SpritesheetAssetRequest | AudioAssetRequest;

/**
 * Identifies an asset without saying how to load it.
 * Every {@linkcode AssetRequest} is also an `AssetRef`.
 */
export interface AssetRef {
  kind: AssetRequest["kind"];
  key: string;
}
