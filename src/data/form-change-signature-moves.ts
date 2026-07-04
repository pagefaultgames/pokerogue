import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";

export interface FormChangeSignatureMove {
  /** The move that will be learnt upon evolving. */
  learn: MoveId;
  /** The move that will be replaced upon evolving, if any. */
  replace?: MoveId;
}

/** Object containing all signature moves learnt or lost when changing between forms. */
export const formChangeSignatureMoves: Partial<Record<SpeciesId, Partial<Record<string, FormChangeSignatureMove[]>>>> =
  {
    [SpeciesId.ZAMAZENTA]: {
      "hero-of-many-battles": [{ learn: MoveId.IRON_HEAD, replace: MoveId.BEHEMOTH_BASH }],
      crowned: [{ learn: MoveId.BEHEMOTH_BASH, replace: MoveId.IRON_HEAD }],
    },
    [SpeciesId.NECROZMA]: {
      "": [
        { learn: MoveId.CONFUSION, replace: MoveId.SUNSTEEL_STRIKE },
        { learn: MoveId.CONFUSION, replace: MoveId.MOONGEIST_BEAM },
      ],
      "dusk-mane": [{ learn: MoveId.SUNSTEEL_STRIKE, replace: MoveId.CONFUSION }],
      "dawn-wings": [{ learn: MoveId.MOONGEIST_BEAM, replace: MoveId.CONFUSION }],
      ultra: [{ learn: MoveId.SUNSTEEL_STRIKE }, { learn: MoveId.MOONGEIST_BEAM }],
    },
    [SpeciesId.CALYREX]: {
      ice: [{ learn: MoveId.GLACIAL_LANCE }],
      shadow: [{ learn: MoveId.ASTRAL_BARRAGE }],
    },
    [SpeciesId.ZACIAN]: {
      "hero-of-many-battles": [{ learn: MoveId.IRON_HEAD, replace: MoveId.BEHEMOTH_BLADE }],
      crowned: [{ learn: MoveId.BEHEMOTH_BLADE, replace: MoveId.IRON_HEAD }],
    },
    [SpeciesId.HOOPA]: {
      "": [{ learn: MoveId.HYPERSPACE_HOLE, replace: MoveId.HYPERSPACE_FURY }],
      unbound: [{ learn: MoveId.HYPERSPACE_FURY, replace: MoveId.HYPERSPACE_HOLE }],
    },
    [SpeciesId.KYUREM]: {
      "": [
        { learn: MoveId.SCARY_FACE, replace: MoveId.FUSION_BOLT },
        { learn: MoveId.SCARY_FACE, replace: MoveId.FUSION_FLARE },
        { learn: MoveId.GLACIATE, replace: MoveId.FREEZE_SHOCK },
        { learn: MoveId.GLACIATE, replace: MoveId.ICE_BURN },
      ],
      black: [
        { learn: MoveId.FUSION_BOLT, replace: MoveId.SCARY_FACE },
        { learn: MoveId.FREEZE_SHOCK, replace: MoveId.GLACIATE },
      ],
      white: [
        { learn: MoveId.FUSION_FLARE, replace: MoveId.SCARY_FACE },
        { learn: MoveId.ICE_BURN, replace: MoveId.GLACIATE },
      ],
    },
  };
