import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../../../../../components/dashboard/DashboardLayout";
import formStyles from "../../../../../styles/AdminForm.module.css";
import styles from "../../../../../styles/PhotoUploads.module.css";

type AccidentReport = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  uploadedAt: string;
  imageUrl: string;
  description: string;
};

export default function AccidentReportDetailPage() {
  const router = useRouter();
  const reportId =
    typeof router.query.reportId === "string" ? router.query.reportId : undefined;
  const [reports, setReports] = useState<AccidentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) return;
    let isMounted = true;
    const loadReports = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await fetch("/api/admin/accident-reports");
        if (!response.ok) {
          throw new Error("事故・転倒報告の取得に失敗しました。");
        }
        const data = (await response.json()) as { reports?: AccidentReport[] };
        if (isMounted) {
          setReports(data.reports ?? []);
        }
      } catch (error) {
        console.error("Failed to load accident reports", error);
        if (isMounted) {
          setErrorMessage("事故・転倒報告の取得に失敗しました。");
          setReports([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadReports();
    return () => {
      isMounted = false;
    };
  }, [reportId]);

  const report = useMemo(
    () => reports.find((item) => item.id === reportId),
    [reports, reportId]
  );

  return (
    <>
      <Head>
        <title>事故・転倒報告詳細</title>
      </Head>
      <DashboardLayout
        title="事故・転倒報告詳細"
        description="クリックした事故・転倒報告の情報を確認できます。"
        actions={[
          { label: "一覧へ戻る", href: "/admin/dashboard/photo-uploads/accident-reports" },
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
                href="/admin/dashboard/photo-uploads/accident-reports"
                className={formStyles.primaryButton}
              >
                一覧へ戻る
              </Link>
            </section>
          ) : report ? (
            <section className={styles.detailLayout}>
              <div className={styles.detailImageCard}>
                <img
                  src={report.imageUrl}
                  alt={`${report.userName}の事故・転倒報告写真`}
                  className={styles.detailImage}
                />
                <div className={styles.detailMetaRow}>
                  <span className={styles.detailMetaLabel}>確認ポイント</span>
                  <p className={styles.detailNote}>
                    S3上の原本と照らし合わせて、事故・転倒報告内容を確認してください。
                  </p>
                </div>
              </div>
              <aside className={styles.detailMetaCard}>
                <div className={styles.detailMetaRow}>
                  <span className={styles.detailMetaLabel}>氏名</span>
                  <span className={styles.detailMetaValue}>
                    {report.userName}
                  </span>
                </div>
                <div className={styles.detailMetaRow}>
                  <span className={styles.detailMetaLabel}>ユーザーID</span>
                  <span className={styles.detailMetaValue}>{report.userId}</span>
                </div>
                <div className={styles.detailMetaRow}>
                  <span className={styles.detailMetaLabel}>メールアドレス</span>
                  <span className={styles.detailMetaValue}>{report.email}</span>
                </div>
                <div className={styles.detailMetaRow}>
                  <span className={styles.detailMetaLabel}>電話番号</span>
                  <span className={styles.detailMetaValue}>{report.phone}</span>
                </div>
                <div className={styles.detailMetaRow}>
                  <span className={styles.detailMetaLabel}>送信日時</span>
                  <span className={styles.detailMetaValue}>
                    {report.uploadedAt}
                  </span>
                </div>
                <div className={styles.detailMetaRow}>
                  <span className={styles.detailMetaLabel}>事故・転倒の状況</span>
                  <span className={styles.detailMetaValue}>{report.description || '-'}</span>
                </div>
                <Link
                  href="/admin/dashboard/photo-uploads/accident-reports"
                  className={formStyles.primaryButton}
                >
                  一覧に戻る
                </Link>
              </aside>
            </section>
          ) : (
            <section className={formStyles.card}>
              <div className={styles.emptyState}>
                指定された事故・転倒報告が見つかりませんでした。
              </div>
              <Link
                href="/admin/dashboard/photo-uploads/accident-reports"
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
