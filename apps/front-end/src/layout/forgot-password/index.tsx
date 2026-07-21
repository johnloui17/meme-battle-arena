"use client";

import Link from "next/link";
import { GuestGuard } from "@/components/guards/guest-guard";
import { AuthTicketShell } from "@/components/shell/auth-ticket";
import { useForgotPassword } from "./index.hook";

const INPUT_CLASS =
  "w-full rounded-[7px] border-2 border-[rgba(43,27,16,0.22)] bg-[rgba(255,255,255,0.5)] p-[13px_14px] font-mba-body text-[14.5px] text-mba-ink outline-none transition-colors duration-150 placeholder:text-[rgba(43,27,16,0.35)] focus:border-mba-red focus:bg-white/85";

const LABEL_CLASS = "font-mba-mono text-[11px] uppercase tracking-[0.06em] text-mba-ink opacity-60";

const SUBMIT_CLASS =
  "mt-2 rounded-[8px] border-2 border-mba-ink bg-[linear-gradient(90deg,var(--mba-red),var(--mba-gold))] p-[14px] font-mba-display text-[17px] font-bold text-mba-ink shadow-[4px_4px_0_var(--mba-ink)] transition-[transform,box-shadow] duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_var(--mba-ink)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_var(--mba-ink)] disabled:pointer-events-none disabled:opacity-60";

function ForgotPasswordScreen() {
  const { email, setEmail, error, isLoading, sent, handleSubmit } = useForgotPassword();

  return (
    <AuthTicketShell>
      <div className="mb-[14px] inline-flex items-center gap-2 font-mba-mono text-[11px] uppercase tracking-[0.1em] text-mba-red-deep">
        ✦ Lost Ticket ✦
      </div>
      <h1 className="mb-[10px] font-mba-display text-[32px] leading-[1.1] font-extrabold tracking-[-0.01em] max-[700px]:text-[26px]">
        Reset your{" "}
        <span className="bg-[linear-gradient(90deg,var(--mba-red),var(--mba-teal))] bg-clip-text text-transparent">
          pass.
        </span>
      </h1>

      {sent ? (
        <>
          <p className="mb-[30px] text-[14.5px] leading-[1.55] text-mba-ink opacity-68">
            Check your inbox — if that email has an account, a reset link is on its way.
          </p>
          <Link
            href="/login"
            className="font-mba-mono text-[12px] text-mba-red-deep underline decoration-dashed underline-offset-2"
          >
            ← Back to log in
          </Link>
        </>
      ) : (
        <>
          <p className="mb-[30px] text-[14.5px] leading-[1.55] text-mba-ink opacity-68">
            Enter the email on your account and we&apos;ll send you a link to set a new password.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            {error && (
              <p role="alert" className="text-[13px] text-mba-err">
                {error}
              </p>
            )}

            <button type="submit" disabled={isLoading} className={SUBMIT_CLASS}>
              {isLoading ? "Sending…" : "Send reset link →"}
            </button>
          </form>

          <p className="mt-[26px] text-center text-[13.5px] text-mba-ink opacity-70">
            Remembered it after all?{" "}
            <Link href="/login" className="font-semibold text-mba-red-deep underline decoration-dashed underline-offset-2">
              Log in
            </Link>
          </p>
        </>
      )}
    </AuthTicketShell>
  );
}

export default function ForgotPasswordLayout() {
  return (
    <GuestGuard>
      <ForgotPasswordScreen />
    </GuestGuard>
  );
}
