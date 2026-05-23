import { EMAIL_FOOTER_TEXT_LINES } from './emailFooter';
import { enqueueEmail } from './mailQueue';

const DEFAULT_SOURCE_EMAIL = '格安レンタルバイクならヤスカリ <info@yasukaribike.com>';

const isEnglishLocale = (locale?: string): boolean => (locale ?? '').trim().toLowerCase().startsWith('en');

function buildBaseEmail(subject: string, bodyLines: string[]) {
  const text = bodyLines.join('\n');
  const html =
    `<!DOCTYPE html><html lang="ja"><body style="font-family:Arial, sans-serif; color:#111;">` +
    bodyLines.map((line) => `<p>${line.replace(/\n/g, '<br />')}</p>`).join('') +
    `</body></html>`;

  return { subject, text, html };
}

export async function deliverProvisionalRegistrationEmail(email: string) {
  const fromAddress = process.env.MAIL_FROM ?? DEFAULT_SOURCE_EMAIL;
  const { subject, text, html } = buildBaseEmail('【ヤスカリ】仮登録が完了しました', [
    'ヤスカリへの仮登録が完了しました。',
    'マイページにログインし、必要情報を入力して本登録を完了してください。',
    '',
    '※本メールはお客様にご入力いただいたメールアドレスあてに発信しているため、',
    '入力ミスなどの理由によりまったく別の方にメールが届く可能性があります。',
    'もし本メールにお心当たりが無い場合は、',
    'お手数ですが、破棄していただけますようお願いします。',
    '',
    '※お問い合わせは、本メールにご返信ください。',
    '大変恐れ入りますが、お電話でのお問い合わせはお受けしておりません。',
    '',
    ...EMAIL_FOOTER_TEXT_LINES,
  ]);

  await enqueueEmail({
    to: email,
    subject,
    text,
    html,
    replyTo: fromAddress,
    category: '仮登録',
    userIdForNotification: email,
    notificationBody: text,
    mirrorToSite: true,
  });

  return { simulated: false } as const;
}

export async function deliverFullRegistrationEmail(email: string, locale?: string) {
  const fromAddress = process.env.MAIL_FROM ?? DEFAULT_SOURCE_EMAIL;
  const useEnglish = isEnglishLocale(locale);
  const { subject, text, html } = buildBaseEmail(
    useEnglish ? '[Yasukari] Full registration completed' : '【ヤスカリ】本登録が完了しました',
    useEnglish
      ? [
          'Your full registration with Yasukari has been completed.',
          'Your details have been saved and your account is ready to use.',
          'Thank you for choosing us.',
          '',
          'This email was sent to the address entered by the customer.',
          'If the address was entered incorrectly, this message may have reached the wrong person.',
          'If this email does not apply to you, please discard it.',
          '',
          'For support, please reply to this email.',
          'We are unable to provide support by phone for this inquiry.',
          '',
          ...EMAIL_FOOTER_TEXT_LINES,
        ]
      : [
          'ヤスカリの本登録が完了しました。',
          '入力いただいた内容を保存し、ご利用の準備が整いました。',
          '今後ともよろしくお願いいたします。',
          '',
          '※本メールはお客様にご入力いただいたメールアドレスあてに発信しているため、',
          '入力ミスなどの理由によりまったく別の方にメールが届く可能性があります。',
          'もし本メールにお心当たりが無い場合は、',
          'お手数ですが、破棄していただけますようお願いします。',
          '',
          '※お問い合わせは、本メールにご返信ください。',
          '大変恐れ入りますが、お電話でのお問い合わせはお受けしておりません。',
          '',
          ...EMAIL_FOOTER_TEXT_LINES,
        ]
  );

  await enqueueEmail({
    to: email,
    cc: 'info@yasukari.com',
    subject,
    text,
    html,
    replyTo: fromAddress,
    category: '本登録',
    userIdForNotification: email,
    notificationBody: text,
    mirrorToSite: true,
  });

  return { simulated: false } as const;
}
