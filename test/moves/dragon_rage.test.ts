import { Stat } from "#enums/stat";
import { PokemonType } from "#enums/pokemon-type";
import { Species } from "#app/enums/species";
import type { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Dragon Rage", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let partyPokemon: PlayerPokemon;
  let enemyPokemon: EnemyPokemon;

  const dragonRageDamage = 40;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(async () => {
    game = new GameManager(phaserGame);

    game.override.battleStyle("single");

    game.override.starterSpecies(Species.SNORLAX);
    game.override.moveset([Moves.DRAGON_RAGE]);
    game.override.ability(Abilities.BALL_FETCH);
    game.override.passiveAbility(Abilities.BALL_FETCH);
    game.override.startingLevel(100);

    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyMoveset(Moves.SPLASH);
    game.override.enemyAbility(Abilities.BALL_FETCH);
    game.override.enemyPassiveAbility(Abilities.BALL_FETCH);
    game.override.enemyLevel(100);

    await game.classicMode.startBattle();

    partyPokemon = game.scene.getPlayerParty()[0];
    enemyPokemon = game.scene.getEnemyPokemon()!;
  });

  it("ignores weaknesses", async () => {
    game.override.disableCrits();
    vi.spyOn(enemyPokemon, "getTypes").mockReturnValue([PokemonType.DRAGON]);

    game.move.select(Moves.DRAGON_RAGE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getInverseHp()).toBe(dragonRageDamage);
  });

  it("ignores resistances", async () => {
    game.override.disableCrits();
    vi.spyOn(enemyPokemon, "getTypes").mockReturnValue([PokemonType.STEEL]);

    game.move.select(Moves.DRAGON_RAGE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getInverseHp()).toBe(dragonRageDamage);
  });

  it("ignores SPATK stat stages", async () => {
    game.override.disableCrits();
    partyPokemon.setStatStage(Stat.SPATK, 2);

    game.move.select(Moves.DRAGON_RAGE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getInverseHp()).toBe(dragonRageDamage);
  });

  it("ignores stab", async () => {
    game.override.disableCrits();
    vi.spyOn(partyPokemon, "getTypes").mockReturnValue([PokemonType.DRAGON]);

    game.move.select(Moves.DRAGON_RAGE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getInverseHp()).toBe(dragonRageDamage);
  });

  it("ignores criticals", async () => {
    partyPokemon.addTag(BattlerTagType.ALWAYS_CRIT, 99);

    game.move.select(Moves.DRAGON_RAGE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getInverseHp()).toBe(dragonRageDamage);
  });

  it("ignores damage modification from abilities, for example ICE_SCALES", async () => {
    game.override.disableCrits();
    game.override.enemyAbility(Abilities.ICE_SCALES);

    game.move.select(Moves.DRAGON_RAGE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getInverseHp()).toBe(dragonRageDamage);
  });
});
