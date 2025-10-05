import { getPokemonNameWithAffix } from "#app/messages";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result"
import { PositionalTagType } from "#enums/positional-tag-type";
import { SpeciesId } from "#enums/species-id";
import { healBlockedMoves } from "#moves/invalid-moves";
import i18next from "#plugins/i18n";
import { GameManager } from "#test/test-utils/game-manager";
import { toTitleCase } from "#utils/strings";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

// Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/Heal_Block_(move)
describe("Move - Heal Block", () => {
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
      .enemyMoveset(MoveId.HEAL_BLOCK)
      .ability(AbilityId.NO_GUARD)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.BLISSEY)
      .criticalHits(false);
  });

  const blockTestCases = Array.from(healBlockedMoves).map(m => ({
    move: m,
    name: toTitleCase(MoveId[m]),
  }));

  it.each(blockTestCases)("should cause $name to become unselectable by the user", async ({ move }) => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    feebas.addTag(BattlerTagType.HEAL_BLOCK);

    expect(feebas.isMoveSelectable(move)).toEqual([
      false,
      i18next.t("battle:moveDisabledHealBlock", {
        pokemonNameWithAffix: getPokemonNameWithAffix(feebas),
        moveName: allMoves[move].name,
      }),
    ]);
  });

  it("should prevent the target from receiving healing via normal means", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    feebas.hp = 1;
    feebas.addTag(BattlerTagType.HEAL_BLOCK);

    // "Fake" feebas having recieved a 1 hp healing instance
    game.scene.phaseManager.unshiftNew("PokemonHealPhase", BattlerIndex.PLAYER, 1, null);
    game.move.use(MoveId.SPLASH);
    await game.phaseInterceptor.to("PokemonHealPhase");

    expect(feebas).toHaveHp(1);
  });

  it("should prevent Pollen Puff from targeting Heal Blocked allies, but should still work against Heal Blocked enemies", async () => {
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

  it("shouldn't stop Leech Seed from dealing damage, but should nullify healing", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    feebas.hp = 1;
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.LEECH_SEED);
    await game.toNextTurn();

    expect(feebas).toHaveHp(1);
    expect(enemy).not.toHaveFullHp();
  });

  it("shouldn't prevent Leech Seed from damaging the user with Liquid Ooze", async () => {
    game.override.enemyAbility(AbilityId.LIQUID_OOZE);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();

    game.move.use(MoveId.LEECH_SEED);
    await game.toNextTurn();

    expect(feebas).not.toHaveFullHp();
  });

  it("should prevent pending Wishes from restoring HP", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const player = game.field.getPlayerPokemon();
    player.hp = 1;

    game.move.use(MoveId.WISH);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(game).toHavePositionalTag(PositionalTagType.WISH, 1);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.HEAL_BLOCK);
    await game.toEndOfTurn();

    // wish triggered, but did NOT heal the player
    expect(game).not.toHavePositionalTag(PositionalTagType.WISH);
    expect(player).toHaveHp(1);
  });

  it.each([
    { name: "Aqua Ring", move: MoveId.AQUA_RING, tagType: BattlerTagType.AQUA_RING },
    { name: "Ingrain", move: MoveId.INGRAIN, tagType: BattlerTagType.INGRAIN },
  ])("should not cause $name to fail, but should still prevent healing", async ({ move, tagType }) => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    feebas.hp = 1;

    game.move.use(move);
    await game.toEndOfTurn();

    expect(feebas).toHaveBattlerTag(tagType);
    expect(feebas).toHaveHp(1);
  });

  // TODO: Write tests
  it.todo("should not affect Pain Split");
  it.todo("should not affect Regenerator");
});
