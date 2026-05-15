export type RegistrationData = {
  user_id: string;
  email: string;
  name1: string;
  name2: string;
  kana1: string;
  kana2: string;
  sex: string;
  birth: string;
  zip: string;
  address1: string;
  address2: string;
  mobile?: string;
  tel?: string;
  license?: string;
  license_file_name?: string;
  license_image_url?: string;
  license_uploaded_at?: string;
  license_file_name_2?: string;
  license_image_url_2?: string;
  license_uploaded_at_2?: string;
  work_place?: string;
  work_address?: string;
  work_tel?: string;
  other_name?: string;
  other_address?: string;
  other_tel?: string;
  enquete_purpose: string;
  enquete_want: string;
  enquete_touring: string;
  enquete_magazine: string;
  enquete_chance: string;
  accident_report_url?: string;
  accident_report_uploaded_at?: string;
  accident_report_description?: string;
  return_report_url?: string;
  return_report_uploaded_at?: string;
  rental_terms_agreed_at?: string;
  notes?: string;
  is_blacklisted?: boolean;
};

export const REQUIRED_REGISTRATION_FIELDS: (keyof RegistrationData)[] = [
  'user_id',
  'email',
  'name1',
  'name2',
  'kana1',
  'kana2',
  'sex',
  'birth',
  'zip',
  'address1',
  'address2',
  'license_file_name',
  'license_image_url',
  'enquete_purpose',
  'enquete_want',
  'enquete_touring',
  'enquete_magazine',
  'enquete_chance',
];
