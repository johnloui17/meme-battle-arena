import { createHash } from "node:crypto";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface ResetTokenRecord {
  expires_at: Date;
  used_at: Date | null;
}

/** A reset token is usable exactly once, before it expires. */
export function isResetTokenUsable(record: ResetTokenRecord, now: Date): boolean {
  return record.used_at === null && record.expires_at > now;
}

export interface GoogleClaims {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
}

const MAX_DISPLAY_NAME_LENGTH = 100; // matches registerSchema's display_name limit

/** Maps a verified Google ID token's claims onto the fields we need; null when the token is unusable. */
export function googleClaimsToProfile(claims: GoogleClaims): GoogleProfile | null {
  if (!claims.sub || !claims.email) return null;

  const fallbackName = claims.email.split("@")[0];
  const displayName = (claims.name?.trim() || fallbackName).slice(0, MAX_DISPLAY_NAME_LENGTH);

  return {
    googleId: claims.sub,
    email: claims.email,
    emailVerified: claims.email_verified === true,
    displayName,
  };
}
