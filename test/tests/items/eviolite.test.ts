import { AbilityId } from "#enums/ability-id";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { Nature } from "#enums/nature";
import { SpeciesId } from "#enums/species-id";
import { type EffectiveStat, Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Eviolite", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .ability(AbilityId.BALL_FETCH)
      .nature(Nature.SERIOUS)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingHeldItems([{ entry: HeldItemId.EVIOLITE }]);
  });

  it.each([Stat.DEF, Stat.SPDEF])("should boost %s by 50% for pokemon that can still evolve", async rawStat => {
    const stat = rawStat as EffectiveStat;
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const baseline = player.getEffectiveStat(stat, { ignoreHeldItems: true });
    expect(player.getEffectiveStat(stat)).toBe(Math.floor(baseline * 1.5));
  });

  it.each([Stat.DEF, Stat.SPDEF])("should not boost %s for fully evolved pokemon", async rawStat => {
    const stat = rawStat as EffectiveStat;
    await game.classicMode.startBattle(SpeciesId.SNORLAX);

    const player = game.field.getPlayerPokemon();
    expect(player.getEffectiveStat(stat)).toBe(player.getEffectiveStat(stat, { ignoreHeldItems: true }));
  });

  it.each([Stat.ATK, Stat.SPATK])("should not boost offensive stats (%s)", async rawStat => {
    const stat = rawStat as EffectiveStat;
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    expect(player.getEffectiveStat(stat)).toBe(player.getEffectiveStat(stat, { ignoreHeldItems: true }));
  });
});
