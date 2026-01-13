/*
 * SPDX-Copyright-Text: 2026 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { SpeciesId } from "#enums/species-id";

export interface SamplerPayload {
  speciesId: SpeciesId;
  boss: boolean;
  level: number;
  trials: number;
  forTrainer: boolean;
  printWeights: boolean;
  abilityIndex?: number;
}
