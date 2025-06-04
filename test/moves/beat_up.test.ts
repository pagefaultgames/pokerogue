import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#app/enums/status-effect";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import GameManager from "#test/testUtils/gameManager";
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
    game.override.battleStyle("single");

    game.override.enemySpecies(SpeciesId.SNORLAX);
    game.override.enemyLevel(100);
    game.override.enemyMoveset([MoveId.SPLASH]);
    game.override.enemyAbility(AbilityId.INSOMNIA);

    game.override.startingLevel(100);
    game.override.moveset([MoveId.BEAT_UP]);
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

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;
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

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.scene.getPlayerParty()[1].trySetStatus(StatusEffect.BURN);

    game.move.select(MoveId.BEAT_UP);

    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(playerPokemon.turnData.hitCount).toBe(5);
  });
});
