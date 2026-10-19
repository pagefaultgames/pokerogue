/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import "vitest-canvas-mock";

import { BattleScene } from "#app/battle-scene";
import { getGameMode } from "#app/game-mode";
import { globalScene, initGlobalScene } from "#app/global-scene";
import { setSpeciesDataRegistry } from "#app/global-species-data-registry";
import { SpeciesDataRegistry } from "#data/species-data-registry";
import { GameModes } from "#enums/game-modes";

initGlobalScene(new BattleScene());
globalScene.gameMode = getGameMode(GameModes.CLASSIC);
setSpeciesDataRegistry(new SpeciesDataRegistry());
