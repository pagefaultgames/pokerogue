import { updateUserInfo } from "#app/account";
import { bypassLogin } from "#app/battle-scene";
import { globalScene } from "#app/global-scene";
import { Phase } from "#app/phase";
import { handleTutorial, Tutorial } from "#app/tutorial";
import { Mode } from "#app/ui/ui";
import i18next, { t } from "i18next";
import * as Utils from "#app/utils";
import { SelectGenderPhase } from "./select-gender-phase";
import { UnavailablePhase } from "./unavailable-phase";

export class LoginPhase extends Phase {
  private showText: boolean;

  constructor(showText?: boolean) {
    super();

    this.showText = showText === undefined || !!showText;
  }

  start(): void {
    super.start();

    const hasSession = !!Utils.getCookie(Utils.sessionIdKey);

    globalScene.ui.setMode(Mode.LOADING, { buttonActions: []});
    Utils.executeIf(bypassLogin || hasSession, updateUserInfo).then(response => {
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
                Utils.removeCookie(Utils.sessionIdKey);
                globalScene.reset(true, true);
                return;
              }
              globalScene.gameData.loadSystem().then(() => this.end());
            });
          };

          globalScene.ui.setMode(Mode.LOGIN_FORM, {
            buttonActions: [
              () => {
                globalScene.ui.playSelect();
                loadData();
              }, () => {
                globalScene.playSound("menu_open");
                globalScene.ui.setMode(Mode.REGISTRATION_FORM, {
                  buttonActions: [
                    () => {
                      globalScene.ui.playSelect();
                      updateUserInfo().then(success => {
                        if (!success[0]) {
                          Utils.removeCookie(Utils.sessionIdKey);
                          globalScene.reset(true, true);
                          return;
                        }
                        this.end();
                      } );
                    }, () => {
                      globalScene.unshiftPhase(new LoginPhase(false));
                      this.end();
                    }
                  ]
                });
              }, () => {
                const redirectUri = encodeURIComponent(`${import.meta.env.VITE_SERVER_URL}/auth/discord/callback`);
                const discordId = import.meta.env.VITE_DISCORD_CLIENT_ID;
                const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordId}&redirect_uri=${redirectUri}&response_type=code&scope=identify&prompt=none`;
                window.open(discordUrl, "_self");
              }, () => {
                const redirectUri = encodeURIComponent(`${import.meta.env.VITE_SERVER_URL}/auth/google/callback`);
                const googleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                const googleUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${googleId}&redirect_uri=${redirectUri}&response_type=code&scope=openid`;
                window.open(googleUrl, "_self");
              }
            ]
          });
        } else if (statusCode === 401) {
          Utils.removeCookie(Utils.sessionIdKey);
          globalScene.reset(true, true);
        } else {
          globalScene.unshiftPhase(new UnavailablePhase());
          super.end();
        }
        return null;
      } else {
        globalScene.gameData.loadSystem().then(success => {
          if (success || bypassLogin) {
            this.end();
          } else {
            globalScene.ui.setMode(Mode.MESSAGE);
            globalScene.ui.showText(t("menu:failedToLoadSaveData"));
          }
        });
      }
    });
  }

  end(): void {
    globalScene.ui.setMode(Mode.MESSAGE);

    if (!globalScene.gameData.gender) {
      globalScene.unshiftPhase(new SelectGenderPhase());
    }

    handleTutorial(Tutorial.Intro).then(() => super.end());
  }
}
