import { isBeta } from "#utils/utility-vars";

export function setCookie(cName: string, cValue: string): void {
  const expiration = new Date();
  expiration.setTime(Date.now() + 3600000 * 24 * 30 * 3 /*7*/);
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
  // Check all cookies in the document and see if any of them match, grabbing the first one whose value lines up
  for (const c of ca) {
    const cTrimmed = c.trim();
    if (cTrimmed.startsWith(name)) {
      return c.slice(name.length, c.length);
    }
  }
  return "";
}
