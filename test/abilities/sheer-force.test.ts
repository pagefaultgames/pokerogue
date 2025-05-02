import { BattlerIndex } from "#app/battle";
import { PokemonType } from "#enums/pokemon-type";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { allMoves, FlinchAttr } from "#app/data/moves/move";

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
      .ability(Abilities.SHEER_FORCE)
      .enemySpecies(Species.ONIX)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([Moves.SPLASH])
      .disableCrits();
  });

  const SHEER_FORCE_MULT = 1.3;

  it("Sheer Force should boost the power of the move but disable secondary effects", async () => {
    game.override.moveset([Moves.AIR_SLASH]);
    await game.classicMode.startBattle([Species.SHUCKLE]);

    const airSlashMove = allMoves[Moves.AIR_SLASH];
    vi.spyOn(airSlashMove, "calculateBattlePower");
    const airSlashFlinchAttr = airSlashMove.getAttrs(FlinchAttr)[0];
    vi.spyOn(airSlashFlinchAttr, "getMoveChance");

    game.move.select(Moves.AIR_SLASH);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(airSlashMove.calculateBattlePower).toHaveLastReturnedWith(airSlashMove.power * SHEER_FORCE_MULT);
    expect(airSlashFlinchAttr.getMoveChance).toHaveLastReturnedWith(0);
  });

  it("Sheer Force does not affect the base damage or secondary effects of binding moves", async () => {
    game.override.moveset([Moves.BIND]);
    await game.classicMode.startBattle([Species.SHUCKLE]);

    const bindMove = allMoves[Moves.BIND];
    vi.spyOn(bindMove, "calculateBattlePower");

    game.move.select(Moves.BIND);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(bindMove.calculateBattlePower).toHaveLastReturnedWith(bindMove.power);
  }, 20000);

  it("Sheer Force does not boost the base damage of moves with no secondary effect", async () => {
    game.override.moveset([Moves.TACKLE]);
    await game.classicMode.startBattle([Species.PIDGEOT]);

    const tackleMove = allMoves[Moves.TACKLE];
    vi.spyOn(tackleMove, "calculateBattlePower");

    game.move.select(Moves.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(tackleMove.calculateBattlePower).toHaveLastReturnedWith(tackleMove.power);
  });

  it("Sheer Force can disable the on-hit activation of specific abilities", async () => {
    game.override
      .moveset([Moves.HEADBUTT])
      .enemySpecies(Species.SQUIRTLE)
      .enemyLevel(10)
      .enemyAbility(Abilities.COLOR_CHANGE);

    await game.classicMode.startBattle([Species.PIDGEOT]);
    const enemyPokemon = game.scene.getEnemyPokemon();
    const headbuttMove = allMoves[Moves.HEADBUTT];
    vi.spyOn(headbuttMove, "calculateBattlePower");
    const headbuttFlinchAttr = headbuttMove.getAttrs(FlinchAttr)[0];
    vi.spyOn(headbuttFlinchAttr, "getMoveChance");

    game.move.select(Moves.HEADBUTT);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon?.getTypes()[0]).toBe(PokemonType.WATER);
    expect(headbuttMove.calculateBattlePower).toHaveLastReturnedWith(headbuttMove.power * SHEER_FORCE_MULT);
    expect(headbuttFlinchAttr.getMoveChance).toHaveLastReturnedWith(0);
  });

  it("Two Pokemon with abilities disabled by Sheer Force hitting each other should not cause a crash", async () => {
    const moveToUse = Moves.CRUNCH;
    game.override
      .enemyAbility(Abilities.COLOR_CHANGE)
      .ability(Abilities.COLOR_CHANGE)
      .moveset(moveToUse)
      .enemyMoveset(moveToUse);

    await game.classicMode.startBattle([Species.PIDGEOT]);

    const pidgeot = game.scene.getPlayerParty()[0];
    const onix = game.scene.getEnemyParty()[0];

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
      .ability(Abilities.SHEER_FORCE)
      .moveset([Moves.RELIC_SONG])
      .enemyMoveset([Moves.SPLASH])
      .enemyLevel(100);
    await game.classicMode.startBattle([Species.MELOETTA]);

    const playerPokemon = game.scene.getPlayerPokemon();
    const formKeyStart = playerPokemon?.getFormKey();

    game.move.select(Moves.RELIC_SONG);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(formKeyStart).toBe(playerPokemon?.getFormKey());
  });
});
