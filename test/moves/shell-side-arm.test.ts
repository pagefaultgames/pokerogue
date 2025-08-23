import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { Move, ShellSideArmCategoryAttr } from "#moves/move";
import { GameManager } from "#test/test-utils/game-manager";
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
    shellSideArm = allMoves[MoveId.SHELL_SIDE_ARM];
    shellSideArmAttr = shellSideArm.getAttrs("ShellSideArmCategoryAttr")[0];
    game = new GameManager(phaserGame);
    game.override
      .moveset([MoveId.SHELL_SIDE_ARM, MoveId.SPLASH])
      .battleStyle("single")
      .startingLevel(100)
      .enemyLevel(100)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("becomes a physical attack if forecasted to deal more damage as physical", async () => {
    game.override.enemySpecies(SpeciesId.SNORLAX);

    await game.classicMode.startBattle([SpeciesId.RAMPARDOS]);

    vi.spyOn(shellSideArmAttr, "apply");

    game.move.select(MoveId.SHELL_SIDE_ARM);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(shellSideArmAttr.apply).toHaveLastReturnedWith(true);
  });

  it("remains a special attack if forecasted to deal more damage as special", async () => {
    game.override.enemySpecies(SpeciesId.SLOWBRO);

    await game.classicMode.startBattle([SpeciesId.XURKITREE]);

    vi.spyOn(shellSideArmAttr, "apply");

    game.move.select(MoveId.SHELL_SIDE_ARM);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(shellSideArmAttr.apply).toHaveLastReturnedWith(false);
  });

  it("respects stat stage changes when forecasting base damage", async () => {
    game.override.enemySpecies(SpeciesId.SNORLAX).enemyMoveset(MoveId.COTTON_GUARD);

    await game.classicMode.startBattle([SpeciesId.MANAPHY]);

    vi.spyOn(shellSideArmAttr, "apply");

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    game.move.select(MoveId.SHELL_SIDE_ARM);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(shellSideArmAttr.apply).toHaveLastReturnedWith(false);
  });
});
