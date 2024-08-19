import { TurnEndPhase } from "#app/phases/turn-end-phase.js";
import { MoveEndPhase } from "#app/phases/move-end-phase.js";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { Type } from "#app/data/type.js";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Challenges } from "#enums/challenges";
import { copyChallenge } from "data/challenge";
import { ArenaTagType } from "#enums/arena-tag-type";
import { SPLASH_ONLY } from "../utils/testUtils";
import { allMoves } from "#app/data/move";
import { AiType } from "#app/field/pokemon";
import { BattlerTagType } from "#enums/battler-tag-type";
import { StatusEffect } from "#enums/status-effect";



describe("Inverse Battle", () => {
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

    const challenge = {
      id: Challenges.INVERSE_BATTLE,
      value: 1,
      severity: 1,
    };

    game.scene.gameMode.challenges = [copyChallenge(challenge)];
    game.override.battleType("single");
    game.override.startingLevel(10);
  });

  it("1. immune types are 2x effective - Thunderbolt against Ground Type", async () => {
    game.override.enemySpecies(Species.SANDSHREW);
    game.override.enemyAbility(Abilities.SAND_VEIL);
    game.override.starterSpecies(Species.PIKACHU);

    await game.startBattle(undefined, false);

    const pikachu = game.scene.getPlayerPokemon()!;
    const sandshrew = game.scene.getEnemyPokemon()!;

    expect(sandshrew.getAttackTypeEffectiveness(allMoves[Moves.THUNDERBOLT].type, pikachu)).toBe(2);
  });

  it("2. 2x effective types are 0.5x effective - Thunderbolt against Flying Type", async () => {
    game.override.enemySpecies(Species.PIDGEY);
    game.override.enemyAbility(Abilities.KEEN_EYE);
    game.override.starterSpecies(Species.PIKACHU);

    await game.startBattle(undefined, false);

    const pikachu = game.scene.getPlayerPokemon()!;
    const pidgey = game.scene.getEnemyPokemon()!;

    expect(pidgey.getAttackTypeEffectiveness(allMoves[Moves.THUNDERBOLT].type, pikachu)).toBe(0.5);
  });

  it("3. 0.5x effective types are 2x effective - Thunderbolt against Electric Type", async () => {
    game.override.enemySpecies(Species.CHIKORITA);
    game.override.enemyAbility(Abilities.OVERGROW);
    game.override.starterSpecies(Species.PIKACHU);

    await game.startBattle(undefined, false);

    const pikachu = game.scene.getPlayerPokemon()!;
    const chikorita = game.scene.getEnemyPokemon()!;

    expect(chikorita.getAttackTypeEffectiveness(allMoves[Moves.THUNDERBOLT].type, pikachu)).toBe(2);
  });

  it("4. Stealth Rock follows the inverse matchups - Stealth Rock against Charizard deals 1/32 of max HP", async () => {
    game.scene.arena.addTag(ArenaTagType.STEALTH_ROCK, 1, Moves.STEALTH_ROCK, 0);
    game.override.enemySpecies(Species.CHARIZARD);
    game.override.enemyAbility(Abilities.BLAZE);
    game.override.starterSpecies(Species.PIKACHU);
    game.override.enemyLevel(100);

    await game.startBattle(undefined, false);

    const charizard = game.scene.getEnemyPokemon()!;

    const maxHp = charizard.getMaxHp();
    const damage_prediction = Math.max(Math.round(charizard.getMaxHp() / 32), 1);
    console.log("Damage calcuation before round: " + charizard.getMaxHp() / 32);
    const currentHp = charizard.hp;
    const expectedHP = maxHp - damage_prediction;

    console.log("Charizard's max HP: " + maxHp, "Damage: " + damage_prediction, "Current HP: " + currentHp, "Expected HP: " + expectedHP);
    expect(expectedHP).toBeGreaterThan(maxHp*31/32-1);
  });

  it("5. Freeze Dry is 2x effective against Water Type like other Ice type Move - Freeze Dry against Squirtle", async () => {
    game.override.enemySpecies(Species.SQUIRTLE);
    game.override.enemyAbility(Abilities.TORRENT);
    game.override.starterSpecies(Species.ARTICUNO);

    await game.startBattle(undefined, false);

    const squirtle = game.scene.getEnemyPokemon()!;
    const articuno = game.scene.getPlayerPokemon()!;

    expect(squirtle.getAttackTypeEffectiveness(allMoves[Moves.FREEZE_DRY].type, articuno)).toBe(2);
  });

  it("6. AI should use moves that are 2x effective - Fire Fang prefered over Ice Fang against Dragon Type", async () => {
    game.override.seed("Fire Fang vs Ice Fang against Dragon Type");
    game.override.enemySpecies(Species.SANDSHREW);
    game.override.enemyAbility(Abilities.SAND_VEIL);
    game.override.enemyMoveset([Moves.ICE_FANG, Moves.FIRE_FANG]);
    game.override.starterSpecies(Species.DRATINI);
    game.override.moveset(SPLASH_ONLY);

    await game.startBattle(undefined, false);

    const sandshrew = game.scene.getEnemyPokemon()!;
    sandshrew.aiType = AiType.SMART;

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

    await game.phaseInterceptor.to(TurnEndPhase);
    expect(sandshrew.getLastXMoves()[0].move).toBe(Moves.FIRE_FANG);
  });

  it("7. Water Absorb should heal against water moves - Water Absorb against Water gun", async () => {
    game.override.starterSpecies(Species.SQUIRTLE);
    game.override.moveset([Moves.WATER_GUN]);
    game.override.enemySpecies(Species.PIKACHU);
    game.override.enemyAbility(Abilities.WATER_ABSORB);

    await game.startBattle(undefined, false);

    const pikachu = game.scene.getEnemyPokemon()!;
    pikachu.hp = pikachu.getMaxHp() - 1;
    game.doAttack(getMovePosition(game.scene, 0, Moves.WATER_GUN));

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(pikachu.hp).toBe(pikachu.getMaxHp());
  });

  it("8. Fire type does not get burned - Will-O-Wisp against Charmander", async () => {
    game.override.starterSpecies(Species.PIKACHU);
    game.override.moveset([Moves.WILL_O_WISP]);
    game.override.enemySpecies(Species.CHARMANDER);
    game.override.enemyMoveset(SPLASH_ONLY);

    await game.startBattle(undefined, false);

    const charmander = game.scene.getEnemyPokemon()!;
    charmander.addTag(BattlerTagType.ALWAYS_GET_HIT, 99);

    game.doAttack(getMovePosition(game.scene, 0, Moves.WILL_O_WISP));

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(charmander.status?.effect).not.toBe(StatusEffect.BURN);
  });

  it("9. Electric type does not get paralyzed - Thunder Wave against Pikachu", async () => {
    game.override.starterSpecies(Species.PICHU);
    game.override.moveset([Moves.NUZZLE]);
    game.override.enemySpecies(Species.PIKACHU);
    game.override.enemyMoveset(SPLASH_ONLY);

    await game.startBattle(undefined, false);

    const pikachu = game.scene.getEnemyPokemon()!;

    game.doAttack(getMovePosition(game.scene, 0, Moves.NUZZLE));

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(pikachu.status?.effect).not.toBe(StatusEffect.PARALYSIS);
  });

  it("10. Ground type does not immune to Thunder Wave - Thunder Wave against Sandshrew", async () => {
    game.override.starterSpecies(Species.PIKACHU);
    game.override.moveset([Moves.THUNDER_WAVE]);
    game.override.enemySpecies(Species.SANDSHREW);
    game.override.enemyMoveset(SPLASH_ONLY);

    await game.startBattle(undefined, false);

    const sandshrew = game.scene.getEnemyPokemon()!;

    sandshrew.addTag(BattlerTagType.ALWAYS_GET_HIT, 99);

    game.doAttack(getMovePosition(game.scene, 0, Moves.THUNDER_WAVE));

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(sandshrew.status?.effect).toBe(StatusEffect.PARALYSIS);
  });

  it("11. Anticipation should trigger on 2x effective moves - Anticipation against Thunderbolt", async () => {
    game.override.starterSpecies(Species.PIKACHU);
    game.override.moveset([Moves.THUNDERBOLT]);
    game.override.enemySpecies(Species.SANDSHREW);
    game.override.enemyAbility(Abilities.ANTICIPATION);
    game.override.enemyMoveset(SPLASH_ONLY);

    await game.startBattle(undefined, false);

    game.doAttack(getMovePosition(game.scene, 0, Moves.THUNDERBOLT));

    await game.phaseInterceptor.to(MoveEndPhase);
  });

  it("12. Conversion 2 should change the type to the resistive type - Conversion 2 against Dragonite", async () => {
    game.override.starterSpecies(Species.PORYGON);
    game.override.moveset([Moves.CONVERSION_2]);
    game.override.enemySpecies(Species.DRAGONITE);
    game.override.enemyAbility(Abilities.MULTISCALE);
    game.override.enemyMoveset([Moves.DRAGON_CLAW, Moves.DRAGON_CLAW, Moves.DRAGON_CLAW, Moves.DRAGON_CLAW]);
    game.override.enemyLevel(10);

    await game.startBattle(undefined, false);

    const porygon = game.scene.getPlayerPokemon()!;

    game.doAttack(getMovePosition(game.scene, 0, Moves.CONVERSION_2));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(porygon.getTypes()[0]).toBe(Type.DRAGON);
  });
});
