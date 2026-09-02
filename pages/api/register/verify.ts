import type { NextApiRequest, NextApiResponse } from 'next';
import { createLightMember, findLightMemberByEmail, hasLightMemberByEmail } from '../../../lib/mockUserDb';
import type { LightMember } from '../../../lib/mockUserDb';
import { verifyVerificationCode } from '../../../lib/verificationCodeService';
import { clearPendingRegistration, getPendingRegistration } from '../../../lib/pendingRegistrations';
import { deliverProvisionalRegistrationEmail } from '../../../lib/registrationEmails';

const TEST_EMAIL = 'test@test.com';
const TEST_VERIFICATION_CODE = '0000';
const TEST_USERNAME = 'テスト';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email, code } = req.body || {};
  const sanitizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const sanitizedCode = typeof code === 'string' ? code.trim() : '';

  if (!sanitizedEmail || !sanitizedCode) {
    return res.status(400).json({ message: 'メールアドレスと認証コードを入力してください。' });
  }

  if (sanitizedEmail === TEST_EMAIL) {
    if (sanitizedCode !== TEST_VERIFICATION_CODE) {
      return res.status(400).json({ message: 'テストアカウントの認証コードが正しくありません。' });
    }

    const existingMember = await findLightMemberByEmail(sanitizedEmail);
    const member = existingMember ?? (await createLightMember({ email: sanitizedEmail, username: TEST_USERNAME }));

    res.setHeader('Set-Cookie', `auth=${member.id}; Path=/; HttpOnly; Max-Age=${60 * 60 * 24}; SameSite=Lax`);

    return res.status(200).json({
      message: 'テストアカウントでの認証に成功しました。',
      member: {
        id: member.id,
        email: member.email,
        username: member.username,
        plan: member.plan,
        createdAt: member.createdAt,
        phoneNumber: member.phoneNumber,
        registrationStatus: member.registrationStatus,
      },
    });
  }

  if (await hasLightMemberByEmail(sanitizedEmail)) {
    return res.status(200).json({ message: 'すでに本登録が完了しています。ログイン画面からアクセスしてください。' });
  }

  const result = await verifyVerificationCode(sanitizedEmail, sanitizedCode);

  if (!result.success) {
    if (!('reason' in result)) {
      return res.status(500).json({ message: '認証処理中にエラーが発生しました。' });
    }

    switch (result.reason) {
      case 'expired':
        return res
          .status(400)
          .json({ message: '認証コードの有効期限が切れています。お手数ですが、もう一度メールアドレスを入力してください。' });
      case 'too_many_attempts':
        return res.status(400).json({ message: '認証コードの入力上限に達しました。最初からやり直してください。' });
      case 'mismatch':
        return res.status(400).json({ message: '認証コードが正しくありません。入力内容をご確認ください。' });
      default:
        return res
          .status(404)
          .json({ message: '認証コードが見つかりませんでした。もう一度メールアドレスを入力してください。' });
    }
  }

  const pendingRegistration = await getPendingRegistration(sanitizedEmail);
  let member: LightMember;
  try {
    member = pendingRegistration
      ? await createLightMember({
          email: sanitizedEmail,
          username: pendingRegistration.fullName,
          passwordHash: pendingRegistration.passwordHash,
          phoneNumber: pendingRegistration.phoneNumber,
          registrationStatus: 'provisional',
        })
      : await createLightMember({ email: sanitizedEmail });
  } finally {
    await clearPendingRegistration(sanitizedEmail).catch(() => undefined);
  }
  res.setHeader('Set-Cookie', `auth=${member.id}; Path=/; HttpOnly; Max-Age=${60 * 60 * 24}; SameSite=Lax`);

  try {
    if (member.registrationStatus === 'provisional') {
      await deliverProvisionalRegistrationEmail(sanitizedEmail);
    }

    return res.status(200).json({
      message: pendingRegistration
        ? '仮登録が完了しました。続きの本登録はマイページから行えます。'
        : '本登録が完了しました。マイページからご利用を開始できます。',
      member: {
        id: member.id,
        email: member.email,
        username: member.username,
        plan: member.plan,
        createdAt: member.createdAt,
        phoneNumber: member.phoneNumber,
        registrationStatus: member.registrationStatus,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '登録に失敗しました。';
    return res.status(500).json({ message });
  }
}
