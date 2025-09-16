import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .moveset([MoveId.LUCKY_CHANT, MoveId.SPLASH, MoveId.FOLLOW_ME])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.INSOMNIA)
      .enemyMoveset(MoveId.TACKLE)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should prevent random critical hits from moves", async () => {
    game.override.criticalHits(true);
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.field.getPlayerPokemon();
    expect(charizard).toBeDefined();
    const critSpy = vi.spyOn(charizard, "getCriticalHitResult"); // called on the defender (ie player)

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(critSpy).toHaveLastReturnedWith(true);
    const firstTurnDamage = charizard.getInverseHp();

    game.move.select(MoveId.LUCKY_CHANT);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(critSpy).toHaveLastReturnedWith(false);
    const secondTurnDamage = charizard.getInverseHp() - firstTurnDamage;
    expect(secondTurnDamage).toBeLessThan(firstTurnDamage);
  });

  it("should prevent guaranteed critical hits from moves", async () => {
    game.override.enemyMoveset(MoveId.FLOWER_TRICK);
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.field.getPlayerPokemon();
    expect(charizard).toBeDefined();

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    const firstTurnDamage = charizard.getInverseHp();

    game.move.select(MoveId.LUCKY_CHANT);
    await game.phaseInterceptor.to("TurnEndPhase");

    const secondTurnDamage = charizard.getInverseHp() - firstTurnDamage;
    expect(secondTurnDamage).toBeLessThan(firstTurnDamage);
  });

  it("should prevent critical hits against the user's ally", async () => {
    game.override.battleStyle("double").criticalHits(true);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const charizard = game.field.getPlayerPokemon();
    expect(charizard).toBeDefined();

    game.move.select(MoveId.FOLLOW_ME, BattlerIndex.PLAYER);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    const firstTurnDamage = charizard.getInverseHp();

    game.move.select(MoveId.FOLLOW_ME, BattlerIndex.PLAYER);
    game.move.select(MoveId.LUCKY_CHANT, BattlerIndex.PLAYER_2);

    await game.phaseInterceptor.to("TurnEndPhase");

    const secondTurnDamage = charizard.getInverseHp() - firstTurnDamage;
    expect(secondTurnDamage).toBeLessThan(firstTurnDamage);
  });

  it("should prevent critical hits from field effects", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.field.getPlayerPokemon();
    const snorlax = game.field.getEnemyPokemon();
    snorlax.addTag(BattlerTagType.ALWAYS_CRIT, 2, MoveId.NONE, 0);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    const firstTurnDamage = charizard.getInverseHp();

    game.move.select(MoveId.LUCKY_CHANT);
    await game.phaseInterceptor.to("TurnEndPhase");

    const secondTurnDamage = charizard.getInverseHp() - firstTurnDamage;
    expect(secondTurnDamage).toBeLessThan(firstTurnDamage);
  });
});
