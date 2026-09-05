import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Beat Up", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyLevel(100)
      .enemyMoveset([MoveId.SPLASH])
      .enemyAbility(AbilityId.INSOMNIA)
      .startingLevel(100)
      .moveset([MoveId.BEAT_UP]);
  });

  it("should hit once for each healthy player Pokemon", async () => {
    await game.classicMode.startBattle(
      SpeciesId.MAGIKARP,
      SpeciesId.BULBASAUR,
      SpeciesId.CHARMANDER,
      SpeciesId.SQUIRTLE,
      SpeciesId.PIKACHU,
      SpeciesId.EEVEE,
    );

    game.move.select(MoveId.BEAT_UP);
    await game.phaseInterceptor.to("MoveEffectPhase");

    const playerPokemon = game.field.getPlayerPokemon();
    expect(playerPokemon.turnData.hitCount).toBe(6);

    await game.toEndOfTurn();

    const enemy = game.field.getEnemyPokemon();
    expect(enemy).not.toHaveFullHp();
  });

  it("should not count player Pokemon with status effects towards hit count", async () => {
    await game.classicMode.startBattle(
      SpeciesId.MAGIKARP,
      SpeciesId.BULBASAUR,
      SpeciesId.CHARMANDER,
      SpeciesId.SQUIRTLE,
      SpeciesId.PIKACHU,
      SpeciesId.EEVEE,
    );

    const playerPokemon = game.field.getPlayerPokemon();

    game.scene.getPlayerParty()[1].doSetStatus(StatusEffect.BURN);

    game.move.select(MoveId.BEAT_UP);

    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(playerPokemon.turnData.hitCount).toBe(5);
  });
});
