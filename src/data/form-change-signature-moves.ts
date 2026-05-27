import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";

export interface FormChangeSignatureMove {
  learn: MoveId;
  replace?: MoveId;
}

export const formChangeSignatureMoves: Partial<Record<SpeciesId, Partial<Record<string, FormChangeSignatureMove[]>>>> =
  {
    [SpeciesId.ZAMAZENTA]: {
      "hero-of-many-battles": [{ learn: MoveId.IRON_HEAD, replace: MoveId.BEHEMOTH_BASH }],
      "crowned": [{ learn: MoveId.BEHEMOTH_BASH, replace: MoveId.IRON_HEAD }],
    },
    [SpeciesId.NECROZMA]: {
      "": [
        { learn: MoveId.CONFUSION, replace: MoveId.SUNSTEEL_STRIKE },
        { learn: MoveId.CONFUSION, replace: MoveId.MOONGEIST_BEAM },
      ],
      "dusk-mane": [{ learn: MoveId.SUNSTEEL_STRIKE, replace: MoveId.CONFUSION }],
      "dawn-wings": [{ learn: MoveId.MOONGEIST_BEAM, replace: MoveId.CONFUSION }],
      "ultra": [{ learn: MoveId.SUNSTEEL_STRIKE }, { learn: MoveId.MOONGEIST_BEAM }],
    },
    [SpeciesId.CALYREX]: {
      "ice": [{ learn: MoveId.GLACIAL_LANCE }],
      "shadow": [{ learn: MoveId.ASTRAL_BARRAGE }],
    },
  };
