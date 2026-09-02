import { loadSettingDoc, saveSettingDoc } from "./settingsStore";

// メンテナンスモードのON/OFF。保存は lib/server/settingsStore.ts（DynamoDB、
// ローカルは data/maintenance.json）。デプロイで設定が戻らないようにするため。

const KEY = "maintenance";
const FILE = "maintenance.json";

type MaintenanceStatus = {
  enabled: boolean;
};

export async function readMaintenanceStatus(): Promise<MaintenanceStatus> {
  const doc = (await loadSettingDoc(KEY, FILE)) as Partial<MaintenanceStatus> | null;
  return { enabled: Boolean(doc?.enabled) };
}

export async function setMaintenanceStatus(enabled: boolean): Promise<void> {
  await saveSettingDoc(KEY, FILE, { enabled });
}
