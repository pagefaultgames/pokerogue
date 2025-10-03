import { getPokemonNameWithAffix } from "#app/messages";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
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

    game.scene.phaseManager.unshiftNew("PokemonHealPhase", BattlerIndex.PLAYER, 1, null);
    game.move.use(MoveId.SPLASH);
    await game.phaseInterceptor.to("PokemonHealPhase");

    expect(feebas).toHaveHp(1);
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
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.LEECH_SEED);
    await game.toNextTurn();

    expect(feebas).not.toHaveFullHp(1);
    expect(enemy).not.toHaveFullHp();
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
