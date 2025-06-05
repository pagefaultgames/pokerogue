import { allMoves } from "#app/data/data-lists";
import { StatusEffect } from "#app/enums/status-effect";
import { TurnStartPhase } from "#app/phases/turn-start-phase";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Weather - Strong Winds", () => {
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
      .startingLevel(10)
      .enemySpecies(SpeciesId.TAILLOW)
      .enemyAbility(AbilityId.DELTA_STREAM)
      .moveset([MoveId.THUNDERBOLT, MoveId.ICE_BEAM, MoveId.ROCK_SLIDE]);
  });

  it("electric type move is not very effective on Rayquaza", async () => {
    game.override.enemySpecies(SpeciesId.RAYQUAZA);

    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.THUNDERBOLT);

    await game.phaseInterceptor.to(TurnStartPhase);
    expect(enemy.getAttackTypeEffectiveness(allMoves[MoveId.THUNDERBOLT].type, pikachu)).toBe(0.5);
  });

  it("electric type move is neutral for flying type pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.THUNDERBOLT);

    await game.phaseInterceptor.to(TurnStartPhase);
    expect(enemy.getAttackTypeEffectiveness(allMoves[MoveId.THUNDERBOLT].type, pikachu)).toBe(1);
  });

  it("ice type move is neutral for flying type pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.ICE_BEAM);

    await game.phaseInterceptor.to(TurnStartPhase);
    expect(enemy.getAttackTypeEffectiveness(allMoves[MoveId.ICE_BEAM].type, pikachu)).toBe(1);
  });

  it("rock type move is neutral for flying type pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    const pikachu = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.ROCK_SLIDE);

    await game.phaseInterceptor.to(TurnStartPhase);
    expect(enemy.getAttackTypeEffectiveness(allMoves[MoveId.ROCK_SLIDE].type, pikachu)).toBe(1);
  });

  it("weather goes away when last trainer pokemon dies to indirect damage", async () => {
    game.override.enemyStatusEffect(StatusEffect.POISON);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemy = game.scene.getEnemyPokemon()!;
    enemy.hp = 1;

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.weather?.weatherType).toBeUndefined();
  });
});
