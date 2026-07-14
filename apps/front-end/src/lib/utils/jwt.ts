interface DecodedAccessToken {
  sub: string;
  display_name: string;
  exp: number;
}

export function decodeAccessToken(token: string): DecodedAccessToken | null {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeAccessToken(token);
  if (!decoded) return true;
  return decoded.exp * 1000 <= Date.now();
}
