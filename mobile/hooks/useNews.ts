import {
  City,
  NewsComment,
  NewsItem,
  commentNews,
  getNewsComments,
  getNewsFeed,
  likeNews,
} from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCities } from './useTastes';

// Match a stored city display name against a City's name/localized names.
const matchesCity = (city: City, selected: string) => {
  const local = typeof city.nameLocal === 'object' && city.nameLocal ? city.nameLocal : {};
  return [city.name, (local as any).pl, (local as any).en, (local as any).ua]
    .filter(Boolean)
    .some((n: string) => n.toLowerCase() === selected.toLowerCase());
};

/**
 * News feed for the currently-selected city (spot-authored + global news),
 * with optimistic like toggling.
 */
export const useNewsFeed = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);

  const { data: cities } = useCities();
  const cityId = useMemo(() => {
    if (!cities || !selectedCityName) return null;
    return cities.find((c) => matchesCity(c, selectedCityName))?.id ?? null;
  }, [cities, selectedCityName]);

  // Re-read the selected city each time the screen regains focus, so changing
  // the city (e.g. in Settings) refreshes the feed when you return.
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('selectedCity').then(setSelectedCityName);
    }, []),
  );

  const load = useCallback(async () => {
    const token = await safeGetItem('access_token');
    // cityId null = show all/global news until a city is chosen.
    const res = await getNewsFeed(cityId, { token: token ?? undefined });
    if (res.success && res.data) setNews(res.data);
    setLoading(false);
  }, [cityId]);

  useEffect(() => {
    load();
  }, [load]);

  // Optimistic like/unlike; reconciles with the server's boolean result.
  const toggleLike = useCallback(async (id: string) => {
    setNews((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, isLiked: !n.isLiked, likesCount: n.likesCount + (n.isLiked ? -1 : 1) }
          : n,
      ),
    );
    const token = await safeGetItem('access_token');
    const res = await likeNews(id, { token: token ?? undefined });
    if (res.success && typeof res.data === 'boolean') {
      setNews((prev) =>
        prev.map((n) =>
          n.id === id && n.isLiked !== res.data
            ? { ...n, isLiked: res.data as boolean, likesCount: n.likesCount + (res.data ? 1 : -1) }
            : n,
        ),
      );
    }
  }, []);

  return { news, loading, refetch: load, toggleLike };
};

/**
 * Comments for a single news item, with posting.
 */
export const useNewsComments = (newsId: string | null) => {
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (!newsId) return;
    const token = await safeGetItem('access_token');
    const res = await getNewsComments(newsId, { token: token ?? undefined });
    if (res.success && res.data) setComments(res.data);
    setLoading(false);
  }, [newsId]);

  useEffect(() => {
    load();
  }, [load]);

  const post = useCallback(
    async (content: string, parentId?: string | null) => {
      if (!newsId || !content.trim()) return;
      setPosting(true);
      try {
        const token = await safeGetItem('access_token');
        const res = await commentNews(newsId, content.trim(), {
          token: token ?? undefined,
          parentId: parentId ?? null,
        });
        if (res.success && res.data) setComments((prev) => [...prev, res.data as NewsComment]);
      } finally {
        setPosting(false);
      }
    },
    [newsId],
  );

  return { comments, loading, posting, post, refetch: load };
};
