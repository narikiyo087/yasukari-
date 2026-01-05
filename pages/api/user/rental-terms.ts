import type { NextApiRequest, NextApiResponse } from 'next';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { COGNITO_ID_TOKEN_COOKIE, verifyCognitoIdToken } from '../../../lib/cognitoServer';
import { getDocumentClient } from '../../../lib/dynamodb';

const TABLE_NAME = 'yasukariUserMain';

type RentalTermsResponse = {
  agreed: boolean;
  agreedAt: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies?.[COGNITO_ID_TOKEN_COOKIE];
    const payload = await verifyCognitoIdToken(token);

    if (!payload?.sub) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const client = getDocumentClient();
    const userId = payload.sub;

    if (req.method === 'GET') {
      const { Item } = await client.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { user_id: userId },
          ProjectionExpression: 'rental_terms_agreed_at',
        })
      );

      if (!Item) {
        return res.status(404).json({ message: 'ユーザーデータが見つかりません。', agreed: false, agreedAt: null });
      }

      const agreedAt = typeof Item.rental_terms_agreed_at === 'string' ? Item.rental_terms_agreed_at : null;

      const response: RentalTermsResponse = {
        agreed: Boolean(agreedAt),
        agreedAt,
      };

      return res.status(200).json(response);
    }

    if (req.method === 'POST') {
      const agreed = req.body?.agreed;
      if (typeof agreed !== 'boolean') {
        return res.status(400).json({ message: 'agreed must be a boolean value.' });
      }

      const agreedAt = agreed ? new Date().toISOString() : null;

      try {
        if (agreedAt) {
          await client.send(
            new UpdateCommand({
              TableName: TABLE_NAME,
              Key: { user_id: userId },
              UpdateExpression: 'SET rental_terms_agreed_at = :agreedAt',
              ConditionExpression: 'attribute_exists(user_id)',
              ExpressionAttributeValues: {
                ':agreedAt': agreedAt,
              },
            })
          );
        } else {
          await client.send(
            new UpdateCommand({
              TableName: TABLE_NAME,
              Key: { user_id: userId },
              UpdateExpression: 'REMOVE rental_terms_agreed_at',
              ConditionExpression: 'attribute_exists(user_id)',
            })
          );
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
          return res.status(404).json({ message: 'ユーザーデータが見つかりません。' });
        }
        throw error;
      }

      return res.status(200).json({ agreed, agreedAt, message: 'レンタルバイク利用規約への同意を更新しました。' });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Failed to handle rental terms request', error);
    const message = error instanceof Error ? error.message : '利用規約同意状況の更新に失敗しました。';
    return res.status(500).json({ message });
  }
}
