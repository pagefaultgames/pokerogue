import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/data-lists";
import { DamageAnimPhase } from "#app/phases/damage-anim-phase";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";

describe("Moves - Scale Shot", () => {
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
      .moveset([MoveId.SCALE_SHOT])
      .battleStyle("single")
      .disableCrits()
      .ability(AbilityId.NO_GUARD)
      .passiveAbility(AbilityId.SKILL_LINK)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(3);
  });

  it("applies stat changes after last hit", async () => {
    game.override.enemySpecies(SpeciesId.FORRETRESS);

    await game.classicMode.startBattle([SpeciesId.MINCCINO]);
    const minccino = game.scene.getPlayerPokemon()!;
    game.move.select(MoveId.SCALE_SHOT);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to(MoveEffectPhase);
    await game.phaseInterceptor.to(DamageAnimPhase);

    //check that stats haven't changed after one or two hits have occurred
    await game.phaseInterceptor.to(MoveEffectPhase);
    expect(minccino.getStatStage(Stat.DEF)).toBe(0);
    expect(minccino.getStatStage(Stat.SPD)).toBe(0);

    //check that stats changed on last hit
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(minccino.getStatStage(Stat.DEF)).toBe(-1);
    expect(minccino.getStatStage(Stat.SPD)).toBe(1);
  });

  it("unaffected by sheer force", async () => {
    const moveToCheck = allMoves[MoveId.SCALE_SHOT];
    const basePower = moveToCheck.power;

    game.override.enemySpecies(SpeciesId.WOBBUFFET);

    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.classicMode.startBattle([SpeciesId.MINCCINO]);
    const minccino = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.SCALE_SHOT);
    await game.phaseInterceptor.to(TurnEndPhase);

    //effect not nullified by sheer force
    expect(minccino.getStatStage(Stat.DEF)).toBe(-1);
    expect(minccino.getStatStage(Stat.SPD)).toBe(1);

    //power not boosted by sheer force
    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(basePower);
  });
});
