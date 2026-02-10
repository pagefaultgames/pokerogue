import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { invalidTelekinesisSpecies } from "#moves/invalid-moves";
import { GameManager } from "#test/test-utils/game-manager";
import { getEnumStr } from "#test/test-utils/string-utils";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Telekinesis", () => {
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
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyLevel(60)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should cause opposing non-OHKO moves to always hit the target", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();

    game.move.use(MoveId.TELEKINESIS);
    await game.toNextTurn();

    expect(game).toHaveShownMessage(
      i18next.t("battlerTags:telekinesisOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(karp),
      }),
    );
    expect(karp).toHaveBattlerTag(BattlerTagType.TELEKINESIS);
    // This used to re-use Magnet Rise's effect in its prior state, hence why we need to check
    expect(karp).not.toHaveBattlerTag(BattlerTagType.FLOATING);

    game.move.use(MoveId.ICICLE_CRASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceMiss();
    await game.toEndOfTurn();

    expect(feebas).toHaveUsedMove({ move: MoveId.ICICLE_CRASH, result: MoveResult.SUCCESS });
    expect(karp).not.toHaveFullHp();
  });

  it("should forcibly unground the target", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const karp = game.field.getEnemyPokemon();
    expect(karp.isGrounded()).toBe(true);

    game.move.use(MoveId.TELEKINESIS);
    await game.toNextTurn();

    expect(karp.isGrounded()).toBe(false);
  });

  it("should be capable of coexisting with Magnet Rise", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const karp = game.field.getEnemyPokemon();

    game.move.use(MoveId.TELEKINESIS);
    await game.move.forceEnemyMove(MoveId.MAGNET_RISE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(karp).toHaveBattlerTag(BattlerTagType.TELEKINESIS);
    expect(karp).toHaveBattlerTag(BattlerTagType.FLOATING);
    expect(karp.isGrounded()).toBe(false);
  });

  it("should last 3 turns, including the turn it is used", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.TELEKINESIS);
    await game.toEndOfTurn(false);

    const karp = game.field.getEnemyPokemon();
    expect(karp).toHaveBattlerTag({ tagType: BattlerTagType.TELEKINESIS, turnCount: 3 });

    await game.toNextTurn();
    expect(karp).toHaveBattlerTag({ tagType: BattlerTagType.TELEKINESIS, turnCount: 2 });

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();
    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(karp).not.toHaveBattlerTag(BattlerTagType.TELEKINESIS);
    expect(game).toHaveShownMessage(
      i18next.t("battlerTags:telekinesisOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(karp),
      }),
    );
  });

  const cases = ([BattlerTagType.TELEKINESIS, BattlerTagType.IGNORE_FLYING] as const).map(t => ({
    tagType: t,
    name: getEnumStr(BattlerTagType, t),
  }));
  it.each(cases)("should fail if the target already has BattlerTagType.$name", async ({ tagType }) => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const karp = game.field.getEnemyPokemon();
    karp.addTag(tagType);

    game.move.use(MoveId.TELEKINESIS);
    await game.toEndOfTurn();

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveUsedMove({ move: MoveId.TELEKINESIS, result: MoveResult.FAIL });
  });

  it("should fail if used on an invalid species, but can still be Baton Passed onto one", async () => {
    await game.classicMode.startBattle(SpeciesId.DIGLETT, SpeciesId.FEEBAS);

    const [diglett, feebas] = game.scene.getPlayerParty();
    expect(invalidTelekinesisSpecies).toContain(diglett.species.speciesId);

    game.move.use(MoveId.TELEPORT);
    game.doSelectPartyPokemon(1);
    await game.move.forceEnemyMove(MoveId.TELEKINESIS);
    await game.toNextTurn();

    // Adding tags directly did not work
    const karp = game.field.getEnemyPokemon();
    expect(karp).toHaveUsedMove({ move: MoveId.TELEKINESIS, result: MoveResult.FAIL });

    expect(diglett.isOnField()).toBe(false);

    // Transfer Telekinesis from Feebas to the invalid pokemon
    game.move.use(MoveId.BATON_PASS);
    game.doSelectPartyPokemon(1);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(feebas).toHaveBattlerTag(BattlerTagType.TELEKINESIS);

    await game.toEndOfTurn();

    // Should have received tags successfully
    expect(diglett.isOnField()).toBe(true);
    expect(diglett).toHaveBattlerTag(BattlerTagType.TELEKINESIS);
  });

  it("should still affect enemies transformed into invalid Pokemon", async () => {
    game.override.enemyAbility(AbilityId.IMPOSTER);
    await game.classicMode.startBattle(SpeciesId.DIGLETT);

    const karp = game.field.getEnemyPokemon();
    expect(karp.summonData.speciesForm?.speciesId).toBe(SpeciesId.DIGLETT);

    game.move.use(MoveId.TELEKINESIS);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveUsedMove({ move: MoveId.TELEKINESIS, result: MoveResult.SUCCESS });
    expect(karp).toHaveBattlerTag(BattlerTagType.TELEKINESIS);
  });

  it("should fail if used against a Mega Gengar, and cannot be Baton Passed onto one", async () => {
    game.override.starterForms({ [SpeciesId.GENGAR]: 1 });
    await game.classicMode.startBattle(SpeciesId.GENGAR, SpeciesId.FEEBAS);

    const [gengar, feebas] = game.scene.getPlayerParty();

    game.move.use(MoveId.TELEPORT);
    game.doSelectPartyPokemon(1);
    await game.move.forceEnemyMove(MoveId.TELEKINESIS);
    await game.toNextTurn();

    // Adding tags directly should have failed
    const karp = game.field.getEnemyPokemon();
    expect(karp).toHaveUsedMove({ move: MoveId.TELEKINESIS, result: MoveResult.FAIL });
    expect(gengar.isOnField()).toBe(false);

    game.move.use(MoveId.BATON_PASS);
    game.doSelectPartyPokemon(1);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(feebas).toHaveBattlerTag(BattlerTagType.TELEKINESIS);

    await game.toEndOfTurn();

    // Should have not received either effect from baton passing
    expect(gengar.isOnField()).toBe(true);
    expect(gengar).not.toHaveBattlerTag(BattlerTagType.TELEKINESIS);
    expect(gengar.isGrounded()).toBe(true);
  });
});
