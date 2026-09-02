import { createHash, randomUUID } from 'crypto';
import { kvDelete, kvGet, kvPut, kvScanPrefix } from './registrationStore';

// ライト会員（メール登録だけの仮会員）の保存。
// 以前はファイル名のとおり「モック」で、new Map() に保持していたため
// サーバー再起動で全会員が消えていた。現在は lib/registrationStore.ts 経由で
// DynamoDB（REGISTRATION_TABLE）に保存する。環境変数が無いローカルでは
// 従来どおりインメモリで動く（テスト用）。
// ※ かつてあった既定アカウント（adminuser / adminuser）は、既知のID・パスワードが
//   本番に入り込む穴になるため廃止した。

export type RegistrationStatus = 'provisional' | 'full';

export type LightMember = {
  id: string;
  username?: string;
  email?: string;
  passwordHash?: string;
  createdAt: string;
  plan: 'ライトプラン';
  phoneNumber?: string;
  registrationStatus: RegistrationStatus;
};

type CreateLightMemberParams = {
  username?: string;
  password?: string;
  /** すでにハッシュ済みのパスワード（仮登録フォームから引き継ぐ場合）。password より優先 */
  passwordHash?: string;
  email?: string;
  phoneNumber?: string;
  registrationStatus?: RegistrationStatus;
};

const ID_KEY = (id: string) => `member#id#${id}`;
const EMAIL_KEY = (email: string) => `member#email#${email}`;
const NAME_KEY = (username: string) => `member#name#${username}`;

export function hashLightMemberPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function storeMember(member: LightMember): Promise<void> {
  // 引きたいキー（ID・メール・ユーザー名）ごとに同じ内容を置く。
  // 1テーブル・キー1本の構成でGSIを増やさないための割り切り。
  const writes: Promise<void>[] = [kvPut(ID_KEY(member.id), member)];
  if (member.username) writes.push(kvPut(NAME_KEY(member.username), member));
  if (member.email) writes.push(kvPut(EMAIL_KEY(member.email.toLowerCase()), member));
  await Promise.all(writes);
}

export async function createLightMember(params: CreateLightMemberParams): Promise<LightMember> {
  const username = params.username?.trim();
  const password = params.password ?? '';
  const email = params.email?.trim().toLowerCase();
  const rawPhoneNumber = params.phoneNumber ?? '';
  const registrationStatus: RegistrationStatus = params.registrationStatus ?? 'provisional';

  const normalizedPhoneNumber = rawPhoneNumber.replace(/[^0-9]/g, '');

  const passwordHash = params.passwordHash ?? (password ? hashLightMemberPassword(password) : undefined);
  const hasEmail = Boolean(email);
  const hasCredentials = Boolean(username && passwordHash);

  if (!hasEmail && !hasCredentials) {
    throw new Error('メールアドレスを入力してください');
  }

  if (
    normalizedPhoneNumber &&
    (normalizedPhoneNumber.length < 10 || normalizedPhoneNumber.length > 15)
  ) {
    throw new Error('電話番号は10桁以上15桁以下の数字で入力してください');
  }

  // 生パスワードが渡されたときだけ長さを確認できる（ハッシュ済みは検証済みとして扱う）
  if (username && password && !params.passwordHash && password.length < 6) {
    throw new Error('パスワードは6文字以上にしてください');
  }

  if (username && (await kvGet(NAME_KEY(username)))) {
    throw new Error('同じユーザー名が既に登録されています');
  }

  if (email) {
    if (!isValidEmail(email)) {
      throw new Error('有効なメールアドレスを入力してください');
    }
    if (await kvGet(EMAIL_KEY(email))) {
      throw new Error('同じメールアドレスが既に登録されています');
    }
  }

  const member: LightMember = {
    id: randomUUID(),
    username: username || undefined,
    email: email || undefined,
    passwordHash,
    createdAt: new Date().toISOString(),
    plan: 'ライトプラン',
    phoneNumber: normalizedPhoneNumber || undefined,
    registrationStatus,
  };

  await storeMember(member);
  return member;
}

export async function hasLightMemberByEmail(email: string): Promise<boolean> {
  if (!email) return false;
  return Boolean(await kvGet(EMAIL_KEY(email.trim().toLowerCase())));
}

export async function findLightMemberByEmail(email: string): Promise<LightMember | null> {
  if (!email) return null;
  return (await kvGet<LightMember>(EMAIL_KEY(email.trim().toLowerCase()))) ?? null;
}

export async function findLightMemberById(id: string): Promise<LightMember | null> {
  if (!id) return null;
  return (await kvGet<LightMember>(ID_KEY(id.trim()))) ?? null;
}

export async function verifyLightMember(
  identifier: string,
  password: string
): Promise<LightMember | null> {
  const sanitizedIdentifier = identifier.trim();
  if (!sanitizedIdentifier) return null;

  const byUsername = await kvGet<LightMember>(NAME_KEY(sanitizedIdentifier));
  if (byUsername) {
    if (!byUsername.passwordHash) return byUsername;
    return byUsername.passwordHash === hashLightMemberPassword(password) ? byUsername : null;
  }

  const byEmail = await kvGet<LightMember>(EMAIL_KEY(sanitizedIdentifier.toLowerCase()));
  if (byEmail) {
    if (!byEmail.passwordHash) return byEmail;
    if (!password) return null;
    return byEmail.passwordHash === hashLightMemberPassword(password) ? byEmail : null;
  }

  return null;
}

export async function listLightMembers(): Promise<LightMember[]> {
  return kvScanPrefix<LightMember>('member#id#');
}

/** テスト用：メールで引けるライト会員を消す（ID・ユーザー名のキーも一緒に消す） */
export async function deleteLightMemberByEmail(email: string): Promise<void> {
  const member = await findLightMemberByEmail(email);
  if (!member) return;
  await Promise.all([
    kvDelete(ID_KEY(member.id)),
    kvDelete(EMAIL_KEY(email.trim().toLowerCase())),
    ...(member.username ? [kvDelete(NAME_KEY(member.username))] : []),
  ]);
}
