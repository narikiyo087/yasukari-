import type { NextApiRequest, NextApiResponse } from 'next';
import { getClients } from '../../lib/rateLimit';
import { getBikeDataSourceStatus } from '../../lib/bikes';

// 稼働確認用。車両データの取得元（DynamoDB か 静的フォールバックか）もここで見える。
// lastModelsSource が "static-fallback" のままなら、テーブル未設定・権限切れを疑うこと。
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    rateLimitClients: getClients(),
    bikeData: getBikeDataSourceStatus(),
  });
}
