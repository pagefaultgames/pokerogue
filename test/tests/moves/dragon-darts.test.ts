import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Dragon Darts", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .moveset([MoveId.DRAGON_DARTS, MoveId.SPLASH])
      .enemyMoveset([MoveId.SPLASH])
      .startingLevel(100)
      .enemyLevel(50)
      // Prevent accidental immunities
      .enemySpecies(SpeciesId.MAGIKARP);
  });

  describe("single battle", () => {
    beforeEach(() => {
      game.override.battleStyle("single");
      game.override.enemySpecies(SpeciesId.SNORLAX).enemyLevel(100);
    });

    it("should hit the same opponent twice", async () => {
      await game.classicMode.startBattle(SpeciesId.DRAGAPULT);

      const enemy = game.scene.getEnemyPokemon()!;
      const initialHp = enemy.hp;

      game.move.select(MoveId.DRAGON_DARTS);
      await game.phaseInterceptor.to("TurnEndPhase");

      // Both darts hit the only opponent
      expect(enemy.hp).toBeLessThan(initialHp);
      expect(enemy.summonData.hitCount).toBe(2);
    });
  });

  describe("double battle", () => {
    beforeEach(() => {
      game.override.battleStyle("double");
      // Keep both opponents alive long enough to reliably assert per-target hit counts.
      game.override.enemySpecies(SpeciesId.SNORLAX).enemyLevel(100);
    });

    it("should hit each opponent once when both are active", async () => {
      await game.classicMode.startBattle(SpeciesId.DRAGAPULT, SpeciesId.DRATINI);

      const [enemy1, enemy2] = game.scene.getEnemyField();

      // Player 1 uses Dragon Darts targeting enemy 1; player 2 uses Splash
      game.move.select(MoveId.DRAGON_DARTS, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
      game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);

      game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

      await game.phaseInterceptor.to("TurnEndPhase");

      // Each enemy should have taken exactly one dart's worth of damage
      expect(enemy1.hp).toBeLessThan(enemy1.getMaxHp());
      expect(enemy2.hp).toBeLessThan(enemy2.getMaxHp());
      expect(enemy1.summonData.hitCount).toBe(1);
      expect(enemy2.summonData.hitCount).toBe(1);
    });

    it("second dart should target surviving opponent when first target faints from dart 1", async () => {
      await game.classicMode.startBattle(SpeciesId.DRAGAPULT, SpeciesId.DRATINI);

      const [enemy1, enemy2] = game.scene.getEnemyField();

      // Give enemy 1 just 1 HP so dart 1 will KO it
      enemy1.hp = 1;

      game.move.select(MoveId.DRAGON_DARTS, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
      game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);

      game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

      await game.phaseInterceptor.to("TurnEndPhase");

      // Enemy 1 should have fainted from dart 1
      expect(enemy1.isFainted()).toBe(true);
      // Enemy 2 should have taken damage from dart 2
      expect(enemy2.hp).toBeLessThan(enemy2.getMaxHp());
      expect(enemy2.summonData.hitCount).toBe(1);
    });

    it("should hit the same opponent twice when only one is active", async () => {
      game.override.enemySpecies(SpeciesId.SNORLAX).enemyLevel(100);

      await game.classicMode.startBattle(SpeciesId.DRAGAPULT, SpeciesId.DRATINI);

      const [enemy1, enemy2] = game.scene.getEnemyField();

      // KO enemy 2 before Dragon Darts fires so only enemy 1 is present
      enemy2.hp = 0;
      enemy2.leaveField();

      game.move.select(MoveId.DRAGON_DARTS, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
      game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);

      game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

      await game.phaseInterceptor.to("TurnEndPhase");

      // Both darts should have hit enemy 1 since enemy 2 is gone
      expect(enemy1.hp).toBeLessThan(enemy1.getMaxHp());
      expect(enemy1.summonData.hitCount).toBe(2);
      // enemy 2 was already fainted and took no further damage
      expect(enemy2.hp).toBe(0);
    });

    it("should show no-effect text when both opponents are Fairy type", async () => {
      game.override.enemySpecies(SpeciesId.CLEFAIRY).enemyLevel(100);

      await game.classicMode.startBattle(SpeciesId.DRAGAPULT, SpeciesId.DRATINI);

      const [enemy1, enemy2] = game.scene.getEnemyField();

      game.move.select(MoveId.DRAGON_DARTS, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
      game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);

      game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

      await game.phaseInterceptor.to("TurnEndPhase");

      const noEffectMessage = i18next.t("battle:hitResultNoEffect", {
        pokemonName: getPokemonNameWithAffix(enemy1),
      });

      expect(game.textInterceptor.logs.filter(log => log === noEffectMessage)).toHaveLength(1);
      expect(enemy1.hp).toBe(enemy1.getMaxHp());
      expect(enemy2.hp).toBe(enemy2.getMaxHp());
      expect(enemy1.summonData.hitCount).toBe(0);
      expect(enemy2.summonData.hitCount).toBe(0);
    });

    it("should redirect both darts to the non-protecting opponent when the selected target uses Protect", async () => {
      await game.classicMode.startBattle(SpeciesId.DRAGAPULT, SpeciesId.DRATINI);

      const [enemy1, enemy2] = game.scene.getEnemyField();

      game.move.select(MoveId.DRAGON_DARTS, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
      game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);

      await game.move.selectEnemyMove(MoveId.PROTECT);
      await game.move.selectEnemyMove(MoveId.SPLASH);

      game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2]);

      await game.phaseInterceptor.to("TurnEndPhase", false);

      expect(enemy1.hp).toBe(enemy1.getMaxHp());
      expect(enemy1.summonData.hitCount).toBe(0);
      expect(enemy2.hp).toBeLessThan(enemy2.getMaxHp());
      expect(enemy2.summonData.hitCount).toBe(2);
    });

    it("should redirect both darts to the other target when selected target has Wonder Guard and is not weak to Dragon", async () => {
      await game.classicMode.startBattle(SpeciesId.DRAGAPULT, SpeciesId.DRATINI);

      const [enemy1, enemy2] = game.scene.getEnemyField();
      // Force only enemy1 to have Wonder Guard so Dragon Darts should avoid it when Dragon is not super-effective.
      enemy1.summonData.ability = AbilityId.WONDER_GUARD;

      game.move.select(MoveId.DRAGON_DARTS, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
      game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);

      game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

      await game.phaseInterceptor.to("TurnEndPhase", false);

      expect(enemy1.hp).toBe(enemy1.getMaxHp());
      expect(enemy1.summonData.hitCount).toBe(0);
      expect(enemy2.hp).toBeLessThan(enemy2.getMaxHp());
      expect(enemy2.summonData.hitCount).toBe(2);
    });

    it("should redirect both darts to center-of-attention target", async () => {
      game.override.enemyMoveset([MoveId.FOLLOW_ME, MoveId.SPLASH]);

      await game.classicMode.startBattle(SpeciesId.DRAGAPULT, SpeciesId.DRATINI);

      const [enemy1, enemy2] = game.scene.getEnemyField();

      game.move.select(MoveId.DRAGON_DARTS, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
      game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);

      await game.move.selectEnemyMove(MoveId.SPLASH);
      await game.move.selectEnemyMove(MoveId.FOLLOW_ME);

      game.setTurnOrder([BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

      await game.phaseInterceptor.to("TurnEndPhase", false);

      // Follow Me should redirect both darts to enemy 2.
      expect(enemy1.hp).toBe(enemy1.getMaxHp());
      expect(enemy1.summonData.hitCount).toBe(0);
      expect(enemy2.hp).toBeLessThan(enemy2.getMaxHp());
      expect(enemy2.summonData.hitCount).toBe(2);
    });

    it("should not redirect from Rage Powder when Dragapult is Grass type", async () => {
      game.override.enemyMoveset([MoveId.RAGE_POWDER, MoveId.SPLASH]);

      await game.classicMode.startBattle(SpeciesId.DRAGAPULT, SpeciesId.DRATINI);

      const dragapult = game.field.getPlayerPokemon();
      const [enemy1, enemy2] = game.scene.getEnemyField();

      const dragapultIsOfType = dragapult.isOfType.bind(dragapult);
      vi.spyOn(dragapult, "isOfType").mockImplementation(type => type === PokemonType.GRASS || dragapultIsOfType(type));

      game.move.select(MoveId.DRAGON_DARTS, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
      game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);

      await game.move.selectEnemyMove(MoveId.SPLASH);
      await game.move.selectEnemyMove(MoveId.RAGE_POWDER);

      game.setTurnOrder([BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

      await game.phaseInterceptor.to("TurnEndPhase", false);

      // Rage Powder should be ignored, so Dragon Darts behaves normally in doubles.
      expect(enemy1.hp).toBeLessThan(enemy1.getMaxHp());
      expect(enemy2.hp).toBeLessThan(enemy2.getMaxHp());
      expect(enemy1.summonData.hitCount).toBe(1);
      expect(enemy2.summonData.hitCount).toBe(1);
    });

    it("should not redirect from Rage Powder when Dragapult has Overcoat", async () => {
      game.override.enemyMoveset([MoveId.RAGE_POWDER, MoveId.SPLASH]);

      await game.classicMode.startBattle(SpeciesId.DRAGAPULT, SpeciesId.DRATINI);

      const dragapult = game.field.getPlayerPokemon();
      const [enemy1, enemy2] = game.scene.getEnemyField();

      const dragapultHasAbility = dragapult.hasAbility.bind(dragapult);
      vi.spyOn(dragapult, "hasAbility").mockImplementation(ability => {
        return ability === AbilityId.OVERCOAT || dragapultHasAbility(ability);
      });

      game.move.select(MoveId.DRAGON_DARTS, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
      game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);

      await game.move.selectEnemyMove(MoveId.SPLASH);
      await game.move.selectEnemyMove(MoveId.RAGE_POWDER);

      game.setTurnOrder([BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

      await game.phaseInterceptor.to("TurnEndPhase", false);

      // Rage Powder should be ignored, so Dragon Darts behaves normally in doubles.
      expect(enemy1.hp).toBeLessThan(enemy1.getMaxHp());
      expect(enemy2.hp).toBeLessThan(enemy2.getMaxHp());
      expect(enemy1.summonData.hitCount).toBe(1);
      expect(enemy2.summonData.hitCount).toBe(1);
    });
  });
});
