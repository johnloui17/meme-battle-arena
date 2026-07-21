export {};

interface GoogleCodeResponse {
  code?: string;
  error?: string;
}

interface GoogleCodeClientErrorEvent {
  type: string;
  message?: string;
}

interface GoogleCodeClientConfig {
  client_id: string;
  scope: string;
  ux_mode?: "popup" | "redirect";
  callback: (response: GoogleCodeResponse) => void;
  error_callback?: (error: GoogleCodeClientErrorEvent) => void;
}

interface GoogleCodeClient {
  requestCode(): void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient(config: GoogleCodeClientConfig): GoogleCodeClient;
        };
      };
    };
  }
}
