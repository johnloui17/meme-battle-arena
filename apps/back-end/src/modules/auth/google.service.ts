import { OAuth2Client } from "google-auth-library";
import { ERROR_CODES } from "@meme-battle-arena/contracts";
import { env } from "../../config/env";
import { ApiError } from "../../lib/errors/api-error";
import type { GoogleClaims } from "./auth.logic";

let client: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new ApiError(ERROR_CODES.OAUTH_FAILED, 500, "Google sign-in is not configured");
  }
  // "postmessage" is the redirect_uri Google expects for the GIS popup auth-code flow.
  client ??= new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, "postmessage");
  return client;
}

/** Exchanges a GIS auth code for a verified ID token's claims. */
export async function exchangeGoogleCode(code: string): Promise<GoogleClaims> {
  const oauthClient = getClient();
  try {
    const { tokens } = await oauthClient.getToken(code);
    if (!tokens.id_token) throw new Error("no id_token in token response");

    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error("empty id_token payload");

    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
      name: payload.name,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(ERROR_CODES.OAUTH_FAILED, 401, "Google sign-in failed");
  }
}
