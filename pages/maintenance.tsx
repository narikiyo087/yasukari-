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
            サイトをご利用いただきありがとうございます。現在、メンテナンス作業のため
            ページの閲覧を一時的に停止しております。作業完了まで今しばらくお待ち
            ください。
          </p>
          <p className={styles.notice}>
            メンテナンスは <strong>1/5</strong> までを予定しております。再開まで今しばらく
            お待ちください。
          </p>
          <p className={styles.message}>
            現在レンタル中の方は、以下のURLよりご予約状況をご確認ください。
            <br />
            <a href="https://yasukari.com/my">マイページ（旧）</a>
          </p>
        </section>
      </main>
    </>
  );
}
