/**
 * Creates accessible HTML form overlays for login/register screens.
 *
 * The game's canvas-based modals are inaccessible to screen readers because
 * Phaser buttons can't receive keyboard focus when HTML inputs are focused.
 * This module creates real HTML forms that overlay the canvas, providing
 * native Tab navigation, Enter submission, and screen reader support.
 */

import { pokerogueApi } from "#api/pokerogue-api";
import { a11yManager } from "#ui/accessibility-manager";
import i18next from "i18next";

let activeOverlay: HTMLDivElement | null = null;

function removeOverlay(): void {
  if (activeOverlay) {
    activeOverlay.remove();
    activeOverlay = null;
  }
}

function createOverlayContainer(): HTMLDivElement {
  removeOverlay();
  const overlay = document.createElement("div");
  overlay.id = "a11y-form-overlay";
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.7);
  `;
  activeOverlay = overlay;
  const app = document.getElementById("app");
  if (app) {
    app.appendChild(overlay);
  }
  return overlay;
}

function createFormBox(title: string): HTMLDivElement {
  const box = document.createElement("div");
  box.style.cssText = `
    background: #2a2a3a;
    border: 2px solid #666;
    border-radius: 8px;
    padding: 20px;
    min-width: 300px;
    color: #fff;
    font-family: sans-serif;
  `;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", title);

  if (title) {
    const heading = document.createElement("h2");
    heading.textContent = title;
    heading.style.cssText = "margin: 0 0 16px 0; font-size: 18px; text-align: center;";
    box.appendChild(heading);
  }

  return box;
}

function createInput(label: string, type: string): { container: HTMLDivElement; input: HTMLInputElement } {
  const container = document.createElement("div");
  container.style.cssText = "margin-bottom: 12px;";

  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  labelEl.style.cssText = "display: block; margin-bottom: 4px; font-size: 14px;";

  const input = document.createElement("input");
  input.type = type;
  input.setAttribute("aria-label", label);
  input.style.cssText = `
    width: 100%;
    padding: 8px;
    border: 1px solid #555;
    border-radius: 4px;
    background: #1a1a2a;
    color: #fff;
    font-size: 14px;
    box-sizing: border-box;
  `;

  labelEl.appendChild(input);
  container.appendChild(labelEl);

  return { container, input };
}

function createButton(label: string, primary: boolean): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.type = primary ? "submit" : "button";
  btn.style.cssText = `
    padding: 8px 20px;
    border: 1px solid #555;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    margin: 4px;
    ${primary ? "background: #4a7ab5; color: #fff;" : "background: #3a3a4a; color: #ccc;"}
  `;
  return btn;
}

function createErrorEl(): HTMLDivElement {
  const errorEl = document.createElement("div");
  errorEl.setAttribute("role", "alert");
  errorEl.setAttribute("aria-live", "assertive");
  errorEl.style.cssText = "color: #ff6666; font-size: 13px; margin-bottom: 8px; min-height: 18px;";
  return errorEl;
}

/**
 * Show the Login or Register choice overlay.
 */
export function showLoginOrRegisterOverlay(goToLogin: () => void, goToRegister: () => void): void {
  const overlay = createOverlayContainer();
  const box = createFormBox("");

  const title = document.createElement("h2");
  title.textContent = "PokéRogue";
  title.style.cssText = "margin: 0 0 20px 0; font-size: 22px; text-align: center;";
  box.appendChild(title);

  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 8px;";

  const topRow = document.createElement("div");
  topRow.style.cssText = "display: flex; gap: 12px;";

  const loginBtn = createButton(i18next.t("menu:login"), true);
  loginBtn.addEventListener("click", () => {
    removeOverlay();
    goToLogin();
  });

  const registerBtn = createButton(i18next.t("menu:register"), false);
  registerBtn.addEventListener("click", () => {
    removeOverlay();
    goToRegister();
  });

  topRow.appendChild(loginBtn);
  topRow.appendChild(registerBtn);
  buttonContainer.appendChild(topRow);

  box.appendChild(buttonContainer);
  overlay.appendChild(box);

  // Focus the login button and announce
  setTimeout(() => {
    loginBtn.focus();
    a11yManager.announceMessage(
      i18next.t("accessibility:loginOrRegisterIntro", {
        login: i18next.t("menu:login"),
        register: i18next.t("menu:register"),
      }),
    );
  }, 100);
}

/**
 * Show the Login form overlay.
 */
export function showLoginFormOverlay(onSuccess: () => void, onBack: () => void): void {
  const overlay = createOverlayContainer();
  const box = createFormBox(i18next.t("menu:login"));

  const form = document.createElement("form");
  form.addEventListener("submit", e => e.preventDefault());

  const errorEl = createErrorEl();
  form.appendChild(errorEl);

  const { container: userContainer, input: usernameInput } = createInput(i18next.t("menu:username"), "text");
  const { container: passContainer, input: passwordInput } = createInput(i18next.t("menu:password"), "password");
  form.appendChild(userContainer);
  form.appendChild(passContainer);

  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = "display: flex; justify-content: center; gap: 12px; margin-top: 16px;";

  const submitBtn = createButton(i18next.t("menu:login"), true);
  const backBtn = createButton(i18next.t("menu:goBack"), false);

  const doLogin = () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username) {
      errorEl.textContent = i18next.t("menu:emptyUsername");
      a11yManager.announceMessage(i18next.t("accessibility:errorPrefix", { message: errorEl.textContent }));
      return;
    }
    if (!password) {
      errorEl.textContent = i18next.t("menu:invalidLoginPassword");
      a11yManager.announceMessage(i18next.t("accessibility:errorPrefix", { message: errorEl.textContent }));
      return;
    }

    errorEl.textContent = "Logging in...";
    submitBtn.disabled = true;

    pokerogueApi.account.login({ username, password }).then(error => {
      if (error) {
        submitBtn.disabled = false;
        let readableError = error;
        if (error.includes("password doesn't match")) {
          readableError = i18next.t("menu:unmatchingPassword");
        } else if (error.includes("account doesn't exist")) {
          readableError = i18next.t("menu:accountNonExistent");
        } else if (error.includes("Unknown")) {
          readableError = "Could not connect to the server. The game API may not support this domain.";
        }
        errorEl.textContent = readableError;
        a11yManager.announceMessage(i18next.t("accessibility:errorPrefix", { message: readableError }));
      } else {
        removeOverlay();
        onSuccess();
      }
    });
  };

  submitBtn.addEventListener("click", doLogin);
  form.addEventListener("submit", e => {
    e.preventDefault();
    doLogin();
  });
  backBtn.addEventListener("click", () => {
    removeOverlay();
    onBack();
  });

  buttonContainer.appendChild(submitBtn);
  buttonContainer.appendChild(backBtn);
  form.appendChild(buttonContainer);
  box.appendChild(form);
  overlay.appendChild(box);

  setTimeout(() => {
    usernameInput.focus();
    a11yManager.announceMessage(i18next.t("accessibility:loginFormIntro", { title: i18next.t("menu:login") }));
  }, 100);
}

/**
 * Show the Registration form overlay.
 */
export function showRegistrationFormOverlay(onSuccess: () => void, onBack: () => void): void {
  const overlay = createOverlayContainer();
  const box = createFormBox(i18next.t("menu:register"));

  const form = document.createElement("form");
  form.addEventListener("submit", e => e.preventDefault());

  const errorEl = createErrorEl();
  form.appendChild(errorEl);

  const { container: userContainer, input: usernameInput } = createInput(i18next.t("menu:username"), "text");
  const { container: passContainer, input: passwordInput } = createInput(i18next.t("menu:password"), "password");
  const { container: confirmContainer, input: confirmInput } = createInput(
    i18next.t("menu:confirmPassword"),
    "password",
  );
  form.appendChild(userContainer);
  form.appendChild(passContainer);
  form.appendChild(confirmContainer);

  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = "display: flex; justify-content: center; gap: 12px; margin-top: 16px;";

  const submitBtn = createButton(i18next.t("menu:register"), true);
  const backBtn = createButton(i18next.t("menu:goBack"), false);

  const doRegister = () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;

    if (!username) {
      errorEl.textContent = i18next.t("menu:emptyUsername");
      a11yManager.announceMessage(i18next.t("accessibility:errorPrefix", { message: errorEl.textContent }));
      return;
    }
    if (!password) {
      errorEl.textContent = i18next.t("menu:invalidRegisterPassword");
      a11yManager.announceMessage(i18next.t("accessibility:errorPrefix", { message: errorEl.textContent }));
      return;
    }
    if (password !== confirmPassword) {
      errorEl.textContent = i18next.t("menu:passwordNotMatchingConfirmPassword");
      a11yManager.announceMessage(i18next.t("accessibility:errorPrefix", { message: errorEl.textContent }));
      return;
    }

    errorEl.textContent = "Registering...";
    submitBtn.disabled = true;

    pokerogueApi.account.register({ username, password }).then(registerError => {
      if (registerError) {
        submitBtn.disabled = false;
        let readableError = registerError;
        if (registerError.includes("username")) {
          readableError = i18next.t("menu:usernameAlreadyUsed");
        } else if (registerError.includes("Unknown")) {
          readableError = "Could not connect to the server. The game API may not support this domain.";
        }
        errorEl.textContent = readableError;
        a11yManager.announceMessage(i18next.t("accessibility:errorPrefix", { message: readableError }));
        return;
      }
      // Auto-login after successful registration
      pokerogueApi.account.login({ username, password }).then(loginError => {
        removeOverlay();
        if (loginError) {
          onBack();
        } else {
          onSuccess();
        }
      });
    });
  };

  submitBtn.addEventListener("click", doRegister);
  form.addEventListener("submit", e => {
    e.preventDefault();
    doRegister();
  });
  backBtn.addEventListener("click", () => {
    removeOverlay();
    onBack();
  });

  buttonContainer.appendChild(submitBtn);
  buttonContainer.appendChild(backBtn);
  form.appendChild(buttonContainer);
  box.appendChild(form);
  overlay.appendChild(box);

  setTimeout(() => {
    usernameInput.focus();
    a11yManager.announceMessage(i18next.t("accessibility:registerFormIntro", { title: i18next.t("menu:register") }));
  }, 100);
}

/**
 * Remove any active form overlay.
 */
export function clearFormOverlay(): void {
  removeOverlay();
}
