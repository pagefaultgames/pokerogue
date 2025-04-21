import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
      .moveset([Moves.THUNDER, Moves.BULLET_SEED, Moves.TOXIC, Moves.SHEER_COLD])
      .ability(Abilities.SKILL_LINK)
      .startingLevel(100)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.NO_GUARD)
      .enemyMoveset(Moves.ENDURE);
  });

  it("should let the pokemon survive with 1 HP", async () => {
    await game.classicMode.startBattle([Species.ARCEUS]);

    game.move.select(Moves.THUNDER);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()!.hp).toBe(1);
  });

  it("should let the pokemon survive with 1 HP when hit with a multihit move", async () => {
    await game.classicMode.startBattle([Species.ARCEUS]);

    game.move.select(Moves.BULLET_SEED);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()!.hp).toBe(1);
  });

  it("should let the pokemon survive against OHKO moves", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);
    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.SHEER_COLD);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.isFainted()).toBeFalsy();
  });

  // comprehensive indirect damage test copied from Reviver Seed test
  it.each([
    { moveType: "Damaging Move Chip Damage", move: Moves.SALT_CURE },
    { moveType: "Chip Damage", move: Moves.LEECH_SEED },
    { moveType: "Trapping Chip Damage", move: Moves.WHIRLPOOL },
    { moveType: "Status Effect Damage", move: Moves.TOXIC },
    { moveType: "Weather", move: Moves.SANDSTORM },
  ])("should not prevent fainting from $moveType", async ({ move }) => {
    game.override
      .enemyLevel(1)
      .startingLevel(100)
      .enemySpecies(Species.MAGIKARP)
      .moveset(move)
      .enemyMoveset(Moves.ENDURE);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.damageAndUpdate(enemy.hp - 1);

    game.move.select(move);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.isFainted()).toBeTruthy();
  });
});
