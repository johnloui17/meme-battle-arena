"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { setAuth } from "@/store/slices/common/auth.slice";
import { loadAuthData } from "@/lib/storage/auth-storage";
import { isTokenExpired } from "@/lib/utils/jwt";

/**
 * The mirror image of AuthGuard: keeps already-logged-in visitors off pages
 * that only make sense while signed out (login, register, forgot-password).
 * Mirrors AuthGuard's render strategy — the decision is based on redux state
 * alone (so server and pre-hydration client renders agree), and the effect
 * only rehydrates from storage and redirects, never a local setState.
 */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  useEffect(() => {
    if (accessToken) {
      router.replace("/");
      return;
    }

    const stored = loadAuthData();
    if (stored && !isTokenExpired(stored.accessToken)) {
      dispatch(setAuth(stored));
      router.replace("/");
    }
  }, [accessToken, dispatch, router]);

  if (accessToken) return null;
  return <>{children}</>;
}
