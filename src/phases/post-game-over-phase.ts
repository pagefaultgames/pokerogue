import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import type { EndCardPhase } from "#phases/end-card-phase";

export class PostGameOverPhase extends Phase {
  public readonly phaseName = "PostGameOverPhase";

  private readonly endCardPhase?: EndCardPhase | undefined;
  private readonly slotId: number;

  constructor(slotId: number, endCardPhase?: EndCardPhase) {
    super();

    this.slotId = slotId;
    this.endCardPhase = endCardPhase;
  }

  public override async start(): Promise<void> {
    super.start();

    const { gameData, phaseManager, ui } = globalScene;

    if (this.endCardPhase) {
      await ui.fadeOut(500);
      ui.getMessageHandler().bg.setVisible(true);

      this.endCardPhase?.endCard.destroy();
      this.endCardPhase?.text.destroy();
    }

    const saveSuccess = await gameData.saveAll(true, true, true);
    if (!saveSuccess) {
      return globalScene.reset(true);
    }

    const [clearSuccess] = await gameData.tryClearSession(this.slotId);
    if (!clearSuccess) {
      return globalScene.reset(true);
    }

    globalScene.reset();
    phaseManager.unshiftNew("TitlePhase");
    this.end();
  }
}
