const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise: Promise<void> | null = null;

/** Injects the Google Identity Services script at most once, caching the in-flight load. */
function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Identity Services can only load in the browser"));
  }
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null; // allow a retry on the next call
      reject(new GoogleAuthError("script_load_failed"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export class GoogleAuthError extends Error {
  /** true when the user closed the popup themselves — callers should stay silent, not show an error. */
  readonly dismissed: boolean;

  constructor(type: string) {
    super(`Google sign-in failed (${type})`);
    this.name = "GoogleAuthError";
    this.dismissed = type === "popup_closed" || type === "popup_failed_to_open";
  }
}

/** Runs the GIS popup auth-code flow and resolves with the one-time code for the backend to exchange. */
export function requestGoogleAuthCode(clientId: string): Promise<string> {
  return loadGoogleIdentityScript().then(
    () =>
      new Promise<string>((resolve, reject) => {
        const client = window.google!.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: "openid email profile",
          ux_mode: "popup",
          callback: (response) => {
            if (response.code) resolve(response.code);
            else reject(new GoogleAuthError(response.error ?? "unknown_error"));
          },
          error_callback: (error) => reject(new GoogleAuthError(error.type)),
        });
        client.requestCode();
      })
  );
}
