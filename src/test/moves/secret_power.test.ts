import { Abilities } from "#enums/abilities";
import { Biome } from "#app/enums/biome";
import { Moves } from "#enums/moves";
import { Stat } from "#enums/stat";
import { allMoves } from "#app/data/move";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { StatusEffect } from "#app/enums/status-effect";

describe("Moves - Secret Power", () => {
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
      .moveset([ Moves.SECRET_POWER ])
      .ability(Abilities.BALL_FETCH)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyLevel(60)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([ Moves.SPLASH, Moves.MISTY_TERRAIN ]);
    vi.spyOn(allMoves[Moves.SECRET_POWER], "chance", "get").mockReturnValue(100);
  });

  it("Secret Power checks for an active terrain first then looks at the biome for its secondary effect", async () => {
    game.override.startingBiome(Biome.METROPOLIS);
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    const enemyPokemon  = game.scene.getEnemyPokemon()!;

    // No Terrain + Biome.METROPOLIS --> Paralysis
    game.move.select(Moves.SECRET_POWER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyPokemon.status?.effect).toBe(StatusEffect.PARALYSIS);

    // Misty Terrain --> SpAtk -1
    game.move.select(Moves.SECRET_POWER);
    await game.forceEnemyMove(Moves.MISTY_TERRAIN);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(-1);
  });
});
