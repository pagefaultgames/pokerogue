import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/moves/move";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import type { PokemonInstantReviveModifier } from "#app/modifier/modifier";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Reviver Seed", () => {
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
      .moveset([Moves.SPLASH, Moves.TACKLE, Moves.ENDURE])
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .startingHeldItems([{ name: "REVIVER_SEED" }])
      .enemyHeldItems([{ name: "REVIVER_SEED" }])
      .enemyMoveset(Moves.SPLASH);
    vi.spyOn(allMoves[Moves.SHEER_COLD], "accuracy", "get").mockReturnValue(100);
    vi.spyOn(allMoves[Moves.LEECH_SEED], "accuracy", "get").mockReturnValue(100);
    vi.spyOn(allMoves[Moves.WHIRLPOOL], "accuracy", "get").mockReturnValue(100);
    vi.spyOn(allMoves[Moves.WILL_O_WISP], "accuracy", "get").mockReturnValue(100);
  });

  it.each([
    { moveType: "Special Move", move: Moves.WATER_GUN },
    { moveType: "Physical Move", move: Moves.TACKLE },
    { moveType: "Fixed Damage Move", move: Moves.SEISMIC_TOSS },
    { moveType: "Final Gambit", move: Moves.FINAL_GAMBIT },
    { moveType: "Counter", move: Moves.COUNTER },
    { moveType: "OHKO", move: Moves.SHEER_COLD },
  ])("should activate the holder's reviver seed from a $moveType", async ({ move }) => {
    game.override.enemyLevel(100).startingLevel(1).enemyMoveset(move);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);
    const player = game.scene.getPlayerPokemon()!;
    player.damageAndUpdate(player.hp - 1);

    const reviverSeed = player.getHeldItems()[0] as PokemonInstantReviveModifier;
    vi.spyOn(reviverSeed, "apply");

    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(player.isFainted()).toBeFalsy();
  });

  it("should activate the holder's reviver seed from confusion self-hit", async () => {
    game.override.enemyLevel(1).startingLevel(100).enemyMoveset(Moves.SPLASH);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);
    const player = game.scene.getPlayerPokemon()!;
    player.damageAndUpdate(player.hp - 1);
    player.addTag(BattlerTagType.CONFUSED, 3);

    const reviverSeed = player.getHeldItems()[0] as PokemonInstantReviveModifier;
    vi.spyOn(reviverSeed, "apply");

    vi.spyOn(player, "randSeedInt").mockReturnValue(0); // Force confusion self-hit
    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(player.isFainted()).toBeFalsy();
  });

  // Damaging opponents tests
  it.each([
    { moveType: "Damaging Move Chip Damage", move: Moves.SALT_CURE },
    { moveType: "Chip Damage", move: Moves.LEECH_SEED },
    { moveType: "Trapping Chip Damage", move: Moves.WHIRLPOOL },
    { moveType: "Status Effect Damage", move: Moves.WILL_O_WISP },
    { moveType: "Weather", move: Moves.SANDSTORM },
  ])("should not activate the holder's reviver seed from $moveType", async ({ move }) => {
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

  // Self-damage tests
  it.each([
    { moveType: "Recoil", move: Moves.DOUBLE_EDGE },
    { moveType: "Self-KO", move: Moves.EXPLOSION },
    { moveType: "Self-Deduction", move: Moves.CURSE },
    { moveType: "Liquid Ooze", move: Moves.GIGA_DRAIN },
  ])("should not activate the holder's reviver seed from $moveType", async ({ move }) => {
    game.override
      .enemyLevel(100)
      .startingLevel(1)
      .enemySpecies(Species.MAGIKARP)
      .moveset(move)
      .enemyAbility(Abilities.LIQUID_OOZE)
      .enemyMoveset(Moves.SPLASH);
    await game.classicMode.startBattle([Species.GASTLY, Species.FEEBAS]);
    const player = game.scene.getPlayerPokemon()!;
    player.damageAndUpdate(player.hp - 1);

    const playerSeed = player.getHeldItems()[0] as PokemonInstantReviveModifier;
    vi.spyOn(playerSeed, "apply");

    game.move.select(move);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.isFainted()).toBeTruthy();
  });

  it("should not activate the holder's reviver seed from Destiny Bond fainting", async () => {
    game.override
      .enemyLevel(100)
      .startingLevel(1)
      .enemySpecies(Species.MAGIKARP)
      .moveset(Moves.DESTINY_BOND)
      .startingHeldItems([]) // reset held items to nothing so user doesn't revive and not trigger Destiny Bond
      .enemyMoveset(Moves.TACKLE);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);
    const player = game.scene.getPlayerPokemon()!;
    player.damageAndUpdate(player.hp - 1);
    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DESTINY_BOND);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.isFainted()).toBeTruthy();
  });
});
