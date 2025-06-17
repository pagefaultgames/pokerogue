import { Status } from "#app/data/status-effect";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { QuietFormChangePhase } from "#app/phases/quiet-form-change-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

describe("Abilities - SHIELDS DOWN", () => {
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
    const moveToUse = MoveId.SPLASH;
    game.override
      .battleStyle("single")
      .ability(AbilityId.SHIELDS_DOWN)
      .moveset([moveToUse])
      .enemyMoveset([MoveId.TACKLE]);
  });

  test("check if fainted pokemon switched to base form on arena reset", async () => {
    const meteorForm = 0,
      coreForm = 7;
    game.override.startingWave(4).starterForms({
      [SpeciesId.MINIOR]: coreForm,
    });

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MINIOR]);

    const minior = game.scene.getPlayerParty().find(p => p.species.speciesId === SpeciesId.MINIOR)!;
    expect(minior).not.toBe(undefined);
    expect(minior.formIndex).toBe(coreForm);

    minior.hp = 0;
    minior.status = new Status(StatusEffect.FAINT);
    expect(minior.isFainted()).toBe(true);

    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doSelectModifier();
    await game.phaseInterceptor.to(QuietFormChangePhase);

    expect(minior.formIndex).toBe(meteorForm);
  });

  test("should ignore non-volatile status moves", async () => {
    game.override.enemyMoveset([MoveId.SPORE]);

    await game.classicMode.startBattle([SpeciesId.MINIOR]);
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerPokemon()!.status).toBe(undefined);
  });

  test("should still ignore non-volatile status moves used by a pokemon with mold breaker", async () => {
    game.override.enemyAbility(AbilityId.MOLD_BREAKER).enemyMoveset([MoveId.SPORE]);

    await game.classicMode.startBattle([SpeciesId.MINIOR]);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPORE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerPokemon()!.status).toBe(undefined);
  });

  test("should ignore non-volatile secondary status effects", async () => {
    game.override.enemyMoveset([MoveId.NUZZLE]);

    await game.classicMode.startBattle([SpeciesId.MINIOR]);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerPokemon()!.status).toBe(undefined);
  });

  test("should ignore status moves even through mold breaker", async () => {
    game.override.enemyMoveset([MoveId.SPORE]).enemyAbility(AbilityId.MOLD_BREAKER);

    await game.classicMode.startBattle([SpeciesId.MINIOR]);

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerPokemon()!.status).toBe(undefined);
  });

  // toxic spikes currently does not poison flying types when gravity is in effect
  test.todo("should become poisoned by toxic spikes when grounded", async () => {
    game.override
      .enemyMoveset([MoveId.GRAVITY, MoveId.TOXIC_SPIKES, MoveId.SPLASH])
      .moveset([MoveId.GRAVITY, MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MINIOR]);

    // turn 1
    game.move.select(MoveId.GRAVITY);
    await game.move.selectEnemyMove(MoveId.TOXIC_SPIKES);
    await game.toNextTurn();

    // turn 2
    game.doSwitchPokemon(1);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(SpeciesId.MINIOR);
    expect(game.scene.getPlayerPokemon()!.species.formIndex).toBe(0);
    expect(game.scene.getPlayerPokemon()!.status?.effect).toBe(StatusEffect.POISON);
  });

  test("should ignore yawn", async () => {
    game.override.enemyMoveset([MoveId.YAWN]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MINIOR]);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.YAWN);

    await game.phaseInterceptor.to(TurnEndPhase);
    expect(game.scene.getPlayerPokemon()!.findTag(tag => tag.tagType === BattlerTagType.DROWSY)).toBe(undefined);
  });

  test("should not ignore volatile status effects", async () => {
    game.override.enemyMoveset([MoveId.CONFUSE_RAY]);

    await game.classicMode.startBattle([SpeciesId.MINIOR]);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.CONFUSE_RAY);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerPokemon()!.findTag(tag => tag.tagType === BattlerTagType.CONFUSED)).not.toBe(undefined);
  });

  // the `NoTransformAbilityAbAttr` attribute is not checked anywhere, so this test cannot pass.
  test.todo("ditto should not be immune to status after transforming", async () => {
    game.override.enemySpecies(SpeciesId.DITTO).enemyAbility(AbilityId.IMPOSTER).moveset([MoveId.SPLASH, MoveId.SPORE]);

    await game.classicMode.startBattle([SpeciesId.MINIOR]);

    game.move.select(MoveId.SPORE);
    await game.move.selectEnemyMove(MoveId.SPLASH);

    await game.phaseInterceptor.to(TurnEndPhase);
    expect(game.scene.getEnemyPokemon()!.status?.effect).toBe(StatusEffect.SLEEP);
  });

  test("should not prevent minior from receiving the fainted status effect in trainer battles", async () => {
    game.override
      .enemyMoveset([MoveId.TACKLE])
      .moveset([MoveId.THUNDERBOLT])
      .startingLevel(100)
      .startingWave(5)
      .enemySpecies(SpeciesId.MINIOR);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);
    const minior = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.THUNDERBOLT);
    await game.toNextTurn();
    expect(minior.isFainted()).toBe(true);
    expect(minior.status?.effect).toBe(StatusEffect.FAINT);
  });
});
