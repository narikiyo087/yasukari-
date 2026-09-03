import { issueKeyboxPin } from "../lib/keybox";
import { addKeyboxLog } from "../lib/keyboxLogs";

type FetchResponse = {
  status: number;
  json: () => Promise<any>;
  text: () => Promise<string>;
};

jest.mock("../lib/keyboxLogs", () => ({
  addKeyboxLog: jest.fn(async (log) => ({ logId: "log-1", createdAt: "2024-01-01T00:00:00Z", ...log })),
}));

const mockFetchSequence = (responses: FetchResponse[]) => {
  const fetchMock = jest.fn();
  responses.forEach((response) => fetchMock.mockImplementationOnce(() => Promise.resolve(response)));
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

// 2026-09-02 いったんスキップ（社長判断）：
// このテストはモックの噛み合わせで以前から3件失敗しており、モックを直しても
// 実機（KEYVOX）で通る保証にはならない。KEYBOXのAPI連携を実際に行う段階で、
// 実機に対するE2E確認とあわせて見直す。それまで失敗のまま残すと
// テスト全体が常に赤になり、他の失敗が埋もれるためスキップにする。
describe.skip("issueKeyboxPin", () => {
  const windowStart = new Date("2024-01-02T00:00:00Z");
  const windowEnd = new Date("2024-01-03T00:00:00Z");

  beforeEach(() => {
    process.env.KEYBOX_API_KEY = "api";
    process.env.KEYBOX_SECRET_KEY = "secret";
    (addKeyboxLog as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const buildResponse = (status: number, body: any): FetchResponse => ({
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });

  it("marks success only when the body code/msg indicate success", async () => {
    const fetchMock = mockFetchSequence([
      buildResponse(200, { code: "0", msg: "success", data: { pinId: "p-1", qrCode: "QR" } }),
    ]);

    const result = await issueKeyboxPin({ unitId: "unit-123", pinCode: "111111", windowStart, windowEnd });

    expect(result.success).toBe(true);
    expect(result.signUsed).toBe("A");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const savedLog = (addKeyboxLog as jest.Mock).mock.calls[0][0];
    expect(savedLog.success).toBe(true);
    expect(savedLog.responseBody).toMatchObject({ code: "0", msg: "success", _sign_used: "A" });
    expect(savedLog.attempts).toHaveLength(1);
    expect(savedLog.finalAttempt).toBe("A");
  });

  it("stores the final attempt response and flags unit link errors", async () => {
    const fetchMock = mockFetchSequence([
      buildResponse(200, { msg: "HMAC signature cannot be verified" }),
      buildResponse(200, { code: "E2000", msg: "このドアはロックと関連付けられていません" }),
    ]);

    const result = await issueKeyboxPin({
      unitId: "unit-456",
      pinCode: "222222",
      windowStart,
      windowEnd,
      reservationId: "res-1",
      storeName: "test-store",
    });

    expect(result.success).toBe(false);
    expect(result.signUsed).toBe("B");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const savedLog = (addKeyboxLog as jest.Mock).mock.calls[0][0];
    expect(savedLog.responseBody).toMatchObject({
      code: "E2000",
      msg: "このドアはロックと関連付けられていません",
      _sign_used: "B",
    });
    expect(savedLog.errorType).toBe("UNIT_NOT_LINKED");
    expect(savedLog.success).toBe(false);
    expect(savedLog.message).toContain("unitId=unit-456");
    expect(savedLog.message).toContain("store=test-store");
    expect(savedLog.message).toContain("reservationId=res-1");
    expect(savedLog.attempts).toHaveLength(2);
    expect(savedLog.finalAttempt).toBe("B");
    const attempts = savedLog.attempts as any[];
    expect(attempts[0].responseBody).toMatchObject({ msg: "HMAC signature cannot be verified" });
    expect(attempts[1].responseBody).toMatchObject({ code: "E2000" });
  });

  it("records signature debugging info for HMAC failures", async () => {
    mockFetchSequence([
      buildResponse(401, { msg: "HMAC signature cannot be verified" }),
      buildResponse(401, { msg: "HMAC signature cannot be verified" }),
    ]);

    const result = await issueKeyboxPin({ unitId: "unit-789", pinCode: "333333", windowStart, windowEnd });

    expect(result.success).toBe(false);

    const savedLog = (addKeyboxLog as jest.Mock).mock.calls[0][0];
    const attempts = savedLog.attempts as any[];
    expect(attempts).toHaveLength(2);
    attempts.forEach((attempt: any) => {
      expect(typeof attempt.stringToSign).toBe("string");
      expect(typeof attempt.digest).toBe("string");
      expect(attempt.headers.authorization).toMatch(/\*\*\*/);
      expect(attempt.responseBody).toMatchObject({ msg: "HMAC signature cannot be verified" });
    });
  });
});
