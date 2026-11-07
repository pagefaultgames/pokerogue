/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AssetManager, PhaserAssetStore } from "#app/asset-manager";

export let assetManager: AssetManager;

/** The game {@linkcode assetManager} was created for. */
let assetManagerGame: Phaser.Game | undefined;

/**
 * Create the global {@linkcode AssetManager} for the given game.
 * @param game - The game whose assets to manage
 *
 * @privateRemarks
 * Does nothing if it already exists for that game, so it can be called once per test without losing state.
 */
export function initGlobalAssetManager(game: Phaser.Game): void {
  if (assetManagerGame === game) {
    return;
  }
  assetManagerGame = game;
  assetManager = new AssetManager(new PhaserAssetStore(game));
}
