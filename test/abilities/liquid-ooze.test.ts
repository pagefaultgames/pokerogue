import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Liquid Ooze", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .enemyLevel(20)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.LIQUID_OOZE)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should reverse the effect of HP-draining moves", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.GIGA_DRAIN);
    await game.toEndOfTurn();

    const karp = game.field.getEnemyPokemon();
    // make sure the attack actually did damage
    expect(karp).not.toHaveFullHp();
    expect(karp).toHaveAbilityApplied(AbilityId.LIQUID_OOZE);

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveTakenDamage(karp.getInverseHp() / 2);
    expect(game).toHaveShownMessage(
      i18next.t("abilityTriggers:reverseDrain", { pokemonNameWithAffix: getPokemonNameWithAffix(feebas) }),
    );
  });

  it("should not drain the attacker's HP if it ignores indirect damage", async () => {
    game.override.ability(AbilityId.MAGIC_GUARD);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.GIGA_DRAIN);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveFullHp();
  });

  // Regression test
  it("should not apply if suppressed", async () => {
    game.override.ability(AbilityId.NEUTRALIZING_GAS);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.GIGA_DRAIN);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveFullHp();
  });

  // TODO: Write test
  it.todo("should reverse drains from Leech Seed", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();
    karp.addTag(BattlerTagType.LEECH_SEED, 0, undefined, feebas.id);
    expect(karp).toHaveBattlerTag(BattlerTagType.LEECH_SEED);

    karp.lapseTag(BattlerTagType.LEECH_SEED);

    expect(karp).not.toHaveFullHp();
    expect(karp).toHaveAbilityApplied(AbilityId.LIQUID_OOZE);

    expect(feebas).toHaveTakenDamage(karp.getInverseHp() / 2);
    expect(game).toHaveShownMessage(
      i18next.t("abilityTriggers:reverseDrain", { pokemonNameWithAffix: getPokemonNameWithAffix(feebas) }),
    );
  });

  // TODO: Write test after modifier rework
  it.todo("should apply Healing Charms while rounding down");
});
