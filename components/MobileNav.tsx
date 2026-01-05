import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaHome, FaUser } from 'react-icons/fa';
import NotificationBellIcon from './NotificationBellIcon';
import useNotificationBadge from '../lib/useNotificationBadge';

export default function MobileNav() {
  const router = useRouter();
  const unreadCount = useNotificationBadge(true);
  const isEnglish = router.pathname.startsWith('/en');
  const items = React.useMemo(
    () =>
      isEnglish
        ? [
            { href: '/en', label: 'Home', icon: <FaHome /> },
            {
              href: '/en/notifications',
              label: 'Notifications',
              icon: <NotificationBellIcon count={unreadCount} />,
            },
            { href: '/en/mypage', label: 'My Page', icon: <FaUser /> },
          ]
        : [
            { href: '/', label: 'ホーム', icon: <FaHome /> },
            { href: '/notifications', label: '通知', icon: <NotificationBellIcon count={unreadCount} /> },
            { href: '/mypage', label: 'マイページ', icon: <FaUser /> },
          ],
    [isEnglish, unreadCount]
  );

  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = () => setShow(window.innerWidth <= 640);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (!show) return null;

  return (
    <nav className="mobile-nav sm:hidden">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-col items-center text-xs"
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
