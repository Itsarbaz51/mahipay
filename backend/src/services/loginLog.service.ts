import Prisma from "../db/db.js";
import type {
    LoginLogCreateInput,
    LoginLogUpdateInput,
    LoginLogFilterParams,
    LoginLogListResponse,
    UserLoginLogsParams,
} from "../types/loginLog.types.js";
import { clearPattern, getCacheWithPrefix, setCacheWithPrefix } from "../utils/redisCasheHelper.js";

export class LoginLogService {
    async getAllLoginLogs(payload: LoginLogFilterParams): Promise<LoginLogListResponse> {
        const { page = 1, limit = 10, userId, startDate, endDate, search } = payload;
        const skip = (page - 1) * limit;

        const cacheKey = `loginLogs:list:${userId || "all"}:${page}:${limit}:${startDate || ""}:${endDate || ""}:${search || ""}`;
        const cached = await getCacheWithPrefix<LoginLogListResponse>("loginLogs", cacheKey);
        if (cached) return cached;

        const where: any = {};

        if (userId) where.userId = userId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }
        if (search) {
            where.OR = [
                { domainName: { contains: search } },
                { ipAddress: { contains: search } },
                { location: { contains: search } },
                {
                    user: {
                        OR: [
                            { firstName: { contains: search } },
                            { lastName: { contains: search } },
                            { email: { contains: search } }
                        ]
                    }
                }
            ];
        }

        // Fetch logs and total count in parallel
        const [loginLogs, total] = await Promise.all([
            Prisma.loginLogs.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit
            }),
            Prisma.loginLogs.count({ where })
        ]);

        const totalPages = Math.ceil(total / limit);
        const result: LoginLogListResponse = {
            data: loginLogs,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };

        await setCacheWithPrefix("loginLogs", cacheKey, result, 120);

        return result;
    }

    async getLoginLogById(id: string) {
        const cacheKey = `loginLogs:getById:${id}`;
        const cached = await getCacheWithPrefix<any>("loginLogs", `getById:${id}`);
        if (cached) return cached;

        const log = await Prisma.loginLogs.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        if (log) await setCacheWithPrefix("loginLogs", `getById:${id}`, log, 180);
        return log;
    }

    async createLoginLog(payload: LoginLogCreateInput) {
        const created = await Prisma.loginLogs.create({
            data: payload,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        await clearPattern("loginLogs:list:*");
        await clearPattern(`loginLogs:getById:*`);

        return created;
    }

    async deleteLoginLog(id: string) {
        const deleted = await Prisma.loginLogs.delete({ where: { id } });

        await clearPattern("loginLogs:list:*");
        await clearPattern(`loginLogs:getById:${id}`);

        return deleted;
    }
}

export default LoginLogService;
