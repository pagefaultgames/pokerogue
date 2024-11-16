import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/move";
import { Type } from "#enums/type";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";


describe("Abilities - Galvanize", () => {
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
      .battleType("single")
      .startingLevel(100)
      .ability(Abilities.GALVANIZE)
      .moveset([ Moves.TACKLE, Moves.REVELATION_DANCE, Moves.FURY_SWIPES ])
      .enemySpecies(Species.DUSCLOPS)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .enemyLevel(100);
  });

  it("should change Normal-type attacks to Electric type and boost their power", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    vi.spyOn(playerPokemon, "getMoveType");

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemyPokemon, "getMoveEffectiveness");

    const move = allMoves[Moves.TACKLE];
    vi.spyOn(move, "calculateBattlePower");

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(playerPokemon.getMoveType).toHaveLastReturnedWith(Type.ELECTRIC);
    expect(enemyPokemon.getMoveEffectiveness).toHaveReturnedWith(1);
    expect(move.calculateBattlePower).toHaveReturnedWith(48);
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });

  it("should cause Normal-type attacks to activate Volt Absorb", async () => {
    game.override.enemyAbility(Abilities.VOLT_ABSORB);

    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    vi.spyOn(playerPokemon, "getMoveType");

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemyPokemon, "getMoveEffectiveness");

    enemyPokemon.hp = Math.floor(enemyPokemon.getMaxHp() * 0.8);

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(playerPokemon.getMoveType).toHaveLastReturnedWith(Type.ELECTRIC);
    expect(enemyPokemon.getMoveEffectiveness).toHaveReturnedWith(0);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
  });

  it("should not change the type of variable-type moves", async () => {
    game.override.enemySpecies(Species.MIGHTYENA);

    await game.classicMode.startBattle([ Species.ESPEON ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    vi.spyOn(playerPokemon, "getMoveType");

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemyPokemon, "getMoveEffectiveness");

    game.move.select(Moves.REVELATION_DANCE);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(playerPokemon.getMoveType).not.toHaveLastReturnedWith(Type.ELECTRIC);
    expect(enemyPokemon.getMoveEffectiveness).toHaveReturnedWith(0);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
  });

  it("should affect all hits of a Normal-type multi-hit move", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    vi.spyOn(playerPokemon, "getMoveType");

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemyPokemon, "getMoveEffectiveness");

    game.move.select(Moves.FURY_SWIPES);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.move.forceHit();

    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(playerPokemon.turnData.hitCount).toBeGreaterThan(1);
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());

    while (playerPokemon.turnData.hitsLeft > 0) {
      const enemyStartingHp = enemyPokemon.hp;
      await game.phaseInterceptor.to("MoveEffectPhase");

      expect(playerPokemon.getMoveType).toHaveLastReturnedWith(Type.ELECTRIC);
      expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
    }

    expect(enemyPokemon.getMoveEffectiveness).not.toHaveReturnedWith(0);
  });
});
