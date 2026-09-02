import { DeleteCommand, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { getDocumentClient } from './dynamodb';

// 会員仮登録まわり（ライト会員・認証コード・仮登録フォーム）の保存先。
//
// これまで各サービスが `new Map()` で持っていたため、サーバー再起動やデプロイで
// 登録済み会員・送信済み認証コードがすべて消えていた（利用開始前チェック 区分A-1/A-2）。
// ここを唯一の保存窓口にし、DynamoDB の1テーブル（キー: pk）へ保存する。
//
// テーブル：環境変数 REGISTRATION_TABLE で指定。
//   - パーティションキー: pk（文字列）
//   - TTL属性: ttl（epoch秒）… 認証コード・仮登録フォームの自動掃除に使う
// 環境変数が無い場合（ローカル開発・テスト）は従来どおりインメモリで動き、
// 起動時に警告を出す。本番で未設定のまま動かさないこと。

const TABLE_NAME = process.env.REGISTRATION_TABLE || '';

type MemoryItem = { data: Record<string, unknown>; ttl?: number };
const memory = new Map<string, MemoryItem>();

let warned = false;
function usingMemory(): boolean {
  if (TABLE_NAME) {
    return false;
  }
  if (!warned) {
    warned = true;
    console.warn(
      '[registrationStore] REGISTRATION_TABLE が未設定のためインメモリ保存で動作しています。' +
        '再起動で会員登録・認証コードが消えるため、本番では必ず DynamoDB テーブルを設定してください。'
    );
  }
  return true;
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

export function registrationStoreBackend(): 'dynamodb' | 'memory' {
  return TABLE_NAME ? 'dynamodb' : 'memory';
}

export async function kvGet<T extends Record<string, unknown>>(pk: string): Promise<T | null> {
  if (usingMemory()) {
    const item = memory.get(pk);
    if (!item) return null;
    if (item.ttl && item.ttl < nowSec()) {
      memory.delete(pk);
      return null;
    }
    return { ...(item.data as T) };
  }
  const res = await getDocumentClient().send(
    new GetCommand({ TableName: TABLE_NAME, Key: { pk } })
  );
  const item = res.Item as ({ pk: string; ttl?: number; data?: T } & T) | undefined;
  if (!item) return null;
  // DynamoDB の TTL 削除は遅延するので、期限切れは読み出し側でも弾く
  if (typeof item.ttl === 'number' && item.ttl < nowSec()) return null;
  const { pk: _pk, ttl: _ttl, ...data } = item;
  return data as unknown as T;
}

export async function kvPut(
  pk: string,
  data: Record<string, unknown>,
  ttlEpochSeconds?: number
): Promise<void> {
  if (usingMemory()) {
    memory.set(pk, { data: { ...data }, ttl: ttlEpochSeconds });
    return;
  }
  const item: Record<string, unknown> = { pk, ...data };
  if (ttlEpochSeconds) item.ttl = ttlEpochSeconds;
  await getDocumentClient().send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
}

export async function kvDelete(pk: string): Promise<void> {
  if (usingMemory()) {
    memory.delete(pk);
    return;
  }
  await getDocumentClient().send(new DeleteCommand({ TableName: TABLE_NAME, Key: { pk } }));
}

/** pk が prefix で始まる項目を全部返す（会員一覧など、件数が少ない管理用途のみ） */
export async function kvScanPrefix<T extends Record<string, unknown>>(prefix: string): Promise<T[]> {
  if (usingMemory()) {
    const out: T[] = [];
    for (const [pk, item] of memory) {
      if (!pk.startsWith(prefix)) continue;
      if (item.ttl && item.ttl < nowSec()) continue;
      out.push({ ...(item.data as T) });
    }
    return out;
  }
  const out: T[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const res = await getDocumentClient().send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'begins_with(pk, :p)',
        ExpressionAttributeValues: { ':p': prefix },
        ExclusiveStartKey: startKey,
      })
    );
    for (const raw of res.Items ?? []) {
      const { pk: _pk, ttl, ...data } = raw as { pk: string; ttl?: number };
      if (typeof ttl === 'number' && ttl < nowSec()) continue;
      out.push(data as unknown as T);
    }
    startKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (startKey);
  return out;
}

/** テスト用：インメモリ保存を空にする（DynamoDB には触らない） */
export function kvMemoryClear(): void {
  memory.clear();
}
