import { isBeta } from "./utility-vars";

export function setCookie(cName: string, cValue: string): void {
  const expiration = new Date();
  expiration.setTime(new Date().getTime() + 3600000 * 24 * 30 * 3 /*7*/);
  document.cookie = `${cName}=${cValue};Secure;SameSite=Strict;Domain=${window.location.hostname};Path=/;Expires=${expiration.toUTCString()}`;
}

export function removeCookie(cName: string): void {
  if (isBeta) {
    document.cookie = `${cName}=;Secure;SameSite=Strict;Domain=pokerogue.net;Path=/;Max-Age=-1`; // we need to remove the cookie from the main domain as well
  }

  document.cookie = `${cName}=;Secure;SameSite=Strict;Domain=${window.location.hostname};Path=/;Max-Age=-1`;
  document.cookie = `${cName}=;Secure;SameSite=Strict;Path=/;Max-Age=-1`; // legacy cookie without domain, for older cookies to prevent a login loop
}

export function getCookie(cName: string): string {
  // check if there are multiple cookies with the same name and delete them
  if (document.cookie.split(";").filter(c => c.includes(cName)).length > 1) {
    removeCookie(cName);
    return "";
  }
  const name = `${cName}=`;
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
