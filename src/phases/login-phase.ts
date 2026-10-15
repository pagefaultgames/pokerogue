import { updateUserInfo } from "#app/account";
import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { Phase } from "#app/phase";
import { handleTutorial, Tutorial } from "#app/tutorial";
import { bypassLogin } from "#constants/app-constants";
import { PlayerGender } from "#enums/player-gender";
import { UiMode } from "#enums/ui-mode";
import { executeIf, sessionIdKey } from "#utils/common";
import { getCookie, removeCookie } from "#utils/cookies";
import { consumeOAuthError, type OAuthError } from "#utils/oauth-utils";
import i18next, { t } from "i18next";

export class LoginPhase extends Phase {
  public readonly phaseName = "LoginPhase";

  /**
   * Whether to load the "login or register" text.
   * Only `true` the first time the phase runs, the text stays on screen after that.
   * @defaultValue `true`
   */
  private readonly showText: boolean;

  /** The error left in the URL by a failed OAuth redirect, if any. */
  private oauthError: OAuthError | null = null;

  constructor(showText = true) {
    super();

    this.showText = showText;
  }

  public override async start(): Promise<void> {
    const { gameData, ui } = globalScene;

    super.start();

    this.oauthError = consumeOAuthError();

    const hasSession = !!getCookie(sessionIdKey);

    ui.setMode(UiMode.LOADING, { buttonActions: [] });

    const response = await executeIf(bypassLogin || hasSession, updateUserInfo);
    const success = response?.[0] ?? false;
    const statusCode = response ? response[1] : null;

    if (!success) {
      this.checkStatus(statusCode);
      return;
    }

    await gameData.loadSystem();
    if (success || bypassLogin) {
      await this.end();
      return;
    }
    ui.setMode(UiMode.MESSAGE);
    ui.showText(t("menu:failedToLoadSaveData"));
  }

  public override async end(): Promise<void> {
    globalScene.ui.setMode(UiMode.MESSAGE);

    if (settings.general.playerGender === PlayerGender.UNSET) {
      globalScene.phaseManager.unshiftNew("SelectGenderPhase");
    }

    await handleTutorial(Tutorial.INTRO);
    super.end();
  }

  private checkStatus(statusCode: number | null): void {
    if (!statusCode || statusCode === 400) {
      this.showLoginRegister();
      return;
    }

    if (statusCode === 401) {
      removeCookie(sessionIdKey);
      globalScene.reset(true, true);
      return;
    }

    globalScene.phaseManager.unshiftNew("UnavailablePhase");
    super.end();
  }

  /**
   * Text to display for the login prompt, based on the OAuth error (if any).
   */
  private get loginPromptText(): string {
    const provider = this.oauthError?.provider === "google" ? "Google" : "Discord";
    switch (this.oauthError?.reason) {
      case "not_linked":
        return i18next.t("menu:oauthNotLinked", { provider });
      case "provider_error":
      case "server_error":
        return i18next.t("menu:oauthFailed", { provider });
      default:
        return i18next.t("menu:logInOrCreateAccount");
    }
  }

  private showLoginRegister(): void {
    const { ui } = globalScene;

    const goToLoginButton = () => {
      this.goToLogin();
    };

    const goToRegistrationButton = () => {
      this.goToRegister();
    };

    if (this.showText) {
      ui.showText(this.loginPromptText);
    }

    audioManager.playSound("ui/menu_open");

    ui.setMode(UiMode.LOGIN_OR_REGISTER, { buttonActions: [goToLoginButton, goToRegistrationButton] });
  }

  private async checkUserInfo(): Promise<boolean> {
    globalScene.ui.playSelect();
    const success = await updateUserInfo();
    if (!success[0]) {
      removeCookie(sessionIdKey);
      globalScene.reset(true, true);
      return false;
    }
    return true;
  }

  public goToLogin(): void {
    const { gameData, ui, phaseManager } = globalScene;

    const backButton = () => {
      phaseManager.unshiftNew("LoginPhase", false);
      this.end();
    };

    const loginButton = async () => {
      const success = await this.checkUserInfo();
      if (!success) {
        return;
      }
      await gameData.loadSystem();
      this.end();
    };
    audioManager.playSound("ui/menu_open");

    ui.setMode(UiMode.LOGIN_FORM, { buttonActions: [loginButton, backButton] });
  }

  public goToRegister(): void {
    const { phaseManager, ui } = globalScene;

    const backButton = () => {
      phaseManager.unshiftNew("LoginPhase", false);
      this.end();
    };

    const registerButton = async () => {
      const success = await this.checkUserInfo();
      if (!success) {
        return;
      }
      this.end();
    };
    audioManager.playSound("ui/menu_open");

    ui.setMode(UiMode.REGISTRATION_FORM, { buttonActions: [registerButton, backButton] });
  }
}
