import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../../../../../components/dashboard/DashboardLayout";
import formStyles from "../../../../../styles/AdminForm.module.css";
import styles from "../../../../../styles/PhotoUploads.module.css";

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
  images: {
    imageUrl: string;
    fileName: string;
    uploadedAt: string;
  }[];
};

export default function LicenseUploadDetailPage() {
  const router = useRouter();
  const memberId =
    typeof router.query.memberId === "string" ? router.query.memberId : undefined;
  const [uploads, setUploads] = useState<LicenseUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) return;
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
  }, [memberId]);

  const upload = useMemo(
    () => uploads.find((item) => item.id === memberId),
    [uploads, memberId]
  );

  return (
    <>
      <Head>
        <title>免許証画像詳細</title>
      </Head>
      <DashboardLayout
        title="免許証画像詳細"
        description="クリックした免許証画像の情報を確認できます。"
        actions={[
          { label: "一覧へ戻る", href: "/admin/dashboard/photo-uploads/license-uploads" },
        ]}
      >
        <div className={formStyles.cardStack}>
          {isLoading ? (
            <section className={formStyles.card}>
              <p className={styles.sectionNote}>読み込み中です…</p>
            </section>
          ) : errorMessage ? (
            <section className={formStyles.card}>
              <p className={styles.sectionNote}>{errorMessage}</p>
              <Link
                href="/admin/dashboard/photo-uploads/license-uploads"
                className={formStyles.primaryButton}
              >
                一覧へ戻る
              </Link>
            </section>
          ) : upload ? (
            <section className={styles.detailLayout}>
              <div className={styles.uploadGrid}>
                {upload.images.map((image, index) => (
                  <div key={image.imageUrl} className={styles.detailImageCard}>
                    <img
                      src={image.imageUrl}
                      alt={`${upload.userName}の免許証画像${index + 1}`}
                      className={styles.detailImage}
                    />
                    <div className={styles.detailMetaRow}>
                      <span className={styles.detailMetaLabel}>画像 {index + 1}</span>
                      <span className={styles.detailMetaValue}>{image.fileName}</span>
                      <span className={styles.detailMetaValue}>{image.uploadedAt}</span>
                    </div>
                    <div className={styles.detailMetaRow}>
                      <span className={styles.detailMetaLabel}>確認ポイント</span>
                      <p className={styles.detailNote}>
                        免許証番号・氏名・有効期限が判別できるか確認してください。
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <aside className={styles.detailMetaCard}>
                <div className={styles.detailMetaRow}>
                  <span className={styles.detailMetaLabel}>氏名</span>
                  <span className={styles.detailMetaValue}>
                    {upload.userName}
                  </span>
                </div>
                <div className={styles.detailMetaRow}>
                  <span className={styles.detailMetaLabel}>ユーザーID</span>
                  <span className={styles.detailMetaValue}>{upload.userId}</span>
                </div>
                <div className={styles.detailMetaRow}>
                  <span className={styles.detailMetaLabel}>メールアドレス</span>
                  <span className={styles.detailMetaValue}>{upload.email}</span>
                </div>
                <div className={styles.detailMetaRow}>
                  <span className={styles.detailMetaLabel}>電話番号</span>
                  <span className={styles.detailMetaValue}>{upload.phone}</span>
                </div>
                <div className={styles.detailMetaRow}>
                  <span className={styles.detailMetaLabel}>ファイル名</span>
                  <span className={styles.detailMetaValue}>{upload.fileName}</span>
                </div>
                <div className={styles.detailMetaRow}>
                  <span className={styles.detailMetaLabel}>登録枚数</span>
                  <span className={styles.detailMetaValue}>
                    {upload.imageCount}枚
                  </span>
                </div>
                <div className={styles.detailMetaRow}>
                  <span className={styles.detailMetaLabel}>送信日時</span>
                  <span className={styles.detailMetaValue}>
                    {upload.uploadedAt}
                  </span>
                </div>
                <Link
                  href="/admin/dashboard/photo-uploads/license-uploads"
                  className={formStyles.primaryButton}
                >
                  一覧に戻る
                </Link>
              </aside>
            </section>
          ) : (
            <section className={formStyles.card}>
              <div className={styles.emptyState}>
                指定された免許証画像が見つかりませんでした。
              </div>
              <Link
                href="/admin/dashboard/photo-uploads/license-uploads"
                className={formStyles.primaryButton}
              >
                一覧へ戻る
              </Link>
            </section>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
