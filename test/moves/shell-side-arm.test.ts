import { BattlerIndex } from "#app/battle";
import { allMoves, ShellSideArmCategoryAttr } from "#app/data/moves/move";
import type Move from "#app/data/moves/move";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Shell Side Arm", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let shellSideArm: Move;
  let shellSideArmAttr: ShellSideArmCategoryAttr;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    shellSideArm = allMoves[Moves.SHELL_SIDE_ARM];
    shellSideArmAttr = shellSideArm.getAttrs(ShellSideArmCategoryAttr)[0];
    game = new GameManager(phaserGame);
    game.override
      .moveset([Moves.SHELL_SIDE_ARM, Moves.SPLASH])
      .battleStyle("single")
      .startingLevel(100)
      .enemyLevel(100)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("becomes a physical attack if forecasted to deal more damage as physical", async () => {
    game.override.enemySpecies(Species.SNORLAX);

    await game.classicMode.startBattle([Species.RAMPARDOS]);

    vi.spyOn(shellSideArmAttr, "apply");

    game.move.select(Moves.SHELL_SIDE_ARM);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(shellSideArmAttr.apply).toHaveLastReturnedWith(true);
  });

  it("remains a special attack if forecasted to deal more damage as special", async () => {
    game.override.enemySpecies(Species.SLOWBRO);

    await game.classicMode.startBattle([Species.XURKITREE]);

    vi.spyOn(shellSideArmAttr, "apply");

    game.move.select(Moves.SHELL_SIDE_ARM);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(shellSideArmAttr.apply).toHaveLastReturnedWith(false);
  });

  it("respects stat stage changes when forecasting base damage", async () => {
    game.override.enemySpecies(Species.SNORLAX).enemyMoveset(Moves.COTTON_GUARD);

    await game.classicMode.startBattle([Species.MANAPHY]);

    vi.spyOn(shellSideArmAttr, "apply");

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    game.move.select(Moves.SHELL_SIDE_ARM);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(shellSideArmAttr.apply).toHaveLastReturnedWith(false);
  });
});
