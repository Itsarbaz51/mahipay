import type { User } from "@prisma/client";

export interface LoginLog {
    id: string;
    userId: string;
    user?: Pick<User, "id" | "firstName" | "lastName" | "email">;
    domainName: string;
    ipAddress: string;
    userAgent?: string | null;
    location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    createdAt: Date;
}

export interface LoginLogCreateInput {
    userId: string;
    domainName: string;
    ipAddress: string;
    userAgent?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
}

export interface LoginLogUpdateInput {
    domainName?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    latitude?: number | undefined;
    longitude?: number | undefined;
}

export type LoginLogFilterParams = Partial<{
    page: number;
    limit: number;
    userId: string;
    status: string;
    sort: string;
    startDate: Date;
    endDate: Date;
    search: string;
}>;

export interface LoginLogListResponse {
    data: LoginLog[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface UserLoginLogsParams {
    userId: string;
    limit?: number;
}