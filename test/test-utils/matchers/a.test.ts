import { PokemonType } from "#enums/pokemon-type";
import { describe, expect, it } from "vitest";

describe("a", () => {
  it("r", () => {
    expect(1).toHaveTypes([PokemonType.FLYING]);
  });
});
