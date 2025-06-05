import { allMoves } from "#app/data/data-lists";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
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
    game.override.moveset([MoveId.TACKLE, MoveId.CHARM]);
    game.override.ability(AbilityId.BALL_FETCH);
    game.override.enemySpecies(SpeciesId.SHUCKLE);
    game.override.enemyAbility(AbilityId.WONDER_SKIN);
    game.override.enemyMoveset(MoveId.SPLASH);
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

      // @ts-ignore ts doesn't know that ability[0] is an ability and not a string...
      game.override.ability(ability[0]);
      vi.spyOn(moveToCheck, "calculateBattleAccuracy");

      await game.classicMode.startBattle([SpeciesId.PIKACHU]);
      game.move.select(MoveId.CHARM);
      await game.phaseInterceptor.to(MoveEffectPhase);

      expect(moveToCheck.calculateBattleAccuracy).toHaveReturnedWith(100);
    });
  });
});
