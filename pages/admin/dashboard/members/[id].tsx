import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import type { Member } from "../../../../lib/members";
import type { Reservation } from "../../../../lib/reservations";
import styles from "../../../../styles/Dashboard.module.css";
import memberStyles from "../../../../styles/AdminMember.module.css";
import tableStyles from "../../../../styles/AdminTable.module.css";

const statusBadgeClassName = (status: Member["status"]): string => {
  if (status === "認証済") {
    return `${memberStyles.statusBadge} ${memberStyles.statusBadgeOn}`;
  }

  if (status === "未認証") {
    return `${memberStyles.statusBadge} ${memberStyles.statusBadgePending}`;
  }

  return `${memberStyles.statusBadge} ${memberStyles.statusBadgeOff}`;
};

const formatPhoneValue = (value?: string) => {
  if (!value || value === "-") return "-";
  const trimmed = value.trim();
  if (!trimmed) return "-";
  if (trimmed.startsWith("0")) return trimmed;

  const normalized = trimmed.replace(/\s+/g, "");

  if (normalized.startsWith("+81")) {
    return `0${normalized.slice(3)}`;
  }

  if (normalized.startsWith("81")) {
    return `0${normalized.slice(2)}`;
  }

  return trimmed;
};

export default function MemberDetailPage() {
  const router = useRouter();
  const memberId = useMemo(() => {
    const { id } = router.query;
    return Array.isArray(id) ? id[0] : id;
  }, [router.query]);

  const [member, setMember] = useState<Member | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteSuccess, setNoteSuccess] = useState<string | null>(null);

  const [noteEdit, setNoteEdit] = useState(member?.notes ?? "");
  const [isBlacklistedEdit, setIsBlacklistedEdit] = useState(member?.isBlacklisted ?? false);

  useEffect(() => {
    setNoteEdit(member?.notes ?? "");
    setIsBlacklistedEdit(member?.isBlacklisted ?? false);
  }, [member]);

  useEffect(() => {
    setNoteError(null);
    setNoteSuccess(null);
  }, [noteEdit]);

  useEffect(() => {
    if (!memberId) return;
    let isMounted = true;

    const loadMember = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await fetch(`/api/admin/members/${memberId}`);
        if (!response.ok) {
          throw new Error("会員情報の取得に失敗しました。");
        }
        const data = (await response.json()) as {
          member: Member;
          reservations: Reservation[];
        };
        if (isMounted) {
          setMember(data.member);
          setReservations(data.reservations);
        }
      } catch (error) {
        console.error("Failed to load member", error);
        if (isMounted) {
          setErrorMessage("会員情報の取得に失敗しました。");
          setMember(null);
          setReservations([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMember();
    return () => {
      isMounted = false;
    };
  }, [memberId]);

  const handleBackToList = () => {
    router.push("/admin/dashboard/members");
  };

  const handleSaveNote = async () => {
    if (!memberId || !member) return;
    setIsSavingNote(true);
    setNoteError(null);
    setNoteSuccess(null);

    try {
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteEdit, isBlacklisted: isBlacklistedEdit }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "備考の保存に失敗しました。");
      }

      const data = (await response.json()) as { notes: string; isBlacklisted: boolean };
      setMember((prev) =>
        prev
          ? {
              ...prev,
              notes: data.notes,
              isBlacklisted: data.isBlacklisted,
            }
          : prev
      );
      setNoteSuccess("備考とブラックリスト設定を保存しました。");
    } catch (error) {
      console.error("Failed to save notes", error);
      const message = error instanceof Error ? error.message : "備考の保存に失敗しました。";
      setNoteError(message);
    } finally {
      setIsSavingNote(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        title="会員管理"
        description="会員情報の確認や状態の把握を行うためのダッシュボードです。"
      >
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>会員詳細</h2>
            <p className={styles.sectionDescription}>会員情報を読み込み中です...</p>
          </div>
        </section>
      </DashboardLayout>
    );
  }

  if (!member) {
    return (
      <DashboardLayout
        title="会員管理"
        description="会員情報の確認や状態の把握を行うためのダッシュボードです。"
      >
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>会員詳細</h2>
            <p className={styles.sectionDescription}>
              {errorMessage ??
                "該当する会員情報が見つかりませんでした。会員一覧に戻って再度お試しください。"}
            </p>
          </div>

          <div className={memberStyles.buttonRow}>
            <button
              type="button"
              className={memberStyles.backButton}
              onClick={handleBackToList}
            >
              会員一覧に戻る
            </button>
          </div>
        </section>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{`${member.name} の会員詳細 | 管理ダッシュボード`}</title>
      </Head>
      <DashboardLayout
        title="会員管理"
        description="会員情報の確認や状態の把握を行うためのダッシュボードです。"
      >
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>会員詳細</h2>
            <p className={styles.sectionDescription}>
              会員一覧から遷移した詳細ページです。ブラウザの戻る操作または下部のボタンで一覧へ戻れます。
            </p>
          </div>

          <div className={memberStyles.detailCard}>
            <div className={memberStyles.detailHeader}>
              <div>
                <div className={memberStyles.detailTitle}>会員詳細</div>
                <div className={memberStyles.metaRow}>
                  <span>会員番号: {member.memberNumber}</span>
                  <span>登録日時: {member.registeredAt}</span>
                </div>
              </div>
              <span className={statusBadgeClassName(member.status)}>
                {member.status}
              </span>
            </div>

            <div className={memberStyles.fieldGrid}>
              <div className={memberStyles.fieldBlock}>
                <div className={memberStyles.fieldLabel}>会員名</div>
                <div className={memberStyles.fieldValue}>
                  {member.name} ({member.nameKana})
                </div>
              </div>
              <div className={memberStyles.fieldBlock}>
                <div className={memberStyles.fieldLabel}>権限</div>
                <div className={memberStyles.fieldValue}>{member.role}</div>
              </div>
              <div className={memberStyles.fieldBlock}>
                <div className={memberStyles.fieldLabel}>メールアドレス</div>
                <div className={memberStyles.fieldValue}>{member.email}</div>
              </div>
              <div className={memberStyles.fieldBlock}>
                <div className={memberStyles.fieldLabel}>状態</div>
                <div className={memberStyles.fieldValue}>{member.status}</div>
              </div>
              <div className={memberStyles.fieldBlock}>
                <div className={memberStyles.fieldLabel}>携帯電話</div>
                <div className={memberStyles.fieldValue}>{formatPhoneValue(member.mobilePhone)}</div>
              </div>
              <div className={memberStyles.fieldBlock}>
                <div className={memberStyles.fieldLabel}>電話番号</div>
                <div className={memberStyles.fieldValue}>{formatPhoneValue(member.phoneNumber)}</div>
              </div>
              <div className={memberStyles.fieldBlock}>
                <div className={memberStyles.fieldLabel}>生年月日</div>
                <div className={memberStyles.fieldValue}>{member.birthDate}</div>
              </div>
              <div className={memberStyles.fieldBlock}>
                <div className={memberStyles.fieldLabel}>郵便番号</div>
                <div className={memberStyles.fieldValue}>{member.postalCode}</div>
              </div>
              <div className={memberStyles.fieldBlock}>
                <div className={memberStyles.fieldLabel}>住所</div>
                <div className={memberStyles.fieldValue}>{member.address}</div>
              </div>
              <div className={memberStyles.fieldBlock}>
                <div className={memberStyles.fieldLabel}>免許番号</div>
                <div className={memberStyles.fieldValue}>{member.licenseNumber}</div>
              </div>
              <div className={memberStyles.fieldBlock}>
                <div className={memberStyles.fieldLabel}>通勤先名</div>
                <div className={memberStyles.fieldValue}>{member.workplaceName}</div>
              </div>
              <div className={memberStyles.fieldBlock}>
                <div className={memberStyles.fieldLabel}>通勤先住所</div>
                <div className={memberStyles.fieldValue}>{member.workplaceAddress}</div>
              </div>
              <div className={memberStyles.fieldBlock}>
                <div className={memberStyles.fieldLabel}>通勤先電話番号</div>
                <div className={memberStyles.fieldValue}>
                  {formatPhoneValue(member.workplacePhone)}
                </div>
              </div>
              <div className={memberStyles.fieldBlock}>
                <div className={memberStyles.fieldLabel}>その他連絡先名</div>
                <div className={memberStyles.fieldValue}>{member.otherContactName}</div>
              </div>
              <div className={memberStyles.fieldBlock}>
                <div className={memberStyles.fieldLabel}>その他連絡先住所</div>
                <div className={memberStyles.fieldValue}>{member.otherContactAddress}</div>
              </div>
              <div className={memberStyles.fieldBlock}>
                <div className={memberStyles.fieldLabel}>その他連絡先電話番号</div>
                <div className={memberStyles.fieldValue}>
                  {formatPhoneValue(member.otherContactPhone)}
                </div>
              </div>
            </div>

            <div className={memberStyles.noteArea}>
              <div className={memberStyles.sectionTitle}>備考</div>
              <label className={memberStyles.sectionHelper}>
                <input
                  type="checkbox"
                  checked={isBlacklistedEdit}
                  onChange={(event) => setIsBlacklistedEdit(event.target.checked)}
                  style={{ marginRight: 8 }}
                />
                ブラックリストとしてマイページ表示を制限する
              </label>
              <textarea
                className={memberStyles.noteTextarea}
                value={noteEdit}
                onChange={(event) => setNoteEdit(event.target.value)}
                aria-label={`${member.name} の備考`}
                placeholder="備考を編集"
              />
              <div className={memberStyles.noteActions}>
                <button
                  type="button"
                  className={memberStyles.saveButton}
                  onClick={handleSaveNote}
                  disabled={
                    isSavingNote ||
                    (noteEdit === (member.notes ?? "") &&
                      isBlacklistedEdit === (member.isBlacklisted ?? false))
                  }
                >
                  {isSavingNote ? "保存中..." : "備考・ブラックリスト設定を保存"}
                </button>
                {(noteError || noteSuccess) && (
                  <p
                    className={
                      noteError ? memberStyles.noteError : memberStyles.noteSuccess
                    }
                  >
                    {noteError ?? noteSuccess}
                  </p>
                )}
              </div>
              <p className={memberStyles.sectionHelper}>
                ブラックリストをONにした会員はマイページが制限表示になります。未設定またはOFFなら通常表示です。
              </p>
            </div>

            <div className={memberStyles.divider} />

            <div>
              <div className={memberStyles.sectionTitle}>バイクレンタル一覧</div>
              {reservations.length === 0 ? (
                <p className={memberStyles.sectionHelper}>まだ予約はありません</p>
              ) : (
                <div className={`${tableStyles.wrapper} ${tableStyles.tableWrapper}`}>
                  <table className={`${tableStyles.table} ${tableStyles.dataTable}`}>
                    <thead>
                      <tr>
                        <th scope="col">予約ID</th>
                        <th scope="col">車両</th>
                        <th scope="col">受取日時</th>
                        <th scope="col">返却日時</th>
                        <th scope="col">状態</th>
                        <th scope="col">支払額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((reservation) => (
                        <tr key={reservation.id}>
                          <td className={tableStyles.monospace}>{reservation.id}</td>
                          <td>
                            {reservation.vehicleModel} ({reservation.vehicleCode})
                          </td>
                          <td>{reservation.pickupAt || "-"}</td>
                          <td>{reservation.returnAt || "-"}</td>
                          <td>{reservation.status}</td>
                          <td>{reservation.paymentAmount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className={memberStyles.buttonRow}>
              <button
                type="button"
                className={memberStyles.backButton}
                onClick={handleBackToList}
              >
                会員一覧に戻る
              </button>
            </div>
          </div>
        </section>
      </DashboardLayout>
    </>
  );
}
