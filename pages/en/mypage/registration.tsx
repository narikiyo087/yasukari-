import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import type { NextPage } from 'next';
import { uploadLicenseImage } from '../../../lib/licenseUpload';

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

type AttributesResponse = {
  attributes?: {
    phone_number?: string;
  };
};

const purposeOptions = [
  { value: '1', label: 'Travel / leisure' },
  { value: '2', label: 'Work' },
  { value: '3', label: 'Practice riding' },
  { value: '4', label: 'While my bike is being repaired' },
  { value: '5', label: 'Other' },
];

const wantOptions = [
  { value: '1', label: 'Already own one' },
  { value: '2', label: 'Plan to purchase' },
  { value: '3', label: 'Want one' },
  { value: '4', label: 'Do not want one' },
];

const touringOptions = [
  { value: '1', label: 'Yes' },
  { value: '2', label: 'No' },
];

const magazineOptions = [
  { value: '1', label: 'Yes' },
  { value: '2', label: 'No' },
];

const chanceOptions = [
  { value: '1', label: 'Friend referral' },
  { value: '2', label: 'Found online' },
  { value: '3', label: 'Walk-in' },
  { value: '4', label: 'Returning customer' },
  { value: '5', label: 'Other' },
];

const formatPhoneDisplay = (phone: string) => {
  const normalized = phone.replace(/^\+/, '');
  if (normalized.startsWith('81') && normalized.length > 2) {
    return `0${normalized.slice(2)}`;
  }
  return phone;
};

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
  sex: '1',
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
          setUserError('We could not confirm your login status. Please try again later.');
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
        message: 'Uploading...',
      });

      uploadLicenseImage(file)
        .then((result) => {
          updateLicenseUpload(index, {
            fileName: result.fileName,
            imageUrl: result.url,
            uploadedAt: result.uploadedAt,
            status: 'success',
            message: 'Upload completed.',
          });
        })
        .catch((error) => {
          const message =
            error instanceof Error ? error.message : 'Failed to upload the license image.';
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
        setSubmitMessage('Failed to fetch your user info. Please sign in again and retry.');
        return;
      }

      const hasLicenseUpload = licenseUploads.some(
        (upload) => upload.imageUrl && upload.fileName,
      );
      const isUploadLoading = licenseUploads.some((upload) => upload.status === 'loading');
      const hasUploadError = licenseUploads.some((upload) => upload.status === 'error');

      if (isUploadLoading) {
        setSubmitStatus('error');
        setSubmitMessage('Please wait for the license image upload to finish.');
        return;
      }

      if (hasUploadError) {
        setSubmitStatus('error');
        setSubmitMessage('The license image upload failed. Please upload again.');
        return;
      }

      if (!hasLicenseUpload) {
        setSubmitStatus('error');
        setSubmitMessage('Please upload your license image file.');
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
        throw new Error(result.message || 'Failed to save.');
        }

        setSubmitStatus('success');
        setSubmitMessage(result.message || 'Registration details saved.');
        setTimeout(() => {
          void router.push('/mypage');
        }, 600);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save.';
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
        <title>Full registration | ヤスカリ</title>
        <meta name="description" content="Enter the required information for full registration from My Page." />
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b border-gray-100 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
            <Link href="/en" className="flex items-center gap-3">
              <img src="/static/images/logo/250x50.png" alt="ヤスカリ" width={200} height={40} className="hidden md:block" />
              <div className="flex items-center gap-2 md:hidden">
                <img src="/static/images/logo/300x300.jpg" alt="ヤスカリ" width={44} height={44} className="rounded-full" />
                <span className="text-sm font-semibold text-gray-800">ヤスカリ rental bikes</span>
              </div>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/en" className="text-red-600 hover:underline">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/en/mypage" className="text-red-600 hover:underline">
                  My Page
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-600">Full registration</li>
            </ol>
          </nav>

          <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900">Full registration form</h1>
            <p className="mt-2 text-sm text-gray-600">
              Please enter the basic details required to use our rentals. After you submit, the information will be saved to DynamoDB (yasukariUserMain).
            </p>
            {userError ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{userError}</p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                  Email address
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
                <p className="mt-1 text-xs text-gray-500">The email registered to your Cognito account is used.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="name1">
                    Last name (Kanji)
                  </label>
                  <input
                    id="name1"
                    name="name1"
                    type="text"
                    value={formData.name1}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                  placeholder="Yamada"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="name2">
                    First name (Kanji)
                  </label>
                  <input
                    id="name2"
                    name="name2"
                    type="text"
                    value={formData.name2}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                  placeholder="Taro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="kana1">
                    Last name (Kana)
                  </label>
                  <input
                    id="kana1"
                    name="kana1"
                    type="text"
                    value={formData.kana1}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                  placeholder="YAMADA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="kana2">
                    First name (Kana)
                  </label>
                  <input
                    id="kana2"
                    name="kana2"
                    type="text"
                    value={formData.kana2}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                  placeholder="TARO"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="sex">
                    Gender
                  </label>
                  <select
                    id="sex"
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                  >
                    <option value="1">Male</option>
                    <option value="2">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="birth">
                    Birthday
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
                    Postal code
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
                    Address line 1 (prefecture / city)
                  </label>
                  <input
                    id="address1"
                    name="address1"
                    type="text"
                    value={formData.address1}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                  placeholder="Tokyo Adachi-ku"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="address2">
                    Address line 2 (block / building)
                  </label>
                  <input
                    id="address2"
                    name="address2"
                    type="text"
                    value={formData.address2}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                  placeholder="1-1 Yasukari Building 101"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="mobile">
                    Mobile phone number (optional)
                  </label>
                  {availablePhones.length > 0 ? (
                    <select
                      id="mobile-select"
                      name="mobile-select"
                      value={selectedPhoneOption}
                      onChange={handlePhoneSelect}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    >
                      <option value="">Enter manually</option>
                      {availablePhones.map((phone) => {
                        const normalized = phone.replace(/^\+/, '');
                        const countryCode = normalized.startsWith('81') ? '+81' : '';
                        return (
                          <option key={phone} value={phone}>
                            {countryCode ? `${countryCode} ` : ''}
                            {formatPhoneDisplay(phone)}
                          </option>
                        );
                      })}
                    </select>
                  ) : null}
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    value={formatPhoneDisplay(formData.mobile)}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="09012345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="tel">
                    Home phone number (optional)
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
                    License number
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
                    Upload license images (up to 2 files)
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
                        License image {index + 1}
                        {index === 1 ? ' (optional)' : ''}
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
                        <p className="mt-1 text-xs text-gray-500">Selected: {upload.fileName}</p>
                      ) : null}
                      {upload.status === 'loading' ? (
                        <p className="mt-1 text-xs text-gray-500">Uploading...</p>
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
                          Clear
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-800">
                <h3 className="text-base font-semibold text-gray-900">International Driving Permit check</h3>
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="font-medium">Q1. Do you have an International Driving Permit (IDP) under the 1949 Geneva Convention format?</p>
                    <p className="ml-2 mt-1">⭕ Yes → proceed to Q2</p>
                    <p className="ml-2">❌ No → You cannot drive in Japan</p>
                  </div>
                  <div>
                    <p className="font-medium">Q2. Is your IDP issued by a country that actually issues the 1949 Geneva Convention format?</p>
                    <p className="ml-2 mt-1">(Examples: United States, Canada, United Kingdom, Italy, Spain, South Korea, Thailand, etc.)</p>
                    <p className="ml-2 mt-1">⭕ Yes → You can drive in Japan</p>
                    <p className="ml-2">❌ No → proceed to Q3</p>
                  </div>
                  <div>
                    <p className="font-medium">Q3. Does your country fall under the special exception list?</p>
                    <p className="ml-2 mt-1">(France, Belgium, Monaco, etc. – do not issue IDP but have exceptions)</p>
                    <p className="ml-2 mt-1">⭕ Yes → Your domestic license + Japanese translation (JAF, etc.) + passport → You can drive in Japan</p>
                    <p className="ml-2">❌ No → You cannot drive in Japan</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-700">
                  Notes: You can drive for up to one year from your entry date into Japan. Vienna Convention IDPs are not valid in Japan. The issuing country and permit format are critical.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="work_place">
                    Workplace name (optional)
                  </label>
                  <input
                    id="work_place"
                    name="work_place"
                    type="text"
                    value={formData.work_place}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                  placeholder="Yasukari Inc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="work_address">
                    Workplace address (optional)
                  </label>
                  <input
                    id="work_address"
                    name="work_address"
                    type="text"
                    value={formData.work_address}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                  placeholder="Tokyo Adachi-ku"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="work_tel">
                    Workplace phone (optional)
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
                    Emergency contact name (optional)
                  </label>
                  <input
                    id="other_name"
                    name="other_name"
                    type="text"
                    value={formData.other_name}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                  placeholder="Hanako Yamada"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="other_address">
                    Emergency contact address (optional)
                  </label>
                  <input
                    id="other_address"
                    name="other_address"
                    type="text"
                    value={formData.other_address}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                  placeholder="Tokyo Adachi-ku"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="other_tel">
                    Emergency contact phone (optional)
                  </label>
                  <input
                    id="other_tel"
                    name="other_tel"
                    type="tel"
                    value={formData.other_tel}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-700 focus:border-red-500 focus:outline-none"
                    placeholder="0312345678"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-xl bg-red-50 p-4 text-sm text-gray-800">
                <h2 className="text-base font-semibold text-gray-900">Survey</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="enquete_purpose">
                      Purpose of use
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
                      Interest in purchasing a bike
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
                      Touring experience
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
                      Do you read motorcycle magazines?
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
                      How did you learn about our service?
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

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">After submission, your details will be saved to DynamoDB (yasukariUserMain).</p>
                <button
                  type="submit"
                  disabled={isSubmitting || loadingUser}
                  className="inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {isSubmitting ? 'Submitting…' : 'Complete full registration'}
                </button>
              </div>
              <div className="flex justify-center">
                <Link
                  href="/mypage"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
                >
                  Back to My Page
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
