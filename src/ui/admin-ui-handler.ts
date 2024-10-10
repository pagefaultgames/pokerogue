import BattleScene from "#app/battle-scene";
import { ModalConfig } from "./modal-ui-handler";
import { Mode } from "./ui";
import * as Utils from "../utils";
import { FormModalUiHandler } from "./form-modal-ui-handler";
import { Button } from "#app/enums/buttons";
import { TextStyle } from "./text";

export default class AdminUiHandler extends FormModalUiHandler {

  private adminMode: AdminMode;
  private adminResult: AdminSearchInfo; // this is the username that we're looking for
  private config: ModalConfig;
  private readonly httpUserNotFoundErrorCode: number = 404; // this is the http response from the server when a username isn't found in the server. This has to be the same error the server is giving
  private readonly buttonGap = 10;
  private readonly ERR_REQUIRED_FIELD = (field: string) => {
    if (field === "username") {
      return `${Utils.formatText(field)} is required`;
    } else {
      return `${Utils.formatText(field)} Id is required`;
    }
  };
  private readonly SUCCESS_SERVICE_MODE = (service: string, mode: string) => { // this returns a string saying whether a username has been successfully linked/unlinked to discord/google
    return `Username and ${service} successfully ${mode}ed`;
  };
  private readonly ERR_USERNAME_NOT_FOUND: string = "Username not found!";
  private readonly ERR_GENERIC_ERROR: string = "There was an error";

  constructor(scene: BattleScene, mode: Mode | null = null) {
    super(scene, mode);
  }

  setup(): void {
    super.setup();
  }

  getModalTitle(config?: ModalConfig): string {
    return "Admin panel";
  }

  getFields(config?: ModalConfig): string[] {
    switch (this.adminMode) {
    case AdminMode.LINK:
      return ["Username", "Discord ID"];
    case AdminMode.SEARCH:
      return ["Username"];
    case AdminMode.ADMIN:
      return ["Username", "Discord ID", "Google ID", "Last played", "Registered"];
    default:
      return [""];
    }
  }

  getWidth(config?: ModalConfig): number {
    return this.adminMode === AdminMode.ADMIN ? 180 : 160;
  }

  getMargin(config?: ModalConfig): [number, number, number, number] {
    return [0, 0, 0, 0];
  }

  getButtonLabels(config?: ModalConfig): string[] {
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

  processInput(button: Button): boolean {
    if (button === Button.SUBMIT && this.submitAction) {
      this.submitAction();
      return true;
    }

    return false;
  }

  show(args: any[]): boolean {
    this.config = args[0] as ModalConfig;
    this.adminMode = args[1] as AdminMode;
    this.adminResult = args[2] ?? { username: "", discordId: "", googleId: "", lastLoggedIn: "", registered: "" };
    const isMessageError = args[3];

    const fields = this.getFields();
    const hasTitle = !!this.getModalTitle();
    this.updateFields(fields, hasTitle);
    this.updateContainer(this.config);

    const labels = this.getButtonLabels();
    for (let i = 0; i < labels.length; i++) {
      this.buttonLabels[i].setText(labels[i]);
    }

    this.errorMessage.setPosition(10, (hasTitle ? 31 : 5) + 20 * (fields.length - 1) + 16 + this.getButtonTopMargin());
    if (isMessageError) {
      this.errorMessage.setColor(this.getTextColor(TextStyle.SUMMARY_PINK));
      this.errorMessage.setShadowColor(this.getTextColor(TextStyle.SUMMARY_PINK, true));
    } else {
      this.errorMessage.setColor(this.getTextColor(TextStyle.SUMMARY_GREEN));
      this.errorMessage.setShadowColor(this.getTextColor(TextStyle.SUMMARY_GREEN, true));
    }

    if (super.show(args)) {
      this.populateFields(this.adminMode, this.adminResult);
      const originalSubmitAction = this.submitAction;
      this.submitAction = (_) => {
        this.submitAction = originalSubmitAction;
        const adminSearchResult: AdminSearchInfo = this.convertInputsToAdmin(); // this converts the input texts into a single object for use later
        const validFields = this.areFieldsValid(this.adminMode);
        if (validFields.error) {
          this.scene.ui.setMode(Mode.LOADING, { buttonActions: [] }); // this is here to force a loading screen to allow the admin tool to reopen again if there's an error
          return this.showMessage(validFields.errorMessage ?? "", adminSearchResult, true);
        }
        this.scene.ui.setMode(Mode.LOADING, { buttonActions: [] });
        if (this.adminMode === AdminMode.LINK) {
          this.adminLinkUnlink(adminSearchResult, "discord", "link")
            .then(response => {
              if (response.error) {
                return this.showMessage(response.errorType, adminSearchResult, true);
              } else {
                return this.showMessage(this.SUCCESS_SERVICE_MODE("discord", "link"), adminSearchResult, false);
              }
            });
        } else if (this.adminMode === AdminMode.SEARCH) {
          this.adminSearch(adminSearchResult)
            .then(response => {
              if (response.error) {
                return this.showMessage(response.errorType, adminSearchResult, true);
              }
              this.updateAdminPanelInfo(response.adminSearchResult ?? adminSearchResult);
            });
        } else if (this.adminMode === AdminMode.ADMIN) {
          this.updateAdminPanelInfo(adminSearchResult, AdminMode.SEARCH);
        }

        return false;
      };
      return true;
    }
    return false;
  }

  showMessage(message: string, adminResult: AdminSearchInfo, isError: boolean) {
    this.scene.ui.setMode(Mode.ADMIN, Object.assign(this.config, { errorMessage: message?.trim() }), this.adminMode, adminResult, isError);
    this.scene.ui.playError();
  }

  populateFields(adminMode: AdminMode, adminResult: AdminSearchInfo) {
    switch (adminMode) {
    case AdminMode.LINK:
      this.inputs[0].setText(adminResult.username);
      this.inputs[1].setText(adminResult.discordId);
      break;
    case AdminMode.SEARCH:
      this.inputs[0].setText(adminResult.username);
      break;
    case AdminMode.ADMIN:
      const lockedFields: string[] = ["username", "lastLoggedIn", "registered"];
      Object.keys(adminResult).forEach((aR, i) => {
        this.inputs[i].setText(adminResult[aR]);
        if (aR === "discordId" || aR === "googleId") {
          const nineSlice = this.inputContainers[i].list.find(iC => iC.type === "NineSlice");
          const img = this.scene.add.image(this.inputContainers[i].x + nineSlice.width + this.buttonGap, this.inputContainers[i].y + (Math.floor(nineSlice.height / 2)), adminResult[aR] === "" ? "link_icon" : "unlink_icon");
          img.setName(`adminBtn_${aR}`);
          img.setOrigin(0.5, 0.5);
          img.setScale(0.5);
          img.setInteractive();
          img.on("pointerdown", () => {
            const service = aR.toLowerCase().replace("id", ""); // this takes our key (discordId or googleId) and removes the "Id" at the end to make it more url friendly
            const mode = adminResult[aR] === "" ? "link" : "unlink"; // this figures out if we're linking or unlinking a service
            const validFields = this.areFieldsValid(this.adminMode, service);
            if (validFields.error) {
              this.scene.ui.setMode(Mode.LOADING, { buttonActions: [] }); // this is here to force a loading screen to allow the admin tool to reopen again if there's an error
              return this.showMessage(validFields.errorMessage ?? "", adminResult, true);
            }
            this.adminLinkUnlink(this.convertInputsToAdmin(), service, mode).then(response => {
              if (response.error) {
                return this.showMessage(response.errorType, adminResult, true);
              } else {
                this.scene.ui.setMode(Mode.LOADING, { buttonActions: [] });
                this.adminSearch(adminResult)
                  .then(response => {
                    if (response.error) {
                      return this.showMessage(response.errorType, adminResult, true);
                    }
                    return this.showMessage(this.SUCCESS_SERVICE_MODE(service, mode), response.adminSearchResult ?? adminResult, false);
                  });
              }
            });
          });
          this.addInteractionHoverEffect(img);
          this.modalContainer.add(img);
        }
        if (lockedFields.includes(aR) || adminResult[aR] !== "") {
          this.inputs[i].setReadOnly(true);
        } else {
          this.inputs[i].setReadOnly(false);
        }
      });
      break;
    }
  }

  areFieldsValid(adminMode: AdminMode, service?: string): { error: boolean; errorMessage?: string; } {
    switch (adminMode) {
    case AdminMode.LINK:
      if (!this.inputs[0].text) { // username missing from link panel
        return {
          error: true,
          errorMessage: this.ERR_REQUIRED_FIELD("username")
        };
      }
      if (!this.inputs[1].text) { // discordId missing from linking panel
        return {
          error: true,
          errorMessage: this.ERR_REQUIRED_FIELD("discord")
        };
      }
      break;
    case AdminMode.SEARCH:
      if (!this.inputs[0].text) { // either username or discordId missing from search panel
        return {
          error: true,
          errorMessage: this.ERR_REQUIRED_FIELD("username or discord")
        };
      }
      break;
    case AdminMode.ADMIN:
      if (!this.inputs[1].text && service === "discord") { // discordId missing from admin panel
        return {
          error: true,
          errorMessage: this.ERR_REQUIRED_FIELD(service)
        };
      }
      if (!this.inputs[2].text && service === "google") { // googleId missing from admin panel
        return {
          error: true,
          errorMessage: this.ERR_REQUIRED_FIELD(service)
        };
      }
      break;
    }
    return {
      error: false
    };
  }

  convertInputsToAdmin(): AdminSearchInfo {
    return {
      username: this.inputs[0]?.node ? this.inputs[0].text : "",
      discordId: this.inputs[1]?.node ? this.inputs[1]?.text : "",
      googleId: this.inputs[2]?.node ? this.inputs[2]?.text : "",
      lastLoggedIn: this.inputs[3]?.node ? this.inputs[3]?.text : "",
      registered: this.inputs[4]?.node ? this.inputs[4]?.text : ""
    };
  }

  async adminSearch(adminSearchResult: AdminSearchInfo) {
    try {
      const adminInfo = await Utils.apiFetch(`admin/account/admin-search?username=${encodeURIComponent(adminSearchResult.username)}`, true);
      if (!adminInfo.ok) { // error - if adminInfo.status === this.httpUserNotFoundErrorCode that means the username can't be found in the db
        return { adminSearchResult: adminSearchResult, error: true, errorType: adminInfo.status === this.httpUserNotFoundErrorCode ? this.ERR_USERNAME_NOT_FOUND : this.ERR_GENERIC_ERROR };
      } else { // success
        const adminInfoJson: AdminSearchInfo = await adminInfo.json();
        return { adminSearchResult: adminInfoJson, error: false };
      }
    } catch (err) {
      console.error(err);
      return { error: true, errorType: err };
    }
  }

  async adminLinkUnlink(adminSearchResult: AdminSearchInfo, service: string, mode: string) {
    try {
      const response = await Utils.apiPost(`admin/account/${service}-${mode}`, `username=${encodeURIComponent(adminSearchResult.username)}&${service}Id=${encodeURIComponent(service === "discord" ? adminSearchResult.discordId : adminSearchResult.googleId)}`, "application/x-www-form-urlencoded", true);
      if (!response.ok) { // error - if response.status === this.httpUserNotFoundErrorCode that means the username can't be found in the db
        return { adminSearchResult: adminSearchResult, error: true, errorType: response.status === this.httpUserNotFoundErrorCode ? this.ERR_USERNAME_NOT_FOUND : this.ERR_GENERIC_ERROR };
      } else { // success!
        return { adminSearchResult: adminSearchResult, error: false };
      }
    } catch (err) {
      console.error(err);
      return { error: true, errorType: err };
    }
  }

  updateAdminPanelInfo(adminSearchResult: AdminSearchInfo, mode?: AdminMode) {
    mode = mode ?? AdminMode.ADMIN;
    this.scene.ui.setMode(Mode.ADMIN, {
      buttonActions: [
        // we double revert here and below to go back 2 layers of menus
        () => {
          this.scene.ui.revertMode();
          this.scene.ui.revertMode();
        },
        () => {
          this.scene.ui.revertMode();
          this.scene.ui.revertMode();
        }
      ]
    }, mode, adminSearchResult);
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
       * and if either of these conditions are met, the element is destroyed
       */
      if (itemsToRemove.some(iTR => mC[i].name.includes(iTR)) || (mC[i].type === "Container" && mC[i].list.find(m => m.type === "rexInputText"))) {
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
  ADMIN
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

export interface AdminSearchInfo {
  username: string;
  discordId: string;
  googleId: string;
  lastLoggedIn: string;
  registered: string;
}
