import { BattlerIndex } from "#app/battle";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { FlinchAttr } from "#app/data/moves/move";
import { allMoves } from "#app/data/data-lists";

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
      .enemyAbility(AbilityId.NO_GUARD)
      .enemyMoveset(MoveId.SPLASH)
      .disableCrits();
  });

  const SHEER_FORCE_MULT = 1.3;

  it("should boost move power by 1.3x, disabling all secondary effects in the process", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    const airSlashMove = allMoves[MoveId.AIR_SLASH];
    vi.spyOn(airSlashMove, "calculateBattlePower");
    const airSlashFlinchAttr = airSlashMove.getAttrs(FlinchAttr)[0];
    vi.spyOn(airSlashFlinchAttr, "getMoveChance");

    game.move.use(MoveId.AIR_SLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(airSlashMove.calculateBattlePower).toHaveLastReturnedWith(airSlashMove.power * SHEER_FORCE_MULT);
    expect(airSlashFlinchAttr.getMoveChance).toHaveLastReturnedWith(0);
  });

  it("should affect the base power of binding moves", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    const bindMove = allMoves[MoveId.BIND];
    vi.spyOn(bindMove, "calculateBattlePower");

    game.move.use(MoveId.BIND);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(bindMove.calculateBattlePower).toHaveLastReturnedWith(bindMove.power);
  });

  it("should not boost power of moves lacking a secondary effect", async () => {
    await game.classicMode.startBattle([SpeciesId.PIDGEOT]);

    const tackleMove = allMoves[MoveId.TACKLE];
    vi.spyOn(tackleMove, "calculateBattlePower");

    game.move.use(MoveId.TACKLE);
    await game.toEndOfTurn();

    expect(tackleMove.calculateBattlePower).toHaveLastReturnedWith(tackleMove.power);
  });

  it.each<{ name: string; ability: AbilityId }>([
    { name: "Color Change", ability: AbilityId.COLOR_CHANGE },
    { name: "Pickpocket", ability: AbilityId.PICKPOCKET },
    { name: "Berserk", ability: AbilityId.BERSERK },
    { name: "Anger Shell", ability: AbilityId.ANGER_SHELL },
    { name: "Wimp Out", ability: AbilityId.WIMP_OUT },
    { name: "Emergency Exit", ability: AbilityId.EMERGENCY_EXIT },
  ])("should disable $name on hit when using boosted moves", async ({ ability }) => {
    game.override.enemySpecies(SpeciesId.SQUIRTLE).enemyLevel(100).enemyAbility(ability);
    await game.classicMode.startBattle([SpeciesId.PIDGEOT]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    enemyPokemon.hp = enemyPokemon.getMaxHp() / 2 + 1; // ensures wimp out works

    const headbuttMove = allMoves[MoveId.HEADBUTT];
    vi.spyOn(headbuttMove, "calculateBattlePower");
    const headbuttFlinchAttr = headbuttMove.getAttrs(FlinchAttr)[0];
    vi.spyOn(headbuttFlinchAttr, "getMoveChance");

    game.move.use(MoveId.HEADBUTT);
    await game.toEndOfTurn();

    // ability was disabled when using boosted attack
    expect(enemyPokemon.waveData.abilitiesApplied).not.toContain(ability);
    expect(headbuttMove.calculateBattlePower).toHaveLastReturnedWith(headbuttMove.power * SHEER_FORCE_MULT);
    expect(headbuttFlinchAttr.getMoveChance).toHaveLastReturnedWith(0);
  });

  it("should not crash when 2 pokemon with disabled abilities attack each other", async () => {
    game.override.enemyAbility(AbilityId.COLOR_CHANGE).ability(AbilityId.COLOR_CHANGE);

    await game.classicMode.startBattle([SpeciesId.PIDGEOT]);

    const pidgeot = game.field.getPlayerPokemon();
    const onix = game.field.getEnemyPokemon();

    game.move.select(MoveId.CRUNCH);
    await game.move.forceEnemyMove(MoveId.CRUNCH);
    await game.toNextTurn();

    // Check that both Pokemon's Color Change activated
    const expectedTypes = [allMoves[MoveId.CRUNCH].type];
    expect(pidgeot.getTypes()).toStrictEqual(expectedTypes);
    expect(onix.getTypes()).toStrictEqual(expectedTypes);
  });

  it("should disable Meloetta's transformation from Relic Song", async () => {
    game.override.moveset(MoveId.RELIC_SONG);
    await game.classicMode.startBattle([SpeciesId.MELOETTA]);

    const playerPokemon = game.field.getPlayerPokemon();
    const formKeyStart = playerPokemon.getFormKey();

    game.move.select(MoveId.RELIC_SONG);
    await game.toEndOfTurn();
    expect(formKeyStart).toBe(playerPokemon?.getFormKey());
  });
});
