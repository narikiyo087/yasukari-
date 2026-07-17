import Link from "next/link";
import { useRouter } from "next/router";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { HOLIDAY_MANAGER_STORES } from "../../lib/dashboard/holidayStores";
import styles from "../../styles/Dashboard.module.css";

type NavItem = {
  label: string;
  href?: string;
  disabled?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

type Action = {
  label: string;
  href: string;
};

type DashboardLayoutProps = {
  title: string;
  description?: string;
  actions?: Action[];
  children: ReactNode;
  showHomeAction?: boolean;
  showDashboardLink?: boolean;
};

const ADMIN_DASHBOARD_ROOT = "/admin/dashboard";

const DEFAULT_SIDEBAR_WIDTH = 240;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 360;
const MIN_MAIN_AREA_WIDTH = 520;
const SIDEBAR_RESIZE_BREAKPOINT = 960;

// To-Be IA (docs: ヤスカリ_サイト構成_設計.md §7) — 6 collapsible groups.
// Routes are unchanged; only the navigation grouping is reorganized.
const NAV_GROUPS: NavGroup[] = [
  {
    title: "① 今日の運用",
    items: [
      { label: "ダッシュボード", href: ADMIN_DASHBOARD_ROOT },
      { label: "レンタル予約管理", href: `${ADMIN_DASHBOARD_ROOT}/reservations` },
      { label: "承認待ち（統合）", href: `${ADMIN_DASHBOARD_ROOT}/approvals` },
      { label: "承認待ち：免許証確認", href: `${ADMIN_DASHBOARD_ROOT}/photo-uploads/license-uploads` },
      { label: "承認待ち：事故・転倒報告", href: `${ADMIN_DASHBOARD_ROOT}/photo-uploads/accident-reports` },
      { label: "承認待ち：返却完了確認", href: `${ADMIN_DASHBOARD_ROOT}/photo-uploads/return-completions` },
      { label: "写真アップロード一覧", href: `${ADMIN_DASHBOARD_ROOT}/photo-uploads` },
      { label: "KEYBOX解錠キーの発行", href: `${ADMIN_DASHBOARD_ROOT}/keybox-issue` },
      { label: "KEYBOX再発行", href: `${ADMIN_DASHBOARD_ROOT}/keybox-reissue` },
      { label: "KEYBOX実行ログ", href: `${ADMIN_DASHBOARD_ROOT}/keybox-logs` },
      { label: "バイクスケジュール管理", href: `${ADMIN_DASHBOARD_ROOT}/bike-schedules` },
    ],
  },
  {
    title: "② 会員・連絡",
    items: [
      { label: "会員一覧", href: `${ADMIN_DASHBOARD_ROOT}/members` },
      { label: "メール送信履歴", href: `${ADMIN_DASHBOARD_ROOT}/mail-history` },
      { label: "テストメール", href: `${ADMIN_DASHBOARD_ROOT}/test-mail` },
      { label: "メルマガ設定", href: `${ADMIN_DASHBOARD_ROOT}/newsletter-settings` },
      { label: "チャットボットQA管理", href: `${ADMIN_DASHBOARD_ROOT}/chatbot/faq` },
      { label: "チャットボット問い合わせ一覧", href: `${ADMIN_DASHBOARD_ROOT}/chatbot/inquiries` },
    ],
  },
  {
    title: "③ 商品マスタ",
    items: [
      { label: "クラス一覧", href: `${ADMIN_DASHBOARD_ROOT}/bike-classes` },
      { label: "車種一覧", href: `${ADMIN_DASHBOARD_ROOT}/bike-models` },
      { label: "料金設定", href: `${ADMIN_DASHBOARD_ROOT}/bike-models/rental-pricing` },
      { label: "車両一覧", href: `${ADMIN_DASHBOARD_ROOT}/vehicles` },
      { label: "用品一覧", href: `${ADMIN_DASHBOARD_ROOT}/accessories` },
      { label: "用品オプション", href: `${ADMIN_DASHBOARD_ROOT}/accessories/options` },
    ],
  },
  {
    title: "④ 販促・カレンダー",
    items: [
      { label: "新着情報／告知バー", href: `${ADMIN_DASHBOARD_ROOT}/announcements` },
      { label: "ブログ管理", href: `${ADMIN_DASHBOARD_ROOT}/blog` },
      ...HOLIDAY_MANAGER_STORES.map((store) => ({
        label: `休日管理：${store.label}`,
        href: `${ADMIN_DASHBOARD_ROOT}/holiday-manager/${store.id}`,
      })),
      { label: "ハイシーズン設定", href: `${ADMIN_DASHBOARD_ROOT}/high-season-manager` },
      { label: "クーポン管理", href: `${ADMIN_DASHBOARD_ROOT}/coupon-rules` },
    ],
  },
  {
    title: "⑤ 分析",
    items: [
      { label: "予約分析", href: `${ADMIN_DASHBOARD_ROOT}/analytics/reservations` },
      { label: "会員分析", href: `${ADMIN_DASHBOARD_ROOT}/analytics/members` },
      { label: "車両分析", href: `${ADMIN_DASHBOARD_ROOT}/analytics/vehicles` },
      { label: "車種分析", href: `${ADMIN_DASHBOARD_ROOT}/analytics/bike-models` },
    ],
  },
  {
    title: "⑥ サイト設定",
    items: [
      { label: "サイト表示切替", href: `${ADMIN_DASHBOARD_ROOT}/site-visibility` },
    ],
  },
];

const isActivePath = (pathname: string, href?: string): boolean => {
  if (!href) {
    return false;
  }

  if (href === ADMIN_DASHBOARD_ROOT) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function DashboardLayout({
  title,
  description,
  actions,
  children,
  showHomeAction = true,
  showDashboardLink = true,
}: DashboardLayoutProps) {
  const router = useRouter();
  const layoutRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarResizable, setIsSidebarResizable] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const resizeCleanupRef = useRef<(() => void) | null>(null);

  const activeHref = useMemo(() => {
    const hrefs = NAV_GROUPS.flatMap((group) =>
      group.items
        .map((item) => item.href)
        .filter((href): href is string => Boolean(href))
    );

    const matchingHrefs = hrefs.filter((href) =>
      isActivePath(router.pathname, href)
    );

    if (matchingHrefs.length === 0) {
      return null;
    }

    return matchingHrefs.reduce((longest, current) =>
      current.length > longest.length ? current : longest
    );
  }, [router.pathname]);

  const activeGroupIndex = useMemo(
    () =>
      NAV_GROUPS.findIndex((group) =>
        group.items.some((item) => isActivePath(router.pathname, item.href))
      ),
    [router.pathname]
  );

  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    // First group (今日の運用) starts expanded; the rest collapsed.
    NAV_GROUPS.forEach((_, index) => {
      initial[index] = index === 0;
    });
    return initial;
  });

  useEffect(() => {
    if (activeGroupIndex >= 0) {
      setOpenGroups((prev) =>
        prev[activeGroupIndex]
          ? prev
          : { ...prev, [activeGroupIndex]: true }
      );
    }
  }, [activeGroupIndex]);

  const toggleGroup = useCallback((index: number) => {
    setOpenGroups((prev) => ({ ...prev, [index]: !prev[index] }));
  }, []);

  const clampSidebarWidth = useCallback(
    (width: number) => {
      const containerWidth = layoutRef.current?.clientWidth;
      let maxWidth = MAX_SIDEBAR_WIDTH;

      if (containerWidth && containerWidth > 0) {
        const dynamicMax = containerWidth - MIN_MAIN_AREA_WIDTH;
        if (dynamicMax > 0) {
          maxWidth = Math.min(maxWidth, dynamicMax);
        } else {
          maxWidth = MIN_SIDEBAR_WIDTH;
        }
      }

      return Math.min(
        Math.max(width, MIN_SIDEBAR_WIDTH),
        Math.max(MIN_SIDEBAR_WIDTH, maxWidth)
      );
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateSidebarState = () => {
      setIsSidebarResizable(window.innerWidth > SIDEBAR_RESIZE_BREAKPOINT);
    };

    updateSidebarState();
    window.addEventListener("resize", updateSidebarState);

    return () => {
      window.removeEventListener("resize", updateSidebarState);
    };
  }, []);

  useEffect(() => {
    if (isSidebarResizable) {
      setSidebarWidth((current) => clampSidebarWidth(current));
    } else {
      resizeCleanupRef.current?.();
    }
  }, [clampSidebarWidth, isSidebarResizable]);

  useEffect(() => {
    return () => {
      resizeCleanupRef.current?.();
    };
  }, []);

  const handleSidebarResizeStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isSidebarResizable) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const pointerId = event.pointerId;
      const startX = event.clientX;
      const startWidth = sidebarWidth;
      const handleElement = event.currentTarget;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        setSidebarWidth(clampSidebarWidth(startWidth + delta));
      };

      const stopResize = () => {
        setIsResizing(false);
        const body = document.body;
        if (body) {
          body.style.cursor = "";
          body.style.userSelect = "";
        }

        if (handleElement.hasPointerCapture(pointerId)) {
          handleElement.releasePointerCapture(pointerId);
        }

        handleElement.removeEventListener("pointermove", handlePointerMove);
        handleElement.removeEventListener("pointerup", stopResize);
        handleElement.removeEventListener("pointercancel", stopResize);
        resizeCleanupRef.current = null;
      };

      setIsResizing(true);
      const body = document.body;
      if (body) {
        body.style.cursor = "col-resize";
        body.style.userSelect = "none";
      }

      handleElement.setPointerCapture(pointerId);
      handleElement.addEventListener("pointermove", handlePointerMove);
      handleElement.addEventListener("pointerup", stopResize);
      handleElement.addEventListener("pointercancel", stopResize);
      resizeCleanupRef.current = stopResize;
    },
    [clampSidebarWidth, isSidebarResizable, sidebarWidth]
  );

  const layoutStyle = useMemo(() => {
    if (!isSidebarResizable) {
      return undefined;
    }

    return {
      gridTemplateColumns: `${sidebarWidth}px minmax(0, 1fr)`,
    } as const;
  }, [isSidebarResizable, sidebarWidth]);

  return (
    <div
      ref={layoutRef}
      className={`${styles.dashboardLayout} ${
        isResizing ? styles.dashboardLayoutResizing : ""
      }`}
      style={layoutStyle}
    >
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarBrand}>管理メニュー</div>
        </div>
        <nav className={styles.sidebarNav} aria-label="管理メニュー">
          {NAV_GROUPS.map((group, groupIndex) => {
            const isOpen = openGroups[groupIndex] ?? false;
            const items = group.items.filter(
              (item) => showDashboardLink || item.href !== ADMIN_DASHBOARD_ROOT
            );
            if (items.length === 0) {
              return null;
            }
            return (
              <div key={group.title} className={styles.sidebarGroup}>
                <button
                  type="button"
                  className={`${styles.sidebarGroupToggle} ${
                    isOpen ? styles.sidebarGroupToggleOpen : ""
                  }`}
                  onClick={() => toggleGroup(groupIndex)}
                  aria-expanded={isOpen}
                >
                  <span>{group.title}</span>
                  <span className={styles.sidebarGroupCaret} aria-hidden>
                    {isOpen ? "▾" : "▸"}
                  </span>
                </button>
                {isOpen && (
                  <ul className={styles.sidebarNavList}>
                    {items.map((item) => {
                      const itemActive = item.href
                        ? item.href === activeHref
                        : false;
                      return (
                        <li key={item.label} className={styles.sidebarNavItem}>
                          {item.href && !item.disabled ? (
                            <Link
                              href={item.href}
                              className={`${styles.sidebarNavLink} ${
                                itemActive ? styles.sidebarNavLinkActive : ""
                              }`}
                              aria-current={itemActive ? "page" : undefined}
                            >
                              {item.label}
                            </Link>
                          ) : (
                            <span
                              className={`${styles.sidebarNavLink} ${styles.sidebarNavLinkDisabled}`}
                              aria-disabled
                            >
                              {item.label}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
        {isSidebarResizable && (
          <div
            className={`${styles.sidebarResizeHandle} ${
              isResizing ? styles.sidebarResizeHandleActive : ""
            }`}
            onPointerDown={handleSidebarResizeStart}
            aria-hidden="true"
          />
        )}
      </aside>
      <div className={styles.mainArea}>
        <div className={styles.mainContent}>
          <header className={styles.pageHeader}>
            <div className={styles.pageHeaderContent}>
              <h1 className={styles.pageTitle}>{title}</h1>
              {description && (
                <p className={styles.pageDescription}>{description}</p>
              )}
            </div>
            {(showHomeAction || actions?.length) && (
              <div className={styles.pageActions}>
                {showHomeAction && (
                  <Link href={ADMIN_DASHBOARD_ROOT} className={styles.iconButton}>
                    管理ホームに戻る
                  </Link>
                )}
                {actions?.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={styles.iconButton}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            )}
          </header>
          <main className={styles.main}>{children}</main>
          <footer className={styles.footer}>
            <small>&copy; レンタルバイク『ヤスカリ』</small>
          </footer>
        </div>
      </div>
    </div>
  );
}
