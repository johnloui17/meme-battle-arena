import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared "admit-one ticket" chrome for the auth pages (login, register,
 * forgot/reset password) — background, minimal header, ticket card + stub,
 * and footer. Each page supplies only its form content as children.
 */
export function AuthTicketShell({ children }: { children: ReactNode }) {
  return (
    <div className="mba relative flex min-h-screen flex-col overflow-x-hidden font-mba-body text-mba-text-hi [background:radial-gradient(ellipse_800px_500px_at_15%_0%,rgba(200,29,58,0.14),transparent_60%),radial-gradient(ellipse_800px_500px_at_85%_10%,rgba(14,124,116,0.16),transparent_60%),var(--mba-stage)]">
      <div className="mba-grain" aria-hidden />

      <header className="flex items-center justify-between border-b border-mba-line px-[28px] py-5">
        <Link
          href="/"
          className="flex items-center gap-2 font-mba-display text-[20px] font-extrabold whitespace-nowrap"
        >
          🎬 Meme Battle Arena
        </Link>
        <Link
          href="/arena"
          className="flex items-center gap-[6px] rounded-full border border-mba-line-strong px-[14px] py-2 font-mba-mono text-[12px] text-mba-text-mid transition-colors duration-150 hover:border-mba-text-mid hover:text-mba-text-hi"
        >
          ← Back to arena
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pt-10 pb-[60px]">
        <div className="grid w-full max-w-[860px] grid-cols-[1fr_auto] rounded-[10px] border-[3px] border-mba-ink bg-mba-paper text-mba-ink shadow-[10px_10px_0_var(--mba-red-deep)] max-[700px]:grid-cols-1">
          <section className="p-[44px_46px] max-[700px]:p-[34px_26px]">{children}</section>

          <aside className="relative flex w-[190px] flex-col items-center justify-center gap-1 border-l-[3px] border-dashed border-[rgba(43,27,16,0.35)] bg-mba-paper-2 p-[30px_18px] text-center max-[700px]:w-full max-[700px]:flex-row max-[700px]:justify-center max-[700px]:gap-4 max-[700px]:border-l-0 max-[700px]:border-t-[3px] max-[700px]:p-[20px_24px]">
            <span
              className="absolute left-[-13px] top-[-13px] h-6 w-6 rounded-full border-[3px] border-mba-ink bg-mba-stage max-[700px]:hidden"
              aria-hidden
            />
            <div className="mb-4 flex h-[70px] w-[70px] items-center justify-center rounded-full border-[3px] border-mba-ink bg-[radial-gradient(circle,var(--mba-gold),var(--mba-gold-deep))] font-mba-display text-[26px] font-extrabold text-mba-ink max-[700px]:mb-0 max-[700px]:h-[50px] max-[700px]:w-[50px] max-[700px]:text-[18px]">
              VS
            </div>
            <div className="max-[700px]:text-left">
              <div className="mb-[6px] font-mba-display text-[16px] font-bold">Admit One</div>
              <div className="font-mba-mono text-[11px] leading-[1.6] text-mba-ink opacity-55">
                SHOW #142
                <br />
                KERALA / ONLINE
              </div>
            </div>
            <span
              className="absolute bottom-[-13px] left-[-13px] h-6 w-6 rounded-full border-[3px] border-mba-ink bg-mba-stage max-[700px]:hidden"
              aria-hidden
            />
            <span
              className="absolute bottom-[26px] right-[14px] font-mba-mono text-[10px] uppercase tracking-[0.2em] text-mba-ink opacity-35 [writing-mode:vertical-rl] max-[700px]:hidden"
              aria-hidden
            >
              MASS ONLY
            </span>
          </aside>
        </div>
      </main>

      <footer className="pb-5 text-center font-mba-mono text-[11.5px] text-mba-text-dim">
        🎬 MEME BATTLE ARENA — Kerala&apos;s own meme leaderboard
      </footer>
    </div>
  );
}
