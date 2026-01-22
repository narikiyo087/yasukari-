import Head from "next/head";
import styles from "../../styles/MaintenancePage.module.css";

export default function MaintenancePageEn() {
  return (
    <>
      <Head>
        <title>Site Under Maintenance | ヤスカリ</title>
      </Head>
      <main className={styles.main}>
        <section className={styles.card}>
          <div className={styles.badge}>Under Maintenance</div>
          <h1 className={styles.title}>Temporarily unavailable for New Year maintenance.</h1>
          <p className={styles.message}>
            Thank you for visiting ヤスカリ. We are performing scheduled maintenance for the New Year holiday and will return shortly. We appreciate your patience while we finish preparing the site.
          </p>
          <p className={styles.subMessage}>
            For urgent inquiries or reservations, please contact us by phone or via our official LINE account.
          </p>
        </section>
      </main>
    </>
  );
}
