export type MemberStatus = "認証済" | "未認証" | "退会済み";

export type MemberRegistrationStatus =
  | "メールのみ"
  | "管理者追加済"
  | "仮登録済"
  | "本登録済";

export type MemberRole = "一般" | "管理者" | "閲覧のみ";

export type Member = {
  id: string;
  memberNumber: string;
  name: string;
  nameKana: string;
  role: MemberRole;
  email: string;
  status: MemberStatus;
  registrationStatus: MemberRegistrationStatus;
  isInternational: boolean;
  updatedAt: string;
  mobilePhone: string;
  phoneNumber: string;
  birthDate: string;
  postalCode: string;
  address: string;
  licenseNumber: string;
  workplaceName: string;
  workplaceAddress: string;
  workplacePhone: string;
  otherContactName: string;
  otherContactAddress: string;
  otherContactPhone: string;
  registeredAt: string;
  notes: string;
  isBlacklisted: boolean;
};
