import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Sparkly Swirl", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyLevel(100)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .moveset([MoveId.SPARKLY_SWIRL, MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH);

    vi.spyOn(allMoves[MoveId.SPARKLY_SWIRL], "accuracy", "get").mockReturnValue(100);
  });

  it("should cure status effect of the user, its ally, and all party pokemon", async () => {
    game.override.battleStyle("double").statusEffect(StatusEffect.BURN);
    await game.classicMode.startBattle([SpeciesId.RATTATA, SpeciesId.RATTATA, SpeciesId.RATTATA]);
    const [leftPlayer, rightPlayer, partyPokemon] = game.scene.getPlayerParty();
    const leftOpp = game.field.getEnemyPokemon();

    vi.spyOn(leftPlayer, "resetStatus");
    vi.spyOn(rightPlayer, "resetStatus");
    vi.spyOn(partyPokemon, "resetStatus");

    game.move.select(MoveId.SPARKLY_SWIRL, 0, leftOpp.getBattlerIndex());
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    expect(leftPlayer.resetStatus).toHaveBeenCalledOnce();
    expect(rightPlayer.resetStatus).toHaveBeenCalledOnce();
    expect(partyPokemon.resetStatus).toHaveBeenCalledOnce();

    expect(leftPlayer.status?.effect).toBeUndefined();
    expect(rightPlayer.status?.effect).toBeUndefined();
    expect(partyPokemon.status?.effect).toBeUndefined();
  });

  it("should not cure status effect of the target/target's allies", async () => {
    game.override.battleStyle("double").enemyStatusEffect(StatusEffect.BURN);
    await game.classicMode.startBattle([SpeciesId.RATTATA, SpeciesId.RATTATA]);
    const [leftOpp, rightOpp] = game.scene.getEnemyField();

    vi.spyOn(leftOpp, "resetStatus");
    vi.spyOn(rightOpp, "resetStatus");

    game.move.select(MoveId.SPARKLY_SWIRL, 0, leftOpp.getBattlerIndex());
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    expect(leftOpp.resetStatus).toHaveBeenCalledTimes(0);
    expect(rightOpp.resetStatus).toHaveBeenCalledTimes(0);

    expect(leftOpp.status?.effect).toBeTruthy();
    expect(rightOpp.status?.effect).toBeTruthy();

    expect(leftOpp.status?.effect).toBe(StatusEffect.BURN);
    expect(rightOpp.status?.effect).toBe(StatusEffect.BURN);
  });
});
