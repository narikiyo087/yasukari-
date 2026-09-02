import { hashLightMemberPassword } from './mockUserDb';
import { kvDelete, kvGet, kvPut } from './registrationStore';

// 仮登録フォームの入力（認証コードの確認が済むまでの控え）。
// 以前はインメモリ＋生パスワード保持だった。現在は lib/registrationStore.ts 経由で
// DynamoDB に保存し、パスワードはハッシュにしてから置く（生のまま保存しない）。
// 期限は TTL で自動掃除する（認証コードの24時間＋余白）。

export type PendingRegistration = {
  email: string;
  passwordHash: string;
  fullName: string;
  phoneNumber: string;
  createdAt: number;
};

const KEY = (email: string) => `pending#${email}`;
const TTL_SECONDS = 25 * 60 * 60; // 認証コード24時間＋1時間の余白

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function savePendingRegistration({
  email,
  password,
  fullName,
  phoneNumber,
}: {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}): Promise<PendingRegistration> {
  const normalizedEmail = normalizeEmail(email);
  const record: PendingRegistration = {
    email: normalizedEmail,
    passwordHash: hashLightMemberPassword(password),
    fullName: fullName.trim(),
    phoneNumber: phoneNumber.trim(),
    createdAt: Date.now(),
  };
  await kvPut(KEY(normalizedEmail), record, Math.floor(Date.now() / 1000) + TTL_SECONDS);
  return record;
}

export async function getPendingRegistration(email: string): Promise<PendingRegistration | null> {
  const normalizedEmail = normalizeEmail(email);
  return (await kvGet<PendingRegistration>(KEY(normalizedEmail))) ?? null;
}

export async function clearPendingRegistration(email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  await kvDelete(KEY(normalizedEmail));
}
