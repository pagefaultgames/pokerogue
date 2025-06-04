import { BattlerIndex } from "#app/battle";
import { PostDefendContactApplyStatusEffectAbAttr } from "#app/data/abilities/ability";
import { allAbilities } from "#app/data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { StatusEffect } from "#app/enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Safeguard", () => {
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
      .enemySpecies(SpeciesId.DRATINI)
      .enemyMoveset([MoveId.SAFEGUARD])
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyLevel(5)
      .starterSpecies(SpeciesId.DRATINI)
      .moveset([MoveId.NUZZLE, MoveId.SPORE, MoveId.YAWN, MoveId.SPLASH])
      .ability(AbilityId.UNNERVE); // Stop wild Pokemon from potentially eating Lum Berry
  });

  it("protects from damaging moves with additional effects", async () => {
    await game.classicMode.startBattle();
    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.NUZZLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(enemy.status).toBeUndefined();
  });

  it("protects from status moves", async () => {
    await game.classicMode.startBattle();
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.SPORE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(enemyPokemon.status).toBeUndefined();
  });

  it("protects from confusion", async () => {
    game.override.moveset([MoveId.CONFUSE_RAY]);
    await game.classicMode.startBattle();
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.CONFUSE_RAY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(enemyPokemon.summonData.tags).toEqual([]);
  });

  it("protects ally from status", async () => {
    game.override.battleStyle("double");

    await game.classicMode.startBattle();

    game.move.select(MoveId.SPORE, 0, BattlerIndex.ENEMY_2);
    game.move.select(MoveId.NUZZLE, 1, BattlerIndex.ENEMY_2);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("BerryPhase");

    const enemyPokemon = game.scene.getEnemyField();

    expect(enemyPokemon[0].status).toBeUndefined();
    expect(enemyPokemon[1].status).toBeUndefined();
  });

  it("protects from Yawn", async () => {
    await game.classicMode.startBattle();
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.YAWN);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(enemyPokemon.summonData.tags).toEqual([]);
  });

  it("doesn't protect from already existing Yawn", async () => {
    await game.classicMode.startBattle();
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.YAWN);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(enemyPokemon.status?.effect).toEqual(StatusEffect.SLEEP);
  });

  it("doesn't protect from self-inflicted via Rest or Flame Orb", async () => {
    game.override.enemyHeldItems([{ name: "FLAME_ORB" }]);
    await game.classicMode.startBattle();
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();
    enemyPokemon.damageAndUpdate(1);

    expect(enemyPokemon.status?.effect).toEqual(StatusEffect.BURN);

    game.override.enemyMoveset([MoveId.REST]);
    // Force the moveset to update mid-battle
    // TODO: Remove after enemy AI rework is in
    enemyPokemon.getMoveset();
    game.move.select(MoveId.SPLASH);
    enemyPokemon.damageAndUpdate(1);
    await game.toNextTurn();

    expect(enemyPokemon.status?.effect).toEqual(StatusEffect.SLEEP);
  });

  it("protects from ability-inflicted status", async () => {
    game.override.ability(AbilityId.STATIC);
    vi.spyOn(
      allAbilities[AbilityId.STATIC].getAttrs(PostDefendContactApplyStatusEffectAbAttr)[0],
      "chance",
      "get",
    ).mockReturnValue(100);
    await game.classicMode.startBattle();
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();
    game.override.enemyMoveset([MoveId.TACKLE]);
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(enemyPokemon.status).toBeUndefined();
  });
});
