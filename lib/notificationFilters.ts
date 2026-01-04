import type { NotificationSettings } from './userNotifications';

const MARKETING_CATEGORIES = new Set(['メルマガ', 'クーポン']);
const BROADCAST_CATEGORIES = new Set(['全体通知']);

export const isMarketingCategory = (category?: string): boolean =>
  Boolean(category && MARKETING_CATEGORIES.has(category));

export const isBroadcastCategory = (category?: string): boolean =>
  Boolean(category && BROADCAST_CATEGORIES.has(category));

export const normalizeNotificationSettings = (
  settings?: Partial<NotificationSettings> | null
): Required<
  Pick<NotificationSettings, 'receiveEmail' | 'receiveSite' | 'receiveMarketing' | 'receiveBroadcast'>
> => ({
  receiveEmail: settings?.receiveEmail ?? true,
  receiveSite: settings?.receiveSite ?? true,
  receiveMarketing: settings?.receiveMarketing ?? false,
  receiveBroadcast: settings?.receiveBroadcast ?? true,
});

export const shouldIncludeNotification = (
  category: string | undefined,
  settings?: Partial<NotificationSettings> | null
): boolean => {
  const normalized = normalizeNotificationSettings(settings);
  if (!normalized.receiveMarketing && isMarketingCategory(category)) {
    return false;
  }
  if (!normalized.receiveBroadcast && isBroadcastCategory(category)) {
    return false;
  }
  return true;
};
