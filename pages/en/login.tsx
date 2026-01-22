import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { buildAuthorizeUrl, buildSignupUrl, createAndStoreOauthState } from '../../lib/cognitoHostedUi';

export default function LoginPageEn() {
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
            setSessionUser(user.email || user.username ? user : { email: 'Signed in' });
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
          setError('Unable to verify your session. Please try again later.');
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
      window.location.href = buildAuthorizeUrl(state, { lang: "en" });
    } catch (err) {
      console.error(err);
      setError('Unable to start login. Please try again later.');
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

      await router.replace('/en');
      window.location.reload();
    } catch (err) {
      console.error(err);
      setStartingLogout(false);
      setError('Unable to start logout. Please try again later.');
    }
  };

  const handleSignup = () => {
    setError('');
    setStartingSignup(true);
    try {
      const state = createAndStoreOauthState();
      window.location.href = buildSignupUrl(state, { lang: "en" });
    } catch (err) {
      console.error(err);
      setStartingSignup(false);
      setError('Unable to open the sign up page. Please try again later.');
    }
  };

  return (
    <>
      <Head>
        <title>Login | ヤスカリ</title>
      </Head>
      <div className="min-h-screen bg-white text-gray-900">
        <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/en" className="text-blue-600 hover:underline">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-600">Login</li>
            </ol>
          </nav>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900">Manage your rentals from My Page</h1>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Track your active rentals, extend plans online, and keep your payment details up to date from one place. We
                also share member-only promotions here.
              </p>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                {[{ text: 'Check the latest rental status and history anytime' }, { text: 'Complete extensions and option add-ons online' }, { text: 'Receive member-exclusive coupons and new bike updates first' }].map(
                  (item) => (
                    <li key={item.text} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden="true" />
                      <span>{item.text}</span>
                    </li>
                  )
                )}
              </ul>
              <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                <p className="font-semibold">New to ヤスカリ?</p>
                <p className="mt-1 leading-relaxed">
                  You can start with a quick pre-registration using your email. If you are new, please proceed to the
                  <button
                    type="button"
                    onClick={handleSignup}
                    disabled={startingSignup}
                    className="ml-1 font-semibold text-red-700 underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Login / Sign up page
                  </button>
                  .
                </p>
              </div>
            </section>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 space-y-2 text-center">
                <h2 className="text-xl font-semibold text-gray-900">Login / Sign up</h2>
              </div>
              {error ? (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              ) : null}
              {sessionUser ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex w-full items-center justify-center rounded-full bg-gray-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={startingLogout}
                >
                  {startingLogout ? 'Redirecting to logout…' : 'Log out'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="inline-flex w-full items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={checkingSession || startingLogin}
                  >
                    {checkingSession ? 'Checking your session…' : startingLogin ? 'Preparing redirect…' : 'Go to login page'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSignup}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-red-600 px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={startingSignup}
                  >
                    Go to sign up page
                  </button>
                </>
              )}
              <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left text-xs leading-relaxed text-gray-600">
                <p className="font-semibold text-gray-900">How login works</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Tap "Go to login page" to open the hosted login screen</li>
                  <li>After authentication, you will be redirected back to {process.env.NEXT_PUBLIC_SITE_NAME ?? 'My Page'}</li>
                  <li>On your first login, we will guide you through entering your member information</li>
                  <li>Please complete the full registration to save the information required for reservations</li>
                </ol>
              </div>
              <p className="mt-6 text-center text-xs text-gray-500">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={handleSignup}
                  disabled={startingSignup}
                  className="font-semibold text-red-600 underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
