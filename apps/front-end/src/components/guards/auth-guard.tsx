"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { setAuth } from "@/store/slices/common/auth.slice";
import { loadAuthData } from "@/lib/storage/auth-storage";
import { isTokenExpired } from "@/lib/utils/jwt";

/**
 * This project has no permissions system (TECHSPEC.md §2), so unlike the
 * boilerplate's AuthGuard this only rehydrates from storage and checks the
 * token's local expiry — there is nothing to resolve from the server.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  useEffect(() => {
    if (accessToken) return;

    const stored = loadAuthData();
    if (stored && !isTokenExpired(stored.accessToken)) {
      dispatch(setAuth(stored));
      return;
    }

    router.replace("/login");
  }, [accessToken, dispatch, router]);

  if (!accessToken) return null;
  return <>{children}</>;
}
