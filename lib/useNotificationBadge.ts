import { useEffect, useState } from 'react';

import { normalizeNotificationSettings, shouldIncludeNotification } from './notificationFilters';

type NotificationSummaryItem = {
  readAt?: string;
  channels?: string[];
  category?: string;
};

type NotificationsResponse = {
  notifications?: NotificationSummaryItem[];
  settings?: {
    receiveSite?: boolean;
    receiveMarketing?: boolean;
    receiveBroadcast?: boolean;
  };
};

const countUnreadNotifications = (items: NotificationSummaryItem[]): number =>
  items.filter((item) => !item.readAt).length;

const fetchUnreadCount = async (): Promise<number> => {
  const response = await fetch('/api/notifications?limit=50', { credentials: 'include' });
  if (!response.ok) return 0;

  const data = (await response.json()) as NotificationsResponse;
  const settings = normalizeNotificationSettings(data.settings);
  if (!settings.receiveSite) return 0;

  const notifications = Array.isArray(data.notifications) ? data.notifications : [];
  const visibleNotifications = notifications.filter(
    (item) =>
      item.channels?.includes('site') && shouldIncludeNotification(item.category, data.settings)
  );
  return countUnreadNotifications(visibleNotifications);
};

export default function useNotificationBadge(enabled: boolean): number {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    if (!enabled) {
      setUnreadCount(0);
      return () => {
        active = false;
      };
    }

    const load = async () => {
      try {
        const count = await fetchUnreadCount();
        if (!active) return;
        setUnreadCount(count);
      } catch (error) {
        if (!active) return;
        console.error('Failed to load notification count', error);
        setUnreadCount(0);
      }
    };

    const handleRefresh = () => {
      void load();
    };

    void load();
    window.addEventListener('notifications:refresh', handleRefresh);

    return () => {
      active = false;
      window.removeEventListener('notifications:refresh', handleRefresh);
    };
  }, [enabled]);

  return unreadCount;
}
