import { SubstituteTag, TrappedTag } from "#app/data/battler-tags";
import { allMoves, StealHeldItemChanceAttr } from "#app/data/move";
import { StatusEffect } from "#app/data/status-effect";
import { Abilities } from "#app/enums/abilities";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { BerryType } from "#app/enums/berry-type";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { Stat } from "#app/enums/stat";
import { MoveResult } from "#app/field/pokemon";
import { CommandPhase } from "#app/phases/command-phase";
import GameManager from "#app/test/utils/gameManager";
import { Command } from "#app/ui/command-ui-handler";
import { Mode } from "#app/ui/ui";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";


// 20 sec timeout

describe("Moves - Substitute", () => {
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
      .moveset([Moves.SUBSTITUTE, Moves.SWORDS_DANCE, Moves.TACKLE, Moves.SPLASH])
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.INSOMNIA)
      .enemyMoveset(Moves.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it(
    "should cause the user to take damage",
    async () => {
      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.SUBSTITUTE);

      await game.phaseInterceptor.to("MoveEndPhase", false);

      expect(leadPokemon.hp).toBe(Math.ceil(leadPokemon.getMaxHp() * 3/4));
    }
  );

  it(
    "should redirect enemy attack damage to the Substitute doll",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));

      await game.classicMode.startBattle([Species.SKARMORY]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.SUBSTITUTE);

      await game.phaseInterceptor.to("MoveEndPhase", false);

      expect(leadPokemon.hp).toBe(Math.ceil(leadPokemon.getMaxHp() * 3/4));
      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      const postSubHp = leadPokemon.hp;

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.hp).toBe(postSubHp);
      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
    }
  );

  it(
    "should fade after redirecting more damage than its remaining HP",
    async () => {
      // Giga Impact OHKOs Magikarp if substitute isn't up
      game.override.enemyMoveset(Array(4).fill(Moves.GIGA_IMPACT));
      vi.spyOn(allMoves[Moves.GIGA_IMPACT], "accuracy", "get").mockReturnValue(100);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.SUBSTITUTE);

      await game.phaseInterceptor.to("MoveEndPhase", false);

      expect(leadPokemon.hp).toBe(Math.ceil(leadPokemon.getMaxHp() * 3/4));
      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      const postSubHp = leadPokemon.hp;

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.hp).toBe(postSubHp);
      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeUndefined();
    }
  );

  it(
    "should block stat changes from status moves",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.CHARM));

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.SUBSTITUTE);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
    }
  );

  it(
    "should be bypassed by sound-based moves",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.ECHOED_VOICE));

      await game.classicMode.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.SUBSTITUTE);

      await game.phaseInterceptor.to("MoveEndPhase");

      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      const postSubHp = leadPokemon.hp;

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      expect(leadPokemon.hp).toBeLessThan(postSubHp);
    }
  );

  it(
    "should be bypassed by attackers with Infiltrator",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));
      game.override.enemyAbility(Abilities.INFILTRATOR);

      await game.classicMode.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.SUBSTITUTE);

      await game.phaseInterceptor.to("MoveEndPhase");

      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      const postSubHp = leadPokemon.hp;

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      expect(leadPokemon.hp).toBeLessThan(postSubHp);
    }
  );

  it(
    "shouldn't block the user's own status moves",
    async () => {
      await game.classicMode.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.SUBSTITUTE);

      await game.phaseInterceptor.to("MoveEndPhase");
      await game.toNextTurn();

      game.move.select(Moves.SWORDS_DANCE);

      await game.phaseInterceptor.to("MoveEndPhase", false);

      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(2);
    }
  );

  it(
    "should protect the user from flinching",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.FAKE_OUT));
      game.override.startingLevel(1); // Ensures the Substitute will break

      await game.classicMode.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, Moves.NONE, leadPokemon.id);

      game.move.select(Moves.TACKLE);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    }
  );

  it(
    "should protect the user from being trapped",
    async () => {
      vi.spyOn(allMoves[Moves.SAND_TOMB], "accuracy", "get").mockReturnValue(100);
      game.override.enemyMoveset(Array(4).fill(Moves.SAND_TOMB));

      await game.classicMode.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, Moves.NONE, leadPokemon.id);

      game.move.select(Moves.SPLASH);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.getTag(TrappedTag)).toBeUndefined();
    }
  );

  it(
    "should prevent the user's stats from being lowered",
    async () => {
      vi.spyOn(allMoves[Moves.LIQUIDATION], "chance", "get").mockReturnValue(100);
      game.override.enemyMoveset(Array(4).fill(Moves.LIQUIDATION));

      await game.classicMode.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, Moves.NONE, leadPokemon.id);

      game.move.select(Moves.SPLASH);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.getStatStage(Stat.DEF)).toBe(0);
    }
  );

  it(
    "should protect the user from being afflicted with status effects",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.NUZZLE));

      await game.classicMode.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, Moves.NONE, leadPokemon.id);

      game.move.select(Moves.SPLASH);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.status?.effect).not.toBe(StatusEffect.PARALYSIS);
    }
  );

  it(
    "should prevent the user's items from being stolen",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.THIEF));
      vi.spyOn(allMoves[Moves.THIEF], "attrs", "get").mockReturnValue([new StealHeldItemChanceAttr(1.0)]); // give Thief 100% steal rate
      game.override.startingHeldItems([{name: "BERRY", type: BerryType.SITRUS}]);

      await game.classicMode.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, Moves.NONE, leadPokemon.id);

      game.move.select(Moves.SPLASH);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.getHeldItems().length).toBe(1);
    }
  );

  it(
    "should prevent the user's items from being removed",
    async () => {
      game.override.moveset([Moves.KNOCK_OFF]);
      game.override.enemyHeldItems([{name: "BERRY", type: BerryType.SITRUS}]);

      await game.classicMode.startBattle([Species.BLASTOISE]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      enemyPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, Moves.NONE, enemyPokemon.id);
      const enemyNumItems = enemyPokemon.getHeldItems().length;

      game.move.select(Moves.KNOCK_OFF);

      await game.phaseInterceptor.to("MoveEndPhase", false);

      expect(enemyPokemon.getHeldItems().length).toBe(enemyNumItems);
    }
  );

  it(
    "move effect should prevent the user's berries from being stolen and eaten",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.BUG_BITE));
      game.override.startingHeldItems([{name: "BERRY", type: BerryType.SITRUS}]);

      await game.classicMode.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, Moves.NONE, leadPokemon.id);

      game.move.select(Moves.TACKLE);

      await game.phaseInterceptor.to("MoveEndPhase", false);
      const enemyPostAttackHp = enemyPokemon.hp;

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.getHeldItems().length).toBe(1);
      expect(enemyPokemon.hp).toBe(enemyPostAttackHp);
    }
  );

  it(
    "should prevent the user's stats from being reset by Clear Smog",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.CLEAR_SMOG));

      await game.classicMode.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, Moves.NONE, leadPokemon.id);

      game.move.select(Moves.SWORDS_DANCE);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(2);
    }
  );

  it(
    "should prevent the user from becoming confused",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.MAGICAL_TORQUE));
      vi.spyOn(allMoves[Moves.MAGICAL_TORQUE], "chance", "get").mockReturnValue(100);

      await game.classicMode.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, Moves.NONE, leadPokemon.id);

      game.move.select(Moves.SWORDS_DANCE);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.getTag(BattlerTagType.CONFUSED)).toBeUndefined();
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(2);
    }
  );

  it(
    "should transfer to the switched in Pokemon when the source uses Baton Pass",
    async () => {
      game.override.moveset([Moves.SUBSTITUTE, Moves.BATON_PASS]);

      await game.classicMode.startBattle([Species.BLASTOISE, Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, Moves.NONE, leadPokemon.id);

      // Simulate a Baton switch for the player this turn
      game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
        (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.POKEMON, 1, true);
      });

      await game.phaseInterceptor.to("MovePhase", false);

      const switchedPokemon = game.scene.getPlayerPokemon()!;
      const subTag = switchedPokemon.getTag(SubstituteTag)!;
      expect(subTag).toBeDefined();
      expect(subTag.hp).toBe(Math.floor(leadPokemon.getMaxHp() * 1/4));
    }
  );

  it(
    "should prevent the source's Rough Skin from activating when hit",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));
      game.override.ability(Abilities.ROUGH_SKIN);

      await game.classicMode.startBattle([Species.BLASTOISE]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.SUBSTITUTE);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    }
  );

  it(
    "should prevent the source's Focus Punch from failing when hit",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));
      game.override.moveset([Moves.FOCUS_PUNCH]);

      // Make Focus Punch 40 power to avoid a KO
      vi.spyOn(allMoves[Moves.FOCUS_PUNCH], "calculateBattlePower").mockReturnValue(40);

      await game.classicMode.startBattle([Species.BLASTOISE]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      playerPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, Moves.NONE, playerPokemon.id);

      game.move.select(Moves.FOCUS_PUNCH);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    }
  );

  it(
    "should not allow Shell Trap to activate when attacked",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));
      game.override.moveset([Moves.SHELL_TRAP]);

      await game.classicMode.startBattle([Species.BLASTOISE]);

      const playerPokemon = game.scene.getPlayerPokemon()!;

      playerPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, Moves.NONE, playerPokemon.id);

      game.move.select(Moves.SHELL_TRAP);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    }
  );

  it(
    "should not allow Beak Blast to burn opponents when hit",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));
      game.override.moveset([Moves.BEAK_BLAST]);

      await game.classicMode.startBattle([Species.BLASTOISE]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      playerPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, Moves.NONE, playerPokemon.id);

      game.move.select(Moves.BEAK_BLAST);

      await game.phaseInterceptor.to("MoveEndPhase");

      expect(enemyPokemon.status?.effect).not.toBe(StatusEffect.BURN);
    }
  );

  it(
    "should cause incoming attacks to not activate Counter",
    async() => {
      game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));
      game.override.moveset([Moves.COUNTER]);

      await game.classicMode.startBattle([Species.BLASTOISE]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      playerPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, Moves.NONE, playerPokemon.id);

      game.move.select(Moves.COUNTER);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    }
  );
});
