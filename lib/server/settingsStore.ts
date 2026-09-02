import { promises as fs } from "fs";
import path from "path";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getDocumentClient } from "../dynamodb";

// 管理画面から保存する設定（お知らせバナー・チャットボットFAQ・メルマガ・メンテナンス等）の
// 共通保存先。これまで data/*.json への fs.writeFile だったため、デプロイでファイルが
// 入れ替わると設定が初期状態に戻っていた（利用開始前チェック 区分B）。
//
// 保存先：環境変数 SETTINGS_TABLE の DynamoDB テーブル（パーティションキー: settingKey）。
//   値は item.value に JSON ドキュメントとして丸ごと入れる。
// 移行：テーブルにまだ無いキーは data/*.json の中身を初期値として返す（自動では書き込まない。
//   管理画面で保存した時点から DynamoDB 側が正になる）。
// 環境変数が無い場合（ローカル開発）は従来どおり data/*.json を読み書きする。

const TABLE_NAME = process.env.SETTINGS_TABLE || "";

let warned = false;
function usingFile(): boolean {
  if (TABLE_NAME) return false;
  if (!warned) {
    warned = true;
    console.warn(
      "[settingsStore] SETTINGS_TABLE が未設定のため data/*.json に保存しています。" +
        "デプロイで設定が初期状態に戻るため、本番では必ず DynamoDB テーブルを設定してください。"
    );
  }
  return true;
}

function fileOf(fileName: string): string {
  return path.join(process.cwd(), "data", fileName);
}

async function readFileDoc(fileName: string): Promise<unknown | null> {
  try {
    const raw = await fs.readFile(fileOf(fileName), "utf-8");
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** 設定を読む。どこにも無ければ null（呼び出し側が既定値を持つ） */
export async function loadSettingDoc(settingKey: string, fileName: string): Promise<unknown | null> {
  if (usingFile()) {
    return readFileDoc(fileName);
  }
  try {
    const res = await getDocumentClient().send(
      new GetCommand({ TableName: TABLE_NAME, Key: { settingKey } })
    );
    if (res.Item && "value" in res.Item) {
      return (res.Item as { value: unknown }).value;
    }
  } catch (error) {
    console.error(`[settingsStore] DynamoDB read failed for ${settingKey}`, error);
    throw error;
  }
  // まだテーブルに無い＝移行前。リポジトリ同梱の data/*.json を初期値として使う
  return readFileDoc(fileName);
}

export async function saveSettingDoc(
  settingKey: string,
  fileName: string,
  value: unknown
): Promise<void> {
  if (usingFile()) {
    await fs.mkdir(path.dirname(fileOf(fileName)), { recursive: true });
    await fs.writeFile(fileOf(fileName), `${JSON.stringify(value, null, 2)}\n`, "utf-8");
    return;
  }
  await getDocumentClient().send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { settingKey, value, updatedAt: new Date().toISOString() },
    })
  );
}
