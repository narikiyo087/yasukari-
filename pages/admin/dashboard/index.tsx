import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { HOLIDAY_MANAGER_STORES } from "../../../lib/dashboard/holidayStores";
import type { Member } from "../../../lib/members";
import type { Reservation } from "../../../lib/reservations";
import styles from "../../../styles/Dashboard.module.css";

const ADMIN_DASHBOARD_ROOT = "/admin/dashboard";
const ANALYTICS_ROOT = `${ADMIN_DASHBOARD_ROOT}/analytics`;
const SITE_VISIBILITY_PATH = `${ADMIN_DASHBOARD_ROOT}/site-visibility`;

type PublishStatus = "ON" | "OFF";

type BikeModel = {
  modelId: number;
  publishStatus: PublishStatus;
};

type Vehicle = {
  managementNumber: string;
  publishStatus: PublishStatus;
};

type MenuLink = {
  label: string;
  href: string;
  actions?: { label: string; href: string }[];
  disabled?: boolean;
};

type MenuSection = {
  title: string;
  description?: string;
  links?: MenuLink[];
};

const bikeManagementLinks: MenuLink[] = [
  {
    label: "クラス一覧",
    href: `${ADMIN_DASHBOARD_ROOT}/bike-classes`,
    actions: [{ label: "＋登録", href: `${ADMIN_DASHBOARD_ROOT}/bike-classes/register` }],
  },
  {
    label: "車種一覧",
    href: `${ADMIN_DASHBOARD_ROOT}/bike-models`,
    actions: [{ label: "＋登録", href: `${ADMIN_DASHBOARD_ROOT}/bike-models/register` }],
  },
  {
    label: "車両一覧",
    href: `${ADMIN_DASHBOARD_ROOT}/vehicles`,
    actions: [{ label: "＋登録", href: `${ADMIN_DASHBOARD_ROOT}/vehicles/register` }],
  },
  {
    label: "バイクスケジュール管理",
    href: `${ADMIN_DASHBOARD_ROOT}/bike-schedules`,
  },
];

const blogManagementLinks: MenuLink[] = [
  {
    label: "記事一覧",
    href: `${ADMIN_DASHBOARD_ROOT}/blog`,
    actions: [{ label: "＋投稿", href: `${ADMIN_DASHBOARD_ROOT}/blog/new` }],
  },
];

const couponManagementLinks: MenuLink[] = [
  {
    label: "クーポン一覧",
    href: `${ADMIN_DASHBOARD_ROOT}/coupon-rules`,
    actions: [
      { label: "＋登録", href: `${ADMIN_DASHBOARD_ROOT}/coupon-rules/register` },
    ],
  },
  {
    label: "メルマガ配信設定",
    href: `${ADMIN_DASHBOARD_ROOT}/newsletter-settings`,
  },
];

const keyboxLinks: MenuLink[] = [
  {
    label: "KEYBOX解錠キーの発行",
    href: `${ADMIN_DASHBOARD_ROOT}/keybox-issue`,
  },
  {
    label: "KEYBOX実行ログ",
    href: `${ADMIN_DASHBOARD_ROOT}/keybox-logs`,
  },
];

const menuSections: MenuSection[] = [
  {
    title: "ダッシュボード",
    description: "管理メニューのトップページです。",
  },
  {
    title: "サイト表示切替",
    description:
      "サイト全体を工事中ページへ切り替えます。赤いページから切替・解除を行ってください。",
    links: [
      {
        label: "サイト表示切替ページへ",
        href: SITE_VISIBILITY_PATH,
        actions: [{ label: "開く", href: SITE_VISIBILITY_PATH }],
      },
    ],
  },
  {
    title: "新着情報管理",
    description: "トップページ上部の告知バーに表示される内容を編集できます。",
    links: [
      {
        label: "トップバー設定",
        href: `${ADMIN_DASHBOARD_ROOT}/announcements`,
      },
    ],
  },
  {
    title: "バイク管理",
    description: "バイクに関する情報を確認・登録できます。",
    links: bikeManagementLinks,
  },
  {
    title: "オプション（用品）",
    description: "用品の料金を確認・登録できます。",
    links: [
      {
        label: "用品一覧",
        href: `${ADMIN_DASHBOARD_ROOT}/accessories`,
        actions: [
          { label: "＋登録", href: `${ADMIN_DASHBOARD_ROOT}/accessories/register` },
        ],
      },
      {
        label: "用品登録",
        href: `${ADMIN_DASHBOARD_ROOT}/accessories/register`,
      },
    ],
  },
  {
    title: "会員管理",
    description: "会員情報の確認や状態の把握を行うための管理メニューです。",
    links: [
      { label: "会員一覧", href: `${ADMIN_DASHBOARD_ROOT}/members` },
    ],
  },
  {
    title: "レンタル予約管理",
    description: "予約内容と車両の紐付けを確認・更新できます。",
    links: [
      {
        label: "バイクレンタル一覧",
        href: `${ADMIN_DASHBOARD_ROOT}/reservations`,
      },
    ],
  },
  {
    title: "サポート",
    description: "チャットボットへの問い合わせ内容やQAカテゴリを管理できます。",
    links: [
      {
        label: "チャットボットQA管理",
        href: `${ADMIN_DASHBOARD_ROOT}/chatbot/faq`,
      },
      {
        label: "チャットボット問い合わせ一覧",
        href: `${ADMIN_DASHBOARD_ROOT}/chatbot/inquiries`,
      },
    ],
  },
  {
    title: "ブログ管理",
    description: "ブログ記事を確認・追加・編集できます。",
    links: blogManagementLinks,
  },
  {
    title: "休日管理",
    description: "店舗の営業日と休日を管理できます。",
    links: HOLIDAY_MANAGER_STORES.map((store) => ({
      label: `${store.label}の休日`,
      href: `${ADMIN_DASHBOARD_ROOT}/holiday-manager/${store.id}`,
    })),
  },
  {
    title: "クーポン管理",
    description:
      "クーポンの登録・編集や対象クラスの設定を行う管理メニューです。",
    links: couponManagementLinks,
  },
  {
    title: "KEYBOX管理",
    description: "無人店舗用のPIN発行と実行ログを確認できます。",
    links: keyboxLinks,
  },
];

export default function DashboardTopPage() {
  const [modelCounts, setModelCounts] = useState({
    total: 0,
    published: 0,
    isLoading: true,
    error: false,
  });
  const [vehicleCounts, setVehicleCounts] = useState({
    total: 0,
    published: 0,
    isLoading: true,
    error: false,
  });
  const [memberCounts, setMemberCounts] = useState({
    provisional: 0,
    verified: 0,
    isLoading: true,
    error: false,
  });
  const [reservationCounts, setReservationCounts] = useState({
    current: 0,
    completed: 0,
    isLoading: true,
    error: false,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [modelsResponse, vehiclesResponse, membersResponse, reservationsResponse] =
          await Promise.all([
            fetch("/api/bike-models"),
            fetch("/api/vehicles"),
            fetch("/api/admin/members"),
            fetch("/api/reservations"),
          ]);

        if (modelsResponse.ok) {
          const models: BikeModel[] = await modelsResponse.json();
          setModelCounts({
            total: models.length,
            published: models.filter((model) => model.publishStatus === "ON")
              .length,
            isLoading: false,
            error: false,
          });
        } else {
          setModelCounts((prev) => ({ ...prev, isLoading: false, error: true }));
        }

        if (vehiclesResponse.ok) {
          const vehicles: Vehicle[] = await vehiclesResponse.json();
          setVehicleCounts({
            total: vehicles.length,
            published: vehicles.filter(
              (vehicle) => vehicle.publishStatus === "ON"
            ).length,
            isLoading: false,
            error: false,
          });
        } else {
          setVehicleCounts((prev) => ({
            ...prev,
            isLoading: false,
            error: true,
          }));
        }

        if (membersResponse.ok) {
          const data = (await membersResponse.json()) as { members?: Member[] };
          const members = data.members ?? [];
          const isProvisional = (member: Member) =>
            member.registrationStatus === "仮登録済" ||
            member.registrationStatus === "管理者追加済";
          const isVerified = (member: Member) => member.registrationStatus === "本登録済";
          setMemberCounts({
            provisional: members.filter(isProvisional).length,
            verified: members.filter(isVerified).length,
            isLoading: false,
            error: false,
          });
        } else {
          setMemberCounts((prev) => ({ ...prev, isLoading: false, error: true }));
        }

        if (reservationsResponse.ok) {
          const data = (await reservationsResponse.json()) as {
            reservations?: Reservation[];
          };
          const reservations = data.reservations ?? [];
          const isReservationCompleted = (reservation: Reservation) =>
            reservation.reservationCompletedFlag ||
            reservation.status === "予約完了";
          setReservationCounts({
            current: reservations.filter(
              (reservation) => !isReservationCompleted(reservation)
            ).length,
            completed: reservations.filter(
              (reservation) => isReservationCompleted(reservation)
            ).length,
            isLoading: false,
            error: false,
          });
        } else {
          setReservationCounts((prev) => ({ ...prev, isLoading: false, error: true }));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
        setModelCounts((prev) => ({ ...prev, isLoading: false, error: true }));
        setVehicleCounts((prev) => ({ ...prev, isLoading: false, error: true }));
        setMemberCounts((prev) => ({ ...prev, isLoading: false, error: true }));
        setReservationCounts((prev) => ({ ...prev, isLoading: false, error: true }));
      }
    };

    void fetchCounts();
  }, []);

  const formatCountDisplay = (counts: {
    total: number;
    published: number;
    isLoading: boolean;
    error: boolean;
  }) => {
    if (counts.isLoading) {
      return "計測中...";
    }

    if (counts.error) {
      return "取得に失敗しました";
    }

    return `${counts.total.toLocaleString()} (${counts.published.toLocaleString()})`;
  };

  const formatDualCount = (counts: {
    primary: number;
    secondary: number;
    isLoading: boolean;
    error: boolean;
  }) => {
    if (counts.isLoading) {
      return "計測中...";
    }

    if (counts.error) {
      return "取得に失敗しました";
    }

    return `${counts.primary.toLocaleString()} / ${counts.secondary.toLocaleString()}`;
  };

  const formatMemberPercentage = (counts: {
    provisional: number;
    verified: number;
    isLoading: boolean;
    error: boolean;
  }) => {
    if (counts.isLoading) {
      return "割合計測中...";
    }

    if (counts.error) {
      return "割合の取得に失敗しました";
    }

    const total = counts.provisional + counts.verified;
    if (total === 0) {
      return "仮登録 0.0% / 本登録 0.0%";
    }

    const provisionalRate = (counts.provisional / total) * 100;
    const verifiedRate = (counts.verified / total) * 100;

    return `仮登録 ${provisionalRate.toFixed(1)}% / 本登録 ${verifiedRate.toFixed(1)}%`;
  };

  const stats = useMemo(
    () => [
      {
        key: "members",
        label: "会員数 (仮登録 / 本登録)",
        value: formatDualCount({
          primary: memberCounts.provisional,
          secondary: memberCounts.verified,
          isLoading: memberCounts.isLoading,
          error: memberCounts.error,
        }),
        note: formatMemberPercentage(memberCounts),
        href: `${ANALYTICS_ROOT}/members`,
      },
      {
        key: "reservations",
        label: "予約数 (現在 / 完了)",
        value: formatDualCount({
          primary: reservationCounts.current,
          secondary: reservationCounts.completed,
          isLoading: reservationCounts.isLoading,
          error: reservationCounts.error,
        }),
        note: "未完了 / 完了",
        href: `${ANALYTICS_ROOT}/reservations`,
      },
      {
        key: "bikeModels",
        label: "登録車種数 (掲載)",
        value: formatCountDisplay(modelCounts),
        note: "総数（掲載中）",
        href: `${ANALYTICS_ROOT}/bike-models`,
      },
      {
        key: "vehicles",
        label: "登録車両数 (掲載)",
        value: formatCountDisplay(vehicleCounts),
        note: "総数（掲載中）",
        href: `${ANALYTICS_ROOT}/vehicles`,
      },
    ],
    [memberCounts, modelCounts, reservationCounts, vehicleCounts]
  );

  return (
    <>
      <Head>
        <title>管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="管理ダッシュボード"
        description="レンタルバイク『ヤスカリ』の運用に必要な情報を確認・登録できる管理メニューです。"
        showHomeAction={false}
      >
        <section className={styles.menuSection}>
          <div className={styles.menuGroups}>
            {menuSections.map((section) => (
              <div key={section.title} className={styles.menuGroup}>
                <div>
                  <h2 className={styles.menuGroupTitle}>{section.title}</h2>
                  {section.description && (
                    <p className={styles.menuGroupNote}>{section.description}</p>
                  )}
                </div>
                {section.title === "ダッシュボード" && (
                  <div
                    className={styles.dashboardStats}
                    aria-label="ダッシュボードサマリー"
                  >
                    <div className={styles.dashboardStatsHeader}>
                      <div>
                        <p className={styles.dashboardSectionKicker}>ホーム</p>
                        <h2 className={styles.dashboardSectionTitle}>
                          運用指標のハイライト
                        </h2>
                        <p className={styles.dashboardSectionNote}>
                          テーブルの総数を表示します。（掲載）は掲載中フラグONの件数です。
                        </p>
                      </div>
                    </div>
                    <div className={styles.dashboardStatsGrid}>
                      {stats.map((stat) => (
                        <Link
                          key={stat.key}
                          href={stat.href}
                          className={styles.dashboardStatCard}
                        >
                          <p className={styles.dashboardStatLabel}>{stat.label}</p>
                          <p className={styles.dashboardStatValue}>{stat.value}</p>
                          {stat.note && (
                            <p className={styles.dashboardStatNote}>{stat.note}</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {section.links && section.links.length > 0 && (
                  <div className={styles.menuLinkList}>
                    {section.links.map((link) => (
                      <div key={link.href} className={styles.menuLinkRow}>
                        <Link
                          href={link.href}
                          className={`${styles.menuLink} ${
                            link.disabled ? styles.menuLinkDisabled : ""
                          }`}
                          aria-disabled={link.disabled}
                        >
                          {link.label}
                        </Link>
                        {link.actions && link.actions.length > 0 && (
                          <div className={styles.menuLinkRowActions}>
                            {link.actions.map((action) => (
                              <Link
                                key={action.href}
                                href={action.href}
                                className={styles.menuLinkAction}
                              >
                                {action.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </DashboardLayout>
    </>
  );
}
