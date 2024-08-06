import { BattleStat } from "#app/data/battle-stat";
import { Type } from "#app/data/type";
import { Species } from "#app/enums/species.js";
import { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import { modifierTypes } from "#app/modifier/modifier-type";
import { TurnEndPhase } from "#app/phases";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SPLASH_ONLY } from "#test/utils/testUtils";

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
    game.override.disableCrits();

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
    enemyPokemon = game.scene.getEnemyPokemon();

    // remove berries
    game.scene.removePartyMemberModifiers(0);
    game.scene.clearEnemyHeldItemModifiers();
  });

  it("ignores weaknesses", async () => {
    vi.spyOn(enemyPokemon, "getTypes").mockReturnValue([Type.DRAGON]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.DRAGON_RAGE));
    await game.phaseInterceptor.to(TurnEndPhase);
    const damageDealt = enemyPokemon.getMaxHp() - enemyPokemon.hp;

    expect(damageDealt).toBe(dragonRageDamage);
  });

  it("ignores resistances", async () => {
    vi.spyOn(enemyPokemon, "getTypes").mockReturnValue([Type.STEEL]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.DRAGON_RAGE));
    await game.phaseInterceptor.to(TurnEndPhase);
    const damageDealt = enemyPokemon.getMaxHp() - enemyPokemon.hp;

    expect(damageDealt).toBe(dragonRageDamage);
  });

  it("ignores stat changes", async () => {
    partyPokemon.summonData.battleStats[BattleStat.SPATK] = 2;

    game.doAttack(getMovePosition(game.scene, 0, Moves.DRAGON_RAGE));
    await game.phaseInterceptor.to(TurnEndPhase);
    const damageDealt = enemyPokemon.getMaxHp() - enemyPokemon.hp;

    expect(damageDealt).toBe(dragonRageDamage);
  });

  it("ignores stab", async () => {
    vi.spyOn(partyPokemon, "getTypes").mockReturnValue([Type.DRAGON]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.DRAGON_RAGE));
    await game.phaseInterceptor.to(TurnEndPhase);
    const damageDealt = enemyPokemon.getMaxHp() - enemyPokemon.hp;

    expect(damageDealt).toBe(dragonRageDamage);
  });

  it("ignores criticals", async () => {
    partyPokemon.removeTag(BattlerTagType.NO_CRIT);
    partyPokemon.addTag(BattlerTagType.ALWAYS_CRIT, 99);

    game.doAttack(getMovePosition(game.scene, 0, Moves.DRAGON_RAGE));
    await game.phaseInterceptor.to(TurnEndPhase);
    const damageDealt = enemyPokemon.getMaxHp() - enemyPokemon.hp;

    expect(damageDealt).toBe(dragonRageDamage);
  });

  it("ignores damage modification from abilities such as ice scales", async () => {
    game.override.enemyAbility(Abilities.ICE_SCALES);

    game.doAttack(getMovePosition(game.scene, 0, Moves.DRAGON_RAGE));
    await game.phaseInterceptor.to(TurnEndPhase);
    const damageDealt = enemyPokemon.getMaxHp() - enemyPokemon.hp;

    expect(damageDealt).toBe(dragonRageDamage);
  });

  it("ignores multi hit", async () => {
    game.scene.addModifier(modifierTypes.MULTI_LENS().newModifier(partyPokemon), false);

    game.doAttack(getMovePosition(game.scene, 0, Moves.DRAGON_RAGE));
    await game.phaseInterceptor.to(TurnEndPhase);
    const damageDealt = enemyPokemon.getMaxHp() - enemyPokemon.hp;

    expect(damageDealt).toBe(dragonRageDamage);
  });
});
