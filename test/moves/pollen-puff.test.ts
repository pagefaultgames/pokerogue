import { getPokemonNameWithAffix } from "#app/messages";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Pollen Puff", () => {
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
      .moveset([MoveId.POLLEN_PUFF])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should not heal more than once when the user has a source of multi-hit", async () => {
    game.override.battleStyle("double").moveset([MoveId.POLLEN_PUFF, MoveId.ENDURE]).ability(AbilityId.PARENTAL_BOND);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.OMANYTE]);

    const [_, rightPokemon] = game.scene.getPlayerField();

    rightPokemon.damageAndUpdate(rightPokemon.hp - 1);

    game.move.select(MoveId.POLLEN_PUFF, 0, BattlerIndex.PLAYER_2);
    game.move.select(MoveId.ENDURE, 1);

    await game.phaseInterceptor.to("BerryPhase");

    // Pollen Puff heals with a ratio of 0.5, as long as Pollen Puff triggers only once the pokemon will always be <= (0.5 * Max HP) + 1
    expect(rightPokemon.hp).toBeLessThanOrEqual(0.5 * rightPokemon.getMaxHp() + 1);
  });

  it("should damage an enemy multiple times when the user has a source of multi-hit", async () => {
    game.override.moveset([MoveId.POLLEN_PUFF]).ability(AbilityId.PARENTAL_BOND).enemyLevel(100);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const target = game.field.getEnemyPokemon();

    game.move.select(MoveId.POLLEN_PUFF);

    await game.phaseInterceptor.to("BerryPhase");

    expect(target.battleData.hitCount).toBe(2);
  });

  // Regression test for pollen puff healing an enemy after dealing damage
  it("should not heal an enemy after dealing damage", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);
    const target = game.field.getEnemyPokemon();
    game.move.use(MoveId.POLLEN_PUFF);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(target.hp).not.toBe(target.getMaxHp());
    expect(game.phaseInterceptor.log).not.toContain("PokemonHealPhase");
  });

  // TODO: Move into heal attr file once pr is merged (moving it here for now to check my fix worked)
  it("should be unable to target Heal Blocked allies, but should work against Heal Blocked enemies", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.BLISSEY, SpeciesId.SNORLAX]);

    const [blissey, snorlax, chansey] = game.scene.getField();
    snorlax.hp = 1;
    snorlax.addTag(BattlerTagType.HEAL_BLOCK);
    chansey.addTag(BattlerTagType.HEAL_BLOCK);
    expect(snorlax).toHaveBattlerTag(BattlerTagType.HEAL_BLOCK);
    expect(chansey).toHaveBattlerTag(BattlerTagType.HEAL_BLOCK);

    // Blissey should not be able to use Pollen Puff on Snorlax (who has heal block), while
    // Snorlax should still be able to target Blissey despite being Heal Blocked themself.
    // Chansey, being an enemy, should be targetable by both
    expect(blissey.isMoveTargetRestricted(MoveId.POLLEN_PUFF, snorlax)).toBe(true);
    expect(snorlax.isMoveTargetRestricted(MoveId.POLLEN_PUFF, blissey)).toBe(false);
    expect(blissey.isMoveTargetRestricted(MoveId.POLLEN_PUFF, chansey)).toBe(false);
    expect(snorlax.isMoveTargetRestricted(MoveId.POLLEN_PUFF, chansey)).toBe(false);

    // Remove heal blocks for the duration of the `CommandPhases`,
    // then re-add them after move selection
    snorlax.removeTag(BattlerTagType.HEAL_BLOCK);
    chansey.removeTag(BattlerTagType.HEAL_BLOCK);

    game.move.use(MoveId.POLLEN_PUFF, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.use(MoveId.POLLEN_PUFF, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.phaseInterceptor.to("EnemyCommandPhase", false);
    snorlax.addTag(BattlerTagType.HEAL_BLOCK);
    chansey.addTag(BattlerTagType.HEAL_BLOCK);
    await game.toEndOfTurn();

    // Ally-targeting PP didn't heal; enemy-targeting PP damaged correctly
    expect(blissey).toHaveUsedMove({ move: MoveId.POLLEN_PUFF, result: MoveResult.FAIL });
    expect(snorlax).toHaveHp(1);
    expect(chansey).not.toHaveFullHp();
    expect(snorlax).toHaveUsedMove({ move: MoveId.POLLEN_PUFF, result: MoveResult.SUCCESS });
    expect(game).toHaveShownMessage(
      i18next.t("battle:moveDisabledHealBlock", {
        pokemonNameWithAffix: getPokemonNameWithAffix(snorlax),
        moveName: allMoves[MoveId.POLLEN_PUFF].name,
      }),
    );
    expect(game).not.toHaveShownMessage(
      i18next.t("battle:moveDisabledHealBlock", {
        pokemonNameWithAffix: getPokemonNameWithAffix(chansey),
        moveName: allMoves[MoveId.POLLEN_PUFF].name,
      }),
    );
    // nobody got actually healed
    expect(game.phaseInterceptor.log).not.toContain("PokemonHealPhase");
  });
});
