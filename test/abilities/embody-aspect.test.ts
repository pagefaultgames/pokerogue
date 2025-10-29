import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Embody Aspect", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const embodyAspectTealForm = 4;
  const tealMaskForm = 0;

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

  it("should activate after Tera-induced form changes if user has one", async () => {
    await game.classicMode.startBattle([SpeciesId.OGERPON]);

    const ogerpon = game.field.getPlayerPokemon();
    expect(ogerpon.formIndex).toBe(tealMaskForm);

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER, BattlerIndex.PLAYER, true);
    await game.phaseInterceptor.to("TeraPhase");

    // ability should not trigger until Ogerpon changes form (after which it checks the new ability)
    expect(ogerpon.isTerastallized).toBe(true);
    expect(ogerpon).not.toHaveAbilityApplied(AbilityId.EMBODY_ASPECT_TEAL);
    expect(ogerpon.formIndex).toBe(tealMaskForm);

    await game.phaseInterceptor.to("QuietFormChangePhase");

    // Embody aspect triggered after form change (queueing stat boost phase)
    expect(ogerpon.formIndex).toBe(embodyAspectTealForm);
    expect(ogerpon).toHaveAbilityApplied(AbilityId.EMBODY_ASPECT_TEAL);

    await game.toNextTurn();

    expect(ogerpon).toHaveStatStage(Stat.SPD, 1);
  });

  it("should activate immediately after Tera if user lacks form changes", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER, BattlerIndex.PLAYER, true);
    await game.phaseInterceptor.to("TeraPhase");

    // ability should trigger immediately due to lack of form change
    expect(feebas.isTerastallized).toBe(true);
    expect(feebas).toHaveAbilityApplied(AbilityId.EMBODY_ASPECT_TEAL);

    await game.toNextTurn();

    expect(feebas).toHaveStatStage(Stat.SPD, 1);
  });

  it("should activate on switch-in if user is Terastallized", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    const [feebas, milotic] = game.scene.getPlayerParty();
    // Feebas, not being tera'd, should not get boost
    expect(feebas.isTerastallized).toBe(false);
    expect(feebas).not.toHaveAbilityApplied(AbilityId.EMBODY_ASPECT_TEAL);

    // fake milotic being tera'd and switch to it
    game.field.forceTera(milotic);
    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(milotic.isOnField()).toBe(true);
    expect(milotic).toHaveAbilityApplied(AbilityId.EMBODY_ASPECT_TEAL);
    expect(milotic).toHaveStatStage(Stat.SPD, 1);
  });
});
