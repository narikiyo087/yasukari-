import Head from 'next/head';

export default function InsurancePage() {
  const baseInsurances = [
    { label: '対人', description: '無制限 1名につき' },
    { label: '対物', description: '1,000万円 1事故につき、免責5万円' },
    { label: '搭乗者傷害', description: '1名につき500万円まで(死亡後遺障害のみ)＊原付を除く' },
  ];

  const vehicleCoverage = [
    ['50cc ～ 125cc', '1,650円', '2,200円', '3,300円', '6,600円'],
    ['126cc ～ 250cc', '2,200円', '4,400円', '5,500円', '11,000円'],
    ['251cc ～', '2,750円', '5,500円', '6,875円', '13,750円'],
  ];

  const theftCoverage = [
    ['50ccスクーター、ジャイロキャノピー', '1,100円', '補償対象外'],
    ['50ccミッション、125cc', '2,200円', ''],
    ['ビックスクーター、250ccミッション', '3,300円', ''],
    ['256〜400cc', '4,400円', ''],
    ['401cc〜', '5,500円', ''],
  ];

  const exclusions = [
    '無免許運転',
    '飲酒運転',
    '運転中にヘルメットを着用していない場合',
    '契約書記載の運転者以外の方の事故',
    '事故現場から警察への届け出を怠った場合（警察の事故証明が取得できない場合）',
    '勝手に相手側と示談した場合',
    '事故現場から出発店舗（または本部）への連絡を怠った場合',
    '貸渡時間を無断延長して事故を起こした場合',
    '盗難によって生じた車両損害',
    '定員をオーバーして走行した場合',
    '公道以外を走行した場合',
    '使用方法が劣悪なために生じた単体などの損傷や腐蝕の補修費',
    '各種テスト・競技への使用、または他車のけん引・後押しに使用した場合',
    '営業店内で他の車両や看板などを破損した場合',
    '操作ミスによる故障',
    '当社の貸渡約款の条項に違反して使用した場合',
    'その他保険約款の免責事項に該当する事故',
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 text-sm leading-relaxed space-y-6">
      <Head>
        <title>車両保険の内容について - ヤスカリ</title>
        <meta name="description" content="ヤスカリのレンタルバイクに付帯する任意保険と、車両補償・盗難補償オプションの内容・料金・免責についてご案内します。" />
        <link rel="canonical" href="https://yasukari.com/insurance" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ヤスカリ" />
        <meta property="og:title" content="車両保険の内容について - ヤスカリ" />
        <meta property="og:description" content="ヤスカリのレンタルバイクに付帯する任意保険と、車両補償・盗難補償オプションの内容・料金・免責についてご案内します。" />
        <meta property="og:url" content="https://yasukari.com/insurance" />
        <meta property="og:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="車両保険の内容について - ヤスカリ" />
        <meta name="twitter:description" content="ヤスカリのレンタルバイクに付帯する任意保険と、車両補償・盗難補償オプションの内容・料金・免責についてご案内します。" />
        <meta name="twitter:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
      </Head>
      <h1 className="text-2xl font-bold mb-6 text-center text-slate-900">車両保険の内容について</h1>

      <section className="space-y-4">
        <p>レンタルバイク『ヤスカリ』の基本料金には、以下の任意保険が付帯しています。</p>
        <ul className="list-disc list-inside space-y-1">
          {baseInsurances.map((item) => (
            <li key={item.label}>{item.label}：{item.description}</li>
          ))}
        </ul>
        <p>オプション車両補償（免責は1事故につき）への加入は任意です。加入しない場合は事故や転倒、破損等が発生した際、修理代金の全額をご負担いただきます。</p>
        <p>免責とは、事故を起こした際にお客様にご負担いただく最大のお支払金額です（事故1件毎にかかります）。例えば修理代金が20万円の場合、免責の5万円を上限としてご負担いただき、残り15万円分を車両補償でカバーいたします。</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2 text-slate-900">車両補償料金</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border border-slate-200 border-collapse text-center text-slate-700">
            <thead>
              <tr>
                <th className="border border-slate-200 p-3 bg-slate-50 font-semibold text-slate-900">クラス</th>
                <th className="border border-slate-200 p-3 bg-slate-50 font-semibold text-slate-900">1日</th>
                <th className="border border-slate-200 p-3 bg-slate-50 font-semibold text-slate-900">1週間</th>
                <th className="border border-slate-200 p-3 bg-slate-50 font-semibold text-slate-900">2週間</th>
                <th className="border border-slate-200 p-3 bg-slate-50 font-semibold text-slate-900">1ヶ月</th>
              </tr>
            </thead>
            <tbody>
              {vehicleCoverage.map((row, idx) => (
                <tr key={idx}>
                  {row.map((cell, i) => (
                    <td key={i} className="border border-slate-200 p-3">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2">営業補償は車両補償加入の有無に関わらず発生します。基準は車両補償の免責内容と同じです。自走可能な場合は免責2万円、自走不可能またはレッカー使用時は免責5万円となります。</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2 text-slate-900">盗難補償オプション</h2>
        <p>加入すると、バイクが盗難にあった場合にオートバイの時価額の50%を補償します。未加入の場合は時価額100%をご負担いただきます。</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border border-slate-200 border-collapse text-center text-slate-700 mt-2">
            <thead>
              <tr>
                <th className="border border-slate-200 p-3 bg-slate-50 font-semibold text-slate-900">クラス</th>
                <th className="border border-slate-200 p-3 bg-slate-50 font-semibold text-slate-900">料金</th>
                <th className="border border-slate-200 p-3 bg-slate-50 font-semibold text-slate-900">遅延の場合</th>
              </tr>
            </thead>
            <tbody>
              {theftCoverage.map((row, idx) => (
                <tr key={idx}>
                  {row.map((cell, i) => (
                    <td key={i} className="border border-slate-200 p-3">{cell || '-'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1">ロードサービスは180kmまで対応します。</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2 text-slate-900">補償対象外となる主な例</h2>
        <ul className="list-disc list-inside space-y-1">
          {exclusions.map((ex, idx) => (
            <li key={idx}>{ex}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
