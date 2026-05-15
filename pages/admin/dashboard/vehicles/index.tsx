import Head from "next/head";
import { useRouter } from "next/router";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import formStyles from "../../../../styles/AdminForm.module.css";
import tableStyles from "../../../../styles/AdminTable.module.css";
import styles from "../../../../styles/Dashboard.module.css";
import {
  BikeClass,
  BikeModel,
  PublishStatus,
  Vehicle,
} from "../../../../lib/dashboard/types";
import { STORE_OPTIONS, getStoreLabel } from "../../../../lib/dashboard/storeOptions";
import { parseTags } from "../../../../lib/dashboard/utils";

type VehicleCsvFieldKey =
  | "managementNumber"
  | "modelId"
  | "storeId"
  | "storeName"
  | "publishStatus"
  | "tags"
  | "policyNumber1"
  | "policyBranchNumber1"
  | "policyNumber2"
  | "policyBranchNumber2"
  | "inspectionExpiryDate"
  | "licensePlateNumber"
  | "parkingNumber"
  | "previousLicensePlateNumber"
  | "liabilityInsuranceExpiryDate"
  | "videoUrl"
  | "notes"
  | "createdAt"
  | "updatedAt";

const CSV_FIELDS: Array<{
  key: VehicleCsvFieldKey;
  label: string;
  required?: boolean;
  readOnly?: boolean;
}> = [
  { key: "managementNumber", label: "管理番号", required: true },
  { key: "modelId", label: "車種ID", required: true },
  { key: "storeId", label: "店舗ID", required: true },
  { key: "storeName", label: "店舗名", readOnly: true },
  { key: "publishStatus", label: "掲載状態", required: true },
  { key: "tags", label: "タグ (カンマ区切り)" },
  { key: "policyNumber1", label: "保険証券番号1" },
  { key: "policyBranchNumber1", label: "保険取扱支店番号1" },
  { key: "policyNumber2", label: "保険証券番号2" },
  { key: "policyBranchNumber2", label: "保険取扱支店番号2" },
  { key: "inspectionExpiryDate", label: "車検有効期限" },
  { key: "liabilityInsuranceExpiryDate", label: "自賠責保険有効期限" },
  { key: "licensePlateNumber", label: "ナンバープレート番号" },
  { key: "parkingNumber", label: "駐車No" },
  { key: "previousLicensePlateNumber", label: "旧ナンバープレート番号" },
  { key: "videoUrl", label: "動画URL" },
  { key: "notes", label: "備考" },
  { key: "createdAt", label: "作成日時", readOnly: true },
  { key: "updatedAt", label: "更新日時", readOnly: true },
];

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

const PAGE_SIZE = 30;

export default function VehicleListPage() {
  const router = useRouter();
  const [bikeClasses, setBikeClasses] = useState<BikeClass[]>([]);
  const [bikeModels, setBikeModels] = useState<BikeModel[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [modelError, setModelError] = useState<string | null>(null);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [classError, setClassError] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(
    () => new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ON" | "OFF">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortState, setSortState] = useState<{
    key:
      | "managementNumber"
      | "className"
      | "modelName"
      | "storeId"
      | "createdAt"
      | "inspectionExpiryDate"
      | "liabilityInsuranceExpiryDate"
      | "publishStatus";
    direction: "asc" | "desc";
  }>({ key: "managementNumber", direction: "asc" });
  const [deleteConfirmationChecked, setDeleteConfirmationChecked] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailForm, setDetailForm] = useState<VehicleFormState | null>(null);
  const [isDetailEditing, setIsDetailEditing] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailSuccess, setDetailSuccess] = useState<string | null>(null);
  const [isSavingDetail, setIsSavingDetail] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [modelsResponse, vehiclesResponse, classesResponse] = await Promise.all([
          fetch("/api/bike-models"),
          fetch("/api/vehicles"),
          fetch("/api/bike-classes"),
        ]);

        if (modelsResponse.ok) {
          const modelData: BikeModel[] = await modelsResponse.json();
          setBikeModels(modelData.sort((a, b) => a.modelId - b.modelId));
          setModelError(null);
        } else {
          setModelError("車種一覧の取得に失敗しました。");
        }

        if (classesResponse.ok) {
          const classData: BikeClass[] = await classesResponse.json();
          setBikeClasses(classData.sort((a, b) => a.classId - b.classId));
          setClassError(null);
        } else {
          setClassError("バイククラス一覧の取得に失敗しました。");
        }

        if (vehiclesResponse.ok) {
          const vehicleData: Vehicle[] = await vehiclesResponse.json();
          setVehicles(
            vehicleData.sort((a, b) => a.managementNumber.localeCompare(b.managementNumber))
          );
          setVehicleError(null);
        } else {
          setVehicleError("車両一覧の取得に失敗しました。");
        }
      } catch (loadError) {
        console.error("Failed to load vehicle list", loadError);
        setModelError((prev) => prev ?? "車種一覧の取得に失敗しました。");
        setClassError((prev) => prev ?? "バイククラス一覧の取得に失敗しました。");
        setVehicleError((prev) => prev ?? "車両一覧の取得に失敗しました。");
      }
    };

    void loadData();
  }, []);

  const modelMap = useMemo(
    () =>
      bikeModels.reduce<Record<number, BikeModel>>((acc, model) => {
        acc[model.modelId] = model;
        return acc;
      }, {}),
    [bikeModels]
  );

  const modelNameMap = useMemo(
    () =>
      Object.values(modelMap).reduce<Record<number, string>>((acc, model) => {
        acc[model.modelId] = model.modelName;
        return acc;
      }, {}),
    [modelMap]
  );

  const storeLabelToIdMap = useMemo(
    () =>
      STORE_OPTIONS.reduce<Record<string, string>>((acc, store) => {
        acc[store.label] = store.id;
        return acc;
      }, {}),
    []
  );

  const classNameMap = useMemo(
    () =>
      bikeClasses.reduce<Record<number, string>>((acc, bikeClass) => {
        acc[bikeClass.classId] = bikeClass.className;
        return acc;
      }, {}),
    [bikeClasses]
  );

  const getClassNameByModelId = (modelId: number) => {
    const model = modelMap[modelId];
    if (!model) {
      return "-";
    }
    return classNameMap[model.classId] ?? "-";
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) {
      return "-";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString("ja-JP");
  };

  const getTimestamp = (value?: string | null) => {
    if (!value) {
      return 0;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 0;
    }
    return date.getTime();
  };

  const selectedVehicle = useMemo(
    () =>
      selectedVehicleId == null
        ? null
        : vehicles.find((vehicle) => vehicle.managementNumber === selectedVehicleId) ?? null,
    [selectedVehicleId, vehicles]
  );

  useEffect(() => {
    if (!selectedVehicle) {
      setDetailForm(null);
      setIsDetailEditing(false);
      setDetailError(null);
      setDetailSuccess(null);
      return;
    }

    setDetailForm({
      managementNumber: selectedVehicle.managementNumber ?? "",
      modelId: selectedVehicle.modelId?.toString() ?? "",
      storeId: selectedVehicle.storeId ?? "",
      publishStatus: selectedVehicle.publishStatus ?? "ON",
      tags: (selectedVehicle.tags ?? []).join(","),
      policyNumber1: selectedVehicle.policyNumber1 ?? "",
      policyBranchNumber1: selectedVehicle.policyBranchNumber1 ?? "",
      policyNumber2: selectedVehicle.policyNumber2 ?? "",
      policyBranchNumber2: selectedVehicle.policyBranchNumber2 ?? "",
      inspectionExpiryDate: selectedVehicle.inspectionExpiryDate ?? "",
      licensePlateNumber: selectedVehicle.licensePlateNumber ?? "",
      parkingNumber: selectedVehicle.parkingNumber ?? "",
      previousLicensePlateNumber: selectedVehicle.previousLicensePlateNumber ?? "",
      liabilityInsuranceExpiryDate:
        selectedVehicle.liabilityInsuranceExpiryDate ?? "",
      videoUrl: selectedVehicle.videoUrl ?? "",
      notes: selectedVehicle.notes ?? "",
    });
    setIsDetailEditing(false);
    setDetailError(null);
    setDetailSuccess(null);
  }, [selectedVehicle]);

  const filteredVehicles = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    const filtered = vehicles.filter((vehicle) => {
      const modelName = modelNameMap[vehicle.modelId] ?? "";
      const storeLabel = getStoreLabel(vehicle.storeId);
      const matchesKeyword = keyword
        ? [
            vehicle.managementNumber,
            modelName,
            storeLabel,
          ].some((value) =>
            String(value ?? "").toLowerCase().includes(keyword)
          )
        : true;

      const matchesStatus =
        statusFilter === "ALL" ? true : vehicle.publishStatus === statusFilter;

      return matchesKeyword && matchesStatus;
    });

    const directionMultiplier = sortState.direction === "asc" ? 1 : -1;

    const sorted = [...filtered].sort((a, b) => {
      const getValue = (
        vehicle: Vehicle
      ): string | number => {
        switch (sortState.key) {
          case "managementNumber":
            return vehicle.managementNumber;
          case "className":
            return getClassNameByModelId(vehicle.modelId);
          case "modelName":
            return modelNameMap[vehicle.modelId] ?? "";
          case "storeId":
            return getStoreLabel(vehicle.storeId);
          case "createdAt":
            return getTimestamp(vehicle.createdAt);
          case "inspectionExpiryDate":
            return vehicle.inspectionExpiryDate ?? "";
          case "liabilityInsuranceExpiryDate":
            return vehicle.liabilityInsuranceExpiryDate ?? "";
          case "publishStatus":
            return vehicle.publishStatus ?? "";
          default:
            return "";
        }
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * directionMultiplier;
      }

      return String(aValue).localeCompare(String(bValue), "ja") * directionMultiplier;
    });

    return sorted;
  }, [
    classNameMap,
    modelMap,
    modelNameMap,
    searchTerm,
    sortState.direction,
    sortState.key,
    statusFilter,
    vehicles,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE));
  const clampedPage = Math.min(currentPage, totalPages);
  const pagedVehicles = useMemo(() => {
    const startIndex = (clampedPage - 1) * PAGE_SIZE;
    return filteredVehicles.slice(startIndex, startIndex + PAGE_SIZE);
  }, [clampedPage, filteredVehicles]);

  const displayStart = filteredVehicles.length === 0 ? 0 : (clampedPage - 1) * PAGE_SIZE + 1;
  const displayEnd = Math.min(clampedPage * PAGE_SIZE, filteredVehicles.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortState.direction, sortState.key, statusFilter, vehicles.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSort = (
    key:
      | "managementNumber"
      | "className"
      | "modelName"
      | "storeId"
      | "createdAt"
      | "inspectionExpiryDate"
      | "liabilityInsuranceExpiryDate"
      | "publishStatus"
  ) => {
    setSortState((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const handleSortKeyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextKey = event.target.value as typeof sortState.key;
    setSortState((current) => ({ key: nextKey, direction: current.direction }));
  };

  const handleStatusFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = event.target.value as "ALL" | "ON" | "OFF";
    setStatusFilter(nextStatus);
  };

  const handleDetailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedVehicle || !detailForm) {
      return;
    }

    setDetailSuccess(null);
    setDetailError(null);

    if (!detailForm.modelId) {
      setDetailError("車種を選択してください。");
      return;
    }

    if (!detailForm.storeId.trim()) {
      setDetailError("店舗を選択してください。");
      return;
    }

    const modelId = Number(detailForm.modelId);
    if (!bikeModels.some((model) => model.modelId === modelId)) {
      setDetailError("選択された車種が存在しません。");
      return;
    }

    const payload: Record<string, unknown> = {
      managementNumber: selectedVehicle.managementNumber,
      modelId,
      storeId: detailForm.storeId.trim(),
      publishStatus: detailForm.publishStatus,
      tags: parseTags(detailForm.tags),
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
      const value = detailForm[field].trim();
      if (value) {
        payload[field] = value;
      }
    });

    setIsSavingDetail(true);
    try {
      const response = await fetch("/api/vehicles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        setDetailError(errorBody?.message ?? "車両の更新に失敗しました。");
        return;
      }

      const updatedVehicle: Vehicle = await response.json();
      setVehicles((current) =>
        current
          .map((vehicle) =>
            vehicle.managementNumber === updatedVehicle.managementNumber
              ? updatedVehicle
              : vehicle
          )
          .sort((a, b) => a.managementNumber.localeCompare(b.managementNumber))
      );
      setDetailSuccess("車両情報を更新しました。");
      setIsDetailEditing(false);
    } catch (saveError) {
      console.error("Failed to update vehicle", saveError);
      setDetailError("車両の更新に失敗しました。");
    } finally {
      setIsSavingDetail(false);
    }
  };

  const handleRowSelect = (managementNumber: string) => {
    void router.push(`/admin/dashboard/vehicles/${managementNumber}`);
  };

  const toggleVehicleSelection = (managementNumber: string) => {
    setSelectedVehicleIds((current) => {
      const next = new Set(current);
      if (next.has(managementNumber)) {
        next.delete(managementNumber);
      } else {
        next.add(managementNumber);
      }

      if (next.size === 0) {
        setDeleteConfirmationChecked(false);
      }

      return next;
    });
  };

  const handleDeleteSelectedVehicles = async () => {
    const managementNumbers = Array.from(selectedVehicleIds);

    if (managementNumbers.length === 0) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch("/api/vehicles", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ managementNumbers }),
      });

      const responseData: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          responseData &&
          typeof responseData === "object" &&
          responseData !== null &&
          "message" in responseData &&
          typeof (responseData as { message?: unknown }).message === "string"
            ? ((responseData as { message: string }).message ?? "")
            : "車両の削除に失敗しました。";
        throw new Error(message || "車両の削除に失敗しました。");
      }

      const deletedIds = Array.isArray(
        (responseData as { deletedIds?: unknown })?.deletedIds
      )
        ? ((responseData as { deletedIds: unknown[] }).deletedIds.filter(
            (value): value is string => typeof value === "string"
          ))
        : managementNumbers;

      setVehicles((current) =>
        current.filter(
          (vehicle) => !deletedIds.includes(vehicle.managementNumber)
        )
      );
      setSelectedVehicleIds(new Set<string>());
      setDeleteConfirmationChecked(false);
      setSelectedVehicleId((current) => {
        if (current == null) {
          return current;
        }
        return deletedIds.includes(current) ? null : current;
      });
    } catch (error) {
      console.error("Failed to delete vehicles", error);
      setDeleteError(
        error instanceof Error ? error.message : "車両の削除に失敗しました。"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedVehicleCount = selectedVehicleIds.size;
  const isDeleteDisabled =
    selectedVehicleCount === 0 || !deleteConfirmationChecked || isDeleting;

  const createCsvCell = (value: string | number | null | undefined) => {
    const textValue = value ?? "";
    const escapedValue = String(textValue).replace(/"/g, '""');
    return /[",\n]/.test(escapedValue)
      ? `"${escapedValue}"`
      : escapedValue;
  };

  const parseCsv = (content: string) => {
    const rows: string[][] = [];
    let currentValue = "";
    let currentRow: string[] = [];
    let inQuotes = false;

    const pushCell = () => {
      currentRow.push(currentValue);
      currentValue = "";
    };

    for (let index = 0; index < content.length; index += 1) {
      const char = content[index];
      const nextChar = content[index + 1];

      if (char === "\"") {
        if (inQuotes && nextChar === "\"") {
          currentValue += "\"";
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (!inQuotes && (char === "," || char === "\n" || char === "\r")) {
        pushCell();
        if (char === "\n") {
          rows.push(currentRow);
          currentRow = [];
        }
        if (char === "\r" && nextChar === "\n") {
          index += 1;
        }
        continue;
      }

      currentValue += char;
    }

    pushCell();
    return rows.filter((row) => row.some((cell) => cell.trim() !== ""));
  };

  const normalizePublishStatus = (
    value: string | undefined | null
  ): PublishStatus | null => {
    if (!value) return null;
    const normalized = value.trim();
    if (normalized === "ON" || normalized === "OFF") {
      return normalized;
    }
    if (normalized === "掲載中") return "ON";
    if (normalized === "非掲載") return "OFF";
    return null;
  };

  const normalizeStoreIdFromInput = (
    storeId: string | undefined,
    storeName: string | undefined
  ) => {
    if (storeId?.trim()) {
      return storeId.trim();
    }
    if (storeName?.trim()) {
      return storeLabelToIdMap[storeName.trim()] ?? storeName.trim();
    }
    return "";
  };

  const handleDownloadCsv = () => {
    const headers = CSV_FIELDS.map((field) => field.label);
    const rows = filteredVehicles.map((vehicle) =>
      CSV_FIELDS.map((field) => {
        switch (field.key) {
          case "modelId":
            return vehicle.modelId;
          case "storeId":
            return vehicle.storeId ?? "";
          case "storeName":
            return getStoreLabel(vehicle.storeId);
          case "publishStatus":
            return vehicle.publishStatus ?? "";
          case "tags":
            return vehicle.tags?.join(",") ?? "";
          default:
            return (vehicle as unknown as Record<string, string | number | undefined>)[
              field.key
            ];
        }
      })
    );

    const csvContent = [headers, ...rows]
      .map((row) => row.map(createCsvCell).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vehicles.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsvTemplate = () => {
    const headers = CSV_FIELDS.map((field) => field.label);
    const sampleRow = CSV_FIELDS.map((field) => {
      switch (field.key) {
        case "managementNumber":
          return "0001";
        case "modelId":
          return bikeModels[0]?.modelId ?? "1";
        case "storeId":
          return STORE_OPTIONS[0]?.id ?? "";
        case "storeName":
          return STORE_OPTIONS[0]?.label ?? "";
        case "publishStatus":
          return "ON";
        case "tags":
          return "サンプルタグ1,サンプルタグ2";
        case "parkingNumber":
          return "P-01";
        case "createdAt":
        case "updatedAt":
          return "自動入力";
        default:
          return "";
      }
    });

    const csvContent = [headers, sampleRow]
      .map((row) => row.map(createCsvCell).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vehicles-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setImportError(null);
    setImportSuccess(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);

      if (rows.length === 0) {
        setImportError("CSVにデータが含まれていません。");
        return;
      }

      const headers = rows[0];
      const missingHeaders = CSV_FIELDS.filter(
        (field) => !headers.includes(field.label)
      );

      if (missingHeaders.length > 0) {
        setImportError(
          `${missingHeaders.map((item) => item.label).join("、")} の列が見つかりません。`
        );
        return;
      }

      const headerIndexMap = CSV_FIELDS.reduce<Record<VehicleCsvFieldKey, number>>(
        (acc, field) => {
          acc[field.key] = headers.indexOf(field.label);
          return acc;
        },
        {} as Record<VehicleCsvFieldKey, number>
      );

      const dataRows = rows
        .slice(1)
        .filter((row) => row.some((cell) => cell.trim() !== ""));

      if (dataRows.length === 0) {
        setImportError("登録対象の行がありません。空行を削除してください。");
        return;
      }

      const payloads: Array<Omit<Vehicle, "rentalAvailability" | "createdAt" | "updatedAt">> = [];

      for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
        const row = dataRows[rowIndex];

        const managementNumber = row[headerIndexMap.managementNumber]?.trim();
        if (!managementNumber) {
          setImportError(`${rowIndex + 2}行目: 管理番号を入力してください。`);
          return;
        }

        const modelIdValue = row[headerIndexMap.modelId];
        const modelId = Number(modelIdValue);
        if (!Number.isFinite(modelId) || !modelMap[modelId]) {
          setImportError(`${rowIndex + 2}行目: 車種IDを確認してください。`);
          return;
        }

        const storeId = normalizeStoreIdFromInput(
          row[headerIndexMap.storeId],
          row[headerIndexMap.storeName]
        );
        if (!storeId) {
          setImportError(`${rowIndex + 2}行目: 店舗IDを入力してください。`);
          return;
        }

        const publishStatus = normalizePublishStatus(
          row[headerIndexMap.publishStatus]
        );
        if (!publishStatus) {
          setImportError(`${rowIndex + 2}行目: 掲載状態を正しく入力してください。`);
          return;
        }

        const payload = {
          managementNumber,
          modelId,
          storeId,
          publishStatus,
          tags: parseTags(row[headerIndexMap.tags] ?? ""),
          policyNumber1: row[headerIndexMap.policyNumber1]?.trim() || undefined,
          policyBranchNumber1:
            row[headerIndexMap.policyBranchNumber1]?.trim() || undefined,
          policyNumber2: row[headerIndexMap.policyNumber2]?.trim() || undefined,
          policyBranchNumber2:
            row[headerIndexMap.policyBranchNumber2]?.trim() || undefined,
          inspectionExpiryDate:
            row[headerIndexMap.inspectionExpiryDate]?.trim() || undefined,
          licensePlateNumber:
            row[headerIndexMap.licensePlateNumber]?.trim() || undefined,
          parkingNumber:
            row[headerIndexMap.parkingNumber]?.trim() || undefined,
          previousLicensePlateNumber:
            row[headerIndexMap.previousLicensePlateNumber]?.trim() || undefined,
          liabilityInsuranceExpiryDate:
            row[headerIndexMap.liabilityInsuranceExpiryDate]?.trim() || undefined,
          videoUrl: row[headerIndexMap.videoUrl]?.trim() || undefined,
          notes: row[headerIndexMap.notes]?.trim() || undefined,
        };

        payloads.push(payload);
      }

      if (payloads.length === 0) {
        setImportError("登録対象の行がありません。空行を削除してください。");
        return;
      }

      setIsImporting(true);
      const createdVehicles: Vehicle[] = [];

      for (let index = 0; index < payloads.length; index += 1) {
        const response = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloads[index]),
        });

        if (!response.ok) {
          const errorBody = (await response.json().catch(() => null)) as
            | { message?: string }
            | null;
          throw new Error(
            `${index + 2}行目: ${
              errorBody?.message ?? "車両の登録に失敗しました。"
            }`
          );
        }

        const created = (await response.json()) as Vehicle;
        createdVehicles.push(created);
      }

      if (createdVehicles.length > 0) {
        setVehicles((current) =>
          [...current, ...createdVehicles].sort((a, b) =>
            a.managementNumber.localeCompare(b.managementNumber)
          )
        );
      }

      setImportSuccess(`${createdVehicles.length}件の車両を登録しました。`);
    } catch (error) {
      console.error("Failed to upload vehicle CSV", error);
      setImportError(
        error instanceof Error ? error.message : "CSVの登録に失敗しました。"
      );
    } finally {
      setIsImporting(false);
      if (csvFileInputRef.current) {
        csvFileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <Head>
        <title>車両一覧 | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="車両一覧"
        actions={[
          {
            label: "＋ 車両登録",
            href: "/admin/dashboard/vehicles/register",
          },
        ]}
      >
        <section className={styles.section}>
          {classError && <p className={formStyles.error}>{classError}</p>}
          {modelError && <p className={formStyles.error}>{modelError}</p>}
          {vehicleError && <p className={formStyles.error}>{vehicleError}</p>}
          {deleteError && <p className={formStyles.error}>{deleteError}</p>}
          {importError && <p className={formStyles.error}>{importError}</p>}
          {importSuccess && (
            <p className={formStyles.success}>{importSuccess}</p>
          )}
          <div className={formStyles.card}>
            <div className={styles.detailHeader}>
              <h2 className={styles.detailTitle}>車両一覧</h2>
            </div>
            <div className={styles.tableToolbar}>
              <div className={styles.tableToolbarGroup}>
                <input
                  type="search"
                  className={styles.tableSearchInput}
                  placeholder="管理番号・車種名・店舗名で検索"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  aria-label="車両一覧を検索"
                />
                <select
                  className={styles.tableSelect}
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  aria-label="掲載状態で絞り込み"
                >
                  <option value="ALL">掲載状態（すべて）</option>
                  <option value="ON">掲載中のみ</option>
                  <option value="OFF">非掲載のみ</option>
                </select>
              </div>
              <div className={styles.tableToolbarGroup}>
                <span className={styles.tableSelectionCount}>
                  表示中: {displayStart}-{displayEnd} / {filteredVehicles.length}件
                </span>
                <span className={styles.tableSelectionCount}>
                  登録済み: {vehicles.length}件
                </span>
              </div>
              <div className={styles.tableToolbarGroup}>
                <label>
                  <span className={tableStyles.visuallyHidden}>並び替え項目</span>
                  <select
                    className={styles.tableSelect}
                    value={sortState.key}
                    onChange={handleSortKeyChange}
                  >
                    <option value="managementNumber">管理番号で並び替え</option>
                    <option value="className">バイククラスで並び替え</option>
                    <option value="modelName">車種名で並び替え</option>
                    <option value="storeId">店舗で並び替え</option>
                    <option value="createdAt">登録日で並び替え</option>
                    <option value="inspectionExpiryDate">車検満了日で並び替え</option>
                    <option value="liabilityInsuranceExpiryDate">
                      自賠責満了日で並び替え
                    </option>
                    <option value="publishStatus">掲載状態で並び替え</option>
                  </select>
                </label>
                <button
                  type="button"
                  className={styles.tableToolbarButton}
                  onClick={() =>
                    setSortState((current) => ({
                      key: current.key,
                      direction: current.direction === "asc" ? "desc" : "asc",
                    }))
                  }
                >
                  {sortState.direction === "asc" ? "昇順" : "降順"}
                </button>
              </div>
              <div className={styles.tableToolbarGroup}>
                <span className={styles.tableSelectionCount}>
                  選択中: {selectedVehicleCount}件
                </span>
                <label className={styles.confirmationCheckboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.confirmationCheckbox}
                    checked={deleteConfirmationChecked}
                    disabled={isDeleting || selectedVehicleCount === 0}
                    onChange={(event) =>
                      setDeleteConfirmationChecked(event.target.checked)
                    }
                  />
                  削除することを確認しました
                </label>
                <button
                  type="button"
                  className={styles.tableDangerButton}
                  disabled={isDeleteDisabled}
                  onClick={handleDeleteSelectedVehicles}
                >
                  車両削除
                </button>
              </div>
              <div
                className={styles.tableToolbarGroup}
                style={{ marginLeft: "auto" }}
              >
                <button
                  type="button"
                  className={styles.tableToolbarButton}
                  onClick={handleDownloadCsvTemplate}
                >
                  CSVテンプレート
                </button>
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept="text/csv,.csv"
                  className={tableStyles.visuallyHidden}
                  onChange={handleUploadCsv}
                />
                <button
                  type="button"
                  className={styles.tableToolbarButton}
                  onClick={() => csvFileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  CSVアップロード
                </button>
                <button
                  type="button"
                  className={styles.tableToolbarButton}
                  onClick={handleDownloadCsv}
                >
                  CSVダウンロード
                </button>
              </div>
            </div>
            <div className={`${tableStyles.wrapper} ${tableStyles.tableWrapper}`}>
              <table className={`${tableStyles.table} ${tableStyles.dataTable}`}>
                <thead>
                  <tr>
                    <th
                      aria-sort={
                        sortState.key === "managementNumber"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("managementNumber")}
                      >
                        <span>管理番号</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "managementNumber"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "managementNumber"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                    <th
                      aria-sort={
                        sortState.key === "className"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("className")}
                      >
                        <span>バイククラス</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "className"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "className"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                    <th
                      aria-sort={
                        sortState.key === "modelName"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("modelName")}
                      >
                        <span>車種</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "modelName"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "modelName"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                    <th
                      aria-sort={
                        sortState.key === "storeId"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("storeId")}
                      >
                        <span>店舗</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "storeId"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "storeId"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                    <th
                      aria-sort={
                        sortState.key === "createdAt"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("createdAt")}
                      >
                        <span>登録日</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "createdAt"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "createdAt"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                    <th
                      aria-sort={
                        sortState.key === "inspectionExpiryDate"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("inspectionExpiryDate")}
                      >
                        <span>車検満了日</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "inspectionExpiryDate"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "inspectionExpiryDate"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                    <th
                      aria-sort={
                        sortState.key === "liabilityInsuranceExpiryDate"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("liabilityInsuranceExpiryDate")}
                      >
                        <span>自賠責満了日</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "liabilityInsuranceExpiryDate"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "liabilityInsuranceExpiryDate"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                    <th
                      aria-sort={
                        sortState.key === "publishStatus"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("publishStatus")}
                      >
                        <span>掲載状態</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "publishStatus"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "publishStatus"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={8}>登録済みの車両はまだありません。</td>
                    </tr>
                  ) : (
                    pagedVehicles.map((vehicle) => (
                      <tr
                        key={vehicle.managementNumber}
                        tabIndex={0}
                        className={`${tableStyles.clickableRow} ${
                          selectedVehicleId === vehicle.managementNumber
                            ? tableStyles.selectedRow
                            : ""
                        }`}
                        onClick={() => handleRowSelect(vehicle.managementNumber)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleRowSelect(vehicle.managementNumber);
                          }
                        }}
                      >
                        <td>
                          <label className={tableStyles.selectionLabel}>
                            <input
                              type="checkbox"
                              className={tableStyles.selectionCheckbox}
                              checked={selectedVehicleIds.has(
                                vehicle.managementNumber
                              )}
                              disabled={isDeleting}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => {
                                event.stopPropagation();
                                toggleVehicleSelection(vehicle.managementNumber);
                              }}
                              aria-label={`管理番号 ${vehicle.managementNumber} を削除対象として選択`}
                            />
                            <span>{vehicle.managementNumber}</span>
                          </label>
                        </td>
                        <td>{getClassNameByModelId(vehicle.modelId)}</td>
                        <td>{modelNameMap[vehicle.modelId] ?? "-"}</td>
                        <td>{getStoreLabel(vehicle.storeId)}</td>
                        <td>{formatDateTime(vehicle.createdAt)}</td>
                        <td>{vehicle.inspectionExpiryDate ?? "-"}</td>
                        <td>{vehicle.liabilityInsuranceExpiryDate ?? "-"}</td>
                        <td>
                          <span
                            className={`${tableStyles.badge} ${
                              vehicle.publishStatus === "ON"
                                ? tableStyles.badgeOn
                                : tableStyles.badgeOff
                            }`}
                          >
                            {vehicle.publishStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className={styles.tableToolbar}>
              <div className={styles.tableToolbarGroup}>
                <span className={styles.tableSelectionCount}>
                  ページ {clampedPage} / {totalPages}
                </span>
              </div>
              <div className={styles.tableToolbarGroup}>
                <button
                  type="button"
                  className={styles.tableToolbarButton}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={clampedPage <= 1}
                >
                  前へ
                </button>
                <button
                  type="button"
                  className={styles.tableToolbarButton}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={clampedPage >= totalPages}
                >
                  次へ
                </button>
              </div>
            </div>
          </div>
          {selectedVehicle && (
            <div className={styles.detailPanel}>
              <div className={styles.detailHeader}>
                <h2 className={styles.detailTitle}>
                  {selectedVehicle.managementNumber}の詳細情報
                </h2>
                <button
                  type="button"
                  className={styles.detailEditButton}
                  onClick={() => setIsDetailEditing((current) => !current)}
                  disabled={isSavingDetail}
                  aria-pressed={isDetailEditing}
                >
                  {isDetailEditing ? "閲覧に戻る" : "編集に切り替え"}
                </button>
              </div>
              {detailError && <p className={formStyles.error}>{detailError}</p>}
              {detailSuccess && <p className={formStyles.hint}>{detailSuccess}</p>}
              <form onSubmit={handleDetailSubmit}>
                <dl className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <dt>管理番号</dt>
                    <dd>
                      {selectedVehicle.managementNumber}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>車種</dt>
                    <dd>
                      {isDetailEditing ? (
                        <div className={formStyles.field}>
                          <select
                            value={detailForm?.modelId ?? ""}
                            onChange={(event) =>
                              setDetailForm((prev) =>
                                prev ? { ...prev, modelId: event.target.value } : prev
                              )
                            }
                          >
                            <option value="">車種を選択</option>
                            {bikeModels.map((model) => (
                              <option key={model.modelId} value={model.modelId}>
                                {model.modelName}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        modelNameMap[selectedVehicle.modelId] ?? selectedVehicle.modelId
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
                              setDetailForm((prev) =>
                                prev ? { ...prev, storeId: event.target.value } : prev
                              )
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
                        getStoreLabel(selectedVehicle.storeId)
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
                        selectedVehicle.publishStatus
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
                              setDetailForm((prev) =>
                                prev ? { ...prev, tags: event.target.value } : prev
                              )
                            }
                          />
                        </div>
                      ) : selectedVehicle.tags?.length ? (
                        selectedVehicle.tags.join(", ")
                      ) : (
                        "-"
                      )}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>保険証券番号1</dt>
                    <dd>
                      {isDetailEditing ? (
                        <div className={formStyles.field}>
                          <input
                            value={detailForm?.policyNumber1 ?? ""}
                            onChange={(event) =>
                              setDetailForm((prev) =>
                                prev
                                  ? { ...prev, policyNumber1: event.target.value }
                                  : prev
                              )
                            }
                          />
                        </div>
                      ) : selectedVehicle.policyNumber1 ? (
                        selectedVehicle.policyNumber1
                      ) : (
                        "-"
                      )}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>保険取扱支店番号1</dt>
                    <dd>
                      {isDetailEditing ? (
                        <div className={formStyles.field}>
                          <input
                            value={detailForm?.policyBranchNumber1 ?? ""}
                            onChange={(event) =>
                              setDetailForm((prev) =>
                                prev
                                  ? { ...prev, policyBranchNumber1: event.target.value }
                                  : prev
                              )
                            }
                          />
                        </div>
                      ) : selectedVehicle.policyBranchNumber1 ? (
                        selectedVehicle.policyBranchNumber1
                      ) : (
                        "-"
                      )}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>保険証券番号2</dt>
                    <dd>
                      {isDetailEditing ? (
                        <div className={formStyles.field}>
                          <input
                            value={detailForm?.policyNumber2 ?? ""}
                            onChange={(event) =>
                              setDetailForm((prev) =>
                                prev
                                  ? { ...prev, policyNumber2: event.target.value }
                                  : prev
                              )
                            }
                          />
                        </div>
                      ) : selectedVehicle.policyNumber2 ? (
                        selectedVehicle.policyNumber2
                      ) : (
                        "-"
                      )}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>保険取扱支店番号2</dt>
                    <dd>
                      {isDetailEditing ? (
                        <div className={formStyles.field}>
                          <input
                            value={detailForm?.policyBranchNumber2 ?? ""}
                            onChange={(event) =>
                              setDetailForm((prev) =>
                                prev
                                  ? { ...prev, policyBranchNumber2: event.target.value }
                                  : prev
                              )
                            }
                          />
                        </div>
                      ) : selectedVehicle.policyBranchNumber2 ? (
                        selectedVehicle.policyBranchNumber2
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
                                prev
                                  ? { ...prev, inspectionExpiryDate: event.target.value }
                                  : prev
                              )
                            }
                          />
                        </div>
                      ) : selectedVehicle.inspectionExpiryDate ? (
                        selectedVehicle.inspectionExpiryDate
                      ) : (
                        "-"
                      )}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>ナンバープレート</dt>
                    <dd>
                      {isDetailEditing ? (
                        <div className={formStyles.field}>
                          <input
                            value={detailForm?.licensePlateNumber ?? ""}
                            onChange={(event) =>
                              setDetailForm((prev) =>
                                prev
                                  ? { ...prev, licensePlateNumber: event.target.value }
                                  : prev
                              )
                            }
                          />
                        </div>
                      ) : selectedVehicle.licensePlateNumber ? (
                        selectedVehicle.licensePlateNumber
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
                      ) : selectedVehicle.parkingNumber ? (
                        selectedVehicle.parkingNumber
                      ) : (
                        "-"
                      )}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>前ナンバー</dt>
                    <dd>
                      {isDetailEditing ? (
                        <div className={formStyles.field}>
                          <input
                            value={detailForm?.previousLicensePlateNumber ?? ""}
                            onChange={(event) =>
                              setDetailForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      previousLicensePlateNumber: event.target.value,
                                    }
                                  : prev
                              )
                            }
                          />
                        </div>
                      ) : selectedVehicle.previousLicensePlateNumber ? (
                        selectedVehicle.previousLicensePlateNumber
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
                                  ? {
                                      ...prev,
                                      liabilityInsuranceExpiryDate: event.target.value,
                                    }
                                  : prev
                              )
                            }
                          />
                        </div>
                      ) : selectedVehicle.liabilityInsuranceExpiryDate ? (
                        selectedVehicle.liabilityInsuranceExpiryDate
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
                          <div className="flex items-center gap-2">
                          <input
                            type="url"
                            value={detailForm?.videoUrl ?? ""}
                            onChange={(event) =>
                              setDetailForm((prev) =>
                                prev ? { ...prev, videoUrl: event.target.value } : prev
                              )
                            }
                          />
                          <button
                            type="button"
                            className={styles.tableToolbarButton}
                            onClick={() =>
                              setDetailForm((prev) => (prev ? { ...prev, videoUrl: "" } : prev))
                            }
                          >
                            クリア
                          </button>
                        </div>
                        </div>
                      ) : selectedVehicle.videoUrl ? (
                        selectedVehicle.videoUrl
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
                          <div className="flex flex-col gap-2">
                          <textarea
                            value={detailForm?.notes ?? ""}
                            onChange={(event) =>
                              setDetailForm((prev) =>
                                prev ? { ...prev, notes: event.target.value } : prev
                              )
                            }
                          />
                          <button
                            type="button"
                            className={styles.tableToolbarButton}
                            onClick={() =>
                              setDetailForm((prev) => (prev ? { ...prev, notes: "" } : prev))
                            }
                          >
                            クリア
                          </button>
                        </div>
                        </div>
                      ) : selectedVehicle.notes ? (
                        selectedVehicle.notes
                      ) : (
                        "-"
                      )}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>作成日時</dt>
                    <dd>{selectedVehicle.createdAt ?? "-"}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>更新日時</dt>
                    <dd>{selectedVehicle.updatedAt ?? "-"}</dd>
                  </div>
                </dl>
                {isDetailEditing && (
                  <div className={formStyles.actions}>
                    <button
                      type="button"
                      className={styles.tableToolbarButton}
                      onClick={() => {
                        if (!selectedVehicle) {
                          return;
                        }
                        setDetailForm({
                          managementNumber: selectedVehicle.managementNumber ?? "",
                          modelId: selectedVehicle.modelId?.toString() ?? "",
                          storeId: selectedVehicle.storeId ?? "",
                          publishStatus: selectedVehicle.publishStatus ?? "ON",
                          tags: (selectedVehicle.tags ?? []).join(","),
                          policyNumber1: selectedVehicle.policyNumber1 ?? "",
                          policyBranchNumber1: selectedVehicle.policyBranchNumber1 ?? "",
                          policyNumber2: selectedVehicle.policyNumber2 ?? "",
                          policyBranchNumber2: selectedVehicle.policyBranchNumber2 ?? "",
                          inspectionExpiryDate: selectedVehicle.inspectionExpiryDate ?? "",
                          licensePlateNumber: selectedVehicle.licensePlateNumber ?? "",
                          parkingNumber: selectedVehicle.parkingNumber ?? "",
                          previousLicensePlateNumber:
                            selectedVehicle.previousLicensePlateNumber ?? "",
                          liabilityInsuranceExpiryDate:
                            selectedVehicle.liabilityInsuranceExpiryDate ?? "",
                          videoUrl: selectedVehicle.videoUrl ?? "",
                          notes: selectedVehicle.notes ?? "",
                        });
                        setDetailError(null);
                        setDetailSuccess(null);
                        setIsDetailEditing(false);
                      }}
                    >
                      変更を破棄
                    </button>
                    <button
                      type="submit"
                      className={formStyles.primaryButton}
                      disabled={isSavingDetail}
                    >
                      {isSavingDetail ? "保存中..." : "変更を保存"}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
        </section>
      </DashboardLayout>
    </>
  );
}
