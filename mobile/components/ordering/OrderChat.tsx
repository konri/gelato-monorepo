import { Image } from '@/components/atoms/Image';
import { Typography } from '@/components/atoms/Typography';
import { getOrderMessages, postOrderMessage, type OrderMessage } from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { refreshEmitter } from '@/hooks/useRefreshEmitter';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

// Chat thread on an order (client ↔ spot ↔ courier). Self-contained: loads +
// polls its own messages, renders a flat timeline, and posts. `highlightId`
// tints a message (used when deep-linked from a notification). `onMeasureY`
// reports the section's y-offset so the parent ScrollView can scroll to it.
export function OrderChat({
  orderId,
  highlightId,
  onMeasureY,
  readOnly = false,
}: {
  orderId: string;
  highlightId?: string | null;
  onMeasureY?: (y: number) => void;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const token = (await safeGetItem('access_token')) ?? undefined;
    const res = await getOrderMessages(orderId, { token });
    if (res.data) setMessages(res.data);
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Refresh on a foreground push, and poll every 15s while mounted.
  useEffect(() => {
    const unsub = refreshEmitter.subscribe(() => void load());
    const iv = setInterval(() => void load(), 15000);
    return () => {
      unsub();
      clearInterval(iv);
    };
  }, [load]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    setPosting(true);
    const token = (await safeGetItem('access_token')) ?? undefined;
    const res = await postOrderMessage(orderId, body, { token });
    setPosting(false);
    if (res.data) setMessages((prev) => [...prev, res.data as OrderMessage]);
    else setText(body); // restore on failure
  };

  const timeAgo = (iso: string): string => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return t('Home.justNow');
    if (mins < 60) return t('Home.minsAgo', { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('Home.hoursAgo', { count: hrs });
    return t('Home.daysAgo', { count: Math.floor(hrs / 24) });
  };

  return (
    <View
      className="mt-4"
      onLayout={(e) => onMeasureY?.(e.nativeEvent.layout.y)}
    >
      <Typography variant="body-base-bold" className="text-text-primary mb-3">
        {t('OrderChat.title')}
      </Typography>

      {loading ? (
        <View className="py-6 items-center">
          <ActivityIndicator color="#EC2828" />
        </View>
      ) : messages.length === 0 ? (
        <View className="py-6 items-center">
          <Ionicons name="chatbubbles-outline" size={28} color="#9CA3AF" />
          <Typography variant="body-small-regular" className="mt-2 text-gray-500 text-center">
            {t('OrderChat.empty')}
          </Typography>
        </View>
      ) : (
        messages.map((m) => (
          <MessageRow
            key={m.id}
            message={m}
            timeAgo={timeAgo}
            highlighted={m.id === highlightId}
            roleLabel={
              m.senderRole === 'spot'
                ? t('OrderChat.roleSpot')
                : m.senderRole === 'courier'
                  ? t('OrderChat.roleCourier')
                  : t('OrderChat.roleYou')
            }
          />
        ))
      )}

      {!readOnly && (
        <View className="mt-2 flex-row items-center">
          <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-3">
            <TextInput
              placeholder={t('OrderChat.placeholder')}
              value={text}
              onChangeText={setText}
              className="text-base font-urbanist text-gray-900"
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
            />
          </View>
          <Pressable onPress={send} disabled={!text.trim() || posting} hitSlop={8}>
            {posting ? (
              <ActivityIndicator size="small" color="#EC2828" />
            ) : (
              <Ionicons name="send" size={24} color={text.trim() ? '#EC2828' : '#D1D5DB'} />
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

function MessageRow({
  message,
  timeAgo,
  highlighted,
  roleLabel,
}: {
  message: OrderMessage;
  timeAgo: (iso: string) => string;
  highlighted?: boolean;
  roleLabel: string;
}) {
  const isMine = message.senderRole === 'client';
  const isStaff = message.senderRole === 'spot' || message.senderRole === 'courier';
  return (
    <View className={`mb-3 flex-row ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine && (
        <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-2 overflow-hidden">
          {message.senderAvatar ? (
            <Image
              url={message.senderAvatar}
              className="w-full h-full"
              resizeMode="cover"
              rounded
              fallbackWidth={32}
              fallbackHeight={32}
              fallbackLogoSize={12}
            />
          ) : (
            <Ionicons name={message.senderRole === 'courier' ? 'bicycle' : 'storefront'} size={16} color="#6B7280" />
          )}
        </View>
      )}
      <View style={{ maxWidth: '78%' }}>
        <View
          className={`rounded-2xl px-3 py-2 ${
            highlighted
              ? 'bg-amber-100 border border-amber-300'
              : isMine
                ? 'bg-red-600'
                : isStaff
                  ? 'bg-red-50'
                  : 'bg-gray-50'
          }`}
        >
          {!isMine && (
            <Typography variant="body-small-semibold" className="text-gray-900 mb-0.5">
              {message.senderName ?? roleLabel}
            </Typography>
          )}
          <Typography
            variant="body-base-regular"
            className={isMine && !highlighted ? 'text-white' : 'text-gray-800'}
          >
            {message.body}
          </Typography>
        </View>
        <Typography
          variant="body-small-regular"
          className={`text-gray-500 mt-1 ${isMine ? 'text-right mr-1' : 'ml-1'}`}
        >
          {timeAgo(message.createdAt)}
        </Typography>
      </View>
    </View>
  );
}
