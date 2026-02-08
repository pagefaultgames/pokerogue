import type { InputFieldConfig } from "#ui/form-modal-ui-handler";
import { FormModalUiHandler } from "#ui/form-modal-ui-handler";
import type { TestDialogueUiHandlerParams } from "#ui/ui-handler-params";
import type { ModalConfig } from "#ui/ui-types";
import i18next from "i18next";

export class RenameFormUiHandler extends FormModalUiHandler {
  getModalTitle(_config?: ModalConfig): string {
    return i18next.t("menu:renamePokemon");
  }

  getWidth(_config?: ModalConfig): number {
    return 160;
  }

  getMargin(_config?: ModalConfig): [number, number, number, number] {
    return [0, 0, 48, 0];
  }

  getButtonLabels(_config?: ModalConfig): string[] {
    return [i18next.t("menu:rename"), i18next.t("menu:cancel")];
  }

  getReadableErrorMessage(error: string): string {
    const colonIndex = error?.indexOf(":");
    if (colonIndex > 0) {
      error = error.slice(0, colonIndex);
    }

    return super.getReadableErrorMessage(error);
  }

  override getInputFieldConfigs(): InputFieldConfig[] {
    return [{ label: i18next.t("menu:nickname") }];
  }

  show(args: TestDialogueUiHandlerParams): boolean {
    if (super.show(args)) {
      const config = args[0] as ModalConfig;
      // TODO: shouldn't this be `const playerPokemon: PlayerPokemon | undefined = args[1];` and `if (playerPokemon)`?
      if (args.pokemon) {
        this.inputs[0].text = args.pokemon.getNameToRender({ useIllusion: false });
      } else {
        this.inputs[0].text = args.text ?? "";
      }
      this.submitAction = () => {
        this.sanitizeInputs();
        const sanitizedName = btoa(unescape(encodeURIComponent(this.inputs[0].text)));
        config.buttonActions[0](sanitizedName);
        return true;
      };
      return true;
    }
    return false;
  }
}
