import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Ability - Guard Dog", () => {
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
      .ability(AbilityId.GUARD_DOG)
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.INTIMIDATE);
  });

  it("should raise attack by 1 stage when Intimidated instead of being lowered", async () => {
    await game.classicMode.startBattle(SpeciesId.MABOSSTIFF);

    const mabostiff = game.field.getPlayerPokemon();

    expect(mabostiff).toHaveAbilityApplied(AbilityId.GUARD_DOG);
    expect(mabostiff).toHaveStatStage(Stat.ATK, 1);
    expect(game.phaseInterceptor.phaseLog.filter(l => l === "StatStageChangePhase")).toHaveLength(1);
  });

  it("doesn't activate when the enemy only considers using a force switch move", async () => {
    game.override
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyLevel(100)
      .enemyMoveset([MoveId.ROAR, MoveId.WHIRLWIND, MoveId.SPLASH]);
    await game.classicMode.startBattle(SpeciesId.MABOSSTIFF, SpeciesId.FEEBAS);

    const mabosstiff = game.field.getPlayerPokemon();
    const abilityDisplaySpy = vi.spyOn(game.scene.phaseManager, "queueAbilityDisplay");

    game.move.use(MoveId.SPLASH);
    // the enemy has chosen its move, but no move has been used yet
    await game.phaseInterceptor.to("TurnStartPhase", false);

    expect(abilityDisplaySpy).not.toHaveBeenCalled();
    expect(mabosstiff).not.toHaveAbilityApplied(AbilityId.GUARD_DOG);
  });
});
