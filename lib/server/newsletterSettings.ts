import { NewsletterSettings } from "../../types/newsletter";
import { loadSettingDoc, saveSettingDoc } from "./settingsStore";

// メルマガの件名・本文の下書き。保存は lib/server/settingsStore.ts（DynamoDB、
// ローカルは data/newsletter-settings.json）。デプロイで消えないようにするため。

const KEY = "newsletter-settings";
const FILE = "newsletter-settings.json";

export async function readNewsletterSettings(): Promise<NewsletterSettings> {
  const parsed = (await loadSettingDoc(KEY, FILE)) as Partial<NewsletterSettings> | null;
  if (!parsed) {
    return { subject: "", htmlContent: "" };
  }
  return {
    subject: typeof parsed.subject === "string" ? parsed.subject : "",
    previewText:
      typeof parsed.previewText === "string" && parsed.previewText.trim().length > 0
        ? parsed.previewText
        : undefined,
    htmlContent: typeof parsed.htmlContent === "string" ? parsed.htmlContent : "",
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : undefined,
  } satisfies NewsletterSettings;
}

export async function writeNewsletterSettings(settings: NewsletterSettings): Promise<void> {
  await saveSettingDoc(KEY, FILE, settings);
}
