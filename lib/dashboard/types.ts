export type PublishStatus = "ON" | "OFF";

export type DurationPriceKey = "24h" | "2d" | "4d" | "1w" | "2w" | "1m";

export type DurationPriceMap = Partial<Record<DurationPriceKey, number>>;

export type ExtraPriceKey = "24h";

export type ExtraPriceMap = Partial<Record<ExtraPriceKey, number>>;

export type AccessoryPriceKey = "24h" | "2d" | "4d" | "1w" | "2w" | "1m" | "extra24h";

export type Accessory = {
  accessory_id: number;
  name: string;
  prices: Partial<Record<AccessoryPriceKey, number>>;
  updated_at: string;
};

export type RentalAvailabilityStatus =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "MAINTENANCE"
  | "RENTED"
  | "RENTAL_COMPLETED";

export type RentalAvailabilityDay = {
  status: RentalAvailabilityStatus;
  note?: string;
};

export type RentalAvailabilityMap = Record<string, RentalAvailabilityDay>;

export type CouponRule = {
  coupon_code: string;
  title: string;
  start_date: string;
  end_date: string;
  discount_amount?: number;
  discount_percentage?: number;
  target_bike_class_ids?: number[];
  target_user_class_ids?: number[];
  updated_at?: string;
};

export type BikeClass = {
  classId: number;
  class_id?: string;
  className: string;
  base_prices?: DurationPriceMap;
  insurance_prices?: DurationPriceMap;
  extra_prices?: ExtraPriceMap;
  theft_insurance?: number;
  createdAt: string;
  updatedAt: string;
};

export type BikeModel = {
  modelId: number;
  classId: number;
  modelName: string;
  publishStatus: PublishStatus;
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
  createdAt: string;
  updatedAt: string;
};

export type Vehicle = {
  managementNumber: string;
  modelId: number;
  storeId: string;
  publishStatus: PublishStatus;
  tags: string[];
  autoAvailabilityInitialized?: boolean;
  rentalAvailability?: RentalAvailabilityMap;
  policyNumber1?: string;
  policyBranchNumber1?: string;
  policyNumber2?: string;
  policyBranchNumber2?: string;
  inspectionExpiryDate?: string;
  licensePlateNumber?: string;
  parkingNumber?: string;
  previousLicensePlateNumber?: string;
  liabilityInsuranceExpiryDate?: string;
  videoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
