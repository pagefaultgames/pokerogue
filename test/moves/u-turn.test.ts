import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - U-turn", () => {
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .startingLevel(90)
      .startingWave(97)
      .moveset([MoveId.U_TURN])
      .enemyMoveset(MoveId.SPLASH)
      .criticalHits(false);
  });

  it("triggers regenerator a single time when a regenerator user switches out with u-turn", async () => {
    // arrange
    const playerHp = 1;
    game.override.ability(AbilityId.REGENERATOR);
    await game.classicMode.startBattle([SpeciesId.RAICHU, SpeciesId.SHUCKLE]);
    game.field.getPlayerPokemon().hp = playerHp;

    // act
    game.move.select(MoveId.U_TURN);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    // assert
    expect(game.scene.getPlayerParty()[1].hp).toEqual(
      Math.floor(game.scene.getPlayerParty()[1].getMaxHp() * 0.33 + playerHp),
    );
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.SHUCKLE);
  });

  it("triggers rough skin on the u-turn user before a new pokemon is switched in", async () => {
    // arrange
    game.override.enemyAbility(AbilityId.ROUGH_SKIN);
    await game.classicMode.startBattle([SpeciesId.RAICHU, SpeciesId.SHUCKLE]);

    // act
    game.move.select(MoveId.U_TURN);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("SwitchPhase", false);

    // assert
    const playerPkm = game.field.getPlayerPokemon();
    expect(playerPkm.hp).not.toEqual(playerPkm.getMaxHp());
    expect(game.field.getEnemyPokemon().waveData.abilityRevealed).toBe(true); // proxy for asserting ability activated
    expect(playerPkm.species.speciesId).toEqual(SpeciesId.RAICHU);
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
  });

  it("triggers contact abilities on the u-turn user (eg poison point) before a new pokemon is switched in", async () => {
    // arrange
    game.override.enemyAbility(AbilityId.POISON_POINT);
    await game.classicMode.startBattle([SpeciesId.RAICHU, SpeciesId.SHUCKLE]);
    vi.spyOn(game.field.getEnemyPokemon(), "randBattleSeedInt").mockReturnValue(0);

    // act
    game.move.select(MoveId.U_TURN);
    await game.phaseInterceptor.to("SwitchPhase", false);

    // assert
    const playerPkm = game.field.getPlayerPokemon();
    expect(playerPkm.status?.effect).toEqual(StatusEffect.POISON);
    expect(playerPkm.species.speciesId).toEqual(SpeciesId.RAICHU);
    expect(game.field.getEnemyPokemon().waveData.abilityRevealed).toBe(true); // proxy for asserting ability activated
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
  });

  it("still forces a switch if u-turn KO's the opponent", async () => {
    game.override.startingLevel(1000); // Ensure that U-Turn KO's the opponent
    await game.classicMode.startBattle([SpeciesId.RAICHU, SpeciesId.SHUCKLE]);
    const enemy = game.field.getEnemyPokemon();

    // KO the opponent with U-Turn
    game.move.select(MoveId.U_TURN);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.isFainted()).toBe(true);

    // Check that U-Turn forced a switch
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.SHUCKLE);
  });

  it("should not crash when KOing the user from a reactive effect", async () => {
    game.override.enemyAbility(AbilityId.ROUGH_SKIN);
    await game.classicMode.startBattle([SpeciesId.SHEDINJA, SpeciesId.FEEBAS]);

    const player1 = game.field.getPlayerPokemon();

    game.move.use(MoveId.U_TURN);
    game.doSelectPartyPokemon(1);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.FEEBAS);
    expect(player1).toHaveFainted();
  });

  it("should not crash when KOing the user via Destiny Bond", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();
    karp.hp = 1;

    game.move.use(MoveId.U_TURN);
    game.doSelectPartyPokemon(1);
    await game.move.forceEnemyMove(MoveId.DESTINY_BOND);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(karp).toHaveFainted();
    expect(feebas).toHaveFainted();
    expect(feebas.isOnField()).toBe(false);

    // Make sure feebas' faint phase runs before being switched out (since that was the root cause of the crash)
    const logs = game.phaseInterceptor.log;
    expect(logs).toContain("SwitchSummonPhase");
    expect(logs).toContain("FaintPhase");
    expect(logs.indexOf("SwitchSummonPhase")).toBeGreaterThan(logs.indexOf("FaintPhase"));
  });
});
