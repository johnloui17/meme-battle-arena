"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanding, type FighterSide } from "./index.hook";

const WRAP = "max-w-[1180px] mx-auto px-[28px]";
// In the source design, each section's own `padding` shorthand overrides
// .wrap's horizontal padding, so sections span the full 1180px.
const WRAP_BARE = "max-w-[1180px] mx-auto";

const NAV_LINKS = [
  { label: "Arena", href: "/arena", active: true },
  { label: "Upload", href: "/upload", active: false },
  { label: "Leaderboard", href: "/leaderboard", active: false },
  { label: "My Memes", href: "/my-memes", active: false },
];

const FIGHTERS = {
  p1: {
    frame: ["Onam Sadya", "Uncle"],
    name: "Onam Sadya Uncle",
    wins: 18,
    losses: 7,
    rating: 1240,
    target: "72%",
    key: "←",
  },
  p2: {
    frame: ["Auto U-Turn", "Uncle"],
    name: "Auto U-Turn Uncle",
    wins: 11,
    losses: 9,
    rating: 1198,
    target: "65%",
    key: "→",
  },
} as const;

const ROUNDS = [
  {
    round: "1",
    tag: "Round 1 — Entry",
    tagColor: "text-mba-red",
    title: "Post your meme",
    body: "Drop your format into the ring — Onam sadya jokes, auto uncle chaos, or your own original poli content.",
  },
  {
    round: "2",
    tag: "Round 2 — Vote",
    tagColor: "text-mba-gold",
    title: "Adipoli or mokka?",
    body: "Every visitor votes head-to-head. Pick the funnier one — no comments, no scrolling, just a straight verdict.",
  },
  {
    round: "3",
    tag: "Round 3 — Climb",
    tagColor: "text-mba-teal",
    title: "Chase the top rank",
    body: "Wins push your rating up the ladder. Beat a higher-rated meme for a bigger jump — same logic as any ranked game.",
  },
];

const BOARD_ROWS = [
  {
    medal: "🥇",
    rankClass: "bg-[rgba(232,169,59,0.15)] text-mba-gold",
    emoji: "🍛",
    thumbGradient: "linear-gradient(160deg,var(--mba-red),var(--mba-red-deep))",
    title: "Onam Sadya Uncle",
    by: "by loui",
    record: "18W – 7L",
    rating: "1240",
    ratingStyle: { color: "var(--mba-gold)" },
  },
  {
    medal: "🥈",
    rankClass: "bg-[rgba(201,183,154,0.12)] text-mba-text-mid",
    emoji: "🛺",
    thumbGradient: "linear-gradient(200deg,var(--mba-teal),var(--mba-teal-deep))",
    title: "Auto U-Turn Uncle",
    by: "by sam",
    record: "11W – 9L",
    rating: "1198",
    ratingStyle: { color: "var(--mba-text-mid)" },
  },
  {
    medal: "🥉",
    rankClass: "bg-[rgba(200,29,58,0.14)] text-[#e78193]",
    emoji: "🚦",
    thumbGradient: "linear-gradient(160deg,#5a2130,#2b0f16)",
    title: "Traffic Jam Philosopher",
    by: "by kochi_dev",
    record: "9W – 6L",
    rating: "1151",
    ratingStyle: { color: "#e78193" },
  },
];

function Fighter({
  side,
  selected,
  flash,
  barsFilled,
  onVote,
}: {
  side: FighterSide;
  selected: boolean;
  flash: { side: FighterSide; key: number } | null;
  barsFilled: boolean;
  onVote: (side: FighterSide) => void;
}) {
  const f = FIGHTERS[side];
  const isP1 = side === "p1";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onVote(side)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onVote(side);
        }
      }}
      className={cn(
        "mba-halftone relative cursor-pointer rounded-[6px] border-[3px] border-mba-ink bg-mba-paper p-5 text-mba-ink",
        "transition-[transform,box-shadow] duration-[250ms] ease-out",
        isP1
          ? "-rotate-2 mr-[-14px] hover:shadow-[8px_8px_0_var(--mba-red-deep)] max-[820px]:order-1 max-[820px]:m-0 max-[820px]:rotate-0"
          : "rotate-2 ml-[-14px] hover:shadow-[-8px_8px_0_var(--mba-teal-deep)] max-[820px]:order-3 max-[820px]:m-0 max-[820px]:rotate-0",
        "hover:rotate-0 hover:-translate-y-[4px]",
        selected && [
          "rotate-0 -translate-y-[4px]",
          isP1 ? "shadow-[8px_8px_0_var(--mba-red-deep)]" : "shadow-[-8px_8px_0_var(--mba-teal-deep)]",
        ]
      )}
    >
      <span
        className={cn(
          "absolute -top-[7px] z-[2] h-[14px] w-[14px] rounded-full border-2 border-mba-ink bg-mba-gold",
          isP1 ? "left-[14px]" : "right-[14px]"
        )}
      />
      {flash?.side === side && (
        <div
          key={flash.key}
          className={cn(
            "pointer-events-none absolute inset-[-6px] -z-[1] rounded-[10px] opacity-0",
            "animate-[mba-flash-pulse_.5s_ease-out]",
            isP1
              ? "bg-[radial-gradient(circle,rgba(200,29,58,0.55),transparent_70%)]"
              : "bg-[radial-gradient(circle,rgba(14,124,116,0.55),transparent_70%)]"
          )}
        />
      )}
      <div
        className={cn(
          "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[4px] border-2 border-mba-ink p-4 text-center font-mba-display text-[16px] font-bold text-mba-paper",
          isP1
            ? "bg-[linear-gradient(160deg,var(--mba-red),var(--mba-red-deep))]"
            : "bg-[linear-gradient(200deg,var(--mba-teal),var(--mba-teal-deep))]"
        )}
      >
        <span>
          {f.frame[0]}
          <br />
          {f.frame[1]}
        </span>
      </div>
      <div className="mt-[14px] text-center font-mba-display text-[19px] font-bold">{f.name}</div>
      <div className="mt-[6px] flex justify-center gap-[14px] font-mba-mono text-[12px] text-mba-ink opacity-75">
        <span>
          <b>{f.wins}W</b>–{f.losses}L
        </span>
        <span>{f.rating}</span>
      </div>
      <div className="mt-3 h-[6px] overflow-hidden rounded-[3px] bg-[rgba(43,27,16,0.15)]">
        <div
          className={cn(
            "h-full rounded-[3px] transition-[width] duration-[1100ms] ease-[cubic-bezier(.16,1,.3,1)]",
            isP1
              ? "bg-[linear-gradient(90deg,var(--mba-red-deep),var(--mba-red))]"
              : "bg-[linear-gradient(90deg,var(--mba-teal-deep),var(--mba-teal))]"
          )}
          style={{ width: barsFilled ? f.target : "0%" }}
        />
      </div>
      <div className="mt-[14px] text-center font-mba-mono text-[11px] tracking-[0.04em] text-mba-ink opacity-60">
        Press{" "}
        <kbd className="rounded-[4px] border border-[rgba(43,27,16,0.3)] bg-[rgba(43,27,16,0.08)] px-[7px] py-px font-mba-mono">
          {f.key}
        </kbd>{" "}
        to vote
      </div>
    </div>
  );
}

export default function LandingLayout() {
  const { userName, selected, flash, barsFilled, vote, theme, setTheme, settingsOpen, setSettingsOpen } =
    useLanding();

  return (
    <div className="mba relative min-h-screen w-full overflow-x-hidden font-mba-body leading-[normal] text-mba-text-hi [background:radial-gradient(ellipse_800px_500px_at_15%_0%,rgba(200,29,58,0.14),transparent_60%),radial-gradient(ellipse_800px_500px_at_85%_10%,rgba(14,124,116,0.16),transparent_60%),var(--mba-stage)]">
      <div className="mba-grain" aria-hidden />

      {/* ---------- NAV ---------- */}
      <header className="sticky top-0 z-[100] border-b border-mba-line bg-[var(--mba-hud-bg)] backdrop-blur-[10px]">
        <div className={cn(WRAP, "flex h-[66px] items-center justify-between")}>
          <div className="flex flex-none items-center gap-[10px] whitespace-nowrap font-mba-display text-[21px] font-extrabold tracking-[0.01em]">
            🎬 Meme Battle Arena
          </div>
          <nav className="flex items-center gap-1 max-[820px]:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "relative rounded-[6px] px-4 py-2 font-mba-display text-[16px] font-semibold transition-colors duration-150",
                  link.active
                    ? "text-mba-gold after:absolute after:bottom-[2px] after:left-4 after:right-4 after:h-[2px] after:bg-[linear-gradient(90deg,var(--mba-red),var(--mba-teal))] after:content-['']"
                    : "text-mba-text-mid hover:text-mba-text-hi"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {userName ? (
              <div className="flex items-center gap-2 rounded-full border border-mba-line-strong bg-mba-stage-2 py-[5px] pl-[6px] pr-[14px]">
                <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--mba-red),var(--mba-teal))] text-[11px]">
                  🥭
                </span>
                <span className="font-mba-mono text-[12px] text-mba-text-mid">{userName.toUpperCase()}</span>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-full border border-mba-line-strong bg-mba-stage-2 py-[5px] pl-[6px] pr-[14px]"
              >
                <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--mba-red),var(--mba-teal))] text-[11px]">
                  🥭
                </span>
                <span className="font-mba-mono text-[12px] text-mba-text-mid">LOGIN</span>
              </Link>
            )}
            {/* settings: theme switch (hidden on mobile — the 66px HUD can't fit it) */}
            <div className="relative max-[820px]:hidden">
              <button
                aria-label="Settings"
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="rounded-[6px] px-2 py-2 text-[16px] text-mba-text-mid transition-colors duration-150 hover:text-mba-text-hi"
              >
                ⚙
              </button>
              {settingsOpen && (
                <div className="absolute right-0 top-full z-[110] mt-2 flex w-[140px] flex-col gap-1 rounded-[8px] border border-mba-line-strong bg-mba-stage-2 p-2">
                  <div className="px-3 py-1 font-mba-mono text-[10px] uppercase tracking-[0.06em] text-mba-text-dim">
                    Theme
                  </div>
                  {(["dark", "light"] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setTheme(option);
                        setSettingsOpen(false);
                      }}
                      className={cn(
                        "rounded-[6px] px-3 py-1.5 text-left font-mba-mono text-[12px] capitalize transition-colors duration-150 hover:bg-[var(--mba-row-hover)]",
                        theme === option ? "text-mba-gold" : "text-mba-text-mid"
                      )}
                    >
                      {option === "dark" ? "🌙 Dark" : "☀️ Light"}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="hidden text-[22px] text-mba-text-hi max-[820px]:block" aria-label="Menu">
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* ---------- HERO ---------- */}
      <section className={cn(WRAP_BARE, "relative pb-9 pt-[70px] text-center")}>
        <div className="mb-[22px] inline-flex items-center gap-[10px] font-mba-mono text-[12px] uppercase tracking-[0.1em] text-mba-gold before:text-[10px] before:text-mba-text-dim before:content-['✦'] after:text-[10px] after:text-mba-text-dim after:content-['✦']">
          Kerala&apos;s own meme ring
        </div>
        <h1 className="mb-5 font-mba-display text-[clamp(38px,7vw,68px)] font-extrabold leading-[1.02] tracking-[-0.01em] [text-shadow:3px_3px_0_var(--mba-ink)]">
          Two formats enter.
          <br />
          One comes out{" "}
          <span className="bg-[linear-gradient(90deg,var(--mba-red),var(--mba-gold),var(--mba-teal))] bg-clip-text text-transparent [-webkit-text-stroke:1.5px_rgba(43,27,16,0.35)] [text-shadow:none]">
            mass.
          </span>
        </h1>
        <p className="mx-auto mb-[46px] max-w-[540px] text-[16px] leading-[1.65] text-mba-text-mid">
          Upload your most <b className="font-semibold text-mba-gold">poli</b> format, vote in face-offs, and
          watch the rating climb — no <b className="font-semibold text-mba-gold">mokka</b> allowed on this
          leaderboard.
        </p>

        {/* ---------- MATCHUP ---------- */}
        <div className="relative mx-auto grid max-w-[940px] grid-cols-[1fr_auto_1fr] items-center max-[820px]:grid-cols-1 max-[820px]:gap-[26px]">
          <Fighter side="p1" selected={selected === "p1"} flash={flash} barsFilled={barsFilled} onVote={vote} />

          <div className="relative z-[5] flex flex-col items-center gap-2 px-2 max-[820px]:order-2">
            <div className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full border-[3px] border-mba-ink bg-[radial-gradient(circle,var(--mba-gold),var(--mba-gold-deep))] font-mba-display text-[20px] font-extrabold text-mba-ink">
              <svg className="absolute inset-[-22px] -z-[1]" viewBox="0 0 120 120" aria-hidden>
                <g stroke="#E8A93B" strokeWidth="2" opacity="0.4">
                  <line x1="60" y1="0" x2="60" y2="20" />
                  <line x1="60" y1="100" x2="60" y2="120" />
                  <line x1="0" y1="60" x2="20" y2="60" />
                  <line x1="100" y1="60" x2="120" y2="60" />
                  <line x1="15" y1="15" x2="28" y2="28" />
                  <line x1="105" y1="15" x2="92" y2="28" />
                  <line x1="15" y1="105" x2="28" y2="92" />
                  <line x1="105" y1="105" x2="92" y2="92" />
                </g>
              </svg>
              VS
            </div>
            <div className="rounded-full border border-mba-line bg-mba-stage-2 px-[10px] py-[3px] text-center font-mba-mono text-[10px] tracking-[0.05em] text-mba-text-dim">
              SHOW #142
            </div>
          </div>

          <Fighter side="p2" selected={selected === "p2"} flash={flash} barsFilled={barsFilled} onVote={vote} />
        </div>

        <div className="mt-[30px] text-center font-mba-mono text-[12px] text-mba-text-dim">
          Click a fighter, or use the arrow keys — <b className="text-mba-gold">adipoli</b> goes up,{" "}
          <b className="text-mba-gold">mokka</b> goes down.
        </div>
      </section>

      {/* ---------- ROUNDS ---------- */}
      <section className={cn(WRAP_BARE, "mt-16 border-t border-mba-line pb-[84px] pt-[100px]")}>
        <div className="mb-[52px] text-center">
          <div className="mb-[10px] font-mba-mono text-[12px] uppercase tracking-[0.1em] text-mba-gold">
            How the arena works
          </div>
          <h2 className="font-mba-display text-[clamp(26px,4vw,38px)] font-extrabold tracking-[-0.01em]">
            Three rounds to the top
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-[22px] max-[820px]:grid-cols-1">
          {ROUNDS.map((round) => (
            <div
              key={round.round}
              data-round={round.round}
              className="mba-round-card relative overflow-hidden rounded-[12px] border border-mba-line bg-mba-stage-2 px-6 py-7"
            >
              <div
                className={cn(
                  "mb-[14px] inline-block font-mba-mono text-[11px] uppercase tracking-[0.06em]",
                  round.tagColor
                )}
              >
                {round.tag}
              </div>
              <h3 className="mb-[10px] font-mba-display text-[22px] font-bold">{round.title}</h3>
              <p className="relative text-[14.5px] leading-[1.6] text-mba-text-mid">{round.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- LEADERBOARD ---------- */}
      <section className={cn(WRAP_BARE, "pb-[100px]")}>
        <div className="mb-[52px] text-center">
          <div className="mb-[10px] font-mba-mono text-[12px] uppercase tracking-[0.1em] text-mba-gold">
            Live standings
          </div>
          <h2 className="font-mba-display text-[clamp(26px,4vw,38px)] font-extrabold tracking-[-0.01em]">
            Leaderboard
          </h2>
        </div>
        <div className="overflow-hidden rounded-[14px] border border-mba-line bg-mba-stage-2">
          <div className="grid grid-cols-[56px_1fr_auto_auto] items-center gap-[18px] border-b border-mba-line px-[22px] py-3 font-mba-mono text-[11px] uppercase tracking-[0.06em] text-mba-text-dim max-[820px]:grid-cols-[40px_1fr_auto]">
            <span>Rank</span>
            <span>Meme</span>
            <span>Record</span>
            <span className="text-right">Rating</span>
          </div>
          {BOARD_ROWS.map((row) => (
            <div
              key={row.title}
              className="grid grid-cols-[56px_1fr_auto_auto] items-center gap-[18px] border-b border-mba-line px-[22px] py-4 transition-colors duration-150 last:border-b-0 hover:bg-[var(--mba-row-hover)] max-[820px]:grid-cols-[40px_1fr_auto]"
            >
              <div
                className={cn(
                  "flex h-[38px] w-[38px] items-center justify-center rounded-[8px] font-mba-display text-[20px] font-extrabold",
                  row.rankClass
                )}
              >
                {row.medal}
              </div>
              <div className="flex items-center gap-[14px]">
                <div
                  className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[8px] border-2 border-mba-ink text-[19px]"
                  style={{ background: row.thumbGradient }}
                >
                  {row.emoji}
                </div>
                <div>
                  <b className="block font-mba-display text-[16px] font-bold">{row.title}</b>
                  <span className="font-mba-mono text-[11.5px] text-mba-text-dim">{row.by}</span>
                </div>
              </div>
              <div className="whitespace-nowrap font-mba-mono text-[13px] text-mba-text-mid max-[820px]:hidden">
                {row.record}
              </div>
              <div className="text-right font-mba-mono text-[16px] font-bold" style={row.ratingStyle}>
                {row.rating}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className={cn(WRAP_BARE, "pb-[120px] pt-9 text-center")}>
        <div className="mx-auto max-w-[720px] rounded-[16px] border border-mba-line-strong px-10 py-14 [background:linear-gradient(135deg,rgba(200,29,58,0.12),rgba(14,124,116,0.12)),var(--mba-stage-2)]">
          <h2 className="mb-[14px] font-mba-display text-[clamp(26px,4vw,38px)] font-extrabold tracking-[-0.01em]">
            Aliyaa, ready to upload?
          </h2>
          <p className="mb-8 text-[15.5px] text-mba-text-mid">
            Log in to drop your meme into the arena and track its record all the way to the top.
          </p>
          <div className="flex flex-wrap justify-center gap-[14px]">
            <Link
              href="/login"
              className="rounded-[8px] bg-[linear-gradient(90deg,var(--mba-red),var(--mba-gold))] px-[30px] py-[14px] font-mba-display text-[16px] font-bold text-mba-ink transition-[transform,box-shadow] duration-150 hover:-translate-y-[2px] hover:shadow-[0_12px_30px_-10px_rgba(232,169,59,0.35)]"
            >
              Log in to upload
            </Link>
            <Link
              href="/arena"
              className="rounded-[8px] border border-mba-line-strong px-[30px] py-[14px] font-mba-display text-[16px] font-bold text-mba-text-hi transition-colors duration-150 hover:border-mba-text-mid"
            >
              Watch a face-off
            </Link>
          </div>
        </div>
      </section>

      {/* .wrap's `padding:0 28px` beats footer's `padding:28px 0` in the source
          design (class > element selector), so the footer has no vertical padding
          and the top border spans only the 1180px wrap. */}
      <footer className={cn(WRAP_BARE, "border-t border-mba-line px-[28px] text-center font-mba-mono text-[12px] text-mba-text-dim")}>
        🎬 MEME BATTLE ARENA — Kerala&apos;s own meme leaderboard
      </footer>
    </div>
  );
}
