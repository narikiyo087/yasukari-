import { randomBytes } from 'crypto';
import { kvDelete, kvGet, kvPut } from './registrationStore';

// メール認証コード。以前はインメモリ（new Map()）で、送った直後に再起動・デプロイが
// 入ると「コードが見つかりません」になっていた。lib/registrationStore.ts 経由で
// DynamoDB に保存し、期限は TTL で自動掃除する。

export const VERIFICATION_CODE_LENGTH = 6;
const CODE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24時間
const MAX_ATTEMPTS = 5;

const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

type VerificationRecord = {
  code: string;
  expiresAt: number;
  attempts: number;
};

const KEY = (email: string) => `code#${email}`;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateCode(length: number): string {
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i += 1) {
    const index = bytes[i] % CODE_CHARSET.length;
    result += CODE_CHARSET[index];
  }
  return result;
}

// TTL は「期限切れの案内を出すため」に期限より少し長く残す
const ttlOf = (expiresAt: number) => Math.floor(expiresAt / 1000) + 60 * 60;

export type IssuedVerificationCode = {
  email: string;
  code: string;
  expiresAt: number;
};

export async function issueVerificationCode(rawEmail: string): Promise<IssuedVerificationCode> {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    throw new Error('メールアドレスを指定してください');
  }
  const code = generateCode(VERIFICATION_CODE_LENGTH);
  const expiresAt = Date.now() + CODE_EXPIRATION_MS;
  const record: VerificationRecord = { code, expiresAt, attempts: 0 };
  await kvPut(KEY(email), record, ttlOf(expiresAt));
  return { email, code, expiresAt };
}

export type VerificationFailureReason = 'not_found' | 'expired' | 'mismatch' | 'too_many_attempts';

export type VerificationResult =
  | { success: true }
  | { success: false; reason: VerificationFailureReason; attemptsRemaining?: number };

export async function verifyVerificationCode(
  rawEmail: string,
  rawCode: string
): Promise<VerificationResult> {
  const email = normalizeEmail(rawEmail);
  const code = rawCode.trim();
  if (!email || !code) {
    return { success: false, reason: 'not_found' };
  }
  const record = await kvGet<VerificationRecord>(KEY(email));
  if (!record) {
    return { success: false, reason: 'not_found' };
  }
  if (Date.now() > record.expiresAt) {
    await kvDelete(KEY(email));
    return { success: false, reason: 'expired' };
  }
  if (record.code !== code) {
    const attempts = record.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await kvDelete(KEY(email));
      return { success: false, reason: 'too_many_attempts' };
    }
    await kvPut(KEY(email), { ...record, attempts }, ttlOf(record.expiresAt));
    return { success: false, reason: 'mismatch', attemptsRemaining: MAX_ATTEMPTS - attempts };
  }
  await kvDelete(KEY(email));
  return { success: true };
}

export async function hasPendingVerification(rawEmail: string): Promise<boolean> {
  const email = normalizeEmail(rawEmail);
  if (!email) return false;
  return Boolean(await kvGet(KEY(email)));
}

export async function getVerificationAttemptsRemaining(rawEmail: string): Promise<number | null> {
  const email = normalizeEmail(rawEmail);
  if (!email) return null;
  const record = await kvGet<VerificationRecord>(KEY(email));
  if (!record) return null;
  return Math.max(0, MAX_ATTEMPTS - record.attempts);
}

export async function getCodeExpiration(rawEmail: string): Promise<number | null> {
  const email = normalizeEmail(rawEmail);
  if (!email) return null;
  const record = await kvGet<VerificationRecord>(KEY(email));
  return record ? record.expiresAt : null;
}

export async function clearVerificationCode(rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail);
  if (!email) return;
  await kvDelete(KEY(email));
}
