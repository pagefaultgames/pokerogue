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
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyLevel(60)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should cause opposing non-OHKO moves to always hit the target", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.TELEKINESIS);
    await game.toNextTurn();

    expect(game).toHaveShownMessage(
      i18next.t("battlerTags:telekinesisOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(enemy),
      }),
    );
    expect(enemy).toHaveBattlerTag(BattlerTagType.TELEKINESIS);
    // This used to re-use Magnet Rise's effect in its prior state, hence why we need to check
    expect(enemy).not.toHaveBattlerTag(BattlerTagType.FLOATING);

    game.move.use(MoveId.ICICLE_CRASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceMiss();
    await game.toEndOfTurn();

    expect(enemy).not.toHaveFullHp();
    expect(player).toHaveUsedMove({ move: MoveId.ICICLE_CRASH, result: MoveResult.SUCCESS });
  });

  it("should forcibly unground the target", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const enemy = game.field.getEnemyPokemon();
    expect(enemy.isGrounded()).toBe(true);

    game.move.use(MoveId.TELEKINESIS);
    await game.toNextTurn();

    expect(enemy.isGrounded()).toBe(false);
  });

  it("should coexist with Magnet Rise", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.TELEKINESIS);
    await game.move.forceEnemyMove(MoveId.MAGNET_RISE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(enemy).toHaveBattlerTag(BattlerTagType.TELEKINESIS);
    expect(enemy).toHaveBattlerTag(BattlerTagType.FLOATING);
    expect(enemy.isGrounded()).toBe(false);
  });

  it("should last 3 turns, including the turn it is used", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.TELEKINESIS);
    await game.toEndOfTurn(false);

    const enemy = game.field.getEnemyPokemon();
    expect(enemy).toHaveBattlerTag({ tagType: BattlerTagType.TELEKINESIS, turnCount: 3 });

    await game.toNextTurn();
    expect(enemy).toHaveBattlerTag({ tagType: BattlerTagType.TELEKINESIS, turnCount: 2 });

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();
    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(enemy).not.toHaveBattlerTag(BattlerTagType.TELEKINESIS);
    expect(game).toHaveShownMessage(
      i18next.t("battlerTags:telekinesisOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(enemy),
      }),
    );
  });

  const cases = ([BattlerTagType.TELEKINESIS, BattlerTagType.IGNORE_FLYING] as const).map(t => ({
    tagType: t,
    name: getEnumStr(BattlerTagType, t),
  }));
  it.each(cases)("should fail if the target already has BattlerTagType.$name", async ({ tagType }) => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const enemy = game.field.getEnemyPokemon();
    enemy.addTag(tagType);

    game.move.use(MoveId.TELEKINESIS);
    await game.toEndOfTurn();

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveUsedMove({ move: MoveId.TELEKINESIS, result: MoveResult.FAIL });
  });

  const invalidSpecies = [...invalidTelekinesisSpecies].map(s => ({
    species: s,
    name: getEnumStr(SpeciesId, s),
  }));
  it.each(invalidSpecies)("should fail if used on $name, but can still be Baton Passed onto one", async ({
    species,
  }) => {
    await game.classicMode.startBattle(species, SpeciesId.FEEBAS);

    const [invalidMon, feebas] = game.scene.getPlayerParty();
    expect(invalidTelekinesisSpecies).toContain(invalidMon.species.speciesId);

    game.move.use(MoveId.TELEPORT);
    game.doSelectPartyPokemon(1);
    await game.move.forceEnemyMove(MoveId.TELEKINESIS);
    await game.toNextTurn();

    // Adding tags directly did not work
    const enemy = game.field.getEnemyPokemon();
    expect(enemy).toHaveUsedMove({ move: MoveId.TELEKINESIS, result: MoveResult.FAIL });

    expect(invalidMon.isOnField()).toBe(false);

    // Turn 2: Transfer Telekinesis from Feebas to the invalid pokemon
    game.move.use(MoveId.BATON_PASS);
    game.doSelectPartyPokemon(1);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(feebas).toHaveBattlerTag(BattlerTagType.TELEKINESIS);

    await game.toEndOfTurn();

    // Should have received tags successfully
    expect(invalidMon.isOnField()).toBe(true);
    expect(invalidMon).toHaveBattlerTag(BattlerTagType.TELEKINESIS);
  });

  it("should still affect enemies transformed into invalid Pokemon", async () => {
    game.override.enemyAbility(AbilityId.IMPOSTER);
    await game.classicMode.startBattle(SpeciesId.DIGLETT);

    const enemy = game.field.getEnemyPokemon();
    expect(enemy.summonData.speciesForm?.speciesId).toBe(SpeciesId.DIGLETT);

    game.move.use(MoveId.TELEKINESIS);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(enemy).toHaveBattlerTag(BattlerTagType.TELEKINESIS);

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveUsedMove({ move: MoveId.TELEKINESIS, result: MoveResult.SUCCESS });
  });

  // TODO: Move to ingrain's test file
  it("should become grounded when Ingrain is used, but not remove the guaranteed hit effect", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.TELEKINESIS);
    await game.toNextTurn();

    game.move.use(MoveId.MUD_SHOT);
    await game.move.forceEnemyMove(MoveId.INGRAIN);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");
    await game.move.forceMiss();
    await game.toEndOfTurn();

    expect(enemy).toHaveBattlerTag(BattlerTagType.TELEKINESIS);
    expect(enemy).toHaveBattlerTag(BattlerTagType.INGRAIN);
    expect(enemy).toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
    expect(enemy).not.toHaveBattlerTag(BattlerTagType.FLOATING);
    expect(enemy.isGrounded()).toBe(true);
    expect(player).toHaveUsedMove({ move: MoveId.MUD_SHOT, result: MoveResult.SUCCESS });
  });

  it("should fail if used against a Mega Gengar, and cannot be Baton Passed onto one", async () => {
    game.override.starterForms({ [SpeciesId.GENGAR]: 1 });
    await game.classicMode.startBattle(SpeciesId.GENGAR, SpeciesId.FEEBAS);

    const [gengar, feebas] = game.scene.getPlayerParty();

    game.move.use(MoveId.TELEPORT);
    game.doSelectPartyPokemon(1);
    await game.move.forceEnemyMove(MoveId.TELEKINESIS);
    await game.toNextTurn();

    // Adding tags directly did not work
    const enemy = game.field.getEnemyPokemon();
    expect(enemy).toHaveUsedMove({ move: MoveId.TELEKINESIS, result: MoveResult.FAIL });

    expect(gengar.isOnField()).toBe(false);

    game.move.use(MoveId.BATON_PASS);
    game.doSelectPartyPokemon(1);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(feebas).toHaveBattlerTag(BattlerTagType.TELEKINESIS);

    await game.toEndOfTurn();

    // Should have not received either tag from baton passing
    expect(gengar.isOnField()).toBe(true);
    expect(gengar).not.toHaveBattlerTag(BattlerTagType.TELEKINESIS);
  });
});
