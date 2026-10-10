export interface OAuthError {
  reason: string;
  provider: string | null;
}

/**
 * Read the `oauthError` and `provider` query params from a URL.
 * @param href - The URL to read
 * @returns The error, if present, and the URL with those params removed
 */
export function parseOAuthError(href: string): { error: OAuthError | null; cleanedHref: string } {
  const url = new URL(href);
  const reason = url.searchParams.get("oauthError");
  if (!reason) {
    return { error: null, cleanedHref: href };
  }

  const error = { reason, provider: url.searchParams.get("provider") };
  url.searchParams.delete("oauthError");
  url.searchParams.delete("provider");
  return { error, cleanedHref: url.toString() };
}

/**
 * Return the error the server's OAuth callback left in the page URL, and strips it from the URL.
 * @returns The error, if present. Successive calls will return `null` as the error is stripped from the URL.
 */
export function consumeOAuthError(): OAuthError | null {
  const { error, cleanedHref } = parseOAuthError(window.location.href);
  if (error) {
    history.replaceState(history.state, "", cleanedHref);
  }

  return error;
}
