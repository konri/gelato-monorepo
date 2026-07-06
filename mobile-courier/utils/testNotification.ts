import * as Notifications from 'expo-notifications';

/**
 * Funkcja do testowania notyfikacji lokalnie (bez backendu)
 * Użyj w konsoli deweloperskiej lub dodaj przycisk w UI
 */
export const sendTestNotification = async (title: string, body: string) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // null = natychmiast
    });
    console.log('✅ Test notification sent');
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
  }
};

/**
 * Symulacja notyfikacji o dodaniu punktów
 */
export const testPointsNotification = () => {
  return sendTestNotification(
    'Punkty dodane! 🎉',
    'Otrzymałeś 100 punktów. Sprawdź swoje konto!'
  );
};
