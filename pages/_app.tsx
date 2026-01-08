import type { AppProps } from 'next/app';

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
  const isChatbotVisible = router.pathname === '/test' && !isRentalContractPage;

  if (isAdminRoute) {
    return <Component {...pageProps} />;
  }

  return (
    <>
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
