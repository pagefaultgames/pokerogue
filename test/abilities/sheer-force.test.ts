import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Sheer Force", () => {
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
      .ability(AbilityId.SHEER_FORCE)
      .enemySpecies(SpeciesId.ONIX)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.SPLASH])
      .criticalHits(false);
  });

  const SHEER_FORCE_MULT = 1.3;

  it("Sheer Force should boost the power of the move but disable secondary effects", async () => {
    game.override.moveset([MoveId.AIR_SLASH]);
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    const airSlashMove = allMoves[MoveId.AIR_SLASH];
    vi.spyOn(airSlashMove, "calculateBattlePower");
    const airSlashFlinchAttr = airSlashMove.getAttrs("FlinchAttr")[0];
    vi.spyOn(airSlashFlinchAttr, "getMoveChance");

    game.move.select(MoveId.AIR_SLASH);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(airSlashMove.calculateBattlePower).toHaveLastReturnedWith(airSlashMove.power * SHEER_FORCE_MULT);
    expect(airSlashFlinchAttr.getMoveChance).toHaveLastReturnedWith(0);
  });

  it("Sheer Force does not affect the base damage or secondary effects of binding moves", async () => {
    game.override.moveset([MoveId.BIND]);
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    const bindMove = allMoves[MoveId.BIND];
    vi.spyOn(bindMove, "calculateBattlePower");

    game.move.select(MoveId.BIND);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(bindMove.calculateBattlePower).toHaveLastReturnedWith(bindMove.power);
  });

  it("Sheer Force does not boost the base damage of moves with no secondary effect", async () => {
    game.override.moveset([MoveId.TACKLE]);
    await game.classicMode.startBattle([SpeciesId.PIDGEOT]);

    const tackleMove = allMoves[MoveId.TACKLE];
    vi.spyOn(tackleMove, "calculateBattlePower");

    game.move.select(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(tackleMove.calculateBattlePower).toHaveLastReturnedWith(tackleMove.power);
  });

  it("Sheer Force can disable the on-hit activation of specific abilities", async () => {
    game.override
      .moveset([MoveId.HEADBUTT])
      .enemySpecies(SpeciesId.SQUIRTLE)
      .enemyLevel(10)
      .enemyAbility(AbilityId.COLOR_CHANGE);

    await game.classicMode.startBattle([SpeciesId.PIDGEOT]);
    const enemyPokemon = game.scene.getEnemyPokemon();
    const headbuttMove = allMoves[MoveId.HEADBUTT];
    vi.spyOn(headbuttMove, "calculateBattlePower");
    const headbuttFlinchAttr = headbuttMove.getAttrs("FlinchAttr")[0];
    vi.spyOn(headbuttFlinchAttr, "getMoveChance");

    game.move.select(MoveId.HEADBUTT);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon?.getTypes()[0]).toBe(PokemonType.WATER);
    expect(headbuttMove.calculateBattlePower).toHaveLastReturnedWith(headbuttMove.power * SHEER_FORCE_MULT);
    expect(headbuttFlinchAttr.getMoveChance).toHaveLastReturnedWith(0);
  });

  it("Two Pokemon with abilities disabled by Sheer Force hitting each other should not cause a crash", async () => {
    const moveToUse = MoveId.CRUNCH;
    game.override
      .enemyAbility(AbilityId.COLOR_CHANGE)
      .ability(AbilityId.COLOR_CHANGE)
      .moveset(moveToUse)
      .enemyMoveset(moveToUse);

    await game.classicMode.startBattle([SpeciesId.PIDGEOT]);

    const pidgeot = game.field.getPlayerPokemon();
    const onix = game.field.getEnemyPokemon();

    pidgeot.stats[Stat.DEF] = 10000;
    onix.stats[Stat.DEF] = 10000;

    game.move.select(moveToUse);
    await game.toNextTurn();

    // Check that both Pokemon's Color Change activated
    const expectedTypes = [allMoves[moveToUse].type];
    expect(pidgeot.getTypes()).toStrictEqual(expectedTypes);
    expect(onix.getTypes()).toStrictEqual(expectedTypes);
  });

  it("Sheer Force should disable Meloetta's transformation from Relic Song", async () => {
    game.override
      .ability(AbilityId.SHEER_FORCE)
      .moveset([MoveId.RELIC_SONG])
      .enemyMoveset([MoveId.SPLASH])
      .enemyLevel(100);
    await game.classicMode.startBattle([SpeciesId.MELOETTA]);

    const playerPokemon = game.scene.getPlayerPokemon();
    const formKeyStart = playerPokemon?.getFormKey();

    game.move.select(MoveId.RELIC_SONG);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(formKeyStart).toBe(playerPokemon?.getFormKey());
  });
});
