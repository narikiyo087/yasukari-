import { AnnouncementBannerSettings } from "../../types/announcement";
import { loadSettingDoc, saveSettingDoc } from "./settingsStore";

// トップのお知らせバナー。保存は lib/server/settingsStore.ts（DynamoDB、
// ローカルは data/announcement-banner.json）。デプロイで消えないようにするため。

const KEY = "announcement-banner";
const FILE = "announcement-banner.json";

export async function readAnnouncementBanner(): Promise<AnnouncementBannerSettings> {
  const parsed = (await loadSettingDoc(KEY, FILE)) as Partial<AnnouncementBannerSettings> | null;
  if (!parsed) {
    return { text: "", linkType: "none" };
  }
  return {
    text: typeof parsed.text === "string" ? parsed.text : "",
    linkType: parsed.linkType ?? "none",
    blogSlug: typeof parsed.blogSlug === "string" ? parsed.blogSlug : undefined,
    externalUrl: typeof parsed.externalUrl === "string" ? parsed.externalUrl : undefined,
  } satisfies AnnouncementBannerSettings;
}

export async function writeAnnouncementBanner(
  settings: AnnouncementBannerSettings
): Promise<void> {
  await saveSettingDoc(KEY, FILE, settings);
}
