import { FormEvent, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import type { NextPage } from 'next';
import {
  COUNTRY_OPTIONS,
  findCountryByDialCodePrefix,
  formatDisplayPhoneNumber,
  formatInternationalPhoneNumber,
} from '../../lib/phoneNumber';

type UserAttributes = {
  phone_number?: string;
  'custom:handle'?: string;
  'custom:locale'?: string;
  name?: string;
};

type AttributesResponse = { attributes?: UserAttributes; message?: string };

const REQUIRED_KEYS: (keyof UserAttributes)[] = ['phone_number', 'custom:handle', 'custom:locale', 'name'];

const ProfileSetupPage: NextPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attributes, setAttributes] = useState<UserAttributes>({});
  const [showForm, setShowForm] = useState(false);
  const fromLogin = useMemo(() => router.query.fromLogin === '1', [router.query.fromLogin]);

  const normalizedLocale = (attributes['custom:locale'] ?? '').trim().toLowerCase();

  const applyLocaleToPath = (path: string) => {
    if (!path.startsWith('/')) return path;

    const hasEnPrefix = path === '/en' || path.startsWith('/en/');

    if (normalizedLocale.startsWith('en')) {
      if (hasEnPrefix) return path;
      return path === '/' ? '/en' : `/en${path}`;
    }

    if (hasEnPrefix) {
      const stripped = path.replace(/^\/en/, '') || '/';
      return stripped.startsWith('/') ? stripped : `/${stripped}`;
    }

    return path;
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchAttributes = async () => {
      try {
        const [sessionRes, attrRes] = await Promise.all([
          fetch('/api/me', { credentials: 'include', signal: controller.signal }),
          fetch('/api/user/attributes', { credentials: 'include', signal: controller.signal }),
        ]);

        if (!sessionRes.ok) {
          throw new Error('ログイン状態の確認に失敗しました。');
        }

        const sessionData = (await sessionRes.json().catch(() => ({}))) as {
          user?: { id?: string } | null;
        };
        if (!sessionData.user) {
          await router.replace(applyLocaleToPath('/login'));
          return;
        }

        if (attrRes.status === 401) {
          await router.replace(applyLocaleToPath('/login'));
          return;
        }

        if (!attrRes.ok) {
          const data = (await attrRes.json().catch(() => ({}))) as AttributesResponse;
          throw new Error(data.message ?? 'ユーザー情報の取得に失敗しました。');
        }

        const data = (await attrRes.json()) as AttributesResponse;
        setAttributes(data.attributes ?? {});
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setError('情報の取得に失敗しました。時間をおいて再度お試しください。');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchAttributes();
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    if (fromLogin && !loading) {
      const missing = REQUIRED_KEYS.filter((key) => !(attributes?.[key] ?? '').trim());
      if (missing.length === 0) {
        void router.replace(applyLocaleToPath('/mypage'));
      }
    }
  }, [attributes, fromLogin, loading, router]);

  useEffect(() => {
    if (!loading) {
      const missing = REQUIRED_KEYS.filter((key) => !(attributes?.[key] ?? '').trim());
      setShowForm(missing.length > 0);
    }
  }, [attributes, loading]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const formData = new FormData(event.currentTarget);

    const countryDialCode = formData.get('phone_country')?.toString() ?? COUNTRY_OPTIONS[0].dialCode;
    const nationalNumber = formData.get('phone_national')?.toString() ?? '';
    const phoneNumber = formatInternationalPhoneNumber(countryDialCode, nationalNumber);

    if (!phoneNumber) {
      setSaving(false);
      setError('電話番号を正しく入力してください。');
      return;
    }

    const payload = {
      phone_number: phoneNumber,
      name: formData.get('name')?.toString() ?? '',
      handle: formData.get('handle')?.toString() ?? '',
      locale: formData.get('locale')?.toString() ?? '',
    };

    try {
      const response = await fetch('/api/user/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as AttributesResponse;

      if (!response.ok) {
        throw new Error(data.message ?? '保存に失敗しました。');
      }

      setSuccess('基本情報を保存しました。');
      const nextAttributes: UserAttributes = {
        ...attributes,
        phone_number: payload.phone_number,
        name: payload.name,
        'custom:handle': payload.handle,
        'custom:locale': payload.locale,
      };

      setAttributes(nextAttributes);

      const missing = REQUIRED_KEYS.filter((key) => !(nextAttributes[key] ?? '').trim());
      if (missing.length === 0) {
        await router.replace(applyLocaleToPath('/mypage'));
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : '保存に失敗しました。';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const localeLabel = (value: string | undefined) => {
    if (!value) return '未設定';
    const normalized = value.toLowerCase();
    if (normalized.startsWith('ja') || normalized.startsWith('jp')) return '日本語語';
    if (normalized.startsWith('en')) return '英語圏';
    return value;
  };

  const localeSelectValue = () => {
    if (!normalizedLocale) return '';
    if (normalizedLocale.startsWith('ja') || normalizedLocale.startsWith('jp')) return 'jp';
    if (normalizedLocale.startsWith('en')) return 'en';
    return attributes['custom:locale'] ?? '';
  };

  const missingKeys = REQUIRED_KEYS.filter((key) => !(attributes?.[key] ?? '').trim());

  const { phoneCountry, phoneNational } = useMemo(() => {
    const digits = (attributes.phone_number ?? '').replace(/[^0-9]/g, '');
    const matchedCountry = findCountryByDialCodePrefix(digits) ?? COUNTRY_OPTIONS[0];
    const national = digits.startsWith(matchedCountry.dialCode)
      ? digits.slice(matchedCountry.dialCode.length)
      : '';

    return {
      phoneCountry: matchedCountry.dialCode,
      phoneNational: national ? `0${national}` : '',
    };
  }, [attributes.phone_number]);

  const formatPhoneLabel = (value?: string) => {
    const formatted = formatDisplayPhoneNumber(value);
    return formatted || '未設定';
  };

  return (
    <>
      <Head>
        <title>基本情報の登録</title>
      </Head>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10">
        <header className="space-y-2 text-sm text-gray-600">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href={applyLocaleToPath('/')} className="text-red-600 hover:underline">
                  ホーム
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={applyLocaleToPath('/mypage')} className="text-red-600 hover:underline">
                  マイページ
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-700">基本情報の登録</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-semibold text-gray-900">基本情報の登録</h1>
          <p className="text-sm text-gray-500">
            電話番号、ハンドルネーム、ロケーションと言語、表示名を設定してください。入力済みの項目は更新できます。
          </p>
        </header>

        {loading ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-700">情報を読み込み中です…</p>
          </section>
        ) : (
          <>
            {missingKeys.length === 0 ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                基本情報を編集するボタンを押すと更新できます
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm">
                <span aria-hidden className="text-lg">⚠️</span>
                <p className="leading-relaxed">
                  未入力の項目があります。<br />
                  すべて入力して仮登録を完了してください。
                </p>
              </div>
            )}

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : null}
            {success ? (
              <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>
            ) : null}

            {missingKeys.length === 0 && !showForm ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                  onClick={() => setShowForm(true)}
                >
                  基本情報を編集する
                </button>
              </div>
            ) : null}

            {showForm ? (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>
                <form className="mt-4 space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="phone_country" className="block text-sm font-medium text-gray-700">
                      電話番号
                    </label>
                    <div className="grid gap-2 sm:grid-cols-[auto,1fr]">
                      <select
                        id="phone_country"
                        name="phone_country"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none"
                        defaultValue={phoneCountry}
                        required
                      >
                        {COUNTRY_OPTIONS.map((country) => (
                          <option key={country.code} value={country.dialCode}>{`${country.name} (+${country.dialCode})`}</option>
                        ))}
                      </select>
                      <input
                        id="phone_national"
                        name="phone_national"
                        type="tel"
                        defaultValue={phoneNational}
                        placeholder="例: 08012341234"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500">国番号と先頭の0を除いた番号で登録されます。</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="handle" className="block text-sm font-medium text-gray-700">
                      ハンドルネーム（ユーザーID）
                    </label>
                    <input
                      id="handle"
                      name="handle"
                      type="text"
                      defaultValue={attributes['custom:handle'] ?? ''}
                      placeholder="3〜30文字"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none"
                      required
                    />
                    <p className="text-xs text-gray-500">サイト内での識別に使用されます。</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      ニックネーム
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      defaultValue={attributes.name ?? ''}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="locale" className="block text-sm font-medium text-gray-700">
                      ロケーション / 言語
                    </label>
                    <select
                      id="locale"
                      name="locale"
                      defaultValue={localeSelectValue()}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none"
                      required
                    >
                      <option value="" disabled>
                        選択してください
                      </option>
                      <option value="jp">日本語語</option>
                      <option value="en">英語圏</option>
                    </select>
                    <p className="text-xs text-gray-500">選択したロケーションに応じてサイト表示を調整します。</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? '保存中…' : '登録する'}
                    </button>
                    <Link
                      href={applyLocaleToPath('/mypage')}
                      className="text-sm font-semibold text-gray-700 underline underline-offset-4 hover:text-gray-900"
                    >
                      戻る
                    </Link>
                  </div>
                </form>
              </section>
            ) : null}

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">現在の登録状況</h2>
              <dl className="mt-4 grid gap-4 text-sm text-gray-700 md:grid-cols-2">
                <div>
                  <dt className="font-medium text-gray-600">電話番号</dt>
                  <dd className="mt-1 text-gray-900">{formatPhoneLabel(attributes.phone_number)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">ハンドルネーム</dt>
                  <dd className="mt-1 text-gray-900">{attributes['custom:handle'] ?? '未設定'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">ロケーション / 言語</dt>
                  <dd className="mt-1 text-gray-900">{localeLabel(attributes['custom:locale'])}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">ニックネーム</dt>
                  <dd className="mt-1 text-gray-900">{attributes.name ?? '未設定'}</dd>
                </div>
              </dl>
            </section>
          </>
        )}
      </main>
    </>
  );
};

export default ProfileSetupPage;
