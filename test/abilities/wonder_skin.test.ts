import { allMoves } from "#app/data/moves/move";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
    game.override.battleStyle("single");
    game.override.moveset([Moves.TACKLE, Moves.CHARM]);
    game.override.ability(Abilities.BALL_FETCH);
    game.override.enemySpecies(Species.SHUCKLE);
    game.override.enemyAbility(Abilities.WONDER_SKIN);
    game.override.enemyMoveset(Moves.SPLASH);
  });

  it("lowers accuracy of status moves to 50%", async () => {
    const moveToCheck = allMoves[Moves.CHARM];

    vi.spyOn(moveToCheck, "calculateBattleAccuracy");

    await game.startBattle([Species.PIKACHU]);
    game.move.select(Moves.CHARM);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattleAccuracy).toHaveReturnedWith(50);
  });

  it("does not lower accuracy of non-status moves", async () => {
    const moveToCheck = allMoves[Moves.TACKLE];

    vi.spyOn(moveToCheck, "calculateBattleAccuracy");

    await game.startBattle([Species.PIKACHU]);
    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattleAccuracy).toHaveReturnedWith(100);
  });

  const bypassAbilities = [
    [Abilities.MOLD_BREAKER, "Mold Breaker"],
    [Abilities.TERAVOLT, "Teravolt"],
    [Abilities.TURBOBLAZE, "Turboblaze"],
  ];

  bypassAbilities.forEach(ability => {
    it(`does not affect pokemon with ${ability[1]}`, async () => {
      const moveToCheck = allMoves[Moves.CHARM];

      // @ts-ignore ts doesn't know that ability[0] is an ability and not a string...
      game.override.ability(ability[0]);
      vi.spyOn(moveToCheck, "calculateBattleAccuracy");

      await game.classicMode.startBattle([Species.PIKACHU]);
      game.move.select(Moves.CHARM);
      await game.phaseInterceptor.to(MoveEffectPhase);

      expect(moveToCheck.calculateBattleAccuracy).toHaveReturnedWith(100);
    });
  });
});
