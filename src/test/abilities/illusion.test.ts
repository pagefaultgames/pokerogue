import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Species } from "#enums/species";
import { Gender } from "../../data/gender";
import { PokeballType } from "../../data/pokeball";
import {
  TurnEndPhase,
} from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Abilities } from "#enums/abilities";

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
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
    game.override.enemyHeldItems([{name: "WIDE_LENS", count: 3}]);

    game.override.moveset([Moves.WORRY_SEED, Moves.SOAK, Moves.TACKLE, Moves.TACKLE]);
    game.override.startingHeldItems([{name: "WIDE_LENS", count: 3}]);
  });

  it("creates illusion at the start", async () => {
    await game.startBattle([Species.ZOROARK, Species.AXEW]);

    const zoroark = game.scene.getPlayerPokemon()!;
    const zorua = game.scene.getEnemyPokemon()!;

    expect(zoroark.battleData.illusion.active).equals(true);
    expect(zorua.battleData.illusion.active).equals(true);
    expect(zoroark.battleData.illusion.available).equals(false);
  });

  it("break after receiving damaging move", async () => {
    await game.startBattle([Species.AXEW]);
    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    const zorua = game.scene.getEnemyPokemon()!;

    expect(zorua.battleData.illusion.active).equals(false);
  });

  it("break after getting ability changed", async () => {
    await game.startBattle([Species.AXEW]);
    game.move.select(Moves.WORRY_SEED);

    await game.phaseInterceptor.to(TurnEndPhase);

    const zorua = game.scene.getEnemyPokemon()!;

    expect(zorua.battleData.illusion.active).equals(false);
  });

  it("break if the ability is suppressed", async () => {
    game.override.enemyAbility(Abilities.NEUTRALIZING_GAS);
    await game.startBattle([Species.KOFFING]);

    const zorua = game.scene.getEnemyPokemon()!;

    expect(zorua.battleData.illusion.active).equals(false);
  });

  it("trick the enemy AI for moves effectiveness using ILLUSION type instead of actual type", async () => {
    game.override.enemyMoveset([Moves.FLAMETHROWER, Moves.PSYCHIC, Moves.TACKLE, Moves.TACKLE]);
    await game.startBattle([Species.ZOROARK, Species.AXEW]);

    const enemy = game.scene.getEnemyPokemon()!;
    const zoroark = game.scene.getPlayerPokemon()!;

    const flameThrower = enemy.getMoveset()[0]!.getMove();
    const psychic = enemy.getMoveset()[1]!.getMove();
    const flameThrowerEffectiveness = zoroark.getAttackTypeEffectiveness(flameThrower.type, enemy, undefined, undefined, true);
    const psychicEffectiveness = zoroark.getAttackTypeEffectiveness(psychic.type, enemy, undefined, undefined, true);
    expect(psychicEffectiveness).above(flameThrowerEffectiveness);
  });

  it("do not breaks if the pokemon takes indirect damages", async () => {
    game.override.enemySpecies(Species.GIGALITH);
    game.override.enemyAbility(Abilities.SAND_STREAM);
    game.override.enemyMoveset([Moves.WILL_O_WISP, Moves.WILL_O_WISP, Moves.WILL_O_WISP, Moves.WILL_O_WISP]);
    game.override.moveset([Moves.FLARE_BLITZ]);

    await game.startBattle([Species.ZOROARK, Species.AZUMARILL]);

    game.move.select(Moves.FLARE_BLITZ);

    await game.phaseInterceptor.to(TurnEndPhase);

    const zoroark = game.scene.getPlayerPokemon()!;

    expect(zoroark.battleData.illusion.active).equals(true);
  });

  it("copy the the name, the nickname, the gender, the shininess and the pokeball of the pokemon", async () => {
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SCARY_FACE, Moves.SCARY_FACE, Moves.SCARY_FACE, Moves.SCARY_FACE]);

    await game.startBattle([Species.ABRA, Species.ZOROARK, Species.AXEW]);

    const axew = game.scene.getParty().at(2)!;
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
    expect(zoroark.battleData.illusion.pokeball).equals(PokeballType.GREAT_BALL);
  });
});
