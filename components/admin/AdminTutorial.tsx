import { useState } from 'react';
import styles from '../../styles/AdminV2.module.css';

type Step = { t: string; b: string };
const STEPS: Step[] = [
  { t: 'ようこそ 👋', b: 'ヤスカリ管理画面へようこそ。1分で基本の使い方をご案内します。いつでも右上の「チュートリアル」から見返せます。' },
  { t: '左メニュー', b: '業務のカテゴリごとに整理しています。まずは「今日の運用」。日々の作業はここだけ見ればOKです。' },
  { t: '今日のタスク', b: '上から順に対応すれば当日の運用は完了します。契約書の印刷など現場作業も見落とさないよう集約しています。' },
  { t: '数字サマリ', b: '会員数・本日の受取／返却・稼働台数を一目で確認できます。' },
  { t: '表示ロール・店舗（右上）', b: '「本部管理者／店舗オーナー」や対象店舗を切り替えられます。店舗オーナーは自店の範囲のみ表示されます。' },
  { t: '準備OK ✅', b: '各見出しの ⓘ を押すと、その項目の説明が読めます。困ったらそこを確認してください。' },
];

export default function AdminTutorial({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  if (!open) return null;

  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  const finish = () => {
    setI(0);
    onClose();
  };

  return (
    <div className={styles.tutOverlay} onClick={finish}>
      <div className={styles.tutCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.tutStepNo}>
          STEP {i + 1} / {STEPS.length}
        </div>
        <div className={styles.tutTitle}>{step.t}</div>
        <div className={styles.tutBody}>{step.b}</div>
        <div className={styles.tutNav}>
          <div className={styles.tutDots}>
            {STEPS.map((_, x) => (
              <span key={x} className={`${styles.tutDot} ${x === i ? styles.tutDotOn : ''}`} />
            ))}
          </div>
          {i > 0 && (
            <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={() => setI(i - 1)}>
              戻る
            </button>
          )}
          {last ? (
            <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} onClick={finish}>
              はじめる
            </button>
          ) : (
            <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} onClick={() => setI(i + 1)}>
              次へ
            </button>
          )}
        </div>
        <div style={{ textAlign: 'right', marginTop: 8 }}>
          <button type="button" className={styles.tutSkip} onClick={finish}>
            スキップ
          </button>
        </div>
      </div>
    </div>
  );
}
