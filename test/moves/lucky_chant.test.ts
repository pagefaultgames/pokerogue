import { Abilities } from "#app/enums/abilities";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import GameManager from "#test/testUtils/gameManager";
import { BattlerIndex } from "#app/battle";

describe("Moves - Lucky Chant", () => {
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
      .moveset([Moves.LUCKY_CHANT, Moves.SPLASH, Moves.FOLLOW_ME])
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.INSOMNIA)
      .enemyMoveset(Moves.TACKLE)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should prevent random critical hits from moves", async () => {
    game.override.criticalHits(true);
    await game.classicMode.startBattle([Species.CHARIZARD]);

    const charizard = game.scene.getPlayerPokemon()!;
    expect(charizard).toBeDefined();
    const critSpy = vi.spyOn(charizard, "getCriticalHitResult"); // called on the defender (ie player)

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(critSpy).toHaveLastReturnedWith(true);
    const firstTurnDamage = charizard.turnData.damageTaken;

    game.move.select(Moves.LUCKY_CHANT);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(critSpy).toHaveLastReturnedWith(false);
    const secondTurnDamage = charizard.turnData.damageTaken;
    expect(secondTurnDamage).toBeLessThan(firstTurnDamage);
  });

  it("should prevent guaranteed critical hits from moves", async () => {
    game.override.enemyMoveset(Moves.FLOWER_TRICK);
    await game.classicMode.startBattle([Species.CHARIZARD]);

    const charizard = game.scene.getPlayerPokemon()!;
    expect(charizard).toBeDefined();

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    const firstTurnDamage = charizard.getInverseHp();

    game.move.select(Moves.LUCKY_CHANT);
    await game.phaseInterceptor.to("TurnEndPhase");

    const secondTurnDamage = charizard.getInverseHp() - firstTurnDamage;
    expect(secondTurnDamage).toBeLessThan(firstTurnDamage);
  });

  it("should prevent critical hits against the user's ally", async () => {
    game.override.battleStyle("double").criticalHits(true);

    await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

    const charizard = game.scene.getPlayerPokemon()!;
    expect(charizard).toBeDefined();

    game.move.select(Moves.FOLLOW_ME, BattlerIndex.PLAYER);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    const firstTurnDamage = charizard.turnData.damageTaken;

    game.move.select(Moves.FOLLOW_ME, BattlerIndex.PLAYER);
    game.move.select(Moves.LUCKY_CHANT, BattlerIndex.PLAYER_2);

    await game.phaseInterceptor.to("TurnEndPhase");

    const secondTurnDamage = charizard.turnData.damageTaken;
    expect(secondTurnDamage).toBeLessThan(firstTurnDamage);
  });

  it("should prevent critical hits from field effects", async () => {
    await game.classicMode.startBattle([Species.CHARIZARD]);

    const charizard = game.scene.getPlayerPokemon()!;
    expect(charizard).toBeDefined();

    const snorlax = game.scene.getEnemyPokemon()!;
    snorlax.addTag(BattlerTagType.ALWAYS_CRIT, 2, Moves.NONE, 0);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    const firstTurnDamage = charizard.turnData.damageTaken;

    game.move.select(Moves.LUCKY_CHANT);
    await game.phaseInterceptor.to("TurnEndPhase");

    const secondTurnDamage = charizard.turnData.damageTaken;
    expect(secondTurnDamage).toBeLessThan(firstTurnDamage);
  });
});
