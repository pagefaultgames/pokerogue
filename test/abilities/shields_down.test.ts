import { Status } from "#app/data/status-effect";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { QuietFormChangePhase } from "#app/phases/quiet-form-change-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
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
    const moveToUse = Moves.SPLASH;
    game.override.battleStyle("single");
    game.override.ability(Abilities.SHIELDS_DOWN);
    game.override.moveset([moveToUse]);
    game.override.enemyMoveset([Moves.TACKLE]);
  });

  test("check if fainted pokemon switched to base form on arena reset", async () => {
    const meteorForm = 0,
      coreForm = 7;
    game.override.startingWave(4);
    game.override.starterForms({
      [Species.MINIOR]: coreForm,
    });

    await game.classicMode.startBattle([Species.MAGIKARP, Species.MINIOR]);

    const minior = game.scene.getPlayerParty().find(p => p.species.speciesId === Species.MINIOR)!;
    expect(minior).not.toBe(undefined);
    expect(minior.formIndex).toBe(coreForm);

    minior.hp = 0;
    minior.status = new Status(StatusEffect.FAINT);
    expect(minior.isFainted()).toBe(true);

    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doSelectModifier();
    await game.phaseInterceptor.to(QuietFormChangePhase);

    expect(minior.formIndex).toBe(meteorForm);
  });

  test("should ignore non-volatile status moves", async () => {
    game.override.enemyMoveset([Moves.SPORE]);

    await game.classicMode.startBattle([Species.MINIOR]);
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerPokemon()!.status).toBe(undefined);
  });

  test("should still ignore non-volatile status moves used by a pokemon with mold breaker", async () => {
    game.override.enemyAbility(Abilities.MOLD_BREAKER);
    game.override.enemyMoveset([Moves.SPORE]);

    await game.classicMode.startBattle([Species.MINIOR]);

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPORE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerPokemon()!.status).toBe(undefined);
  });

  test("should ignore non-volatile secondary status effects", async () => {
    game.override.enemyMoveset([Moves.NUZZLE]);

    await game.classicMode.startBattle([Species.MINIOR]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerPokemon()!.status).toBe(undefined);
  });

  test("should ignore status moves even through mold breaker", async () => {
    game.override.enemyMoveset([Moves.SPORE]);
    game.override.enemyAbility(Abilities.MOLD_BREAKER);

    await game.classicMode.startBattle([Species.MINIOR]);

    game.move.select(Moves.SPLASH);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerPokemon()!.status).toBe(undefined);
  });

  // toxic spikes currently does not poison flying types when gravity is in effect
  test.todo("should become poisoned by toxic spikes when grounded", async () => {
    game.override.enemyMoveset([Moves.GRAVITY, Moves.TOXIC_SPIKES, Moves.SPLASH]);
    game.override.moveset([Moves.GRAVITY, Moves.SPLASH]);

    await game.classicMode.startBattle([Species.MAGIKARP, Species.MINIOR]);

    // turn 1
    game.move.select(Moves.GRAVITY);
    await game.forceEnemyMove(Moves.TOXIC_SPIKES);
    await game.toNextTurn();

    // turn 2
    game.doSwitchPokemon(1);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.MINIOR);
    expect(game.scene.getPlayerPokemon()!.species.formIndex).toBe(0);
    expect(game.scene.getPlayerPokemon()!.status?.effect).toBe(StatusEffect.POISON);
  });

  test("should ignore yawn", async () => {
    game.override.enemyMoveset([Moves.YAWN]);

    await game.classicMode.startBattle([Species.MAGIKARP, Species.MINIOR]);

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.YAWN);

    await game.phaseInterceptor.to(TurnEndPhase);
    expect(game.scene.getPlayerPokemon()!.findTag(tag => tag.tagType === BattlerTagType.DROWSY)).toBe(undefined);
  });

  test("should not ignore volatile status effects", async () => {
    game.override.enemyMoveset([Moves.CONFUSE_RAY]);

    await game.classicMode.startBattle([Species.MINIOR]);

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.CONFUSE_RAY);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerPokemon()!.findTag(tag => tag.tagType === BattlerTagType.CONFUSED)).not.toBe(undefined);
  });

  // the `NoTransformAbilityAbAttr` attribute is not checked anywhere, so this test cannot pass.
  test.todo("ditto should not be immune to status after transforming", async () => {
    game.override.enemySpecies(Species.DITTO);
    game.override.enemyAbility(Abilities.IMPOSTER);
    game.override.moveset([Moves.SPLASH, Moves.SPORE]);

    await game.classicMode.startBattle([Species.MINIOR]);

    game.move.select(Moves.SPORE);
    await game.forceEnemyMove(Moves.SPLASH);

    await game.phaseInterceptor.to(TurnEndPhase);
    expect(game.scene.getEnemyPokemon()!.status?.effect).toBe(StatusEffect.SLEEP);
  });

  test("should not prevent minior from receiving the fainted status effect in trainer battles", async () => {
    game.override.enemyMoveset([Moves.TACKLE]);
    game.override.moveset([Moves.THUNDERBOLT]);
    game.override.startingLevel(100);
    game.override.startingWave(5);
    game.override.enemySpecies(Species.MINIOR);
    await game.classicMode.startBattle([Species.REGIELEKI]);
    const minior = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.THUNDERBOLT);
    await game.toNextTurn();
    expect(minior.isFainted()).toBe(true);
    expect(minior.status?.effect).toBe(StatusEffect.FAINT);
  });
});
