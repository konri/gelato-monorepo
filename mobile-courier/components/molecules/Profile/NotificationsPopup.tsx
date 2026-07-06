import React from 'react';
import { View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/atoms/Button';
import { HeaderButton } from '@/components/atoms/HeaderButton';
import { NotificationBadge } from '@/components/atoms/NotificationBadge';
import { NotificationItem } from '@/components/atoms/NotificationItem';
import { PopoverModal } from '@/components/atoms/PopoverModal';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  isRead: boolean;
}

interface NotificationsPopupProps {
  visible: boolean;
  onClose: () => void;
  anchorPosition?: { top: number; right: number };
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Account Security Alert',
    description: 'We\'ve noticed some unusual activity on your account. Please review your recent logins and update your password if necessary',
    time: '09:45 AM',
    icon: 'shield-checkmark-outline',
    isRead: false,
  },
  {
    id: '2',
    title: 'System Update Available',
    description: 'A new system update is ready for installation. It includes performance improvements and bug fixes.',
    time: '08:30 AM',
    icon: 'download-outline',
    isRead: false,
  },
  {
    id: '3',
    title: 'Event Reminder',
    description: 'Don\'t forget about the special event tomorrow at 3 PM. We can\'t wait to see you there!',
    time: '08:45 AM',
    icon: 'calendar-outline',
    isRead: true,
  },
];

export const NotificationsPopup = ({ visible, onClose, anchorPosition }: NotificationsPopupProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<'promotions' | 'general'>('promotions');

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.isRead).length;

  return (
    <PopoverModal
      visible={visible}
      onClose={onClose}
      title={t('Notifications.popupTitle')}
      anchorPosition={anchorPosition}
      width={344}
      height={500}
      titleColor="#000000"
      backgroundColor="#FFFFFF"
    >
      <View className="absolute top-6 left-6">
        <HeaderButton iconName="settings-outline" onPress={() => { onClose(); router.push('/settings'); }} />
      </View>

      <View className="flex-row gap-2 mb-4">
        <View className="relative flex-1">
          <Button
            title={t('Notifications.promotions')}
            onPress={() => setActiveTab('promotions')}
            variant="ghost"
            height={34}
            className={activeTab === 'promotions' ? '!border-accent' : '!border-transparent bg-[#D9D9D938]'}
            textColor="#000"
            textVariant="body-base-small"
            leftIcon={<Ionicons name="pricetag" size={16} color="#000" />}
          />
          <NotificationBadge 
            count={unreadCount} 
            position="top-right" 
            show={activeTab === 'promotions'}
          />
        </View>
        <Button
          title={t('Notifications.general')}
          onPress={() => setActiveTab('general')}
          variant="ghost"
          height={34}
          width="50%"
          className={activeTab === 'general' ? '!border-accent' : '!border-transparent bg-[#D9D9D938]'}
          textColor="#000"
          textVariant="body-base-small"
        />
      </View>

      <View className="border-t border-[#D7D7D7] mb-4" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Typography variant="body-small-regular" className="text-gray-400 mb-2">
          {t('Notifications.today')}
        </Typography>
        {MOCK_NOTIFICATIONS.map((notification) => (
          <NotificationItem
            key={notification.id}
            title={notification.title}
            description={notification.description}
            time={notification.time}
            icon={notification.icon}
            isRead={notification.isRead}
          />
        ))}
        
        <View className="border-t border-[#D7D7D7] my-4" />
        
        <Typography variant="body-small-regular" className="text-gray-400 mb-2">
          {t('Notifications.yesterday')}
        </Typography>
        <NotificationItem
          title="Event Reminder"
          description="Don't forget about the special event tomorrow at 3 PM. We can't wait to see you there!"
          time="08:45 AM"
          icon="calendar-outline"
          isRead={true}
        />
      </ScrollView>
    </PopoverModal>
  );
};
