export type HighSeasonDate = {
  date: string;
  isHighSeason: boolean;
};

export async function fetchMonthlyHighSeason(
  month: string
): Promise<HighSeasonDate[]> {
  const response = await fetch(`/api/high-season?month=${month}`);
  if (!response.ok) {
    throw new Error("Failed to fetch high season calendar");
  }
  const data = (await response.json()) as { dates: HighSeasonDate[] };
  return data.dates;
}

export async function setHighSeason(
  date: string,
  isHighSeason: boolean
): Promise<void> {
  const response = await fetch(`/api/high-season/${date}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_high_season: isHighSeason }),
  });

  if (!response.ok) {
    throw new Error("Failed to set high season");
  }
}

export async function deleteHighSeason(date: string): Promise<void> {
  const response = await fetch(`/api/high-season/${date}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete high season");
  }
}
