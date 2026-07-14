import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { LeaderboardRow } from "@ntrs/meme";
import type { AppDispatch, RootState } from "@/store";
import { fetchLeaderboard } from "@/store/slices/leaderboard.slice";
import { API } from "@/resources/constants";

export function useLeaderboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { data, isLoading, error } = useSelector((state: RootState) => state.leaderboard);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  useEffect(() => {
    dispatch(fetchLeaderboard(undefined));
  }, [dispatch]);

  const rows: LeaderboardRow[] = useMemo(
    () =>
      data.map((entry) => ({
        rank: entry.rank,
        id: entry.id,
        title: entry.title,
        imageUrl: `${API.BASE_URL}${entry.image_url}`,
        rating: entry.rating,
        wins: entry.wins,
        losses: entry.losses,
        uploader: entry.uploader.display_name,
      })),
    [data]
  );

  const highlightIds = useMemo(
    () => data.filter((entry) => entry.uploader.id === currentUserId).map((entry) => entry.id),
    [data, currentUserId]
  );

  return { rows, isLoading, error, highlightIds };
}
