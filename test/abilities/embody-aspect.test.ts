import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Embody Aspect", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  // const teraForm = 4;
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
      .ability(AbilityId.EMBODY_ASPECT_TEAL)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("Embody Aspect should activate on switching in if user is terrestrialized", async () => {
    await game.classicMode.startBattle([SpeciesId.OGERPON, SpeciesId.ABOMASNOW]);

    const Ogerpon = game.scene.getPlayerParty()[0];
    expect(Ogerpon.formIndex).toBe(baseForm);

    game.field.forceTera(Ogerpon, PokemonType.GRASS);
    game.move.use(MoveId.SPLASH);

    // todo: add helper function to activiate tera related abilities
    // await game.phaseInterceptor.to(QuietFormChangePhase);
    // expect(Ogerpon.formIndex).toBe(teraForm);
    // expect(Ogerpon.getStatStage(Stat.SPD)).toBe(1);

    await game.toNextTurn();

    //Switch Ogerpon out
    game.doSwitchPokemon(1);
    await game.toNextTurn();

    //Switch Ogerpon back in
    game.doSwitchPokemon(1);
    await game.toNextTurn();

    //Ability activated
    expect(Ogerpon.getStatStage(Stat.SPD)).toBe(1);
  });
});
