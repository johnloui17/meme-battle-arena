import { describe, it, expect } from "vitest";
import { computeStreak, escapeLike, PERIOD_INTERVALS, STREAK_LOOKBACK } from "./leaderboard.logic";

const W = true;
const L = false;

describe("computeStreak", () => {
  it("returns null for a meme with no votes", () => {
    expect(computeStreak([])).toBeNull();
  });

  it("counts a single outcome as a streak of 1", () => {
    expect(computeStreak([W])).toEqual({ outcome: "W", count: 1 });
    expect(computeStreak([L])).toEqual({ outcome: "L", count: 1 });
  });

  it("counts only the leading run of identical outcomes", () => {
    expect(computeStreak([W, W, L, W])).toEqual({ outcome: "W", count: 2 });
    expect(computeStreak([L, W, W, W])).toEqual({ outcome: "L", count: 1 });
  });

  it("counts a full-lookback run without overflowing", () => {
    const outcomes = Array.from({ length: STREAK_LOOKBACK }, () => W);
    expect(computeStreak(outcomes)).toEqual({ outcome: "W", count: STREAK_LOOKBACK });
  });
});

describe("escapeLike", () => {
  it("escapes LIKE wildcards so they match literally", () => {
    expect(escapeLike("100%_done")).toBe("100\\%\\_done");
  });

  it("escapes backslashes before they can form their own escape", () => {
    expect(escapeLike("a\\b")).toBe("a\\\\b");
  });

  it("leaves plain text untouched", () => {
    expect(escapeLike("uncle")).toBe("uncle");
  });
});

describe("PERIOD_INTERVALS", () => {
  it("covers every non-all period with a Postgres interval", () => {
    expect(PERIOD_INTERVALS).toEqual({ week: "7 days", month: "30 days" });
  });
});
