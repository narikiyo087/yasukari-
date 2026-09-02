import {
  clearVerificationCode,
  getCodeExpiration,
  getVerificationAttemptsRemaining,
  hasPendingVerification,
  issueVerificationCode,
  verifyVerificationCode,
  type VerificationResult,
} from '../lib/verificationCodeService';
import { kvMemoryClear } from '../lib/registrationStore';

const TEST_EMAIL = 'test@example.com';

type VerificationFailure = Extract<VerificationResult, { success: false }>;

// strict: false のため判別可能ユニオンの絞り込みが効かず、失敗ケースはキャストで扱う
const expectFailure = (result: VerificationResult): VerificationFailure => {
  expect(result.success).toBe(false);
  return result as VerificationFailure;
};

describe('verificationCodeService', () => {
  afterEach(async () => {
    await clearVerificationCode(TEST_EMAIL);
  });

  afterAll(() => {
    kvMemoryClear();
  });

  it('issues and verifies a code successfully', async () => {
    const { code } = await issueVerificationCode(TEST_EMAIL);

    expect(await hasPendingVerification(TEST_EMAIL)).toBe(true);
    const expiration = await getCodeExpiration(TEST_EMAIL);
    expect(expiration).not.toBeNull();

    const result = await verifyVerificationCode(TEST_EMAIL, code);
    expect(result.success).toBe(true);
    expect(await hasPendingVerification(TEST_EMAIL)).toBe(false);
  });

  it('rejects mismatched codes and tracks attempts', async () => {
    await issueVerificationCode(TEST_EMAIL);

    const mismatch = expectFailure(await verifyVerificationCode(TEST_EMAIL, 'wrong1'));
    expect(mismatch.reason).toBe('mismatch');
    expect(mismatch.attemptsRemaining).toBe(4);

    await verifyVerificationCode(TEST_EMAIL, 'wrong2');
    await verifyVerificationCode(TEST_EMAIL, 'wrong3');
    await verifyVerificationCode(TEST_EMAIL, 'wrong4');
    const locked = expectFailure(await verifyVerificationCode(TEST_EMAIL, 'wrong5'));
    expect(locked.reason).toBe('too_many_attempts');
    expect(await hasPendingVerification(TEST_EMAIL)).toBe(false);
  });

  it('expires the code when time passes', async () => {
    const { code, expiresAt } = await issueVerificationCode(TEST_EMAIL);
    expect(code).toHaveLength(6);

    const expiration = await getCodeExpiration(TEST_EMAIL);
    expect(expiration).toBe(expiresAt);

    const now = Date.now;
    Date.now = () => expiresAt + 1;
    try {
      const result = expectFailure(await verifyVerificationCode(TEST_EMAIL, code));
      expect(result.reason).toBe('expired');
    } finally {
      Date.now = now;
    }
  });

  it('handles unknown emails', async () => {
    const result = expectFailure(await verifyVerificationCode('unknown@example.com', 'ABC123'));
    expect(result.reason).toBe('not_found');
  });

  it('reports attempts remaining', async () => {
    await issueVerificationCode(TEST_EMAIL);
    expect(await getVerificationAttemptsRemaining(TEST_EMAIL)).toBe(5);
    await verifyVerificationCode(TEST_EMAIL, 'wrong1');
    expect(await getVerificationAttemptsRemaining(TEST_EMAIL)).toBe(4);
  });
});
