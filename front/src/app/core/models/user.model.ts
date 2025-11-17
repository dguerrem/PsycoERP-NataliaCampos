export interface PrincipalClinicInfo {
  id: number;
  name: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  last_login: string;
  license_number?: string;
  irpf?: string;
  iban?: string;
  dni?: string;
  street?: string;
  street_number?: string;
  door?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  principal_clinic_id?: number | null;
  PrincipalClinicInfo?: PrincipalClinicInfo | null;
}

export interface UserProfileResponse {
  data: User;
}

export interface UpdateUserProfileRequest {
  name: string;
  license_number?: string;
  irpf?: string;
  iban?: string;
  dni: string;
  street: string;
  street_number: string;
  door?: string;
  city: string;
  province: string;
  postal_code: string;
  principal_clinic_id?: number | null;
}
