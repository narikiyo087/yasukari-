import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import RentalBikeTermsContent from '../../../../components/RentalBikeTermsContent';
import type { RegistrationData } from '../../../../types/registration';

type SessionUser = { id?: string | null };

export default function ReserveTermsAgreementEn() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState('');
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [registrationError, setRegistrationError] = useState('');
  const [loadingRegistration, setLoadingRegistration] = useState(true);
  const [agreeing, setAgreeing] = useState(false);
  const [agreeError, setAgreeError] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);

  const nextSearch = useMemo(() => {
    const params = new URLSearchParams();
    const keys: (keyof typeof router.query)[] = [
      'store',
      'modelName',
      'managementNumber',
      'customerName',
      'email',
      'pickupDate',
      'returnDate',
      'pickupTime',
      'returnTime',
    ];

    keys.forEach((key) => {
      const value = router.query[key];
      if (typeof value === 'string' && value) {
        params.set(key, value);
      }
    });

    return params.toString();
  }, [router.query]);

  useEffect(() => {
    const controller = new AbortController();
    const verifySession = async () => {
      try {
        const response = await fetch('/api/me', { credentials: 'include', signal: controller.signal });

        if (!response.ok) {
          throw new Error('Failed to verify session');
        }

        const data = (await response.json().catch(() => ({}))) as { user?: SessionUser | null };

        if (!data.user) {
          await router.replace('/en/login');
          return;
        }

        setAuthChecked(true);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setAuthError('We could not confirm your login status. Please try again later.');
          setAuthChecked(true);
        }
      }
    };

    void verifySession();
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    if (!authChecked || authError) return;

    const controller = new AbortController();
    const fetchRegistration = async () => {
      try {
        const response = await fetch('/api/register/user', {
          credentials: 'include',
          signal: controller.signal,
        });

        if (response.status === 401) {
          await router.replace('/en/login');
          return;
        }

        if (response.status === 404) {
          setRegistration(null);
          setTermsAgreed(false);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load registration');
        }

        const data = (await response.json()) as { registration?: RegistrationData | null };
        const registrationData = data.registration ?? null;
        setRegistration(registrationData);
        setTermsAgreed(Boolean(registrationData?.rental_terms_agreed_at));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setRegistrationError('Could not load your registration details. Please try again later.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingRegistration(false);
        }
      }
    };

    void fetchRegistration();
    return () => controller.abort();
  }, [authChecked, authError, router]);

  useEffect(() => {
    if (!authChecked || loadingRegistration || !termsAgreed) return;
    if (!nextSearch) return;

    void router.replace(`/en/reserve/flow/step2?${nextSearch}`);
  }, [authChecked, loadingRegistration, nextSearch, router, termsAgreed]);

  const handleAgree = async () => {
    setAgreeError('');
    setAgreeing(true);

    try {
      const response = await fetch('/api/user/rental-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreed: true }),
      });

      if (response.status === 401) {
        await router.replace('/en/login');
        return;
      }

      const payload = (await response.json().catch(() => ({}))) as { agreedAt?: string | null; message?: string };

      if (response.status === 404) {
        throw new Error(payload.message ?? 'Registration data was not found. Please complete your registration first.');
      }

      if (!response.ok) {
        throw new Error(payload.message ?? 'Failed to save your agreement.');
      }

      setTermsAgreed(true);
      setRegistration((prev) => (prev ? { ...prev, rental_terms_agreed_at: payload.agreedAt ?? prev.rental_terms_agreed_at } : prev));

      const search = nextSearch ? `?${nextSearch}` : '';
      void router.push(`/en/reserve/flow/step2${search}`);
    } catch (error) {
      console.error(error);
      setAgreeError(error instanceof Error ? error.message : 'Failed to save your agreement.');
    } finally {
      setAgreeing(false);
    }
  };

  const isReadyToAgree = authChecked && !loadingRegistration && !agreeing && !termsAgreed && Boolean(registration);

  return (
    <>
      <Head>
        <title>Review rental terms - Step 1</title>
      </Head>
      <main className="min-h-screen bg-gray-50 pb-16">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Step 1 / 3</p>
              <h1 className="text-2xl font-bold text-gray-900">Review reservation details</h1>
              <p className="text-sm text-gray-600">Please read and agree to the motorcycle rental terms before moving to options.</p>
            </div>
            <Link
              href="/en/reserve/flow/step1"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-gray-300"
            >
              Back to reservation review
            </Link>
          </header>

          {authError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</p>
          ) : null}
          {registrationError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{registrationError}</p>
          ) : null}
          {agreeError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{agreeError}</p>
          ) : null}

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rental bike terms</p>
                <h2 className="text-lg font-bold text-gray-900">Please review the content</h2>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{termsAgreed ? 'Agreed' : 'Not agreed'}</span>
            </div>
            <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4">
              <RentalBikeTermsContent />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAgree}
                disabled={!isReadyToAgree}
                className="inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-200"
              >
                {agreeing ? 'Saving…' : termsAgreed ? 'Already agreed' : 'Agree and continue'}
              </button>
              <Link
                href="/rental-bike-terms"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-gray-300"
              >
                View terms in a new tab
              </Link>
            </div>
            {!registration && !loadingRegistration ? (
              <p className="text-sm text-gray-700">
                We cannot save your agreement without registration details. Please complete the registration form first.
              </p>
            ) : null}
          </section>
        </div>
      </main>
    </>
  );
}
