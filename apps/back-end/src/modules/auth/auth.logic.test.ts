import { describe, it, expect } from "vitest";
import { hashToken, isResetTokenUsable, googleClaimsToProfile } from "./auth.logic";

describe("hashToken", () => {
  it("is deterministic for the same input", () => {
    expect(hashToken("abc123")).toBe(hashToken("abc123"));
  });

  it("produces a 64-char hex sha256 digest", () => {
    expect(hashToken("abc123")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs for different inputs", () => {
    expect(hashToken("abc123")).not.toBe(hashToken("abc124"));
  });
});

describe("isResetTokenUsable", () => {
  const now = new Date("2026-01-01T12:00:00Z");

  it("is usable when unused and not yet expired", () => {
    const record = { used_at: null, expires_at: new Date("2026-01-01T12:30:00Z") };
    expect(isResetTokenUsable(record, now)).toBe(true);
  });

  it("is not usable once used", () => {
    const record = { used_at: new Date("2026-01-01T11:00:00Z"), expires_at: new Date("2026-01-01T12:30:00Z") };
    expect(isResetTokenUsable(record, now)).toBe(false);
  });

  it("is not usable once expired", () => {
    const record = { used_at: null, expires_at: new Date("2026-01-01T11:59:59Z") };
    expect(isResetTokenUsable(record, now)).toBe(false);
  });

  it("treats the expiry instant itself as expired", () => {
    const record = { used_at: null, expires_at: now };
    expect(isResetTokenUsable(record, now)).toBe(false);
  });
});

describe("googleClaimsToProfile", () => {
  it("returns null when sub is missing", () => {
    expect(googleClaimsToProfile({ email: "a@b.com" })).toBeNull();
  });

  it("returns null when email is missing", () => {
    expect(googleClaimsToProfile({ sub: "123" })).toBeNull();
  });

  it("uses the name claim as display name when present", () => {
    const profile = googleClaimsToProfile({ sub: "123", email: "a@b.com", name: "Ada Lovelace", email_verified: true });
    expect(profile).toEqual({ googleId: "123", email: "a@b.com", emailVerified: true, displayName: "Ada Lovelace" });
  });

  it("falls back to the email local-part when name is absent", () => {
    const profile = googleClaimsToProfile({ sub: "123", email: "ada@example.com" });
    expect(profile?.displayName).toBe("ada");
  });

  it("falls back to the email local-part when name is blank", () => {
    const profile = googleClaimsToProfile({ sub: "123", email: "ada@example.com", name: "   " });
    expect(profile?.displayName).toBe("ada");
  });

  it("defaults emailVerified to false when the claim is absent", () => {
    const profile = googleClaimsToProfile({ sub: "123", email: "a@b.com" });
    expect(profile?.emailVerified).toBe(false);
  });

  it("clamps an overlong name to 100 characters", () => {
    const profile = googleClaimsToProfile({ sub: "123", email: "a@b.com", name: "x".repeat(150) });
    expect(profile?.displayName).toHaveLength(100);
  });
});
