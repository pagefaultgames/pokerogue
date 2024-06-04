import { DeeplClient } from "../clients/deepl-client";

/**
 * Returns an array of DeeplClients based on the provided API keys.
 *
 * @param {string[]} apiKeys The API keys
 * @returns {DeeplClient[]} The DeeplClients
 */
export function getDeeplClients(apiKeys: string[]): DeeplClient[] {
  return apiKeys.map((apiKey) => new DeeplClient(apiKey));
}

/**
 * Returns the DeeplClient with the most remaining characters.
 * If no client has remaining characters, returns null.
 *
 * @param {DeeplClient[]} clients The DeeplClients
 * @returns {Promise<DeeplClient | null>} The DeeplClient with the most remaining characters
 */
export async function getDeeplClientWithMostRemainingCharacters(clients: DeeplClient[]): Promise<DeeplClient | null> {
  if (!clients.length) {
    return null;
  }
  let bestClient;
  let bestClientRemainingCharacters;

  for (const client of clients) {
    const remainingCharactersForClient = await client.getRemainingCharacters();
    if (remainingCharactersForClient <= 0) {
      continue;
    }
    if (!bestClient) {
      bestClient = client;
      bestClientRemainingCharacters = remainingCharactersForClient;
      continue;
    }

    if (remainingCharactersForClient > bestClientRemainingCharacters) {
      bestClient = client;
      bestClientRemainingCharacters = remainingCharactersForClient;
    }
  }

  return bestClient;
}
