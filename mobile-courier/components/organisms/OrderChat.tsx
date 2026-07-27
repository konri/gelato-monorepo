import { Image } from '@/components/atoms/Image';
import { Typography } from '@/components/atoms/Typography';
import { getOrderMessages, postOrderMessage, type OrderMessage } from '@repo/api-client';
import { safeGetItem } from '@/shared/api-client/src/utils/safeAsyncStorage';
import { refreshEmitter } from '@/hooks/useRefreshEmitter';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

// Order chat for the courier. Messages the courier posts are attributed to the
// courier server-side. `disabled` hides the input (courier may only message
// while the delivery is active — from pickup until delivered).
export function OrderChat({
  orderId,
  highlightId,
  disabled = false,
}: {
  orderId: string;
  highlightId?: string | null;
  disabled?: boolean;
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
    else setText(body);
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View className="mt-4">
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
        messages.map((m) => {
          // "Mine" = this courier's own outgoing messages (align right).
          const mine = m.senderRole === 'courier';
          return (
            <View key={m.id} className={`mb-3 flex-row ${mine ? 'justify-end' : 'justify-start'}`}>
              {!mine && (
                <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-2 overflow-hidden">
                  {m.senderAvatar ? (
                    <Image url={m.senderAvatar} className="w-full h-full" resizeMode="cover" rounded fallbackWidth={32} fallbackHeight={32} fallbackLogoSize={12} />
                  ) : (
                    <Ionicons name={m.senderRole === 'spot' ? 'storefront' : 'person'} size={16} color="#6B7280" />
                  )}
                </View>
              )}
              <View style={{ maxWidth: '78%' }}>
                <View
                  className={`rounded-2xl px-3 py-2 ${
                    m.id === highlightId
                      ? 'bg-amber-100 border border-amber-300'
                      : mine
                        ? 'bg-red-600'
                        : m.senderRole === 'spot'
                          ? 'bg-red-50'
                          : 'bg-gray-100'
                  }`}
                >
                  {!mine && (
                    <Typography variant="body-small-semibold" className="text-gray-900 mb-0.5">
                      {m.senderRole === 'spot' ? t('OrderChat.roleSpot') : t('OrderChat.roleCustomer')}
                    </Typography>
                  )}
                  <Typography variant="body-base-regular" className={mine && m.id !== highlightId ? 'text-white' : 'text-gray-800'}>
                    {m.body}
                  </Typography>
                </View>
                <Typography variant="body-very-small-medium" className={`text-gray-400 mt-1 ${mine ? 'text-right mr-1' : 'ml-1'}`}>
                  {fmt(m.createdAt)}
                </Typography>
              </View>
            </View>
          );
        })
      )}

      {!disabled && (
        <View className="mt-2 flex-row items-center">
          <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-3">
            <TextInput
              placeholder={t('OrderChat.placeholderStaff')}
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
