/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { GameManager } from "#test/test-utils/game-manager";
import { randSeedUniqueItem } from "#utils/random";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Utils - Random", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  describe("randSeedUniqueItem", () => {
    // TODO: Remove `initialization of game` once `randSeedUniqueItem` stops using `executeWithSeedOffset`
    beforeAll(() => {
      phaserGame = new Phaser.Game({
        type: Phaser.HEADLESS,
      });
    });

    afterEach(() => {
      game.phaseInterceptor.restoreOg();
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);
    });

    it("should prevent duplicates when provided with different offsets", async () => {
      const choices = ["a", "b", "c", "d"];
      const choice1 = randSeedUniqueItem(choices, 0);
      const choice2 = randSeedUniqueItem(choices, 1);
      const choice3 = randSeedUniqueItem(choices, 2);
      expect(choice2).not.toEqual(choice1);
      expect(choice2).not.toEqual(choice3);
      expect(choice1).not.toEqual(choice3);
    });

    it("should gracefully handle an offset larger than the choices", () => {
      const choices = ["a", "b", "c"];
      // 1) the function must not throw
      // 2) The output must be one of the choices
      const choice = randSeedUniqueItem(choices, 5);
      expect(choices).toContain(choice);
    });
  });
});
