import { AbilityId } from "#enums/ability-id";
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
      .enemySpecies(SpeciesId.GENGAR)
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
});
