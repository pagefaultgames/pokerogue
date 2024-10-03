import { DamagePhase } from "#app/phases/damage-phase";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect } from "vitest";

describe("Moves - Scale Shot", () => {
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
      .moveset([Moves.SCALE_SHOT])
      .battleType("single")
      .disableCrits()
      .starterSpecies(Species.MINCCINO)
      .ability(Abilities.NO_GUARD)
      .passiveAbility(Abilities.SKILL_LINK)
      .enemyAbility(Abilities.SHEER_FORCE)
      .enemyPassiveAbility(Abilities.STALL)
      .enemyMoveset(Moves.SKILL_SWAP)
      .enemyLevel(3);
  });

  it("applies stat changes after last hit", async () => {
    game.override.enemySpecies(Species.FORRETRESS);
    await game.classicMode.startBattle();
    const minccino = game.scene.getPlayerPokemon()!;
    game.move.select(Moves.SCALE_SHOT);
    await game.phaseInterceptor.to(MoveEffectPhase);
    await game.phaseInterceptor.to(DamagePhase);
    await game.phaseInterceptor.to(MoveEffectPhase);
    expect (minccino?.getStatStage(Stat.DEF)).toBe(0);
    expect (minccino?.getStatStage(Stat.SPD)).toBe(0);
    await game.phaseInterceptor.to(MoveEndPhase);
    expect (minccino.getStatStage(Stat.DEF)).toBe(-1);
    expect (minccino.getStatStage(Stat.SPD)).toBe(1);
  });

  it("unaffected by sheer force", async () => {
    game.override.enemySpecies(Species.WOBBUFFET);
    await game.classicMode.startBattle();
    const minccino = game.scene.getPlayerPokemon()!;
    const wobbuffet = game.scene.getEnemyPokemon()!;
    wobbuffet.setStat(Stat.HP, 100, true);
    wobbuffet.hp = 100;
    game.move.select(Moves.SCALE_SHOT);
    await game.phaseInterceptor.to(TurnEndPhase);
    const hpafter1 = wobbuffet.hp;
    //effect not nullified by sheer force
    expect (minccino.getStatStage(Stat.DEF)).toBe(-1);
    expect (minccino.getStatStage(Stat.SPD)).toBe(1);
    game.move.select(Moves.SCALE_SHOT);
    await game.phaseInterceptor.to(MoveEndPhase);
    const hpafter2 = wobbuffet.hp;
    //check damage not boosted- make damage before sheer force a little lower than theoretical boosted sheer force damage
    expect (100 - hpafter1).toBe(hpafter1 - hpafter2);
  });
});
