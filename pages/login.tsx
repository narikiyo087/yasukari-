import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { buildAuthorizeUrl, buildSignupUrl, createAndStoreOauthState } from '../lib/cognitoHostedUi';

export default function LoginPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionUser, setSessionUser] = useState<{ email?: string; username?: string } | null>(null);
  const [error, setError] = useState('');
  const [startingLogin, setStartingLogin] = useState(false);
  const [startingLogout, setStartingLogout] = useState(false);
  const [startingSignup, setStartingSignup] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const checkSession = async () => {
      try {
        const response = await fetch('/api/me', {
          credentials: 'include',
          signal: controller.signal,
        });

        if (response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            user?: { email?: string; username?: string } | null;
          };
          const user = data.user ?? null;
          if (user) {
            setSessionUser(user.email || user.username ? user : { email: 'ログイン中' });
          } else {
            setSessionUser(null);
          }
          return;
        }

        setSessionUser(null);
        throw new Error('unexpected status');
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setError('ログイン状態の確認に失敗しました。時間をおいて再度お試しください。');
        }
      } finally {
        if (!controller.signal.aborted) {
          setCheckingSession(false);
        }
      }
    };

    void checkSession();
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    if (!router.isReady) return;

    const queryError = router.query.error;
    if (typeof queryError === 'string') {
      setError(queryError);
    } else if (Array.isArray(queryError) && queryError[0]) {
      setError(queryError[0]);
    }
  }, [router.isReady, router.query.error]);

  const handleLogin = async () => {
    setError('');
    setStartingLogin(true);
    try {
      const state = createAndStoreOauthState();
      window.location.href = buildAuthorizeUrl(state);
    } catch (err) {
      console.error(err);
      setError('ログイン処理を開始できませんでした。時間をおいて再度お試しください。');
    }
  };

  const handleLogout = async () => {
    setError('');
    setStartingLogout(true);
    try {
      const response = await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      if (!response.ok) {
        throw new Error(`failed to logout: ${response.status}`);
      }

      await router.replace('/');
      window.location.reload();
    } catch (err) {
      console.error(err);
      setStartingLogout(false);
      setError('ログアウト処理を開始できませんでした。時間をおいて再度お試しください。');
    }
  };

  const handleSignup = () => {
    setError('');
    setStartingSignup(true);
    try {
      const state = createAndStoreOauthState();
      window.location.href = buildSignupUrl(state);
    } catch (err) {
      console.error(err);
      setStartingSignup(false);
      setError('新規登録画面へ遷移できませんでした。時間をおいて再度お試しください。');
    }
  };

  const handleLoginEnglish = async () => {
    setError('');
    setStartingLogin(true);
    try {
      const state = createAndStoreOauthState();
      window.location.href = buildAuthorizeUrl(state, { lang: 'en' });
    } catch (err) {
      console.error(err);
      setStartingLogin(false);
      setError('Unable to start login. Please try again later.');
    }
  };

  const handleSignupEnglish = () => {
    setError('');
    setStartingSignup(true);
    try {
      const state = createAndStoreOauthState();
      window.location.href = buildSignupUrl(state, { lang: 'en' });
    } catch (err) {
      console.error(err);
      setStartingSignup(false);
      setError('Unable to open the sign up page. Please try again later.');
    }
  };

  return (
    <>
      <Head>
        <title>ログイン / 新規登録 | 激安・便利なレンタルバイクのヤスカリ。</title>
        <meta
          name="description"
          content="ヤスカリ会員のログイン・新規登録ページです。マイページからレンタル状況の確認や延長手続き、支払い情報の更新が行えます。"
        />
      </Head>
      <div className="min-h-screen bg-white text-slate-900">
        <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-slate-500">
              <li>
                <Link href="/" className="text-blue-600 hover:underline">
                  ホーム
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-600">ログイン</li>
            </ol>
          </nav>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="order-2 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:order-1">
              <h1 className="text-2xl font-bold text-slate-900">マイページでレンタルをスムーズに管理</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                ご契約状況の確認や延長手続き、支払い情報の更新まで、マイページからまとめて行えます。
                会員ならではの限定キャンペーンもこちらでお知らせしています。
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {[{ text: '最新のレンタル状況と履歴をいつでもチェック' }, { text: 'オンラインで延長・オプション追加が完結' }, {
text: '会員限定クーポンや新着車両をいち早くご案内' }].map(
                  (item) => (
                    <li key={item.text} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-600" aria-hidden="true" />
                      <span>{item.text}</span>
                    </li>
                  )
                )}
              </ul>
              <div className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
                <p className="font-semibold">はじめての方へ</p>
                <p className="mt-1 leading-relaxed">
                  メールアドレスだけで仮登録が行えます。まだ会員でない方は
                  <button
                    type="button"
                    onClick={handleSignup}
                    disabled={startingSignup}
                    className="ml-1 font-semibold text-red-700 underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    ログイン・登録画面
                  </button>
                  へお進みください。
                </p>
              </div>
            </section>

            <div className="order-1 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:order-2">
              <div className="mb-6 space-y-2 text-center">
                <h2 className="text-xl font-semibold text-slate-900">ログイン / 新規登録</h2>
              </div>
              {error ? (
                <p
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </p>
              ) : null}
              {sessionUser ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex w-full items-center justify-center rounded-full bg-slate-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={startingLogout}
                >
                  {startingLogout
                    ? 'ログアウトへリダイレクトしています…'
                    : 'ログアウトする'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={checkingSession || startingLogin}
                  >
                    {checkingSession
                      ? 'ログイン状態を確認中…'
                      : startingLogin
                        ? 'リダイレクトを準備中…'
                        : 'ログイン画面へ進む'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSignup}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-red-600 px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={startingSignup}
                  >
                    新規登録へ進む
                  </button>
                </>
              )}
              <div className="mt-3 text-center text-xs text-slate-500">
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleLoginEnglish}
                    className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={checkingSession || startingLogin}
                  >
                    Login (English)
                  </button>
                  <button
                    type="button"
                    onClick={handleSignupEnglish}
                    className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={startingSignup}
                  >
                    Sign up (English)
                  </button>
                </div>
              </div>
              <div className="mt-6 rounded-md bg-slate-50 p-4 text-left text-xs leading-relaxed text-slate-600">
                <p className="font-semibold text-slate-900">ログインの流れ</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>「ログイン画面へ進む」ボタンを押してログイン画面へ</li>
                  <li>認証後は {process.env.NEXT_PUBLIC_SITE_NAME ?? 'マイページ'} にリダイレクト</li>
                  <li>初回ログイン時は会員情報の入力（仮登録）を案内します</li>
                  <li>予約時に必要な情報を登録するため、本登録まで完了させてください</li>
                </ol>
              </div>
              <p className="mt-6 text-center text-xs text-slate-500">
                アカウントをお持ちでない方は
                <button
                  type="button"
                  onClick={handleSignup}
                  disabled={startingSignup}
                  className="ml-1 font-semibold text-red-600 underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  新規登録
                </button>
                へ
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
