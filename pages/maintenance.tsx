import Head from "next/head";
import styles from "../styles/MaintenancePage.module.css";

export default function MaintenancePage() {
  return (
    <>
      <Head>
        <title>現在サイト工事中です | ヤスカリ</title>
      </Head>
      <main className={styles.main}>
        <section className={styles.card}>
          <h1 className={styles.title}>サイトを一時的に停止しています</h1>
          <p className={styles.message}>
            メンテナンスです。再開まで今しばらく お待ちください。
          </p>
        </section>
      </main>
    </>
  );
}
