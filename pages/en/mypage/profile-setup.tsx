import { FormEvent, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import type { NextPage } from 'next';
import { COUNTRY_OPTIONS, findCountryByDialCodePrefix, formatInternationalPhoneNumber } from '../../../lib/phoneNumber';

type UserAttributes = {
  phone_number?: string;
  'custom:handle'?: string;
  'custom:locale'?: string;
  name?: string;
};

type AttributesResponse = { attributes?: UserAttributes; message?: string };

const REQUIRED_KEYS: (keyof UserAttributes)[] = ['phone_number', 'custom:handle', 'custom:locale', 'name'];

const ProfileSetupPageEn: NextPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attributes, setAttributes] = useState<UserAttributes>({});
  const [showForm, setShowForm] = useState(false);
  const fromLogin = useMemo(() => router.query.fromLogin === '1', [router.query.fromLogin]);
  const normalizedLocale = useMemo(
    () => (attributes['custom:locale'] ?? '').trim().toLowerCase(),
    [attributes['custom:locale']],
  );

  const applyLocaleToPath = (path: string, localeOverride?: string) => {
    if (!path.startsWith('/')) return path;

    const locale = (localeOverride ?? normalizedLocale).trim().toLowerCase();
    const hasEnPrefix = path === '/en' || path.startsWith('/en/');

    if (locale.startsWith('en')) {
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
          throw new Error('Unable to confirm your session.');
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
          throw new Error(data.message ?? 'Failed to fetch user info.');
        }

        const data = (await attrRes.json()) as AttributesResponse;
        setAttributes(data.attributes ?? {});
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setError('Could not load your information. Please try again later.');
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
      setError('Please enter a valid phone number.');
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
        throw new Error(data.message ?? 'Failed to save.');
      }

      setSuccess('Your basic information has been saved.');
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
        const targetPath = applyLocaleToPath('/mypage', payload.locale);
        await router.replace(targetPath);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to save.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const localeLabel = (value: string | undefined) => {
    if (!value) return 'Not set';
    const normalized = value.toLowerCase();
    if (normalized.startsWith('ja') || normalized.startsWith('jp')) return 'Japanese region';
    if (normalized.startsWith('en')) return 'English-speaking region';
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

  const formatDisplayPhoneNumber = (value?: string) => {
    if (!value) return 'Not set';

    const digits = value.replace(/[^0-9]/g, '');
    if (!digits) return 'Not set';

    const matchedCountry = findCountryByDialCodePrefix(digits);
    if (!matchedCountry) return `+${digits}`;

    const national = digits.startsWith(matchedCountry.dialCode)
      ? digits.slice(matchedCountry.dialCode.length)
      : '';
    const nationalWithZero = national ? `0${national}` : '';

    const prefix = `${matchedCountry.name} (+${matchedCountry.dialCode})`;
    return nationalWithZero ? `${matchedCountry.name} ${nationalWithZero}` : prefix;
  };

  return (
    <>
      <Head>
        <title>Basic information</title>
      </Head>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10">
        <header className="space-y-2 text-sm text-slate-600">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href={applyLocaleToPath('/')} className="text-red-600 hover:underline">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={applyLocaleToPath('/mypage')} className="text-red-600 hover:underline">
                  My Page
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-600">Basic information</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-semibold text-slate-900">Basic information</h1>
          <p className="text-sm text-slate-500">
            Register the details needed for booking and communication. Phone number, name, handle name, and location/language are required.
          </p>
        </header>

        {error ? (
          <section className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="text-sm text-red-700">{error}</p>
          </section>
        ) : null}

        {success ? (
          <section className="rounded-lg border border-green-200 bg-green-50 p-6 shadow-sm">
            <p className="text-sm text-green-700">{success}</p>
          </section>
        ) : null}

        {loading ? (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-700">Loading your information…</p>
          </section>
        ) : (
          <>
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Current profile</h2>
                  <p className="mt-1 text-sm text-slate-600">Please review your saved details below.</p>
                </div>
                <Link
                  href={applyLocaleToPath('/mypage')}
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-800"
                >
                  Back to My Page
                </Link>
              </div>
              <dl className="mt-4 grid gap-4 text-sm text-slate-700 md:grid-cols-2">
                <div>
                  <dt className="font-medium text-slate-600">Phone number</dt>
                  <dd className="mt-1 text-slate-800">{formatDisplayPhoneNumber(attributes.phone_number)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-600">Name</dt>
                  <dd className="mt-1 text-slate-800">{attributes.name ?? 'Not set'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-600">Handle name</dt>
                  <dd className="mt-1 text-slate-800">{attributes['custom:handle'] ?? 'Not set'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-600">Location / language</dt>
                  <dd className="mt-1 text-slate-800">{localeLabel(attributes['custom:locale'])}</dd>
                </div>
              </dl>

              <div className="mt-4 space-y-2 text-sm text-slate-700">
                {missingKeys.length === 0 ? (
                  <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-700">
                    All required fields are saved.
                  </p>
                ) : (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                    Required fields missing: {missingKeys.join(', ')}
                  </p>
                )}
              </div>

              {missingKeys.length === 0 && !showForm ? (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                    onClick={() => setShowForm(true)}
                  >
                    Edit basic information
                  </button>
                </div>
              ) : null}
            </section>

            {showForm ? (
              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Edit basic information</h2>
                <p className="mt-1 text-sm text-slate-600">Fill out the form below to update your profile.</p>

                <form className="mt-4 space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
                      <div>
                        <label className="block text-sm font-medium text-slate-700" htmlFor="phone_country">
                          Country/Region
                        </label>
                        <select
                          id="phone_country"
                          name="phone_country"
                          defaultValue={phoneCountry}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        >
                          {COUNTRY_OPTIONS.map((country) => (
                            <option key={country.dialCode} value={country.dialCode}>
                              {country.name} (+{country.dialCode})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700" htmlFor="phone_national">
                          Phone number
                        </label>
                        <input
                          id="phone_national"
                          name="phone_national"
                          type="tel"
                          required
                          defaultValue={phoneNational}
                          placeholder="09012345678"
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <p className="mt-1 text-xs text-slate-500">Enter without hyphens, starting with 0.</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700" htmlFor="name">
                          Name (required)
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          defaultValue={attributes.name ?? ''}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700" htmlFor="handle">
                          Handle name (required)
                        </label>
                        <input
                          id="handle"
                          name="handle"
                          type="text"
                          required
                          defaultValue={attributes['custom:handle'] ?? ''}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <p className="mt-1 text-xs text-slate-500">This will be shown in your reservation history.</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700" htmlFor="locale">
                        Location / language (required)
                      </label>
                      <select
                        id="locale"
                        name="locale"
                        required
                      defaultValue={localeSelectValue()}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="">Select</option>
                        <option value="jp">Japanese region</option>
                        <option value="en">English-speaking region</option>
                      </select>
                      <p className="mt-1 text-xs text-slate-500">We use this to offer tailored support.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-md bg-red-600 px-6 py-2 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Save basic information'}
                    </button>
                    <p className="text-slate-600">Required fields: phone number, name, handle name, and location/language.</p>
                  </div>
                </form>
              </section>
            ) : null}
          </>
        )}
      </main>
    </>
  );
};

export default ProfileSetupPageEn;
