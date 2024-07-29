import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import Overrides from "#app/overrides";
import { Species } from "#app/enums/species";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { getMovePosition } from "../utils/gameManagerUtils";
import { BerryPhase, MoveEffectPhase, MoveEndPhase } from "#app/phases";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { BattleStat } from "#app/data/battle-stat";
import { allMoves, StealHeldItemChanceAttr } from "#app/data/move";
import { SubstituteTag, TrappedTag } from "#app/data/battler-tags";
import { StatusEffect } from "#app/data/status-effect";
import { BerryType } from "#app/enums/berry-type";
import { Mode } from "#app/ui/ui";
import PartyUiHandler from "#app/ui/party-ui-handler";
import { Button } from "#app/enums/buttons";

const TIMEOUT = 20 * 1000; // 20 sec timeout

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

    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SUBSTITUTE, Moves.SWORDS_DANCE, Moves.TACKLE, Moves.SPLASH]);
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.SPLASH));
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(Overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
  });

  it(
    "should cause the user to take damage",
    async () => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SUBSTITUTE));

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(leadPokemon.hp).toBe(Math.ceil(leadPokemon.getMaxHp() * 3/4));
    }, TIMEOUT
  );

  it(
    "should redirect enemy attack damage to the Substitute doll",
    async () => {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.TACKLE));

      await game.startBattle([Species.SKARMORY]);

      const leadPokemon = game.scene.getPlayerPokemon();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SUBSTITUTE));

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(leadPokemon.hp).toBe(Math.ceil(leadPokemon.getMaxHp() * 3/4));
      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      const postSubHp = leadPokemon.hp;

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.hp).toBe(postSubHp);
      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
    }, TIMEOUT
  );

  it(
    "should fade after redirecting more damage than its remaining HP",
    async () => {
      // Giga Impact OHKOs Magikarp if substitute isn't up
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.GIGA_IMPACT));
      vi.spyOn(allMoves[Moves.GIGA_IMPACT], "accuracy", "get").mockReturnValue(100);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SUBSTITUTE));

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(leadPokemon.hp).toBe(Math.ceil(leadPokemon.getMaxHp() * 3/4));
      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      const postSubHp = leadPokemon.hp;

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.hp).toBe(postSubHp);
      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeUndefined();
    }, TIMEOUT
  );

  it(
    "should block stat changes from status moves",
    async () => {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.CHARM));

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SUBSTITUTE));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(0);
      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
    }
  );

  it(
    "should be bypassed by sound-based moves",
    async () => {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.ECHOED_VOICE));

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SUBSTITUTE));

      await game.phaseInterceptor.to(MoveEndPhase);

      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      const postSubHp = leadPokemon.hp;

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      expect(leadPokemon.hp).toBeLessThan(postSubHp);
    }, TIMEOUT
  );

  it(
    "should be bypassed by attackers with Infiltrator",
    async () => {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.TACKLE));
      vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INFILTRATOR);

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SUBSTITUTE));

      await game.phaseInterceptor.to(MoveEndPhase);

      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      const postSubHp = leadPokemon.hp;

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      expect(leadPokemon.hp).toBeLessThan(postSubHp);
    }, TIMEOUT
  );

  it(
    "shouldn't block the user's own status moves",
    async () => {
      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SUBSTITUTE));

      await game.phaseInterceptor.to(MoveEndPhase);
      await game.toNextTurn();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SWORDS_DANCE));

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(2);
    }, TIMEOUT
  );

  it(
    "should protect the user from flinching",
    async () => {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.FAKE_OUT));
      vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(1); // Ensures the Substitute will break

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();
      const enemyPokemon = game.scene.getEnemyPokemon();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);

      game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );

  it(
    "should protect the user from being trapped",
    async () => {
      vi.spyOn(allMoves[Moves.SAND_TOMB], "accuracy", "get").mockReturnValue(100);
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.SAND_TOMB));

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.getTag(TrappedTag)).toBeUndefined();
    }, TIMEOUT
  );

  it(
    "should prevent the user's stats from being lowered",
    async () => {
      vi.spyOn(allMoves[Moves.LIQUIDATION], "chance", "get").mockReturnValue(100);
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.LIQUIDATION));

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.summonData.battleStats[BattleStat.DEF]).toBe(0);
    }, TIMEOUT
  );

  it(
    "should protect the user from being afflicted with status effects",
    async () => {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.NUZZLE));

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.status?.effect).not.toBe(StatusEffect.PARALYSIS);
    }, TIMEOUT
  );

  it(
    "should prevent the user's items from being stolen",
    async () => {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.THIEF));
      vi.spyOn(allMoves[Moves.THIEF], "attrs", "get").mockReturnValue([new StealHeldItemChanceAttr(1.0)]); // give Thief 100% steal rate
      vi.spyOn(Overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "BERRY", type: BerryType.SITRUS}]);

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.getHeldItems().length).toBe(1);
    }, TIMEOUT
  );

  it(
    "should prevent the user's items from being removed",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.KNOCK_OFF]);
      vi.spyOn(Overrides, "OPP_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "BERRY", type: BerryType.SITRUS}]);

      await game.startBattle([Species.BLASTOISE]);

      const enemyPokemon = game.scene.getEnemyPokemon();

      enemyPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, enemyPokemon.id);
      const enemyNumItems = enemyPokemon.getHeldItems().length;

      game.doAttack(getMovePosition(game.scene, 0, Moves.KNOCK_OFF));

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(enemyPokemon.getHeldItems().length).toBe(enemyNumItems);
    }, TIMEOUT
  );

  it(
    "move effect should prevent the user's berries from being stolen and eaten",
    async () => {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.BUG_BITE));
      vi.spyOn(Overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "BERRY", type: BerryType.SITRUS}]);

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();
      const enemyPokemon = game.scene.getEnemyPokemon();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);

      game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));

      await game.phaseInterceptor.to(MoveEndPhase, false);
      const enemyPostAttackHp = enemyPokemon.hp;

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.getHeldItems().length).toBe(1);
      expect(enemyPokemon.hp).toBe(enemyPostAttackHp);
    }, TIMEOUT
  );

  it(
    "should prevent the user's stats from being reset by Clear Smog",
    async () => {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.CLEAR_SMOG));

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SWORDS_DANCE));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(2);
    }, TIMEOUT
  );

  it(
    "should prevent the user from becoming confused",
    async () => {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.MAGICAL_TORQUE));
      vi.spyOn(allMoves[Moves.MAGICAL_TORQUE], "chance", "get").mockReturnValue(100);

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SWORDS_DANCE));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.getTag(BattlerTagType.CONFUSED)).toBeUndefined();
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(2);
    }
  );

  it.skip(
    "should transfer to the switched in Pokemon when the source uses Baton Pass",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SUBSTITUTE, Moves.BATON_PASS]);

      await game.startBattle([Species.BLASTOISE, Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);

      game.doAttack(getMovePosition(game.scene, 0, Moves.BATON_PASS));

      await game.phaseInterceptor.to(MoveEffectPhase, false);

      // TODO: Figure out how to navigate out of the Party UI
      game.onNextPrompt("MoveEffectPhase", Mode.PARTY, () => {
        const handler = game.scene.ui.getHandler() as PartyUiHandler;
        handler.setCursor(1);
        handler.processInput(Button.ACTION);
        handler.setCursor(0);
        handler.processInput(Button.ACTION);
        handler.processInput(Button.ACTION);
      });

      await game.phaseInterceptor.to(BerryPhase, false);

      const switchedPokemon = game.scene.getPlayerPokemon();
      const subTag = switchedPokemon.getTag(SubstituteTag);
      expect(subTag).toBeDefined();
      expect(subTag.hp).toBe(Math.floor(leadPokemon.getMaxHp() * 1/4));
    }, TIMEOUT
  );
});
