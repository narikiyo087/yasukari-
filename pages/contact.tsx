import Head from 'next/head';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

const CATEGORY_OPTIONS = [
  { value: 'reservation', label: '予約について' },
  { value: 'extension', label: '延長希望' },
  { value: 'insurance', label: '任意保険証希望' },
  { value: 'trouble', label: '車両・事故トラブル' },
  { value: 'other', label: 'その他' },
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value);
  const [reservationId, setReservationId] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice('');
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, category, reservationId, message, locale: 'ja' }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || 'お問い合わせの送信に失敗しました。');
      }

      setNotice(payload.message ?? 'お問い合わせを受け付けました。');
      setName('');
      setEmail('');
      setCategory(CATEGORY_OPTIONS[0].value);
      setReservationId('');
      setMessage('');
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'お問い合わせの送信に失敗しました。'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 text-sm leading-relaxed">
      <Head>
        <title>お問い合わせ - ヤスカリ</title>
        <meta name="description" content="ヤスカリへのお問い合わせ窓口。電話・メール・住所のご案内と、メール受付時間・記載事項についてご説明します。" />
        <link rel="canonical" href="https://yasukari.com/contact" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ヤスカリ" />
        <meta property="og:title" content="お問い合わせ - ヤスカリ" />
        <meta property="og:description" content="ヤスカリへのお問い合わせ窓口。電話・メール・住所のご案内と、メール受付時間・記載事項についてご説明します。" />
        <meta property="og:url" content="https://yasukari.com/contact" />
        <meta property="og:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="お問い合わせ - ヤスカリ" />
        <meta name="twitter:description" content="ヤスカリへのお問い合わせ窓口。電話・メール・住所のご案内と、メール受付時間・記載事項についてご説明します。" />
        <meta name="twitter:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
      </Head>
      <h1 className="text-2xl font-bold mb-6 text-center text-slate-900">お問い合わせ</h1>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold mb-3 text-slate-900">お問い合わせフォーム</h2>
        {notice && (
          <p className="mb-3 rounded bg-green-50 border border-green-200 p-3 text-green-800">
            {notice}
          </p>
        )}
        {error && (
          <p className="mb-3 rounded bg-red-50 border border-red-200 p-3 text-red-700">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="contactName" className="block font-semibold mb-1">
              お名前<span className="text-red-600 ml-1">*</span>
            </label>
            <input
              id="contactName"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded border border-slate-300 p-2"
              placeholder="山田 太郎"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="contactEmail" className="block font-semibold mb-1">
              メールアドレス<span className="text-red-600 ml-1">*</span>
            </label>
            <input
              id="contactEmail"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded border border-slate-300 p-2"
              placeholder="sample@example.com"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="contactCategory" className="block font-semibold mb-1">
              お問い合わせ種別
            </label>
            <select
              id="contactCategory"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded border border-slate-300 p-2 bg-white"
              disabled={submitting}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="contactReservationId" className="block font-semibold mb-1">
              予約番号（お持ちの場合）
            </label>
            <input
              id="contactReservationId"
              type="text"
              value={reservationId}
              onChange={(event) => setReservationId(event.target.value)}
              className="w-full rounded border border-slate-300 p-2"
              placeholder="例: rs_1234567890"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="contactMessage" className="block font-semibold mb-1">
              お問い合わせ内容<span className="text-red-600 ml-1">*</span>
            </label>
            <textarea
              id="contactMessage"
              required
              rows={6}
              maxLength={4000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full rounded border border-slate-300 p-2"
              placeholder="ご希望の車種・日時、ご質問内容などをご記入ください。"
              disabled={submitting}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-red-600 py-2.5 font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? '送信中...' : '送信する'}
          </button>
          <p className="text-xs text-slate-500">
            送信後、受付確認メールを自動でお送りします。営業日10時〜17時の間に担当者よりご返信いたします。
          </p>
        </form>
      </section>

      <p className="mb-4">お電話・メールでのご連絡先は下記のとおりです。</p>
      <ul className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <li>電話: 03-5856-8200</li>
        <li>メール: info@yasukari.com</li>
        <li>住所: 東京都足立区小台2-9-7 1階</li>
      </ul>

      <section className="space-y-2 mt-6">
        <p>
          ご利用中のお客様を除き、お電話でのお問い合わせやご予約は承っておりま
          せん。会員登録の上、ホームページからご予約ください。
        </p>
        <p>
          メールでの受付時間は営業日10時〜17時です。17時以降や月曜日などの店休
          日にいただいたメールは翌営業日の対応となります。お問い合わせの際はお名
          前とご予約番号、ご希望車種を明記してください。
        </p>
        <p>
          任意保険証の控えが必要な方は、件名「任意保険証希望」として予約番号、氏
          名、予約車種、貸出日時、メールアドレスを添えて info@yasukari.com までご
          連絡ください。
        </p>
        <p>
          延長をご希望の場合は、件名「延長希望」として予約番号・氏名・予約車種・
          貸出日時を明記の上、17時までに info@yasukari.com へご連絡ください。タイミ
          ングによってはご希望に添えない場合があります。
        </p>
      </section>

      <p className="mt-6">
        よくある質問は
        <Link href="/beginner" className="text-red-600 underline ml-1">
          ご利用案内
        </Link>
        でもご確認いただけます。
      </p>
    </div>
  );
}
