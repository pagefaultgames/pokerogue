import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Shields Down", () => {
  const redMeteorForm = 0;
  const redCoreForm = 7;
  const orangeCoreForm = 8;

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
      .ability(AbilityId.SHIELDS_DOWN)
      .enemySpecies(SpeciesId.PSYDUCK)
      .enemyMoveset(MoveId.SPLASH);
  });

  it.each([0, 1, 2, 3, 4, 5, 6])(
    "should change from Meteor Form to Core Form on entry/turn end based on HP - form index %i",
    async meteorIndex => {
      game.override.starterForms({
        // Start in meteor form
        [SpeciesId.MINIOR]: meteorIndex,
      });

      await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MINIOR]);

      const minior = game.scene.getPlayerParty()[1];
      expect(minior.formIndex).toBe(meteorIndex);
      minior.hp *= 0.49;

      // Switch to minior - should change to Core due to being <50% HP
      game.doSwitchPokemon(1);
      await game.toNextTurn();

      expect(minior.formIndex).toBe(meteorIndex + 7);

      // Use roost to regain 50% HP; should transform back into Meteor Form at turn end
      game.move.use(MoveId.ROOST);
      await game.toNextTurn();

      expect(minior.formIndex).toBe(meteorIndex);
    },
  );

  it("should revert to base form on arena reset, even when fainted", async () => {
    game.override.startingWave(4).starterForms({
      [SpeciesId.MINIOR]: redCoreForm,
    });
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MINIOR]);

    const minior = game.scene.getPlayerParty()[1];
    expect(minior.formIndex).toBe(redCoreForm);

    minior.hp = 0;
    minior.status = new Status(StatusEffect.FAINT);
    expect(minior.isFainted()).toBe(true);

    game.move.use(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.toEndOfTurn();
    game.doSelectModifier();
    await game.phaseInterceptor.to("QuietFormChangePhase");

    expect(minior.formIndex).toBe(redMeteorForm);
  });

  // TODO: Move to mold breaker test file
  it("should ignore Mold Breaker", async () => {
    game.override.enemyAbility(AbilityId.MOLD_BREAKER).enemyMoveset([MoveId.SPORE]);

    await game.classicMode.startBattle([SpeciesId.MINIOR]);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SPORE);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveStatusEffect(StatusEffect.NONE);
  });

  it("should ignore non-volatile status effects & Yawn in Meteor Form", async () => {
    await game.classicMode.startBattle([SpeciesId.MINIOR]);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.NUZZLE);
    await game.toNextTurn();

    const minior = game.field.getPlayerPokemon();
    expect(minior).toHaveStatusEffect(StatusEffect.NONE);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.YAWN);
    await game.toEndOfTurn();

    // TODO: Yawn doesn't fail ATM when failing to be added
    // expect(game.field.getEnemyPokemon()).toHaveUsedMove({ move: MoveId.YAWN, result: MoveResult.FAIL });
    expect(minior).not.toHaveBattlerTag(BattlerTagType.DROWSY);
  });

  it("should not ignore non-volatile status effects & Yawn in Core Form", async () => {
    await game.classicMode.startBattle([SpeciesId.MINIOR]);

    // Drop minior to below half to prevent reverting to Core Form
    const minior = game.field.getPlayerPokemon();
    minior.hp *= 0.49;
    minior.formIndex = orangeCoreForm;

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.NUZZLE);
    await game.toEndOfTurn();

    expect(minior).toHaveStatusEffect(StatusEffect.PARALYSIS);

    minior.clearStatus(false, false);
    expect(minior).toHaveStatusEffect(StatusEffect.NONE);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.YAWN);
    await game.toEndOfTurn();

    expect(game.field.getEnemyPokemon()).toHaveUsedMove({ move: MoveId.YAWN, result: MoveResult.SUCCESS });
    expect(minior).toHaveBattlerTag(BattlerTagType.DROWSY);
  });

  // TODO: Gravity does not make a Pokemon be considered as "grounded" for hazards
  it.todo("should be poisoned by toxic spikes when Gravity is active before changing forms", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MINIOR]);

    // Change minior to Core form in a state where it would revert to Meteor form on switch
    const minior = game.scene.getPlayerParty()[1];
    minior.formIndex = redCoreForm;

    game.move.use(MoveId.GRAVITY);
    await game.move.forceEnemyMove(MoveId.TOXIC_SPIKES);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(minior.isOnField()).toBe(true);
    expect(minior.formIndex).toBe(redMeteorForm);
    expect(minior.isGrounded()).toBe(true);
    expect(minior).toHaveStatusEffect(StatusEffect.POISON);
  });

  it("should not ignore volatile status effects", async () => {
    game.override.enemyMoveset([MoveId.CONFUSE_RAY]);

    await game.classicMode.startBattle([SpeciesId.MINIOR]);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.CONFUSE_RAY);

    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveBattlerTag(BattlerTagType.CONFUSED);
  });

  // TODO: The `NoTransformAbilityAbAttr` attribute is not checked anywhere, so this test cannot pass.
  // TODO: Move this to a transform test
  it.todo("should not activate when transformed", async () => {
    game.override.enemyAbility(AbilityId.IMPOSTER);
    await game.classicMode.startBattle([SpeciesId.MINIOR]);

    game.move.use(MoveId.SPORE);
    await game.toEndOfTurn();

    expect(game.field.getEnemyPokemon()).toHaveStatusEffect(StatusEffect.SLEEP);
  });
});
