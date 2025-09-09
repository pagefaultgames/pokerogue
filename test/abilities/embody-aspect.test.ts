import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Embody Aspect", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const teraForm = 4;
  const baseForm = 0;

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
      .moveset([MoveId.SPLASH])
      .ability(AbilityId.EMBODY_ASPECT_TEAL)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should activate on switch-in if user is Terastallized", async () => {
    await game.classicMode.startBattle([SpeciesId.OGERPON, SpeciesId.ABOMASNOW]);

    const ogerpon = game.field.getPlayerPokemon();
    expect(ogerpon.formIndex).toBe(baseForm);
    expect(ogerpon).toHaveStatStage(Stat.SPD, 0);

    //Terastallize Ogerpon
    game.move.selectWithTera(MoveId.SPLASH);
    await game.phaseInterceptor.to("QuietFormChangePhase");

    expect(ogerpon.formIndex).toBe(teraForm);

    await game.toNextTurn();

    expect(ogerpon).toHaveStatStage(Stat.SPD, 1);
    expect(ogerpon).toHaveAbilityApplied(AbilityId.EMBODY_ASPECT_TEAL);

    // Clear out abilities applied set so we can check it again later
    ogerpon.waveData.abilitiesApplied.clear();

    //Switch ogerpon out
    game.doSwitchPokemon(1);
    await game.toNextTurn();

    //Switch ogerpon back in
    game.doSwitchPokemon(1);
    await game.toNextTurn();

    //Ability activated again
    expect(ogerpon).toHaveStatStage(Stat.SPD, 1);
    expect(ogerpon).toHaveAbilityApplied(AbilityId.EMBODY_ASPECT_TEAL);
  });
});
