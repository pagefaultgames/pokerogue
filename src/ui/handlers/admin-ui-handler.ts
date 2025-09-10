import { pokerogueApi } from "#api/pokerogue-api";
import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import type { InputFieldConfig } from "#ui/handlers/form-modal-ui-handler";
import { FormModalUiHandler } from "#ui/handlers/form-modal-ui-handler";
import type { ModalConfig } from "#ui/handlers/modal-ui-handler";
import { getTextColor } from "#ui/text";
import { toTitleCase } from "#utils/strings";

type AdminUiHandlerService = "discord" | "google";
type AdminUiHandlerServiceMode = "Link" | "Unlink";

export class AdminUiHandler extends FormModalUiHandler {
  private adminMode: AdminMode;
  private adminResult: AdminSearchInfo;
  private config: ModalConfig;

  private readonly buttonGap = 10;
  private readonly ERR_REQUIRED_FIELD = (field: string) => {
    if (field === "username") {
      return `${toTitleCase(field)} is required`;
    }
    return `${toTitleCase(field)} Id is required`;
  };
  // returns a string saying whether a username has been successfully linked/unlinked to discord/google
  private readonly SUCCESS_SERVICE_MODE = (service: string, mode: string) => {
    return `Username and ${service} successfully ${mode.toLowerCase()}ed`;
  };

  constructor(mode: UiMode | null = null) {
    super(mode);
  }

  override getModalTitle(): string {
    return "Admin panel";
  }

  override getWidth(): number {
    return this.adminMode === AdminMode.ADMIN ? 180 : 160;
  }

  override getMargin(): [number, number, number, number] {
    return [0, 0, 0, 0];
  }

  override getButtonLabels(): string[] {
    switch (this.adminMode) {
      case AdminMode.LINK:
        return ["Link Account", "Cancel"];
      case AdminMode.SEARCH:
        return ["Find account", "Cancel"];
      case AdminMode.ADMIN:
        return ["Back to search", "Cancel"];
      default:
        return ["Activate ADMIN", "Cancel"];
    }
  }

  override getInputFieldConfigs(): InputFieldConfig[] {
    const inputFieldConfigs: InputFieldConfig[] = [];
    switch (this.adminMode) {
      case AdminMode.LINK:
        inputFieldConfigs.push({ label: "Username" });
        inputFieldConfigs.push({ label: "Discord ID" });
        break;
      case AdminMode.SEARCH:
        inputFieldConfigs.push({ label: "Username" });
        break;
      case AdminMode.ADMIN: {
        const adminResult = this.adminResult ?? {
          username: "",
          discordId: "",
          googleId: "",
          lastLoggedIn: "",
          registered: "",
        };
        // Discord and Google ID fields that are not empty get locked, other fields are all locked
        inputFieldConfigs.push({ label: "Username", isReadOnly: true });
        inputFieldConfigs.push({
          label: "Discord ID",
          isReadOnly: adminResult.discordId !== "",
        });
        inputFieldConfigs.push({
          label: "Google ID",
          isReadOnly: adminResult.googleId !== "",
        });
        inputFieldConfigs.push({ label: "Last played", isReadOnly: true });
        inputFieldConfigs.push({ label: "Registered", isReadOnly: true });
        break;
      }
    }
    return inputFieldConfigs;
  }

  processInput(button: Button): boolean {
    if (button === Button.SUBMIT && this.submitAction) {
      this.submitAction();
      return true;
    }

    return false;
  }

  show(args: any[]): boolean {
    this.config = args[0] as ModalConfig; // config
    this.adminMode = args[1] as AdminMode; // admin mode
    this.adminResult = args[2] ?? {
      username: "",
      discordId: "",
      googleId: "",
      lastLoggedIn: "",
      registered: "",
    }; // admin result, if any
    const isMessageError = args[3]; // is the message shown a success or error

    const fields = this.getInputFieldConfigs();
    const hasTitle = !!this.getModalTitle();

    this.updateFields(fields, hasTitle);
    this.updateContainer(this.config);

    const labels = this.getButtonLabels();
    for (let i = 0; i < labels.length; i++) {
      this.buttonLabels[i].setText(labels[i]); // sets the label text
    }

    this.errorMessage.setPosition(10, (hasTitle ? 31 : 5) + 20 * (fields.length - 1) + 16 + this.getButtonTopMargin()); // sets the position of the message dynamically
    if (isMessageError) {
      this.errorMessage.setColor(getTextColor(TextStyle.SUMMARY_PINK));
      this.errorMessage.setShadowColor(getTextColor(TextStyle.SUMMARY_PINK, true));
    } else {
      this.errorMessage.setColor(getTextColor(TextStyle.SUMMARY_GREEN));
      this.errorMessage.setShadowColor(getTextColor(TextStyle.SUMMARY_GREEN, true));
    }

    if (super.show(args)) {
      this.populateFields(this.adminMode, this.adminResult);
      const originalSubmitAction = this.submitAction;
      this.submitAction = _ => {
        this.submitAction = originalSubmitAction;
        const adminSearchResult: AdminSearchInfo = this.convertInputsToAdmin(); // this converts the input texts into a single object for use later
        const validFields = this.areFieldsValid(this.adminMode);
        if (validFields.error) {
          globalScene.ui.setMode(UiMode.LOADING, { buttonActions: [] }); // this is here to force a loading screen to allow the admin tool to reopen again if there's an error
          return this.showMessage(validFields.errorMessage ?? "", adminSearchResult, true);
        }
        globalScene.ui.setMode(UiMode.LOADING, { buttonActions: [] });
        if (this.adminMode === AdminMode.LINK) {
          this.adminLinkUnlink(adminSearchResult, "discord", "Link") // calls server to link discord
            .then(response => {
              if (response.error) {
                return this.showMessage(response.errorType, adminSearchResult, true); // error or some kind
              }
              return this.showMessage(this.SUCCESS_SERVICE_MODE("discord", "link"), adminSearchResult, false); // success
            });
        } else if (this.adminMode === AdminMode.SEARCH) {
          this.adminSearch(adminSearchResult) // admin search for username
            .then(response => {
              if (response.error) {
                return this.showMessage(response.errorType, adminSearchResult, true); // failure
              }
              this.updateAdminPanelInfo(response.adminSearchResult ?? adminSearchResult); // success
            });
        } else if (this.adminMode === AdminMode.ADMIN) {
          this.updateAdminPanelInfo(adminSearchResult, AdminMode.SEARCH);
        }
      };
      return true;
    }
    return false;
  }

  showMessage(message: string, adminResult: AdminSearchInfo, isError: boolean) {
    globalScene.ui.setMode(
      UiMode.ADMIN,
      Object.assign(this.config, { errorMessage: message?.trim() }),
      this.adminMode,
      adminResult,
      isError,
    );
    if (isError) {
      globalScene.ui.playError();
    } else {
      globalScene.ui.playSelect();
    }
  }

  /**
   * This is used to update the fields' text when loading in a new admin ui handler. It uses the {@linkcode adminResult}
   * to update the input text based on the {@linkcode adminMode}. For a linking adminMode, it sets the username and discord.
   * For a search adminMode, it sets the username. For an admin adminMode, it sets all the info from adminResult in the
   * appropriate text boxes, and also sets the link/unlink icons for discord/google depending on the result
   */
  private populateFields(adminMode: AdminMode, adminResult: AdminSearchInfo) {
    switch (adminMode) {
      case AdminMode.LINK:
        this.inputs[0].setText(adminResult.username);
        this.inputs[1].setText(adminResult.discordId);
        break;
      case AdminMode.SEARCH:
        this.inputs[0].setText(adminResult.username);
        break;
      case AdminMode.ADMIN:
        Object.keys(adminResult).forEach((aR, i) => {
          this.inputs[i].setText(adminResult[aR]);
          if (aR === "discordId" || aR === "googleId") {
            // this is here to add the icons for linking/unlinking of google/discord IDs
            const nineSlice = this.inputContainers[i].list.find(iC => iC.type === "NineSlice");
            const img = globalScene.add.image(
              this.inputContainers[i].x + nineSlice!.width + this.buttonGap,
              this.inputContainers[i].y + Math.floor(nineSlice!.height / 2),
              adminResult[aR] === "" ? "link_icon" : "unlink_icon",
            );
            img.setName(`adminBtn_${aR}`);
            img.setOrigin(0.5, 0.5);
            img.setInteractive();
            img.on("pointerdown", () => {
              const service = aR.toLowerCase().replace("id", ""); // this takes our key (discordId or googleId) and removes the "Id" at the end to make it more url friendly
              const mode = adminResult[aR] === "" ? "Link" : "Unlink"; // this figures out if we're linking or unlinking a service
              const validFields = this.areFieldsValid(this.adminMode, service);
              if (validFields.error) {
                globalScene.ui.setMode(UiMode.LOADING, { buttonActions: [] }); // this is here to force a loading screen to allow the admin tool to reopen again if there's an error
                return this.showMessage(validFields.errorMessage ?? "", adminResult, true);
              }
              this.adminLinkUnlink(this.convertInputsToAdmin(), service as AdminUiHandlerService, mode).then(
                response => {
                  // attempts to link/unlink depending on the service
                  if (response.error) {
                    globalScene.ui.setMode(UiMode.LOADING, { buttonActions: [] });
                    return this.showMessage(response.errorType, adminResult, true); // fail
                  }
                  // success, reload panel with new results
                  globalScene.ui.setMode(UiMode.LOADING, { buttonActions: [] });
                  this.adminSearch(adminResult).then(response => {
                    if (response.error) {
                      return this.showMessage(response.errorType, adminResult, true);
                    }
                    return this.showMessage(
                      this.SUCCESS_SERVICE_MODE(service, mode),
                      response.adminSearchResult ?? adminResult,
                      false,
                    );
                  });
                },
              );
            });
            this.addInteractionHoverEffect(img);
            this.modalContainer.add(img);
          }
        });
        break;
    }
  }

  private areFieldsValid(adminMode: AdminMode, service?: string): { error: boolean; errorMessage?: string } {
    switch (adminMode) {
      case AdminMode.LINK:
        if (!this.inputs[0].text) {
          // username missing from link panel
          return {
            error: true,
            errorMessage: this.ERR_REQUIRED_FIELD("username"),
          };
        }
        if (!this.inputs[1].text) {
          // discordId missing from linking panel
          return {
            error: true,
            errorMessage: this.ERR_REQUIRED_FIELD("discord"),
          };
        }
        break;
      case AdminMode.SEARCH:
        if (!this.inputs[0].text) {
          // username missing from search panel
          return {
            error: true,
            errorMessage: this.ERR_REQUIRED_FIELD("username"),
          };
        }
        break;
      case AdminMode.ADMIN:
        if (!this.inputs[1].text && service === "discord") {
          // discordId missing from admin panel
          return {
            error: true,
            errorMessage: this.ERR_REQUIRED_FIELD(service),
          };
        }
        if (!this.inputs[2].text && service === "google") {
          // googleId missing from admin panel
          return {
            error: true,
            errorMessage: this.ERR_REQUIRED_FIELD(service),
          };
        }
        break;
    }
    return {
      error: false,
    };
  }

  private convertInputsToAdmin(): AdminSearchInfo {
    return {
      username: this.inputs[0]?.node ? this.inputs[0].text : "",
      discordId: this.inputs[1]?.node ? this.inputs[1]?.text : "",
      googleId: this.inputs[2]?.node ? this.inputs[2]?.text : "",
      lastLoggedIn: this.inputs[3]?.node ? this.inputs[3]?.text : "",
      registered: this.inputs[4]?.node ? this.inputs[4]?.text : "",
    };
  }

  private async adminSearch(adminSearchResult: AdminSearchInfo) {
    try {
      const [adminInfo, errorType] = await pokerogueApi.admin.searchAccount({
        username: adminSearchResult.username,
      });
      if (errorType || !adminInfo) {
        // error - if adminInfo.status === this.httpUserNotFoundErrorCode that means the username can't be found in the db
        return { adminSearchResult, error: true, errorType };
      }
      // success
      return { adminSearchResult: adminInfo, error: false };
    } catch (err) {
      console.error(err);
      return { error: true, errorType: err };
    }
  }

  private async adminLinkUnlink(
    adminSearchResult: AdminSearchInfo,
    service: AdminUiHandlerService,
    mode: AdminUiHandlerServiceMode,
  ) {
    try {
      let errorType: string | null = null;

      if (service === "discord") {
        if (mode === "Link") {
          errorType = await pokerogueApi.admin.linkAccountToDiscord({
            discordId: adminSearchResult.discordId,
            username: adminSearchResult.username,
          });
        } else if (mode === "Unlink") {
          errorType = await pokerogueApi.admin.unlinkAccountFromDiscord({
            discordId: adminSearchResult.discordId,
            username: adminSearchResult.username,
          });
        } else {
          console.warn("Unknown mode", mode, "for service", service);
        }
      } else if (service === "google") {
        if (mode === "Link") {
          errorType = await pokerogueApi.admin.linkAccountToGoogleId({
            googleId: adminSearchResult.googleId,
            username: adminSearchResult.username,
          });
        } else if (mode === "Unlink") {
          errorType = await pokerogueApi.admin.unlinkAccountFromGoogleId({
            googleId: adminSearchResult.googleId,
            username: adminSearchResult.username,
          });
        } else {
          console.warn("Unknown mode", mode, "for service", service);
        }
      } else {
        console.warn("Unknown service", service);
      }

      if (errorType) {
        // error - if response.status === this.httpUserNotFoundErrorCode that means the username can't be found in the db
        return { adminSearchResult, error: true, errorType };
      }
      // success!
      return { adminSearchResult, error: false };
    } catch (err) {
      console.error(err);
      return { error: true, errorType: err };
    }
  }

  private updateAdminPanelInfo(adminSearchResult: AdminSearchInfo, mode?: AdminMode) {
    mode = mode ?? AdminMode.ADMIN;
    globalScene.ui.setMode(
      UiMode.ADMIN,
      {
        buttonActions: [
          // we double revert here and below to go back 2 layers of menus
          () => {
            globalScene.ui.revertMode();
            globalScene.ui.revertMode();
          },
          () => {
            globalScene.ui.revertMode();
            globalScene.ui.revertMode();
          },
        ],
      },
      mode,
      adminSearchResult,
    );
  }

  clear(): void {
    super.clear();

    // this is used to remove the existing fields on the admin panel so they can be updated

    const itemsToRemove: string[] = ["formLabel", "adminBtn"]; // this is the start of the names for each element we want to remove
    const removeArray: any[] = [];
    const mC = this.modalContainer.list;
    for (let i = mC.length - 1; i >= 0; i--) {
      /* This code looks for a few things before destroying the specific field; first it looks to see if the name of the element is %like% the itemsToRemove labels
       * this means that anything with, for example, "formLabel", will be true.
       * It then also checks for any containers that are within this.modalContainer, and checks if any of its child elements are of type rexInputText
       * and if either of these conditions are met, the element is destroyed.
       */
      if (
        itemsToRemove.some(iTR => mC[i].name.includes(iTR))
        || (mC[i].type === "Container"
          && (mC[i] as Phaser.GameObjects.Container).list.find(m => m.type === "rexInputText"))
      ) {
        removeArray.push(mC[i]);
      }
    }

    while (removeArray.length > 0) {
      this.modalContainer.remove(removeArray.pop(), true);
    }
  }
}

export enum AdminMode {
  LINK,
  SEARCH,
  ADMIN,
}

export function getAdminModeName(adminMode: AdminMode): string {
  switch (adminMode) {
    case AdminMode.LINK:
      return "Link";
    case AdminMode.SEARCH:
      return "Search";
    default:
      return "";
  }
}

interface AdminSearchInfo {
  username: string;
  discordId: string;
  googleId: string;
  lastLoggedIn: string;
  registered: string;
}
