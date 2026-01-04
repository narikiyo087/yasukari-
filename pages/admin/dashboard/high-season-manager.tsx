import Head from "next/head";

import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import HighSeasonManager from "../../../components/dashboard/high-season-manager/HighSeasonManager";
import styles from "../../../styles/HolidayManager.module.css";

export default function HighSeasonManagerPage() {
  return (
    <>
      <Head>
        <title>ハイシーズン設定</title>
      </Head>
      <DashboardLayout
        title="ハイシーズン設定"
        description="カレンダーからハイシーズンのON/OFFを管理します。"
      >
        <main className={styles.managerRoot}>
          <HighSeasonManager />
        </main>
      </DashboardLayout>
    </>
  );
}
