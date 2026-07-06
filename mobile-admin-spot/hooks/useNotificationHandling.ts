import { logger } from "@/utils/logger";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

type NotificationData = {
  screen?: string;
  [key: string]: unknown;
};

const handleNotificationNavigation = (data: NotificationData) => {
  if (data.screen) {
    try {
      router.push(data.screen as any);
    } catch (error) {
      logger.error("Failed to navigate from notification:", error);
    }
  }
};

export const useNotificationHandling = () => {
  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        logger.log("Notification received:", notification);
      }
    );

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as NotificationData;
        logger.log("Notification tapped:", response);
        handleNotificationNavigation(data);
      });

    const checkInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        const data = response.notification.request.content.data as NotificationData;
        logger.log("App opened from notification:", response);
        handleNotificationNavigation(data);
      }
    };

    checkInitialNotification();

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);
};
