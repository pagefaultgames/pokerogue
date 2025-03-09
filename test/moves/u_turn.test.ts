import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
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
      .battleType("single")
      .enemySpecies(Species.GENGAR)
      .startingLevel(90)
      .startingWave(97)
      .moveset([Moves.U_TURN])
      .enemyMoveset(Moves.SPLASH)
      .disableCrits();
  });

  it("triggers regenerator a single time when a regenerator user switches out with u-turn", async () => {
    // arrange
    const playerHp = 1;
    game.override.ability(Abilities.REGENERATOR);
    await game.classicMode.startBattle([Species.RAICHU, Species.SHUCKLE]);
    game.scene.getPlayerPokemon()!.hp = playerHp;

    // act
    game.move.select(Moves.U_TURN);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    // assert
    expect(game.scene.getPlayerParty()[1].hp).toEqual(
      Math.floor(game.scene.getPlayerParty()[1].getMaxHp() * 0.33 + playerHp),
    );
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.SHUCKLE);
  }, 20000);

  it("triggers rough skin on the u-turn user before a new pokemon is switched in", async () => {
    // arrange
    game.override.enemyAbility(Abilities.ROUGH_SKIN);
    await game.classicMode.startBattle([Species.RAICHU, Species.SHUCKLE]);

    // act
    game.move.select(Moves.U_TURN);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("SwitchPhase", false);

    // assert
    const playerPkm = game.scene.getPlayerPokemon()!;
    expect(playerPkm.hp).not.toEqual(playerPkm.getMaxHp());
    expect(game.scene.getEnemyPokemon()!.battleData.abilityRevealed).toBe(true); // proxy for asserting ability activated
    expect(playerPkm.species.speciesId).toEqual(Species.RAICHU);
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
  }, 20000);

  it("triggers contact abilities on the u-turn user (eg poison point) before a new pokemon is switched in", async () => {
    // arrange
    game.override.enemyAbility(Abilities.POISON_POINT);
    await game.classicMode.startBattle([Species.RAICHU, Species.SHUCKLE]);
    vi.spyOn(game.scene.getEnemyPokemon()!, "randSeedInt").mockReturnValue(0);

    // act
    game.move.select(Moves.U_TURN);
    await game.phaseInterceptor.to("SwitchPhase", false);

    // assert
    const playerPkm = game.scene.getPlayerPokemon()!;
    expect(playerPkm.status?.effect).toEqual(StatusEffect.POISON);
    expect(playerPkm.species.speciesId).toEqual(Species.RAICHU);
    expect(game.scene.getEnemyPokemon()!.battleData.abilityRevealed).toBe(true); // proxy for asserting ability activated
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
  }, 20000);

  it("still forces a switch if u-turn KO's the opponent", async () => {
    game.override.startingLevel(1000); // Ensure that U-Turn KO's the opponent
    await game.classicMode.startBattle([Species.RAICHU, Species.SHUCKLE]);
    const enemy = game.scene.getEnemyPokemon()!;

    // KO the opponent with U-Turn
    game.move.select(Moves.U_TURN);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.isFainted()).toBe(true);

    // Check that U-Turn forced a switch
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.SHUCKLE);
  });
});
