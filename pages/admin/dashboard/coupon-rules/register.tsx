import Head from "next/head";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";

import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import { BikeClass, CouponRule } from "../../../../lib/dashboard/types";
import formStyles from "../../../../styles/AdminForm.module.css";
import styles from "../../../../styles/Dashboard.module.css";

type DiscountType = "amount" | "percentage";

type ParsedIds = {
  bikeClassIds: number[];
  userClassIds: string;
};

const parseTargetIdsToText = (coupon?: CouponRule): ParsedIds => ({
  bikeClassIds: coupon?.target_bike_class_ids ?? [],
  userClassIds: coupon?.target_user_class_ids?.join(",") ?? "",
});

const parseTextToIds = (value: string): number[] | undefined => {
  const entries = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((num) => Number.isFinite(num));

  return entries.length > 0 ? entries : undefined;
};

const normalizeNumberInput = (value: string): string =>
  value
    .trim()
    // convert full-width numbers to half-width
    .replace(/[０-９．－]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0)
    )
    // remove comma separators and spaces
    .replace(/[\s,]/g, "");

const parseNumberInput = (value: string): number | undefined => {
  const normalized = normalizeNumberInput(value);
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return undefined;
};

export default function CouponRuleRegisterPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("amount");
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [targetBikeClassIds, setTargetBikeClassIds] = useState<number[]>([]);
  const [targetUserClassIds, setTargetUserClassIds] = useState("");
  const [bikeClasses, setBikeClasses] = useState<BikeClass[]>([]);
  const [bikeClassError, setBikeClassError] = useState<string | null>(null);
  const [currentCouponCode, setCurrentCouponCode] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setTitle("");
    setCouponCode("");
    setStartDate("");
    setEndDate("");
    setDiscountType("amount");
    setDiscountAmount("");
    setDiscountPercentage("");
    setTargetBikeClassIds([]);
    setTargetUserClassIds("");
    setCurrentCouponCode(null);
  };

  const applyCoupon = (coupon: CouponRule) => {
    setCurrentCouponCode(coupon.coupon_code);
    setTitle(coupon.title);
    setCouponCode(coupon.coupon_code);
    setStartDate(coupon.start_date);
    setEndDate(coupon.end_date);
    if (typeof coupon.discount_amount === "number") {
      setDiscountType("amount");
      setDiscountAmount(String(coupon.discount_amount));
      setDiscountPercentage("");
    } else {
      setDiscountType("percentage");
      setDiscountPercentage(
        coupon.discount_percentage ? String(coupon.discount_percentage) : ""
      );
      setDiscountAmount("");
    }

    const targets = parseTargetIdsToText(coupon);
    setTargetBikeClassIds(targets.bikeClassIds);
    setTargetUserClassIds(targets.userClassIds);
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadBikeClasses = async () => {
      try {
        const response = await fetch("/api/bike-classes", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to fetch bike classes");
        }

        const items = (await response.json()) as BikeClass[];
        setBikeClasses(items);
        setBikeClassError(null);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }
        console.error("Failed to load bike classes", loadError);
        setBikeClasses([]);
        setBikeClassError("バイククラスの取得に失敗しました。");
      }
    };

    void loadBikeClasses();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const couponCodeParam = router.query.couponCode;
    const codeValue = Array.isArray(couponCodeParam)
      ? couponCodeParam[0]
      : couponCodeParam;

    if (!codeValue) {
      resetForm();
      return;
    }

    const loadCoupon = async () => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const response = await fetch("/api/coupon-rules");
        if (!response.ok) {
          setError("クーポン情報の取得に失敗しました。");
          resetForm();
          return;
        }

        const items: CouponRule[] = await response.json();
        const target = items.find(
          (item) => item.coupon_code === String(codeValue)
        );

        if (!target) {
          setError("指定されたクーポンが見つかりませんでした。");
          resetForm();
          return;
        }

        applyCoupon(target);
      } catch (loadError) {
        console.error("Failed to load coupon", loadError);
        setError("クーポン情報の取得に失敗しました。");
        resetForm();
      } finally {
        setIsLoading(false);
      }
    };

    void loadCoupon();
  }, [router.isReady, router.query.couponCode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError("クーポンタイトルを入力してください。");
      return;
    }

    if (!couponCode.trim()) {
      setError("クーポンコードを入力してください。");
      return;
    }

    if (!startDate.trim() || !endDate.trim()) {
      setError("開始日と終了日を入力してください。");
      return;
    }

    let payloadDiscountAmount: number | undefined;
    let payloadDiscountPercentage: number | undefined;

    if (discountType === "amount") {
      payloadDiscountAmount = parseNumberInput(discountAmount);
      if (payloadDiscountAmount == null) {
        setError("金額割引を数値で入力してください。");
        return;
      }
      payloadDiscountPercentage = undefined;
    } else {
      payloadDiscountPercentage = parseNumberInput(discountPercentage);
      if (payloadDiscountPercentage == null) {
        setError("割引率を数値で入力してください。");
        return;
      }
      if (payloadDiscountPercentage < 0 || payloadDiscountPercentage > 100) {
        setError("割引率は0〜100の範囲で入力してください。");
        return;
      }
      payloadDiscountAmount = undefined;
    }

    const payload: CouponRule = {
      title: title.trim(),
      coupon_code: couponCode.trim(),
      start_date: startDate,
      end_date: endDate,
      discount_amount: payloadDiscountAmount,
      discount_percentage: payloadDiscountPercentage,
      target_bike_class_ids:
        targetBikeClassIds.length > 0 ? targetBikeClassIds : undefined,
      target_user_class_ids: parseTextToIds(targetUserClassIds),
    };

    const isEditMode = currentCouponCode != null;

    try {
      setIsLoading(true);
      const response = await fetch("/api/coupon-rules", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
            : isEditMode
              ? "クーポンの更新に失敗しました。"
              : "クーポンの登録に失敗しました。";
        throw new Error(message || "クーポンの登録に失敗しました。");
      }

      const coupon: CouponRule | null =
        responseData && typeof responseData === "object"
          ? (responseData as CouponRule)
          : null;

      if (coupon) {
        applyCoupon(coupon);
      } else if (!isEditMode) {
        resetForm();
      }

      setSuccess(isEditMode ? "クーポンを更新しました。" : "クーポンを登録しました。");
    } catch (submitError) {
      console.error("Failed to submit coupon", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : isEditMode
            ? "クーポンの更新に失敗しました。"
            : "クーポンの登録に失敗しました。"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscountTypeChange = (value: DiscountType) => {
    setDiscountType(value);
    setDiscountAmount(value === "amount" ? discountAmount : "");
    setDiscountPercentage(value === "percentage" ? discountPercentage : "");
  };

  const handleToggleBikeClass = (classId: number) => {
    setTargetBikeClassIds((previous) =>
      previous.includes(classId)
        ? previous.filter((item) => item !== classId)
        : [...previous, classId]
    );
  };

  return (
    <>
      <Head>
        <title>クーポン{currentCouponCode ? "編集" : "登録"} | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title={`クーポン${currentCouponCode ? "編集" : "登録"}`}
        description="クーポンの新規登録・編集を行います。割引額と割引率のどちらか一方を指定してください。"
        showDashboardLink={!currentCouponCode}
      >
        <section className={styles.section}>
          {error && <p className={formStyles.error}>{error}</p>}
          {success && <p className={formStyles.success}>{success}</p>}
          <article className={formStyles.card}>
            <div className={formStyles.header}>
              <h2 className={formStyles.title}>クーポン情報</h2>
              <p className={formStyles.description}>
                クーポンの基本情報と対象クラスを入力してください。
              </p>
            </div>
            <form className={formStyles.body} onSubmit={handleSubmit}>
              <div className={formStyles.grid}>
                <div className={formStyles.field}>
                  <label htmlFor="coupon-title">クーポンタイトル</label>
                  <input
                    id="coupon-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="例：夏休みクーポン"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="coupon-code">クーポンコード</label>
                  <input
                    id="coupon-code"
                    type="text"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)}
                    placeholder="例：SUMMER1000"
                    disabled={isLoading || currentCouponCode !== null}
                    required
                  />
                  {currentCouponCode && (
                    <p className={formStyles.hint}>
                      クーポンコードは更新できません。変更する場合は新規登録してください。
                    </p>
                  )}
                </div>
              </div>

              <div className={formStyles.grid}>
                <div className={formStyles.field}>
                  <label htmlFor="start-date">開始日</label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="end-date">終了日</label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className={formStyles.field}>
                <label>割引設定</label>
                <p className={formStyles.hint}>
                  金額割引と割引率のいずれか一方を入力してください。
                </p>
                <div className={formStyles.grid}>
                  <div className={formStyles.field}>
                    <label className={formStyles.selectionLabel}>
                      <input
                        type="radio"
                        name="discount-type"
                        value="amount"
                        checked={discountType === "amount"}
                        onChange={() => handleDiscountTypeChange("amount")}
                        disabled={isLoading}
                      />
                      金額割引
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={discountAmount}
                      onChange={(event) => setDiscountAmount(event.target.value)}
                      placeholder="例：1000"
                      disabled={isLoading || discountType !== "amount"}
                    />
                  </div>
                  <div className={formStyles.field}>
                    <label className={formStyles.selectionLabel}>
                      <input
                        type="radio"
                        name="discount-type"
                        value="percentage"
                        checked={discountType === "percentage"}
                        onChange={() => handleDiscountTypeChange("percentage")}
                        disabled={isLoading}
                      />
                      割引率（%）
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={discountPercentage}
                      onChange={(event) =>
                        setDiscountPercentage(event.target.value)
                      }
                      placeholder="例：10"
                      disabled={isLoading || discountType !== "percentage"}
                    />
                  </div>
                </div>
              </div>

              <div className={formStyles.grid}>
                <div className={formStyles.field}>
                  <label>対象バイククラスID</label>
                  <p className={formStyles.hint}>
                    チェックボタンで選択してください。複数可能です。
                  </p>
                  {bikeClassError && <p className={formStyles.error}>{bikeClassError}</p>}
                  <div className={formStyles.field}>
                    {bikeClasses.length === 0 && !bikeClassError ? (
                      <p className={formStyles.hint}>選択可能なクラスがありません。</p>
                    ) : (
                      bikeClasses.map((bikeClass) => (
                        <label key={bikeClass.classId} className={formStyles.selectionLabel}>
                          <input
                            type="checkbox"
                            checked={targetBikeClassIds.includes(bikeClass.classId)}
                            onChange={() => handleToggleBikeClass(bikeClass.classId)}
                            disabled={isLoading}
                          />
                          {bikeClass.className}（ID: {bikeClass.classId}）
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="target-user-class-ids">
                    対象ユーザークラスID
                  </label>
                  <input
                    id="target-user-class-ids"
                    type="text"
                    value={targetUserClassIds}
                    onChange={(event) => setTargetUserClassIds(event.target.value)}
                    placeholder="例：1,2"
                    disabled={isLoading}
                  />
                  <p className={formStyles.hint}>
                    カンマ区切りで入力してください。
                  </p>
                </div>
              </div>

              <div className={formStyles.actions}>
                <button
                  type="submit"
                  className={formStyles.primaryButton}
                  disabled={isLoading}
                >
                  {isLoading
                    ? "送信中..."
                    : currentCouponCode
                      ? "クーポンを更新"
                      : "クーポンを登録"}
                </button>
                <button
                  type="button"
                  className={formStyles.secondaryButton}
                  onClick={resetForm}
                  disabled={isLoading}
                >
                  新規作成として入力
                </button>
              </div>
            </form>
          </article>
        </section>
      </DashboardLayout>
    </>
  );
}
