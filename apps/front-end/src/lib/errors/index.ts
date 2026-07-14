import axios from "axios";
import { getErrorMessage } from "./error-codes";

export { getErrorMessage } from "./error-codes";

export interface ApiErrorShape {
  errorCode?: string;
  errorMessage: string;
}

export function extractApiError(error: unknown): ApiErrorShape {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { error?: string; message?: string } | undefined;
    return {
      errorCode: body?.error,
      errorMessage: body?.message || getErrorMessage(body?.error),
    };
  }
  if (error instanceof Error) {
    return { errorMessage: error.message };
  }
  return { errorMessage: "Something went wrong. Please try again." };
}
