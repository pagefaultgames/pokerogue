import { AbilityId } from "#enums/ability-id";
import { HitResult } from "#enums/hit-result";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
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
      .moveset([MoveId.THUNDER, MoveId.BULLET_SEED, MoveId.SHEER_COLD])
      .ability(AbilityId.SKILL_LINK)
      .startingLevel(100)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.NO_GUARD)
      .enemyMoveset(MoveId.ENDURE);
  });

  it("should let the pokemon survive with 1 HP from attacks", async () => {
    await game.classicMode.startBattle([SpeciesId.ARCEUS]);

    game.move.select(MoveId.THUNDER);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getEnemyPokemon().hp).toBe(1);
  });

  it("should let the pokemon survive with 1 HP from multi-strike moves", async () => {
    await game.classicMode.startBattle([SpeciesId.ARCEUS]);

    game.move.select(MoveId.BULLET_SEED);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getEnemyPokemon().hp).toBe(1);
  });

  it("should let the pokemon survive against OHKO moves", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.SHEER_COLD);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.hp).toBe(1);
  });

  // comprehensive indirect damage test copied from Reviver Seed test
  it.each([
    { moveType: "Damaging Move Chip", move: MoveId.SALT_CURE },
    { moveType: "Status Move Chip", move: MoveId.LEECH_SEED },
    { moveType: "Partial Trapping move", move: MoveId.WHIRLPOOL },
    { moveType: "Status Effect", move: MoveId.TOXIC },
    { moveType: "Weather", move: MoveId.SANDSTORM },
  ])("should not prevent fainting from $moveType Damage", async ({ move }) => {
    game.override.moveset(move).enemyLevel(100);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);
    const enemy = game.field.getEnemyPokemon();
    enemy.hp = 2;
    // force attack to do 1 dmg (for salt cure)
    vi.spyOn(enemy, "getAttackDamage").mockReturnValue({ cancelled: false, result: HitResult.EFFECTIVE, damage: 1 });

    game.move.select(move);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.isFainted()).toBe(true);
  });
});
