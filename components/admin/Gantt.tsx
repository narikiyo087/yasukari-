import { useEffect, useMemo, useRef, useState } from 'react';
import styles from '../../styles/AdminV2.module.css';
import { GANTT_RANGES, type GanttRow } from '../../lib/adminGanttData';

/**
 * 動的ガント（今日基準・範囲指定・横スクロールレバー）。
 * プロト(admin-proto-v2.html)の buildGantt を React 化。日付は
 * クライアントで計算（SSR とのハイドレーション不一致を避けるため mount 後に描画）。
 */

const COLW = 32;
const WD = ['日', '月', '火', '水', '木', '金', '土'];
// 種別 → [背景, 文字色, ラベル]
const ST: Record<string, [string, string, string]> = {
  out: ['#dcfce7', '#166534', '貸出'],
  resv: ['#dbeafe', '#1d4ed8', '予約'],
  maint: ['#fef3c7', '#92400e', '整備'],
};

type Cell = { key: string; cls: string; style?: React.CSSProperties; text?: string; wd?: string };

type Props = {
  rows: GanttRow[];
  defaultRange?: string;
  /** 1画面に収める（バイクスケジュール用の縦スクロール） */
  compact?: boolean;
  onRowClick?: (row: GanttRow) => void;
};

export default function Gantt({ rows, defaultRange = '30,90', compact = false, onRowClick }: Props) {
  const [range, setRange] = useState(defaultRange);
  const [today, setToday] = useState<Date | null>(null);
  const [lever, setLever] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [before, after] = useMemo(() => range.split(',').map(Number), [range]);
  const days = before + after + 1;

  useEffect(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setToday(d);
  }, []);

  // 日付ヘッダ
  const header = useMemo(() => {
    if (!today) return [] as Cell[];
    const start = new Date(today);
    start.setDate(start.getDate() - before);
    const out: Cell[] = [];
    for (let d = 0; d < days; d++) {
      const dt = new Date(start);
      dt.setDate(dt.getDate() + d);
      const off = d - before;
      const wd = dt.getDay();
      const cls = `${styles.gtH}${wd === 0 || wd === 6 ? ' ' + styles.wknd : ''}${off === 0 ? ' ' + styles.today : ''}`;
      out.push({ key: `h${d}`, cls, text: `${dt.getMonth() + 1}/${dt.getDate()}`, wd: WD[wd] });
    }
    return out;
  }, [today, before, days]);

  // 各行のセル
  const bodyCells = useMemo(() => {
    if (!today) return [] as Cell[][];
    return rows.map((r, ri) => {
      const cells: Cell[] = [];
      for (let d = 0; d < days; d++) {
        const off = d - before;
        const dt = new Date(today);
        dt.setDate(dt.getDate() - before + d);
        const wd = dt.getDay();
        let found: string | null = null;
        let isStart = false;
        r.spans.forEach((s) => {
          if (off >= s[0] && off < s[0] + s[1]) {
            found = s[2];
            if (off === s[0]) isStart = true;
          }
        });
        let expLbl = '';
        if (off === r.jib) expLbl = '自賠';
        if (r.sha != null && off === r.sha) expLbl = expLbl ? '自賠車検' : '車検';
        const warn = (off >= r.jib - 30 && off < r.jib) || (r.sha != null && off >= r.sha - 30 && off < r.sha);
        const cls = `${styles.gtC}${wd === 0 || wd === 6 ? ' ' + styles.wknd : ''}${off === 0 ? ' ' + styles.today : ''}`;
        let style: React.CSSProperties | undefined;
        let text = '';
        if (expLbl) {
          style = { background: '#b91c1c', color: '#fff', fontWeight: 800, fontSize: 8 };
          text = expLbl;
        } else if (found) {
          const cc = ST[found];
          style = { background: cc[0], color: cc[1], fontWeight: 700 };
          if (isStart) text = cc[2];
        } else if (warn) {
          style = { background: '#fbdada' };
        }
        cells.push({ key: `r${ri}d${d}`, cls, style, text });
      }
      return cells;
    });
  }, [today, rows, before, days]);

  // 今日の位置へスクロール
  useEffect(() => {
    if (!today) return;
    const sc = scrollRef.current;
    if (!sc) return;
    sc.scrollLeft = before * COLW;
    const m = sc.scrollWidth - sc.clientWidth;
    setLever(m > 0 ? (sc.scrollLeft / m) * 1000 : 0);
  }, [today, range, before]);

  const onLever = (v: number) => {
    setLever(v);
    const sc = scrollRef.current;
    if (!sc) return;
    const m = sc.scrollWidth - sc.clientWidth;
    sc.scrollLeft = (v / 1000) * m;
  };
  const onScroll = () => {
    const sc = scrollRef.current;
    if (!sc) return;
    const m = sc.scrollWidth - sc.clientWidth;
    setLever(m > 0 ? (sc.scrollLeft / m) * 1000 : 0);
  };

  return (
    <div className={styles.gtComp}>
      <div className={styles.gtTools}>
        <label>表示範囲</label>
        <select value={range} onChange={(e) => setRange(e.target.value)}>
          {GANTT_RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <span className={styles.sub}>今日基準</span>
        <span className={styles.gtLegend}>
          <span>
            <i style={{ background: '#dbeafe' }} />
            予約
          </span>
          <span>
            <i style={{ background: '#dcfce7' }} />
            貸出
          </span>
          <span>
            <i style={{ background: '#fef3c7' }} />
            整備
          </span>
          <span>
            <i style={{ background: '#b91c1c' }} />
            自賠/車検 期限
          </span>
          <span>
            <i style={{ background: '#fbdada' }} />
            期限1ヶ月前
          </span>
        </span>
      </div>

      {!today ? (
        <div className={styles.gtLoading}>ガントを準備中…</div>
      ) : (
        <>
          <div className={`${styles.gtBody} ${compact ? styles.gtBodyCompact : ''}`}>
            <div className={styles.gtFixed}>
              <div className={styles.gtCorner}>車両 / 管理番号</div>
              {rows.map((r) => (
                <div
                  key={r.code}
                  className={styles.gtLabel}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                  style={onRowClick ? { cursor: 'pointer' } : undefined}
                >
                  <b>{r.name}</b>
                  <span className="mono">
                    {r.code}・{r.store}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.gtScroll} ref={scrollRef} onScroll={onScroll}>
              <div className={styles.gtGrid} style={{ gridTemplateColumns: `repeat(${days}, ${COLW}px)` }}>
                {header.map((c) => (
                  <div key={c.key} className={c.cls} style={c.style}>
                    {c.text}
                    <span style={{ fontSize: 9, fontWeight: 600 }}>{c.wd}</span>
                  </div>
                ))}
                {bodyCells.map((row) =>
                  row.map((c) => (
                    <div key={c.key} className={c.cls} style={c.style}>
                      {c.text}
                    </div>
                  )),
                )}
              </div>
            </div>
          </div>
          <div className={styles.gtLever}>
            ◀
            <input
              type="range"
              min={0}
              max={1000}
              value={lever}
              onChange={(e) => onLever(Number(e.target.value))}
              aria-label="左右スクロール"
            />
            ▶
          </div>
        </>
      )}
    </div>
  );
}
