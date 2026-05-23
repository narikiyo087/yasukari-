import type { NextApiRequest, NextApiResponse } from 'next';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getDocumentClient } from '../../../lib/dynamodb';
import { COGNITO_ID_TOKEN_COOKIE, verifyCognitoIdToken } from '../../../lib/cognitoServer';
import { RegistrationData, REQUIRED_REGISTRATION_FIELDS } from '../../../types/registration';
import { deliverFullRegistrationEmail } from '../../../lib/registrationEmails';

const TABLE_NAME = 'yasukariUserMain';

// ...（型定義やユーティリティは従来通り）
const toTrimmedString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const normalizePhone = (value: unknown): string => toTrimmedString(value).replace(/\D/g, '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const authToken = req.cookies?.[COGNITO_ID_TOKEN_COOKIE];
    const authPayload = await verifyCognitoIdToken(authToken);
    const body = req.body ?? {};

    const userIdFromBody = toTrimmedString(body.user_id);
    const userId = authPayload?.sub ?? userIdFromBody;

    if (authPayload && userIdFromBody && authPayload.sub !== userIdFromBody) {
      return res.status(400).json({ message: 'ユーザーIDが一致しません。' });
    }

    if (!userId) {
      return res.status(400).json({ message: 'ユーザーIDが取得できませんでした。' });
    }

    const payload: RegistrationData = {
      user_id: userId,
      email: toTrimmedString(body.email || authPayload?.email).toLowerCase(),
      name1: toTrimmedString(body.name1),
      name2: toTrimmedString(body.name2),
      kana1: toTrimmedString(body.kana1),
      kana2: toTrimmedString(body.kana2),
      sex: toTrimmedString(body.sex),
      birth: toTrimmedString(body.birth),
      zip: toTrimmedString(body.zip),
      address1: toTrimmedString(body.address1),
      address2: toTrimmedString(body.address2),
      mobile: normalizePhone(body.mobile) || undefined,
      tel: normalizePhone(body.tel) || undefined,
      license: toTrimmedString(body.license),
      license_file_name: toTrimmedString(body.license_file_name),
      license_image_url: toTrimmedString(body.license_image_url),
      license_uploaded_at: toTrimmedString(body.license_uploaded_at),
      license_file_name_2: toTrimmedString(body.license_file_name_2),
      license_image_url_2: toTrimmedString(body.license_image_url_2),
      license_uploaded_at_2: toTrimmedString(body.license_uploaded_at_2),
      work_place: toTrimmedString(body.work_place),
      work_address: toTrimmedString(body.work_address),
      work_tel: normalizePhone(body.work_tel) || undefined,
      other_name: toTrimmedString(body.other_name),
      other_address: toTrimmedString(body.other_address),
      other_tel: normalizePhone(body.other_tel) || undefined,
      enquete_purpose: toTrimmedString(body.enquete_purpose),
      enquete_want: toTrimmedString(body.enquete_want),
      enquete_touring: toTrimmedString(body.enquete_touring),
      enquete_magazine: toTrimmedString(body.enquete_magazine),
      enquete_chance: toTrimmedString(body.enquete_chance),
    };

    const missing = REQUIRED_REGISTRATION_FIELDS.filter((field) => !payload[field]);

    if (missing.length > 0) {
      return res.status(400).json({ message: `${missing.join(', ')} is required.` });
    }

    const client = getDocumentClient();

    const existingUser = await client.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { user_id: userId },
      })
    );
    const existingItem = existingUser.Item ?? {};

    await client.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...existingItem,
          ...payload,
          created_at: existingItem.created_at ?? new Date().toISOString(),
          rental_terms_agreed_at: existingItem.rental_terms_agreed_at,
        },
      })
    );

    await deliverFullRegistrationEmail(payload.email, authPayload?.['custom:locale']);

    return res.status(200).json({ message: 'ユーザー情報を保存しした。' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存に失敗しました。';
    return res.status(500).json({ message });
  }
}
