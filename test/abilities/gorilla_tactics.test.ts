import { BattlerIndex } from "#app/battle";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#app/enums/stat";
import { AbilityId } from "#enums/ability-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Gorilla Tactics", () => {
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
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.SPLASH, MoveId.DISABLE])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyLevel(30)
      .moveset([MoveId.SPLASH, MoveId.TACKLE, MoveId.GROWL])
      .ability(AbilityId.GORILLA_TACTICS);
  });

  it("boosts the Pokémon's Attack by 50%, but limits the Pokémon to using only one move", async () => {
    await game.classicMode.startBattle([SpeciesId.GALAR_DARMANITAN]);

    const darmanitan = game.scene.getPlayerPokemon()!;
    const initialAtkStat = darmanitan.getStat(Stat.ATK);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(darmanitan.getStat(Stat.ATK, false)).toBeCloseTo(initialAtkStat * 1.5);
    // Other moves should be restricted
    expect(darmanitan.isMoveRestricted(MoveId.TACKLE)).toBe(true);
    expect(darmanitan.isMoveRestricted(MoveId.SPLASH)).toBe(false);
  });

  it("should struggle if the only usable move is disabled", async () => {
    await game.classicMode.startBattle([SpeciesId.GALAR_DARMANITAN]);

    const darmanitan = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    // First turn, lock move to Growl
    game.move.select(MoveId.GROWL);
    await game.move.selectEnemyMove(MoveId.SPLASH);

    // Second turn, Growl is interrupted by Disable
    await game.toNextTurn();

    game.move.select(MoveId.GROWL);
    await game.move.selectEnemyMove(MoveId.DISABLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.getStatStage(Stat.ATK)).toBe(-1); // Only the effect of the first Growl should be applied

    // Third turn, Struggle is used
    await game.toNextTurn();

    game.move.select(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(darmanitan.hp).toBeLessThan(darmanitan.getMaxHp());
  });
});
