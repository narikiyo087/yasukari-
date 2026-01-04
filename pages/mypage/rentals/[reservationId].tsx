import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import type { BikeClass } from '../../../lib/dashboard/types';
import type { Reservation } from '../../../lib/reservations';
import { getRequiredLicenseLabel } from '../../../lib/dashboard/licenseOptions';

type BikeModelResponse = {
  modelId: number;
  classId: number;
  modelName: string;
  publishStatus: 'ON' | 'OFF';
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

type StoreAccessInfo = {
  name: string;
  description: string;
  access: string[];
  address: string;
  hours: string;
  anchor: string;
  mapHref: string;
};

const STORE_ACCESS: Record<'minowa' | 'adachi', StoreAccessInfo> = {
  minowa: {
    name: '三ノ輪店',
    description: '東京都台東区の国道4号線沿いにあるレンタルバイク店です。',
    access: ['東京メトロ日比谷線 三ノ輪駅 徒歩4分', '東京メトロ日比谷線 入谷駅 徒歩7分'],
    address: '東京都台東区下谷3ー16ー14',
    hours: '10:00 〜 19:00 （月曜定休）',
    anchor: '/stores#minowa',
    mapHref: 'https://maps.google.com/maps?q=%E6%9D%B1%E4%BA%AC%E9%83%BD%E5%8F%B0%E6%9D%B1%E5%8C%BA%E4%B8%8B%E8%B0%B73%E3%83%BC16%E3%83%BC14',
  },
  adachi: {
    name: '足立小台本店',
    description: '足立区にある格安バイク屋です。',
    access: [
      '舎人ライナー『足立小台』駅から徒歩15分',
      '都電荒川線(東京さくらトラム)『小台』駅から徒歩15分',
      'JR田端駅から・都バス【東43】荒川土手行き・江北駅前行き・豊島五丁目団地行き乗車・小台二丁目下車',
    ],
    address: '東京都足立区小台2-9-7 1階',
    hours: '10:00 〜 19:00 （月曜定休）',
    anchor: '/stores#adachi',
    mapHref: 'https://maps.google.com/maps?q=%E6%9D%B1%E4%BA%AC%E9%83%BD%E8%B6%B3%E7%AB%8B%E5%8C%BA%E5%B0%8F%E5%8F%B02-9-7',
  },
};

const resolveStoreKey = (storeName?: string) => {
  if (!storeName) return null;
  if (storeName.includes('三ノ輪')) return 'minowa';
  if (storeName.includes('足立小台')) return 'adachi';
  return null;
};

const formatReservationDatetime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';

  return parsed.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (value: string) => {
  const sanitized = value?.replace(/,/g, '');
  const numeric = Number(sanitized);
  if (Number.isNaN(numeric)) {
    return value || '-';
  }
  return numeric.toLocaleString('ja-JP');
};

const renderValue = (value?: string | number) => {
  if (value == null || value === '') return '未設定';
  return String(value);
};

const getInsuranceDurationKey = (days: number) => {
  if (days <= 1) return '24h';
  if (days <= 2) return '2d';
  if (days <= 4) return '4d';
  if (days <= 7) return '1w';
  if (days <= 14) return '2w';
  return '1m';
};

const formatRentalPeriod = (days: number) => {
  if (days <= 1) return '24時間';
  if (days <= 2) return '2日間';
  if (days <= 4) return '4日間';
  if (days <= 7) return '1週間';
  if (days <= 14) return '2週間';
  if (days <= 31) return '1ヶ月';
  return `${days}日間`;
};

const formatCoverageDetail = (price: number | null | undefined, days: number | null) => {
  if (price == null || days == null) return '未設定';
  return `${formatRentalPeriod(days)} / ${price.toLocaleString('ja-JP')}円`;
};

const displacementLabel = (displacement?: number) => {
  if (!displacement) return undefined;
  if (displacement >= 400) return '400cc 超';
  if (displacement >= 250) return '250cc クラス';
  if (displacement >= 125) return '125cc クラス';
  return '原付クラス';
};

export default function RentalDetailPage() {
  const router = useRouter();
  const reservationId = typeof router.query.reservationId === 'string' ? router.query.reservationId : '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [reservationError, setReservationError] = useState('');
  const [model, setModel] = useState<BikeModelResponse | null>(null);
  const [modelError, setModelError] = useState('');
  const [bikeClasses, setBikeClasses] = useState<BikeClass[]>([]);
  const [classError, setClassError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/me', {
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('failed to load profile');
        }

        const data = (await response.json().catch(() => ({}))) as { user?: { id?: string } | null };
        if (!data.user) {
          await router.replace('/login');
          return;
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setError('ログイン状態の確認に失敗しました。時間をおいて再度お試しください。');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchUser();
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    if (loading || !reservationId) return;

    const controller = new AbortController();
    const fetchReservation = async () => {
      try {
        const response = await fetch(`/api/reservations/${reservationId}`, {
          credentials: 'include',
          signal: controller.signal,
        });

        if (response.status === 404) {
          setReservationError('予約情報が見つかりませんでした。');
          return;
        }

        if (!response.ok) {
          throw new Error('failed to load reservation');
        }

        const data = (await response.json()) as { reservation?: Reservation };
        if (!data.reservation) {
          setReservationError('予約情報が見つかりませんでした。');
          return;
        }

        setReservation(data.reservation);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setReservationError('予約情報の取得に失敗しました。時間をおいて再度お試しください。');
        }
      }
    };

    void fetchReservation();
    return () => controller.abort();
  }, [loading, reservationId]);

  useEffect(() => {
    if (!reservation?.vehicleModel) return;

    const controller = new AbortController();
    const fetchCatalog = async () => {
      try {
        const [modelsResponse, classesResponse] = await Promise.all([
          fetch('/api/bike-models', { signal: controller.signal }),
          fetch('/api/bike-classes', { signal: controller.signal }),
        ]);
        if (!modelsResponse.ok || !classesResponse.ok) {
          throw new Error('failed to load bike catalog');
        }

        const models = (await modelsResponse.json()) as BikeModelResponse[];
        const classes = (await classesResponse.json()) as BikeClass[];
        setBikeClasses(classes);

        const normalized = reservation.vehicleModel.trim().toLowerCase();
        const matched = models.find((item) => item.modelName?.trim().toLowerCase() === normalized);
        if (matched) {
          setModel(matched);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setModelError('車種情報の取得に失敗しました。');
          setClassError('クラス情報の取得に失敗しました。');
        }
      }
    };

    void fetchCatalog();
    return () => controller.abort();
  }, [reservation?.vehicleModel]);

  const storeInfo = useMemo(() => {
    const key = resolveStoreKey(reservation?.storeName);
    return key ? STORE_ACCESS[key] : null;
  }, [reservation?.storeName]);

  const targetClass = useMemo(() => {
    if (!model) return null;
    return bikeClasses.find((bikeClass) => bikeClass.classId === model.classId) ?? null;
  }, [bikeClasses, model]);

  const rentalDays = useMemo(() => {
    if (!reservation?.pickupAt || !reservation?.returnAt) return null;
    const pickup = new Date(reservation.pickupAt);
    const dropoff = new Date(reservation.returnAt);
    if (Number.isNaN(pickup.getTime()) || Number.isNaN(dropoff.getTime())) return null;
    const diffMs = dropoff.getTime() - pickup.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 1;
  }, [reservation?.pickupAt, reservation?.returnAt]);

  const vehicleCoverageFee = useMemo(() => {
    if (!targetClass?.insurance_prices || rentalDays == null) return null;
    if (rentalDays > 31) {
      const monthlyPrice = targetClass.insurance_prices['1m'];
      if (monthlyPrice != null) {
        const dailyRate = monthlyPrice / 31;
        return Math.round(dailyRate * rentalDays);
      }
    }
    const key = getInsuranceDurationKey(rentalDays);
    return targetClass.insurance_prices[key] ?? null;
  }, [rentalDays, targetClass?.insurance_prices]);

  const theftCoverageFee = useMemo(() => targetClass?.theft_insurance ?? null, [targetClass]);

  const notesValue = useMemo(() => {
    if (!reservation?.notes) return '';
    const cleaned = reservation.notes.replace(/Pay\.JP 決済経由で保存/g, '').trim();
    return cleaned;
  }, [reservation?.notes]);

  const heroImage = reservation?.vehicleThumbnailUrl || model?.mainImageUrl || '/image/vehicle-thumbnail-placeholder.svg';
  const licenseLabel = getRequiredLicenseLabel(model?.requiredLicense) ?? '未設定';
  const modelDescription = useMemo(() => {
    const parts = [
      model?.displacementCc ? `排気量：${model.displacementCc}cm3` : null,
      model?.seatHeightMm ? `シート高：${model.seatHeightMm}mm` : null,
    ].filter(Boolean);
    return parts.join(' ');
  }, [model?.displacementCc, model?.seatHeightMm]);

  const specRows = useMemo(
    () => [
      { label: '必要免許', value: licenseLabel },
      { label: '乗車定員', value: model?.seatCapacity ? `${model.seatCapacity}名` : undefined },
      { label: '全長', value: model?.lengthMm ? `${model.lengthMm}mm` : undefined },
      { label: '全幅', value: model?.widthMm ? `${model.widthMm}mm` : undefined },
      { label: '全高', value: model?.heightMm ? `${model.heightMm}mm` : undefined },
      { label: 'シート高', value: model?.seatHeightMm ? `${model.seatHeightMm}mm` : undefined },
      { label: '車両重量', value: model?.vehicleWeightKg ? `${model.vehicleWeightKg}kg` : undefined },
      { label: '燃料タンク', value: model?.fuelTankCapacityL ? `${model.fuelTankCapacityL}L` : undefined },
      { label: '燃料', value: model?.fuelType },
      { label: '最高出力', value: model?.maxPower },
      { label: '最大トルク', value: model?.maxTorque },
      { label: '排気量', value: model?.displacementCc ? `${model.displacementCc}cm3` : undefined },
    ],
    [
      licenseLabel,
      model?.seatCapacity,
      model?.lengthMm,
      model?.widthMm,
      model?.heightMm,
      model?.seatHeightMm,
      model?.vehicleWeightKg,
      model?.fuelTankCapacityL,
      model?.fuelType,
      model?.maxPower,
      model?.maxTorque,
      model?.displacementCc,
    ]
  );

  return (
    <>
      <Head>
        <title>レンタル詳細 - yasukari</title>
      </Head>
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-12">
        <header className="space-y-2 text-sm text-gray-600">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/" className="text-red-600 hover:underline">
                  ホーム
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/mypage" className="text-red-600 hover:underline">
                  マイページ
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-600">レンタル詳細</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-semibold text-gray-900">レンタル詳細</h1>
          <p className="text-sm text-gray-500">レンタル中の車両情報や予約内容の詳細を確認できます。</p>
        </header>

        {loading ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-700">ログイン状態を確認しています…</p>
          </section>
        ) : (
          <>
            {error ? (
              <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                <p className="text-sm text-red-700">{error}</p>
              </section>
            ) : null}

            {reservationError ? (
              <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                <p className="text-sm text-red-700">{reservationError}</p>
              </section>
            ) : null}

            {reservation ? (
              <>
                <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <img
                      src={heroImage}
                      alt={reservation.vehicleModel ? `${reservation.vehicleModel} のアイキャッチ` : '車両アイキャッチ'}
                      className="h-72 w-full object-cover sm:h-96"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Model detail</p>
                      <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                        {reservation.vehicleModel || '車種未設定'}
                      </h2>
                      <p className="mt-2 text-sm font-semibold text-gray-700">
                        {displacementLabel(model?.displacementCc) ?? 'クラス未設定'}
                      </p>
                      <p className="mt-3 text-sm text-gray-600">{modelDescription || 'スペック情報が未登録です。'}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          {reservation.storeName}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          車両コード: {reservation.vehicleCode || '-'}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          ナンバー: {reservation.vehiclePlate || '未設定'}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900">予約詳細情報</h3>
                      <dl className="mt-4 grid gap-3 text-sm text-gray-700">
                        <div className="rounded-lg bg-gray-50 px-3 py-2">
                          <dt className="text-xs text-gray-500">貸出〜返却</dt>
                          <dd className="font-semibold text-gray-900">
                            {formatReservationDatetime(reservation.pickupAt)} → {formatReservationDatetime(reservation.returnAt)}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-gray-50 px-3 py-2">
                          <dt className="text-xs text-gray-500">ご予約情報</dt>
                          <dd className="font-semibold text-gray-900">
                            車両コード: {reservation.vehicleCode || '-'} / ナンバープレート: {reservation.vehiclePlate || '未設定'}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-gray-50 px-3 py-2">
                          <dt className="text-xs text-gray-500">決済金額</dt>
                          <dd className="font-semibold text-gray-900">{formatCurrency(reservation.paymentAmount)} 円</dd>
                        </div>
                        <div className="rounded-lg bg-gray-50 px-3 py-2">
                          <dt className="text-xs text-gray-500">決済日時</dt>
                          <dd className="font-semibold text-gray-900">
                            {reservation.paymentDate ? formatReservationDatetime(reservation.paymentDate) : '未登録'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Spec</p>
                      <h3 className="mt-2 text-lg font-semibold text-gray-900">スペック</h3>
                    </div>
                    {modelError ? <span className="text-xs text-red-600">{modelError}</span> : null}
                  </div>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    {specRows.map((row) => (
                      <div key={row.label} className="rounded-lg bg-gray-50 px-3 py-2">
                        <dt className="text-xs text-gray-500">{row.label}</dt>
                        <dd className="font-semibold text-gray-900">{renderValue(row.value)}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">オプション・補償内容</h3>
                      {classError ? <span className="text-xs text-red-600">{classError}</span> : null}
                    </div>
                    <dl className="mt-4 grid gap-3">
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <dt className="text-xs text-gray-500">車両補償</dt>
                        <dd className="font-semibold text-gray-900">
                          {formatCoverageDetail(vehicleCoverageFee, rentalDays)}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <dt className="text-xs text-gray-500">盗難補償</dt>
                        <dd className="font-semibold text-gray-900">
                          {formatCoverageDetail(theftCoverageFee, rentalDays)}
                        </dd>
                      </div>
                      {notesValue ? (
                        <div className="rounded-lg bg-gray-50 px-3 py-2">
                          <dt className="text-xs text-gray-500">備考</dt>
                          <dd className="font-semibold text-gray-900">{notesValue}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">店舗アクセス</h3>
                    {storeInfo ? (
                      <div className="mt-4 space-y-3 text-sm text-gray-700">
                        <p className="font-semibold text-gray-900">{storeInfo.name}</p>
                        <p>{storeInfo.description}</p>
                        <ul className="list-disc space-y-1 pl-5">
                          {storeInfo.access.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <div className="rounded-lg bg-gray-50 px-3 py-2">
                          <p className="text-xs text-gray-500">所在地</p>
                          <p className="font-semibold text-gray-900">{storeInfo.address}</p>
                          <p className="mt-1 text-xs text-gray-500">営業時間</p>
                          <p className="font-semibold text-gray-900">{storeInfo.hours}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={storeInfo.anchor}
                            className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                          >
                            店舗までのアクセス
                          </Link>
                          <a
                            href={storeInfo.mapHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-100"
                          >
                            Googleマップで開く
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-gray-600">店舗情報が未登録です。</p>
                    )}
                  </div>
                </section>
              </>
            ) : null}
          </>
        )}
      </main>
    </>
  );
}
