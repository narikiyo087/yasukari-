import type { NextApiRequest, NextApiResponse } from "next";

import handler from "../../../pages/api/payments/payjp";
import { verifyCognitoIdToken } from "../../../lib/cognitoServer";

jest.mock("../../../lib/cognitoServer", () => ({
  verifyCognitoIdToken: jest.fn(),
  COGNITO_ID_TOKEN_COOKIE: "cognito_id_token",
}));

const originalFetch = global.fetch;

const mockReq = (overrides: Partial<NextApiRequest>) => overrides as NextApiRequest;

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  return res;
};

describe("POST /api/payments/payjp", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.PAYJP_SECRET_KEY = "sk_live_sample";
    process.env.PAYJP_SECRET_KEY_TEST = "sk_test_sample";
  });

  afterEach(() => {
    delete process.env.PAYJP_SECRET_KEY;
    delete process.env.PAYJP_SECRET_KEY_TEST;
    global.fetch = originalFetch;
  });

  it("returns 401 when unauthenticated", async () => {
    (verifyCognitoIdToken as jest.Mock).mockResolvedValue(null);
    const req = mockReq({ method: "POST", cookies: {}, body: {} });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 400 when token or amount is missing", async () => {
    (verifyCognitoIdToken as jest.Mock).mockResolvedValue({ sub: "user" });
    const req = mockReq({ method: "POST", cookies: { cognito_id_token: "token" }, body: { amount: 1000 } });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("creates a Pay.JP charge and returns the charge id", async () => {
    (verifyCognitoIdToken as jest.Mock).mockResolvedValue({ sub: "user" });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "ch_test", amount: 1200, created: 1700000000 }),
    }) as unknown as typeof fetch;

    const req = mockReq({
      method: "POST",
      cookies: { cognito_id_token: "token" },
      body: { token: "tok_test", amount: 1200, description: "Test" },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      chargeId: "ch_test",
      amount: 1200,
      paidAt: new Date(1700000000 * 1000).toISOString(),
    });
    expect(global.fetch).toHaveBeenCalledWith("https://api.pay.jp/v1/charges", {
      method: "POST",
      headers: expect.objectContaining({
        Authorization: "Basic c2tfbGl2ZV9zYW1wbGU6",
      }),
      body: expect.any(String),
    });
  });

  it("uses test key when email is in the test allowlist", async () => {
    (verifyCognitoIdToken as jest.Mock).mockResolvedValue({ sub: "user" });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "ch_test", amount: 1200, created: 1700000000 }),
    }) as unknown as typeof fetch;

    const req = mockReq({
      method: "POST",
      cookies: { cognito_id_token: "token" },
      body: {
        token: "tok_test",
        amount: 1200,
        description: "Test",
        email: "info@yasukaribike.com",
      },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(global.fetch).toHaveBeenCalledWith("https://api.pay.jp/v1/charges", {
      method: "POST",
      headers: expect.objectContaining({
        Authorization: "Basic c2tfdGVzdF9zYW1wbGU6",
      }),
      body: expect.any(String),
    });
  });
});
