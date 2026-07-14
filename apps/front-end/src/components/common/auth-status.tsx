"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@ntrs/core";
import type { AppDispatch, RootState } from "@/store";
import { setAuth, logoutUser } from "@/store/slices/common/auth.slice";
import { loadAuthData } from "@/lib/storage/auth-storage";
import { isTokenExpired } from "@/lib/utils/jwt";

export function AuthStatus() {
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (accessToken) return;
    const stored = loadAuthData();
    if (stored && !isTokenExpired(stored.accessToken)) {
      dispatch(setAuth(stored));
    }
  }, [accessToken, dispatch]);

  if (!accessToken || !user) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="underline">
          Log in
        </Link>{" "}
        to try the auth feature.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span>
        Logged in as <strong>{user.display_name}</strong>
      </span>
      <Link href="/arena" className="underline">
        Arena
      </Link>
      <Link href="/upload" className="underline">
        Upload a meme
      </Link>
      <Link href="/my-memes" className="underline">
        My memes
      </Link>
      <Link href="/leaderboard" className="underline">
        Leaderboard
      </Link>
      <Button variant="outline" size="sm" onClick={() => dispatch(logoutUser())}>
        Log out
      </Button>
    </div>
  );
}
