import type { NextApiRequest, NextApiResponse } from 'next';

import { COGNITO_ID_TOKEN_COOKIE, verifyCognitoIdToken } from '../../../lib/cognitoServer';
import { EMAIL_FOOTER_TEXT_LINES } from '../../../lib/emailFooter';
import { addMailHistory } from '../../../lib/mailHistory';
import { enqueueEmail } from '../../../lib/mailQueue';
import { fetchUserNotifications, recordUserNotification } from '../../../lib/userNotifications';

const AUTH_REQUIRED_MESSAGE = '通知を受け取るには、ログインを完了してください。';

const formatJst = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  let userId: string | null = null;
  let userEmail: string | null = null;
  try {
    const token = req.cookies?.[COGNITO_ID_TOKEN_COOKIE];
    const payload = await verifyCognitoIdToken(token);
    userId = payload?.sub ?? null;
    userEmail = payload?.email ?? null;
  } catch (error) {
    console.error('Failed to verify authentication for overdue return notification', error);
    return res.status(503).json({
      message: '通知機能の認証に失敗しました。時間をおいて再度お試しください。',
    });
  }

  if (!userId) {
    return res.status(401).json({ message: AUTH_REQUIRED_MESSAGE });
  }

  const { reservationId, returnAt, vehicleModel } = (req.body ?? {}) as {
    reservationId?: unknown;
    returnAt?: unknown;
    vehicleModel?: unknown;
  };

  if (!reservationId || typeof reservationId !== 'string') {
    return res.status(400).json({ message: 'reservationId is required' });
  }

  const returnAtString = typeof returnAt === 'string' ? returnAt : '';
  const vehicleModelLabel = typeof vehicleModel === 'string' && vehicleModel.trim() ? vehicleModel : 'バイク';

  try {
    const existing = await fetchUserNotifications(userId, 20);
    const alreadyExists = existing.some(
      (notice) => notice.category === '返却期限' && notice.body?.includes(reservationId)
    );
    if (alreadyExists) {
      return res.status(200).json({ message: 'already recorded' });
    }

    const formattedReturnAt = returnAtString ? formatJst(returnAtString) : '';
    const subject = '【返却期限のご案内】返却期限を過ぎています';
    const bodyLines = [
      `${vehicleModelLabel}の返却期限を過ぎています。`,
      formattedReturnAt ? `返却期限：${formattedReturnAt}` : '返却期限をご確認ください。',
      '返却についてはサポートまでお問い合わせください。',
      '延長をご希望の場合はマイページから手続きをお願いします。',
      `予約ID：${reservationId}`,
    ];

    await recordUserNotification({
      userId,
      subject,
      body: bodyLines.join('\n'),
      category: '返却期限',
      channels: ['site'],
      recipientEmail: userEmail ?? undefined,
    });

    let emailStatus: 'sent' | 'skipped' | 'not_available' = 'not_available';
    if (userEmail) {
      const emailBody = [...bodyLines, '', ...EMAIL_FOOTER_TEXT_LINES].join('\n');
      const hasSmtpConfig = Boolean(
        process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
      );

      if (hasSmtpConfig) {
        try {
          await enqueueEmail({
            to: userEmail,
            subject,
            text: emailBody,
            category: '返却期限超過',
            userIdForNotification: userId,
            notificationBody: emailBody,
            mirrorToSite: false,
          });
          emailStatus = 'sent';
        } catch (emailError) {
          console.error('Failed to send overdue return email', emailError);
          emailStatus = 'skipped';
        }
      } else {
        emailStatus = 'skipped';
        try {
          await addMailHistory({
            to: userEmail,
            subject,
            status: 'skipped',
            category: '返却期限超過',
            errorMessage: 'SMTP設定不足のため送信できませんでした。',
          });
        } catch (historyError) {
          console.error('Failed to record skipped overdue mail history', historyError);
        }
      }
    }

    return res.status(200).json({ message: 'recorded', emailStatus });
  } catch (error) {
    console.error('Failed to record overdue return notification', error);
    return res.status(500).json({ message: '返却期限の通知保存に失敗しました。' });
  }
}
