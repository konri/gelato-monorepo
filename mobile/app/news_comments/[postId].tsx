import { Image } from '@/components/atoms/Image';
import { Typography } from '@/components/atoms/Typography';
import { useNewsComments } from '@/hooks/useNews';
import { useWhoAmI } from '@/hooks/useWhoAmI';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewsCommentsScreen() {
  const { t } = useTranslation();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const insets = useSafeAreaInsets();
  const { comments, loading, posting, post } = useNewsComments(postId ?? null);
  const { data: me } = useWhoAmI();
  const [commentText, setCommentText] = useState('');

  const timeAgo = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('Home.justNow');
    if (mins < 60) return t('Home.minsAgo', { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('Home.hoursAgo', { count: hrs });
    return t('Home.daysAgo', { count: Math.floor(hrs / 24) });
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    setCommentText('');
    await post(text);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View
        className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable onPress={() => router.back()} className="mr-3" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </Pressable>
        <Typography variant="body-lg-bold" className="text-gray-900 flex-1">
          {t('Home.comments')}
        </Typography>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 20 }}>
        {loading ? (
          <View className="py-10 items-center">
            <ActivityIndicator color="#EC2828" />
          </View>
        ) : comments.length === 0 ? (
          <View className="py-10 items-center">
            <Typography variant="body-base-regular" className="text-gray-500">
              {t('Home.beFirstComment')}
            </Typography>
          </View>
        ) : (
          comments.map((comment) => (
            <View key={comment.id} className="mb-4 flex-row">
              <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-3 overflow-hidden">
                {comment.userAvatar ? (
                  <Image
                    url={comment.userAvatar}
                    className="w-full h-full"
                    resizeMode="cover"
                    rounded
                    fallbackWidth={32}
                    fallbackHeight={32}
                    fallbackLogoSize={12}
                  />
                ) : (
                  <Ionicons name="person" size={16} color="#6B7280" />
                )}
              </View>
              <View className="flex-1">
                <View className="bg-gray-50 rounded-2xl px-3 py-2">
                  <Typography variant="body-small-semibold" className="text-gray-900 mb-0.5">
                    {comment.userName ?? t('Home.user')}
                  </Typography>
                  <Typography variant="body-base-regular" className="text-gray-800">
                    {comment.content}
                  </Typography>
                </View>
                <Typography variant="body-small-regular" className="text-gray-500 mt-1 ml-3">
                  {timeAgo(comment.createdAt)}
                </Typography>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Comment Input */}
      <View
        className="bg-white border-t border-gray-200 px-4 py-3 flex-row items-center"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-3 overflow-hidden">
          {me?.profilePicture ? (
            <Image
              url={me.profilePicture}
              className="w-full h-full"
              resizeMode="cover"
              rounded
              fallbackWidth={32}
              fallbackHeight={32}
              fallbackLogoSize={12}
            />
          ) : (
            <Ionicons name="person" size={16} color="#6B7280" />
          )}
        </View>
        <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-3">
          <TextInput
            placeholder={t('Home.addComment')}
            value={commentText}
            onChangeText={setCommentText}
            className="text-base font-urbanist text-gray-900"
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
        </View>
        <Pressable onPress={handleAddComment} disabled={!commentText.trim() || posting} hitSlop={8}>
          {posting ? (
            <ActivityIndicator size="small" color="#EC2828" />
          ) : (
            <Ionicons name="send" size={24} color={commentText.trim() ? '#EC2828' : '#D1D5DB'} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
