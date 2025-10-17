export interface CreateServiceInput {
  name: string;
  code: string;
  description?: string;
  status?: "ACTIVE" | "IN_ACTIVE" | "UNAVAILABLE";
}

export interface UpdateServiceInput {
  name?: string;
  code?: string;
  description?: string;
  status?: "ACTIVE" | "IN_ACTIVE" | "UNAVAILABLE";
}

export interface deactivateInput {
  status?: "ACTIVE" | "IN_ACTIVE" | "UNAVAILABLE";
}

export interface ServiceProviderInput {
  name: string;
  code: string;
  type: string;
  isActive?: boolean;
}

export interface ServiceProviderUpdateInput {
  name?: string | null;
  code?: string | null;
  type?: string | null;
  isActive?: boolean | null;
}

export interface ProviderCredentialInput {
  providerId: string;
  env: "PROD" | "STAGING";
  keyName: string;
  keyVaultRef: string;
  meta?: Record<string, any>;
  isActive?: boolean;
}

export interface ProviderRateCardInput {
  providerId: string;
  serviceId: string;
  rateType: "FLAT" | "PERCENTAGE";
  rateValue: number;
  minAmount?: number;
  maxAmount?: number;
  effectiveFrom?: string; // ISO date string
  effectiveTo?: string; // ISO date string
  status?: "ACTIVE" | "IN_ACTIVE" | "UNAVAILABLE";
}
