import type { SpeciesId } from "#enums/species-id";

export interface SamplerPayload {
  speciesId: SpeciesId;
  boss: boolean;
  level: number;
  trials: number;
  printWeights?: boolean;
}
