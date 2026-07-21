"use client";

import Link from "next/link";
import { AuthTicketShell } from "@/components/shell/auth-ticket";
import { useResetPassword } from "./index.hook";

const INPUT_CLASS =
  "w-full rounded-[7px] border-2 border-[rgba(43,27,16,0.22)] bg-[rgba(255,255,255,0.5)] p-[13px_14px] font-mba-body text-[14.5px] text-mba-ink outline-none transition-colors duration-150 placeholder:text-[rgba(43,27,16,0.35)] focus:border-mba-red focus:bg-white/85";

const LABEL_CLASS = "font-mba-mono text-[11px] uppercase tracking-[0.06em] text-mba-ink opacity-60";

const SUBMIT_CLASS =
  "mt-2 rounded-[8px] border-2 border-mba-ink bg-[linear-gradient(90deg,var(--mba-red),var(--mba-gold))] p-[14px] font-mba-display text-[17px] font-bold text-mba-ink shadow-[4px_4px_0_var(--mba-ink)] transition-[transform,box-shadow] duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_var(--mba-ink)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_var(--mba-ink)] disabled:pointer-events-none disabled:opacity-60";

// Deliberately NOT wrapped in GuestGuard — a logged-in user following a
// reset link (e.g. from another device) is a legitimate flow.
export default function ResetPasswordLayout() {
  const {
    hasToken,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    error,
    isLoading,
    done,
    handleSubmit,
  } = useResetPassword();

  return (
    <AuthTicketShell>
      <div className="mb-[14px] inline-flex items-center gap-2 font-mba-mono text-[11px] uppercase tracking-[0.1em] text-mba-red-deep">
        ✦ Fresh Ticket ✦
      </div>
      <h1 className="mb-[10px] font-mba-display text-[32px] leading-[1.1] font-extrabold tracking-[-0.01em] max-[700px]:text-[26px]">
        Set a new{" "}
        <span className="bg-[linear-gradient(90deg,var(--mba-red),var(--mba-teal))] bg-clip-text text-transparent">
          password.
        </span>
      </h1>

      {!hasToken ? (
        <>
          <p role="alert" className="mb-[30px] text-[14.5px] leading-[1.55] text-mba-err">
            That reset link is invalid or has expired.
          </p>
          <Link
            href="/forgot-password"
            className="font-mba-mono text-[12px] text-mba-red-deep underline decoration-dashed underline-offset-2"
          >
            Request a new link
          </Link>
        </>
      ) : done ? (
        <>
          <p className="mb-[30px] text-[14.5px] leading-[1.55] text-mba-ink opacity-68">
            Password updated. Your old sessions have been logged out.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-[8px] border-2 border-mba-ink bg-[linear-gradient(90deg,var(--mba-red),var(--mba-gold))] px-6 py-3 font-mba-display text-[16px] font-bold text-mba-ink shadow-[4px_4px_0_var(--mba-ink)]"
          >
            Log in →
          </Link>
        </>
      ) : (
        <>
          <p className="mb-[30px] text-[14.5px] leading-[1.55] text-mba-ink opacity-68">
            Choose a new password for your account.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="password" className={LABEL_CLASS}>
                New password
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

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="confirm-password" className={LABEL_CLASS}>
                Confirm password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            {error && (
              <p role="alert" className="text-[13px] text-mba-err">
                {error}
              </p>
            )}

            <button type="submit" disabled={isLoading} className={SUBMIT_CLASS}>
              {isLoading ? "Updating…" : "Update password →"}
            </button>
          </form>
        </>
      )}
    </AuthTicketShell>
  );
}
