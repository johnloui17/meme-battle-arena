import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { Meme } from "@meme-battle-arena/contracts";
import type { AppDispatch, RootState } from "@/store";
import { fetchMemes, setFilters, deleteMeme } from "@/store/slices/memes.slice";
import { API } from "@/resources/constants";

export interface MyMemeCardData {
  id: string;
  title: string;
  imageUrl: string;
  rating: number;
  record: { wins: number; losses: number };
}

function mapMemeToCard(meme: Meme): MyMemeCardData {
  return {
    id: meme.id,
    title: meme.title,
    imageUrl: `${API.BASE_URL}${meme.image_url}`,
    rating: meme.rating,
    record: { wins: meme.wins, losses: meme.losses },
  };
}

export function useMyMemes() {
  const dispatch = useDispatch<AppDispatch>();
  const { data, isLoading, error } = useSelector((state: RootState) => state.memes.list);

  useEffect(() => {
    dispatch(setFilters({ uploaderMe: true }));
    dispatch(fetchMemes());
  }, [dispatch]);

  const memes = data.map(mapMemeToCard);

  const handleDelete = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this meme?")) return;
    dispatch(deleteMeme(id));
  };

  return { memes, isLoading, error, handleDelete };
}
