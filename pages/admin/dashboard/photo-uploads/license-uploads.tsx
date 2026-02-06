import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import formStyles from "../../../../styles/AdminForm.module.css";
import styles from "../../../../styles/PhotoUploads.module.css";

type LicenseUpload = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  uploadedAt: string;
  imageUrl: string;
  fileName: string;
  imageCount: number;
};

export default function LicenseUploadListPage() {
  const [uploads, setUploads] = useState<LicenseUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadUploads = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await fetch("/api/admin/license-uploads");
        if (!response.ok) {
          throw new Error("免許証画像の取得に失敗しました。");
        }
        const data = (await response.json()) as { uploads?: LicenseUpload[] };
        if (isMounted) {
          setUploads(data.uploads ?? []);
        }
      } catch (error) {
        console.error("Failed to load license uploads", error);
        if (isMounted) {
          setErrorMessage("免許証画像の取得に失敗しました。");
          setUploads([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadUploads();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Head>
        <title>免許証画像 | 写真アップロード確認</title>
      </Head>
      <DashboardLayout
        title="免許証画像"
        description="本登録でアップロードされた免許証画像を一覧で確認できます。"
      >
        <div className={formStyles.cardStack}>
          <section className={formStyles.card}>
            <header className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>免許証画像一覧</h2>
              <p className={styles.sectionNote}>
                S3に保存された免許証画像とユーザー情報、送信日時を確認できます。
              </p>
              {isLoading ? (
                <p className={styles.sectionNote}>読み込み中です…</p>
              ) : null}
              {errorMessage ? (
                <p className={styles.sectionNote}>{errorMessage}</p>
              ) : null}
            </header>
            {!isLoading && uploads.length === 0 ? (
              <div className={styles.emptyState}>
                現在確認待ちの免許証画像はありません。
              </div>
            ) : (
              <div className={styles.photoGrid}>
                {uploads.map((upload) => (
                  <Link
                    key={upload.id}
                    href={`/admin/dashboard/photo-uploads/license-uploads/${upload.id}`}
                    className={`${styles.photoCard} ${styles.photoLink}`}
                  >
                    <img
                      src={upload.imageUrl}
                      alt={`${upload.userName}の免許証画像`}
                      className={styles.photoThumb}
                    />
                    <div className={styles.photoMeta}>
                      <span className={styles.photoName}>{upload.userName}</span>
                      <span className={styles.photoSubtext}>
                        登録枚数: {upload.imageCount}枚
                      </span>
                      <span className={styles.photoSubtext}>
                        ファイル名: {upload.fileName}
                      </span>
                      <span className={styles.photoSubtext}>ID: {upload.userId}</span>
                      <span className={styles.photoSubtext}>{upload.email}</span>
                      <span className={styles.photoSubtext}>{upload.phone}</span>
                      <span className={styles.photoSubtext}>{upload.uploadedAt}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </DashboardLayout>
    </>
  );
}
