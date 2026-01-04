import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

import { getBikeModels } from "./bikes";
import { getDocumentClient, scanAllItems } from "./dynamodb";

export type ReservationStatus =
  | "予約受付完了"
  | "入金待ち"
  | "キャンセル"
  | (string & {});

export const isActiveReservation = (reservation: {
  status: ReservationStatus;
  reservationCompletedFlag: boolean;
}): boolean =>
  reservation.status !== "キャンセル" &&
  reservation.status !== "予約完了" &&
  !reservation.reservationCompletedFlag;

export type Reservation = {
  id: string;
  storeName: string;
  vehicleModel: string;
  vehicleCode: string;
  vehiclePlate: string;
  vehicleThumbnailUrl?: string;
  videoUrl?: string;
  vehicleChangedAt?: string;
  vehicleChangeNotified?: boolean;
  pickupAt: string;
  returnAt: string;
  status: ReservationStatus;
  paymentAmount: string;
  paymentId: string;
  paymentDate: string;
  rentalDurationHours: number | null;
  rentalCompletedAt: string;
  reservationCompletedFlag: boolean;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  memberCountryCode?: string;
  couponCode: string;
  couponDiscount: string;
  options: {
    vehicleCoverage: string;
    theftCoverage: string;
  };
  notes: string;
  returnRating?: number;
  returnSurvey?: string;
  refundNote?: string;
  keyboxPinCode?: string;
  keyboxPinId?: string;
  keyboxQrCode?: string;
  keyboxQrImageUrl?: string;
  keyboxUnitId?: string;
  keyboxWindowStart?: string;
  keyboxWindowEnd?: string;
  keyboxTargetName?: string;
  keyboxSignUsed?: string;
  accessories?: Record<string, number>;
};

type ReservationRecord = {
  reservation_id: string;
  store_name?: string;
  store?: string;
  storeName?: string;
  vehicle_model?: string;
  vehicleModel?: string;
  vehicle_code?: string;
  vehicleCode?: string;
  vehicle_plate?: string;
  vehiclePlate?: string;
  vehicle_thumbnail_url?: string;
  vehicleThumbnailUrl?: string;
  video_url?: string;
  videoUrl?: string;
  vehicle_changed_at?: string | number;
  vehicleChangedAt?: string | number;
  vehicle_change_notified?: boolean;
  vehicleChangeNotified?: boolean;
  pickup_at?: string | number;
  pickupAt?: string | number;
  return_at?: string | number;
  returnAt?: string | number;
  status?: string;
  payment_amount?: string | number;
  paymentAmount?: string | number;
  payment_id?: string;
  paymentId?: string;
  payment_date?: string | number;
  paymentDate?: string | number;
  rental_duration_hours?: number;
  rentalDurationHours?: number;
  rental_completed_at?: string | number;
  rentalCompletedAt?: string | number;
  reservation_completed_flag?: boolean;
  reservationCompletedFlag?: boolean;
  member_id?: string;
  memberId?: string;
  member_name?: string;
  memberName?: string;
  member_email?: string;
  memberEmail?: string;
  member_phone?: string;
  memberPhone?: string;
  member_country_code?: string;
  memberCountryCode?: string;
  coupon_code?: string;
  couponCode?: string;
  coupon_discount?: string | number;
  couponDiscount?: string | number;
  options_vehicle_coverage?: string;
  vehicleCoverage?: string;
  options_theft_coverage?: string;
  theftCoverage?: string;
  notes?: string;
  refund_note?: string;
  refundNote?: string;
  keybox_pin_code?: string;
  keyboxPinCode?: string;
  keybox_pin_id?: string;
  keyboxPinId?: string;
  keybox_qr_code?: string;
  keyboxQrCode?: string;
  keybox_qr_image_url?: string;
  keyboxQrImageUrl?: string;
  keybox_unit_id?: string;
  keyboxUnitId?: string;
  keybox_window_start?: string | number;
  keyboxWindowStart?: string | number;
  keybox_window_end?: string | number;
  keyboxWindowEnd?: string | number;
  keybox_target_name?: string;
  keyboxTargetName?: string;
  keybox_sign_used?: string;
  keyboxSignUsed?: string;
  accessories?: Record<string, number> | string;
  accessoryOptions?: Record<string, number> | string;
  accessory_options?: Record<string, number> | string;
  return_rating?: number | string;
  returnRating?: number | string;
  return_survey?: string;
  returnSurvey?: string;
  [key: string]: unknown;
};

const RESERVATIONS_TABLE = process.env.RESERVATIONS_TABLE ?? "yoyakuKanri";
const ACCESSORY_KEYS = ["halfCap", "jetHelmet", "brandHelmet", "glove"] as const;

const stringFrom = (record: ReservationRecord, keys: string[], fallback = ""): string => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toLocaleString("ja-JP");
  }

  return fallback;
};

const datetimeFrom = (record: ReservationRecord, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return new Date(value).toISOString();
    if (value instanceof Date) return value.toISOString();
  }

  return "";
};

const numberFrom = (record: ReservationRecord, keys: string[]): number | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  return null;
};

const booleanFrom = (record: ReservationRecord, keys: string[], fallback = false): boolean => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
    if (value === "1" || value === 1) return true;
    if (value === "0" || value === 0) return false;
  }

  return fallback;
};

const toSnakeCase = (value: string): string =>
  value.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);

const numberFromLoose = (value: unknown): number | null => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const normalizeReservation = (record: ReservationRecord): Reservation => {
  const accessorySelections: Record<string, number> = {};
  const accessoryContainers = [
    record.accessories,
    record.accessoryOptions,
    record.accessory_options,
  ];

  const addAccessorySelection = (key: string, rawValue: unknown) => {
    const value = numberFromLoose(rawValue);
    if (value != null && value > 0) {
      accessorySelections[key] = value;
    }
  };

  accessoryContainers.forEach((container) => {
    if (typeof container === "string") {
      try {
        const parsed = JSON.parse(container) as Record<string, unknown>;
        Object.entries(parsed).forEach(([key, value]) => addAccessorySelection(key, value));
      } catch (_error) {
        // ignore parsing errors
      }
      return;
    }

    if (container && typeof container === "object") {
      const recordValue = container as Record<string, unknown>;
      Object.entries(recordValue).forEach(([key, value]) => addAccessorySelection(key, value));
    }
  });

  ACCESSORY_KEYS.forEach((key) => {
    if (accessorySelections[key] != null) return;
    const snakeKey = toSnakeCase(key);
    const value = numberFrom(record, [
      key,
      snakeKey,
      `accessory_${key}`,
      `accessory_${snakeKey}`,
    ]);
    if (value != null && value > 0) {
      addAccessorySelection(key, value);
    }
  });

  return {
    id: stringFrom(record, ["reservation_id", "reservationId", "id"], "(不明なID)"),
    storeName: stringFrom(record, ["store_name", "storeName", "store"], "未設定"),
    vehicleModel: stringFrom(record, ["vehicle_model", "vehicleModel"], "-"),
    vehicleCode: stringFrom(record, ["vehicle_code", "vehicleCode"], "-"),
    vehiclePlate: stringFrom(record, ["vehicle_plate", "vehiclePlate"], "-"),
    vehicleThumbnailUrl: stringFrom(
      record,
      ["vehicle_thumbnail_url", "vehicleThumbnailUrl", "thumbnail_url"],
      ""
    ),
    videoUrl: stringFrom(record, ["video_url", "videoUrl"], ""),
    vehicleChangedAt: datetimeFrom(record, ["vehicle_changed_at", "vehicleChangedAt"]),
    vehicleChangeNotified: booleanFrom(
      record,
      ["vehicle_change_notified", "vehicleChangeNotified"],
      false
    ),
    pickupAt: datetimeFrom(record, ["pickup_at", "pickupAt", "pickup_datetime"]),
    returnAt: datetimeFrom(record, ["return_at", "returnAt", "return_datetime"]),
    status: stringFrom(record, ["status"], "ステータス未設定"),
    paymentAmount: stringFrom(record, ["payment_amount", "paymentAmount"], "-"),
    paymentId: stringFrom(record, ["payment_id", "paymentId"], "-"),
    paymentDate: datetimeFrom(record, ["payment_date", "paymentDate"]),
    rentalDurationHours: numberFrom(record, ["rental_duration_hours", "rentalDurationHours"]),
    rentalCompletedAt: datetimeFrom(record, ["rental_completed_at", "rentalCompletedAt", "completedAt"]),
    reservationCompletedFlag: booleanFrom(
      record,
      ["reservation_completed_flag", "reservationCompletedFlag"],
      false
    ),
    memberId: stringFrom(record, ["member_id", "memberId"], "-"),
    memberName: stringFrom(record, ["member_name", "memberName"], "-"),
    memberEmail: stringFrom(record, ["member_email", "memberEmail"], "-"),
    memberPhone: stringFrom(record, ["member_phone", "memberPhone"], ""),
    memberCountryCode: stringFrom(record, ["member_country_code", "memberCountryCode"], ""),
    couponCode: stringFrom(record, ["coupon_code", "couponCode"], ""),
    couponDiscount: stringFrom(record, ["coupon_discount", "couponDiscount"], ""),
    options: {
      vehicleCoverage: stringFrom(
        record,
        ["options_vehicle_coverage", "vehicleCoverage"],
        "-"
      ),
      theftCoverage: stringFrom(record, ["options_theft_coverage", "theftCoverage"], "-"),
    },
    notes: stringFrom(record, ["notes"], ""),
    returnRating: numberFrom(record, ["return_rating", "returnRating"]) ?? undefined,
    returnSurvey: stringFrom(record, ["return_survey", "returnSurvey"], ""),
    refundNote: stringFrom(record, ["refund_note", "refundNote"], ""),
    keyboxPinCode: stringFrom(record, ["keybox_pin_code", "keyboxPinCode"], ""),
    keyboxPinId: stringFrom(record, ["keybox_pin_id", "keyboxPinId"], ""),
    keyboxQrCode: stringFrom(record, ["keybox_qr_code", "keyboxQrCode"], ""),
    keyboxQrImageUrl: stringFrom(record, ["keybox_qr_image_url", "keyboxQrImageUrl"], ""),
    keyboxUnitId: stringFrom(record, ["keybox_unit_id", "keyboxUnitId"], ""),
    keyboxWindowStart: datetimeFrom(record, ["keybox_window_start", "keyboxWindowStart"]),
    keyboxWindowEnd: datetimeFrom(record, ["keybox_window_end", "keyboxWindowEnd"]),
    keyboxTargetName: stringFrom(record, ["keybox_target_name", "keyboxTargetName"], ""),
    keyboxSignUsed: stringFrom(record, ["keybox_sign_used", "keyboxSignUsed"], ""),
    accessories: Object.keys(accessorySelections).length ? accessorySelections : undefined,
  };
};

export async function fetchAllReservations(): Promise<Reservation[]> {
  const items = await scanAllItems<ReservationRecord>({ TableName: RESERVATIONS_TABLE });
  return items
    .map(normalizeReservation)
    .sort((a, b) => (a.pickupAt || "") > (b.pickupAt || "") ? -1 : 1);
}

export async function fetchReservationsByMember(memberId: string): Promise<Reservation[]> {
  const items = await scanAllItems<ReservationRecord>({ TableName: RESERVATIONS_TABLE });
  const reservations = items
    .map(normalizeReservation)
    .filter((reservation) => reservation.memberId === memberId)
    .sort((a, b) => (a.pickupAt || "") > (b.pickupAt || "") ? -1 : 1);

  if (reservations.every((reservation) => reservation.vehicleThumbnailUrl)) {
    return reservations;
  }

  try {
    const models = await getBikeModels();
    const modelImageMap = new Map(
      models.map((model) => [model.modelName.trim(), model.img])
    );

    return reservations.map((reservation) => {
      if (reservation.vehicleThumbnailUrl) {
        return reservation;
      }

      const resolvedImage = modelImageMap.get(reservation.vehicleModel.trim());
      if (!resolvedImage) {
        return reservation;
      }

      return {
        ...reservation,
        vehicleThumbnailUrl: resolvedImage,
      };
    });
  } catch (error) {
    console.error("Failed to resolve reservation thumbnails", error);
    return reservations;
  }
}

export async function fetchReservationById(reservationId: string): Promise<Reservation | null> {
  const client = getDocumentClient();
  const response = await client.send(
    new GetCommand({
      TableName: RESERVATIONS_TABLE,
      Key: { reservation_id: reservationId },
    })
  );

  const record = response.Item as ReservationRecord | undefined;
  if (!record) {
    return null;
  }

  return normalizeReservation(record);
}

type CreateReservationInput = {
  storeName: string;
  vehicleModel: string;
  vehicleCode: string;
  vehiclePlate: string;
  pickupAt: string;
  returnAt: string;
  status?: ReservationStatus;
  paymentAmount: number;
  paymentId: string;
  paymentDate?: string;
  rentalDurationHours?: number | null;
  rentalCompletedAt?: string;
  reservationCompletedFlag?: boolean;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  memberCountryCode?: string;
  couponCode?: string;
  couponDiscount?: number;
  options?: {
    vehicleCoverage?: string;
    theftCoverage?: string;
  };
  notes?: string;
  vehicleChangedAt?: string;
  vehicleChangeNotified?: boolean;
  refundNote?: string;
  accessories?: Record<string, number>;
};

const normalizeAccessoryInput = (
  accessories?: Record<string, number>
): Record<string, number> | undefined => {
  if (!accessories) return undefined;

  const normalized = Object.entries(accessories).reduce<Record<string, number>>(
    (acc, [key, raw]) => {
      const parsed = Number(raw);
      if (!Number.isNaN(parsed) && parsed > 0) {
        acc[key] = parsed;
      }
      return acc;
    },
    {}
  );

  return Object.keys(normalized).length > 0 ? normalized : undefined;
};

const toIsoStringIfPossible = (value: string | number | undefined): string | undefined => {
  if (typeof value === "number") return new Date(value).toISOString();
  if (!value) return undefined;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
};

const reservationToRecord = (reservation: Reservation): ReservationRecord => {
  const record: ReservationRecord = {
    reservation_id: reservation.id,
    store_name: reservation.storeName,
    vehicle_model: reservation.vehicleModel,
    vehicle_code: reservation.vehicleCode,
    vehicle_plate: reservation.vehiclePlate,
    vehicle_thumbnail_url: reservation.vehicleThumbnailUrl ?? "",
    video_url: reservation.videoUrl ?? "",
    vehicle_changed_at:
      toIsoStringIfPossible(reservation.vehicleChangedAt) ?? reservation.vehicleChangedAt,
    vehicle_change_notified: reservation.vehicleChangeNotified ?? false,
    pickup_at: toIsoStringIfPossible(reservation.pickupAt) ?? reservation.pickupAt,
    return_at: toIsoStringIfPossible(reservation.returnAt) ?? reservation.returnAt,
    status: reservation.status,
    payment_amount: reservation.paymentAmount,
    payment_id: reservation.paymentId,
    payment_date: toIsoStringIfPossible(reservation.paymentDate) ?? reservation.paymentDate,
    rental_duration_hours: reservation.rentalDurationHours ?? undefined,
    rental_completed_at: toIsoStringIfPossible(reservation.rentalCompletedAt),
    reservation_completed_flag: reservation.reservationCompletedFlag ?? false,
    member_id: reservation.memberId,
    member_name: reservation.memberName,
    member_email: reservation.memberEmail,
    member_phone: reservation.memberPhone ?? "",
    member_country_code: reservation.memberCountryCode ?? "",
    coupon_code: reservation.couponCode ?? "",
    coupon_discount: reservation.couponDiscount ?? 0,
    options_vehicle_coverage: reservation.options?.vehicleCoverage ?? "",
    options_theft_coverage: reservation.options?.theftCoverage ?? "",
    notes: reservation.notes ?? "",
    return_rating: reservation.returnRating ?? undefined,
    return_survey: reservation.returnSurvey ?? "",
    refund_note: reservation.refundNote ?? "",
    keybox_pin_code: reservation.keyboxPinCode ?? "",
    keybox_pin_id: reservation.keyboxPinId ?? "",
    keybox_qr_code: reservation.keyboxQrCode ?? "",
    keybox_qr_image_url: reservation.keyboxQrImageUrl ?? "",
    keybox_unit_id: reservation.keyboxUnitId ?? "",
    keybox_window_start:
      toIsoStringIfPossible(reservation.keyboxWindowStart) ?? reservation.keyboxWindowStart ?? "",
    keybox_window_end:
      toIsoStringIfPossible(reservation.keyboxWindowEnd) ?? reservation.keyboxWindowEnd ?? "",
    keybox_target_name: reservation.keyboxTargetName ?? "",
    keybox_sign_used: reservation.keyboxSignUsed ?? "",
  };

  if (reservation.accessories) {
    record.accessories = reservation.accessories;
    ACCESSORY_KEYS.forEach((key) => {
      const count = reservation.accessories?.[key];
      if (typeof count === "number") {
        record[key] = count;
      }
    });
  }

  return record;
};

export async function createReservation(
  input: CreateReservationInput
): Promise<Reservation> {
  const client = getDocumentClient();

  const accessories = normalizeAccessoryInput(input.accessories);

  const reservationId = input.paymentId || `rs_${Date.now()}`;
  const paymentDate = toIsoStringIfPossible(input.paymentDate) ?? new Date().toISOString();
  const reservationRecord: ReservationRecord = {
    reservation_id: reservationId,
    store_name: input.storeName,
    vehicle_model: input.vehicleModel,
    vehicle_code: input.vehicleCode,
    vehicle_plate: input.vehiclePlate,
    vehicle_changed_at: toIsoStringIfPossible(input.vehicleChangedAt),
    vehicle_change_notified: input.vehicleChangeNotified ?? false,
    pickup_at: toIsoStringIfPossible(input.pickupAt) ?? input.pickupAt,
    return_at: toIsoStringIfPossible(input.returnAt) ?? input.returnAt,
    status: input.status ?? "予約受付完了",
    payment_amount: input.paymentAmount,
    payment_id: input.paymentId,
    payment_date: paymentDate,
    rental_duration_hours: input.rentalDurationHours ?? undefined,
    rental_completed_at: toIsoStringIfPossible(input.rentalCompletedAt),
    reservation_completed_flag: input.reservationCompletedFlag ?? false,
    member_id: input.memberId,
    member_name: input.memberName,
    member_email: input.memberEmail,
    member_phone: input.memberPhone ?? "",
    member_country_code: input.memberCountryCode ?? "",
    coupon_code: input.couponCode ?? "",
    coupon_discount: input.couponDiscount ?? 0,
    options_vehicle_coverage: input.options?.vehicleCoverage ?? "",
    options_theft_coverage: input.options?.theftCoverage ?? "",
    notes: input.notes ?? "",
    refund_note: input.refundNote ?? "",
  };

  if (accessories) {
    reservationRecord.accessories = accessories;
    Object.entries(accessories).forEach(([key, count]) => {
      if (typeof count === "number") {
        reservationRecord[key] = count;
      }
    });
  }

  await client.send(
    new PutCommand({
      TableName: RESERVATIONS_TABLE,
      Item: reservationRecord,
    })
  );

  return normalizeReservation(reservationRecord);
}

export async function updateReservation(
  reservationId: string,
  updates: Partial<Reservation>
): Promise<Reservation> {
  const client = getDocumentClient();
  const current = await fetchReservationById(reservationId);

  if (!current) {
    throw new Error(`Reservation ${reservationId} not found`);
  }

  const merged: Reservation = {
    ...current,
    ...updates,
    id: reservationId,
  };

  const record = reservationToRecord(merged);

  await client.send(
    new PutCommand({
      TableName: RESERVATIONS_TABLE,
      Item: record,
    })
  );

  return normalizeReservation(record);
}

export type { ReservationRecord };
