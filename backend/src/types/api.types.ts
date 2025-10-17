
export interface ApiKeyCreateInput {
  userId: string;
  label?: string;
  expiresAt?: Date | string;
}

export interface ApiKey {
  id: string;
  userId: string;
  key: string;
  secret: string;
  label?: string;
  isActive: boolean;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  services?: ApiKeyService[];
  ipWhitelists?: ApiKeyIpWhitelist[];
}

export interface ApiKeyServiceCreateInput {
  apiKeyId: string;
  serviceId: string;
  rateLimit?: number;
  callbackUrl?: string;
}

export interface ApiKeyService {
  id: string;
  apiKeyId: string;
  serviceId: string;
  rateLimit?: number | null;
  callbackUrl?: string | null;
}

export interface ApiKeyIpWhitelistCreateInput {
  apiKeyId: string;
  ip: string;
  note?: string;
}

export interface ApiKeyIpWhitelist {
  id: string;
  apiKeyId: string;
  ip: string;
  note?: string | null;
  createdAt: Date;
}

export interface ApiKeyFilterParams {
  userId: string;
  isActive?: boolean;
  page: number;
  limit: number;
  sort?: "asc" | "desc";
}
