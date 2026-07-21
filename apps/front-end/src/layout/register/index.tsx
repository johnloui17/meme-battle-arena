"use client";

import Link from "next/link";
import { GuestGuard } from "@/components/guards/guest-guard";
import { AuthTicketShell } from "@/components/shell/auth-ticket";
import { GoogleSignInButton } from "@/components/shell/google-sign-in-button";
import { useRegister } from "./index.hook";

const INPUT_CLASS =
  "w-full rounded-[7px] border-2 border-[rgba(43,27,16,0.22)] bg-[rgba(255,255,255,0.5)] p-[13px_14px] font-mba-body text-[14.5px] text-mba-ink outline-none transition-colors duration-150 placeholder:text-[rgba(43,27,16,0.35)] focus:border-mba-red focus:bg-white/85";

const LABEL_CLASS = "font-mba-mono text-[11px] uppercase tracking-[0.06em] text-mba-ink opacity-60";

const SUBMIT_CLASS =
  "mt-2 rounded-[8px] border-2 border-mba-ink bg-[linear-gradient(90deg,var(--mba-red),var(--mba-gold))] p-[14px] font-mba-display text-[17px] font-bold text-mba-ink shadow-[4px_4px_0_var(--mba-ink)] transition-[transform,box-shadow] duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_var(--mba-ink)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_var(--mba-ink)] disabled:pointer-events-none disabled:opacity-60";

function RegisterScreen() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    displayName,
    setDisplayName,
    remember,
    setRemember,
    error,
    isLoading,
    isGoogleLoading,
    handleSubmit,
    handleGoogleLogin,
    googleEnabled,
  } = useRegister();

  return (
    <AuthTicketShell>
      <div className="mb-[14px] inline-flex items-center gap-2 font-mba-mono text-[11px] uppercase tracking-[0.1em] text-mba-red-deep">
        ✦ New Fighter ✦
      </div>
      <h1 className="mb-[10px] font-mba-display text-[32px] leading-[1.1] font-extrabold tracking-[-0.01em] max-[700px]:text-[26px]">
        Join the{" "}
        <span className="bg-[linear-gradient(90deg,var(--mba-red),var(--mba-teal))] bg-clip-text text-transparent">
          arena.
        </span>
      </h1>
      <p className="mb-[30px] text-[14.5px] leading-[1.55] text-mba-ink opacity-68">
        Create an account to upload your own formats and start climbing the leaderboard.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-[6px]">
          <label htmlFor="display-name" className={LABEL_CLASS}>
            Display name
          </label>
          <input
            id="display-name"
            type="text"
            required
            maxLength={100}
            autoComplete="nickname"
            placeholder="Your fighter name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="email" className={LABEL_CLASS}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <label htmlFor="password" className={LABEL_CLASS}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_CLASS}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 font-mba-mono text-[11px] tracking-[0.04em] text-mba-red-deep"
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>
        </div>

        <label className="-mt-1 flex items-center gap-[7px] text-[13px] text-mba-ink opacity-70">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-[15px] w-[15px] accent-mba-red"
          />
          Keep me logged in
        </label>

        {error && (
          <p role="alert" className="text-[13px] text-mba-err">
            {error}
          </p>
        )}

        <button type="submit" disabled={isLoading} className={SUBMIT_CLASS}>
          {isLoading ? "Creating account…" : "Create account →"}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="my-[20px] flex items-center gap-3 text-mba-ink opacity-45">
            <span className="h-px flex-1 bg-[rgba(43,27,16,0.25)]" />
            <span className="font-mba-mono text-[11px] uppercase tracking-[0.06em]">or continue with</span>
            <span className="h-px flex-1 bg-[rgba(43,27,16,0.25)]" />
          </div>
          <GoogleSignInButton onClick={handleGoogleLogin} disabled={isGoogleLoading} />
        </>
      )}

      <p className="mt-[26px] text-center text-[13.5px] text-mba-ink opacity-70">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-mba-red-deep underline decoration-dashed underline-offset-2">
          Log in
        </Link>
      </p>
    </AuthTicketShell>
  );
}

export default function RegisterLayout() {
  return (
    <GuestGuard>
      <RegisterScreen />
    </GuestGuard>
  );
}
