import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import type { NextPage } from 'next';
import verificationPreview from '../../data/registerVerificationMock.json';
import { uploadLicenseImage } from '../../lib/licenseUpload';

type RegisterFormData = {
  password: string;
  name1: string;
  name2: string;
  kana1: string;
  kana2: string;
  sex: '1' | '2';
  birth: string;
  zip: string;
  address1: string;
  address2: string;
  mobile: string;
  tel: string;
  license: string;
  work_place: string;
  work_address: string;
  work_tel: string;
  other_name: string;
  other_address: string;
  other_tel: string;
  enquete_purpose: string;
  enquete_want: string;
  enquete_touring: string;
  enquete_magazine: string;
  enquete_chance: string;
};

type VerificationPreviewSample = {
  email: string;
  code: string;
};

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

type LicenseUploadState = {
  fileName: string;
  imageUrl: string;
  uploadedAt: string;
  status: FormStatus;
  message: string;
  inputKey: number;
};

const verificationPreviewSample = verificationPreview as VerificationPreviewSample;

const PREVIEW_EMAIL = verificationPreviewSample.email;
const TEST_LICENSE_FILE_NAME = 'test_license.jpg';

const testAutofillData: Partial<RegisterFormData> = {
  password: 'testpass1',
  name1: 'テスト',
  name2: '太郎',
  kana1: 'テスト',
  kana2: 'タロウ',
  sex: '1',
  birth: '1980-01-01',
  zip: '1234567',
  address1: '東京都足立区千住曙町1-1',
  address2: 'テストビル101',
  mobile: '09012345678',
  tel: '0312345678',
  license: '123456789012',
  work_place: 'ヤスカリ株式会社',
  work_address: '東京都足立区千住曙町1-1',
  work_tel: '0312345678',
  other_name: 'テスト花子',
  other_address: '東京都足立区千住曙町2-2',
  other_tel: '0312345678',
  enquete_purpose: '1',
  enquete_want: '3',
  enquete_touring: '1',
  enquete_magazine: '1',
  enquete_chance: '2',
};

const initialLicenseUploads: LicenseUploadState[] = [
  {
    fileName: '',
    imageUrl: '',
    uploadedAt: '',
    status: 'idle',
    message: '',
    inputKey: 0,
  },
  {
    fileName: '',
    imageUrl: '',
    uploadedAt: '',
    status: 'idle',
    message: '',
    inputKey: 0,
  },
];

const purposeOptions = [
  { value: '1', label: '旅行・レジャー' },
  { value: '2', label: '仕事' },
  { value: '3', label: 'バイクの練習' },
  { value: '4', label: 'バイクの修理中' },
  { value: '5', label: 'その他' },
];

const wantOptions = [
  { value: '1', label: '所有している' },
  { value: '2', label: '購入している' },
  { value: '3', label: '欲しい' },
  { value: '4', label: '欲しくない' },
];

const touringOptions = [
  { value: '1', label: 'ある' },
  { value: '2', label: 'ない' },
];

const magazineOptions = [
  { value: '1', label: 'はい' },
  { value: '2', label: 'いいえ' },
];

const chanceOptions = [
  { value: '1', label: '知人の紹介' },
  { value: '2', label: 'ネットで検索' },
  { value: '3', label: '通りすがり' },
  { value: '4', label: 'リピーター' },
  { value: '5', label: 'その他' },
];

const decodeParam = (param: string | string[] | undefined, fallback = ''): string => {
  if (!param) {
    return fallback;
  }
  const value = Array.isArray(param) ? param[0] : param;
  try {
    return decodeURIComponent(value);
  } catch (error) {
    console.error(error);
    return value;
  }
};

const RegisterTestPage: NextPage = () => {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<{ id: string; email?: string } | null>(null);

  const displayEmail = useMemo(() => {
    const decoded = decodeParam(router.query.email, sessionUser?.email || PREVIEW_EMAIL).trim();
    return decoded || PREVIEW_EMAIL;
  }, [router.query.email, sessionUser?.email]);

  const rawName = useMemo(() => decodeParam(router.query.name).trim(), [router.query.name]);

  const nameParts = useMemo(() => {
    if (!rawName) {
      return { family: 'テスト', given: '太郎' };
    }
    const segments = rawName.split(/\s+/).filter(Boolean);
    if (segments.length === 1) {
      return { family: segments[0], given: '太郎' };
    }
    return { family: segments[0], given: segments.slice(1).join(' ') };
  }, [rawName]);

  const defaultFormData = useMemo<RegisterFormData>(
    () => ({
      password: '',
      name1: nameParts.family,
      name2: nameParts.given,
      kana1: '',
      kana2: '',
      sex: '1',
      birth: '1980-01-01',
      zip: '',
      address1: '',
      address2: '',
      mobile: '',
      tel: '',
      license: '',
      work_place: '',
      work_address: '',
      work_tel: '',
      other_name: '',
      other_address: '',
      other_tel: '',
      enquete_purpose: '',
      enquete_want: '',
      enquete_touring: '',
      enquete_magazine: '',
      enquete_chance: '',
    }),
    [nameParts.family, nameParts.given],
  );

  const [formData, setFormData] = useState<RegisterFormData>(defaultFormData);
  const [licenseUploads, setLicenseUploads] = useState<LicenseUploadState[]>(initialLicenseUploads);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autofillRef = useRef(false);

  useEffect(() => {
    let canceled = false;

    const fetchSessionUser = async () => {
      try {
        const response = await fetch('/api/me', { credentials: 'include' });
        if (!response.ok) {
          return;
        }
        const data = (await response.json().catch(() => ({}))) as {
          user?: { id?: string; email?: string } | null;
        };
        if (!canceled && data.user?.id) {
          setSessionUser({ id: data.user.id, email: data.user.email });
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchSessionUser();

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    setFormData(defaultFormData);
    setLicenseUploads(initialLicenseUploads);
    setSubmitStatus('');
    setSubmitMessage('');
    autofillRef.current = false;
  }, [defaultFormData]);

  useEffect(() => {
    if (displayEmail !== PREVIEW_EMAIL) {
      return;
    }
    if (autofillRef.current) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      ...testAutofillData,
    }));
    setLicenseUploads((prev) => {
      const next = [...prev];
      next[0] = {
        ...next[0],
        fileName: TEST_LICENSE_FILE_NAME,
      };
      return next;
    });
    autofillRef.current = true;
  }, [displayEmail]);

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    const fieldName = name as keyof RegisterFormData;
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value as RegisterFormData[keyof RegisterFormData],
    }));
  }, []);

  const updateLicenseUpload = useCallback(
    (index: number, updates: Partial<LicenseUploadState>) => {
      setLicenseUploads((prev) =>
        prev.map((slot, slotIndex) =>
          slotIndex === index ? { ...slot, ...updates } : slot,
        ),
      );
    },
    [],
  );

  const clearLicenseUpload = useCallback((index: number) => {
    setLicenseUploads((prev) =>
      prev.map((slot, slotIndex) =>
        slotIndex === index
          ? {
              ...slot,
              fileName: '',
              imageUrl: '',
              uploadedAt: '',
              status: 'idle',
              message: '',
              inputKey: slot.inputKey + 1,
            }
          : slot,
      ),
    );
  }, []);

  const handleFileChange = useCallback(
    (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        clearLicenseUpload(index);
        return;
      }

      updateLicenseUpload(index, {
        fileName: file.name,
        status: 'loading',
        message: 'アップロード中...',
      });

      uploadLicenseImage(file)
        .then((result) => {
          updateLicenseUpload(index, {
            fileName: result.fileName,
            imageUrl: result.url,
            uploadedAt: result.uploadedAt,
            status: 'success',
            message: 'アップロードが完了しました。',
          });
        })
        .catch((error) => {
          const message =
            error instanceof Error
              ? error.message
              : '免許証画像のアップロードに失敗しました。';
          updateLicenseUpload(index, {
            imageUrl: '',
            uploadedAt: '',
            status: 'error',
            message,
          });
        });
    },
    [clearLicenseUpload, updateLicenseUpload],
  );

  const userIdFromQuery = useMemo(
    () => decodeParam(router.query.user_id) || decodeParam(router.query.sub),
    [router.query.sub, router.query.user_id],
  );

  const resolvedUserId = useMemo(
    () => userIdFromQuery || sessionUser?.id || (displayEmail === PREVIEW_EMAIL ? 'preview-test-user' : ''),
    [displayEmail, sessionUser?.id, userIdFromQuery],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitMessage('');
      setSubmitStatus('');
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }

      if (!resolvedUserId) {
        setSubmitStatus('error');
        setSubmitMessage('ユーザーIDが取得できませんでした。Cognito の sub をクエリパラメータで指定してください。');
        return;
      }

      const hasLicenseUpload = licenseUploads.some(
        (upload) => upload.imageUrl && upload.fileName,
      );
      const isUploadLoading = licenseUploads.some((upload) => upload.status === 'loading');
      const hasUploadError = licenseUploads.some((upload) => upload.status === 'error');

      if (isUploadLoading) {
        setSubmitStatus('error');
        setSubmitMessage('免許証画像のアップロードが完了するまでお待ちください。');
        return;
      }

      if (hasUploadError) {
        setSubmitStatus('error');
        setSubmitMessage('免許証画像のアップロードに失敗しています。再度アップロードしてください。');
        return;
      }

      if (!hasLicenseUpload) {
        setSubmitStatus('error');
        setSubmitMessage('免許証画像ファイルをアップロードしてください。');
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch('/api/register/store-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: resolvedUserId,
            email: displayEmail,
            license_file_name: licenseUploads[0]?.fileName ?? '',
            license_image_url: licenseUploads[0]?.imageUrl ?? '',
            license_uploaded_at: licenseUploads[0]?.uploadedAt ?? '',
            license_file_name_2: licenseUploads[1]?.fileName ?? '',
            license_image_url_2: licenseUploads[1]?.imageUrl ?? '',
            license_uploaded_at_2: licenseUploads[1]?.uploadedAt ?? '',
            ...formData,
          }),
        });

        const result = (await response.json()) as { message?: string };

        if (!response.ok) {
          throw new Error(result.message || '保存に失敗しました。');
        }

        setSubmitStatus('success');
        setSubmitMessage(result.message || '登録情報を保存しました。');
      } catch (error) {
        const message = error instanceof Error ? error.message : '保存に失敗しました。';
        setSubmitStatus('error');
        setSubmitMessage(message);
      } finally {
        submitTimeoutRef.current = setTimeout(() => {
          setIsSubmitting(false);
        }, 400);
      }
    },
    [displayEmail, formData, licenseUploads, resolvedUserId],
  );

  return (
    <>
      <Head>
        <title>基本情報入力 | 激安・便利なレンタルバイクのヤスカリ。</title>
        <meta
          name="description"
          content="会員登録のために必要な基本情報を入力してください。テストアカウントではサンプルデータを自動入力します。"
        />
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b border-gray-100 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
            <Link href="/" className="flex items-center gap-3">
              <img src="/static/images/logo/250x50.png" alt="ヤスカリ" width={200} height={40} className="hidden md:block" />
              <div className="flex items-center gap-2 md:hidden">
                <img src="/static/images/logo/300x300.jpg" alt="ヤスカリ" width={44} height={44} className="rounded-full" />
                <span className="text-sm font-semibold text-gray-800">レンタルバイクのヤスカリ</span>
              </div>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-red-600 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white"
            >
              ログイン
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
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
              <li className="text-gray-600">会員情報入力</li>
            </ol>
          </nav>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-10">
            <h1 className="text-2xl font-semibold text-gray-900">基本情報を入力してください</h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              会員登録のために必要な情報をご入力ください。テスト用のメールアドレスをご利用の場合は、入力内容が自動で補完されます。
            </p>

            {displayEmail === PREVIEW_EMAIL && (
              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                テスト用アカウントのため、よく使うサンプル値を自動入力しています。必要に応じて編集してください。
              </div>
            )}

            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-800">
              入力内容をご確認のうえ、ページ下部の「新規会員登録」ボタンを押して本登録を完了してください。実装が整い次第、送信
              された情報は Amazon DynamoDB に保存されます。
            </div>

            {submitMessage && (
              <div
                className={`mt-6 rounded-lg px-4 py-3 text-sm ${
                  submitStatus === 'error'
                    ? 'border border-red-200 bg-red-50 text-red-700'
                    : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {submitMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-12" noValidate>
              <div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <h2 className="text-xl font-semibold text-gray-900">基本情報</h2>
                  <span className="text-xs font-semibold text-red-600">* 必須項目</span>
                </div>
                <div className="mt-6 grid gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      メールアドレス
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={displayEmail}
                      disabled
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-gray-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      パスワード
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="パスワードを入力してください"
                      required
                      minLength={8}
                      maxLength={20}
                      value={formData.password}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                    <p className="mt-2 text-xs text-gray-500">* 半角英数字8桁以上20桁以下を入力してください</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="name1">
                      お名前
                    </label>
                    <div className="mt-2 grid gap-4 md:grid-cols-2">
                      <input
                        id="name1"
                        name="name1"
                        type="text"
                        placeholder="姓"
                        required
                        maxLength={20}
                        value={formData.name1}
                        onChange={handleChange}
                        className="rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                      />
                      <input
                        id="name2"
                        name="name2"
                        type="text"
                        placeholder="名"
                        required
                        maxLength={20}
                        value={formData.name2}
                        onChange={handleChange}
                        className="rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="kana1">
                      フリガナ
                    </label>
                    <div className="mt-2 grid gap-4 md:grid-cols-2">
                      <input
                        id="kana1"
                        name="kana1"
                        type="text"
                        placeholder="セイ"
                        required
                        maxLength={20}
                        value={formData.kana1}
                        onChange={handleChange}
                        className="rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                      />
                      <input
                        id="kana2"
                        name="kana2"
                        type="text"
                        placeholder="メイ"
                        required
                        maxLength={20}
                        value={formData.kana2}
                        onChange={handleChange}
                        className="rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">性別</span>
                    <div className="mt-3 flex items-center gap-6">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="sex"
                          value="1"
                          checked={formData.sex === '1'}
                          onChange={handleChange}
                          className="h-4 w-4 text-red-600 focus:ring-red-500"
                        />
                        男性
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="sex"
                          value="2"
                          checked={formData.sex === '2'}
                          onChange={handleChange}
                          className="h-4 w-4 text-red-600 focus:ring-red-500"
                        />
                        女性
                      </label>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="birth" className="block text-sm font-medium text-gray-700">
                      生年月日
                    </label>
                    <input
                      id="birth"
                      name="birth"
                      type="date"
                      placeholder="生年月日"
                      required
                      value={formData.birth}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
                      郵便番号
                    </label>
                    <input
                      id="zip"
                      name="zip"
                      type="text"
                      inputMode="numeric"
                      placeholder="例 0011234"
                      required
                      maxLength={7}
                      value={formData.zip}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="address1" className="block text-sm font-medium text-gray-700">
                      住所
                    </label>
                    <input
                      id="address1"
                      name="address1"
                      type="text"
                      placeholder="住所(市区町村まで)を入力してください"
                      required
                      value={formData.address1}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="address2" className="block text-sm font-medium text-gray-700">
                      番地等
                    </label>
                    <input
                      id="address2"
                      name="address2"
                      type="text"
                      placeholder="番地等を入力してください"
                      required
                      value={formData.address2}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                      携帯電話番号
                    </label>
                    <input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      inputMode="tel"
                      placeholder="携帯電話番号を入力してください"
                      required
                      maxLength={20}
                      value={formData.mobile}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="tel" className="block text-sm font-medium text-gray-700">
                      自宅電話番号
                    </label>
                    <input
                      id="tel"
                      name="tel"
                      type="tel"
                      inputMode="tel"
                      placeholder="自宅電話番号を入力してください"
                      maxLength={20}
                      value={formData.tel}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="license" className="block text-sm font-medium text-gray-700">
                      免許番号
                    </label>
                    <input
                      id="license"
                      name="license"
                      type="text"
                      placeholder="免許番号を入力してください"
                      required
                      maxLength={20}
                      value={formData.license}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700">免許画像アップロード（最大2枚）</span>
                    <div className="mt-3 space-y-4">
                      {licenseUploads.map((upload, index) => (
                        <div key={`license-upload-${index}-${upload.inputKey}`}>
                          <label
                            htmlFor={`license_file_${index}`}
                            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center transition hover:border-red-400 hover:bg-red-50"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              width="64"
                              height="64"
                              fill="currentColor"
                              className="text-gray-400"
                            >
                              <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"></path>
                              <path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2zm13 1a.5.5 0 0 1 .5.5v6l-3.775-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12v.54L1 12.5v-9a.5.5 0 0 1 .5-.5z"></path>
                            </svg>
                            <span className="mt-3 text-sm text-gray-600">
                              免許画像 {index + 1}枚目{index === 1 ? '（任意）' : ''}
                            </span>
                            <span className="mt-1 text-xs text-gray-400">ファイルサイズは10MB以下</span>
                            {upload.fileName && (
                              <span className="mt-2 text-xs text-gray-500">選択済み: {upload.fileName}</span>
                            )}
                          </label>
                          <input
                            key={upload.inputKey}
                            id={`license_file_${index}`}
                            name={`license_file_${index}`}
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleFileChange(index)}
                            required={index === 0 && !upload.imageUrl}
                          />
                          {upload.status === 'loading' ? (
                            <p className="mt-2 text-xs text-gray-500">アップロード中...</p>
                          ) : null}
                          {upload.status === 'success' ? (
                            <p className="mt-2 text-xs text-green-600">{upload.message}</p>
                          ) : null}
                          {upload.status === 'error' ? (
                            <p className="mt-2 text-xs text-red-600">{upload.message}</p>
                          ) : null}
                          {(upload.fileName || upload.imageUrl) && (
                            <button
                              type="button"
                              onClick={() => clearLicenseUpload(index)}
                              className="mt-2 text-xs font-semibold text-red-600 hover:underline"
                            >
                              クリア
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">テストアカウントではファイル選択を省略しても問題ありません。</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="border-b border-gray-200 pb-3">
                  <h2 className="text-xl font-semibold text-gray-900">勤務先情報</h2>
                </div>
                <div className="mt-6 grid gap-6">
                  <div>
                    <label htmlFor="work_place" className="block text-sm font-medium text-gray-700">
                      勤務先名
                    </label>
                    <input
                      id="work_place"
                      name="work_place"
                      type="text"
                      placeholder="勤務先名を入力してください"
                      required
                      maxLength={50}
                      value={formData.work_place}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="work_address" className="block text-sm font-medium text-gray-700">
                      勤務先住所
                    </label>
                    <input
                      id="work_address"
                      name="work_address"
                      type="text"
                      placeholder="勤務先住所を入力してください"
                      required
                      maxLength={100}
                      value={formData.work_address}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="work_tel" className="block text-sm font-medium text-gray-700">
                      勤務先電話番号
                    </label>
                    <input
                      id="work_tel"
                      name="work_tel"
                      type="tel"
                      inputMode="tel"
                      placeholder="勤務先電話番号を入力してください"
                      required
                      maxLength={20}
                      value={formData.work_tel}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="border-b border-gray-200 pb-3">
                  <h2 className="text-xl font-semibold text-gray-900">その他の連絡先</h2>
                </div>
                <div className="mt-6 grid gap-6">
                  <div>
                    <label htmlFor="other_name" className="block text-sm font-medium text-gray-700">
                      連絡先氏名
                    </label>
                    <input
                      id="other_name"
                      name="other_name"
                      type="text"
                      placeholder="連絡先氏名を入力してください"
                      required
                      maxLength={20}
                      value={formData.other_name}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="other_address" className="block text-sm font-medium text-gray-700">
                      連絡先住所
                    </label>
                    <input
                      id="other_address"
                      name="other_address"
                      type="text"
                      placeholder="連絡先住所を入力してください"
                      required
                      maxLength={100}
                      value={formData.other_address}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="other_tel" className="block text-sm font-medium text-gray-700">
                      連絡先電話番号
                    </label>
                    <input
                      id="other_tel"
                      name="other_tel"
                      type="tel"
                      inputMode="tel"
                      placeholder="連絡先電話番号を入力してください"
                      required
                      maxLength={20}
                      value={formData.other_tel}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="border-b border-gray-200 pb-3">
                  <h2 className="text-xl font-semibold text-gray-900">アンケートご協力のお願い</h2>
                </div>
                <div className="mt-6 grid gap-6">
                  <div>
                    <label htmlFor="enquete_purpose" className="block text-sm font-medium text-gray-700">
                      利用目的はなんですか
                    </label>
                    <select
                      id="enquete_purpose"
                      name="enquete_purpose"
                      required
                      value={formData.enquete_purpose}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                      <option value="">選択してください</option>
                      {purposeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="enquete_want" className="block text-sm font-medium text-gray-700">
                      バイクは欲しいですか
                    </label>
                    <select
                      id="enquete_want"
                      name="enquete_want"
                      required
                      value={formData.enquete_want}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                      <option value="">選択してください</option>
                      {wantOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="enquete_touring" className="block text-sm font-medium text-gray-700">
                      ツーリングに興味がありますか
                    </label>
                    <select
                      id="enquete_touring"
                      name="enquete_touring"
                      required
                      value={formData.enquete_touring}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                      <option value="">選択してください</option>
                      {touringOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="enquete_magazine" className="block text-sm font-medium text-gray-700">
                      当店の案内を希望しますか
                    </label>
                    <select
                      id="enquete_magazine"
                      name="enquete_magazine"
                      required
                      value={formData.enquete_magazine}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                      <option value="">選択してください</option>
                      {magazineOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="enquete_chance" className="block text-sm font-medium text-gray-700">
                      当店を知ったきっかけはなんですか
                    </label>
                    <select
                      id="enquete_chance"
                      name="enquete_chance"
                      required
                      value={formData.enquete_chance}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-700 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                      <option value="">選択してください</option>
                      {chanceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full rounded-full bg-red-600 px-4 py-3 text-lg font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '送信中…' : '新規会員登録'}
                </button>
                <p className="mt-3 text-xs text-gray-500">このフォームは開発用のダミーです。入力内容はサーバーへ送信されません。</p>
              </div>
            </form>
          </section>
        </main>
      </div>
    </>
  );
};

export default RegisterTestPage;
