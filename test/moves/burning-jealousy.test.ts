import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/moves/move";
import { Abilities } from "#app/enums/abilities";
import { StatusEffect } from "#app/enums/status-effect";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Burning Jealousy", () => {
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
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.ICE_SCALES)
      .enemyMoveset([Moves.HOWL])
      .startingLevel(10)
      .enemyLevel(10)
      .starterSpecies(Species.FEEBAS)
      .ability(Abilities.BALL_FETCH)
      .moveset([Moves.BURNING_JEALOUSY, Moves.GROWL]);
  });

  it("should burn the opponent if their stat stages were raised", async () => {
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.BURNING_JEALOUSY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.status?.effect).toBe(StatusEffect.BURN);
  });

  it("should still burn the opponent if their stat stages were both raised and lowered in the same turn", async () => {
    game.override.starterSpecies(0).battleStyle("double");
    await game.classicMode.startBattle([Species.FEEBAS, Species.ABRA]);

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.BURNING_JEALOUSY);
    game.move.select(Moves.GROWL, 1);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.status?.effect).toBe(StatusEffect.BURN);
  });

  it("should ignore stat stages raised by IMPOSTER", async () => {
    game.override.enemySpecies(Species.DITTO).enemyAbility(Abilities.IMPOSTER).enemyMoveset(Moves.SPLASH);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.BURNING_JEALOUSY);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.status?.effect).toBeUndefined();
  });

  // TODO: Make this test if WP is implemented
  it.todo("should ignore weakness policy", async () => {
    await game.classicMode.startBattle();
  });

  it("should be boosted by Sheer Force even if opponent didn't raise stat stages", async () => {
    game.override.ability(Abilities.SHEER_FORCE).enemyMoveset(Moves.SPLASH);
    vi.spyOn(allMoves[Moves.BURNING_JEALOUSY], "calculateBattlePower");
    await game.classicMode.startBattle();

    game.move.select(Moves.BURNING_JEALOUSY);
    await game.phaseInterceptor.to("BerryPhase");

    expect(allMoves[Moves.BURNING_JEALOUSY].calculateBattlePower).toHaveReturnedWith(
      allMoves[Moves.BURNING_JEALOUSY].power * 1.3,
    );
  });
});
