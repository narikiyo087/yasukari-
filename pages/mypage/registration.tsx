import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import type { NextPage } from 'next';
import { formatDisplayPhoneNumber } from '../../lib/phoneNumber';
import { uploadLicenseImage } from '../../lib/licenseUpload';
import type { RegistrationData } from '../../types/registration';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

type LicenseUploadState = {
  fileName: string;
  imageUrl: string;
  uploadedAt: string;
  status: FormStatus;
  message: string;
  inputKey: number;
};

type RegisterFormData = {
  name1: string;
  name2: string;
  kana1: string;
  kana2: string;
  sex: '' | '1' | '2' | '3';
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

type SessionUser = {
  id: string;
  email?: string;
  username?: string;
};

type SessionResponse = {
  user?: SessionUser;
};

type RegisterResponse = {
  message?: string;
};

type RegistrationResponse = {
  registration?: RegistrationData | null;
};

type AttributesResponse = {
  attributes?: {
    phone_number?: string;
  };
};

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

const formatPhoneInputValue = (phone: string) => {
  const normalized = phone.replace(/^\+/, '');
  if (normalized.startsWith('81') && normalized.length > 2) {
    return `0${normalized.slice(2)}`;
  }
  return phone;
};

const formatPhoneOptionLabel = (phone: string) => formatDisplayPhoneNumber(phone) || phone;

const normalizeMobileInput = (phone: string) => {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.startsWith('0')) {
    return `81${digitsOnly.slice(1)}`;
  }
  return digitsOnly;
};

const normalizeBirthInput = (birth: string) => {
  if (!birth) return birth;
  const [year, ...rest] = birth.split('-');
  const normalizedYear = year.slice(0, 4);
  if (rest.length === 0) {
    return normalizedYear;
  }
  return [normalizedYear, ...rest].join('-');
};

const initialFormData: RegisterFormData = {
  name1: '',
  name2: '',
  kana1: '',
  kana2: '',
  sex: '',
  birth: '',
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
  enquete_purpose: '1',
  enquete_want: '1',
  enquete_touring: '1',
  enquete_magazine: '1',
  enquete_chance: '1',
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

const RegistrationPage: NextPage = () => {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState('');
  const [availablePhones, setAvailablePhones] = useState<string[]>([]);
  const [selectedPhoneOption, setSelectedPhoneOption] = useState('');
  const [hasPrefilledRegistration, setHasPrefilledRegistration] = useState(false);

  const [formData, setFormData] = useState<RegisterFormData>(initialFormData);
  const [licenseUploads, setLicenseUploads] = useState<LicenseUploadState[]>(initialLicenseUploads);
  const [submitStatus, setSubmitStatus] = useState<FormStatus>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/me', { credentials: 'include', signal: controller.signal });
        if (!response.ok) {
          throw new Error('failed to load profile');
        }

        const data = (await response.json().catch(() => ({}))) as SessionResponse;
        if (!data.user) {
          await router.replace('/login');
          return;
        }

        setSessionUser(data.user);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setUserError('ログイン状態の確認に失敗しました。時間をおいて再度お試しください。');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingUser(false);
        }
      }
    };

    void fetchUser();
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchAttributes = async () => {
      try {
        const response = await fetch('/api/user/attributes', { credentials: 'include', signal: controller.signal });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as AttributesResponse;
        const phone = data.attributes?.phone_number?.replace(/[^0-9]/g, '') ?? '';
        if (phone) {
          setAvailablePhones([phone]);
          setFormData((prev) => ({ ...prev, mobile: prev.mobile || phone }));
          setSelectedPhoneOption(phone);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
        }
      }
    };

    void fetchAttributes();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (loadingUser || hasPrefilledRegistration) {
      return;
    }

    const controller = new AbortController();

    const fetchRegistration = async () => {
      try {
        const response = await fetch('/api/register/user', {
          credentials: 'include',
          signal: controller.signal,
        });

        if (response.status === 401) {
          await router.replace('/login');
          return;
        }

        if (response.status === 404) {
          return;
        }

        if (!response.ok) {
          throw new Error('failed to load registration');
        }

        const data = (await response.json()) as RegistrationResponse;
        if (!data.registration) {
          return;
        }

        const registration = data.registration;

        setFormData((prev) => ({
          ...prev,
          name1: registration.name1 ?? prev.name1,
          name2: registration.name2 ?? prev.name2,
          kana1: registration.kana1 ?? prev.kana1,
          kana2: registration.kana2 ?? prev.kana2,
          sex: registration.sex === '2' ? '2' : '1',
          birth: registration.birth ?? prev.birth,
          zip: registration.zip ?? prev.zip,
          address1: registration.address1 ?? prev.address1,
          address2: registration.address2 ?? prev.address2,
          mobile: registration.mobile ?? prev.mobile,
          tel: registration.tel ?? prev.tel,
          license: registration.license ?? prev.license,
          work_place: registration.work_place ?? prev.work_place,
          work_address: registration.work_address ?? prev.work_address,
          work_tel: registration.work_tel ?? prev.work_tel,
          other_name: registration.other_name ?? prev.other_name,
          other_address: registration.other_address ?? prev.other_address,
          other_tel: registration.other_tel ?? prev.other_tel,
          enquete_purpose: registration.enquete_purpose ?? prev.enquete_purpose,
          enquete_want: registration.enquete_want ?? prev.enquete_want,
          enquete_touring: registration.enquete_touring ?? prev.enquete_touring,
          enquete_magazine: registration.enquete_magazine ?? prev.enquete_magazine,
          enquete_chance: registration.enquete_chance ?? prev.enquete_chance,
        }));
        setLicenseUploads((prev) => {
          const next = [...prev];
          next[0] = {
            ...next[0],
            fileName: registration.license_file_name ?? '',
            imageUrl: registration.license_image_url ?? '',
            uploadedAt: registration.license_uploaded_at ?? '',
            status: registration.license_image_url ? 'success' : 'idle',
            message: registration.license_image_url ? 'アップロード済みです。' : '',
          };
          next[1] = {
            ...next[1],
            fileName: registration.license_file_name_2 ?? '',
            imageUrl: registration.license_image_url_2 ?? '',
            uploadedAt: registration.license_uploaded_at_2 ?? '',
            status: registration.license_image_url_2 ? 'success' : 'idle',
            message: registration.license_image_url_2 ? 'アップロード済みです。' : '',
          };
          return next;
        });

        if (registration.mobile) {
          setSelectedPhoneOption(registration.mobile);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setHasPrefilledRegistration(true);
        }
      }
    };

    void fetchRegistration();
    return () => controller.abort();
  }, [hasPrefilledRegistration, loadingUser, router]);

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    if (name === 'mobile') {
      setSelectedPhoneOption('');
      const normalizedMobile = normalizeMobileInput(value);
      setFormData((prev) => ({
        ...prev,
        mobile: normalizedMobile,
      }));
      return;
    }
    if (name === 'birth') {
      const normalizedBirth = normalizeBirthInput(value);
      setFormData((prev) => ({
        ...prev,
        birth: normalizedBirth,
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value as RegisterFormData[keyof RegisterFormData],
    }));
  }, []);

  const handlePhoneSelect = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      setSelectedPhoneOption(value);
      setFormData((prev) => ({ ...prev, mobile: value }));
    },
    [],
  );

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

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitMessage('');
      setSubmitStatus('idle');
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }

      if (!sessionUser?.id) {
        setSubmitStatus('error');
        setSubmitMessage('ユーザー情報の取得に失敗しました。ログインし直してから再度お試しください。');
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

      const normalizedOtherName = formData.other_name.replace(/\s+/g, '');
      const normalizedUserName = `${formData.name1}${formData.name2}`.replace(/\s+/g, '');
      const isRepeatedName = normalizedOtherName.length > 1 && [...normalizedOtherName].every((char) => char === normalizedOtherName[0]);

      if (
        !normalizedOtherName ||
        normalizedOtherName.length === 1 ||
        isRepeatedName ||
        (normalizedUserName && normalizedOtherName === normalizedUserName)
      ) {
        setSubmitStatus('error');
        setSubmitMessage('緊急連絡先氏名を正しく入力してください。');
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
            user_id: sessionUser.id,
            email: sessionUser.email,
            license_file_name: licenseUploads[0]?.fileName ?? '',
            license_image_url: licenseUploads[0]?.imageUrl ?? '',
            license_uploaded_at: licenseUploads[0]?.uploadedAt ?? '',
            license_file_name_2: licenseUploads[1]?.fileName ?? '',
            license_image_url_2: licenseUploads[1]?.imageUrl ?? '',
            license_uploaded_at_2: licenseUploads[1]?.uploadedAt ?? '',
            ...formData,
          }),
        });

        const result = (await response.json()) as RegisterResponse;

        if (!response.ok) {
          throw new Error(result.message || '保存に失敗しました。');
        }

        setSubmitStatus('success');
        setSubmitMessage(result.message || '登録情報を保存しました。');
        setTimeout(() => {
          void router.push('/mypage');
        }, 600);
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
    [formData, licenseUploads, router, sessionUser],
  );

  return (
    <>
      <Head>
        <title>本登録 | ヤスカリ</title>
        <meta name="description" content="マイページから本登録用の基本情報を入力できます。" />
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/" className="text-red-600 hover:underline">
                  ホーム
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/mypage" className="text-red-600 hover:underline">
                  マイページ
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-600">本登録</li>
            </ol>
          </nav>

          <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900">本登録フォーム</h1>
            <p className="mt-2 text-sm text-gray-600">
              レンタルのご利用に必要な基本情報を入力してください。
            </p>
            {userError ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{userError}</p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                  メールアドレス
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={sessionUser?.email ?? ''}
                  disabled
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                  placeholder="example@example.com"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="name1">
                    姓（漢字）
                  </label>
                  <input
                    id="name1"
                    name="name1"
                    type="text"
                    value={formData.name1}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="山田"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="name2">
                    名（漢字）
                  </label>
                  <input
                    id="name2"
                    name="name2"
                    type="text"
                    value={formData.name2}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="太郎"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="kana1">
                    セイ（カナ）
                  </label>
                  <input
                    id="kana1"
                    name="kana1"
                    type="text"
                    value={formData.kana1}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="ヤマダ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="kana2">
                    メイ（カナ）
                  </label>
                  <input
                    id="kana2"
                    name="kana2"
                    type="text"
                    value={formData.kana2}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="タロウ"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="sex">
                    性別
                  </label>
                  <select
                    id="sex"
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                  >
                    <option value="">性別を選択してください。</option>
                    <option value="1">男性</option>
                    <option value="2">女性</option>
                    <option value="3">どちらでもない</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="birth">
                    生年月日
                  </label>
                  <input
                    id="birth"
                    name="birth"
                    type="date"
                    value={formData.birth}
                    onChange={handleChange}
                    required
                    max="9999-12-31"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="zip">
                    郵便番号
                  </label>
                  <input
                    id="zip"
                    name="zip"
                    type="text"
                    value={formData.zip}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="1234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="address1">
                    住所1（都道府県・市区町村）
                  </label>
                  <input
                    id="address1"
                    name="address1"
                    type="text"
                    value={formData.address1}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="東京都足立区千住曙町"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="address2">
                    住所2（番地・建物名など）
                  </label>
                  <input
                    id="address2"
                    name="address2"
                    type="text"
                    value={formData.address2}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="1-1 ヤスカリビル101"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="mobile">
                    携帯電話番号（任意）
                  </label>
                  {availablePhones.length > 0 ? (
                    <select
                      id="mobile-select"
                      name="mobile-select"
                      value={selectedPhoneOption}
                      onChange={handlePhoneSelect}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    >
                      <option value="">手入力する</option>
                      {availablePhones.map((phone) => {
                        const normalized = phone.replace(/^\+/, '');
                        const countryCode = normalized.startsWith('81') ? '+81' : '';
                        return (
                          <option key={phone} value={phone}>
                            {formatPhoneOptionLabel(phone)}
                          </option>
                        );
                      })}
                    </select>
                  ) : null}
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    value={formatPhoneInputValue(formData.mobile)}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="09012345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="tel">
                    自宅電話番号（任意）
                  </label>
                  <input
                    id="tel"
                    name="tel"
                    type="tel"
                    value={formData.tel}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="0312345678"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="license">
                    免許証番号
                  </label>
                  <input
                    id="license"
                    name="license"
                    type="text"
                    value={formData.license}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="123456789012"
                  />
                </div>
                <div className="space-y-3">
                  <span className="block text-sm font-medium text-gray-700">
                    免許証画像アップロード（最大2枚）
                  </span>
                  {licenseUploads.map((upload, index) => (
                    <div
                      key={`license-upload-${index}-${upload.inputKey}`}
                      className="rounded-lg border border-gray-200 bg-white p-3"
                    >
                      <label
                        className="block text-xs font-medium text-gray-700"
                        htmlFor={`license_file_${index}`}
                      >
                        免許証画像 {index + 1}枚目{index === 1 ? '（任意）' : ''}
                      </label>
                      <input
                        key={upload.inputKey}
                        id={`license_file_${index}`}
                        name={`license_file_${index}`}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange(index)}
                        required={index === 0 && !upload.imageUrl}
                        className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:rounded-full file:border file:border-red-600 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-red-600 hover:file:bg-red-50"
                      />
                      {upload.fileName ? (
                        <p className="mt-1 text-xs text-gray-500">選択中: {upload.fileName}</p>
                      ) : null}
                      {upload.status === 'loading' ? (
                        <p className="mt-1 text-xs text-gray-500">アップロード中...</p>
                      ) : null}
                      {upload.status === 'success' ? (
                        <p className="mt-1 text-xs text-green-600">{upload.message}</p>
                      ) : null}
                      {upload.status === 'error' ? (
                        <p className="mt-1 text-xs text-red-600">{upload.message}</p>
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
              </div>
              <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-600">
                <p>※ 運転免許証をアップロードする際は、以下の点にご注意ください。</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <span className="font-semibold text-red-600">日本国内で発行された有効な運転免許証</span>であることを確認してください。
                  </li>
                  <li>
                    <span className="font-semibold text-red-600">文字や写真がはっきり確認できる鮮明な画像</span>をアップロードしてください（ピンぼけ・一部欠け・反射があるものは不可）。
                  </li>
                  <li>
                    <span className="font-semibold text-red-600">免許証番号・氏名・有効期限などの必要情報がすべて判別できる状態</span>であることを確認してください。
                  </li>
                </ul>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="work_place">
                    勤務先名（任意）
                  </label>
                  <input
                    id="work_place"
                    name="work_place"
                    type="text"
                    value={formData.work_place}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="ヤスカリ株式会社"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="work_address">
                    勤務先住所（任意）
                  </label>
                  <input
                    id="work_address"
                    name="work_address"
                    type="text"
                    value={formData.work_address}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="東京都足立区千住曙町"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="work_tel">
                    勤務先電話番号（任意）
                  </label>
                  <input
                    id="work_tel"
                    name="work_tel"
                    type="tel"
                    value={formData.work_tel}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="0312345678"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="other_name">
                    緊急連絡先氏名
                  </label>
                  <input
                    id="other_name"
                    name="other_name"
                    type="text"
                    value={formData.other_name}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="山田花子"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="other_address">
                    緊急連絡先住所
                  </label>
                  <input
                    id="other_address"
                    name="other_address"
                    type="text"
                    value={formData.other_address}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="東京都足立区千住曙町"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="other_tel">
                    緊急連絡先電話番号
                  </label>
                  <input
                    id="other_tel"
                    name="other_tel"
                    type="tel"
                    value={formData.other_tel}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="0312345678"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-800">
                <h2 className="text-base font-semibold text-gray-900">アンケート</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="enquete_purpose">
                      ご利用目的
                    </label>
                    <select
                      id="enquete_purpose"
                      name="enquete_purpose"
                      value={formData.enquete_purpose}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    >
                      {purposeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="enquete_want">
                      バイクの購入意欲
                    </label>
                    <select
                      id="enquete_want"
                      name="enquete_want"
                      value={formData.enquete_want}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    >
                      {wantOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="enquete_touring">
                      バイクツーリング経験
                    </label>
                    <select
                      id="enquete_touring"
                      name="enquete_touring"
                      value={formData.enquete_touring}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    >
                      {touringOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="enquete_magazine">
                      バイク雑誌の購読
                    </label>
                    <select
                      id="enquete_magazine"
                      name="enquete_magazine"
                      value={formData.enquete_magazine}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    >
                      {magazineOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="enquete_chance">
                      当サービスを知ったきっかけ
                    </label>
                    <select
                      id="enquete_chance"
                      name="enquete_chance"
                      value={formData.enquete_chance}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    >
                      {chanceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {submitMessage ? (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    submitStatus === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {submitMessage}
                </div>
              ) : null}

              <div className="grid grid-cols-3 items-center">
                <span />
                <button
                  type="submit"
                  disabled={isSubmitting || loadingUser}
                  className="inline-flex items-center justify-center justify-self-center rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {isSubmitting ? '送信中…' : '完了する'}
                </button>
                <Link
                  href="/mypage"
                  className="justify-self-end text-sm font-semibold text-gray-700 underline decoration-gray-300 underline-offset-4 transition hover:text-gray-900 hover:decoration-gray-500"
                >
                  戻る
                </Link>
              </div>
            </form>
          </section>
        </main>
      </div>
    </>
  );
};

export default RegistrationPage;
