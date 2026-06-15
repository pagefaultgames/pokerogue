import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Parting Shot", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should switch the user out and lower the target's ATK/SPATK by 1", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

    const [feebas, milotic] = game.scene.getPlayerParty();

    game.move.use(MoveId.PARTING_SHOT);
    game.doSelectPartyPokemon(1);
    await game.toEndOfTurn();

    const enemy = game.field.getEnemyPokemon();

    expect(feebas.isOnField()).toBe(false);
    expect(milotic.isOnField()).toBe(false);
    expect(enemy).toHaveStatStage(Stat.ATK, -1);
    expect(enemy).toHaveStatStage(Stat.SPATK, -1);
  });

  it("should fail without switching out if the target's stats cannot be changed", async () => {
    await game.classicMode.startBattle(SpeciesId.MURKROW, SpeciesId.ABRA);

    // forcibly set the enemy to minimum stat stages
    const enemyPokemon = game.field.getEnemyPokemon();
    enemyPokemon.setStatStage(Stat.ATK, -6);
    enemyPokemon.setStatStage(Stat.SPATK, -6);

    // Parting Shot should fail entirely when the target is already at minimum stages,
    // leaving stats unchanged and keeping the user in the field.
    game.move.use(MoveId.PARTING_SHOT);
    await game.toNextTurn();

    expect(enemyPokemon).toHaveStatStage(Stat.ATK, -6);
    expect(enemyPokemon).toHaveStatStage(Stat.SPATK, -6);
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.MURKROW);
  });

  it("shouldn't allow switch out when mist is active", async () => {
    game.override.enemySpecies(SpeciesId.ALTARIA).enemyMoveset([MoveId.MIST]);
    await game.classicMode.startBattle(SpeciesId.SNORLAX, SpeciesId.MEOWTH);

    const enemyPokemon = game.field.getEnemyPokemon();

    // Turn 1: Use Splash to allow the opponent to set up Mist before Parting Shot is used.
    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    // Turn 2: Parting Shot is now blocked by the active Mist — stat stages must remain unchanged
    // and no switch-out should be triggered.
    game.move.use(MoveId.PARTING_SHOT);
    await game.toNextTurn();

    expect(enemyPokemon).toHaveStatStage(Stat.ATK, 0);
    expect(enemyPokemon).toHaveStatStage(Stat.SPATK, 0);
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.SNORLAX);
  });

  it("shouldn't allow switch out against clear body ability", async () => {
    game.override.enemySpecies(SpeciesId.TENTACOOL).enemyAbility(AbilityId.CLEAR_BODY);
    await game.classicMode.startBattle(SpeciesId.SNORLAX, SpeciesId.MEOWTH);

    const enemyPokemon = game.field.getEnemyPokemon();

    // Clear Body blocks all stat reductions, so Parting Shot's condition for switching out
    // is never met — the user should remain in the field.
    game.move.use(MoveId.PARTING_SHOT);
    await game.toNextTurn();

    expect(enemyPokemon).toHaveStatStage(Stat.ATK, 0);
    expect(enemyPokemon).toHaveStatStage(Stat.SPATK, 0);
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.SNORLAX);
  });

  it("should lower stats without failing if no party members are available to switch", async () => {
    await game.classicMode.startBattle(SpeciesId.MURKROW, SpeciesId.MEOWTH);

    // Eliminate the only available party member so there is no valid switch target.
    const meowth = game.scene.getPlayerParty()[1];
    meowth.hp = 0;

    // Parting Shot should still apply its stat drop normally — the move itself does not fail
    // when there are no eligible replacements; only the switch-out is skipped.
    game.move.use(MoveId.PARTING_SHOT);
    await game.toNextTurn();

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon).toHaveStatStage(Stat.ATK, -1);
    expect(enemyPokemon).toHaveStatStage(Stat.SPATK, -1);
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.MURKROW);
  });

  it("should lower stats and switch out when target has no immunities", async () => {
    await game.classicMode.startBattle(SpeciesId.SNORLAX, SpeciesId.MEOWTH);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.use(MoveId.PARTING_SHOT);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(enemyPokemon).toHaveStatStage(Stat.ATK, -1);
    expect(enemyPokemon).toHaveStatStage(Stat.SPATK, -1);
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.MEOWTH);
  });

  it("should increase stats and trigger switch out against a target with Contrary", async () => {
    game.override.enemyAbility(AbilityId.CONTRARY);
    await game.classicMode.startBattle(SpeciesId.SNORLAX, SpeciesId.MEOWTH);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.use(MoveId.PARTING_SHOT);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    // Contrary inverts the drop, so stats should actually be +1
    expect(enemyPokemon).toHaveStatStage(Stat.ATK, 1);
    expect(enemyPokemon).toHaveStatStage(Stat.SPATK, 1);

    // Because the stat change (even if positive) was successful, the switch should occur
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.MEOWTH);
  });
});
