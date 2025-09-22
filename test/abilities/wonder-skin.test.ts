import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { GameManager } from "#test/test-utils/game-manager";
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
    game.override
      .battleStyle("single")
      .moveset([MoveId.TACKLE, MoveId.CHARM])
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.WONDER_SKIN)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("lowers accuracy of status moves to 50%", async () => {
    const moveToCheck = allMoves[MoveId.CHARM];

    vi.spyOn(moveToCheck, "calculateBattleAccuracy");

    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    game.move.select(MoveId.CHARM);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattleAccuracy).toHaveReturnedWith(50);
  });

  it("does not lower accuracy of non-status moves", async () => {
    const moveToCheck = allMoves[MoveId.TACKLE];

    vi.spyOn(moveToCheck, "calculateBattleAccuracy");

    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattleAccuracy).toHaveReturnedWith(100);
  });

  const bypassAbilities = [
    [AbilityId.MOLD_BREAKER, "Mold Breaker"],
    [AbilityId.TERAVOLT, "Teravolt"],
    [AbilityId.TURBOBLAZE, "Turboblaze"],
  ];

  bypassAbilities.forEach(ability => {
    it(`does not affect pokemon with ${ability[1]}`, async () => {
      const moveToCheck = allMoves[MoveId.CHARM];

      // @ts-expect-error ts doesn't know that ability[0] is an ability and not a string...
      game.override.ability(ability[0]);
      vi.spyOn(moveToCheck, "calculateBattleAccuracy");

      await game.classicMode.startBattle([SpeciesId.PIKACHU]);
      game.move.select(MoveId.CHARM);
      await game.phaseInterceptor.to(MoveEffectPhase);

      expect(moveToCheck.calculateBattleAccuracy).toHaveReturnedWith(100);
    });
  });
});
