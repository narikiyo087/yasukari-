import { useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/** お知らせ/ブログ 編集（実装 / ダミー）。参照: admin-proto-v2.html #promoedit */

const AdminPromoEdit: NextPage = () => {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : 'new';
  const isNew = id === 'new';
  const rteRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState<null | '下書き' | '公開'>(null);

  const exec = (cmd: string, val?: string) => {
    rteRef.current?.focus();
    // 旧APIだが主要ブラウザで動作。モックのRTEを踏襲
    document.execCommand(cmd, false, val);
  };
  const addLink = () => {
    const url = typeof window !== 'undefined' ? window.prompt('リンクURL', 'https://') : null;
    if (url) exec('createLink', url);
  };

  return (
    <>
      <Head>
        <title>{isNew ? '新規投稿' : '投稿を編集'} | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="promo" title="お知らせ / ブログ">
        <div className={styles.screen}>
          <p className={styles.crumb}>
            <Link href="/admin/promo">お知らせ/ブログ</Link> / {isNew ? '新規投稿' : '編集'}
          </p>
          <div className={styles.pgh}>
            <h1>{isNew ? '新規投稿' : '投稿を編集'}</h1>
            <div className={styles.act}>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setSaved('下書き')}>
                下書き保存
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setSaved('公開')}>
                公開する
              </button>
            </div>
          </div>

          <div className={styles.detailCols}>
            <div>
              <div className={styles.card}>
                <h3>本文</h3>
                <div className={styles.amFld}>
                  <label>タイトル</label>
                  <input defaultValue={isNew ? '' : '三ノ輪店 24時間セルフ受取に対応'} placeholder="タイトルを入力" />
                </div>
                <div className={styles.amFld} style={{ marginBottom: 0 }}>
                  <label>本文（リッチテキスト／保存はHTML）</label>
                </div>
                <div className={styles.rteTb}>
                  <button type="button" onClick={() => exec('formatBlock', 'H2')}>見出し</button>
                  <button type="button" onClick={() => exec('formatBlock', 'H3')}>小見出し</button>
                  <button type="button" onClick={() => exec('formatBlock', 'P')}>本文</button>
                  <span className={styles.rteSep} />
                  <button type="button" style={{ fontWeight: 900 }} onClick={() => exec('bold')}>B</button>
                  <button type="button" style={{ fontStyle: 'italic' }} onClick={() => exec('italic')}>I</button>
                  <button type="button" style={{ textDecoration: 'underline' }} onClick={() => exec('underline')}>U</button>
                  <span className={styles.rteSep} />
                  <button type="button" onClick={() => exec('insertUnorderedList')}>• リスト</button>
                  <button type="button" onClick={() => exec('insertOrderedList')}>1. 番号</button>
                  <button type="button" onClick={addLink}>🔗 リンク</button>
                  <button type="button" onClick={() => exec('insertHorizontalRule')}>― 区切り</button>
                </div>
                <div className={styles.rte} ref={rteRef} contentEditable suppressContentEditableWarning>
                  {!isNew && (
                    <>
                      <h2>三ノ輪店 24時間セルフ受取に対応しました</h2>
                      <p>
                        三ノ輪店（セルフ店舗）をご利用のお客様向けに、予約から返却までの手順と注意事項をまとめました。キーボックスの暗証番号は
                        <strong>マイページ</strong>に表示されます。
                      </p>
                      <h3>ご利用の流れ</h3>
                      <ul>
                        <li>マイページで暗証番号を確認</li>
                        <li>キーボックスを解錠して鍵を受け取り</li>
                        <li>返却は満タン＋返却写真の撮影</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className={styles.card}>
                <h3>公開設定</h3>
                <div className={styles.amFld}>
                  <label>種別</label>
                  <select defaultValue="お知らせ">
                    <option>お知らせ</option>
                    <option>ブログ</option>
                  </select>
                </div>
                <div className={styles.amFld}>
                  <label>公開日</label>
                  <input type="date" />
                </div>
                <div className={styles.amFld}>
                  <label>アイキャッチ画像</label>
                  <input type="file" />
                </div>
                <p className={styles.fineNote}>公開すると顧客サイトの「お知らせ/ブログ」に掲載され、必要に応じてメール配信で告知できます。</p>
              </div>
            </div>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={saved !== null} title={saved === '公開' ? '公開しました' : '下書きを保存しました'} onClose={() => setSaved(null)}>
        <div className={styles.amNote}>
          {saved === '公開' ? '顧客サイトのお知らせ/ブログに掲載されました。メール配信で告知することもできます。' : '下書きとして保存しました。あとで編集・公開できます。'}
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setSaved(null)}>
            続けて編集
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => router.push('/admin/promo')}>
            一覧へ
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminPromoEdit;
