import { MoveId } from "#enums/move-id";
import { AbilityId } from "#enums/ability-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BattleType } from "#enums/battle-type";
import { Stat } from "#enums/stat";

describe("Abilities - Rattled", () => {
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
      .moveset([MoveId.FALSE_SWIPE, MoveId.TRICK_ROOM])
      .ability(AbilityId.RATTLED)
      .battleType(BattleType.TRAINER)
      .disableCrits()
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.INTIMIDATE)
      .enemyMoveset(MoveId.PIN_MISSILE);
  });

  it("should trigger and boost speed immediately after Intimidate attack drop on initial send out", async () => {
    // `runToSummon` used instead of `startBattle` to avoid skipping past initial "post send out" effects
    await game.classicMode.runToSummon([SpeciesId.GIMMIGHOUL]);

    const playerPokemon = game.scene.getPlayerPokemon();
    await game.phaseInterceptor.to("StatStageChangePhase");

    expect(playerPokemon!.getStatStage(Stat.ATK)).toBe(-1);
    expect(playerPokemon!.getStatStage(Stat.SPD)).toBe(0);

    await game.phaseInterceptor.to("StatStageChangePhase");

    expect(playerPokemon!.getStatStage(Stat.ATK)).toBe(-1);
    expect(playerPokemon!.getStatStage(Stat.SPD)).toBe(1);
  });
});
