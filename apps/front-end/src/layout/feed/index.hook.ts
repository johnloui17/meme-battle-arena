import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { Meme, MemeSort } from "@meme-battle-arena/contracts";
import type { AppDispatch, RootState } from "@/store";
import { fetchMemes, loadMoreMemes, setFilters, toggleReaction } from "@/store/slices/memes.slice";
import { API } from "@/resources/constants";

export function useFeed() {
  const dispatch = useDispatch<AppDispatch>();
  const { data, pagination, isLoading, isLoadingMore, error, filters } = useSelector(
    (state: RootState) => state.memes.list
  );

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    dispatch(setFilters({ uploaderMe: false }));
    dispatch(fetchMemes());
  }, [dispatch]);

  const setSort = useCallback(
    (sort: MemeSort) => {
      dispatch(setFilters({ sort }));
      dispatch(fetchMemes());
    },
    [dispatch]
  );

  const hasMore = pagination !== null && pagination.page < pagination.total_pages;

  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    dispatch(loadMoreMemes());
  }, [dispatch, isLoadingMore]);

  const withImageBase = useCallback((meme: Meme) => `${API.BASE_URL}${meme.image_url}`, []);

  const react = useCallback(
    (meme: Meme) => {
      dispatch(toggleReaction({ memeId: meme.id, reacted: meme.reacted_by_me }));
    },
    [dispatch]
  );

  const openMeme = useCallback((index: number) => setOpenIndex(index), []);
  const closeMeme = useCallback(() => setOpenIndex(null), []);
  const nextMeme = useCallback(() => {
    setOpenIndex((i) => (i === null || data.length === 0 ? i : (i + 1) % data.length));
  }, [data.length]);
  const prevMeme = useCallback(() => {
    setOpenIndex((i) => (i === null || data.length === 0 ? i : (i - 1 + data.length) % data.length));
  }, [data.length]);

  return {
    memes: data,
    isLoading,
    isLoadingMore,
    error,
    sort: filters.sort,
    setSort,
    hasMore,
    loadMore,
    withImageBase,
    react,
    openIndex,
    openMeme,
    closeMeme,
    nextMeme,
    prevMeme,
  };
}
