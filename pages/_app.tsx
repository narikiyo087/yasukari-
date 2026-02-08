import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';

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
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WGZGH2XV');`,
        }}
      />
      <noscript>
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=GTM-WGZGH2XV"
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
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
