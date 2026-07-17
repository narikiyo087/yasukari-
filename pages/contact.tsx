import Head from 'next/head';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 text-sm leading-relaxed">
      <Head>
        <title>お問い合わせ - ヤスカリ</title>
        <meta name="description" content="ヤスカリへのお問い合わせ窓口。電話・メール・住所のご案内と、メール受付時間・記載事項についてご説明します。" />
        <link rel="canonical" href="https://yasukari.com/contact" />
      </Head>
      <h1 className="text-2xl font-bold mb-6 text-center text-slate-900">お問い合わせ</h1>
      <p className="mb-4">下記の連絡先までお気軽にご連絡ください。</p>
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
