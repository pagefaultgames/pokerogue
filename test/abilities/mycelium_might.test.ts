import GameManager from "#test/testUtils/gameManager";
import { AbilityId } from "#enums/ability-id";
import { Stat } from "#enums/stat";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Mycelium Might", () => {
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
      .criticalHits(false)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.CLEAR_BODY)

      .enemyMoveset(MoveId.QUICK_ATTACK)
      .ability(AbilityId.MYCELIUM_MIGHT)
      .moveset([MoveId.QUICK_ATTACK, MoveId.BABY_DOLL_EYES]);
  });

  /**
   * References:
   * https://bulbapedia.bulbagarden.net/wiki/Mycelium_Might_(Ability)
   * https://bulbapedia.bulbagarden.net/wiki/Priority
   * https://www.smogon.com/forums/threads/scarlet-violet-battle-mechanics-research.3709545/page-24
   */

  it("will move last in its priority bracket and ignore protective abilities", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const enemy = game.scene.getEnemyPokemon()!;
    const player = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.BABY_DOLL_EYES);

    await game.phaseInterceptor.to("MoveEndPhase", false);
    // The opponent Pokemon (without Mycelium Might) goes first despite having lower speed than the player Pokemon.
    // The player Pokemon (with Mycelium Might) goes last despite having higher speed than the opponent.
    expect(player.hp).not.toEqual(player.getMaxHp());
    await game.phaseInterceptor.to("TurnEndPhase");

    // Despite the opponent's ability (Clear Body), its ATK stat stage is still reduced.
    expect(enemy.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("will still go first if a status move that is in a higher priority bracket than the opponent's move is used", async () => {
    game.override.enemyMoveset(MoveId.TACKLE);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const enemy = game.scene.getEnemyPokemon()!;
    const player = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.BABY_DOLL_EYES);

    await game.phaseInterceptor.to("MoveEndPhase", false);
    // The player Pokemon (with M.M.) goes first because its move is still within a higher priority bracket than its opponent.
    // The enemy Pokemon goes second because its move is in a lower priority bracket.
    expect(player.hp).toEqual(player.getMaxHp());
    await game.phaseInterceptor.to("TurnEndPhase");
    // Despite the opponent's ability (Clear Body), its ATK stat stage is still reduced.
    expect(enemy.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("will not affect non-status moves", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const player = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.QUICK_ATTACK);

    await game.phaseInterceptor.to("MoveEndPhase", false);
    // The player Pokemon (with M.M.) goes first because it has a higher speed and did not use a status move.
    // The enemy Pokemon (without M.M.) goes second because its speed is lower.
    // This means that the commandOrder should be identical to the speedOrder
    expect(player.hp).toEqual(player.getMaxHp());
  });
});
