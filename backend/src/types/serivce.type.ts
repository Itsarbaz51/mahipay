export interface CreateServiceProviderInput {
  type: string;
  code: string;
  name?: string | null;
  config?: any;
  isActive?: boolean;
}

export interface UpdateServiceProviderInput {
  type?: string;
  code?: string;
  name?: string | null;
  config?: any;
  isActive?: boolean;
}
