import Head from "next/head";
import { FormEvent, useEffect, useState } from "react";
import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import formStyles from "../../../../styles/AdminForm.module.css";
import styles from "../../../../styles/Dashboard.module.css";
import {
  BikeModel,
  PublishStatus,
  RentalAvailabilityMap,
  Vehicle,
} from "../../../../lib/dashboard/types";
import { STORE_OPTIONS } from "../../../../lib/dashboard/storeOptions";
import { buildMaintenanceAvailability, parseTags } from "../../../../lib/dashboard/utils";

type VehicleFormState = {
  managementNumber: string;
  modelId: string;
  storeId: string;
  publishStatus: PublishStatus;
  tags: string;
  policyNumber1: string;
  policyBranchNumber1: string;
  policyNumber2: string;
  policyBranchNumber2: string;
  inspectionExpiryDate: string;
  licensePlateNumber: string;
  parkingNumber: string;
  previousLicensePlateNumber: string;
  liabilityInsuranceExpiryDate: string;
  videoUrl: string;
  notes: string;
};

const emptyForm: VehicleFormState = {
  managementNumber: "",
  modelId: "",
  storeId: "",
  publishStatus: "ON",
  tags: "",
  policyNumber1: "",
  policyBranchNumber1: "",
  policyNumber2: "",
  policyBranchNumber2: "",
  inspectionExpiryDate: "",
  licensePlateNumber: "",
  parkingNumber: "",
  previousLicensePlateNumber: "",
  liabilityInsuranceExpiryDate: "",
  videoUrl: "",
  notes: "",
};

export default function VehicleRegisterPage() {
  const [bikeModels, setBikeModels] = useState<BikeModel[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState<VehicleFormState>(emptyForm);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [modelsResponse, vehiclesResponse] = await Promise.all([
          fetch("/api/bike-models"),
          fetch("/api/vehicles"),
        ]);

        if (modelsResponse.ok) {
          const modelData: BikeModel[] = await modelsResponse.json();
          setBikeModels(modelData.sort((a, b) => a.modelId - b.modelId));
        } else {
          setLoadError("車種一覧の取得に失敗しました。");
        }

        if (vehiclesResponse.ok) {
          const vehicleData: Vehicle[] = await vehiclesResponse.json();
          setVehicles(
            vehicleData.sort((a, b) => a.managementNumber.localeCompare(b.managementNumber))
          );
        } else {
          setLoadError((prev) => prev ?? "車両一覧の取得に失敗しました。");
        }
      } catch (fetchError) {
        console.error("Failed to load vehicle data", fetchError);
        setLoadError("車種・車両情報の取得に失敗しました。");
      }
    };

    void loadData();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);

    const managementNumber = form.managementNumber.trim();
    if (!managementNumber) {
      setError("管理番号を入力してください。");
      return;
    }
    if (vehicles.some((vehicle) => vehicle.managementNumber === managementNumber)) {
      setError("同じ管理番号が既に登録されています。");
      return;
    }
    if (!form.modelId) {
      setError("車種を選択してください。");
      return;
    }
    if (!form.storeId.trim()) {
      setError("店舗を選択してください。");
      return;
    }

    const modelId = Number(form.modelId);
    if (!bikeModels.some((model) => model.modelId === modelId)) {
      setError("選択された車種が存在しません。");
      return;
    }

    const payload: Record<string, unknown> = {
      managementNumber,
      modelId,
      storeId: form.storeId.trim(),
      publishStatus: form.publishStatus,
      tags: parseTags(form.tags),
    };

    const optionalFields: Array<
      keyof Omit<
        VehicleFormState,
        "managementNumber" | "modelId" | "storeId" | "publishStatus" | "tags"
      >
    > = [
      "policyNumber1",
      "policyBranchNumber1",
      "policyNumber2",
      "policyBranchNumber2",
      "inspectionExpiryDate",
      "licensePlateNumber",
      "parkingNumber",
      "previousLicensePlateNumber",
      "liabilityInsuranceExpiryDate",
      "videoUrl",
      "notes",
    ];

    optionalFields.forEach((field) => {
      const value = form[field].trim();
      if (value) {
        payload[field] = value;
      }
    });

    const maintenanceAvailability: RentalAvailabilityMap = {};

    const mergeMaintenanceWindow = (date: string | undefined, label: string) => {
      if (!date?.trim()) {
        return;
      }
      const range = buildMaintenanceAvailability(date, 1, label);
      Object.entries(range).forEach(([dateKey, entry]) => {
        maintenanceAvailability[dateKey] = entry;
      });
    };

    mergeMaintenanceWindow(form.liabilityInsuranceExpiryDate, "自賠責満了期間");
    mergeMaintenanceWindow(form.inspectionExpiryDate, "車検満了期間");

    if (Object.keys(maintenanceAvailability).length > 0) {
      payload.rentalAvailability = maintenanceAvailability;
    }

    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        setError(errorBody?.message ?? "車両の登録に失敗しました。");
        return;
      }

      const newVehicle: Vehicle = await response.json();
      setVehicles((prev) =>
        [...prev, newVehicle].sort((a, b) =>
          a.managementNumber.localeCompare(b.managementNumber)
        )
      );
      setForm({ ...emptyForm });
      setError(null);
      setSuccess("車両を登録しました。");
    } catch (submitError) {
      console.error("Failed to register vehicle", submitError);
      setError("車両の登録に失敗しました。");
    }
  };

  return (
    <>
      <Head>
        <title>車両登録 | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="車両登録"
        actions={[
          {
            label: "車両一覧へ戻る",
            href: "/admin/dashboard/vehicles",
          },
        ]}
      >
        <section className={styles.section}>
          {loadError && <p className={formStyles.error}>{loadError}</p>}
          {error && <p className={formStyles.error}>{error}</p>}
          {success && <p className={formStyles.hint}>{success}</p>}
          <article className={formStyles.card}>
            <form onSubmit={handleSubmit} className={formStyles.body}>
              <div className={formStyles.grid}>
                <div className={formStyles.field}>
                  <label htmlFor="managementNumber">管理番号</label>
                  <input
                    id="managementNumber"
                    value={form.managementNumber}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, managementNumber: event.target.value }))
                    }
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="modelId">車種</label>
                  <select
                    id="modelId"
                    value={form.modelId}
                    onChange={(event) => setForm((prev) => ({ ...prev, modelId: event.target.value }))}
                  >
                    <option value="">車種を選択</option>
                    {bikeModels.map((model) => (
                      <option key={model.modelId} value={model.modelId}>
                        {model.modelName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="storeId">店舗</label>
                  <select
                    id="storeId"
                    value={form.storeId}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, storeId: event.target.value }))
                    }
                  >
                    <option value="">店舗を選択</option>
                    {STORE_OPTIONS.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="publishStatus">掲載状態</label>
                  <select
                    id="publishStatus"
                    value={form.publishStatus}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        publishStatus: event.target.value as PublishStatus,
                      }))
                    }
                  >
                    <option value="ON">公開 (ON)</option>
                    <option value="OFF">非公開 (OFF)</option>
                  </select>
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="tags">タグ</label>
                  <input
                    id="tags"
                    value={form.tags}
                    placeholder="例：ABS,ETC"
                    onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="policyNumber1">保険証券番号1</label>
                  <input
                    id="policyNumber1"
                    value={form.policyNumber1}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, policyNumber1: event.target.value }))
                    }
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="policyBranchNumber1">取扱支店番号1</label>
                  <input
                    id="policyBranchNumber1"
                    value={form.policyBranchNumber1}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, policyBranchNumber1: event.target.value }))
                    }
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="policyNumber2">保険証券番号2</label>
                  <input
                    id="policyNumber2"
                    value={form.policyNumber2}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, policyNumber2: event.target.value }))
                    }
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="policyBranchNumber2">取扱支店番号2</label>
                  <input
                    id="policyBranchNumber2"
                    value={form.policyBranchNumber2}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, policyBranchNumber2: event.target.value }))
                    }
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="inspectionExpiryDate">車検満了日</label>
                  <input
                    id="inspectionExpiryDate"
                    type="date"
                    value={form.inspectionExpiryDate}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, inspectionExpiryDate: event.target.value }))
                    }
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="licensePlateNumber">ナンバープレート</label>
                  <input
                    id="licensePlateNumber"
                    value={form.licensePlateNumber}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, licensePlateNumber: event.target.value }))
                    }
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="parkingNumber">駐車No</label>
                  <input
                    id="parkingNumber"
                    value={form.parkingNumber}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, parkingNumber: event.target.value }))
                    }
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="previousLicensePlateNumber">旧ナンバープレート</label>
                  <input
                    id="previousLicensePlateNumber"
                    value={form.previousLicensePlateNumber}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, previousLicensePlateNumber: event.target.value }))
                    }
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="liabilityInsuranceExpiryDate">自賠責満了日</label>
                  <input
                    id="liabilityInsuranceExpiryDate"
                    type="date"
                    value={form.liabilityInsuranceExpiryDate}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        liabilityInsuranceExpiryDate: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="videoUrl">紹介動画URL</label>
                  <input
                    id="videoUrl"
                    type="url"
                    value={form.videoUrl}
                    placeholder="https://example.com/vehicles/movie.mp4"
                    onChange={(event) => setForm((prev) => ({ ...prev, videoUrl: event.target.value }))}
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="notes">備考</label>
                  <textarea
                    id="notes"
                    value={form.notes}
                    placeholder="記録しておきたいメモを入力"
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                </div>
              </div>
              <div className={formStyles.actions}>
                <button type="submit" className={formStyles.primaryButton}>
                  登録する
                </button>
              </div>
            </form>
          </article>
        </section>
      </DashboardLayout>
    </>
  );
}
