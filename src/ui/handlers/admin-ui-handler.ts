import { pokerogueApi } from "#api/pokerogue-api";
import { globalScene } from "#app/global-scene";
import { bypassLogin } from "#app/global-vars/bypass-login";
import { AdminMode } from "#enums/admin-mode";
import { Button } from "#enums/buttons";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { GameData } from "#system/game-data";
import type {
  AdminUiHandlerService,
  AdminUiHandlerServiceMode,
  SearchAccountResponse,
} from "#types/api/pokerogue-admin-api";
import type { InputFieldConfig } from "#ui/form-modal-ui-handler";
import { FormModalUiHandler } from "#ui/form-modal-ui-handler";
import type { ModalConfig } from "#ui/modal-ui-handler";
import { getTextColor } from "#ui/text";
import { toTitleCase } from "#utils/strings";

export class AdminUiHandler extends FormModalUiHandler {
  private adminMode: AdminMode;
  private adminResult: SearchAccountResponse;
  private config: ModalConfig;

  private tempGameData: GameData | null = null;

  private readonly buttonGap = 10;
  /** @returns "[field] is required" */
  private static ERR_REQUIRED_FIELD(field: string) {
    if (field === "username") {
      return `${toTitleCase(field)} is required`;
    }
    return `${toTitleCase(field)} Id is required`;
  }
  /** @returns "Username and [service] successfully [mode]ed" */
  private static SUCCESS_SERVICE_MODE(service: string, mode: string) {
    return `Username and ${service} successfully ${mode.toLowerCase()}ed`;
  }

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
        return ["Link Account", "Cancel", "", ""];
      case AdminMode.SEARCH:
        return ["Find account", "Cancel", "", ""];
      case AdminMode.ADMIN:
        return ["Back to search", "Cancel", "Stats", "Pokedex"];
      default:
        return ["Activate ADMIN", "Cancel", "Stats", "Pokedex"];
    }
  }

  override getInputFieldConfigs(): InputFieldConfig[] {
    switch (this.adminMode) {
      case AdminMode.LINK:
        return [{ label: "Username" }, { label: "Discord ID" }];
      case AdminMode.SEARCH:
        return [{ label: "Username" }];
      case AdminMode.ADMIN: {
        // Discord and Google ID fields that are not empty get locked, other fields are all locked
        return [
          { label: "Username", isReadOnly: true },
          {
            label: "Discord ID",
            isReadOnly: (this.adminResult?.discordId ?? "") !== "",
          },
          {
            label: "Google ID",
            isReadOnly: (this.adminResult?.googleId ?? "") !== "",
          },
          { label: "Last played", isReadOnly: true },
          { label: "Registered", isReadOnly: true },
        ];
      }
      default:
        return [];
    }
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

    const msgColor = isMessageError ? TextStyle.SUMMARY_PINK : TextStyle.SUMMARY_GREEN;

    this.errorMessage
      .setPosition(10, (hasTitle ? 31 : 5) + 20 * (fields.length - 1) + 16 + this.getButtonTopMargin())
      .setColor(getTextColor(msgColor))
      .setShadowColor(getTextColor(msgColor, true));

    if (!super.show(args)) {
      return false;
    }

    this.hideLastButtons(this.adminMode === AdminMode.ADMIN ? 0 : 2);

    this.populateFields(this.adminMode, this.adminResult);
    const originalSubmitAction = this.submitAction;
    this.submitAction = () => {
      this.submitAction = originalSubmitAction;
      const adminSearchResult: SearchAccountResponse = this.convertInputsToAdmin(); // this converts the input texts into a single object for use later
      const validFields = this.areFieldsValid(this.adminMode);
      if (validFields.error) {
        globalScene.ui.setMode(UiMode.LOADING, { buttonActions: [] }); // this is here to force a loading screen to allow the admin tool to reopen again if there's an error
        return this.showMessage(validFields.errorMessage ?? "", adminSearchResult, true);
      }
      globalScene.ui.setMode(UiMode.LOADING, { buttonActions: [] });
      switch (this.adminMode) {
        case AdminMode.LINK:
          this.adminLinkUnlink(adminSearchResult, "discord", "Link") // calls server to link discord
            .then(response => {
              if (response.error) {
                return this.showMessage(response.errorType, adminSearchResult, true); // error or some kind
              }
              return this.showMessage(AdminUiHandler.SUCCESS_SERVICE_MODE("discord", "link"), adminSearchResult, false); // success
            });
          break;
        case AdminMode.SEARCH:
          this.adminSearch(adminSearchResult) // admin search for username
            .then(response => {
              if (response.error) {
                return this.showMessage(response.errorType, adminSearchResult, true); // failure
              }
              this.updateAdminPanelInfo(response.adminSearchResult ?? adminSearchResult); // success
            });
          break;
        case AdminMode.ADMIN:
          this.updateAdminPanelInfo(adminSearchResult, AdminMode.SEARCH);
          break;
      }
    };
    return true;
  }

  showMessage(message: string, adminResult: SearchAccountResponse, isError: boolean) {
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

  private populateAdminFields(adminResult: SearchAccountResponse) {
    for (const [i, aR] of Object.keys(adminResult).entries()) {
      if (aR === "systemData") {
        continue;
      }
      this.inputs[i].setText(adminResult[aR]);
      if (aR === "discordId" || aR === "googleId") {
        // this is here to add the icons for linking/unlinking of google/discord IDs
        const nineSlice = this.inputContainers[i].list.find(iC => iC.type === "NineSlice");
        const img = globalScene.add.image(
          this.inputContainers[i].x + nineSlice!.width + this.buttonGap,
          this.inputContainers[i].y + Math.floor(nineSlice!.height / 2),
          adminResult[aR] === "" ? "link_icon" : "unlink_icon",
        );
        img
          .setName(`adminBtn_${aR}`)
          .setOrigin()
          .setInteractive()
          .on("pointerdown", () => {
            const service = aR.toLowerCase().replace("id", ""); // this takes our key (discordId or googleId) and removes the "Id" at the end to make it more url friendly
            const mode = adminResult[aR] === "" ? "Link" : "Unlink"; // this figures out if we're linking or unlinking a service
            const validFields = this.areFieldsValid(this.adminMode, service);
            if (validFields.error) {
              globalScene.ui.setMode(UiMode.LOADING, { buttonActions: [] }); // this is here to force a loading screen to allow the admin tool to reopen again if there's an error
              return this.showMessage(validFields.errorMessage ?? "", adminResult, true);
            }
            this.adminLinkUnlink(this.convertInputsToAdmin(), service as AdminUiHandlerService, mode).then(response => {
              // attempts to link/unlink depending on the service
              if (response.error) {
                globalScene.ui.setMode(UiMode.LOADING, { buttonActions: [] });
                return this.showMessage(response.errorType, adminResult, true); // fail
              }
              // success, reload panel with new results
              globalScene.ui.setMode(UiMode.LOADING, { buttonActions: [] });
              this.adminSearch(adminResult).then(searchResponse => {
                if (searchResponse.error) {
                  return this.showMessage(searchResponse.errorType, adminResult, true);
                }
                return this.showMessage(
                  AdminUiHandler.SUCCESS_SERVICE_MODE(service, mode),
                  searchResponse.adminSearchResult ?? adminResult,
                  false,
                );
              });
            });
          });
        this.addInteractionHoverEffect(img);
        this.modalContainer.add(img);
      }
    }
  }

  /**
   * This is used to update the fields' text when loading in a new admin ui handler. It uses the {@linkcode adminResult}
   * to update the input text based on the {@linkcode adminMode}. For a linking adminMode, it sets the username and discord.
   * For a search adminMode, it sets the username. For an admin adminMode, it sets all the info from adminResult in the
   * appropriate text boxes, and also sets the link/unlink icons for discord/google depending on the result
   */
  private populateFields(adminMode: AdminMode, adminResult: SearchAccountResponse) {
    switch (adminMode) {
      case AdminMode.LINK:
        this.inputs[0].setText(adminResult.username);
        this.inputs[1].setText(adminResult.discordId);
        break;
      case AdminMode.SEARCH:
        this.inputs[0].setText(adminResult.username);
        break;
      case AdminMode.ADMIN:
        this.populateAdminFields(adminResult);
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
            errorMessage: AdminUiHandler.ERR_REQUIRED_FIELD("username"),
          };
        }
        if (!this.inputs[1].text) {
          // discordId missing from linking panel
          return {
            error: true,
            errorMessage: AdminUiHandler.ERR_REQUIRED_FIELD("discord"),
          };
        }
        break;
      case AdminMode.SEARCH:
        if (!this.inputs[0].text && !bypassLogin) {
          // username missing from search panel, skip check for local testing
          return {
            error: true,
            errorMessage: AdminUiHandler.ERR_REQUIRED_FIELD("username"),
          };
        }
        break;
      case AdminMode.ADMIN:
        if (!this.inputs[1].text && service === "discord") {
          // discordId missing from admin panel
          return {
            error: true,
            errorMessage: AdminUiHandler.ERR_REQUIRED_FIELD(service),
          };
        }
        if (!this.inputs[2].text && service === "google") {
          // googleId missing from admin panel
          return {
            error: true,
            errorMessage: AdminUiHandler.ERR_REQUIRED_FIELD(service),
          };
        }
        break;
    }
    return {
      error: false,
    };
  }

  private convertInputsToAdmin(): SearchAccountResponse {
    const inputs = this.inputs;
    return {
      username: inputs[0]?.node ? inputs[0].text : "",
      discordId: inputs[1]?.node ? inputs[1]?.text : "",
      googleId: inputs[2]?.node ? inputs[2]?.text : "",
      lastLoggedIn: inputs[3]?.node ? inputs[3]?.text : "",
      registered: inputs[4]?.node ? inputs[4]?.text : "",
    };
  }

  private async adminSearch(adminSearchResult: SearchAccountResponse) {
    this.tempGameData = null;
    // Mocking response, solely for local testing
    if (bypassLogin) {
      const fakeResponse: SearchAccountResponse = {
        username: adminSearchResult.username,
        discordId: "",
        googleId: "",
        lastLoggedIn: "",
        registered: "",
      };
      this.tempGameData = globalScene.gameData;
      return { adminSearchResult: fakeResponse, error: false };
    }

    try {
      const [adminInfo, errorType] = await pokerogueApi.admin.searchAccount({
        username: adminSearchResult.username,
      });
      if (errorType || !adminInfo) {
        // error - if adminInfo.status === this.httpUserNotFoundErrorCode that means the username can't be found in the db
        return { adminSearchResult, error: true, errorType };
      }
      if (adminInfo.systemData) {
        const rawSystem = JSON.stringify(adminInfo.systemData);
        try {
          this.tempGameData = GameData.fromRawSystem(rawSystem);
        } catch {
          console.warn("Could not parse system data for admin panel, stats/pokedex will be unavailable!");
        }
      }
      return { adminSearchResult: adminInfo, error: false };
    } catch (err) {
      console.error(err);
      return { error: true, errorType: err };
    }
  }

  private async adminLinkUnlink(
    adminSearchResult: SearchAccountResponse,
    service: AdminUiHandlerService,
    mode: AdminUiHandlerServiceMode,
  ) {
    try {
      const error = await pokerogueApi.admin.linkUnlinkRequest(mode, service, adminSearchResult);
      if (error != null) {
        return { error: true, errorType: error };
      }
    } catch (err) {
      console.error(err);
      return { error: true, errorType: err };
    }
    return { adminSearchResult, error: false };
  }

  private updateAdminPanelInfo(adminSearchResult: SearchAccountResponse, mode?: AdminMode) {
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
          () => {
            if (this.tempGameData == null) {
              globalScene.ui.playError();
              return;
            }
            this.hide();
            globalScene.ui.setOverlayMode(
              UiMode.GAME_STATS,
              adminSearchResult.username,
              this.tempGameData,
              this.unhide.bind(this),
            );
          },
          () => {
            if (this.tempGameData == null) {
              globalScene.ui.playError();
              return;
            }
            this.hide();
            globalScene.ui.setOverlayMode(UiMode.POKEDEX, this.tempGameData, this.unhide.bind(this));
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
