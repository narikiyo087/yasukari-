import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaUser, FaQuestionCircle, FaClipboardList, FaBars } from 'react-icons/fa';
import AnnouncementBar from './AnnouncementBar';
import NotificationBellIcon from './NotificationBellIcon';
import useNotificationBadge from '../lib/useNotificationBadge';

export default function HeaderEn() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [updatingLocale, setUpdatingLocale] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ email?: string; username?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(false);
  const menuRef = useRef<HTMLUListElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();
  const unreadCount = useNotificationBadge(Boolean(sessionUser));
  const isReservationPaymentFlow = /^(\/en)?\/reserve\/(models|flow)/.test(router.pathname);
  const languageSwitchDisabled = updatingLocale || isReservationPaymentFlow;
  const showLanguageSwitch = /^\/(en\/)?mypage(\/|$)/.test(router.pathname);

  useEffect(() => {
    const controller = new AbortController();
    const fetchSession = async () => {
      try {
        setAuthError(false);
        const response = await fetch(`/api/me`, {
          credentials: 'include',
          signal: controller.signal,
        });

        if (response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            user?: { email?: string; username?: string } | null;
          };
          setSessionUser(data.user ?? null);
          return;
        }

        setSessionUser(null);
        setAuthError(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error('Failed to check session', error);
        setSessionUser(null);
        setAuthError(true);
      } finally {
        setAuthChecked(true);
      }
    };

    void fetchSession();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);
  useEffect(() => {
    const handleRouteChange = () => {
      setMenuOpen(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events]);

  const handleLanguageClick = async (target: 'ja' | 'en') => {
    if (languageSwitchDisabled) return;

    if (sessionUser) {
      setUpdatingLocale(true);
      try {
        await fetch('/api/user/attributes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ locale: target === 'en' ? 'en' : 'jp' }),
        });
      } catch (error) {
        console.error('Failed to update locale', error);
      } finally {
        setUpdatingLocale(false);
      }
    }

    const hasEnPrefix = router.asPath.startsWith('/en');
    const nextPath =
      target === 'en'
        ? hasEnPrefix
          ? router.asPath
          : `/en${router.asPath}`
        : hasEnPrefix
          ? router.asPath.slice(3) || '/'
          : router.asPath || '/';

    await router.push(nextPath);
  };
  return (
    <div className="sticky top-0 z-50">
      {/* Top bar */}
      <AnnouncementBar />
      <header className="bg-white shadow-md border-b-2 border-red-600 relative">
        <div className="mx-auto flex items-center justify-between px-4 py-3 w-full max-w-screen-xl">
          {/* Logo */}
          <Link href="/en" className="flex items-center">
            <img
              src="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/1769056104573-d731196a-700f-4cc2-948b-68cfdb40d14a-yasukari-logo.jpg"
              alt="ヤスカリ logo"
              className="h-8 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            <button
              className="sm:hidden text-gray-700 p-2 rounded-md border border-gray-200 active:scale-95 transition"
              onClick={() => setMenuOpen((o) => !o)}
              ref={menuButtonRef}
              aria-label="Toggle menu"
            >
              <FaBars size={24} />
            </button>

            {/* Navigation buttons */}
            <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
              <Link href="/en">
                <NavItem label="Home" />
              </Link>
              {authChecked && sessionUser ? (
                <Link href="/en/mypage">
                  <NavItem icon={<FaUser />} label="My Page" />
                </Link>
              ) : authChecked && authError ? (
                <div className="hidden sm:inline-flex">
                  <NavItem icon={<FaUser />} label="Login error" />
                </div>
              ) : (
                <Link href="/en/login">
                  <NavItem icon={<FaUser />} label="Login" />
                </Link>
              )}
              <Link href="/en/products">
                <NavItem icon={<FaClipboardList />} label="All Bike Models" />
              </Link>
              <Link href="/en/beginner">
                <NavItem icon={<FaQuestionCircle />} label="Beginner Guide" />
              </Link>
              <Link href="/en/help">
                <NavItem label="Help" />
              </Link>
              <Link href="/en/notifications" aria-label="Notifications">
                <span className="flex items-center text-gray-700 hover:text-red-600 transition-colors">
                  <NotificationBellIcon count={unreadCount} />
                </span>
              </Link>
              {showLanguageSwitch && (
                <div className="flex items-center rounded-full border border-red-500 bg-red-50/70 shadow-sm text-xs font-semibold text-gray-800">
                <button
                  type="button"
                  className="px-3 py-1 rounded-full transition-colors hover:bg-red-100"
                  onClick={() => handleLanguageClick('en')}
                  disabled={languageSwitchDisabled}
                  aria-current="page"
                >
                  English
                </button>
                <span className="h-5 w-px bg-red-200" aria-hidden />
                <button
                  type="button"
                  className="px-3 py-1 rounded-full transition-colors hover:bg-red-100"
                  onClick={() => handleLanguageClick('ja')}
                  disabled={languageSwitchDisabled}
                >
                  日本語
                </button>
                </div>
              )}
            </nav>
          </div>
        </div>
        {menuOpen && (
          <nav className="sm:hidden fixed inset-0 z-50 flex items-center justify-center bg-white px-6 py-10 text-center">
            <ul
              ref={menuRef}
              className="flex w-full max-w-sm flex-col items-center gap-6 text-lg font-semibold"
            >
              <li>
                <Link href="/en">
                  <NavItem label="Home" />
                </Link>
              </li>
              <li>
                {authChecked && sessionUser ? (
                  <>
                    <Link href="/en/mypage">
                      <NavItem icon={<FaUser />} label="My Page" />
                    </Link>
                  </>
                ) : authChecked && authError ? (
                  <div className="inline-flex">
                    <NavItem icon={<FaUser />} label="Login error" />
                  </div>
                ) : (
                  <Link href="/en/login" className="inline-flex">
                    <NavItem icon={<FaUser />} label="Login" />
                  </Link>
                )}
              </li>
              <li>
                <Link href="/en/products">
                  <NavItem icon={<FaClipboardList />} label="All Bike Models" />
                </Link>
              </li>
              <li>
                <Link href="/en/beginner">
                  <NavItem icon={<FaQuestionCircle />} label="Beginner Guide" />
                </Link>
              </li>
              <li>
                <Link href="/en/help">
                  <NavItem label="Help" />
                </Link>
              </li>
              <li>
                <Link href="/en/notifications">
                  <NavItem icon={<NotificationBellIcon count={unreadCount} />} label="Notifications" />
                </Link>
              </li>
              {showLanguageSwitch && (
                <li className="w-full pt-4">
                  <div className="grid w-full grid-cols-2 overflow-hidden rounded-full border border-red-500 bg-red-50/70 text-sm font-semibold text-gray-800 shadow-sm">
                    <button
                      type="button"
                      className="px-4 py-2 transition-colors hover:bg-red-100"
                      onClick={() => handleLanguageClick('en')}
                      disabled={languageSwitchDisabled}
                      aria-current="page"
                    >
                      English
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 transition-colors hover:bg-red-100"
                      onClick={() => handleLanguageClick('ja')}
                      disabled={languageSwitchDisabled}
                    >
                      日本語
                    </button>
                  </div>
                </li>
              )}
            </ul>
          </nav>
        )}
      </header>
    </div>
  );
}

function NavItem({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <button className="flex items-center gap-1 text-gray-700 hover:text-red-600 transition-colors">
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
