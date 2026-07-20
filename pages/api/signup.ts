import type { NextApiRequest, NextApiResponse } from 'next';
import { hasLightMemberByEmail } from '../../lib/mockUserDb';
import { issueVerificationCode } from '../../lib/verificationCodeService';
import { deliverVerificationEmail } from '../../lib/verificationEmail';
import { deliverExistingAccountNoticeEmail } from '../../lib/registrationEmails';
import { savePendingRegistration, clearPendingRegistration } from '../../lib/pendingRegistrations';

// 新規・既登録のどちらでも同一のレスポンスを返し、アカウント列挙（どのメールが
// 登録済みかを外部から総当たりで判別されること）を防ぐための共通メッセージ。
const NEUTRAL_SUBMISSION_MESSAGE =
  'ご入力いただいたメールアドレス宛にメールをお送りしました。メールの案内に従ってお手続きください。';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email, password, fullName, phoneNumber } = req.body || {};
  const sanitizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const rawPassword = typeof password === 'string' ? password : '';
  const trimmedFullName = typeof fullName === 'string' ? fullName.trim() : '';
  const rawPhoneNumber = typeof phoneNumber === 'string' ? phoneNumber : '';
  const normalizedPhoneNumber = rawPhoneNumber.replace(/[^0-9]/g, '');

  if (!sanitizedEmail) {
    return res.status(400).json({ message: 'メールアドレスを入力してください。' });
  }

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail);
  if (!isEmailValid) {
    return res.status(400).json({ message: '有効なメールアドレスを入力してください。' });
  }

  if (!trimmedFullName) {
    return res.status(400).json({ message: 'お名前を入力してください。' });
  }

  if (rawPassword.length < 6) {
    return res.status(400).json({ message: 'パスワードは6文字以上で入力してください。' });
  }

  if (!normalizedPhoneNumber) {
    return res.status(400).json({ message: '電話番号を入力してください。' });
  }

  if (normalizedPhoneNumber.length < 10 || normalizedPhoneNumber.length > 15) {
    return res.status(400).json({ message: '電話番号は10桁以上15桁以下の数字で入力してください。' });
  }

  const forwardedProto = req.headers['x-forwarded-proto'];
  const protoHeader = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const hostHeader = Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host;

  const fallbackBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yasukari.com';
  const protocol = protoHeader ?? (hostHeader?.includes('localhost') ? 'http' : 'https');
  const baseUrl = hostHeader ? `${protocol}://${hostHeader}` : fallbackBaseUrl;

  // 既に登録済みのメールアドレスの場合は、新規登録と見分けがつかない中立レスポンスを
  // 返しつつ、「すでに登録済み」の案内メールを送る（認証コードは発行しない）。
  // 画面上では既登録かどうかを開示しないことで、アカウント列挙を防止する。
  if (hasLightMemberByEmail(sanitizedEmail)) {
    try {
      await deliverExistingAccountNoticeEmail(sanitizedEmail, {
        loginUrl: `${baseUrl}/login`,
      });
    } catch (error) {
      // 案内メールの送信失敗はユーザーに開示しない（列挙対策のため成功と同じ応答を返す）。
      console.error('Failed to send existing-account notice email', error);
    }
    return res.status(200).json({ message: NEUTRAL_SUBMISSION_MESSAGE });
  }

  try {
    savePendingRegistration({
      email: sanitizedEmail,
      password: rawPassword,
      fullName: trimmedFullName,
      phoneNumber: normalizedPhoneNumber,
    });

    const { code, expiresAt } = issueVerificationCode(sanitizedEmail);

    const verificationUrl = `${baseUrl}/register/auth?email=${encodeURIComponent(sanitizedEmail)}`;

    await deliverVerificationEmail({
      email: sanitizedEmail,
      code,
      verificationUrl,
      expiresAt,
    });

    return res.status(200).json({
      message: NEUTRAL_SUBMISSION_MESSAGE,
      expiresAt,
    });
  } catch (error) {
    clearPendingRegistration(sanitizedEmail);
    const message = error instanceof Error ? error.message : '登録に失敗しました';
    return res.status(500).json({ message });
  }
}
