import { updateUserInfo } from "#app/account.js";
import BattleScene, { bypassLogin } from "#app/battle-scene.js";
import { Phase } from "#app/phase.js";
import { handleTutorial, Tutorial } from "#app/tutorial.js";
import { Mode } from "#app/ui/ui.js";
import i18next, { t } from "i18next";
import * as Utils from "#app/utils.js";
import { SelectGenderPhase } from "./select-gender-phase";
import { UnavailablePhase } from "./unavailable-phase";

export class LoginPhase extends Phase {
  private showText: boolean;

  constructor(scene: BattleScene, showText?: boolean) {
    super(scene);

    this.showText = showText === undefined || !!showText;
  }

  start(): void {
    super.start();

    const hasSession = !!Utils.getCookie(Utils.sessionIdKey);

    this.scene.ui.setMode(Mode.LOADING, { buttonActions: [] });
    Utils.executeIf(bypassLogin || hasSession, updateUserInfo).then(response => {
      const success = response ? response[0] : false;
      const statusCode = response ? response[1] : null;
      if (!success) {
        if (!statusCode || statusCode === 400) {
          if (this.showText) {
            this.scene.ui.showText(i18next.t("menu:logInOrCreateAccount"));
          }

          this.scene.playSound("menu_open");

          const loadData = () => {
            updateUserInfo().then(success => {
              if (!success[0]) {
                Utils.removeCookie(Utils.sessionIdKey);
                this.scene.reset(true, true);
                return;
              }
              this.scene.gameData.loadSystem().then(() => this.end());
            });
          };

          this.scene.ui.setMode(Mode.LOGIN_FORM, {
            buttonActions: [
              () => {
                this.scene.ui.playSelect();
                loadData();
              }, () => {
                this.scene.playSound("menu_open");
                this.scene.ui.setMode(Mode.REGISTRATION_FORM, {
                  buttonActions: [
                    () => {
                      this.scene.ui.playSelect();
                      updateUserInfo().then(success => {
                        if (!success[0]) {
                          Utils.removeCookie(Utils.sessionIdKey);
                          this.scene.reset(true, true);
                          return;
                        }
                        this.end();
                      } );
                    }, () => {
                      this.scene.unshiftPhase(new LoginPhase(this.scene, false));
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
          this.scene.reset(true, true);
        } else {
          this.scene.unshiftPhase(new UnavailablePhase(this.scene));
          super.end();
        }
        return null;
      } else {
        this.scene.gameData.loadSystem().then(success => {
          if (success || bypassLogin) {
            this.end();
          } else {
            this.scene.ui.setMode(Mode.MESSAGE);
            this.scene.ui.showText(t("menu:failedToLoadSaveData"));
          }
        });
      }
    });
  }

  end(): void {
    this.scene.ui.setMode(Mode.MESSAGE);

    if (!this.scene.gameData.gender) {
      this.scene.unshiftPhase(new SelectGenderPhase(this.scene));
    }

    handleTutorial(this.scene, Tutorial.Intro).then(() => super.end());
  }
}
