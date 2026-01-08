import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import { Reservation } from "../../lib/reservations";
import { RegistrationData } from "../../types/registration";
import styles from "../../styles/RentalContract.module.css";

type ReservationResponse = {
  reservation?: Reservation;
};

type RegistrationResponse = {
  registration?: RegistrationData | null;
};

const PLACEHOLDER = "＊＊＊＊＊＊＊＊";
const PLACEHOLDER_SHORT = "＊＊＊";
const HELMET_ACCESSORY_KEYS = ["halfCap", "jetHelmet", "brandHelmet"] as const;

const displayValue = (value?: string | null, fallback = PLACEHOLDER) => {
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
};

const formatPhoneNumber = (value?: string | null) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("0")) return trimmed;

  const withoutCountry = trimmed.startsWith("+81")
    ? trimmed.slice(3)
    : trimmed.startsWith("81")
      ? trimmed.slice(2)
      : trimmed;

  if (withoutCountry === trimmed) return trimmed;
  return `0${withoutCountry}`;
};

const formatDateParts = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const lookup = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: lookup("year"),
    month: lookup("month"),
    day: lookup("day"),
    hour: lookup("hour"),
    minute: lookup("minute"),
  };
};

const formatJapaneseDateTime = (value?: string) => {
  const parts = formatDateParts(value);
  if (!parts) return PLACEHOLDER;
  return `西暦${parts.year}年${parts.month}月${parts.day}日 ${parts.hour}:${parts.minute}`;
};

const formatJapaneseDate = (value?: string) => {
  const parts = formatDateParts(value);
  if (!parts) return PLACEHOLDER;
  return `西暦${parts.year}年${parts.month}月${parts.day}日`;
};

const calculateAge = (birth?: string) => {
  if (!birth) return "";
  const date = new Date(birth);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age.toString();
};

const formatYen = (value?: string | null) => {
  if (!value) return "＊＊＊＊円";
  const numeric = Number(value.toString().replace(/,/g, ""));
  if (Number.isNaN(numeric)) return `${value}円`;
  return `${numeric.toLocaleString("ja-JP")}円`;
};

const sumAccessoryCount = (
  accessories: Record<string, number> | undefined,
  keys: readonly string[]
) =>
  keys.reduce((total, key) => total + (accessories?.[key] ?? 0), 0);

const formatAccessoryCount = (count: number) => (count > 0 ? `${count}個` : "なし");

export default function RentalContractPage() {
  const router = useRouter();
  const reservationId = Array.isArray(router.query.reservationId)
    ? router.query.reservationId[0]
    : router.query.reservationId;
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!router.isReady || !reservationId) return;
    const controller = new AbortController();

    const loadReservation = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/reservations/${reservationId}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("予約データの取得に失敗しました");
        }
        const data = (await response.json()) as ReservationResponse;
        setReservation(data.reservation ?? null);
        setError(null);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          const message =
            fetchError instanceof Error ? fetchError.message : "予約情報の読み込みに失敗しました";
          setError(message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadReservation();
    return () => controller.abort();
  }, [reservationId, router.isReady]);

  useEffect(() => {
    const controller = new AbortController();

    const loadRegistration = async () => {
      try {
        const response = await fetch("/api/register/user", { signal: controller.signal });
        if (!response.ok) return;
        const data = (await response.json()) as RegistrationResponse;
        setRegistration(data.registration ?? null);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setRegistration(null);
        }
      }
    };

    void loadRegistration();
    return () => controller.abort();
  }, []);

  const name = useMemo(() => {
    if (registration?.name1 || registration?.name2) {
      return `${registration.name1} ${registration.name2}`.trim();
    }
    return reservation?.memberName ?? "";
  }, [registration, reservation]);

  const nameKana = useMemo(() => {
    if (registration?.kana1 || registration?.kana2) {
      return `${registration.kana1} ${registration.kana2}`.trim();
    }
    return "";
  }, [registration]);

  const address = useMemo(() => {
    if (registration?.zip || registration?.address1 || registration?.address2) {
      return `〒${registration.zip} ${registration.address1} ${registration.address2}`.trim();
    }
    return "";
  }, [registration]);

  const birthDate = registration?.birth;
  const age = calculateAge(birthDate);

  if (loading) {
    return <p className="p-6 text-sm text-gray-600">貸渡契約書を読み込んでいます…</p>;
  }

  if (error || !reservation) {
    return (
      <p className="p-6 text-sm text-red-600">
        {error ?? "貸渡契約書を表示できませんでした。"}
      </p>
    );
  }

  const accessorySelections = reservation.accessories ?? {};
  const helmetCount = sumAccessoryCount(accessorySelections, HELMET_ACCESSORY_KEYS);
  const gloveCount = accessorySelections.glove ?? 0;

  return (
    <>
      <Head>
        <title>貸渡契約書</title>
      </Head>
      <div className={styles.printActions}>
        <button
          className={styles.printButton}
          type="button"
          onClick={() => window.print()}
        >
          PDFとして保存 / 印刷
        </button>
      </div>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.title}>貸渡契約書</div>
        </header>

        <section className={styles.contractInfo}>
          <div className={`${styles.infoRow} ${styles.infoRowNoBorder}`}>
            <div className={styles.infoLeft}>
              <span className={styles.infoLabel}>ふりがな</span>
              <span className={styles.infoValue}>{displayValue(nameKana, PLACEHOLDER_SHORT)}</span>
            </div>
            <div className={styles.infoRight}>
              <span className={styles.infoLabel}>予約番号：</span>
              <span className={styles.reservationValue}>{reservation.id}</span>
            </div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLeft}>
              <span className={styles.infoLabel}>氏名</span>
              <span className={styles.infoValue}>{displayValue(name, PLACEHOLDER_SHORT)}</span>
            </div>
          </div>
          <div className={`${styles.infoRow} ${styles.infoRowRight20}`}>
            <div className={styles.infoLeft}>
              <span className={styles.infoLabel}>住所</span>
              <span className={styles.infoValue}>{displayValue(address)}</span>
            </div>
            <div className={styles.infoRightStrong}>
              <span className={styles.infoLabel}>店舗</span>
              <span className={styles.storeName}>
                {displayValue(reservation.storeName, PLACEHOLDER_SHORT)}
              </span>
            </div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLeft}>
              <span className={styles.infoLabel}>生年月日</span>
              <span className={`${styles.infoValue} ${styles.infoValueInline}`}>
                {birthDate ? formatJapaneseDate(birthDate) : PLACEHOLDER}
              </span>
              <span className={styles.infoAge}>（{age ? `${age}歳` : "＊＊歳"}）</span>
            </div>
          </div>
          <div className={`${styles.infoRow} ${styles.infoRowRight50}`}>
            <div className={styles.infoLeft}>
              <span className={styles.infoLabel}>携帯電話</span>
              <span className={styles.infoValue}>
                {displayValue(
                  formatPhoneNumber(registration?.mobile ?? reservation.memberPhone)
                )}
              </span>
            </div>
            <div className={styles.infoRight}>
              <span className={styles.infoLabel}>自宅番号</span>
              <span className={styles.infoValue}>
                {displayValue(formatPhoneNumber(registration?.tel))}
              </span>
            </div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLeft}>
              <span className={styles.infoLabel}>メールアドレス</span>
              <span className={styles.infoValue}>
                {displayValue(registration?.email ?? reservation.memberEmail)}
              </span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.fieldRowSplit}>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>勤務先名</span>
              <span>{displayValue(registration?.work_place)}</span>
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>
                <span className={styles.fieldLabelSmall}>左記以外の連絡先</span>：氏名
              </span>
              <span>{displayValue(registration?.other_name)}</span>
            </div>
          </div>
          <div className={styles.fieldRowSplit}>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>勤務先住所</span>
              <span>{displayValue(registration?.work_address)}</span>
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>住所</span>
              <span>{displayValue(registration?.other_address)}</span>
            </div>
          </div>
          <div className={styles.fieldRowSplit}>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>勤務先電話番号</span>
              <span>{displayValue(formatPhoneNumber(registration?.work_tel))}</span>
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>電話番号</span>
              <span>{displayValue(formatPhoneNumber(registration?.other_tel))}</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.contractGrid}>
            <div className={styles.contractColumn}>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>出発日時（受領日）</span>
                <span>{formatJapaneseDateTime(reservation.pickupAt)}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>返却期限日</span>
                <span>{formatJapaneseDateTime(reservation.returnAt)}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>帰着日時</span>
                <span>
                  {reservation.rentalCompletedAt
                    ? formatJapaneseDateTime(reservation.rentalCompletedAt)
                    : ""}
                </span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>車両名</span>
                <span>{displayValue(reservation.vehicleModel)}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>車体番号</span>
                <span>{displayValue(reservation.vehicleCode)}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>登録番号</span>
                <span>{displayValue(reservation.vehiclePlate)}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>基本料金</span>
                <span>{formatYen(reservation.paymentAmount)}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>車両補償</span>
                <span>{displayValue(reservation.options?.vehicleCoverage, "＊＊＊")}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>盗難補償</span>
                <span>{displayValue(reservation.options?.theftCoverage, "＊＊＊")}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>ヘルメット</span>
                <span>{formatAccessoryCount(helmetCount)}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>グローブ</span>
                <span>{formatAccessoryCount(gloveCount)}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>車両指定</span>
                <span>{displayValue(reservation.vehicleCode, PLACEHOLDER_SHORT)}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>その他</span>
                <span>{displayValue(reservation.refundNote, "")}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>合計金額</span>
                <span>{formatYen(reservation.paymentAmount)}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>支払い方法</span>
                <span>クレジット</span>
              </div>
            </div>
            <div className={styles.contractColumn}>
              <div className={styles.subsectionTitle}>延長・車両変更・遅滞・免責 等（選択欄）</div>
              <div className={styles.selectionList}>
                {[0, 1].map((index) => (
                  <div key={index} className={styles.selectionBlock}>
                    <div className={styles.selectionChecks}>
                      <div>
                        <span className={styles.checkbox} />
                        延長
                      </div>
                      <div>
                        <span className={styles.checkbox} />
                        車両変更
                      </div>
                      <div>
                        <span className={styles.checkbox} />
                        遅滞
                      </div>
                      <div>
                        <span className={styles.checkbox} />
                        免責
                      </div>
                      <div>
                        <span className={styles.checkbox} />
                        その他（内容：＿＿＿＿＿＿＿＿＿）
                      </div>
                    </div>
                    <div className={styles.selectionMeta}>変更日・対応日：西暦＿＿＿年＿＿月＿＿日</div>
                    <div className={styles.selectionMeta}>内容詳細：＿＿＿＿＿＿＿＿＿＿＿＿＿＿</div>
                    <div className={styles.selectionMeta}>追加／調整金額：＿＿＿＿円</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.memoGrid}>
            <div className={styles.memoColumn}>
              <div className={styles.fieldLabel}>MEMO</div>
              <div className={styles.memoBox} />
              <div className={styles.fieldLabel}>返金振込先</div>
              <div className={styles.fieldRowSplit}>
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>銀行名</span>
                  <span />
                </div>
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>支店名</span>
                  <span />
                </div>
              </div>
              <div className={styles.fieldRowSplit}>
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>口座種別</span>
                  <span>普通</span>
                </div>
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>口座番号</span>
                  <span />
                </div>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>口座名義</span>
                <span />
              </div>
            </div>
            <div className={styles.memoColumn}>
              <div className={styles.subsectionTitle}>貸渡事業者情報</div>
              <div className={styles.footerInfo}>
                <div>屋号：激安レンタルバイク ヤスカリ</div>
                <div>法人名：株式会社ケイジェット</div>
                <div>所在地：東京都足立区小台2-9-7-1階</div>
                <div>電話番号：03-5856-8200</div>
                <div>営業時間：10:00〜19:00</div>
                <div>定休日：月曜日・木曜日</div>
                <div>ロードサービス専用ダイヤル：0120-024-024</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
