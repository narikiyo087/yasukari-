import Head from 'next/head'

export default function Minowa24HourRentalPage() {
  return (
    <>
      <Head>
        <title>三ノ輪店｜24時間レンタルの借り方・注意事項 - ヤスカリ</title>
      </Head>

      <div className="article-wrap">
        <span className="tag">お知らせ</span>
        <h1>
          三ノ輪店｜24時間いつでも借りられます
          <br />― レンタルの流れと注意事項 ―
        </h1>
        <p className="updated-at">更新日：2026年4月28日</p>

        <p>
          ヤスカリ三ノ輪店は、<strong>24時間365日いつでもバイクを借りられる無人店舗</strong>
          です。深夜・早朝でも好きなタイミングで利用できますが、スタッフが常駐していないため、利用前に必ずこのページをお読みください。
        </p>

        <div className="alert-box">
          <div className="alert-title">⚠️ 最初に必ずご確認ください</div>
          <ul>
            <li>
              <strong>三ノ輪店にスタッフは常駐していません。</strong>
            </li>
            <li>
              足立小台本店のスタッフが電話対応できるのは <strong>営業時間（10:00〜19:00）のみ</strong>{' '}
              です。
            </li>
            <li>
              営業時間外にトラブルが発生した場合、<strong>基本的にご自身で対処していただく必要があります。</strong>
            </li>
            <li>
              バイクの操作に不安がある方・スマートフォンの操作が苦手な方は、スタッフのいる
              <strong>足立小台本店</strong>のご利用をおすすめします。
            </li>
          </ul>
        </div>

        <h2>店舗別スタッフ対応時間</h2>

        <table className="store-table">
          <tbody>
            <tr>
              <th>店舗</th>
              <th>スタッフ</th>
              <th>営業時間</th>
            </tr>
            <tr>
              <td>
                <strong>足立小台本店</strong>
              </td>
              <td>
                <span className="badge-green">あり</span>
              </td>
              <td>10:00〜19:00（月・木定休）</td>
            </tr>
            <tr className="highlight">
              <td>
                <strong>三ノ輪店</strong>
              </td>
              <td>
                <span className="badge-red">常時不在</span>
              </td>
              <td>24時間利用可能（無人）</td>
            </tr>
          </tbody>
        </table>

        <p>
          電話での相談は足立本店の営業時間内のみ対応可能です。<strong>深夜・早朝・定休日はスタッフに連絡が取れません。</strong>
          あらかじめご了承ください。
        </p>

        <h2>レンタルの流れ</h2>

        <div className="video-placeholder">
          <div className="video-icon">▶️</div>
          <p className="video-title">手順説明動画（準備中）</p>
          <p className="video-note">実際の操作手順を動画でご確認いただけます</p>
        </div>

        <div className="steps">
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <div className="step-title">📱 ネットで予約・決済する</div>
              <ul>
                <li>ヤスカリ公式サイトから車種・日時を選択して予約します</li>
                <li>クレジットカードで決済まで完了させてください</li>
                <li>
                  予約完了後、<strong>入店用の暗証番号と乗る車両のナンバーがメールで届きます</strong>
                </li>
                <li>
                  <strong>レンタルする車両をまちがえないようにしてください。</strong>
                  マイページにお客様の乗るバイクが停まっている駐車Noが表示されています
                </li>
                <li>予約内容（日時・車種・オプション）を必ず確認してください</li>
              </ul>
              <div className="caution-box compact">
                <div className="caution-title">⚠️ 予約前に確認</div>
                返却時間を間違えると延滞料金が発生します。また、
                <strong>返却時間を過ぎるとドアの開錠コードが無効になり入店できなくなります。</strong>
                マイページでの返却操作もできなくなりますので、余裕を持った時間設定をおすすめします。
              </div>
            </div>
          </div>

          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <div className="step-title">🚶 店舗に到着・入店する</div>
              <ul>
                <li>予約メールに記載の<strong>暗証番号を入力</strong>してドアを開けます</li>
                <li>暗証番号は予約ごとに異なります。必ず最新のメールを確認してください</li>
              </ul>
              <div className="alert-box compact">
                <div className="alert-title">🚫 入店できない場合</div>
                <ul>
                  <li>
                    <strong>10:00〜19:00の場合：</strong>足立本店に電話でご連絡ください
                  </li>
                  <li>
                    <strong>19:00〜翌10:00の場合：</strong>スタッフへの連絡は翌営業日以降になります
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <div className="step-title">🔍 乗る前にバイクを点検する（必須！）</div>
              <p>
                乗り出す前に、以下を必ずチェックしてください。
                <strong>出発後に発見した損傷は、ご自身が付けたものとみなされる場合があります。</strong>
              </p>
              <ul className="checklist">
                <li>前後ブレーキが効くか</li>
                <li>ウインカーが前後左右で点滅するか</li>
                <li>ミラーが正しい位置にあるか</li>
                <li>タイヤの空気が十分に入っているか</li>
                <li>車体全体（前後左右）に傷・破損がないか</li>
              </ul>
              <div className="caution-box compact">
                <div className="caution-title">📸 傷や不具合を見つけたら</div>
                乗る前に必ず<strong>写真を撮ってください</strong>。そのうえで足立本店（10:00〜19:00）に連絡し、指示を仰いでください。時間外の場合は問い合わせフォームからご連絡ください。
              </div>
            </div>
          </div>

          <div className="step">
            <div className="step-num">4</div>
            <div className="step-body">
              <div className="step-title">🏍️ 出発する</div>
              <ul>
                <li>
                  まず<strong>近所を軽く試走</strong>して、操作感・ブレーキ・ウインカーに問題がないことを確認してください
                </li>
                <li>異音・振動・違和感がある場合は、すぐに戻って連絡してください</li>
                <li>問題なければ出発OK！楽しいツーリングを！</li>
              </ul>
            </div>
          </div>

          <div className="step">
            <div className="step-num">5</div>
            <div className="step-body">
              <div className="step-title">🔑 返却する</div>
              <ul>
                <li>予約した返却時間までに店舗に戻ってください</li>
                <li>
                  <strong>
                    マイページに駐車No（お客様のバイクが停まっている場所）が表示されています。必ず指定の駐車Noスペースに停めてください。
                  </strong>
                </li>
                <li>
                  駐車スペース内に停めていない・指定の駐車Noスペース以外に停めた場合、<strong>ブラックリストへの登録・利用停止</strong>の対象になります
                </li>
                <li>鍵は元の場所へ戻してください</li>
                <li>
                  <strong>マイページから返却写真を撮影・送信して返却完了です</strong>
                </li>
                <li>返却の確認が取れない場合、遅延料金が加算されます</li>
              </ul>
              <div className="alert-box compact">
                <div className="alert-title">⚠️ 事故・転倒があった場合</div>
                どんな小さな転倒でも、<strong>返却前に必ず足立本店に連絡してください。</strong>
                無断返却した場合は車両補償が無効になり、違約金が発生します。
              </div>
            </div>
          </div>
        </div>

        <h2>⛔ やってはいけないこと</h2>
        <p>以下の行為は補償無効・違約金・利用停止の対象となります。</p>

        <ul className="ng-list">
          <li className="ng-item">
            <div className="ng-icon">🚑</div>
            <div className="ng-body">
              <div className="ng-title">事故・転倒を報告せずに返却する</div>
              <div className="ng-desc">
                小さな転倒・接触でも必ず返却前に連絡が必要です。無断返却した場合、
                <strong>車両補償が無効になり、違約金が発生します。</strong>
              </div>
            </div>
          </li>
          <li className="ng-item">
            <div className="ng-icon">🅿️</div>
            <div className="ng-body">
              <div className="ng-title">指定スペース以外に駐車する</div>
              <div className="ng-desc">
                枠外・近隣への無断駐車は禁止です。違反した場合、<strong>ブラックリストへの登録・利用停止</strong>の対象になります。
              </div>
            </div>
          </li>
          <li className="ng-item">
            <div className="ng-icon">🚫</div>
            <div className="ng-body">
              <div className="ng-title">勝手な場所に乗り捨てる</div>
              <div className="ng-desc">
                指定返却場所以外での乗り捨ては厳禁です。<strong>補償は一切無効となり、発生した費用の実費を全額請求</strong>
                します。
              </div>
            </div>
          </li>
          <li className="ng-item">
            <div className="ng-icon">🔐</div>
            <div className="ng-body">
              <div className="ng-title">暗証番号・QRコードを他人に教える／第三者にバイクを運転させる</div>
              <div className="ng-desc">
                入店情報・車両の使用は予約者本人のみが対象です。知人など第三者に運転させた場合、
                <strong>補償のすべてが無効</strong>になります。
              </div>
            </div>
          </li>
          <li className="ng-item">
            <div className="ng-icon">⏰</div>
            <div className="ng-body">
              <div className="ng-title">出発が遅れても返却時間は変わらない</div>
              <div className="ng-desc">
                何らかの理由で出発時刻が遅れた場合でも、<strong>返却期限の変更は承れません。</strong>
                また、返却時間を過ぎるとドアの開錠コードが無効になり入店できなくなります。余裕を持ったご予約をおすすめします。
              </div>
            </div>
          </li>
          <li className="ng-item">
            <div className="ng-icon">🎒</div>
            <div className="ng-body">
              <div className="ng-title">返却後の忘れ物</div>
              <div className="ng-desc">
                返却した車両への遺留品について、<strong>当店は保管責任を負いません。</strong>返却前に必ず車内・荷物入れをご確認ください。
              </div>
            </div>
          </li>
        </ul>

        <h2>📞 緊急連絡先・お問い合わせ</h2>

        <div className="contact-box">
          <table>
            <tbody>
              <tr>
                <td>電話対応時間</td>
                <td>10:00〜19:00（月・木定休日を除く）</td>
              </tr>
              <tr>
                <td>時間外・定休日</td>
                <td>お問い合わせフォームからご連絡ください</td>
              </tr>
              <tr>
                <td>ロードサービス</td>
                <td>ご契約書に記載の番号にご連絡ください</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="info-box">
          <strong>📋 ご契約書は必ず手元に保管してください。</strong>
          <br />
          緊急連絡先・ロードサービス番号は契約書に記載されています。マイページの「レンタル中のバイク」から貸渡契約書をご確認いただけます。出発前に確認しておくと安心です。
        </div>

        <div className="summary-box">
          <h2>まとめ｜安心して使うために</h2>
          <ol>
            <li>
              <strong>予約内容を出発前に確認</strong>する（日時・車種・オプション）
            </li>
            <li>
              <strong>乗る前に必ず点検</strong>する（ブレーキ・ウインカー・傷）
            </li>
            <li>
              <strong>問題があれば写真を撮ってから連絡</strong>する
            </li>
            <li>
              <strong>指定スペースに正しく返却</strong>する
            </li>
            <li>
              万が一のトラブルは<strong>隠さずすぐに連絡</strong>する
            </li>
          </ol>
          <p className="summary-note">
            三ノ輪店は24時間いつでも利用できる便利な店舗です。ルールを守ってご利用いただくことで、すべての方が気持ちよくバイクを楽しめます。ご協力をよろしくお願いいたします。
          </p>
        </div>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .article-wrap {
          max-width: 720px;
          margin: 0 auto;
          padding: 24px 16px 60px;
          color: #333;
          line-height: 1.8;
        }

        h1 {
          font-size: 1.7rem;
          font-weight: 900;
          line-height: 1.4;
          margin-bottom: 8px;
        }

        h2 {
          font-size: 1.25rem;
          font-weight: 800;
          margin: 40px 0 12px;
          padding-bottom: 6px;
          border-bottom: 3px solid #222;
        }

        p {
          margin-bottom: 12px;
        }

        ul,
        ol {
          padding-left: 1.4em;
          margin-bottom: 12px;
        }

        li {
          margin-bottom: 6px;
        }

        strong {
          font-weight: 800;
        }

        .updated-at {
          color: #666;
          font-size: 0.85rem;
          margin: 8px 0 24px;
        }

        .tag {
          display: inline-block;
          background: #f5a623;
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .alert-box {
          background: #fff3f3;
          border: 2px solid #e53e3e;
          border-left: 6px solid #e53e3e;
          border-radius: 8px;
          padding: 16px 20px;
          margin: 20px 0;
        }

        .alert-title {
          font-size: 1rem;
          font-weight: 900;
          color: #c53030;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .caution-box {
          background: #fffbeb;
          border: 2px solid #d97706;
          border-left: 6px solid #d97706;
          border-radius: 8px;
          padding: 16px 20px;
          margin: 20px 0;
        }

        .caution-title {
          font-size: 1rem;
          font-weight: 900;
          color: #b45309;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .compact {
          margin: 12px 0 0;
        }

        .info-box {
          background: #eff6ff;
          border: 2px solid #3b82f6;
          border-left: 6px solid #3b82f6;
          border-radius: 8px;
          padding: 16px 20px;
          margin: 20px 0;
        }

        .store-table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 0.95rem;
        }

        .store-table th {
          background: #222;
          color: #fff;
          padding: 10px 14px;
          text-align: left;
        }

        .store-table td {
          padding: 10px 14px;
          border-bottom: 1px solid #e2e8f0;
        }

        .store-table tr:last-child td {
          border-bottom: none;
        }

        .highlight {
          background: #fff3f3;
          font-weight: 700;
        }

        .badge-red {
          background: #e53e3e;
          color: #fff;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .badge-green {
          background: #38a169;
          color: #fff;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .steps {
          margin: 24px 0;
        }

        .step {
          display: flex;
          gap: 16px;
          margin-bottom: 8px;
          position: relative;
        }

        .step:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 22px;
          top: 52px;
          width: 2px;
          height: calc(100% - 20px);
          background: #cbd5e0;
        }

        .step-num {
          flex-shrink: 0;
          width: 46px;
          height: 46px;
          background: #222;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1.1rem;
          position: relative;
          z-index: 1;
        }

        .step-body {
          flex: 1;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 16px;
        }

        .step-title {
          font-size: 1rem;
          font-weight: 800;
          margin-bottom: 8px;
          color: #1a202c;
        }

        .checklist {
          list-style: none;
          padding-left: 0;
        }

        .checklist li {
          padding: 6px 0 6px 32px;
          position: relative;
          border-bottom: 1px solid #f0f0f0;
        }

        .checklist li:last-child {
          border-bottom: none;
        }

        .checklist li::before {
          content: '□';
          position: absolute;
          left: 6px;
          color: #e53e3e;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .ng-list {
          list-style: none;
          padding: 0;
          margin: 16px 0;
        }

        .ng-item {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          margin-bottom: 10px;
          background: #fff;
          border: 1px solid #fed7d7;
          border-radius: 8px;
        }

        .ng-icon {
          font-size: 1.6rem;
          flex-shrink: 0;
          line-height: 1;
        }

        .ng-title {
          font-weight: 800;
          color: #c53030;
          margin-bottom: 4px;
        }

        .ng-desc {
          font-size: 0.9rem;
          color: #555;
        }

        .summary-box {
          background: #1a202c;
          color: #fff;
          border-radius: 10px;
          padding: 20px 24px;
          margin: 32px 0;
        }

        .summary-box h2 {
          color: #fff;
          border-bottom-color: #4a5568;
        }

        .summary-note {
          margin-top: 16px;
          font-size: 0.9rem;
          color: #a0aec0;
        }

        .video-placeholder {
          background: #f0f0f0;
          border: 2px dashed #aaa;
          border-radius: 10px;
          padding: 32px;
          text-align: center;
          color: #666;
          margin: 16px 0;
        }

        .video-icon {
          font-size: 2.5rem;
          margin-bottom: 8px;
        }

        .video-title {
          margin: 0;
          font-weight: 700;
        }

        .video-note {
          margin: 4px 0 0;
          font-size: 0.85rem;
        }

        .contact-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        }

        .contact-box table {
          width: 100%;
          font-size: 0.95rem;
          border-collapse: collapse;
        }

        .contact-box td {
          padding: 6px 8px;
        }

        .contact-box td:first-child {
          color: #666;
          white-space: nowrap;
        }

        .contact-box td:last-child {
          font-weight: 700;
        }

        @media (max-width: 480px) {
          h1 {
            font-size: 1.4rem;
          }

          .step {
            gap: 10px;
          }
        }
      `}</style>
    </>
  )
}
