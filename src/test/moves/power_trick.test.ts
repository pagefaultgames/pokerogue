
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import { Moves } from "#enums/moves";
import { Stat } from "#enums/stat";
import { Species } from "#enums/species";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { SPLASH_ONLY } from "../utils/testUtils";

describe("Moves - Power Trick", () => {
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
      .enemyAbility(Abilities.NONE)
      .enemyMoveset(SPLASH_ONLY)
      .enemySpecies(Species.MEW)
      .ability(Abilities.NONE);
  });

  it("swaps users ATK with its DEF stat", async () => {
    await game.classicMode.startBattle([Species.SHUCKLE]);

    const player = game.scene.getPlayerPokemon()!;
    const baseATK = player.getStat(Stat.ATK, false);
    const baseDEF = player.getStat(Stat.DEF, false);

    game.move.select(Moves.POWER_TRICK);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStat(Stat.ATK, false)).toBe(baseDEF);
    expect(player.getStat(Stat.DEF, false)).toBe(baseATK);
  },
  20000
  );

  it("using power trick again will reset stat change", async () => {
    await game.classicMode.startBattle([Species.SHUCKLE]);

    const player = game.scene.getPlayerPokemon()!;
    const baseATK = player.getStat(Stat.ATK, false);
    const baseDEF = player.getStat(Stat.DEF, false);

    game.move.select(Moves.POWER_TRICK);

    await game.phaseInterceptor.to(TurnEndPhase);

    game.move.select(Moves.POWER_TRICK);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStat(Stat.ATK, false)).toBe(baseATK);
    expect(player.getStat(Stat.DEF, false)).toBe(baseDEF);
  },
  20000
  );
});
