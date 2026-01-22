import type { AppProps } from 'next/app';
import Head from 'next/head';

import '../styles/global.css';
import '../styles/desktop.css';
import '../styles/mobile.css';
import MobileNav from '../components/MobileNav';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeaderEn from '../components/HeaderEn';
import FooterEn from '../components/FooterEn';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';
import ChatBotWidget from '../components/ChatBotWidget';


export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isEn = router.pathname.startsWith('/en');
  const isAdminRoute = router.pathname.startsWith('/admin');
  const pathWithoutQuery = router.asPath.split('?')[0];
  const isRentalContractPage = pathWithoutQuery.startsWith('/rental-contract/');
  const isChatbotVisible = !isRentalContractPage;
  const normalizedPath = router.pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  const noIndexPrefixes = [
    '/admin',
    '/auth',
    '/chat',
    '/chat-design',
    '/login',
    '/maintenance',
    '/monitor',
    '/mypage',
    '/notifications',
    '/payment-info',
    '/register',
    '/reserve',
    '/rental-contract',
    '/rental-status',
    '/signup',
    '/test',
    '/wait',
  ];
  const shouldNoIndex = noIndexPrefixes.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  );

  if (isAdminRoute) {
    return (
      <>
        {shouldNoIndex && (
          <Head>
            <meta name="robots" content="noindex, nofollow" />
          </Head>
        )}
        <Component {...pageProps} />
      </>
    );
  }

  return (
    <>
      {shouldNoIndex && (
        <Head>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
      )}
      {!isRentalContractPage && (isEn ? <HeaderEn /> : <Header />)}
      <Layout>
        <Component {...pageProps} />
      </Layout>
      {!isRentalContractPage && (isEn ? <FooterEn /> : <Footer />)}
      <ChatBotWidget visible={isChatbotVisible} />
      <MobileNav />
    </>
  );
}
