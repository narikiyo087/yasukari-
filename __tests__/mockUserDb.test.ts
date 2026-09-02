import { createLightMember, verifyLightMember, listLightMembers } from '../lib/mockUserDb';
import { kvMemoryClear } from '../lib/registrationStore';

// REGISTRATION_TABLE 未設定のテスト環境ではインメモリ保存で動く（lib/registrationStore.ts）

describe('mockUserDb', () => {
  afterAll(() => {
    kvMemoryClear();
  });

  it('registers a new light member and allows login', async () => {
    const username = `user_${Date.now()}`;
    const password = 'secret123';

    const member = await createLightMember({ username, password });
    expect(member.username).toBe(username);
    expect(member.plan).toBe('ライトプラン');
    expect(member.registrationStatus).toBe('provisional');

    const verified = await verifyLightMember(username, password);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(member.id);
  });

  it('registers a new light member with email only', async () => {
    const email = `user_${Date.now()}@example.com`;

    const member = await createLightMember({ email });
    expect(member.email).toBe(email.toLowerCase());
    expect(member.username).toBeUndefined();
    expect(member.registrationStatus).toBe('provisional');

    const verified = await verifyLightMember(email, '');
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(member.id);
  });

  it('normalizes phone numbers and respects registration status', async () => {
    const username = `user_${Date.now()}_phone`;
    const email = `${username}@example.com`;

    const member = await createLightMember({
      username,
      password: 'secret123',
      email,
      phoneNumber: '090-1234-5678',
      registrationStatus: 'full',
    });

    expect(member.phoneNumber).toBe('09012345678');
    expect(member.registrationStatus).toBe('full');
  });

  it('lists registered members', async () => {
    const username = `list_${Date.now()}`;
    await createLightMember({ username, password: 'password1' });
    const members = await listLightMembers();
    expect(members.some((member) => member.username === username)).toBe(true);
    // 既定アカウント（adminuser）は廃止済み＝紛れ込んでいないこと
    expect(members.some((member) => member.username === 'adminuser')).toBe(false);
  });

  it('rejects duplicated usernames', async () => {
    const username = `dup_${Date.now()}`;
    await createLightMember({ username, password: 'password1' });
    await expect(createLightMember({ username, password: 'password2' })).rejects.toThrow(
      '同じユーザー名が既に登録されています'
    );
  });

  it('rejects duplicated emails regardless of casing', async () => {
    const email = `dup_email_${Date.now()}@example.com`;
    await createLightMember({ email });
    await expect(createLightMember({ email: email.toUpperCase() })).rejects.toThrow(
      '同じメールアドレスが既に登録されています'
    );
  });
});
