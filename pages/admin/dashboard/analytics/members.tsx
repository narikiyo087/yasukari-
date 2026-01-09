import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import type { Member } from "../../../../lib/members";
import styles from "../../../../styles/Dashboard.module.css";

type MemberCounts = {
  provisional: number;
  verified: number;
  withdrawn: number;
  isLoading: boolean;
  error: boolean;
};

const formatCount = (value: number) => value.toLocaleString();

export default function MemberAnalyticsPage() {
  const [memberCounts, setMemberCounts] = useState<MemberCounts>({
    provisional: 0,
    verified: 0,
    withdrawn: 0,
    isLoading: true,
    error: false,
  });

  useEffect(() => {
    let isMounted = true;
    const loadMembers = async () => {
      try {
        setMemberCounts((prev) => ({ ...prev, isLoading: true, error: false }));
        const response = await fetch("/api/admin/members");
        if (!response.ok) {
          throw new Error("Failed to fetch members");
        }
        const data = (await response.json()) as { members?: Member[] };
        const members = data.members ?? [];
        if (isMounted) {
          const isProvisional = (member: Member) =>
            member.registrationStatus === "仮登録済" ||
            member.registrationStatus === "管理者追加済";
          const isVerified = (member: Member) => member.registrationStatus === "本登録済";
          setMemberCounts({
            provisional: members.filter(isProvisional).length,
            verified: members.filter(isVerified).length,
            withdrawn: members.filter((member) => member.status === "退会済み").length,
            isLoading: false,
            error: false,
          });
        }
      } catch (error) {
        console.error("Failed to load member analytics", error);
        if (isMounted) {
          setMemberCounts({
            provisional: 0,
            verified: 0,
            withdrawn: 0,
            isLoading: false,
            error: true,
          });
        }
      }
    };

    loadMembers();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayValues = useMemo(() => {
    if (memberCounts.isLoading) {
      return {
        provisional: "計測中...",
        verified: "計測中...",
        withdrawn: "計測中...",
      };
    }

    if (memberCounts.error) {
      return {
        provisional: "取得に失敗しました",
        verified: "取得に失敗しました",
        withdrawn: "取得に失敗しました",
      };
    }

    return {
      provisional: formatCount(memberCounts.provisional),
      verified: formatCount(memberCounts.verified),
      withdrawn: formatCount(memberCounts.withdrawn),
    };
  }, [memberCounts]);

  return (
    <>
      <Head>
        <title>会員分析 | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="会員分析"
        description="仮登録・本登録ユーザーの数を確認する分析ページです。"
        showDashboardLink
      >
        <section className={styles.menuSection}>
          <div className={styles.dashboardStatsHeader}>
            <div>
              <p className={styles.dashboardSectionKicker}>Member analytics</p>
              <h2 className={styles.dashboardSectionTitle}>会員登録ステータス</h2>
              <p className={styles.dashboardSectionNote}>
                仮登録済・管理者追加済と本登録済の人数を集計しています。退会済み会員も参考値として表示します。
              </p>
            </div>
          </div>

          <div className={styles.analyticsGrid}>
            <article className={styles.analyticsCard}>
              <header className={styles.analyticsCardHeader}>
                <div>
                  <p className={styles.dashboardSectionKicker}>ステータス別</p>
                  <h3 className={styles.dashboardSectionTitle}>会員数サマリー</h3>
                  <p className={styles.dashboardSectionNote}>
                    会員登録の進捗状況を把握するための参考値です。
                  </p>
                </div>
              </header>
              <div className={styles.statGrid}>
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>仮登録（仮登録済・管理者追加済）</p>
                  <p className={styles.statValue}>{displayValues.provisional}</p>
                </div>
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>本登録（本登録済）</p>
                  <p className={styles.statValue}>{displayValues.verified}</p>
                </div>
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>退会済み</p>
                  <p className={styles.statValue}>{displayValues.withdrawn}</p>
                </div>
              </div>
            </article>

            <article className={styles.analyticsCard}>
              <header className={styles.analyticsCardHeader}>
                <div>
                  <p className={styles.dashboardSectionKicker}>次のステップ</p>
                  <h3 className={styles.dashboardSectionTitle}>フォローアップ候補</h3>
                  <p className={styles.dashboardSectionNote}>
                    仮登録ユーザーへのリマインド施策などを計画するためのメモ欄です。
                  </p>
                </div>
              </header>
              <div className={styles.chartPlaceholder}>
                <p className={styles.chartPlaceholderLabel}>施策TODO</p>
                <p className={styles.chartPlaceholderNote}>
                  未認証ユーザー向けの案内テンプレートを用意する予定です。
                </p>
              </div>
            </article>
          </div>
        </section>
      </DashboardLayout>
    </>
  );
}
