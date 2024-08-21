import { allAbilities } from "#app/data/ability.js";
import { allMoves } from "#app/data/move.js";
import { MoveEffectPhase } from "#app/phases";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SPLASH_ONLY } from "#test/utils/testUtils";

describe("Abilities - Wonder Skin", () => {
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

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override.battleType("single");
    game.override.moveset([Moves.TACKLE, Moves.CHARM]);
    game.override.ability(Abilities.BALL_FETCH);
    game.override.enemySpecies(Species.SHUCKLE);
    game.override.enemyAbility(Abilities.WONDER_SKIN);
    game.override.enemyMoveset(SPLASH_ONLY);
  });

  it("lowers accuracy of status moves to 50%", async () => {
    const moveToCheck = allMoves[Moves.CHARM];

    vi.spyOn(moveToCheck, "calculateBattleAccuracy");

    await game.startBattle([Species.PIKACHU]);
    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattleAccuracy).toHaveReturnedWith(50);
  });

  it("does not lower accuracy of non-status moves", async () => {
    const moveToCheck = allMoves[Moves.TACKLE];

    vi.spyOn(moveToCheck, "calculateBattleAccuracy");

    await game.startBattle([Species.PIKACHU]);
    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattleAccuracy).toHaveReturnedWith(100);
  });

  const bypassAbilities = [Abilities.MOLD_BREAKER, Abilities.TERAVOLT, Abilities.TURBOBLAZE];

  bypassAbilities.forEach(ability => {
    it(`does not affect pokemon with ${allAbilities[ability].name}`, async () => {
      const moveToCheck = allMoves[Moves.CHARM];

      game.override.ability(ability);
      vi.spyOn(moveToCheck, "calculateBattleAccuracy");

      await game.startBattle([Species.PIKACHU]);
      game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));
      await game.phaseInterceptor.to(MoveEffectPhase);

      expect(moveToCheck.calculateBattleAccuracy).toHaveReturnedWith(100);
    });
  });
});
