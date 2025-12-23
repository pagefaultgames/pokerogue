import { getPokemonNameWithAffix } from "#app/messages";
import { getTypeDamageMultiplier } from "#data/type";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Tar Shot", () => {
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
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyLevel(1000)
      .criticalHits(false);
  });

  it("should lower the target's Speed by 1 stage and double the effectiveness of incoming Fire-type moves", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const karp = game.field.getEnemyPokemon();
    const spy = vi.spyOn(karp, "getMoveEffectiveness");

    game.move.use(MoveId.TAR_SHOT);
    await game.toNextTurn();

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveUsedMove({ move: MoveId.TAR_SHOT, result: MoveResult.SUCCESS });
    expect(karp).toHaveStatStage(Stat.SPD, -1);
    expect(karp).toHaveBattlerTag(BattlerTagType.TAR_SHOT);
    expect(game).toHaveShownMessage(
      i18next.t("battlerTags:tarShotOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(karp),
      }),
    );

    game.move.use(MoveId.FIRE_PUNCH);
    await game.toEndOfTurn();

    expect(spy).toHaveLastReturnedWith(2 * getTypeDamageMultiplier(PokemonType.FIRE, PokemonType.WATER));
  });

  it("should still lower speed if tag cannot be applied", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const karp = game.field.getEnemyPokemon();
    karp.addTag(BattlerTagType.TAR_SHOT);
    karp.setStatStage(Stat.SPD, -1);
    const oldTag = karp.getTag(BattlerTagType.TAR_SHOT);

    game.move.use(MoveId.TAR_SHOT);
    await game.toNextTurn();

    // should be same tag as prior
    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveUsedMove({ move: MoveId.TAR_SHOT, result: MoveResult.SUCCESS });
    expect(karp).toHaveStatStage(Stat.SPD, -2);
    expect(karp).toHaveBattlerTag(oldTag);
  });

  it("should not be able to add its tag to a Terastallized target", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const karp = game.field.getEnemyPokemon();
    game.field.forceTera(karp, PokemonType.BUG);

    game.move.use(MoveId.TAR_SHOT);
    await game.toNextTurn();

    expect(karp).toHaveStatStage(Stat.SPD, -1);
    expect(karp).not.toHaveBattlerTag(BattlerTagType.TAR_SHOT);
  });

  // TODO: Move failure processing is broken, most notably for moves with multiple independent effects
  it.todo("should fail if both the tag and speed drop cannot be applied");

  it("should still work if applied before Terastallization", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const karp = game.field.getEnemyPokemon();
    karp.addTag(BattlerTagType.TAR_SHOT);
    karp.teraType = PokemonType.BUG;
    const spy = vi.spyOn(karp, "getMoveEffectiveness");

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SPLASH, undefined, true);
    await game.toNextTurn();

    // tag should still be there
    expect(karp.isTerastallized).toBe(true);
    expect(karp).toHaveBattlerTag(BattlerTagType.TAR_SHOT);

    game.move.use(MoveId.FIRE_PUNCH);
    await game.toEndOfTurn();

    expect(spy).toHaveLastReturnedWith(2 * getTypeDamageMultiplier(PokemonType.FIRE, PokemonType.BUG));
  });

  // Regression test - Tar Shot used to check the target's type change abilities instead of the user's
  it("should work if the target has Normalize", async () => {
    game.override.enemyAbility(AbilityId.NORMALIZE);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const karp = game.field.getEnemyPokemon();
    karp.addTag(BattlerTagType.TAR_SHOT);
    const spy = vi.spyOn(karp, "getMoveEffectiveness");

    game.move.use(MoveId.FIRE_PUNCH);
    await game.toEndOfTurn();

    expect(spy).toHaveLastReturnedWith(2 * getTypeDamageMultiplier(PokemonType.FIRE, PokemonType.WATER));
  });
});
