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
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Reflecting effects", () => {
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
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.MAGIC_COAT);
  });

  describe("Reflecting effects", () => {
    it("should reflect basic status moves, copying them against the user", async () => {
      await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

      game.move.use(MoveId.GROWL);
      await game.toEndOfTurn();

      const player = game.field.getPlayerPokemon();
      const enemy = game.field.getEnemyPokemon();

      expect(enemy).toHaveUsedMove({
        move: MoveId.GROWL,
        useMode: MoveUseMode.REFLECTED,
        targets: [BattlerIndex.PLAYER],
      });
      expect(player).toHaveStatStage(Stat.ATK, -1);
    });

    it("should bounce back multi-target moves against each target", async () => {
      game.override.battleStyle("double");
      await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGIKARP]);

      game.move.use(MoveId.GROWL, BattlerIndex.PLAYER);
      game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
      await game.toEndOfTurn();

      const [karp1, karp2] = game.scene.getPlayerField();
      expect(karp1).toHaveStatStage(Stat.ATK, -2);
      expect(karp2).toHaveStatStage(Stat.ATK, -2);
    });

    // TODO: This is meaningless for now since growl doesn't fail when used at -6...
    it("should still bounce back a move that would otherwise fail", async () => {
      game.override.enemyAbility(AbilityId.INSOMNIA);
      await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

      game.move.use(MoveId.YAWN);
      await game.toEndOfTurn();

      expect(game.field.getPlayerPokemon()).toHaveBattlerTag(BattlerTagType.DROWSY);
    });

    it("should not bounce back a move that was just bounced", async () => {
      game.override.battleStyle("double").ability(AbilityId.MAGIC_BOUNCE);
      await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGIKARP]);

      game.move.use(MoveId.MAGIC_COAT, BattlerIndex.PLAYER);
      game.move.use(MoveId.GROWL, BattlerIndex.PLAYER_2);
      await game.move.forceEnemyMove(MoveId.MAGIC_COAT);
      await game.move.forceEnemyMove(MoveId.SPLASH);
      await game.toEndOfTurn();

      expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.ATK, 0);
    });

    it("should receive the stat change after reflecting a move back to a mirror armor user", async () => {
      game.override.enemyAbility(AbilityId.MIRROR_ARMOR);
      await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

      game.move.use(MoveId.GROWL);
      await game.toEndOfTurn();

      expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.ATK, -1);
    });

    it("should not bounce back curse", async () => {
      await game.classicMode.startBattle([SpeciesId.GASTLY]);

      game.move.use(MoveId.CURSE);
      await game.toEndOfTurn();

      expect(game.field.getEnemyPokemon().getTag(BattlerTagType.CURSED)).toBeDefined();
    });

    it("should not cause encore to be interrupted after bouncing", async () => {
      await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

      const playerPokemon = game.field.getPlayerPokemon();
      const enemyPokemon = game.field.getEnemyPokemon();

      // Give the player MOLD_BREAKER for this turn to bypass Magic Bounce.
      const playerAbilitySpy = game.field.mockAbility(playerPokemon, AbilityId.MOLD_BREAKER);

      // turn 1
      game.move.use(MoveId.ENCORE);
      await game.move.forceEnemyMove(MoveId.TACKLE);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toNextTurn();

      expect(enemyPokemon.getTag(BattlerTagType.ENCORE)!["moveId"]).toBe(MoveId.TACKLE);

      // turn 2
      playerAbilitySpy.mockRestore();

      game.move.use(MoveId.GROWL);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toEndOfTurn();

      expect(enemyPokemon.getTag(BattlerTagType.ENCORE)!["moveId"]).toBe(MoveId.TACKLE);
      expect(enemyPokemon.getLastXMoves()[0].move).toBe(MoveId.TACKLE);
    });

    it("should not cause the bounced move to count for encore", async () => {
      await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

      const enemyPokemon = game.field.getEnemyPokemon();

      // turn 1
      game.move.use(MoveId.GROWL);
      await game.move.forceEnemyMove(MoveId.MAGIC_COAT);
      await game.toNextTurn();

      // turn 2
      game.move.use(MoveId.ENCORE);
      await game.move.forceEnemyMove(MoveId.TACKLE);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toEndOfTurn();

      expect(enemyPokemon.getTag(BattlerTagType.ENCORE)!["moveId"]).toBe(MoveId.TACKLE);
      expect(enemyPokemon.getLastXMoves()[0].move).toBe(MoveId.TACKLE);
    });

    it("should boost stomping tantrum after a failed bounce", async () => {
      await game.override.ability(AbilityId.INSOMNIA);
      await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

      const enemy = game.field.getEnemyPokemon();
      const powerSpy = vi.spyOn(allMoves[MoveId.STOMPING_TANTRUM], "calculateBattlePower");

      // Yawn gets reflected back onto us, failing due to Insomnia
      game.move.use(MoveId.YAWN);
      await game.move.forceEnemyMove(MoveId.MAGIC_COAT);
      await game.toNextTurn();
      expect(enemy).toHaveUsedMove({ move: MoveId.YAWN, result: MoveResult.FAIL, useMode: MoveUseMode.REFLECTED });

      game.move.use(MoveId.SPLASH);
      await game.move.forceEnemyMove(MoveId.STOMPING_TANTRUM);
      await game.toNextTurn();

      expect(powerSpy).toHaveReturnedWith(150);
    });

    it("should respect immunities when bouncing a move", async () => {
      vi.spyOn(allMoves[MoveId.THUNDER_WAVE], "accuracy", "get").mockReturnValue(100);
      game.override.ability(AbilityId.SOUNDPROOF);
      await game.classicMode.startBattle([SpeciesId.PHANPY]);

      // Turn 1 - thunder wave immunity test
      game.move.use(MoveId.THUNDER_WAVE);
      await game.toEndOfTurn();
      expect(game.field.getPlayerPokemon().status).toBeUndefined();

      // Turn 2 - soundproof immunity test
      game.move.use(MoveId.GROWL);
      await game.toEndOfTurn();
      expect(game.field.getPlayerPokemon()).toHaveStatStage(Stat.ATK, 0);
    });

    it("should ignore the original move's accuracy and use the user's accuracy", async () => {
      await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

      const magikarp = game.field.getPlayerPokemon();
      const feebas = game.field.getEnemyPokemon();
      const karpMissSpy = vi.spyOn(magikarp, "getAccuracyMultiplier").mockReturnValue(0);

      // Turn 1: Force a miss on initial move
      game.move.use(MoveId.SPORE);
      await game.phaseInterceptor.to("MoveEndPhase");
      await game.toEndOfTurn();

      expect(magikarp).toHaveStatusEffect(StatusEffect.SLEEP);

      magikarp.clearStatus(false, false);

      karpMissSpy.mockRestore();
      vi.spyOn(feebas, "getAccuracyMultiplier").mockReturnValue(0);

      // Turn 2: Force a miss on Feebas' reflected move
      game.move.use(MoveId.SPORE);
      await game.phaseInterceptor.to("MoveEndPhase");
      await game.toEndOfTurn();

      expect(magikarp).not.toHaveStatusEffect(StatusEffect.SLEEP);
    });
  });

  describe("Magic Bounce", () => {
    beforeEach(() => {
      game.override.enemyAbility(AbilityId.MAGIC_BOUNCE);
    });

    // TODO: Change post speed order rework to check the FASTER pokemon's ability
    it("should only apply the leftmost available target's magic bounce when bouncing field-targeted moves in doubles", async () => {
      game.override.battleStyle("double");

      await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGIKARP]);
      const [enemy1, enemy2] = game.scene.getEnemyField();
      // set speed to different values just in case logic erroneously checks for speed order
      enemy1.setStat(Stat.SPD, enemy2.getStat(Stat.SPD) + 1);

      // turn 1
      game.move.use(MoveId.SPIKES, 0);
      game.move.use(MoveId.TRICK_ROOM, 1);
      await game.toNextTurn();

      // TODO: Replace this with `expect(game).toHaveArenaTag({tagType: ArenaTagType.SPIKES, side: ArenaTagSide.PLAYER, sourceId: enemy1.id, layers: 1})
      const tag = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.PLAYER)!;
      expect(tag).toBeDefined();
      expect(tag.getSourcePokemon()).toBe(enemy1);
      expect(tag["layers"]).toBe(1);
      game.scene.arena.removeTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.PLAYER, true);

      // turn 2
      game.move.use(MoveId.SPIKES, 0);
      game.move.use(MoveId.TRICK_ROOM, 1);
      await game.toEndOfTurn();

      // TODO: Replace this with `expect(game).toHaveArenaTag({tagType: ArenaTagType.SPIKES, side: ArenaTagSide.PLAYER, sourceId: enemy1.id, layers: 1})
      expect(
        game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.PLAYER)?.getSourcePokemon()?.getBattlerIndex(),
      ).toBe(BattlerIndex.ENEMY);
    });

    it("should not bounce back status moves against semi-invulnerable Pokemon, even with No Guard", async () => {
      await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

      const player = game.field.getPlayerPokemon();
      const enemy = game.field.getEnemyPokemon();

      // Turn 1: use charm while enemy is airborne; misses
      game.move.use(MoveId.CHARM);
      await game.move.forceEnemyMove(MoveId.FLY);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toNextTurn();

      expect(player).toHaveStatStage(Stat.ATK, 0);
      expect(enemy).toHaveStatStage(Stat.ATK, 0);

      // Turn 2: Use Charm through No Guard; should not be reflected
      game.field.mockAbility(player, AbilityId.NO_GUARD);

      game.move.use(MoveId.CHARM);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toEndOfTurn();

      expect(player).toHaveStatStage(Stat.ATK, 0);
      expect(enemy).toHaveStatStage(Stat.ATK, -2);
    });

    it("should not stack with magic coat on the same Pokemon", async () => {
      game.override.battleStyle("double");
      await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGIKARP]);

      game.field.mockAbility(game.field.getPlayerPokemon(), AbilityId.MAGIC_BOUNCE);

      game.move.use(MoveId.GROWL, BattlerIndex.PLAYER);
      game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
      await game.move.forceEnemyMove(MoveId.MAGIC_COAT);
      await game.move.forceEnemyMove(MoveId.SPLASH);
      await game.toEndOfTurn();

      const [karp1, karp2] = game.scene.getPlayerField();
      expect(karp1).toHaveStatStage(Stat.ATK, -1);
      expect(karp2).toHaveStatStage(Stat.ATK, -1);
    });
  });

  describe("Magic Coat", () => {
    it("should fail if the user goes last in the turn", async () => {
      await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

      game.move.use(MoveId.PROTECT);
      await game.toEndOfTurn();

      expect(game.field.getEnemyPokemon().getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    });

    it("should fail if called again in the same turn from Instruct", async () => {
      await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

      game.move.use(MoveId.INSTRUCT);
      await game.toEndOfTurn();
      expect(game.field.getEnemyPokemon().getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    });

    it("should not reflect moves used on the next turn", async () => {
      await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

      // turn 1
      game.move.use(MoveId.SPLASH);
      await game.move.forceEnemyMove(MoveId.MAGIC_COAT);
      await game.toNextTurn();

      // turn 2
      game.move.use(MoveId.GROWL);
      await game.move.forceEnemyMove(MoveId.SPLASH);
      await game.toEndOfTurn();
      expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.ATK, -1);
    });

    it("should still bounce back a move from a mold breaker user", async () => {
      game.override.ability(AbilityId.MOLD_BREAKER).moveset([MoveId.GROWL]);
      await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

      game.move.use(MoveId.GROWL);
      await game.toEndOfTurn();

      expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.ATK, 0);
      expect(game.field.getPlayerPokemon()).toHaveStatStage(Stat.ATK, -1);
    });

    it("should only bounce spikes back once when both targets use magic coat in doubles", async () => {
      game.override.battleStyle("double");
      await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

      game.move.use(MoveId.SPIKES);
      await game.toEndOfTurn();

      expect(game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.PLAYER)!["layers"]).toBe(1);
      expect(game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY)).toBeUndefined();
    });
  });
});
