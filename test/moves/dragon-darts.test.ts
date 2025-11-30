import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import type { Pokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Move - Dragon Darts", () => {
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
      .battleStyle("double")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should hit the same enemy twice in a single battle", async () => {
    game.override.battleStyle("single");
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();
    const hitSpy = vi.spyOn(karp, "damageAndUpdate");

    game.move.use(MoveId.DRAGON_DARTS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase", false);

    expect(feebas.turnData.hitCount).toBe(2);
    expect(karp).not.toHaveFullHp();
    expect(hitSpy).toHaveBeenCalledTimes(2);
  });

  it("should hit both enemies once each in a double battle", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    const [karp1, karp2] = game.scene.getEnemyField();

    game.move.use(MoveId.DRAGON_DARTS, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("MoveEndPhase", false);

    expect(feebas.turnData.hitCount).toBe(2);
    expect(karp1).not.toHaveFullHp();
    expect(karp2).not.toHaveFullHp();
  });

  it("should not be protected against by Wide Guard", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const [karp1, karp2] = game.scene.getEnemyField();

    game.move.use(MoveId.DRAGON_DARTS);
    await game.move.forceEnemyMove(MoveId.WIDE_GUARD);
    await game.toEndOfTurn();

    expect(karp1).not.toHaveFullHp();
    expect(karp2).not.toHaveFullHp();
    expect(feebas).toHaveUsedMove({
      move: MoveId.DRAGON_DARTS,
      targets: [BattlerIndex.ENEMY, BattlerIndex.ENEMY_2],
      result: MoveResult.SUCCESS,
    });
  });

  it("should hit the user's ally twice if aimed at them", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    const [feebas, milotic] = game.scene.getPlayerField();
    const [karp1, karp2] = game.scene.getEnemyField();

    game.move.use(MoveId.DRAGON_DARTS, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.toEndOfTurn();

    expect(feebas).toHaveFullHp();
    expect(milotic).not.toHaveFullHp();
    expect(karp1).toHaveFullHp();
    expect(karp2).toHaveFullHp();
  });

  it.each<{ reason: string; callback: (immuneTarget: Pokemon) => void }>([
    { reason: "its ally is type immune", callback: p => game.field.forceTera(p, PokemonType.FAIRY) },
    { reason: "its ally is protected", callback: p => p.addTag(BattlerTagType.PROTECTED, 1) },
    { reason: "its ally is semi-invulnerable", callback: p => p.addTag(BattlerTagType.FLYING, 1) },
    { reason: "has an ability-based immunity", callback: p => game.field.mockAbility(p, AbilityId.WONDER_GUARD) },
  ])("should hit an opponent twice if $reason", async ({ callback }) => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const [karp1, karp2] = game.scene.getEnemyField();
    callback(karp2);

    game.move.use(MoveId.DRAGON_DARTS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    for (let i = 0; i < 2; i++) {
      await game.phaseInterceptor.to("MoveEffectPhase");
      expect(karp1).not.toHaveFullHp();
      expect(karp2).toHaveFullHp();
      karp1.hp = karp1.getMaxHp();
    }
  });

  it("should hit an enemy twice if it would miss the first target", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const [karp1, karp2] = game.scene.getEnemyField();

    game.move.use(MoveId.DRAGON_DARTS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    for (let i = 0; i < 2; i++) {
      await game.phaseInterceptor.to("MoveEffectPhase");
      expect(karp1).not.toHaveFullHp();
      expect(karp2).toHaveFullHp();
      karp1.hp = karp1.getMaxHp();
    }
  });

  it("should respect redirection moves", async () => {
    const feebas = game.field.getPlayerPokemon();
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const [karp1, karp2] = game.scene.getEnemyField();

    game.move.use(MoveId.DRAGON_DARTS);
    await game.move.forceEnemyMove(MoveId.FOLLOW_ME);
    await game.toEndOfTurn();

    expect(karp1).not.toHaveFullHp();
    expect(karp2).toHaveFullHp();
    expect(feebas).toHaveUsedMove({ move: MoveId.DRAGON_DARTS, targets: [BattlerIndex.ENEMY] });
  });

  it("should respect redirection moves", async () => {
    const feebas = game.field.getPlayerPokemon();
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const [karp1, karp2] = game.scene.getEnemyField();

    game.move.use(MoveId.DRAGON_DARTS);
    await game.move.forceEnemyMove(MoveId.FOLLOW_ME);
    await game.toEndOfTurn();

    expect(karp1).not.toHaveFullHp();
    expect(karp2).toHaveFullHp();
    expect(feebas).toHaveUsedMove({ move: MoveId.DRAGON_DARTS, targets: [BattlerIndex.ENEMY] });
  });

  it("should hit the targeted enemy's ally if both are immune, but only trigger effects once", async () => {
    const feebas = game.field.getPlayerPokemon();
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const [karp1, karp2] = game.scene.getEnemyField();
    // give enemies distinct names for debugging and to ensure locales work
    karp1.name = "Karp 1";
    karp2.name = "Karp 2";

    game.move.use(MoveId.DRAGON_DARTS);
    await game.move.forceEnemyMove(MoveId.PROTECT);
    await game.move.forceEnemyMove(MoveId.PROTECT);
    await game.toEndOfTurn();

    expect(karp1).toHaveFullHp();
    expect(karp2).toHaveFullHp();
    expect(feebas).toHaveUsedMove({
      move: MoveId.DRAGON_DARTS,
      targets: [BattlerIndex.ENEMY_2],
      result: MoveResult.MISS,
    });

    // Protect message was shown exactly once for the other opponent only
    const protectMsg1 = i18next.t("battlerTags:protectedLapse", {
      pokemonNameWithAffix: getPokemonNameWithAffix(karp1),
    });
    const protectMsg2 = i18next.t("battlerTags:protectedLapse", {
      pokemonNameWithAffix: getPokemonNameWithAffix(karp2),
    });
    expect(game).not.toHaveShownMessage(protectMsg1);
    expect(game.textInterceptor.logs.filter(log => log === protectMsg2)).toHaveLength(1);
  });

  // TODO: This is borked
  it.todo("should not trigger ability effects when redirecting", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const [karp1, karp2] = game.scene.getEnemyField();
    game.field.mockAbility(karp2, AbilityId.VOLT_ABSORB);

    game.move.use(MoveId.DRAGON_DARTS, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.ELECTRIFY, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.toEndOfTurn();

    // karp 2 should have not applied the ability
    expect(karp1).not.toHaveFullHp();
    expect(karp2).not.toHaveAbilityApplied(AbilityId.VOLT_ABSORB);
    expect(karp2).toHaveFullHp();
  });

  it("should redirect the 2nd strike upon fainting the first target", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const [karp1, karp2] = game.scene.getEnemyField();
    karp1.hp = 1;

    game.move.use(MoveId.DRAGON_DARTS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.toEndOfTurn();

    expect(karp1).toHaveFainted();
    expect(karp2).not.toHaveFullHp();
  });

  // TODO: rework Pressure and implement this interaction
  it.todo("should deduct 1 extra PP for each targeted enemy with Pressure");

  // TODO: called moves currently ignore Prankster dark-type immunity
  it.todo("should respect immunity from Dark types when invoked by a Prankster-boosted Metronome");

  // TODO: This interaction is bugged due to Wimp Out being an ungodly mess that barely works
  it.todo("should activate a target's Wimp Out with only the first hit");
});
