import { HitResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .moveset([Moves.THUNDER, Moves.BULLET_SEED, Moves.SHEER_COLD])
      .ability(Abilities.SKILL_LINK)
      .startingLevel(100)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.NO_GUARD)
      .enemyMoveset(Moves.ENDURE);
  });

  it("should let the pokemon survive with 1 HP from attacks", async () => {
    await game.classicMode.startBattle([Species.ARCEUS]);

    game.move.select(Moves.THUNDER);
    await game.phaseInterceptor.to("BerryPhase");

    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy.hp).toBe(1);
  });

  it("should let the pokemon survive with 1 HP from multi-strike moves", async () => {
    await game.classicMode.startBattle([Species.ARCEUS]);

    game.move.select(Moves.BULLET_SEED);
    await game.phaseInterceptor.to("BerryPhase");

    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy.hp).toBe(1);
  });

  it("should let the pokemon survive against OHKO moves", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.SHEER_COLD);
    await game.phaseInterceptor.to("TurnEndPhase");

    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy.hp).toBe(1);
  });

  // comprehensive indirect damage test copied from Reviver Seed test
  it.each([
    { moveType: "Damaging Move Chip", move: Moves.SALT_CURE },
    { moveType: "Status Move Chip", move: Moves.LEECH_SEED },
    { moveType: "Partial Trapping move", move: Moves.WHIRLPOOL },
    { moveType: "Status Effect", move: Moves.TOXIC },
    { moveType: "Weather", move: Moves.SANDSTORM },
  ])("should not prevent fainting from $moveType Damage", async ({ move }) => {
    game.override.moveset(move).enemyLevel(100);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);

    const enemy = game.scene.getEnemyPokemon()!;
    enemy.hp = 2;
    // force attack to do 1 dmg (for salt cure)
    vi.spyOn(enemy, "getAttackDamage").mockReturnValue({ cancelled: false, result: HitResult.EFFECTIVE, damage: 1 });

    game.move.select(move);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.isFainted()).toBe(true);
  });
});
