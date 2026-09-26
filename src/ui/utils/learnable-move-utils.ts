import { LearnableMoveSource } from "#enums/learnable-move-source";

export function getLearnableMoveSourceIconFrame(source: LearnableMoveSource, tmType?: string | null): string {
  switch (source) {
    case LearnableMoveSource.EGG:
    case LearnableMoveSource.FUSION_EGG:
      return "common_egg";
    case LearnableMoveSource.PREVO:
    case LearnableMoveSource.FUSION_PREVO:
    case LearnableMoveSource.RELEARN:
    case LearnableMoveSource.FUSION_RELEARN:
    case LearnableMoveSource.EVOLUTION:
    case LearnableMoveSource.FUSION_EVOLUTION:
      return "big_mushroom";
    case LearnableMoveSource.TM:
    case LearnableMoveSource.FUSION_TM:
      return `tm_${tmType ?? "normal"}`;
    default:
      return "unknown";
  }
}
