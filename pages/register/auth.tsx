import { FormEvent, useCallback, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import type { NextPage } from 'next';
type FormStatus = 'idle' | 'loading' | 'success' | 'error';

type LightMember = {
  id: string;
  email?: string;
  username?: string;
  plan: string;
  createdAt: string;
  phoneNumber?: string;
  registrationStatus: 'provisional' | 'full';
};

type ApiResponse = {
  message?: string;
  member?: LightMember;
};

const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!domain) {
    return email;
  }
  if (localPart.length <= 2) {
    return `${localPart[0] ?? ''}***@${domain}`;
  }
  const head = localPart.slice(0, 2);
  return `${head}***@${domain}`;
};

const REGISTER_COMPLETION_PATH = '/register/test';

const RegisterAuthPage: NextPage = () => {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [feedback, setFeedback] = useState('');
  const email = useMemo(() => {
    const queryEmail = router.query.email;
    if (Array.isArray(queryEmail)) {
      return queryEmail[0];
    }
    return queryEmail ?? '';
  }, [router.query.email]);

  const normalizedEmail = useMemo(() => {
    if (!email) {
      return '';
    }
    try {
      return decodeURIComponent(email).trim();
    } catch (error) {
      console.error(error);
      return email.trim();
    }
  }, [email]);

  const submitVerification = useCallback(
    async (inputCode: string) => {
      if (!normalizedEmail) {
        setStatus('error');
        setFeedback('メールアドレス情報が見つかりません。最初から手続きをやり直してください。');
        return;
      }

      const trimmedCode = inputCode.trim();

      if (!trimmedCode) {
        setStatus('error');
        setFeedback('認証コードを入力してください。');
        return;
      }

      setStatus('loading');
      setFeedback('');

      try {
        const res = await fetch('/api/register/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, code: trimmedCode }),
        });

        const data: ApiResponse = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatus('error');
          setFeedback(data.message ?? '認証に失敗しました。時間を置いて再度お試しください。');
          return;
        }

        setStatus('success');
        setFeedback(data.message ?? '本登録が完了しました。');
        setCode('');

        const query = new URLSearchParams();
        if (data.member?.username) {
          query.set('name', data.member.username);
        }
        if (data.member?.id) {
          query.set('user_id', data.member.id);
        }
        const emailForRedirect = data.member?.email ?? normalizedEmail;
        if (emailForRedirect) {
          query.set('email', emailForRedirect);
        }
        void router.push(`${REGISTER_COMPLETION_PATH}${query.toString() ? `?${query.toString()}` : ''}`);
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFeedback('通信エラーが発生しました。ネットワーク環境をご確認のうえ、再度お試しください。');
      }
    },
    [normalizedEmail, router],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitVerification(code);
  };

  const handleTemporaryRegistration = useCallback(async () => {
    if (!normalizedEmail) {
      setStatus('error');
      setFeedback('メールアドレス情報が見つかりません。最初から手続きをやり直してください。');
      return;
    }

    setStatus('loading');
    setFeedback('');

    try {
      const res = await fetch('/api/register/temporary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data: ApiResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus('error');
        setFeedback(data.message ?? '臨時登録に失敗しました。時間を置いて再度お試しください。');
        return;
      }

      setStatus('success');
      setFeedback(data.message ?? '臨時登録が完了しました。');
      setCode('');

      const query = new URLSearchParams();
      if (data.member?.username) {
        query.set('name', data.member.username);
      }
      if (data.member?.id) {
        query.set('user_id', data.member.id);
      }
      const emailForRedirect = data.member?.email ?? normalizedEmail;
      if (emailForRedirect) {
        query.set('email', emailForRedirect);
      }
      void router.push(`${REGISTER_COMPLETION_PATH}${query.toString() ? `?${query.toString()}` : ''}`);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setFeedback('通信エラーが発生しました。ネットワーク環境をご確認のうえ、再度お試しください。');
    }
  }, [normalizedEmail, router]);

  return (
    <>
      <Head>
        <title>認証コード入力 | 激安・便利なレンタルバイクのヤスカリ。</title>
        <meta
          name="description"
          content="仮登録されたメールアドレスに送信された認証コードを入力し、本登録を完了します。"
        />
      </Head>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-100 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="https://yasukari.com/static/images/logo/250x50.png"
                alt="ヤスカリ"
                width={200}
                height={40}
                className="hidden md:block"
              />
              <div className="flex items-center gap-2 md:hidden">
                <img
                  src="https://yasukari.com/static/images/logo/300x300.jpg"
                  alt="ヤスカリ"
                  width={44}
                  height={44}
                  className="rounded-full"
                />
                <span className="text-sm font-semibold text-slate-800">レンタルバイクのヤスカリ</span>
              </div>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-red-600 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-700 hover:text-white"
            >
              ログイン
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8 md:py-12">
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-slate-500">
              <li>
                <Link href="/" className="text-blue-600 hover:underline">
                  ホーム
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/signup" className="text-blue-600 hover:underline">
                  会員登録
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-600">認証コード入力</li>
            </ol>
          </nav>
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-10">
            <h1 className="text-2xl font-semibold text-slate-900">認証コードを入力してください</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              メールアドレスに本登録用の認証コードをお送りしました。メール本文に記載されたコードを入力し、登録を完了してください。
            </p>
            <div className="mt-6 rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">ご確認ください</p>
              <p className="mt-3 leading-relaxed text-slate-700">
                メール本文に記載された認証コードを入力して本登録を完了してください。メールが届かない場合は迷惑メールフォルダもご確認のうえ、
                再送を希望される場合は最初から手続きをやり直してください。
              </p>
            </div>
            {normalizedEmail ? (
              <div className="mt-6 rounded-md border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">メールアドレス</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{maskEmail(normalizedEmail)}</p>
                <p className="mt-1 text-sm text-slate-500">
                  上記メールアドレスに認証コードを送りました。認証コードが届かない場合は
                  <Link href="/signup" className="text-blue-600 hover:underline">
                    再度メールアドレスを入力
                  </Link>
                  してください。
                </p>
              </div>
            ) : (
              <div className="mt-6 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
                メールアドレス情報が確認できませんでした。お手数ですが
                <Link href="/signup" className="ml-1 text-yellow-800 underline">
                  会員登録ページ
                </Link>
                からやり直してください。
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
              {feedback && (
                <div
                  className={
                    status === 'success'
                      ? 'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'
                      : 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600'
                  }
                  role={status === 'success' ? 'status' : 'alert'}
                  aria-live={status === 'success' ? 'polite' : 'assertive'}
                >
                  {feedback}
                </div>
              )}
              <label className="block text-sm font-medium text-slate-700" htmlFor="verification-code">
                認証コード
              </label>
              <input
                id="verification-code"
                name="verification-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="例: ABC123"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="w-full rounded-md border border-slate-200 px-4 py-3 text-lg tracking-[0.3em] focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                disabled={status === 'loading'}
                minLength={4}
                maxLength={6}
              />
              <p className="text-xs text-slate-500">半角英数字4〜6桁で入力してください。</p>
              <div className="space-y-3">
                <button
                  type="submit"
                  className="w-full rounded-full bg-red-600 py-3 text-lg font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                  disabled={status === 'loading' || !normalizedEmail}
                >
                  {status === 'loading' ? '認証中…' : '認証して本登録を完了する'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleTemporaryRegistration()}
                  className="w-full rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
                  disabled={status === 'loading' || !normalizedEmail}
                >
                  臨時で登録をする
                </button>
                <p className="text-center text-xs text-slate-500">メールが届かない場合の一時登録にご利用ください。</p>
              </div>
            </form>
            <div className="mt-6 text-center text-sm text-slate-600">
              認証コードの有効期限はメール送信から24時間です。期限切れの場合は再度メールアドレスを入力してください。
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default RegisterAuthPage;
