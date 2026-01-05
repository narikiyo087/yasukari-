import Head from 'next/head';

export default function RentalBikeTermsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Head>
        <title>レンタルバイク利用規約</title>
      </Head>

      <header className="space-y-2">
        <p className="text-sm text-gray-600">附則: 令和7年6月15日施行</p>
        <h1 className="text-3xl font-bold">レンタルバイク利用規約</h1>
        <p className="text-sm leading-relaxed text-gray-700">
          株式会社ケイジェット (以下「当店」という) は、この利用規約 (以下「本規約」という) の定めるところにより、
          貸渡自動二輪車 (以下「レンタルバイク」という) を借受人に貸渡し、借受人はこれを借り受けるものとします。
          なお、本規約に定めのない事項については、法令又は一般の慣習によるものとします。
          当店は、本規約の趣旨、法令、行政通達及び一般の慣習に反しない範囲で特約を定めることがあります。
          特約がある場合、その特約が本規約に優先します。
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">第 1 章　総　則</h2>
        <h3 className="text-xl font-semibold">第 1 条 (本規約の適用)</h3>
        <p className="leading-relaxed">
          レンタルバイクの貸渡し及び貸渡契約は、本規約の定めるところにより行い、借受人はこれに従うものとします。
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">第 2 章　保険・補償制度</h2>
        <h3 className="text-xl font-semibold">第 2 条 (保険及び補償制度)</h3>
        <div className="space-y-2 leading-relaxed">
          <p>
            当店は、あいおいニッセイ同和損保株式会社のタフビズ事業用自動車総合保険 (以下「本保険」という) 及び当店所定の補償制度に基づき、
            次の補償を提供します。具体的な補償額等は別掲の料金表によります。
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>対人補償 : 1 名につき無制限 (自賠責保険を含む)</li>
            <li>対物補償 : 1 事故につき別掲金額</li>
            <li>搭乗者傷害補償 : 1 名につき別掲金額 (原付 (125cc 以下) 除く)</li>
            <li>車両補償 (オプション) : 加入者は 1 事故につき別掲補償制度による支払いまで、未加入者は時価額を負担</li>
            <li>盗難補償 (オプション) : 加入者は別掲補償制度による支払いまで、管理不備による盗難は対象外。未加入者は時価額を負担</li>
          </ul>
          <p>前項の免責額及び本保険の給付を超える損害は借受人の負担とします。</p>
          <p>本保険の免責事由に該当する場合、又は警察の事故証明がない場合は給付されません。</p>
        </div>

        <h3 className="text-xl font-semibold">第 3 条 (賠償及び営業補償)</h3>
        <div className="space-y-2 leading-relaxed">
          <p>借受人は、事故、盗難、借受人の責めに帰すべき事由による故障、汚損等により当店及び第三者に生じた損害を賠償し、営業補償を支払うものとします。</p>
          <p>車両損害及び営業補償の支払基準は別掲の料金表によります。オプション加入の有無により上限額が異なります。</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">第 3 章　予約</h2>
        <h3 className="text-xl font-semibold">第 4 条 (予約の申込み)</h3>
        <p className="leading-relaxed">
          借受人は、本規約及び別掲料金表に同意のうえ、別に定める方法で車種クラス、借受開始日時、借受場所、期間、返還場所、運転者、
          オプション (ヘルメット、グローブ、車両補償、盗難補償) 等を明示して、当店の指定する方法で予約を申込みます。
        </p>

        <h3 className="text-xl font-semibold">第 5 条 (予約の変更)</h3>
        <p className="leading-relaxed">借受人は、予約条件を変更する場合、あらかじめ当店の承諾を受けるものとします。</p>

        <h3 className="text-xl font-semibold">第 6 条 (予約の取消し)</h3>
        <ul className="list-disc pl-5 space-y-1 leading-relaxed">
          <li>借受人は、借受開始日の 4 日前までにキャンセル手続きをした場合、キャンセル料は無料とします。</li>
          <li>借受人は、借受開始日の 3 日前から当日までにキャンセルした場合、基本レンタル料金の 50% をキャンセル料として支払うものとします。</li>
          <li>借受人は、借受開始日の前日までにキャンセルの手続きをしない限り、予約を取り消せず、基本料金を支払うものとします。なお、支払済の料金は返還されません。</li>
          <li>当店都合により予約を取消す場合、受領済の料金を無利息で返還します。</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">第 4 章　貸渡し</h2>
        <h3 className="text-xl font-semibold">第 7 条 (貸渡契約の締結)</h3>
        <ul className="list-disc pl-5 space-y-1 leading-relaxed">
          <li>借受人は第 4 条に定める予約条件を明示し、当店は本規約及び料金表に基づき貸渡条件を明示して契約を締結します。</li>
          <li>契約時、借受人及び運転者の運転免許証及び本人確認書類の提示を求め、写しを取得します。</li>
          <li>当店が必要と認める場合、連絡先 (携帯電話番号等) を告知してもらいます。</li>
          <li>支払方法は原則クレジットカードとし、別に指定する場合があります。</li>
        </ul>

        <h3 className="text-xl font-semibold">第 8 条 (貸渡契約の拒絶)</h3>
        <div className="space-y-2 leading-relaxed">
          <p>借受人又は運転者が以下のいずれかに該当するとき、当店は契約を締結しません。なお、既に予約が成立していたときは、予約の取消しがあったものと扱います。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>必要な運転免許証の提示がない</li>
            <li>酒気帯び、薬物等による中毒症状があると認められる</li>
            <li>暴力団関係、反社会的勢力に該当</li>
            <li>運転者が未成年 (ヘルメット等要件未達)</li>
            <li>過去に本規約違反や支払滞納、当店及び他事業者の貸渡約款違反歴がある</li>
            <li>その他当店が適当でないと認めたとき</li>
          </ul>
          <p>
            50cc 原付、ジャイロキャノピー、PCX以外の車両については、商用目的での貸渡しをお断りする場合があります。また、これらの車両については、
            車両の写真や任意保険の明細、標識交付証明書、自動車損害賠償責任保険証明書等の書類（データを含みます）をお渡しできない場合があります。
          </p>
        </div>

        <h3 className="text-xl font-semibold">第 9 条 (貸渡証の交付及び携帯)</h3>
        <ul className="list-disc pl-5 space-y-1 leading-relaxed">
          <li>当店は貸渡時に地方運輸局長が定める貸渡証をデジタルで交付し、Web ページから表示可能とします。</li>
          <li>借受人及び運転者は使用中、貸渡証を携帯しなければなりません。</li>
          <li>紛失時は直ちに通知し、返還時に併せて返却します。</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">第５章　使用</h2>
        <h3 className="text-xl font-semibold">第 10 条 (管理責任)</h3>
        <p className="leading-relaxed">
          借受人は善良な管理者の注意義務をもって使用・保管し、第三者への転貸、改造、競技利用等は禁止します。
        </p>

        <h3 className="text-xl font-semibold">第 11 条 (日常点検整備)</h3>
        <ul className="list-disc pl-5 space-y-1 leading-relaxed">
          <li>借受人は使用前に法定の日常点検整備を行い、異常を発見した場合は運転を中止し当店に連絡します。</li>
          <li>借受人及び運転者は、本車両を使用するにあたり、別掲走行制限距離を超えて走行する場合、速やかにオイル交換その他必要な整備を実施しなければなりません。</li>
          <li>前項の整備を怠ったことに起因する故障・損傷については、本規約第 2 章の補償制度が適用されず、借受人が全額を負担するものとします。</li>
          <li>当店が必要と認める場合、当店は借受人に整備履歴の提示を求めることができ、提示がない場合は当店は本契約を解除できるものとします。</li>
        </ul>

        <h3 className="text-xl font-semibold">第 12 条 (禁止行為)</h3>
        <ul className="list-disc pl-5 space-y-1 leading-relaxed">
          <li>無免許運転、飲酒運転、ヘルメット未着用</li>
          <li>競技・サーキット走行、他車の牽引</li>
          <li>日本国外への持ち出し</li>
          <li>本規約違反その他公序良俗に反する行為</li>
        </ul>

        <h3 className="text-xl font-semibold">第 13 条 (使用制限)</h3>
        <div className="space-y-2 leading-relaxed">
          <p>以下の走行環境での利用を禁止します。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>海岸 (砂地や海水の影響がある場所)</li>
            <li>河川敷や林間等の未整備路</li>
            <li>大量の粉塵が発生しやすい場所</li>
            <li>地面の凸凹が連続する道路 (深い陥没等)</li>
            <li>スリップしやすい路面 (濡れ木道や氷結路等)</li>
            <li>高さ 3cm 以上の障害物が多数ある未舗装路</li>
          </ul>
          <p className="text-sm text-gray-700">※ただし、道路上の小さな段差や一時的な工事用カバーを越える等の走行は除きます。</p>
        </div>

        <h3 className="text-xl font-semibold">第 14 条 (装備品の破損に関する弁済)</h3>
        <div className="space-y-2 leading-relaxed">
          <p>借受人は、レンタルバイクと共に貸与された装備品 (以下、装備品という) について、使用中に破損、紛失、著しい汚損等の損害を生じさせた場合、別掲の料金表に基づき、その損害を弁済するものとします。</p>
          <p>装備品の損害が当店の責めに帰すべき事由によると合理的に判断される場合、法令により借受人の弁済義務が制限される場合を除き、原則として借受人の責任により弁済されるものとします。</p>
          <p>弁済対象及び金額等の詳細は、別掲の料金表によります。</p>
        </div>

        <h3 className="text-xl font-semibold">第 15 条 (サービス装備の免責)</h3>
        <p className="leading-relaxed">当店はスマホスタンド、シガーソケット、ETC 等をサービスの一環として貸し出しますが、これらの動作保証及びこれらによって生じた事故・損害について責任を負いません。</p>

        <h3 className="text-xl font-semibold">第 16 条 (違法駐車への対応)</h3>
        <ul className="list-disc pl-5 space-y-1 leading-relaxed">
          <li>借受人または運転者が違法駐車した場合、自ら警察署に出頭し反則金等を納付し、レッカー等の費用を負担します。</li>
          <li>当店が違反処理を代理して反則金を支払った場合、違反金相当額及び手間賃として別掲金額を借受人に請求します。</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">第６章　返還</h2>
        <h3 className="text-xl font-semibold">第 17 条 (返還責任)</h3>
        <p className="leading-relaxed">借受人は借受期間満了時までに所定の返還場所 (足立小台本店又は三ノ輪店舗) に返還します。返却期限までに来店しなかった場合、返還遅滞として別途遅延料金を請求します。</p>

        <h3 className="text-xl font-semibold">第 18 条 (燃料返却)</h3>
        <p className="leading-relaxed">借受人は燃料タンクを満タンにして返却しなければなりません。満タン返却でない場合、別掲料金表に定める燃料補充違約金を支払うものとします。</p>

        <h3 className="text-xl font-semibold">第 19 条 (返還時の確認)</h3>
        <p className="leading-relaxed">借受人は当店立会いのもとレンタルバイクを返還し、通常使用による摩耗を除き引渡時の状態で返却します。返還後の遺留品について当店は保管責任を負いません。</p>

        <h3 className="text-xl font-semibold">第 20 条 (借受期間変更及び更新)</h3>
        <ul className="list-disc pl-5 space-y-1 leading-relaxed">
          <li>借受人は期間延長を希望する場合、返却予定日の 3 営業日前から足立小台本店で手続きし、新たな返還日を設定のうえ継続利用できます。</li>
          <li>上記期日以前の延長希望は事前相談により受付可能とします。</li>
          <li>期間変更に伴う貸渡料金は変更後の期間に対応する料金を支払います。</li>
        </ul>

        <h3 className="text-xl font-semibold">第 21 条 (契約の解約)</h3>
        <p className="leading-relaxed">借受人は借受開始日の前日までに Web 問い合わせまたはメールで予約番号等を通知し解約手続きを行えるものとし、解約は予約の取消しとみなします。</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">第 7 章　故障・事故・盗難時の措置</h2>
        <h3 className="text-xl font-semibold">第 22 条 (故障発生時の措置)</h3>
        <p className="leading-relaxed">借受人及び運転者は、異常・故障発見時は直ちに運転中止し当店の指示に従います。</p>

        <h3 className="text-xl font-semibold">第 23 条 (事故発生時の措置)</h3>
        <p className="leading-relaxed">借受人及び運転者は、事故時は法令手続きのうえ当店及び保険会社に速やかに報告し、当店指定工場での修理、示談を行う場合は当店の承諾を要します。</p>

        <h3 className="text-xl font-semibold">第 24 条 (盗難発生時の措置)</h3>
        <p className="leading-relaxed">借受人及び運転者は、盗難時は直ちに最寄り警察に通報し当店に報告、調査に協力します。事故・盗難時は可及的速やかに足立小台本店に来店しなければならず、当店に所定の預り金を預けるものとします。当店は、過失割合確定後返還すべき金額があれば借受人に返還します。</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">第 8 章　賠償及び補償</h2>
        <h3 className="text-xl font-semibold">第 25 条 (賠償責任及び補償適用)</h3>
        <p className="leading-relaxed">本保険及び補償制度の免責事由に該当しない限り、第 2 章に定める補償限度内で支払われます。免責事項該当時及び補償限度超過分は借受人負担です。</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">第 9 章　貸渡契約の解除</h2>
        <h3 className="text-xl font-semibold">第 26 条 (解除事由)</h3>
        <p className="leading-relaxed">借受人又は運転者が本規約違反、無断延長、禁止行為をした場合、当店は通知催告なしに契約を解除することができ、借受人は直ちにレンタルバイクを返還します。なお、当店は受領済の料金を返還しません。</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">第 10 章　遅延損害金</h2>
        <h3 className="text-xl font-semibold">第 27 条 (遅延料金)</h3>
        <ul className="list-disc pl-5 space-y-1 leading-relaxed">
          <li>借受人は、借受期間超過返還時はクラスごと別掲の 1 日当たり遅延料金を支払います。</li>
          <li>前項にかかわらず、借受人の責に依らない交通事情や災害・犯罪等のやむを得ない事情により遅延し、事前または直後に当店へ連絡をした場合は適用しません。</li>
        </ul>

        <h3 className="text-xl font-semibold">第 28 条 (相殺)</h3>
        <p className="leading-relaxed">当店は借受人に対する金銭債務を借受人の当店に対する債務といつでも相殺できます。</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">第 11 章　料金</h2>
        <h3 className="text-xl font-semibold">第 29 条 (貸渡料金の構成)</h3>
        <p className="leading-relaxed">貸渡料金は基本料金、オプション料 (ヘルメット・グローブ)、車両補償料、盗難補償料、繁忙期料金 (GW、お盆、年末年始) 等の合計です。別途料金表に明示します。</p>

        <h3 className="text-xl font-semibold">第 30 条 (料金改定)</h3>
        <p className="leading-relaxed">貸渡料金及び別掲料金表は予告なく変更することがあります。</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">第 12 章　禁止行為による登録拒否</h2>
        <h3 className="text-xl font-semibold">第 31 条 (ブラックリスト登録)</h3>
        <div className="space-y-2 leading-relaxed">
          <p>以下の行為があった場合又はそのおそれある場合、当店は当該借受人（申込人）をブラックリストに登録し貸渡しを拒否します。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>キャンセル料金未納</li>
            <li>駐車禁止を月 2 回以上繰り返す、警察クレーム発生</li>
            <li>遅滞が 2 日以上続く、月 2 回以上遅滞</li>
            <li>スタッフへの強要・恐喝・暴力</li>
            <li>スタッフ立会いなく乗り捨て返却</li>
            <li>借受人の粗暴な扱いによってレンタルバイクを 1 ヶ月 2 台以上故障させた</li>
            <li>鍵の付けっぱなしによってレンタルバイクを盗難された</li>
            <li>弁済金未納</li>
            <li>不当かつ当店の営業を妨げるまでの執拗な抗議</li>
            <li>その他上記に準ずる行為</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">第 13 章　個人情報の取扱い</h2>
        <h3 className="text-xl font-semibold">第 32 条 (利用目的)</h3>
        <p className="leading-relaxed">当店は以下の目的で借受人及び運転者の個人情報を取得・利用します。また、個人情報の取扱いに関する業務を第三者に委託する場合があります。</p>
        <ul className="list-disc pl-5 space-y-1 leading-relaxed">
          <li>貸渡契約締結時の貸渡証作成等、レンタルバイク事業許可の条件として義務付けられている事項を遂行するため</li>
          <li>借受人又は運転者にレンタルバイク及びこれらに関連したサービスの提供をするため</li>
          <li>レンタルバイク等当店の商品・サービス、イベント、キャンペーン等の宣伝広告物の送付、eメールの送信等の方法による案内を行うため</li>
          <li>貸渡契約締結にあたり借受人及び運転者の本人確認及び審査を行うため</li>
          <li>当社の商品・サービスの企画開発、顧客満足度向上等のためのアンケート調査を行うため</li>
          <li>個人情報を統計的に集計、分析し、個人を識別、特定できない形態に加工した統計データを作成するため</li>
          <li>損害保険及びこれに付帯・関連するサービスの提供等の損害保険代理業の遂行に必要な対応を行うため</li>
          <li>各種お問い合わせに対する対応を行うため</li>
          <li>法令の定めに基づき借受人又は運転者への対応を行うため</li>
          <li>当社の事業活動遂行に伴う債券回収、紛争処理解決等を行うため</li>
          <li>その他当社の事業活動遂行に必要な管理及び対応を行うため</li>
        </ul>

        <h3 className="text-xl font-semibold">第 33 条 (同意)</h3>
        <div className="space-y-2 leading-relaxed">
          <p>借受人は以下に該当する場合、個人情報が当社において貸渡注意者リストとして登録・利用されることに同意するものとします。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>放置違反金納付命令を受けたとき</li>
            <li>駐車違反関係費用未払</li>
            <li>不返還認定時</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">第 14 章　細則・管轄</h2>
        <h3 className="text-xl font-semibold">第 34 条 (細則)</h3>
        <p className="leading-relaxed">当店は本規約の細則を別に定め、店舗掲示・パンフレット等に記載します。</p>

        <h3 className="text-xl font-semibold">第 35 条 (管轄裁判所)</h3>
        <p className="leading-relaxed">本規約に関する紛争は当店本店又は支店所在地管轄の簡易裁判所又は地方裁判所を専属的合意管轄とします。</p>
      </section>
    </div>
  );
}
