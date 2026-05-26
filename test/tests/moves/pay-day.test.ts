import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { Command } from "#enums/command";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import type { CommandPhase } from "#phases/command-phase";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Pay Day", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(1);
  });

  it("should award scattered money after winning the battle", async () => {
    await game.classicMode.startBattle(SpeciesId.MEOWTH);

    const startingMoney = game.scene.money;

    game.move.use(MoveId.PAY_DAY);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BattleEndPhase");

    expect(game.scene.money).toBeGreaterThan(startingMoney);
  });

  it("should not award scattered money after running from battle", async () => {
    game.override.enemyLevel(100);

    await game.classicMode.startBattle(SpeciesId.MEOWTH);

    const startingMoney = game.scene.money;

    game.move.use(MoveId.PAY_DAY);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    game.promptHandler.addToNextPrompt("CommandPhase", UiMode.COMMAND, () => {
      (game.scene.phaseManager.getCurrentPhase() as CommandPhase).handleCommand(Command.RUN, 0);
    });

    await game.toNextTurn();

    expect(game.scene.money).toBe(startingMoney);
  }, 60000);
});
