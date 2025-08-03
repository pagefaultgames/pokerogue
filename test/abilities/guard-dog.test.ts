import { AbilityId } from "#enums/ability-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Guard Dog", () => {
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
      .ability(AbilityId.GUARD_DOG)
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.INTIMIDATE);
  });

  it("should raise attack by 1 stage when Intimidated instead of being lowered", async () => {
    await game.classicMode.startBattle([SpeciesId.MABOSSTIFF]);

    const mabostiff = game.field.getPlayerPokemon();
    expect(mabostiff.getStatStage(Stat.ATK)).toBe(1);
    expect(mabostiff.waveData.abilitiesApplied.has(AbilityId.GUARD_DOG)).toBe(true);
    expect(game.phaseInterceptor.log.filter(l => l === "StatStageChangePhase")).toHaveLength(1);
  });
});
