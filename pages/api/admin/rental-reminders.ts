import type { NextApiRequest, NextApiResponse } from "next";

import { fetchUserNotifications } from "../../../lib/userNotifications";
import { fetchAllReservations, isActiveReservation, Reservation } from "../../../lib/reservations";
import { sendRentalReminderEmail } from "../../../lib/rentalReminderEmail";

type ReminderTarget = {
  reservationId: string;
  storeName: string;
  vehicleModel: string;
  pickupAt: string;
  memberName: string;
  memberEmail: string;
};

type ReminderSendResult = ReminderTarget & {
  status: "sent" | "skipped" | "failed" | "already_sent";
  detail?: string;
};

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

const toJstDateString = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
};

const toTarget = (reservation: Reservation): ReminderTarget => ({
  reservationId: reservation.id,
  storeName: reservation.storeName,
  vehicleModel: reservation.vehicleModel,
  pickupAt: reservation.pickupAt,
  memberName: reservation.memberName,
  memberEmail: reservation.memberEmail,
});

async function findTomorrowReservations(): Promise<Reservation[]> {
  const tomorrowJst = toJstDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const reservations = await fetchAllReservations();

  return reservations.filter(
    (reservation) =>
      isActiveReservation(reservation) &&
      Boolean(reservation.pickupAt) &&
      toJstDateString(reservation.pickupAt) === tomorrowJst
  );
}

async function hasReminderAlready(reservation: Reservation): Promise<boolean> {
  const userId = reservation.memberId || reservation.memberEmail;
  if (!userId || userId === "-") return false;

  try {
    const existing = await fetchUserNotifications(userId, 50);
    return existing.some(
      (notice) => notice.category === "レンタル前日" && notice.body?.includes(reservation.id)
    );
  } catch (error) {
    console.error("[rental-reminders] Failed to check existing notifications", error);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const targets = await findTomorrowReservations();
      return res.status(200).json({
        targetDate: toJstDateString(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        subjectSample: "【ヤスカリ】明日はレンタル開始日です",
        targets: targets.map(toTarget),
      });
    } catch (error) {
      console.error("[rental-reminders] Failed to list targets", error);
      return res.status(500).json({ message: "対象予約の取得に失敗しました。" });
    }
  }

  if (req.method === "POST") {
    try {
      const targets = await findTomorrowReservations();
      const results: ReminderSendResult[] = [];

      for (const reservation of targets) {
        const base = toTarget(reservation);

        if (await hasReminderAlready(reservation)) {
          results.push({ ...base, status: "already_sent", detail: "送信済みのためスキップしました。" });
          continue;
        }

        try {
          const { simulated } = await sendRentalReminderEmail(reservation);
          results.push(
            simulated
              ? {
                  ...base,
                  status: "skipped",
                  detail: "SMTP未設定またはメール未登録のため、サイト内通知のみ記録しました。",
                }
              : { ...base, status: "sent" }
          );
        } catch (error) {
          console.error("[rental-reminders] Failed to send reminder", reservation.id, error);
          results.push({
            ...base,
            status: "failed",
            detail: error instanceof Error ? error.message : "送信中にエラーが発生しました。",
          });
        }
      }

      const sentCount = results.filter((result) => result.status === "sent").length;
      const skippedCount = results.filter((result) => result.status === "skipped").length;
      const alreadyCount = results.filter((result) => result.status === "already_sent").length;
      const failedCount = results.filter((result) => result.status === "failed").length;

      return res.status(200).json({
        message: `送信 ${sentCount}件 / スキップ ${skippedCount}件 / 送信済み ${alreadyCount}件 / 失敗 ${failedCount}件`,
        results,
      });
    } catch (error) {
      console.error("[rental-reminders] Failed to send reminders", error);
      return res.status(500).json({ message: "前日リマインドの送信に失敗しました。" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}
