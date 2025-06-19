import { allAbilities } from "#app/data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";

describe("Abilities - Arena Trap", () => {
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
      .moveset(MoveId.SPLASH)
      .ability(AbilityId.ARENA_TRAP)
      .enemySpecies(SpeciesId.RALTS)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.TELEPORT);
  });

  // TODO: Enable test when Issue #935 is addressed
  it.todo("should not allow grounded Pokémon to flee", async () => {
    game.override.battleStyle("single");

    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon();

    game.move.select(MoveId.SPLASH);

    await game.toNextTurn();

    expect(enemy).toBe(game.scene.getEnemyPokemon());
  });

  it("should guarantee double battle with any one LURE", async () => {
    game.override.startingModifier([{ name: "LURE" }]).startingWave(2);

    await game.classicMode.startBattle();

    expect(game.scene.getEnemyField().length).toBe(2);
  });

  /**
   * This checks if the Player Pokemon is able to switch out/run away after the Enemy Pokemon with {@linkcode AbilityId.ARENA_TRAP}
   * is forcefully moved out of the field from moves such as Roar {@linkcode MoveId.ROAR}
   *
   * Note: It should be able to switch out/run away
   */
  it("should lift if pokemon with this ability leaves the field", async () => {
    game.override
      .battleStyle("double")
      .enemyMoveset(MoveId.SPLASH)
      .moveset([MoveId.ROAR, MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.SUDOWOODO, SpeciesId.LUNATONE]);

    const [enemy1, enemy2] = game.scene.getEnemyField();
    const [player1, player2] = game.scene.getPlayerField();

    vi.spyOn(enemy1, "getAbility").mockReturnValue(allAbilities[AbilityId.ARENA_TRAP]);

    game.move.select(MoveId.ROAR);
    game.move.select(MoveId.SPLASH, 1);

    // This runs the fist command phase where the moves are selected
    await game.toNextTurn();
    // During the next command phase the player pokemons should not be trapped anymore
    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    expect(player1.isTrapped()).toBe(false);
    expect(player2.isTrapped()).toBe(false);
    expect(enemy1.isOnField()).toBe(false);
    expect(enemy2.isOnField()).toBe(true);
  });
});
