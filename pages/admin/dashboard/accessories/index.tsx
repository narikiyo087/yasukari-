import Head from "next/head";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import { Accessory, AccessoryPriceKey } from "../../../../lib/dashboard/types";
import formStyles from "../../../../styles/AdminForm.module.css";
import tableStyles from "../../../../styles/AdminTable.module.css";
import styles from "../../../../styles/Dashboard.module.css";

const priceLabels: Record<AccessoryPriceKey, string> = {
  "24h": "24時間料金",
  "2d": "2日間料金",
  "4d": "4日間料金",
  "1w": "1週間料金",
  "2w": "2週間料金",
  "1m": "1ヶ月料金",
  extra24h: "追加料金24時間",
};

const formatPrice = (value?: number): string => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return `${value.toLocaleString("ja-JP")}`;
};

export default function AccessoryListPage() {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [deleteConfirmationChecked, setDeleteConfirmationChecked] =
    useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadAccessories = async () => {
      try {
        const response = await fetch("/api/accessories");
        if (!response.ok) {
          setError("用品一覧の取得に失敗しました。");
          return;
        }

        const data: Accessory[] = await response.json();
        setAccessories(data);
        setError(null);
        setDeleteError(null);
      } catch (loadError) {
        console.error("Failed to load accessories", loadError);
        setError("用品一覧の取得に失敗しました。");
      }
    };

    void loadAccessories();
  }, []);

  const filteredAccessories = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return accessories;
    }

    return accessories.filter((item) => {
      const idText = String(item.accessory_id);
      return (
        item.name.toLowerCase().includes(keyword) || idText.includes(keyword)
      );
    });
  }, [accessories, searchTerm]);

  const toggleSelection = (accessoryId: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(accessoryId)) {
        next.delete(accessoryId);
      } else {
        next.add(accessoryId);
      }

      if (next.size === 0) {
        setDeleteConfirmationChecked(false);
      }

      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredAccessories.map((item) => item.accessory_id)));
      return;
    }
    setSelectedIds(new Set());
    setDeleteConfirmationChecked(false);
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch("/api/accessories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessoryIds: Array.from(selectedIds) }),
      });

      const responseData: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          responseData &&
          typeof responseData === "object" &&
          responseData !== null &&
          "message" in responseData &&
          typeof (responseData as { message?: unknown }).message === "string"
            ? (responseData as { message?: string }).message ?? ""
            : "用品の削除に失敗しました。";
        throw new Error(message || "用品の削除に失敗しました。");
      }

      const deletedIds = Array.isArray(
        (responseData as { deletedIds?: unknown })?.deletedIds
      )
        ? (responseData as { deletedIds: unknown[] }).deletedIds.filter(
            (value): value is number => typeof value === "number"
          )
        : Array.from(selectedIds);

      setAccessories((current) =>
        current.filter((item) => !deletedIds.includes(item.accessory_id))
      );
      setSelectedIds(new Set());
      setDeleteConfirmationChecked(false);
    } catch (deleteError) {
      console.error("Failed to delete accessories", deleteError);
      setDeleteError(
        deleteError instanceof Error
          ? deleteError.message
          : "用品の削除に失敗しました。"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const selectedCount = selectedIds.size;
  const disableDelete =
    selectedCount === 0 || !deleteConfirmationChecked || isDeleting;

  return (
    <>
      <Head>
        <title>用品一覧 | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="用品一覧"
        actions={[
          { label: "＋ 用品登録", href: "/admin/dashboard/accessories/register" },
        ]}
      >
        <section className={styles.section}>
          {error && <p className={formStyles.error}>{error}</p>}
          {deleteError && <p className={formStyles.error}>{deleteError}</p>}
          <div className={formStyles.card}>
            <div className={styles.tableToolbar}>
              <div className={styles.tableToolbarGroup}>
                <input
                  type="search"
                  className={styles.tableSearchInput}
                  placeholder="用品名やIDで検索"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  aria-label="用品を検索"
                />
                <button
                  type="button"
                  className={styles.tableToolbarButton}
                  onClick={() => toggleAll(true)}
                >
                  すべて選択
                </button>
                <button
                  type="button"
                  className={styles.tableToolbarButton}
                  onClick={() => toggleAll(false)}
                >
                  選択解除
                </button>
              </div>
              <div className={styles.tableToolbarGroup}>
                <span className={styles.tableSelectionCount}>
                  選択中: {selectedCount}件
                </span>
                <label className={styles.confirmationCheckboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.confirmationCheckbox}
                    checked={deleteConfirmationChecked}
                    onChange={(event) =>
                      setDeleteConfirmationChecked(event.target.checked)
                    }
                    disabled={selectedIds.size === 0}
                  />
                  削除することを確認しました
                </label>
                <button
                  type="button"
                  className={styles.tableDangerButton}
                  disabled={disableDelete}
                  onClick={handleDelete}
                >
                  {isDeleting ? "削除中..." : "選択した用品を削除"}
                </button>
              </div>
            </div>

            <div className={`${tableStyles.wrapper} ${tableStyles.tableWrapper}`}>
              <table className={`${tableStyles.table} ${tableStyles.dataTable}`}>
                <thead>
                  <tr>
                    <th className={tableStyles.checkboxCell}>
                      <span className={tableStyles.visuallyHidden}>選択</span>
                    </th>
                    <th>ID</th>
                    <th>用品名</th>
                    {PRICE_KEYS.map((key) => (
                      <th key={key}>{priceLabels[key]}</th>
                    ))}
                    <th>最終更新</th>
                    <th className={tableStyles.actionCell}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccessories.map((item) => (
                    <tr key={item.accessory_id}>
                      <td className={tableStyles.checkboxCell}>
                        <input
                          type="checkbox"
                          className={tableStyles.selectionCheckbox}
                          aria-label={`${item.name} を削除対象に追加`}
                          checked={selectedIds.has(item.accessory_id)}
                          onChange={() => toggleSelection(item.accessory_id)}
                        />
                      </td>
                      <td>{item.accessory_id}</td>
                      <td className={tableStyles.primaryText}>{item.name}</td>
                      {PRICE_KEYS.map((key) => (
                        <td key={key} className={tableStyles.numericCell}>
                          {formatPrice(item.prices?.[key])}
                        </td>
                      ))}
                      <td>
                        {new Date(item.updated_at).toLocaleString("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className={tableStyles.actionCell}>
                        <Link
                          href={`/admin/dashboard/accessories/register?accessoryId=${item.accessory_id}`}
                          className={tableStyles.link}
                        >
                          編集
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredAccessories.length === 0 && (
                    <tr>
                      <td
                        colSpan={PRICE_KEYS.length + 5}
                        className={tableStyles.emptyCell}
                      >
                        該当する用品がありません。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </DashboardLayout>
    </>
  );
}

const PRICE_KEYS: AccessoryPriceKey[] = ["24h", "2d", "4d", "1w", "2w", "1m", "extra24h"];
