export interface CreateServiceProviderInput {
  type: string;
  code: string;
  isActive?: boolean;
}

export interface UpdateServiceProviderInput {
  type?: string;
  code?: string;
  isActive?: boolean;
}
