import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import formStyles from "../../../../styles/AdminForm.module.css";
import styles from "../../../../styles/Dashboard.module.css";
import { BikeClass, BikeModel, PublishStatus, Vehicle } from "../../../../lib/dashboard/types";
import { getStoreLabel, STORE_OPTIONS } from "../../../../lib/dashboard/storeOptions";
import { parseTags } from "../../../../lib/dashboard/utils";

type VehicleFormState = {
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

export default function VehicleDetailPage() {
  const router = useRouter();
  const managementNumberParam = router.query.managementNumber;
  const managementNumber = useMemo(
    () => (Array.isArray(managementNumberParam) ? managementNumberParam[0] : managementNumberParam),
    [managementNumberParam]
  );

  const [bikeClasses, setBikeClasses] = useState<BikeClass[]>([]);
  const [bikeModels, setBikeModels] = useState<BikeModel[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [classError, setClassError] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [detailForm, setDetailForm] = useState<VehicleFormState | null>(null);
  const [isDetailEditing, setIsDetailEditing] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailSuccess, setDetailSuccess] = useState<string | null>(null);
  const [isSavingDetail, setIsSavingDetail] = useState(false);

  useEffect(() => {
    if (!managementNumber) {
      return;
    }

    const loadData = async () => {
      try {
        const [classesResponse, modelsResponse, vehiclesResponse] = await Promise.all([
          fetch("/api/bike-classes"),
          fetch("/api/bike-models"),
          fetch("/api/vehicles"),
        ]);

        if (classesResponse.ok) {
          const classData: BikeClass[] = await classesResponse.json();
          setBikeClasses(classData.sort((a, b) => a.classId - b.classId));
          setClassError(null);
        } else {
          setClassError("クラス一覧の取得に失敗しました。");
        }

        if (modelsResponse.ok) {
          const modelData: BikeModel[] = await modelsResponse.json();
          setBikeModels(modelData.sort((a, b) => a.modelId - b.modelId));
          setModelError(null);
        } else {
          setModelError("車種一覧の取得に失敗しました。");
        }

        if (vehiclesResponse.ok) {
          const vehicleData: Vehicle[] = await vehiclesResponse.json();
          const foundVehicle =
            vehicleData.find((item) => item.managementNumber === managementNumber) ?? null;

          if (!foundVehicle) {
            setVehicleError("指定の車両が見つかりませんでした。");
            setVehicle(null);
            return;
          }

          setVehicle(foundVehicle);
          setVehicleError(null);
        } else {
          setVehicleError("車両の取得に失敗しました。");
        }
      } catch (loadError) {
        console.error("Failed to load vehicle detail", loadError);
        setClassError((prev) => prev ?? "クラス一覧の取得に失敗しました。");
        setModelError((prev) => prev ?? "車種一覧の取得に失敗しました。");
        setVehicleError((prev) => prev ?? "車両の取得に失敗しました。");
      }
    };

    void loadData();
  }, [managementNumber]);

  useEffect(() => {
    if (!vehicle) {
      setDetailForm(null);
      setIsDetailEditing(false);
      setDetailError(null);
      setDetailSuccess(null);
      return;
    }

    setDetailForm({
      modelId: vehicle.modelId?.toString() ?? "",
      storeId: vehicle.storeId ?? "",
      publishStatus: vehicle.publishStatus ?? "ON",
      tags: (vehicle.tags ?? []).join(","),
      policyNumber1: vehicle.policyNumber1 ?? "",
      policyBranchNumber1: vehicle.policyBranchNumber1 ?? "",
      policyNumber2: vehicle.policyNumber2 ?? "",
      policyBranchNumber2: vehicle.policyBranchNumber2 ?? "",
      inspectionExpiryDate: vehicle.inspectionExpiryDate ?? "",
      licensePlateNumber: vehicle.licensePlateNumber ?? "",
      parkingNumber: vehicle.parkingNumber ?? "",
      previousLicensePlateNumber: vehicle.previousLicensePlateNumber ?? "",
      liabilityInsuranceExpiryDate: vehicle.liabilityInsuranceExpiryDate ?? "",
      videoUrl: vehicle.videoUrl ?? "",
      notes: vehicle.notes ?? "",
    });
    setIsDetailEditing(false);
    setDetailError(null);
    setDetailSuccess(null);
  }, [vehicle]);

  const modelMap = useMemo(
    () =>
      bikeModels.reduce<Record<number, BikeModel>>((acc, current) => {
        acc[current.modelId] = current;
        return acc;
      }, {}),
    [bikeModels]
  );

  const classNameMap = useMemo(
    () =>
      bikeClasses.reduce<Record<number, string>>((acc, bikeClass) => {
        acc[bikeClass.classId] = bikeClass.className;
        return acc;
      }, {}),
    [bikeClasses]
  );

  const model = vehicle ? modelMap[vehicle.modelId] : undefined;
  const className = model ? classNameMap[model.classId] : undefined;

  const handleDetailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!vehicle || !detailForm) {
      return;
    }

    if (!detailForm.modelId) {
      setDetailError("車種を選択してください。");
      return;
    }

    if (!bikeModels.some((bikeModel) => bikeModel.modelId === Number(detailForm.modelId))) {
      setDetailError("選択された車種が存在しません。");
      return;
    }

    if (!detailForm.storeId.trim()) {
      setDetailError("店舗を選択してください。");
      return;
    }

    const payload: Record<string, unknown> = {
      managementNumber: vehicle.managementNumber,
      modelId: Number(detailForm.modelId),
      storeId: detailForm.storeId.trim(),
      publishStatus: detailForm.publishStatus,
      tags: parseTags(detailForm.tags),
    };

    const optionalFields: Array<
      keyof Omit<VehicleFormState, "modelId" | "storeId" | "publishStatus" | "tags">
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
      const value = detailForm[field].trim();
      if (value) {
        payload[field] = value;
      }
    });

    setIsSavingDetail(true);
    setDetailError(null);
    setDetailSuccess(null);

    try {
      const response = await fetch("/api/vehicles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setDetailError("車両の更新に失敗しました。");
        return;
      }

      const updatedVehicle: Vehicle = await response.json();
      setVehicle(updatedVehicle);
      setDetailSuccess("車両情報を更新しました。");
      setIsDetailEditing(false);
    } catch (saveError) {
      console.error("Failed to update vehicle", saveError);
      setDetailError("車両の更新に失敗しました。");
    } finally {
      setIsSavingDetail(false);
    }
  };

  const handleBack = () => {
    void router.push("/admin/dashboard/vehicles");
  };

  if (!managementNumber) {
    return null;
  }

  return (
    <>
      <Head>
        <title>車両詳細</title>
      </Head>
      <DashboardLayout title="車両詳細">
        <div className={styles.detailHeader}>
          <h1 className={styles.detailTitle}>車両詳細</h1>
          <div>
            <button type="button" className={styles.tableToolbarButton} onClick={handleBack}>
              戻る
            </button>
            {vehicle && (
              <button
                type="button"
                className={styles.detailEditButton}
                onClick={() => setIsDetailEditing((current) => !current)}
                disabled={isSavingDetail || !detailForm}
                aria-pressed={isDetailEditing}
              >
                {isDetailEditing ? "閲覧に戻る" : "編集に切り替え"}
              </button>
            )}
          </div>
        </div>
        {classError && <p className={formStyles.error}>{classError}</p>}
        {modelError && <p className={formStyles.error}>{modelError}</p>}
        {vehicleError && <p className={formStyles.error}>{vehicleError}</p>}
        {vehicle && (
          <form onSubmit={handleDetailSubmit}>
            <dl className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <dt>管理番号</dt>
                <dd>{vehicle.managementNumber}</dd>
              </div>
              <div className={styles.detailItem}>
                <dt>クラス</dt>
                <dd>{className ?? "-"}</dd>
              </div>
              <div className={styles.detailItem}>
                <dt>車種</dt>
                <dd>
                  {isDetailEditing ? (
                    <div className={formStyles.field}>
                      <select
                        value={detailForm?.modelId ?? ""}
                        onChange={(event) =>
                          setDetailForm((prev) => (prev ? { ...prev, modelId: event.target.value } : prev))
                        }
                      >
                        <option value="">車種を選択</option>
                        {bikeModels.map((vehicleModel) => (
                          <option key={vehicleModel.modelId} value={vehicleModel.modelId}>
                            {vehicleModel.modelName}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    model?.modelName ?? vehicle.modelId
                  )}
                </dd>
              </div>
              <div className={styles.detailItem}>
                <dt>店舗</dt>
                <dd>
                  {isDetailEditing ? (
                    <div className={formStyles.field}>
                      <select
                        value={detailForm?.storeId ?? ""}
                        onChange={(event) =>
                          setDetailForm((prev) => (prev ? { ...prev, storeId: event.target.value } : prev))
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
                  ) : (
                    getStoreLabel(vehicle.storeId)
                  )}
                </dd>
              </div>
              <div className={styles.detailItem}>
                <dt>掲載状態</dt>
                <dd>
                  {isDetailEditing ? (
                    <div className={formStyles.field}>
                      <select
                        value={detailForm?.publishStatus ?? "ON"}
                        onChange={(event) =>
                          setDetailForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  publishStatus: event.target.value as PublishStatus,
                                }
                              : prev
                          )
                        }
                      >
                        <option value="ON">公開 (ON)</option>
                        <option value="OFF">非公開 (OFF)</option>
                      </select>
                    </div>
                  ) : (
                    vehicle.publishStatus
                  )}
                </dd>
              </div>
              <div className={styles.detailItem}>
                <dt>タグ</dt>
                <dd>
                  {isDetailEditing ? (
                    <div className={formStyles.field}>
                      <input
                        value={detailForm?.tags ?? ""}
                        onChange={(event) =>
                          setDetailForm((prev) => (prev ? { ...prev, tags: event.target.value } : prev))
                        }
                      />
                    </div>
                  ) : vehicle.tags.length > 0 ? (
                    vehicle.tags.join(", ")
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div className={styles.detailItem}>
                <dt>保険証番号1</dt>
                <dd>
                  {isDetailEditing ? (
                    <div className={formStyles.field}>
                      <input
                        value={detailForm?.policyNumber1 ?? ""}
                        onChange={(event) =>
                          setDetailForm((prev) => (prev ? { ...prev, policyNumber1: event.target.value } : prev))
                        }
                      />
                    </div>
                  ) : vehicle.policyNumber1 ? (
                    vehicle.policyNumber1
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div className={styles.detailItem}>
                <dt>保険証枝番1</dt>
                <dd>
                  {isDetailEditing ? (
                    <div className={formStyles.field}>
                      <input
                        value={detailForm?.policyBranchNumber1 ?? ""}
                        onChange={(event) =>
                          setDetailForm((prev) =>
                            prev ? { ...prev, policyBranchNumber1: event.target.value } : prev
                          )
                        }
                      />
                    </div>
                  ) : vehicle.policyBranchNumber1 ? (
                    vehicle.policyBranchNumber1
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div className={styles.detailItem}>
                <dt>保険証番号2</dt>
                <dd>
                  {isDetailEditing ? (
                    <div className={formStyles.field}>
                      <input
                        value={detailForm?.policyNumber2 ?? ""}
                        onChange={(event) =>
                          setDetailForm((prev) => (prev ? { ...prev, policyNumber2: event.target.value } : prev))
                        }
                      />
                    </div>
                  ) : vehicle.policyNumber2 ? (
                    vehicle.policyNumber2
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div className={styles.detailItem}>
                <dt>保険証枝番2</dt>
                <dd>
                  {isDetailEditing ? (
                    <div className={formStyles.field}>
                      <input
                        value={detailForm?.policyBranchNumber2 ?? ""}
                        onChange={(event) =>
                          setDetailForm((prev) =>
                            prev ? { ...prev, policyBranchNumber2: event.target.value } : prev
                          )
                        }
                      />
                    </div>
                  ) : vehicle.policyBranchNumber2 ? (
                    vehicle.policyBranchNumber2
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div className={styles.detailItem}>
                <dt>車検満了日</dt>
                <dd>
                  {isDetailEditing ? (
                    <div className={formStyles.field}>
                      <input
                        type="date"
                        value={detailForm?.inspectionExpiryDate ?? ""}
                        onChange={(event) =>
                          setDetailForm((prev) =>
                            prev ? { ...prev, inspectionExpiryDate: event.target.value } : prev
                          )
                        }
                      />
                    </div>
                  ) : vehicle.inspectionExpiryDate ? (
                    vehicle.inspectionExpiryDate
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div className={styles.detailItem}>
                <dt>ナンバープレート番号</dt>
                <dd>
                  {isDetailEditing ? (
                    <div className={formStyles.field}>
                      <input
                        value={detailForm?.licensePlateNumber ?? ""}
                        onChange={(event) =>
                          setDetailForm((prev) =>
                            prev ? { ...prev, licensePlateNumber: event.target.value } : prev
                          )
                        }
                      />
                    </div>
                  ) : vehicle.licensePlateNumber ? (
                    vehicle.licensePlateNumber
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div className={styles.detailItem}>
                <dt>駐車No</dt>
                <dd>
                  {isDetailEditing ? (
                    <div className={formStyles.field}>
                      <input
                        value={detailForm?.parkingNumber ?? ""}
                        onChange={(event) =>
                          setDetailForm((prev) =>
                            prev ? { ...prev, parkingNumber: event.target.value } : prev
                          )
                        }
                      />
                    </div>
                  ) : vehicle.parkingNumber ? (
                    vehicle.parkingNumber
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div className={styles.detailItem}>
                <dt>旧ナンバープレート番号</dt>
                <dd>
                  {isDetailEditing ? (
                    <div className={formStyles.field}>
                      <input
                        value={detailForm?.previousLicensePlateNumber ?? ""}
                        onChange={(event) =>
                          setDetailForm((prev) =>
                            prev ? { ...prev, previousLicensePlateNumber: event.target.value } : prev
                          )
                        }
                      />
                    </div>
                  ) : vehicle.previousLicensePlateNumber ? (
                    vehicle.previousLicensePlateNumber
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div className={styles.detailItem}>
                <dt>自賠責満了日</dt>
                <dd>
                  {isDetailEditing ? (
                    <div className={formStyles.field}>
                      <input
                        type="date"
                        value={detailForm?.liabilityInsuranceExpiryDate ?? ""}
                        onChange={(event) =>
                          setDetailForm((prev) =>
                            prev
                              ? { ...prev, liabilityInsuranceExpiryDate: event.target.value }
                              : prev
                          )
                        }
                      />
                    </div>
                  ) : vehicle.liabilityInsuranceExpiryDate ? (
                    vehicle.liabilityInsuranceExpiryDate
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div className={styles.detailItem}>
                <dt>動画URL</dt>
                <dd>
                  {isDetailEditing ? (
                    <div className={formStyles.field}>
                      <input
                        type="url"
                        value={detailForm?.videoUrl ?? ""}
                        onChange={(event) =>
                          setDetailForm((prev) => (prev ? { ...prev, videoUrl: event.target.value } : prev))
                        }
                      />
                    </div>
                  ) : vehicle.videoUrl ? (
                    vehicle.videoUrl
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div className={styles.detailItem}>
                <dt>備考</dt>
                <dd>
                  {isDetailEditing ? (
                    <div className={formStyles.field}>
                      <textarea
                        value={detailForm?.notes ?? ""}
                        onChange={(event) =>
                          setDetailForm((prev) => (prev ? { ...prev, notes: event.target.value } : prev))
                        }
                      />
                    </div>
                  ) : vehicle.notes ? (
                    vehicle.notes
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div className={styles.detailItem}>
                <dt>作成日時</dt>
                <dd>{vehicle.createdAt ?? "-"}</dd>
              </div>
              <div className={styles.detailItem}>
                <dt>更新日時</dt>
                <dd>{vehicle.updatedAt ?? "-"}</dd>
              </div>
            </dl>
            {detailError && <p className={formStyles.error}>{detailError}</p>}
            {detailSuccess && <p className={formStyles.hint}>{detailSuccess}</p>}
            {isDetailEditing && (
              <div className={formStyles.actions}>
                <button
                  type="button"
                  className={styles.tableToolbarButton}
                  onClick={() => {
                    if (!vehicle) {
                      return;
                    }
                    setDetailForm({
                      modelId: vehicle.modelId?.toString() ?? "",
                      storeId: vehicle.storeId ?? "",
                      publishStatus: vehicle.publishStatus ?? "ON",
                      tags: (vehicle.tags ?? []).join(","),
                      policyNumber1: vehicle.policyNumber1 ?? "",
                      policyBranchNumber1: vehicle.policyBranchNumber1 ?? "",
                      policyNumber2: vehicle.policyNumber2 ?? "",
                      policyBranchNumber2: vehicle.policyBranchNumber2 ?? "",
                      inspectionExpiryDate: vehicle.inspectionExpiryDate ?? "",
                      licensePlateNumber: vehicle.licensePlateNumber ?? "",
                      parkingNumber: vehicle.parkingNumber ?? "",
                      previousLicensePlateNumber: vehicle.previousLicensePlateNumber ?? "",
                      liabilityInsuranceExpiryDate: vehicle.liabilityInsuranceExpiryDate ?? "",
                      videoUrl: vehicle.videoUrl ?? "",
                      notes: vehicle.notes ?? "",
                    });
                    setDetailError(null);
                    setDetailSuccess(null);
                    setIsDetailEditing(false);
                  }}
                >
                  変更を破棄
                </button>
                <button type="submit" className={formStyles.primaryButton} disabled={isSavingDetail}>
                  {isSavingDetail ? "保存中..." : "変更を保存"}
                </button>
              </div>
            )}
          </form>
        )}
      </DashboardLayout>
    </>
  );
}
