import crypto from 'crypto';

export type CognitoIdTokenPayload = {
  sub: string;
  email?: string;
  'custom:locale'?: string;
  'cognito:username'?: string;
  token_use?: string;
  aud?: string;
  iss?: string;
  exp?: number;
};

type JwksKey = {
  kid: string;
  kty: string;
  n: string;
  e: string;
};

type JwksResponse = {
  keys: JwksKey[];
};

const ID_TOKEN_COOKIE = 'cognito_id_token';
const ACCESS_TOKEN_COOKIE = 'cognito_access_token';

const region = process.env.COGNITO_REGION ?? process.env.NEXT_PUBLIC_COGNITO_REGION ?? 'ap-northeast-1';
const userPoolId = process.env.COGNITO_USER_POOL_ID ?? process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID ?? process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

let jwksCache: { keys: JwksKey[]; fetchedAt: number } | null = null;

const base64UrlToArrayBuffer = (value: string): ArrayBuffer => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const buffer = Buffer.from(padded, 'base64');
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

async function getJwks(): Promise<JwksKey[]> {
  if (jwksCache && Date.now() - jwksCache.fetchedAt < 60 * 60 * 1000) {
    return jwksCache.keys;
  }

  if (!userPoolId) {
    throw new Error('COGNITO_USER_POOL_ID is required.');
  }

  const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
  const response = await fetch(jwksUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch JWKS: ${response.status}`);
  }
  const data = (await response.json()) as JwksResponse;
  jwksCache = { keys: data.keys, fetchedAt: Date.now() };
  return data.keys;
}

async function getVerificationKey(kid: string): Promise<crypto.webcrypto.CryptoKey> {
  const keys = await getJwks();
  const jwk = keys.find((key) => key.kid === kid);
  if (!jwk) {
    throw new Error('Signing key not found');
  }

  return crypto.webcrypto.subtle.importKey(
    'jwk',
    { ...jwk, alg: 'RS256', use: 'sig' },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

export async function verifyCognitoIdToken(token: string | undefined | null): Promise<CognitoIdTokenPayload | null> {
  if (!token) {
    return null;
  }
  if (!clientId) {
    throw new Error('COGNITO_CLIENT_ID is required.');
  }
  if (!userPoolId) {
    throw new Error('COGNITO_USER_POOL_ID is required.');
  }

  const segments = token.split('.');
  if (segments.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = segments;
  const headerJson = Buffer.from(encodedHeader.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  const header = JSON.parse(headerJson) as { kid?: string; alg?: string };

  if (header.alg !== 'RS256' || !header.kid) {
    return null;
  }

  const key = await getVerificationKey(header.kid);
  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const signature = base64UrlToArrayBuffer(encodedSignature);

  const isValid = await crypto.webcrypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    signature,
    data
  );

  if (!isValid) {
    return null;
  }

  const payloadJson = Buffer.from(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  const payload = JSON.parse(payloadJson) as CognitoIdTokenPayload;

  if (payload.token_use !== 'id') {
    return null;
  }
  if (payload.aud !== clientId) {
    return null;
  }
  const expectedIssuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  if (payload.iss !== expectedIssuer) {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= now) {
    return null;
  }

  return payload;
}

export { ID_TOKEN_COOKIE as COGNITO_ID_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE as COGNITO_ACCESS_TOKEN_COOKIE };
