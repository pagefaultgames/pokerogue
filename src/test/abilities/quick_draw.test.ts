import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import Overrides from "#app/overrides";
import { Abilities } from "#enums/abilities";
import { Species } from "#enums/species";
import { FaintPhase } from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { allAbilities, BypassSpeedChanceAbAttr } from "#app/data/ability";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

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
    vi.spyOn(Overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.QUICK_DRAW);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.TAIL_WHIP]);
    vi.spyOn(Overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);

    vi.spyOn(allAbilities[Abilities.QUICK_DRAW].getAttrs(BypassSpeedChanceAbAttr)[0], "chance", "get").mockReturnValue(100);
  });

  test("makes pokemon going first in its priority bracket", async () => {
    await game.startBattle([Species.SLOWBRO]);

    const pokemon = game.scene.getPlayerPokemon();
    const enemy = game.scene.getEnemyPokemon();

    pokemon.hp = 1;
    enemy.hp = 1;

    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));
    await game.phaseInterceptor.to(FaintPhase, false);

    expect(pokemon.isFainted()).toBe(false);
    expect(enemy.isFainted()).toBe(true);
    expect(pokemon.battleData.abilitiesApplied).contain(Abilities.QUICK_DRAW);
  }, 20000);

  test("does not triggered by non damage moves", {
    timeout: 20000,
    retry: 5
  }, async () => {
    await game.startBattle([Species.SLOWBRO]);

    const pokemon = game.scene.getPlayerPokemon();
    const enemy = game.scene.getEnemyPokemon();

    pokemon.hp = 1;
    enemy.hp = 1;

    game.doAttack(getMovePosition(game.scene, 0, Moves.TAIL_WHIP));
    await game.phaseInterceptor.to(FaintPhase, false);

    expect(pokemon.isFainted()).toBe(true);
    expect(enemy.isFainted()).toBe(false);
    expect(pokemon.battleData.abilitiesApplied).not.contain(Abilities.QUICK_DRAW);
  }
  );

  test("does not increase priority", async () => {
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.EXTREME_SPEED));

    await game.startBattle([Species.SLOWBRO]);

    const pokemon = game.scene.getPlayerPokemon();
    const enemy = game.scene.getEnemyPokemon();

    pokemon.hp = 1;
    enemy.hp = 1;

    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));
    await game.phaseInterceptor.to(FaintPhase, false);

    expect(pokemon.isFainted()).toBe(true);
    expect(enemy.isFainted()).toBe(false);
    expect(pokemon.battleData.abilitiesApplied).contain(Abilities.QUICK_DRAW);
  }, 20000);
});
