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
  // When set, the next comment is a reply to this comment.
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  // Group flat comments into top-level + their replies (single level).
  const topLevel = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce<Record<string, typeof comments>>((acc, c) => {
    if (c.parentId) (acc[c.parentId] ??= []).push(c);
    return acc;
  }, {});

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
    const parentId = replyTo?.id ?? null;
    setReplyTo(null);
    await post(text, parentId);
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
          topLevel.map((comment) => (
            <View key={comment.id} className="mb-4">
              <CommentRow
                comment={comment}
                timeAgo={timeAgo}
                onReply={() => setReplyTo({ id: comment.id, name: comment.userName ?? t('Home.user') })}
                replyLabel={t('Home.reply')}
                userFallback={t('Home.user')}
              />
              {/* Nested replies */}
              {(repliesByParent[comment.id] ?? []).map((reply) => (
                <View key={reply.id} className="ml-11 mt-3">
                  <CommentRow
                    comment={reply}
                    timeAgo={timeAgo}
                    userFallback={t('Home.user')}
                  />
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Reply context banner */}
      {replyTo && (
        <View className="flex-row items-center justify-between bg-gray-50 border-t border-gray-200 px-4 py-2">
          <Typography variant="body-small-regular" className="text-gray-600">
            {t('Home.replyingTo', { name: replyTo.name })}
          </Typography>
          <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
            <Ionicons name="close" size={18} color="#6B7280" />
          </Pressable>
        </View>
      )}

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

type CommentRowComment = {
  id: string;
  content: string;
  userName?: string | null;
  userAvatar?: string | null;
  isSpotReply?: boolean;
  createdAt: string;
};

function CommentRow({
  comment,
  timeAgo,
  onReply,
  replyLabel,
  userFallback,
}: {
  comment: CommentRowComment;
  timeAgo: (iso: string) => string;
  onReply?: () => void;
  replyLabel?: string;
  userFallback: string;
}) {
  const { t } = useTranslation();
  const spotBadgeLabel = t('Home.spotBadge');
  return (
    <View className="flex-row">
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
        <View
          className={`rounded-2xl px-3 py-2 ${comment.isSpotReply ? 'bg-red-50' : 'bg-gray-50'}`}
        >
          <View className="flex-row items-center mb-0.5">
            <Typography variant="body-small-semibold" className="text-gray-900">
              {comment.userName ?? userFallback}
            </Typography>
            {comment.isSpotReply && (
              <View className="ml-2 flex-row items-center rounded-full bg-red-600 px-2 py-0.5">
                <Ionicons name="storefront" size={10} color="#fff" />
                <Typography variant="body-small-semibold" className="ml-1 text-white" style={{ fontSize: 10 }}>
                  {spotBadgeLabel}
                </Typography>
              </View>
            )}
          </View>
          <Typography variant="body-base-regular" className="text-gray-800">
            {comment.content}
          </Typography>
        </View>
        <View className="flex-row items-center mt-1 ml-3">
          <Typography variant="body-small-regular" className="text-gray-500">
            {timeAgo(comment.createdAt)}
          </Typography>
          {onReply && (
            <Pressable onPress={onReply} hitSlop={8} className="ml-4">
              <Typography variant="body-small-semibold" className="text-gray-600">
                {replyLabel}
              </Typography>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
