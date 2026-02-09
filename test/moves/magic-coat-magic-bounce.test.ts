import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Reflecting effects", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.MAGIC_COAT);
  });

  describe("Reflecting effects", () => {
    it("should reflect basic status moves, copying them against the user", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(MoveId.GROWL);
      await game.toEndOfTurn();

      const enemy = game.field.getEnemyPokemon();
      expect(enemy).toHaveUsedMove({
        move: MoveId.GROWL,
        useMode: MoveUseMode.REFLECTED,
        targets: [BattlerIndex.PLAYER],
      });
      const feebas = game.field.getPlayerPokemon();
      expect(feebas).toHaveStatStage(Stat.ATK, -1);
    });

    it("should bounce back multi-target moves against each target individually", async () => {
      game.override.battleStyle("double");
      await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

      game.move.use(MoveId.GROWL, BattlerIndex.PLAYER);
      game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
      await game.toEndOfTurn();

      const [feebas, milotic, karp1, karp2] = game.scene.getField();
      expect(karp1).toHaveUsedMove({
        move: MoveId.GROWL,
        useMode: MoveUseMode.REFLECTED,
        targets: [BattlerIndex.PLAYER, BattlerIndex.PLAYER_2],
      });
      expect(karp2).toHaveUsedMove({
        move: MoveId.GROWL,
        useMode: MoveUseMode.REFLECTED,
        targets: [BattlerIndex.PLAYER, BattlerIndex.PLAYER_2],
      });
      expect(feebas).toHaveStatStage(Stat.ATK, -2);
      expect(milotic).toHaveStatStage(Stat.ATK, -2);
    });

    // TODO: This is broken - failed moves never make it to a MEP in the first place
    it.todo("should still bounce back a move that would otherwise fail", async () => {
      game.override.enemyAbility(AbilityId.INSOMNIA);
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(MoveId.YAWN);
      await game.toEndOfTurn();

      expect(game.field.getPlayerPokemon()).toHaveBattlerTag(BattlerTagType.DROWSY);
    });

    it("should not bounce back a move that was just bounced", async () => {
      game.override.ability(AbilityId.MAGIC_BOUNCE);
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(MoveId.GROWL);
      await game.toEndOfTurn();

      expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.ATK, 0);
    });

    it("should take precedence over Mirror Armor", async () => {
      game.override.enemyAbility(AbilityId.MIRROR_ARMOR);
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(MoveId.GROWL);
      await game.toEndOfTurn();

      const karp = game.field.getPlayerPokemon();
      expect(karp).toHaveStatStage(Stat.ATK, -1);
      expect(karp).not.toHaveAbilityApplied(AbilityId.MIRROR_ARMOR);
    });

    it("should not bounce back non-reflectable effects", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(MoveId.SALT_CURE);
      await game.toEndOfTurn();

      expect(game.field.getEnemyPokemon()).toHaveBattlerTag(BattlerTagType.SALT_CURED);
    });

    it("should not break encore after bouncing", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      const feebas = game.field.getPlayerPokemon();
      const karp = game.field.getEnemyPokemon();

      // Give the player MOLD_BREAKER for this turn to bypass Magic Bounce.
      const playerAbilitySpy = game.field.mockAbility(feebas, AbilityId.MOLD_BREAKER);

      // turn 1
      game.move.use(MoveId.ENCORE);
      await game.move.forceEnemyMove(MoveId.TACKLE);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toNextTurn();

      expect(karp).toHaveBattlerTag({ tagType: BattlerTagType.ENCORE, moveId: MoveId.TACKLE });

      // turn 2
      playerAbilitySpy.mockRestore();

      game.move.use(MoveId.GROWL);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toEndOfTurn();

      expect(karp).toHaveBattlerTag({ tagType: BattlerTagType.ENCORE, moveId: MoveId.TACKLE });
      expect(karp).toHaveUsedMove(MoveId.TACKLE);
    });

    // TODO: Move to Stomping Tantrum test file
    it("should boost stomping tantrum after a failed bounce", async () => {
      game.override.ability(AbilityId.INSOMNIA);
      await game.classicMode.startBattle(SpeciesId.AMOONGUSS);

      const karp = game.field.getEnemyPokemon();
      const powerSpy = vi.spyOn(allMoves[MoveId.STOMPING_TANTRUM], "calculateBattlePower");

      // Spore gets reflected back onto us and fails
      game.move.use(MoveId.SPORE);
      await game.move.forceEnemyMove(MoveId.MAGIC_COAT);
      await game.toNextTurn();

      expect(karp).toHaveUsedMove({ move: MoveId.SPORE, result: MoveResult.MISS, useMode: MoveUseMode.REFLECTED });

      game.move.use(MoveId.SPLASH);
      await game.move.forceEnemyMove(MoveId.STOMPING_TANTRUM);
      await game.toEndOfTurn();

      expect(powerSpy).toHaveReturnedWith(150);
    });

    // TODO: The immunities are respected, but most reflectable moves won't count as failed
    // due to condition jank
    it.todo("should respect immunities when bouncing a move", async () => {
      vi.spyOn(allMoves[MoveId.THUNDER_WAVE], "accuracy", "get").mockReturnValue(100);
      game.override.ability(AbilityId.SOUNDPROOF);
      await game.classicMode.startBattle(SpeciesId.PIKACHU);

      const pikachu = game.field.getPlayerPokemon();
      const karp = game.field.getEnemyPokemon();

      // Turn 1 - thunder wave immunity test
      game.move.use(MoveId.THUNDER_WAVE);
      await game.toNextTurn();

      expect(karp).toHaveUsedMove({
        move: MoveId.THUNDER_WAVE,
        result: MoveResult.FAIL,
        useMode: MoveUseMode.REFLECTED,
      });
      expect(pikachu).toHaveStatusEffect(StatusEffect.NONE);

      // Turn 2 - soundproof immunity test
      game.move.use(MoveId.GROWL);
      await game.toEndOfTurn();

      expect(karp).toHaveUsedMove({ move: MoveId.GROWL, result: MoveResult.FAIL, useMode: MoveUseMode.REFLECTED });
      expect(pikachu).toHaveStatStage(Stat.ATK, 0);
    });

    it("should ignore the original move's accuracy and use the user's accuracy instead", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      const feebas = game.field.getPlayerPokemon();
      const karp = game.field.getEnemyPokemon();
      const karpMissSpy = vi.spyOn(feebas, "getAccuracyMultiplier").mockReturnValue(0);

      // Turn 1: Force a miss on initial move; should reflect regardless
      game.move.use(MoveId.SPORE);
      await game.phaseInterceptor.to("MoveEndPhase");
      await game.toEndOfTurn();

      expect(karp).toHaveUsedMove({ move: MoveId.SPORE, result: MoveResult.SUCCESS, useMode: MoveUseMode.REFLECTED });
      expect(feebas).toHaveStatusEffect(StatusEffect.SLEEP);

      // Turn 2: Force a miss on enemy's reflected move
      feebas.clearStatus(false, false);
      karpMissSpy.mockRestore();
      vi.spyOn(karp, "getAccuracyMultiplier").mockReturnValue(0);

      game.move.use(MoveId.SPORE);
      await game.toEndOfTurn();

      expect(karp).toHaveUsedMove({ move: MoveId.SPORE, result: MoveResult.MISS, useMode: MoveUseMode.REFLECTED });
      expect(feebas).toHaveStatusEffect(StatusEffect.NONE);
    });
  });

  describe("Magic Bounce", () => {
    beforeEach(() => {
      game.override.enemyAbility(AbilityId.MAGIC_BOUNCE).enemyMoveset(MoveId.SPLASH);
    });

    it("should not bounce back status moves against semi-invulnerable Pokemon, even with No Guard", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      const feebas = game.field.getPlayerPokemon();
      const karp = game.field.getEnemyPokemon();

      // Turn 1: use charm while enemy is airborne; misses
      game.move.use(MoveId.CHARM);
      await game.move.forceEnemyMove(MoveId.FLY);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toNextTurn();

      expect(feebas).toHaveStatStage(Stat.ATK, 0);
      expect(karp).toHaveStatStage(Stat.ATK, 0);

      // Turn 2: Use Charm through No Guard; should not be reflected
      game.field.mockAbility(feebas, AbilityId.NO_GUARD);

      game.move.use(MoveId.CHARM);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toEndOfTurn();

      expect(feebas).toHaveStatStage(Stat.ATK, 0);
      expect(karp).toHaveStatStage(Stat.ATK, -2);
    });

    it("should be overridden by Magic Coat without stacking", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(MoveId.GROWL);
      await game.move.forceEnemyMove(MoveId.MAGIC_COAT);
      await game.toEndOfTurn();

      const karp = game.field.getPlayerPokemon();
      expect(karp).toHaveStatStage(Stat.ATK, -1);
      expect(game.field.getEnemyPokemon()).not.toHaveAbilityApplied(AbilityId.MAGIC_BOUNCE);
    });

    it("should bounce spikes even when the target is protected", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(MoveId.SPIKES);
      await game.move.forceEnemyMove(MoveId.PROTECT);
      await game.toEndOfTurn();

      expect(game).toHaveArenaTag({ tagType: ArenaTagType.SPIKES, side: ArenaTagSide.PLAYER, layers: 1 });
    });

    it("should not break subsequent multi-strike moves", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(MoveId.GROWL);
      await game.move.forceEnemyMove(MoveId.SURGING_STRIKES);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toEndOfTurn();

      const enemy = game.field.getEnemyPokemon();
      expect(enemy.turnData.hitCount).toBe(3);
    });
  });

  describe("Magic Coat", () => {
    it("should fail if the user goes last in the turn", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(MoveId.PROTECT);
      await game.toEndOfTurn();

      expect(game.field.getEnemyPokemon()).toHaveUsedMove({ move: MoveId.MAGIC_COAT, result: MoveResult.FAIL });
    });

    it("should fail if called again in the same turn from Instruct", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(MoveId.INSTRUCT);
      await game.toEndOfTurn();

      expect(game.field.getEnemyPokemon()).toHaveUsedMove({ move: MoveId.MAGIC_COAT, result: MoveResult.FAIL });
    });

    it("should disappear at turn end", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      // turn 1
      game.move.use(MoveId.SPLASH);
      await game.move.forceEnemyMove(MoveId.MAGIC_COAT);
      await game.toNextTurn();

      expect(game.field.getEnemyPokemon()).not.toHaveBattlerTag(BattlerTagType.MAGIC_COAT);
    });
  });
});
