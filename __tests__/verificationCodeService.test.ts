import {
  clearVerificationCodes,
  getCodeExpiration,
  getVerificationAttemptsRemaining,
  hasPendingVerification,
  issueVerificationCode,
  verifyVerificationCode,
  type VerificationResult,
} from '../lib/verificationCodeService';

const TEST_EMAIL = 'test@example.com';

type VerificationFailure = Extract<VerificationResult, { success: false }>;

// strict: false のため判別可能ユニオンの絞り込みが効かず、失敗ケースはキャストで扱う
const expectFailure = (result: VerificationResult): VerificationFailure => {
  expect(result.success).toBe(false);
  return result as VerificationFailure;
};

describe('verificationCodeService', () => {
  afterEach(() => {
    clearVerificationCodes();
  });

  it('issues and verifies a code successfully', () => {
    const { code } = issueVerificationCode(TEST_EMAIL);

    expect(hasPendingVerification(TEST_EMAIL)).toBe(true);
    const expiration = getCodeExpiration(TEST_EMAIL);
    expect(expiration).not.toBeNull();

    const result = verifyVerificationCode(TEST_EMAIL, code);
    expect(result.success).toBe(true);
    expect(hasPendingVerification(TEST_EMAIL)).toBe(false);
  });

  it('rejects mismatched codes and tracks attempts', () => {
    issueVerificationCode(TEST_EMAIL);

    const mismatch = expectFailure(verifyVerificationCode(TEST_EMAIL, 'wrong1'));
    expect(mismatch.reason).toBe('mismatch');
    expect(mismatch.attemptsRemaining).toBe(4);

    verifyVerificationCode(TEST_EMAIL, 'wrong2');
    verifyVerificationCode(TEST_EMAIL, 'wrong3');
    verifyVerificationCode(TEST_EMAIL, 'wrong4');
    const locked = expectFailure(verifyVerificationCode(TEST_EMAIL, 'wrong5'));
    expect(locked.reason).toBe('too_many_attempts');
    expect(hasPendingVerification(TEST_EMAIL)).toBe(false);
  });

  it('expires the code when time passes', () => {
    const { code, expiresAt } = issueVerificationCode(TEST_EMAIL);
    expect(code).toHaveLength(6);

    const expiration = getCodeExpiration(TEST_EMAIL);
    expect(expiration).toBe(expiresAt);

    const now = Date.now;
    Date.now = () => expiresAt + 1;
    try {
      const result = expectFailure(verifyVerificationCode(TEST_EMAIL, code));
      expect(result.reason).toBe('expired');
    } finally {
      Date.now = now;
    }
  });

  it('handles unknown emails', () => {
    const result = expectFailure(verifyVerificationCode('unknown@example.com', 'ABC123'));
    expect(result.reason).toBe('not_found');
  });

  it('reports attempts remaining', () => {
    issueVerificationCode(TEST_EMAIL);
    expect(getVerificationAttemptsRemaining(TEST_EMAIL)).toBe(5);
    verifyVerificationCode(TEST_EMAIL, 'wrong1');
    expect(getVerificationAttemptsRemaining(TEST_EMAIL)).toBe(4);
  });
});
