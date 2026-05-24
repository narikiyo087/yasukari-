import type { NextApiRequest, NextApiResponse } from "next";

import { fetchMembers } from "../../../../lib/adminMembers";
import { fetchAllReservations, type Reservation } from "../../../../lib/reservations";

const CSV_HEADERS = [
  "会員番号",
  "登録日時",
  "仮登録日時",
  "本登録日時（免許証アップロード）",
  "会員名",
  "権限",
  "メールアドレス",
  "状態",
  "携帯電話",
  "電話番号",
  "生年月日",
  "郵便番号",
  "住所",
  "免許番号",
  "通勤先名",
  "通勤先住所",
  "通勤先電話番号",
  "その他連絡先名",
  "その他連絡先住所",
  "その他連絡先電話番号",
  "備考",
  "予約ID",
  "車両",
  "受取日時",
  "返却日時",
  "状態(予約)",
  "支払額",
] as const;

const sanitizeCsvValue = (value: string): string => {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
};

const memberCsvValue = (value?: string): string => {
  const normalized = value?.trim();
  if (!normalized) {
    return "-";
  }
  return normalized;
};

const reservationToColumns = (reservation?: Reservation): string[] => {
  if (!reservation) {
    return ["-", "-", "-", "-", "-", "-"];
  }

  const vehicleLabel = `${reservation.vehicleModel} (${reservation.vehicleCode})`;
  return [
    reservation.id || "-",
    vehicleLabel,
    reservation.pickupAt || "-",
    reservation.returnAt || "-",
    reservation.status || "-",
    reservation.paymentAmount || "-",
  ];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const [members, reservations] = await Promise.all([fetchMembers(), fetchAllReservations()]);
    const reservationsByMember = new Map<string, Reservation[]>();

    reservations.forEach((reservation) => {
      const current = reservationsByMember.get(reservation.memberId) ?? [];
      current.push(reservation);
      reservationsByMember.set(reservation.memberId, current);
    });

    const lines = [CSV_HEADERS.join(",")];

    members.forEach((member) => {
      const memberColumns = [
        memberCsvValue(member.memberNumber),
        memberCsvValue(member.registeredAt),
        memberCsvValue(member.provisionalRegisteredAt),
        memberCsvValue(member.fullRegisteredAt),
        memberCsvValue(member.name),
        memberCsvValue(member.role),
        memberCsvValue(member.email),
        memberCsvValue(member.status),
        memberCsvValue(member.mobilePhone),
        memberCsvValue(member.phoneNumber),
        memberCsvValue(member.birthDate),
        memberCsvValue(member.postalCode),
        memberCsvValue(member.address),
        memberCsvValue(member.licenseNumber),
        memberCsvValue(member.workplaceName),
        memberCsvValue(member.workplaceAddress),
        memberCsvValue(member.workplacePhone),
        memberCsvValue(member.otherContactName),
        memberCsvValue(member.otherContactAddress),
        memberCsvValue(member.otherContactPhone),
        member.notes?.trim() || "-",
      ];

      const memberReservations = reservationsByMember.get(member.id);
      const sourceReservations =
        memberReservations && memberReservations.length > 0 ? memberReservations : [undefined];

      sourceReservations.forEach((reservation) => {
        const row = [...memberColumns, ...reservationToColumns(reservation)]
          .map(sanitizeCsvValue)
          .join(",");
        lines.push(row);
      });
    });

    const csvBody = `\uFEFF${lines.join("\n")}`;
    const fileName = `members-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.status(200).send(csvBody);
  } catch (error) {
    console.error("Failed to export members CSV", error);
    const message =
      error instanceof Error ? error.message : "会員CSVの出力に失敗しました。";
    return res.status(500).json({ message });
  }
}
