import { createHmac, createHash } from "crypto";

import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { getDocumentClient, scanAllItems } from "./dynamodb";
import { fetchReservationsByMember, Reservation } from "./reservations";
import { Member, MemberRegistrationStatus, MemberRole, MemberStatus } from "./members";
import { REQUIRED_REGISTRATION_FIELDS, type RegistrationData } from "../types/registration";

type CognitoUserInfo = {
  id: string;
  username: string;
  enabled?: boolean;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  attributes: Record<string, string>;
};

type CognitoUserRecord = {
  Username?: string;
  UserAttributes?: { Name?: string; Value?: string }[];
  UserCreateDate?: string | number;
  UserLastModifiedDate?: string | number;
  Enabled?: boolean;
  UserStatus?: string;
};

type ListUsersResponse = {
  Users?: CognitoUserRecord[];
  PaginationToken?: string;
};

type AdminGetUserResponse = {
  Username?: string;
  UserAttributes?: { Name?: string; Value?: string }[];
  UserCreateDate?: string | number;
  UserLastModifiedDate?: string | number;
  Enabled?: boolean;
  UserStatus?: string;
};

type MemberDetail = {
  member: Member | null;
  reservations: Reservation[];
};

const USER_TABLE = process.env.USER_TABLE ?? "yasukariUserMain";

const region =
  process.env.COGNITO_REGION ?? process.env.NEXT_PUBLIC_COGNITO_REGION ?? "ap-northeast-1";
const userPoolId =
  process.env.COGNITO_USER_POOL_ID ?? process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "";

if (!userPoolId) {
  throw new Error("COGNITO_USER_POOL_ID is required.");
}

const cognitoEndpoint = `https://cognito-idp.${region}.amazonaws.com/`;

const getAwsCredentials = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? "";
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? "";
  const sessionToken = process.env.AWS_SESSION_TOKEN ?? "";
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials are required to call Cognito.");
  }
  return { accessKeyId, secretAccessKey, sessionToken };
};

const sha256 = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

const hmac = (key: Buffer | string, value: string): Buffer =>
  createHmac("sha256", key).update(value, "utf8").digest();

const signRequest = (options: {
  method: string;
  url: string;
  body: string;
  target: string;
  region: string;
  service: string;
}): { headers: Record<string, string> } => {
  const { method, url, body, target, region, service } = options;
  const { accessKeyId, secretAccessKey, sessionToken } = getAwsCredentials();

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const host = new URL(url).host;
  const contentType = "application/x-amz-json-1.1";
  const payloadHash = sha256(body);

  const headers: Record<string, string> = {
    "content-type": contentType,
    host,
    "x-amz-date": amzDate,
    "x-amz-target": target,
  };
  if (sessionToken) {
    headers["x-amz-security-token"] = sessionToken;
  }

  const signedHeaders = Object.keys(headers)
    .sort()
    .join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((key) => `${key}:${headers[key]}`)
    .join("\n");
  const canonicalRequest = [
    method,
    "/",
    "",
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");

  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  return {
    headers: {
      "Content-Type": contentType,
      "X-Amz-Date": amzDate,
      "X-Amz-Target": target,
      Authorization: authorization,
      ...(sessionToken ? { "X-Amz-Security-Token": sessionToken } : {}),
    },
  };
};

const callCognito = async <T>(target: string, body: Record<string, unknown>): Promise<T> => {
  const payload = JSON.stringify(body);
  const { headers } = signRequest({
    method: "POST",
    url: cognitoEndpoint,
    body: payload,
    target,
    region,
    service: "cognito-idp",
  });

  const response = await fetch(cognitoEndpoint, {
    method: "POST",
    headers,
    body: payload,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to call Cognito (${response.status}): ${message}`);
  }

  return (await response.json()) as T;
};

const toAttributeRecord = (
  attributes: { Name?: string; Value?: string }[] | undefined
): Record<string, string> => {
  const record: Record<string, string> = {};
  for (const attribute of attributes ?? []) {
    if (!attribute?.Name) continue;
    record[attribute.Name] = attribute.Value ?? "";
  }
  return record;
};

const formatDateTime = (value?: Date | string | number): string => {
  if (!value) return "-";
  const date =
    value instanceof Date ? value : typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

const joinTokens = (...values: Array<string | undefined>): string =>
  values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .trim();

const mapRole = (rawRole?: string): MemberRole => {
  if (!rawRole) return "一般";
  const normalized = rawRole.toLowerCase();
  if (normalized.includes("admin") || normalized.includes("管理")) return "管理者";
  if (normalized.includes("view") || normalized.includes("read") || normalized.includes("閲覧")) {
    return "閲覧のみ";
  }
  return "一般";
};

const mapStatus = (user?: CognitoUserInfo): MemberStatus => {
  if (!user) return "未認証";
  if (user.enabled === false) return "退会済み";
  if (user.status === "CONFIRMED") return "認証済";
  return "未認証";
};

const hasAllRequiredRegistrationFields = (registration?: RegistrationData): boolean => {
  if (!registration) return false;
  return REQUIRED_REGISTRATION_FIELDS.every((field) => Boolean(registration[field]));
};

const mapRegistrationStatus = (
  user: CognitoUserInfo | undefined,
  registration: RegistrationData | undefined
): MemberRegistrationStatus => {
  if (!user && !registration) return "メールのみ";
  if (!user && registration) return "仮登録済";
  if (user && !registration) return "管理者追加済";
  return hasAllRequiredRegistrationFields(registration) ? "本登録済" : "仮登録済";
};

const mapInternational = (attributes: Record<string, string>): boolean => {
  const locale = attributes.locale ?? attributes["custom:locale"] ?? "";
  const country = attributes["custom:country"] ?? attributes.country ?? "";
  if (locale) {
    const normalized = locale.toLowerCase();
    if (!(normalized.startsWith("ja") || normalized.startsWith("jp"))) return true;
  }
  if (country && !["jp", "japan", "日本"].includes(country.toLowerCase())) return true;
  return false;
};

const mapMember = (
  user: CognitoUserInfo | undefined,
  registration: RegistrationData | undefined
): Member => {
  const attributes = user?.attributes ?? {};
  const nameFromRegistration = joinTokens(registration?.name1, registration?.name2);
  const kanaFromRegistration = joinTokens(registration?.kana1, registration?.kana2);
  const emailFromUsername =
    user?.username && user.username.includes("@") ? user.username : "";
  const email = registration?.email ?? attributes.email ?? emailFromUsername ?? "";
  const mobilePhone = registration?.mobile ?? attributes.phone_number ?? "";
  const phoneNumber = registration?.tel ?? "";
  const address = joinTokens(registration?.address1, registration?.address2);
  const memberId = registration?.user_id ?? attributes.sub ?? user?.username ?? "";
  const createdAt = user?.createdAt ?? undefined;
  const updatedAt = user?.updatedAt ?? undefined;

  return {
    id: memberId,
    memberNumber: memberId,
    name: nameFromRegistration || attributes.name || email || "(未登録)",
    nameKana: kanaFromRegistration || "-",
    role: mapRole(attributes["custom:role"] ?? attributes.role),
    email: email || "-",
    status: mapStatus(user),
    registrationStatus: mapRegistrationStatus(user, registration),
    isInternational: mapInternational(attributes),
    updatedAt: formatDateTime(updatedAt),
    mobilePhone: mobilePhone || "-",
    phoneNumber: phoneNumber || "-",
    birthDate: registration?.birth ?? "-",
    postalCode: registration?.zip ?? "-",
    address: address || "-",
    licenseNumber: registration?.license ?? "-",
    workplaceName: registration?.work_place ?? "-",
    workplaceAddress: registration?.work_address ?? "-",
    workplacePhone: registration?.work_tel ?? "-",
    otherContactName: registration?.other_name ?? "-",
    otherContactAddress: registration?.other_address ?? "-",
    otherContactPhone: registration?.other_tel ?? "-",
    registeredAt: formatDateTime(createdAt),
    notes: registration?.notes ?? "",
  };
};

const parseDate = (value?: string | number): Date | undefined => {
  if (!value) return undefined;
  const date =
    typeof value === "number" ? new Date(value) : value ? new Date(value) : undefined;
  if (!date || Number.isNaN(date.getTime())) return undefined;
  return date;
};

const mapUserFromList = (user: CognitoUserRecord): CognitoUserInfo => {
  const attributes = toAttributeRecord(user.UserAttributes);
  const id = attributes.sub ?? user.Username ?? "";
  return {
    id,
    username: user.Username ?? id,
    enabled: user.Enabled,
    status: user.UserStatus,
    createdAt: parseDate(user.UserCreateDate),
    updatedAt: parseDate(user.UserLastModifiedDate),
    attributes,
  };
};

const mapUserFromAdmin = (response: AdminGetUserResponse): CognitoUserInfo => {
  const attributes = toAttributeRecord(response.UserAttributes);
  const id = attributes.sub ?? response.Username ?? "";
  return {
    id,
    username: response.Username ?? id,
    enabled: response.Enabled,
    status: response.UserStatus,
    createdAt: parseDate(response.UserCreateDate),
    updatedAt: parseDate(response.UserLastModifiedDate),
    attributes,
  };
};

const fetchCognitoUsers = async (): Promise<CognitoUserInfo[]> => {
  try {
    const users: CognitoUserInfo[] = [];
    let paginationToken: string | undefined;

    do {
      const response = await callCognito<ListUsersResponse>(
        "AWSCognitoIdentityProviderService.ListUsers",
        {
          UserPoolId: userPoolId,
          PaginationToken: paginationToken,
        }
      );

      users.push(...(response.Users ?? []).map(mapUserFromList));
      paginationToken = response.PaginationToken;
    } while (paginationToken);

    return users;
  } catch (error) {
    console.error("Failed to fetch Cognito users", error);
    return [];
  }
};

const fetchRegistrations = async (): Promise<RegistrationData[]> => {
  return scanAllItems<RegistrationData>({ TableName: USER_TABLE });
};

const fetchRegistrationById = async (
  memberId: string
): Promise<RegistrationData | undefined> => {
  const client = getDocumentClient();
  const response = await client.send(
    new GetCommand({
      TableName: USER_TABLE,
      Key: { user_id: memberId },
    })
  );

  return response.Item as RegistrationData | undefined;
};

const fetchCognitoUserById = async (
  memberId: string
): Promise<CognitoUserInfo | undefined> => {
  try {
    const response = await callCognito<AdminGetUserResponse>(
      "AWSCognitoIdentityProviderService.AdminGetUser",
      {
        UserPoolId: userPoolId,
        Username: memberId,
      }
    );
    return mapUserFromAdmin(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("ResourceNotFoundException")) {
      return undefined;
    }
    console.error("Failed to fetch Cognito user by AdminGetUser", error);
  }

  try {
    const response = await callCognito<ListUsersResponse>(
      "AWSCognitoIdentityProviderService.ListUsers",
      {
        UserPoolId: userPoolId,
        Filter: `sub = \"${memberId}\"`,
        Limit: 1,
      }
    );

    const user = response.Users?.[0];
    return user ? mapUserFromList(user) : undefined;
  } catch (error) {
    console.error("Failed to fetch Cognito user by ListUsers", error);
    return undefined;
  }
};

export const fetchMembers = async (): Promise<Member[]> => {
  const [cognitoUsers, registrations] = await Promise.all([
    fetchCognitoUsers(),
    fetchRegistrations(),
  ]);

  const registrationById = new Map(
    registrations.map((registration) => [registration.user_id, registration])
  );
  const cognitoUserById = new Map(cognitoUsers.map((user) => [user.id, user]));
  const registrationsNeedingLookup = registrations.filter(
    (registration) => !cognitoUserById.has(registration.user_id)
  );

  if (registrationsNeedingLookup.length > 0) {
    const fetchedUsers = await Promise.all(
      registrationsNeedingLookup.map((registration) =>
        fetchCognitoUserById(registration.user_id)
      )
    );
    for (const user of fetchedUsers) {
      if (user && !cognitoUserById.has(user.id)) {
        cognitoUserById.set(user.id, user);
      }
    }
  }

  const members = Array.from(cognitoUserById.values()).map((user) =>
    mapMember(user, registrationById.get(user.id))
  );
  const memberIds = new Set(members.map((member) => member.id));

  for (const registration of registrations) {
    if (memberIds.has(registration.user_id)) continue;
    members.push(mapMember(undefined, registration));
  }

  return members.sort((a, b) => (a.updatedAt || "") > (b.updatedAt || "") ? -1 : 1);
};

export const fetchMemberDetail = async (memberId: string): Promise<MemberDetail> => {
  const [cognitoUser, registration, reservations] = await Promise.all([
    fetchCognitoUserById(memberId),
    fetchRegistrationById(memberId),
    fetchReservationsByMember(memberId),
  ]);

  return {
    member: cognitoUser || registration ? mapMember(cognitoUser, registration) : null,
    reservations,
  };
};

export const updateMemberNotes = async (memberId: string, notes: string): Promise<void> => {
  const registration = await fetchRegistrationById(memberId);
  if (!registration) {
    throw new Error("登録情報が見つかりませんでした。");
  }

  const client = getDocumentClient();
  await client.send(
    new UpdateCommand({
      TableName: USER_TABLE,
      Key: { user_id: memberId },
      UpdateExpression: "SET #notes = :notes",
      ExpressionAttributeNames: {
        "#notes": "notes",
      },
      ExpressionAttributeValues: {
        ":notes": notes,
      },
    })
  );
};
