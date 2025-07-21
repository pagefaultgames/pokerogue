import { Z$TurnMove } from "#system/schemas/v1.10/turn-move";
import { z } from "zod";


const Z$StatStage = z.int().min(-6).max(6).catch(0);

const Z$StatStageSet = z.tuple([
  Z$StatStage,
  Z$StatStage,
  Z$StatStage,
  Z$StatStage,
  Z$StatStage,
  Z$StatStage,
  Z$StatStage])
/**
 * Zod schema for Pokémon summon data as of version 1.10.
 * 
 */
export const Z$PokemonSummonData = z.object({
    statStages: Z$StatStageSet.optional().catch(undefined),
    moveQueue: z.array(Z$TurnMove).optional().catch(undefined),

    //#region Overrides for transform

    //#endregion Overrides for transform

});