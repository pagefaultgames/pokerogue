import { updateUserInfo } from "#app/account";
import { globalScene } from "#app/global-scene";
import { bypassLogin } from "#app/global-vars/bypass-login";
import { Phase } from "#app/phase";
import { handleTutorial, Tutorial } from "#app/tutorial";
import { UiMode } from "#enums/ui-mode";
import { executeIf, sessionIdKey } from "#utils/common";
import { getCookie, removeCookie } from "#utils/cookies";
import i18next, { t } from "i18next";

export class LoginPhase extends Phase {
  public readonly phaseName = "LoginPhase";
  private showText: boolean;

  constructor(showText = true) {
    super();

    this.showText = showText;
  }

  start(): void {
    super.start();

    const hasSession = !!getCookie(sessionIdKey);

    globalScene.ui.setMode(UiMode.LOADING, { buttonActions: [] });
    executeIf(bypassLogin || hasSession, updateUserInfo).then(response => {
      const success = response ? response[0] : false;
      const statusCode = response ? response[1] : null;
      if (!success) {
        if (!statusCode || statusCode === 400) {
          if (this.showText) {
            globalScene.ui.showText(i18next.t("menu:logInOrCreateAccount"));
          }

          globalScene.playSound("menu_open");

          const loadData = () => {
            updateUserInfo().then(success => {
              if (!success[0]) {
                removeCookie(sessionIdKey);
                globalScene.reset(true, true);
                return;
              }
              globalScene.gameData.loadSystem().then(() => this.end());
            });
          };

          globalScene.ui.setMode(UiMode.LOGIN_FORM, {
            buttonActions: [
              () => {
                globalScene.ui.playSelect();
                loadData();
              },
              () => {
                globalScene.playSound("menu_open");
                globalScene.ui.setMode(UiMode.REGISTRATION_FORM, {
                  buttonActions: [
                    () => {
                      globalScene.ui.playSelect();
                      updateUserInfo().then(success => {
                        if (!success[0]) {
                          removeCookie(sessionIdKey);
                          globalScene.reset(true, true);
                          return;
                        }
                        this.end();
                      });
                    },
                    () => {
                      globalScene.phaseManager.unshiftNew("LoginPhase", false);
                      this.end();
                    },
                  ],
                });
              },
              () => {
                const redirectUri = encodeURIComponent(`${import.meta.env.VITE_SERVER_URL}/auth/discord/callback`);
                const discordId = import.meta.env.VITE_DISCORD_CLIENT_ID;
                const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordId}&redirect_uri=${redirectUri}&response_type=code&scope=identify&prompt=none`;
                window.open(discordUrl, "_self");
              },
              () => {
                const redirectUri = encodeURIComponent(`${import.meta.env.VITE_SERVER_URL}/auth/google/callback`);
                const googleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                const googleUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${googleId}&redirect_uri=${redirectUri}&response_type=code&scope=openid`;
                window.open(googleUrl, "_self");
              },
            ],
          });
        } else if (statusCode === 401) {
          removeCookie(sessionIdKey);
          globalScene.reset(true, true);
        } else {
          globalScene.phaseManager.unshiftNew("UnavailablePhase");
          super.end();
        }
        return null;
      }
      globalScene.gameData.loadSystem().then(success => {
        if (success || bypassLogin) {
          this.end();
        } else {
          globalScene.ui.setMode(UiMode.MESSAGE);
          globalScene.ui.showText(t("menu:failedToLoadSaveData"));
        }
      });
    });
  }

  end(): void {
    globalScene.ui.setMode(UiMode.MESSAGE);

    if (!globalScene.gameData.gender) {
      globalScene.phaseManager.unshiftNew("SelectGenderPhase");
    }

    handleTutorial(Tutorial.Intro).then(() => super.end());
  }
}
