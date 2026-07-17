import Head from 'next/head';
import Link from 'next/link';
import { FaArrowDown } from 'react-icons/fa';

export default function GuidePage() {
  const faqs = [
    {
      q: '予約はいつまで可能ですか？',
      a: 'ご利用予定日の前営業日17時までご予約いただけます。',
    },
    {
      q: 'ヘルメットをレンタルできますか？',
      a: 'オプションとしてヘルメットレンタルをご用意しています。お申込みがない場合はご持参ください。',
    },
    {
      q: '走行距離の上限はありますか？',
      a: '車種クラスごとの目安距離を設定しています。詳しくは表をご確認ください。',
    },
    {
      q: 'キャンセルしたい場合は？',
      a: 'キャンセルは info@yasukari.com までメールでご連絡ください（受付17時まで、17時以降は翌営業日扱い）。お名前・お申込み車種・ご予約番号を明記してください。',
    },
    {
      q: 'キャンセル料はいつから発生しますか？',
      a: 'ご利用日の3営業日前から基本料金の50%を頂戴します。定休日を挟む場合は前営業日までにご連絡ください。',
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto p-6 space-y-8 text-sm leading-relaxed">
      <Head>
        <title>ご利用案内 - ヤスカリ</title>
      </Head>

      <img
        src="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/goriyou-barner.jpg"
        alt="ご利用案内バナー"
        className="w-1/2 h-auto mb-6 rounded-md"
      />

      <h1 className="text-2xl font-bold mb-6 text-center text-slate-900">ご利用案内</h1>

      {/* ご予約 */}
      <section className="border border-slate-200 rounded-lg bg-white p-4 shadow-sm space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">01. ご予約について</h2>
        <p>各車両ページよりスケジュールを確認しご予約ください。18歳未満のお客様はご利用いただけません。</p>
        <ul className="list-disc list-inside space-y-1">
          <li>予約可能時間：ご利用予定日90日前から前営業日17時まで</li>
          <li>お支払い方法：クレジットカードのみ</li>
          <li>
            予約内容の変更は<Link href="/contact" className="text-red-600 underline ml-1">お問い合わせ</Link>からご連絡の上、再度ご予約をお願いします。
          </li>
          <li>キャンセル料：4日前まで無料、3日前〜当日はレンタル料金の50％</li>
        </ul>
      </section>
      <FaArrowDown className="mx-auto text-2xl text-slate-400" />

      {/* ご来店 */}
      <section className="border border-slate-200 rounded-lg bg-white p-4 shadow-sm space-y-2">
        <h2 className="text-lg font-semibold text-slate-900 mt-6">02. ご来店</h2>
        <p>ご来店時は下記をお持ちください。ヘルメットをオプション申込されていない場合はご持参ください。</p>
        <ul className="list-disc list-inside space-y-1">
          <li>免許証</li>
          <li>ヘルメット</li>
        </ul>
        <p>ご予約日の10時から18時30分の間にお越しください。（手続きに時間がかかるため）</p>
        <p>ヤスカリはリバイクルK-JETが運営しております。ご来店の際はスタッフまでお声かけください。</p>
      </section>
      <FaArrowDown className="mx-auto text-2xl text-slate-400" />

      {/* ご利用 */}
      <section className="border border-slate-200 rounded-lg bg-white p-4 shadow-sm space-y-2">
        <h2 className="text-lg font-semibold text-slate-900 mt-6">03. ご利用</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>契約者様以外への貸し出し・返却はできません。</li>
          <li>ご契約者様以外の運転は不可です。（法人契約の場合はご相談ください）</li>
          <li>駐車違反となった場合は警察で反則金をお支払いの上、領収書を返却時にご提示ください。確認できない場合は1件につき2万円をご請求いたします。</li>
        </ul>
        <h3 className="font-semibold mt-2 text-slate-900">走行距離の目安</h3>
        <p>目安以上の距離を走行する場合は整備が必要です。メンテナンスを怠り故障や損害が発生した場合は車両の時価額を請求いたします。</p>
        <table className="w-full border border-slate-200 text-center text-xs text-slate-700">
          <thead>
            <tr>
              <th className="border border-slate-200 p-2 bg-slate-50 font-semibold text-slate-900">クラス</th>
              <th className="border border-slate-200 p-2 bg-slate-50 font-semibold text-slate-900">1日</th>
              <th className="border border-slate-200 p-2 bg-slate-50 font-semibold text-slate-900">3日</th>
              <th className="border border-slate-200 p-2 bg-slate-50 font-semibold text-slate-900">2週間</th>
              <th className="border border-slate-200 p-2 bg-slate-50 font-semibold text-slate-900">1カ月</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="border border-slate-200 p-2 bg-slate-50 font-semibold text-slate-900 text-left">原付</th>
              <td className="border border-slate-200 p-2">200km</td>
              <td className="border border-slate-200 p-2">600km</td>
              <td className="border border-slate-200 p-2">800km</td>
              <td className="border border-slate-200 p-2">一度持ち込みで+800km</td>
            </tr>
            <tr>
              <th className="border border-slate-200 p-2 bg-slate-50 font-semibold text-slate-900 text-left">125cc以下</th>
              <td className="border border-slate-200 p-2">300km</td>
              <td className="border border-slate-200 p-2">800km</td>
              <td className="border border-slate-200 p-2">1000km</td>
              <td className="border border-slate-200 p-2">一度持ち込みで+1000km</td>
            </tr>
            <tr>
              <th className="border border-slate-200 p-2 bg-slate-50 font-semibold text-slate-900 text-left">126cc~</th>
              <td className="border border-slate-200 p-2">500km</td>
              <td className="border border-slate-200 p-2">1000km</td>
              <td className="border border-slate-200 p-2">1500km</td>
              <td className="border border-slate-200 p-2">-</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2">走行中に不具合が生じた場合は営業時間内に契約店舗へご連絡ください。営業時間外に走行不能となった場合はロードサービスをご利用ください。</p>
      </section>
      <FaArrowDown className="mx-auto text-2xl text-slate-400" />

      {/* ご返却 */}
      <section className="border border-slate-200 rounded-lg bg-white p-4 shadow-sm space-y-2">
        <h2 className="text-lg font-semibold text-slate-900 mt-6">04. ご返却</h2>
        <p>ご返却日の10時から18時30分の間にお越しください。（手続きに時間がかかるため）</p>
        <p>返却時にガソリンが満タンでない場合は当社規定の費用を頂戴します。</p>
        <ul className="list-disc list-inside space-y-1">
          <li>原付 3000円</li>
          <li>原付二種・ジャイロキャノピー 5000円</li>
          <li>それ以上 5000円</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-center text-slate-900">よくある質問</h2>
        <ul className="space-y-4">
          {faqs.map((f, idx) => (
            <li key={idx} className="border border-slate-200 rounded-lg bg-white p-4 shadow-sm">
              <p className="font-semibold">Q. {f.q}</p>
              <p className="mt-2">A. {f.a}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="text-center text-sm">
        <Link href="/contact" className="text-red-600 underline">
          お問い合わせはこちら
        </Link>
      </section>
    </div>
  );
}
