import { BattlerIndex } from "#enums/battler-index";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { MoveResult } from "#app/field/pokemon";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Sweet Veil", () => {
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
    game.override.battleStyle("double").enemySpecies(SpeciesId.MAGIKARP).enemyAbility(AbilityId.BALL_FETCH);
  });

  function expectNoStatus() {
    game.scene.getPlayerField().forEach(p => expect.soft(p.status?.effect).toBeUndefined());
  }

  it("should prevent the user and its allies from falling asleep", async () => {
    await game.classicMode.startBattle([SpeciesId.SWIRLIX, SpeciesId.MAGIKARP]);

    game.field.mockAbility(game.field.getPlayerPokemon(), AbilityId.SWEET_VEIL);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.SPORE, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.SPORE, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expectNoStatus();
  });

  it("should cause Rest to fail when used by the user or its allies, unless the ally has Mold Breaker", async () => {
    await game.classicMode.startBattle([SpeciesId.SWIRLIX, SpeciesId.MAGIKARP]);

    const [swirlix, magikarp] = game.scene.getPlayerField();
    game.field.mockAbility(swirlix, AbilityId.SWEET_VEIL);

    swirlix.hp = 1;
    magikarp.hp = 1;
    game.move.use(MoveId.REST, BattlerIndex.PLAYER);
    game.move.use(MoveId.REST, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expectNoStatus();
    expect(swirlix.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    expect(magikarp.getLastXMoves()[0].result).toBe(MoveResult.FAIL);

    game.field.mockAbility(magikarp, AbilityId.MOLD_BREAKER);
    game.move.use(MoveId.REST, BattlerIndex.PLAYER);
    game.move.use(MoveId.REST, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expect(magikarp.status?.effect).toBe(StatusEffect.SLEEP);
    expect(magikarp.hp).toBe(magikarp.getMaxHp());
  });

  it("should cause Yawn to fail if used on the user or its allies", async () => {
    await game.classicMode.startBattle([SpeciesId.SWIRLIX, SpeciesId.MAGIKARP]);

    const [shuckle, swirlix] = game.scene.getPlayerField();
    game.field.mockAbility(swirlix, AbilityId.SWEET_VEIL);

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.YAWN, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.YAWN, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expect(shuckle.getTag(BattlerTagType.DROWSY)).toBeUndefined();
    expect(swirlix.getTag(BattlerTagType.DROWSY)).toBeUndefined();
    // TODO: Currently ability blockages don't count in terms of failing status moves...??
    /* const [karp1, karp2] = game.scene.getPlayerField();
    expect(karp1.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    expect(karp2.getLastXMoves()[0].result).toBe(MoveResult.FAIL); */
  });

  it("should NOT cure allies' sleep status if user is sent out into battle", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS, SpeciesId.SWIRLIX]);
    const [magikarp, , swirlix] = game.scene.getPlayerParty();
    game.field.mockAbility(swirlix, AbilityId.PASTEL_VEIL);

    magikarp.trySetStatus(StatusEffect.SLEEP);
    expect(magikarp.status?.effect).toBe(StatusEffect.SLEEP);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.doSwitchPokemon(2);

    expect(magikarp.status?.effect).toBe(StatusEffect.SLEEP);
  });

  it("should prevent an already-drowsy user or ally from falling asleep", async () => {
    game.override.ability(AbilityId.BALL_FETCH);
    await game.classicMode.startBattle([SpeciesId.SHUCKLE, SpeciesId.SWIRLIX]);

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.YAWN, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.YAWN, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    const [shuckle, swirlix, karp1, karp2] = game.scene.getField();
    expect(shuckle.getTag(BattlerTagType.DROWSY)).toBeDefined();
    expect(swirlix.getTag(BattlerTagType.DROWSY)).toBeDefined();
    expect(karp1.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(karp2.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    game.field.mockAbility(shuckle, AbilityId.SWEET_VEIL);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expect(shuckle.getTag(BattlerTagType.DROWSY)).toBeDefined();
    expect(swirlix.getTag(BattlerTagType.DROWSY)).toBeDefined();
    expectNoStatus();
  });
});
