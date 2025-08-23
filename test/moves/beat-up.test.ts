import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Beat Up", () => {
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
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyLevel(100)
      .enemyMoveset([MoveId.SPLASH])
      .enemyAbility(AbilityId.INSOMNIA)
      .startingLevel(100)
      .moveset([MoveId.BEAT_UP]);
  });

  it("should hit once for each healthy player Pokemon", async () => {
    await game.classicMode.startBattle([
      SpeciesId.MAGIKARP,
      SpeciesId.BULBASAUR,
      SpeciesId.CHARMANDER,
      SpeciesId.SQUIRTLE,
      SpeciesId.PIKACHU,
      SpeciesId.EEVEE,
    ]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    let enemyStartingHp = enemyPokemon.hp;

    game.move.select(MoveId.BEAT_UP);

    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(playerPokemon.turnData.hitCount).toBe(6);
    expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);

    while (playerPokemon.turnData.hitsLeft > 0) {
      enemyStartingHp = enemyPokemon.hp;
      await game.phaseInterceptor.to(MoveEffectPhase);
      expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
    }
  });

  it("should not count player Pokemon with status effects towards hit count", async () => {
    await game.classicMode.startBattle([
      SpeciesId.MAGIKARP,
      SpeciesId.BULBASAUR,
      SpeciesId.CHARMANDER,
      SpeciesId.SQUIRTLE,
      SpeciesId.PIKACHU,
      SpeciesId.EEVEE,
    ]);

    const playerPokemon = game.field.getPlayerPokemon();

    game.scene.getPlayerParty()[1].doSetStatus(StatusEffect.BURN);

    game.move.select(MoveId.BEAT_UP);

    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(playerPokemon.turnData.hitCount).toBe(5);
  });
});
