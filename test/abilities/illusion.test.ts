import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/testUtils/gameManager";
import { Species } from "#enums/species";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Abilities } from "#enums/abilities";
import { PokeballType } from "#app/enums/pokeball";
import { Gender } from "#app/data/gender";

describe("Abilities - Illusion", () => {
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
    game.override.battleType("single");
    game.override.enemySpecies(Species.ZORUA);
    game.override.enemyAbility(Abilities.ILLUSION);
    game.override.enemyMoveset(Moves.TACKLE);
    game.override.enemyHeldItems([{ name: "WIDE_LENS", count: 3 }]);

    game.override.moveset([Moves.WORRY_SEED, Moves.SOAK, Moves.TACKLE]);
    game.override.startingHeldItems([{ name: "WIDE_LENS", count: 3 }]);
  });

  it("creates illusion at the start", async () => {
    await game.classicMode.startBattle([Species.ZOROARK, Species.AXEW]);
    const zoroark = game.scene.getPlayerPokemon()!;
    const zorua = game.scene.getEnemyPokemon()!;

    expect(!!zoroark.summonData?.illusion).equals(true);
    expect(!!zorua.summonData?.illusion).equals(true);
  });

  it("break after receiving damaging move", async () => {
    await game.classicMode.startBattle([Species.AXEW]);
    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    const zorua = game.scene.getEnemyPokemon()!;

    expect(!!zorua.summonData?.illusion).equals(false);
    expect(zorua.name).equals("Zorua");
  });

  it("break after getting ability changed", async () => {
    await game.classicMode.startBattle([Species.AXEW]);
    game.move.select(Moves.WORRY_SEED);

    await game.phaseInterceptor.to(TurnEndPhase);

    const zorua = game.scene.getEnemyPokemon()!;

    expect(!!zorua.summonData?.illusion).equals(false);
  });

  it("break if the ability is suppressed", async () => {
    game.override.enemyAbility(Abilities.NEUTRALIZING_GAS);
    await game.classicMode.startBattle([Species.KOFFING]);

    const zorua = game.scene.getEnemyPokemon()!;

    expect(!!zorua.summonData?.illusion).equals(false);
  });

  it("causes enemy AI to consider the illusion's type instead of the actual type when considering move effectiveness", async () => {
    game.override.enemyMoveset([Moves.FLAMETHROWER, Moves.PSYCHIC, Moves.TACKLE]);
    await game.classicMode.startBattle([Species.ZOROARK, Species.AXEW]);

    const enemy = game.scene.getEnemyPokemon()!;
    const zoroark = game.scene.getPlayerPokemon()!;

    const flameThrower = enemy.getMoveset()[0]!.getMove();
    const psychic = enemy.getMoveset()[1]!.getMove();
    const flameThrowerEffectiveness = zoroark.getAttackTypeEffectiveness(
      flameThrower.type,
      enemy,
      undefined,
      undefined,
      flameThrower,
      true,
    );
    const psychicEffectiveness = zoroark.getAttackTypeEffectiveness(
      psychic.type,
      enemy,
      undefined,
      undefined,
      psychic,
      true,
    );
    expect(psychicEffectiveness).above(flameThrowerEffectiveness);
  });

  it("does not break from indirect damage", async () => {
    game.override.enemySpecies(Species.GIGALITH);
    game.override.enemyAbility(Abilities.SAND_STREAM);
    game.override.enemyMoveset(Moves.WILL_O_WISP);
    game.override.moveset([Moves.FLARE_BLITZ]);

    await game.classicMode.startBattle([Species.ZOROARK, Species.AZUMARILL]);

    game.move.select(Moves.FLARE_BLITZ);

    await game.phaseInterceptor.to(TurnEndPhase);

    const zoroark = game.scene.getPlayerPokemon()!;

    expect(!!zoroark.summonData?.illusion).equals(true);
  });

  it("copies the the name, nickname, gender, shininess, and pokeball from the illusion source", async () => {
    game.override.enemyMoveset(Moves.SPLASH);
    await game.classicMode.startBattle([Species.ABRA, Species.ZOROARK, Species.AXEW]);
    const axew = game.scene.getPlayerParty().at(2)!;
    axew.shiny = true;
    axew.nickname = btoa(unescape(encodeURIComponent("axew nickname")));
    axew.gender = Gender.FEMALE;
    axew.pokeball = PokeballType.GREAT_BALL;

    game.doSwitchPokemon(1);

    await game.phaseInterceptor.to(TurnEndPhase);

    const zoroark = game.scene.getPlayerPokemon()!;

    expect(zoroark.name).equals("Axew");
    expect(zoroark.getNameToRender()).equals("axew nickname");
    expect(zoroark.getGender(false, true)).equals(Gender.FEMALE);
    expect(zoroark.isShiny(true)).equals(true);
    expect(zoroark.getPokeball(true)).equals(PokeballType.GREAT_BALL);
  });
});
