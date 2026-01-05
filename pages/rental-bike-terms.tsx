import Head from 'next/head';

import RentalBikeTermsContent from '../components/RentalBikeTermsContent';

export default function RentalBikeTermsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Head>
        <title>レンタルバイク利用規約</title>
      </Head>

      <RentalBikeTermsContent />
    </div>
  );
}
