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

    const saveAndReset = async () => {
      const saveSuccess = await globalScene.gameData.saveAll(true, true, true);
      if (!saveSuccess) {
        return globalScene.reset(true);
      }

      const [clearSuccess] = await globalScene.gameData.tryClearSession(this.slotId);
      if (!clearSuccess) {
        return globalScene.reset(true);
      }

      globalScene.reset();
      globalScene.phaseManager.toTitleScreen();

      this.end();
    };

    if (this.endCardPhase) {
      await globalScene.ui.fadeOut(500);
      globalScene.ui.getMessageHandler().bg.setVisible(true);

      this.endCardPhase?.endCard.destroy();
      this.endCardPhase?.text.destroy();
    }

    await saveAndReset();
  }
}
