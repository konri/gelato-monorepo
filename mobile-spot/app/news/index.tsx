import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { config } from '@/config';
import { useRole } from '@/hooks/useRole';
import {
  getSpotNews,
  createSpotNews,
  type SpotNewsItem,
} from '@repo/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { goBackOr } from '@/utils/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Uploads one image to a news post; appends to its images[]. Throws the
// server error message so the screen can surface it.
async function uploadNewsImage(newsId: string, uri: string) {
  const token = (await AsyncStorage.getItem('access_token')) ?? '';
  const form = new FormData();
  const filename = uri.split('/').pop() || 'image.jpg';
  if (uri.startsWith('data:') || uri.startsWith('blob:')) {
    const blob = await (await fetch(uri)).blob();
    form.append('image', blob, filename);
  } else {
    form.append('image', { uri, name: filename, type: 'image/jpeg' } as any);
  }
  const res = await fetch(`${config.REST_API_URL}/upload/news/${newsId}`, {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Upload failed (${res.status})`);
  }
}

export default function NewsComposerScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { spotId, isAdmin, loading: roleLoading } = useRole();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pickedImages, setPickedImages] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [posts, setPosts] = useState<SpotNewsItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const loadPosts = useCallback(async () => {
    if (!spotId) {
      setLoadingPosts(false);
      return;
    }
    const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
    const res = await getSpotNews(spotId, { token });
    setPosts(res.data ?? []);
    setLoadingPosts(false);
  }, [spotId]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setPickedImages((imgs) => [...imgs, res.assets[0].uri]);
    }
  };

  const publish = async () => {
    if (!spotId || !title.trim() || !description.trim()) return;
    setPosting(true);
    setError(null);
    setNotice(null);
    try {
      const token = (await AsyncStorage.getItem('access_token')) ?? undefined;
      const res = await createSpotNews(
        { spotId, title: title.trim(), description: description.trim() },
        { token },
      );
      if (res.error || !res.data) {
        throw new Error(res.error?.message || t('News.publishError'));
      }
      const newsId = res.data.id;
      // Upload each picked image to the new post.
      for (const uri of pickedImages) {
        await uploadNewsImage(newsId, uri);
      }
      setTitle('');
      setDescription('');
      setPickedImages([]);
      setNotice(t('News.published'));
      await loadPosts();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('News.publishError'));
    } finally {
      setPosting(false);
    }
  };

  if (!roleLoading && !isAdmin) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8" style={{ paddingTop: insets.top }}>
        <Ionicons name="lock-closed-outline" size={40} color="#9CA3AF" />
        <Typography variant="body-base-regular" className="mt-3 text-center text-gray-500">
          {t('News.adminOnly')}
        </Typography>
        <Pressable onPress={() => goBackOr()} className="mt-5 rounded-xl px-6 py-3" style={{ backgroundColor: '#EC2828' }}>
          <Typography variant="body-base-bold" className="text-white">
            {t('News.back')}
          </Typography>
        </Pressable>
      </View>
    );
  }

  const canPublish = !!title.trim() && !!description.trim() && !posting;

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title={t('News.title')} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <ResponsiveContainer maxWidth={640}>
          {notice && (
            <View className="mb-4 rounded-xl bg-green-50 px-4 py-3">
              <Typography variant="body-small-regular" style={{ color: '#15803D' }}>{notice}</Typography>
            </View>
          )}
          {error && (
            <View className="mb-4 rounded-xl bg-red-50 px-4 py-3">
              <Typography variant="body-small-regular" style={{ color: '#B91C1C' }}>{error}</Typography>
            </View>
          )}

          {/* Composer */}
          <View className="rounded-2xl bg-white p-4">
            <Typography variant="body-base-bold" className="mb-3 text-text-primary">
              {t('News.newPost')}
            </Typography>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('News.titlePlaceholder')}
              className="mb-3 rounded-xl border border-gray-300 px-4 py-3 text-base"
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t('News.bodyPlaceholder')}
              multiline
              className="rounded-xl border border-gray-300 px-4 py-3 text-base"
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />

            {/* Picked photos */}
            <View className="mt-3 flex-row flex-wrap gap-2">
              {pickedImages.map((uri, i) => (
                <View key={`${uri}-${i}`} className="relative">
                  <Image source={{ uri }} style={{ width: 76, height: 76, borderRadius: 10 }} />
                  <Pressable
                    onPress={() => setPickedImages((imgs) => imgs.filter((_, idx) => idx !== i))}
                    hitSlop={6}
                    className="absolute -right-1.5 -top-1.5 h-6 w-6 items-center justify-center rounded-full"
                    style={{ backgroundColor: '#EC2828' }}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
              <Pressable
                onPress={pickImage}
                className="h-[76px] w-[76px] items-center justify-center rounded-xl border border-dashed border-gray-300"
              >
                <Ionicons name="camera-outline" size={22} color="#6B7280" />
                <Typography variant="body-very-small-medium" className="text-gray-500">
                  {t('News.addPhoto')}
                </Typography>
              </Pressable>
            </View>

            <Pressable
              onPress={publish}
              disabled={!canPublish}
              className="mt-4 items-center rounded-xl py-4"
              style={{ backgroundColor: canPublish ? '#EC2828' : '#F4A3A3' }}
            >
              {posting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Typography variant="body-base-bold" className="text-white">
                  {t('News.publish')}
                </Typography>
              )}
            </Pressable>
          </View>

          {/* Existing posts */}
          <Typography variant="body-base-bold" className="mb-2 mt-6 text-text-primary">
            {t('News.yourPosts')}
          </Typography>
          {loadingPosts ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#EC2828" />
            </View>
          ) : posts.length === 0 ? (
            <Typography variant="body-small-regular" className="text-gray-500">
              {t('News.noPosts')}
            </Typography>
          ) : (
            posts.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/news_comments/${p.id}` as any)}
                className="mb-3 rounded-2xl bg-white p-4"
              >
                <Typography variant="body-base-semibold" className="text-text-primary">
                  {p.title}
                </Typography>
                <Typography variant="body-small-regular" className="mt-1 text-gray-600" numberOfLines={2}>
                  {p.description}
                </Typography>
                <View className="mt-2 flex-row items-center gap-4">
                  <View className="flex-row items-center">
                    <Ionicons name="heart-outline" size={15} color="#6B7280" />
                    <Typography variant="body-very-small-medium" className="ml-1 text-gray-500">
                      {String(p.likesCount)}
                    </Typography>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="chatbubble-outline" size={15} color="#6B7280" />
                    <Typography variant="body-very-small-medium" className="ml-1 text-gray-500">
                      {t('News.repliesCount', { count: p.commentsCount })}
                    </Typography>
                  </View>
                  <Typography variant="body-very-small-medium" className="text-primary">
                    {t('News.viewReplies')}
                  </Typography>
                </View>
              </Pressable>
            ))
          )}
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}
