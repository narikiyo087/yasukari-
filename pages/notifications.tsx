import { useEffect, useMemo, useState } from 'react';

import Head from 'next/head';
import Link from 'next/link';
import { FaBell, FaToggleOff, FaToggleOn } from 'react-icons/fa';

import styles from '../styles/Notifications.module.css';

type NotificationChannel = 'email' | 'site';

type NotificationSettings = {
  receiveEmail: boolean;
  receiveSite: boolean;
  updatedAt: string;
};

type NotificationItem = {
  notificationId: string;
  subject: string;
  body: string;
  createdAt: string;
  category?: string;
  channels: NotificationChannel[];
  readAt?: string;
};

type NotificationsResponse = {
  notifications: NotificationItem[];
  settings: NotificationSettings;
};

const AUTH_REQUIRED_MESSAGE = '通知を受け取るには、ログインを完了してください。';

const formatTimestamp = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
};

const uniqueChannels = (channels: NotificationChannel[]): NotificationChannel[] =>
  Array.from(new Set(channels));

const describeChannels = (channels: NotificationChannel[]): string => {
  const unique = uniqueChannels(channels);
  if (unique.length > 1) return 'メール・サイト';
  return unique[0] === 'email' ? 'メール' : 'サイト';
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [activeNotificationId, setActiveNotificationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      setAuthRequired(false);

      try {
        const response = await fetch('/api/notifications');
        if (response.status === 401) {
          setAuthRequired(true);
          setError(AUTH_REQUIRED_MESSAGE);
          return;
        }

        const data = (await response.json()) as NotificationsResponse;
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setSettings(data.settings ?? null);
      } catch (fetchError) {
        console.error('Failed to load notifications', fetchError);
        setError('通知の取得に失敗しました。時間をおいて再度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    void fetchNotifications();
  }, []);

  const toggleSetting = async (key: keyof NotificationSettings) => {
    if (!settings) return;
    const previous = settings;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setSavingSettings(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiveEmail: next.receiveEmail,
          receiveSite: next.receiveSite,
        }),
      });

      if (response.status === 401) {
        setAuthRequired(true);
        setError(AUTH_REQUIRED_MESSAGE);
        setSettings(previous);
        return;
      }

      const data = (await response.json()) as { settings?: NotificationSettings };
      setSettings(data.settings ?? next);
    } catch (updateError) {
      console.error('Failed to update notification settings', updateError);
      setSettings(previous);
      setError('通知設定の更新に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setSavingSettings(false);
    }
  };

  const siteNotifications = useMemo(
    () =>
      notifications
        .filter((notice) => notice.channels?.includes('site'))
        .map((notice) => ({ ...notice, channels: uniqueChannels(notice.channels) })),
    [notifications]
  );

  const siteNotificationDisabled = settings?.receiveSite === false;
  const visibleNotifications = siteNotificationDisabled ? [] : siteNotifications;
  const unreadCount = visibleNotifications.filter((notice) => !notice.readAt).length;
  const latestCreatedAt = siteNotifications[0]?.createdAt ?? '';
  const mirroredEmails = notifications.filter((notice) => notice.channels.includes('email')).length;
  const activeNotification =
    visibleNotifications.find((notice) => notice.notificationId === activeNotificationId) ??
    visibleNotifications[0] ??
    null;

  useEffect(() => {
    if (!activeNotification && visibleNotifications.length) {
      setActiveNotificationId(visibleNotifications[0].notificationId);
    }
  }, [activeNotification, visibleNotifications]);

  const notifyBadgeRefresh = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event('notifications:refresh'));
  };

  const handleSelectNotification = async (notice: NotificationItem) => {
    setActiveNotificationId(notice.notificationId);
    if (notice.readAt) return;

    const optimisticReadAt = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((item) =>
        item.notificationId === notice.notificationId ? { ...item, readAt: optimisticReadAt } : item
      )
    );
    notifyBadgeRefresh();

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId: notice.notificationId,
          createdAt: notice.createdAt,
        }),
      });

      if (response.status === 401) {
        setAuthRequired(true);
        setError(AUTH_REQUIRED_MESSAGE);
        setNotifications((prev) =>
          prev.map((item) =>
            item.notificationId === notice.notificationId ? { ...item, readAt: undefined } : item
          )
        );
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      const data = (await response.json()) as { readAt?: string };
      setNotifications((prev) =>
        prev.map((item) =>
          item.notificationId === notice.notificationId
            ? { ...item, readAt: data.readAt ?? optimisticReadAt }
            : item
        )
      );
      notifyBadgeRefresh();
    } catch (updateError) {
      console.error('Failed to mark notification read', updateError);
      setNotifications((prev) =>
        prev.map((item) =>
          item.notificationId === notice.notificationId ? { ...item, readAt: undefined } : item
        )
      );
      setError('通知の既読処理に失敗しました。時間をおいて再度お試しください。');
    }
  };

  return (
    <>
      <Head>
        <title>通知 | レンタル予約</title>
      </Head>

      <section className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerIcon} aria-hidden="true">
            <FaBell />
          </div>
          <div>
            <p className={styles.eyebrow}>Notifications</p>
            <h1 className={styles.title}>通知</h1>
          </div>
        </header>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>未読</p>
            <p className={styles.summaryValue}>{unreadCount}件</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>通知件数</p>
            <p className={styles.summaryValue}>{siteNotifications.length}件</p>
            <p className={styles.summaryNote}>直近: {latestCreatedAt ? formatTimestamp(latestCreatedAt) : '—'}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>メール連携</p>
            <p className={styles.summaryValue}>{mirroredEmails}件</p>
            <p className={styles.summaryNote}>メール送信分も履歴に保存します。</p>
          </div>
        </div>

        <div className={styles.settingsGrid}>
          <div className={styles.settingsCard}>
            <div className={styles.settingsHeader}>
              <div>
                <p className={styles.settingsLabel}>受信設定</p>
                <h2 className={styles.settingsTitle}>メールとサイト通知の受信先</h2>
                <p className={styles.settingsNote}>
                  メールで送信した内容をそのまま通知欄に表示します。必要に応じてサイト通知の配信をオン・オフできます。
                </p>
              </div>
              <span className={styles.statusPill}>{savingSettings ? '保存中…' : '最新状態'}</span>
            </div>

            <div className={styles.toggleList}>
              <button
                type="button"
                onClick={() => toggleSetting('receiveSite')}
                className={styles.toggleRow}
                disabled={!settings || savingSettings}
                aria-pressed={settings?.receiveSite ?? false}
              >
                <div>
                  <p className={styles.toggleLabel}>サイト全体の通知</p>
                  <p className={styles.toggleDescription}>ログイン中に通知ページへ同じ内容を表示します。</p>
                </div>
                <span className={styles.toggleIcon} aria-hidden="true">
                  {settings?.receiveSite ? <FaToggleOn /> : <FaToggleOff />}
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleSetting('receiveEmail')}
                className={styles.toggleRow}
                disabled={!settings || savingSettings}
                aria-pressed={settings?.receiveEmail ?? false}
              >
                <div>
                  <p className={styles.toggleLabel}>メール通知</p>
                  <p className={styles.toggleDescription}>メール送信と同時に履歴へ保存します。</p>
                </div>
                <span className={styles.toggleIcon} aria-hidden="true">
                  {settings?.receiveEmail ? <FaToggleOn /> : <FaToggleOff />}
                </span>
              </button>
            </div>
          </div>
        </div>

        {error ? <div className={styles.alert}>{error}</div> : null}

        {authRequired ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>{AUTH_REQUIRED_MESSAGE}</p>
            <p className={styles.emptyDescription}>ログイン後に、メールと同じ内容の通知をまとめて確認できます。</p>
            <Link href="/login" className={styles.actionLink}>
              ログインする
            </Link>
          </div>
        ) : loading ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>通知を読み込み中です…</p>
            <p className={styles.emptyDescription}>最新の履歴を取得しています。</p>
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>
              {siteNotificationDisabled ? 'サイト通知がオフになっています' : 'まだ通知はありません'}
            </p>
            <p className={styles.emptyDescription}>
              {siteNotificationDisabled
                ? 'サイト全体での通知を再開すると、メールと同じ内容をここで確認できます。'
                : '予約やお知らせを受信すると、ここに表示されます。'}
            </p>
            {siteNotificationDisabled ? (
              <button
                type="button"
                className={styles.actionLink}
                onClick={() => toggleSetting('receiveSite')}
                disabled={savingSettings}
              >
                サイト通知をオンにする
              </button>
            ) : null}
          </div>
        ) : (
          <div className={styles.threadLayout}>
            <div className={styles.threadList} role="tablist" aria-label="通知一覧">
              {visibleNotifications.map((notice) => {
                const isActive = notice.notificationId === activeNotification?.notificationId;
                return (
                  <button
                    key={notice.notificationId}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`${styles.threadItem} ${isActive ? styles.threadItemActive : ''} ${
                      notice.readAt ? '' : styles.threadItemUnread
                    }`}
                    onClick={() => void handleSelectNotification(notice)}
                  >
                    <div className={styles.threadItemHeader}>
                      <p className={styles.threadItemTitle}>{notice.subject}</p>
                      <span className={styles.threadItemStatus}>
                        {notice.readAt ? (
                          '既読'
                        ) : (
                          <>
                            <span className={styles.unreadDot} aria-hidden="true" />
                            未読
                          </>
                        )}
                      </span>
                    </div>
                    <p className={styles.threadItemMeta}>{formatTimestamp(notice.createdAt)}</p>
                  </button>
                );
              })}
            </div>
            <div className={styles.threadDetail} role="tabpanel">
              {activeNotification ? (
                <>
                  <div className={styles.detailHeader}>
                    <div>
                      <p className={styles.detailEyebrow}>{activeNotification.category ?? 'お知らせ'}</p>
                      <h2 className={styles.detailTitle}>{activeNotification.subject}</h2>
                    </div>
                    <span className={styles.detailStatus}>
                      {activeNotification.readAt ? '既読' : '未読'}
                    </span>
                  </div>
                  <div className={styles.detailMeta}>
                    <span className={styles.detailTime}>{formatTimestamp(activeNotification.createdAt)}</span>
                    <span className={styles.channelBadge}>{describeChannels(activeNotification.channels)}</span>
                  </div>
                  <div className={styles.detailBody}>{activeNotification.body}</div>
                </>
              ) : (
                <div className={styles.detailEmpty}>
                  <p className={styles.emptyTitle}>通知を選択してください</p>
                  <p className={styles.emptyDescription}>一覧から通知を選ぶと詳細が表示されます。</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
