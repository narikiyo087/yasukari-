import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import styles from '../../styles/AdminV2.module.css';

/** タイトル横の ⓘ。クリックで説明ポップアップを表示（外側クリックで閉じる） */
export default function InfoPopover({ title, children }: { title?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <span className={styles.infoWrap} ref={ref}>
      <button
        type="button"
        className={styles.infoBtn}
        aria-label="説明を表示"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        i
      </button>
      {open && (
        <div className={styles.infoPop} role="dialog">
          {title && <h4>{title}</h4>}
          {children}
        </div>
      )}
    </span>
  );
}
