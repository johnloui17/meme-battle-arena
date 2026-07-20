import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { LeaderboardEntry, LeaderboardPeriod } from "@meme-battle-arena/contracts";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchLeaderboard,
  fetchLeaderboardMe,
  loadMoreLeaderboard,
} from "@/store/slices/leaderboard.slice";
import type { ListLeaderboardFilters } from "@/lib/api/services/leaderboard.service";
import { API } from "@/resources/constants";

const SEARCH_DEBOUNCE_MS = 300;

/** Fixed key order — the slice's cache compares params with JSON.stringify. */
function buildFilters(period: LeaderboardPeriod, q?: string, page?: number): ListLeaderboardFilters {
  const filters: ListLeaderboardFilters = { period };
  if (q) filters.q = q;
  if (page && page > 1) filters.page = page;
  return filters;
}

export function useLeaderboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { data, pagination, meEntry, isLoading, isLoadingMore, error } = useSelector(
    (state: RootState) => state.leaderboard
  );
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState<string | undefined>(undefined);

  useEffect(() => {
    const trimmed = searchInput.trim();
    const handle = setTimeout(() => setQ(trimmed || undefined), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    dispatch(fetchLeaderboard(buildFilters(period, q)));
  }, [dispatch, period, q]);

  useEffect(() => {
    dispatch(fetchLeaderboardMe(period));
  }, [dispatch, period]);

  const withImageBase = useCallback(
    (entry: LeaderboardEntry) => `${API.BASE_URL}${entry.image_url}`,
    []
  );

  const isMine = useCallback(
    (entry: LeaderboardEntry) => entry.uploader.id === currentUserId,
    [currentUserId]
  );

  // The podium only makes sense on the unfiltered board: search results keep
  // their true ranks, so rows 1–3 usually aren't in a filtered result at all.
  const showPodium = !q;
  const podium = useMemo(() => (showPodium ? data.slice(0, 3) : []), [showPodium, data]);
  const boardRows = useMemo(() => (showPodium ? data.slice(3) : data), [showPodium, data]);

  const hasMore = pagination !== null && pagination.page < pagination.total_pages;

  const loadMore = useCallback(() => {
    if (!pagination || isLoadingMore) return;
    dispatch(loadMoreLeaderboard(buildFilters(period, q, pagination.page + 1)));
  }, [dispatch, pagination, isLoadingMore, period, q]);

  return {
    period,
    setPeriod,
    searchInput,
    setSearchInput,
    q,
    showPodium,
    podium,
    boardRows,
    meEntry,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    isMine,
    withImageBase,
  };
}
