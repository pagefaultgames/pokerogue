import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Frenzy Move Reset", () => {
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
      .criticalHits(false)
      .moveset(MoveId.THRASH)
      .statusEffect(StatusEffect.PARALYSIS)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(100)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  /*
   * Thrash (or frenzy moves in general) should not continue to run if attack fails due to paralysis
   *
   * This is a 3-turn Thrash test:
   * 1. Thrash is selected and succeeds to hit the enemy -> Enemy Faints
   *
   * 2. Thrash is automatically selected but misses due to paralysis
   * Note: After missing the Pokemon should stop automatically attacking
   *
   * 3. At the start of the 3rd turn the Player should be able to select a move/switch Pokemon/etc.
   * Note: This means that BattlerTag.FRENZY is not anymore in pokemon.summonData.tags and pokemon.summonData.moveQueue is empty
   *
   */
  it("should cancel frenzy move if move fails turn 2", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.THRASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceStatusActivation(false);
    await game.toNextTurn();

    expect(playerPokemon.summonData.moveQueue.length).toBe(2);
    expect(playerPokemon.summonData.tags.some(tag => tag.tagType === BattlerTagType.FRENZY)).toBe(true);

    await game.move.forceStatusActivation(true);
    await game.toNextTurn();

    expect(playerPokemon.summonData.moveQueue.length).toBe(0);
    expect(playerPokemon.summonData.tags.some(tag => tag.tagType === BattlerTagType.FRENZY)).toBe(false);
  });

  it("queues a target for each frenzy turn in a double battle", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    vi.spyOn(feebas, "randBattleSeedIntRange").mockReturnValue(2);

    game.move.use(MoveId.THRASH, 0);
    await game.toNextTurn();

    const targets = feebas.summonData.moveQueue.map(q => q.targets[0]);
    expect(targets).toHaveLength(2);
    for (const target of targets) {
      expect(target).toBeOneOf([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    }
  });

  it.each([
    { moveId: MoveId.THRASH, moveName: "Thrash" },
    { moveId: MoveId.OUTRAGE, moveName: "Outrage" },
    { moveId: MoveId.PETAL_DANCE, moveName: "Petal Dance" },
    { moveId: MoveId.RAGING_FURY, moveName: "Raging Fury" },
  ])("$moveName re-rolls target each turn in a double battle", async ({ moveId }) => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    let pick = 0;
    vi.spyOn(feebas, "randBattleSeedIntRange").mockReturnValue(2);
    vi.spyOn(feebas, "randBattleSeedInt").mockImplementation(() => pick++ % 2);

    game.move.use(moveId, 0);
    await game.toNextTurn();

    const targets = feebas.summonData.moveQueue.map(q => q.targets[0]);
    expect(targets).toHaveLength(2);
    for (const target of targets) {
      expect(target).toBeOneOf([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    }
  });

  it("hits the only enemy in a single battle", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    game.move.use(MoveId.THRASH);
    await game.toNextTurn();

    const targets = feebas.summonData.moveQueue.map(q => q.targets[0]);
    expect(targets.every(t => t === BattlerIndex.ENEMY)).toBe(true);
  });
});
