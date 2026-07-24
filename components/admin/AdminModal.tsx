import { useEffect } from 'react';
import type { ReactNode } from 'react';
import styles from '../../styles/AdminV2.module.css';

/** 汎用モーダル（Esc / 背景クリックで閉じる）。プロトの M()/closeM() 相当 */
export default function AdminModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={styles.amodal} onClick={onClose}>
      <div className={styles.amSheet} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.amTitle}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
