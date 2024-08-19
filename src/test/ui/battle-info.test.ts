import { ExpGainsSpeed } from "#app/enums/exp-gains-speed.js";
import { Moves } from "#app/enums/moves.js";
import { Species } from "#app/enums/species.js";
import { BattleEndPhase } from "#app/phases/battle-end-phase.js";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getMovePosition } from "../utils/gameManagerUtils";
import { SPLASH_ONLY } from "../utils/testUtils";

describe("UI - Battle Info", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(async () => {
    game = new GameManager(phaserGame);
    game.override.battleType("single").enemyMoveset(SPLASH_ONLY).moveset([Moves.DRAGON_CLAW]);
  });

  it("skip exp animation when exp-gains-speed is SKIP ", async () => {
    await game.classicMode.startBattle([Species.ABRA]);
    game.settings.expGainsSpeed(ExpGainsSpeed.SKIP);

    const abra = game.scene.getPlayerPokemon()!;
    const battleInfo = abra.getBattleInfo();
    vi.spyOn(battleInfo, "updatePokemonExp");

    game.doAttack(getMovePosition(game.scene, 0, Moves.DRAGON_CLAW));
    await game.doKillOpponents();
    await game.phaseInterceptor.to(BattleEndPhase, true);

    expect(battleInfo.updatePokemonExp).toHaveBeenCalledWith(expect.anything(), true, expect.anything());
  });

  it("DO NOT skip exp animation when exp-gains-speed is NOT skip ", async () => {
    await game.classicMode.startBattle([Species.ABRA]);
    game.settings.expGainsSpeed(ExpGainsSpeed.NORMAL);

    const abra = game.scene.getPlayerPokemon()!;
    const battleInfo = abra.getBattleInfo();
    vi.spyOn(battleInfo, "updatePokemonExp");

    game.doAttack(getMovePosition(game.scene, 0, Moves.DRAGON_CLAW));
    await game.doKillOpponents();
    await game.phaseInterceptor.to(BattleEndPhase, true);

    expect(battleInfo.updatePokemonExp).not.toHaveBeenCalledWith(abra, true, expect.anything());
  });
});
