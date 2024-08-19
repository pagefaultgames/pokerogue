import { BattlerIndex } from "#app/battle.js";
import { allAbilities, PostDefendContactApplyStatusEffectAbAttr } from "#app/data/ability.js";
import { Abilities } from "#app/enums/abilities.js";
import { StatusEffect } from "#app/enums/status-effect.js";
import { CommandPhase } from "#app/phases/command-phase.js";
import { SelectTargetPhase } from "#app/phases/select-target-phase.js";
import { TurnEndPhase } from "#app/phases/turn-end-phase.js";
import GameManager from "#app/test/utils/gameManager";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Moves - Safeguard", () => {
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
      .battleType("single")
      .enemySpecies(Species.DRATINI)
      .enemyMoveset(Array(4).fill(Moves.SAFEGUARD))
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyLevel(5)
      .starterSpecies(Species.DRATINI)
      .moveset([Moves.NUZZLE, Moves.SPORE, Moves.YAWN, Moves.SPLASH])
      .ability(Abilities.BALL_FETCH);
  });

  it("protects from damaging moves with additional effects",
    async () => {
      await game.startBattle();
      const enemy = game.scene.getEnemyPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.NUZZLE));
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toNextTurn();

      expect(enemy.status).toBeUndefined();
    }, TIMEOUT
  );

  it("protects from status moves",
    async () => {
      await game.startBattle();
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPORE));
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toNextTurn();

      expect(enemyPokemon.status).toBeUndefined();
    }, TIMEOUT
  );

  it("protects from confusion",
    async () => {
      game.override.moveset([Moves.CONFUSE_RAY]);
      await game.startBattle();
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.CONFUSE_RAY));
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toNextTurn();

      expect(enemyPokemon.summonData.tags).toEqual([]);
    }, TIMEOUT
  );

  it("protects ally from status",
    async () => {
      game.override.battleType("double");

      await game.startBattle();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPORE));
      await game.phaseInterceptor.to(SelectTargetPhase, false);
      game.doSelectTarget(BattlerIndex.ENEMY_2);

      await game.phaseInterceptor.to(CommandPhase);

      game.doAttack(getMovePosition(game.scene, 1, Moves.NUZZLE));
      await game.phaseInterceptor.to(SelectTargetPhase, false);
      game.doSelectTarget(BattlerIndex.ENEMY_2);

      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2]);

      await game.phaseInterceptor.to(TurnEndPhase);

      const enemyPokemon = game.scene.getEnemyField();

      expect(enemyPokemon[0].status).toBeUndefined();
      expect(enemyPokemon[1].status).toBeUndefined();
    }, TIMEOUT
  );

  it("protects from Yawn",
    async () => {
      await game.startBattle();
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.YAWN));
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toNextTurn();

      expect(enemyPokemon.summonData.tags).toEqual([]);
    }, TIMEOUT
  );

  it("doesn't protect from already existing Yawn",
    async () => {
      await game.startBattle();
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.YAWN));
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toNextTurn();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.toNextTurn();

      expect(enemyPokemon.status?.effect).toEqual(StatusEffect.SLEEP);
    }, TIMEOUT
  );

  it("doesn't protect from self-inflicted via Rest or Flame Orb",
    async () => {
      game.override.enemyHeldItems([{name: "FLAME_ORB"}]);
      await game.startBattle();
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toNextTurn();

      expect(enemyPokemon.status?.effect).toEqual(StatusEffect.BURN);

      game.override.enemyMoveset(Array(4).fill(Moves.REST));
      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.toNextTurn();

      expect(enemyPokemon.status?.effect).toEqual(StatusEffect.SLEEP);
    }, TIMEOUT
  );

  it("protects from ability-inflicted status",
    async () => {
      game.override.ability(Abilities.STATIC);
      vi.spyOn(allAbilities[Abilities.STATIC].getAttrs(PostDefendContactApplyStatusEffectAbAttr)[0], "chance", "get").mockReturnValue(100);
      await game.startBattle();
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toNextTurn();
      game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));
      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.toNextTurn();

      expect(enemyPokemon.status).toBeUndefined();
    }, TIMEOUT
  );
});
