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
  children?: NavItem[];
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

const NAV_ITEMS: NavItem[] = [
  {
    label: "ダッシュボード",
    href: ADMIN_DASHBOARD_ROOT,
  },
  {
    label: "新着情報管理",
    href: `${ADMIN_DASHBOARD_ROOT}/announcements`,
  },
  {
    label: "バイク管理",
    href: `${ADMIN_DASHBOARD_ROOT}/bike`,
    children: [
      { label: "クラス一覧", href: `${ADMIN_DASHBOARD_ROOT}/bike-classes` },
      { label: "車種一覧", href: `${ADMIN_DASHBOARD_ROOT}/bike-models` },
      {
        label: "料金設定",
        href: `${ADMIN_DASHBOARD_ROOT}/bike-models/rental-pricing`,
      },
      { label: "車両一覧", href: `${ADMIN_DASHBOARD_ROOT}/vehicles` },
      { label: "バイクスケジュール管理", href: `${ADMIN_DASHBOARD_ROOT}/bike-schedules` },
    ],
  },
  {
    label: "オプション（用品）",
    href: `${ADMIN_DASHBOARD_ROOT}/accessories/options`,
    children: [
      { label: "用品一覧", href: `${ADMIN_DASHBOARD_ROOT}/accessories` },
      { label: "用品登録", href: `${ADMIN_DASHBOARD_ROOT}/accessories/register` },
    ],
  },
  {
    label: "会員管理",
    href: `${ADMIN_DASHBOARD_ROOT}/members`,
    children: [{ label: "会員一覧", href: `${ADMIN_DASHBOARD_ROOT}/members` }],
  },
  {
    label: "レンタル予約管理",
    href: `${ADMIN_DASHBOARD_ROOT}/reservations`,
    children: [{ label: "バイクレンタル一覧", href: `${ADMIN_DASHBOARD_ROOT}/reservations` }],
  },
  {
    label: "KEYBOX実行ログ",
    href: `${ADMIN_DASHBOARD_ROOT}/keybox-logs`,
  },
  {
    label: "KEYBOX再発行",
    href: `${ADMIN_DASHBOARD_ROOT}/keybox-reissue`,
  },
  {
    label: "メール送信履歴",
    href: `${ADMIN_DASHBOARD_ROOT}/mail-history`,
  },
  {
    label: "写真アップロード確認",
    href: `${ADMIN_DASHBOARD_ROOT}/photo-uploads`,
    children: [
      { label: "アップロード一覧", href: `${ADMIN_DASHBOARD_ROOT}/photo-uploads` },
      {
        label: "事故・転倒報告",
        href: `${ADMIN_DASHBOARD_ROOT}/photo-uploads/accident-reports`,
      },
      {
        label: "バイクの返却完了",
        href: `${ADMIN_DASHBOARD_ROOT}/photo-uploads/return-completions`,
      },
      {
        label: "免許証画像",
        href: `${ADMIN_DASHBOARD_ROOT}/photo-uploads/license-uploads`,
      },
    ],
  },
  {
    label: "チャットボット",
    href: `${ADMIN_DASHBOARD_ROOT}/chatbot/inquiries`,
    children: [
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
    label: "ブログ管理",
    href: `${ADMIN_DASHBOARD_ROOT}/blog`,
  },
  {
    label: "休日管理",
    href: `${ADMIN_DASHBOARD_ROOT}/holiday-manager`,
    children: HOLIDAY_MANAGER_STORES.map((store) => ({
      label: `${store.label}の休日`,
      href: `${ADMIN_DASHBOARD_ROOT}/holiday-manager/${store.id}`,
    })),
  },
  {
    label: "ハイシーズン設定",
    href: `${ADMIN_DASHBOARD_ROOT}/high-season-manager`,
  },
  {
    label: "クーポン管理",
    href: `${ADMIN_DASHBOARD_ROOT}/coupon-rules`,
  },
  {
    label: "メルマガ配信設定",
    href: `${ADMIN_DASHBOARD_ROOT}/newsletter-settings`,
  },
  {
    label: "テストメール",
    href: `${ADMIN_DASHBOARD_ROOT}/test-mail`,
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
    const hrefs = NAV_ITEMS.flatMap((item) => [
      ...(item.href ? [item.href] : []),
      ...((item.children ?? [])
        .map((child) => child.href)
        .filter((href): href is string => Boolean(href))),
    ]);

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

  const navigation = useMemo(() => {
    return NAV_ITEMS.filter(
      (item) => showDashboardLink || item.href !== ADMIN_DASHBOARD_ROOT
    ).map((item) => ({
      ...item,
      isActive:
        (item.href && item.href === activeHref) ||
        (item.children?.some((child) => child.href === activeHref) ??
          (!activeHref &&
            (isActivePath(router.pathname, item.href) ||
              (item.children?.some((child) =>
                isActivePath(router.pathname, child.href)
              ) ?? false)))),
    }));
  }, [activeHref, router.pathname, showDashboardLink]);

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
          <ul className={styles.sidebarNavList}>
            {navigation.map((item) => (
              <li key={item.label} className={styles.sidebarNavItem}>
                {item.href && !item.disabled ? (
                  <Link
                    href={item.href}
                    className={`${styles.sidebarNavLink} ${
                      item.isActive ? styles.sidebarNavLinkActive : ""
                    }`}
                    aria-current={item.isActive ? "page" : undefined}
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
                {item.children && item.children.length > 0 && (
                  <ul className={styles.sidebarSubNav}>
                    {item.children.map((child) => {
                      const childActive = activeHref
                        ? child.href === activeHref
                        : isActivePath(router.pathname, child.href);
                      return (
                        <li key={child.label} className={styles.sidebarSubNavItem}>
                          {child.href && !child.disabled ? (
                            <Link
                              href={child.href}
                              className={`${styles.sidebarSubNavLink} ${
                                childActive ? styles.sidebarNavLinkActive : ""
                              }`}
                              aria-current={childActive ? "page" : undefined}
                            >
                              {child.label}
                            </Link>
                          ) : (
                            <span
                              className={`${styles.sidebarSubNavLink} ${styles.sidebarNavLinkDisabled}`}
                              aria-disabled
                            >
                              {child.label}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
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
