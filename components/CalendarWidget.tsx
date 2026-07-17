import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export type CalendarPost = {
  date: string; // YYYY-MM-DD
  slug: string;
  title: string;
};

function parseInitialDate(value?: string) {
  if (!value) return new Date(0);
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const withMidnight = new Date(`${value}T00:00:00`);
  if (!Number.isNaN(withMidnight.getTime())) return withMidnight;
  return new Date(0);
}

export default function CalendarWidget({
  posts = [],
  initialDate,
}: {
  posts?: CalendarPost[];
  initialDate?: string;
}) {
  const initial = useMemo(() => parseInitialDate(initialDate), [initialDate]);
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth()); // 0 indexed
  const [selected, setSelected] = useState<CalendarPost[] | null>(null);

  useEffect(() => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }, []);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: (number | null)[][] = [];
  let day = 1 - firstDay;

  for (let i = 0; i < 6; i++) {
    const week: (number | null)[] = [];
    for (let j = 0; j < 7; j++) {
      if (day < 1 || day > daysInMonth) {
        week.push(null);
      } else {
        week.push(day);
      }
      day++;
    }
    weeks.push(week);
  }

  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  const postMap = new Map<string, CalendarPost[]>();
  posts.forEach((p) => {
    if (!postMap.has(p.date)) postMap.set(p.date, []);
    postMap.get(p.date)!.push(p);
  });

  const handleDayClick = (d: number | null) => {
    if (!d) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayPosts = postMap.get(dateStr);
    if (dayPosts) setSelected(dayPosts);
  };

  const prevMonth = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  if (selected) {
    return (
      <div className="border rounded p-2 bg-white shadow text-sm animate-fade">
        <button onClick={() => setSelected(null)} className="text-red-700 hover:underline mb-2">
          &larr; カレンダーへ戻る
        </button>
        <ul className="ml-2 list-disc">
          {selected.map((p) => (
            <li key={p.slug} className="mt-1">
              <Link href={`/manual_for_system/${p.slug}`} className="hover:underline text-red-700">
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="border rounded p-2 bg-white shadow text-sm animate-fade">
      <div className="flex justify-between items-center mb-2">
        <button onClick={prevMonth} className="px-2 hover:text-red-700">&lt;</button>
        <span className="font-bold">{year}年{month + 1}月</span>
        <button onClick={nextMonth} className="px-2 hover:text-red-700">&gt;</button>
      </div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            {weekdays.map((d) => (
              <th key={d} className="border p-1">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, i) => (
            <tr key={i}>
              {week.map((d, j) => {
                const dateStr = d
                  ? `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                  : '';
                const hasPost = postMap.has(dateStr);
                return (
                  <td
                    key={j}
                    className={
                      'border h-8 w-8 text-center cursor-pointer transition ' +
                      (hasPost ? 'bg-red-50 hover:bg-red-100' : 'text-slate-400 cursor-default')
                    }
                    onClick={() => handleDayClick(d)}
                  >
                    {d || ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
