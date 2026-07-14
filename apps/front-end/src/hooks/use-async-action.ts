import { useCallback, useRef, useState } from "react";

export function useAsyncAction<T extends (...args: never[]) => Promise<unknown>>(
  action: T,
  options?: { onSuccess?: (result: Awaited<ReturnType<T>>) => void; onError?: (error: unknown) => void }
): [T, boolean] {
  const [isLoading, setIsLoading] = useState(false);
  const isExecutingRef = useRef(false);

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      if (isExecutingRef.current) return;
      isExecutingRef.current = true;
      setIsLoading(true);
      try {
        const result = await action(...args);
        options?.onSuccess?.(result as Awaited<ReturnType<T>>);
        return result;
      } catch (error) {
        // Every call site fires this without awaiting/catching (event handlers calling
        // `submit()` directly) — re-throwing here would just become an unhandled
        // rejection in the browser once onError has already reported the failure.
        options?.onError?.(error);
      } finally {
        isExecutingRef.current = false;
        setIsLoading(false);
      }
    },
    [action, options]
  ) as T;

  return [execute, isLoading];
}
