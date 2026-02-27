import Head from "next/head";
import { Fragment, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import type { Member } from "../../../../lib/members";
import styles from "../../../../styles/Dashboard.module.css";
import tableStyles from "../../../../styles/AdminTable.module.css";
import memberStyles from "../../../../styles/AdminMember.module.css";

const statusBadgeClassName = (status: Member["registrationStatus"]): string => {
  if (status === "本登録済") {
    return `${memberStyles.statusBadge} ${memberStyles.statusBadgeOn}`;
  }

  if (status === "仮登録済" || status === "管理者追加済") {
    return `${memberStyles.statusBadge} ${memberStyles.statusBadgePending}`;
  }

  return `${memberStyles.statusBadge} ${memberStyles.statusBadgeOff}`;
};

export default function MemberListPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortState, setSortState] = useState<{
    key:
      | "email"
      | "name"
      | "nameKana"
      | "role"
      | "isInternational"
      | "registrationStatus"
      | "updatedAt";
    direction: "asc" | "desc";
  }>({
    key: "updatedAt",
    direction: "desc",
  });

  const pageSize = 100;

  const handleExportCsv = () => {
    window.open("/api/admin/members/export", "_blank", "noopener,noreferrer");
  };

  const openMemberDetail = (memberId: string) => {
    router.push(`/admin/dashboard/members/${memberId}`);
  };

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    memberId: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMemberDetail(memberId);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadMembers = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await fetch("/api/admin/members");
        if (!response.ok) {
          throw new Error("会員情報の取得に失敗しました。");
        }
        const data = (await response.json()) as { members?: Member[] };
        if (isMounted) {
          setMembers(data.members ?? []);
        }
      } catch (error) {
        console.error("Failed to load members", error);
        if (isMounted) {
          setErrorMessage("会員情報の取得に失敗しました。");
          setMembers([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMembers();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortState.direction, sortState.key]);

  const filteredMembers = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) {
      return members;
    }
    return members.filter((member) => {
      const searchableValues = [
        member.email,
        member.name,
        member.nameKana,
        member.role,
        member.registrationStatus,
      ];
      return searchableValues.some((value) =>
        value?.toLowerCase().includes(normalizedTerm)
      );
    });
  }, [members, searchTerm]);

  const sortedMembers = useMemo(() => {
    const directionMultiplier = sortState.direction === "asc" ? 1 : -1;
    return [...filteredMembers].sort((a, b) => {
      switch (sortState.key) {
        case "isInternational": {
          const aValue = a.isInternational ? 1 : 0;
          const bValue = b.isInternational ? 1 : 0;
          return (aValue - bValue) * directionMultiplier;
        }
        case "updatedAt": {
          const aTime = new Date(a.updatedAt).getTime();
          const bTime = new Date(b.updatedAt).getTime();
          if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
            return a.updatedAt.localeCompare(b.updatedAt, "ja") * directionMultiplier;
          }
          return (aTime - bTime) * directionMultiplier;
        }
        case "email":
        case "name":
        case "nameKana":
        case "role":
        case "registrationStatus":
          return a[sortState.key].localeCompare(b[sortState.key], "ja") * directionMultiplier;
        default:
          return 0;
      }
    });
  }, [filteredMembers, sortState.direction, sortState.key]);

  const toggleSort = (key: typeof sortState.key) => {
    setSortState((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        key,
        direction: "asc",
      };
    });
  };

  const totalPages = Math.max(1, Math.ceil(sortedMembers.length / pageSize));
  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const pagedMembers = sortedMembers.slice(startIndex, startIndex + pageSize);

  return (
    <>
      <Head>
        <title>会員一覧 | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="会員管理"
        description="会員情報の確認や状態の把握を行うためのダッシュボードです。"
      >
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>会員一覧</h2>
            <p className={styles.sectionDescription}>
              行をクリックすると別ページで詳細が開きます。Cognito と DynamoDB の会員情報を集約表示します。
            </p>
            {isLoading && (
              <p className={styles.sectionDescription}>会員情報を読み込み中です...</p>
            )}
            {errorMessage && (
              <p className={styles.sectionDescription}>{errorMessage}</p>
            )}
          </div>
          <div className={styles.tableToolbar}>
            <div className={styles.tableToolbarGroup}>
              <input
                type="search"
                className={styles.tableSearchInput}
                placeholder="メールアドレス・氏名・権限・ステータスで検索"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="会員一覧を検索"
              />
            </div>
            <div className={styles.tableToolbarGroup}>
              <button
                type="button"
                className={styles.tableToolbarButton}
                onClick={handleExportCsv}
              >
                全会員CSVをダウンロード
              </button>
              <span className={styles.tableSelectionCount}>
                該当: {filteredMembers.length}件
              </span>
            </div>
          </div>

          <div className={`${tableStyles.wrapper} ${tableStyles.tableWrapper}`}>
            <table className={`${tableStyles.table} ${tableStyles.dataTable}`}>
              <thead>
                <tr>
                  <th
                    scope="col"
                    aria-sort={
                      sortState.key === "email"
                        ? sortState.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      className={tableStyles.sortableHeaderButton}
                      onClick={() => toggleSort("email")}
                    >
                      メールアドレス
                      <span
                        className={`${tableStyles.sortIcon} ${
                          sortState.key === "email"
                            ? sortState.direction === "asc"
                              ? tableStyles.sortIconAsc
                              : tableStyles.sortIconDesc
                            : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </th>
                  <th
                    scope="col"
                    aria-sort={
                      sortState.key === "name"
                        ? sortState.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      className={tableStyles.sortableHeaderButton}
                      onClick={() => toggleSort("name")}
                    >
                      会員名
                      <span
                        className={`${tableStyles.sortIcon} ${
                          sortState.key === "name"
                            ? sortState.direction === "asc"
                              ? tableStyles.sortIconAsc
                              : tableStyles.sortIconDesc
                            : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </th>
                  <th
                    scope="col"
                    aria-sort={
                      sortState.key === "nameKana"
                        ? sortState.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      className={tableStyles.sortableHeaderButton}
                      onClick={() => toggleSort("nameKana")}
                    >
                      カナ氏名
                      <span
                        className={`${tableStyles.sortIcon} ${
                          sortState.key === "nameKana"
                            ? sortState.direction === "asc"
                              ? tableStyles.sortIconAsc
                              : tableStyles.sortIconDesc
                            : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </th>
                  <th
                    scope="col"
                    aria-sort={
                      sortState.key === "role"
                        ? sortState.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      className={tableStyles.sortableHeaderButton}
                      onClick={() => toggleSort("role")}
                    >
                      権限
                      <span
                        className={`${tableStyles.sortIcon} ${
                          sortState.key === "role"
                            ? sortState.direction === "asc"
                              ? tableStyles.sortIconAsc
                              : tableStyles.sortIconDesc
                            : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </th>
                  <th
                    scope="col"
                    aria-sort={
                      sortState.key === "isInternational"
                        ? sortState.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      className={tableStyles.sortableHeaderButton}
                      onClick={() => toggleSort("isInternational")}
                    >
                      海外ユーザー
                      <span
                        className={`${tableStyles.sortIcon} ${
                          sortState.key === "isInternational"
                            ? sortState.direction === "asc"
                              ? tableStyles.sortIconAsc
                              : tableStyles.sortIconDesc
                            : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </th>
                  <th
                    scope="col"
                    aria-sort={
                      sortState.key === "registrationStatus"
                        ? sortState.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      className={tableStyles.sortableHeaderButton}
                      onClick={() => toggleSort("registrationStatus")}
                    >
                      状態
                      <span
                        className={`${tableStyles.sortIcon} ${
                          sortState.key === "registrationStatus"
                            ? sortState.direction === "asc"
                              ? tableStyles.sortIconAsc
                              : tableStyles.sortIconDesc
                            : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </th>
                  <th
                    scope="col"
                    aria-sort={
                      sortState.key === "updatedAt"
                        ? sortState.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      className={tableStyles.sortableHeaderButton}
                      onClick={() => toggleSort("updatedAt")}
                    >
                      最終更新
                      <span
                        className={`${tableStyles.sortIcon} ${
                          sortState.key === "updatedAt"
                            ? sortState.direction === "asc"
                              ? tableStyles.sortIconAsc
                              : tableStyles.sortIconDesc
                            : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7}>該当する会員が見つかりませんでした。</td>
                  </tr>
                ) : (
                  pagedMembers.map((member) => (
                    <Fragment key={member.id}>
                      <tr
                        className={tableStyles.clickableRow}
                        onClick={() => openMemberDetail(member.id)}
                        onKeyDown={(event) => handleRowKeyDown(event, member.id)}
                        tabIndex={0}
                        aria-label={`${member.name} の詳細を開く`}
                      >
                        <td>{member.email}</td>
                        <td>{member.name}</td>
                        <td>{member.nameKana}</td>
                        <td>{member.role}</td>
                        <td>{member.isInternational ? "海外利用あり" : "国内のみ"}</td>
                        <td>
                          <span className={statusBadgeClassName(member.registrationStatus)}>
                            {member.registrationStatus}
                          </span>
                        </td>
                        <td>{member.updatedAt}</td>
                      </tr>
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className={styles.tableToolbar}>
            <div className={styles.tableToolbarGroup}>
              <span className={styles.tableSelectionCount}>
                {filteredMembers.length === 0
                  ? "0件"
                  : `${startIndex + 1}-${Math.min(
                      startIndex + pageSize,
                      filteredMembers.length
                    )}件 / 全${filteredMembers.length}件`}
              </span>
            </div>
            <div className={styles.tableToolbarGroup}>
              <button
                type="button"
                className={styles.tableToolbarButton}
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                disabled={safeCurrentPage === 1}
              >
                前へ
              </button>
              <span className={styles.tableSelectionCount}>
                {safeCurrentPage} / {totalPages}ページ
              </span>
              <button
                type="button"
                className={styles.tableToolbarButton}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={safeCurrentPage === totalPages}
              >
                次へ
              </button>
            </div>
          </div>
        </section>
      </DashboardLayout>
    </>
  );
}
