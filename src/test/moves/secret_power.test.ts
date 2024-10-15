import { Abilities } from "#enums/abilities";
import { Biome } from "#app/enums/biome";
import { Moves } from "#enums/moves";
import { Stat } from "#enums/stat";
import { allMoves, SecretPowerAttr } from "#app/data/move";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { StatusEffect } from "#app/enums/status-effect";
import { BattlerIndex } from "#app/battle";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import { ArenaTagSide } from "#app/data/arena-tag";

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
      .enemyAbility(Abilities.BALL_FETCH);
  });

  it("Secret Power checks for an active terrain first then looks at the biome for its secondary effect", async () => {
    game.override
      .startingBiome(Biome.VOLCANO)
      .enemyMoveset([ Moves.SPLASH, Moves.MISTY_TERRAIN ]);
    vi.spyOn(allMoves[Moves.SECRET_POWER], "chance", "get").mockReturnValue(100);
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    const enemyPokemon  = game.scene.getEnemyPokemon()!;

    // No Terrain + Biome.VOLCANO --> Burn
    game.move.select(Moves.SECRET_POWER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyPokemon.status?.effect).toBe(StatusEffect.BURN);

    // Misty Terrain --> SpAtk -1
    game.move.select(Moves.SECRET_POWER);
    await game.forceEnemyMove(Moves.MISTY_TERRAIN);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(-1);
  });

  it("the 'rainbow' effect of fire+water pledge does not double the chance of secret power's secondary effect",
    async () => {
      game.override
        .moveset([ Moves.FIRE_PLEDGE, Moves.WATER_PLEDGE, Moves.SECRET_POWER, Moves.SPLASH ])
        .enemyMoveset([ Moves.SPLASH ])
        .battleType("double");
      await game.classicMode.startBattle([ Species.BLASTOISE, Species.CHARIZARD ]);

      const secretPowerAttr = allMoves[Moves.SECRET_POWER].getAttrs(SecretPowerAttr)[0];
      vi.spyOn(secretPowerAttr, "getMoveChance");

      game.move.select(Moves.WATER_PLEDGE, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.FIRE_PLEDGE, 1, BattlerIndex.ENEMY_2);

      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.scene.arena.getTagOnSide(ArenaTagType.WATER_FIRE_PLEDGE, ArenaTagSide.PLAYER)).toBeDefined();

      game.move.select(Moves.SECRET_POWER, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(secretPowerAttr.getMoveChance).toHaveLastReturnedWith(30);
    }
  );
});
