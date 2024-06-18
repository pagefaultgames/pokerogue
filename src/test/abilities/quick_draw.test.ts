import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {Abilities} from "#enums/abilities";
import {Species} from "#enums/species";
import {EnemyCommandPhase,  TitlePhase, TurnEndPhase, TurnStartPhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { Stat } from "#app/data/pokemon-stat";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Ability, allAbilities, BypassSpeedChanceAbAttr } from "#app/data/ability";


describe("Abilities - Quick Draw", () => {
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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(
      Abilities.QUICK_DRAW
    );
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([
      Moves.TACKLE,
      Moves.TACKLE,
      Moves.TACKLE,
      Moves.TACKLE,
    ]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(
      Species.RATTATA
    );
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([
      Moves.TACKLE,
      Moves.TACKLE,
      Moves.TACKLE,
      Moves.TACKLE,
    ]);

    allAbilities[Abilities.QUICK_DRAW] = new Ability(
      Abilities.QUICK_DRAW,
      8
    ).attr(BypassSpeedChanceAbAttr, 100);
  });

  it("makes pokemon going first in its priority bracket", async() => {
    await game.startBattle([Species.SLOWBRO]);

    const pokemon = game.scene.getParty()[0];
    const enemy = game.scene.getEnemyParty()[0];

    pokemon.stats[Stat.SPD] = 50;
    enemy.stats[Stat.SPD] = 150;
    pokemon.hp = 1;
    enemy.hp = 1;

    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));

    await game.phaseInterceptor.run(EnemyCommandPhase);
    await game.phaseInterceptor.run(TurnStartPhase);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
    expect(pokemon.battleData.abilityRevealed).toBe(true);
  }, 20000);

  it("does not triggered by non damage moves", async () => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([
      Moves.COUNTER,
      Moves.COUNTER,
      Moves.COUNTER,
      Moves.COUNTER,
    ]);

    await game.startBattle([Species.SLOWBRO]);

    const pokemon = game.scene.getParty()[0];
    const enemy = game.scene.getEnemyParty()[0];

    pokemon.stats[Stat.SPD] = 50;
    enemy.stats[Stat.SPD] = 150;
    pokemon.hp = 1;
    enemy.hp = 1;

    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));

    await game.phaseInterceptor.run(EnemyCommandPhase);
    await game.phaseInterceptor.run(TurnStartPhase);
    await game.phaseInterceptor.to(TitlePhase);

    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
    expect(pokemon.battleData.abilityRevealed).not.toBe(true);
  }, 20000);

  it("does not increase priority", async () => {
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([
      Moves.EXTREME_SPEED,
      Moves.EXTREME_SPEED,
      Moves.EXTREME_SPEED,
      Moves.EXTREME_SPEED,
    ]);

    await game.startBattle([Species.SLOWBRO]);

    const pokemon = game.scene.getParty()[0];
    const enemy = game.scene.getEnemyParty()[0];

    pokemon.stats[Stat.SPD] = 50;
    enemy.stats[Stat.SPD] = 150;
    pokemon.hp = 1;
    enemy.hp = 1;

    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));

    await game.phaseInterceptor.run(EnemyCommandPhase);
    await game.phaseInterceptor.run(TurnStartPhase);
    await game.phaseInterceptor.to(TitlePhase);

    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
    expect(pokemon.battleData.abilityRevealed).toBe(true);
  }, 20000);
});
