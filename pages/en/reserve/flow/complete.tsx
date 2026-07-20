import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import type { Reservation } from "../../../../lib/reservations";

const formatDateLabel = (dateString: string) => {
  if (!dateString) return "";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
};

const formatDateTimeWithFallback = (isoString: string, fallbackDate?: string, fallbackTime?: string) => {
  if (isoString) {
    const parsed = new Date(isoString);
    if (!Number.isNaN(parsed.getTime())) {
      const dateLabel = parsed.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      });
      const timeLabel = parsed.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      return `${dateLabel} ${timeLabel}`;
    }
  }

  const dateLabel = fallbackDate ? formatDateLabel(fallbackDate) : "";
  const timeLabel = fallbackTime ?? "";
  return [dateLabel, timeLabel].filter(Boolean).join(" ") || "Not set";
};

export default function ReservationCompletePage() {
  const router = useRouter();
  const { reservationId, store, modelName, managementNumber, pickupDate, returnDate, pickupTime, returnTime, totalAmount } =
    router.query;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof reservationId !== "string" || !reservationId) return;

    const controller = new AbortController();

    const fetchReservation = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/reservations/${reservationId}`, { signal: controller.signal });
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Unable to load reservation details.");
        }

        const data = (await response.json()) as { reservation: Reservation };
        setReservation(data.reservation);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          console.error(fetchError);
          setError(fetchError instanceof Error ? fetchError.message : "An error occurred while loading the reservation.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchReservation();
    return () => controller.abort();
  }, [reservationId, router.isReady]);

  const storeName = useMemo(() => {
    if (reservation?.storeName) return reservation.storeName;
    if (typeof store === "string" && store) return store;
    return "Store not specified";
  }, [reservation?.storeName, store]);

  const vehicleLabel = useMemo(() => {
    const model = reservation?.vehicleModel || (typeof modelName === "string" ? modelName : "");
    const code = reservation?.vehicleCode || (typeof managementNumber === "string" ? managementNumber : "");
    if (model && code) return `${model} (${code})`;
    return model || code || "Vehicle not specified";
  }, [managementNumber, modelName, reservation?.vehicleCode, reservation?.vehicleModel]);

  const pickupLabel = useMemo(
    () =>
      formatDateTimeWithFallback(
        reservation?.pickupAt ?? "",
        typeof pickupDate === "string" ? pickupDate : undefined,
        typeof pickupTime === "string" ? pickupTime : undefined
      ),
    [pickupDate, pickupTime, reservation?.pickupAt]
  );

  const returnLabel = useMemo(
    () =>
      formatDateTimeWithFallback(
        reservation?.returnAt ?? "",
        typeof returnDate === "string" ? returnDate : undefined,
        typeof returnTime === "string" ? returnTime : undefined
      ),
    [reservation?.returnAt, returnDate, returnTime]
  );

  const totalAmountLabel = useMemo(() => {
    if (reservation?.paymentAmount) return reservation.paymentAmount.toString();
    if (typeof totalAmount === "string" && totalAmount) {
      const parsed = Number(totalAmount);
      return Number.isNaN(parsed) ? totalAmount : parsed.toLocaleString();
    }
    return "-";
  }, [reservation?.paymentAmount, totalAmount]);

  const reservationIdDisplay = useMemo(() => {
    if (reservation?.id) return reservation.id;
    if (typeof reservationId === "string" && reservationId) return reservationId;
    return "Reservation ID unavailable";
  }, [reservation?.id, reservationId]);

  return (
    <>
      <Head>
        <title>Reservation complete | Test payment</title>
      </Head>
      <main className="min-h-screen bg-slate-50 pb-16">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
          <header className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Reservation Complete</p>
            <h1 className="text-3xl font-bold text-slate-900">Your reservation is confirmed</h1>
            <p className="text-sm text-slate-600">A summary of your reservation is listed below. You can also view it in your account.</p>
          </header>

          <section className="space-y-4">
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">{error}</p>
            ) : null}

            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reservation ID</p>
                  <p className="font-mono text-lg font-semibold text-slate-900">{reservationIdDisplay}</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                  <Link
                    href="/en/mypage"
                    className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 transition"
                  >
                    View in my page
                  </Link>
                  <Link
                    href="/en/products"
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300"
                  >
                    Back to models
                  </Link>
                </div>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Store</dt>
                  <dd className="text-base font-semibold text-slate-900">{storeName}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicle</dt>
                  <dd className="text-base font-semibold text-slate-900">{vehicleLabel}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pickup</dt>
                  <dd className="text-base font-semibold text-slate-900">{pickupLabel}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Return</dt>
                  <dd className="text-base font-semibold text-slate-900">{returnLabel}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment total</dt>
                  <dd className="text-base font-semibold text-slate-900">¥{totalAmountLabel}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
                  <dd className="text-base font-semibold text-slate-900">
                    {reservation?.status || (loading ? "Checking reservation status..." : "Reservation received")}
                  </dd>
                </div>
              </dl>

              <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-semibold">Next steps</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Review your reservation details in your account.</li>
                  <li>If you need to change or cancel, please contact support.</li>
                  <li>Bring your driver’s license and required documents on pickup day.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
