import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import { LoginRegisterInfoContainerUiHandler } from "#ui/login-register-info-container-ui-handler";
import { addTextObject } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import { fixedInt } from "#utils/common";
import i18next from "i18next";

// TODO: use mixins
export abstract class OAuthProvidersUiHandler extends LoginRegisterInfoContainerUiHandler {
  private discordImage: Phaser.GameObjects.Image;
  private googleImage: Phaser.GameObjects.Image;

  private externalPartyContainer: Phaser.GameObjects.Container;
  private externalPartyBg: Phaser.GameObjects.NineSlice;
  private externalPartyTitle: Phaser.GameObjects.Text;

  public override setup(): void {
    super.setup();
    this.buildExternalPartyContainer();
  }

  public override clear(): void {
    super.clear();

    this.externalPartyContainer //
      .setVisible(false)
      .setActive(false);

    [this.discordImage, this.googleImage].forEach(img => {
      img.off("pointerdown");
    });
  }

  public override destroy(): void {
    super.destroy();
    this.externalPartyContainer.destroy();
  }

  private buildExternalPartyContainer(): void {
    const { height, width } = globalScene.scaledCanvas;

    this.externalPartyContainer = globalScene.add
      .container(0, 0)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, width / 2, height / 2), Phaser.Geom.Rectangle.Contains);
    this.externalPartyTitle = addTextObject(0, 4, "", TextStyle.SETTINGS_LABEL) //
      .setOrigin(0.5, 0);
    this.externalPartyBg = addWindow(0, 0, 0, 0);

    this.discordImage = this.buildInteractableImage("discord", "discord-icon");
    this.googleImage = this.buildInteractableImage("google", "google-icon");

    this.externalPartyContainer
      .add([this.externalPartyBg, this.externalPartyTitle, this.discordImage, this.googleImage])
      .setVisible(false);
    this.getUi().add(this.externalPartyContainer);
  }

  protected processExternalProvider(): void {
    const titleX = 22;
    this.externalPartyTitle
      .setText(i18next.t("menu:orUse"))
      .setX(titleX + this.externalPartyTitle.text.length)
      .setVisible(true);

    this.externalPartyContainer //
      .setPositionRelative(this.modalContainer, 175, 0)
      .setVisible(true);

    const bgWidth = this.externalPartyTitle.text.length + 50;
    this.externalPartyBg.setSize(bgWidth, this.modalBg.height);
    this.getUi().moveTo(this.externalPartyContainer, this.getUi().length - 1);

    const externalPartyIconWidth = this.externalPartyBg.width / 3.1;

    const getRedirectUri = (service: string): string => {
      return encodeURIComponent(`${import.meta.env.VITE_SERVER_URL}/auth/${service}/callback`);
    };

    this.discordImage //
      .setPosition(externalPartyIconWidth, this.externalPartyBg.height - 40)
      .on("pointerdown", () => {
        const redirectUri = getRedirectUri("discord");
        const discordId = import.meta.env.VITE_DISCORD_CLIENT_ID;
        const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordId}&redirect_uri=${redirectUri}&response_type=code&scope=identify&prompt=none`;
        window.open(discordUrl, "_self");
      });

    this.googleImage //
      .setPosition(externalPartyIconWidth, this.externalPartyBg.height - 60)
      .on("pointerdown", () => {
        const redirectUri = getRedirectUri("google");
        const googleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const googleUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${googleId}&redirect_uri=${redirectUri}&response_type=code&scope=openid`;
        window.open(googleUrl, "_self");
      });

    this.externalPartyContainer.setAlpha(0);
    globalScene.tweens.add({
      targets: this.externalPartyContainer,
      duration: fixedInt(1000),
      ease: "Sine.easeInOut",
      y: "-=24",
      alpha: 1,
    });
  }
}
