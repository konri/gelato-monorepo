import { Typography } from '@/components/atoms/Typography';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { useNewsComments } from '@/hooks/useNews';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SpotNewsCommentsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { comments, loading, posting, post } = useNewsComments(postId ?? null);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const topLevel = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce<Record<string, typeof comments>>((acc, c) => {
    if (c.parentId) (acc[c.parentId] ??= []).push(c);
    return acc;
  }, {});

  const timeAgo = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('News.justNow');
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const submit = async () => {
    const v = text.trim();
    if (!v) return;
    setText('');
    const parentId = replyTo?.id ?? null;
    setReplyTo(null);
    await post(v, parentId);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader title={t('News.replies')} />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 20 }}>
        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#EC2828" />
          </View>
        ) : topLevel.length === 0 ? (
          <View className="items-center py-10">
            <Typography variant="body-base-regular" className="text-gray-500">
              {t('News.noComments')}
            </Typography>
          </View>
        ) : (
          topLevel.map((c) => (
            <View key={c.id} className="mb-4">
              <CommentRow
                comment={c}
                timeAgo={timeAgo}
                onReply={() => setReplyTo({ id: c.id, name: c.userName ?? t('News.user') })}
                replyLabel={t('News.reply')}
                userFallback={t('News.user')}
              />
              {(repliesByParent[c.id] ?? []).map((r) => (
                <View key={r.id} className="ml-11 mt-3">
                  <CommentRow comment={r} timeAgo={timeAgo} userFallback={t('News.user')} />
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {replyTo && (
        <View className="flex-row items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-2">
          <Typography variant="body-small-regular" className="text-gray-600">
            {t('News.replyingTo', { name: replyTo.name })}
          </Typography>
          <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
            <Ionicons name="close" size={18} color="#6B7280" />
          </Pressable>
        </View>
      )}

      <View
        className="flex-row items-center border-t border-gray-200 bg-white px-4 py-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="mr-3 flex-1 rounded-full bg-gray-100 px-4 py-2">
          <TextInput
            placeholder={replyTo ? t('News.writeReply') : t('News.writeComment')}
            value={text}
            onChangeText={setText}
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
            style={{ fontSize: 15 }}
          />
        </View>
        <Pressable onPress={submit} disabled={!text.trim() || posting} hitSlop={8}>
          {posting ? (
            <ActivityIndicator size="small" color="#EC2828" />
          ) : (
            <Ionicons name="send" size={24} color={text.trim() ? '#EC2828' : '#D1D5DB'} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

type RowComment = {
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
  comment: RowComment;
  timeAgo: (iso: string) => string;
  onReply?: () => void;
  replyLabel?: string;
  userFallback: string;
}) {
  const { t } = useTranslation();
  return (
    <View className="flex-row">
      <View className="mr-3 h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200">
        {comment.userAvatar ? (
          <Image source={{ uri: comment.userAvatar }} style={{ width: 32, height: 32 }} />
        ) : (
          <Ionicons name="person" size={16} color="#6B7280" />
        )}
      </View>
      <View className="flex-1">
        <View className={`rounded-2xl px-3 py-2 ${comment.isSpotReply ? 'bg-red-50' : 'bg-gray-50'}`}>
          <View className="mb-0.5 flex-row items-center">
            <Typography variant="body-small-semibold" className="text-text-primary">
              {comment.userName ?? userFallback}
            </Typography>
            {comment.isSpotReply && (
              <View className="ml-2 flex-row items-center rounded-full bg-red-600 px-2 py-0.5">
                <Ionicons name="storefront" size={10} color="#fff" />
                <Typography variant="body-very-small-medium" className="ml-1 text-white">
                  {t('News.spotBadge')}
                </Typography>
              </View>
            )}
          </View>
          <Typography variant="body-base-regular" className="text-gray-800">
            {comment.content}
          </Typography>
        </View>
        <View className="ml-3 mt-1 flex-row items-center">
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
