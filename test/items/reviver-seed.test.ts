import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { PokemonInstantReviveModifier } from "#modifiers/modifier";
import { GameManager } from "#test/test-utils/game-manager";
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
      .moveset([MoveId.SPLASH, MoveId.TACKLE, MoveId.ENDURE])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingHeldItems([{ name: "REVIVER_SEED" }])
      .enemyHeldItems([{ name: "REVIVER_SEED" }])
      .enemyMoveset(MoveId.SPLASH);
    vi.spyOn(allMoves[MoveId.SHEER_COLD], "accuracy", "get").mockReturnValue(100);
    vi.spyOn(allMoves[MoveId.LEECH_SEED], "accuracy", "get").mockReturnValue(100);
    vi.spyOn(allMoves[MoveId.WHIRLPOOL], "accuracy", "get").mockReturnValue(100);
    vi.spyOn(allMoves[MoveId.WILL_O_WISP], "accuracy", "get").mockReturnValue(100);
  });

  it.each([
    { moveType: "Special Move", move: MoveId.WATER_GUN },
    { moveType: "Physical Move", move: MoveId.TACKLE },
    { moveType: "Fixed Damage Move", move: MoveId.SEISMIC_TOSS },
    { moveType: "Final Gambit", move: MoveId.FINAL_GAMBIT },
    { moveType: "Counter", move: MoveId.COUNTER },
    { moveType: "OHKO", move: MoveId.SHEER_COLD },
  ])("should activate the holder's reviver seed from a $moveType", async ({ move }) => {
    game.override.enemyLevel(100).startingLevel(1).enemyMoveset(move);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);
    const player = game.field.getPlayerPokemon();
    player.damageAndUpdate(player.hp - 1);

    const reviverSeed = player.getHeldItems()[0] as PokemonInstantReviveModifier;
    vi.spyOn(reviverSeed, "apply");

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(player.isFainted()).toBeFalsy();
  });

  it("should activate the holder's reviver seed from confusion self-hit", async () => {
    game.override.enemyLevel(1).startingLevel(100).enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);
    const player = game.field.getPlayerPokemon();
    player.damageAndUpdate(player.hp - 1);
    player.addTag(BattlerTagType.CONFUSED, 3);

    const reviverSeed = player.getHeldItems()[0] as PokemonInstantReviveModifier;
    vi.spyOn(reviverSeed, "apply");

    vi.spyOn(player, "randBattleSeedInt").mockReturnValue(0); // Force confusion self-hit
    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(player.isFainted()).toBeFalsy();
  });

  // Damaging opponents tests
  it.each([
    { moveType: "Damaging Move Chip Damage", move: MoveId.SALT_CURE },
    { moveType: "Chip Damage", move: MoveId.LEECH_SEED },
    { moveType: "Trapping Chip Damage", move: MoveId.WHIRLPOOL },
    { moveType: "Status Effect Damage", move: MoveId.WILL_O_WISP },
    { moveType: "Weather", move: MoveId.SANDSTORM },
  ])("should not activate the holder's reviver seed from $moveType", async ({ move }) => {
    game.override
      .enemyLevel(1)
      .startingLevel(100)
      .enemySpecies(SpeciesId.MAGIKARP)
      .moveset(move)
      .enemyMoveset(MoveId.ENDURE);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);
    const enemy = game.field.getEnemyPokemon();
    enemy.damageAndUpdate(enemy.hp - 1);

    game.move.select(move);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.isFainted()).toBeTruthy();
  });

  // Self-damage tests
  it.each([
    { moveType: "Recoil", move: MoveId.DOUBLE_EDGE },
    { moveType: "Self-KO", move: MoveId.EXPLOSION },
    { moveType: "Self-Deduction", move: MoveId.CURSE },
    { moveType: "Liquid Ooze", move: MoveId.GIGA_DRAIN },
  ])("should not activate the holder's reviver seed from $moveType", async ({ move }) => {
    game.override
      .enemyLevel(100)
      .startingLevel(1)
      .enemySpecies(SpeciesId.MAGIKARP)
      .moveset(move)
      .enemyAbility(AbilityId.LIQUID_OOZE)
      .enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.GASTLY, SpeciesId.FEEBAS]);
    const player = game.field.getPlayerPokemon();
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .moveset(MoveId.DESTINY_BOND)
      .startingHeldItems([]) // reset held items to nothing so user doesn't revive and not trigger Destiny Bond
      .enemyMoveset(MoveId.TACKLE);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);
    const player = game.field.getPlayerPokemon();
    player.damageAndUpdate(player.hp - 1);
    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.DESTINY_BOND);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.isFainted()).toBeTruthy();
  });
});
