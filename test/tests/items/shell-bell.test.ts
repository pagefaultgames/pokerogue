import { allHeldItems } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import { applySingleHeldItem } from "#test/utils/item-test-utils";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Shell Bell", () => {
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
      .startingHeldItems([{ entry: HeldItemId.SHELL_BELL }])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  /**
   * Set the holder's recorded turn damage to its max HP (so each stack heals max HP/8,
   * keeping the total for any stack count within the holder's HP pool) and applies the bell.
   * @param stacks - Number of Shell Bell stacks held
   * @returns The holder and its expected post-heal HP
   */
  async function prepareShellBell(stacks: number) {
    if (stacks > 1) {
      game.override.startingHeldItems([{ entry: HeldItemId.SHELL_BELL, count: stacks }]);
    }
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const healPerStack = toDmgValue(player.getMaxHp() / 8);
    player.turnData.totalDamageDealt = player.getMaxHp();
    player.hp -= 10; // leave room to observe healing

    applySingleHeldItem(HeldItemId.SHELL_BELL, HeldItemEffect.HIT_HEAL, { pokemon: player });
    return { player, hpBeforeHeal: player.hp, expectedHeal: healPerStack * stacks };
  }

  it.each([1, 2, 4])("should heal by %d stack(s) worth of 1/8 the damage dealt", async stacks => {
    const { player, hpBeforeHeal, expectedHeal } = await prepareShellBell(stacks);
    game.endPhase();
    await game.phaseInterceptor.to("PokemonHealPhase");

    expect(player.hp).toBe(Math.min(hpBeforeHeal + expectedHeal, player.getMaxHp()));
    expect(player).toHaveHeldItem(HeldItemId.SHELL_BELL);
  });

  it("should not trigger when no damage was dealt this turn", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    player.turnData.totalDamageDealt = 0;

    const shellBell = allHeldItems[HeldItemId.SHELL_BELL];
    expect(shellBell.getAttrs(HeldItemEffect.HIT_HEAL)[0].shouldApply({ pokemon: player })).toBe(false);
  });
});
