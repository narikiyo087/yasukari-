import bikesData from "../data/bikes.json";
import { scanAllItems } from "./dynamodb";
import { getRequiredLicenseLabel } from "./dashboard/licenseOptions";
import type { DurationPriceMap } from "./dashboard/types";

type DynamoBikeModel = {
  modelId: number;
  classId?: number;
  modelName: string;
  publishStatus?: "ON" | "OFF";
  displacementCc?: number;
  requiredLicense?: number;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  seatHeightMm?: number;
  seatCapacity?: number;
  vehicleWeightKg?: number;
  fuelTankCapacityL?: number;
  fuelType?: string;
  maxPower?: string;
  maxTorque?: string;
  mainImageUrl?: string;
};

type DynamoVehicle = {
  managementNumber: string;
  modelId: number;
  publishStatus?: "ON" | "OFF";
  storeId?: string;
};

export interface BikeClass {
  classId: number;
  className: string;
  class_id?: string;
  base_prices?: DurationPriceMap;
}

export interface BikeSpec {
  license?: string;
  capacity?: string;
  length?: string;
  width?: string;
  height?: string;
  seatHeight?: string;
  weight?: string;
  tank?: string;
  fuel?: string;
  output?: string;
  displacement?: string;
  torque?: string;
}

export interface BikeModel {
  modelName: string;
  modelCode: string;
  img: string;
  badge?: string;
  description?: string;
  price24h?: string;
  tags?: string[];
  spec?: BikeSpec;
  stores?: string[];
  classId?: number;
  modelId?: number;
}

export interface BikeVehicle {
  managementNumber: string;
  modelId: number;
  publishStatus?: "ON" | "OFF";
  storeId?: string;
}

// 車両データの取得元の記録（利用開始前チェック E-1）。
// DynamoDBに繋がらず data/bikes.json に切り替わったことが「見た目では分からない」問題があったため、
// 直近の取得元を記録して /api/monitor から確認できるようにする。
// BIKES_DISABLE_STATIC_FALLBACK=1 を設定すると、本番でフォールバックせずエラーにする
// （テーブル未設定のまま公開してしまう事故を、起動直後に気づける形にする）。
let lastModelsSource: "dynamodb" | "static-fallback" | null = null;
let lastFallbackAt: string | null = null;

export function getBikeDataSourceStatus(): {
  lastModelsSource: "dynamodb" | "static-fallback" | null;
  lastFallbackAt: string | null;
} {
  return { lastModelsSource, lastFallbackAt };
}

/**
 * Fetch list of bike models.
 */
export async function getBikeModels(): Promise<BikeModel[]> {
  const MODELS_TABLE = process.env.BIKE_MODELS_TABLE ?? "BikeModels";

  try {
    const models = await scanAllItems<DynamoBikeModel>({
      TableName: MODELS_TABLE,
    });

    const published = models
      .filter((model) => (model.publishStatus ?? "ON") === "ON")
      .sort((a, b) => a.modelId - b.modelId);

    lastModelsSource = "dynamodb";
    return published.map((model) => {
      const spec: BikeSpec = {
        license: getRequiredLicenseLabel(model.requiredLicense),
        capacity: model.seatCapacity != null ? `${model.seatCapacity}名` : undefined,
        length: model.lengthMm != null ? `${model.lengthMm}mm` : undefined,
        width: model.widthMm != null ? `${model.widthMm}mm` : undefined,
        height: model.heightMm != null ? `${model.heightMm}mm` : undefined,
        seatHeight: model.seatHeightMm != null ? `${model.seatHeightMm}mm` : undefined,
        weight: model.vehicleWeightKg != null ? `${model.vehicleWeightKg}kg` : undefined,
        tank: model.fuelTankCapacityL != null ? `${model.fuelTankCapacityL}L` : undefined,
        fuel: model.fuelType,
        output: model.maxPower,
        displacement: model.displacementCc != null ? `${model.displacementCc}cm3` : undefined,
        torque: model.maxTorque,
      };

      const descriptionParts = [
        spec.displacement ? `排気量：${spec.displacement}` : null,
        spec.seatHeight ? `シート高：${spec.seatHeight}` : null,
      ].filter(Boolean);

      return {
        modelName: model.modelName,
        modelCode: String(model.modelId ?? model.modelName),
        modelId: model.modelId,
        classId: model.classId,
        // プレースホルダは外部サービスに依存せず同梱の画像を使う（利用開始前チェック E-3）
        img: model.mainImageUrl ?? "/image/bike-placeholder.svg",
        description: descriptionParts.join(" ") || undefined,
        spec,
      };
    });
  } catch (error) {
    if (process.env.BIKES_DISABLE_STATIC_FALLBACK === "1") {
      // 本番でテーブル未設定・権限切れのまま「静的データで正常に見える」事故を防ぐ
      throw error;
    }
    lastModelsSource = "static-fallback";
    lastFallbackAt = new Date().toISOString();
    console.error("Failed to fetch bike models from DynamoDB, falling back to static data", error);
    return bikesData.bikes as BikeModel[];
  }
}

export async function getVehiclesByModel(modelId: number): Promise<BikeVehicle[]> {
  const VEHICLES_TABLE = process.env.VEHICLES_TABLE ?? "Vehicles";

  try {
    const vehicles = await scanAllItems<DynamoVehicle>({
      TableName: VEHICLES_TABLE,
      FilterExpression: "#modelId = :modelId",
      ExpressionAttributeNames: { "#modelId": "modelId" },
      ExpressionAttributeValues: { ":modelId": modelId },
    });

    return vehicles
      .filter((vehicle) => (vehicle.publishStatus ?? "ON") === "ON")
      .sort((a, b) => a.managementNumber.localeCompare(b.managementNumber));
  } catch (error) {
    console.error(
      `Failed to fetch vehicles for modelId=${modelId} from DynamoDB`,
      error
    );
    return [];
  }
}

export async function getBikeClasses(): Promise<BikeClass[]> {
  const CLASSES_TABLE = process.env.BIKE_CLASSES_TABLE ?? "BikeClasses";
  try {
    const classes = await scanAllItems<BikeClass>({ TableName: CLASSES_TABLE });
    return classes.sort((a, b) => a.classId - b.classId);
  } catch (error) {
    console.error("Failed to fetch bike classes from DynamoDB", error);
    return [];
  }
}
