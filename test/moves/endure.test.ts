import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Endure", () => {
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
      .moveset([Moves.THUNDER, Moves.BULLET_SEED, Moves.TOXIC])
      .ability(Abilities.SKILL_LINK)
      .startingLevel(100)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.NO_GUARD)
      .enemyMoveset(Moves.ENDURE);
  });

  it("should let the pokemon survive with 1 HP", async () => {
    await game.classicMode.startBattle([Species.ARCEUS]);

    game.move.select(Moves.THUNDER);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()!.hp).toBe(1);
  });

  it("should let the pokemon survive with 1 HP when hit with a multihit move", async () => {
    await game.classicMode.startBattle([Species.ARCEUS]);

    game.move.select(Moves.BULLET_SEED);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()!.hp).toBe(1);
  });

  it("shouldn't prevent fainting from indirect damage", async () => {
    game.override.enemyLevel(100);
    await game.classicMode.startBattle([Species.ARCEUS]);

    const enemy = game.scene.getEnemyPokemon()!;
    enemy.hp = 2;

    game.move.select(Moves.TOXIC);
    await game.phaseInterceptor.to("VictoryPhase");

    expect(enemy.isFainted()).toBe(true);
  });
});
