import { Species } from "#app/enums/species.js";
import GameManager from "#test/utils/gameManager";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import { BattleStat } from "#app/data/battle-stat";
import { Stat } from "#app/data/pokemon-stat";
import { TurnEndPhase } from "#app/phases";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Status, StatusEffect } from "#app/data/status-effect.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";

describe("Abilities - Flash Fire", () => {
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
      .ability(Abilities.FLASH_FIRE)
      .startingLevel(20)
      .enemyLevel(20);
  });

  it("status move (will-o-wisp)", async() => {
    game.override.enemyMoveset(Array(4).fill(Moves.WILL_O_WISP)).moveset(SPLASH_ONLY);
    await game.startBattle([Species.BLISSEY]);

    const blissey = game.scene.getPlayerPokemon()!;
    expect(blissey).toBeDefined();
    blissey.summonData.battleStats[BattleStat.EVA] = -6;

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

    await game.phaseInterceptor.to(TurnEndPhase);
    expect(blissey!.getTag(BattlerTagType.FIRE_BOOST)).toBeDefined();
  }, 20000);

  it("after frozen", async() => {
    game.override.enemyMoveset(Array(4).fill(Moves.EMBER)).moveset(SPLASH_ONLY);
    await game.startBattle([Species.BLISSEY]);

    const blissey = game.scene.getPlayerPokemon()!;
    expect(blissey).toBeDefined();

    blissey!.status = new Status(StatusEffect.FREEZE);
    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

    await game.phaseInterceptor.to(TurnEndPhase);
    expect(blissey!.getTag(BattlerTagType.FIRE_BOOST)).toBeDefined();
  }, 20000);

  it("not passing with baton pass", async() => {
    game.override.enemyMoveset(Array(4).fill(Moves.EMBER)).moveset([Moves.BATON_PASS, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    await game.startBattle([Species.BLISSEY, Species.CHANSEY]);

    const blissey = game.scene.getPlayerPokemon()!;
    expect(blissey).toBeDefined();
    // ensure use baton pass after enemy moved
    blissey.stats[Stat.SPD] = 1;
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 150;

    game.doAttack(getMovePosition(game.scene, 0, Moves.BATON_PASS));
    game.doSelectPartyPokemon(1);

    await game.phaseInterceptor.to(TurnEndPhase);
    const chansey = game.scene.getPlayerPokemon()!;
    expect(chansey).toBeDefined();
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.CHANSEY);
    expect(chansey!.getTag(BattlerTagType.FIRE_BOOST)).toBeUndefined();
  }, 20000);
});
