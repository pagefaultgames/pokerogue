import { Stat } from "#enums/stat";
import { Type } from "#app/data/type";
import { Species } from "#app/enums/species";
import { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import { modifierTypes } from "#app/modifier/modifier-type";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
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

    game.override.battleType("single");

    game.override.starterSpecies(Species.SNORLAX);
    game.override.moveset([Moves.DRAGON_RAGE]);
    game.override.ability(Abilities.BALL_FETCH);
    game.override.passiveAbility(Abilities.BALL_FETCH);
    game.override.startingLevel(100);

    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.enemyAbility(Abilities.BALL_FETCH);
    game.override.enemyPassiveAbility(Abilities.BALL_FETCH);
    game.override.enemyLevel(100);

    await game.startBattle();

    partyPokemon = game.scene.getParty()[0];
    enemyPokemon = game.scene.getEnemyPokemon()!;

    // remove berries
    game.scene.removePartyMemberModifiers(0);
    game.scene.clearEnemyHeldItemModifiers();
  });

  it("ignores weaknesses", async () => {
    game.override.disableCrits();
    vi.spyOn(enemyPokemon, "getTypes").mockReturnValue([Type.DRAGON]);

    game.move.select(Moves.DRAGON_RAGE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getInverseHp()).toBe(dragonRageDamage);
  });

  it("ignores resistances", async () => {
    game.override.disableCrits();
    vi.spyOn(enemyPokemon, "getTypes").mockReturnValue([Type.STEEL]);

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
    vi.spyOn(partyPokemon, "getTypes").mockReturnValue([Type.DRAGON]);

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

  it("ignores multi hit", async () => {
    game.override.disableCrits();
    game.scene.addModifier(modifierTypes.MULTI_LENS().newModifier(partyPokemon), false);

    game.move.select(Moves.DRAGON_RAGE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getInverseHp()).toBe(dragonRageDamage);
  });
});
