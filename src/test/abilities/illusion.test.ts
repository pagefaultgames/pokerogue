import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Species } from "#enums/species";
import { Gender } from "../../data/gender";
import { PokeballType } from "../../data/pokeball";
import {
  TurnEndPhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.ZORUA);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.ILLUSION);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
    vi.spyOn(overrides, "OPP_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "WIDE_LENS", count: 3}]);

    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.WORRY_SEED, Moves.SOAK, Moves.TACKLE, Moves.TACKLE]);
    vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "WIDE_LENS", count: 3}]);
  });

  it("create illusion at the start", async () => {
    await game.startBattle([Species.ZOROARK, Species.AXEW]);

    const zoroark = game.scene.getPlayerPokemon();
    const zorua = game.scene.getEnemyPokemon();

    expect(zoroark.illusion.active).equals(true);
    expect(zorua.illusion.active).equals(true);
    expect(zoroark.illusion.available).equals(false);

  });

  it("disappear after receiving damaging move and changing ability move", async () => {
    await game.startBattle([Species.ZOROARK, Species.AXEW]);
    game.doAttack(getMovePosition(game.scene, 0, Moves.WORRY_SEED));

    await game.phaseInterceptor.to(TurnEndPhase);

    const zoroark = game.scene.getPlayerPokemon();
    const zorua = game.scene.getEnemyPokemon();

    expect(zorua.illusion.active).equals(false);
    expect(zoroark.illusion.active).equals(false);
  });

  it("disappear if the ability is suppressed", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NEUTRALIZING_GAS);
    await game.startBattle([Species.KOFFING]);

    const zorua = game.scene.getEnemyPokemon();

    expect(zorua.illusion.active).equals(false);
  });

  it("trick the enemy AI", async () => {
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.FLAMETHROWER, Moves.PSYCHIC, Moves.TACKLE, Moves.TACKLE]);
    await game.startBattle([Species.ZOROARK, Species.AXEW]);

    const enemy = game.scene.getEnemyPokemon();
    const zoroark = game.scene.getPlayerPokemon();

    const flameThwowerEffectiveness = zoroark.getAttackMoveEffectiveness(enemy, enemy.getMoveset()[0], false, true);
    const psychicEffectiveness = zoroark.getAttackMoveEffectiveness(enemy, enemy.getMoveset()[1], false, true);

    expect(psychicEffectiveness).above(flameThwowerEffectiveness);
  });

  it("do not disappear if the pokemon takes indirect damages", async () => {
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.GIGALITH);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.SAND_STREAM);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.WILL_O_WISP, Moves.WILL_O_WISP, Moves.WILL_O_WISP, Moves.WILL_O_WISP]);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.FLARE_BLITZ]);

    await game.startBattle([Species.ZOROARK, Species.AZUMARILL]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.FLARE_BLITZ));

    await game.phaseInterceptor.to(TurnEndPhase);

    const zoroark = game.scene.getPlayerPokemon();

    expect(zoroark.illusion.active).equals(true);
  });

  it("copy the the name, the nickname, the gender, the shininess and the pokeball of the pokemon", async () => {
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SCARY_FACE, Moves.SCARY_FACE, Moves.SCARY_FACE, Moves.SCARY_FACE]);

    await game.startBattle([Species.ABRA, Species.ZOROARK, Species.AXEW]);

    const axew = game.scene.getParty().at(2);
    axew.shiny = true;
    axew.nickname = btoa(unescape(encodeURIComponent("axew nickname")));
    axew.gender = Gender.FEMALE;
    axew.pokeball = PokeballType.GREAT_BALL;

    game.doSwitchPokemon(1);

    await game.phaseInterceptor.to(TurnEndPhase);

    const zoroark = game.scene.getPlayerPokemon();
    expect(zoroark.name).equals("Axew");
    expect(zoroark.getNameToRender()).equals("axew nickname");
    expect(zoroark.getGender(false, true)).equals(Gender.FEMALE);
    expect(zoroark.isShiny(true)).equals(true);
    expect(zoroark.illusion.pokeball).equals(PokeballType.GREAT_BALL);
  });
});
