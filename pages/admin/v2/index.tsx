import fs from 'fs';
import path from 'path';
import { useEffect } from 'react';
import Head from 'next/head';
import type { GetStaticProps, NextPage } from 'next';

/**
 * 管理画面 v2（移植の枠組み）
 *
 * 参照プロトタイプ `public/mock/admin-proto-v2.html`（narikiyo087/YASUKARI の
 * admin プロトを取り込み・調整済み）を、認証配下の実ルート `/admin/v2` として
 * 描画する。モックへの修正はそのままこのルートに反映される。
 *
 * 現段階は「機能する枠組み（ダミーデータ）」。今後、画面単位で idiomatic な
 * React ＋（必要に応じ）実データ配線へ段階置換していく。移植メモは
 * docs/admin-port-notes.md を参照。
 */

interface Props {
  css: string;
  body: string;
  script: string;
}

const MOCK_PATH = 'public/mock/admin-proto-v2.html';

export const getStaticProps: GetStaticProps<Props> = async () => {
  const html = fs.readFileSync(path.join(process.cwd(), MOCK_PATH), 'utf8');

  const css = (html.match(/<style>([\s\S]*?)<\/style>/) || ['', ''])[1];

  // 本文（body 内）からスクリプトを除いたマークアップ
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  const body = (bodyMatch ? bodyMatch[1] : '').replace(/<script[\s\S]*?<\/script>/g, '');

  // body 内のスクリプトを結合（マウント後に実行）
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const script = scripts.join('\n;\n');

  return { props: { css, body, script } };
};

const AdminV2: NextPage<Props> = ({ css, body, script }) => {
  useEffect(() => {
    // プロトタイプの挙動（画面切替・ガント生成・モーダル等）を有効化
    const el = document.createElement('script');
    el.setAttribute('data-admin-v2', 'true');
    el.textContent = script;
    document.body.appendChild(el);
    return () => {
      el.remove();
    };
  }, [script]);

  return (
    <>
      <Head>
        <title>ヤスカリ 管理画面 v2（プロト）</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      {/* プロト由来のスタイル（自己完結・Tailwind非依存） */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: body }} />
    </>
  );
};

export default AdminV2;
